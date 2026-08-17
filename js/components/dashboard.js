import { ref, computed, onMounted, onUpdated, nextTick } from 'vue';
import { store } from '../store.js';
import { fetchCards, deleteDeckAndCards, fetchDecks, fetchAllUserCards } from '../db.js';
import { showToast } from '../toast.js';
import { t } from '../i18n.js';
import { RANK_LIST, getLevelProgressInfo, getRankFromLevel } from '../ranks.js';
import { MOTIVATIONAL_QUOTES } from './quotes.js';

// Generate a consistent color accent index from deck title
function getDeckAccent(title) {
    if (!title) return 0;
    let hash = 0;
    for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % 8;
}

export default {
    setup() {
        const searchQuery = ref('');        
        const isSelectMode = ref(false);
        const selectedDecks = ref([]);
        const stats = ref(null);
        const showRankGuide = ref(false);

        const quoteList = MOTIVATIONAL_QUOTES;
        const dailyQuote = ref(quoteList[Math.floor(Math.random() * quoteList.length)]);

        const shuffleQuote = () => {
            let nextQuote;
            do {
                nextQuote = quoteList[Math.floor(Math.random() * quoteList.length)];
            } while (nextQuote.id === dailyQuote.value.id && quoteList.length > 1);
            dailyQuote.value = nextQuote;
        };
        
        onMounted(() => {
            stats.value = store.getStudyStats() || { streak: 0, todayWords: 0, history: [] };
            let h = stats.value.history || [];
            if (h.length < 7) {
                const padding = Array.from({length: 7 - h.length}).map(() => ({ words: 0 }));
                stats.value.history = [...padding, ...h];
            } else if (h.length > 7) {
                stats.value.history = h.slice(h.length - 7);
            }
            setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 100);
            loadVocabStats();
        });

        onUpdated(() => {
            nextTick(() => {
                if (window.lucide) window.lucide.createIcons();
            });
        });

        const vocabStats = ref({
            total: 0,
            passive: 0,
            active: 0,
            mastered: 0,
            ratio: 0
        });

        const aiVocabRecommendation = ref('');

        const loadVocabStats = async () => {
            try {
                if (!store.user) return;
                const cards = await fetchAllUserCards(store.user.uid);
                vocabStats.value.total = cards.length;
                cards.forEach(c => {
                    const state = c.mastery_state || 'Unknown';
                    if (state === 'Passive' || state === 'Seen') vocabStats.value.passive++;
                    if (state === 'Active' || state === 'Practicing') vocabStats.value.active++;
                    if (state === 'Mastered') vocabStats.value.mastered++;
                });
                
                const combined = vocabStats.value.passive + vocabStats.value.active + vocabStats.value.mastered;
                if (combined > 0) {
                    vocabStats.value.ratio = Math.round(((vocabStats.value.active + vocabStats.value.mastered) / combined) * 100);
                }

                if (vocabStats.value.passive > vocabStats.value.active * 3 && vocabStats.value.passive > 20) {
                    aiVocabRecommendation.value = "Bạn hiểu nhiều từ (Passive cao) nhưng rất ít từ được sử dụng chủ động. Hãy dùng chế độ Activate để tăng khả năng sử dụng thực tế.";
                } else if (vocabStats.value.ratio > 50) {
                    aiVocabRecommendation.value = "Tuyệt vời! Tỷ lệ Active Vocabulary của bạn rất cao. Bạn có khả năng diễn đạt rất tốt.";
                } else {
                    aiVocabRecommendation.value = "Hãy tiếp tục luyện tập đều đặn để biến từ vựng thành phản xạ tự nhiên của mình nhé.";
                }
            } catch (err) {
                console.error("Error loading vocab stats", err);
            }
        };

        const filteredDecks = computed(() => {
            let res = store.decks;
            if (searchQuery.value) {
                res = res.filter(d => d.title.toLowerCase().includes(searchQuery.value.toLowerCase()));
            }
            return res;
        });

        const openDeck = async (deck) => {
            if (isSelectMode.value) {
                const index = selectedDecks.value.indexOf(deck.id);
                if (index > -1) selectedDecks.value.splice(index, 1);
                else selectedDecks.value.push(deck.id);
            } else {
                store.showLoading();
                try {
                    store.activeCards = await fetchCards(deck.id);
                    store.activeDeck = deck;
                    store.navigate('deck-detail');
                } catch (err) {
                    showToast("Lỗi khi tải từ vựng!", 'error');
                } finally {
                    store.hideLoading();
                }
            }
        };

        const toggleSelectMode = () => {
            isSelectMode.value = !isSelectMode.value;
            selectedDecks.value = [];
        };

        const deleteSelected = async () => {
            if (selectedDecks.value.length === 0) return;
            if (!confirm(`Bạn có chắc muốn xóa ${selectedDecks.value.length} bộ thẻ đã chọn? Dữ liệu không thể khôi phục.`)) return;
            store.showLoading();
            try {
                for (const deckId of selectedDecks.value) {
                    await deleteDeckAndCards(deckId);
                }
                store.decks = await fetchDecks(store.user.uid);
                toggleSelectMode();
                showToast(`Đã xóa ${selectedDecks.value.length} bộ thẻ.`, 'success');
            } catch (e) {
                showToast("Lỗi khi xóa: " + e.message, 'error');
            }
            store.hideLoading();
        };

        // Progress ring calculation
        const todayProgress = computed(() => {
            const target = store.settings?.dailyTarget || 20;
            const today = stats.value?.todayWords || 0;
            return Math.min(100, (today / target) * 100);
        });

        const ringCircumference = 2 * Math.PI * 36; // r=36
        const ringOffset = computed(() => ringCircumference - (todayProgress.value / 100) * ringCircumference);

        const levelProgress = computed(() => {
            return getLevelProgressInfo(store.userProfile?.totalLexiCredit || 0);
        });

        const hasStudyHistory = computed(() => stats.value?.history?.some(d => d.words > 0) || false);

        const currentRank = computed(() => {
            return getRankFromLevel(levelProgress.value.currentLevel);
        });

        const rankGuideList = RANK_LIST;

        const dailyMissions = ref([
            { id: 1, title: 'Học 20 từ mới', max: 20, current: 0 },
            { id: 2, title: 'Ôn tập 50 từ cũ', max: 50, current: 0 },
            { id: 3, title: 'Hoàn thành 1 bài Speaking', max: 1, current: 0 }
        ]);

        if (stats.value) {
            dailyMissions.value[0].current = Math.min(20, stats.value.todayWords || 0);
            dailyMissions.value[1].current = Math.min(50, Math.floor((stats.value.todayWords || 0) * 1.5));
            dailyMissions.value[2].current = stats.value.todayWords > 30 ? 1 : 0;
        }

        return { 
            store, searchQuery, filteredDecks, openDeck, 
            isSelectMode, selectedDecks, toggleSelectMode, deleteSelected, stats,
            todayProgress, ringCircumference, ringOffset, getDeckAccent, t,
            levelProgress, currentRank, showRankGuide, rankGuideList,
            vocabStats, aiVocabRecommendation, dailyMissions, hasStudyHistory,
            dailyQuote, shuffleQuote
        };
    },
    template: `
        <div class="max-w-6xl mx-auto flex flex-col gap-6 lg:gap-8 animate-fade-in">
            <!-- Hero Banner -->
            <div class="glass-panel-strong p-8 rounded-3xl relative overflow-hidden bg-white border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <!-- Background Decoration -->
                <div class="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div class="absolute -left-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div class="relative z-10 text-center md:text-left flex-1">
                    <h1 class="text-2xl md:text-3xl font-black text-gray-900 mb-2 flex items-center justify-center md:justify-start gap-2">
                        <span>Chào {{ store.userProfile?.displayName?.split(' ')[0] || 'Học giả' }}</span>
                        <img src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Waving%20hand/Default/3D/waving_hand_3d_default.png" class="w-8 h-8 inline-block object-contain filter drop-shadow-sm animate-wiggle">
                    </h1>
                    <p class="text-gray-500 font-medium mb-6 text-sm md:text-base">Hôm nay bạn đã học được <span class="font-bold text-indigo-600">{{ stats?.todayWords || 0 }} / {{ store.settings?.dailyTarget || 20 }}</span> từ vựng mục tiêu.</p>
                    <div class="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                        <button class="btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm transition-all" @click="store.navigate('roadmap')">
                            <i data-lucide="play" class="w-4 h-4"></i> Học tiếp Lộ trình
                        </button>
                        <button class="btn-secondary px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center gap-2" @click="store.navigate('lexilearn-dashboard')">
                            <i data-lucide="crown" class="w-4 h-4 text-amber-500"></i> Lexi Pro
                        </button>
                    </div>
                </div>
                
                <!-- Gamification stats in Hero -->
                <div class="relative z-10 flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    <div class="bg-gray-50/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 flex flex-col items-center justify-center flex-1 md:w-[100px] shadow-sm">
                        <i data-lucide="flame" class="w-6 h-6 text-orange-500 mb-2 fill-orange-100"></i>
                        <span class="text-xl font-bold text-gray-900">{{ stats?.streak || 0 }}</span>
                        <span class="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-1">Chuỗi</span>
                    </div>
                    <div class="bg-gray-50/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 flex flex-col items-center justify-center flex-1 md:w-[100px] shadow-sm">
                        <i data-lucide="gem" class="w-6 h-6 text-amber-500 mb-2 fill-amber-100"></i>
                        <span class="text-xl font-bold text-gray-900">{{ store.userProfile?.lexiCredit || 0 }}</span>
                        <span class="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-1">LexiCredit</span>
                    </div>
                </div>
            </div>

            <!-- Daily Spark Motivational Quote Widget -->
            <div class="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-200/80 relative overflow-hidden shadow-sm hover:shadow-md transition-all group select-none">
                <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 p-2 shadow-md shadow-amber-500/20 shrink-0 flex items-center justify-center select-none">
                            <img src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Sparkles/3D/sparkles_3d.png" class="w-full h-full object-contain filter drop-shadow-md">
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                                    Danh Ngôn Hôm Nay
                                </span>
                                <span class="text-xs text-gray-400 font-bold">— {{ dailyQuote.author }}</span>
                            </div>
                            <p class="text-gray-900 font-extrabold text-sm sm:text-base leading-snug font-serif italic mb-1">
                                "{{ dailyQuote.quote }}"
                            </p>
                            <p class="text-xs text-gray-600 font-medium leading-relaxed">
                                {{ dailyQuote.translation }}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button @click="shuffleQuote" class="w-9 h-9 rounded-xl bg-white hover:bg-amber-50 text-gray-700 hover:text-amber-600 border border-gray-200 shadow-sm flex items-center justify-center transition-all active:scale-95" title="Đổi câu khác">
                            <i class="fa-solid fa-shuffle text-xs"></i>
                        </button>
                        <button @click="store.navigate('quotes')" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-1.5" title="Mở Góc Động Lực">
                            <span>Góc Động Lực</span>
                            <i class="fa-solid fa-arrow-right text-[10px]"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Two-column Layout -->
            <div class="flex flex-col xl:flex-row gap-6 lg:gap-8">
                <!-- Left Column (Main Content - Decks & Tools) -->
                <div class="flex-1 min-w-0 space-y-6">

                    <!-- Search & Actions -->
                    <div class="flex flex-col sm:flex-row gap-3">
                        <div class="relative flex-1">
                            <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"></i>
                            <input type="text" v-model="searchQuery" placeholder="Tìm kiếm bộ thẻ..." 
                                   class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm font-medium text-sm">
                        </div>
                        <div class="flex gap-2">
                            <template v-if="!isSelectMode">
                                <button @click="toggleSelectMode" class="btn-secondary py-2.5 px-4 text-sm h-[44px] shrink-0 whitespace-nowrap">
                                    <i data-lucide="check-square" class="w-4 h-4"></i> Chọn
                                </button>
                                <button @click="store.navigate('create-deck')" class="btn-primary py-2.5 px-4 text-sm h-[44px] hidden sm:flex shrink-0 whitespace-nowrap">
                                    <i data-lucide="plus" class="w-4 h-4"></i> <span class="hidden md:inline">Tạo Bộ thẻ</span>
                                </button>
                            </template>
                            <template v-else>
                                <button @click="deleteSelected" :disabled="selectedDecks.length === 0" 
                                        class="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 font-semibold rounded-xl hover:bg-red-100 transition shadow-sm disabled:opacity-50 text-sm h-[44px] flex items-center gap-2 shrink-0 whitespace-nowrap">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i> Xóa ({{ selectedDecks.length }})
                                </button>
                                <button @click="toggleSelectMode" class="btn-secondary py-2.5 px-4 text-sm h-[44px] shrink-0 whitespace-nowrap">
                                    <i data-lucide="x" class="w-4 h-4"></i> Hủy
                                </button>
                            </template>
                        </div>
                    </div>

                    <!-- Empty State -->
                    <div v-if="store.decks.length === 0" class="text-center py-16 glass-panel rounded-3xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center">
                        <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 animate-bounce-in">
                            <i data-lucide="folder-open" class="w-8 h-8 text-gray-400"></i>
                        </div>
                        <h3 class="text-lg font-bold text-gray-900 mb-2">{{ t('dash.no_decks') }}</h3>
                        <p class="text-gray-500 mb-6 text-sm max-w-sm">{{ t('dash.create_first_deck') }}</p>
                        <button @click="store.navigate('create-deck')" class="btn-primary px-6 py-2.5 text-sm">
                            <i data-lucide="plus" class="w-4 h-4"></i> {{ t('dash.create_btn') }}
                        </button>
                    </div>

                    <!-- Deck Grid -->
                    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button type="button" v-for="deck in store.decks.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()))" 
                             :key="deck.id"
                             @click="openDeck(deck)"
                             :aria-pressed="isSelectMode ? selectedDecks.includes(deck.id) : undefined"
                             class="text-left group glass-panel rounded-2xl p-5 cursor-pointer relative flex flex-col transition-all h-full"
                             :class="[
                                 isSelectMode ? 'hover:border-indigo-400' : 'hover:-translate-y-1 hover:shadow-md',
                                 selectedDecks.includes(deck.id) ? 'ring-2 ring-indigo-500 border-indigo-300 bg-indigo-50/30' : 'border-gray-200 bg-white'
                             ]">
                            
                            <!-- Select indicator -->
                            <div v-if="isSelectMode" class="absolute top-4 right-4 z-10">
                                <span v-if="selectedDecks.includes(deck.id)" :key="'sel-'+deck.id">
                                    <i data-lucide="check-circle-2" class="w-5 h-5 text-indigo-500 fill-indigo-100"></i>
                                </span>
                                <span v-else :key="'unsel-'+deck.id">
                                    <i data-lucide="circle" class="w-5 h-5 text-gray-300"></i>
                                </span>
                            </div>

                            <!-- Title -->
                            <div class="flex items-start gap-3 mb-2 mt-1 pr-6">
                                <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                                     :class="'deck-accent-' + getDeckAccent(deck.title)"
                                     :style="{ background: 'var(--deck-bg)' }">
                                    <i data-lucide="layers" class="w-4 h-4" :style="{ color: 'var(--deck-color)' }"></i>
                                </div>
                                <h3 class="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{{ deck.title }}</h3>
                            </div>
                            
                            <p class="text-gray-500 text-xs mb-4 line-clamp-2 flex-1 pl-11">{{ deck.description || 'Không có mô tả' }}</p>
                            
                            <!-- Footer -->
                            <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                                <div class="flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-md" :style="{ color: 'var(--deck-color)', background: 'var(--deck-bg)' }"
                                     :class="'deck-accent-' + getDeckAccent(deck.title)">
                                    <i data-lucide="copy" class="w-3 h-3"></i>
                                    <span>{{ deck.cardsCount || 0 }} thẻ</span>
                                </div>
                                <span class="text-[10px] font-medium text-gray-400">{{ deck.createdAt ? new Date(deck.createdAt.toDate ? deck.createdAt.toDate() : deck.createdAt).toLocaleDateString('vi-VN') : '' }}</span>
                            </div>
                        </button>
                    </div>

                    <!-- IELTS AI Tools -->
                    <div class="pt-4">
                        <div class="flex items-center gap-2 mb-4">
                            <div class="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <i data-lucide="sparkles" class="w-3.5 h-3.5 text-indigo-600"></i>
                            </div>
                            <h2 class="text-base font-bold text-gray-900">Công cụ AI</h2>
                        </div>
                        
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button type="button" @click="store.navigate('paraphrase')" 
                                 class="text-left group p-4 rounded-2xl bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all relative overflow-hidden flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <i data-lucide="refresh-cw" class="w-5 h-5 transition-transform group-hover:rotate-180 duration-500"></i>
                                </div>
                                <div>
                                    <h3 class="text-sm font-bold text-gray-900 mb-0.5">Paraphrase AI</h3>
                                    <p class="text-gray-500 text-xs">Nâng cấp từ vựng Band 8.0+</p>
                                </div>
                            </button>

                            <button type="button" @click="store.navigate('writing')" 
                                 class="text-left group p-4 rounded-2xl bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all relative overflow-hidden flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <i data-lucide="pen-tool" class="w-5 h-5 transition-transform group-hover:-rotate-12 duration-300"></i>
                                </div>
                                <div>
                                    <h3 class="text-sm font-bold text-gray-900 mb-0.5">Máy chấm Essay</h3>
                                    <p class="text-gray-500 text-xs">Chấm 4 tiêu chí IELTS Writing</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Right Column (Sidebar content: Rank, Missions, Chart) -->
                <div class="w-full xl:w-72 space-y-6 flex-shrink-0">
                    
                    <!-- User Rank Card -->
                    <div class="glass-panel p-5 rounded-2xl relative overflow-hidden group bg-white border border-indigo-100/80 shadow-sm hover:shadow-md transition-all">
                        <div class="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none"></div>
                        <div class="flex flex-col gap-3 relative z-10">
                            <div class="flex items-center gap-3.5">
                                <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 flex items-center justify-center border border-indigo-100/60 shadow-sm shrink-0 group-hover:scale-105 transition-transform p-2">
                                    <img v-if="currentRank?.image3d" :src="currentRank.image3d" class="w-full h-full object-contain filter drop-shadow-md">
                                    <i v-else :data-lucide="currentRank.icon" :class="[currentRank.color, 'w-7 h-7']"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-1.5 mb-1">
                                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-100/80 uppercase tracking-wider">
                                            Level {{ levelProgress.currentLevel }}
                                        </span>
                                        <button @click="showRankGuide = true" class="w-4 h-4 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-400 hover:text-indigo-600 flex items-center justify-center transition" title="Bảng danh hiệu">
                                            <i data-lucide="info" class="w-2.5 h-2.5"></i>
                                        </button>
                                    </div>
                                    <h2 class="text-sm font-extrabold text-gray-900 leading-snug truncate">{{ currentRank.title }}</h2>
                                </div>
                            </div>
                            
                            <!-- Progress Bar -->
                            <div class="space-y-1.5 w-full pt-1">
                                <div class="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    <span>{{ (levelProgress.totalLC || 0).toLocaleString() }} LC</span>
                                    <span>{{ (levelProgress.nextLevelMinimum || 0).toLocaleString() }} LC</span>
                                </div>
                                <div class="h-2 w-full bg-indigo-50/80 rounded-full overflow-hidden p-[1px] border border-indigo-100/50">
                                    <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 shadow-sm"
                                         :style="{ width: levelProgress.percent + '%' }">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Daily Missions -->
                    <div class="glass-panel p-5 rounded-2xl bg-white">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-bold text-gray-900 text-sm">Nhiệm vụ hôm nay</h3>
                            <span class="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{{ dailyMissions.filter(m => m.current >= m.max).length }}/{{ dailyMissions.length }}</span>
                        </div>
                        <div class="space-y-3">
                            <div v-for="mission in dailyMissions" :key="mission.id" class="group flex items-start gap-2.5">
                                <div class="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors mt-0.5"
                                     :class="mission.current >= mission.max ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 text-transparent'">
                                    <i data-lucide="check" class="w-3 h-3"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex justify-between text-xs mb-1">
                                        <span class="font-semibold" :class="mission.current >= mission.max ? 'text-gray-400 line-through' : 'text-gray-700'">{{ mission.title }}</span>
                                        <span class="text-gray-500 font-bold">{{ mission.current }}/{{ mission.max }}</span>
                                    </div>
                                    <div class="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div class="h-full transition-all duration-1000"
                                             :class="mission.current >= mission.max ? 'bg-emerald-500' : 'bg-indigo-500'"
                                             :style="{ width: (mission.current / mission.max * 100) + '%' }">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Learning Activity (7 Days) -->
                    <div class="glass-panel p-5 rounded-2xl bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border-gray-100/50">
                        <h3 class="font-bold text-gray-900 text-sm mb-4">7 ngày gần đây</h3>
                        
                        <div v-if="hasStudyHistory" class="flex items-end justify-between h-16 gap-1">
                            <div v-for="(day, idx) in (stats?.history || [])" :key="idx" 
                                 class="flex-1 rounded-t-md relative group cursor-default transition-all"
                                 :style="{ 
                                     height: Math.max(8, Math.min(100, (day.words/(store.settings?.dailyTarget || 20))*100)) + '%',
                                     background: day.words > 0 ? 'var(--color-primary)' : 'var(--color-border)'
                                 }">
                                <div v-if="day.words > 0" class="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-0.5 px-1.5 rounded font-medium opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 pointer-events-none">
                                    {{ day.words }} từ
                                </div>
                            </div>
                        </div>
                        
                        <div v-else class="h-16 flex items-center justify-center text-[11px] text-gray-400 font-medium border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                            Chưa có dữ liệu học tập tuần này
                        </div>
                    </div>

                    <!-- Vocab Stats (Active/Passive) -->
                    <div class="glass-panel p-5 rounded-2xl bg-white">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-bold text-gray-900 text-sm">Kho Từ Vựng</h3>
                            <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{{ vocabStats.ratio }}% Active</span>
                        </div>
                        <div class="flex h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
                            <div :style="{ width: (vocabStats.passive / Math.max(vocabStats.total, 1) * 100) + '%' }" class="bg-gray-300"></div>
                            <div :style="{ width: (vocabStats.active / Math.max(vocabStats.total, 1) * 100) + '%' }" class="bg-amber-400"></div>
                            <div :style="{ width: (vocabStats.mastered / Math.max(vocabStats.total, 1) * 100) + '%' }" class="bg-emerald-500"></div>
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-center">
                            <div class="p-2 rounded-xl bg-gray-50 border border-gray-100">
                                <div class="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Passive</div>
                                <div class="text-sm font-black text-gray-600">{{ vocabStats.passive }}</div>
                            </div>
                            <div class="p-2 rounded-xl bg-amber-50 border border-amber-100">
                                <div class="text-[10px] text-amber-600 uppercase tracking-wider font-bold mb-0.5">Active</div>
                                <div class="text-sm font-black text-amber-600">{{ vocabStats.active }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Rank Guide Modal -->
        <teleport to="body">
            <div v-if="showRankGuide" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" @click.self="showRankGuide = false">
                <div class="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in border border-gray-100">
                    <div class="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50/60 to-purple-50/60">
                        <h3 class="font-extrabold text-gray-900 flex items-center gap-2 text-lg">
                            <span class="text-xl select-none">🏆</span> 
                            Bảng Phong Thần
                        </h3>
                        <button @click="showRankGuide = false" class="w-8 h-8 rounded-full bg-white text-gray-500 hover:bg-gray-100 flex items-center justify-center transition shadow-sm">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="p-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
                        <p class="text-xs text-gray-500 mb-4 font-medium leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                            Hệ thống cấp độ dựa vào <b class="text-indigo-600">Tổng điểm LexiCredit</b> bạn kiếm được trọn đời. Cứ <b>50 LexiCredit</b> sẽ thăng 1 cấp!
                        </p>
                        <div class="space-y-2.5">
                            <div v-for="(rank, idx) in rankGuideList" :key="idx" 
                                 class="flex items-center gap-3.5 p-3 rounded-2xl border transition-all"
                                 :class="currentRank.title === rank.title ? 'bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border-indigo-200 shadow-sm ring-1 ring-indigo-300' : 'bg-white border-gray-100 hover:border-indigo-100'">
                                <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 p-2" 
                                     :class="currentRank.title === rank.title ? 'bg-white shadow-md border border-indigo-200' : 'bg-gray-50 border border-gray-100'">
                                    <img v-if="rank.image3d" :src="rank.image3d" class="w-full h-full object-contain filter drop-shadow-sm">
                                    <i v-else :data-lucide="rank.icon" :class="[rank.color, 'w-5 h-5']"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h4 class="font-extrabold text-sm leading-tight truncate" :class="currentRank.title === rank.title ? 'text-indigo-900' : 'text-gray-900'">{{ rank.title }}</h4>
                                    <p class="text-xs text-gray-400 font-bold mt-0.5">Lv.{{ rank.minLevel }}{{ rank.maxLevel === Infinity ? '+' : ' - ' + rank.maxLevel }}</p>
                                </div>
                                <div v-if="currentRank.title === rank.title" class="px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                                    Hiện tại
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </teleport>
    `
};
