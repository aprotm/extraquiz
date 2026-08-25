import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { store } from '../store.js';
import { updateUserProfile } from '../db.js';
import { t } from '../i18n.js';
import { getAvailableEnglishVoices, speakEnglishText } from '../voice.js';
import { showToast } from '../toast.js';

export const THEME_OPTIONS = [
    {
        id: 'default',
        name: 'Chuẩn Gốc (Default Light/Glass)',
        shortName: 'Chuẩn Gốc',
        icon: 'fa-solid fa-palette',
        previewClass: 'bg-gradient-to-br from-slate-100 via-sky-50 to-blue-100 border-slate-300 text-slate-700',
        price: 0,
        desc: 'Giao diện mặc định thanh lịch & tinh tế'
    },
    {
        id: 'theme_matrix',
        name: 'Cyber Matrix Neon',
        shortName: 'Matrix Neon',
        icon: 'fa-solid fa-terminal',
        previewClass: 'bg-[#040810] border-[#00FF9D] text-[#00FF9D] shadow-[0_0_10px_rgba(0,255,157,0.3)]',
        price: 1800,
        desc: 'Deep Obsidian & Cyber Emerald Neon'
    },
    {
        id: 'theme_synthwave',
        name: 'Sunset Synthwave 80s',
        shortName: 'Synthwave 80s',
        icon: 'fa-solid fa-sun',
        previewClass: 'bg-gradient-to-br from-[#0A0618] via-[#FF2A85]/25 to-[#FF7B00]/25 border-[#FF2A85] text-[#FF2A85] shadow-[0_0_10px_rgba(255,42,133,0.3)]',
        price: 2400,
        desc: 'Retro Outrun 80s & Laser Pink'
    }
];

export default {
    setup() {
        const isOpen = ref(false);
        const activeSettingTab = ref('display'); // 'display' | 'audio' | 'game' | 'ai'
        const voices = ref([]);
        const customDisplayName = ref(store.userProfile?.displayName || '');
        const isUpdatingName = ref(false);
        const geminiApiKey = ref(localStorage.getItem('gemini_api_key') || '');

        const themeOptions = THEME_OPTIONS;

        const isThemeUnlocked = (themeId) => {
            if (!themeId || themeId === 'default') return true;
            const isAdmin = store.user?.email === 'test@test.com' || 
                            store.userProfile?.isAdmin === true || 
                            store.userProfile?.role === 'admin';
            if (isAdmin) return true;
            const unlocked = store.userProfile?.inventory?.unlockedThemes || [];
            return Array.isArray(unlocked) && unlocked.includes(themeId);
        };

        const isThemeActive = (themeId) => {
            const current = store.userProfile?.equippedTheme || (typeof localStorage !== 'undefined' ? localStorage.getItem('active_theme') : null) || 'default';
            return current === themeId;
        };

        const handleEquipTheme = async (themeId) => {
            try {
                const equipped = await store.equipTheme(themeId);
                if (equipped === 'theme_matrix') {
                    showToast("⚡ Đã kích hoạt giao diện Cyber Matrix Neon!", 'success');
                } else if (equipped === 'theme_synthwave') {
                    showToast("🌅 Đã kích hoạt giao diện Sunset Synthwave 80s!", 'success');
                } else {
                    showToast("🎨 Đã khôi phục giao diện Chuẩn Gốc!", 'info');
                }
            } catch (e) {
                showToast(e.message || "Không thể áp dụng giao diện!", "error");
            }
        };

        const handleOpenStoreForTheme = (themeId) => {
            isOpen.value = false;
            store.navigate('store');
            showToast("Đang chuyển đến LexiStore...", "info");
        };

        const parsedKeyCount = computed(() => {
            const raw = geminiApiKey.value || '';
            return raw.split(/[\n,;]+/).map(k => k.trim()).filter(k => k.length > 5).length;
        });

        const saveApiKey = () => {
            if (geminiApiKey.value.trim()) {
                localStorage.setItem('gemini_api_key', geminiApiKey.value.trim());
                const count = parsedKeyCount.value;
                if (count > 1) {
                    showToast(`Đã kích hoạt Multi-Key Pool với ${count} Keys (Tự động cân bằng tải & dự phòng)!`, "success");
                } else {
                    showToast("Đã lưu API Key thành công!", "success");
                }
            } else {
                localStorage.removeItem('gemini_api_key');
                showToast("Đã xóa API Key.", "success");
            }
        };

        watch(() => store.userProfile?.displayName, (newVal) => {
            if (newVal) customDisplayName.value = newVal;
        });

        const saveCustomName = async () => {
            const name = customDisplayName.value.trim();
            if (!name) {
                showToast("Vui lòng nhập tên hiển thị hợp lệ!", "error");
                return;
            }
            isUpdatingName.value = true;
            try {
                if (!store.userProfile) store.userProfile = {};
                store.userProfile.displayName = name;
                if (store.user?.uid) {
                    await updateUserProfile(store.user.uid, { displayName: name });
                }
                showToast("Đã cập nhật Tên hiển thị thành công!", "success");
            } catch (e) {
                showToast("Lỗi cập nhật tên: " + e.message, "error");
            } finally {
                isUpdatingName.value = false;
            }
        };

        const loadVoices = () => {
            voices.value = getAvailableEnglishVoices();
        };

        const testSelectedVoice = () => {
            speakEnglishText("Welcome to ExtraQuiz. Consistent practice creates extraordinary results!", {
                rate: store.settings.speechRate || 0.95
            });
            showToast("Đang phát âm giọng đọc đã chọn...", 'info');
        };

        const formatVoiceLabel = (v) => {
            const name = v.name;
            const isNatural = /natural|neural|online/i.test(name);
            const isGoogle = /google/i.test(name);
            let prefix = '';
            if (isNatural) prefix = '✨ [Natural AI] ';
            else if (isGoogle) prefix = '✨ [Google] ';
            else if (v.lang === 'en-GB') prefix = '🇬🇧 ';
            else if (v.lang === 'en-US') prefix = '🇺🇸 ';
            else if (v.lang === 'en-AU') prefix = '🇦🇺 ';
            return prefix + name;
        };

        onMounted(() => {
            loadVoices();
            if (window.speechSynthesis) {
                window.speechSynthesis.onvoiceschanged = loadVoices;
            }
            store.saveSettings();
        });

        const toggleMenu = (e) => { 
            if (e) e.stopPropagation();
            isOpen.value = !isOpen.value; 
        };
        
        const closeMenu = (e) => {
            const widget = document.getElementById('user-tool-widget');
            if (widget && !widget.contains(e.target)) {
                isOpen.value = false;
            }
        };

        onMounted(() => { document.addEventListener('click', closeMenu); });
        onUnmounted(() => { document.removeEventListener('click', closeMenu); });

        const adjustFontSize = (delta) => {
            let size = (store.settings.readingFontSize || 16) + delta;
            if (size >= 12 && size <= 26) {
                store.settings.readingFontSize = size;
                store.saveSettings();
            }
        };

        const adjustDailyTarget = (delta) => {
            let target = (store.settings.dailyTarget || 20) + delta;
            if (target >= 5 && target <= 100) {
                store.settings.dailyTarget = target;
                store.saveSettings();
            }
        };

        const setSpeechRate = (rate) => {
            store.settings.speechRate = rate;
            store.saveSettings();
        };

        const toggleFocusMode = () => {
            store.settings.focusMode = !store.settings.focusMode;
            store.saveSettings();
            showToast(store.settings.focusMode ? 'Đã bật Chế độ Tập trung' : 'Đã tắt Chế độ Tập trung', 'info');
        };

        const toggleChestAnimation = () => {
            store.settings.showChestAnimation = store.settings.showChestAnimation === false ? true : false;
            store.saveSettings();
        };

        const toggleFloatingCredit = () => {
            store.settings.showFloatingCredit = store.settings.showFloatingCredit === false ? true : false;
            store.saveSettings();
        };

        const toggleLevelUpNotification = () => {
            store.settings.showLevelUpNotification = store.settings.showLevelUpNotification === false ? true : false;
            store.saveSettings();
        };

        const toggleSfx = () => {
            store.settings.enableSfx = store.settings.enableSfx === false ? true : false;
            store.saveSettings();
        };

        const handleVoiceChange = (e) => {
            store.settings.voiceUri = e.target.value;
            store.saveSettings();
            testSelectedVoice();
        };

        const resetToDefaults = () => {
            if (!confirm("Khôi phục toàn bộ cài đặt về mặc định?")) return;
            store.settings = {
                voiceUri: '',
                speechRate: 0.95,
                readingFontSize: 16,
                focusMode: false,
                language: 'vi',
                dailyTarget: 20,
                showChestAnimation: true,
                showFloatingCredit: true,
                showLevelUpNotification: true,
                enableSfx: true,
                designStyle: 'modern'
            };
            store.saveSettings();
            showToast("Đã khôi phục cài đặt gốc!", 'success');
        };

        const isStudyOrGameMode = computed(() => {
            const activeRoutes = ['study', 'learn', 'quiz', 'dictation', 'matching', 'boss-battle', 'cyber-cipher', 'ai-arena'];
            return activeRoutes.includes(store.currentRoute);
        });

        const handleOpenSettingsEvent = () => {
            isOpen.value = true;
        };

        onMounted(() => {
            window.addEventListener('open-settings', handleOpenSettingsEvent);
        });

        onUnmounted(() => {
            window.removeEventListener('open-settings', handleOpenSettingsEvent);
        });

        return { 
            isOpen, activeSettingTab, toggleMenu, closeMenu, store, 
            adjustFontSize, adjustDailyTarget, setSpeechRate, toggleFocusMode, toggleChestAnimation, 
            toggleFloatingCredit, toggleLevelUpNotification, toggleSfx, voices, handleVoiceChange, 
            testSelectedVoice, formatVoiceLabel, resetToDefaults, isStudyOrGameMode, t,
            customDisplayName, saveCustomName, isUpdatingName,
            geminiApiKey, parsedKeyCount, saveApiKey,
            themeOptions, isThemeUnlocked, isThemeActive, handleEquipTheme, handleOpenStoreForTheme
        };
    },
    template: `
        <div v-if="isOpen" id="user-tool-modal-overlay" 
             class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm select-none" 
             @keydown.escape="isOpen = false" 
             @click.self="isOpen = false">
            <!-- Settings Modal Panel -->
            <transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform scale-95 opacity-0 translate-y-3"
                enter-to-class="transform scale-100 opacity-100 translate-y-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="transform scale-100 opacity-100 translate-y-0"
                leave-to-class="transform scale-95 opacity-0 translate-y-3"
            >
                <div id="settings-panel" role="dialog" aria-modal="true" 
                     class="w-full max-w-md bg-white dark:bg-[#0E152B] rounded-3xl shadow-2xl border border-gray-100 dark:border-[#192445] overflow-hidden text-xs max-h-[88vh] flex flex-col"
                     @click.stop>
                    
                    <!-- Header -->
                    <div class="p-4 border-b border-gray-100 dark:border-[#192445] bg-gray-50/80 dark:bg-[#121A33] flex justify-between items-center shrink-0">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                                <i class="fa-solid fa-sliders"></i>
                            </div>
                            <h3 class="font-extrabold text-sm text-gray-900 dark:text-white">Thiết Lập Trải Nghiệm</h3>
                        </div>
                        <div class="flex items-center gap-2">
                            <button @click="resetToDefaults" class="text-[10px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" title="Khôi phục mặc định">
                                <i class="fa-solid fa-rotate-left mr-0.5"></i> Mặc định
                            </button>
                            <button @click="isOpen = false" class="w-7 h-7 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-white flex items-center justify-center transition cursor-pointer" title="Đóng">
                                <i class="fa-solid fa-xmark text-sm"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Category Tabs (4 Tabs) -->
                    <div class="grid grid-cols-4 border-b border-gray-100 bg-gray-50/30 p-1.5 gap-1">
                        <button @click="activeSettingTab = 'display'"
                                class="py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1 text-[11px]"
                                :class="activeSettingTab === 'display' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'">
                            <i class="fa-solid fa-palette"></i>
                            <span>Hiển thị</span>
                        </button>
                        <button @click="activeSettingTab = 'audio'"
                                class="py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1 text-[11px]"
                                :class="activeSettingTab === 'audio' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'">
                            <i class="fa-solid fa-headphones"></i>
                            <span>Âm thanh</span>
                        </button>
                        <button @click="activeSettingTab = 'game'"
                                class="py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1 text-[11px]"
                                :class="activeSettingTab === 'game' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'">
                            <i class="fa-solid fa-gamepad"></i>
                            <span>Học tập</span>
                        </button>
                        <button @click="activeSettingTab = 'ai'"
                                class="py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1 text-[11px]"
                                :class="activeSettingTab === 'ai' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'">
                            <i class="fa-solid fa-key"></i>
                            <span>AI Key</span>
                        </button>
                    </div>
                    
                    <!-- Tab Contents -->
                    <div class="p-4 sm:p-5 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar flex-1">

                        <!-- ================= TAB 1: HIỂN THỊ ================= -->
                        <div v-if="activeSettingTab === 'display'" class="space-y-3 animate-fade-in">
                            <!-- Quick Theme Selector (Theme Picker) -->
                            <div class="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 space-y-2.5">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200 text-xs">
                                        <i class="fa-solid fa-wand-magic-sparkles text-purple-600"></i>
                                        <span>Giao Diện VIP (Theme Picker)</span>
                                    </div>
                                    <button @click="handleOpenStoreForTheme()" 
                                            class="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                            title="Mở LexiStore">
                                        <i class="fa-solid fa-store text-[9px]"></i> LexiStore
                                    </button>
                                </div>
                                
                                <div class="space-y-2">
                                    <div v-for="thm in themeOptions" :key="thm.id"
                                         class="p-2.5 rounded-xl border transition-all relative flex items-center justify-between gap-2.5"
                                         :class="isThemeActive(thm.id) ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 ring-1 ring-purple-400/50 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600'">
                                        
                                        <!-- Left: Swatch & Info -->
                                        <div class="flex items-center gap-2.5 min-w-0 flex-1">
                                            <!-- Visual Preview Swatch -->
                                            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-xs shadow-sm"
                                                 :class="thm.previewClass">
                                                <i :class="thm.icon"></i>
                                            </div>
                                            <!-- Theme Details -->
                                            <div class="min-w-0 flex-1">
                                                <div class="flex items-center gap-1.5 flex-wrap">
                                                    <span class="font-extrabold text-gray-900 dark:text-gray-100 text-xs truncate">{{ thm.name }}</span>
                                                    <span v-if="thm.price > 0 && !isThemeUnlocked(thm.id)" 
                                                          class="text-[9px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/60 dark:text-amber-300 px-1.5 py-0.5 rounded-md shrink-0 border border-amber-200 dark:border-amber-700/50">
                                                        <i class="fa-solid fa-coins text-[8px] mr-0.5"></i>{{ thm.price }} LC
                                                    </span>
                                                </div>
                                                <p class="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{{ thm.desc }}</p>
                                            </div>
                                        </div>

                                        <!-- Right: Status / Action Button -->
                                        <div class="shrink-0 flex items-center">
                                            <!-- Glowing Active Badge -->
                                            <span v-if="isThemeActive(thm.id)" 
                                                  class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)] border border-emerald-400/60 flex items-center gap-1 animate-pulse">
                                                <i class="fa-solid fa-circle-check text-[10px]"></i>
                                                <span>Đang Dùng</span>
                                            </span>

                                            <!-- Unlocked Theme: Equip Button -->
                                            <button v-else-if="isThemeUnlocked(thm.id)" 
                                                    @click="handleEquipTheme(thm.id)" 
                                                    class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all flex items-center gap-1 hover:scale-105 active:scale-95">
                                                <i class="fa-solid fa-wand-magic-sparkles text-[9px]"></i>
                                                <span>Áp Dụng</span>
                                            </button>

                                            <!-- Locked Theme: Unlock Button Navigating to LexiStore -->
                                            <button v-else 
                                                    @click="handleOpenStoreForTheme(thm.id)" 
                                                    class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all flex items-center gap-1 hover:scale-105 active:scale-95"
                                                    title="Mở LexiStore để mở khóa">
                                                <i class="fa-solid fa-lock text-[9px]"></i>
                                                <span>Mở Khóa</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- Custom Display Name / Nickname -->
                            <div class="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                                <div class="flex items-center gap-2 font-bold text-gray-700 text-xs mb-2">
                                    <i class="fa-solid fa-user-pen text-indigo-500"></i>
                                    <span>Tên hiển thị (Nickname)</span>
                                </div>
                                <div class="flex gap-2">
                                    <input type="text" v-model="customDisplayName" placeholder="Nhập tên của bạn..." 
                                           class="flex-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 bg-white"
                                           @keydown.enter="saveCustomName">
                                    <button @click="saveCustomName" :disabled="isUpdatingName" 
                                            class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1">
                                        <i v-if="!isUpdatingName" class="fa-solid fa-check text-[10px]"></i>
                                        <span>{{ isUpdatingName ? '...' : 'Lưu' }}</span>
                                    </button>
                                </div>
                            </div>
                            <!-- Focus Mode -->
                            <div class="flex justify-between items-center p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <div>
                                    <div class="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
                                        <i class="fa-solid fa-eye-slash text-purple-500"></i>
                                        <span>Chế độ Tập trung</span>
                                    </div>
                                    <p class="text-[10px] text-gray-400 mt-0.5">Ẩn các yếu tố xao nhãng khi học bài</p>
                                </div>
                                <button @click="toggleFocusMode" role="switch" :aria-checked="store.settings.focusMode" 
                                        class="relative inline-flex h-5 w-10 items-center rounded-full transition-colors shrink-0" 
                                        :class="store.settings.focusMode ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'">
                                    <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform" 
                                          :class="store.settings.focusMode ? 'translate-x-5' : 'translate-x-1'"></span>
                                </button>
                            </div>

                            <!-- Reading Font Size -->
                            <div class="flex justify-between items-center p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <div>
                                    <div class="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
                                        <i class="fa-solid fa-font text-blue-500"></i>
                                        <span>Cỡ chữ bài đọc</span>
                                    </div>
                                    <p class="text-[10px] text-gray-400 mt-0.5">Tùy chỉnh cỡ chữ phần Reading</p>
                                </div>
                                <div class="flex items-center gap-1.5 bg-white dark:bg-gray-700 p-1 rounded-xl border border-gray-200 dark:border-gray-600">
                                    <button @click="adjustFontSize(-2)" class="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-200 font-black transition">-</button>
                                    <span class="font-mono font-bold text-gray-800 dark:text-gray-100 px-1">{{ store.settings.readingFontSize || 16 }}px</span>
                                    <button @click="adjustFontSize(2)" class="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-200 font-black transition">+</button>
                                </div>
                            </div>
                        </div>

                        <!-- ================= TAB 2: ÂM THANH & GIỌNG ĐỌC ================= -->
                        <div v-if="activeSettingTab === 'audio'" class="space-y-3 animate-fade-in">
                            <!-- Voice Selector -->
                            <div class="space-y-1.5 p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                        <i class="fa-solid fa-volume-high text-purple-500"></i>
                                        Giọng đọc phát âm
                                    </span>
                                    <button @click="testSelectedVoice" class="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
                                        <i class="fa-solid fa-play text-[8px]"></i> Thử giọng
                                    </button>
                                </div>
                                <select :value="store.settings.voiceUri" @change="handleVoiceChange" 
                                        class="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-xs rounded-xl p-2 outline-none font-medium focus:ring-1 focus:ring-purple-500">
                                    <option value="">✨ Tự động chọn Natural AI chuẩn nhất</option>
                                    <option v-for="voice in voices" :key="voice.voiceURI" :value="voice.voiceURI">{{ formatVoiceLabel(voice) }}</option>
                                </select>
                            </div>

                            <!-- Speech Speed -->
                            <div class="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 space-y-1.5">
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                        <i class="fa-solid fa-gauge-high text-amber-500"></i>
                                        Tốc độ đọc
                                    </span>
                                    <span class="font-mono font-bold text-amber-600">{{ store.settings.speechRate || 0.95 }}x</span>
                                </div>
                                <div class="grid grid-cols-3 gap-1.5">
                                    <button v-for="spd in [
                                                { rate: 0.8, label: '0.8x Chậm' },
                                                { rate: 0.95, label: '1.0x Chuẩn' },
                                                { rate: 1.2, label: '1.2x Nhanh' }
                                            ]" 
                                            :key="spd.rate"
                                            @click="setSpeechRate(spd.rate)"
                                            class="py-1 rounded-lg font-bold text-[11px] transition text-center"
                                            :class="(store.settings.speechRate || 0.95) === spd.rate ? 'bg-purple-600 text-white shadow-sm' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'">
                                        {{ spd.label }}
                                    </button>
                                </div>
                            </div>

                            <!-- Sound Effects SFX -->
                            <div class="flex justify-between items-center p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <div>
                                    <div class="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
                                        <i class="fa-solid fa-bell text-indigo-500"></i>
                                        <span>Âm thanh hiệu ứng (SFX)</span>
                                    </div>
                                    <p class="text-[10px] text-gray-400 mt-0.5">Âm chuông đúng/sai khi luyện tập</p>
                                </div>
                                <button @click="toggleSfx" role="switch" :aria-checked="store.settings.enableSfx !== false" 
                                        class="relative inline-flex h-5 w-10 items-center rounded-full transition-colors shrink-0" 
                                        :class="store.settings.enableSfx !== false ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'">
                                    <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform" 
                                          :class="store.settings.enableSfx !== false ? 'translate-x-5' : 'translate-x-1'"></span>
                                </button>
                            </div>
                        </div>

                        <!-- ================= TAB 3: HỌC TẬP & GAMIFICATION ================= -->
                        <div v-if="activeSettingTab === 'game'" class="space-y-3 animate-fade-in">
                            <!-- Daily Target -->
                            <div class="flex justify-between items-center p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <div>
                                    <div class="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
                                        <i class="fa-solid fa-bullseye text-rose-500"></i>
                                        <span>Mục tiêu hàng ngày</span>
                                    </div>
                                    <p class="text-[10px] text-gray-400 mt-0.5">Số từ vựng cần hoàn thành mỗi ngày</p>
                                </div>
                                <div class="flex items-center gap-1.5 bg-white dark:bg-gray-700 p-1 rounded-xl border border-gray-200 dark:border-gray-600">
                                    <button @click="adjustDailyTarget(-5)" class="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-200 font-black transition">-</button>
                                    <span class="font-mono font-bold text-gray-800 dark:text-gray-100 px-1">{{ store.settings.dailyTarget || 20 }} từ</span>
                                    <button @click="adjustDailyTarget(5)" class="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-200 font-black transition">+</button>
                                </div>
                            </div>

                            <!-- Chest Animation -->
                            <div class="flex justify-between items-center p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <div>
                                    <div class="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
                                        <i class="fa-solid fa-gem text-amber-500"></i>
                                        <span>Hiệu ứng Rương Vàng</span>
                                    </div>
                                    <p class="text-[10px] text-gray-400 mt-0.5">Hoạt ảnh rơi rương khi nhận thưởng</p>
                                </div>
                                <button @click="toggleChestAnimation" role="switch" :aria-checked="store.settings.showChestAnimation !== false" 
                                        class="relative inline-flex h-5 w-10 items-center rounded-full transition-colors shrink-0" 
                                        :class="store.settings.showChestAnimation !== false ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'">
                                    <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform" 
                                          :class="store.settings.showChestAnimation !== false ? 'translate-x-5' : 'translate-x-1'"></span>
                                </button>
                            </div>

                            <!-- Floating LC Points Popup -->
                            <div class="flex justify-between items-center p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <div>
                                    <div class="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
                                        <i class="fa-solid fa-arrow-trend-up text-emerald-500"></i>
                                        <span>Popup +1 LexiCredit</span>
                                    </div>
                                    <p class="text-[10px] text-gray-400 mt-0.5">Hiển thị điểm cộng bay lên khi học</p>
                                </div>
                                <button @click="toggleFloatingCredit" role="switch" :aria-checked="store.settings.showFloatingCredit !== false" 
                                        class="relative inline-flex h-5 w-10 items-center rounded-full transition-colors shrink-0" 
                                        :class="store.settings.showFloatingCredit !== false ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'">
                                    <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform" 
                                          :class="store.settings.showFloatingCredit !== false ? 'translate-x-5' : 'translate-x-1'"></span>
                                </button>
                            </div>

                            <!-- Level Up Modal Notification -->
                            <div class="flex justify-between items-center p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <div>
                                    <div class="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
                                        <i class="fa-solid fa-trophy text-yellow-500"></i>
                                        <span>Thông báo Thăng Cấp</span>
                                    </div>
                                    <p class="text-[10px] text-gray-400 mt-0.5">Hiện modal chúc mừng khi Level Up</p>
                                </div>
                                <button @click="toggleLevelUpNotification" role="switch" :aria-checked="store.settings.showLevelUpNotification !== false" 
                                        class="relative inline-flex h-5 w-10 items-center rounded-full transition-colors shrink-0" 
                                        :class="store.settings.showLevelUpNotification !== false ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'">
                                    <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform" 
                                          :class="store.settings.showLevelUpNotification !== false ? 'translate-x-5' : 'translate-x-1'"></span>
                                </div>
                            </div>
                        </div>

                        <!-- ================= TAB 4: MULTI-KEY POOL ================= -->
                        <div v-if="activeSettingTab === 'ai'" class="space-y-3 animate-fade-in">
                            <div class="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                                <div class="flex items-center justify-between gap-2 mb-1.5">
                                    <div class="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                                        <i class="fa-solid fa-layer-group text-amber-600"></i>
                                        <span>Multi-API Key Pool</span>
                                    </div>
                                    <span v-if="parsedKeyCount > 0" class="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full"
                                          :class="parsedKeyCount > 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
                                        {{ parsedKeyCount > 1 ? parsedKeyCount + ' Keys Active' : '1 Key Active' }}
                                    </span>
                                </div>
                                <p class="text-[11px] text-gray-600 leading-snug mb-2">
                                    Nhập 1 hoặc nhiều Gemini API Keys (ngăn cách bằng dấu phẩy hoặc xuống dòng). Tự động phân bổ Round-Robin & dự phòng khi gặp 429.
                                </p>
                                <textarea v-model="geminiApiKey" rows="3" placeholder="AIzaSy...&#10;AIzaSy..."
                                          class="w-full p-2 text-[11px] font-mono rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white mb-2"></textarea>
                                <button @click="saveApiKey"
                                        class="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5">
                                    <i class="fa-solid fa-floppy-disk text-[10px]"></i>
                                    <span>Lưu Cấu Hình ({{ parsedKeyCount }} Keys)</span>
                                </button>
                            </div>
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-[10px] text-indigo-500 hover:underline block text-center font-semibold">
                                <i class="fa-solid fa-arrow-up-right-from-square mr-1"></i> Lấy API Key miễn phí từ Google
                            </a>
                        </div>

                    </div>
                </div>
            </transition>
        </div>
    `
};
