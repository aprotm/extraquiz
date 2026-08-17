import { ref, onMounted, nextTick } from 'vue';
import { store } from '../store.js';
import { updateCardMemoryState } from '../db.js';
import { updateHalfLife } from '../memoryengine.js';
import { playCorrect, playIncorrect } from '../sfx.js';
import { speakEnglishText } from '../voice.js';

export default {
    setup() {
        const questions = ref([]);
        const currentIndex = ref(0);
        const isFinished = ref(false);
        const score = ref(0);
        const currentAns = ref('');
        const isAnswerChecked = ref(false);
        const inputRef = ref(null);

        const speakWord = (text) => {
            speakEnglishText(text);
        };

        onMounted(() => {
            if (store.activeCards.length === 0) return;
            let shuffled = [...store.activeCards].sort(() => 0.5 - Math.random());
            let selected = shuffled.slice(0, 20); 
            
            questions.value = selected.map(c => ({
                orig: c, term: c.term, definition: c.definition, correct: false
            }));

            if(questions.value.length > 0) {
                setTimeout(() => speakWord(questions.value[0].term), 500);
                setTimeout(() => inputRef.value?.focus(), 100);
            }
        });

        const checkAnswer = () => {
            if (isAnswerChecked.value) {
                nextQuestion();
                return;
            }
            if (!currentAns.value.trim()) return;

            const q = questions.value[currentIndex.value];
            const correctAns = q.term.toLowerCase().trim();
            const userAns = currentAns.value.toLowerCase().trim();
            q.correct = (correctAns === userAns);
            
            if (q.correct) {
                playCorrect();
                score.value++;
                store.recordStudyActivity();
                isAnswerChecked.value = true;
                setTimeout(nextQuestion, 800);
            } else {
                playIncorrect();
                let newHl = updateHalfLife(q.orig.recall_half_life || 0, false, 5000, 'RECALL');
                updateCardMemoryState(q.orig.id, { 
                    recall_half_life: newHl, 
                    history_length: (q.orig.history_length || 0) + 1,
                    last_reviewed_at: new Date()
                });
                q.orig.recall_half_life = newHl;
                q.orig.history_length = (q.orig.history_length || 0) + 1;
                isAnswerChecked.value = true;
            }
        };

        const nextQuestion = () => {
            if (currentIndex.value < questions.value.length - 1) {
                currentIndex.value++;
                currentAns.value = '';
                isAnswerChecked.value = false;
                setTimeout(() => speakWord(questions.value[currentIndex.value].term), 200);
                setTimeout(() => inputRef.value?.focus(), 100);
            } else {
                isFinished.value = true;
            }
        };

        return { store, questions, currentIndex, isFinished, score, currentAns, isAnswerChecked, inputRef, speakWord, checkAnswer, nextQuestion };
    },
    template: `
        <div class="max-w-3xl mx-auto space-y-6 pt-4 pb-20">
            <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm z-30">
                <button @click="store.navigate('deck-detail')" class="text-gray-500 font-medium hover:text-red-500">
                    <i class="fa-solid fa-arrow-left"></i> Thoát
                </button>
                <h2 class="font-bold text-lg">Bài luyện Nghe - Chép</h2>
                <div class="text-sm font-medium bg-purple-50 text-purple-600 px-3 py-1 rounded-full">
                    {{ isFinished ? questions.length : currentIndex + 1 }} / {{ questions.length }} Câu hỏi
                </div>
            </div>

            <!-- Kết quả -->
            <div v-if="isFinished" class="glass-panel p-8 rounded-3xl text-center space-y-4 shadow-sm animate-fade-in">
                <i class="fa-solid fa-trophy text-6xl text-yellow-400"></i>
                <h2 class="text-3xl font-bold text-gray-800">Hoàn thành!</h2>
                <p class="text-xl text-gray-600">Điểm của bạn: <strong class="text-purple-600">{{ score }} / {{ questions.length }}</strong></p>
                <p v-if="score < questions.length" class="text-red-500 text-sm font-medium mt-2">
                    * Các từ gõ sai đã được đánh dấu "Cần ôn lại" trong bộ thẻ.
                </p>
                <div class="pt-6">
                    <button @click="store.navigate('deck-detail')" class="bg-purple-600 hover:bg-purple-700 text-white px-12 py-4 rounded-2xl font-bold text-xl shadow-lg transition transform hover:-translate-y-1">
                        Quay Về
                    </button>
                </div>
            </div>

            <!-- Câu hỏi 1 by 1 -->
            <div v-else-if="questions.length > 0" class="glass-panel p-8 sm:p-12 rounded-3xl shadow-sm text-center relative max-w-2xl mx-auto mt-10">
                <button @click="speakWord(questions[currentIndex].term)" class="w-20 h-20 bg-purple-100 text-purple-600 rounded-full text-3xl mb-8 hover:bg-purple-200 transition shadow-inner inline-flex items-center justify-center cursor-pointer">
                    <i class="fa-solid fa-headphones"></i>
                </button>
                
                <p class="text-sm text-gray-500 uppercase font-bold tracking-wider mb-6">Nghe và gõ lại tiếng Anh</p>
                
                <input type="text" v-model="currentAns" ref="inputRef"
                       @keyup.enter="checkAnswer"
                       :disabled="isAnswerChecked && questions[currentIndex].correct"
                       placeholder="Gõ từ bạn nghe được..." 
                       class="w-full text-center text-3xl font-bold p-4 border-b-4 bg-transparent outline-none transition"
                       :class="!isAnswerChecked ? 'border-gray-300 focus:border-purple-500' : (questions[currentIndex].correct ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600')">
                       
                <div v-if="isAnswerChecked" class="mt-8 animate-fade-in">
                    <div v-if="questions[currentIndex].correct" class="text-green-600 font-bold text-xl flex items-center justify-center gap-2">
                        <i class="fa-solid fa-check-circle"></i> Chính xác!
                    </div>
                    <div v-else class="text-red-600 font-medium bg-red-50 p-6 rounded-2xl border border-red-100 text-left">
                        <p class="text-lg">Từ đúng: <strong class="text-2xl ml-2 font-bold">{{ questions[currentIndex].term }}</strong></p>
                        <p class="text-gray-600 mt-2">Nghĩa: {{ questions[currentIndex].definition }}</p>
                    </div>
                </div>

                <div class="mt-10 flex justify-center">
                    <button v-if="isAnswerChecked && !questions[currentIndex].correct" @click="checkAnswer" class="bg-purple-600 hover:bg-purple-700 text-white px-10 py-3 rounded-xl font-bold transition shadow-md w-full">
                        Tiếp tục <i class="fa-solid fa-arrow-right ml-2"></i>
                    </button>
                    <button v-else-if="!isAnswerChecked" @click="checkAnswer" :disabled="!currentAns.trim()" class="bg-gray-800 hover:bg-black text-white px-10 py-3 rounded-xl font-bold transition shadow-md w-full disabled:opacity-50">
                        Kiểm tra (Enter)
                    </button>
                </div>
            </div>
        </div>
    `
};
