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
import Quotes from './components/quotes.js';
import LevelUpPopup from './components/LevelUpPopup.js';
import Activate from './components/activate.js';
import LexiLearnDashboard from './components/lexilearndashboard.js';
import { t } from './i18n.js';

import { toasts, showToast } from './toast.js';

const App = {
    components: {
        Dashboard, DeckDetail, CreateEditDeck, Study, Quiz, Dictation, Learn, Roadmap, Reading, ParaphrasingCoach, WritingGrader, MatchingGame, AdminPanel, UserTool, Profile, FloatingLexiCredit, Guide, Quotes, LevelUpPopup, Activate, LexiLearnDashboard
    },
    setup() {
        const isLoginMode = ref(true);
        const authForm = ref({ email: '', password: '' });

        onMounted(() => {
            // Apply initial settings
            store.saveSettings();

            // Hash Routing Listener
            window.addEventListener('hashchange', () => {
                const hash = window.location.hash.slice(1);
                if (hash && store.currentRoute !== hash) {
                    store.currentRoute = hash;
                }
            });

            // API Key must be set manually by the user in the UI or via localStorage
            // (Removed hardcoded leaked key)

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
            return b ? (b.emoji || b.icon || '🏆') : '🏆';
        };

        const getBadgeTitle = (id) => {
            if (!id) return '';
            const b = BADGES_DICT.find(x => x.id === id);
            return b ? b.title : '';
        };

        const getBadge3D = (id) => {
            if (!id) return '';
            const b = BADGES_DICT.find(x => x.id === id);
            return b ? b.image3d : '';
        };

        return { 
            store, isLoginMode, authForm, handleAuth, logout, toasts, 
            bgImage, triggerBgUpload, handleBgUpload, removeBgImage,
            userInitial, getBadgeIcon, getBadge3D, getBadgeTitle, t, handleForgotPassword
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
                <div class="flex flex-col items-center gap-1.5 text-center">
                    <p class="text-xl font-black tracking-tight" style="color: #6d55d1;">Lexi<span class="text-amber-500">Learn</span> <span class="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold uppercase ml-1">PRO</span></p>
                    <p class="text-xs text-gray-500 font-semibold tracking-wide">Đang khởi tạo không gian học tập AI...</p>
                </div>
                <div class="flex gap-2">
                    <div class="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style="animation-delay: 300ms"></div>
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

        <!-- Main App Layout (Redesigned) -->
        <div v-else class="flex-1 flex h-screen max-h-screen overflow-auto relative bg-cover bg-center transition-all duration-500" :style="bgImage ? { backgroundImage: 'url(' + bgImage + ')' } : {}">
            <a class="skip-link" href="#main-content">Chuyển đến nội dung chính</a>
            <div v-if="bgImage" class="absolute inset-0 bg-white/50 backdrop-blur-[4px] z-0 pointer-events-none"></div>

            <!-- Desktop Sidebar -->
            <aside class="w-64 bg-white/60 backdrop-blur-md border-r border-white/50 flex flex-col z-10 flex-shrink-0 transition-transform" v-if="store.currentRoute !== 'lexilearn-dashboard'">
                <!-- Logo -->
                <div class="h-[72px] flex items-center px-6 border-b border-gray-100 gap-3 cursor-pointer group" @click="store.navigate('dashboard')">
                    <div class="w-9 h-9 transition transform group-hover:scale-105">
                        <img src="./assets/logo.png" alt="Logo" class="w-full h-full object-contain drop-shadow-sm">
                    </div>
                    <span class="text-xl font-black text-gray-900 tracking-tight">Lexi<span class="text-amber-500">Learn</span></span>
                </div>
                
                <!-- Navigation -->
                <div class="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
                    <button @click="store.navigate('dashboard')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group" :class="store.currentRoute === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'">
                        <i data-lucide="layout-dashboard" class="w-5 h-5 transition-transform group-hover:scale-110" :class="store.currentRoute === 'dashboard' ? 'text-indigo-600' : ''"></i>
                        <span>Tổng quan</span>
                    </button>
                    
                    <button @click="store.navigate('lexilearn-dashboard')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group mt-2" :class="store.currentRoute === 'lexilearn-dashboard' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'text-gray-500 hover:bg-amber-50 hover:text-amber-700'">
                        <i data-lucide="crown" class="w-5 h-5 transition-transform group-hover:scale-110" :class="store.currentRoute === 'lexilearn-dashboard' ? 'text-amber-500 fill-amber-500' : 'text-amber-400'"></i>
                        <span>LexiLearn Pro</span>
                    </button>
                    
                    <div class="pt-4 pb-2">
                        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider px-3">Học tập</p>
                    </div>
                    <button @click="store.navigate('roadmap')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group" :class="store.currentRoute === 'roadmap' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'">
                        <i data-lucide="map" class="w-5 h-5 transition-transform group-hover:scale-110" :class="store.currentRoute === 'roadmap' ? 'text-indigo-600' : ''"></i>
                        <span>Lộ trình</span>
                    </button>
                    <button @click="store.navigate('guide')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group" :class="store.currentRoute === 'guide' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'">
                        <i data-lucide="book-open" class="w-5 h-5 transition-transform group-hover:scale-110" :class="store.currentRoute === 'guide' ? 'text-indigo-600' : ''"></i>
                        <span>Hướng dẫn</span>
                    </button>
                    <button @click="store.navigate('quotes')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group" :class="store.currentRoute === 'quotes' ? 'bg-amber-50 text-amber-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'">
                        <i data-lucide="sparkles" class="w-5 h-5 transition-transform group-hover:scale-110" :class="store.currentRoute === 'quotes' ? 'text-amber-500' : 'text-amber-400'"></i>
                        <span class="flex items-center justify-between flex-1">
                            <span>Góc Động Lực</span>
                            <span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white uppercase tracking-wider">Spark</span>
                        </span>
                    </button>

                    <!-- Admin Panel Link -->
                    <button v-if="store.user?.email === 'test@test.com' || store.userProfile?.isAdmin || store.userProfile?.role === 'admin'" 
                            @click="store.navigate('admin')" 
                            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group mt-2" 
                            :class="store.currentRoute === 'admin' ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200' : 'text-gray-500 hover:bg-rose-50 hover:text-rose-700'">
                        <i data-lucide="shield" class="w-5 h-5 transition-transform group-hover:scale-110 text-rose-500"></i>
                        <span class="flex items-center justify-between flex-1">
                            <span>Admin Panel</span>
                            <span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500 text-white uppercase tracking-wider">v2.0</span>
                        </span>
                    </button>
                </div>
                
                <!-- Bottom Profile -->
                <div class="p-4 border-t border-gray-100">
                    <div class="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors" @click="store.navigate('profile')">
                        <div class="flex items-center gap-3">
                            <div class="relative w-10 h-10 shrink-0">
                                <div class="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden border-2 border-white shadow-sm">
                                    <img v-if="store.userProfile?.avatar" :src="store.userProfile.avatar" class="w-full h-full object-cover">
                                    <img v-else :src="'https://api.dicebear.com/7.x/notionists/svg?seed=' + (store.user?.email || 'user') + '&backgroundColor=transparent'" class="w-full h-full object-cover">
                                </div>
                                <!-- Equipped Badge -->
                                <div v-if="store.userProfile?.equippedBadge" 
                                     class="absolute -bottom-1 -right-1 bg-white rounded-full shadow-md w-5 h-5 flex items-center justify-center border border-amber-400 p-0.5 z-10 animate-bounce-short select-none"
                                     :title="'Huy hiệu: ' + getBadgeTitle(store.userProfile.equippedBadge)">
                                    <img v-if="getBadge3D(store.userProfile.equippedBadge)" :src="getBadge3D(store.userProfile.equippedBadge)" class="w-full h-full object-contain">
                                    <span v-else class="text-[10px]">{{ getBadgeIcon(store.userProfile.equippedBadge) }}</span>
                                </div>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-sm font-bold text-gray-900 line-clamp-1 w-24 truncate">{{ store.userProfile?.displayName || 'Học giả' }}</span>
                                <div class="flex items-center gap-1">
                                    <i data-lucide="gem" class="w-3 h-3 text-amber-500 fill-amber-500"></i>
                                    <span class="text-xs font-bold text-amber-600">{{ store.userProfile?.lexiCredit || 0 }}</span>
                                </div>
                            </div>
                        </div>
                        <button @click.stop="logout" class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Đăng xuất">
                            <i data-lucide="log-out" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </aside>

            <!-- Main Content Area -->
            <div class="flex-1 flex flex-col min-w-0 shadow-inner rounded-l-3xl border-l relative transition-colors" :class="store.currentRoute === 'lexilearn-dashboard' ? 'bg-[#0B1020] border-[#1E2540]' : 'bg-white/40 backdrop-blur-sm border-white/50'">
                <!-- Mobile Header -->
                <header class="lg:hidden glass-panel-strong sticky top-0 z-40 px-4 py-3 flex justify-between items-center hide-in-focus border-b border-gray-100" v-show="['dashboard'].includes(store.currentRoute)">
                    <div class="flex items-center gap-3 cursor-pointer" @click="store.navigate('dashboard')">
                        <div class="w-8 h-8">
                            <img src="./assets/logo.png" alt="Logo" class="w-full h-full object-contain drop-shadow-sm">
                        </div>
                        <span class="text-lg font-black text-gray-900">Lexi<span class="text-amber-500">Learn</span></span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 border border-amber-100 shadow-sm">
                            <i data-lucide="gem" class="w-3 h-3 text-amber-500 fill-amber-500"></i>
                            <span class="font-extrabold text-amber-600 font-mono text-xs">{{ store.userProfile?.lexiCredit || 0 }}</span>
                        </div>
                    </div>
                </header>

                <!-- Floating Back Button for Focus Mode & AI Tools -->
                <button v-if="!['dashboard', 'lexilearn-dashboard'].includes(store.currentRoute)" 
                        @click="store.navigate('dashboard')"
                        class="fixed top-4 left-4 z-50 w-10 h-10 rounded-2xl bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-100 transition-all hover:scale-105" title="Quay lại Dashboard">
                    <i data-lucide="arrow-left" class="w-5 h-5"></i>
                </button>

            <main id="main-content" tabindex="-1" class="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 lg:p-8 relative z-10" :class="store.currentRoute === 'lexilearn-dashboard' ? 'p-0 sm:p-0 lg:p-0' : ''">
                <Dashboard v-if="store.currentRoute === 'dashboard'" />
                <LexiLearnDashboard v-else-if="store.currentRoute === 'lexilearn-dashboard'" />
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
                <Guide v-else-if="store.currentRoute === 'guide'" />
                <Quotes v-else-if="store.currentRoute === 'quotes'" />
                <Activate v-else-if="store.currentRoute === 'activate'" />
            </main>
            </div> <!-- End Main Content Area -->

            <!-- Mobile Bottom Nav -->
            <nav aria-label="Điều hướng chính" class="mobile-nav lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white/90 backdrop-blur-xl border-t border-gray-200 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 hide-in-focus">
                <div class="grid grid-cols-4 gap-1 px-2">
                    <button @click="store.navigate('dashboard')" class="flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-colors" :class="store.currentRoute === 'dashboard' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'">
                        <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
                        <span class="text-[10px] font-semibold">Trang chủ</span>
                    </button>
                    <button @click="store.navigate('roadmap')" class="flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-colors" :class="store.currentRoute === 'roadmap' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'">
                        <i data-lucide="map" class="w-5 h-5"></i>
                        <span class="text-[10px] font-semibold">Lộ trình</span>
                    </button>
                    <button @click="store.navigate('lexilearn-dashboard')" class="flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-colors" :class="store.currentRoute === 'lexilearn-dashboard' ? 'text-amber-500' : 'text-gray-500 hover:text-gray-900'">
                        <i data-lucide="crown" class="w-5 h-5"></i>
                        <span class="text-[10px] font-semibold">Lexi Pro</span>
                    </button>
                    <button @click="store.navigate('profile')" class="flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-colors" :class="store.currentRoute === 'profile' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'">
                        <i data-lucide="user" class="w-5 h-5"></i>
                        <span class="text-[10px] font-semibold">Hồ sơ</span>
                    </button>
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
