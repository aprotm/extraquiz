import { ref, computed, onMounted, onUnmounted } from 'vue';
import { store } from '../store.js';
import { playCorrect, playIncorrect, playCombo, playLetterTap, playVictory } from '../sfx.js';

export default {
    name: 'MatchingGame',
    setup() {
        const blocks = ref([]);
        const selectedBlock = ref(null);
        const startTime = ref(0);
        const timer = ref('0.0');
        const intervalId = ref(null);
        const isFinished = ref(false);
        const finalTime = ref(0);
        const combo = ref(0);
        const maxCombo = ref(0);
        const score = ref(0);
        const earnedLC = ref(0);
        const floatingScores = ref([]);

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
                { id: 'c8', term: 'Eloquent', definition: 'Hùng biện, diễn đạt lưu loát và thuyết phục' }
            ];
        });
        
        onMounted(() => {
            initGame();
        });

        onUnmounted(() => {
            if (intervalId.value) clearInterval(intervalId.value);
        });

        const initGame = () => {
            isFinished.value = false;
            selectedBlock.value = null;
            timer.value = '0.0';
            combo.value = 0;
            maxCombo.value = 0;
            score.value = 0;
            earnedLC.value = 0;
            floatingScores.value = [];
            
            // Randomly select up to 8 pairs (16 blocks total for perfect grid flow)
            const availableCards = cardsPool.value;
            const shuffledCards = [...availableCards].sort(() => Math.random() - 0.5).slice(0, 8);
            
            const newBlocks = [];
            shuffledCards.forEach((c) => {
                // Term block
                newBlocks.push({
                    id: `term_${c.id}`,
                    cardId: c.id,
                    type: 'term',
                    text: c.term,
                    matched: false,
                    state: 'normal',
                    x: Math.random() * 75 + 12,
                    y: Math.random() * 70 + 15,
                    vx: (Math.random() - 0.5) * 0.18,
                    vy: (Math.random() - 0.5) * 0.18
                });
                
                // Definition block
                newBlocks.push({
                    id: `def_${c.id}`,
                    cardId: c.id,
                    type: 'def',
                    text: c.definition,
                    matched: false,
                    state: 'normal',
                    x: Math.random() * 75 + 12,
                    y: Math.random() * 70 + 15,
                    vx: (Math.random() - 0.5) * 0.18,
                    vy: (Math.random() - 0.5) * 0.18
                });
            });
            
            blocks.value = newBlocks;
            startTime.value = Date.now();
            
            intervalId.value = setInterval(() => {
                const elapsed = (Date.now() - startTime.value) / 1000;
                timer.value = elapsed.toFixed(1);
                
                // Update floating physics
                blocks.value.forEach(b => {
                    if (b.matched) return;
                    b.x += b.vx;
                    b.y += b.vy;
                    if (b.x < 8 || b.x > 92) b.vx *= -1;
                    if (b.y < 12 || b.y > 88) b.vy *= -1;
                    
                    b.x = Math.max(8, Math.min(92, b.x));
                    b.y = Math.max(12, Math.min(88, b.y));
                });
            }, 50);
        };

        const handleBlockClick = (block) => {
            if (block.matched || isFinished.value) return;
            
            if (!selectedBlock.value) {
                // First selection
                selectedBlock.value = block;
                block.state = 'selected';
                playLetterTap();
            } else if (selectedBlock.value.id === block.id) {
                // Deselect self
                selectedBlock.value = null;
                block.state = 'normal';
                playLetterTap();
            } else {
                // Second selection
                const prev = selectedBlock.value;
                selectedBlock.value = null;
                
                if (prev.cardId === block.cardId && prev.type !== block.type) {
                    // Match Success!
                    prev.matched = true;
                    block.matched = true;
                    combo.value++;
                    if (combo.value > maxCombo.value) maxCombo.value = combo.value;
                    
                    const addedScore = 100 * combo.value;
                    score.value += addedScore;
                    
                    playCorrect();
                    playCombo(combo.value);
                    
                    // Add floating score
                    const floatId = Date.now();
                    floatingScores.value.push({
                        id: floatId,
                        text: `+${addedScore} ${combo.value > 1 ? `🔥 x${combo.value}` : ''}`,
                        x: (prev.x + block.x) / 2,
                        y: (prev.y + block.y) / 2
                    });
                    setTimeout(() => {
                        floatingScores.value = floatingScores.value.filter(f => f.id !== floatId);
                    }, 800);
                    
                    checkWinCondition();
                } else {
                    // Wrong Match
                    prev.state = 'wrong';
                    block.state = 'wrong';
                    combo.value = 0;
                    playIncorrect();
                    startTime.value -= 1500; // 1.5s penalty
                    setTimeout(() => {
                        if (!prev.matched) prev.state = 'normal';
                        if (!block.matched) block.state = 'normal';
                    }, 400);
                }
            }
        };

        const checkWinCondition = () => {
            if (blocks.value.every(b => b.matched)) {
                clearInterval(intervalId.value);
                isFinished.value = true;
                finalTime.value = parseFloat(timer.value);
                playVictory();
                
                let baseLC = 20;
                if (finalTime.value < 25) baseLC = 40;
                earnedLC.value = baseLC + (maxCombo.value * 2);
                
                store.addLexiCredit(earnedLC.value, `Hoàn thành Nối Từ (${finalTime.value}s)`);
                store.recordStudyStats(blocks.value.length / 2, 1);
                
                if (finalTime.value < 20) {
                    store.unlockBadge('speed_demon');
                }
            }
        };

        const getBlockClass = (b) => {
            let cls = 'absolute transform -translate-x-1/2 -translate-y-1/2 px-4 py-3 rounded-2xl shadow-md border-2 font-extrabold cursor-pointer transition-all duration-200 text-center select-none ';
            if (b.type === 'term') cls += 'text-sm sm:text-base font-black tracking-tight text-gray-900 bg-white ';
            else cls += 'text-xs sm:text-sm font-medium text-gray-700 bg-amber-50/90 ';
            
            if (b.state === 'selected') cls += 'border-amber-400 ring-4 ring-amber-200/60 shadow-xl scale-110 z-30 bg-amber-100 text-amber-900 ';
            else if (b.state === 'wrong') cls += 'border-rose-500 bg-rose-50 text-rose-700 animate-screen-shake z-30 ';
            else cls += 'border-gray-200/90 hover:border-amber-400 hover:shadow-lg z-10 hover:scale-105 ';
            
            if (b.matched) cls += 'opacity-0 scale-50 pointer-events-none transition-all duration-300 ';
            
            return cls;
        };

        return {
            store, blocks, timer, isFinished, finalTime, combo, maxCombo, score, earnedLC,
            floatingScores, initGame, handleBlockClick, getBlockClass
        };
    },
    template: `
        <div class="fixed inset-0 bg-[#0F1426] text-white z-50 flex flex-col hide-in-focus overflow-hidden select-none">
            <!-- Header Bar -->
            <div class="flex justify-between items-center px-6 py-4 bg-[#151A2D] border-b border-[#1E2540] z-30 shadow-md">
                <button @click="store.navigate('deck-detail')" class="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-extrabold text-xs transition flex items-center gap-2">
                    <i class="fa-solid fa-arrow-left"></i> Rút lui
                </button>
                
                <!-- Center Timer & Combo -->
                <div class="flex items-center gap-6">
                    <div class="text-2xl font-mono font-black tracking-wider text-amber-400 flex items-center gap-2">
                        <i class="fa-solid fa-stopwatch text-amber-500 text-lg"></i>
                        <span>{{ timer }}s</span>
                    </div>
                    <div v-if="combo > 1" class="text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1 rounded-full animate-combo-pop shadow-md">
                        🔥 {{ combo }}x COMBO
                    </div>
                </div>

                <!-- Score Counter -->
                <div class="flex items-center gap-1.5 font-mono font-extrabold text-indigo-300 text-sm">
                    <i class="fa-solid fa-trophy text-amber-400"></i>
                    <span>{{ score }} PTS</span>
                </div>
            </div>
            
            <!-- Game Board Canvas -->
            <div class="flex-1 relative overflow-hidden" style="background: radial-gradient(circle at center, #1A2238 0%, #0B1020 100%);">
                <!-- Ambient Glow Orbs -->
                <div class="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
                <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

                <template v-if="!isFinished">
                    <div v-for="b in blocks" :key="b.id"
                         :class="getBlockClass(b)"
                         :style="{ left: b.x + '%', top: b.y + '%' }"
                         @click="handleBlockClick(b)">
                         {{ b.text }}
                    </div>

                    <!-- Floating Score Popups -->
                    <div v-for="f in floatingScores" :key="f.id"
                         class="absolute animate-float-score font-black text-lg text-amber-300 pointer-events-none z-40 whitespace-nowrap drop-shadow-md"
                         :style="{ left: f.x + '%', top: f.y + '%' }">
                        {{ f.text }}
                    </div>
                </template>
                
                <!-- Victory Screen Modal -->
                <div v-if="isFinished" class="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-40 animate-fade-in p-4">
                    <div class="glass-panel-strong p-8 sm:p-10 rounded-3xl text-center shadow-2xl max-w-md w-full bg-gradient-to-b from-[#0F1426] via-[#151A30] to-[#1E1B4B] border border-amber-400/50 text-white space-y-6 animate-scale-in">
                        <div class="w-24 h-24 mx-auto flex items-center justify-center animate-bounce">
                            <img src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Trophy/3D/trophy_3d.png" class="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(245,158,11,0.5)]">
                        </div>

                        <div>
                            <h2 class="text-3xl font-black text-amber-400 tracking-tight mb-1">DỌN SẠCH MÀN HÌNH!</h2>
                            <p class="text-sm text-gray-300 font-medium">Bạn đã hoàn thành kết nối toàn bộ các cặp từ vựng!</p>
                        </div>

                        <div class="grid grid-cols-3 gap-3">
                            <div class="p-3 rounded-2xl bg-white/5 border border-white/10">
                                <div class="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Thời Gian</div>
                                <div class="text-xl font-mono font-black text-cyan-400">{{ finalTime }}s</div>
                            </div>
                            <div class="p-3 rounded-2xl bg-white/5 border border-white/10">
                                <div class="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Max Combo</div>
                                <div class="text-xl font-black text-amber-400">{{ maxCombo }}x</div>
                            </div>
                            <div class="p-3 rounded-2xl bg-white/5 border border-white/10">
                                <div class="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Thưởng LC</div>
                                <div class="text-xl font-black text-emerald-400">+{{ earnedLC }} LC</div>
                            </div>
                        </div>
                        
                        <div class="flex gap-3 justify-center pt-2">
                            <button @click="initGame" class="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-all active:scale-95">
                                <i class="fa-solid fa-rotate-right mr-1.5"></i> Chơi Lại
                            </button>
                            <button @click="store.navigate('deck-detail')" class="flex-1 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all active:scale-95">
                                Trở Về
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

