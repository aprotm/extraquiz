import { ref, computed, onMounted, onUnmounted } from 'vue';
import { store } from '../store.js';
import { showToast } from '../toast.js';
import { playCorrect, playIncorrect, playBossHit, playCrit, playCombo, playSkillCast, playFreeze, playTick, playVictory, playGameOver } from '../sfx.js';
import { speakEnglishText } from '../voice.js';

export default {
    name: 'BossBattle',
    setup() {
        const BOSS_LIST = [
            {
                id: 'dragon',
                name: 'Hắc Long Ngữ Nghĩa',
                subtitle: 'Semantic Void Dragon',
                hp: 1200,
                maxHp: 1200,
                image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Dragon/3D/dragon_3d.png',
                bgGradient: 'from-rose-950 via-slate-900 to-purple-950',
                accentColor: 'text-rose-400',
                borderGlow: 'border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
            },
            {
                id: 'titan',
                name: 'Lexi Colossus',
                subtitle: 'Người Khổng Lồ Tri Thức',
                hp: 1800,
                maxHp: 1800,
                image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Robot/3D/robot_3d.png',
                bgGradient: 'from-amber-950 via-slate-900 to-indigo-950',
                accentColor: 'text-amber-400',
                borderGlow: 'border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
            },
            {
                id: 'overlord',
                name: 'Chúa Tể Bất Diệt',
                subtitle: 'Grammar Overlord Singularity',
                hp: 2500,
                maxHp: 2500,
                image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Alien%20monster/3D/alien_monster_3d.png',
                bgGradient: 'from-purple-950 via-slate-900 to-fuchsia-950',
                accentColor: 'text-purple-400',
                borderGlow: 'border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.3)]'
            }
        ];

        const selectedBossIndex = ref(0);
        const currentBoss = ref({ ...BOSS_LIST[0] });
        const gameState = ref('ready'); // 'ready', 'playing', 'victory', 'defeat'
        
        const playerHp = ref(3);
        const maxPlayerHp = ref(3);
        const timeLeft = ref(50);
        const maxTime = ref(50);
        const isTimeFrozen = ref(false);
        const isOverdrive = ref(false);
        const overdriveHitsRemaining = ref(0);
        
        const currentQuestionIndex = ref(0);
        const currentQuestion = ref(null);
        const options = ref([]);
        const disabledOptions = ref([]);
        const isAnswered = ref(false);
        const isScreenShaking = ref(false);
        const isBossHit = ref(false);
        const floatingDmg = ref(null);
        
        const combo = ref(0);
        const maxCombo = ref(0);
        const totalDamageDealt = ref(0);
        const correctAnswers = ref(0);
        const totalQuestions = ref(0);
        const earnedLC = ref(0);
        
        // Skills
        const skills = ref({
            freeze: { count: 1, max: 1, name: 'Đóng Băng', desc: 'Dừng thời gian 8s', icon: '❄️', key: '1' },
            laser: { count: 2, max: 2, name: 'Laser 50/50', desc: 'Bắn phá 2 đáp án sai', icon: '🎯', key: '2' },
            overdrive: { count: 1, max: 1, name: 'Cuồng Nộ x3', desc: '3 hit nhân 3 sát thương', icon: '⚡', key: '3' }
        });

        let timerInterval = null;
        let freezeTimeout = null;
        let questionStartTime = Date.now();

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
                { term: 'Perseverance', definition: 'Sự kiên trì, bền bỉ vượt qua khó khăn' },
                { term: 'Ephemeral', definition: 'Phù du, chóng tàn, tồn tại trong chớp mắt' },
                { term: 'Resilience', definition: 'Khả năng phục hồi nhanh chóng sau nghịch cảnh' },
                { term: 'Ubiquitous', definition: 'Có mặt ở khắp mọi nơi, phổ biến rộng rãi' },
                { term: 'Pragmatic', definition: 'Thực tế, coi trọng tính ứng dụng hơn lý thuyết' },
                { term: 'Meticulous', definition: 'Tỉ mỉ, cẩn thận đến từng chi tiết nhỏ' },
                { term: 'Audacious', definition: 'Táo bạo, dám nghĩ dám làm' },
                { term: 'Eloquent', definition: 'Hùng biện, diễn đạt lưu loát và thuyết phục' }
            ];
        });

        const bossHpPercent = computed(() => {
            return Math.max(0, Math.min(100, Math.round((currentBoss.value.hp / currentBoss.value.maxHp) * 100)));
        });

        const selectBoss = (index) => {
            selectedBossIndex.value = index;
            currentBoss.value = { ...BOSS_LIST[index] };
        };

        const generateQuestion = () => {
            if (cardsPool.value.length < 4) return;
            const pool = [...cardsPool.value];
            const targetCard = pool[Math.floor(Math.random() * pool.length)];
            
            // Pick 3 wrong options
            const wrongPool = pool.filter(c => c.term !== targetCard.term);
            const shuffledWrongs = wrongPool.sort(() => 0.5 - Math.random()).slice(0, 3);
            
            const rawOptions = [
                { text: targetCard.definition, isCorrect: true },
                ...shuffledWrongs.map(w => ({ text: w.definition, isCorrect: false }))
            ];
            
            options.value = rawOptions.sort(() => 0.5 - Math.random());
            disabledOptions.value = [];
            currentQuestion.value = targetCard;
            isAnswered.value = false;
            questionStartTime = Date.now();
        };

        const startGame = () => {
            currentBoss.value = { ...BOSS_LIST[selectedBossIndex.value] };
            playerHp.value = maxPlayerHp.value;
            timeLeft.value = maxTime.value;
            combo.value = 0;
            maxCombo.value = 0;
            totalDamageDealt.value = 0;
            correctAnswers.value = 0;
            totalQuestions.value = 0;
            earnedLC.value = 0;
            isTimeFrozen.value = false;
            isOverdrive.value = false;
            overdriveHitsRemaining.value = 0;
            
            skills.value.freeze.count = 1;
            skills.value.laser.count = 2;
            skills.value.overdrive.count = 1;
            
            gameState.value = 'playing';
            generateQuestion();
            startTimer();
        };

        const startTimer = () => {
            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                if (gameState.value !== 'playing') {
                    clearInterval(timerInterval);
                    return;
                }
                if (!isTimeFrozen.value) {
                    timeLeft.value--;
                    if (timeLeft.value <= 10 && timeLeft.value > 0) {
                        playTick();
                    }
                    if (timeLeft.value <= 0) {
                        endGame(false);
                    }
                }
            }, 1000);
        };

        const handleAnswer = (option, idx) => {
            if (isAnswered.value || gameState.value !== 'playing') return;
            if (disabledOptions.value.includes(idx)) return;
            
            isAnswered.value = true;
            totalQuestions.value++;
            const responseTime = (Date.now() - questionStartTime) / 1000;
            
            if (option.isCorrect) {
                correctAnswers.value++;
                combo.value++;
                if (combo.value > maxCombo.value) maxCombo.value = combo.value;
                
                // Calculate Damage
                let baseDmg = 120;
                let isCrit = responseTime <= 2.2;
                let multiplier = 1 + (combo.value * 0.15);
                
                if (isOverdrive.value && overdriveHitsRemaining.value > 0) {
                    multiplier *= 3;
                    overdriveHitsRemaining.value--;
                    if (overdriveHitsRemaining.value <= 0) isOverdrive.value = false;
                }
                
                if (isCrit) multiplier *= 1.8;
                
                const damage = Math.round(baseDmg * multiplier);
                currentBoss.value.hp = Math.max(0, currentBoss.value.hp - damage);
                totalDamageDealt.value += damage;
                
                // Add time bonus on combo
                if (combo.value % 3 === 0) {
                    timeLeft.value = Math.min(maxTime.value, timeLeft.value + 4);
                }
                
                // Trigger SFX & Visuals
                if (isCrit) {
                    playCrit();
                    triggerScreenShake();
                } else {
                    playBossHit();
                }
                playCombo(combo.value);
                triggerBossHitAnim(damage, isCrit);
                
                // Check Boss Death
                if (currentBoss.value.hp <= 0) {
                    setTimeout(() => endGame(true), 600);
                    return;
                }
            } else {
                combo.value = 0;
                playerHp.value--;
                playIncorrect();
                triggerScreenShake();
                
                if (playerHp.value <= 0) {
                    setTimeout(() => endGame(false), 600);
                    return;
                }
            }
            
            setTimeout(() => {
                generateQuestion();
            }, 750);
        };

        const triggerBossHitAnim = (dmg, isCrit) => {
            isBossHit.value = true;
            floatingDmg.value = { value: dmg, isCrit };
            setTimeout(() => {
                isBossHit.value = false;
            }, 350);
            setTimeout(() => {
                floatingDmg.value = null;
            }, 800);
        };

        const triggerScreenShake = () => {
            isScreenShaking.value = true;
            setTimeout(() => {
                isScreenShaking.value = false;
            }, 350);
        };

        // Skill Actions
        const useFreeze = () => {
            if (skills.value.freeze.count <= 0 || isTimeFrozen.value || gameState.value !== 'playing') return;
            skills.value.freeze.count--;
            isTimeFrozen.value = true;
            playFreeze();
            showToast("❄️ ĐÃ ĐÓNG BĂNG THỜI GIAN (8 GIÂY)!", 'info');
            clearTimeout(freezeTimeout);
            freezeTimeout = setTimeout(() => {
                isTimeFrozen.value = false;
            }, 8000);
        };

        const useLaser = () => {
            if (skills.value.laser.count <= 0 || isAnswered.value || gameState.value !== 'playing') return;
            const wrongIndices = options.value
                .map((opt, i) => (!opt.isCorrect && !disabledOptions.value.includes(i) ? i : -1))
                .filter(i => i !== -1);
            if (wrongIndices.length === 0) return;
            
            skills.value.laser.count--;
            playSkillCast();
            const toDisable = wrongIndices.sort(() => 0.5 - Math.random()).slice(0, 2);
            disabledOptions.value.push(...toDisable);
            showToast("🎯 LASER 50:50 ĐÃ TRIỆT TIÊU 2 ĐÁP ÁN SAI!", 'info');
        };

        const useOverdrive = () => {
            if (skills.value.overdrive.count <= 0 || gameState.value !== 'playing') return;
            skills.value.overdrive.count--;
            isOverdrive.value = true;
            overdriveHitsRemaining.value = 3;
            playSkillCast();
            showToast("⚡ CUỒNG NỘ OVERDRIVE: 3 ĐÒN ĐÁNH KẾ TIẾP x3 SÁT THƯƠNG!", 'success');
        };

        const endGame = (isVictory) => {
            clearInterval(timerInterval);
            clearTimeout(freezeTimeout);
            
            if (isVictory) {
                gameState.value = 'victory';
                playVictory();
                
                // Reward calculation
                const baseReward = 50 + (selectedBossIndex.value * 35);
                const comboBonus = Math.floor(maxCombo.value * 3);
                earnedLC.value = baseReward + comboBonus;
                
                store.addLexiCredit(earnedLC.value, `Hạ gục Trùm: ${currentBoss.value.name}`);
                store.recordStudyStats(correctAnswers.value, Math.round((maxTime.value - timeLeft.value) / 60));
                
                // Unlock boss badge if available
                if (!store.userProfile?.badges?.includes('boss_slayer')) {
                    store.unlockBadge('boss_slayer');
                }
            } else {
                gameState.value = 'defeat';
                playGameOver();
                earnedLC.value = 10;
                store.addLexiCredit(10, 'Tham chiến Đấu Trùm');
            }
        };

        const handleKeydown = (e) => {
            if (gameState.value !== 'playing') return;
            if (e.key === '1') useFreeze();
            if (e.key === '2') useLaser();
            if (e.key === '3') useOverdrive();
            if (['a', 'A', '1'].includes(e.key) && options.value[0]) handleAnswer(options.value[0], 0);
            if (['b', 'B', '2'].includes(e.key) && options.value[1]) handleAnswer(options.value[1], 1);
            if (['c', 'C', '3'].includes(e.key) && options.value[2]) handleAnswer(options.value[2], 2);
            if (['d', 'D', '4'].includes(e.key) && options.value[3]) handleAnswer(options.value[3], 3);
        };

        onMounted(() => {
            window.addEventListener('keydown', handleKeydown);
        });

        onUnmounted(() => {
            clearInterval(timerInterval);
            clearTimeout(freezeTimeout);
            window.removeEventListener('keydown', handleKeydown);
        });

        return {
            store, BOSS_LIST, selectedBossIndex, currentBoss, gameState, selectBoss,
            playerHp, maxPlayerHp, timeLeft, maxTime, isTimeFrozen, isOverdrive, overdriveHitsRemaining,
            currentQuestion, options, disabledOptions, isAnswered, isScreenShaking, isBossHit, floatingDmg,
            combo, maxCombo, totalDamageDealt, correctAnswers, totalQuestions, earnedLC,
            skills, bossHpPercent, startGame, handleAnswer, useFreeze, useLaser, useOverdrive,
            speakEnglishText
        };
    },
    template: `
        <div class="max-w-4xl mx-auto px-2 sm:px-4 py-4 select-none" :class="{ 'animate-screen-shake': isScreenShaking }">
            
            <!-- HEADER BAR -->
            <div class="flex items-center justify-between gap-4 mb-6">
                <button @click="store.navigate('deck-detail')" class="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow-sm hover:bg-rose-50 text-gray-600 hover:text-rose-600 font-extrabold text-xs border border-gray-100 transition-all active:scale-95">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Rút Lui</span>
                </button>

                <div class="flex items-center gap-3">
                    <span class="text-xs font-black uppercase tracking-wider text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200/80 flex items-center gap-1.5 shadow-sm">
                        <i class="fa-solid fa-skull text-rose-500 animate-pulse"></i>
                        <span>Speed Rush: Đấu Trùm Tốc Độ</span>
                    </span>
                </div>

                <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 font-extrabold text-xs shadow-sm">
                    <i class="fa-solid fa-gem text-amber-500"></i>
                    <span>{{ store.userProfile?.lexiCredit || 0 }} LC</span>
                </div>
            </div>

            <!-- ========================================================================= -->
            <!-- SCREEN 1: READY / BOSS SELECT                                             -->
            <!-- ========================================================================= -->
            <div v-if="gameState === 'ready'" class="space-y-6 animate-fade-in">
                <!-- Boss Showcase Card -->
                <div class="glass-panel-strong p-8 rounded-3xl text-center relative overflow-hidden bg-gradient-to-b from-[#0F1426] via-[#151A30] to-[#1E1B4B] border border-rose-500/30 text-white shadow-2xl">
                    <div class="absolute -top-24 -right-24 w-80 h-80 bg-rose-600/20 rounded-full blur-[100px] pointer-events-none"></div>
                    <div class="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
                    
                    <div class="relative z-10">
                        <div class="inline-block px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 uppercase tracking-widest mb-4">
                            ⚔️ Sẵn Sàng Khiêu Chiến
                        </div>

                        <!-- 3D Boss Avatar with Breathing Animation -->
                        <div class="w-32 h-32 mx-auto mb-4 relative flex items-center justify-center p-3 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl group hover:scale-105 transition-transform">
                            <img :src="currentBoss.image3d" :alt="currentBoss.name" class="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(244,63,94,0.4)] animate-bounce-short">
                        </div>

                        <h2 class="text-3xl sm:text-4xl font-black text-white tracking-tight mb-1">{{ currentBoss.name }}</h2>
                        <p class="text-sm text-gray-400 font-bold uppercase tracking-wider mb-6">{{ currentBoss.subtitle }}</p>

                        <!-- Boss Stats Badge -->
                        <div class="inline-flex items-center gap-6 bg-black/40 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-white/10 text-xs font-bold mb-8">
                            <div class="flex items-center gap-2">
                                <span class="text-gray-400">Máu Trùm:</span>
                                <span class="text-rose-400 font-extrabold text-sm">{{ currentBoss.maxHp.toLocaleString() }} HP</span>
                            </div>
                            <div class="w-px h-4 bg-white/20"></div>
                            <div class="flex items-center gap-2">
                                <span class="text-gray-400">Thời gian:</span>
                                <span class="text-amber-400 font-extrabold text-sm">{{ maxTime }}s</span>
                            </div>
                            <div class="w-px h-4 bg-white/20"></div>
                            <div class="flex items-center gap-2">
                                <span class="text-gray-400">Mạng:</span>
                                <span class="text-red-400 font-extrabold text-sm">3 ❤️</span>
                            </div>
                        </div>

                        <!-- Select Boss Carousel -->
                        <div class="grid grid-cols-3 gap-3 max-w-md mx-auto mb-8">
                            <button v-for="(b, idx) in BOSS_LIST" :key="b.id"
                                    @click="selectBoss(idx)"
                                    class="p-3 rounded-2xl border text-center transition-all relative overflow-hidden"
                                    :class="selectedBossIndex === idx ? 'bg-rose-500/20 border-rose-400 ring-2 ring-rose-400/40 shadow-lg scale-105' : 'bg-white/5 border-white/10 hover:bg-white/10 opacity-70 hover:opacity-100'">
                                <img :src="b.image3d" class="w-10 h-10 mx-auto object-contain mb-1 filter drop-shadow-sm">
                                <div class="text-[11px] font-extrabold text-white truncate">{{ b.name }}</div>
                            </button>
                        </div>

                        <!-- Start Button -->
                        <button @click="startGame" class="px-10 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-base uppercase tracking-wider shadow-[0_10px_30px_rgba(244,63,94,0.5)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mx-auto">
                            <i class="fa-solid fa-swords text-lg"></i>
                            <span>Bắt Đầu Khiêu Chiến Ngay</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- ========================================================================= -->
            <!-- SCREEN 2: ACTIVE COMBAT                                                   -->
            <!-- ========================================================================= -->
            <div v-else-if="gameState === 'playing'" class="space-y-5 animate-fade-in">
                
                <!-- BOSS HEALTH & STATUS BAR -->
                <div class="glass-panel-strong p-6 rounded-3xl bg-gradient-to-br from-[#0F1426] via-[#151A30] to-[#1E1B4B] border border-rose-500/30 text-white shadow-2xl relative overflow-hidden">
                    <div class="flex items-center justify-between gap-4 mb-3">
                        <!-- Boss Info -->
                        <div class="flex items-center gap-3">
                            <div class="w-14 h-14 rounded-2xl bg-white/10 p-2 border border-white/20 flex items-center justify-center relative shrink-0"
                                 :class="{ 'animate-boss-hit': isBossHit }">
                                <img :src="currentBoss.image3d" class="w-full h-full object-contain filter drop-shadow-md">
                                
                                <!-- Floating Damage Popup -->
                                <div v-if="floatingDmg" class="absolute -top-6 left-1/2 -translate-x-1/2 animate-float-score whitespace-nowrap z-20 pointer-events-none font-black"
                                     :class="floatingDmg.isCrit ? 'text-amber-300 text-xl' : 'text-rose-400 text-base'">
                                    -{{ floatingDmg.value }} {{ floatingDmg.isCrit ? '💥 CRIT!' : '' }}
                                </div>
                            </div>
                            <div>
                                <h3 class="text-base font-black text-white flex items-center gap-2">
                                    <span>{{ currentBoss.name }}</span>
                                    <span v-if="isOverdrive" class="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-gray-900 animate-pulse uppercase">x3 Overdrive</span>
                                </h3>
                                <p class="text-xs text-rose-400 font-bold font-mono">{{ currentBoss.hp.toLocaleString() }} / {{ currentBoss.maxHp.toLocaleString() }} HP</p>
                            </div>
                        </div>

                        <!-- Timer & Player HP -->
                        <div class="flex items-center gap-4">
                            <!-- Player Hearts -->
                            <div class="flex items-center gap-1 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
                                <span v-for="h in maxPlayerHp" :key="h" class="text-base transition-transform" :class="h <= playerHp ? 'text-rose-500 scale-105' : 'text-gray-600 grayscale opacity-40'">
                                    ❤️
                                </span>
                            </div>

                            <!-- Countdown Timer -->
                            <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-black text-sm"
                                 :class="isTimeFrozen ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 animate-pulse' : (timeLeft <= 10 ? 'bg-rose-500/20 border-rose-400 text-rose-400 animate-ping-short' : 'bg-black/40 border-white/10 text-white')">
                                <i :class="isTimeFrozen ? 'fa-solid fa-snowflake text-cyan-300' : 'fa-solid fa-stopwatch text-amber-400'"></i>
                                <span>{{ timeLeft }}s</span>
                            </div>
                        </div>
                    </div>

                    <!-- HP Progress Bar -->
                    <div class="h-3.5 w-full bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
                        <div class="h-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(244,63,94,0.6)]"
                             :style="{ width: bossHpPercent + '%' }">
                        </div>
                    </div>
                </div>

                <!-- COMBO STREAK BAR -->
                <div v-if="combo > 1" class="flex items-center justify-between px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-300/40 text-amber-900 animate-combo-pop">
                    <div class="flex items-center gap-2">
                        <span class="text-lg font-black text-amber-600 animate-bounce">🔥 {{ combo }}x COMBO!</span>
                        <span class="text-xs font-bold text-amber-700">(+{{ Math.round((combo * 15)) }}% Sát Thương)</span>
                    </div>
                    <span class="text-xs font-bold text-orange-600 uppercase tracking-wider">⚡ Tốc Độ Chiến Đấu</span>
                </div>

                <!-- QUESTION BOARD -->
                <div v-if="currentQuestion" class="glass-panel p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-xl relative overflow-hidden">
                    <div class="text-center mb-6">
                        <div class="inline-flex items-center gap-2 mb-2">
                            <span class="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                Chọn Nghĩa Chuẩn Xác
                            </span>
                            <button @click="speakEnglishText(currentQuestion.term)" class="w-6 h-6 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-500 hover:text-indigo-600 flex items-center justify-center transition" title="Nghe phát âm">
                                <i class="fa-solid fa-volume-high text-xs"></i>
                            </button>
                        </div>
                        <h2 class="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">{{ currentQuestion.term }}</h2>
                        <p v-if="currentQuestion.pronunciation" class="text-sm text-gray-400 font-mono mt-0.5">{{ currentQuestion.pronunciation }}</p>
                    </div>

                    <!-- 4 Answer Options -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <button v-for="(opt, idx) in options" :key="idx"
                                @click="handleAnswer(opt, idx)"
                                :disabled="isAnswered || disabledOptions.includes(idx)"
                                class="p-4 rounded-2xl border-2 text-left font-bold text-sm transition-all relative overflow-hidden flex items-center gap-3"
                                :class="[
                                    disabledOptions.includes(idx) ? 'opacity-20 border-gray-200 bg-gray-50 line-through cursor-not-allowed' :
                                    isAnswered && opt.isCorrect ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                                    isAnswered && !opt.isCorrect ? 'bg-rose-50 border-rose-200 text-rose-700 opacity-60' :
                                    'bg-white border-gray-200 text-gray-800 hover:border-indigo-500 hover:bg-indigo-50/50 hover:shadow-md active:scale-98'
                                ]">
                            <span class="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
                                  :class="isAnswered && opt.isCorrect ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'">
                                {{ ['A', 'B', 'C', 'D'][idx] }}
                            </span>
                            <span class="leading-snug">{{ opt.text }}</span>
                        </button>
                    </div>
                </div>

                <!-- USABLE SKILLS HOTBAR -->
                <div class="p-4 rounded-3xl bg-gray-900 text-white border border-gray-800 shadow-xl flex items-center justify-around gap-2">
                    <!-- Freeze Skill -->
                    <button @click="useFreeze" 
                            :disabled="skills.freeze.count <= 0 || isTimeFrozen"
                            class="flex-1 p-2.5 rounded-2xl border flex items-center justify-center gap-2.5 transition-all relative overflow-hidden"
                            :class="skills.freeze.count > 0 && !isTimeFrozen ? 'bg-cyan-950/60 border-cyan-500/50 hover:bg-cyan-900/80 active:scale-95 text-cyan-300' : 'bg-gray-800 border-gray-700 text-gray-500 opacity-50 cursor-not-allowed'">
                        <span class="text-xl">❄️</span>
                        <div class="text-left">
                            <div class="text-xs font-black flex items-center gap-1">
                                <span>Đóng Băng</span>
                                <span class="text-[9px] bg-white/10 px-1 rounded font-mono">[1]</span>
                            </div>
                            <div class="text-[9px] text-gray-400 font-bold">Còn {{ skills.freeze.count }} lần</div>
                        </div>
                    </button>

                    <!-- Laser 50:50 -->
                    <button @click="useLaser" 
                            :disabled="skills.laser.count <= 0 || isAnswered"
                            class="flex-1 p-2.5 rounded-2xl border flex items-center justify-center gap-2.5 transition-all relative overflow-hidden"
                            :class="skills.laser.count > 0 && !isAnswered ? 'bg-rose-950/60 border-rose-500/50 hover:bg-rose-900/80 active:scale-95 text-rose-300' : 'bg-gray-800 border-gray-700 text-gray-500 opacity-50 cursor-not-allowed'">
                        <span class="text-xl">🎯</span>
                        <div class="text-left">
                            <div class="text-xs font-black flex items-center gap-1">
                                <span>Laser 50/50</span>
                                <span class="text-[9px] bg-white/10 px-1 rounded font-mono">[2]</span>
                            </div>
                            <div class="text-[9px] text-gray-400 font-bold">Còn {{ skills.laser.count }} lần</div>
                        </div>
                    </button>

                    <!-- Overdrive x3 -->
                    <button @click="useOverdrive" 
                            :disabled="skills.overdrive.count <= 0 || isOverdrive"
                            class="flex-1 p-2.5 rounded-2xl border flex items-center justify-center gap-2.5 transition-all relative overflow-hidden"
                            :class="skills.overdrive.count > 0 && !isOverdrive ? 'bg-amber-950/60 border-amber-500/50 hover:bg-amber-900/80 active:scale-95 text-amber-300' : 'bg-gray-800 border-gray-700 text-gray-500 opacity-50 cursor-not-allowed'">
                        <span class="text-xl">⚡</span>
                        <div class="text-left">
                            <div class="text-xs font-black flex items-center gap-1">
                                <span>Cuồng Nộ x3</span>
                                <span class="text-[9px] bg-white/10 px-1 rounded font-mono">[3]</span>
                            </div>
                            <div class="text-[9px] text-gray-400 font-bold">Còn {{ skills.overdrive.count }} lần</div>
                        </div>
                    </button>
                </div>
            </div>

            <!-- ========================================================================= -->
            <!-- SCREEN 3: VICTORY SCREEN                                                  -->
            <!-- ========================================================================= -->
            <div v-else-if="gameState === 'victory'" class="glass-panel-strong p-8 rounded-3xl text-center bg-gradient-to-b from-[#0F1426] via-[#151A30] to-[#1E1B4B] border border-amber-400/50 text-white shadow-2xl space-y-6 animate-fade-in">
                <!-- 3D Victory Trophy -->
                <div class="w-24 h-24 mx-auto mb-2 flex items-center justify-center animate-bounce">
                    <img src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Trophy/3D/trophy_3d.png" class="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(245,158,11,0.5)]">
                </div>

                <div>
                    <h2 class="text-4xl font-black text-amber-400 tracking-tight mb-2">CHIẾN THẮNG HOÀN HẢO!</h2>
                    <p class="text-sm text-gray-300 font-medium">Bạn đã đả bại <span class="text-white font-bold">{{ currentBoss.name }}</span> và bảo vệ vùng đất tri thức!</p>
                </div>

                <!-- Battle Stats Grid -->
                <div class="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                    <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div class="text-[10px] uppercase font-bold text-gray-400 mb-1">Max Combo</div>
                        <div class="text-2xl font-black text-amber-400">{{ maxCombo }}x</div>
                    </div>
                    <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div class="text-[10px] uppercase font-bold text-gray-400 mb-1">Chính Xác</div>
                        <div class="text-2xl font-black text-emerald-400">{{ correctAnswers }}/{{ totalQuestions }}</div>
                    </div>
                    <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div class="text-[10px] uppercase font-bold text-gray-400 mb-1">Thưởng LC</div>
                        <div class="text-2xl font-black text-indigo-400">+{{ earnedLC }} LC</div>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-4">
                    <button @click="startGame" class="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-all active:scale-95">
                        <i class="fa-solid fa-rotate-right mr-2"></i> Chơi Lại
                    </button>
                    <button @click="store.navigate('deck-detail')" class="flex-1 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all active:scale-95">
                        Trở Về Bộ Thẻ
                    </button>
                </div>
            </div>

            <!-- ========================================================================= -->
            <!-- SCREEN 4: DEFEAT SCREEN                                                   -->
            <!-- ========================================================================= -->
            <div v-else-if="gameState === 'defeat'" class="glass-panel-strong p-8 rounded-3xl text-center bg-gradient-to-b from-[#0F1426] via-[#1A1A2E] to-[#2D142C] border border-rose-500/50 text-white shadow-2xl space-y-6 animate-fade-in">
                <div class="w-20 h-20 mx-auto mb-2 flex items-center justify-center opacity-80">
                    <img src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Broken%20heart/3D/broken_heart_3d.png" class="w-full h-full object-contain filter drop-shadow-md">
                </div>

                <div>
                    <h2 class="text-3xl font-black text-rose-400 tracking-tight mb-2">BỊ HẠ GỤC!</h2>
                    <p class="text-sm text-gray-400 font-medium">Sức mạnh của Trùm vẫn còn quá lớn. Hãy nâng cao vốn từ và quay lại phục thù!</p>
                </div>

                <div class="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-4">
                    <button @click="startGame" class="flex-1 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-600/30 transition-all active:scale-95">
                        <i class="fa-solid fa-swords mr-2"></i> Phục Thù Ngay
                    </button>
                    <button @click="store.navigate('deck-detail')" class="flex-1 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all active:scale-95">
                        Rút Lui Luyện Tập
                    </button>
                </div>
            </div>

        </div>
    `
};
