import { ref, onMounted, onUnmounted } from 'vue';
import { store } from '../store.js';
import { t } from '../i18n.js';

export default {
    setup() {
        const isOpen = ref(false);
        const voices = ref([]);

        const loadVoices = () => {
            voices.value = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
        };

        onMounted(() => {
            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
            
            // Apply initial theme/focus
            store.saveSettings();
        });

        const toggleMenu = () => { isOpen.value = !isOpen.value; };
        
        const closeMenu = (e) => {
            if (!e.target.closest('#user-tool-widget')) {
                isOpen.value = false;
            }
        };

        onMounted(() => { document.addEventListener('click', closeMenu); });
        onUnmounted(() => { document.removeEventListener('click', closeMenu); });

        const changeTheme = (theme) => {
            store.settings.theme = theme;
            store.saveSettings();
        };

        const toggleLanguage = () => {
            store.settings.language = store.settings.language === 'vi' ? 'en' : 'vi';
            store.saveSettings();
        };

        const adjustFontSize = (delta) => {
            let size = store.settings.readingFontSize + delta;
            if (size >= 12 && size <= 24) {
                store.settings.readingFontSize = size;
                store.saveSettings();
            }
        };

        const adjustDailyTarget = (delta) => {
            let target = store.settings.dailyTarget || 20;
            target += delta;
            if (target >= 5 && target <= 100) {
                store.settings.dailyTarget = target;
                store.saveSettings();
            }
        };

        const toggleFocusMode = () => {
            store.settings.focusMode = !store.settings.focusMode;
            store.saveSettings();
        };

        const toggleChestAnimation = () => {
            if (typeof store.settings.showChestAnimation === 'undefined') {
                store.settings.showChestAnimation = true;
            }
            store.settings.showChestAnimation = !store.settings.showChestAnimation;
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

        const handleVoiceChange = (e) => {
            store.settings.voiceUri = e.target.value;
            store.saveSettings();
        };

        const toggleDesignStyle = () => {
            store.settings.designStyle = store.settings.designStyle === 'handdrawn' ? 'modern' : 'handdrawn';
            store.saveSettings();
        };

        return { isOpen, toggleMenu, closeMenu, store, changeTheme, toggleLanguage, adjustFontSize, adjustDailyTarget, toggleFocusMode, toggleChestAnimation, toggleFloatingCredit, toggleLevelUpNotification, voices, handleVoiceChange, toggleDesignStyle, t };
    },
    template: `
        <div id="user-tool-widget" class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50" @keydown.escape="isOpen = false">
            <!-- Settings Panel -->
            <transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform scale-95 opacity-0 translate-y-4"
                enter-to-class="transform scale-100 opacity-100 translate-y-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="transform scale-100 opacity-100 translate-y-0"
                leave-to-class="transform scale-95 opacity-0 translate-y-4"
            >
                <div v-if="isOpen" id="settings-panel" role="dialog" aria-modal="false" aria-labelledby="settings-title" class="absolute bottom-16 right-0 mb-2 w-[min(18rem,calc(100vw-2rem))] bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden text-sm">
                    <div class="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                        <h3 id="settings-title" class="font-bold text-gray-800 dark:text-gray-100"><i class="fa-solid fa-sliders text-purple-500 mr-2"></i>{{ t('tool.settings') }}</h3>
                    </div>
                    
                    <div class="p-4 space-y-4">
                        <!-- Language Toggle -->
                        <div class="flex justify-between items-center">
                            <span class="font-semibold text-gray-700 dark:text-gray-300"><i class="fa-solid fa-earth-americas text-gray-400 mr-2 w-4"></i>{{ t('tool.language') }}</span>
                            <button @click="toggleLanguage" :aria-label="'Đổi ngôn ngữ, hiện tại ' + (store.settings.language === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh')" class="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                                {{ store.settings.language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN' }}
                            </button>
                        </div>

                        <!-- Theme Toggle -->
                        <div class="flex justify-between items-center">
                            <span class="font-semibold text-gray-700 dark:text-gray-300"><i class="fa-solid fa-moon text-gray-400 mr-2 w-4"></i>{{ t('tool.theme') }}</span>
                            <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button @click="changeTheme('light')" :aria-pressed="store.settings.theme === 'light'" :class="store.settings.theme === 'light' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 dark:text-gray-400'" class="px-2 py-1 rounded text-xs font-bold transition">
                                    <i class="fa-solid fa-sun mr-1"></i>{{ t('tool.light') }}
                                </button>
                                <button @click="changeTheme('dark')" :aria-pressed="store.settings.theme === 'dark'" :class="store.settings.theme === 'dark' ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'" class="px-2 py-1 rounded text-xs font-bold transition">
                                    <i class="fa-solid fa-moon mr-1"></i>{{ t('tool.dark') }}
                                </button>
                            </div>
                        </div>

                        <!-- Voice Settings -->
                        <div>
                            <span class="block font-semibold text-gray-700 dark:text-gray-300 mb-2"><i class="fa-solid fa-headphones text-gray-400 mr-2 w-4"></i>{{ t('tool.voice') }}</span>
                            <select :value="store.settings.voiceUri" @change="handleVoiceChange" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2 outline-none">
                                <option value="">Mặc định (Default)</option>
                                <option v-for="voice in voices" :key="voice.voiceURI" :value="voice.voiceURI">{{ voice.name }}</option>
                            </select>
                        </div>

                        <!-- Reading Font Size -->
                        <div class="flex justify-between items-center">
                            <span class="font-semibold text-gray-700 dark:text-gray-300"><i class="fa-solid fa-font text-gray-400 mr-2 w-4"></i>{{ t('tool.font_size') }}</span>
                            <div class="flex items-center gap-2">
                                <button @click="adjustFontSize(-2)" class="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 font-bold transition">-</button>
                                <span class="text-xs font-mono font-bold text-gray-600 dark:text-gray-300">{{ store.settings.readingFontSize }}px</span>
                                <button @click="adjustFontSize(2)" class="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 font-bold transition">+</button>
                            </div>
                        </div>

                        <!-- Daily Target -->
                        <div class="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span class="font-semibold text-gray-700 dark:text-gray-300"><i class="fa-solid fa-bullseye text-gray-400 mr-2 w-4"></i>Mục tiêu ngày</span>
                            <div class="flex items-center gap-2">
                                <button @click="adjustDailyTarget(-5)" class="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 font-bold transition">-</button>
                                <span class="text-xs font-mono font-bold text-gray-600 dark:text-gray-300">{{ store.settings.dailyTarget || 20 }}</span>
                                <button @click="adjustDailyTarget(5)" class="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 font-bold transition">+</button>
                            </div>
                        </div>

                        <!-- Focus Mode -->
                        <div class="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span class="font-semibold text-gray-700 dark:text-gray-300"><i class="fa-solid fa-eye-slash text-gray-400 mr-2 w-4"></i>{{ t('tool.focus_mode') }}</span>
                            <button @click="toggleFocusMode" role="switch" :aria-checked="store.settings.focusMode" aria-label="Chế độ tập trung" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" :class="store.settings.focusMode ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'">
                                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="store.settings.focusMode ? 'translate-x-6' : 'translate-x-1'"></span>
                            </button>
                        </div>

                        <!-- Design Style Toggle -->
                        <div class="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span class="font-semibold text-gray-700 dark:text-gray-300" title="Chuyển đổi giao diện vẽ tay"><i class="fa-solid fa-palette text-gray-400 mr-2 w-4"></i>Giao diện Vẽ Tay</span>
                            <button @click="toggleDesignStyle" role="switch" :aria-checked="store.settings.designStyle === 'handdrawn'" aria-label="Giao diện vẽ tay" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" :class="store.settings.designStyle === 'handdrawn' ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'">
                                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="store.settings.designStyle === 'handdrawn' ? 'translate-x-6' : 'translate-x-1'"></span>
                            </button>
                        </div>
                        
                        <!-- LexiCredit Chest Animation -->
                        <div class="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span class="font-semibold text-gray-700 dark:text-gray-300" title="Hiệu ứng rớt rương LexiCredit"><i class="fa-solid fa-gem text-amber-400 mr-2 w-4"></i>Hiệu ứng Rương</span>
                            <button @click="toggleChestAnimation" role="switch" :aria-checked="store.settings.showChestAnimation !== false" aria-label="Hiệu ứng rương LexiCredit" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" :class="store.settings.showChestAnimation !== false ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'">
                                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="store.settings.showChestAnimation !== false ? 'translate-x-6' : 'translate-x-1'"></span>
                            </button>
                        </div>
                        
                        <!-- LexiCredit Floating Number -->
                        <div class="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span class="font-semibold text-gray-700 dark:text-gray-300" title="Hiển thị popup +1 LexiCredit khi học"><i class="fa-solid fa-arrow-up text-amber-400 mr-2 w-4"></i>Popup Cầm Tay</span>
                            <button @click="toggleFloatingCredit" role="switch" :aria-checked="store.settings.showFloatingCredit !== false" aria-label="Hiển thị popup LexiCredit" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" :class="store.settings.showFloatingCredit !== false ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'">
                                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="store.settings.showFloatingCredit !== false ? 'translate-x-6' : 'translate-x-1'"></span>
                            </button>
                        </div>
                        
                        <!-- Level Up Notification -->
                        <div class="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span class="font-semibold text-gray-700 dark:text-gray-300" title="Hiển thị thông báo khi thăng cấp"><i class="fa-solid fa-level-up text-amber-400 mr-2 w-4"></i>Thông báo Level Up</span>
                            <button @click="toggleLevelUpNotification" role="switch" :aria-checked="store.settings.showLevelUpNotification !== false" aria-label="Hiển thị thông báo Level Up" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" :class="store.settings.showLevelUpNotification !== false ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'">
                                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="store.settings.showLevelUpNotification !== false ? 'translate-x-6' : 'translate-x-1'"></span>
                            </button>
                        </div>
                        
                        <!-- God Mode (Admin) -->
                        <div v-if="store.user?.email === 'test@test.com'" class="pt-3 border-t border-red-100 dark:border-red-900/30">
                            <button @click="store.navigate('admin'); isOpen = false;" class="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all hover:-translate-y-0.5">
                                <i class="fa-solid fa-bolt"></i> God Mode
                            </button>
                        </div>
                    </div>
                </div>
            </transition>

            <!-- Floating Button -->
            <button @click="toggleMenu" :aria-expanded="isOpen" aria-controls="settings-panel" aria-label="Mở cài đặt hiển thị" class="w-14 h-14 bg-gray-900 dark:bg-purple-600 text-white rounded-full shadow-xl flex items-center justify-center text-xl hover:scale-110 transition duration-300 hover:shadow-purple-500/30">
                <i :class="isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-gear'"></i>
            </button>
        </div>
    `
};
