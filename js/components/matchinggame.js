import { ref, computed, onMounted, onUnmounted } from 'vue';
import { store } from '../store.js';
import { playCorrect, playIncorrect, playCombo, playLetterTap, playVictory, playClick } from '../sfx.js';
import { speakEnglishText } from '../voice.js';

export default {
    name: 'MatchingGame',
    setup() {
        const pairCount = ref(8);
        const autoPronounce = ref(true);
        const gameState = ref('playing'); // 'playing' | 'finished'
        const blocks = ref([]);
        const selectedBlock = ref(null);
        const startTime = ref(0);
        const timer = ref('0.0');
        const intervalId = ref(null);
        const finalTime = ref(0);
        const combo = ref(0);
        const maxCombo = ref(0);
        const mistakes = ref(0);
        const score = ref(0);
        const earnedLC = ref(0);
        const earnedXP = ref(0);
        const stars = ref(3);
        const rankGrade = ref('S');
        const floatingScores = ref([]);
        const isScreenShaking = ref(false);
        const recentMatchedWord = ref('');

        const cardsPool = computed(() => {
            if (store.activeCards && store.activeCards.length >= 4) {
                return store.activeCards;
            }
            if (store.allUserCards && store.allUserCards.length >= 4) {
                return store.allUserCards;
            }
            if (store.decks && store.decks.length > 0) {
                const all = [];
                store.decks.forEach(d => {
                    if (d.cards && Array.isArray(d.cards)) all.push(...d.cards);
                });
                if (all.length >= 4) return all;
            }
            return [
                { id: 'c1', term: 'Perseverance', definition: 'Sự kiên trì, bền bỉ vượt qua khó khăn' },
                { id: 'c2', term: 'Ephemeral', definition: 'Phù du, chóng tàn, tồn tại trong chớp mắt' },
                { id: 'c3', term: 'Resilience', definition: 'Khả năng phục hồi nhanh chóng sau nghịch cảnh' },
                { id: 'c4', term: 'Ubiquitous', definition: 'Có mặt ở khắp mọi nơi, phổ biến rộng rãi' },
                { id: 'c5', term: 'Pragmatic', definition: 'Thực tế, coi trọng tính ứng dụng' },
                { id: 'c6', term: 'Meticulous', definition: 'Tỉ mỉ, cẩn thận đến từng chi tiết nhỏ' },
                { id: 'c7', term: 'Audacious', definition: 'Táo bạo, dám nghĩ dám làm' },
                { id: 'c8', term: 'Eloquent', definition: 'Hùng biện, diễn đạt lưu loát và thuyết phục' },
                { id: 'c9', term: 'Phenomenal', definition: 'Phi thường, kỳ diệu, ấn tượng sâu sắc' },
                { id: 'c10', term: 'Synchronize', definition: 'Đồng bộ hóa các tiến trình cùng lúc' },
                { id: 'c11', term: 'Versatile', definition: 'Đa năng, linh hoạt trong mọi tình huống' },
                { id: 'c12', term: 'Tenacity', definition: 'Tính ngoan cường, quyết tâm không bỏ cuộc' }
            ];
        });

        const activeDeckName = computed(() => {
            if (store.activeDeck?.title) return store.activeDeck.title;
            if (store.activeCards?.length) return 'Bộ Thẻ Đang Học';
            if (store.allUserCards?.length) return 'Kho Từ Của Bạn';
            return 'Từ Vựng Học Thuật IELTS';
        });

        const matchedPairs = computed(() => {
            return blocks.value.filter(b => b.matched && b.type === 'term').length;
        });

        const totalPairs = computed(() => {
            return blocks.value.length / 2;
        });

        const progressPercent = computed(() => {
            if (!totalPairs.value) return 0;
            return Math.round((matchedPairs.value / totalPairs.value) * 100);
        });

        const accuracyPercent = computed(() => {
            const totalAttempts = matchedPairs.value + mistakes.value;
            if (totalAttempts === 0) return 100;
            return Math.max(0, Math.round((matchedPairs.value / totalAttempts) * 100));
        });

        onMounted(() => {
            initGame();
        });

        onUnmounted(() => {
            if (intervalId.value) clearInterval(intervalId.value);
        });

        const setPairCount = (count) => {
            if (pairCount.value === count) return;
            pairCount.value = count;
            playClick();
            initGame();
        };

        const toggleAutoPronounce = () => {
            autoPronounce.value = !autoPronounce.value;
            playClick();
        };

        const initGame = () => {
            if (intervalId.value) clearInterval(intervalId.value);
            
            gameState.value = 'playing';
            selectedBlock.value = null;
            timer.value = '0.0';
            combo.value = 0;
            maxCombo.value = 0;
            mistakes.value = 0;
            score.value = 0;
            earnedLC.value = 0;
            earnedXP.value = 0;
            stars.value = 3;
            rankGrade.value = 'S';
            floatingScores.value = [];
            isScreenShaking.value = false;
            recentMatchedWord.value = '';

            const available = [...cardsPool.value];
            // Shuffle pool to pick random cards
            const shuffledPool = available.sort(() => Math.random() - 0.5);
            const count = Math.min(pairCount.value, shuffledPool.length);
            const selectedCards = shuffledPool.slice(0, count);

            const newBlocks = [];
            selectedCards.forEach((card, idx) => {
                // English Term Block
                newBlocks.push({
                    id: `term_${card.id || idx}_${Math.random()}`,
                    cardId: card.id || `card_${idx}`,
                    type: 'term',
                    text: card.term,
                    fullCard: card,
                    matched: false,
                    state: 'normal'
                });

                // Vietnamese Definition Block
                newBlocks.push({
                    id: `def_${card.id || idx}_${Math.random()}`,
                    cardId: card.id || `card_${idx}`,
                    type: 'def',
                    text: card.definition,
                    fullCard: card,
                    matched: false,
                    state: 'normal'
                });
            });

            // Thoroughly shuffle the cards on the grid
            blocks.value = newBlocks.sort(() => Math.random() - 0.5);

            startTime.value = Date.now();
            intervalId.value = setInterval(() => {
                const elapsed = (Date.now() - startTime.value) / 1000;
                timer.value = elapsed.toFixed(1);
            }, 100);
        };

        const handleBlockClick = (block) => {
            if (block.matched || gameState.value === 'finished' || block.state === 'wrong') return;

            if (!selectedBlock.value) {
                // First Selection
                selectedBlock.value = block;
                block.state = 'selected';
                playLetterTap();

                if (block.type === 'term' && autoPronounce.value) {
                    speakEnglishText(block.text);
                }
            } else if (selectedBlock.value.id === block.id) {
                // Deselect self
                selectedBlock.value = null;
                block.state = 'normal';
                playClick();
            } else {
                // Second Selection
                const prev = selectedBlock.value;
                selectedBlock.value = null;

                if (prev.cardId === block.cardId && prev.type !== block.type) {
                    // MATCH SUCCESS!
                    prev.matched = true;
                    block.matched = true;
                    prev.state = 'matched';
                    block.state = 'matched';

                    combo.value++;
                    if (combo.value > maxCombo.value) maxCombo.value = combo.value;

                    const comboMultiplier = Math.min(combo.value, 8);
                    const addedScore = 100 * comboMultiplier;
                    score.value += addedScore;

                    playCorrect();
                    playCombo(combo.value);

                    const termWord = prev.type === 'term' ? prev.text : block.text;
                    recentMatchedWord.value = termWord;

                    if (autoPronounce.value) {
                        speakEnglishText(termWord);
                    }

                    // Floating Score Popup
                    const floatId = Date.now();
                    floatingScores.value.push({
                        id: floatId,
                        text: `+${addedScore} ${combo.value > 1 ? `🔥 x${combo.value}` : ''}`
                    });
                    setTimeout(() => {
                        floatingScores.value = floatingScores.value.filter(f => f.id !== floatId);
                    }, 800);

                    checkWinCondition();
                } else {
                    // WRONG MATCH
                    prev.state = 'wrong';
                    block.state = 'wrong';
                    combo.value = 0;
                    mistakes.value++;
                    playIncorrect();

                    isScreenShaking.value = true;
                    setTimeout(() => { isScreenShaking.value = false; }, 350);

                    // Add +1.0s time penalty
                    startTime.value -= 1000;

                    setTimeout(() => {
                        if (!prev.matched) prev.state = 'normal';
                        if (!block.matched) block.state = 'normal';
                    }, 450);
                }
            }
        };

        const checkWinCondition = () => {
            if (blocks.value.every(b => b.matched)) {
                clearInterval(intervalId.value);
                gameState.value = 'finished';
                finalTime.value = parseFloat(timer.value);
                playVictory();

                const timePerPair = finalTime.value / totalPairs.value;
                if (timePerPair <= 3.0 && mistakes.value <= 2) {
                    stars.value = 3;
                    rankGrade.value = 'S';
                    earnedLC.value = 35 + (maxCombo.value * 2);
                    earnedXP.value = 80;
                } else if (timePerPair <= 5.5 && mistakes.value <= 5) {
                    stars.value = 2;
                    rankGrade.value = 'A';
                    earnedLC.value = 20 + maxCombo.value;
                    earnedXP.value = 50;
                } else {
                    stars.value = 1;
                    rankGrade.value = 'B';
                    earnedLC.value = 12;
                    earnedXP.value = 30;
                }

                store.addLexiCredit(earnedLC.value, `Hoàn thành Nối Từ (${finalTime.value}s)`);
                store.recordStudyActivity();

                if (finalTime.value < 20) {
                    store.unlockBadge('speed_demon');
                }

                if (window.confetti) {
                    window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
                }
            }
        };

        const handleExit = () => {
            if (store.activeDeck) {
                store.navigate('deck-detail');
            } else {
                store.navigate('dashboard');
            }
        };

        const speakWord = (word, event) => {
            if (event) event.stopPropagation();
            speakEnglishText(word);
        };

        return {
            store, pairCount, autoPronounce, gameState, blocks, selectedBlock,
            timer, finalTime, combo, maxCombo, mistakes, score, earnedLC, earnedXP,
            stars, rankGrade, floatingScores, isScreenShaking, recentMatchedWord,
            activeDeckName, matchedPairs, totalPairs, progressPercent, accuracyPercent,
            setPairCount, toggleAutoPronounce, initGame, handleBlockClick, handleExit, speakWord
        };
    },
    template: `
        <div class="max-w-4xl mx-auto px-2 sm:px-4 py-4 select-none" :class="{ 'animate-screen-shake': isScreenShaking }">
            
            <!-- TOP BAR / HEADER CONTROLS -->
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                <!-- Back / Exit Button -->
                <button @click="handleExit" 
                        class="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#131B2E] shadow-sm hover:bg-indigo-50 dark:hover:bg-[#1E293B] text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-extrabold text-xs border border-gray-100 dark:border-[#1E2540] transition-all active:scale-95">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Trở Về</span>
                </button>

                <!-- Center Title Badge & Vocab Source -->
                <div class="flex items-center gap-2">
                    <span class="px-3 py-1.5 rounded-full text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        <i class="fa-solid fa-puzzle-piece text-indigo-500 animate-wiggle"></i>
                        <span>Cyber Grid 3D: Nối Cặp Từ</span>
                    </span>
                    <span class="hidden md:inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 truncate max-w-[180px]">
                        {{ activeDeckName }}
                    </span>
                </div>

                <!-- Right Settings / TTS Toggle -->
                <div class="flex items-center gap-2">
                    <button @click="toggleAutoPronounce"
                            :title="autoPronounce ? 'Tắt tự động phát âm' : 'Bật tự động phát âm'"
                            class="px-3 py-1.5 rounded-2xl border text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-sm"
                            :class="autoPronounce ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-700/80 text-amber-700 dark:text-amber-300' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'">
                        <i class="fa-solid" :class="autoPronounce ? 'fa-volume-high' : 'fa-volume-xmark'"></i>
                        <span class="hidden sm:inline">Phát Âm</span>
                    </button>
                    
                    <button @click="initGame"
                            class="px-3 py-1.5 rounded-2xl bg-white dark:bg-[#131B2E] border border-gray-200 dark:border-[#1E2540] text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-[#1E293B] text-xs font-extrabold transition shadow-sm"
                            title="Xáo bài và chơi lại">
                        <i class="fa-solid fa-rotate-right"></i>
                    </button>
                </div>
            </div>

            <!-- DIFFICULTY / PAIR COUNT SELECTOR -->
            <div class="flex items-center justify-between bg-white dark:bg-[#131B2E] p-2.5 rounded-2xl border border-gray-100 dark:border-[#1E2540] shadow-sm mb-4">
                <div class="flex items-center gap-1.5">
                    <span class="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1.5">Số Cặp:</span>
                    <button v-for="cnt in [6, 8, 12]" :key="cnt"
                            @click="setPairCount(cnt)"
                            class="px-3 py-1 rounded-xl text-xs font-black transition-all"
                            :class="pairCount === cnt ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'">
                        {{ cnt }} Cặp
                    </button>
                </div>

                <!-- Live Score & LexiCredit Info -->
                <div class="flex items-center gap-3 pr-1.5">
                    <div class="flex items-center gap-1 text-xs font-mono font-black text-amber-600 dark:text-amber-400">
                        <i class="fa-solid fa-trophy text-amber-500"></i>
                        <span>{{ score }} PTS</span>
                    </div>
                </div>
            </div>

            <!-- HUD STATUS BAR (TIMER, PROGRESS, COMBO) -->
            <div class="grid grid-cols-3 gap-2.5 sm:gap-4 mb-4">
                <!-- Stopwatch Timer Card -->
                <div class="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#131B2E] border border-gray-100 dark:border-[#1E2540] shadow-sm flex items-center justify-between">
                    <div>
                        <div class="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">Thời Gian</div>
                        <div class="text-lg sm:text-2xl font-mono font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                            <i class="fa-solid fa-stopwatch text-indigo-500 text-sm sm:text-base"></i>
                            <span>{{ timer }}s</span>
                        </div>
                    </div>
                    <div v-if="mistakes > 0" class="text-[11px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900">
                        +{{ mistakes }}s phạt
                    </div>
                </div>

                <!-- Matched Pairs Progress Card -->
                <div class="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#131B2E] border border-gray-100 dark:border-[#1E2540] shadow-sm flex flex-col justify-between">
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">Đã Ghép</span>
                        <span class="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">{{ matchedPairs }}/{{ totalPairs }}</span>
                    </div>
                    <div class="w-full bg-gray-100 dark:bg-[#0B1020] rounded-full h-2 overflow-hidden mt-1.5 border border-gray-200/50 dark:border-gray-700/50">
                        <div class="bg-gradient-to-r from-indigo-500 to-amber-500 h-full rounded-full transition-all duration-300"
                             :style="{ width: progressPercent + '%' }"></div>
                    </div>
                </div>

                <!-- Combo Multiplier Card -->
                <div class="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#131B2E] border border-gray-100 dark:border-[#1E2540] shadow-sm flex items-center justify-between overflow-hidden relative">
                    <div>
                        <div class="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">Combo Streak</div>
                        <div class="text-lg sm:text-2xl font-black" :class="combo > 1 ? 'text-amber-500 animate-combo-pop' : 'text-gray-400 dark:text-gray-600'">
                            {{ combo > 1 ? combo + 'x 🔥' : '1x' }}
                        </div>
                    </div>
                    <div v-if="combo >= 3" class="text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2 py-0.5 rounded-md shadow-sm animate-pulse">
                        SUPER
                    </div>
                </div>
            </div>

            <!-- FLOATING SCORE NOTIFICATIONS CONTAINER -->
            <div class="relative">
                <div v-for="f in floatingScores" :key="f.id"
                     class="absolute -top-3 left-1/2 -translate-x-1/2 animate-float-score font-black text-xl text-amber-500 drop-shadow-md z-40 pointer-events-none whitespace-nowrap">
                    {{ f.text }}
                </div>
            </div>

            <!-- ========================================================================= -->
            <!-- 3D CYBER GRID CARDS CANVAS                                                -->
            <!-- ========================================================================= -->
            <div v-if="gameState === 'playing'" 
                 class="grid gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-3xl bg-gray-50/80 dark:bg-[#0B1020]/90 border border-gray-200/80 dark:border-[#1E2540] shadow-inner backdrop-blur-sm"
                 :class="{
                     'grid-cols-2 sm:grid-cols-3 md:grid-cols-4': pairCount === 6 || pairCount === 8,
                     'grid-cols-2 sm:grid-cols-4 md:grid-cols-6': pairCount === 12
                 }">
                
                <div v-for="block in blocks" :key="block.id"
                     @click="handleBlockClick(block)"
                     class="relative min-h-[90px] sm:min-h-[105px] p-3 sm:p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition-all duration-200 select-none overflow-hidden"
                     :class="[
                         block.matched ? 'opacity-0 scale-75 pointer-events-none transition-all duration-500' : 'hover:scale-[1.03] active:scale-95',
                         block.state === 'selected' 
                             ? 'ring-4 ring-amber-400 bg-amber-50 dark:bg-amber-950/70 border-2 border-amber-400 shadow-xl neon-selected-glow z-20 scale-[1.04]' 
                             : block.state === 'wrong'
                                 ? 'ring-4 ring-rose-500 bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-500 shadow-xl animate-screen-shake z-20'
                                 : block.type === 'term'
                                     ? 'bg-white dark:bg-[#131B2E] border-2 border-indigo-100 dark:border-indigo-900/60 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md'
                                     : 'bg-white dark:bg-[#161D33] border-2 border-amber-100 dark:border-amber-900/50 shadow-sm hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md'
                     ]">

                    <!-- Top Card Badge -->
                    <div class="flex items-center justify-between w-full mb-1">
                        <span class="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                              :class="block.type === 'term' ? 'bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300' : 'bg-amber-100 dark:bg-amber-900/70 text-amber-700 dark:text-amber-300'">
                            {{ block.type === 'term' ? 'ENG' : 'VIE' }}
                        </span>

                        <button v-if="block.type === 'term'"
                                @click.stop="speakWord(block.text, $event)"
                                class="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
                                title="Phát âm từ vựng">
                            <i class="fa-solid fa-volume-high text-[10px]"></i>
                        </button>
                    </div>

                    <!-- Card Main Text -->
                    <div class="my-auto text-center">
                        <p class="leading-snug break-words"
                           :class="block.type === 'term' 
                               ? 'font-black text-sm sm:text-base text-gray-900 dark:text-white tracking-tight' 
                               : 'font-medium text-xs sm:text-sm text-gray-700 dark:text-gray-200'">
                            {{ block.text }}
                        </p>
                    </div>

                    <!-- Bottom subtle indicator dot -->
                    <div class="w-full flex justify-center mt-1">
                        <div class="w-1.5 h-1.5 rounded-full"
                             :class="block.state === 'selected' ? 'bg-amber-500 animate-ping' : block.type === 'term' ? 'bg-indigo-300 dark:bg-indigo-700' : 'bg-amber-300 dark:bg-amber-700'"></div>
                    </div>
                </div>
            </div>

            <!-- ========================================================================= -->
            <!-- VICTORY / RESULTS MODAL (3-STAR RANKING SYSTEM)                            -->
            <!-- ========================================================================= -->
            <div v-if="gameState === 'finished'" 
                 class="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#131B2E] border-2 border-amber-400/60 shadow-2xl text-center space-y-6 animate-scale-in max-w-xl mx-auto">
                
                <!-- Victory Trophy & Star Sequence -->
                <div class="space-y-3">
                    <div class="w-20 h-20 mx-auto flex items-center justify-center animate-bounce">
                        <img src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Trophy/3D/trophy_3d.png" 
                             class="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(245,158,11,0.5)]">
                    </div>

                    <!-- 3-Star Rating Animation -->
                    <div class="flex items-center justify-center gap-3">
                        <i v-for="i in 3" :key="i"
                           class="fa-solid fa-star text-2xl sm:text-3xl transition-all duration-500 animate-star-pop"
                           :class="i <= stars ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]' : 'text-gray-300 dark:text-gray-700'"
                           :style="{ animationDelay: (i * 150) + 'ms' }"></i>
                    </div>

                    <h2 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        XUẤT SẮC! DỌN SẠCH BÀN CỜ!
                    </h2>
                    <p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                        Bạn đã hoàn thành kết nối toàn bộ {{ totalPairs }} cặp từ vựng với tốc độ ấn tượng!
                    </p>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <!-- Final Time -->
                    <div class="p-3 rounded-2xl bg-gray-50 dark:bg-[#0B1020] border border-gray-100 dark:border-[#1E2540]">
                        <div class="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-0.5">Thời Gian</div>
                        <div class="text-lg font-mono font-black text-indigo-600 dark:text-indigo-400">{{ finalTime }}s</div>
                    </div>

                    <!-- Max Combo -->
                    <div class="p-3 rounded-2xl bg-gray-50 dark:bg-[#0B1020] border border-gray-100 dark:border-[#1E2540]">
                        <div class="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-0.5">Max Combo</div>
                        <div class="text-lg font-black text-amber-500">{{ maxCombo }}x 🔥</div>
                    </div>

                    <!-- Accuracy -->
                    <div class="p-3 rounded-2xl bg-gray-50 dark:bg-[#0B1020] border border-gray-100 dark:border-[#1E2540]">
                        <div class="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-0.5">Chính Xác</div>
                        <div class="text-lg font-black text-emerald-500">{{ accuracyPercent }}%</div>
                    </div>

                    <!-- LexiCredit Reward -->
                    <div class="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                        <div class="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 mb-0.5">Thưởng LC</div>
                        <div class="text-lg font-black text-amber-600 dark:text-amber-400">+{{ earnedLC }} LC</div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col sm:flex-row gap-3 pt-2">
                    <button @click="initGame" 
                            class="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-500/25 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <i class="fa-solid fa-rotate-right"></i> Chơi Vòng Mới
                    </button>
                    <button @click="handleExit" 
                            class="flex-1 py-3.5 px-6 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-sm border border-gray-200 dark:border-gray-700 transition-all active:scale-95">
                        Trở Về
                    </button>
                </div>
            </div>
        </div>
    `
};
