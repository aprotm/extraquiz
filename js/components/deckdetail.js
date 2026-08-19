import { ref } from 'vue';
import { store } from '../store.js';
import { getIELTSAnalysis } from '../ai.js';
import { showToast } from '../toast.js';
import { speakEnglishText } from '../voice.js';

export default {
    setup() {
        const speakWord = (text) => {
            speakEnglishText(text);
        };

        const getStatusClass = (st) => st === 'mastered' 
            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
            : (st === 'learning' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-500 border border-gray-200');
        const getStatusText = (st) => st === 'mastered' ? '✓ Thành thạo' : (st === 'learning' ? '⟳ Đang học' : '○ Chưa học');

        const isAiModalOpen = ref(false);
        const aiLoading = ref(false);
        const aiResult = ref(null);
        const currentAiWord = ref('');

        const askAI = async (card) => {
            if (!localStorage.getItem('gemini_api_key')) {
                showToast("Vui lòng nhập Gemini API Key trong phần Cài đặt.", 'error');
                return;
            }
            currentAiWord.value = card.term;
            isAiModalOpen.value = true;
            aiLoading.value = true;
            aiResult.value = null;
            try {
                aiResult.value = await getIELTSAnalysis(card.term, card.definition);
            } catch (e) {
                showToast(e.message, 'error');
                isAiModalOpen.value = false;
            } finally {
                aiLoading.value = false;
            }
        };

        return { store, speakWord, getStatusClass, getStatusText, isAiModalOpen, aiLoading, aiResult, currentAiWord, askAI };
    },
    template: `
        <div class="max-w-5xl mx-auto space-y-6">
            <!-- Back Button -->
            <button @click="store.navigate('dashboard')" class="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-purple-600 transition group hide-in-focus">
                <span class="w-8 h-8 flex items-center justify-center rounded-xl bg-white shadow-sm group-hover:bg-purple-50 group-hover:shadow-md transition">
                    <i class="fa-solid fa-arrow-left text-xs"></i>
                </span>
                Quay lại
            </button>
            
            <!-- Hero Card -->
            <div class="glass-panel-strong p-8 rounded-3xl text-center relative overflow-hidden">
                <div class="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30" style="background: radial-gradient(circle, #c4b5fd, transparent);"></div>
                <div class="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-30" style="background: radial-gradient(circle, #a5f3fc, transparent);"></div>
                
                <div class="relative z-10">
                    <div class="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center mb-4 shadow-lg" style="background: linear-gradient(135deg, #6d55d1, #8b5cf6);">
                        <i class="fa-solid fa-layer-group text-2xl text-white"></i>
                    </div>
                    <h1 class="text-4xl font-extrabold text-gray-900 mb-2" style="letter-spacing: -0.02em;">{{ store.activeDeck.title }}</h1>
                    <p class="text-gray-500 mb-8 max-w-xl mx-auto text-sm leading-relaxed">{{ store.activeDeck.description }}</p>
                    
                    <!-- Category 1: ARCADE GAME MODES -->
                    <div class="mb-6">
                        <div class="flex items-center gap-2 mb-3 justify-center">
                            <span class="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-rose-500/20 to-amber-500/20 text-rose-700 border border-rose-300/60 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                <span>🎮 Game Đấu Trí & Tốc Độ (Arcade Arena)</span>
                                <span class="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-black">HOT</span>
                            </span>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
                            <!-- Speed Rush / Boss Battle -->
                            <button @click="store.navigate('boss-battle')" 
                                    class="flex flex-col items-center gap-2 p-4 rounded-2xl font-black transition-all hover:-translate-y-1 hover:shadow-xl text-white relative overflow-hidden group border border-rose-400/40"
                                    style="background: linear-gradient(135deg, #e11d48, #ea580c);">
                                <div class="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                <span class="text-2xl drop-shadow-md">🐉</span>
                                <span class="text-xs uppercase tracking-wider">Đấu Trùm Speed</span>
                            </button>

                            <!-- Cyber Cipher -->
                            <button @click="store.navigate('cyber-cipher')" 
                                    class="flex flex-col items-center gap-2 p-4 rounded-2xl font-black transition-all hover:-translate-y-1 hover:shadow-xl text-white relative overflow-hidden group border border-cyan-400/40"
                                    style="background: linear-gradient(135deg, #0891b2, #2563eb);">
                                <div class="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                <span class="text-2xl drop-shadow-md">👾</span>
                                <span class="text-xs uppercase tracking-wider">Giải Mã Cipher</span>
                            </button>

                            <!-- AI Arena 1v1 -->
                            <button @click="store.navigate('ai-arena')" 
                                    class="flex flex-col items-center gap-2 p-4 rounded-2xl font-black transition-all hover:-translate-y-1 hover:shadow-xl text-white relative overflow-hidden group border border-purple-400/40"
                                    style="background: linear-gradient(135deg, #7c3aed, #9333ea);">
                                <div class="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                <span class="text-2xl drop-shadow-md">⚔️</span>
                                <span class="text-xs uppercase tracking-wider">Đấu Trí AI 1v1</span>
                            </button>

                            <!-- Matching Game -->
                            <button @click="store.navigate('matching')" 
                                    class="flex flex-col items-center gap-2 p-4 rounded-2xl font-black transition-all hover:-translate-y-1 hover:shadow-xl text-white relative overflow-hidden group border border-amber-400/40"
                                    style="background: linear-gradient(135deg, #d97706, #f59e0b);">
                                <div class="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                <span class="text-2xl drop-shadow-md">🧩</span>
                                <span class="text-xs uppercase tracking-wider">Nối Từ Cặp</span>
                            </button>
                        </div>
                    </div>

                    <!-- Category 2: CORE STUDY MODES -->
                    <div class="mb-4">
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                            📚 Luyện Tập Ghi Nhớ & Đánh Giá
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-4xl mx-auto">
                            <button @click="store.navigate('learn')" 
                                    class="flex flex-col items-center gap-1.5 p-3 rounded-2xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-md border-2 border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 dark:bg-[#162038] dark:border-[#2E3C5E] dark:text-[#A5B4FC] dark:hover:bg-[#1C2A4A] dark:hover:border-[#435787]">
                                <i class="fa-solid fa-graduation-cap text-lg text-indigo-600 dark:text-indigo-400"></i>
                                <span class="text-xs">Học Đa Chiều</span>
                            </button>
                            <button @click="store.navigate('study')" 
                                    class="flex flex-col items-center gap-1.5 p-3 rounded-2xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-md border-2 border-purple-200 bg-purple-50/70 text-purple-700 hover:bg-purple-100 dark:bg-[#201835] dark:border-[#3D2C62] dark:text-[#D8B4FE] dark:hover:bg-[#2A1F45] dark:hover:border-[#5A4191]">
                                <i class="fa-solid fa-layer-group text-lg text-purple-600 dark:text-purple-400"></i>
                                <span class="text-xs">Lật Thẻ 3D</span>
                            </button>
                            <button @click="store.navigate('quiz')" 
                                    class="flex flex-col items-center gap-1.5 p-3 rounded-2xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-md border-2 border-blue-200 bg-blue-50/70 text-blue-700 hover:bg-blue-100 dark:bg-[#15233D] dark:border-[#263D68] dark:text-[#93C5FD] dark:hover:bg-[#1B2F52] dark:hover:border-[#3B5B9B]">
                                <i class="fa-solid fa-check-double text-lg text-blue-600 dark:text-blue-400"></i>
                                <span class="text-xs">Trắc Nghiệm</span>
                            </button>
                            <button @click="store.navigate('dictation')" 
                                    class="flex flex-col items-center gap-1.5 p-3 rounded-2xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-md border-2 border-fuchsia-200 bg-fuchsia-50/70 text-fuchsia-700 hover:bg-fuchsia-100 dark:bg-[#281728] dark:border-[#4D274A] dark:text-[#F472B6] dark:hover:bg-[#382038] dark:hover:border-[#733A6E]">
                                <i class="fa-solid fa-headphones text-lg text-fuchsia-600 dark:text-fuchsia-400"></i>
                                <span class="text-xs">Nghe Chép</span>
                            </button>
                        </div>
                    </div>

                    <!-- Category 3: ADVANCED AI & TOOLS -->
                    <div>
                        <div class="grid grid-cols-2 gap-3 max-w-md mx-auto pt-2">
                            <button @click="store.navigate('reading')" 
                                    class="flex items-center justify-center gap-2 p-2.5 rounded-xl font-bold text-xs transition-all border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300 dark:hover:bg-emerald-900/50 shadow-sm">
                                <i class="fa-solid fa-book-open-reader text-emerald-600 dark:text-emerald-400"></i>
                                <span>Đọc Hiểu AI</span>
                            </button>
                            <button @click="store.navigate('edit-deck', store.activeDeck)" 
                                    class="flex items-center justify-center gap-2 p-2.5 rounded-xl font-bold text-xs transition-all border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-[#1E293B] dark:border-[#334155] dark:text-gray-200 dark:hover:bg-[#28354A] shadow-sm">
                                <i class="fa-solid fa-pen text-gray-500 dark:text-gray-400"></i>
                                <span>Chỉnh Sửa Thẻ</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Word List -->
            <div class="glass-panel rounded-3xl p-6">
                <div class="flex items-center justify-between mb-5">
                    <h2 class="text-lg font-bold text-gray-800">Danh sách từ vựng</h2>
                    <span class="text-sm font-semibold px-3 py-1 rounded-full" style="background: rgba(109,85,209,0.1); color: #6d55d1;">
                        {{ store.activeCards.length }} thẻ
                    </span>
                </div>
                <div class="space-y-2">
                    <div v-for="(card, idx) in store.activeCards" :key="card.id" 
                         class="bg-white p-4 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-sm transition-all group flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div class="flex items-start gap-3">
                            <span class="w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5" 
                                  style="background: rgba(109,85,209,0.1); color: #6d55d1;">{{ idx + 1 }}</span>
                            <img v-if="card.imageUrl" :src="card.imageUrl" class="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-shrink-0 shadow-sm" alt="Thumbnail">
                            <div>
                                <div class="flex items-center flex-wrap gap-2 mb-1">
                                    <h4 class="font-bold text-gray-900">{{ card.term }}</h4>
                                    <span v-if="card.pronunciation" class="text-xs text-gray-400 font-mono">{{ card.pronunciation }}</span>
                                    <span v-if="card.pos" class="text-xs px-2 py-0.5 rounded-full font-semibold" style="background: rgba(109,85,209,0.1); color: #6d55d1;">{{ card.pos }}</span>
                                </div>
                                <p class="text-gray-600 text-sm">{{ card.definition }}</p>
                                <p v-if="card.synonyms" class="text-xs text-gray-400 mt-1"><i class="fa-solid fa-link text-xs mr-1"></i>Đồng nghĩa: {{ card.synonyms }}</p>
                                <p v-if="card.collocations" class="text-xs text-purple-600 mt-1 font-medium"><i class="fa-solid fa-puzzle-piece text-xs mr-1"></i>{{ card.collocations }}</p>
                                <p v-if="card.wordFamily" class="text-xs text-indigo-600 mt-1"><i class="fa-solid fa-sitemap text-xs mr-1"></i>{{ card.wordFamily }}</p>
                                <p v-if="card.example" class="text-xs text-gray-400 mt-1 italic">{{ card.example }}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0">
                            <span :class="getStatusClass(card.status)" class="px-2.5 py-1 rounded-full text-xs font-semibold hidden sm:inline-block whitespace-nowrap">
                                {{ getStatusText(card.status) }}
                            </span>
                            <button @click="askAI(card)" class="w-9 h-9 rounded-xl flex items-center justify-center transition hover:scale-110" 
                                    style="background: rgba(245,158,11,0.1); color: #d97706;" title="AI Phân tích">
                                <i class="fa-solid fa-bolt text-sm"></i>
                            </button>
                            <button @click="speakWord(card.term)" class="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition hover:scale-110">
                                <i class="fa-solid fa-volume-high text-sm"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- AI Modal -->
            <div v-if="isAiModalOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="isAiModalOpen = false">
                <div class="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto animate-slide-up">
                    <button @click="isAiModalOpen = false" class="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    
                    <div class="flex items-center gap-4 mb-6">
                        <div class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
                            <i class="fa-solid fa-bolt text-white text-xl"></i>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-gray-900">AI Phân Tích IELTS</h2>
                            <p class="font-bold text-lg" style="color: #6d55d1;">{{ currentAiWord }}</p>
                        </div>
                    </div>
                    
                    <div v-if="aiLoading" class="flex flex-col items-center justify-center py-12 space-y-4">
                        <div class="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin"></div>
                        <p class="text-gray-500 font-medium text-sm">Gemini đang phân tích...</p>
                    </div>
                    
                    <div v-else-if="aiResult" class="space-y-4 animate-fade-in">
                        <div class="p-5 rounded-2xl border" style="background: #eff8ff; border-color: #bfdbfe;">
                            <h3 class="font-bold mb-2 text-sm flex items-center gap-2" style="color: #1d4ed8;"><i class="fa-solid fa-book-open"></i> Ngữ cảnh Reading</h3>
                            <p class="text-gray-700 text-sm leading-relaxed">{{ aiResult.readingContext }}</p>
                        </div>
                        <div class="p-5 rounded-2xl border" style="background: #faf5ff; border-color: #e9d5ff;">
                            <h3 class="font-bold mb-2 text-sm flex items-center gap-2" style="color: #7c3aed;"><i class="fa-solid fa-pen-nib"></i> Ý tưởng Writing Task 2</h3>
                            <p class="text-gray-700 text-sm leading-relaxed italic">"{{ aiResult.writingIdea }}"</p>
                        </div>
                        <div class="p-5 rounded-2xl border" style="background: #f0fdf4; border-color: #bbf7d0;">
                            <h3 class="font-bold mb-2 text-sm flex items-center gap-2" style="color: #15803d;"><i class="fa-solid fa-spell-check"></i> Ngữ pháp & Collocation</h3>
                            <p class="text-gray-700 text-sm leading-relaxed">{{ aiResult.grammar }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};
