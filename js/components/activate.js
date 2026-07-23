import { ref, onMounted } from 'vue';
import { store } from '../store.js';
import { gradeSentence } from '../ai.js';
import { updateCardMemoryState, logReviewInteraction, updateVocabularyDNA } from '../db.js';
import { calculateMastery } from '../memoryengine.js';
import { updatePersona } from '../personaengine.js';

export default {
    setup() {
        const currentIndex = ref(0);
        const cardsToStudy = ref([]);
        const sentence = ref('');
        const isLoading = ref(false);
        const feedback = ref(null);
        const finished = ref(false);

        onMounted(() => {
            if (!store.activeDeck) {
                store.navigate('dashboard');
                return;
            }
            // Chỉ chọn những từ ở trạng thái Passive, Seen hoặc Practicing để Activate
            let targetCards = store.activeCards.filter(c => {
                const s = c.mastery_state || 'Unknown';
                return ['Unknown', 'Seen', 'Passive', 'Practicing'].includes(s);
            });
            if (targetCards.length === 0) {
                targetCards = store.activeCards; // If none found, just use all
            }
            // Shuffle
            cardsToStudy.value = targetCards.sort(() => Math.random() - 0.5).slice(0, 10);
        });

        const currentCard = () => cardsToStudy.value[currentIndex.value];

        const submitSentence = async () => {
            if (!sentence.value.trim() || isLoading.value) return;
            const c = currentCard();
            isLoading.value = true;
            try {
                const result = await gradeSentence(c.term, sentence.value, c.definition);
                feedback.value = result;

                // Update Mastery
                if (!c.learnStats) c.learnStats = { masteryScore: 0 };
                const mastery = calculateMastery(
                    c.learnStats.masteryScore, 
                    'ACTIVATE', 
                    result.isCorrect, 
                    0, 
                    result.isCorrect, // Sentence Gen
                    result.isContextUsageGood // Context
                );

                const oldState = c.mastery_state;

                c.learnStats.masteryScore = mastery.score;
                c.mastery_state = mastery.state;

                // Save to DB
                await updateCardMemoryState(c.id, {
                    mastery_state: mastery.state,
                    learnStats: c.learnStats
                });
                
                logReviewInteraction(c.id, store.user.uid, 'ACTIVATE', result.isCorrect, 0);

                // Gamification: Upgrade Passive -> Active
                if (['Passive', 'Practicing'].includes(oldState) && mastery.state === 'Active') {
                    store.addLexiCredit(5, 'action'); // +5 LexiCredit
                    store.unlockBadge('word_activator');
                }

                // Persona & DNA Integration
                const latency_ms = 10000; // Simulated latency for writing a sentence
                if (c.dna_tags && c.dna_tags.length > 0) {
                    updateVocabularyDNA(store.user.uid, c.dna_tags, result.isCorrect, latency_ms);
                }
                updatePersona({
                    type: 'activate_card',
                    latency: latency_ms,
                    outcome: result.isCorrect,
                    difficulty: c.difficulty_level || 5
                });

            } catch (err) {
                console.error(err);
                alert("Lỗi khi kết nối AI: " + err.message);
            } finally {
                isLoading.value = false;
            }
        };

        const nextWord = () => {
            if (currentIndex.value < cardsToStudy.value.length - 1) {
                currentIndex.value++;
                sentence.value = '';
                feedback.value = null;
            } else {
                finished.value = true;
            }
        };

        const renderMarkdown = (text) => {
            if (!text) return '';
            return window.marked ? window.marked.parse(text) : text;
        };

        return {
            store, currentIndex, cardsToStudy, currentCard, sentence, submitSentence, isLoading, feedback, nextWord, finished, renderMarkdown
        };
    },
    template: `
        <div class="max-w-3xl mx-auto py-6 pb-20">
            <div class="flex justify-between items-center mb-6">
                <button @click="store.navigate('deck-detail')" class="text-gray-500 hover:text-purple-600 font-semibold flex items-center gap-2 transition">
                    <span class="w-8 h-8 flex items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100"><i class="fa-solid fa-arrow-left text-sm"></i></span>
                    Thoát
                </button>
                <div class="text-sm font-bold text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                    {{ currentIndex + 1 }} / {{ cardsToStudy.length }}
                </div>
            </div>

            <div v-if="finished" class="bg-white rounded-3xl p-8 text-center shadow-lg border border-purple-100">
                <div class="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner">
                    <i class="fa-solid fa-check"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Hoàn thành Activate!</h2>
                <p class="text-gray-500 mb-6">Bạn đã nỗ lực đặt câu để biến từ vựng thành của mình.</p>
                <button @click="store.navigate('deck-detail')" class="btn-primary px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition">
                    Trở về Bộ thẻ
                </button>
            </div>

            <div v-else-if="cardsToStudy.length > 0">
                <div class="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 mb-6 relative overflow-hidden group">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                    
                    <div class="mb-6 text-center">
                        <div class="text-sm uppercase tracking-widest text-purple-500 font-bold mb-2 flex items-center justify-center gap-2">
                            <i class="fa-solid fa-fire text-orange-500"></i> Activate Vocabulary Mode
                        </div>
                        <h2 class="text-4xl md:text-5xl font-black text-gray-800 mb-3 tracking-tight">{{ currentCard().term }}</h2>
                        <p class="text-lg text-gray-500 font-medium">{{ currentCard().definition }}</p>
                        <p class="text-sm text-gray-400 mt-1 italic" v-if="currentCard().pos">({{ currentCard().pos }})</p>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">Hãy tự đặt một câu tiếng Anh dùng từ này:</label>
                            <textarea 
                                v-model="sentence" 
                                rows="3" 
                                placeholder="Ví dụ: I am very meticulous when writing code..."
                                class="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all resize-none shadow-inner"
                                :disabled="isLoading || feedback"
                            ></textarea>
                        </div>
                        
                        <button v-if="!feedback" @click="submitSentence" :disabled="!sentence.trim() || isLoading" class="w-full btn-primary py-4 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition flex justify-center items-center gap-2">
                            <i v-if="isLoading" class="fa-solid fa-spinner fa-spin"></i>
                            <span v-if="isLoading">AI Đang Chấm...</span>
                            <span v-else><i class="fa-solid fa-paper-plane"></i> Gửi cho AI chấm điểm</span>
                        </button>
                    </div>
                </div>

                <div v-if="feedback" class="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 animate-fade-in-up">
                    <div class="flex items-start gap-4 mb-4">
                        <div class="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0" :class="feedback.isCorrect ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'">
                            <i :class="feedback.isCorrect ? 'fa-solid fa-check' : 'fa-solid fa-xmark'"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-800" :class="feedback.isCorrect ? 'text-green-600' : 'text-red-600'">
                                {{ feedback.isCorrect ? 'Tuyệt vời!' : 'Cần sửa lại chút nhé' }}
                            </h3>
                            <p class="text-sm text-gray-500">Điểm đánh giá: <strong class="text-gray-800">{{ feedback.score }}/100</strong></p>
                        </div>
                    </div>
                    
                    <div class="p-4 bg-gray-50 rounded-2xl text-gray-700 text-sm leading-relaxed border border-gray-100 mb-4 prose prose-sm max-w-none" v-html="renderMarkdown(feedback.feedback)">
                    </div>

                    <button @click="nextWord" class="w-full bg-gray-900 hover:bg-black text-white py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition">
                        Tiếp Tục <i class="fa-solid fa-arrow-right ml-1"></i>
                    </button>
                </div>
            </div>
            
            <div v-else class="text-center py-20 text-gray-500">
                <i class="fa-solid fa-spinner fa-spin text-3xl mb-4"></i>
                <p>Đang chuẩn bị thẻ...</p>
            </div>
        </div>
    `
};
