import { ref, onMounted, onUpdated } from 'vue';
import { store, BADGES_DICT } from '../store.js';
import { updateUserProfile } from '../db.js';
import { showToast } from '../app.js';
import { t } from '../i18n.js';

export default {
    setup() {
        const stats = ref(null);

        onMounted(() => {
            stats.value = store.getStudyStats() || { streak: 0, todayWords: 0, history: [] };
            setTimeout(() => { 
                initDNARadar(); 
                if (window.lucide) window.lucide.createIcons();
            }, 500);
        });

        onUpdated(() => {
            if (window.lucide) window.lucide.createIcons();
        });

        const initDNARadar = () => {
            const dna = store.userProfile?.vocabulary_dna || {};
            const domains = ['Academic', 'Business', 'Tech', 'Daily', 'Science', 'Arts'];
            const dataPoints = domains.map(d => dna[d] || 0);

            const ctx = document.getElementById('dnaChart');
            if (ctx && window.Chart) {
                new window.Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: domains,
                        datasets: [{
                            label: 'Domain Strength',
                            data: dataPoints,
                            backgroundColor: 'rgba(109, 85, 209, 0.2)',
                            borderColor: 'rgba(109, 85, 209, 1)',
                            pointBackgroundColor: 'rgba(109, 85, 209, 1)',
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: 'rgba(109, 85, 209, 1)'
                        }]
                    },
                    options: {
                        scales: {
                            r: {
                                beginAtZero: true,
                                max: 100,
                                ticks: { display: false }
                            }
                        },
                        plugins: { legend: { display: false } }
                    }
                });
            }
        };

        const goBack = () => {
            store.navigate('dashboard');
        };

        const triggerAvatarUpload = () => {
            document.getElementById('avatar-upload-input').click();
        };

        const handleAvatarUpload = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = async () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 128;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    
                    store.userProfile.avatar = dataUrl;
                    await updateUserProfile(store.user.uid, { avatar: dataUrl });
                    showToast('Đã cập nhật Avatar!', 'success');
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        };

        const getBadgeClasses = (badge) => {
            const isUnlocked = store.userProfile?.badges?.includes(badge.id);
            const isEquipped = store.userProfile?.equippedBadge === badge.id;
            let classes = ['w-12', 'h-12', 'rounded-full', 'flex', 'items-center', 'justify-center', 'shadow-sm', 'transition-all', 'duration-300'];
            
            if (!isUnlocked) {
                classes.push('bg-gray-100', 'text-gray-400', 'grayscale', 'opacity-40');
            } else {
                classes.push('group-hover:scale-110');
                if (badge.rarity === 'mythic') {
                    classes.push('bg-fuchsia-50', 'text-fuchsia-500', 'border', 'border-fuchsia-400', 'shadow-[0_0_15px_rgba(217,70,239,0.5)]', 'animate-pulse-rainbow');
                } else if (badge.rarity === 'legendary') {
                    classes.push('bg-yellow-50', 'text-yellow-600', 'border', 'border-yellow-400', 'shadow-[0_0_15px_rgba(255,215,0,0.6)]');
                } else {
                    classes.push('bg-amber-50', 'text-amber-500');
                }
            }
            
            if (isEquipped) {
                classes.push('ring-4', 'ring-offset-2');
                if (badge.rarity === 'mythic') classes.push('ring-fuchsia-400');
                else if (badge.rarity === 'legendary') classes.push('ring-yellow-400');
                else classes.push('ring-amber-400');
            }
            return classes.join(' ');
        };

        return { store, BADGES_DICT, stats, goBack, t, triggerAvatarUpload, handleAvatarUpload, getBadgeClasses };
    },
    template: `
        <div class="h-full flex flex-col max-w-5xl mx-auto w-full p-4 lg:p-8 animate-fade-in pb-24">
            
            <!-- Header -->
            <div class="flex items-center gap-4 mb-8">
                <button @click="goBack" class="w-10 h-10 flex items-center justify-center rounded-2xl bg-white shadow-sm hover:bg-purple-50 transition text-gray-500 hover:text-purple-600">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <div>
                    <h1 class="text-2xl font-black text-gray-900 tracking-tight">Hồ sơ của bạn</h1>
                    <p class="text-sm text-gray-500 font-medium mt-1">Thông tin tài khoản, Huy hiệu và DNA Từ vựng</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Cột trái: Thông tin tài khoản -->
                <div class="lg:col-span-1 space-y-6">
                    <div class="glass-panel p-8 rounded-3xl text-center relative overflow-hidden">
                        <div class="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-purple-500 to-indigo-600 opacity-20"></div>
                        
                        <div class="relative w-28 h-28 mx-auto mb-4">
                            <div @click="triggerAvatarUpload" class="group w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center text-4xl font-black text-white cursor-pointer relative" 
                                 style="background: linear-gradient(135deg, #6d55d1, #8b5cf6);">
                                <img v-if="store.userProfile?.avatar" :src="store.userProfile.avatar" class="w-full h-full object-cover">
                                <span v-else>{{ store.user?.email ? store.user.email.charAt(0).toUpperCase() : 'U' }}</span>
                                <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i class="fa-solid fa-camera text-white text-2xl"></i>
                                </div>
                            </div>
                            <input type="file" id="avatar-upload-input" accept="image/*" class="hidden" @change="handleAvatarUpload">
                            <!-- Rank Badge -->
                            <div v-if="store.userProfile?.rank" class="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-full border-2 border-white shadow-sm flex items-center gap-1 whitespace-nowrap">
                                <i class="fa-solid fa-gem text-blue-400"></i> {{ store.userProfile.rank }}
                            </div>
                        </div>

                        <h2 class="text-xl font-bold text-gray-900 mb-1">Cấp độ {{ store.userProfile?.level || 1 }}</h2>
                        <p class="text-sm text-gray-500 font-medium mb-6">Tham gia: {{ new Date(store.userProfile?.createdAt?.toDate ? store.userProfile.createdAt.toDate() : Date.now()).toLocaleDateString('vi-VN') }}</p>

                        <div class="grid grid-cols-2 gap-3 mb-6">
                            <div class="p-4 rounded-2xl" style="background: rgba(109,85,209,0.05);">
                                <div class="text-xl font-black" style="color: #6d55d1;">{{ stats?.streak || 0 }}</div>
                                <div class="text-xs text-gray-500 font-medium mt-1">Ngày liên tiếp (Streak)</div>
                            </div>
                            <div class="p-4 rounded-2xl" style="background: rgba(245,158,11,0.05);">
                                <div class="text-xl font-black text-amber-500">{{ store.userProfile?.totalLexiCredit || 0 }}</div>
                                <div class="text-xs text-gray-500 font-medium mt-1">Tổng LexiCredit</div>
                            </div>
                        </div>
                    </div>

                    <!-- AI Learning Persona Profile -->
                    <div class="glass-panel p-8 rounded-3xl relative overflow-hidden">
                        <div class="flex items-center gap-2 mb-4">
                            <i class="fa-solid fa-brain text-purple-500 text-xl"></i>
                            <h3 class="font-bold text-gray-900 uppercase tracking-wider text-sm">AI Learning Persona</h3>
                        </div>
                        
                        <div class="mb-6">
                            <div class="flex justify-between text-xs mb-1 font-bold" :class="(store.userProfile?.learning_persona?.confidence || 0) < 15 ? 'text-amber-500' : 'text-emerald-500'">
                                <span>Độ tin cậy AI (Confidence)</span>
                                <span>{{ Math.round(store.userProfile?.learning_persona?.confidence || 0) }}%</span>
                            </div>
                            <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div class="h-2 rounded-full transition-all duration-1000" 
                                     :class="(store.userProfile?.learning_persona?.confidence || 0) < 15 ? 'bg-amber-400' : 'bg-emerald-400'"
                                     :style="'width: ' + (store.userProfile?.learning_persona?.confidence || 0) + '%'"></div>
                            </div>
                            <p v-if="(store.userProfile?.learning_persona?.confidence || 0) < 15" class="text-[10px] text-gray-400 mt-2 font-medium italic">
                                * AI đang phân tích dữ liệu học tập của bạn...
                            </p>
                        </div>

                        <div class="space-y-4">
                            <!-- Consistency -->
                            <div>
                                <div class="flex justify-between text-xs font-bold text-gray-600 mb-1">
                                    <span>Tính kiên định (Consistency)</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-2">
                                    <div class="bg-blue-500 h-2 rounded-full transition-all" :style="'width: ' + (store.userProfile?.learning_persona?.consistency || 0) + '%'"></div>
                                </div>
                            </div>
                            
                            <!-- Focus -->
                            <div>
                                <div class="flex justify-between text-xs font-bold text-gray-600 mb-1">
                                    <span>Độ tập trung (Focus)</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-2">
                                    <div class="bg-indigo-500 h-2 rounded-full transition-all" :style="'width: ' + (store.userProfile?.learning_persona?.focus || 0) + '%'"></div>
                                </div>
                            </div>
                            
                            <!-- Persistence -->
                            <div>
                                <div class="flex justify-between text-xs font-bold text-gray-600 mb-1">
                                    <span>Sự bền bỉ sau lỗi sai (Persistence)</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-2">
                                    <div class="bg-rose-500 h-2 rounded-full transition-all" :style="'width: ' + (store.userProfile?.learning_persona?.persistence || 0) + '%'"></div>
                                </div>
                            </div>

                            <!-- Metacognition -->
                            <div>
                                <div class="flex justify-between text-xs font-bold text-gray-600 mb-1">
                                    <span>Tự nhận thức (Metacognition)</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-2">
                                    <div class="bg-purple-500 h-2 rounded-full transition-all" :style="'width: ' + (store.userProfile?.learning_persona?.metacognition || 0) + '%'"></div>
                                </div>
                            </div>

                            <!-- Exploration -->
                            <div>
                                <div class="flex justify-between text-xs font-bold text-gray-600 mb-1">
                                    <span>Khám phá thẻ mới (Exploration)</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-2">
                                    <div class="bg-teal-500 h-2 rounded-full transition-all" :style="'width: ' + (store.userProfile?.learning_persona?.exploration || 0) + '%'"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Cột phải: DNA & Huy hiệu -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Vocabulary DNA Profile -->
                    <div class="glass-panel-strong p-6 rounded-3xl">
                        <h3 class="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                            <i class="fa-solid fa-dna text-purple-500"></i> Vocabulary DNA
                        </h3>
                        <p class="text-xs text-gray-500 mb-6">Hồ sơ năng lực từ vựng đa chiều được AI phân tích từ thói quen học tập của bạn.</p>
                        <div class="relative w-full max-w-[320px] mx-auto aspect-square">
                            <canvas id="dnaChart"></canvas>
                        </div>
                    </div>

                    <!-- Trophy Room -->
                    <div class="glass-panel-strong p-6 rounded-3xl">
                        <h3 class="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                            <i class="fa-solid fa-trophy text-yellow-500"></i> Phòng Truyền Thống
                        </h3>
                        <p class="text-xs text-gray-500 mb-6">Bộ sưu tập huy hiệu thành tích của bạn. Hãy nhấn vào huy hiệu để trang bị.</p>
                        
                        <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                            <div v-for="badge in BADGES_DICT" :key="badge.id" 
                                 class="flex flex-col items-center gap-1 group relative cursor-pointer"
                                 @click="store.equipBadge(badge.id)">
                                
                                <div :class="getBadgeClasses(badge)">
                                    <i v-if="badge.icon.length > 3" :data-lucide="badge.icon" class="w-6 h-6"></i>
                                    <span v-else>{{ badge.icon }}</span>
                                </div>
                                
                                <!-- Custom Tooltip -->
                                <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-gray-900 text-white text-xs rounded-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-20 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
                                    <p class="font-bold mb-1 text-amber-400">{{ badge.title }}</p>
                                    <p class="text-gray-300 leading-tight mb-2">{{ badge.desc }}</p>
                                    
                                    <div v-if="!store.userProfile?.badges?.includes(badge.id)" class="text-gray-500 font-bold text-[10px] uppercase">
                                        <i class="fa-solid fa-lock mr-1"></i> Chưa mở khóa
                                    </div>
                                    <div v-else-if="store.userProfile?.equippedBadge === badge.id" class="text-green-400 font-bold text-[10px] uppercase">
                                        <i class="fa-solid fa-check mr-1"></i> Đang trang bị (Click gỡ)
                                    </div>
                                    <div v-else class="text-amber-400 font-bold text-[10px] uppercase">
                                        <i class="fa-solid fa-hand-pointer mr-1"></i> Click để trang bị
                                    </div>
                                    
                                    <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};
