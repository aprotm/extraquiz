import { ref, computed, onMounted } from 'vue';
import { store } from '../store.js';
import { fetchCards, deleteDeckAndCards, fetchDecks, fetchAllUserCards } from '../db.js';
import { showToast } from '../app.js';
import { t } from '../i18n.js';
import { RANK_LIST, getLevelProgressInfo, getRankFromLevel } from '../ranks.js';

// Generate a consistent color accent index from deck title
function getDeckAccent(title) {
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
        
        onMounted(() => {
            stats.value = store.getStudyStats() || { streak: 0, todayWords: 0, history: [] };
            let h = stats.value.history || [];
            if (h.length < 7) {
                const padding = Array.from({length: 7 - h.length}).map(() => ({ words: 0 }));
                stats.value.history = [...padding, ...h];
            } else if (h.length > 7) {
                stats.value.history = h.slice(h.length - 7);
            }
            loadVocabStats();
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

        const currentRank = computed(() => {
            return getRankFromLevel(levelProgress.value.currentLevel);
        });

        const rankGuideList = RANK_LIST;

        return { 
            store, searchQuery, filteredDecks, openDeck, 
            isSelectMode, selectedDecks, toggleSelectMode, deleteSelected, stats,
            todayProgress, ringCircumference, ringOffset, getDeckAccent, t,
            levelProgress, currentRank, showRankGuide, rankGuideList,
            vocabStats, aiVocabRecommendation
        };
    },
    template: `
        <div class="max-w-7xl mx-auto flex flex-col xl:flex-row gap-6 lg:gap-8">
            <!-- Sidebar -->
            <div class="w-full xl:w-72 space-y-4 flex-shrink-0">
                <!-- User Profile (Gamification) -->
                <div class="glass-panel-strong p-6 rounded-3xl relative overflow-hidden group">
                    <div class="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-purple-200 to-indigo-100 rounded-full opacity-50 blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div class="flex items-center gap-4 mb-5 relative z-10">
                        <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl shadow-md border-2 border-white">
                            {{ currentRank.icon }}
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <p class="text-[10px] text-purple-600 font-bold uppercase tracking-widest mb-0.5">Level {{ levelProgress.currentLevel }}</p>
                                <button @click="showRankGuide = true" class="w-4 h-4 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center text-[10px] hover:bg-purple-200 transition" title="Bảng xếp hạng danh hiệu">
                                    <i class="fa-solid fa-question"></i>
                                </button>
                            </div>
                            <h2 class="text-base font-extrabold text-gray-900 leading-tight">{{ currentRank.title }}</h2>
                        </div>
                    </div>
                    
                    <!-- Level Progress -->
                    <div class="space-y-1.5 relative z-10" title="Điểm Tích Lũy thăng cấp (kiếm từ LexiCredit)">
                        <div class="flex justify-between text-xs font-semibold text-gray-500">
                            <span>{{ (levelProgress.totalLC || 0).toLocaleString() }} / {{ (levelProgress.nextLevelMinimum || 0).toLocaleString() }} LC</span>
                            <span class="text-amber-500 font-bold">{{ Math.round(levelProgress.percent) }}%</span>
                        </div>
                        <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                            <div class="h-full rounded-full transition-all duration-1000"
                                 :style="{ width: levelProgress.percent + '%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stats Card -->
                <div class="glass-panel-strong p-6 rounded-3xl">
                    <h3 class="font-bold text-gray-800 mb-5 text-sm uppercase tracking-wider">Hoạt động học tập</h3>
                    
                    <!-- Today Progress Ring -->
                    <div class="flex items-center gap-5 mb-6">
                        <div class="relative w-24 h-24 flex-shrink-0">
                            <svg width="96" height="96" class="score-ring w-full h-full">
                                <defs>
                                    <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" style="stop-color:#6d55d1"/>
                                        <stop offset="100%" style="stop-color:#8b5cf6"/>
                                    </linearGradient>
                                </defs>
                                <circle class="score-ring-track" cx="48" cy="48" r="36" stroke-width="8"/>
                                <circle class="score-ring-fill" cx="48" cy="48" r="36" stroke-width="8"
                                    :stroke-dasharray="ringCircumference"
                                    :stroke-dashoffset="ringOffset"/>
                            </svg>
                            <div class="absolute inset-0 flex flex-col items-center justify-center">
                                <span class="text-xl font-extrabold" style="color: #6d55d1;">{{ stats?.todayWords || 0 }}</span>
                                <span class="text-xs text-gray-400 font-medium">/ {{ store.settings?.dailyTarget || 20 }}</span>
                            </div>
                        </div>
                        <div>
                            <p class="font-bold text-gray-900 text-base">Từ hôm nay</p>
                            <p class="text-sm text-gray-500 mt-0.5">Mục tiêu: {{ store.settings?.dailyTarget || 20 }} từ/ngày</p>
                            <div class="flex items-center gap-1.5 mt-3">
                                <i class="fa-solid fa-fire text-orange-500 text-lg"></i>
                                <span class="font-bold text-orange-500 text-lg">{{ stats?.streak || 0 }}</span>
                                <span class="text-xs text-gray-400 font-medium">ngày liên tiếp</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 7-Day Chart -->
                    <div>
                        <p class="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">7 ngày gần đây</p>
                        <div class="flex items-end justify-between h-16 gap-1">
                            <div v-for="(day, idx) in (stats?.history || [])" :key="idx" 
                                 class="flex-1 rounded-t-md relative group cursor-default transition-all"
                                 :style="{ 
                                     height: Math.max(8, Math.min(100, (day.words/(store.settings?.dailyTarget || 20))*100)) + '%',
                                     background: day.words > 0 ? 'linear-gradient(to top, #6d55d1, #8b5cf6)' : 'rgba(109,85,209,0.1)'
                                 }">
                                <div v-if="day.words > 0" class="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 pointer-events-none">
                                    {{ day.words }} từ
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- CTA Buttons -->
                    <div class="flex gap-2 mt-6">
                        <button @click="store.navigate('create-deck')" class="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-1.5">
                            <i class="fa-solid fa-plus text-xs"></i> Tạo bộ thẻ
                        </button>
                        <button @click="store.navigate('roadmap')" class="flex-1 py-2.5 text-sm rounded-xl font-bold border-2 border-purple-200 text-purple-600 hover:bg-purple-50 transition flex items-center justify-center gap-1.5">
                            <i class="fa-regular fa-map text-xs"></i> Lộ trình
                        </button>
                    </div>
                </div>

                <!-- Vocab Stats (Active/Passive) -->
                <div class="glass-panel rounded-2xl p-5 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-gray-800 text-sm">Hồ Sơ Từ Vựng (Active/Passive)</h3>
                        <div class="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg border border-purple-200">
                            Active Ratio: {{ vocabStats.ratio }}%
                        </div>
                    </div>
                    
                    <div class="flex h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
                        <div :style="{ width: (vocabStats.passive / Math.max(vocabStats.total, 1) * 100) + '%' }" class="bg-gray-400"></div>
                        <div :style="{ width: (vocabStats.active / Math.max(vocabStats.total, 1) * 100) + '%' }" class="bg-orange-400"></div>
                        <div :style="{ width: (vocabStats.mastered / Math.max(vocabStats.total, 1) * 100) + '%' }" class="bg-green-500"></div>
                    </div>
                    
                    <div class="grid grid-cols-4 gap-2 text-center">
                        <div class="p-2 rounded-xl bg-gray-50 border border-gray-100">
                            <div class="text-lg font-black text-gray-800">{{ vocabStats.total }}</div>
                            <div class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Tổng</div>
                        </div>
                        <div class="p-2 rounded-xl bg-gray-50 border border-gray-200">
                            <div class="text-lg font-black text-gray-500">{{ vocabStats.passive }}</div>
                            <div class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Passive</div>
                        </div>
                        <div class="p-2 rounded-xl bg-orange-50 border border-orange-100">
                            <div class="text-lg font-black text-orange-500">{{ vocabStats.active }}</div>
                            <div class="text-[10px] text-orange-600 uppercase tracking-wider font-semibold">Active</div>
                        </div>
                        <div class="p-2 rounded-xl bg-green-50 border border-green-100">
                            <div class="text-lg font-black text-green-600">{{ vocabStats.mastered }}</div>
                            <div class="text-[10px] text-green-700 uppercase tracking-wider font-semibold">Mastered</div>
                        </div>
                    </div>

                    <div v-if="aiVocabRecommendation" class="mt-4 p-3 bg-purple-50 border border-purple-100 rounded-xl flex gap-3 items-start">
                        <i class="fa-solid fa-robot text-purple-500 mt-0.5"></i>
                        <p class="text-xs text-purple-800 font-medium leading-relaxed">{{ aiVocabRecommendation }}</p>
                    </div>
                </div>

                <!-- Quotes -->
                <div class="glass-panel-strong p-6 rounded-3xl space-y-6">
                    <!-- HCM Quote -->
                    <div class="flex gap-4">
                        <div class="w-16 h-20 flex-shrink-0 rounded-[50%] overflow-hidden border-[3px] border-white shadow-sm ring-1 ring-gray-100">
                            <img src="./assets/hcm.png" alt="Ho Chi Minh" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1 text-[13px] text-gray-600 italic leading-relaxed">
                            "Một ngày 10 chữ, mười ngày 100 chữ, một tháng là 300 chữ, một năm là cũng thạo khá rồi đấy. Mà chỉ có chí thôi là làm được"
                            <span class="font-bold text-gray-800 not-italic block mt-2 text-xs">— Chủ tịch Hồ Chí Minh</span>
                        </div>
                    </div>
                    
                    <div class="h-px bg-gray-100/80 w-full"></div>
                    
                    <!-- Einstein Quote -->
                    <div class="flex gap-4">
                        <div class="w-16 h-20 flex-shrink-0 rounded-[50%] overflow-hidden border-[3px] border-white shadow-sm ring-1 ring-gray-100">
                            <img src="./assets/einstein.png" alt="Albert Einstein" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1 text-[13px] text-gray-600 italic leading-relaxed">
                            "Không phải là tôi quá thông minh, chỉ là tôi chịu bỏ nhiều thời gian hơn với rắc rối."
                            <span class="font-bold text-gray-800 not-italic block mt-2 text-xs">— Albert Einstein</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="flex-1 min-w-0 space-y-6">
                <!-- Search & Actions -->
                <div class="flex flex-col sm:flex-row gap-3">
                    <div class="relative flex-1">
                        <i class="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                        <input type="text" v-model="searchQuery" placeholder="Tìm kiếm bộ thẻ..." 
                               class="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-transparent bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition shadow-sm font-medium text-sm">
                    </div>
                    <div class="flex gap-2">
                        <template v-if="!isSelectMode">
                            <button @click="toggleSelectMode" class="px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-2xl hover:border-purple-300 transition shadow-sm text-sm">
                                <i class="fa-regular fa-square-check mr-1.5"></i> Chọn
                            </button>
                            <button @click="store.navigate('create-deck')" class="btn-primary px-5 py-2.5 text-sm hidden sm:flex items-center gap-1.5">
                                <i class="fa-solid fa-plus text-xs"></i> Tạo Bộ thẻ
                            </button>
                        </template>
                        <template v-else>
                            <button @click="deleteSelected" :disabled="selectedDecks.length === 0" 
                                    class="px-4 py-2.5 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition shadow-sm disabled:opacity-50 text-sm">
                                <i class="fa-solid fa-trash mr-1.5"></i> Xóa ({{ selectedDecks.length }})
                            </button>
                            <button @click="toggleSelectMode" class="px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-2xl hover:border-gray-300 transition shadow-sm text-sm">
                                <i class="fa-solid fa-xmark mr-1.5"></i> Hủy
                            </button>
                        </template>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-if="store.decks.length === 0" class="text-center py-20 glass-panel rounded-3xl border-2 border-dashed border-purple-200">
                    <div class="text-7xl mb-4 animate-bounce-in">🗂️</div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">{{ t('dash.no_decks') }}</h3>
                    <p class="text-gray-500 mb-6 text-sm">{{ t('dash.create_first_deck') }}</p>
                    <button @click="store.navigate('create-deck')" class="btn-primary px-8 py-3 text-sm">
                        {{ t('dash.create_btn') }}
                    </button>
                </div>

                <!-- Deck Grid -->
                <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button type="button" v-for="deck in store.decks.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()))" 
                         :key="deck.id"
                         @click="openDeck(deck)"
                         :aria-pressed="isSelectMode ? selectedDecks.includes(deck.id) : undefined"
                         :aria-label="isSelectMode ? (selectedDecks.includes(deck.id) ? 'Bỏ chọn bộ thẻ ' : 'Chọn bộ thẻ ') + deck.title : 'Mở bộ thẻ ' + deck.title"
                         class="text-left group interactive-card bg-white rounded-3xl p-6 cursor-pointer relative overflow-hidden border-2 flex flex-col"
                         :class="[
                             isSelectMode ? 'hover:border-purple-400' : 'hover:-translate-y-1 hover:shadow-lg',
                             selectedDecks.includes(deck.id) ? 'ring-2 ring-purple-500 border-purple-300' : 'border-transparent shadow-sm hover:shadow-md'
                         ]">
                        
                        <!-- Color accent bar -->
                        <div class="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl transition-all group-hover:h-2"
                             :class="'deck-accent-' + getDeckAccent(deck.title)"
                             :style="{ background: 'var(--deck-color)' }"></div>
                        
                        <!-- Select indicator -->
                        <div v-if="isSelectMode" class="absolute top-5 right-5 text-2xl z-10">
                            <i v-if="selectedDecks.includes(deck.id)" class="fa-solid fa-circle-check text-purple-500"></i>
                            <i v-else class="fa-regular fa-circle text-gray-300"></i>
                        </div>

                        <!-- Icon + Title -->
                        <div class="flex items-start gap-3 mb-3 mt-1.5">
                            <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                                 :class="'deck-accent-' + getDeckAccent(deck.title)"
                                 :style="{ background: 'var(--deck-bg)' }">
                                <i class="fa-solid fa-layer-group text-sm" :style="{ color: 'var(--deck-color)' }"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h3 class="font-bold text-gray-900 text-base leading-tight pr-6 truncate">{{ deck.title }}</h3>
                            </div>
                        </div>
                        
                        <p class="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{{ deck.description || 'Không có mô tả' }}</p>
                        
                        <!-- Footer -->
                        <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div class="flex items-center gap-1.5 text-sm font-semibold" :style="{ color: 'var(--deck-color)' }"
                                 :class="'deck-accent-' + getDeckAccent(deck.title)">
                                <i class="fa-solid fa-cards-blank text-xs"></i>
                                <span>{{ deck.cardsCount || 0 }} thẻ</span>
                            </div>
                            <span class="text-xs text-gray-400">{{ deck.createdAt ? new Date(deck.createdAt.toDate ? deck.createdAt.toDate() : deck.createdAt).toLocaleDateString('vi-VN') : '' }}</span>
                        </div>
                    </button>
                </div>

                <!-- IELTS AI Tools -->
                <div class="pt-2">
                    <div class="flex items-center gap-3 mb-5">
                        <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, #6d55d1, #8b5cf6);">
                            <i class="fa-solid fa-wand-magic-sparkles text-white text-xs"></i>
                        </div>
                        <h2 class="text-xl font-bold text-gray-900">Công cụ AI IELTS</h2>
                    </div>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button type="button" @click="store.navigate('paraphrase')" 
                             class="text-left group p-6 rounded-3xl text-white cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all relative overflow-hidden"
                             style="background: linear-gradient(135deg, #059669, #10b981);">
                            <div class="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20 group-hover:rotate-12 transition-transform duration-500" style="background: white;"></div>
                            <div class="absolute right-6 top-6 text-5xl opacity-20 group-hover:rotate-12 transition-transform duration-500">
                                <i class="fa-solid fa-arrows-rotate"></i>
                            </div>
                            <div class="relative z-10">
                                <div class="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
                                    <i class="fa-solid fa-arrows-rotate text-white"></i>
                                </div>
                                <h3 class="text-lg font-bold mb-1">Huấn luyện Paraphrase</h3>
                                <p class="text-green-100 text-xs leading-relaxed">Nâng cấp câu văn lên chuẩn Band 8.0+</p>
                                <div class="mt-4 inline-flex items-center gap-2 text-xs font-bold bg-white/20 px-3 py-1.5 rounded-xl">
                                    Thử ngay <i class="fa-solid fa-arrow-right text-xs"></i>
                                </div>
                            </div>
                        </button>

                        <button type="button" @click="store.navigate('writing')" 
                             class="text-left group p-6 rounded-3xl text-white cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all relative overflow-hidden"
                             style="background: linear-gradient(135deg, #6d55d1, #7c3aed);">
                            <div class="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20 group-hover:-rotate-12 transition-transform duration-500" style="background: white;"></div>
                            <div class="absolute right-6 top-6 text-5xl opacity-20 group-hover:-rotate-12 transition-transform duration-500">
                                <i class="fa-solid fa-pen-nib"></i>
                            </div>
                            <div class="relative z-10">
                                <div class="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
                                    <i class="fa-solid fa-pen-nib text-white"></i>
                                </div>
                                <h3 class="text-lg font-bold mb-1">Máy chấm Essay</h3>
                                <p class="text-purple-100 text-xs leading-relaxed">Chấm điểm 4 tiêu chí IELTS Writing</p>
                                <div class="mt-4 inline-flex items-center gap-2 text-xs font-bold bg-white/20 px-3 py-1.5 rounded-xl">
                                    Chấm bài <i class="fa-solid fa-arrow-right text-xs"></i>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Rank Guide Modal -->
        <div v-if="showRankGuide" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" @click.self="showRankGuide = false">
            <div class="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
                <div class="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 class="font-extrabold text-gray-900 flex items-center gap-2 text-lg"><i class="fa-solid fa-ranking-star text-amber-500"></i> Bảng Phong Thần</h3>
                    <button @click="showRankGuide = false" class="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="p-5 max-h-[60vh] overflow-y-auto">
                    <p class="text-sm text-gray-500 mb-4 font-medium">Hệ thống cấp độ dựa vào <b class="text-amber-500">Tổng điểm LexiCredit</b> bạn kiếm được trọn đời. Cứ 50 LexiCredit sẽ thăng 1 cấp!</p>
                    <div class="space-y-3">
                        <div v-for="(rank, idx) in rankGuideList" :key="idx" class="flex items-center gap-4 p-3 rounded-2xl border border-gray-100 hover:border-purple-200 transition-colors" :class="currentRank.title === rank.title ? 'bg-purple-50 border-purple-200 shadow-sm' : ''">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-gray-50 shadow-inner">
                                {{ rank.icon }}
                            </div>
                            <div>
                                <h4 class="font-bold text-gray-900 leading-tight" :class="currentRank.title === rank.title ? 'text-purple-700' : ''">{{ rank.title }}</h4>
                                <p class="text-xs text-gray-500 font-medium">Lv.{{ rank.minLevel }}{{ rank.maxLevel === Infinity ? '+' : ' - ' + rank.maxLevel }}</p>
                            </div>
                            <div v-if="currentRank.title === rank.title" class="ml-auto px-2.5 py-1 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold uppercase tracking-wider">
                                Hiện tại
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};
