import { ref } from 'vue';
import { store } from '../store.js';
import { getIELTSAnalysis } from '../ai.js';
import { showToast } from '../toast.js';

export default {
    setup() {
        const speakWord = (text) => {
            if (!text || !('speechSynthesis' in window)) return;
            const ut = new SpeechSynthesisUtterance(text);
            ut.lang = 'en-US';
            if (store.settings && store.settings.voiceUri) {
                const voices = window.speechSynthesis.getVoices();
                const selectedVoice = voices.find(v => v.voiceURI === store.settings.voiceUri);
                if (selectedVoice) ut.voice = selectedVoice;
            }
            speechSynthesis.speak(ut);
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
                    
                    <!-- Action Buttons Grid -->
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
                        <button @click="store.navigate('learn')" 
                                class="flex flex-col items-center gap-2 p-4 rounded-2xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg text-white"
                                style="background: linear-gradient(135deg, #6d55d1, #8b5cf6);">
                            <i class="fa-solid fa-graduation-cap text-xl"></i>
                            <span class="text-sm">Học</span>
                        </button>
                        <button @click="store.navigate('study')" 
                                class="flex flex-col items-center gap-2 p-4 rounded-2xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg border-2"
                                style="border-color: #c4b5fd; color: #6d55d1; background: rgba(196,181,253,0.1);">
                            <i class="fa-solid fa-layer-group text-xl"></i>
                            <span class="text-sm">Lật thẻ</span>
                        </button>
                        <button @click="store.navigate('quiz')" 
                                class="flex flex-col items-center gap-2 p-4 rounded-2xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg border-2"
                                style="border-color: #93c5fd; color: #2563eb; background: rgba(147,197,253,0.1);">
                            <i class="fa-solid fa-check-double text-xl"></i>
                            <span class="text-sm">Kiểm tra</span>
                        </button>
                        <button @click="store.navigate('dictation')" 
                                class="flex flex-col items-center gap-2 p-4 rounded-2xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg border-2"
                                style="border-color: #d8b4fe; color: #7c3aed; background: rgba(216,180,254,0.1);">
                            <i class="fa-solid fa-headphones text-xl"></i>
                            <span class="text-sm">Nghe Chép</span>
                        </button>
                        <button @click="store.navigate('reading')" 
                                class="flex flex-col items-center gap-2 p-4 rounded-2xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg border-2"
                                style="border-color: #6ee7b7; color: #059669; background: rgba(110,231,183,0.1);">
                            <i class="fa-solid fa-book-open-reader text-xl"></i>
                            <span class="text-sm">Đọc Hiểu</span>
                        </button>
                        <button @click="store.navigate('matching')" 
                                class="flex flex-col items-center gap-2 p-4 rounded-2xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg border-2"
                                style="border-color: #fcd34d; color: #d97706; background: rgba(253,230,138,0.1);">
                            <i class="fa-solid fa-gamepad text-xl"></i>
                            <span class="text-sm">Nối từ</span>
                        </button>
                        <button @click="store.navigate('activate')" 
                                class="flex flex-col items-center gap-2 p-4 rounded-2xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg border-2 relative overflow-hidden group"
                                style="border-color: #fca5a5; color: #dc2626; background: rgba(254,226,226,0.1);">
                            <div class="absolute inset-0 bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
                            <i class="fa-solid fa-fire text-xl z-10"></i>
                            <span class="text-sm z-10">Activate</span>
                        </button>
                        <button @click="store.navigate('edit-deck', store.activeDeck)" 
                                class="flex flex-col items-center gap-2 p-4 rounded-2xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg border-2 border-gray-200 text-gray-600 hover:border-gray-300 bg-gray-50">
                            <i class="fa-solid fa-pen text-xl"></i>
                            <span class="text-sm">Chỉnh sửa</span>
                        </button>
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
