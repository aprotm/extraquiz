import { ref, computed, onMounted, onUnmounted } from 'vue';
import { store } from '../store.js';
import { showToast } from '../toast.js';
import { playCorrect, playIncorrect, playCrit, playCombo, playVictory, playGameOver } from '../sfx.js';
import { speakEnglishText } from '../voice.js';

export default {
    name: 'AiArena',
    setup() {
        const AI_BOTS = [
            {
                id: 'novice',
                name: 'Byte Bot',
                rank: 'Tân Binh Tập Sự',
                accuracy: 0.65,
                speedMin: 3000,
                speedMax: 4500,
                image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Robot/3D/robot_3d.png',
                quotes: ['Chào bạn! Cùng so tài nhé!', 'Ồ, bạn nhanh tay quá!', 'Tôi vừa tính toán xong!', 'Cố lên nào!']
            },
            {
                id: 'scholar',
                name: 'Ada Mind',
                rank: 'Học Giả Lượng Tử',
                accuracy: 0.82,
                speedMin: 2000,
                speedMax: 3200,
                image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Brain/3D/brain_3d.png',
                quotes: ['Thuật toán của tôi đã sẵn sàng.', 'Phản xạ ấn tượng đấy!', 'Đừng chủ quan nhé!', 'Điểm số đang bám đuổi quyết liệt.']
            },
            {
                id: 'grandmaster',
                name: 'Deep Lexi Prime',
                rank: 'Đại Kiện Tướng AI',
                accuracy: 0.95,
                speedMin: 1200,
                speedMax: 2000,
                image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Crown/3D/crown_3d.png',
                quotes: ['Chào mừng đến võ đài đỉnh cao.', 'Tốc độ xử lý của tôi là tuyệt đối.', 'Một nước đi chuẩn xác.', 'Hãy chứng minh trí tuệ con người!']
            }
        ];

        const selectedBotIndex = ref(1);
        const currentBot = ref(AI_BOTS[1]);
        const gameState = ref('select'); // 'select', 'dueling', 'round_result', 'match_over'
        
        const playerScore = ref(0);
        const botScore = ref(0);
        const targetScore = ref(500);
        const currentRound = ref(1);
        const maxRounds = ref(7);
        
        const currentCard = ref(null);
        const options = ref([]);
        const isRoundLocked = ref(false);
        const roundWinner = ref(null); // 'player', 'bot', 'timeout'
        const botSpeech = ref('');
        const streak = ref(0);
        const earnedLC = ref(0);
        
        let botAnswerTimeout = null;
        let roundStartTime = Date.now();

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
                { term: 'Serendipity', definition: 'Sự tình cờ may mắn tìm thấy điều quý giá' },
                { term: 'Tenacity', definition: 'Sự kiên trì bền bỉ, quyết tâm không bỏ cuộc' },
                { term: 'Ingenuity', definition: 'Sự khéo léo, tài tình, phát minh sáng tạo' },
                { term: 'Comprehensive', definition: 'Bao hàm toàn diện, sâu rộng mọi mặt' },
                { term: 'Scrutinize', definition: 'Xem xét, soi xét cực kỳ kỹ lưỡng' }
            ];
        });

        const selectBot = (index) => {
            selectedBotIndex.value = index;
            currentBot.value = AI_BOTS[index];
        };

        const startMatch = () => {
            playerScore.value = 0;
            botScore.value = 0;
            currentRound.value = 1;
            streak.value = 0;
            earnedLC.value = 0;
            gameState.value = 'dueling';
            botSpeech.value = currentBot.value.quotes[0];
            nextRound();
        };

        const nextRound = () => {
            if (cardsPool.value.length < 4) return;
            const pool = [...cardsPool.value];
            const target = pool[Math.floor(Math.random() * pool.length)];
            const wrongs = pool.filter(c => c.term !== target.term).sort(() => 0.5 - Math.random()).slice(0, 3);
            
            const rawOptions = [
                { text: target.definition, isCorrect: true },
                ...wrongs.map(w => ({ text: w.definition, isCorrect: false }))
            ];
            
            options.value = rawOptions.sort(() => 0.5 - Math.random());
            currentCard.value = target;
            isRoundLocked.value = false;
            roundWinner.value = null;
            gameState.value = 'dueling';
            roundStartTime = Date.now();

            // Schedule AI Bot response
            clearTimeout(botAnswerTimeout);
            const botDelay = Math.floor(Math.random() * (currentBot.value.speedMax - currentBot.value.speedMin)) + currentBot.value.speedMin;
            
            botAnswerTimeout = setTimeout(() => {
                if (!isRoundLocked.value && gameState.value === 'dueling') {
                    handleBotAnswer();
                }
            }, botDelay);
        };

        const handlePlayerAnswer = (option) => {
            if (isRoundLocked.value) return;
            isRoundLocked.value = true;
            clearTimeout(botAnswerTimeout);
            
            const timeElapsed = (Date.now() - roundStartTime) / 1000;
            
            if (option.isCorrect) {
                streak.value++;
                const speedBonus = timeElapsed <= 2.0 ? 30 : 10;
                const points = 80 + speedBonus + (streak.value * 10);
                playerScore.value += points;
                roundWinner.value = 'player';
                
                playCorrect();
                playCombo(streak.value);
                if (speedBonus > 10) playCrit();
                
                botSpeech.value = currentBot.value.quotes[Math.floor(Math.random() * currentBot.value.quotes.length)];
            } else {
                streak.value = 0;
                botScore.value += 60;
                roundWinner.value = 'bot';
                playIncorrect();
                botSpeech.value = 'Đáp án chưa chuẩn rồi! Cơ hội thuộc về tôi.';
            }
            
            checkMatchProgress();
        };

        const handleBotAnswer = () => {
            if (isRoundLocked.value) return;
            isRoundLocked.value = true;
            
            const isBotCorrect = Math.random() < currentBot.value.accuracy;
            if (isBotCorrect) {
                botScore.value += 90;
                roundWinner.value = 'bot';
                playIncorrect();
                botSpeech.value = currentBot.value.quotes[2];
            } else {
                roundWinner.value = 'timeout';
                botSpeech.value = 'Tôi đã tính toán nhầm! Lượt đấu hòa.';
            }
            
            checkMatchProgress();
        };

        const checkMatchProgress = () => {
            setTimeout(() => {
                if (playerScore.value >= targetScore.value || botScore.value >= targetScore.value || currentRound.value >= maxRounds.value) {
                    endMatch();
                } else {
                    currentRound.value++;
                    nextRound();
                }
            }, 1200);
        };

        const endMatch = () => {
            gameState.value = 'match_over';
            clearTimeout(botAnswerTimeout);
            
            if (playerScore.value > botScore.value) {
                playVictory();
                const bonus = 45 + (selectedBotIndex.value * 25);
                earnedLC.value = bonus;
                store.addLexiCredit(bonus, `Thắng đấu trí AI Arena: ${currentBot.value.name}`);
                store.recordStudyStats(currentRound.value, 2);
                store.unlockBadge('ai_duelist');
            } else {
                playGameOver();
                earnedLC.value = 10;
                store.addLexiCredit(10, 'Tham gia AI Arena');
            }
        };

        onUnmounted(() => {
            clearTimeout(botAnswerTimeout);
        });

        return {
            store, AI_BOTS, selectedBotIndex, currentBot, gameState, selectBot,
            playerScore, botScore, targetScore, currentRound, maxRounds,
            currentCard, options, isRoundLocked, roundWinner, botSpeech, streak, earnedLC,
            startMatch, handlePlayerAnswer, speakEnglishText
        };
    },
    template: `
        <div class="max-w-4xl mx-auto px-2 sm:px-4 py-4 select-none">
            
            <!-- TOP BAR -->
            <div class="flex items-center justify-between gap-4 mb-6">
                <button @click="store.navigate('deck-detail')" class="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow-sm hover:bg-purple-50 text-gray-600 hover:text-purple-600 font-extrabold text-xs border border-gray-100 transition-all active:scale-95">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Rời Sàn Đấu</span>
                </button>

                <div class="flex items-center gap-2">
                    <span class="px-3 py-1.5 rounded-full text-xs font-black bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                        <i class="fa-solid fa-swords text-purple-600"></i>
                        <span>Cyber Arena: Đấu Trí 1v1</span>
                    </span>
                </div>

                <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 font-extrabold text-xs shadow-sm">
                    <i class="fa-solid fa-gem text-amber-500"></i>
                    <span>{{ store.userProfile?.lexiCredit || 0 }} LC</span>
                </div>
            </div>

            <!-- ========================================================================= -->
            <!-- SCREEN 1: BOT SELECTION                                                   -->
            <!-- ========================================================================= -->
            <div v-if="gameState === 'select'" class="space-y-6 animate-fade-in">
                <div class="glass-panel-strong p-8 rounded-3xl text-center bg-gradient-to-b from-[#0F1426] via-[#151A30] to-[#1E1B4B] border border-purple-500/30 text-white shadow-2xl space-y-6">
                    <div>
                        <span class="px-3 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-widest mb-3 inline-block">
                            🤖 Chọn Đối Thủ AI
                        </span>
                        <h2 class="text-3xl sm:text-4xl font-black text-white tracking-tight">Sàn Đấu Trí Tuệ 1v1</h2>
                        <p class="text-sm text-gray-300 max-w-md mx-auto mt-1">Tranh tài phản xạ từ vựng thời gian thực với các bộ não nhân tạo!</p>
                    </div>

                    <!-- 3 AI Bots Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                        <div v-for="(bot, idx) in AI_BOTS" :key="bot.id"
                             @click="selectBot(idx)"
                             class="p-5 rounded-3xl border-2 cursor-pointer transition-all text-center relative overflow-hidden"
                             :class="selectedBotIndex === idx ? 'bg-purple-600/20 border-purple-400 ring-2 ring-purple-400/50 shadow-xl scale-105' : 'bg-white/5 border-white/10 hover:bg-white/10 opacity-70 hover:opacity-100'">
                            <div class="w-16 h-16 mx-auto mb-3 flex items-center justify-center p-2 rounded-2xl bg-white/10 border border-white/20">
                                <img :src="bot.image3d" class="w-full h-full object-contain filter drop-shadow-md">
                            </div>
                            <h3 class="text-base font-black text-white">{{ bot.name }}</h3>
                            <p class="text-xs text-purple-300 font-bold mb-3">{{ bot.rank }}</p>
                            <div class="text-[10px] text-gray-400 space-y-1 font-mono">
                                <div>🎯 Độ chính xác: {{ Math.round(bot.accuracy * 100) }}%</div>
                                <div>⚡ Phản xạ: {{ (bot.speedMin/1000).toFixed(1) }}s - {{ (bot.speedMax/1000).toFixed(1) }}s</div>
                            </div>
                        </div>
                    </div>

                    <button @click="startMatch" class="px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-base uppercase tracking-wider shadow-lg shadow-purple-500/40 transition-all hover:scale-105 active:scale-95 mx-auto flex items-center gap-2">
                        <i class="fa-solid fa-gamepad text-lg"></i>
                        <span>Vào Sàn Đấu Ngay</span>
                    </button>
                </div>
            </div>

            <!-- ========================================================================= -->
            <!-- SCREEN 2: ACTIVE DUEL                                                     -->
            <!-- ========================================================================= -->
            <div v-else-if="gameState === 'dueling'" class="space-y-6 animate-fade-in">
                
                <!-- SCORE TUG-OF-WAR ARENA HUD -->
                <div class="glass-panel-strong p-6 rounded-3xl bg-gradient-to-r from-[#0F1426] via-[#151A30] to-[#1E1B4B] border border-purple-500/30 text-white shadow-2xl">
                    <div class="flex items-center justify-between gap-4 mb-4">
                        <!-- Player Side -->
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center p-1">
                                <img v-if="store.userProfile?.avatar" :src="store.userProfile.avatar" class="w-full h-full rounded-xl object-cover">
                                <span v-else class="text-xl">👤</span>
                            </div>
                            <div>
                                <div class="text-xs font-black text-indigo-300 uppercase">Bạn</div>
                                <div class="text-2xl font-black text-white font-mono">{{ playerScore }} <span class="text-xs text-gray-400">PTS</span></div>
                            </div>
                        </div>

                        <!-- VS Center Badge -->
                        <div class="text-center">
                            <span class="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 font-mono">
                                ROUND {{ currentRound }} / {{ maxRounds }}
                            </span>
                            <div v-if="streak > 1" class="text-xs font-bold text-amber-400 mt-1 animate-bounce">
                                🔥 {{ streak }}x Streak
                            </div>
                        </div>

                        <!-- AI Bot Side -->
                        <div class="flex items-center gap-3 text-right">
                            <div>
                                <div class="text-xs font-black text-purple-300 uppercase">{{ currentBot.name }}</div>
                                <div class="text-2xl font-black text-white font-mono">{{ botScore }} <span class="text-xs text-gray-400">PTS</span></div>
                            </div>
                            <div class="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/50 flex items-center justify-center p-1">
                                <img :src="currentBot.image3d" class="w-full h-full object-contain filter drop-shadow-md">
                            </div>
                        </div>
                    </div>

                    <!-- Tug of War Progress Bar -->
                    <div class="h-3 w-full bg-black/50 rounded-full overflow-hidden flex border border-white/10">
                        <div class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500" :style="{ width: ((playerScore / Math.max(playerScore + botScore, 1)) * 100) + '%' }"></div>
                        <div class="h-full bg-gradient-to-r from-purple-500 to-rose-500 transition-all duration-500" :style="{ width: ((botScore / Math.max(playerScore + botScore, 1)) * 100) + '%' }"></div>
                    </div>

                    <!-- AI Speech Bubble -->
                    <div v-if="botSpeech" class="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-medium text-purple-200 flex items-center gap-2">
                        <span class="text-base">💬</span>
                        <span class="italic font-mono">"{{ botSpeech }}"</span>
                    </div>
                </div>

                <!-- QUESTION BOARD -->
                <div v-if="currentCard" class="glass-panel p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-xl text-center space-y-6">
                    <div>
                        <div class="inline-flex items-center gap-2 mb-2 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 text-[10px] font-black text-purple-700 uppercase tracking-wider">
                            Ai Bấm Nhanh Hơn Sẽ Chiến Thắng!
                        </div>
                        <h2 class="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">{{ currentCard.term }}</h2>
                    </div>

                    <!-- Options Grid -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <button v-for="(opt, idx) in options" :key="idx"
                                @click="handlePlayerAnswer(opt)"
                                :disabled="isRoundLocked"
                                class="p-4 rounded-2xl border-2 text-left font-bold text-sm transition-all flex items-center gap-3 relative overflow-hidden"
                                :class="[
                                    isRoundLocked && opt.isCorrect ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                                    isRoundLocked && !opt.isCorrect ? 'bg-gray-50 border-gray-200 text-gray-400 opacity-50' :
                                    'bg-white border-gray-200 text-gray-800 hover:border-purple-500 hover:bg-purple-50 hover:shadow-md active:scale-98'
                                ]">
                            <span class="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
                                  :class="isRoundLocked && opt.isCorrect ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'">
                                {{ ['A', 'B', 'C', 'D'][idx] }}
                            </span>
                            <span class="leading-snug">{{ opt.text }}</span>
                        </button>
                    </div>
                </div>

            </div>

            <!-- ========================================================================= -->
            <!-- SCREEN 3: MATCH SUMMARY                                                   -->
            <!-- ========================================================================= -->
            <div v-else-if="gameState === 'match_over'" class="glass-panel-strong p-8 rounded-3xl text-center bg-gradient-to-b from-[#0F1426] via-[#151A30] to-[#1E1B4B] border border-purple-500/30 text-white shadow-2xl space-y-6 animate-fade-in">
                <div class="w-24 h-24 mx-auto flex items-center justify-center animate-bounce">
                    <img :src="playerScore > botScore ? 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Trophy/3D/trophy_3d.png' : 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Cross%20mark/3D/cross_mark_3d.png'" class="w-full h-full object-contain filter drop-shadow-xl">
                </div>

                <div>
                    <h2 class="text-3xl sm:text-4xl font-black tracking-tight mb-2" :class="playerScore > botScore ? 'text-amber-400' : 'text-rose-400'">
                        {{ playerScore > botScore ? 'BẠN ĐÃ CHIẾN THẮNG!' : 'ĐỐI THỦ AI THẮNG CUỘC!' }}
                    </h2>
                    <p class="text-sm text-gray-300 font-medium">
                        Tỉ số chung cuộc: <span class="font-bold font-mono text-white">{{ playerScore }} - {{ botScore }}</span> trước {{ currentBot.name }}.
                    </p>
                </div>

                <div class="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div class="text-[10px] uppercase font-bold text-gray-400 mb-1">Điểm Của Bạn</div>
                        <div class="text-2xl font-black text-indigo-400">{{ playerScore }}</div>
                    </div>
                    <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div class="text-[10px] uppercase font-bold text-gray-400 mb-1">Thưởng LC</div>
                        <div class="text-2xl font-black text-emerald-400">+{{ earnedLC }} LC</div>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-4">
                    <button @click="startMatch" class="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-purple-500/30 transition-all active:scale-95">
                        <i class="fa-solid fa-rotate-right mr-2"></i> Tái Đấu
                    </button>
                    <button @click="gameState = 'select'" class="flex-1 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all active:scale-95">
                        Đổi Đối Thủ
                    </button>
                </div>
            </div>

        </div>
    `
};
