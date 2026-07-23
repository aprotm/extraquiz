import { createApp, onMounted, onUpdated, ref } from 'vue';
import { auth } from './firebase-config.js';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { store, BADGES_DICT } from './store.js';
import { createSampleDeck, fetchDecks, fetchUserProfile, updateUserProfile } from './db.js';

import Dashboard from './components/dashboard.js';
import DeckDetail from './components/deckdetail.js';
import CreateEditDeck from './components/createeditdeck.js';
import Study from './components/study.js';
import Quiz from './components/quiz.js';
import Dictation from './components/dictation.js';
import Learn from './components/learn.js';
import FloatingLexiCredit from './components/floatinglexicredit.js';
import Roadmap from './components/roadmap.js';
import Reading from './components/reading.js';
import ParaphrasingCoach from './components/paraphrasingcoach.js';
import WritingGrader from './components/writinggrader.js';
import MatchingGame from './components/matchinggame.js';
import Profile from './components/profile.js';
import AdminPanel from './components/adminpanel.js';
import UserTool from './components/usertool.js';
import Guide from './components/guide.js';
import LevelUpPopup from './components/LevelUpPopup.js';
import Activate from './components/activate.js';
import { t } from './i18n.js';

// ===== TOAST SYSTEM =====
const toasts = ref([]);
let toastId = 0;
export function showToast(message, type = 'info', duration = 3000) {
    const id = ++toastId;
    toasts.value.push({ id, message, type, duration });
    setTimeout(() => {
        const t = toasts.value.find(t => t.id === id);
        if (t) t.hiding = true;
        setTimeout(() => {
            toasts.value = toasts.value.filter(t => t.id !== id);
        }, 350);
    }, duration);
}

const App = {
    components: {
        Dashboard, DeckDetail, CreateEditDeck, Study, Quiz, Dictation, Learn, Roadmap, Reading, ParaphrasingCoach, WritingGrader, MatchingGame, AdminPanel, UserTool, Profile, FloatingLexiCredit, Guide, LevelUpPopup, Activate
    },
    setup() {
        const isLoginMode = ref(true);
        const authForm = ref({ email: '', password: '' });

        onMounted(() => {
            // Apply initial settings
            store.saveSettings();

            // Set default Gemini API key so users don't need to enter it
            if (!localStorage.getItem('gemini_api_key')) {
                localStorage.setItem('gemini_api_key', 'AIzaSyB2VaG_F-1jLVRIZedSIi9Kmlzpvt2UWOg');
            }

            if (!auth) {
                store.hideLoading();
                store.authError = "CHÚ Ý: Bạn chưa cấu hình Firebase. Vui lòng thêm API Key vào js/firebase-config.js";
                return;
            }
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    try {
                        let profile = await fetchUserProfile(user.uid);
                        
                        // Check if banned
                        if (profile.isBanned && profile.banUntil && profile.banUntil > Date.now()) {
                            const banDate = new Date(profile.banUntil).toLocaleString('vi-VN');
                            store.authError = `Tài khoản của bạn đã bị khóa cho đến ${banDate}. Vui lòng thử lại sau.`;
                            store.hideLoading();
                            await signOut(auth);
                            store.user = null;
                            return;
                        }

                        // Save email to profile for admin panel if missing
                        if (profile.email !== user.email) {
                            await updateUserProfile(user.uid, { email: user.email });
                            profile.email = user.email;
                        }

                        store.user = user;
                        store.userProfile = profile;
                        store.decks = await fetchDecks(user.uid);
                        
                        // Check retro-active badges
                        await store.checkRetroactiveBadges();
                    } catch (err) {
                        console.error(err);
                        showToast("Lỗi: " + err.message, 'error');
                    }
                } else {
                    store.user = null;
                }
                store.hideLoading();
                // Render lucide icons
                setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 500);
            });
        });

        onUpdated(() => {
            if (window.lucide) window.lucide.createIcons();
        });

        const bgImage = ref(localStorage.getItem('app-bg') || '');
        const triggerBgUpload = () => {
            document.getElementById('bg-upload-input').click();
        };
        const handleBgUpload = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    localStorage.setItem('app-bg', event.target.result);
                    bgImage.value = event.target.result;
                    showToast("Đã đổi hình nền thành công!", 'success');
                } catch (err) {
                    showToast("Ảnh quá lớn, vui lòng chọn ảnh dưới 2MB.", 'error');
                }
            };
            reader.readAsDataURL(file);
        };
        
        const removeBgImage = () => {
            localStorage.removeItem('app-bg');
            bgImage.value = '';
            showToast("Đã xóa hình nền.", 'info');
        };

        const handleAuth = async () => {
            if (!auth) return;
            store.authError = '';
            store.showLoading();
            try {
                if (isLoginMode.value) {
                    await signInWithEmailAndPassword(auth, authForm.value.email, authForm.value.password);
                } else {
                    const cred = await createUserWithEmailAndPassword(auth, authForm.value.email, authForm.value.password);
                    await createSampleDeck(cred.user.uid);
                    store.decks = await fetchDecks(cred.user.uid);
                }
            } catch(e) {
                store.authError = e.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim();
            } finally {
                store.hideLoading();
            }
        };

        const logout = async () => {
            if (!auth) return;
            await signOut(auth);
            showToast("Đã đăng xuất.", 'info');
        };

        const handleForgotPassword = async () => {
            if (!authForm.value.email) {
                store.authError = "Vui lòng nhập Email để khôi phục mật khẩu.";
                return;
            }
            try {
                store.showLoading();
                await sendPasswordResetEmail(auth, authForm.value.email);
                showToast("Đã gửi link khôi phục mật khẩu vào Email của bạn!", 'success');
                store.authError = "";
            } catch (err) {
                console.error(err);
                store.authError = "Lỗi khôi phục: " + err.message;
            } finally {
                store.hideLoading();
            }
        };

        // Get first letter of email for avatar
        const userInitial = () => store.user?.email?.[0]?.toUpperCase() || '?';

        const getBadgeIcon = (id) => {
            if (!id) return '';
            const b = BADGES_DICT.find(x => x.id === id);
            return b ? b.icon : '';
        };

        return { 
            store, isLoginMode, authForm, handleAuth, logout, toasts, 
            bgImage, triggerBgUpload, handleBgUpload, removeBgImage,
            userInitial, getBadgeIcon, t, handleForgotPassword
        };
    },
    template: `
        <!-- Toast Container -->
        <div class="toast-container">
            <div v-for="t in toasts" :key="t.id" class="toast relative overflow-hidden" :class="['toast-' + t.type, t.hiding ? 'hide' : '']">
                <div class="flex items-center gap-3 w-full z-10 relative">
                    <span class="toast-icon">
                        <i v-if="t.type === 'success'" class="fa-solid fa-circle-check"></i>
                        <i v-else-if="t.type === 'error'" class="fa-solid fa-circle-xmark"></i>
                        <i v-else class="fa-solid fa-circle-info"></i>
                    </span>
                    <span>{{ t.message }}</span>
                </div>
                <div class="absolute bottom-0 left-0 h-1 bg-current opacity-20" :style="'animation: toastProgress ' + t.duration + 'ms linear forwards;'"></div>
            </div>
        </div>

        <!-- Loading Screen -->
        <div v-if="store.isLoading" class="fixed inset-0 z-50 flex flex-col items-center justify-center" style="background: linear-gradient(145deg, #f5f4f9, #ece9f4);">
            <div class="flex flex-col items-center gap-6 animate-pulse-soft">
                <div class="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl bg-white overflow-hidden p-1">
                    <img src="./assets/logo.png" alt="Logo" class="w-full h-full object-contain rounded-2xl">
                </div>
                <div class="flex flex-col items-center gap-2">
                    <p class="text-lg font-bold" style="color: #6d55d1;">ExtraQuiz Pro</p>
                    <p class="text-sm text-gray-500 font-medium">Đang chuẩn bị...</p>
                </div>
                <div class="flex gap-2">
                    <div class="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style="animation-delay: 300ms"></div>
                </div>
            </div>
        </div>

        <!-- Auth Screen -->
        <div v-else-if="!store.user" class="flex-1 flex items-center justify-center min-h-screen" style="background: linear-gradient(145deg, #f5f4f9, #ece9f4);">
            <div class="w-full max-w-5xl mx-auto flex rounded-3xl overflow-hidden shadow-2xl" style="min-height: 580px;">
                <!-- Left Branding Panel -->
                <div class="hidden lg:flex flex-col justify-between p-12 flex-1 relative overflow-hidden" style="background: linear-gradient(145deg, #6d55d1, #4c3699);">
                    <div class="absolute inset-0 opacity-10">
                        <div class="absolute top-12 right-12 w-64 h-64 rounded-full" style="background: rgba(255,255,255,0.3); filter: blur(60px);"></div>
                        <div class="absolute bottom-0 left-0 w-96 h-96 rounded-full" style="background: rgba(139,92,246,0.4); filter: blur(80px);"></div>
                    </div>
                    <div class="relative z-10">
                        <div class="flex items-center gap-3 mb-16">
                            <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm overflow-hidden p-0.5">
                                <img src="./assets/logo.png" alt="Logo" class="w-full h-full object-contain rounded-xl">
                            </div>
                            <span class="text-white font-bold text-xl">ExtraQuiz Pro</span>
                        </div>
                        <h1 class="text-4xl font-extrabold text-white leading-tight mb-4">Luyện thi IELTS<br>cùng trí tuệ AI</h1>
                        <p class="text-purple-200 text-lg leading-relaxed">Flashcard thông minh, lộ trình cá nhân hóa, và công cụ AI chuyên sâu — tất cả trong một nền tảng.</p>
                    </div>
                    <div class="relative z-10 space-y-4">
                        <div v-for="feat in ['🃏 Hệ thống flashcard với thuật toán SRS', '✍️ Máy chấm essay AI theo tiêu chí IELTS', '🔄 Huấn luyện Paraphrase Band 8.0+', '📖 Tạo đề đọc hiểu từ bài viết bất kỳ']" :key="feat" class="flex items-center gap-3 text-purple-100 font-medium">
                            <span>{{ feat }}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Right Form Panel -->
                <div class="flex-1 lg:max-w-md bg-white flex flex-col justify-center p-10">
                    <div class="mb-10 lg:hidden flex items-center gap-3">
                        <div class="w-10 h-10 rounded-2xl flex items-center justify-center bg-white shadow-sm overflow-hidden p-0.5 border border-purple-100">
                            <img src="./assets/logo.png" alt="Logo" class="w-full h-full object-contain rounded-xl">
                        </div>
                        <span class="font-bold text-lg text-gray-800 dark:text-gray-50">ExtraQuiz Pro</span>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">{{ isLoginMode ? 'Chào mừng trở lại 👋' : 'Tạo tài khoản miễn phí' }}</h2>
                    <p class="text-gray-500 text-sm mb-8">{{ isLoginMode ? 'Tiếp tục hành trình học IELTS của bạn.' : 'Bắt đầu luyện thi IELTS ngay hôm nay.' }}</p>
                    <form @submit.prevent="handleAuth" class="space-y-5">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                            <input type="email" v-model="authForm.email" required placeholder="your@email.com" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition font-medium">
                        </div>
                        <div>
                            <div class="flex justify-between items-center mb-2">
                                <label class="block text-sm font-semibold text-gray-700">Mật khẩu</label>
                                <button type="button" @click="handleForgotPassword" class="text-xs text-purple-600 hover:text-purple-800 font-semibold focus:outline-none">Quên mật khẩu?</button>
                            </div>
                            <input type="password" v-model="authForm.password" required placeholder="••••••••" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition font-medium">
                        </div>
                        <div v-if="store.authError" class="text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100 font-medium">{{ store.authError }}</div>
                        <button type="submit" class="btn-primary w-full py-3.5 text-base">
                            {{ isLoginMode ? 'Đăng nhập' : 'Đăng ký' }}
                        </button>
                    </form>
                    <button @click="isLoginMode = !isLoginMode" class="mt-6 text-center w-full text-sm text-gray-500 hover:text-purple-600 font-semibold transition">
                        {{ isLoginMode ? 'Chưa có tài khoản? Đăng ký ngay →' : 'Đã có tài khoản? Đăng nhập →' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Main App Layout -->
        <div v-else class="flex-1 flex flex-col h-screen max-h-screen overflow-hidden relative bg-cover bg-center transition-all duration-500" :style="bgImage ? { backgroundImage: 'url(' + bgImage + ')' } : {}">
            <a class="skip-link" href="#main-content">Chuyển đến nội dung chính</a>
            
            <!-- Floating Back Button for Focus Mode & AI Tools -->
            <button v-if="store.currentRoute !== 'dashboard' && (store.settings?.focusMode || ['paraphrase', 'writing'].includes(store.currentRoute))" 
                    @click="store.navigate('dashboard')"
                    class="fixed top-4 left-4 z-50 w-10 h-10 rounded-2xl bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-purple-600 hover:bg-purple-50 border border-gray-100 transition-all hover:scale-105" title="Quay lại Dashboard">
                <i class="fa-solid fa-arrow-left"></i>
            </button>

            <div v-if="bgImage" class="absolute inset-0 bg-white/50 backdrop-blur-[4px] z-0 pointer-events-none"></div>
            
            <!-- Header -->
            <header class="glass-panel-strong sticky top-0 z-40 px-4 sm:px-6 py-3.5 flex justify-between items-center relative hide-in-focus" 
                    v-show="!['paraphrase', 'writing'].includes(store.currentRoute)" 
                    style="border-bottom: 1px solid rgba(109,85,209,0.1);">
                <div class="flex items-center gap-3 cursor-pointer group" @click="store.navigate('dashboard')">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center transition group-hover:scale-105 bg-white shadow-sm overflow-hidden p-0.5 border border-gray-100">
                        <img src="./assets/logo.png" alt="Logo" class="w-full h-full object-contain rounded-lg">
                    </div>
                    <span class="text-base font-bold hidden sm:block text-gray-900 dark:text-gray-50">ExtraQuiz Pro</span>
                </div>
                
                <div class="flex items-center gap-1 sm:gap-2">
                    <button v-if="bgImage" @click="removeBgImage" class="btn-ghost text-sm px-2 sm:px-3 py-1.5 flex items-center gap-1.5 font-medium" title="Xóa nền">
                        <i class="fa-solid fa-trash text-xs"></i> <span class="hidden sm:inline">Xóa nền</span>
                    </button>
                    <button @click="triggerBgUpload" class="btn-ghost text-sm px-2 sm:px-3 py-1.5 flex items-center gap-1.5 font-medium" title="Hình nền">
                        <i class="fa-regular fa-image text-xs"></i> <span class="hidden sm:inline">Hình nền</span>
                    </button>
                    <button @click="store.navigate('guide')" class="btn-ghost text-sm px-2 sm:px-3 py-1.5 flex items-center gap-1.5 font-medium" :class="store.currentRoute === 'guide' ? 'bg-purple-100 text-purple-700' : ''" title="Hướng dẫn">
                        <i class="fa-solid fa-book-open text-xs"></i> <span class="hidden sm:inline">Hướng dẫn</span>
                    </button>
                    <input type="file" id="bg-upload-input" accept="image/*" class="hidden" @change="handleBgUpload">
                    
                    <!-- LexiCredit Balance (Only visible in Dashboard) -->
                    <div v-if="store.currentRoute === 'dashboard'" class="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-50 border border-amber-100 shadow-sm mr-1 sm:mr-2 animate-fade-in" title="LexiCredit">
                        <i class="fa-solid fa-gem text-amber-500 text-[10px] sm:text-xs"></i>
                        <span class="font-extrabold text-amber-600 font-mono text-xs sm:text-sm">{{ store.userProfile?.lexiCredit || 0 }}</span>
                    </div>

                    <div class="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl" style="background: rgba(109,85,209,0.07);">
                        <div class="user-avatar w-7 h-7 sm:w-8 sm:h-8 text-[10px] sm:text-xs relative cursor-pointer hover:ring-2 hover:ring-purple-300 transition-all" @click="store.navigate('profile')" title="Xem Hồ sơ">
                            <img v-if="store.userProfile?.avatar" :src="store.userProfile.avatar" class="w-full h-full object-cover rounded-full">
                            <template v-else>{{ userInitial() }}</template>
                            
                            <div v-if="store.userProfile?.equippedBadge" class="absolute -bottom-1 -right-1 text-[10px] bg-white rounded-full shadow-sm w-4 h-4 flex items-center justify-center border border-gray-100 text-amber-500">
                                <i v-if="getBadgeIcon(store.userProfile.equippedBadge).length > 3" :data-lucide="getBadgeIcon(store.userProfile.equippedBadge)" class="w-3 h-3"></i>
                                <span v-else>{{ getBadgeIcon(store.userProfile.equippedBadge) }}</span>
                            </div>
                        </div>
                    </div>
                    
                    <button @click="logout" class="btn-ghost px-2 sm:px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-600 hover:bg-red-50" title="Đăng xuất">
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </button>
                </div>
            </header>

            <main id="main-content" tabindex="-1" class="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 lg:p-8 relative z-10">
                <Dashboard v-if="store.currentRoute === 'dashboard'" />
                <DeckDetail v-else-if="store.currentRoute === 'deck-detail'" />
                <CreateEditDeck v-else-if="store.currentRoute === 'create-deck' || store.currentRoute === 'edit-deck'" />
                <Study v-else-if="store.currentRoute === 'study'" />
                <Quiz v-else-if="store.currentRoute === 'quiz'" />
                <Dictation v-else-if="store.currentRoute === 'dictation'" />
                <Learn v-else-if="store.currentRoute === 'learn'" />
                <Roadmap v-else-if="store.currentRoute === 'roadmap'" />
                <Reading v-else-if="store.currentRoute === 'reading'" />
                <ParaphrasingCoach v-else-if="store.currentRoute === 'paraphrase'" />
                <WritingGrader v-else-if="store.currentRoute === 'writing'" />
                <MatchingGame v-else-if="store.currentRoute === 'matching'" />
                <Profile v-else-if="store.currentRoute === 'profile'" />
                <AdminPanel v-else-if="store.currentRoute === 'admin'" />
                <Guide v-if="store.currentRoute === 'guide'" />
                <Activate v-else-if="store.currentRoute === 'activate'" />
            </main>

            <nav aria-label="Điều hướng chính" class="mobile-nav lg:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 hide-in-focus">
                <div class="mobile-nav__bar grid grid-cols-4 gap-1">
                    <button @click="store.navigate('dashboard')" :aria-current="store.currentRoute === 'dashboard' ? 'page' : undefined" :class="store.currentRoute === 'dashboard' ? 'mobile-nav__item--active' : ''" class="mobile-nav__item"><i class="fa-solid fa-house" aria-hidden="true"></i><span>Trang chủ</span></button>
                    <button @click="store.navigate('roadmap')" :aria-current="store.currentRoute === 'roadmap' ? 'page' : undefined" :class="store.currentRoute === 'roadmap' ? 'mobile-nav__item--active' : ''" class="mobile-nav__item"><i class="fa-solid fa-route" aria-hidden="true"></i><span>Lộ trình</span></button>
                    <button @click="store.navigate('guide')" :aria-current="store.currentRoute === 'guide' ? 'page' : undefined" :class="store.currentRoute === 'guide' ? 'mobile-nav__item--active' : ''" class="mobile-nav__item"><i class="fa-solid fa-book-open" aria-hidden="true"></i><span>Hướng dẫn</span></button>
                    <button @click="store.navigate('profile')" :aria-current="store.currentRoute === 'profile' ? 'page' : undefined" :class="store.currentRoute === 'profile' ? 'mobile-nav__item--active' : ''" class="mobile-nav__item"><i class="fa-solid fa-user" aria-hidden="true"></i><span>Hồ sơ</span></button>
                </div>
            </nav>
            
            <!-- Widget cố định -->
            <UserTool v-if="store.user" />
            <FloatingLexiCredit />
            <LevelUpPopup />
        </div>
    `
};

createApp(App).mount('#app');
