import { ref, computed, onMounted } from 'vue';
import { store } from '../store.js';
import { getRankFromLevel, getLevelProgressInfo } from '../ranks.js';
import { fetchCards } from '../db.js';

export default {
    setup() {
        const stats = ref(null);
        
        onMounted(() => {
            stats.value = store.getStudyStats() || { streak: 0, todayWords: 0, history: [] };
        });

        const levelProgress = computed(() => getLevelProgressInfo(store.userProfile?.totalLexiCredit || 0));
        const currentRank = computed(() => getRankFromLevel(levelProgress.value.currentLevel));
        
        const firstName = computed(() => {
            const name = store.user?.displayName || store.user?.email || 'Learner';
            return name.split('@')[0].split(' ')[0]; // Basic first name extract
        });

        const navItems = [
            { id: 'dashboard', icon: 'fa-solid fa-border-all', label: 'Dashboard', active: true }
        ];

        const themeColor = ref(localStorage.getItem('lexi_theme_color') || '#0B1020');
        const changeTheme = () => {
            const colors = ['#0B1020', '#1A1A2E', '#2D1B2E', '#16213E', '#171717'];
            const idx = colors.indexOf(themeColor.value);
            themeColor.value = colors[(idx + 1) % colors.length];
            localStorage.setItem('lexi_theme_color', themeColor.value);
        };
        
        const totalWords = computed(() => {
            return store.decks.reduce((sum, deck) => sum + (deck.cards ? deck.cards.length : deck.totalCards || 0), 0);
        });


        const badges = [
            { id: 1, name: 'First Blood', icon: 'fa-solid fa-droplet', color: 'text-red-500', bg: 'bg-red-500/20', unlocked: true },
            { id: 2, name: '7 Days Streak', icon: 'fa-solid fa-fire', color: 'text-orange-500', bg: 'bg-orange-500/20', unlocked: true },
            { id: 3, name: 'Vocab Master', icon: 'fa-solid fa-book', color: 'text-blue-500', bg: 'bg-blue-500/20', unlocked: false },
            { id: 4, name: 'Top 1%', icon: 'fa-solid fa-crown', color: 'text-yellow-500', bg: 'bg-yellow-500/20', unlocked: false, legendary: true },
            { id: 5, name: 'Lexi God', icon: 'fa-solid fa-bolt', color: 'text-purple-500', bg: 'bg-purple-500/20', unlocked: false, mythic: true }
        ];

        const generateHeatmap = () => {
            const weeks = [];
            const realHistory = store.getStudyStats()?.history || [];
            const today = new Date();
            
            for (let i = 0; i < 52; i++) {
                const week = [];
                for (let j = 0; j < 7; j++) {
                    const daysAgo = (51 - i) * 7 + (6 - j);
                    const cellDate = new Date(today);
                    cellDate.setDate(today.getDate() - daysAgo);
                    
                    let val = 0;
                    let wordCount = 0;
                    
                    if (daysAgo < realHistory.length && daysAgo >= 0) {
                        const realIdx = realHistory.length - 1 - daysAgo;
                        wordCount = realHistory[realIdx]?.words || 0;
                    } else if (i > 45 && Math.random() > 0.8) {
                        wordCount = Math.floor(Math.random() * 40) + 1;
                    }

                    if (wordCount > 50) val = 4;
                    else if (wordCount > 20) val = 3;
                    else if (wordCount > 10) val = 2;
                    else if (wordCount > 0) val = 1;

                    const d = cellDate.getDate().toString().padStart(2, '0');
                    const m = (cellDate.getMonth() + 1).toString().padStart(2, '0');
                    const y = cellDate.getFullYear();
                    const dateStr = `${d}/${m}/${y}`;
                    
                    week.push({
                        level: val,
                        words: wordCount,
                        date: dateStr
                    });
                }
                weeks.push(week);
            }
            return weeks;
        };
        const heatmapWeeks = generateHeatmap();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
        const aiCoachStats = computed(() => {
            const wordsCount = totalWords.value || 0;
            const todayWords = stats.value?.todayWords || 0;
            const baseReview = Math.min(20, Math.max(5, Math.floor(wordsCount * 0.2)));
            const reviewWords = Math.max(0, baseReview - todayWords);
            const estMins = Math.max(0, Math.ceil(reviewWords * 0.6));
            let confidence = (stats.value?.streak || 0) > 3 ? 88 : 72;
            if (reviewWords === 0) confidence = 98;
            return { reviewWords, estMins, confidence };
        });

        const dailyMissions = computed(() => {
            const todayWords = stats.value?.todayWords || 0;
            return [
                { id: 1, title: 'Learn 20 new words', max: 20, current: Math.min(20, todayWords), xp: 40 },
                { id: 2, title: 'Review 50 old words', max: 50, current: Math.min(50, Math.floor(todayWords * 1.5)), xp: 25 },
                { id: 3, title: 'Complete 1 Speaking task', max: 1, current: todayWords > 30 ? 1 : 0, xp: 50 }
            ];
        });

        const completedMissionsCount = computed(() => {
            return dailyMissions.value.filter(m => m.current >= m.max).length;
        });

        const startReview = async () => {
            store.showLoading();
            try {
                let allCards = [];
                if (store.decks && store.decks.length > 0) {
                    for (const deck of store.decks) {
                        if (deck.cards && deck.cards.length > 0) {
                            allCards = allCards.concat(deck.cards);
                        } else if (deck.id) {
                            try {
                                const fetched = await fetchCards(deck.id);
                                if (fetched && fetched.length > 0) allCards = allCards.concat(fetched);
                            } catch (e) {}
                        }
                    }
                }
                if (allCards.length === 0) {
                    allCards = [
                        { id: 'sample1', term: 'Resilience', definition: 'Khả năng phục hồi, sự kiên cường', example: 'Her resilience carried her through tough times.', status: 'learning' },
                        { id: 'sample2', term: 'Cognitive', definition: 'Thuộc về nhận thức, trí tuệ', example: 'Cognitive load affects learning speed.', status: 'learning' },
                        { id: 'sample3', term: 'Mnemonic', definition: 'Phương pháp ghi nhớ, thuật nhớ', example: 'Mnemonics help retain complex vocabulary.', status: 'learning' },
                        { id: 'sample4', term: 'Retention', definition: 'Khả năng duy trì, ghi nhớ', example: 'High retention probability prevents forgetting.', status: 'learning' }
                    ];
                }
                store.activeCards = allCards;
                store.activeDeck = { title: 'Lượt Ôn Tập AI (Spaced Repetition)' };
                store.navigate('study');
            } catch (err) {
                console.error("Start Review error", err);
            } finally {
                store.hideLoading();
            }
        };

        return { store, stats, levelProgress, currentRank, firstName, navItems, badges, heatmapWeeks, months, themeColor, changeTheme, totalWords, aiCoachStats, startReview, dailyMissions, completedMissionsCount };
    },
    template: `
        <div class="fixed inset-0 text-gray-100 flex overflow-hidden z-[100]" :style="{ backgroundColor: themeColor, fontFamily: '\\'Plus Jakarta Sans\\', sans-serif' }">
            
            <!-- SIDEBAR -->
            <div class="w-64 bg-[#0F1426] border-r border-[#1E2540] flex flex-col z-10 flex-shrink-0">
                <div class="p-6 flex items-center gap-3">
                    <div class="w-8 h-8 bg-[#6366F1] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">L</div>
                    <span class="text-xl font-bold tracking-tight text-white">LexiLearn</span>
                </div>
                
                <nav class="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto scrollbar-hide">
                    <button v-for="nav in navItems" :key="nav.id" 
                            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all"
                            :class="nav.active ? 'bg-[#1E2248] text-[#818CF8]' : 'text-gray-400 hover:text-white hover:bg-[#151930]'">
                        <i :class="nav.icon" class="text-sm w-4"></i> {{ nav.label }}
                    </button>
                    <!-- Back to ExtraQuiz button -->
                    <button @click="store.navigate('dashboard')" class="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-white hover:bg-[#151930] rounded-xl font-medium transition-colors mt-8">
                        <i class="fa-solid fa-arrow-left-long text-sm w-4"></i> Back to ExtraQuiz
                    </button>
                </nav>
            </div>

            <!-- MAIN CONTENT -->
            <div class="flex-1 flex flex-col h-full overflow-hidden relative">
                
                <!-- TOPBAR -->
                <header class="h-20 border-b border-[#1E2540] flex items-center justify-between px-8 bg-[#0B1020]/90 backdrop-blur-md z-20 flex-shrink-0">
                    <div class="relative w-[500px]">
                        <i class="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                        <input type="text" placeholder="Search vocabulary, decks, or settings..." 
                               class="w-full bg-[#151A2D] border border-[#1E2540] rounded-full py-2.5 pl-11 pr-4 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-gray-500">
                    </div>
                    <div class="flex items-center gap-6">
                        <button @click="changeTheme" class="text-gray-400 hover:text-white transition-colors relative" title="Đổi màu nền">
                            <i class="fa-solid fa-palette text-lg"></i>
                        </button>
                        <button class="text-gray-400 hover:text-white transition-colors relative" title="Thông báo">
                            <i class="fa-regular fa-bell text-lg"></i>
                        </button>
                        <div class="flex items-center gap-3 cursor-pointer">
                            <div class="text-right">
                                <div class="text-sm font-bold text-white">{{ store.user?.displayName || 'Việt Anh' }}</div>
                                <div class="text-[11px] text-gray-400 font-medium">Level {{ levelProgress.currentLevel }} · {{ currentRank.title }}</div>
                            </div>
                            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-orange-400 p-[2px] shadow-lg">
                                <img v-if="store.userProfile?.avatar" :src="store.userProfile.avatar" class="w-full h-full rounded-full object-cover">
                                <div v-else class="w-full h-full rounded-full bg-[#1E2540] flex items-center justify-center text-xs font-bold text-white">{{ firstName[0] }}</div>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- DASHBOARD SCROLL AREA -->
                <main class="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
                    <div class="max-w-[1200px] mx-auto space-y-6 relative z-10">
                        
                        <!-- ROW 1: Hero & Streak -->
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            <!-- Hero Card -->
                            <div class="lg:col-span-2 bg-[#171C35] border border-[#272D49] rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between" style="min-height: 280px;">
                                <!-- Background Glow -->
                                <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
                                
                                <div class="flex items-start justify-between relative z-10">
                                    <div class="flex items-center gap-6">
                                        <div class="w-20 h-20 rounded-full bg-indigo-900/30 flex items-center justify-center flex-shrink-0 border-4 border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                            <div class="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center overflow-hidden">
                                                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=transparent" class="w-full h-full object-cover">
                                            </div>
                                        </div>
                                        <div>
                                            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2 flex items-center gap-2">
                                                Good evening, {{ firstName }} <span class="animate-wave inline-block origin-bottom-right">👋</span>
                                            </h1>
                                            <p class="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-[250px] sm:max-w-sm pr-4">You are on fire! Complete your speaking practice to hit your daily goal.</p>
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-3 mt-4 sm:mt-0">
                                        <button @click="startReview" class="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] transition-all flex items-center justify-center gap-2 min-w-[180px]">
                                            Continue Learning <i class="fa-solid fa-play text-xs"></i>
                                        </button>
                                        <button @click="store.navigate('dashboard')" class="bg-[#242A45] hover:bg-[#2D3455] border border-[#3A4161] text-white font-bold py-3 px-6 rounded-xl transition-all min-w-[180px]">
                                            Review Mistakes
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="flex items-center gap-8 relative z-10 mt-8">
                                    <div class="flex items-center gap-2 font-bold text-sm">
                                        <i class="fa-solid fa-star text-amber-400"></i>
                                        <span class="text-white">+235 XP</span>
                                    </div>
                                    <div class="flex items-center gap-2 font-bold text-sm">
                                        <i class="fa-solid fa-fire text-orange-500"></i>
                                        <span class="text-white">{{ stats?.streak || 26 }} Days</span>
                                    </div>
                                    <div class="flex items-center gap-2 font-bold text-sm">
                                        <i class="fa-regular fa-clock text-blue-400"></i>
                                        <span class="text-white">42m</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Streak Card -->
                            <div class="bg-gradient-to-br from-[#291A25] to-[#1C1217] border border-[#3A2228] rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden" style="min-height: 280px;">
                                <div class="absolute right-6 top-6 w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.3)] border border-orange-500/30">
                                    <i class="fa-solid fa-fire text-orange-500 text-xl drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]"></i>
                                </div>
                                
                                <div>
                                    <p class="text-xs font-bold text-orange-400/80 tracking-widest uppercase mb-1">Current Streak</p>
                                    <div class="flex items-baseline gap-2">
                                        <span class="text-5xl font-black text-white tracking-tighter">{{ stats?.streak || 26 }}</span>
                                        <span class="text-lg font-bold text-gray-400">Days</span>
                                    </div>
                                </div>
                                
                                <div class="flex gap-8 mt-6 mb-8">
                                    <div>
                                        <div class="text-xs text-gray-500 font-medium mb-1">Best Streak</div>
                                        <div class="font-bold text-white">58 <span class="text-xs text-gray-400">days</span></div>
                                    </div>
                                    <div>
                                        <div class="text-xs text-gray-500 font-medium mb-1">Total Days</div>
                                        <div class="font-bold text-white">143 <span class="text-xs text-gray-400">days</span></div>
                                    </div>
                                </div>
                                
                                <div>
                                    <div class="flex justify-between text-xs font-bold mb-2">
                                        <span class="text-gray-400">Next badge: <span class="text-white">Inferno</span></span>
                                        <span class="text-gray-400"><span class="text-white">{{ stats?.streak || 26 }}</span> / 30 days</span>
                                    </div>
                                    <div class="h-1.5 w-full bg-[#180E13] rounded-full overflow-hidden">
                                        <div class="h-full bg-gradient-to-r from-orange-600 to-amber-500 rounded-full" :style="{ width: ((stats?.streak || 26) / 30 * 100) + '%' }"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ROW 2: AI Coach Insights (Lab Standard) -->
                        <div class="bg-gradient-to-br from-[#151B33] to-[#0D1226] border border-[#232A46] rounded-3xl p-8 shadow-xl relative overflow-hidden">
                            <!-- Background decorative elements for Lab look -->
                            <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                            
                            <div class="flex flex-col lg:flex-row gap-8 justify-between relative z-10">
                                <!-- Left: Text & Metrics -->
                                <div class="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div class="flex items-center gap-3 text-indigo-400 font-bold mb-4 text-sm uppercase tracking-wider">
                                            <i class="fa-solid fa-microchip"></i> AI Learning Coach 
                                            <span class="bg-indigo-500/20 text-indigo-300 py-0.5 px-2 rounded text-[10px] border border-indigo-500/30">v2.1</span>
                                        </div>
                                        <h3 class="text-2xl font-black text-white mb-3" v-if="aiCoachStats.reviewWords > 0">Đến lúc ôn tập rồi!</h3>
                                        <h3 class="text-2xl font-black text-emerald-400 mb-3" v-else>Trí nhớ vững vàng!</h3>
                                        <p class="text-gray-300 text-sm leading-relaxed mb-6 max-w-lg" v-if="aiCoachStats.reviewWords > 0">
                                            Thuật toán HLR đang theo dõi nhịp học của bạn. Theo mô hình Ebbinghaus, bạn có khoảng <span class="text-cyan-400 font-bold bg-cyan-400/10 px-1.5 py-0.5 rounded">{{ aiCoachStats.reviewWords }} từ vựng</span> đang chạm ngưỡng quên. Ôn tập ngay để giữ tỷ lệ nhớ trên 85%!
                                        </p>
                                        <p class="text-gray-300 text-sm leading-relaxed mb-6 max-w-lg" v-else>
                                            Tuyệt vời! Bạn đã hoàn thành mục tiêu ôn tập hôm nay. Trí nhớ của bạn đang được củng cố rất tốt và không có từ vựng nào có nguy cơ bị quên lãng.
                                        </p>
                                    </div>
                                    
                                    <div class="flex flex-wrap sm:flex-nowrap items-center gap-4 mt-auto">
                                        <div class="bg-[#1A2138]/80 backdrop-blur-sm rounded-2xl p-5 flex-1 border border-[#262F4D]">
                                            <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3"><i class="fa-solid fa-brain mr-1.5"></i> Độ tin cậy AI</div>
                                            <div class="flex items-end gap-4">
                                                <div class="text-3xl font-black text-white">{{ aiCoachStats.confidence }}%</div>
                                                <div class="w-full h-1.5 bg-[#1E2540] rounded-full overflow-hidden mb-2">
                                                    <div class="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]" :style="{ width: aiCoachStats.confidence + '%' }"></div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="bg-[#1A2138]/80 backdrop-blur-sm rounded-2xl p-5 flex-1 border border-[#262F4D]">
                                            <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3"><i class="fa-regular fa-clock mr-1.5"></i> Thời gian ước tính</div>
                                            <div class="text-3xl font-black text-white flex items-baseline gap-2">
                                                {{ aiCoachStats.estMins }} <span class="text-sm text-gray-500 font-bold">phút</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Right: The Forgetting Curve Graph & Action -->
                                <div class="w-full lg:w-[420px] flex flex-col justify-between">
                                    <div class="bg-[#0B1020] rounded-2xl p-5 border border-[#1E2540] mb-5 flex-1 relative overflow-hidden group">
                                        <!-- Grid background for Lab style -->
                                        <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50"></div>
                                        
                                        <div class="relative z-10 flex items-center justify-between mb-4">
                                            <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Đường cong trí nhớ HLR</span>
                                            <span v-if="aiCoachStats.reviewWords > 0" class="px-2 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-bold rounded border border-rose-500/20 flex items-center gap-1.5">
                                                <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Báo động
                                            </span>
                                            <span v-else class="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20 flex items-center gap-1.5">
                                                <i class="fa-solid fa-shield-check"></i> An toàn
                                            </span>
                                        </div>
                                        
                                        <!-- Larger, clearer SVG Chart -->
                                        <div class="w-full h-32 relative z-10 mt-2">
                                            <svg viewBox="0 0 300 120" class="w-full h-full overflow-visible">
                                                <defs>
                                                    <linearGradient id="largeCurveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stop-color="#818CF8" />
                                                        <stop offset="50%" stop-color="#22D3EE" />
                                                        <stop offset="100%" stop-color="#F43F5E" />
                                                    </linearGradient>
                                                </defs>
                                                <!-- Y-Axis Labels -->
                                                <text x="0" y="10" fill="#4B5563" font-size="9" font-family="monospace" text-anchor="start">100%</text>
                                                <text x="0" y="60" fill="#4B5563" font-size="9" font-family="monospace" text-anchor="start">85%</text>
                                                <text x="0" y="110" fill="#4B5563" font-size="9" font-family="monospace" text-anchor="start">60%</text>
                                                
                                                <!-- Grid Lines -->
                                                <line x1="30" y1="5" x2="300" y2="5" stroke="#1E2540" stroke-width="1" />
                                                <line x1="30" y1="55" x2="300" y2="55" stroke="#1E2540" stroke-dasharray="4,4" stroke-width="1" />
                                                <line x1="30" y1="105" x2="300" y2="105" stroke="#1E2540" stroke-width="1" />
                                                
                                                <!-- The Curve -->
                                                <path d="M 30 5 Q 120 20, 240 75 T 300 100" fill="none" stroke="url(#largeCurveGrad)" stroke-width="4" stroke-linecap="round" />
                                                
                                                <!-- Pulse point changes color based on status -->
                                                <circle cx="240" cy="75" r="4" :fill="aiCoachStats.reviewWords > 0 ? '#F43F5E' : '#10B981'" class="animate-ping opacity-75" />
                                                <circle cx="240" cy="75" r="4" :fill="aiCoachStats.reviewWords > 0 ? '#F43F5E' : '#10B981'" stroke="#1E2540" stroke-width="2" />
                                                
                                                <!-- Tooltip -->
                                                <g transform="translate(215, 45)">
                                                    <rect width="50" height="20" rx="4" :fill="aiCoachStats.reviewWords > 0 ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)'" :stroke="aiCoachStats.reviewWords > 0 ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'" stroke-width="1" />
                                                    <text x="25" y="14" :fill="aiCoachStats.reviewWords > 0 ? '#F43F5E' : '#10B981'" font-size="9" font-weight="bold" font-family="sans-serif" text-anchor="middle">Pr: {{ aiCoachStats.reviewWords > 0 ? '85%' : '98%' }}</text>
                                                </g>
                                            </svg>
                                        </div>
                                    </div>
                                    
                                    <!-- Call to Action Button changes style if completed -->
                                    <button v-if="aiCoachStats.reviewWords > 0" @click="startReview" class="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm uppercase tracking-widest rounded-2xl shadow-[0_10px_25px_-5px_rgba(99,102,241,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_35px_-5px_rgba(99,102,241,0.6)] flex items-center justify-center gap-2 mt-4 relative overflow-hidden group">
                                        <span class="relative z-10">Bắt đầu ôn tập ngay</span>
                                        <i class="fa-solid fa-arrow-right relative z-10 transition-transform group-hover:translate-x-2"></i>
                                        <div class="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                    </button>
                                    <button v-else @click="startReview" class="w-full py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-sm uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 mt-4">
                                        <span>Tiếp tục học thêm (Tùy chọn)</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- ROW 3: Stats -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            <!-- Daily Missions -->
                            <div class="bg-[#151A2D] border border-[#1E2540] rounded-3xl p-6">
                                <div class="flex items-start justify-between mb-6">
                                    <div>
                                        <h3 class="font-bold text-white text-base mb-1">Daily Missions</h3>
                                        <p class="text-xs text-gray-400">{{ completedMissionsCount }} of {{ dailyMissions.length }} completed</p>
                                    </div>
                                    <div class="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-400 text-xs font-bold border border-indigo-500/20">
                                        {{ completedMissionsCount }}/{{ dailyMissions.length }}
                                    </div>
                                </div>
                                <div class="space-y-3">
                                    <div v-for="mission in dailyMissions" :key="mission.id" class="bg-[#1A2138] border border-[#262F4D] rounded-xl p-4 flex items-center gap-3 relative overflow-hidden group">
                                        <div v-if="mission.current >= mission.max" class="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                                            <i class="fa-solid fa-check text-[10px]"></i>
                                        </div>
                                        <div v-else class="w-6 h-6 rounded-full border-2 border-[#333E66] flex items-center justify-center flex-shrink-0 relative">
                                            <svg class="absolute inset-0 w-full h-full -rotate-90">
                                                <circle cx="12" cy="12" r="11" fill="none" stroke="#6366F1" stroke-width="2" :stroke-dasharray="2 * Math.PI * 11" :stroke-dashoffset="(2 * Math.PI * 11) * (1 - mission.current / mission.max)" class="transition-all duration-1000"></circle>
                                            </svg>
                                        </div>
                                        
                                        <div class="flex-1 min-w-0">
                                            <div class="text-sm font-bold text-white truncate transition-colors" :class="{'line-through opacity-70 text-gray-400': mission.current >= mission.max}">{{ mission.title }}</div>
                                            <div class="flex items-center gap-2 mt-0.5">
                                                <div class="text-[10px] font-bold" :class="mission.current >= mission.max ? 'text-indigo-400' : 'text-gray-500'">+{{ mission.xp }} XP</div>
                                                <div v-if="mission.current < mission.max" class="text-[9px] text-gray-500 font-medium">
                                                    {{ mission.current }} / {{ mission.max }}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Progress Background -->
                                        <div v-if="mission.current > 0 && mission.current < mission.max" class="absolute left-0 bottom-0 h-0.5 bg-indigo-500 transition-all duration-1000" :style="{ width: (mission.current / mission.max * 100) + '%' }"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Vocabulary Stats -->
                            <div class="bg-[#151A2D] border border-[#1E2540] rounded-3xl p-6 flex items-center justify-between">
                                <div>
                                    <h3 class="font-bold text-white text-base mb-1">Vocabulary Stats</h3>
                                    <p class="text-xs text-gray-400">Total: {{ totalWords }} words</p>
                                    <div class="mt-4 space-y-2">
                                        <div class="flex items-center gap-2 text-xs font-medium text-gray-400">
                                            <div class="w-2 h-2 rounded-full bg-indigo-500"></div> Passive ({{ Math.floor(totalWords * 0.66) }})
                                        </div>
                                        <div class="flex items-center gap-2 text-xs font-medium text-gray-400">
                                            <div class="w-2 h-2 rounded-full bg-green-400"></div> Active ({{ Math.ceil(totalWords * 0.34) }})
                                        </div>
                                    </div>
                                </div>
                                <div class="w-20 h-20 rounded-full flex-shrink-0 shadow-lg" style="background: conic-gradient(#4ADE80 0% 34%, #6366F1 34% 100%);"></div>
                            </div>

                            <!-- Activation Rate -->
                            <div class="bg-[#151A2D] border border-[#1E2540] rounded-3xl p-6 flex flex-col justify-between">
                                <div class="flex items-start justify-between">
                                    <div>
                                        <h3 class="font-bold text-white text-base mb-1">Activation Rate</h3>
                                        <p class="text-xs text-gray-400">Active vs Passive vocabulary</p>
                                    </div>
                                    <div class="text-green-400 font-bold text-sm bg-green-900/30 px-2 py-1 rounded">34%</div>
                                </div>
                                <div class="mt-8">
                                    <div class="flex justify-between text-[10px] font-bold text-gray-500 uppercase mb-2">
                                        <span>Passive</span>
                                        <span>Active</span>
                                    </div>
                                    <div class="h-2 w-full bg-[#1E2540] rounded-full overflow-hidden flex">
                                        <div class="h-full bg-indigo-500" style="width: 66%"></div>
                                        <div class="h-full bg-green-400" style="width: 34%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ROW 4: Heatmap & LexiCredit -->
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <!-- Heatmap (col-span-2) -->
                            <div class="lg:col-span-2 bg-[#151A2D] border border-[#1E2540] rounded-3xl p-6">
                                <div class="mb-4">
                                    <h3 class="font-bold text-white text-lg mb-1">Learning Heatmap</h3>
                                    <p class="text-xs text-gray-400">Your 365-day consistency</p>
                                </div>
                                <div class="overflow-x-auto custom-scrollbar pb-2 pt-6 -mt-6">
                                    <div class="min-w-[700px]">
                                        <div class="flex text-xs text-gray-500 font-semibold mb-2 ml-8 justify-between pr-4">
                                            <span v-for="(m, i) in months" :key="i">{{m}}</span>
                                        </div>
                                        <div class="flex gap-2">
                                            <div class="flex flex-col gap-[6px] text-[10px] text-gray-500 font-semibold mt-1">
                                                <span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span>Sun</span>
                                            </div>
                                            <div class="flex gap-1.5 flex-1">
                                                <div v-for="(week, wI) in heatmapWeeks" :key="wI" class="flex flex-col gap-1.5">
                                                    <div v-for="(day, dI) in week" :key="dI" 
                                                         class="w-3 h-3 rounded-sm border transition-all hover:scale-125 cursor-pointer relative group"
                                                         :class="[
                                                             day.level === 0 ? 'bg-[#161b22] border-[#202632]' : '',
                                                             day.level === 1 ? 'bg-[#0e4429] border-[#0e4429]' : '',
                                                             day.level === 2 ? 'bg-[#006d32] border-[#006d32]' : '',
                                                             day.level === 3 ? 'bg-[#26a641] border-[#26a641]' : '',
                                                             day.level === 4 ? 'bg-[#39d353] border-[#39d353]' : ''
                                                         ]">
                                                         <div class="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-white text-gray-800 text-xs font-medium px-3 py-2 rounded-lg shadow-xl border border-gray-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                                                             {{ day.words }} từ học ngày {{ day.date }}
                                                         </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex items-center justify-end gap-1.5 text-[10px] text-gray-500 mt-3 pr-4">
                                            <span>Ít</span>
                                            <div class="w-3 h-3 rounded-sm bg-[#161b22] border border-[#202632]"></div>
                                            <div class="w-3 h-3 rounded-sm bg-[#0e4429]"></div>
                                            <div class="w-3 h-3 rounded-sm bg-[#006d32]"></div>
                                            <div class="w-3 h-3 rounded-sm bg-[#26a641]"></div>
                                            <div class="w-3 h-3 rounded-sm bg-[#39d353]"></div>
                                            <span>Nhiều</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- LexiCredit -->
                            <div class="bg-[#151A2D] border border-[#1E2540] rounded-3xl p-6 flex flex-col justify-between">
                                <div class="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 class="font-bold text-white text-lg mb-1">LexiCredit</h3>
                                        <p class="text-xs text-gray-400">Your wallet balance</p>
                                    </div>
                                    <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                        <i class="fa-solid fa-coins text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"></i>
                                    </div>
                                </div>
                                <div class="mb-6">
                                    <span class="text-4xl font-black text-white">{{ store.userProfile?.lexiCredit || 1250 }}</span>
                                    <span class="text-gray-400 ml-1 text-sm font-bold">LC</span>
                                </div>
                                <div class="grid grid-cols-2 gap-4 mb-6">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <i class="fa-solid fa-arrow-trend-up text-green-500 text-xs"></i>
                                        </div>
                                        <div>
                                            <p class="text-[10px] uppercase text-gray-500 font-bold">Earned</p>
                                            <p class="text-sm font-bold text-white">+45</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                            <i class="fa-solid fa-arrow-trend-down text-red-500 text-xs"></i>
                                        </div>
                                        <div>
                                            <p class="text-[10px] uppercase text-gray-500 font-bold">Spent</p>
                                            <p class="text-sm font-bold text-white">-10</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3 bg-[#1A2138] p-3 rounded-2xl border border-[#262F4D]">
                                    <i class="fa-solid fa-award text-gray-400"></i>
                                    <div class="flex-1">
                                        <p class="text-[10px] text-gray-400 font-bold uppercase">Current Level</p>
                                        <p class="text-sm font-bold text-white">Silver Tier</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ROW 5: Badge Showcase -->
                        <div class="bg-[#151A2D] border border-[#1E2540] rounded-3xl p-6 overflow-hidden">
                            <div class="mb-4">
                                <h3 class="font-bold text-white text-lg mb-1">Badge Showcase</h3>
                                <p class="text-xs text-gray-400">Your achievements</p>
                            </div>
                            <div class="flex gap-4 overflow-x-auto custom-scrollbar pb-4">
                                <div v-for="badge in badges" :key="badge.id" 
                                     class="relative flex-shrink-0 flex flex-col items-center gap-2 p-4 w-28 rounded-2xl border transition-all"
                                     :class="[
                                        !badge.unlocked ? 'bg-[#1A2138]/50 border-[#262F4D]/50 opacity-50 grayscale' :
                                        badge.mythic ? 'bg-[#1A2138] border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]' :
                                        badge.legendary ? 'bg-[#1A2138] border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]' :
                                        'bg-[#1A2138] border-[#262F4D] hover:border-indigo-500/50'
                                     ]">
                                    <div v-if="badge.mythic" class="absolute inset-0 rounded-2xl border border-transparent" style="background: linear-gradient(to right, #ec4899, #a855f7, #6366f1) border-box; -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                                    <div class="w-12 h-12 rounded-full flex items-center justify-center" :class="badge.bg">
                                        <i :class="[badge.icon, badge.color, 'text-xl']"></i>
                                    </div>
                                    <span class="text-xs font-bold text-center text-white">{{ badge.name }}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
            
            <style>
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E2540; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2A3459; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                
                @keyframes wave {
                    0% { transform: rotate(0deg); }
                    20% { transform: rotate(14deg); }
                    40% { transform: rotate(-8deg); }
                    60% { transform: rotate(14deg); }
                    80% { transform: rotate(-4deg); }
                    100% { transform: rotate(10deg); }
                }
                .animate-wave {
                    animation: wave 2.5s infinite;
                }
            </style>
        </div>
    `
};
