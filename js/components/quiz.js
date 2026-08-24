import { ref, onMounted } from 'vue';
import { store } from '../store.js';
import { updateCardMemoryState } from '../db.js';
import { updateHalfLife } from '../memoryengine.js';
import { playCorrect, playIncorrect } from '../sfx.js';
import { speakEnglishText } from '../voice.js';

export default {
    setup() {
        const questions = ref([]);
        const isSubmitted = ref(false);
        const score = ref(0);

        const speakWord = (text) => {
            speakEnglishText(text);
        };

        const settings = ref({ mode: 'mcq' });
        const showSettings = ref(false);

        const loadSettings = () => {
            const saved = localStorage.getItem('quiz-settings-v1');
            if (saved) settings.value = JSON.parse(saved);
        };

        const saveSettings = () => {
            localStorage.setItem('quiz-settings-v1', JSON.stringify(settings.value));
            showSettings.value = false;
            restartQuiz();
        };

        const generateQuiz = () => {
            if (store.activeCards.length === 0) return;
            let shuffled = [...store.activeCards].sort(() => 0.5 - Math.random());
            let selected = shuffled.slice(0, 20);
            questions.value = selected.map(c => {
                let isMcq;
                if (settings.value.mode === 'mcq') isMcq = true;
                else if (settings.value.mode === 'typing') isMcq = false;
                else isMcq = Math.random() > 0.5;

                if (isMcq && store.activeCards.length >= 2) {
                    let wrongAnswers = store.activeCards.filter(x => x.id !== c.id).sort(() => 0.5 - Math.random()).slice(0, 3).map(x => x.term);
                    let options = [c.term, ...wrongAnswers].sort(() => 0.5 - Math.random());
                    return { type: 'mcq', question: c.definition, answer: c.term, options, orig: c, userAns: null, correct: false };
                } else {
                    return { type: 'fill', term: c.term, pronunciation: c.pronunciation, answer: c.definition, orig: c, userAns: '', correct: false };
                }
            });
        };

        const restartQuiz = () => {
            isSubmitted.value = false;
            score.value = 0;
            generateQuiz();
        };

        onMounted(() => {
            if (!store.activeCards || store.activeCards.length === 0) {
                if (store.decks && store.decks.length > 0) {
                    store.activeDeck = store.decks[0];
                    store.activeCards = store.decks[0].cards || [];
                }
            }
            if (!store.activeCards || store.activeCards.length === 0) {
                store.navigate('dashboard');
                return;
            }
            loadSettings();
            generateQuiz();
        });

        const checkMatch = (ans, correct) => {
            if (!ans) return false;
            if (ans === correct) return true;
            if (ans.length > 3 && correct.includes(ans)) return true;
            const cClean = correct.replace(/ *\([^)]*\) */g, "").trim();
            if (ans === cClean) return true;
            return correct.split(',').some(p => {
                const pt = p.trim();
                return pt === ans || (ans.length > 2 && pt.includes(ans));
            });
        };

        const submitQuiz = () => {
            if (isSubmitted.value) return;
            score.value = 0;
            questions.value.forEach(q => {
                if (q.type === 'mcq') {
                    q.correct = (q.userAns === q.answer);
                } else {
                    let correctAns = q.answer.toLowerCase().trim();
                    let userAns = (q.userAns || '').toLowerCase().trim();
                    q.correct = checkMatch(userAns, correctAns);
                }
                if (q.correct) {
                    score.value++;
                    store.recordStudyActivity();
                } else {
                    let newHl = updateHalfLife(q.orig.recognition_half_life || 0, false, 3000, 'RECOGNITION');
                    updateCardMemoryState(q.orig.id, { 
                        recognition_half_life: newHl, 
                        history_length: (q.orig.history_length || 0) + 1,
                        last_reviewed_at: new Date()
                    });
                    q.orig.recognition_half_life = newHl;
                    q.orig.history_length = (q.orig.history_length || 0) + 1;
                }
            });
            if (score.value >= questions.value.length * 0.8) {
                playCorrect();
                store.addLexiCredit(10, 'quiz');
            } else {
                playIncorrect();
            }
            isSubmitted.value = true;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        const getOptionClass = (q, opt) => {
            if (!isSubmitted.value) {
                return q.userAns === opt 
                    ? 'border-purple-500 bg-purple-50 text-purple-800 font-bold shadow-sm' 
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer';
            }
            if (opt === q.answer) return 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold';
            if (q.userAns === opt && !q.correct) return 'border-red-400 bg-red-50 text-red-700';
            return 'border-gray-100 opacity-50 bg-gray-50';
        };

        const scorePercent = () => questions.value.length > 0 ? Math.round((score.value / questions.value.length) * 100) : 0;

        return { store, questions, isSubmitted, score, submitQuiz, speakWord, getOptionClass, scorePercent, settings, showSettings, saveSettings };
    },
    template: `
        <div class="max-w-3xl mx-auto space-y-5 pt-2 pb-24 relative">
            <!-- Header -->
            <div class="glass-panel-strong flex justify-between items-center px-5 py-3.5 rounded-2xl">
                <button @click="store.navigate('deck-detail')" class="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-purple-600 transition">
                    <i class="fa-solid fa-arrow-left text-xs"></i> Thoát
                </button>
                <div class="flex items-center gap-2">
                    <h2 class="font-bold text-gray-900">Bài kiểm tra</h2>
                </div>
                <div class="flex items-center gap-2">
                    <div class="text-xs font-bold px-3 py-1.5 rounded-full hidden sm:block" style="background: rgba(109,85,209,0.1); color: #6d55d1;">
                        {{ questions.length }} câu
                    </div>
                    <button v-if="!isSubmitted" @click="showSettings = true" class="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition">
                        <i class="fa-solid fa-gear"></i> Cài đặt
                    </button>
                </div>
            </div>

            <!-- Score result -->
            <div v-if="isSubmitted" class="glass-panel-strong p-8 rounded-3xl text-center space-y-4 animate-scale-in">
                <div class="text-6xl mb-2">
                    {{ scorePercent() >= 80 ? '🏆' : scorePercent() >= 60 ? '👏' : '📚' }}
                </div>
                <h2 class="text-3xl font-extrabold text-gray-900">Hoàn thành!</h2>
                <div class="flex items-center justify-center gap-4">
                    <div class="text-center">
                        <div class="text-4xl font-extrabold" style="color: #6d55d1;">{{ score }}</div>
                        <div class="text-xs text-gray-500 mt-1">Đúng</div>
                    </div>
                    <div class="text-2xl text-gray-300 font-light">/</div>
                    <div class="text-center">
                        <div class="text-4xl font-extrabold text-gray-700">{{ questions.length }}</div>
                        <div class="text-xs text-gray-500 mt-1">Tổng</div>
                    </div>
                    <div class="text-center ml-4">
                        <div class="text-4xl font-extrabold" :style="scorePercent() >= 80 ? 'color: #16a34a' : scorePercent() >= 60 ? 'color: #d97706' : 'color: #dc2626'">{{ scorePercent() }}%</div>
                        <div class="text-xs text-gray-500 mt-1">Tỉ lệ</div>
                    </div>
                </div>
                <div class="progress-bar-track max-w-xs mx-auto mt-4">
                    <div class="progress-bar-fill" :style="{ width: scorePercent() + '%' }"></div>
                </div>
                <p v-if="score < questions.length" class="text-amber-600 text-xs font-semibold bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 inline-block">
                    ⚠ Các câu sai đã được đánh dấu "Cần ôn lại"
                </p>
            </div>

            <!-- Questions -->
            <div class="space-y-5">
                <div v-for="(q, index) in questions" :key="index" 
                     class="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border relative overflow-hidden transition-all"
                     :class="isSubmitted ? (q.correct ? 'border-emerald-200' : 'border-red-200') : 'border-gray-100'">
                    
                    <!-- Number badge -->
                    <div class="absolute top-5 left-5 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold text-white shadow-sm"
                         style="background: linear-gradient(135deg, #6d55d1, #8b5cf6);">
                        {{ index + 1 }}
                    </div>
                    
                    <!-- Submit indicator -->
                    <div v-if="isSubmitted" class="absolute top-5 right-5 text-xl">
                        <i v-if="q.correct" class="fa-solid fa-circle-check text-emerald-500"></i>
                        <i v-else class="fa-solid fa-circle-xmark text-red-500"></i>
                    </div>

                    <div class="ml-10">
                        <!-- MCQ -->
                        <div v-if="q.type === 'mcq'">
                            <p class="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">Chọn từ đúng với nghĩa:</p>
                            <h3 class="text-xl font-bold text-gray-900 mb-5">{{ q.question }}</h3>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <button v-for="(opt, i) in q.options" :key="i"
                                        @click="!isSubmitted && (q.userAns = opt)"
                                        :class="getOptionClass(q, opt)"
                                        :disabled="isSubmitted"
                                        class="text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold outline-none">
                                    <span class="text-gray-400 mr-2 font-normal">{{ ['A', 'B', 'C', 'D'][i] }}.</span>{{ opt }}
                                </button>
                            </div>
                        </div>

                        <!-- Fill -->
                        <div v-else>
                            <p class="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">Nhập nghĩa tiếng Việt:</p>
                            <div class="flex items-center gap-3 mb-4">
                                <h3 class="text-2xl font-extrabold text-gray-900">{{ q.term }}</h3>
                                <button @click="speakWord(q.term)" class="w-8 h-8 rounded-xl flex items-center justify-center transition hover:scale-110"
                                        style="background: rgba(109,85,209,0.1); color: #6d55d1;">
                                    <i class="fa-solid fa-volume-high text-xs"></i>
                                </button>
                            </div>
                            <p class="text-xs text-gray-400 mb-3 font-mono">{{ q.pronunciation }}</p>
                            <input type="text" v-model="q.userAns" :disabled="isSubmitted"
                                   placeholder="Nhập câu trả lời..." 
                                   class="w-full px-4 py-3 rounded-xl border-2 outline-none transition font-medium text-sm"
                                   :class="!isSubmitted ? 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 bg-white' : (q.correct ? 'border-emerald-400 bg-emerald-50 text-emerald-800 font-bold' : 'border-red-400 bg-red-50 text-red-800 font-bold')">
                            <div v-if="isSubmitted && !q.correct" class="mt-3 text-sm font-semibold bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200">
                                ✓ Đáp án đúng: <strong>{{ q.answer }}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Submit / Return -->
            <div class="flex justify-center pt-4">
                <button v-if="!isSubmitted" @click="submitQuiz" 
                        class="btn-primary px-12 py-4 text-base w-full sm:w-auto rounded-2xl">
                    <i class="fa-solid fa-paper-plane mr-2"></i> Nộp Bài Kiểm Tra
                </button>
                <button v-else @click="store.navigate('deck-detail')" 
                        class="btn-primary px-12 py-4 text-base w-full sm:w-auto rounded-2xl">
                    <i class="fa-solid fa-arrow-left mr-2"></i> Quay Về Bộ Thẻ
                </button>
            </div>

            <!-- Settings Modal -->
            <div v-if="showSettings" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="showSettings = false">
                <div class="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 animate-scale-in">
                    <div class="flex justify-between items-center mb-5">
                        <h3 class="font-bold text-gray-900 text-lg">Cài đặt bài kiểm tra</h3>
                        <button @click="showSettings = false" class="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Chế độ kiểm tra</label>
                            <div class="space-y-2">
                                <label class="flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all" :class="settings.mode === 'mcq' ? 'border-purple-400 bg-purple-50' : 'border-gray-100'">
                                    <span class="font-bold text-sm" :class="settings.mode === 'mcq' ? 'text-purple-700' : 'text-gray-700'">Chỉ trắc nghiệm</span>
                                    <input type="radio" v-model="settings.mode" value="mcq" class="hidden">
                                    <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center" :class="settings.mode === 'mcq' ? 'border-purple-500' : 'border-gray-300'">
                                        <div v-if="settings.mode === 'mcq'" class="w-2 h-2 rounded-full bg-purple-500"></div>
                                    </div>
                                </label>
                                <label class="flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all" :class="settings.mode === 'typing' ? 'border-purple-400 bg-purple-50' : 'border-gray-100'">
                                    <span class="font-bold text-sm" :class="settings.mode === 'typing' ? 'text-purple-700' : 'text-gray-700'">Chỉ nhập câu trả lời</span>
                                    <input type="radio" v-model="settings.mode" value="typing" class="hidden">
                                    <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center" :class="settings.mode === 'typing' ? 'border-purple-500' : 'border-gray-300'">
                                        <div v-if="settings.mode === 'typing'" class="w-2 h-2 rounded-full bg-purple-500"></div>
                                    </div>
                                </label>
                                <label class="flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all" :class="settings.mode === 'mixed' ? 'border-purple-400 bg-purple-50' : 'border-gray-100'">
                                    <span class="font-bold text-sm" :class="settings.mode === 'mixed' ? 'text-purple-700' : 'text-gray-700'">Chứa cả hai</span>
                                    <input type="radio" v-model="settings.mode" value="mixed" class="hidden">
                                    <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center" :class="settings.mode === 'mixed' ? 'border-purple-500' : 'border-gray-300'">
                                        <div v-if="settings.mode === 'mixed'" class="w-2 h-2 rounded-full bg-purple-500"></div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <button @click="saveSettings" class="btn-primary w-full py-3 mt-6 text-sm">Lưu & Bắt đầu lại</button>
                </div>
            </div>
        </div>
    `
};
