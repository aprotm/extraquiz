import { ref, computed, onMounted, onUnmounted } from 'vue';
import { store } from '../store.js';
import { showToast } from '../toast.js';
import { playCorrect, playIncorrect, playLetterTap, playCombo, playSkillCast, playVictory } from '../sfx.js';
import { speakEnglishText } from '../voice.js';

export default {
    name: 'CyberCipher',
    setup() {
        const gameState = ref('playing'); // 'playing', 'completed'
        const currentIndex = ref(0);
        const userLetters = ref([]);
        const availableLetters = ref([]);
        const isChecking = ref(false);
        const streak = ref(0);
        const maxStreak = ref(0);
        const totalWordsSolved = ref(0);
        const earnedLC = ref(0);
        const isHintUsed = ref(false);
        const timerSeconds = ref(0);
        let timerInterval = null;

        const cardsPool = computed(() => {
            if (store.activeCards && store.activeCards.length > 0) {
                return store.activeCards.filter(c => c.term && c.term.trim().length >= 3);
            }
            if (store.allUserCards && store.allUserCards.length > 0) {
                return store.allUserCards.filter(c => c.term && c.term.trim().length >= 3);
            }
            if (store.decks && store.decks.length > 0) {
                const all = [];
                store.decks.forEach(d => {
                    if (d.cards && Array.isArray(d.cards)) {
                        all.push(...d.cards.filter(c => c.term && c.term.trim().length >= 3));
                    }
                });
                if (all.length > 0) return all;
            }
            return [
                { term: 'PARADIGM', definition: 'Mô hình, hệ quy chuẩn, kiểu mẫu mẫu mực', example: 'A major paradigm shift in science.' },
                { term: 'RESILIENCE', definition: 'Khả năng phục hồi nhanh sau khó khăn nghịch cảnh', example: 'Courage and resilience in the storm.' },
                { term: 'INNOVATION', definition: 'Sự đổi mới, sáng tạo giải pháp đột phá', example: 'Technological innovation changes the world.' },
                { term: 'SYNTHESIS', definition: 'Sự tổng hợp, kết hợp các yếu tố thành một thể thống nhất', example: 'The synthesis of intellect and emotion.' },
                { term: 'PERSISTENCE', definition: 'Sự kiên trì, bền chí không bỏ cuộc', example: 'Success demands tireless persistence.' }
            ];
        });

        const currentCard = computed(() => {
            if (cardsPool.value.length === 0) return null;
            return cardsPool.value[currentIndex.value % cardsPool.value.length];
        });

        const cleanTerm = computed(() => {
            if (!currentCard.value) return '';
            return currentCard.value.term.toUpperCase().replace(/[^A-Z]/g, '');
        });

        const initWord = () => {
            if (!currentCard.value) return;
            userLetters.value = [];
            isHintUsed.value = false;
            
            const letters = cleanTerm.value.split('').map((char, index) => ({
                id: `${char}_${index}_${Math.random()}`,
                char: char,
                originalIndex: index,
                isUsed: false
            }));
            
            // Shuffle
            let shuffled = [...letters].sort(() => 0.5 - Math.random());
            // Ensure not identical to original word
            if (shuffled.map(l => l.char).join('') === cleanTerm.value && letters.length > 1) {
                shuffled.reverse();
            }
            availableLetters.value = shuffled;
        };

        const pickLetter = (letterObj) => {
            if (letterObj.isUsed || isChecking.value) return;
            letterObj.isUsed = true;
            userLetters.value.push(letterObj);
            playLetterTap();
            checkAutoSubmit();
        };

        const removeLetter = (index) => {
            if (isChecking.value) return;
            const removed = userLetters.value.splice(index, 1)[0];
            if (removed) {
                removed.isUsed = false;
                playLetterTap();
            }
        };

        const clearAllLetters = () => {
            userLetters.value.forEach(l => { l.isUsed = false; });
            userLetters.value = [];
            playLetterTap();
        };

        const shuffleAvailable = () => {
            const unused = availableLetters.value.filter(l => !l.isUsed);
            const shuffledUnused = unused.sort(() => 0.5 - Math.random());
            let unusedIdx = 0;
            availableLetters.value = availableLetters.value.map(l => {
                if (!l.isUsed) {
                    return shuffledUnused[unusedIdx++];
                }
                return l;
            });
            playSkillCast();
        };

        const revealHintLetter = () => {
            if (isHintUsed.value || isChecking.value) return;
            const currentConstructedLength = userLetters.value.length;
            if (currentConstructedLength >= cleanTerm.value.length) return;
            
            const nextCorrectChar = cleanTerm.value[currentConstructedLength];
            const candidate = availableLetters.value.find(l => !l.isUsed && l.char === nextCorrectChar);
            if (candidate) {
                pickLetter(candidate);
                isHintUsed.value = true;
                showToast(`💡 Đã giải mã gợi ý chữ: "${nextCorrectChar}"`, 'info');
            }
        };

        const checkAutoSubmit = () => {
            if (userLetters.value.length === cleanTerm.value.length) {
                isChecking.value = true;
                const constructed = userLetters.value.map(l => l.char).join('');
                if (constructed === cleanTerm.value) {
                    // CORRECT
                    streak.value++;
                    if (streak.value > maxStreak.value) maxStreak.value = streak.value;
                    totalWordsSolved.value++;
                    playCorrect();
                    playCombo(streak.value);
                    
                    const bonus = streak.value >= 3 ? 15 : 10;
                    earnedLC.value += bonus;
                    store.addLexiCredit(bonus, `Giải mã Cyber Cipher: ${cleanTerm.value}`);
                    store.recordStudyStats(1, 1);
                    
                    setTimeout(() => {
                        isChecking.value = false;
                        if (currentIndex.value + 1 < cardsPool.value.length && currentIndex.value < 10) {
                            currentIndex.value++;
                            initWord();
                        } else {
                            endGame();
                        }
                    }, 600);
                } else {
                    // INCORRECT
                    streak.value = 0;
                    playIncorrect();
                    setTimeout(() => {
                        clearAllLetters();
                        isChecking.value = false;
                    }, 600);
                }
            }
        };

        const endGame = () => {
            gameState.value = 'completed';
            clearInterval(timerInterval);
            playVictory();
        };

        const restartGame = () => {
            currentIndex.value = 0;
            streak.value = 0;
            maxStreak.value = 0;
            totalWordsSolved.value = 0;
            earnedLC.value = 0;
            timerSeconds.value = 0;
            gameState.value = 'playing';
            initWord();
            startTimer();
        };

        const startTimer = () => {
            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                if (gameState.value === 'playing') {
                    timerSeconds.value++;
                }
            }, 1000);
        };

        const handleKeydown = (e) => {
            if (gameState.value !== 'playing' || isChecking.value) return;
            const key = e.key.toUpperCase();
            if (key === 'BACKSPACE') {
                if (userLetters.value.length > 0) {
                    removeLetter(userLetters.value.length - 1);
                }
                e.preventDefault();
            } else if (key === ' ' || key === 'SPACEBAR') {
                shuffleAvailable();
                e.preventDefault();
            } else if (/^[A-Z]$/.test(key)) {
                const candidate = availableLetters.value.find(l => !l.isUsed && l.char === key);
                if (candidate) {
                    pickLetter(candidate);
                }
            }
        };

        onMounted(() => {
            initWord();
            startTimer();
            window.addEventListener('keydown', handleKeydown);
        });

        onUnmounted(() => {
            clearInterval(timerInterval);
            window.removeEventListener('keydown', handleKeydown);
        });

        return {
            store, gameState, currentIndex, currentCard, cleanTerm, userLetters, availableLetters,
            isChecking, streak, maxStreak, totalWordsSolved, earnedLC, timerSeconds,
            pickLetter, removeLetter, clearAllLetters, shuffleAvailable, revealHintLetter,
            restartGame, speakEnglishText
        };
    },
    template: `
        <div class="max-w-4xl mx-auto px-2 sm:px-4 py-4 select-none">
            
            <!-- TOP CONTROLS -->
            <div class="flex items-center justify-between gap-4 mb-6">
                <button @click="store.navigate('deck-detail')" class="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow-sm hover:bg-cyan-50 text-gray-600 hover:text-cyan-600 font-extrabold text-xs border border-gray-100 transition-all active:scale-95">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Trở Về</span>
                </button>

                <div class="flex items-center gap-2">
                    <span class="px-3 py-1.5 rounded-full text-xs font-black bg-cyan-50 text-cyan-700 border border-cyan-200 uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                        <i class="fa-solid fa-terminal text-cyan-600"></i>
                        <span>Cyber Cipher: Giải Mã Từ</span>
                    </span>
                </div>

                <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 font-extrabold text-xs shadow-sm">
                    <i class="fa-solid fa-gem text-amber-500"></i>
                    <span>+{{ earnedLC }} LC</span>
                </div>
            </div>

            <!-- ========================================================================= -->
            <!-- SCREEN 1: ACTIVE HACK TERMINAL                                            -->
            <!-- ========================================================================= -->
            <div v-if="gameState === 'playing' && currentCard" class="space-y-6 animate-fade-in">
                
                <!-- TERMINAL HUD HEADER -->
                <div class="p-6 rounded-3xl bg-gradient-to-br from-[#0B1020] via-[#111827] to-[#0F172A] border border-cyan-500/40 text-cyan-400 shadow-2xl relative overflow-hidden cyber-glow">
                    <div class="flex items-center justify-between gap-4 mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-3 h-3 rounded-full bg-cyan-400 animate-ping"></div>
                            <div class="text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase">
                                TERMINAL DECRYPT // SEQUENCE #{{ currentIndex + 1 }}
                            </div>
                        </div>
                        <div class="flex items-center gap-4 text-xs font-mono font-bold">
                            <span v-if="streak > 1" class="text-amber-400 animate-bounce">⚡ COMBO {{ streak }}x</span>
                            <span class="text-gray-400">⏱️ {{ timerSeconds }}s</span>
                        </div>
                    </div>

                    <!-- Clue Card Area -->
                    <div class="text-center py-2">
                        <div class="inline-flex items-center gap-2 mb-2 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/80">
                            <span class="text-xs text-cyan-300 font-bold">Nghĩa Tiếng Việt</span>
                            <button @click="speakEnglishText(currentCard.term)" class="w-6 h-6 rounded-full bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 flex items-center justify-center transition" title="Nghe âm thanh gợi ý">
                                <i class="fa-solid fa-volume-high text-[10px]"></i>
                            </button>
                        </div>
                        <h3 class="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">{{ currentCard.definition }}</h3>
                        <p v-if="currentCard.example" class="text-xs sm:text-sm text-cyan-200/80 italic font-mono max-w-xl mx-auto">
                            "{{ currentCard.example }}"
                        </p>
                    </div>
                </div>

                <!-- USER CONSTRUCTED SLOTS -->
                <div class="glass-panel p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-xl text-center space-y-6">
                    <div class="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                        Từ Đang Ghép ({{ userLetters.length }} / {{ cleanTerm.length }} Ký Tự)
                    </div>

                    <!-- Slots Row -->
                    <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 min-h-[64px]">
                        <div v-for="(charObj, idx) in cleanTerm.split('')" :key="idx"
                             @click="userLetters[idx] ? removeLetter(idx) : null"
                             class="w-12 h-14 sm:w-14 sm:h-16 rounded-2xl flex items-center justify-center font-mono font-black text-xl sm:text-2xl border-2 transition-all cursor-pointer select-none"
                             :class="[
                                 userLetters[idx] ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-md shadow-cyan-500/20 hover:scale-95' :
                                 'bg-gray-50 border-dashed border-gray-300 text-transparent'
                             ]">
                            {{ userLetters[idx]?.char || '_' }}
                        </div>
                    </div>

                    <!-- SCRAMBLED LETTER TILES BANK -->
                    <div class="pt-4 border-t border-gray-100">
                        <div class="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
                            Bấm hoặc Gõ phím để chọn ký tự
                        </div>
                        <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-lg mx-auto">
                            <button v-for="letter in availableLetters" :key="letter.id"
                                    @click="pickLetter(letter)"
                                    :disabled="letter.isUsed || isChecking"
                                    class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl font-mono font-black text-lg sm:text-xl border-2 transition-all select-none relative overflow-hidden flex items-center justify-center"
                                    :class="[
                                        letter.isUsed ? 'opacity-20 bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed scale-90' :
                                        'bg-white border-gray-200 text-gray-800 hover:border-cyan-500 hover:bg-cyan-50 hover:shadow-md active:scale-95'
                                    ]">
                                {{ letter.char }}
                            </button>
                        </div>
                    </div>

                    <!-- UTILITY ACTIONS HOTBAR -->
                    <div class="flex items-center justify-center gap-3 pt-2">
                        <button @click="clearAllLetters" class="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-600 font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5">
                            <i class="fa-solid fa-rotate-left"></i>
                            <span>Xóa Hết</span>
                        </button>
                        <button @click="shuffleAvailable" class="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5">
                            <i class="fa-solid fa-shuffle"></i>
                            <span>Xáo Trộn (Space)</span>
                        </button>
                        <button @click="revealHintLetter" class="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 border border-amber-200">
                            <i class="fa-solid fa-lightbulb"></i>
                            <span>Gợi Ý 1 Chữ</span>
                        </button>
                    </div>
                </div>

            </div>

            <!-- ========================================================================= -->
            <!-- SCREEN 2: MISSION COMPLETE                                                -->
            <!-- ========================================================================= -->
            <div v-else-if="gameState === 'completed'" class="glass-panel-strong p-8 rounded-3xl text-center bg-gradient-to-b from-[#0B1020] via-[#111827] to-[#0F172A] border border-cyan-400/50 text-white shadow-2xl space-y-6 animate-fade-in">
                <div class="w-24 h-24 mx-auto flex items-center justify-center animate-bounce">
                    <img src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Unlocked/3D/unlocked_3d.png" class="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(6,182,212,0.5)]">
                </div>

                <div>
                    <h2 class="text-3xl sm:text-4xl font-black text-cyan-400 tracking-tight mb-2">HACK THÀNH CÔNG!</h2>
                    <p class="text-sm text-gray-300 font-medium">Toàn bộ mật mã từ vựng đã được giải mã chính xác vào bộ nhớ não bộ!</p>
                </div>

                <div class="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                    <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div class="text-[10px] uppercase font-bold text-gray-400 mb-1">Đã Giải Mã</div>
                        <div class="text-2xl font-black text-cyan-400">{{ totalWordsSolved }} Từ</div>
                    </div>
                    <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div class="text-[10px] uppercase font-bold text-gray-400 mb-1">Max Combo</div>
                        <div class="text-2xl font-black text-amber-400">{{ maxStreak }}x</div>
                    </div>
                    <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div class="text-[10px] uppercase font-bold text-gray-400 mb-1">Thưởng LC</div>
                        <div class="text-2xl font-black text-emerald-400">+{{ earnedLC }} LC</div>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-4">
                    <button @click="restartGame" class="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition-all active:scale-95">
                        <i class="fa-solid fa-rotate-right mr-2"></i> Chơi Lượt Mới
                    </button>
                    <button @click="store.navigate('deck-detail')" class="flex-1 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all active:scale-95">
                        Trở Về Bộ Thẻ
                    </button>
                </div>
            </div>

        </div>
    `
};
