import { ref, onMounted, onUnmounted } from 'vue';
import { store } from '../store.js';

export default {
    setup() {
        const blocks = ref([]);
        const selectedBlock = ref(null);
        const startTime = ref(0);
        const timer = ref('0.0');
        const intervalId = ref(null);
        const isFinished = ref(false);
        const finalTime = ref(0);
        
        onMounted(() => {
            if (!store.activeCards || store.activeCards.length === 0) {
                store.navigate('deck-detail');
                return;
            }
            initGame();
        });

        onUnmounted(() => {
            if (intervalId.value) clearInterval(intervalId.value);
        });

        const initGame = () => {
            isFinished.value = false;
            selectedBlock.value = null;
            timer.value = '0.0';
            
            // Randomly select up to 10 cards
            const shuffledCards = [...store.activeCards].sort(() => Math.random() - 0.5).slice(0, 10);
            
            const newBlocks = [];
            shuffledCards.forEach((c) => {
                // Term block
                newBlocks.push({
                    id: `term_${c.id}`,
                    cardId: c.id,
                    type: 'term',
                    text: c.term,
                    matched: false,
                    state: 'normal', // normal, selected, wrong
                    x: Math.random() * 80 + 10, // 10% to 90%
                    y: Math.random() * 80 + 10,
                    vx: (Math.random() - 0.5) * 0.15,
                    vy: (Math.random() - 0.5) * 0.15
                });
                
                // Definition block
                newBlocks.push({
                    id: `def_${c.id}`,
                    cardId: c.id,
                    type: 'def',
                    text: c.definition,
                    matched: false,
                    state: 'normal',
                    x: Math.random() * 80 + 10,
                    y: Math.random() * 80 + 10,
                    vx: (Math.random() - 0.5) * 0.15,
                    vy: (Math.random() - 0.5) * 0.15
                });
            });
            
            blocks.value = newBlocks;
            startTime.value = Date.now();
            
            intervalId.value = setInterval(() => {
                // Update timer
                const elapsed = (Date.now() - startTime.value) / 1000;
                timer.value = elapsed.toFixed(1);
                
                // Update floating physics
                blocks.value.forEach(b => {
                    if (b.matched) return;
                    b.x += b.vx;
                    b.y += b.vy;
                    // Bounce off walls (10 to 90 to keep inside screen roughly)
                    if (b.x < 5 || b.x > 95) b.vx *= -1;
                    if (b.y < 5 || b.y > 90) b.vy *= -1;
                    
                    // Keep bounds
                    b.x = Math.max(5, Math.min(95, b.x));
                    b.y = Math.max(5, Math.min(90, b.y));
                });
            }, 50);
        };

        const handleBlockClick = (block) => {
            if (block.matched || isFinished.value) return;
            
            if (!selectedBlock.value) {
                // First selection
                selectedBlock.value = block;
                block.state = 'selected';
            } else if (selectedBlock.value.id === block.id) {
                // Deselect self
                selectedBlock.value = null;
                block.state = 'normal';
            } else {
                // Second selection
                const prev = selectedBlock.value;
                selectedBlock.value = null;
                
                if (prev.cardId === block.cardId && prev.type !== block.type) {
                    // Match
                    prev.matched = true;
                    block.matched = true;
                    // Play sound
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
                    audio.volume = 0.5;
                    audio.play().catch(e => {});
                    
                    checkWinCondition();
                } else {
                    // Wrong
                    prev.state = 'wrong';
                    block.state = 'wrong';
                    // Penalty
                    startTime.value -= 2000; // Add 2 seconds penalty
                    setTimeout(() => {
                        if (!prev.matched) prev.state = 'normal';
                        if (!block.matched) block.state = 'normal';
                    }, 500);
                }
            }
        };

        const checkWinCondition = () => {
            if (blocks.value.every(b => b.matched)) {
                clearInterval(intervalId.value);
                isFinished.value = true;
                finalTime.value = parseFloat(timer.value);
                
                // Gamification
                let xpEarned = 10;
                if (finalTime.value < 30) xpEarned = 50;
                // Add LexiCredit (10 for game complete)
                store.addLexiCredit(10, 'action');
                
                if (finalTime.value < 30) {
                    store.unlockBadge('speed_demon');
                }
            }
        };

        const getBlockClass = (b) => {
            let cls = 'absolute transform -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-white rounded-xl shadow-lg border-2 font-bold cursor-pointer transition-colors duration-200 text-center select-none ';
            if (b.type === 'term') cls += 'text-lg text-gray-800 ';
            else cls += 'text-sm text-gray-600 ';
            
            if (b.state === 'selected') cls += 'border-blue-500 ring-4 ring-blue-100 scale-110 z-20 ';
            else if (b.state === 'wrong') cls += 'border-red-500 bg-red-50 text-red-700 shake z-20 ';
            else cls += 'border-gray-200 hover:border-gray-300 z-10 hover:scale-105 ';
            
            if (b.matched) cls += 'opacity-0 scale-50 pointer-events-none transition-all duration-300 ';
            
            return cls;
        };

        return { store, blocks, timer, isFinished, finalTime, initGame, handleBlockClick, getBlockClass };
    },
    template: `
        <div class="fixed inset-0 bg-gray-50 z-50 flex flex-col hide-in-focus overflow-hidden">
            <!-- Header -->
            <div class="flex justify-between items-center p-4 bg-white shadow-sm z-30">
                <button @click="store.navigate('deck-detail')" class="text-gray-500 hover:text-blue-600 font-medium flex items-center gap-2">
                    <i class="fa-solid fa-arrow-left"></i> Thoát
                </button>
                <div class="text-2xl font-mono font-bold text-gray-800" :class="{'text-green-600': isFinished}">
                    {{ timer }}s
                </div>
                <div class="w-16"></div>
            </div>
            
            <!-- Game Board -->
            <div class="flex-1 relative overflow-hidden" style="background: radial-gradient(circle, #f8fafc 0%, #e2e8f0 100%);">
                <template v-if="!isFinished">
                    <div v-for="b in blocks" :key="b.id"
                         :class="getBlockClass(b)"
                         :style="{ left: b.x + '%', top: b.y + '%' }"
                         @click="handleBlockClick(b)">
                         {{ b.text }}
                    </div>
                </template>
                
                <!-- Victory Screen -->
                <div v-if="isFinished" class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-40 animate-fade-in">
                    <div class="glass-panel p-10 rounded-3xl text-center shadow-2xl max-w-md w-full mx-4 animate-scale-in">
                        <div class="text-6xl mb-4">🏆</div>
                        <h2 class="text-3xl font-extrabold text-gray-900 mb-2">Hoàn Thành!</h2>
                        <p class="text-gray-500 font-medium mb-6">Bạn đã dọn sạch màn hình trong:</p>
                        <div class="text-5xl font-mono font-bold text-blue-600 mb-8">{{ finalTime }}s</div>
                        
                        <div class="flex gap-3 justify-center">
                            <button @click="initGame" class="btn-primary px-8 py-3">Chơi Lại</button>
                            <button @click="store.navigate('deck-detail')" class="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition">Quay Về</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};
