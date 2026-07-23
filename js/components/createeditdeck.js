import { ref, reactive, computed, onMounted } from 'vue';
import { store } from '../store.js';
import { saveNewDeck, updateExistingDeck, fetchDecks, fetchCards, uploadCardImage } from '../db.js';
import { showToast } from '../app.js';

export default {
    setup() {
        const isEditMode = computed(() => store.currentRoute === 'edit-deck' && !!store.editDeckData);
        const deckForm = reactive({ title: '', description: '' });
        const newCards = ref([{ id: null, term: '', definition: '', pronunciation: '', pos: '', example: '', synonyms: '', collocations: '', wordFamily: '', imageUrl: '', selected: false, acceptedAnswers: [], acceptedEnglishAnswers: [] }]);
        const isGeneratingCard = ref({});
        const isBatchGenerating = ref(false);
        const isUploadingImage = ref({});
        const isModalOpen = ref(false);
        const showBulkGuide = ref(true);
        const bulkText = ref('');
        const bulkConfig = reactive({ termDefSep: 'tab', cardSep: 'newline' });
        const isSaving = ref(false);

        onMounted(() => {
            if (isEditMode.value) {
                deckForm.title = store.editDeckData.title;
                deckForm.description = store.editDeckData.description;
                if (store.activeCards && store.activeCards.length > 0) {
                    newCards.value = store.activeCards.map(c => ({ ...c, selected: false }));
                }
            }
        });

        const addEmptyCard = () => newCards.value.push({ id: null, term: '', definition: '', pronunciation: '', pos: '', example: '', synonyms: '', collocations: '', wordFamily: '', imageUrl: '', selected: false, acceptedAnswers: [], acceptedEnglishAnswers: [] });
        const removeCard = (index) => { newCards.value.splice(index, 1); };

        const isAllSelected = computed(() => newCards.value.length > 0 && selectedCount.value === newCards.value.length);
        const toggleAll = () => {
            if (isAllSelected.value) deselectAll();
            else selectAll();
        };

        const processBulkImport = () => {
            if (!bulkText.value.trim()) { isModalOpen.value = false; return; }
            const sep1 = bulkConfig.termDefSep === 'tab' ? '\t' : (bulkConfig.termDefSep === 'comma' ? ',' : '-');
            const sep2 = bulkConfig.cardSep === 'newline' ? '\n' : ';';
            const lines = bulkText.value.split(sep2).filter(line => line.includes(sep1));
            if (lines.length > 200) {
                showToast('Chỉ hỗ trợ nhập tối đa 200 thẻ một lần để đảm bảo hiệu năng!', 'error');
                return;
            }
            const parsed = lines.map(line => {
                const parts = line.split(sep1);
                return { id: null, term: parts[0]?.trim() || '', definition: parts[1]?.trim() || '', pronunciation: parts[2]?.trim() || '', pos: parts[3]?.trim() || '', collocations: parts[4]?.trim() || '', synonyms: parts[5]?.trim() || '', example: parts[6]?.trim() || '', wordFamily: '', imageUrl: '', selected: false, acceptedAnswers: [], acceptedEnglishAnswers: [] };
            });
            if (parsed.length > 0) { newCards.value = [...newCards.value, ...parsed]; }
            bulkText.value = '';
            isModalOpen.value = false;
            showToast('Đã nhập ' + parsed.length + ' thẻ thành công!', 'success');
        };

        const saveDeck = async () => {
            if (!deckForm.title.trim()) { showToast("Vui lòng nhập tiêu đề bộ thẻ!", 'error'); return; }
            const finalCards = newCards.value.filter(c => c.term && c.definition);
            if (finalCards.length === 0) { showToast("Vui lòng thêm ít nhất 1 thẻ hợp lệ!", 'error'); return; }
            isSaving.value = true;
            try {
                if (isEditMode.value) {
                    const cardsToUpdate = finalCards.filter(c => c.id !== null);
                    const cardsToAdd = finalCards.filter(c => c.id === null);
                    const currentIds = finalCards.map(c => c.id).filter(id => id !== null);
                    const originalIds = store.activeCards.map(c => c.id);
                    const cardsToDelete = originalIds.filter(id => !currentIds.includes(id));
                    await updateExistingDeck(store.editDeckData.id, store.user.uid, deckForm.title, deckForm.description, cardsToUpdate, cardsToAdd, cardsToDelete);
                    store.activeCards = await fetchCards(store.editDeckData.id);
                    store.activeDeck = { ...store.editDeckData, title: deckForm.title, description: deckForm.description };
                    store.decks = await fetchDecks(store.user.uid);
                    showToast("Đã lưu bộ thẻ thành công!", 'success');
                    store.navigate('deck-detail');
                } else {
                    await saveNewDeck(store.user.uid, deckForm.title, deckForm.description, finalCards);
                    store.decks = await fetchDecks(store.user.uid);
                    
                    // Gamification: First Deck
                    store.unlockBadge('first_deck');
                    
                    showToast("Đã tạo bộ thẻ mới!", 'success');
                    store.navigate('dashboard');
                }
            } catch (e) {
                showToast("Lỗi lưu: " + e.message, 'error');
            } finally {
                isSaving.value = false;
            }
        };

        const cancel = () => { store.navigate(isEditMode.value ? 'deck-detail' : 'dashboard'); };

        const handleAutoFill = async (index) => {
            const term = newCards.value[index].term.trim();
            if (!term) { showToast("Vui lòng nhập từ vựng tiếng Anh trước!", 'error'); return; }
            isGeneratingCard.value[index] = true;
            try {
                const { autoFillFlashcard } = await import('../ai.js');
                const result = await autoFillFlashcard(term);
                newCards.value[index] = { ...newCards.value[index], ...result };
                showToast('AI đã điền thông tin cho "' + term + '"', 'success');
            } catch (e) {
                showToast("Lỗi AI: " + e.message, 'error');
            } finally {
                isGeneratingCard.value[index] = false;
            }
        };

        const handleBulkAutoFill = async () => {
            const selectedCardsList = newCards.value.filter(c => c.selected && c.term.trim() !== '');
            if (selectedCardsList.length === 0) {
                showToast("Vui lòng chọn ít nhất 1 thẻ đã có từ tiếng Anh!", 'warning');
                return;
            }
            if (selectedCardsList.length > 20) {
                showToast("Chỉ nên tự động điền tối đa 20 thẻ mỗi lần để tránh quá tải API.", 'warning');
                return;
            }
            
            isBatchGenerating.value = true;
            try {
                const termsArray = selectedCardsList.map(c => c.term.trim());
                const { autoFillFlashcardsBatch } = await import('../ai.js');
                const results = await autoFillFlashcardsBatch(termsArray);
                
                let successCount = 0;
                newCards.value.forEach((card, i) => {
                    if (card.selected && card.term.trim() !== '') {
                        const termKey = card.term.trim();
                        // Tìm kết quả không phân biệt hoa thường
                        const resultKey = Object.keys(results).find(k => k.toLowerCase() === termKey.toLowerCase());
                        if (resultKey && results[resultKey]) {
                            newCards.value[i] = { ...card, ...results[resultKey] };
                            successCount++;
                        }
                    }
                });
                
                if (successCount > 0) {
                    showToast('AI đã điền xong ' + successCount + ' thẻ!', 'success');
                } else {
                    showToast('AI không tìm thấy thông tin cho các từ này.', 'warning');
                }
            } catch (e) {
                showToast("Lỗi AI Hàng loạt: " + e.message, 'error');
            } finally {
                isBatchGenerating.value = false;
            }
        };

        const selectAll = () => { newCards.value.forEach(c => c.selected = true); };
        const deselectAll = () => { newCards.value.forEach(c => c.selected = false); };
        const selectedCount = computed(() => newCards.value.filter(c => c.selected).length);

        const handleImageUpload = async (index, event) => {
            const file = event.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                showToast("Vui lòng chọn một tệp hình ảnh hợp lệ", 'error');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                showToast("Dung lượng ảnh không được vượt quá 2MB", 'error');
                return;
            }
            isUploadingImage.value[index] = true;
            try {
                const url = await uploadCardImage(file);
                newCards.value[index].imageUrl = url;
                showToast("Tải ảnh lên thành công!", 'success');
            } catch (e) {
                showToast("Lỗi tải ảnh: " + e.message, 'error');
            } finally {
                isUploadingImage.value[index] = false;
                event.target.value = ''; // reset input
            }
        };

        const removeImage = (index) => {
            newCards.value[index].imageUrl = '';
        };

        const duplicateIndices = computed(() => {
            const indices = [];
            const termMap = new Map();
            newCards.value.forEach((card, index) => {
                const term = card.term.trim().toLowerCase();
                if (!term) return;
                if (termMap.has(term)) {
                    indices.push(index);
                    indices.push(termMap.get(term));
                } else {
                    termMap.set(term, index);
                }
            });
            return indices;
        });

        return { 
            store, isEditMode, deckForm, newCards, addEmptyCard, removeCard, saveDeck, cancel, handleAutoFill, isGeneratingCard,
            isModalOpen, bulkText, bulkConfig, processBulkImport, isSaving, duplicateIndices, showBulkGuide,
            handleImageUpload, removeImage, isUploadingImage,
            isBatchGenerating, handleBulkAutoFill, selectAll, deselectAll, selectedCount,
            isAllSelected, toggleAll
        };
    },
    template: `
        <div class="max-w-4xl mx-auto pb-20">
            <!-- Header -->
            <div class="bg-white rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-sm mt-4 mb-6 flex justify-between items-center relative overflow-hidden">
                <div class="absolute top-0 left-0 bottom-0 w-1 rounded-l-3xl" style="background: linear-gradient(to bottom, #6d55d1, #8b5cf6);"></div>
                <div class="flex items-center gap-3">
                    <button @click="cancel" class="w-8 h-8 flex items-center justify-center rounded-xl bg-white shadow-sm hover:bg-purple-50 transition text-gray-500 hover:text-purple-600">
                        <i class="fa-solid fa-arrow-left text-xs"></i>
                    </button>
                    <div>
                        <h2 class="text-base font-bold text-gray-900">{{ isEditMode ? 'Chỉnh sửa bộ thẻ' : 'Tạo bộ thẻ mới' }}</h2>
                        <p class="text-xs text-gray-400">{{ newCards.filter(c => c.term && c.definition).length }} thẻ hợp lệ</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button @click="cancel" class="hidden sm:block px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 font-semibold rounded-xl transition">Hủy</button>
                    <button @click="saveDeck" :disabled="isSaving" class="btn-primary px-5 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50">
                        <i v-if="isSaving" class="fa-solid fa-spinner animate-spin text-xs"></i>
                        <i v-else class="fa-solid fa-cloud-arrow-up text-xs"></i>
                        {{ isSaving ? 'Đang lưu...' : 'Lưu' }}
                    </button>
                </div>
            </div>

            <div class="space-y-6">
                <!-- Deck Info -->
                <div class="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Thông tin bộ thẻ</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-2">Tiêu đề *</label>
                            <input type="text" v-model="deckForm.title" placeholder="VD: IELTS Vocabulary Academic..." 
                                   class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition font-semibold text-sm">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-2">Mô tả</label>
                            <input type="text" v-model="deckForm.description" placeholder="Thêm mô tả ngắn..." 
                                   class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition text-sm">
                        </div>
                    </div>
                </div>

                <!-- Action Buttons & Bulk Bar -->
                <div class="flex flex-col gap-3">
                    <div class="flex flex-col sm:flex-row gap-3">
                        <button @click="addEmptyCard" class="flex-1 py-4 border-2 border-dashed rounded-2xl font-bold transition-all hover:scale-[1.01] flex items-center justify-center gap-2 text-sm"
                                style="border-color: rgba(109,85,209,0.4); color: #6d55d1; background: rgba(109,85,209,0.04);">
                            <i class="fa-solid fa-plus"></i> Thêm thẻ mới
                        </button>
                        <button @click="isModalOpen = true" class="flex-1 py-4 border-2 border-dashed rounded-2xl font-bold transition-all hover:scale-[1.01] flex items-center justify-center gap-2 text-sm"
                                style="border-color: rgba(16,185,129,0.4); color: #059669; background: rgba(16,185,129,0.04);">
                            <i class="fa-solid fa-file-import"></i> Nhập từ Word, Excel...
                        </button>
                    </div>

                    <!-- Bulk Action Bar -->
                    <div class="glass-panel p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm border border-gray-100">
                        <div class="flex items-center gap-3 ml-2">
                            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <input type="checkbox" :checked="isAllSelected" :indeterminate.prop="selectedCount > 0 && !isAllSelected" @change="toggleAll" class="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 transition-all cursor-pointer">
                                <span class="cursor-pointer select-none" @click="toggleAll">Hàng Loạt</span>
                            </span>
                            <span v-if="selectedCount > 0" class="text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">{{ selectedCount }} thẻ</span>
                        </div>
                        
                        <button @click="handleBulkAutoFill" :disabled="isBatchGenerating || selectedCount === 0" 
                                class="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white;">
                            <i :class="isBatchGenerating ? 'fa-solid fa-spinner animate-spin' : 'fa-solid fa-wand-magic-sparkles'"></i>
                            {{ isBatchGenerating ? 'AI đang phân tích ' + selectedCount + ' thẻ...' : 'AI Tự Điền Đã Chọn' }}
                        </button>
                    </div>
                </div>

                <!-- Card List -->
                <div class="space-y-4">
                    <div v-for="(card, index) in newCards" :key="index" 
                         class="bg-white rounded-3xl border-2 transition-all shadow-sm group relative overflow-hidden"
                         :class="duplicateIndices.includes(index) ? 'border-red-400 shadow-red-100' : 'border-gray-100 hover:border-purple-200'">
                        <div class="absolute top-0 left-0 bottom-0 w-1 rounded-l-3xl" :style="duplicateIndices.includes(index) ? 'background: #ef4444;' : 'background: linear-gradient(to bottom, #6d55d1, #8b5cf6);'"></div>
                        
                        <div class="p-5 pl-6">
                            <div class="flex justify-between items-center mb-4">
                                <div class="flex items-center gap-3">
                                    <input type="checkbox" v-model="card.selected" class="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 border-gray-300 transition-all cursor-pointer">
                                    <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0 cursor-pointer"
                                          @click="card.selected = !card.selected"
                                          :style="duplicateIndices.includes(index) ? 'background: #ef4444;' : 'background: linear-gradient(135deg, #6d55d1, #8b5cf6);'">{{ index + 1 }}</span>
                                    <button @click="handleAutoFill(index)" :disabled="isGeneratingCard[index] || isBatchGenerating" 
                                            class="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition disabled:opacity-50"
                                            style="background: rgba(245,158,11,0.1); color: #d97706;">
                                        <i :class="isGeneratingCard[index] ? 'fa-solid fa-spinner animate-spin' : 'fa-solid fa-wand-magic-sparkles'" class="text-xs"></i>
                                        AI Tự điền
                                    </button>
                                </div>
                                <button v-if="newCards.length > 1" @click="removeCard(index)" 
                                        class="w-7 h-7 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-600 hover:bg-red-50">
                                    <i class="fa-solid fa-trash text-xs"></i>
                                </button>
                            </div>
                            
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label :for="'term-' + index" class="block text-xs font-bold mb-1.5 cursor-pointer" :class="duplicateIndices.includes(index) ? 'text-red-500' : 'text-gray-400'">
                                        Thuật ngữ (Anh) *
                                        <span v-if="duplicateIndices.includes(index)" class="text-red-500 font-normal ml-1">(Bị trùng lặp)</span>
                                    </label>
                                    <input :id="'term-' + index" v-model="card.term" type="text" placeholder="Nhập từ vựng tiếng Anh..." 
                                           class="w-full px-3 py-2.5 border-2 outline-none rounded-xl transition text-sm font-semibold"
                                           :class="duplicateIndices.includes(index) ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100' : 'border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-200'">
                                </div>
                                <div>
                                    <label :for="'def-' + index" class="block text-xs font-bold text-gray-400 mb-1.5 cursor-pointer">Định nghĩa (Việt) *</label>
                                    <input :id="'def-' + index" v-model="card.definition" type="text" placeholder="Nghĩa tiếng Việt..." 
                                           class="w-full px-3 py-2.5 border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-200 outline-none rounded-xl transition text-sm">
                                </div>
                                <div class="sm:col-span-2">
                                    <label :for="'pron-' + index" class="block text-xs font-bold text-gray-400 mb-1.5 cursor-pointer">Phiên âm</label>
                                    <input :id="'pron-' + index" v-model="card.pronunciation" placeholder="/ˌprəˌnʌnsiˈeɪʃn/..." type="text" 
                                           class="w-full px-3 py-2.5 border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-200 outline-none rounded-xl transition text-sm font-mono">
                                </div>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                                <div>
                                    <label :for="'pos-' + index" class="block text-xs font-bold text-gray-400 mb-1.5 cursor-pointer">Loại từ</label>
                                    <input :id="'pos-' + index" v-model="card.pos" type="text" placeholder="n, v, adj..." 
                                           class="w-full px-3 py-2.5 border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-200 outline-none rounded-xl transition text-sm">
                                </div>
                                <div>
                                    <label :for="'coll-' + index" class="block text-xs font-bold text-gray-400 mb-1.5 cursor-pointer">Cụm từ (Collocations)</label>
                                    <input :id="'coll-' + index" v-model="card.collocations" type="text" placeholder="make a decision..." 
                                           class="w-full px-3 py-2.5 border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-200 outline-none rounded-xl transition text-sm">
                                </div>
                                <div>
                                    <label :for="'syn-' + index" class="block text-xs font-bold text-gray-400 mb-1.5 cursor-pointer">Từ đồng nghĩa (Synonyms)</label>
                                    <input :id="'syn-' + index" v-model="card.synonyms" type="text" placeholder="plentiful, copious..." 
                                           class="w-full px-3 py-2.5 border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-200 outline-none rounded-xl transition text-sm">
                                </div>
                            </div>
                            <div class="flex flex-col sm:flex-row gap-3 mt-3">
                                <div class="flex-1">
                                    <label :for="'ex-' + index" class="block text-xs font-bold text-gray-400 mb-1.5 cursor-pointer">Ví dụ (Example)</label>
                                    <input :id="'ex-' + index" v-model="card.example" type="text" placeholder="Rainfall is more abundant..." 
                                           class="w-full px-3 py-2.5 border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-200 outline-none rounded-xl transition text-sm">
                                </div>
                                <div class="flex items-end pb-1 gap-3 flex-shrink-0">
                                    <!-- Thumbnail Preview -->
                                    <div v-if="card.imageUrl" class="relative group w-11 h-11 rounded-xl border-2 border-purple-200 overflow-hidden flex-shrink-0 shadow-sm">
                                        <img :src="card.imageUrl" class="w-full h-full object-cover">
                                        <button @click="removeImage(index)" class="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <i class="fa-solid fa-trash text-xs"></i>
                                        </button>
                                    </div>
                                    <!-- Upload Button -->
                                    <div class="relative w-auto h-11">
                                        <input type="file" accept="image/*" @change="handleImageUpload(index, $event)" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" :disabled="isUploadingImage[index]">
                                        <button type="button" :disabled="isUploadingImage[index]"
                                                class="flex items-center justify-center gap-2 px-3 h-11 rounded-xl text-xs font-bold transition border-2 border-dashed whitespace-nowrap"
                                                :class="card.imageUrl ? 'border-gray-200 text-gray-400 hover:text-gray-600 bg-gray-50' : 'border-purple-200 text-purple-500 bg-purple-50 hover:bg-purple-100 disabled:opacity-50'">
                                            <i :class="isUploadingImage[index] ? 'fa-solid fa-spinner animate-spin' : 'fa-regular fa-image'"></i>
                                            {{ isUploadingImage[index] ? 'Đang tải...' : (card.imageUrl ? 'Đổi ảnh khác' : 'Thêm ảnh') }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button @click="addEmptyCard" class="w-full py-4 border-2 border-dashed rounded-2xl font-bold transition text-gray-400 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50/50 text-sm">
                        <i class="fa-solid fa-plus mr-2"></i>Thêm thẻ mới
                    </button>
                </div>
            </div>

            <!-- Import Modal -->
            <div v-if="isModalOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="isModalOpen = false">
                <div class="bg-white rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                    <div class="p-6 border-b flex justify-between items-center" style="border-color: rgba(109,85,209,0.1);">
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">Nhập hàng loạt</h3>
                            <p class="text-xs text-gray-400 mt-0.5">Dán dữ liệu từ Word, Excel, Google Docs</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <button @click="showBulkGuide = !showBulkGuide" class="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition text-xs font-bold flex items-center gap-1">
                                <i class="fa-solid" :class="showBulkGuide ? 'fa-eye-slash' : 'fa-circle-info'"></i> 
                                {{ showBulkGuide ? 'Ẩn Hướng Dẫn' : 'Xem Hướng Dẫn' }}
                            </button>
                            <button @click="isModalOpen = false" class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>
                    <div class="p-6 overflow-y-auto max-h-[70vh] flex flex-col md:flex-row gap-6">
                        <!-- Cột nhập liệu -->
                        <div class="flex-1 flex flex-col transition-all duration-300" :class="showBulkGuide ? 'md:w-1/2' : 'w-full'">
                            <textarea v-model="bulkText" rows="10" placeholder="Từ 1	Định nghĩa 1	Phiên âm	Loại từ	Cụm từ	Từ đồng nghĩa	Ví dụ" 
                                      class="w-full p-4 border-2 border-gray-200 rounded-2xl outline-none focus:border-purple-400 font-mono text-sm leading-relaxed whitespace-pre resize-none flex-1"></textarea>
                            <div class="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <h4 class="font-bold text-gray-700 mb-2 text-xs uppercase tracking-wider">Giữa thuật ngữ và định nghĩa</h4>
                                    <div class="space-y-2">
                                        <label v-for="opt in [{val:'tab',label:'Tab (Excel)'},{val:'comma',label:'Phẩy (,)'},{val:'-',label:'Gạch ngang (-)'}]" :key="opt.val"
                                               class="flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition text-sm font-semibold"
                                               :class="bulkConfig.termDefSep === opt.val ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-gray-100 text-gray-600'">
                                            <input type="radio" v-model="bulkConfig.termDefSep" :value="opt.val" class="hidden">
                                            <div class="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0" :style="bulkConfig.termDefSep === opt.val ? 'border-color:#6d55d1' : 'border-color:#d1d5db'">
                                                <div v-if="bulkConfig.termDefSep === opt.val" class="w-1.5 h-1.5 rounded-full" style="background:#6d55d1"></div>
                                            </div>
                                            {{ opt.label }}
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <h4 class="font-bold text-gray-700 mb-2 text-xs uppercase tracking-wider">Giữa các thẻ</h4>
                                    <div class="space-y-2">
                                        <label v-for="opt in [{val:'newline',label:'Xuống dòng (Enter)'},{val:'semicolon',label:'Chấm phẩy (;)'}]" :key="opt.val"
                                               class="flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition text-sm font-semibold"
                                               :class="bulkConfig.cardSep === opt.val ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-gray-100 text-gray-600'">
                                            <input type="radio" v-model="bulkConfig.cardSep" :value="opt.val" class="hidden">
                                            <div class="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0" :style="bulkConfig.cardSep === opt.val ? 'border-color:#6d55d1' : 'border-color:#d1d5db'">
                                                <div v-if="bulkConfig.cardSep === opt.val" class="w-1.5 h-1.5 rounded-full" style="background:#6d55d1"></div>
                                            </div>
                                            {{ opt.label }}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Cột Hướng dẫn -->
                        <div v-show="showBulkGuide" class="flex-1 bg-gray-50 rounded-2xl p-5 border border-gray-200 md:w-1/2 transition-all duration-300">
                            <h4 class="font-bold text-gray-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-circle-info text-blue-500"></i> HƯỚNG DẪN CHI TIẾT</h4>
                            <div class="text-sm text-gray-600 space-y-4">
                                <div>
                                    <p class="font-semibold text-gray-800 mb-1">1. Các trường hỗ trợ (Lên tới 7 cột)</p>
                                    <p class="text-xs mb-2">Phân tách bằng Tab (từ Excel/Sheets) hoặc Dấu phẩy, Gạch ngang.</p>
                                    <ul class="list-disc pl-4 text-xs space-y-1">
                                        <li><strong>Cột 1:</strong> Thuật ngữ (Term) - VD: abundant</li>
                                        <li><strong>Cột 2:</strong> Định nghĩa (Definition) - VD: dồi dào</li>
                                        <li><strong>Cột 3:</strong> Phiên âm - VD: /əˈbʌndənt/</li>
                                        <li><strong>Cột 4:</strong> Loại từ - VD: adj</li>
                                        <li><strong>Cột 5:</strong> Cụm từ (Collocations) - VD: make a decision</li>
                                        <li><strong>Cột 6:</strong> Từ đồng nghĩa (Synonyms) - VD: plentiful</li>
                                        <li><strong>Cột 7:</strong> Ví dụ - VD: Rainfall is more abundant...</li>
                                    </ul>
                                </div>
                                <div>
                                    <p class="font-semibold text-gray-800 mb-1">2. Cách A: Từ Excel (Khuyên dùng)</p>
                                    <p class="text-xs">Copy tối đa 7 cột từ Excel và Dán (Ctrl+V) thẳng vào ô bên trái (Chọn "Tab").</p>
                                </div>
                                <div>
                                    <p class="font-semibold text-gray-800 mb-1">3. Mẹo nâng cao (Sử dụng AI)</p>
                                    <p class="text-xs">Nếu bạn chỉ điền Cột 1 và 2. Sau khi nhập xong, hãy check chọn các thẻ đó và nhấn nút <strong class="text-amber-600">✨ AI Tự Điền Đã Chọn</strong> để AI tự động tra cứu cho 5 cột còn lại!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="p-5 border-t flex justify-end gap-3" style="border-color: rgba(109,85,209,0.1);">
                        <button @click="isModalOpen = false" class="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition text-sm">Hủy</button>
                        <button @click="processBulkImport" class="btn-primary px-7 py-2.5 text-sm">Nhập thẻ</button>
                    </div>
                </div>
            </div>
        </div>
    `
};
