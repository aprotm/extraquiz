import { ref, onMounted, onUpdated } from 'vue';
import { store, BADGES_DICT, getVisibleBadges, getBadgeById } from '../store.js';
import { updateUserProfile } from '../db.js';
import { showToast } from '../toast.js';
import { t } from '../i18n.js';
import { getRankFromLevel, getLevelProgressInfo } from '../ranks.js';
import { computed } from 'vue';

export default {
    setup() {
        const stats = ref(null);
        const geminiApiKey = ref(localStorage.getItem('gemini_api_key') || store.userProfile?.geminiApiKey || '');
        
        const parsedKeyCount = computed(() => {
            const raw = geminiApiKey.value || '';
            return raw.split(/[\n,;]+/).map(k => k.trim()).filter(k => k.length > 5).length;
        });

        const saveApiKey = async () => {
            const keyVal = geminiApiKey.value.trim();
            if (keyVal) {
                localStorage.setItem('gemini_api_key', keyVal);
                if (store.userProfile) store.userProfile.geminiApiKey = keyVal;
                if (store.user?.uid) {
                    await updateUserProfile(store.user.uid, { geminiApiKey: keyVal });
                }
                const count = parsedKeyCount.value;
                if (count > 1) {
                    showToast(`Đã kích hoạt Multi-Key Pool với ${count} API Keys và lưu trực tiếp vào tài khoản!`, "success");
                } else {
                    showToast("Đã lưu API Key thành công vào tài khoản của bạn!", "success");
                }
            } else {
                localStorage.removeItem('gemini_api_key');
                if (store.userProfile) store.userProfile.geminiApiKey = '';
                if (store.user?.uid) {
                    await updateUserProfile(store.user.uid, { geminiApiKey: '' });
                }
                showToast("Đã xóa API Key khỏi tài khoản.", "success");
            }
        };
        
        const isEditingName = ref(false);
        const editNameInput = ref('');

        const startEditName = () => {
            editNameInput.value = store.userProfile?.displayName || store.user?.email?.split('@')[0] || '';
            isEditingName.value = true;
        };

        const saveDisplayName = async () => {
            const name = editNameInput.value.trim();
            if (!name) {
                showToast("Vui lòng nhập tên hiển thị hợp lệ!", "error");
                return;
            }
            if (!store.userProfile) store.userProfile = {};
            store.userProfile.displayName = name;
            if (store.user?.uid) {
                await updateUserProfile(store.user.uid, { displayName: name });
            }
            isEditingName.value = false;
            showToast("Đã cập nhật Tên hiển thị!", "success");
        };

        const currentLevelInfo = computed(() => {
            const totalLC = Math.max(store.userProfile?.totalLexiCredit || 0, store.userProfile?.lexiCredit || 0, ((store.userProfile?.level || 1) - 1) * 50);
            return getLevelProgressInfo(totalLC);
        });
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
            geminiApiKey, parsedKeyCount, saveApiKey, goBack, t, getBadgeClasses,
            getBadgeTitle, getBadgeIcon, getBadge3D, equippedBadgeObj,
            isEditingName, editNameInput, startEditName, saveDisplayName
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
                <div class="space-y-6">
                    <!-- User Info Card -->
                    <div class="glass-panel-strong p-6 sm:p-8 rounded-3xl text-center relative overflow-hidden bg-white border border-gray-100 shadow-sm">
                        <!-- Top Accent Banner -->
                        <div class="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-amber-500/20"></div>

                        <!-- Avatar Container with Overlapping Badges -->
                        <div class="relative w-28 h-28 mx-auto mb-5 flex items-center justify-center">
                            <!-- Cyber Hexagon Neon Frame Aura -->
                            <div v-if="store.userProfile?.equippedAvatarFrame === 'frame_cyber_hex'" 
                                 class="absolute -inset-2.5 rounded-full border-4 border-cyan-400 border-dashed animate-spin-slow pointer-events-none shadow-[0_0_20px_rgba(34,211,238,0.8)] z-10"></div>
                            <!-- Imperial Gold Crown Frame Aura -->
                            <div v-else-if="store.userProfile?.equippedAvatarFrame === 'frame_gold_crown'" 
                                 class="absolute -inset-2.5 rounded-full border-4 border-amber-400 animate-pulse pointer-events-none shadow-[0_0_25px_rgba(251,191,36,0.9)] z-10"></div>
                            <div v-if="store.userProfile?.equippedAvatarFrame === 'frame_gold_crown'" 
                                 class="absolute -top-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-amber-500 drop-shadow-lg text-2xl">
                                <i class="fa-solid fa-crown animate-bounce-short"></i>
                            </div>

                            <div @click="triggerAvatarUpload" class="group w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center text-4xl font-black text-white cursor-pointer relative z-0" 
                                 style="background: linear-gradient(135deg, #6d55d1, #8b5cf6);">
                                <img v-if="store.userProfile?.avatar" :src="store.userProfile.avatar" class="w-full h-full object-cover">
                                <img v-else :src="'https://api.dicebear.com/7.x/notionists/svg?seed=' + (store.user?.email || 'user') + '&backgroundColor=transparent'" class="w-full h-full object-cover">
                                <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i class="fa-solid fa-camera text-white text-2xl"></i>
                                </div>
                            </div>
                            <input type="file" id="avatar-upload-input" accept="image/*" class="hidden" @change="handleAvatarUpload">
                            
                            <!-- Equipped Badge on Avatar (Positioned Top-Right to prevent overlapping Rank Pill) -->
                            <div v-if="store.userProfile?.equippedBadge" 
                                 class="absolute -top-1.5 -right-1.5 bg-white rounded-full shadow-xl w-9 h-9 flex items-center justify-center border-2 border-amber-400 p-1 z-20 hover:scale-110 transition-transform select-none cursor-pointer"
                                 :title="'Huy hiệu đang trang bị: ' + getBadgeTitle(store.userProfile.equippedBadge)"
                                 @click.stop="store.equipBadge(store.userProfile.equippedBadge)">
                                <img v-if="getBadge3D(store.userProfile.equippedBadge)" :src="getBadge3D(store.userProfile.equippedBadge)" class="w-full h-full object-contain drop-shadow-sm">
                                <span v-else class="text-sm leading-none">{{ getBadgeIcon(store.userProfile.equippedBadge) }}</span>
                            </div>

                            <!-- Rank Badge (Positioned Bottom-Center) -->
                            <div v-if="currentRank" class="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full border-2 border-white shadow-lg flex items-center gap-1.5 whitespace-nowrap z-10">
                                <img v-if="currentRank.image3d" :src="currentRank.image3d" class="w-3.5 h-3.5 object-contain">
                                <i v-else :data-lucide="currentRank.icon" :class="[currentRank.color, 'w-3 h-3']"></i>
                                <span>{{ currentRank.title }}</span>
                            </div>
                        </div>

                        <!-- User Display Name Header with Inline Edit -->
                        <div class="mt-5 mb-1 flex items-center justify-center gap-1.5">
                            <div v-if="!isEditingName" class="flex items-center gap-2">
                                <h2 class="text-xl font-black text-gray-900">
                                    {{ store.userProfile?.displayName || store.user?.email?.split('@')[0] || 'Lexi Explorer' }}
                                </h2>
                                <button @click="startEditName" class="w-6 h-6 rounded-full hover:bg-gray-100 text-gray-400 hover:text-indigo-600 flex items-center justify-center transition" title="Đổi tên hiển thị">
                                    <i class="fa-solid fa-pen text-xs"></i>
                                </button>
                            </div>
                            <!-- Inline Edit Form -->
                            <div v-else class="flex items-center gap-1.5">
                                <input v-model="editNameInput" @keyup.enter="saveDisplayName" @keyup.esc="isEditingName = false"
                                       type="text" maxlength="30" placeholder="Nhập tên của bạn..."
                                       class="px-3 py-1 bg-white border-2 border-indigo-400 focus:border-indigo-600 rounded-xl text-xs font-bold text-gray-900 outline-none shadow-inner w-36">
                                <button @click="saveDisplayName" class="w-6 h-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center text-xs shadow-sm transition">
                                    <i class="fa-solid fa-check"></i>
                                </button>
                                <button @click="isEditingName = false" class="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs transition">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                        </div>
                        <p class="text-xs text-gray-400 font-medium">{{ store.user?.email }}</p>

                        <!-- Level Progress Bar -->
                        <div class="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-xs font-black text-gray-700">Cấp độ {{ currentLevelInfo.currentLevel }}</span>
                                <span class="text-xs font-bold text-purple-600 font-mono">{{ currentLevelInfo.currentExp }} / {{ currentLevelInfo.maxExp }} EXP</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                <div class="bg-gradient-to-r from-purple-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                                     :style="'width: ' + currentLevelInfo.progressPercent + '%'"></div>
                            </div>
                            <p class="text-[10px] text-gray-400 mt-2 font-medium">Còn {{ currentLevelInfo.maxExp - currentLevelInfo.currentExp }} EXP để thăng cấp tiếp theo</p>
                        </div>
                    </div>

                    <!-- Persona Snapshot Card -->
                    <div class="glass-panel p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-sm relative overflow-hidden">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
                                    <i class="fa-solid fa-brain"></i>
                                </div>
                                <h3 class="font-extrabold text-sm text-gray-900 uppercase tracking-wider">Hồ Sơ Tư Duy (Persona)</h3>
                            </div>
                            <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">AI Profiler</span>
                        </div>

                        <!-- Persona Metrics -->
                        <div class="space-y-3.5">
                            <!-- Visual vs Auditory Ratio -->
                            <div>
                                <div class="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                                    <span>Trí nhớ Thị giác / Thính giác</span>
                                    <span class="font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400">{{ Math.round(store.userProfile?.learning_persona?.visual_ratio || 50) }}% Thị giác</span>
                                </div>
                                <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                                    <div class="bg-indigo-500 h-2 rounded-full transition-all" :style="'width: ' + (store.userProfile?.learning_persona?.visual_ratio || 50) + '%'"></div>
                                </div>
                            </div>

                            <!-- Metacognition Calibration -->
                            <div>
                                <div class="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                                    <span>Độ chuẩn tự đánh giá (Metacognition)</span>
                                    <span class="font-mono text-xs font-extrabold text-purple-600 dark:text-purple-400">{{ Math.round(store.userProfile?.learning_persona?.metacognition || 50) }}%</span>
                                </div>
                                <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                                    <div class="bg-purple-500 h-2 rounded-full transition-all" :style="'width: ' + (store.userProfile?.learning_persona?.metacognition || 50) + '%'"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Multi-API Key Pool Settings -->
                    <div class="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden bg-white border border-gray-100 shadow-sm">
                        <div class="flex items-center justify-between gap-2 mb-3">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">
                                    <i class="fa-solid fa-key"></i>
                                </div>
                                <h3 class="font-black text-gray-900 uppercase tracking-wider text-xs">Cấu hình Multi-API Key Pool</h3>
                            </div>
                            <span v-if="parsedKeyCount > 0" class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                                  :class="parsedKeyCount > 1 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-indigo-100 text-indigo-700'">
                                {{ parsedKeyCount > 1 ? parsedKeyCount + ' Keys (Pool Active)' : '1 Key Active' }}
                            </span>
                        </div>
                        <p class="text-xs text-gray-500 mb-3 font-medium leading-relaxed">
                            Nhập 1 hoặc nhiều Gemini API Keys (ngăn cách bằng dấu phẩy hoặc xuống dòng). Hệ thống sẽ <strong>tự động cân bằng tải Round-Robin</strong> và <strong>tự động đổi sang Key dự phòng khi gặp lỗi Rate Limit (429)</strong>.
                        </p>
                        <div class="space-y-2.5">
                            <textarea v-model="geminiApiKey" rows="3" placeholder="AIzaSy...&#10;AIzaSy... (Thêm key dự phòng)" 
                                      class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-xs font-mono bg-gray-50 transition"></textarea>
                            <button @click="saveApiKey" class="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black py-2.5 rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-2">
                                <i class="fa-solid fa-floppy-disk"></i>
                                <span>Lưu Cấu Hình Key Pool ({{ parsedKeyCount }} Keys)</span>
                            </button>
                        </div>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-[10px] text-indigo-500 hover:underline mt-3 inline-flex items-center gap-1 font-bold">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Lấy thêm API Key miễn phí tại Google AI Studio
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
        </div>
    `
};
