import { ref, onMounted, computed, watch } from 'vue';
import { store } from '../store.js';
import { generateReadingTest } from '../ai.js';
import { showToast } from '../app.js';

export default {
    setup() {
        const isLoading = ref(true);
        const testData = ref(null);
        const isSubmitted = ref(false);
        const viewMode = ref('fill'); // 'fill', 'read'
        const showWordBank = ref(false);
        const parsedPassage = ref([]);
        
        const userFill = ref([]);
        const userMcq = ref({});
        const results = ref({ fill: [], mcq: {} });

        const loadTest = async (forceNew = false) => {
            isLoading.value = true;
            isSubmitted.value = false;
            
            const testStorageKey = `reading_test_${store.activeDeck.id}`;
            const inputStorageKey = `reading_inputs_${store.activeDeck.id}`;

            if (forceNew) {
                localStorage.removeItem(testStorageKey);
                localStorage.removeItem(inputStorageKey);
                testData.value = null;
                userFill.value = [];
                userMcq.value = {};
                results.value = { fill: [], mcq: {} };
            }

            try {
                // Check cache
                const cachedTest = localStorage.getItem(testStorageKey);
                let data;

                if (cachedTest && !forceNew) {
                    data = JSON.parse(cachedTest);
                    testData.value = data;
                } else {
                    data = await generateReadingTest(store.activeCards);
                    testData.value = data;
                    localStorage.setItem(testStorageKey, JSON.stringify(data));
                }
                
                // Initialize user inputs
                const cachedInputs = localStorage.getItem(inputStorageKey);
                if (cachedInputs && !forceNew) {
                    const parsedInputs = JSON.parse(cachedInputs);
                    userFill.value = parsedInputs.fill || new Array(data.answerKey?.fillBlanks?.length || data.wordBank?.length || 0).fill('');
                    userMcq.value = parsedInputs.mcq || {};
                } else {
                    userFill.value = new Array((data.answerKey?.fillBlanks || data.answerKey?.fill_blanks || data.wordBank || []).length).fill('');
                    (data.questions || []).forEach(q => {
                        userMcq.value[q.id] = '';
                    });
                }

                // Save inputs as user types
                watch([userFill, userMcq], () => {
                    localStorage.setItem(inputStorageKey, JSON.stringify({
                        fill: userFill.value,
                        mcq: userMcq.value
                    }));
                }, { deep: true });

                // Parse passage, regex handles optional backticks around [điền từ] or [answer]
                const regex = /[`]?\[([^\]]+)\][`]?(?:\s*(?:\r?\n)?\(([^)]+)\))?/g;
                const parts = [];
                let lastIndex = 0;
                let match;
                let inputIndex = 0;
                let fallbackAnswers = [];

                while ((match = regex.exec(data.passage)) !== null) {
                    if (match.index > lastIndex) {
                        parts.push({ type: 'text', content: data.passage.substring(lastIndex, match.index) });
                    }
                    const insideBracket = match[1].trim();
                    const isGeneric = insideBracket.toLowerCase() === 'điền từ' || insideBracket.toLowerCase() === 'dien tu' || insideBracket === '...';
                    if (!isGeneric) {
                        fallbackAnswers[inputIndex] = insideBracket;
                    }
                    parts.push({ type: 'input', hint: match[2] || '', index: inputIndex });
                    inputIndex++;
                    lastIndex = regex.lastIndex;
                }
                if (lastIndex < data.passage.length) {
                    parts.push({ type: 'text', content: data.passage.substring(lastIndex) });
                }
                parsedPassage.value = parts;
                data.fallbackAnswers = fallbackAnswers;
                testData.value = data;

                // Ensure userFill length matches inputs if wordBank was missing/incomplete
                if (userFill.value.length < inputIndex) {
                    const newFill = new Array(inputIndex).fill('');
                    userFill.value.forEach((v, i) => newFill[i] = v);
                    userFill.value = newFill;
                }

            } catch (e) {
                console.error("Load Test Error:", e);
                showToast("Lỗi khi tải bài đọc: " + e.message, 'error');
                if (!testData.value) {
                    store.navigate('deck-detail');
                }
            } finally {
                isLoading.value = false;
            }
        };

        onMounted(() => {
            if (!store.activeDeck) {
                store.navigate('dashboard');
                return;
            }
            if (store.activeCards.length < 5) {
                alert("Bộ thẻ cần ít nhất 5 từ vựng để tạo bài đọc hiểu.");
                store.navigate('deck-detail');
                return;
            }
            if (!localStorage.getItem('gemini_api_key')) {
                alert("Vui lòng nhập Gemini API Key trong Cài đặt (nút bánh răng góc trên phải) trước khi dùng tính năng này.");
                store.navigate('deck-detail');
                return;
            }
            loadTest();
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

        const checkAnswers = () => {
            try {
                isSubmitted.value = true;
                
                // Fallback objects if AI format varies
                const answerKey = testData.value.answerKey || {};
                const fillBlanks = answerKey.fillBlanks || answerKey.fill_blanks || testData.value.wordBank || [];
                const mcqAnswers = answerKey.mcq || [];

                // Check fill in blanks
                userFill.value.forEach((_, idx) => {
                    const userAns = (userFill.value[idx] || '').trim().toLowerCase();
                    let correctAns = (fillBlanks[idx] || '').trim().toLowerCase();
                    if (!correctAns && testData.value.fallbackAnswers && testData.value.fallbackAnswers[idx]) {
                        correctAns = testData.value.fallbackAnswers[idx].trim().toLowerCase();
                    }
                    results.value.fill[idx] = checkMatch(userAns, correctAns);
                });

                // Check MCQ
                testData.value.questions.forEach((q, idx) => {
                    // Fallback to q.answer if answerKey.mcq is missing
                    let correctAns = mcqAnswers[idx] || q.answer || '';
                    if (typeof correctAns === 'object') correctAns = correctAns.answer || '';
                    correctAns = correctAns.toString().trim().charAt(0).toUpperCase();

                    const userAns = (userMcq.value[q.id] || '').toString().trim().toUpperCase();
                    results.value.mcq[q.id] = userAns === correctAns;
                });
                
                // Give LexiCredit instead of XP
                store.addLexiCredit(20, 'quiz');
                
                if (score.value === 100) store.unlockBadge('bookworm');

                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (e) {
                console.error("Lỗi khi chấm điểm:", e);
                alert("Đã xảy ra lỗi khi chấm điểm. Chi tiết: " + e.message);
            }
        };

        const score = computed(() => {
            if (!isSubmitted.value || !testData.value) return 0;
            const fillCorrect = results.value.fill.filter(Boolean).length;
            const mcqCorrect = Object.values(results.value.mcq).filter(Boolean).length;
            
            const fillCount = (testData.value.answerKey?.fillBlanks || testData.value.answerKey?.fill_blanks || testData.value.wordBank || []).length;
            const mcqCount = (testData.value.questions || []).length;
            const total = fillCount + mcqCount;
            
            if (total === 0) return 0;
            return Math.round(((fillCorrect + mcqCorrect) / total) * 100);
        });

        const getInputClass = (idx) => {
            if (!isSubmitted.value) return 'border-gray-400 focus:border-blue-500 text-blue-700 bg-transparent';
            return results.value.fill[idx] ? 'border-green-500 text-green-700 bg-green-50' : 'border-red-500 text-red-700 bg-red-50';
        };

        const getCorrectFillAnswer = (idx) => {
            if (!testData.value) return '';
            const answerKey = testData.value.answerKey || {};
            const fillBlanks = answerKey.fillBlanks || answerKey.fill_blanks || testData.value.wordBank || [];
            let ans = fillBlanks[idx] || '';
            if (!ans && testData.value.fallbackAnswers && testData.value.fallbackAnswers[idx]) {
                ans = testData.value.fallbackAnswers[idx];
            }
            return ans;
        };

        const getOptionClass = (qId, opt) => {
            const optLetter = opt.charAt(0).toUpperCase();
            if (!isSubmitted.value) return (userMcq.value[qId] || '').toUpperCase() === optLetter ? 'border-blue-500 bg-blue-50' : 'border-gray-200';
            
            const qIndex = testData.value.questions.findIndex(q => q.id === qId);
            const q = testData.value.questions[qIndex];
            
            const answerKey = testData.value.answerKey || {};
            const mcqAnswers = answerKey.mcq || [];
            let correctAns = mcqAnswers[qIndex] || q.answer || '';
            if (typeof correctAns === 'object') correctAns = correctAns.answer || '';
            correctAns = correctAns.toString().trim().charAt(0).toUpperCase();

            const isCorrectAns = correctAns === optLetter;
            const isSelected = (userMcq.value[qId] || '').toUpperCase() === optLetter;

            if (isCorrectAns) return 'border-green-500 bg-green-50 text-green-800 font-bold';
            if (isSelected && !isCorrectAns) return 'border-red-500 bg-red-50 text-red-800 line-through';
            return 'border-gray-200 opacity-50';
        };

        const formatText = (text) => {
            return text ? text.replace(/\n/g, '<br>') : '';
        };

        const finishTest = () => {
            localStorage.removeItem(`reading_test_${store.activeDeck.id}`);
            localStorage.removeItem(`reading_inputs_${store.activeDeck.id}`);
            store.navigate('deck-detail');
        };

        const generateNewTest = () => {
            loadTest(true);
        };

        return { 
            store, isLoading, testData, parsedPassage, 
            userFill, userMcq, isSubmitted, checkAnswers, score,
            viewMode, showWordBank, getInputClass, getOptionClass, formatText, finishTest, getCorrectFillAnswer, generateNewTest, results
        };
    },
    template: `
        <div class="max-w-5xl mx-auto space-y-6 pb-20">
            <button @click="store.navigate('deck-detail')" class="text-gray-500 hover:text-blue-600 mb-2 font-medium flex items-center gap-2 hide-in-focus">
                <i class="fa-solid fa-arrow-left"></i> Quay lại
            </button>

            <!-- Loading State -->
            <div v-if="isLoading" class="glass-panel p-16 rounded-3xl text-center shadow-lg flex flex-col items-center justify-center space-y-6">
                <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
                <h2 class="text-2xl font-bold text-gray-800">AI đang biên soạn bài đọc...</h2>
                <p class="text-gray-500 max-w-md">Gemini đang đọc qua kho từ vựng của bạn và viết một bài báo học thuật chuẩn IELTS. Quá trình này có thể mất 10-20 giây.</p>
            </div>

            <!-- Content -->
            <div v-else-if="testData" class="space-y-8 animate-fade-in">
                <!-- Header -->
                <div class="text-center space-y-2">
                    <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900">{{ testData.title }}</h1>
                    <p class="text-xl text-gray-500 font-medium">{{ testData.titleVi }}</p>
                </div>

                <!-- Controls -->
                <div class="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
                    <select v-model="viewMode" class="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium">
                        <option value="read">Chỉ đọc hiểu</option>
                        <option value="fill">Chỉ điền từ</option>
                    </select>

                    <button @click="showWordBank = !showWordBank" class="px-4 py-2 rounded-lg font-medium transition flex items-center gap-2" :class="showWordBank ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'">
                        <i class="fa-solid fa-lightbulb"></i> Ngân hàng từ
                    </button>
                </div>

                <!-- Word Bank -->
                <div v-if="showWordBank" class="glass-panel p-6 rounded-2xl shadow-sm animate-fade-in border border-blue-100 bg-blue-50/30 mb-6">
                    <h3 class="font-bold text-blue-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-box-open"></i> Word Bank</h3>
                    <div class="flex flex-wrap gap-2">
                        <span v-for="(word, i) in testData.wordBank" :key="i" class="px-3 py-1 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-800 font-medium">
                            {{ word }}
                        </span>
                    </div>
                </div>

                <!-- Reading Passage -->
                <div class="glass-panel p-6 sm:p-10 rounded-3xl shadow-sm leading-relaxed text-gray-800 space-y-8" :style="{ fontSize: (store.settings?.readingFontSize || 16) + 'px' }">
                    <div class="passage-en">
                        <template v-for="(part, idx) in parsedPassage" :key="idx">
                            <span v-if="part.type === 'text'" v-html="formatText(part.content)"></span>
                            <span v-else-if="viewMode === 'fill'" class="inline-flex flex-col items-center mx-1 align-bottom relative group">
                                <input type="text" v-model="userFill[part.index]" :disabled="isSubmitted" :class="getInputClass(part.index)" class="w-32 border-b-2 outline-none text-center font-bold px-1 pb-1 transition-colors">
                                <span v-if="part.hint" class="text-[11px] text-gray-500 mt-1 max-w-[140px] truncate" :title="part.hint">({{ part.hint }})</span>
                                <!-- Hiển thị đáp án đúng nếu sai -->
                                <span v-if="isSubmitted && !results.fill[part.index]" class="absolute -top-6 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded shadow-sm whitespace-nowrap z-10 font-bold">
                                    {{ getCorrectFillAnswer(part.index) }}
                                </span>
                            </span>
                            <span v-else-if="viewMode === 'read'" class="text-green-600 border-b-2 border-green-600 px-1 mx-1 font-bold">
                                {{ getCorrectFillAnswer(part.index) }}
                            </span>
                        </template>
                    </div>
                </div>

                <!-- MCQ Questions -->
                <div class="glass-panel p-6 sm:p-10 rounded-3xl shadow-sm">
                    <h3 class="text-2xl font-bold text-gray-800 mb-8"><i class="fa-solid fa-clipboard-question text-blue-600 mr-2"></i> Câu hỏi đọc hiểu</h3>
                    
                    <div class="space-y-8">
                        <div v-for="q in testData.questions" :key="q.id" class="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <p class="font-bold text-lg mb-1">{{ q.id }}. {{ q.question }}</p>
                            <p v-if="q.questionVi" class="text-sm text-gray-500 mb-4 italic">{{ q.questionVi }}</p>
                            
                            <div class="space-y-3">
                                <label v-for="opt in q.options" :key="opt" class="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition w-full" :class="getOptionClass(q.id, opt)">
                                    <input type="radio" :name="'q'+q.id" :value="opt.charAt(0)" v-model="userMcq[q.id]" :disabled="isSubmitted" class="mt-1 w-4 h-4 text-blue-600 shrink-0">
                                    <span class="leading-snug">{{ opt }}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Submit Area -->
                <div class="text-center py-8">
                    <div v-if="isSubmitted" class="mb-8 p-8 bg-white rounded-3xl shadow-lg max-w-md mx-auto transform scale-105">
                        <h3 class="text-2xl font-bold text-gray-800 mb-2">Kết quả của bạn</h3>
                        <div class="text-6xl font-black" :class="score >= 80 ? 'text-green-500' : (score >= 50 ? 'text-yellow-500' : 'text-red-500')">
                            {{ score }}%
                        </div>
                        <p class="text-gray-500 mt-2">Số câu đúng: {{ results.fill.filter(Boolean).length + Object.values(results.mcq).filter(Boolean).length }} / {{ (testData.answerKey?.fillBlanks || testData.answerKey?.fill_blanks || testData.wordBank || []).length + (testData.questions || []).length }}</p>
                    </div>

                    <button v-if="!isSubmitted" @click="checkAnswers" class="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-bold shadow-lg transition transform hover:-translate-y-1 text-lg">
                        <i class="fa-solid fa-check-double mr-2"></i> Kiểm tra đáp án
                    </button>
                    <div v-else class="flex flex-wrap justify-center gap-4">
                        <button @click="finishTest" class="bg-gray-800 hover:bg-black text-white px-8 py-4 rounded-xl font-bold shadow-lg transition transform hover:-translate-y-1 text-lg">
                            Hoàn thành
                        </button>
                        <button @click="generateNewTest" class="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition transform hover:-translate-y-1 text-lg flex items-center gap-2">
                            <i class="fa-solid fa-arrows-rotate"></i> Tạo đề mới
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
};
