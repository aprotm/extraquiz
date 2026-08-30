import { ref, onMounted, computed, watch } from 'vue';
import { store } from '../store.js';
import { generateReadingTest, IELTS_READING_LEVELS } from '../ai.js';
import { resolveVocabulary } from '../vocabresolver.js';
import { showToast } from '../toast.js';

export default {
    setup() {
        const isLoading = ref(false);
        const isConfiguring = ref(false);
        const testData = ref(null);
        const isSubmitted = ref(false);
        const viewMode = ref('fill'); // 'fill', 'read'
        const showWordBank = ref(false);
        const parsedPassage = ref([]);
        
        const userFill = ref([]);
        const userMcq = ref({});
        const results = ref({ fill: [], mcq: {} });

        // Configuration State
        const readingLevel = ref('5.5-6.5'); // '4.5-5.5' | '5.5-6.5' | '6.5-7.5' | '7.5-8.5+'
        const questionCount = ref(8); // 5 | 8 | 10
        const vocabSource = ref(store.activeDeck ? 'current' : 'all'); // 'current' | 'all' | 'selected'
        const selectedDeckIds = ref(store.activeDeck ? [store.activeDeck.id] : []);
        const lastMeta = ref({ level: '5.5-6.5', sourceLabel: '', wordCount: 0, questionCount: 8 });

        const questionCountOptions = [
            { count: 5, label: '5 câu', sub: 'Luyện nhanh · 1-2 đoạn', icon: 'fa-bolt', badge: 'Nhanh' },
            { count: 8, label: '8 câu', sub: 'Chuẩn IELTS · 3-4 đoạn', icon: 'fa-bullseye', badge: 'Khuyên dùng' },
            { count: 10, label: '10 câu', sub: 'Chuyên sâu · Đầy đủ dạng bài', icon: 'fa-trophy', badge: 'Mastery' }
        ];

        // Dynamic Loading Steps
        const loadingStepIndex = ref(0);
        const loadingSteps = [
            "Đang phân tích cấu trúc ngữ pháp & từ vựng mục tiêu...",
            "Đang thiết lập chủ đề học thuật & cấu trúc đoạn văn IELTS...",
            "Đang biên soạn câu hỏi đọc hiểu & bẫy trắc nghiệm...",
            "Đang hoàn thiện đề thi & tổng hợp bảng từ vựng..."
        ];
        let stepInterval = null;

        const startLoadingSteps = () => {
            loadingStepIndex.value = 0;
            if (stepInterval) clearInterval(stepInterval);
            stepInterval = setInterval(() => {
                loadingStepIndex.value = (loadingStepIndex.value + 1) % loadingSteps.length;
            }, 2500);
        };

        const stopLoadingSteps = () => {
            if (stepInterval) {
                clearInterval(stepInterval);
                stepInterval = null;
            }
        };

        const availableDecks = computed(() => store.decks || []);

        const levelOptions = [
            {
                id: '4.5-5.5',
                range: '4.5–5.5',
                label: 'Foundation',
                badge: 'Nền tảng',
                desc: '350–500 từ · Cấu trúc câu ngắn, từ vựng thông dụng, dễ tiếp cận',
                icon: 'fa-seedling',
                color: 'text-emerald-600',
                borderActive: 'border-emerald-500 bg-emerald-50/50 text-emerald-900 shadow-emerald-100'
            },
            {
                id: '5.5-6.5',
                range: '5.5–6.5',
                label: 'Intermediate',
                badge: 'Khuyên dùng',
                desc: '450–650 từ · Chuẩn format IELTS, câu phức & paraphrasing rõ nét',
                icon: 'fa-compass',
                color: 'text-indigo-600',
                borderActive: 'border-indigo-500 bg-indigo-50/50 text-indigo-900 shadow-indigo-100'
            },
            {
                id: '6.5-7.5',
                range: '6.5–7.5',
                label: 'Upper-Intermediate',
                badge: 'Học thuật',
                desc: '550–750 từ · Từ vựng trừu tượng, đa mệnh đề, suy luận sâu',
                icon: 'fa-graduation-cap',
                color: 'text-purple-600',
                borderActive: 'border-purple-500 bg-purple-50/50 text-purple-900 shadow-purple-100'
            },
            {
                id: '7.5-8.5+',
                range: '7.5–8.5+',
                label: 'Advanced',
                badge: 'Chuyên sâu',
                desc: '650–850 từ · Học thuật cao cấp, liên kết ngầm, luận điểm đa tầng',
                icon: 'fa-gem',
                color: 'text-amber-600',
                borderActive: 'border-amber-500 bg-amber-50/50 text-amber-900 shadow-amber-100'
            }
        ];

        const toggleDeckSelection = (deckId) => {
            const idx = selectedDeckIds.value.indexOf(deckId);
            if (idx > -1) {
                selectedDeckIds.value.splice(idx, 1);
            } else {
                selectedDeckIds.value.push(deckId);
            }
        };

        const selectAllDecks = () => {
            selectedDeckIds.value = availableDecks.value.map(d => d.id);
        };

        const deselectAllDecks = () => {
            selectedDeckIds.value = [];
        };

        const currentSourceSummary = computed(() => {
            if (vocabSource.value === 'current') {
                return store.activeDeck ? `Bộ "${store.activeDeck.title}" (${store.activeCards?.length || 0} từ)` : 'Bộ thẻ hiện tại';
            }
            if (vocabSource.value === 'all') {
                const totalCards = availableDecks.value.reduce((acc, d) => acc + (d.cardsCount || 0), 0);
                return `Toàn bộ kho từ (${availableDecks.value.length} bộ thẻ · ~${totalCards} từ)`;
            }
            if (vocabSource.value === 'selected') {
                const selDecks = availableDecks.value.filter(d => selectedDeckIds.value.includes(d.id));
                const totalCards = selDecks.reduce((acc, d) => acc + (d.cardsCount || 0), 0);
                return `Đã chọn ${selectedDeckIds.value.length} bộ thẻ (~${totalCards} từ)`;
            }
            return '';
        });

        const isGenerateDisabled = computed(() => {
            if (vocabSource.value === 'selected' && selectedDeckIds.value.length === 0) {
                return true;
            }
            if (vocabSource.value === 'current' && (!store.activeCards || store.activeCards.length === 0)) {
                return true;
            }
            return false;
        });

        const startGenerate = async (forceNew = true) => {
            if (!localStorage.getItem('gemini_api_key') && !store.userProfile?.geminiApiKey) {
                showToast("Vui lòng nhập Gemini API Key trong Cài đặt trước khi dùng tính năng này.", "error");
                return;
            }

            if (vocabSource.value === 'selected' && selectedDeckIds.value.length === 0) {
                showToast("Vui lòng chọn ít nhất 1 bộ thẻ!", "error");
                return;
            }

            isLoading.value = true;
            isConfiguring.value = false;
            isSubmitted.value = false;
            startLoadingSteps();

            try {
                // 1. Resolve vocabulary
                const resolved = await resolveVocabulary({
                    source: vocabSource.value,
                    currentDeckId: store.activeDeck?.id,
                    selectedDeckIds: selectedDeckIds.value,
                    userUid: store.user?.uid,
                    activeCards: store.activeCards,
                    allDecks: availableDecks.value,
                    maxSampleWords: 40
                });

                if (!resolved.words || resolved.words.length < 3) {
                    showToast("Nguồn từ vựng đã chọn không có đủ từ (cần ít nhất 3 từ vựng) để tạo bài đọc!", "error");
                    isLoading.value = false;
                    isConfiguring.value = true;
                    stopLoadingSteps();
                    return;
                }

                // 2. Call AI with target difficulty level, question count, and words
                const data = await generateReadingTest({
                    wordList: resolved.words,
                    readingLevel: readingLevel.value,
                    questionCount: questionCount.value
                });

                testData.value = data;
                lastMeta.value = {
                    level: readingLevel.value,
                    sourceLabel: currentSourceSummary.value,
                    wordCount: resolved.words.length,
                    questionCount: questionCount.value
                };

                // Reset inputs
                userFill.value = new Array((data.answerKey?.fillBlanks || data.answerKey?.fill_blanks || data.wordBank || []).length).fill('');
                userMcq.value = {};
                (data.questions || []).forEach(q => {
                    userMcq.value[q.id] = '';
                });
                results.value = { fill: [], mcq: {} };

                // Parse passage slots
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

                showToast("Đã tạo bài đọc IELTS thành công!", "success");

            } catch (e) {
                console.error("Generate Reading Error:", e);
                showToast("Lỗi khi tạo bài đọc: " + e.message, 'error');
                isConfiguring.value = true;
            } finally {
                isLoading.value = false;
                stopLoadingSteps();
            }
        };

        const openConfiguration = () => {
            isConfiguring.value = true;
        };

        onMounted(() => {
            if (!store.activeDeck) {
                vocabSource.value = 'all';
            } else {
                vocabSource.value = 'current';
                selectedDeckIds.value = [store.activeDeck.id];
            }
            if (!testData.value) {
                isConfiguring.value = true;
            }
        });

        const normalizeAns = (val) => {
            if (!val) return '';
            const s = String(val).trim().toUpperCase();
            if (s.startsWith('A.') || s === 'A') return 'A';
            if (s.startsWith('B.') || s === 'B') return 'B';
            if (s.startsWith('C.') || s === 'C') return 'C';
            if (s.startsWith('D.') || s === 'D') return 'D';
            if (s.startsWith('TRUE') || s === 'T') return 'TRUE';
            if (s.startsWith('FALSE') || s === 'F') return 'FALSE';
            if (s.startsWith('NOT GIVEN') || s.startsWith('NOT_GIVEN') || s.startsWith('NG')) return 'NOT GIVEN';
            return s;
        };

        const getOptionVal = (opt) => {
            if (!opt) return '';
            const s = String(opt).trim();
            if (/^[A-D]\./i.test(s)) return s.charAt(0).toUpperCase();
            return s;
        };

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

                // Check Questions (MCQ & TFNG)
                testData.value.questions.forEach((q, idx) => {
                    let rawCorrect = mcqAnswers[idx] || q.answer || '';
                    if (typeof rawCorrect === 'object') rawCorrect = rawCorrect.answer || '';
                    const correctAns = normalizeAns(rawCorrect);
                    const userAns = normalizeAns(userMcq.value[q.id] || '');
                    results.value.mcq[q.id] = userAns === correctAns;
                });
                
                store.addLexiCredit(25, 'quiz');
                if (score.value === 100) store.unlockBadge('bookworm');

                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (e) {
                console.error("Lỗi khi chấm điểm:", e);
                showToast("Đã xảy ra lỗi khi chấm điểm: " + e.message, "error");
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
            if (!isSubmitted.value) return 'border-gray-400 focus:border-indigo-500 text-indigo-700 bg-transparent';
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
            const optVal = getOptionVal(opt);
            const normalizedOpt = normalizeAns(optVal);
            const userVal = normalizeAns(userMcq.value[qId] || '');

            if (!isSubmitted.value) {
                return userVal === normalizedOpt
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-bold ring-2 ring-indigo-200'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white';
            }

            const qIndex = testData.value.questions.findIndex(q => q.id === qId);
            const q = testData.value.questions[qIndex];

            const answerKey = testData.value.answerKey || {};
            const mcqAnswers = answerKey.mcq || [];
            let rawCorrect = mcqAnswers[qIndex] || q.answer || '';
            if (typeof rawCorrect === 'object') rawCorrect = rawCorrect.answer || '';
            const isCorrectAns = normalizedCorrect === normalizedOpt;
            const isSelected = userVal === normalizedOpt;

            if (isCorrectAns) return 'border-green-500 bg-green-50 text-green-800 font-bold ring-2 ring-green-300';
            if (isSelected && !isCorrectAns) return 'border-red-500 bg-red-50 text-red-800 line-through ring-2 ring-red-300';
            return 'border-gray-200 opacity-50 bg-gray-50';
        };

        const formatText = (text) => {
            return text ? text.replace(/\n/g, '<br>') : '';
        };

        const goBack = () => {
            if (store.activeDeck) {
                store.navigate('deck-detail');
            } else {
                store.navigate('dashboard');
            }
        };

        return { 
            store, isLoading, isConfiguring, testData, parsedPassage, 
            userFill, userMcq, isSubmitted, checkAnswers, score,
            viewMode, showWordBank, getInputClass, getOptionClass, formatText, 
            getCorrectFillAnswer, results, readingLevel, vocabSource,
            selectedDeckIds, levelOptions, availableDecks, toggleDeckSelection,
            selectAllDecks, deselectAllDecks, currentSourceSummary,
            isGenerateDisabled, startGenerate, openConfiguration, goBack, lastMeta,
            loadingStepIndex, loadingSteps, questionCount, questionCountOptions, getOptionVal
        };
    },
    template: `
        <div class="max-w-5xl mx-auto space-y-6 pb-20 select-none">
            <!-- Top Navigation & Return -->
            <div class="flex items-center justify-between">
                <button @click="goBack" class="text-gray-500 hover:text-indigo-600 font-bold flex items-center gap-2 transition text-sm">
                    <i class="fa-solid fa-arrow-left"></i> Quay lại
                </button>
                <button v-if="testData && !isLoading && !isConfiguring" 
                        @click="openConfiguration"
                        class="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 flex items-center gap-2 transition shadow-sm">
                    <i class="fa-solid fa-sliders"></i> Tùy Chỉnh & Tạo Đề Mới
                </button>
            </div>

            <!-- 1. CONFIGURATION MODE -->
            <div v-if="isConfiguring && !isLoading" class="space-y-6 animate-fade-in">
                <!-- Configuration Hero Card -->
                <div class="glass-panel-strong p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-sm relative overflow-hidden">
                    <div class="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                            <i class="fa-solid fa-wand-magic-sparkles"></i>
                        </div>
                        <div>
                            <h2 class="text-xl sm:text-2xl font-black text-gray-900">AI IELTS Reading Generator</h2>
                            <p class="text-xs sm:text-sm text-gray-500 mt-1 font-medium leading-relaxed">
                                Tự động biên soạn bài đọc học thuật IELTS, bài tập điền từ theo ngữ cảnh và câu hỏi đọc hiểu chuẩn khảo thí.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Section 1: IELTS Reading Difficulty -->
                <div class="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-layer-group text-indigo-600 text-base"></i>
                            <h3 class="font-extrabold text-sm sm:text-base text-gray-900">1. Chọn Thang Độ Khó IELTS (Target Difficulty)</h3>
                        </div>
                        <span class="text-[11px] font-bold text-gray-400 hidden sm:inline">Kiểm soát từ vựng, ngữ pháp & suy luận</span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        <div v-for="lvl in levelOptions" :key="lvl.id"
                             @click="readingLevel = lvl.id"
                             class="p-4 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between"
                             :class="readingLevel === lvl.id ? lvl.borderActive + ' shadow-md scale-[1.02]' : 'border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/50'">
                            
                            <!-- Active Check Icon -->
                            <div v-if="readingLevel === lvl.id" class="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                                <i class="fa-solid fa-check"></i>
                            </div>

                            <div>
                                <div class="flex items-center gap-2 mb-2">
                                    <div class="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-sm" :class="lvl.color">
                                        <i :class="'fa-solid ' + lvl.icon"></i>
                                    </div>
                                    <div>
                                        <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100" :class="lvl.color">{{ lvl.badge }}</span>
                                    </div>
                                </div>
                                <h4 class="font-black text-base text-gray-900 mb-1">IELTS {{ lvl.range }}</h4>
                                <p class="text-xs font-bold text-gray-500 mb-2">{{ lvl.label }}</p>
                            </div>
                            <p class="text-[11px] text-gray-500 leading-snug">{{ lvl.desc }}</p>
                        </div>
                    </div>
                </div>

                <!-- Section 2: Vocabulary Source Selection -->
                <div class="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-database text-purple-600 text-base"></i>
                            <h3 class="font-extrabold text-sm sm:text-base text-gray-900">2. Nguồn Từ Vựng Để AI Tạo Bài Đọc</h3>
                        </div>
                        <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                            {{ currentSourceSummary }}
                        </span>
                    </div>

                    <!-- Source Tabs -->
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button v-if="store.activeDeck"
                                type="button"
                                @click="vocabSource = 'current'"
                                class="p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between"
                                :class="vocabSource === 'current' ? 'border-purple-500 bg-purple-50/50 shadow-md scale-[1.01]' : 'border-gray-100 hover:border-gray-200 bg-white'">
                            <div class="flex items-center justify-between mb-1.5">
                                <span class="font-black text-sm text-gray-900">Bộ thẻ hiện tại</span>
                                <i class="fa-solid fa-folder text-purple-500"></i>
                            </div>
                            <p class="text-[11px] text-gray-500 truncate" :title="store.activeDeck.title">{{ store.activeDeck.title }} ({{ store.activeCards?.length || 0 }} từ)</p>
                        </button>

                        <button type="button"
                                @click="vocabSource = 'all'"
                                class="p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between"
                                :class="vocabSource === 'all' ? 'border-purple-500 bg-purple-50/50 shadow-md scale-[1.01]' : 'border-gray-100 hover:border-gray-200 bg-white'">
                            <div class="flex items-center justify-between mb-1.5">
                                <span class="font-black text-sm text-gray-900">Toàn bộ kho từ</span>
                                <i class="fa-solid fa-layer-group text-indigo-500"></i>
                            </div>
                            <p class="text-[11px] text-gray-500">Tổng hợp toàn bộ {{ availableDecks.length }} bộ thẻ của bạn</p>
                        </button>

                        <button type="button"
                                @click="vocabSource = 'selected'"
                                class="p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between"
                                :class="vocabSource === 'selected' ? 'border-purple-500 bg-purple-50/50 shadow-md scale-[1.01]' : 'border-gray-100 hover:border-gray-200 bg-white'">
                            <div class="flex items-center justify-between mb-1.5">
                                <span class="font-black text-sm text-gray-900">Tùy chọn nhiều bộ</span>
                                <i class="fa-solid fa-list-check text-amber-500"></i>
                            </div>
                            <p class="text-[11px] text-gray-500">Tự do tick chọn các bộ thẻ mong muốn</p>
                        </button>
                    </div>

                    <!-- Selected Decks Multi-Select Grid -->
                    <div v-if="vocabSource === 'selected'" class="pt-4 border-t border-gray-100 space-y-3 animate-fade-in">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-gray-700">Chọn các bộ thẻ đưa vào bài đọc:</span>
                            <div class="flex items-center gap-2">
                                <button @click="selectAllDecks" class="text-[11px] font-bold text-indigo-600 hover:underline">Chọn tất cả</button>
                                <span class="text-gray-300">·</span>
                                <button @click="deselectAllDecks" class="text-[11px] font-bold text-gray-500 hover:underline">Bỏ chọn</button>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                            <label v-for="d in availableDecks" :key="d.id"
                                   class="flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition select-none"
                                   :class="selectedDeckIds.includes(d.id) ? 'border-purple-400 bg-purple-50/60 font-bold' : 'border-gray-100 hover:bg-gray-50 text-gray-700'">
                                <div class="flex items-center gap-2.5 overflow-hidden">
                                    <input type="checkbox" 
                                           :checked="selectedDeckIds.includes(d.id)"
                                           @change="toggleDeckSelection(d.id)"
                                           class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300 cursor-pointer shrink-0">
                                    <span class="text-xs truncate" :title="d.title">{{ d.title }}</span>
                                </div>
                                <span class="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500 shrink-0 font-mono">
                                    {{ d.cardsCount || 0 }} từ
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Section 3: Question Count Selector -->
                <div class="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-clipboard-list text-pink-600 text-base"></i>
                            <h3 class="font-extrabold text-sm sm:text-base text-gray-900">3. Số Lượng Câu Hỏi Đọc Hiểu</h3>
                        </div>
                        <span class="text-[11px] font-bold text-gray-400 hidden sm:inline">Phối hợp Multiple Choice & True/False/NG</span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <button v-for="opt in questionCountOptions" :key="opt.count"
                                type="button"
                                @click="questionCount = opt.count"
                                class="p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer"
                                :class="questionCount === opt.count ? 'border-pink-500 bg-pink-50/50 shadow-md scale-[1.01]' : 'border-gray-100 hover:border-gray-200 bg-white'">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                                     :class="questionCount === opt.count ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'">
                                    <i :class="'fa-solid ' + opt.icon"></i>
                                </div>
                                <div>
                                    <div class="flex items-center gap-1.5">
                                        <span class="font-black text-base text-gray-900">{{ opt.label }}</span>
                                        <span v-if="opt.badge" class="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full"
                                              :class="opt.badge === 'Khuyên dùng' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'">{{ opt.badge }}</span>
                                    </div>
                                    <p class="text-[11px] text-gray-500">{{ opt.sub }}</p>
                                </div>
                            </div>
                            <div v-if="questionCount === opt.count" class="w-5 h-5 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px] font-bold">
                                <i class="fa-solid fa-check"></i>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Submit Generation Button -->
                <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-3xl border border-indigo-100 shadow-sm">
                    <div class="text-center sm:text-left">
                        <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Cấu hình sẵn sàng</p>
                        <p class="text-sm font-black text-gray-900 mt-0.5">
                            IELTS {{ levelOptions.find(l => l.id === readingLevel)?.range }} · {{ currentSourceSummary }} · {{ questionCount }} câu hỏi
                        </p>
                    </div>
                    <button @click="startGenerate(true)" 
                            :disabled="isGenerateDisabled"
                            class="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm">
                        <i class="fa-solid fa-wand-magic-sparkles"></i>
                        <span>Tạo Bài Đọc Ngay</span>
                    </button>
                </div>
            </div>

            <!-- 2. NEURAL QUANTUM REACTOR AI LOADING STATE -->
            <div v-else-if="isLoading" class="bg-white/95 backdrop-blur-2xl p-10 sm:p-14 rounded-3xl text-center shadow-2xl border-2 border-indigo-100/80 flex flex-col items-center justify-center space-y-8 relative overflow-hidden animate-fade-in my-4">
                <!-- Ambient Background Nebula Glow -->
                <div class="absolute w-96 h-96 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-400/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
                <div class="absolute -top-16 -left-16 w-64 h-64 bg-amber-400/15 rounded-full blur-3xl pointer-events-none"></div>

                <!-- Quantum Core Visual Stage -->
                <div class="relative w-40 h-40 flex items-center justify-center my-2">
                    <!-- Sonar Expanding Waves -->
                    <div class="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30 neural-sonar-wave pointer-events-none"></div>
                    <div class="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/25 to-pink-500/25 neural-sonar-wave-delay pointer-events-none"></div>

                    <!-- Outer Holographic Orbital Ring -->
                    <div class="absolute inset-0 rounded-full neural-ring-outer"></div>

                    <!-- Counter-Rotating Neon Gradient Laser Ring -->
                    <div class="absolute inset-2.5 rounded-full neural-ring-mid"></div>

                    <!-- Revolving Orbiting Photons -->
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div class="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 shadow-lg shadow-amber-400/90 neural-particle-1"></div>
                    </div>
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div class="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-teal-300 shadow-lg shadow-cyan-400/90 neural-particle-2"></div>
                    </div>
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div class="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 shadow-lg shadow-pink-500/90 neural-particle-3"></div>
                    </div>

                    <!-- Glowing Central Neural Core -->
                    <div class="relative w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 neural-core-center flex items-center justify-center text-white text-3xl shadow-xl shadow-indigo-500/50 z-10 border-2 border-white/40">
                        <i class="fa-solid fa-brain neural-brain-icon drop-shadow-md"></i>
                    </div>
                </div>

                <!-- Live Dynamic AI Step Title & Description -->
                <div class="space-y-3 relative z-10 max-w-lg mx-auto">
                    <h2 class="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center justify-center gap-2.5">
                        <span>Đang tạo bài đọc IELTS {{ levelOptions.find(l => l.id === readingLevel)?.range }}</span>
                        <span class="inline-flex gap-1">
                            <span class="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style="animation-delay: 0ms"></span>
                            <span class="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style="animation-delay: 150ms"></span>
                            <span class="w-2 h-2 rounded-full bg-pink-600 animate-bounce" style="animation-delay: 300ms"></span>
                        </span>
                    </h2>

                    <!-- Live Cycling AI Thinking Stages -->
                    <div class="h-9 flex items-center justify-center">
                        <p class="text-xs sm:text-sm font-extrabold text-indigo-700 bg-indigo-50/90 px-4 py-1.5 rounded-full border border-indigo-200/80 inline-flex items-center gap-2 shadow-sm animate-fade-in">
                            <i class="fa-solid fa-sparkles text-amber-500 animate-spin" style="animation-duration: 3s;"></i>
                            <span>{{ loadingSteps[loadingStepIndex] }}</span>
                        </p>
                    </div>

                    <p class="text-xs text-gray-500 font-medium leading-relaxed">
                        Hệ thống AI đang tổng hợp từ vựng và biên soạn ngữ cảnh học thuật chuẩn IELTS theo thang độ khó đã chọn.
                    </p>
                </div>

                <!-- Animated Shimmer Progress Bar -->
                <div class="w-full max-w-md bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner relative z-10 border border-gray-200/60">
                    <div class="h-2 rounded-full neural-shimmer-progress w-full"></div>
                </div>
            </div>

            <!-- 3. ACTIVE READING PASSAGE & TEST -->
            <div v-else-if="testData" class="space-y-8 animate-fade-in">
                <!-- Metadata Badge -->
                <div class="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-black border border-indigo-200 flex items-center gap-1.5">
                            <i class="fa-solid fa-bullseye"></i>
                            <span>IELTS {{ testData.readingLevel || levelOptions.find(l => l.id === readingLevel)?.range }} · {{ testData.levelLabel || levelOptions.find(l => l.id === readingLevel)?.label }}</span>
                        </span>
                        <span class="px-3 py-1 rounded-xl bg-purple-50 text-purple-700 text-xs font-black border border-purple-200 flex items-center gap-1.5">
                            <i class="fa-solid fa-database"></i>
                            <span>{{ lastMeta.sourceLabel }}</span>
                        </span>
                        <span class="px-3 py-1 rounded-xl bg-pink-50 text-pink-700 text-xs font-black border border-pink-200 flex items-center gap-1.5">
                            <i class="fa-solid fa-clipboard-check"></i>
                            <span>{{ (testData.questions || []).length }} câu hỏi</span>
                        </span>
                    </div>
                    <button @click="openConfiguration" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5">
                        <i class="fa-solid fa-sliders"></i> Tùy chỉnh đề mới
                    </button>
                </div>

                <!-- Header -->
                <div class="glass-panel-strong p-6 sm:p-8 rounded-3xl shadow-sm space-y-4 bg-white border border-gray-100">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <span class="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-2 inline-block">
                                IELTS Reading Passage
                            </span>
                            <h2 class="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{{ testData.title }}</h2>
                            <p class="text-sm font-semibold text-gray-500 mt-1">{{ testData.titleVi }}</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <button @click="showWordBank = !showWordBank" class="px-4 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 font-bold text-xs flex items-center gap-2 transition shadow-sm">
                                <i class="fa-solid fa-list-check"></i>
                                <span>{{ showWordBank ? 'Ẩn ngân hàng từ' : 'Xem ngân hàng từ' }}</span>
                            </button>
                            <button @click="viewMode = viewMode === 'fill' ? 'read' : 'fill'" class="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center gap-2 transition shadow-sm">
                                <i :class="viewMode === 'fill' ? 'fa-solid fa-book-open' : 'fa-solid fa-pen-to-square'"></i>
                                <span>{{ viewMode === 'fill' ? 'Chế độ Đọc' : 'Chế độ Điền từ' }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Word Bank Drawer -->
                    <div v-if="showWordBank" class="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 animate-fade-in">
                        <h4 class="text-xs font-black text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <i class="fa-solid fa-layer-group"></i> Ngân hàng từ vựng mục tiêu (Word Bank)
                        </h4>
                        <div class="flex flex-wrap gap-2">
                            <span v-for="(w, idx) in (testData.answerKey?.fillBlanks || testData.answerKey?.fill_blanks || testData.wordBank || [])" :key="idx"
                                  class="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-xs font-bold text-indigo-700 shadow-sm">
                                {{ w }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Reading Passage -->
                <div class="glass-panel p-6 sm:p-10 rounded-3xl shadow-sm leading-relaxed text-gray-800 space-y-8 bg-white border border-gray-100" :style="{ fontSize: (store.settings?.readingFontSize || 16) + 'px' }">
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
                            <span v-else-if="viewMode === 'read'" class="text-indigo-600 border-b-2 border-indigo-600 px-1 mx-1 font-bold">
                                {{ getCorrectFillAnswer(part.index) }}
                            </span>
                        </template>
                    </div>
                </div>

                <!-- Pure Academic English Questions (MCQ & True/False/Not Given) -->
                <div class="glass-panel p-6 sm:p-10 rounded-3xl shadow-sm bg-white border border-gray-100">
                    <h3 class="text-xl sm:text-2xl font-black text-gray-900 mb-6 flex items-center justify-between gap-2.5">
                        <div class="flex items-center gap-2.5">
                            <i class="fa-solid fa-clipboard-question text-indigo-600"></i>
                            <span>Reading Comprehension Questions</span>
                        </div>
                        <span class="text-xs font-bold text-gray-400 font-mono">{{ (testData.questions || []).length }} Questions</span>
                    </h3>
                    
                    <div class="space-y-6">
                        <div v-for="q in testData.questions" :key="q.id" class="p-5 sm:p-6 bg-gray-50/70 rounded-2xl border border-gray-100 shadow-sm transition hover:border-gray-200">
                            <div class="flex items-start justify-between gap-3 mb-3">
                                <p class="font-black text-base text-gray-900 leading-snug">
                                    <span class="text-indigo-600 mr-1.5 font-mono">{{ q.id }}.</span> {{ q.question }}
                                </p>
                                <span v-if="q.type === 'tfng' || (q.options && q.options.includes('True'))" class="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-extrabold text-[10px] uppercase border border-amber-200 shrink-0">
                                    True / False / NG
                                </span>
                                <span v-else class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-[10px] uppercase border border-indigo-200 shrink-0">
                                    MCQ
                                </span>
                            </div>
                            
                            <div class="grid gap-2.5" :class="q.type === 'tfng' || (q.options && q.options.length === 3 && q.options.includes('True')) ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'">
                                <label v-for="opt in q.options" :key="opt" class="flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition w-full bg-white shadow-sm" :class="getOptionClass(q.id, opt)">
                                    <input type="radio" :name="'q'+q.id" :value="getOptionVal(opt)" v-model="userMcq[q.id]" :disabled="isSubmitted" class="w-4 h-4 text-indigo-600 shrink-0">
                                    <span class="leading-snug text-sm font-medium">{{ opt }}</span>
                                </label>
                            </div>

                            <!-- Explanation after submit -->
                            <div v-if="isSubmitted && q.explanation" class="mt-3 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 leading-relaxed flex items-start gap-2 animate-fade-in">
                                <i class="fa-solid fa-circle-info text-indigo-600 mt-0.5 shrink-0"></i>
                                <span><strong>Giải thích:</strong> {{ q.explanation }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Submit Area -->
                <div class="text-center py-6">
                    <div v-if="isSubmitted" class="mb-8 p-8 bg-white rounded-3xl shadow-lg border border-gray-100 max-w-md mx-auto transform scale-105">
                        <h3 class="text-2xl font-black text-gray-900 mb-2">Kết quả của bạn</h3>
                        <div class="text-6xl font-black my-2" :class="score >= 80 ? 'text-green-500' : (score >= 50 ? 'text-amber-500' : 'text-red-500')">
                            {{ score }}%
                        </div>
                        <p class="text-gray-500 font-bold text-sm mt-2">Số câu đúng: {{ results.fill.filter(Boolean).length + Object.values(results.mcq).filter(Boolean).length }} / {{ (testData.answerKey?.fillBlanks || testData.answerKey?.fill_blanks || testData.wordBank || []).length + (testData.questions || []).length }}</p>
                    </div>

                    <button v-if="!isSubmitted" @click="checkAnswers" class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-indigo-200 transition transform hover:-translate-y-1 text-base">
                        <i class="fa-solid fa-check-double mr-2"></i> Kiểm tra đáp án
                    </button>
                    <div v-else class="flex flex-wrap justify-center gap-4">
                        <button @click="goBack" class="bg-gray-800 hover:bg-black text-white px-8 py-3.5 rounded-xl font-bold shadow-md transition text-sm">
                            Hoàn thành
                        </button>
                        <button @click="openConfiguration" class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white px-8 py-3.5 rounded-xl font-bold shadow-md transition text-sm flex items-center gap-2">
                            <i class="fa-solid fa-sliders"></i> Tùy chỉnh đề mới
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
};
