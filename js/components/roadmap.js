import { ref, onMounted } from 'vue';
import { store } from '../store.js';
import { generateRoadmap } from '../ai.js';

export default {
    setup() {
        const hasRoadmap = ref(false);
        const isLoading = ref(false);
        const aiRoadmapHtml = ref('');

        const formData = ref({
            inputBand: 5.0,
            targetBand: 7.0,
            months: 3,
            purpose: '',
            studyHours: 2
        });

        onMounted(() => {
            const saved = localStorage.getItem('ielts_ai_roadmap');
            if (saved) {
                aiRoadmapHtml.value = saved;
                hasRoadmap.value = true;
            }
        });

        const createRoadmap = async () => {
            if (!localStorage.getItem('gemini_api_key')) {
                alert("Vui lòng nhập Gemini API Key trong Cài đặt (nút bánh răng góc trên phải) trước khi dùng tính năng này.");
                return;
            }

            if (!formData.value.purpose.trim()) {
                alert("Vui lòng nhập nhu cầu chính của bạn.");
                return;
            }

            isLoading.value = true;
            try {
                const markdownText = await generateRoadmap(
                    formData.value.inputBand,
                    formData.value.targetBand,
                    formData.value.months,
                    formData.value.purpose,
                    formData.value.studyHours
                );
                
                // Parse markdown to HTML
                const html = marked.parse(markdownText);
                aiRoadmapHtml.value = html;
                hasRoadmap.value = true;
                
                localStorage.setItem('ielts_ai_roadmap', html);
            } catch (e) {
                alert("Lỗi tạo lộ trình: " + e.message);
            } finally {
                isLoading.value = false;
            }
        };

        const resetRoadmap = () => {
            localStorage.removeItem('ielts_ai_roadmap');
            hasRoadmap.value = false;
            aiRoadmapHtml.value = '';
        };

        const exportToWord = () => {
            const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Lộ trình IELTS</title><style>.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 {color: #1e293b;font-weight: bold;margin-top: 1.5em;margin-bottom: 0.5em;}.markdown-body h1 { font-size: 2em; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.3em; }.markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }.markdown-body h3 { font-size: 1.25em; }.markdown-body p { margin-bottom: 1em; line-height: 1.6; }.markdown-body ul { margin-left: 1.5em; margin-bottom: 1em; }.markdown-body ol { margin-left: 1.5em; margin-bottom: 1em; }.markdown-body li { margin-bottom: 0.25em; }.markdown-body strong { font-weight: 700; color: #0f172a; }.markdown-body em { font-style: italic; }.markdown-body blockquote { border-left: 4px solid #cbd5e1; padding-left: 1em; color: #475569; font-style: italic; margin-bottom: 1em; }</style></head><body><div class='markdown-body'>";
            const postHtml = "</div></body></html>";
            const html = preHtml + aiRoadmapHtml.value + postHtml;

            const blob = new Blob(['\ufeff', html], {
                type: 'application/msword'
            });
            
            const url = URL.createObjectURL(blob);
            const downloadLink = document.createElement("a");
            
            downloadLink.href = url;
            downloadLink.download = 'Lo-Trinh-IELTS.doc';
            
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
        };

        return { store, hasRoadmap, isLoading, aiRoadmapHtml, formData, createRoadmap, resetRoadmap, exportToWord };
    },
    template: `
        <div class="max-w-4xl mx-auto space-y-8 pb-20">
            <button @click="store.navigate('dashboard')" class="text-gray-500 hover:text-blue-600 mb-2 font-medium flex items-center gap-2">
                <i class="fa-solid fa-arrow-left"></i> Quay lại Trang chủ
            </button>

            <div class="glass-panel p-8 sm:p-12 rounded-3xl text-center shadow-lg relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
                <div class="absolute -top-24 -right-24 w-64 h-64 bg-white rounded-full opacity-10 blur-3xl"></div>
                <h1 class="text-4xl font-extrabold mb-4 relative z-10"><i class="fa-solid fa-map-location-dot mr-3"></i> Lộ Trình Học IELTS AI</h1>
                <p class="text-blue-100 text-lg max-w-2xl mx-auto relative z-10">Chuyên gia AI sẽ thiết kế riêng cho bạn một lộ trình luyện thi IELTS cá nhân hóa dựa trên mục tiêu, trình độ và thời gian của bạn.</p>
            </div>

            <div v-if="!hasRoadmap" class="glass-panel p-8 rounded-3xl max-w-2xl mx-auto shadow-sm animate-fade-in relative">
                <!-- Loading overlay -->
                <div v-if="isLoading" class="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-3xl">
                    <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                    <p class="text-blue-700 font-bold text-lg">Đang phân tích & lập lộ trình...</p>
                    <p class="text-gray-500 mt-2 text-sm text-center px-6">Quá trình này có thể mất 10-20 giây. Vui lòng không đóng trang.</p>
                </div>

                <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">Khảo sát thông tin</h2>
                
                <div class="space-y-6">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">Band hiện tại (ước lượng):</label>
                            <input type="number" step="0.5" min="0" max="9" v-model="formData.inputBand" class="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">Band mục tiêu IELTS:</label>
                            <input type="number" step="0.5" min="0" max="9" v-model="formData.targetBand" class="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">Thời gian ôn thi (Tháng):</label>
                            <input type="number" min="1" max="24" v-model="formData.months" class="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">Số giờ học mỗi ngày:</label>
                            <input type="number" min="1" max="24" v-model="formData.studyHours" class="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Nhu cầu chính (Bắt buộc):</label>
                        <input type="text" v-model="formData.purpose" placeholder="Ví dụ: Du học đại học Anh, Xét tuyển ĐH Ngoại Thương, Định cư Canada..." class="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg">
                    </div>

                    <button @click="createRoadmap" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-md transition transform hover:-translate-y-1 text-lg mt-8 flex items-center justify-center gap-3">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Tạo Lộ Trình Bằng AI
                    </button>
                </div>
            </div>

            <div v-else class="space-y-8 animate-fade-in">
                <div class="glass-panel p-8 sm:p-10 rounded-3xl shadow-sm markdown-body bg-white text-gray-800 leading-relaxed" v-html="aiRoadmapHtml">
                </div>

                <div class="text-center pt-6 flex flex-wrap justify-center gap-4">
                    <button @click="resetRoadmap" class="text-gray-500 hover:text-red-500 font-medium transition px-6 py-3 bg-gray-100 hover:bg-red-50 rounded-xl flex items-center gap-2">
                        <i class="fa-solid fa-rotate-left"></i> Tạo Lộ trình mới
                    </button>
                    <button @click="exportToWord" class="text-blue-600 hover:text-blue-700 font-bold transition px-6 py-3 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center gap-2 border border-blue-100">
                        <i class="fa-regular fa-file-word text-xl"></i> Xuất file Word
                    </button>
                </div>
            </div>
        </div>
    `
};
