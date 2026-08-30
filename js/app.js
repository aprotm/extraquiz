import { createApp, onMounted, onUpdated, ref, computed } from 'vue';
import { auth } from './firebase-config.js';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { store, BADGES_DICT, getBadgeById } from './store.js';
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
import LexiLearnDashboard from './components/lexilearndashboard.js';
import LexiStore from './components/lexistore.js';
import BossBattle from './components/bossbattle.js';
import CyberCipher from './components/cybercipher.js';
import AiArena from './components/aiarena.js';
import { t } from './i18n.js';

import { toasts, showToast } from './toast.js';

const App = {
    components: {
        Dashboard, DeckDetail, CreateEditDeck, Study, Quiz, Dictation, Learn, Roadmap, Reading, ParaphrasingCoach, WritingGrader, MatchingGame, AdminPanel, UserTool, Profile, FloatingLexiCredit, Guide, Quotes, LevelUpPopup, LexiLearnDashboard, LexiStore, BossBattle, CyberCipher, AiArena
    },
    setup() {
        const isLoginMode = ref(true);
        const showPassword = ref(false);
        const showConfirmPassword = ref(false);
        const rememberMe = ref(localStorage.getItem('remember_me') !== 'false');
        const authForm = ref({
            email: localStorage.getItem('saved_email') || '',
            password: '',
            confirmPassword: '',
            displayName: ''
        });

        // Password Strength Analysis
        const passwordScore = computed(() => {
            const pwd = authForm.value.password || '';
            if (!pwd) return 0;
            let score = 0;
            if (pwd.length >= 6) score++;
            if (pwd.length >= 8) score++;
            if (/[0-9]/.test(pwd)) score++;
            if (/[A-Z]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score++;
            return score;
        });

        const passwordStrengthLabel = computed(() => {
            const scores = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất an toàn'];
            return scores[passwordScore.value];
        });

        const passwordStrengthColor = computed(() => {
            const colors = ['bg-gray-300', 'bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];
            return colors[passwordScore.value];
        });

        const passwordStrengthPercent = computed(() => {
            return (passwordScore.value / 4) * 100;
        });

        const fillDemoAccount = () => {
            authForm.value.email = 'test@gmail.com';
            authForm.value.password = '123456';
            isLoginMode.value = true;
            showToast("Đã điền tài khoản thử nghiệm!", 'info');
        };

        const handleAuth = async () => {
            if (!auth) return;
            store.authError = '';
            
            // Password validation for register
            if (!isLoginMode.value) {
                if (authForm.value.password.length < 6) {
                    store.authError = "Mật khẩu phải có tối thiểu 6 ký tự.";
                    return;
                }
                if (authForm.value.password !== authForm.value.confirmPassword) {
                    store.authError = "Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.";
                    return;
                }
            }

            store.showLoading();
            try {
                if (rememberMe.value && authForm.value.email) {
                    localStorage.setItem('saved_email', authForm.value.email);
                    localStorage.setItem('remember_me', 'true');
                } else {
                    localStorage.removeItem('saved_email');
                    localStorage.setItem('remember_me', 'false');
                }

                if (isLoginMode.value) {
                    await signInWithEmailAndPassword(auth, authForm.value.email, authForm.value.password);
                    showToast("Chào mừng bạn quay trở lại LexiLearn Pro!", 'success');
                } else {
                    const cred = await createUserWithEmailAndPassword(auth, authForm.value.email, authForm.value.password);
                    if (authForm.value.displayName) {
                        await updateUserProfile(cred.user.uid, { displayName: authForm.value.displayName });
                    }
                    await createSampleDeck(cred.user.uid);
                    store.decks = await fetchDecks(cred.user.uid);
                    showToast("Tạo tài khoản thành công! Khởi tạo không gian học tập.", 'success');
                }
            } catch(e) {
                store.authError = e.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim();
            } finally {
                store.hideLoading();
            }
        };

        onMounted(() => {
            // Apply initial settings
            store.saveSettings();

            // Hash Routing Listener
            window.addEventListener('hashchange', () => {
                const hash = window.location.hash.slice(1);
                if (hash && store.currentRoute !== hash) {
                    store.navigate(hash);
                }
            });

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

                        // Sync Gemini API Key between user account profile (Firestore) and localStorage
                        if (profile.geminiApiKey) {
                            localStorage.setItem('gemini_api_key', profile.geminiApiKey);
                        } else {
                            const localKey = localStorage.getItem('gemini_api_key');
                            if (localKey && localKey.trim()) {
                                profile.geminiApiKey = localKey.trim();
                                await updateUserProfile(user.uid, { geminiApiKey: localKey.trim() });
                            }
                        }

                        store.decks = await fetchDecks(user.uid);

                        // Auto-select first deck if activeDeck is missing
                        if (!store.activeDeck && store.decks && store.decks.length > 0) {
                            store.activeDeck = store.decks[0];
                            store.activeCards = store.decks[0].cards || [];
                        }
                        
                        // Apply active theme
                        store.applyActiveTheme(profile.equippedTheme);

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
            const b = getBadgeById(id);
            return b ? (b.emoji || b.icon || '🏆') : '🏆';
        };

        const getBadgeTitle = (id) => {
            if (!id) return '';
            const b = getBadgeById(id);
            return b ? b.title : '';
        };

        const getBadge3D = (id) => {
            if (!id) return '';
            const b = getBadgeById(id);
            return b ? b.image3d : '';
        };

        // Smart Collapsible Sidebar Logic
        const isSidebarHovered = ref(false);
        const isSidebarPinned = ref(false);

        const isStudyMode = computed(() => {
            const studyRoutes = [
                'study', 'quiz', 'dictation', 'learn', 'reading', 
                'paraphrase', 'writing', 'matching', 'boss-battle', 
                'cyber-cipher', 'ai-arena', 'deck-detail'
            ];
            return studyRoutes.includes(store.currentRoute);
        });

        const isSidebarCollapsed = computed(() => {
            if (isSidebarPinned.value) return false;
            return isStudyMode.value;
        });

        const isSidebarExpandedVisual = computed(() => {
            if (!isSidebarCollapsed.value) return true;
            return isSidebarHovered.value;
        });

        const toggleSidebarPin = () => {
            isSidebarPinned.value = !isSidebarPinned.value;
        };

        return { 
            store, isLoginMode, authForm, handleAuth, logout, toasts, 
            bgImage, triggerBgUpload, handleBgUpload, removeBgImage,
            userInitial, getBadgeIcon, getBadge3D, getBadgeTitle, t, handleForgotPassword,
            showPassword, showConfirmPassword, rememberMe, passwordScore,
            passwordStrengthLabel, passwordStrengthColor, passwordStrengthPercent, fillDemoAccount,
            isSidebarHovered, isSidebarPinned, isStudyMode, isSidebarCollapsed, isSidebarExpandedVisual, toggleSidebarPin
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

        <!-- Auth Screen (Redesigned with Luxury 3D & Password Security) -->
        <div v-else-if="!store.user" class="flex-1 flex items-center justify-center min-h-screen p-4 relative overflow-hidden bg-[#0A0E1A]">
            <!-- Ambient Background Glows -->
            <div class="absolute top-10 left-10 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

            <div class="w-full max-w-5xl mx-auto flex flex-col lg:flex-row rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative z-10 bg-[#111827]">
                
                <!-- Left Branding Panel (Cyber & 3D Luxury) -->
                <div class="hidden lg:flex flex-col justify-between p-10 lg:p-12 flex-1 relative overflow-hidden text-white" style="background: linear-gradient(145deg, #1E1B4B, #0F172A);">
                    <div class="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div class="relative z-10">
                        <div class="flex items-center gap-3 mb-10">
                            <div class="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 shadow-lg p-1">
                                <img src="./assets/logo.png" alt="Logo" class="w-full h-full object-contain filter drop-shadow">
                            </div>
                            <div>
                                <span class="text-white font-black text-2xl tracking-tight">Lexi<span class="text-amber-400">Learn</span></span>
                                <span class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 uppercase tracking-wider">PRO AI</span>
                            </div>
                        </div>

                        <h1 class="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight mb-4">
                            Chinh Phục Ngôn Ngữ &<br>
                            <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400">Bứt Phá Trí Tuệ Cùng AI</span>
                        </h1>
                        <p class="text-purple-200/90 text-sm leading-relaxed max-w-md">
                            Hệ sinh thái Flashcard Spaced Repetition thông minh, Đấu trường Arcade Games kịch tính, và Trợ lý AI cá nhân hóa toàn diện.
                        </p>
                    </div>

                    <!-- 3D Feature Highlights -->
                    <div class="relative z-10 space-y-4 my-8">
                        <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition">
                            <div class="w-9 h-9 shrink-0 flex items-center justify-center">
                                <img src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Card%20index/3D/card_index_3d.png" class="w-full h-full object-contain filter drop-shadow">
                            </div>
                            <div class="text-xs font-semibold text-gray-200">
                                Thuật toán Lặp lại Ngắt quãng <span class="text-amber-300 font-bold">(SRS / SM-2)</span> tối ưu hóa trí nhớ dài hạn.
                            </div>
                        </div>

                        <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition">
                            <div class="w-9 h-9 shrink-0 flex items-center justify-center">
                                <img src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/High%20voltage/3D/high_voltage_3d.png" class="w-full h-full object-contain filter drop-shadow">
                            </div>
                            <div class="text-xs font-semibold text-gray-200">
                                Đấu trường Arcade Game: <span class="text-rose-300 font-bold">Đấu Trùm Speed, Cyber Cipher & AI Duel 1v1</span>.
                            </div>
                        </div>

                        <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition">
                            <div class="w-9 h-9 shrink-0 flex items-center justify-center">
                                <img src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Pen/3D/pen_3d.png" class="w-full h-full object-contain filter drop-shadow">
                            </div>
                            <div class="text-xs font-semibold text-gray-200">
                                Máy Chấm Essay AI chuẩn IELTS & Huấn luyện viên <span class="text-cyan-300 font-bold">Paraphrase Band 8.0+</span>.
                            </div>
                        </div>

                        <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition">
                            <div class="w-9 h-9 shrink-0 flex items-center justify-center">
                                <img src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Trophy/3D/trophy_3d.png" class="w-full h-full object-contain filter drop-shadow">
                            </div>
                            <div class="text-xs font-semibold text-gray-200">
                                Bảng Phong Thần 28 Cấp Bậc & Bộ Sưu Tập Huy Hiệu 3D vinh danh.
                            </div>
                        </div>
                    </div>

                    <!-- Footer note -->
                    <div class="relative z-10 text-[11px] text-gray-400 font-mono flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        <span>Mạng lưới học tập đám mây an toàn & mã hóa 256-bit</span>
                    </div>
                </div>
                
                <!-- Right Form Panel (Glassmorphic Light Theme) -->
                <div class="flex-1 lg:max-w-md bg-white p-8 sm:p-10 flex flex-col justify-center select-none">
                    
                    <!-- Mobile Logo -->
                    <div class="mb-6 lg:hidden flex items-center gap-3">
                        <div class="w-10 h-10 rounded-2xl flex items-center justify-center bg-indigo-50 shadow-sm overflow-hidden p-1 border border-indigo-100">
                            <img src="./assets/logo.png" alt="Logo" class="w-full h-full object-contain">
                        </div>
                        <span class="font-black text-xl text-gray-900">Lexi<span class="text-amber-500">Learn</span> <span class="text-xs text-indigo-600 uppercase font-black">Pro</span></span>
                    </div>

                    <!-- Top Segment Switcher -->
                    <div class="flex items-center p-1 bg-gray-100 rounded-2xl mb-6">
                        <button type="button" 
                                @click="isLoginMode = true; store.authError = ''" 
                                class="flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                                :class="isLoginMode ? 'bg-white text-indigo-600 shadow-md scale-100 font-black' : 'text-gray-500 hover:text-gray-900'">
                            <i class="fa-solid fa-right-to-bracket"></i>
                            <span>Đăng Nhập</span>
                        </button>
                        <button type="button" 
                                @click="isLoginMode = false; store.authError = ''" 
                                class="flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                                :class="!isLoginMode ? 'bg-white text-indigo-600 shadow-md scale-100 font-black' : 'text-gray-500 hover:text-gray-900'">
                            <i class="fa-solid fa-user-plus"></i>
                            <span>Đăng Ký Mới</span>
                        </button>
                    </div>

                    <!-- Header Title -->
                    <div class="mb-6">
                        <h2 class="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <span>{{ isLoginMode ? 'Chào mừng trở lại' : 'Khởi tạo tài khoản' }}</span>
                            <img src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Waving%20hand/Default/3D/waving_hand_3d_default.png" class="w-6 h-6 object-contain inline-block filter drop-shadow-sm animate-wiggle">
                        </h2>
                        <p class="text-gray-500 text-xs mt-1">
                            {{ isLoginMode ? 'Tiếp tục chuỗi ngày học tập và tích lũy LexiCredit.' : 'Bắt đầu hành trình nâng cao phản xạ tiếng Anh hôm nay.' }}
                        </p>
                    </div>

                    <!-- Form -->
                    <form @submit.prevent="handleAuth" class="space-y-4">
                        
                        <!-- Display Name (Register only) -->
                        <div v-if="!isLoginMode" class="animate-fade-in">
                            <label class="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Họ & Tên hiển thị</label>
                            <div class="relative">
                                <i class="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                                <input type="text" v-model="authForm.displayName" placeholder="Nguyễn Văn A" class="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition font-medium">
                            </div>
                        </div>

                        <!-- Email Field -->
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Địa chỉ Email</label>
                            <div class="relative">
                                <i class="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                                <input type="email" v-model="authForm.email" required placeholder="name@example.com" class="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition font-medium">
                            </div>
                        </div>

                        <!-- Password Field -->
                        <div>
                            <div class="flex justify-between items-center mb-1.5">
                                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Mật khẩu</label>
                                <button v-if="isLoginMode" type="button" @click="handleForgotPassword" class="text-xs text-indigo-600 hover:text-indigo-800 font-bold focus:outline-none transition">
                                    Quên mật khẩu?
                                </button>
                            </div>
                            <div class="relative">
                                <i class="fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                                <input :type="showPassword ? 'text' : 'password'" v-model="authForm.password" required placeholder="Nhập mật khẩu" class="w-full pl-10 pr-11 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition font-medium">
                                
                                <!-- Show / Hide Password Toggle -->
                                <button type="button" @click="showPassword = !showPassword" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 focus:outline-none p-1 transition" title="Ẩn/Hiện mật khẩu">
                                    <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" class="text-sm"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Confirm Password (Register only) -->
                        <div v-if="!isLoginMode" class="animate-fade-in">
                            <label class="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Xác nhận mật khẩu</label>
                            <div class="relative">
                                <i class="fa-solid fa-shield-halved absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                                <input :type="showConfirmPassword ? 'text' : 'password'" v-model="authForm.confirmPassword" required placeholder="Nhập lại mật khẩu" class="w-full pl-10 pr-11 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition font-medium">
                                
                                <!-- Show / Hide Confirm Password Toggle -->
                                <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 focus:outline-none p-1 transition" title="Ẩn/Hiện mật khẩu xác nhận">
                                    <i :class="showConfirmPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" class="text-sm"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Password Strength Meter (Register only) -->
                        <div v-if="!isLoginMode && authForm.password" class="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 animate-fade-in">
                            <div class="flex items-center justify-between text-[11px] font-bold">
                                <span class="text-gray-500">Độ an toàn mật khẩu:</span>
                                <span :class="passwordScore >= 3 ? 'text-emerald-600' : (passwordScore >= 2 ? 'text-amber-600' : 'text-rose-600')">
                                    {{ passwordStrengthLabel }}
                                </span>
                            </div>
                            <div class="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div class="h-full transition-all duration-300 rounded-full" :class="passwordStrengthColor" :style="{ width: passwordStrengthPercent + '%' }"></div>
                            </div>
                            <div class="flex flex-wrap gap-2 text-[10px] text-gray-500 pt-1">
                                <span :class="authForm.password.length >= 6 ? 'text-emerald-600 font-bold' : ''">
                                    <i :class="authForm.password.length >= 6 ? 'fa-solid fa-check' : 'fa-regular fa-circle'" class="mr-0.5"></i> >= 6 ký tự
                                </span>
                                <span :class="/[0-9]/.test(authForm.password) ? 'text-emerald-600 font-bold' : ''">
                                    <i :class="/[0-9]/.test(authForm.password) ? 'fa-solid fa-check' : 'fa-regular fa-circle'" class="mr-0.5"></i> Có chữ số
                                </span>
                                <span :class="(/[A-Z]/.test(authForm.password) || /[^A-Za-z0-9]/.test(authForm.password)) ? 'text-emerald-600 font-bold' : ''">
                                    <i :class="(/[A-Z]/.test(authForm.password) || /[^A-Za-z0-9]/.test(authForm.password)) ? 'fa-solid fa-check' : 'fa-regular fa-circle'" class="mr-0.5"></i> Chữ hoa / Ký tự đặc biệt
                                </span>
                            </div>
                        </div>

                        <!-- Remember Me Checkbox -->
                        <div class="flex items-center justify-between pt-1">
                            <label class="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-600">
                                <input type="checkbox" v-model="rememberMe" class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                                <span>Ghi nhớ đăng nhập trên thiết bị này</span>
                            </label>
                        </div>

                        <!-- Error Banner -->
                        <div v-if="store.authError" class="text-rose-600 text-xs bg-rose-50 p-3 rounded-2xl border border-rose-100 font-semibold flex items-center gap-2 animate-screen-shake">
                            <i class="fa-solid fa-triangle-exclamation text-rose-500 text-sm shrink-0"></i>
                            <span>{{ store.authError }}</span>
                        </div>

                        <!-- Submit Button -->
                        <button type="submit" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2">
                            <span>{{ isLoginMode ? 'Đăng Nhập Ngay' : 'Tạo Tài Khoản & Bắt Đầu' }}</span>
                            <i class="fa-solid fa-arrow-right text-xs"></i>
                        </button>
                    </form>

                    <!-- Quick Demo 1-Click Login Button -->
                    <div class="mt-4 pt-4 border-t border-gray-100 text-center">
                        <button type="button" @click="fillDemoAccount" class="w-full py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 border border-indigo-200">
                            <i class="fa-solid fa-rocket text-indigo-500"></i>
                            <span>Trải nghiệm nhanh (Điền tài khoản mẫu)</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>

        <!-- Main App Layout (Redesigned) -->
        <div v-else class="flex-1 flex w-full max-w-full h-full max-h-full sm:h-screen sm:max-h-screen overflow-hidden relative bg-cover bg-center transition-all duration-500" :style="bgImage ? { backgroundImage: 'url(' + bgImage + ')' } : {}">
            <a class="skip-link" href="#main-content">Chuyển đến nội dung chính</a>
            <div v-if="bgImage" class="absolute inset-0 bg-white/50 backdrop-blur-[4px] z-0 pointer-events-none"></div>

            <!-- Desktop Sidebar Spacer (Reserves space for the main content area) -->
            <div v-if="store.currentRoute !== 'lexilearn-dashboard'" 
                 class="hidden lg:block shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                 :class="isSidebarCollapsed ? 'w-[72px]' : 'w-64'">
            </div>

            <!-- Desktop Sidebar Container (Fixed left-0 with smooth hover-expand overlay) -->
            <aside v-if="store.currentRoute !== 'lexilearn-dashboard'"
                   @mouseenter="isSidebarHovered = true"
                   @mouseleave="isSidebarHovered = false"
                   class="hidden lg:flex fixed top-0 bottom-0 left-0 flex-col z-40 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-xl border-r border-gray-200/80 dark:border-[#1E2540] select-none"
                   :class="[
                       isSidebarExpandedVisual ? 'w-64 shadow-2xl dark:shadow-[0_0_35px_rgba(0,0,0,0.9)]' : 'w-[72px] shadow-sm',
                       isSidebarCollapsed && isSidebarHovered ? 'ring-1 ring-indigo-500/30' : ''
                   ]">
                
                <!-- Logo & Pin/Unpin Toggle -->
                <div class="h-[72px] flex items-center px-4 border-b border-gray-100 dark:border-[#1E2540] justify-between cursor-pointer group shrink-0">
                    <div class="flex items-center gap-3 overflow-hidden" @click="store.navigate('dashboard')">
                        <div class="w-10 h-10 shrink-0 transition transform group-hover:scale-105 flex items-center justify-center">
                            <img src="./assets/logo.png" alt="Logo" class="w-full h-full object-contain drop-shadow-md">
                        </div>
                        <div class="whitespace-nowrap transition-all duration-300 overflow-hidden"
                             :class="isSidebarExpandedVisual ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none w-0'">
                            <div class="flex items-center gap-1.5">
                                <span class="text-lg font-black text-gray-900 dark:text-white tracking-tight">Lexi<span class="text-amber-500">Learn</span></span>
                                <span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white uppercase tracking-wider shadow-sm">PRO</span>
                            </div>
                            <p class="text-[10px] text-gray-500 dark:text-gray-400 font-bold tracking-wide">Neuro-Cognitive Lab</p>
                        </div>
                    </div>

                    <!-- Pin/Unpin button (visible when expanded in study mode) -->
                    <button v-if="isStudyMode && isSidebarExpandedVisual" 
                            @click.stop="toggleSidebarPin"
                            class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-xs"
                            :title="isSidebarPinned ? 'Bỏ ghim (Tự động thu gọn khi học)' : 'Ghim menu mở rộng cố định'">
                        <i class="fa-solid" :class="isSidebarPinned ? 'fa-thumbtack text-indigo-600 dark:text-indigo-400 rotate-45' : 'fa-thumbtack'"></i>
                    </button>
                </div>
                
                <!-- Navigation Items -->
                <div class="flex-1 overflow-y-auto py-5 px-3 space-y-1.5 custom-scrollbar">
                    <!-- Dashboard -->
                    <button @click="store.navigate('dashboard')" 
                            class="w-full flex items-center rounded-xl text-sm font-semibold transition-all group relative"
                            :class="[
                                isSidebarExpandedVisual ? 'px-3 py-2.5 gap-3' : 'justify-center py-3 px-0',
                                store.currentRoute === 'dashboard' 
                                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold' 
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100'
                            ]"
                            :title="!isSidebarExpandedVisual ? 'Tổng quan' : ''">
                        <i data-lucide="layout-dashboard" class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" :class="store.currentRoute === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : ''"></i>
                        <span class="whitespace-nowrap transition-all duration-300 overflow-hidden"
                              :class="isSidebarExpandedVisual ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 hidden'">
                            Tổng quan
                        </span>
                    </button>
                    
                    <!-- Pro Hub -->
                    <button @click="store.navigate('lexilearn-dashboard')" 
                            class="w-full flex items-center rounded-xl text-sm font-semibold transition-all group relative mt-1"
                            :class="[
                                isSidebarExpandedVisual ? 'px-3 py-2.5 gap-3' : 'justify-center py-3 px-0',
                                store.currentRoute === 'lexilearn-dashboard' 
                                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' 
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400'
                            ]"
                            :title="!isSidebarExpandedVisual ? 'Chế Độ Pro' : ''">
                        <i data-lucide="crown" class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" :class="store.currentRoute === 'lexilearn-dashboard' ? 'text-amber-500 fill-amber-500' : 'text-amber-400'"></i>
                        <span class="whitespace-nowrap transition-all duration-300 overflow-hidden"
                              :class="isSidebarExpandedVisual ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 hidden'">
                            Chế Độ Pro
                        </span>
                    </button>

                    <!-- Store (Admin Test Only) -->
                    <button v-if="store.user?.email === 'test@test.com' || store.userProfile?.isAdmin || store.userProfile?.role === 'admin'"
                            @click="store.navigate('store')" 
                            class="w-full flex items-center rounded-xl text-sm font-semibold transition-all group relative mt-1"
                            :class="[
                                isSidebarExpandedVisual ? 'px-3 py-2.5 gap-3' : 'justify-center py-3 px-0',
                                store.currentRoute === 'store' || store.currentRoute === 'lexistore'
                                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' 
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400'
                            ]"
                            :title="!isSidebarExpandedVisual ? 'Cửa Hàng (Admin)' : ''">
                        <i data-lucide="shopping-bag" class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" :class="store.currentRoute === 'store' ? 'text-amber-500' : 'text-amber-400'"></i>
                        <span class="flex items-center justify-between flex-1 whitespace-nowrap transition-all duration-300 overflow-hidden"
                              :class="isSidebarExpandedVisual ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 hidden'">
                            <span>Cửa Hàng</span>
                            <span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white uppercase tracking-wider">Test</span>
                        </span>
                    </button>
                    
                    <!-- Section Title (Học Tập) -->
                    <div class="pt-3 pb-1">
                        <div v-if="isSidebarExpandedVisual" class="px-3 transition-opacity duration-300">
                            <p class="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Học tập</p>
                        </div>
                        <div v-else class="w-8 h-[1px] bg-gray-200 dark:bg-gray-800 mx-auto my-1"></div>
                    </div>

                    <!-- Roadmap -->
                    <button @click="store.navigate('roadmap')" 
                            class="w-full flex items-center rounded-xl text-sm font-semibold transition-all group relative"
                            :class="[
                                isSidebarExpandedVisual ? 'px-3 py-2.5 gap-3' : 'justify-center py-3 px-0',
                                store.currentRoute === 'roadmap' 
                                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold' 
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100'
                            ]"
                            :title="!isSidebarExpandedVisual ? 'Lộ trình' : ''">
                        <i data-lucide="map" class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" :class="store.currentRoute === 'roadmap' ? 'text-indigo-600 dark:text-indigo-400' : ''"></i>
                        <span class="whitespace-nowrap transition-all duration-300 overflow-hidden"
                              :class="isSidebarExpandedVisual ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 hidden'">
                            Lộ trình
                        </span>
                    </button>

                    <!-- AI Reading Studio -->
                    <button @click="store.navigate('reading')" 
                            class="w-full flex items-center rounded-xl text-sm font-semibold transition-all group relative"
                            :class="[
                                isSidebarExpandedVisual ? 'px-3 py-2.5 gap-3' : 'justify-center py-3 px-0',
                                store.currentRoute === 'reading' 
                                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold' 
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100'
                            ]"
                            :title="!isSidebarExpandedVisual ? 'Đọc Hiểu AI' : ''">
                        <i data-lucide="file-text" class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" :class="store.currentRoute === 'reading' ? 'text-indigo-600 dark:text-indigo-400' : ''"></i>
                        <span class="flex items-center justify-between flex-1 whitespace-nowrap transition-all duration-300 overflow-hidden"
                              :class="isSidebarExpandedVisual ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 hidden'">
                            <span>Đọc Hiểu AI</span>
                            <span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-gradient-to-r from-indigo-500 to-purple-500 text-white uppercase tracking-wider">IELTS</span>
                        </span>
                    </button>

                    <!-- Guide -->
                    <button @click="store.navigate('guide')" 
                            class="w-full flex items-center rounded-xl text-sm font-semibold transition-all group relative"
                            :class="[
                                isSidebarExpandedVisual ? 'px-3 py-2.5 gap-3' : 'justify-center py-3 px-0',
                                store.currentRoute === 'guide' 
                                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold' 
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100'
                            ]"
                            :title="!isSidebarExpandedVisual ? 'Hướng dẫn' : ''">
                        <i data-lucide="book-open" class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" :class="store.currentRoute === 'guide' ? 'text-indigo-600 dark:text-indigo-400' : ''"></i>
                        <span class="whitespace-nowrap transition-all duration-300 overflow-hidden"
                              :class="isSidebarExpandedVisual ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 hidden'">
                            Hướng dẫn
                        </span>
                    </button>


                    <!-- Admin Panel Link -->
                    <button v-if="store.user?.email === 'test@test.com' || store.userProfile?.isAdmin || store.userProfile?.role === 'admin'" 
                            @click="store.navigate('admin')" 
                            class="w-full flex items-center rounded-xl text-sm font-semibold transition-all group relative mt-2" 
                            :class="[
                                isSidebarExpandedVisual ? 'px-3 py-2.5 gap-3' : 'justify-center py-3 px-0',
                                store.currentRoute === 'admin' 
                                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800' 
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 hover:text-rose-700 dark:hover:text-rose-300'
                            ]"
                            :title="!isSidebarExpandedVisual ? 'Admin Panel' : ''">
                        <i data-lucide="shield" class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110 text-rose-500"></i>
                        <span class="flex items-center justify-between flex-1 whitespace-nowrap transition-all duration-300 overflow-hidden"
                              :class="isSidebarExpandedVisual ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 hidden'">
                            <span>Admin Panel</span>
                            <span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500 text-white uppercase tracking-wider">v2.0</span>
                        </span>
                    </button>
                </div>
                
                <!-- Bottom Profile Area -->
                <div class="p-3 border-t border-gray-100 dark:border-[#1E2540] shrink-0">
                    <div class="flex items-center rounded-xl hover:bg-gray-50 cursor-pointer transition-all"
                         :class="isSidebarExpandedVisual ? 'p-2 justify-between' : 'p-1.5 justify-center'"
                         @click="store.navigate('profile')"
                         :title="!isSidebarExpandedVisual ? (store.userProfile?.displayName || store.user?.email?.split('@')[0] || 'Tài khoản') : ''">
                        <div class="flex items-center gap-3 overflow-hidden">
                            <div class="relative w-10 h-10 shrink-0 flex items-center justify-center">
                                <!-- Cyber Hexagon Neon Frame Aura -->
                                <div v-if="store.userProfile?.equippedAvatarFrame === 'frame_cyber_hex'" 
                                     class="absolute -inset-1 rounded-full border-2 border-cyan-400 border-dashed animate-spin-slow pointer-events-none shadow-[0_0_12px_rgba(34,211,238,0.7)] z-10"></div>
                                <!-- Imperial Gold Crown Frame Aura -->
                                <div v-else-if="store.userProfile?.equippedAvatarFrame === 'frame_gold_crown'" 
                                     class="absolute -inset-1 rounded-full border-2 border-amber-400 animate-pulse pointer-events-none shadow-[0_0_15px_rgba(251,191,36,0.8)] z-10"></div>
                                <div v-if="store.userProfile?.equippedAvatarFrame === 'frame_gold_crown'" 
                                     class="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-amber-500 drop-shadow-md">
                                    <i class="fa-solid fa-crown text-xs animate-bounce-short"></i>
                                </div>

                                <div class="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden border-2 border-white shadow-sm relative z-0">
                                    <img v-if="store.userProfile?.avatar" :src="store.userProfile.avatar" class="w-full h-full object-cover">
                                    <img v-else :src="'https://api.dicebear.com/7.x/notionists/svg?seed=' + (store.user?.email || 'user') + '&backgroundColor=transparent'" class="w-full h-full object-cover">
                                </div>
                                <!-- Equipped Badge -->
                                <div v-if="store.userProfile?.equippedBadge" 
                                     class="absolute -bottom-1 -right-1 bg-white rounded-full shadow-md w-5 h-5 flex items-center justify-center border border-amber-400 p-0.5 z-20 select-none"
                                     :title="'Huy hiệu: ' + getBadgeTitle(store.userProfile.equippedBadge)">
                                    <img v-if="getBadge3D(store.userProfile.equippedBadge)" :src="getBadge3D(store.userProfile.equippedBadge)" class="w-full h-full object-contain">
                                    <span v-else class="text-[10px]">{{ getBadgeIcon(store.userProfile.equippedBadge) }}</span>
                                </div>
                            </div>
                            <div class="flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300"
                                 :class="isSidebarExpandedVisual ? 'opacity-100 max-w-[110px]' : 'opacity-0 max-w-0 hidden'">
                                <span class="text-sm font-bold text-gray-900 truncate">{{ store.userProfile?.displayName || store.user?.email?.split('@')[0] || 'Tài khoản' }}</span>
                                <div class="flex items-center gap-1">
                                    <i data-lucide="gem" class="w-3 h-3 text-amber-500 fill-amber-500"></i>
                                    <span class="text-xs font-bold text-amber-600">{{ store.userProfile?.lexiCredit || 0 }}</span>
                                </div>
                            </div>
                        </div>
                        <button v-if="isSidebarExpandedVisual" 
                                @click.stop="logout" 
                                class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors" title="Đăng xuất">
                            <i data-lucide="log-out" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </aside>

            <!-- Main Content Area -->
            <div class="flex-1 flex flex-col min-w-0 shadow-inner rounded-l-3xl border-l relative transition-colors" :class="store.currentRoute === 'lexilearn-dashboard' ? 'bg-[#0B1020] border-[#1E2540]' : 'bg-white/40 dark:bg-[#0B0F19] backdrop-blur-sm border-white/50 dark:border-[#1E293B]'">
                <!-- Mobile Header -->
                <header class="lg:hidden glass-panel-strong sticky top-0 z-40 px-4 py-3 flex justify-between items-center hide-in-focus border-b border-gray-100 dark:border-[#1E2540]" v-show="['dashboard'].includes(store.currentRoute)">
                    <div class="flex items-center gap-2.5 cursor-pointer" @click="store.navigate('dashboard')">
                        <div class="w-9 h-9 shrink-0">
                            <img src="./assets/logo.png" alt="Logo" class="w-full h-full object-contain drop-shadow-md">
                        </div>
                        <div>
                            <div class="flex items-center gap-1.5">
                                <span class="text-base font-black text-gray-900 dark:text-white">Lexi<span class="text-amber-500">Learn</span></span>
                                <span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white uppercase tracking-wider shadow-sm">PRO</span>
                            </div>
                            <p class="text-[9px] text-gray-500 dark:text-gray-400 font-bold tracking-wide">Neuro-Cognitive Lab</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 shadow-sm">
                            <i data-lucide="gem" class="w-3.5 h-3.5 text-amber-500 fill-amber-500"></i>
                            <span class="font-black text-amber-600 dark:text-amber-400 font-mono text-xs">{{ store.userProfile?.lexiCredit || 0 }}</span>
                        </div>
                    </div>
                </header>

                <!-- Floating Back Button for Focus Mode & AI Tools -->
                <button v-if="!['dashboard', 'lexilearn-dashboard', 'boss-battle', 'cyber-cipher', 'ai-arena', 'matching'].includes(store.currentRoute)" 
                        @click="store.navigate('dashboard')"
                        class="fixed top-4 left-4 z-50 w-10 h-10 rounded-2xl bg-white dark:bg-[#151D30] shadow-md flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-[#1E293B] border border-gray-100 dark:border-[#222F49] transition-all hover:scale-105" title="Quay lại Dashboard">
                    <i data-lucide="arrow-left" class="w-5 h-5"></i>
                </button>

            <main id="main-content" tabindex="-1" class="flex-1 overflow-x-hidden overflow-y-auto w-full max-w-full p-4 pb-24 sm:p-6 lg:p-8 relative z-10 outline-none focus:outline-none focus:ring-0" :class="store.currentRoute === 'lexilearn-dashboard' ? 'p-0 sm:p-0 lg:p-0' : ''">
                <Dashboard v-if="store.currentRoute === 'dashboard'" />
                <LexiLearnDashboard v-else-if="store.currentRoute === 'lexilearn-dashboard'" />
                <LexiStore v-else-if="store.currentRoute === 'store' || store.currentRoute === 'lexistore'" />
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
                <BossBattle v-else-if="store.currentRoute === 'boss-battle'" />
                <CyberCipher v-else-if="store.currentRoute === 'cyber-cipher'" />
                <AiArena v-else-if="store.currentRoute === 'ai-arena'" />
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
