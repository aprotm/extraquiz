import { ref, computed } from 'vue';
import { store } from '../store.js';
import { evaluateEssay } from '../ai.js';

export default {
    setup() {
        const taskType = ref('task2');
        const essayText = ref('');
        const isLoading = ref(false);
        const result = ref(null);
        const error = ref('');
        
        const wordCount = computed(() => {
            const text = essayText.value.trim();
            return text ? text.split(/\\s+/).length : 0;
        });

        const handleSubmit = async () => {
            if (wordCount.value < 50) {
                error.value = "Bài viết quá ngắn. Vui lòng nhập ít nhất 50 từ.";
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
                result.value = await evaluateEssay(taskType.value, essayText.value);
                store.addLexiCredit(50, 'essay');
                store.unlockBadge('essay_master');
            } catch (err) {
                error.value = err.message;
            } finally {
                isLoading.value = false;
            }
        };

        const isRewriteVisible = ref(false);

        return { store, taskType, essayText, wordCount, isLoading, result, error, handleSubmit, isRewriteVisible };
    },
    template: `
        <div class="max-w-6xl mx-auto space-y-8 pb-12">
            <!-- Header -->
            <div class="glass-panel p-8 rounded-3xl text-center relative overflow-hidden shadow-sm">
                <div class="absolute -top-24 -right-24 w-64 h-64 bg-indigo-100 rounded-full opacity-50 blur-3xl"></div>
                <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-100 rounded-full opacity-50 blur-3xl"></div>
                
                <div class="relative z-10 flex flex-col items-center">
                    <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center text-indigo-500 text-3xl shadow-sm mb-4">
                        <i class="fa-solid fa-pen-nib"></i>
                    </div>
                    <h1 class="text-3xl font-extrabold text-gray-800 mb-3">Máy Chấm Essay</h1>
                    <p class="text-gray-600 max-w-lg mx-auto">Chấm điểm chi tiết 4 tiêu chí IELTS Writing và nhận ngay bài mẫu nâng cấp Band 8.0+.</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Input Section -->
                <div class="glass-panel p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col h-full">
                    <div class="flex items-center gap-4 mb-6">
                        <button @click="taskType = 'task1'" :class="taskType === 'task1' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'" class="px-6 py-2 rounded-xl font-bold transition">Task 1</button>
                        <button @click="taskType = 'task2'" :class="taskType === 'task2' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'" class="px-6 py-2 rounded-xl font-bold transition">Task 2</button>
                    </div>
                    
                    <h2 class="font-bold text-gray-800 mb-2 flex items-center justify-between">
                        Nhập bài viết của bạn:
                        <span class="text-sm font-normal text-gray-500" :class="wordCount < 150 && taskType==='task1' || wordCount < 250 && taskType==='task2' ? 'text-red-500' : 'text-green-500'">
                            {{ wordCount }} từ
                        </span>
                    </h2>
                    
                    <textarea v-model="essayText" rows="15" placeholder="Dán bài viết tiếng Anh của bạn vào đây..." class="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none resize-none font-serif text-gray-800 leading-relaxed mb-4 flex-1"></textarea>
                    
                    <p v-if="error" class="text-red-500 text-sm mb-4 font-medium">{{ error }}</p>
                    
                    <button @click="handleSubmit" :disabled="isLoading" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2">
                        <i v-if="isLoading" class="fa-solid fa-spinner fa-spin"></i>
                        <i v-else class="fa-solid fa-check-double"></i>
                        {{ isLoading ? 'AI Đang chấm bài...' : 'Chấm điểm ngay' }}
                    </button>
                </div>

                <!-- Results Section -->
                <div class="glass-panel p-6 sm:p-8 rounded-2xl shadow-sm relative overflow-hidden flex flex-col min-h-[500px]">
                    <div v-if="!result && !isLoading" class="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <i class="fa-solid fa-clipboard-check text-6xl mb-4 opacity-20"></i>
                        <p>Kết quả chấm điểm sẽ hiển thị tại đây.</p>
                    </div>

                    <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center space-y-4">
                        <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
                        <p class="text-gray-500 font-medium text-center">Giám khảo AI đang phân tích ngữ pháp và từ vựng...<br>Vui lòng đợi 10-15 giây.</p>
                    </div>

                    <div v-if="result" class="space-y-6 animate-fade-in overflow-y-auto pr-2">
                        <!-- Điểm số -->
                        <div class="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl text-white shadow-md">
                            <div>
                                <h3 class="text-lg font-medium opacity-90">Band Score Ước tính</h3>
                                <p class="text-xs opacity-75 mt-1">Dựa trên tiêu chuẩn IELTS Writing</p>
                            </div>
                            <div class="text-5xl font-extrabold">{{ result.bandScore }}</div>
                        </div>

                        <!-- Nhận xét chi tiết -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h4 class="font-bold text-blue-800 mb-1 flex items-center gap-2"><i class="fa-solid fa-bullseye text-blue-500"></i> Task Response</h4>
                                <p class="text-sm text-gray-700">{{ result.taskResponse }}</p>
                            </div>
                            <div class="bg-teal-50 p-4 rounded-xl border border-teal-100">
                                <h4 class="font-bold text-teal-800 mb-1 flex items-center gap-2"><i class="fa-solid fa-link text-teal-500"></i> Coherence</h4>
                                <p class="text-sm text-gray-700">{{ result.coherence }}</p>
                            </div>
                            <div class="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                <h4 class="font-bold text-purple-800 mb-1 flex items-center gap-2"><i class="fa-solid fa-spell-check text-purple-500"></i> Lexical Resource</h4>
                                <p class="text-sm text-gray-700">{{ result.lexical }}</p>
                            </div>
                            <div class="bg-pink-50 p-4 rounded-xl border border-pink-100">
                                <h4 class="font-bold text-pink-800 mb-1 flex items-center gap-2"><i class="fa-solid fa-pen-ruler text-pink-500"></i> Grammar</h4>
                                <p class="text-sm text-gray-700">{{ result.grammar }}</p>
                            </div>
                        </div>

                        <!-- Điểm cần cải thiện -->
                        <div class="bg-yellow-50 p-5 rounded-2xl border border-yellow-100">
                            <h4 class="font-bold text-yellow-800 mb-2 flex items-center gap-2"><i class="fa-solid fa-triangle-exclamation"></i> Lỗi cần lưu ý</h4>
                            <div class="text-sm text-gray-700 whitespace-pre-line">{{ result.highlights }}</div>
                        </div>

                        <!-- Nút hiển thị bài mẫu -->
                        <button @click="isRewriteVisible = !isRewriteVisible" class="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition flex justify-center items-center gap-2">
                            <i class="fa-solid fa-crown text-yellow-500"></i>
                            {{ isRewriteVisible ? 'Đóng bài mẫu' : 'Xem bài mẫu Band 8.0+' }}
                        </button>

                        <div v-if="isRewriteVisible" class="bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-inner animate-fade-in">
                            <h4 class="font-bold text-indigo-800 mb-4 border-b pb-2">Bài viết nâng cấp (Band 8.0+)</h4>
                            <p class="text-gray-800 whitespace-pre-line font-serif leading-relaxed text-sm md:text-base">{{ result.rewrite8 }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};
