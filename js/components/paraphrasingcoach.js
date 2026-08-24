import { ref, computed, onMounted } from 'vue';
import { store } from '../store.js';
import { paraphraseSentence } from '../ai.js';
import { showToast } from '../toast.js';
import { speakEnglishText } from '../voice.js';

export default {
    setup() {
        const activeTab = ref('coach'); // 'coach' | 'vault'
        const inputSentence = ref('');
        const isLoading = ref(false);
        const result = ref(null);
        const error = ref('');
        const isSpeaking = ref(false);
        const copiedKey = ref('');

        // Vault state
        const vaultSearch = ref('');
        const vaultFilter = ref('all'); // 'all' | 'fav'
        const vaultItems = ref([]);

        const loadVault = () => {
            try {
                const data = localStorage.getItem('extraquiz_paraphrase_vault');
                vaultItems.value = data ? JSON.parse(data) : [];
            } catch (e) {
                vaultItems.value = [];
            }
        };

        const saveVaultToStorage = () => {
            localStorage.setItem('extraquiz_paraphrase_vault', JSON.stringify(vaultItems.value));
        };

        onMounted(() => {
            loadVault();
        });

        const saveToVault = (original, res) => {
            if (!original || !res) return;
            const existingIdx = vaultItems.value.findIndex(item => item.original.trim().toLowerCase() === original.trim().toLowerCase());
            const newItem = {
                id: 'para_' + Date.now(),
                original: original.trim(),
                band6: res.band6,
                band7: res.band7,
                band8: res.band8,
                createdAt: new Date().toISOString(),
                isBookmarked: false
            };

            if (existingIdx > -1) {
                // Update existing
                newItem.isBookmarked = vaultItems.value[existingIdx].isBookmarked;
                vaultItems.value[existingIdx] = newItem;
            } else {
                vaultItems.value.unshift(newItem);
            }
            saveVaultToStorage();
            if (showToast) showToast('Đã lưu câu vào Kho Lưu Trữ!', 'success');
        };

        const toggleBookmark = (id) => {
            const item = vaultItems.value.find(i => i.id === id);
            if (item) {
                item.isBookmarked = !item.isBookmarked;
                saveVaultToStorage();
            }
        };

        const deleteFromVault = (id) => {
            if (confirm('Bạn có chắc muốn xóa câu này khỏi Kho lưu trữ?')) {
                vaultItems.value = vaultItems.value.filter(i => i.id !== id);
                saveVaultToStorage();
                if (showToast) showToast('Đã xóa câu khỏi Kho!', 'info');
            }
        };

        const clearVault = () => {
            if (confirm('Bạn có chắc muốn dọn sạch toàn bộ Kho lưu trữ Paraphrase?')) {
                vaultItems.value = [];
                saveVaultToStorage();
                if (showToast) showToast('Đã dọn sạch kho lưu trữ!', 'info');
            }
        };

        const handleParaphrase = async () => {
            if (!inputSentence.value.trim()) {
                error.value = "Vui lòng nhập một câu tiếng Anh.";
                return;
            }
            if (!localStorage.getItem('gemini_api_key')) {
                error.value = "Vui lòng nhập Gemini API Key trong phần Cài đặt trước.";
                return;
            }
            
            error.value = '';
            isLoading.value = true;
            result.value = null;
            
            try {
                const res = await paraphraseSentence(inputSentence.value);
                result.value = res;
                // Tự động lưu vào kho lưu trữ
                saveToVault(inputSentence.value, res);
                store.unlockBadge('paraphrase_pro');
            } catch (err) {
                error.value = err.message;
            } finally {
                isLoading.value = false;
            }
        };

        const stripHtml = (html) => {
            if (!html) return '';
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '';
        };

        const copyText = (text, key = '') => {
            const plainText = stripHtml(text);
            navigator.clipboard.writeText(plainText).then(() => {
                copiedKey.value = key;
                setTimeout(() => { copiedKey.value = ''; }, 2000);
                if (showToast) showToast('Đã sao chép vào bộ nhớ tạm!', 'success');
            });
        };

        const copyAllBands = (item) => {
            const textToCopy = `[CÂU GỐC]:\n${item.original}\n\n[BAND 6.0]:\n${stripHtml(item.band6?.sentence)}\nGiải thích: ${item.band6?.explanation}\n\n[BAND 7.0]:\n${stripHtml(item.band7?.sentence)}\nGiải thích: ${item.band7?.explanation}\n\n[BAND 8.0+]:\n${stripHtml(item.band8?.sentence)}\nGiải thích: ${item.band8?.explanation}`;
            navigator.clipboard.writeText(textToCopy).then(() => {
                copiedKey.value = 'all_' + item.id;
                setTimeout(() => { copiedKey.value = ''; }, 2000);
                if (showToast) showToast('Đã sao chép toàn bộ 3 Band đối chiếu!', 'success');
            });
        };

        const speakText = (text) => {
            isSpeaking.value = true;
            speakEnglishText(text, {
                onend: () => { isSpeaking.value = false; },
                onerror: () => { isSpeaking.value = false; }
            });
        };

        const loadIntoCoach = (item) => {
            inputSentence.value = item.original;
            result.value = {
                band6: item.band6,
                band7: item.band7,
                band8: item.band8
            };
            activeTab.value = 'coach';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        const formatDate = (isoStr) => {
            if (!isoStr) return '';
            const d = new Date(isoStr);
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        };

        const filteredVault = computed(() => {
            let list = vaultItems.value;
            if (vaultFilter.value === 'fav') {
                list = list.filter(i => i.isBookmarked);
            }
            if (vaultSearch.value.trim()) {
                const q = vaultSearch.value.toLowerCase();
                list = list.filter(i => {
                    const orig = i.original.toLowerCase();
                    const b6 = stripHtml(i.band6?.sentence).toLowerCase();
                    const b7 = stripHtml(i.band7?.sentence).toLowerCase();
                    const b8 = stripHtml(i.band8?.sentence).toLowerCase();
                    return orig.includes(q) || b6.includes(q) || b7.includes(q) || b8.includes(q);
                });
            }
            return list;
        });

        const isCurrentSaved = computed(() => {
            if (!inputSentence.value.trim()) return false;
            return vaultItems.value.some(i => i.original.trim().toLowerCase() === inputSentence.value.trim().toLowerCase());
        });

        return {
            store,
            activeTab,
            inputSentence,
            isLoading,
            result,
            error,
            isSpeaking,
            copiedKey,
            vaultSearch,
            vaultFilter,
            vaultItems,
            filteredVault,
            isCurrentSaved,
            handleParaphrase,
            saveToVault,
            toggleBookmark,
            deleteFromVault,
            clearVault,
            copyText,
            copyAllBands,
            speakText,
            loadIntoCoach,
            formatDate
        };
    },
    template: `
        <div class="max-w-5xl mx-auto space-y-6 pb-24 select-none animate-fade-in">
            
            <!-- Header Banner -->
            <div class="glass-panel p-8 rounded-3xl text-center relative overflow-hidden shadow-sm bg-white border border-gray-100">
                <div class="absolute -top-24 -right-24 w-64 h-64 bg-teal-100/60 rounded-full blur-3xl pointer-events-none"></div>
                <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-100/60 rounded-full blur-3xl pointer-events-none"></div>
                
                <div class="relative z-10 flex flex-col items-center">
                    <div class="w-16 h-16 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-3xl flex items-center justify-center text-white text-3xl shadow-lg shadow-teal-500/20 mb-4">
                        <i class="fa-solid fa-arrows-rotate"></i>
                    </div>
                    <div class="flex items-center gap-2 mb-2">
                        <h1 class="text-3xl font-black text-gray-900 tracking-tight">Huấn Luyện Viên Paraphrase</h1>
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800 uppercase tracking-wider">IELTS 8.0+</span>
                    </div>
                    <p class="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed">
                        Nâng cấp câu văn đơn giản thành 3 biến thể học thuật đỉnh cao và lưu trữ toàn bộ lịch sử để đối chiếu, ôn tập bất kỳ lúc nào.
                    </p>
                </div>
            </div>

            <!-- TABS NAVIGATION -->
            <div class="flex items-center justify-between gap-4 border-b border-gray-200 pb-2">
                <div class="flex items-center gap-2">
                    <button @click="activeTab = 'coach'" 
                            class="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all"
                            :class="activeTab === 'coach' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'">
                        <i class="fa-solid fa-wand-magic-sparkles"></i>
                        <span>Nâng Cấp Câu</span>
                    </button>

                    <button @click="activeTab = 'vault'" 
                            class="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all"
                            :class="activeTab === 'vault' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'">
                        <i class="fa-solid fa-box-archive"></i>
                        <span>Kho Lưu Trữ</span>
                        <span class="px-2 py-0.5 rounded-full text-xs font-black"
                              :class="activeTab === 'vault' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'">
                            {{ vaultItems.length }}
                        </span>
                    </button>
                </div>

                <div v-if="activeTab === 'vault' && vaultItems.length > 0">
                    <button @click="clearVault" class="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl transition">
                        <i class="fa-regular fa-trash-can mr-1"></i> Xóa tất cả
                    </button>
                </div>
            </div>

            <!-- TAB 1: COACH (NÂNG CẤP CÂU) -->
            <div v-if="activeTab === 'coach'" class="space-y-6 animate-fade-in">
                
                <!-- Input Section -->
                <div class="glass-panel p-6 sm:p-8 rounded-3xl shadow-sm bg-white border border-gray-100">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="font-black text-gray-900 text-base flex items-center gap-2">
                            <i class="fa-solid fa-pen-nib text-teal-600"></i> Nhập câu tiếng Anh của bạn:
                        </h2>
                        <span v-if="isCurrentSaved && result" class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                            <i class="fa-solid fa-circle-check"></i> Đã tự động lưu vào Kho
                        </span>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3">
                        <input v-model="inputSentence" @keyup.enter="handleParaphrase" type="text" 
                               placeholder="VD: I will have an entrance english exam test next week..." 
                               class="flex-1 p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-base font-medium shadow-sm transition">
                        <button @click="handleParaphrase" :disabled="isLoading" 
                                class="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold py-4 px-8 rounded-2xl shadow-lg shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap">
                            <i v-if="isLoading" class="fa-solid fa-spinner fa-spin"></i>
                            <i v-else class="fa-solid fa-wand-magic-sparkles"></i>
                            {{ isLoading ? 'Đang nâng cấp...' : 'Nâng cấp câu' }}
                        </button>
                    </div>
                    <p v-if="error" class="text-rose-500 text-xs mt-3 font-bold flex items-center gap-1.5">
                        <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
                    </p>
                </div>

                <!-- Loading State -->
                <div v-if="isLoading" class="flex flex-col items-center justify-center py-16 space-y-4 glass-panel rounded-3xl bg-white/90 border-2 border-teal-100 shadow-sm relative overflow-hidden">
                    <div class="relative w-20 h-20 flex items-center justify-center">
                        <div class="absolute inset-0 rounded-full neural-ring-outer"></div>
                        <div class="absolute inset-1.5 rounded-full neural-ring-mid"></div>
                        <div class="w-2.5 h-2.5 rounded-full bg-teal-400 neural-particle-1 absolute"></div>
                        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 neural-core-center flex items-center justify-center text-white text-base shadow-lg z-10">
                            <i class="fa-solid fa-wand-magic-sparkles neural-brain-icon"></i>
                        </div>
                    </div>
                    <div class="text-center">
                        <h4 class="font-extrabold text-teal-900 text-base flex items-center justify-center gap-2">
                            <i class="fa-solid fa-sparkles text-amber-500 animate-spin" style="animation-duration: 3s;"></i>
                            <span>Hệ thống AI đang phân tích ngữ nghĩa...</span>
                        </h4>
                        <p class="text-xs text-gray-500 mt-1">Đang tái cấu trúc ngữ pháp và trích xuất collocations Band 8.0+</p>
                    </div>
                </div>

                <!-- Result Cards -->
                <div v-else-if="result" class="space-y-5 animate-fade-in">
                    
                    <!-- Quick Actions Bar on top of results -->
                    <div class="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                        <div class="flex items-center gap-2 text-xs font-bold text-indigo-900">
                            <i class="fa-solid fa-sparkles text-amber-500"></i>
                            3 cấp độ nâng cấp cho câu của bạn:
                        </div>
                        <button @click="copyAllBands({ id: 'current', original: inputSentence, band6: result.band6, band7: result.band7, band8: result.band8 })" 
                                class="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition shadow-sm flex items-center gap-1.5">
                            <i class="fa-solid text-xs" :class="copiedKey === 'all_current' ? 'fa-check text-emerald-600' : 'fa-copy'"></i>
                            Sao chép cả 3 Band đối chiếu
                        </button>
                    </div>

                    <!-- Band 6 -->
                    <div class="bg-white p-6 sm:p-7 rounded-3xl border-l-4 border-yellow-400 shadow-sm relative group hover:shadow-md transition">
                        <div class="flex items-center justify-between mb-3">
                            <div class="inline-block bg-yellow-100 text-yellow-800 font-black px-3 py-1 rounded-xl text-xs">
                                Band 6.0 (Cơ bản & Rõ ràng)
                            </div>
                            <div class="flex items-center gap-2">
                                <button @click="speakText(result.band6.sentence)" class="w-8 h-8 rounded-lg bg-gray-50 hover:bg-yellow-50 text-gray-500 hover:text-yellow-700 flex items-center justify-center transition" title="Nghe đọc tiếng Anh">
                                    <i class="fa-solid fa-volume-high text-xs"></i>
                                </button>
                                <button @click="copyText(result.band6.sentence, 'b6_curr')" class="w-8 h-8 rounded-lg bg-gray-50 hover:bg-yellow-50 text-gray-500 hover:text-yellow-700 flex items-center justify-center transition" title="Sao chép">
                                    <i class="fa-solid text-xs" :class="copiedKey === 'b6_curr' ? 'fa-check text-emerald-600' : 'fa-copy'"></i>
                                </button>
                            </div>
                        </div>
                        <p class="text-lg sm:text-xl text-gray-900 font-bold mb-3 leading-relaxed" v-html="result.band6.sentence"></p>
                        <div class="text-xs text-gray-600 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex items-start gap-2">
                            <i class="fa-solid fa-circle-info text-yellow-500 text-sm mt-0.5 shrink-0"></i> 
                            <span class="leading-relaxed">{{ result.band6.explanation }}</span>
                        </div>
                    </div>

                    <!-- Band 7 -->
                    <div class="bg-white p-6 sm:p-7 rounded-3xl border-l-4 border-blue-500 shadow-sm relative group hover:shadow-md transition">
                        <div class="flex items-center justify-between mb-3">
                            <div class="inline-block bg-blue-100 text-blue-800 font-black px-3 py-1 rounded-xl text-xs">
                                Band 7.0 (Linh hoạt & Tự nhiên)
                            </div>
                            <div class="flex items-center gap-2">
                                <button @click="speakText(result.band7.sentence)" class="w-8 h-8 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-700 flex items-center justify-center transition" title="Nghe đọc tiếng Anh">
                                    <i class="fa-solid fa-volume-high text-xs"></i>
                                </button>
                                <button @click="copyText(result.band7.sentence, 'b7_curr')" class="w-8 h-8 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-700 flex items-center justify-center transition" title="Sao chép">
                                    <i class="fa-solid text-xs" :class="copiedKey === 'b7_curr' ? 'fa-check text-emerald-600' : 'fa-copy'"></i>
                                </button>
                            </div>
                        </div>
                        <p class="text-lg sm:text-xl text-gray-900 font-bold mb-3 leading-relaxed" v-html="result.band7.sentence"></p>
                        <div class="text-xs text-gray-600 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex items-start gap-2">
                            <i class="fa-solid fa-circle-info text-blue-500 text-sm mt-0.5 shrink-0"></i> 
                            <span class="leading-relaxed">{{ result.band7.explanation }}</span>
                        </div>
                    </div>

                    <!-- Band 8 -->
                    <div class="bg-white p-6 sm:p-7 rounded-3xl border-l-4 border-purple-600 shadow-lg relative group hover:shadow-xl hover:-translate-y-0.5 transition">
                        <div class="flex items-center justify-between mb-3">
                            <div class="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black px-3.5 py-1 rounded-xl text-xs shadow-sm flex items-center gap-1.5">
                                <i class="fa-solid fa-crown text-amber-300"></i> Band 8.0+ (Học thuật Cao cấp)
                            </div>
                            <div class="flex items-center gap-2">
                                <button @click="speakText(result.band8.sentence)" class="w-8 h-8 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 flex items-center justify-center transition" title="Nghe đọc tiếng Anh">
                                    <i class="fa-solid fa-volume-high text-xs"></i>
                                </button>
                                <button @click="copyText(result.band8.sentence, 'b8_curr')" class="w-8 h-8 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 flex items-center justify-center transition" title="Sao chép">
                                    <i class="fa-solid text-xs" :class="copiedKey === 'b8_curr' ? 'fa-check text-emerald-600' : 'fa-copy'"></i>
                                </button>
                            </div>
                        </div>
                        <p class="text-xl sm:text-2xl text-gray-900 font-black mb-4 leading-relaxed tracking-tight" v-html="result.band8.sentence"></p>
                        <div class="text-xs text-purple-900 bg-purple-50/80 p-4 rounded-2xl border border-purple-100 flex items-start gap-2.5">
                            <i class="fa-solid fa-lightbulb text-amber-500 text-base mt-0.5 shrink-0"></i> 
                            <span class="leading-relaxed font-medium">{{ result.band8.explanation }}</span>
                        </div>
                    </div>

                </div>
            </div>

            <!-- TAB 2: VAULT (KHO LƯU TRỮ) -->
            <div v-else-if="activeTab === 'vault'" class="space-y-6 animate-fade-in">
                
                <!-- Search & Filters -->
                <div class="glass-panel p-5 rounded-3xl bg-white border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div class="relative flex-1 w-full">
                        <i class="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input v-model="vaultSearch" type="text" placeholder="Tìm kiếm theo từ khóa trong câu gốc hoặc bản dịch..." 
                               class="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-500 outline-none text-sm font-medium transition">
                    </div>

                    <div class="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <button @click="vaultFilter = 'all'" 
                                class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                                :class="vaultFilter === 'all' ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
                            Tất cả ({{ vaultItems.length }})
                        </button>
                        <button @click="vaultFilter = 'fav'" 
                                class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                :class="vaultFilter === 'fav' ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
                            <i class="fa-solid fa-star text-xs"></i>
                            Yêu thích ({{ vaultItems.filter(i => i.isBookmarked).length }})
                        </button>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-if="filteredVault.length === 0" class="text-center py-16 glass-panel rounded-3xl bg-white border border-dashed border-gray-300 p-8 flex flex-col items-center">
                    <div class="w-16 h-16 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center text-2xl mb-3">
                        <i class="fa-solid fa-box-open"></i>
                    </div>
                    <h3 class="font-extrabold text-gray-800 text-lg mb-1">Chưa có câu nào trong kho</h3>
                    <p class="text-xs text-gray-500 max-w-sm mb-6">Mỗi khi bạn nâng cấp một câu mới ở tab 'Nâng Cấp Câu', hệ thống sẽ tự động lưu lại trọn bộ tại đây.</p>
                    <button @click="activeTab = 'coach'" class="px-5 py-2.5 rounded-2xl bg-teal-600 text-white font-bold text-xs shadow-md hover:bg-teal-700 transition">
                        Nâng Cấp Câu Đầu Tiên Ngay 🚀
                    </button>
                </div>

                <!-- Vault List -->
                <div v-else class="space-y-6">
                    <div v-for="item in filteredVault" :key="item.id" 
                         class="glass-panel p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-5">
                        
                        <!-- Top Metadata & Actions -->
                        <div class="flex items-center justify-between border-b border-gray-100 pb-3 gap-2">
                            <div class="flex items-center gap-2 text-xs text-gray-400 font-mono">
                                <i class="fa-regular fa-clock"></i>
                                <span>{{ formatDate(item.createdAt) }}</span>
                            </div>

                            <div class="flex items-center gap-2">
                                <!-- Re-load into Coach -->
                                <button @click="loadIntoCoach(item)" class="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs transition flex items-center gap-1" title="Tải lại vào bộ nâng cấp">
                                    <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> Nâng cấp lại
                                </button>

                                <!-- Copy All -->
                                <button @click="copyAllBands(item)" class="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition flex items-center gap-1" title="Sao chép toàn bộ đối chiếu">
                                    <i class="fa-solid text-[10px]" :class="copiedKey === 'all_' + item.id ? 'fa-check text-emerald-600' : 'fa-copy'"></i> 
                                    <span>Sao chép 3 Band</span>
                                </button>

                                <!-- Bookmark -->
                                <button @click="toggleBookmark(item.id)" class="w-8 h-8 rounded-lg flex items-center justify-center transition"
                                        :class="item.isBookmarked ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-400 hover:text-amber-500'" title="Ghim yêu thích">
                                    <i class="fa-solid fa-star text-xs"></i>
                                </button>

                                <!-- Delete -->
                                <button @click="deleteFromVault(item.id)" class="w-8 h-8 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition" title="Xóa khỏi kho">
                                    <i class="fa-regular fa-trash-can text-xs"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Original Sentence Box -->
                        <div class="p-4 rounded-2xl bg-gray-50/80 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <span class="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block mb-1">
                                    <i class="fa-solid fa-user-pen mr-1"></i> Câu gốc của bạn
                                </span>
                                <p class="text-base text-gray-900 font-extrabold italic">"{{ item.original }}"</p>
                            </div>
                            <button @click="speakText(item.original)" class="w-8 h-8 rounded-xl bg-white hover:bg-gray-100 text-gray-600 flex items-center justify-center border border-gray-200 shadow-sm shrink-0" title="Nghe câu gốc">
                                <i class="fa-solid fa-volume-high text-xs"></i>
                            </button>
                        </div>

                        <!-- 3 Bands Comparison Grid -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                            
                            <!-- Band 6 -->
                            <div class="p-4 rounded-2xl border-l-4 border-yellow-400 bg-yellow-50/30 border border-gray-100 flex flex-col justify-between space-y-3">
                                <div>
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-[11px] font-black text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded-md">Band 6.0</span>
                                        <div class="flex items-center gap-1">
                                            <button @click="speakText(item.band6?.sentence)" class="text-gray-400 hover:text-yellow-700 p-1"><i class="fa-solid fa-volume-high text-xs"></i></button>
                                            <button @click="copyText(item.band6?.sentence, 'b6_' + item.id)" class="text-gray-400 hover:text-yellow-700 p-1">
                                                <i class="fa-solid text-xs" :class="copiedKey === 'b6_' + item.id ? 'fa-check text-emerald-600' : 'fa-copy'"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <p class="text-sm font-bold text-gray-900 leading-snug" v-html="item.band6?.sentence"></p>
                                </div>
                                <p class="text-[11px] text-gray-500 leading-relaxed border-t border-yellow-100 pt-2">{{ item.band6?.explanation }}</p>
                            </div>

                            <!-- Band 7 -->
                            <div class="p-4 rounded-2xl border-l-4 border-blue-500 bg-blue-50/30 border border-gray-100 flex flex-col justify-between space-y-3">
                                <div>
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-[11px] font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">Band 7.0</span>
                                        <div class="flex items-center gap-1">
                                            <button @click="speakText(item.band7?.sentence)" class="text-gray-400 hover:text-blue-700 p-1"><i class="fa-solid fa-volume-high text-xs"></i></button>
                                            <button @click="copyText(item.band7?.sentence, 'b7_' + item.id)" class="text-gray-400 hover:text-blue-700 p-1">
                                                <i class="fa-solid text-xs" :class="copiedKey === 'b7_' + item.id ? 'fa-check text-emerald-600' : 'fa-copy'"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <p class="text-sm font-bold text-gray-900 leading-snug" v-html="item.band7?.sentence"></p>
                                </div>
                                <p class="text-[11px] text-gray-500 leading-relaxed border-t border-blue-100 pt-2">{{ item.band7?.explanation }}</p>
                            </div>

                            <!-- Band 8 -->
                            <div class="p-4 rounded-2xl border-l-4 border-purple-600 bg-purple-50/40 border border-purple-100 flex flex-col justify-between space-y-3 shadow-sm">
                                <div>
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-[11px] font-black text-white bg-purple-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <i class="fa-solid fa-star text-[9px] text-amber-300"></i> Band 8.0+
                                        </span>
                                        <div class="flex items-center gap-1">
                                            <button @click="speakText(item.band8?.sentence)" class="text-purple-600 hover:text-purple-900 p-1"><i class="fa-solid fa-volume-high text-xs"></i></button>
                                            <button @click="copyText(item.band8?.sentence, 'b8_' + item.id)" class="text-purple-600 hover:text-purple-900 p-1">
                                                <i class="fa-solid text-xs" :class="copiedKey === 'b8_' + item.id ? 'fa-check text-emerald-600' : 'fa-copy'"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <p class="text-sm font-black text-purple-950 leading-snug" v-html="item.band8?.sentence"></p>
                                </div>
                                <p class="text-[11px] text-purple-800 leading-relaxed border-t border-purple-100 pt-2 font-medium">{{ item.band8?.explanation }}</p>
                            </div>

                        </div>

                    </div>
                </div>

            </div>

        </div>
    `
};
