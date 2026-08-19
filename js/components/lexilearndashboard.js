import { ref, computed, onMounted, onUpdated, nextTick } from 'vue';
import { store } from '../store.js';
import { getRankFromLevel, getLevelProgressInfo } from '../ranks.js';
import { fetchCards, fetchAllUserCards } from '../db.js';
import { BADGES_DICT, getBadgeById } from '../badges.js';
import { calculateRetentionProb } from '../memoryengine.js';

export default {
    setup() {
        const stats = ref(null);
        const userCards = ref([]);
        const isLoadingCards = ref(true);
        
        const loadUserMemoryData = async () => {
            stats.value = store.getStudyStats() || { streak: 0, todayWords: 0, history: [] };
            if (store.user?.uid) {
                try {
                    isLoadingCards.value = true;
                    const cards = await fetchAllUserCards(store.user.uid);
                    userCards.value = cards || [];
                } catch (e) {
                    console.error("Fetch user cards error:", e);
                    const fallback = [];
                    if (store.decks && store.decks.length > 0) {
                        store.decks.forEach(d => {
                            if (d.cards && Array.isArray(d.cards)) fallback.push(...d.cards);
                        });
                    }
                    userCards.value = fallback;
                } finally {
                    isLoadingCards.value = false;
                }
            }
            setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 100);
        };

        onMounted(() => {
            loadUserMemoryData();
        });

        onUpdated(() => {
            nextTick(() => {
                if (window.lucide) window.lucide.createIcons();
            });
        });

        const levelProgress = computed(() => {
            const totalLC = Math.max(store.userProfile?.totalLexiCredit || 0, store.userProfile?.lexiCredit || 0, ((store.userProfile?.level || 1) - 1) * 50);
            return getLevelProgressInfo(totalLC);
        });
        const currentRank = computed(() => getRankFromLevel(levelProgress.value.currentLevel));
        
        const firstName = computed(() => {
            const name = store.userProfile?.displayName || store.user?.displayName || store.user?.email || 'Learner';
            return name.split('@')[0].split(' ')[0];
        });

        const activeTab = ref('dashboard');

        // Cyberpunk Lab Ambient Theme Aura Preset (Preserves Obsidian Canvas)
        const themePresets = [
            { id: 'indigo', name: 'Neural Indigo', hex: '#6366F1', glow: 'rgba(99,102,241,0.22)', border: 'border-indigo-500/30', text: 'text-indigo-400', bg: 'bg-indigo-500', btn: 'from-indigo-600 to-purple-600' },
            { id: 'cyan', name: 'Cyber Cyan', hex: '#06B6D4', glow: 'rgba(6,182,212,0.22)', border: 'border-cyan-500/30', text: 'text-cyan-400', bg: 'bg-cyan-500', btn: 'from-cyan-600 to-blue-600' },
            { id: 'purple', name: 'Quantum Violet', hex: '#A855F7', glow: 'rgba(168,85,247,0.22)', border: 'border-purple-500/30', text: 'text-purple-400', bg: 'bg-purple-500', btn: 'from-purple-600 to-pink-600' },
            { id: 'emerald', name: 'Bio Matrix', hex: '#10B981', glow: 'rgba(16,185,129,0.22)', border: 'border-emerald-500/30', text: 'text-emerald-400', bg: 'bg-emerald-500', btn: 'from-emerald-600 to-teal-600' },
            { id: 'amber', name: 'Solar Flare', hex: '#F59E0B', glow: 'rgba(245,158,11,0.22)', border: 'border-amber-500/30', text: 'text-amber-400', bg: 'bg-amber-500', btn: 'from-amber-600 to-orange-600' },
            { id: 'rose', name: 'Laser Rose', hex: '#F43F5E', glow: 'rgba(244,63,94,0.22)', border: 'border-rose-500/30', text: 'text-rose-400', bg: 'bg-rose-500', btn: 'from-rose-600 to-red-600' }
        ];
        const currentThemeId = ref(localStorage.getItem('lexi_theme_aura') || 'indigo');
        const currentTheme = computed(() => themePresets.find(t => t.id === currentThemeId.value) || themePresets[0]);
        const cycleTheme = () => {
            const idx = themePresets.findIndex(t => t.id === currentThemeId.value);
            const next = themePresets[(idx + 1) % themePresets.length];
            currentThemeId.value = next.id;
            localStorage.setItem('lexi_theme_aura', next.id);
        };
        
        const totalWords = computed(() => {
            if (userCards.value.length > 0) return userCards.value.length;
            return store.decks.reduce((sum, deck) => sum + (deck.cards ? deck.cards.length : deck.totalCards || 0), 0);
        });

        const getBadgeIcon = (id) => {
            const b = getBadgeById(id);
            return b ? (b.emoji || b.icon || '🏆') : '🏆';
        };

        const getBadgeTitle = (id) => {
            const b = getBadgeById(id);
            return b ? b.title : '';
        };

        const getBadge3D = (id) => {
            const b = getBadgeById(id);
            return b ? b.image3d : '';
        };

        const badges = computed(() => {
            const userBadges = store.userProfile?.badges || [];
            if (userBadges.length === 0) {
                return BADGES_DICT.slice(0, 6).map((b, idx) => ({
                    id: idx,
                    badgeId: b.id,
                    name: b.title,
                    image3d: b.image3d,
                    emoji: b.emoji,
                    icon: b.icon,
                    color: 'text-amber-400',
                    bg: 'bg-amber-400/10',
                    unlocked: false,
                    isEquipped: false
                }));
            }
            return userBadges.map((bId, idx) => {
                const b = getBadgeById(bId);
                if (b) {
                    return {
                        id: idx,
                        badgeId: b.id,
                        name: b.title,
                        image3d: b.image3d,
                        emoji: b.emoji,
                        icon: b.icon,
                        color: b.color || 'text-indigo-400',
                        bg: 'bg-indigo-400/10',
                        unlocked: true,
                        isEquipped: store.userProfile?.equippedBadge === b.id,
                        legendary: b.rarity === 'legendary',
                        mythic: b.rarity === 'mythic'
                    };
                }
                return null;
            }).filter(Boolean);
        });

        // 365-Day Learning Heatmap Generator (Computed & ISO Synchronized)
        const heatmapWeeks = computed(() => {
            const weeks = [];
            const realStats = stats.value || store.getStudyStats() || { history: [], todayWords: 0 };
            const realHistory = Array.isArray(realStats.history) ? realStats.history : [];
            const today = new Date();
            
            // Build fast date lookup map
            const historyMap = {};
            realHistory.forEach(h => {
                if (h.date) {
                    historyMap[h.date] = h.words || 0;
                }
            });
            
            const todayISO = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
            if (realStats.todayWords) {
                historyMap[todayISO] = Math.max(historyMap[todayISO] || 0, realStats.todayWords);
            }

            for (let i = 0; i < 52; i++) {
                const week = [];
                for (let j = 0; j < 7; j++) {
                    const daysAgo = (51 - i) * 7 + (6 - j);
                    const cellDate = new Date(today);
                    cellDate.setDate(today.getDate() - daysAgo);

                    const y = cellDate.getFullYear();
                    const m = (cellDate.getMonth() + 1).toString().padStart(2, '0');
                    const d = cellDate.getDate().toString().padStart(2, '0');
                    const isoDate = `${y}-${m}-${d}`;
                    const displayDate = `${d}/${m}/${y}`;

                    const wordCount = historyMap[isoDate] || 0;
                    
                    let val = 0;
                    if (wordCount > 50) val = 4;
                    else if (wordCount > 20) val = 3;
                    else if (wordCount > 10) val = 2;
                    else if (wordCount > 0) val = 1;

                    week.push({
                        level: val,
                        words: wordCount,
                        date: displayDate,
                        isoDate: isoDate
                    });
                }
                weeks.push(week);
            }
            return weeks;
        });
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];

        // Real-time HLR AI Memory Engine & Decay Telemetry
        const aiCoachStats = computed(() => {
            const allCards = userCards.value;
            const total = allCards.length;
            const now = Date.now();

            if (total === 0) {
                return {
                    totalCards: 0,
                    reviewWords: 0,
                    estMins: 0,
                    avgRetention: 100,
                    daysAbsent: 0,
                    isLongAbsence: false,
                    confidence: 100,
                    curveEndY: 12,
                    isNewUser: true,
                    stabilityScore: 98,
                    activeWords: 0,
                    reinforcingWords: 0,
                    passiveWords: 0,
                    activeRate: 0,
                    halfLifeDistribution: { short: 0, medium: 0, long: 0 }
                };
            }

            let needReviewCount = 0;
            let sumRetention = 0;
            let maxDaysInactive = 0;
            let activeWords = 0;
            let reinforcingWords = 0;
            let passiveWords = 0;
            let shortHL = 0, medHL = 0, longHL = 0;

            allCards.forEach(c => {
                const lastReview = c.last_reviewed_at 
                    ? (c.last_reviewed_at.toDate ? c.last_reviewed_at.toDate().getTime() : new Date(c.last_reviewed_at).getTime()) 
                    : (c.createdAt ? (c.createdAt.toDate ? c.createdAt.toDate().getTime() : new Date(c.createdAt).getTime()) : now);
                
                const deltaMinutes = Math.max(0, (now - lastReview) / 60000);
                const daysInactive = deltaMinutes / 1440;
                if (daysInactive > maxDaysInactive) maxDaysInactive = daysInactive;

                const halfLife = c.recognition_half_life || 1440; // 1 day
                if (halfLife < 1440) shortHL++;
                else if (halfLife < 10080) medHL++;
                else longHL++;

                const pr = deltaMinutes < 1440 && !c.last_reviewed_at ? 1.0 : calculateRetentionProb(halfLife, deltaMinutes);
                sumRetention += pr;

                if (pr >= 0.80 || c.status === 'active') {
                    activeWords++;
                } else if (pr >= 0.50) {
                    reinforcingWords++;
                } else {
                    passiveWords++;
                }

                if (pr < 0.85) {
                    needReviewCount++;
                }
            });

            const rawAvg = sumRetention / total;
            const avgRetention = Math.min(100, Math.max(10, Math.round(rawAvg * 100)));
            const daysAbsent = Math.max(0, Math.round(maxDaysInactive));
            const isLongAbsence = (daysAbsent >= 3 && avgRetention < 65) || (avgRetention < 50 && needReviewCount > 0);
            const reviewWords = needReviewCount;
            const estMins = Math.max(1, Math.ceil(reviewWords * 0.5));
            const confidence = 94;
            const curveEndY = Math.min(105, Math.max(12, Math.round(8 + (100 - avgRetention) * 0.94)));
            const activeRate = Math.round((activeWords / total) * 100);
            const stabilityScore = Math.max(15, Math.round(avgRetention * 0.7 + (100 - Math.min(100, daysAbsent * 5)) * 0.3));

            return {
                totalCards: total,
                reviewWords,
                estMins,
                avgRetention,
                daysAbsent,
                isLongAbsence,
                confidence,
                curveEndY,
                isNewUser: false,
                stabilityScore,
                activeWords,
                reinforcingWords,
                passiveWords,
                activeRate,
                halfLifeDistribution: { short: shortHL, medium: medHL, long: longHL }
            };
        });

        // 7-Day Study Cadence Telemetry & Chart
        const velocity7Days = computed(() => {
            const realStats = stats.value || store.getStudyStats() || { history: [], todayWords: 0 };
            const history = Array.isArray(realStats.history) ? realStats.history : [];
            const days = [];
            const today = new Date();
            const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            
            const historyMap = {};
            history.forEach(h => {
                if (h.date) {
                    historyMap[h.date] = h.words || 0;
                }
            });
            const todayISO = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
            if (realStats.todayWords) {
                historyMap[todayISO] = Math.max(historyMap[todayISO] || 0, realStats.todayWords);
            }

            let maxWords = 15;
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const y = d.getFullYear();
                const m = (d.getMonth() + 1).toString().padStart(2, '0');
                const day = d.getDate().toString().padStart(2, '0');
                const isoDate = `${y}-${m}-${day}`;
                const dStr = `${day}/${m}`;
                const dayOfWeek = dayNames[d.getDay()];
                
                const words = historyMap[isoDate] || 0;
                if (words > maxWords) maxWords = words;
                
                days.push({
                    label: dayOfWeek,
                    date: dStr,
                    words,
                    isToday: i === 0
                });
            }
            
            const totalWeekWords = days.reduce((sum, d) => sum + d.words, 0);
            const avgWordsPerDay = Math.round(totalWeekWords / 7);

            return {
                days: days.map(d => ({
                    ...d,
                    heightPercent: Math.min(100, Math.max(8, Math.round((d.words / maxWords) * 100)))
                })),
                maxWords,
                totalWeekWords,
                avgWordsPerDay
            };
        });

        // Cognitive Radar Matrix HUD (5 Neural Dimensions)
        const cognitiveRadar = computed(() => {
            const p = store.userProfile?.learning_persona || {};
            const consistency = Math.min(100, Math.max(10, Math.round(p.consistency || 50)));
            const focus = Math.min(100, Math.max(10, Math.round(p.focus || 50)));
            const persistence = Math.min(100, Math.max(10, Math.round(p.persistence || 50)));
            const metacognition = Math.min(100, Math.max(10, Math.round(p.metacognition || 50)));
            const exploration = Math.min(100, Math.max(10, Math.round(p.exploration || 50)));

            const cpi = Math.round((consistency + focus + persistence + metacognition + exploration) / 5);

            // Compute 5 polygon points around center (100, 100) with max radius 70
            const cx = 100, cy = 100, maxR = 68;
            const angles = [
                -90,        // Top: Consistency
                -18,        // Top Right: Focus
                54,         // Bottom Right: Persistence
                126,        // Bottom Left: Metacognition
                198         // Top Left: Exploration
            ];
            const values = [consistency, focus, persistence, metacognition, exploration];
            
            const polygonPoints = angles.map((ang, i) => {
                const rad = (ang * Math.PI) / 180;
                const r = (values[i] / 100) * maxR;
                const x = Math.round(cx + r * Math.cos(rad));
                const y = Math.round(cy + r * Math.sin(rad));
                return `${x},${y}`;
            }).join(' ');

            let brainwaveState = 'Beta Active Mode';
            if (focus >= 75) brainwaveState = 'Alpha Super-Focus';
            else if (metacognition >= 75) brainwaveState = 'Gamma High Insight';
            else if (persistence >= 75) brainwaveState = 'Theta Deep Resilience';

            return {
                consistency,
                focus,
                persistence,
                metacognition,
                exploration,
                cpi,
                polygonPoints,
                brainwaveState
            };
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
                if (userCards.value && userCards.value.length > 0) {
                    allCards = [...userCards.value];
                } else if (store.decks && store.decks.length > 0) {
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

        return { 
            store, stats, levelProgress, currentRank, firstName, activeTab, 
            badges, heatmapWeeks, months, currentTheme, cycleTheme, totalWords, 
            aiCoachStats, startReview, dailyMissions, completedMissionsCount,
            getBadgeIcon, getBadgeTitle, getBadge3D, userCards, isLoadingCards,
            velocity7Days, cognitiveRadar
        };
    },
    template: `
        <div class="fixed inset-0 text-gray-100 flex overflow-hidden z-[100] bg-[#070A13] selection:bg-indigo-500 selection:text-white" style="font-family: 'Plus Jakarta Sans', sans-serif;">
            
            <!-- Atmospheric Ambient Aura Glow -->
            <div class="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-20 transition-all duration-700" :style="{ backgroundColor: currentTheme.hex }"></div>
            <div class="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-15 transition-all duration-700" :style="{ backgroundColor: currentTheme.hex }"></div>

            <!-- SIDEBAR -->
            <div class="w-64 bg-[#090D18] border-r border-[#141C30] flex flex-col z-20 flex-shrink-0 select-none relative">
                <!-- Header Brand -->
                <div class="p-5 pb-4 border-b border-[#141C30] flex items-center justify-between">
                    <div class="flex items-center gap-3 cursor-pointer group" @click="store.navigate('dashboard')">
                        <div class="w-9 h-9 shrink-0 group-hover:scale-105 transition-transform">
                            <img src="./assets/logo.png" alt="Logo" class="w-full h-full object-contain drop-shadow-md">
                        </div>
                        <div>
                            <div class="flex items-center gap-1.5">
                                <span class="text-lg font-black tracking-tight text-white">Lexi<span class="text-amber-400">Learn</span></span>
                                <span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white uppercase tracking-wider shadow-sm">PRO</span>
                            </div>
                            <p class="text-[10px] text-gray-500 font-bold tracking-wide">Neuro-Cognitive Lab</p>
                        </div>
                    </div>
                </div>

                <!-- Neural Engine Status Chip -->
                <div class="mx-4 mt-3 px-3 py-1.5 rounded-xl bg-[#0F1528] border border-[#192340] flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span class="text-[10px] font-black text-emerald-400 uppercase tracking-widest">AI Engine Online</span>
                    </div>
                    <span class="text-[9px] font-mono text-gray-400">v3.4</span>
                </div>
                
                <!-- Navigation List -->
                <div class="px-4 py-3 space-y-1 overflow-y-auto custom-scrollbar flex-1">
                    <!-- Quick Back Button -->
                    <button @click="store.navigate('dashboard')" class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-[#0F1528] hover:bg-[#16203D] border border-[#192340] transition-all mb-3 group shadow-sm">
                        <span class="flex items-center gap-2">
                            <i class="fa-solid fa-arrow-left text-xs text-indigo-400 group-hover:-translate-x-1 transition-transform"></i>
                            ExtraQuiz Classic
                        </span>
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-[#1A2444] text-gray-400 font-mono">v1.0</span>
                    </button>

                    <div class="px-3 pb-1 pt-1">
                        <p class="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Trạm Điều Khiển</p>
                    </div>

                    <!-- Dashboard Pro Button (Active) -->
                    <button class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/40 shadow-sm">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/20 text-indigo-400 shadow-inner">
                                <i class="fa-solid fa-microchip text-sm"></i>
                            </div>
                            <span>Tổng quan Pro</span>
                        </div>
                        <span class="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,1)]"></span>
                    </button>

                    <!-- Roadmap Button -->
                    <button @click="store.navigate('roadmap')" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-[#0F1528] transition-all group">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-[#131A30] text-gray-400 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-colors">
                            <i class="fa-solid fa-route text-sm"></i>
                        </div>
                        <span>Lộ trình học</span>
                    </button>

                    <!-- Trophy Room / Profile Button -->
                    <button @click="store.navigate('profile')" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-[#0F1528] transition-all group">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-[#131A30] text-gray-400 group-hover:text-yellow-400 group-hover:bg-yellow-400/10 transition-colors">
                            <i class="fa-solid fa-trophy text-sm"></i>
                        </div>
                        <span>Phòng Truyền Thống</span>
                    </button>

                    <!-- Store Button (Admin Only) -->
                    <button v-if="store.user?.email === 'test@test.com' || store.userProfile?.isAdmin || store.userProfile?.role === 'admin'"
                            @click="store.navigate('store')" class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-[#0F1528] transition-all group">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-[#131A30] text-amber-400 group-hover:text-amber-300 group-hover:bg-amber-400/10 transition-colors">
                                <i class="fa-solid fa-store text-sm"></i>
                            </div>
                            <span>Cửa Hàng</span>
                        </div>
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">Test</span>
                    </button>

                    <!-- Guide Button -->
                    <button @click="store.navigate('guide')" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-[#0F1528] transition-all group">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-[#131A30] text-gray-400 group-hover:text-emerald-400 group-hover:bg-emerald-400/10 transition-colors">
                            <i class="fa-solid fa-book-open text-sm"></i>
                        </div>
                        <span>Hướng dẫn</span>
                    </button>

                    <!-- Quotes Button -->
                    <button @click="store.navigate('quotes')" class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-[#0F1528] transition-all group">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-[#131A30] text-amber-400 group-hover:text-amber-300 group-hover:bg-amber-400/10 transition-colors">
                                <i class="fa-solid fa-quote-left text-sm"></i>
                            </div>
                            <span>Góc Động Lực</span>
                        </div>
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-white uppercase tracking-wider">Quote</span>
                    </button>

                    <!-- Admin Control Button -->
                    <button v-if="store.user?.email === 'test@test.com' || store.userProfile?.isAdmin || store.userProfile?.role === 'admin'" 
                            @click="store.navigate('admin')" 
                            class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-[#0F1528] transition-all group">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-[#131A30] text-rose-400 group-hover:text-rose-300 group-hover:bg-rose-500/10 transition-colors">
                                <i class="fa-solid fa-shield-halved text-sm"></i>
                            </div>
                            <span>Admin Center</span>
                        </div>
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500 text-white uppercase tracking-wider">v2.0</span>
                    </button>

                    <!-- Lab Mini Telemetry Widget -->
                    <div class="mt-4 p-3.5 rounded-2xl bg-gradient-to-br from-[#0F1528] to-[#0A0E1C] border border-[#192340] space-y-2.5">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <i class="fa-solid fa-chart-line text-indigo-400"></i> Chỉ Số Lab
                            </span>
                            <span class="text-[10px] font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                                🔥 {{ stats?.streak || 1 }} ngày
                            </span>
                        </div>
                        <div class="grid grid-cols-2 gap-2 pt-1 border-t border-[#192340]">
                            <div class="p-2 rounded-xl bg-[#090D18] text-center border border-[#141C30]">
                                <div class="text-xs font-black text-indigo-400 font-mono">{{ totalWords }}</div>
                                <div class="text-[8px] font-bold text-gray-500 uppercase">Tổng từ</div>
                            </div>
                            <div class="p-2 rounded-xl bg-[#090D18] text-center border border-[#141C30]">
                                <div class="text-xs font-black text-emerald-400 font-mono">{{ aiCoachStats.stabilityScore }}%</div>
                                <div class="text-[8px] font-bold text-gray-500 uppercase">Độ bền HLR</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer Mini Profile -->
                <div class="p-3 border-t border-[#141C30] bg-[#070A13]">
                    <div class="flex items-center gap-3 p-2 rounded-2xl hover:bg-[#0F1528] cursor-pointer transition-all border border-transparent hover:border-[#192340] group" @click="store.navigate('profile')">
                        <div class="relative w-10 h-10 shrink-0">
                            <div class="w-full h-full rounded-full border-2 border-indigo-500/40 bg-indigo-500/20 p-0.5 overflow-hidden shadow-sm group-hover:border-indigo-400 transition-colors">
                                <img v-if="store.userProfile?.avatar" :src="store.userProfile.avatar" class="w-full h-full object-cover rounded-full">
                                <img v-else :src="'https://api.dicebear.com/7.x/notionists/svg?seed=' + (store.user?.email || 'user') + '&backgroundColor=transparent'" class="w-full h-full object-cover">
                            </div>
                            <!-- Equipped Badge -->
                            <div v-if="store.userProfile?.equippedBadge" 
                                 class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#090D18] border-2 border-amber-400 p-0.5 flex items-center justify-center shadow-md z-10 select-none"
                                 :title="'Huy hiệu: ' + getBadgeTitle(store.userProfile.equippedBadge)">
                                <img v-if="getBadge3D(store.userProfile.equippedBadge)" :src="getBadge3D(store.userProfile.equippedBadge)" class="w-full h-full object-contain">
                                <span v-else class="text-[10px]">{{ getBadgeIcon(store.userProfile.equippedBadge) }}</span>
                            </div>
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="text-xs font-extrabold text-white truncate group-hover:text-indigo-300 transition-colors leading-tight">
                                {{ store.userProfile?.displayName || firstName }}
                            </div>
                            <div class="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 mt-0.5">
                                <span class="truncate">Lv.{{ levelProgress.currentLevel }} · {{ currentRank.title }}</span>
                            </div>
                        </div>
                        <div class="text-gray-500 group-hover:text-white transition-transform group-hover:translate-x-0.5 shrink-0 pr-1">
                            <i class="fa-solid fa-chevron-right text-xs"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MAIN CONTENT -->
            <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                
                <!-- TOPBAR -->
                <header class="h-[70px] border-b border-[#141C30] flex items-center justify-between px-8 bg-[#090D18]/80 backdrop-blur-xl z-20">
                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0F1528] border border-[#192340] text-xs font-bold text-gray-300">
                            <i class="fa-solid fa-flask-vial text-indigo-400"></i>
                            <span>Trung Tâm Thí Nghiệm Trí Nhớ & Nhận Thức</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-5">
                        <!-- Cyber Ambient Aura Switcher -->
                        <button @click="cycleTheme" 
                                class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0F1528] hover:bg-[#16203D] border border-[#192340] hover:border-indigo-500/40 text-xs font-bold text-gray-300 hover:text-white transition-all shadow-sm group" 
                                :title="'Đổi Cyber Aura (Hiện tại: ' + currentTheme.name + ')'">
                            <span class="w-3 h-3 rounded-full shadow-sm" :style="{ backgroundColor: currentTheme.hex, boxShadow: '0 0 8px ' + currentTheme.hex }"></span>
                            <span class="hidden sm:inline text-xs font-semibold">{{ currentTheme.name }}</span>
                            <i class="fa-solid fa-palette text-gray-400 group-hover:rotate-45 transition-transform text-xs"></i>
                        </button>

                        <!-- User Profile Chip -->
                        <div class="flex items-center gap-3 cursor-pointer pl-2 border-l border-[#141C30]" @click="store.navigate('profile')">
                            <div class="text-right hidden sm:block">
                                <div class="text-xs font-extrabold text-white">{{ store.userProfile?.displayName || store.user?.displayName || firstName }}</div>
                                <div class="text-[10px] text-amber-400 font-bold flex items-center gap-1.5 justify-end">
                                    Lv.{{ levelProgress.currentLevel }} · {{ currentRank.title }}
                                </div>
                            </div>
                            <div class="relative w-9 h-9 shrink-0">
                                <div class="w-full h-full rounded-full bg-gradient-to-tr from-amber-600 to-orange-400 p-[2px] shadow-lg overflow-hidden">
                                    <img v-if="store.userProfile?.avatar" :src="store.userProfile.avatar" class="w-full h-full rounded-full object-cover">
                                    <img v-else :src="'https://api.dicebear.com/7.x/notionists/svg?seed=' + (store.user?.email || 'user') + '&backgroundColor=transparent'" class="w-full h-full rounded-full bg-[#141C30] object-cover">
                                </div>
                                <div v-if="store.userProfile?.equippedBadge" 
                                     class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#090D18] border border-amber-400 p-0.5 flex items-center justify-center shadow-md z-10 select-none">
                                    <img v-if="getBadge3D(store.userProfile.equippedBadge)" :src="getBadge3D(store.userProfile.equippedBadge)" class="w-full h-full object-contain">
                                    <span v-else class="text-[8px]">{{ getBadgeIcon(store.userProfile.equippedBadge) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- DASHBOARD SCROLL AREA -->
                <main class="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar relative">
                    <div class="max-w-[1280px] mx-auto space-y-6 relative z-10">
                        
                        <!-- ROW 1: Command Hub & Streak Telemetry -->
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            <!-- Hero Command Terminal -->
                            <div class="lg:col-span-2 bg-gradient-to-br from-[#0D1326] via-[#0A0F1E] to-[#070A14] border border-[#18223D] rounded-3xl p-7 relative overflow-hidden flex flex-col justify-between shadow-xl" style="min-height: 270px;">
                                <!-- Dynamic Ambient Highlight -->
                                <div class="absolute -right-20 -bottom-20 w-80 h-80 rounded-full blur-[100px] opacity-25 pointer-events-none transition-all duration-700" :style="{ backgroundColor: currentTheme.hex }"></div>
                                
                                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                                    <div class="flex items-center gap-5">
                                        <div class="w-18 h-18 rounded-2xl bg-[#111933] border-2 border-indigo-500/30 flex items-center justify-center flex-shrink-0 p-1 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                                            <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center overflow-hidden">
                                                <img v-if="store.userProfile?.avatar" :src="store.userProfile.avatar" class="w-full h-full object-cover">
                                                <img v-else :src="'https://api.dicebear.com/7.x/notionists/svg?seed=' + firstName + '&backgroundColor=transparent'" class="w-full h-full object-cover">
                                            </div>
                                        </div>
                                        <div>
                                            <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                                                <span class="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                                                    <i class="fa-solid fa-wave-square text-[9px] animate-pulse"></i> {{ cognitiveRadar.brainwaveState }}
                                                </span>
                                                <span class="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                    CPI: {{ cognitiveRadar.cpi }}/100
                                                </span>
                                            </div>
                                            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                                                Chào buổi tối, {{ firstName }} <span class="animate-wave inline-block origin-bottom-right">👋</span>
                                            </h1>
                                            <p class="text-xs sm:text-sm text-gray-400 leading-relaxed mt-1">Hệ thống HLR đã sẵn sàng phân tích đường cong quên lãng và phục hồi từ vựng của bạn.</p>
                                        </div>
                                    </div>
                                    <div class="flex flex-row sm:flex-col gap-2.5 w-full sm:w-auto shrink-0">
                                        <button @click="startReview" class="flex-1 sm:flex-none bg-gradient-to-r hover:brightness-110 text-white font-extrabold py-3 px-5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider" :class="currentTheme.btn">
                                            <i class="fa-solid fa-bolt text-xs"></i> Ôn Tập Cấp Tốc
                                        </button>
                                        <button @click="store.navigate('dashboard')" class="flex-1 sm:flex-none bg-[#111933] hover:bg-[#182348] border border-[#1F2C52] text-gray-300 hover:text-white font-bold py-3 px-5 rounded-xl transition-all text-xs flex items-center justify-center gap-2">
                                            <i class="fa-solid fa-gamepad text-indigo-400 text-xs"></i> Võ Đài Arcade
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-3 gap-3 relative z-10 mt-6 pt-4 border-t border-[#18223D]/80">
                                    <div class="flex items-center gap-2.5 font-bold text-xs">
                                        <div class="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                                            <i class="fa-solid fa-star text-xs"></i>
                                        </div>
                                        <div>
                                            <div class="text-white font-mono font-black">+{{ store.userProfile?.totalLexiCredit || 0 }}</div>
                                            <div class="text-[9px] text-gray-500 uppercase">LexiCredit</div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2.5 font-bold text-xs">
                                        <div class="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                                            <i class="fa-solid fa-fire text-xs"></i>
                                        </div>
                                        <div>
                                            <div class="text-white font-mono font-black">{{ stats?.streak || 0 }} Ngày</div>
                                            <div class="text-[9px] text-gray-500 uppercase">Chuỗi Học</div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2.5 font-bold text-xs">
                                        <div class="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                                            <i class="fa-solid fa-chart-simple text-xs"></i>
                                        </div>
                                        <div>
                                            <div class="text-white font-mono font-black">{{ stats?.todayWords || 0 }} Từ</div>
                                            <div class="text-[9px] text-gray-500 uppercase">Hôm nay</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Streak Telemetry Hub -->
                            <div class="bg-gradient-to-br from-[#1C121A] via-[#140E14] to-[#0A070A] border border-[#331D2A] rounded-3xl p-7 flex flex-col justify-between relative overflow-hidden shadow-xl" style="min-height: 270px;">
                                <div class="absolute right-6 top-6 w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.3)] border border-orange-500/30">
                                    <i class="fa-solid fa-fire text-orange-500 text-xl drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]"></i>
                                </div>
                                
                                <div>
                                    <p class="text-[10px] font-black text-orange-400 tracking-widest uppercase mb-1 flex items-center gap-1.5">
                                        <span class="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span> Chuỗi Học Tập
                                    </p>
                                    <div class="flex items-baseline gap-2">
                                        <span class="text-5xl font-black text-white tracking-tighter font-mono">{{ stats?.streak || 0 }}</span>
                                        <span class="text-base font-extrabold text-orange-400/80">Ngày liên tiếp</span>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-4 py-4 my-2 border-y border-[#331D2A]/80">
                                    <div>
                                        <div class="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Kỷ lục dài nhất</div>
                                        <div class="font-mono font-black text-white text-sm">{{ stats?.bestStreak || stats?.streak || 0 }} <span class="text-[10px] text-gray-400">ngày</span></div>
                                    </div>
                                    <div>
                                        <div class="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Tổng số ngày học</div>
                                        <div class="font-mono font-black text-white text-sm">{{ stats?.totalStudyDays || (stats?.history?.length ? stats.history.length : (stats?.streak > 0 ? 1 : 0)) }} <span class="text-[10px] text-gray-400">ngày</span></div>
                                    </div>
                                </div>
                                
                                <div>
                                    <div class="flex justify-between text-xs font-bold mb-2">
                                        <span class="text-gray-400">Mốc tiếp theo: <span class="text-amber-400">{{ (stats?.streak || 0) < 7 ? 'Flame (7 ngày)' : (stats?.streak || 0) < 30 ? 'Inferno (30 ngày)' : 'Master (100 ngày)' }}</span></span>
                                        <span class="font-mono text-gray-400"><span class="text-white">{{ stats?.streak || 0 }}</span> / 30</span>
                                    </div>
                                    <div class="h-2 w-full bg-[#180E13] rounded-full overflow-hidden border border-[#331D2A]">
                                        <div class="h-full bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.5)]" :style="{ width: Math.min(100, Math.max(5, ((stats?.streak || 0) / 30 * 100))) + '%' }"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ROW 2: Ebbinghaus Forgetting Curve & HLR Telemetry -->
                        <div class="bg-gradient-to-br from-[#0D1429] via-[#090E1D] to-[#070A14] border border-[#16203D] rounded-3xl p-7 shadow-xl relative overflow-hidden">
                            <div class="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20 transition-all duration-700" :style="{ backgroundColor: currentTheme.hex }"></div>
                            
                            <div class="flex flex-col lg:flex-row gap-8 justify-between relative z-10">
                                <!-- Left: Text & Key Telemetry Metrics -->
                                <div class="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div class="flex items-center gap-3 text-indigo-400 font-bold mb-3 text-xs uppercase tracking-wider">
                                            <span class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                                                <i class="fa-solid fa-brain"></i> AI Learning Coach
                                            </span>
                                            <span class="text-gray-500 font-mono text-[10px]">HLR Decay Engine v3.2</span>
                                        </div>

                                        <h3 class="text-2xl font-black text-rose-400 mb-2 flex items-center gap-2" v-if="aiCoachStats.isLongAbsence">
                                            <i class="fa-solid fa-triangle-exclamation animate-bounce"></i> Báo động: Trí nhớ đang phân rã mạnh!
                                        </h3>
                                        <h3 class="text-2xl font-black text-amber-400 mb-2 flex items-center gap-2" v-else-if="aiCoachStats.reviewWords > 0">
                                            <i class="fa-solid fa-bolt"></i> Đến lúc củng cố từ vựng!
                                        </h3>
                                        <h3 class="text-2xl font-black text-emerald-400 mb-2 flex items-center gap-2" v-else>
                                            <i class="fa-solid fa-circle-check"></i> Trí nhớ 100% Tối ưu!
                                        </h3>

                                        <p class="text-gray-300 text-xs sm:text-sm leading-relaxed mb-6 max-w-xl" v-if="aiCoachStats.isLongAbsence">
                                            Đã khoảng <span class="text-rose-400 font-extrabold">{{ aiCoachStats.daysAbsent }} ngày</span> bạn chưa ôn tập lại. Theo định luật đường cong quên lãng <b class="text-white">Ebbinghaus</b>, tỷ lệ lưu giữ từ vựng của bạn đã rơi xuống mức <span class="text-rose-400 font-extrabold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">{{ aiCoachStats.avgRetention }}%</span>. Có <span class="text-amber-400 font-extrabold">{{ aiCoachStats.reviewWords }} từ vựng</span> đang chạm ngưỡng nguy cơ quên. Hãy ôn tập ngay để phục hồi trí nhớ!
                                        </p>
                                        <p class="text-gray-300 text-xs sm:text-sm leading-relaxed mb-6 max-w-xl" v-else-if="aiCoachStats.reviewWords > 0">
                                            Thuật toán HLR đang theo dõi nhịp sinh học riêng của bạn. Theo mô hình Ebbinghaus, bạn có <span class="text-cyan-400 font-bold bg-cyan-400/10 px-1.5 py-0.5 rounded">{{ aiCoachStats.reviewWords }} từ vựng</span> đang chạm ngưỡng cần ôn tập. Tỷ lệ nhớ trung bình: <b class="text-white">{{ aiCoachStats.avgRetention }}%</b>.
                                        </p>
                                        <p class="text-gray-300 text-xs sm:text-sm leading-relaxed mb-6 max-w-xl" v-else-if="aiCoachStats.isNewUser">
                                            Chào mừng bạn đến với LexiLearn Pro! Não bộ của bạn đang ở trạng thái ghi nhớ hoàn hảo <b class="text-emerald-400 font-bold">100%</b>. Hãy bắt đầu học hoặc thêm bộ từ vựng đầu tiên để AI theo dõi đường cong trí nhớ!
                                        </p>
                                        <p class="text-gray-300 text-xs sm:text-sm leading-relaxed mb-6 max-w-xl" v-else>
                                            Tuyệt vời! Toàn bộ từ vựng của bạn đang được củng cố ở mức tối ưu với tỷ lệ nhớ <b class="text-emerald-400 font-bold">{{ aiCoachStats.avgRetention }}%</b> và không có từ vựng nào gặp nguy cơ quên lãng.
                                        </p>
                                    </div>
                                    
                                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-auto pt-2">
                                        <div class="bg-[#0C1224] rounded-2xl p-4 border border-[#16203D]">
                                            <div class="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2"><i class="fa-solid fa-wave-square mr-1 text-indigo-400"></i> Tỷ Lệ Nhớ Hiện Tại</div>
                                            <div class="flex items-baseline gap-2">
                                                <div class="text-2xl font-black font-mono" :class="aiCoachStats.avgRetention < 50 ? 'text-rose-400' : aiCoachStats.avgRetention < 80 ? 'text-amber-400' : 'text-emerald-400'">
                                                    {{ aiCoachStats.avgRetention }}%
                                                </div>
                                            </div>
                                            <div class="w-full h-1.5 bg-[#141C30] rounded-full overflow-hidden mt-2">
                                                <div class="h-full rounded-full transition-all duration-1000" 
                                                     :class="aiCoachStats.avgRetention < 50 ? 'bg-gradient-to-r from-orange-500 to-rose-500' : 'bg-gradient-to-r from-indigo-500 to-cyan-400'"
                                                     :style="{ width: aiCoachStats.avgRetention + '%' }">
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="bg-[#0C1224] rounded-2xl p-4 border border-[#16203D]">
                                            <div class="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2"><i class="fa-regular fa-clock mr-1 text-cyan-400"></i> Thời Gian Phục Hồi</div>
                                            <div class="text-2xl font-black font-mono text-white flex items-baseline gap-1.5">
                                                {{ aiCoachStats.estMins }} <span class="text-xs text-gray-400 font-bold">phút</span>
                                            </div>
                                            <div class="text-[10px] text-gray-500 font-semibold mt-1">Cần ôn: {{ aiCoachStats.reviewWords }} từ</div>
                                        </div>

                                        <div class="bg-[#0C1224] rounded-2xl p-4 border border-[#16203D]">
                                            <div class="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2"><i class="fa-solid fa-shield-halved mr-1 text-emerald-400"></i> Độ Bền Trí Nhớ (HLR)</div>
                                            <div class="text-2xl font-black font-mono text-emerald-400 flex items-baseline gap-1.5">
                                                {{ aiCoachStats.stabilityScore }} <span class="text-xs text-gray-400 font-bold">/100</span>
                                            </div>
                                            <div class="text-[10px] text-emerald-400/80 font-semibold mt-1">Ổn định dài hạn</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Right: Interactive Ebbinghaus SVG Chart -->
                                <div class="w-full lg:w-[420px] flex flex-col justify-between">
                                    <div class="bg-[#070A14] rounded-2xl p-5 border border-[#16203D] mb-4 flex-1 relative overflow-hidden group">
                                        <!-- Matrix grid texture -->
                                        <div class="absolute inset-0 bg-[radial-gradient(#1A2544_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
                                        
                                        <div class="relative z-10 flex items-center justify-between mb-3">
                                            <span class="text-[11px] font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                                                <i class="fa-solid fa-chart-area text-indigo-400"></i> Đường Cong Quên Lãng
                                            </span>
                                            <span v-if="aiCoachStats.isLongAbsence" class="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-[9px] font-black rounded-full border border-rose-500/30 flex items-center gap-1 animate-pulse">
                                                <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Nguy cơ cao
                                            </span>
                                            <span v-else-if="aiCoachStats.reviewWords > 0" class="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] font-black rounded-full border border-amber-500/30 flex items-center gap-1">
                                                <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Cần ôn tập
                                            </span>
                                            <span v-else class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black rounded-full border border-emerald-500/30 flex items-center gap-1">
                                                <i class="fa-solid fa-check text-[9px]"></i> Tối ưu
                                            </span>
                                        </div>
                                        
                                        <!-- Dynamic SVG Chart -->
                                        <div class="w-full h-32 relative z-10 mt-1">
                                            <svg viewBox="0 0 300 120" class="w-full h-full overflow-visible">
                                                <defs>
                                                    <linearGradient id="largeCurveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stop-color="#818CF8" />
                                                        <stop offset="50%" stop-color="#22D3EE" />
                                                        <stop offset="100%" :stop-color="aiCoachStats.avgRetention < 50 ? '#F43F5E' : '#EAB308'" />
                                                    </linearGradient>
                                                </defs>
                                                <!-- Y-Axis Labels -->
                                                <text x="0" y="12" fill="#4B5563" font-size="9" font-family="monospace" text-anchor="start">100%</text>
                                                <text x="0" y="55" fill="#4B5563" font-size="9" font-family="monospace" text-anchor="start">85%</text>
                                                <text x="0" y="105" fill="#4B5563" font-size="9" font-family="monospace" text-anchor="start">20%</text>
                                                
                                                <!-- Grid Lines -->
                                                <line x1="30" y1="8" x2="300" y2="8" stroke="#16203D" stroke-width="1" />
                                                <line x1="30" y1="52" x2="300" y2="52" stroke="#16203D" stroke-dasharray="4,4" stroke-width="1" />
                                                <line x1="30" y1="102" x2="300" y2="102" stroke="#16203D" stroke-width="1" />
                                                
                                                <!-- Curve -->
                                                <path :d="'M 30 8 Q 110 25, 200 ' + Math.min(95, aiCoachStats.curveEndY - 10) + ' T 270 ' + aiCoachStats.curveEndY" 
                                                      fill="none" stroke="url(#largeCurveGrad)" stroke-width="4" stroke-linecap="round" />
                                                
                                                <!-- Pulse point -->
                                                <circle cx="270" :cy="aiCoachStats.curveEndY" r="6" :fill="aiCoachStats.avgRetention < 50 ? '#F43F5E' : '#EAB308'" class="animate-ping opacity-75" />
                                                <circle cx="270" :cy="aiCoachStats.curveEndY" r="4" :fill="aiCoachStats.avgRetention < 50 ? '#F43F5E' : '#EAB308'" stroke="#070A14" stroke-width="2" />
                                                
                                                <!-- Tooltip -->
                                                <g :transform="'translate(205, ' + Math.max(8, aiCoachStats.curveEndY - 26) + ')'">
                                                    <rect width="66" height="20" rx="6" :fill="aiCoachStats.avgRetention < 50 ? 'rgba(244,63,94,0.2)' : 'rgba(234,179,8,0.2)'" :stroke="aiCoachStats.avgRetention < 50 ? '#F43F5E' : '#EAB308'" stroke-width="1" />
                                                    <text x="33" y="14" :fill="aiCoachStats.avgRetention < 50 ? '#F43F5E' : '#FBBF24'" font-size="9" font-weight="900" font-family="monospace" text-anchor="middle">Pr: {{ aiCoachStats.avgRetention }}%</text>
                                                </g>
                                            </svg>
                                        </div>
                                    </div>
                                    
                                    <!-- Call to Action Button -->
                                    <button @click="startReview" class="w-full py-3.5 bg-gradient-to-r hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 group relative overflow-hidden" :class="currentTheme.btn">
                                        <span class="relative z-10 flex items-center gap-2">
                                            <i class="fa-solid fa-bolt"></i> Bắt đầu ôn tập cấp tốc
                                        </span>
                                        <i class="fa-solid fa-arrow-right relative z-10 transition-transform group-hover:translate-x-2"></i>
                                        <div class="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- ROW 3: 3-Column Lab Analytical Matrix -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            <!-- Col 1: 7-Day Velocity Chart -->
                            <div class="bg-gradient-to-br from-[#0D1326] to-[#080C1A] border border-[#16203D] rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                                <div>
                                    <div class="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 class="font-extrabold text-white text-sm flex items-center gap-2">
                                                <i class="fa-solid fa-chart-column text-cyan-400"></i> Nhịp Độ Học 7 Ngày
                                            </h3>
                                            <p class="text-[11px] text-gray-400 mt-0.5">Số từ vựng nạp vào & ôn tập mỗi ngày</p>
                                        </div>
                                        <div class="text-right">
                                            <div class="text-xs font-black text-cyan-400 font-mono">{{ velocity7Days.totalWeekWords }} từ</div>
                                            <div class="text-[9px] text-gray-500 uppercase">Tuần này</div>
                                        </div>
                                    </div>

                                    <!-- Vertical Bar Chart -->
                                    <div class="h-36 flex items-end justify-between gap-2 pt-4 px-1">
                                        <div v-for="(day, idx) in velocity7Days.days" :key="idx" class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer relative">
                                            <!-- Hover Tooltip -->
                                            <div class="absolute -top-7 bg-[#141C30] text-white font-mono text-[9px] px-2 py-0.5 rounded shadow-lg border border-[#202D4E] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                                {{ day.words }} từ ({{ day.date }})
                                            </div>
                                            
                                            <!-- Bar -->
                                            <div class="w-full rounded-t-lg transition-all duration-500 relative overflow-hidden" 
                                                 :style="{ height: day.heightPercent + '%' }"
                                                 :class="day.isToday ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]' : (day.words > 0 ? 'bg-gradient-to-t from-indigo-600 to-indigo-400/80 group-hover:brightness-125' : 'bg-[#141C30]')">
                                            </div>
                                            <!-- Label -->
                                            <span class="text-[10px] font-bold" :class="day.isToday ? 'text-cyan-400' : 'text-gray-500'">{{ day.label }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-4 pt-3 border-t border-[#16203D] flex items-center justify-between text-[10px] font-semibold text-gray-400">
                                    <span>Trung bình: <b class="text-white font-mono">{{ velocity7Days.avgWordsPerDay }} từ/ngày</b></span>
                                    <span class="text-cyan-400 flex items-center gap-1"><i class="fa-solid fa-arrow-trend-up"></i> Ổn định</span>
                                </div>
                            </div>

                            <!-- Col 2: Cognitive Dimension Radar HUD -->
                            <div class="bg-gradient-to-br from-[#0D1326] to-[#080C1A] border border-[#16203D] rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                                <div>
                                    <div class="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 class="font-extrabold text-white text-sm flex items-center gap-2">
                                                <i class="fa-solid fa-circle-nodes text-purple-400"></i> Radar Nhận Thức AI
                                            </h3>
                                            <p class="text-[11px] text-gray-400 mt-0.5">5 chiều năng lực bộ não</p>
                                        </div>
                                        <span class="text-[10px] font-mono font-black text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
                                            CPI {{ cognitiveRadar.cpi }}%
                                        </span>
                                    </div>

                                    <!-- SVG Pentagon Radar Chart -->
                                    <div class="w-full h-36 flex items-center justify-center relative my-1">
                                        <svg viewBox="0 0 200 200" class="w-36 h-36 overflow-visible">
                                            <!-- Web Grid Rings -->
                                            <polygon points="100,32 165,79 140,155 60,155 35,79" fill="none" stroke="#18223D" stroke-width="1" />
                                            <polygon points="100,55 143,86 127,137 73,137 57,86" fill="none" stroke="#141C30" stroke-width="1" stroke-dasharray="2,2" />
                                            
                                            <!-- Axis Spokes -->
                                            <line x1="100" y1="100" x2="100" y2="32" stroke="#18223D" stroke-width="1" />
                                            <line x1="100" y1="100" x2="165" y2="79" stroke="#18223D" stroke-width="1" />
                                            <line x1="100" y1="100" x2="140" y2="155" stroke="#18223D" stroke-width="1" />
                                            <line x1="100" y1="100" x2="60" y2="155" stroke="#18223D" stroke-width="1" />
                                            <line x1="100" y1="100" x2="35" y2="79" stroke="#18223D" stroke-width="1" />
                                            
                                            <!-- Live Data Polygon -->
                                            <polygon :points="cognitiveRadar.polygonPoints" fill="rgba(168,85,247,0.25)" stroke="#A855F7" stroke-width="2" stroke-linejoin="round" class="filter drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] transition-all duration-700" />
                                            
                                            <!-- Center Core Dot -->
                                            <circle cx="100" cy="100" r="3" fill="#A855F7" />
                                        </svg>
                                    </div>
                                </div>
                                <div class="mt-2 pt-2 border-t border-[#16203D] grid grid-cols-5 gap-1 text-center">
                                    <div class="text-[9px] text-gray-500 font-bold">Kiên<br><span class="text-white font-mono">{{ cognitiveRadar.consistency }}%</span></div>
                                    <div class="text-[9px] text-gray-500 font-bold">Tập<br><span class="text-white font-mono">{{ cognitiveRadar.focus }}%</span></div>
                                    <div class="text-[9px] text-gray-500 font-bold">Bền<br><span class="text-white font-mono">{{ cognitiveRadar.persistence }}%</span></div>
                                    <div class="text-[9px] text-gray-500 font-bold">Thức<br><span class="text-white font-mono">{{ cognitiveRadar.metacognition }}%</span></div>
                                    <div class="text-[9px] text-gray-500 font-bold">Phá<br><span class="text-white font-mono">{{ cognitiveRadar.exploration }}%</span></div>
                                </div>
                            </div>

                            <!-- Col 3: Vocabulary Activation Spectrum -->
                            <div class="bg-gradient-to-br from-[#0D1326] to-[#080C1A] border border-[#16203D] rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                                <div>
                                    <div class="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 class="font-extrabold text-white text-sm flex items-center gap-2">
                                                <i class="fa-solid fa-atom text-emerald-400"></i> Hoạt Hóa Từ Vựng
                                            </h3>
                                            <p class="text-[11px] text-gray-400 mt-0.5">Active vs Passive Vocabulary</p>
                                        </div>
                                        <div class="text-emerald-400 font-mono font-black text-xs bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                            {{ aiCoachStats.activeRate }}% Active
                                        </div>
                                    </div>

                                    <!-- Donut & Breakdown -->
                                    <div class="flex items-center justify-between gap-4 my-2">
                                        <div class="space-y-2 flex-1">
                                            <div class="flex items-center justify-between text-xs">
                                                <span class="flex items-center gap-2 text-gray-300 font-semibold">
                                                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Active (≥80%)
                                                </span>
                                                <span class="font-mono font-bold text-white">{{ aiCoachStats.activeWords }}</span>
                                            </div>
                                            <div class="flex items-center justify-between text-xs">
                                                <span class="flex items-center gap-2 text-gray-300 font-semibold">
                                                    <span class="w-2 h-2 rounded-full bg-amber-400"></span> Củng cố (50-79%)
                                                </span>
                                                <span class="font-mono font-bold text-white">{{ aiCoachStats.reinforcingWords }}</span>
                                            </div>
                                            <div class="flex items-center justify-between text-xs">
                                                <span class="flex items-center gap-2 text-gray-300 font-semibold">
                                                    <span class="w-2 h-2 rounded-full bg-indigo-400"></span> Passive (&lt;50%)
                                                </span>
                                                <span class="font-mono font-bold text-white">{{ aiCoachStats.passiveWords }}</span>
                                            </div>
                                        </div>
                                        
                                        <div class="w-20 h-20 rounded-full flex-shrink-0 relative flex items-center justify-center p-1 shadow-lg"
                                             :style="{ background: 'conic-gradient(#34D399 0% ' + aiCoachStats.activeRate + '%, #FBBF24 ' + aiCoachStats.activeRate + '% 75%, #6366F1 75% 100%)' }">
                                            <div class="w-14 h-14 rounded-full bg-[#080C1A] flex flex-col items-center justify-center">
                                                <span class="text-xs font-black font-mono text-white">{{ aiCoachStats.activeRate }}%</span>
                                                <span class="text-[7px] text-gray-500 uppercase font-black">ACTIVE</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-4 pt-3 border-t border-[#16203D]">
                                    <div class="h-2 w-full bg-[#141C30] rounded-full overflow-hidden flex">
                                        <div class="h-full bg-emerald-400 transition-all duration-700" :style="{ width: aiCoachStats.activeRate + '%' }"></div>
                                        <div class="h-full bg-amber-400 transition-all duration-700" :style="{ width: Math.max(0, 100 - aiCoachStats.activeRate - 30) + '%' }"></div>
                                        <div class="h-full bg-indigo-500 transition-all duration-700 flex-1"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ROW 4: Daily Quests & LexiCredit Treasury -->
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            <!-- Daily Missions -->
                            <div class="lg:col-span-2 bg-gradient-to-br from-[#0D1326] to-[#080C1A] border border-[#16203D] rounded-3xl p-6 shadow-xl">
                                <div class="flex items-start justify-between mb-5">
                                    <div>
                                        <h3 class="font-extrabold text-white text-base mb-0.5 flex items-center gap-2">
                                            <i class="fa-solid fa-list-check text-indigo-400"></i> Nhiệm Vụ Hàng Ngày
                                        </h3>
                                        <p class="text-xs text-gray-400">Hoàn thành {{ completedMissionsCount }} / {{ dailyMissions.length }} mục tiêu</p>
                                    </div>
                                    <div class="px-3 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-black">
                                        {{ completedMissionsCount }}/{{ dailyMissions.length }} Đạt
                                    </div>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div v-for="mission in dailyMissions" :key="mission.id" class="bg-[#0C1224] border border-[#16203D] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
                                        <div class="flex items-start justify-between gap-2 mb-3">
                                            <div class="text-xs font-extrabold text-white leading-tight" :class="{'line-through opacity-70 text-gray-400': mission.current >= mission.max}">
                                                {{ mission.title }}
                                            </div>
                                            <div v-if="mission.current >= mission.max" class="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                                                <i class="fa-solid fa-check"></i>
                                            </div>
                                            <div v-else class="text-[10px] font-mono text-gray-500 shrink-0">
                                                {{ mission.current }}/{{ mission.max }}
                                            </div>
                                        </div>
                                        <div>
                                            <div class="flex items-center justify-between text-[10px] font-bold mb-1.5">
                                                <span :class="mission.current >= mission.max ? 'text-emerald-400' : 'text-amber-400'">+{{ mission.xp }} XP</span>
                                                <span class="text-gray-500">{{ Math.round((mission.current / mission.max) * 100) }}%</span>
                                            </div>
                                            <div class="h-1.5 w-full bg-[#141C30] rounded-full overflow-hidden">
                                                <div class="h-full rounded-full transition-all duration-700" 
                                                     :class="mission.current >= mission.max ? 'bg-emerald-400' : 'bg-gradient-to-r from-indigo-500 to-cyan-400'"
                                                     :style="{ width: Math.min(100, (mission.current / mission.max * 100)) + '%' }"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- LexiCredit Treasury -->
                            <div class="bg-gradient-to-br from-[#0D1326] to-[#080C1A] border border-[#16203D] rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                                <div class="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 class="font-extrabold text-white text-base mb-0.5 flex items-center gap-2">
                                            <i class="fa-solid fa-coins text-amber-400"></i> Kho Báu LexiCredit
                                        </h3>
                                        <p class="text-xs text-gray-400">Số dư ví của bạn</p>
                                    </div>
                                    <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                                        <i class="fa-solid fa-coins text-amber-400 text-lg drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"></i>
                                    </div>
                                </div>
                                <div class="my-3">
                                    <span class="text-4xl font-black text-white font-mono tracking-tight">{{ store.userProfile?.totalLexiCredit || store.userProfile?.lexiCredit || 1250 }}</span>
                                    <span class="text-amber-400 ml-1.5 text-base font-black">LC</span>
                                </div>
                                <div class="grid grid-cols-2 gap-3 pt-3 border-t border-[#16203D]">
                                    <div class="bg-[#0C1224] p-2.5 rounded-xl border border-[#16203D]">
                                        <p class="text-[9px] uppercase text-gray-500 font-bold">Cấp Bậc Hiện Tại</p>
                                        <p class="text-xs font-bold text-white truncate mt-0.5">{{ currentRank.title }}</p>
                                    </div>
                                    <div class="bg-[#0C1224] p-2.5 rounded-xl border border-[#16203D]">
                                        <p class="text-[9px] uppercase text-gray-500 font-bold">Tiến Độ Level</p>
                                        <p class="text-xs font-bold text-amber-400 font-mono mt-0.5">Lv.{{ levelProgress.currentLevel }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ROW 5: 365-Day Neural Activity Matrix (Heatmap) -->
                        <div class="bg-gradient-to-br from-[#0D1326] to-[#080C1A] border border-[#16203D] rounded-3xl p-6 shadow-xl">
                            <div class="flex items-center justify-between mb-4">
                                <div>
                                    <h3 class="font-extrabold text-white text-base mb-0.5 flex items-center gap-2">
                                        <i class="fa-solid fa-calendar-days text-emerald-400"></i> Ma Trận Hoạt Động Não Bộ (365 Ngày)
                                    </h3>
                                    <p class="text-xs text-gray-400">Biểu đồ mật độ kiên trì học tập cả năm</p>
                                </div>
                                <div class="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold">
                                    <span>Ít</span>
                                    <div class="w-3 h-3 rounded-sm bg-[#0E1528] border border-[#18223D]"></div>
                                    <div class="w-3 h-3 rounded-sm bg-[#064E3B]"></div>
                                    <div class="w-3 h-3 rounded-sm bg-[#047857]"></div>
                                    <div class="w-3 h-3 rounded-sm bg-[#10B981]"></div>
                                    <div class="w-3 h-3 rounded-sm bg-[#34D399]"></div>
                                    <span>Nhiều</span>
                                </div>
                            </div>
                            <div class="overflow-x-auto custom-scrollbar pb-2 pt-4">
                                <div class="min-w-[700px]">
                                    <div class="flex text-[10px] text-gray-500 font-bold mb-2 ml-8 justify-between pr-4">
                                        <span v-for="(m, i) in months" :key="i">{{m}}</span>
                                    </div>
                                    <div class="flex gap-2">
                                        <div class="flex flex-col gap-[6px] text-[10px] text-gray-500 font-bold mt-1">
                                            <span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span>Sun</span>
                                        </div>
                                        <div class="flex gap-1.5 flex-1">
                                            <div v-for="(week, wI) in heatmapWeeks" :key="wI" class="flex flex-col gap-1.5">
                                                <div v-for="(day, dI) in week" :key="dI" 
                                                     class="w-3 h-3 rounded-sm border transition-all hover:scale-125 cursor-pointer relative group hover:z-50"
                                                     :class="[
                                                         day.level === 0 ? 'bg-[#0E1528] border-[#18223D]' : '',
                                                         day.level === 1 ? 'bg-[#064E3B] border-[#064E3B]' : '',
                                                         day.level === 2 ? 'bg-[#047857] border-[#047857]' : '',
                                                         day.level === 3 ? 'bg-[#10B981] border-[#10B981]' : '',
                                                         day.level === 4 ? 'bg-[#34D399] border-[#34D399]' : ''
                                                     ]">
                                                     <div class="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-[#090D18] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl border border-[#1E294A] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                                                         {{ day.words }} từ học ngày {{ day.date }}
                                                     </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ROW 6: Trophy Vault & Badge Showcase -->
                        <div class="bg-gradient-to-br from-[#0D1326] to-[#080C1A] border border-[#16203D] rounded-3xl p-6 shadow-xl overflow-hidden">
                            <div class="flex items-center justify-between mb-4">
                                <div>
                                    <h3 class="font-extrabold text-white text-base mb-0.5 flex items-center gap-2">
                                        <i class="fa-solid fa-trophy text-amber-400"></i> Phòng Truyền Thống Huy Hiệu
                                    </h3>
                                    <p class="text-xs text-gray-400">Click vào huy hiệu đã mở khóa để trang bị lên Avatar</p>
                                </div>
                                <button @click="store.navigate('profile')" class="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                    Xem tất cả 28 huy hiệu <i class="fa-solid fa-arrow-right text-[10px]"></i>
                                </button>
                            </div>
                            <div class="flex gap-4 overflow-x-auto custom-scrollbar pb-3 pt-1">
                                <div v-for="badge in badges" :key="badge.id" 
                                     class="relative flex-shrink-0 flex flex-col items-center gap-2 p-3.5 w-28 rounded-2xl border transition-all cursor-pointer group select-none"
                                     @click="badge.unlocked ? store.equipBadge(badge.badgeId) : null"
                                     :title="badge.unlocked ? (badge.isEquipped ? 'Đang trang bị (Click gỡ)' : 'Click để trang bị lên Avatar') : 'Chưa mở khóa'"
                                     :class="[
                                        !badge.unlocked ? 'bg-[#090E1D]/50 border-[#141C30]/50 opacity-40 grayscale' :
                                        badge.isEquipped ? 'bg-[#0F162E] border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.3)]' :
                                        badge.mythic ? 'bg-[#0F162E] border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]' :
                                        badge.legendary ? 'bg-[#0F162E] border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]' :
                                        'bg-[#0C1224] border-[#16203D] hover:border-indigo-500/50'
                                     ]">
                                    <div v-if="badge.mythic" class="absolute inset-0 rounded-2xl border border-transparent" style="background: linear-gradient(to right, #ec4899, #a855f7, #6366f1) border-box; -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                                    
                                    <div class="w-13 h-13 rounded-2xl flex items-center justify-center p-2 transition-transform group-hover:scale-110 relative select-none" :class="badge.bg">
                                        <img v-if="badge.image3d" :src="badge.image3d" :alt="badge.name" class="w-10 h-10 object-contain filter drop-shadow-md">
                                        <span v-else class="text-3xl leading-none drop-shadow-md select-none">{{ badge.emoji || badge.icon || '🏆' }}</span>
                                        
                                        <!-- Equipped Badge Checkmark -->
                                        <div v-if="badge.isEquipped" class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-black border border-[#090D18] shadow-sm z-10">
                                            <i class="fa-solid fa-check"></i>
                                        </div>
                                    </div>
                                    <span class="text-[11px] font-extrabold text-center text-white truncate w-full">{{ badge.name }}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    `
};
