import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { store } from '../store.js';
import { updateUserProfile } from '../db.js';
import { t } from '../i18n.js';
import { getAvailableEnglishVoices, speakEnglishText } from '../voice.js';
import { showToast } from '../toast.js';

export default {
    setup() {
        const isOpen = ref(false);
        const activeSettingTab = ref('display'); // 'display' | 'audio' | 'game'
        const voices = ref([]);
        const customDisplayName = ref(store.userProfile?.displayName || '');
        const isUpdatingName = ref(false);

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

        const toggleMenu = () => { 
            isOpen.value = !isOpen.value; 
        };
        
        const closeMenu = (e) => {
            if (!e.target.closest('#user-tool-widget')) {
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
            const activeRoutes = ['study', 'learn', 'quiz', 'dictation', 'matching', 'boss-battle', 'cyber-cipher', 'ai-arena', 'paraphrase', 'writing', 'reading'];
            return activeRoutes.includes(store.currentRoute);
        });

        return { 
            isOpen, activeSettingTab, toggleMenu, closeMenu, store, 
            adjustFontSize, adjustDailyTarget, setSpeechRate, toggleFocusMode, toggleChestAnimation, 
            toggleFloatingCredit, toggleLevelUpNotification, toggleSfx, voices, handleVoiceChange, 
            testSelectedVoice, formatVoiceLabel, resetToDefaults, isStudyOrGameMode, t,
            customDisplayName, saveCustomName, isUpdatingName
        };
    },
    template: `
        <div v-if="!isStudyOrGameMode" id="user-tool-widget" class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 select-none hide-in-focus transition-all duration-300" @keydown.escape="isOpen = false">
            <!-- Settings Modal Panel -->
            <transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform scale-95 opacity-0 translate-y-4"
                enter-to-class="transform scale-100 opacity-100 translate-y-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="transform scale-100 opacity-100 translate-y-0"
                leave-to-class="transform scale-95 opacity-0 translate-y-4"
            >
                <div v-if="isOpen" id="settings-panel" role="dialog" aria-modal="false" 
                     class="absolute bottom-16 right-0 mb-2 w-[min(22rem,calc(100vw-2rem))] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-xs">
                    
                    <!-- Header -->
                    <div class="p-4 border-b border-gray-100 bg-gray-50/60 flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <div class="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                                <i class="fa-solid fa-sliders"></i>
                            </div>
                            <h3 class="font-extrabold text-sm text-gray-900">Thiết Lập Trải Nghiệm</h3>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button @click="resetToDefaults" class="text-[10px] font-bold text-gray-400 hover:text-gray-600 transition" title="Khôi phục mặc định">
                                <i class="fa-solid fa-rotate-left mr-0.5"></i> Mặc định
                            </button>
                            <button @click="isOpen = false" class="w-6 h-6 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center transition">
                                <i class="fa-solid fa-xmark text-xs"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Category Tabs -->
                    <div class="flex border-b border-gray-100 bg-gray-50/30 p-1.5 gap-1">
                        <button @click="activeSettingTab = 'display'"
                                class="flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5"
                                :class="activeSettingTab === 'display' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'">
                            <i class="fa-solid fa-palette"></i>
                            <span>Hiển Thị</span>
                        </button>
                        <button @click="activeSettingTab = 'audio'"
                                class="flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5"
                                :class="activeSettingTab === 'audio' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'">
                            <i class="fa-solid fa-headphones"></i>
                            <span>Âm Thanh</span>
                        </button>
                        <button @click="activeSettingTab = 'game'"
                                class="flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5"
                                :class="activeSettingTab === 'game' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'">
                            <i class="fa-solid fa-gamepad"></i>
                            <span>Học Tập</span>
                        </button>
                    </div>
                    
                    <!-- Tab Contents -->
                    <div class="p-4 space-y-3.5 max-h-80 overflow-y-auto custom-scrollbar">

                        <!-- ================= TAB 1: HIỂN THỊ ================= -->
                        <div v-if="activeSettingTab === 'display'" class="space-y-3 animate-fade-in">
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
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </transition>

            <!-- Floating Settings Gear Button -->
            <button @click="toggleMenu" :aria-expanded="isOpen" aria-controls="settings-panel" 
                    class="w-13 h-13 sm:w-14 sm:h-14 bg-gradient-to-tr from-gray-900 to-gray-800 dark:from-purple-600 dark:to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-all duration-300 hover:shadow-purple-500/30 border-2 border-white/20">
                <i :class="isOpen ? 'fa-solid fa-xmark text-lg' : 'fa-solid fa-gear text-lg hover:rotate-90 transition-transform duration-500'"></i>
            </button>
        </div>
    `
};
