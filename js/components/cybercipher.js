import { ref, computed, onMounted, onUnmounted } from 'vue';
import { store } from '../store.js';
import { showToast } from '../toast.js';
import { playCorrect, playIncorrect, playLetterTap, playCombo, playSkillCast, playVictory, playClick } from '../sfx.js';
import { speakEnglishText } from '../voice.js';

const CORE_CIPHER_WORDS = [
    // 4-Letter Codes (Beginner / Quick Decrypt)
    { term: 'DATA', definition: 'Dữ liệu số, thông tin thô trong hệ thống', example: 'Raw data is processed by the cloud engine.' },
    { term: 'CODE', definition: 'Mã nguồn, tập hợp chỉ thị cho máy tính', example: 'Clean code ensures scalable architecture.' },
    { term: 'NODE', definition: 'Điểm nút mạng, nút kết nối trong hệ thống', example: 'Every node in the network is synchronized.' },
    { term: 'SYNC', definition: 'Đồng bộ hóa các tiến trình thời gian thực', example: 'Sync cloud state across devices seamlessly.' },
    { term: 'GRID', definition: 'Lưới ma trận, cấu trúc tọa độ mạng lưới', example: 'The energy grid distributes power efficiently.' },
    { term: 'FLUX', definition: 'Sự biến đổi liên tục, dòng chảy năng lượng', example: 'Market trends are in constant flux.' },
    { term: 'ECHO', definition: 'Tiếng vang, tín hiệu phản hồi từ máy chủ', example: 'The ping command waits for an echo response.' },
    { term: 'LINK', definition: 'Liên kết, mối nối kết nối giữa các khối', example: 'Follow the link to the secure portal.' },

    // 5-Letter Codes (Cyber Operative)
    { term: 'CYBER', definition: 'Thuộc về không gian mạng, máy tính và Internet', example: 'Cyber security protects sensitive user assets.' },
    { term: 'LOGIC', definition: 'Tư duy logic, lập luận chặt chẽ và nhất quán', example: 'Clear logic solves complex algorithms.' },
    { term: 'PROXY', definition: 'Máy chủ trung gian điều hướng lưu lượng', example: 'Configure proxy to safeguard IP origin.' },
    { term: 'SMART', definition: 'Thông minh, tự động hóa và thích ứng cao', example: 'Smart contracts automate digital agreements.' },
    { term: 'FOCUS', definition: 'Sự tập trung cao độ vào mục tiêu cốt lõi', example: 'Maintain intense focus during deep learning.' },
    { term: 'PIVOT', definition: 'Chuyển hướng chiến lược nhanh chóng và linh hoạt', example: 'The startup made a successful pivot.' },
    { term: 'SOLVE', definition: 'Tìm ra lời giải, giải quyết triệt để bài toán', example: 'Solve complex cryptography challenges.' },
    { term: 'SPEED', definition: 'Tốc độ xử lý tính toán cực nhanh', example: 'Lightning speed data throughput.' },

    // 6-Letter Codes (Matrix Specialist)
    { term: 'CIPHER', definition: 'Mật mã, thuật toán mã hóa và giải mã', example: 'A quantum cipher protects the digital vault.' },
    { term: 'MATRIX', definition: 'Ma trận số liệu, môi trường đa chiều', example: 'Navigate the digital matrix effortlessly.' },
    { term: 'VECTOR', definition: 'Véc-tơ định hướng, đại lượng toán học', example: 'Calculate the vector transformation matrix.' },
    { term: 'MEMORY', definition: 'Bộ nhớ lưu trữ, dung lượng ghi nhớ thông tin', example: 'Fast memory cache speeds up processing.' },
    { term: 'KERNEL', definition: 'Nhân hệ điều hành, lõi xử lý trung tâm', example: 'The kernel manages hardware resources.' },
    { term: 'STREAM', definition: 'Luồng dữ liệu truyền tải liên tục', example: 'Real-time audio stream playback.' },
    { term: 'DOMAIN', definition: 'Tên miền hoặc lĩnh vực chuyên môn cụ thể', example: 'Master your technical domain.' },
    { term: 'SHIELD', definition: 'Lá chắn phòng thủ, bảo vệ khỏi mã độc', example: 'Active shield blocks intrusion attempts.' },

    // 7-Letter Codes (Quantum Operative)
    { term: 'NETWORK', definition: 'Mạng lưới kết nối đa điểm toàn cầu', example: 'A resilient decentralized network.' },
    { term: 'QUANTUM', definition: 'Cơ học lượng tử, bước nhảy vọt công nghệ', example: 'Quantum computing breaks standard RSA.' },
    { term: 'ENCRYPT', definition: 'Mã hóa thông tin thành chuỗi bảo mật', example: 'Encrypt end-to-end messages.' },
    { term: 'SYNAPSE', definition: 'Khớp thần kinh truyền tín hiệu não bộ', example: 'Synapses strengthen with spaced repetition.' },
    { term: 'GATEWAY', definition: 'Cổng kết nối giữa các mạng khác nhau', example: 'The API gateway routes all requests.' },
    { term: 'HOLISTIC', definition: 'Toàn diện, tổng thể, đa chiều', example: 'A holistic approach to language mastery.' },
    { term: 'MASTERY', definition: 'Sự thông thạo, tinh thông đỉnh cao', example: 'Practice leads to supreme mastery.' },

    // 8-Letter Codes (Cyber Phantom)
    { term: 'PARADIGM', definition: 'Mô hình chuẩn mực, hệ quy chuẩn kiểu mẫu', example: 'A major paradigm shift in modern learning.' },
    { term: 'SECURITY', definition: 'Sự an toàn, tính bảo mật hệ thống thông tin', example: 'Zero-trust security architecture.' },
    { term: 'TERMINAL', definition: 'Giao diện dòng lệnh máy tính tương tác', example: 'Execute scripts via the terminal.' },
    { term: 'VELOCITY', definition: 'Vận tốc, tốc độ tiến bộ vượt bậc theo thời gian', example: 'High velocity feature development.' },
    { term: 'FEEDBACK', definition: 'Thông tin phản hồi, đánh giá để hoàn thiện', example: 'Actionable feedback fuels rapid growth.' },
    { term: 'STRATEGY', definition: 'Chiến lược, kế hoạch dài hạn bài bản', example: 'A winning study strategy guarantees results.' },
    { term: 'AUTONOMY', definition: 'Quyền tự chủ, tính độc lập trong hành động', example: 'Autonomous AI agents coordinate tasks.' },

    // 9+ Letter Codes (Master Decryptor)
    { term: 'RESILIENCE', definition: 'Khả năng phục hồi nhanh sau nghịch cảnh', example: 'Resilience overcomes all obstacles.' },
    { term: 'INNOVATION', definition: 'Sự đổi mới, sáng tạo giải pháp đột phá', example: 'Technological innovation drives society.' },
    { term: 'PERSISTENCE', definition: 'Sự kiên trì, bền chí không bỏ cuộc', example: 'Success demands tireless persistence.' },
    { term: 'SYNTHESIS', definition: 'Sự tổng hợp các yếu tố thành thể thống nhất', example: 'The synthesis of knowledge and practice.' },
    { term: 'ALGORITHM', definition: 'Thuật toán, quy trình giải quyết bài toán', example: 'An intelligent spaced-repetition algorithm.' },
    { term: 'PERSEVERANCE', definition: 'Sự kiên nhẫn, bền bỉ vượt qua khó khăn', example: 'Great achievements require perseverance.' },
    { term: 'UBIQUITOUS', definition: 'Có mặt ở khắp mọi nơi, phổ biến rộng rãi', example: 'Smartphones have become ubiquitous.' },
    { term: 'METICULOUS', definition: 'Tỉ mỉ, cẩn thận đến từng chi tiết nhỏ', example: 'Meticulous attention to detail.' }
];

export default {
    name: 'CyberCipher',
    setup() {
        const gameMode = ref('campaign'); // 'campaign' (10 stages), 'time_attack' (60s), 'endless'
        const gameState = ref('playing'); // 'playing', 'completed'
        const currentIndex = ref(0);
        const stageCards = ref([]);
        const userLetters = ref([]);
        const availableLetters = ref([]);
        const isChecking = ref(false);
        const streak = ref(0);
        const maxStreak = ref(0);
        const totalWordsSolved = ref(0);
        const score = ref(0);
        const earnedLC = ref(0);
        const earnedXP = ref(0);
        const stars = ref(3);
        const isHintUsed = ref(false);
        
        // Timers
        const timerSeconds = ref(0);
        const timeLeft = ref(60.0); // For Time Attack mode
        const floatingBonus = ref(null);
        let timerInterval = null;

        // Dynamic Card Pool Aggregator
        const allVocabPool = computed(() => {
            const pool = [];
            const addedTerms = new Set();

            const addCard = (card) => {
                if (!card || !card.term) return;
                const clean = card.term.toUpperCase().replace(/[^A-Z]/g, '');
                if (clean.length >= 3 && !addedTerms.has(clean)) {
                    addedTerms.add(clean);
                    pool.push({
                        term: clean,
                        definition: card.definition || 'Từ vựng tiếng Anh học thuật',
                        example: card.example || `Practice using "${clean}" in daily communication.`,
                        length: clean.length
                    });
                }
            };

            // 1. User Active Cards
            if (store.activeCards && Array.isArray(store.activeCards)) {
                store.activeCards.forEach(addCard);
            }
            // 2. All User Cards
            if (store.allUserCards && Array.isArray(store.allUserCards)) {
                store.allUserCards.forEach(addCard);
            }
            // 3. Deck Cards
            if (store.decks && Array.isArray(store.decks)) {
                store.decks.forEach(d => {
                    if (d.cards && Array.isArray(d.cards)) d.cards.forEach(addCard);
                });
            }
            // 4. Core Cyber Lexicon
            CORE_CIPHER_WORDS.forEach(addCard);

            return pool;
        });

        const currentCard = computed(() => {
            if (stageCards.value.length === 0) return null;
            return stageCards.value[currentIndex.value % stageCards.value.length];
        });

        const cleanTerm = computed(() => {
            if (!currentCard.value) return '';
            return currentCard.value.term;
        });

        const currentStageNumber = computed(() => currentIndex.value + 1);
        const totalStages = computed(() => stageCards.value.length);
        const stageProgressPercent = computed(() => {
            if (!totalStages.value) return 0;
            return Math.round((currentIndex.value / totalStages.value) * 100);
        });

        // Initialize Mission Sequence based on Mode
        const setupMissionCards = () => {
            const pool = [...allVocabPool.value];
            if (gameMode.value === 'campaign') {
                // Sort into 10 progressive difficulty stages (4-5 letters -> 6-8 letters -> 9+ letters)
                const shortWords = pool.filter(c => c.length >= 4 && c.length <= 5).sort(() => Math.random() - 0.5);
                const midWords = pool.filter(c => c.length >= 6 && c.length <= 8).sort(() => Math.random() - 0.5);
                const longWords = pool.filter(c => c.length >= 9).sort(() => Math.random() - 0.5);

                const sequence = [
                    ...shortWords.slice(0, 3),
                    ...midWords.slice(0, 4),
                    ...longWords.slice(0, 3)
                ];

                // Fallback if small categories
                if (sequence.length < 10) {
                    const remaining = pool.filter(c => !sequence.includes(c)).sort(() => Math.random() - 0.5);
                    sequence.push(...remaining.slice(0, 10 - sequence.length));
                }

                // Sort ascending by word length for a smooth progression
                stageCards.value = sequence.sort((a, b) => a.length - b.length).slice(0, 10);
            } else if (gameMode.value === 'time_attack') {
                // 25 randomly shuffled words
                stageCards.value = pool.sort(() => Math.random() - 0.5).slice(0, 25);
            } else {
                // Endless
                stageCards.value = pool.sort(() => Math.random() - 0.5);
            }
        };

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
            
            // Thoroughly shuffle letters
            let shuffled = [...letters].sort(() => 0.5 - Math.random());
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
            if (isChecking.value) return;
            const currentConstructedLength = userLetters.value.length;
            if (currentConstructedLength >= cleanTerm.value.length) return;
            
            const nextCorrectChar = cleanTerm.value[currentConstructedLength];
            const candidate = availableLetters.value.find(l => !l.isUsed && l.char === nextCorrectChar);
            if (candidate) {
                pickLetter(candidate);
                isHintUsed.value = true;
                showToast(`💡 Đã giải mã ký tự: "${nextCorrectChar}"`, 'info');
            }
        };

        const checkAutoSubmit = () => {
            if (userLetters.value.length === cleanTerm.value.length) {
                isChecking.value = true;
                const constructed = userLetters.value.map(l => l.char).join('');
                if (constructed === cleanTerm.value) {
                    // CORRECT DECRYPT
                    streak.value++;
                    if (streak.value > maxStreak.value) maxStreak.value = streak.value;
                    totalWordsSolved.value++;
                    
                    const comboMultiplier = Math.min(streak.value, 6);
                    const wordScore = cleanTerm.value.length * 20 * comboMultiplier;
                    score.value += wordScore;

                    playCorrect();
                    playCombo(streak.value);
                    speakEnglishText(cleanTerm.value);

                    // Time Attack Bonus Time
                    if (gameMode.value === 'time_attack') {
                        timeLeft.value = Math.min(99, timeLeft.value + 5.0);
                        floatingBonus.value = '+5.0s ⏳';
                        setTimeout(() => { floatingBonus.value = null; }, 1000);
                    }
                    
                    setTimeout(() => {
                        isChecking.value = false;
                        if (currentIndex.value + 1 < stageCards.value.length) {
                            currentIndex.value++;
                            initWord();
                        } else {
                            endGame();
                        }
                    }, 550);
                } else {
                    // INCORRECT DECRYPT
                    streak.value = 0;
                    playIncorrect();
                    setTimeout(() => {
                        clearAllLetters();
                        isChecking.value = false;
                    }, 500);
                }
            }
        };

        const switchMode = (mode) => {
            if (gameMode.value === mode) return;
            gameMode.value = mode;
            playClick();
            restartGame();
        };

        const endGame = () => {
            gameState.value = 'completed';
            clearInterval(timerInterval);
            playVictory();

            // Reward Calculations
            if (gameMode.value === 'campaign') {
                if (totalWordsSolved.value >= 10 && maxStreak.value >= 5) {
                    stars.value = 3;
                    earnedLC.value = 50 + (maxStreak.value * 2);
                    earnedXP.value = 100;
                } else if (totalWordsSolved.value >= 7) {
                    stars.value = 2;
                    earnedLC.value = 30 + maxStreak.value;
                    earnedXP.value = 60;
                } else {
                    stars.value = 1;
                    earnedLC.value = 18;
                    earnedXP.value = 35;
                }
            } else if (gameMode.value === 'time_attack') {
                stars.value = totalWordsSolved.value >= 8 ? 3 : (totalWordsSolved.value >= 4 ? 2 : 1);
                earnedLC.value = Math.min(60, totalWordsSolved.value * 5 + maxStreak.value * 2);
                earnedXP.value = totalWordsSolved.value * 12;
            } else {
                stars.value = 3;
                earnedLC.value = totalWordsSolved.value * 4;
                earnedXP.value = totalWordsSolved.value * 10;
            }

            store.addLexiCredit(earnedLC.value, `Hoàn thành Cyber Cipher (${totalWordsSolved.value} từ)`);
            store.recordStudyActivity();

            if (window.confetti) {
                window.confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
            }
        };

        const restartGame = () => {
            clearInterval(timerInterval);
            currentIndex.value = 0;
            streak.value = 0;
            maxStreak.value = 0;
            totalWordsSolved.value = 0;
            score.value = 0;
            earnedLC.value = 0;
            earnedXP.value = 0;
            timerSeconds.value = 0;
            timeLeft.value = 60.0;
            gameState.value = 'playing';
            
            setupMissionCards();
            initWord();
            startTimer();
        };

        const startTimer = () => {
            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                if (gameState.value === 'playing') {
                    timerSeconds.value++;
                    if (gameMode.value === 'time_attack') {
                        timeLeft.value = Math.max(0, +(timeLeft.value - 0.1).toFixed(1));
                        if (timeLeft.value <= 0) {
                            endGame();
                        }
                    }
                }
            }, 100);
        };

        const handleKeydown = (e) => {
            if (gameState.value !== 'playing' || isChecking.value) return;
            if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

            const key = e.key.toUpperCase();
            if (key === 'BACKSPACE') {
                if (userLetters.value.length > 0) {
                    removeLetter(userLetters.value.length - 1);
                }
                e.preventDefault();
            } else if (key === ' ' || key === 'SPACEBAR') {
                shuffleAvailable();
                e.preventDefault();
            } else if (key === 'TAB' || key === 'H') {
                revealHintLetter();
                e.preventDefault();
            } else if (/^[A-Z]$/.test(key)) {
                const candidate = availableLetters.value.find(l => !l.isUsed && l.char === key);
                if (candidate) {
                    pickLetter(candidate);
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

        onMounted(() => {
            setupMissionCards();
            initWord();
            startTimer();
            window.addEventListener('keydown', handleKeydown);
        });

        onUnmounted(() => {
            clearInterval(timerInterval);
            window.removeEventListener('keydown', handleKeydown);
        });

        return {
            store, gameMode, gameState, currentIndex, currentCard, cleanTerm, userLetters, availableLetters,
            isChecking, streak, maxStreak, totalWordsSolved, score, earnedLC, earnedXP, stars, timerSeconds, timeLeft,
            floatingBonus, currentStageNumber, totalStages, stageProgressPercent,
            pickLetter, removeLetter, clearAllLetters, shuffleAvailable, revealHintLetter,
            switchMode, restartGame, handleExit, speakEnglishText
        };
    },
    template: `
        <div class="max-w-4xl mx-auto px-2 sm:px-4 py-4 select-none">
            
            <!-- TOP BAR & CONTROLS -->
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                <!-- Back Button -->
                <button @click="handleExit" 
                        class="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#131B2E] shadow-sm hover:bg-cyan-50 dark:hover:bg-[#1E293B] text-gray-600 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 font-extrabold text-xs border border-gray-100 dark:border-[#1E2540] transition-all active:scale-95">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Trở Về</span>
                </button>

                <!-- Center Title Badge -->
                <div class="flex items-center gap-2">
                    <span class="px-3 py-1.5 rounded-full text-xs font-black bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-800/80 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        <i class="fa-solid fa-terminal text-cyan-500 animate-pulse"></i>
                        <span>Cyber Cipher: Giải Mã Từ Vựng</span>
                    </span>
                </div>

                <!-- Mode Segment Switcher -->
                <div class="flex items-center gap-1 bg-white dark:bg-[#131B2E] p-1 rounded-2xl border border-gray-200 dark:border-[#1E2540] shadow-sm">
                    <button @click="switchMode('campaign')" 
                            class="px-2.5 py-1 rounded-xl text-xs font-black transition-all"
                            :class="gameMode === 'campaign' ? 'bg-cyan-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-cyan-500'">
                        10 Cấp Độ
                    </button>
                    <button @click="switchMode('time_attack')" 
                            class="px-2.5 py-1 rounded-xl text-xs font-black transition-all"
                            :class="gameMode === 'time_attack' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-amber-500'">
                        60s Tốc Độ
                    </button>
                    <button @click="switchMode('endless')" 
                            class="px-2.5 py-1 rounded-xl text-xs font-black transition-all"
                            :class="gameMode === 'endless' ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-500'">
                        Vô Tận
                    </button>
                </div>
            </div>

            <!-- ========================================================================= -->
            <!-- SCREEN 1: ACTIVE CYBER TERMINAL                                           -->
            <!-- ========================================================================= -->
            <div v-if="gameState === 'playing' && currentCard" class="space-y-4 sm:space-y-6 animate-fade-in">
                
                <!-- TERMINAL HUD HEADER -->
                <div class="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-[#0B1020] via-[#111827] to-[#0F172A] border border-cyan-500/40 text-cyan-400 shadow-2xl relative overflow-hidden cyber-glow">
                    <!-- Ambient cyber scanline -->
                    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none"></div>

                    <div class="flex items-center justify-between gap-4 mb-3 relative z-10">
                        <div class="flex items-center gap-2.5">
                            <div class="w-3 h-3 rounded-full bg-cyan-400 animate-ping"></div>
                            <div class="text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase">
                                <span v-if="gameMode === 'campaign'">GIAI ĐOẠN #{{ currentStageNumber }} / {{ totalStages }} ({{ cleanTerm.length }} KÝ TỰ)</span>
                                <span v-else-if="gameMode === 'time_attack'">TIME ATTACK // ĐÃ HACK: {{ totalWordsSolved }} TỪ</span>
                                <span v-else>ENDLESS SANDBOX // TỪ #{{ totalWordsSolved + 1 }}</span>
                            </div>
                        </div>

                        <!-- Timer & Streak Indicator -->
                        <div class="flex items-center gap-4 text-xs font-mono font-bold">
                            <span v-if="streak > 1" class="text-amber-400 animate-combo-pop">🔥 {{ streak }}x COMBO</span>
                            
                            <span v-if="gameMode === 'time_attack'" 
                                  class="px-2.5 py-0.5 rounded-lg border font-mono font-black"
                                  :class="timeLeft <= 10 ? 'bg-rose-500/30 border-rose-500 text-rose-300 animate-pulse' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'">
                                ⏳ {{ timeLeft }}s
                            </span>
                            <span v-else class="text-gray-400">⏱️ {{ timerSeconds }}s</span>
                        </div>
                    </div>

                    <!-- Stage Progress Bar (for Campaign) -->
                    <div v-if="gameMode === 'campaign'" class="w-full bg-white/10 rounded-full h-1.5 mb-4 overflow-hidden">
                        <div class="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-300"
                             :style="{ width: stageProgressPercent + '%' }"></div>
                    </div>

                    <!-- Clue Card Area -->
                    <div class="text-center py-2 relative z-10">
                        <div class="inline-flex items-center gap-2 mb-2 bg-cyan-950/70 px-3.5 py-1 rounded-full border border-cyan-800/80 shadow-sm">
                            <span class="text-xs text-cyan-300 font-bold">Định Nghĩa Tiếng Việt</span>
                            <button @click="speakEnglishText(currentCard.term)" class="w-6 h-6 rounded-full bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 flex items-center justify-center transition" title="Nghe âm thanh gợi ý">
                                <i class="fa-solid fa-volume-high text-[10px]"></i>
                            </button>
                        </div>
                        <h3 class="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">{{ currentCard.definition }}</h3>
                        <p v-if="currentCard.example" class="text-xs sm:text-sm text-cyan-200/90 italic font-mono max-w-xl mx-auto">
                            "{{ currentCard.example }}"
                        </p>
                    </div>
                </div>

                <!-- FLOATING BONUS TIME / SCORE NOTIFICATION -->
                <div v-if="floatingBonus" class="text-center animate-float-score font-mono font-black text-2xl text-amber-400 drop-shadow-lg pointer-events-none">
                    {{ floatingBonus }}
                </div>

                <!-- USER CONSTRUCTED SLOTS -->
                <div class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#131B2E] border border-gray-100 dark:border-[#1E2540] shadow-xl text-center space-y-6">
                    <div class="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        <span>Ô Nhập Liệu ({{ userLetters.length }} / {{ cleanTerm.length }} Ký Tự)</span>
                        <span class="font-mono text-cyan-600 dark:text-cyan-400">{{ score }} PTS</span>
                    </div>

                    <!-- Slots Row -->
                    <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 min-h-[64px]">
                        <div v-for="(charObj, idx) in cleanTerm.split('')" :key="idx"
                             @click="userLetters[idx] ? removeLetter(idx) : null"
                             class="w-12 h-14 sm:w-14 sm:h-16 rounded-2xl flex items-center justify-center font-mono font-black text-xl sm:text-2xl border-2 transition-all cursor-pointer select-none"
                             :class="[
                                 userLetters[idx] 
                                     ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-md shadow-cyan-500/20 hover:scale-95' 
                                     : 'bg-gray-50 dark:bg-[#0B1020] border-dashed border-gray-300 dark:border-gray-700 text-transparent'
                             ]">
                            {{ userLetters[idx]?.char || '_' }}
                        </div>
                    </div>

                    <!-- SCRAMBLED LETTER TILES BANK -->
                    <div class="pt-4 border-t border-gray-100 dark:border-[#1E2540]">
                        <div class="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wider">
                            Gõ phím hoặc Nhấn chuột để chọn chữ cái
                        </div>
                        <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-lg mx-auto">
                            <button v-for="letter in availableLetters" :key="letter.id"
                                    @click="pickLetter(letter)"
                                    :disabled="letter.isUsed || isChecking"
                                    class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl font-mono font-black text-lg sm:text-xl border-2 transition-all select-none relative overflow-hidden flex items-center justify-center"
                                    :class="[
                                        letter.isUsed 
                                            ? 'opacity-20 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed scale-90' 
                                            : 'bg-white dark:bg-[#161D33] border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:shadow-md active:scale-95'
                                    ]">
                                {{ letter.char }}
                            </button>
                        </div>
                    </div>

                    <!-- UTILITY ACTIONS HOTBAR -->
                    <div class="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                        <button @click="clearAllLetters" 
                                class="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-gray-600 dark:text-gray-300 hover:text-rose-600 font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5">
                            <i class="fa-solid fa-rotate-left"></i>
                            <span>Xóa Hết (Backspace)</span>
                        </button>
                        <button @click="shuffleAvailable" 
                                class="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-gray-600 dark:text-gray-300 hover:text-indigo-600 font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5">
                            <i class="fa-solid fa-shuffle"></i>
                            <span>Xáo Trộn (Space)</span>
                        </button>
                        <button @click="revealHintLetter" 
                                class="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 border border-amber-200 dark:border-amber-800">
                            <i class="fa-solid fa-lightbulb"></i>
                            <span>Gợi Ý (Tab)</span>
                        </button>
                    </div>
                </div>

            </div>

            <!-- ========================================================================= -->
            <!-- SCREEN 2: MISSION COMPLETE (VICTORY SCREEN)                               -->
            <!-- ========================================================================= -->
            <div v-else-if="gameState === 'completed'" 
                 class="p-8 sm:p-10 rounded-3xl text-center bg-gradient-to-b from-[#0B1020] via-[#111827] to-[#0F172A] border-2 border-cyan-400/60 text-white shadow-2xl space-y-6 animate-scale-in max-w-xl mx-auto">
                
                <!-- Unlocked Trophy & Star Sequence -->
                <div class="space-y-3">
                    <div class="w-20 h-20 mx-auto flex items-center justify-center animate-bounce">
                        <img src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Unlocked/3D/unlocked_3d.png" 
                             class="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(6,182,212,0.5)]">
                    </div>

                    <!-- 3-Star Rating Animation -->
                    <div class="flex items-center justify-center gap-3">
                        <i v-for="i in 3" :key="i"
                           class="fa-solid fa-star text-2xl sm:text-3xl transition-all duration-500 animate-star-pop"
                           :class="i <= stars ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]' : 'text-gray-700'"
                           :style="{ animationDelay: (i * 150) + 'ms' }"></i>
                    </div>

                    <h2 class="text-3xl font-black text-cyan-400 tracking-tight mb-1">
                        HACK THÀNH CÔNG!
                    </h2>
                    <p class="text-xs sm:text-sm text-gray-300 font-medium">
                        Bạn đã giải mã xuất sắc toàn bộ {{ totalWordsSolved }} mật mã từ vựng vào bộ nhớ não bộ!
                    </p>
                </div>

                <!-- Stats Summary Grid -->
                <div class="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                    <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                        <div class="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Đã Giải Mã</div>
                        <div class="text-xl font-black text-cyan-400">{{ totalWordsSolved }} Từ</div>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                        <div class="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Max Combo</div>
                        <div class="text-xl font-black text-amber-400">{{ maxStreak }}x 🔥</div>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                        <div class="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Thưởng LC</div>
                        <div class="text-xl font-black text-emerald-400">+{{ earnedLC }} LC</div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-3">
                    <button @click="restartGame" 
                            class="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <i class="fa-solid fa-rotate-right"></i> Chơi Lượt Mới
                    </button>
                    <button @click="handleExit" 
                            class="flex-1 py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all active:scale-95">
                        Trở Về
                    </button>
                </div>
            </div>

        </div>
    `
};
