import { ref, onMounted, onUpdated } from 'vue';
import { store, BADGES_DICT } from '../store.js';
import { updateUserProfile } from '../db.js';
import { showToast } from '../toast.js';
import { t } from '../i18n.js';
import { getRankFromLevel, getLevelProgressInfo } from '../ranks.js';
import { computed } from 'vue';

export default {
    setup() {
        const stats = ref(null);
        const geminiApiKey = ref(localStorage.getItem('gemini_api_key') || '');
        
        const saveApiKey = () => {
            if (geminiApiKey.value.trim()) {
                localStorage.setItem('gemini_api_key', geminiApiKey.value.trim());
                showToast("Đã lưu API Key thành công!", "success");
            } else {
                localStorage.removeItem('gemini_api_key');
                showToast("Đã xóa API Key.", "success");
            }
        };
        
        const currentLevelInfo = computed(() => getLevelProgressInfo(store.userProfile?.totalLexiCredit || 0));
        const currentRank = computed(() => getRankFromLevel(currentLevelInfo.value.currentLevel));

        onMounted(() => {
            stats.value = store.getStudyStats() || { streak: 0, todayWords: 0, history: [] };
            setTimeout(() => { 
                if (window.lucide) window.lucide.createIcons();
            }, 300);
        });

        onUpdated(() => {
            if (window.lucide) window.lucide.createIcons();
        });

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

        const visibleBadges = computed(() => getVisibleBadges(store.userProfile));

        const getBadgeTitle = (id) => {
            const b = getBadgeById(id);
            return b ? b.title : '';
        };

        const getBadgeIcon = (id) => {
            const b = getBadgeById(id);
            return b ? (b.emoji || b.icon || '🏆') : '🏆';
        };

        const getBadge3D = (id) => {
            const b = getBadgeById(id);
            return b ? b.image3d : '';
        };

        const equippedBadgeObj = computed(() => {
            if (!store.userProfile?.equippedBadge) return null;
            return getBadgeById(store.userProfile.equippedBadge);
        });

        const getBadgeClasses = (badge) => {
            const isUnlocked = store.userProfile?.badges?.includes(badge.id);
            const isEquipped = store.userProfile?.equippedBadge === badge.id;
            let classes = ['w-12', 'h-12', 'rounded-full', 'flex', 'items-center', 'justify-center', 'shadow-sm', 'transition-all', 'duration-300', 'relative'];
            
            if (!isUnlocked) {
                classes.push('bg-gray-100 dark:bg-gray-800', 'text-gray-400', 'grayscale', 'opacity-40');
            } else {
                classes.push('group-hover:scale-110');
                if (badge.rarity === 'mythic' || badge.isExclusive) {
                    classes.push('bg-fuchsia-50 dark:bg-fuchsia-950/40', 'text-fuchsia-500', 'border', 'border-fuchsia-400', 'shadow-[0_0_15px_rgba(217,70,239,0.5)]', 'animate-pulse-rainbow');
                } else if (badge.rarity === 'legendary') {
                    classes.push('bg-yellow-50 dark:bg-yellow-950/40', 'text-yellow-600 dark:text-yellow-400', 'border', 'border-yellow-400', 'shadow-[0_0_15px_rgba(255,215,0,0.6)]');
                } else {
                    classes.push('bg-amber-50 dark:bg-amber-950/40', 'text-amber-500');
                }
            }
            
            if (isEquipped) {
                classes.push('ring-4', 'ring-offset-2');
                if (badge.rarity === 'mythic' || badge.isExclusive) classes.push('ring-fuchsia-400');
                else if (badge.rarity === 'legendary') classes.push('ring-yellow-400');
                else classes.push('ring-amber-400');
            }
            return classes.join(' ');
        };

        return { 
            store, stats, BADGES_DICT, visibleBadges,
            handleAvatarUpload, triggerAvatarUpload, currentLevelInfo, currentRank,
            geminiApiKey, saveApiKey, goBack, t, getBadgeClasses,
            getBadgeTitle, getBadgeIcon, getBadge3D, equippedBadgeObj
        };
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
                    <p class="text-sm text-gray-500 font-medium mt-1">Thông tin tài khoản, Cấp bậc và Phòng truyền thống Huy hiệu</p>
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
                                <img v-else :src="'https://api.dicebear.com/7.x/notionists/svg?seed=' + (store.user?.email || 'user') + '&backgroundColor=transparent'" class="w-full h-full object-cover">
                                <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i class="fa-solid fa-camera text-white text-2xl"></i>
                                </div>
                            </div>
                            <input type="file" id="avatar-upload-input" accept="image/*" class="hidden" @change="handleAvatarUpload">
                            
                            <!-- Equipped Badge on Avatar -->
                            <div v-if="store.userProfile?.equippedBadge" 
                                 class="absolute -bottom-1 -right-1 bg-white rounded-full shadow-lg w-8 h-8 flex items-center justify-center border-2 border-amber-400 p-0.5 z-10 animate-bounce-short select-none cursor-pointer"
                                 :title="'Huy hiệu đang trang bị: ' + getBadgeTitle(store.userProfile.equippedBadge)"
                                 @click.stop="store.equipBadge(store.userProfile.equippedBadge)">
                                <img v-if="getBadge3D(store.userProfile.equippedBadge)" :src="getBadge3D(store.userProfile.equippedBadge)" class="w-full h-full object-contain drop-shadow-sm">
                                <span v-else>{{ getBadgeIcon(store.userProfile.equippedBadge) }}</span>
                            </div>

                            <!-- Rank Badge -->
                            <div v-if="currentRank" class="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1 rounded-full border-2 border-white shadow-md flex items-center gap-1.5 whitespace-nowrap z-10">
                                <img v-if="currentRank.image3d" :src="currentRank.image3d" class="w-3.5 h-3.5 object-contain">
                                <i v-else :data-lucide="currentRank.icon" :class="[currentRank.color, 'w-3 h-3']"></i>
                                <span>{{ currentRank.title }}</span>
                            </div>
                        </div>

                        <h2 class="text-xl font-bold text-gray-900 mb-1">Cấp độ {{ currentLevelInfo.currentLevel }}</h2>
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

                    <!-- API Key Settings -->
                    <div class="glass-panel p-8 rounded-3xl relative overflow-hidden">
                        <div class="flex items-center gap-2 mb-4">
                            <i class="fa-solid fa-key text-amber-500 text-xl"></i>
                            <h3 class="font-bold text-gray-900 uppercase tracking-wider text-sm">Cấu hình AI (Gemini API)</h3>
                        </div>
                        <p class="text-xs text-gray-500 mb-4 font-medium leading-relaxed">
                            Nhập Google Gemini API Key của bạn để sử dụng các tính năng AI (chữa bài, tạo flashcard, coach). Hệ thống chỉ lưu trên trình duyệt của bạn (Local Storage).
                        </p>
                        <div class="flex flex-col gap-2">
                            <input type="password" v-model="geminiApiKey" placeholder="AIzaSy..." class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm bg-gray-50">
                            <button @click="saveApiKey" class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-sm">
                                Lưu API Key
                            </button>
                        </div>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-[10px] text-indigo-500 hover:underline mt-4 inline-block font-medium">
                            <i class="fa-solid fa-external-link-alt mr-1"></i> Lấy API Key miễn phí tại Google AI Studio
                        </a>
                    </div>
                </div>

                <!-- Cột phải: Phòng Truyền Thống Huy Hiệu -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Trophy Room -->
                    <div class="glass-panel-strong p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-sm">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-extrabold text-gray-900 dark:text-white text-base uppercase tracking-wider flex items-center gap-2">
                                <i class="fa-solid fa-trophy text-amber-500"></i> Phòng Truyền Thống
                            </h3>
                            <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                {{ (store.userProfile?.badges || []).length }} / {{ visibleBadges.length }} Huy hiệu
                            </span>
                        </div>
                        <!-- Current Equipped Badge Showcase -->
                        <div v-if="equippedBadgeObj" class="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-300/60 flex items-center justify-between gap-4">
                            <div class="flex items-center gap-3">
                                <div class="w-14 h-14 rounded-2xl bg-white dark:bg-[#151D30] shadow-md border border-amber-300 flex items-center justify-center p-2 relative shrink-0">
                                    <img v-if="equippedBadgeObj.image3d" :src="equippedBadgeObj.image3d" class="w-full h-full object-contain filter drop-shadow-md">
                                    <span v-else class="text-3xl select-none">{{ equippedBadgeObj.emoji || equippedBadgeObj.icon }}</span>
                                </div>
                                <div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full uppercase tracking-wider">Đang Trang Bị</span>
                                        <h4 class="text-sm font-extrabold text-gray-900 dark:text-white">{{ equippedBadgeObj.title }}</h4>
                                    </div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ equippedBadgeObj.desc }}</p>
                                </div>
                            </div>
                            <button @click="store.equipBadge(equippedBadgeObj.id)" class="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E293B] hover:bg-rose-50 dark:hover:bg-rose-950/50 text-gray-600 dark:text-gray-300 hover:text-rose-600 border border-gray-200 dark:border-[#222F49] text-xs font-bold transition-all shrink-0">
                                <i class="fa-solid fa-xmark mr-1"></i> Gỡ huy hiệu
                            </button>
                        </div>
                        
                        <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                            <div v-for="badge in visibleBadges" :key="badge.id" 
                                 class="flex flex-col items-center gap-1 group relative cursor-pointer"
                                 @click="store.equipBadge(badge.id)">
                                
                                <div :class="getBadgeClasses(badge)" class="p-2 flex items-center justify-center relative select-none">
                                    <img v-if="badge.image3d" 
                                         :src="badge.image3d" 
                                         :alt="badge.title" 
                                         class="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-115"
                                         :class="!store.userProfile?.badges?.includes(badge.id) ? 'filter grayscale opacity-30 contrast-75 brightness-90' : 'filter drop-shadow-md'">
                                    <span v-else class="text-2xl leading-none group-hover:scale-110 transition-transform select-none drop-shadow-sm">{{ badge.emoji || badge.icon }}</span>
                                    
                                    <!-- Equipped Checkmark -->
                                    <div v-if="store.userProfile?.equippedBadge === badge.id" class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-black border-2 border-white shadow-sm z-10">
                                        <i class="fa-solid fa-check"></i>
                                    </div>
                                </div>
                                
                                <!-- Custom Tooltip -->
                                <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-gray-900 text-white text-xs rounded-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-30 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
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
            
            <style>
                img + .only-fallback { display: none; }
                img[style*="display: none"] + .only-fallback,
                img[style*="display:none"] + .only-fallback { display: inline-block !important; }
            </style>
        </div>
    `
};
