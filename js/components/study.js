import { ref, onMounted, onUnmounted } from 'vue';
import { store } from '../store.js';
import { updateCardMemoryState, logReviewInteraction, recordPredictionHistory, updateVocabularyDNA } from '../db.js';
import { calculateRetentionProb, calculateUrgency, calculateConfidence, updateHalfLife, calculateMastery } from '../memoryengine.js';
import { updatePersona } from '../personaengine.js';
import { playCorrect, playIncorrect } from '../sfx.js';
import { generateSessionReflection } from '../aiinsight.js';
import { speakEnglishText } from '../voice.js';

export default {
    setup() {
        const studyIndex = ref(0);
        const isFlipped = ref(false);
        const finished = ref(false);
        const cardsToStudy = ref([]);
        const modality = ref('RECOGNITION');
        const flipTime = ref(0);
        const lastAnswerWasWrong = ref(false);
        
        // Track session stats for Gemini Reflection
        const sessionStats = {
            startTime: Date.now(),
            words_reviewed: 0,
            correctCount: 0,
            latencySum: 0,
            word_stats: [] // to sort and find fastest/struggled
        };
        const aiReflection = ref('');
        const isLoadingReflection = ref(false);

        onMounted(() => {
            let filtered = store.activeCards.filter(c => {
                if (!c.last_reviewed_at) return true; // Thẻ mới
                const lastTime = c.last_reviewed_at.toMillis ? c.last_reviewed_at.toMillis() : Date.parse(c.last_reviewed_at);
                const deltaT_minutes = (Date.now() - lastTime) / 60000;
                const hl = c.recognition_half_life || 0;
                const pr = calculateRetentionProb(hl, deltaT_minutes);
                const urgency = calculateUrgency(pr);
                return urgency >= 0.5; // Cần ôn tập
            });
            
            if (filtered.length === 0) filtered = store.activeCards; // Nếu không có thẻ nào khẩn cấp, ôn tập tùy ý
            cardsToStudy.value = filtered;
            window.addEventListener('keydown', handleKeyDown);
        });

        onUnmounted(() => {
            window.removeEventListener('keydown', handleKeyDown);
        });

        const speakWord = (text) => {
            speakEnglishText(text);
        };

        const scoreFeedback = ref(null);

        const handleStudyScore = async (quality) => {
            if (scoreFeedback.value) return;
            let c = cardsToStudy.value[studyIndex.value];
            const outcome = quality >= 3;
            const latency_ms = flipTime.value > 0 ? Date.now() - flipTime.value : 3000;

            if (outcome) {
                playCorrect();
                store.addLexiCredit(c.history_length === 0 ? 1 : 3, 'action');
                sessionStats.correctCount++;
            } else {
                playIncorrect();
            }

            store.recordStudyActivity();
            
            // Gamification
            const hour = new Date().getHours();
            if (hour >= 0 && hour < 4) store.unlockBadge('night_owl');
            if (outcome && latency_ms < 2000) store.unlockBadge('flash');
            
            // Memory Prediction Engine
            const oldHalfLife = c.recognition_half_life || 0;
            const newHalfLife = updateHalfLife(oldHalfLife, outcome, latency_ms, modality.value);
            c.recognition_half_life = newHalfLife;
            c.history_length = (c.history_length || 0) + 1;
            c.last_reviewed_at = new Date(); // local mock before DB

            // Tính toán sau khi lật
            const newPr = calculateRetentionProb(newHalfLife, 0); // Vừa ôn xong thì Pr = 1.0 (hoặc gần 1.0)
            const newUrgency = calculateUrgency(newPr);
            const conf = calculateConfidence(c.history_length, true, outcome, latency_ms); // Mock lastOutcome = true

            // Tính toán Mastery
            if (!c.learnStats) c.learnStats = { masteryScore: 0 };
            const mastery = calculateMastery(c.learnStats.masteryScore, modality.value, outcome, latency_ms);
            c.learnStats.masteryScore = mastery.score;
            c.mastery_state = mastery.state;

            // Ghi nhận log
            sessionStats.words_reviewed++;
            sessionStats.latencySum += latency_ms;
            sessionStats.word_stats.push({ term: c.term, outcome, latency: latency_ms });

            // Lưu Database bất đồng bộ
            updateCardMemoryState(c.id, {
                recognition_half_life: newHalfLife,
                history_length: c.history_length,
                last_reviewed_at: new Date(),
                last_modality: modality.value,
                confidence_score: conf.score,
                mastery_state: mastery.state,
                learnStats: c.learnStats
            });
            logReviewInteraction(c.id, store.user.uid, modality.value, outcome, latency_ms);
            recordPredictionHistory(c.id, store.user.uid, newPr, newUrgency, conf.score);
            
            // DNA Sequencing
            if (c.dna_tags && c.dna_tags.length > 0) {
                updateVocabularyDNA(store.user.uid, c.dna_tags, outcome, latency_ms);
            }
            
            // Cập nhật Persona Behavioral Model
            updatePersona({
                type: 'study_card',
                latency: latency_ms,
                outcome: outcome,
                isAfterError: lastAnswerWasWrong.value
            });
            
            // Cập nhật state error cho thẻ tiếp theo
            lastAnswerWasWrong.value = !outcome;
            
            scoreFeedback.value = outcome ? 'good' : 'bad';
            setTimeout(() => {
                scoreFeedback.value = null;
                nextCard();
            }, 600);
        };

        const nextCard = async () => {
            if (studyIndex.value < cardsToStudy.value.length - 1) {
                isFlipped.value = false;
                flipTime.value = 0;
                setTimeout(() => studyIndex.value++, 150);
            } else {
                finished.value = true;
                await processSessionEnd();
            }
        };

        const processSessionEnd = async () => {
            if (sessionStats.words_reviewed === 0) return;
            
            sessionStats.duration_mins = Math.round((Date.now() - sessionStats.startTime) / 60000) || 1;
            sessionStats.accuracy = Math.round((sessionStats.correctCount / sessionStats.words_reviewed) * 100);
            sessionStats.avg_latency_ms = Math.round(sessionStats.latencySum / sessionStats.words_reviewed);
            
            // Xếp hạng từ
            const sortedWords = sessionStats.word_stats.sort((a, b) => a.latency - b.latency);
            sessionStats.fastest_recalled_words = sortedWords.filter(w => w.outcome).slice(0, 3).map(w => w.term);
            sessionStats.struggle_words = sortedWords.filter(w => !w.outcome).slice(0, 3).map(w => w.term);
            
            try {
                isLoadingReflection.value = true;
                aiReflection.value = await generateSessionReflection(sessionStats);
            } catch (err) {
                console.error("AI Insight Error:", err);
                aiReflection.value = "Hệ thống AI đang quá tải, không thể phân tích dữ liệu ngay lúc này.";
            } finally {
                isLoadingReflection.value = false;
                
                // Cập nhật Exploration Dimension
                const newCardsCount = cardsToStudy.value.filter(c => c.history_length === 0).length;
                updatePersona({
                    type: 'session_end',
                    newCards: newCardsCount,
                    totalCards: sessionStats.words_reviewed
                });
            }
        };

        const prevCard = () => {
            if (studyIndex.value > 0) {
                isFlipped.value = false;
                flipTime.value = 0;
                setTimeout(() => studyIndex.value--, 150);
            }
        };

        const shuffleCards = () => {
            isFlipped.value = false;
            cardsToStudy.value.sort(() => Math.random() - 0.5);
            studyIndex.value = 0;
        };

        const toggleCard = () => {
            if (scoreFeedback.value) return;
            isFlipped.value = !isFlipped.value;
            if (isFlipped.value) flipTime.value = Date.now();
        };

        const handleKeyDown = (e) => {
            if (finished.value) return;
            if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(e.target?.tagName)) return;
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                toggleCard();
            } else if (e.key === 'ArrowRight') {
                nextCard();
            } else if (e.key === 'ArrowLeft') {
                prevCard();
            } else if (e.key === '1') {
                handleStudyScore(1);
            } else if (e.key === '2') {
                handleStudyScore(5);
            }
        };

        const progress = () => cardsToStudy.value.length > 0 ? ((studyIndex.value) / cardsToStudy.value.length * 100) : 0;

        // Render AI Insight logic securely
        const renderReflection = (text) => {
            if (!text) return '';
            let html = text
                .replace(/^[\s]*[\*\-]\s+(.*)$/gm, '<li>$1</li>')
                .replace(/\*\*(.*?)\*\*/g, '<b class="text-gray-900">$1</b>')
                .replace(/\n/g, '<br>');
            html = html.replace(/(<\/li>)<br>/g, '$1');
            return html;
        };

        return { store, studyIndex, isFlipped, finished, cardsToStudy, speakWord, handleStudyScore, nextCard, prevCard, shuffleCards, toggleCard, scoreFeedback, progress, aiReflection, isLoadingReflection, renderReflection, flipTime };
    },
    template: `
        <div class="max-w-4xl mx-auto flex flex-col py-2 pb-20">
            <!-- Progress Bar Top -->
            <div class="progress-bar-track mb-6" v-if="cardsToStudy.length > 0">
                <div class="progress-bar-fill" :style="{ width: progress() + '%' }"></div>
            </div>

            <!-- Header -->
            <div class="flex justify-between items-center mb-6 px-1 hide-in-focus">
                <button @click="store.navigate('deck-detail')" class="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-purple-600 transition group">
                    <span class="w-8 h-8 flex items-center justify-center rounded-xl bg-white shadow-sm group-hover:bg-purple-50 transition">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </span>
                    Thoát
                </button>
                <div class="text-sm font-semibold text-gray-400">
                    <span class="text-gray-800 font-bold text-base">{{ studyIndex + 1 }}</span> / {{ cardsToStudy.length }}
                </div>
                <button @click="shuffleCards" class="w-8 h-8 flex items-center justify-center rounded-xl bg-white shadow-sm hover:bg-purple-50 hover:text-purple-600 text-gray-400 transition">
                    <i class="fa-solid fa-shuffle text-xs"></i>
                </button>
            </div>

            <!-- Finished State -->
            <div v-if="finished" class="glass-panel-strong p-8 sm:p-12 rounded-3xl text-center space-y-6 mt-10 max-w-2xl mx-auto animate-scale-in">
                <div class="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-4xl animate-bounce-in" style="background: linear-gradient(135deg, #10b981, #059669);">
                    🎉
                </div>
                <h2 class="text-3xl font-extrabold text-gray-900">Hoàn thành phiên học!</h2>
                <p class="text-gray-500 text-sm">Bạn đã xem qua tất cả {{ cardsToStudy.length }} thẻ.</p>
                
                <!-- AI Insight Card -->
                <div class="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-left relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                            <i class="fa-solid fa-wand-magic-sparkles text-xs"></i>
                        </div>
                        <h3 class="font-bold text-indigo-900">Gemini Insight - Đánh giá phiên học</h3>
                    </div>
                    
                    <div v-if="isLoadingReflection" class="flex flex-col items-center justify-center py-6">
                        <div class="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p class="text-indigo-400 text-sm mt-3 font-medium">Gemini đang phân tích biểu đồ trí nhớ của bạn...</p>
                    </div>
                    <div v-else class="text-sm text-indigo-900 leading-relaxed space-y-2">
                        <ul class="list-disc pl-5 space-y-2" v-html="renderReflection(aiReflection)"></ul>
                    </div>
                </div>

                <div class="flex gap-3 justify-center mt-6">
                    <button @click="finished = false; studyIndex = 0; isFlipped = false; shuffleCards()" 
                            class="px-6 py-2.5 rounded-2xl font-bold border-2 text-sm transition hover:-translate-y-0.5"
                            style="border-color: #6d55d1; color: #6d55d1;">
                        Học lại
                    </button>
                    <button @click="store.navigate('deck-detail')" class="btn-primary px-6 py-2.5 text-sm">
                        Quay lại
                    </button>
                </div>
            </div>

            <!-- Flashcard -->
            <div v-else-if="cardsToStudy.length > 0" class="flex-1 flex flex-col items-center w-full">
                <!-- The 3D Card -->
                <div class="study-card relative w-full max-w-3xl h-[380px] sm:h-[440px] cursor-pointer" style="perspective: 1200px;" role="button" tabindex="0"
                     :aria-pressed="isFlipped" :aria-label="isFlipped ? 'Đang hiển thị đáp án. Nhấn để xem lại thuật ngữ.' : 'Hiển thị đáp án của thẻ.'"
                     @click="toggleCard" @keydown.enter.stop.prevent="toggleCard" @keydown.space.stop.prevent="toggleCard">
                    <div class="w-full h-full relative rounded-3xl shadow-md hover:shadow-xl transition-shadow" 
                         style="transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);"
                         :style="isFlipped ? 'transform: rotateY(180deg);' : 'transform: rotateY(0deg);'">
                         
                        <!-- FRONT -->
                        <div class="card-face-front absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8 rounded-3xl overflow-hidden bg-white dark:bg-[#131B2E] border-2 border-indigo-100 dark:border-[#263554] shadow-xl"
                             style="backface-visibility: hidden; -webkit-backface-visibility: hidden; transform: rotateY(0deg);">
                            <div class="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                            
                            <div class="flex-1 w-full flex flex-col items-center justify-center gap-4">
                                <div class="text-xs font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-2">Thuật ngữ</div>
                                <h2 class="flashcard-term font-black text-gray-900 dark:text-white tracking-tight">{{ cardsToStudy[studyIndex].term }}</h2>
                                <div class="flex items-center gap-3 text-sm font-medium">
                                    <span v-if="cardsToStudy[studyIndex].pos" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50">
                                        {{ cardsToStudy[studyIndex].pos }}
                                    </span>
                                    <span v-if="cardsToStudy[studyIndex].pronunciation" class="font-mono text-sm text-gray-600 dark:text-gray-300">{{ cardsToStudy[studyIndex].pronunciation }}</span>
                                </div>
                            </div>
                            
                            <div class="flex gap-3 mt-4">
                                <button @click.stop="speakWord(cardsToStudy[studyIndex].term)" 
                                        class="w-11 h-11 rounded-2xl flex items-center justify-center transition hover:scale-110 relative z-10 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60" title="Phát âm">
                                    <i class="fa-solid fa-volume-high text-sm pointer-events-none"></i>
                                </button>
                            </div>
                            
                            <div class="mt-6 text-xs text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1.5">
                                <i class="fa-solid fa-arrows-rotate text-[10px]"></i>
                                <span>Nhấn để lật thẻ</span>
                            </div>
                        </div>
                        
                        <!-- BACK -->
                        <div class="card-face-back absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 sm:p-10 rounded-3xl overflow-y-auto text-center bg-white dark:bg-[#131B2E] border-2 border-purple-100 dark:border-[#263554] shadow-xl"
                             style="backface-visibility: hidden; -webkit-backface-visibility: hidden; transform: rotateY(180deg);">
                            <div class="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500"></div>
                            
                            <div class="text-xs font-bold uppercase tracking-widest text-purple-500 dark:text-purple-400 mb-4">Định nghĩa</div>
                            
                            <img v-if="cardsToStudy[studyIndex].imageUrl" :src="cardsToStudy[studyIndex].imageUrl" 
                                 class="max-w-full h-32 sm:h-40 object-contain rounded-xl mb-4" alt="Minh họa">
                                 
                            <h3 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">{{ cardsToStudy[studyIndex].definition }}</h3>
                            
                            <div v-if="cardsToStudy[studyIndex].example" class="text-gray-600 dark:text-gray-300 text-sm sm:text-base italic mb-4 max-w-md px-4 py-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border-l-4 border-purple-500 dark:border-purple-400">
                                "{{ cardsToStudy[studyIndex].example }}"
                            </div>

                            <div class="flex flex-wrap justify-center gap-2 mb-2">
                                <div v-if="cardsToStudy[studyIndex].collocations" class="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                                    <i class="fa-solid fa-puzzle-piece mr-1"></i>{{ cardsToStudy[studyIndex].collocations }}
                                </div>
                                <div v-if="cardsToStudy[studyIndex].wordFamily" class="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                                    <i class="fa-solid fa-sitemap mr-1"></i>{{ cardsToStudy[studyIndex].wordFamily }}
                                </div>
                                <div v-if="cardsToStudy[studyIndex].synonyms" class="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                    <i class="fa-solid fa-link mr-1"></i>{{ cardsToStudy[studyIndex].synonyms }}
                                </div>
                            </div>

                            <div class="flex gap-3 mt-4">
                                <button @click.stop="speakWord(cardsToStudy[studyIndex].term)" 
                                        class="w-11 h-11 rounded-2xl flex items-center justify-center transition hover:scale-110 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60" title="Phát âm">
                                    <i class="fa-solid fa-volume-high text-sm"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                        
                    <!-- Score Feedback Overlay -->
                    <div v-if="scoreFeedback" 
                         class="absolute inset-0 z-50 flex items-center justify-center rounded-3xl animate-fade-in"
                         :style="scoreFeedback === 'good' ? 'background: rgba(16,185,129,0.92)' : 'background: rgba(239,68,68,0.92)'">
                        <div class="text-3xl sm:text-5xl font-extrabold text-white flex items-center gap-4 drop-shadow-lg">
                            <i :class="scoreFeedback === 'good' ? 'fa-solid fa-check-circle' : 'fa-solid fa-xmark-circle'"></i>
                            {{ scoreFeedback === 'good' ? 'Đã thuộc! ✓' : 'Cần ôn lại' }}
                        </div>
                    </div>
                </div>

                <!-- Controls -->
                <div class="mt-6 w-full max-w-3xl">
                    <!-- Keyboard hint -->
                    <div class="text-center text-xs text-gray-400 font-medium mb-4 hidden sm:block">
                        <kbd class="px-2 py-0.5 bg-white border rounded-md shadow-sm">Space</kbd> lật thẻ &nbsp;·&nbsp;
                        <kbd class="px-2 py-0.5 bg-white border rounded-md shadow-sm">1</kbd> Chưa nhớ &nbsp;·&nbsp;
                        <kbd class="px-2 py-0.5 bg-white border rounded-md shadow-sm">2</kbd> Đã thuộc
                    </div>
                    
                    <div class="study-controls flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <!-- Wrong -->
                        <button @click.stop="handleStudyScore(1)" 
                                class="flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 text-sm border-2"
                                style="border-color: #fca5a5; color: #dc2626; background: rgba(254,202,202,0.3);">
                            <i class="fa-solid fa-xmark text-base"></i>
                            <span class="hidden sm:inline">Chưa nhớ</span>
                        </button>
                        
                        <!-- Prev / Counter / Next -->
                        <div class="flex items-center gap-3">
                            <button @click="prevCard()" class="icon-button w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition" aria-label="Previous card">
                                <i class="fa-solid fa-chevron-left text-xs"></i>
                            </button>
                            <span class="text-sm text-gray-400 font-semibold w-16 text-center">{{ studyIndex + 1 }} / {{ cardsToStudy.length }}</span>
                            <button @click="nextCard()" class="icon-button w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition" aria-label="Next card">
                                <i class="fa-solid fa-chevron-right text-xs"></i>
                            </button>
                        </div>
                        
                        <!-- Correct -->
                        <button @click.stop="handleStudyScore(5)"
                                class="flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 text-sm border-2"
                                style="border-color: #86efac; color: #16a34a; background: rgba(187,247,208,0.3);">
                            <span class="hidden sm:inline">Đã thuộc</span>
                            <i class="fa-solid fa-check text-base"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
};
