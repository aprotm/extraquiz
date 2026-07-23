import { ref } from 'vue';
import { store } from '../store.js';
import { paraphraseSentence } from '../ai.js';

export default {
    setup() {
        const inputSentence = ref('');
        const isLoading = ref(false);
        const result = ref(null);
        const error = ref('');

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
                result.value = await paraphraseSentence(inputSentence.value);
            } catch (err) {
                error.value = err.message;
            } finally {
                isLoading.value = false;
            }
        };

        const copyToClipboard = (text) => {
            // Strip HTML tags from the text before copying
            const temp = document.createElement("div");
            temp.innerHTML = text;
            const plainText = temp.textContent || temp.innerText || "";
            navigator.clipboard.writeText(plainText);
            // Optionally, show a small toast or notification
        };

        return { store, inputSentence, isLoading, result, error, handleParaphrase, copyToClipboard };
    },
    template: `
        <div class="max-w-4xl mx-auto space-y-8 pb-12">
            <!-- Header -->
            <div class="glass-panel p-8 rounded-3xl text-center relative overflow-hidden shadow-sm">
                <div class="absolute -top-24 -right-24 w-64 h-64 bg-teal-100 rounded-full opacity-50 blur-3xl"></div>
                <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-100 rounded-full opacity-50 blur-3xl"></div>
                
                <div class="relative z-10 flex flex-col items-center">
                    <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center text-teal-500 text-3xl shadow-sm mb-4">
                        <i class="fa-solid fa-arrows-rotate"></i>
                    </div>
                    <h1 class="text-3xl font-extrabold text-gray-800 mb-3">Huấn luyện viên Paraphrase</h1>
                    <p class="text-gray-600 max-w-lg mx-auto">Nhập một câu tiếng Anh đơn giản, AI sẽ giúp bạn nâng cấp nó lên chuẩn học thuật IELTS Band 8.0+.</p>
                </div>
            </div>

            <!-- Input Section -->
            <div class="glass-panel p-6 sm:p-8 rounded-2xl shadow-sm">
                <h2 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-pen-nib text-blue-500"></i> Nhập câu của bạn:
                </h2>
                <div class="flex flex-col sm:flex-row gap-4">
                    <input v-model="inputSentence" @keyup.enter="handleParaphrase" type="text" placeholder="VD: Many people like using cars to go to work." class="flex-1 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-lg">
                    <button @click="handleParaphrase" :disabled="isLoading" class="bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-8 rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap">
                        <i v-if="isLoading" class="fa-solid fa-spinner fa-spin"></i>
                        <i v-else class="fa-solid fa-wand-magic-sparkles"></i>
                        {{ isLoading ? 'Đang nâng cấp...' : 'Nâng cấp câu' }}
                    </button>
                </div>
                <p v-if="error" class="text-red-500 text-sm mt-3 font-medium">{{ error }}</p>
            </div>

            <!-- Results Section -->
            <div v-if="isLoading" class="flex flex-col items-center justify-center py-12 space-y-4">
                <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-teal-500"></div>
                <p class="text-gray-500 font-medium">Gemini đang suy nghĩ...</p>
            </div>

            <div v-else-if="result" class="space-y-6 animate-fade-in">
                <!-- Band 6 -->
                <div class="bg-white p-6 rounded-2xl border-l-4 border-yellow-400 shadow-sm relative group">
                    <div class="absolute top-4 right-4 opacity-0 sm:group-hover:opacity-100 transition">
                        <button @click="copyToClipboard(result.band6.sentence)" class="text-gray-400 hover:text-gray-700 p-2"><i class="fa-regular fa-copy"></i></button>
                    </div>
                    <div class="inline-block bg-yellow-100 text-yellow-700 font-bold px-3 py-1 rounded-lg text-sm mb-3">Band 6.0</div>
                    <p class="text-xl text-gray-800 mb-3" v-html="result.band6.sentence"></p>
                    <div class="text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <i class="fa-solid fa-circle-info text-yellow-500 mr-1"></i> {{ result.band6.explanation }}
                    </div>
                </div>

                <!-- Band 7 -->
                <div class="bg-white p-6 rounded-2xl border-l-4 border-blue-400 shadow-sm relative group">
                    <div class="absolute top-4 right-4 opacity-0 sm:group-hover:opacity-100 transition">
                        <button @click="copyToClipboard(result.band7.sentence)" class="text-gray-400 hover:text-gray-700 p-2"><i class="fa-regular fa-copy"></i></button>
                    </div>
                    <div class="inline-block bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-lg text-sm mb-3">Band 7.0</div>
                    <p class="text-xl text-gray-800 mb-3" v-html="result.band7.sentence"></p>
                    <div class="text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <i class="fa-solid fa-circle-info text-blue-500 mr-1"></i> {{ result.band7.explanation }}
                    </div>
                </div>

                <!-- Band 8 -->
                <div class="bg-white p-6 rounded-2xl border-l-4 border-purple-500 shadow-lg relative group transform transition hover:-translate-y-1">
                    <div class="absolute -top-3 -right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                        Mục tiêu
                    </div>
                    <div class="absolute top-4 right-4 opacity-0 sm:group-hover:opacity-100 transition">
                        <button @click="copyToClipboard(result.band8.sentence)" class="text-gray-400 hover:text-gray-700 p-2"><i class="fa-regular fa-copy"></i></button>
                    </div>
                    <div class="inline-block bg-purple-100 text-purple-700 font-bold px-3 py-1 rounded-lg text-sm mb-3 flex items-center gap-2 w-fit">
                        <i class="fa-solid fa-star text-purple-500"></i> Band 8.0+
                    </div>
                    <p class="text-2xl text-gray-900 font-medium mb-4 leading-relaxed" v-html="result.band8.sentence"></p>
                    <div class="text-sm text-purple-800 bg-purple-50 p-4 rounded-xl border border-purple-100 shadow-inner">
                        <i class="fa-solid fa-lightbulb text-yellow-500 mr-1 text-lg"></i> {{ result.band8.explanation }}
                    </div>
                </div>
            </div>
        </div>
    `
};
