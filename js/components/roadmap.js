import { ref, computed, onMounted } from 'vue';
import { store } from '../store.js';
import { generateRoadmap } from '../ai.js';
import { showToast } from '../toast.js';

export default {
    setup() {
        const hasRoadmap = ref(false);
        const isLoading = ref(false);
        const aiRoadmapHtml = ref('');
        const rawMarkdown = ref('');
        const loadingStepIndex = ref(0);

        const loadingSteps = [
            { title: 'Phân tích khoảng cách Band Score', desc: 'Đánh giá điểm mạnh/yếu theo từng kỹ năng...' },
            { title: 'Thiết kế chiến lược phân kỳ theo tháng', desc: 'Xây dựng lộ trình giai đoạn theo từng mốc thời gian...' },
            { title: 'Tuyển chọn tài liệu & phân bổ từ vựng', desc: 'Tuyển chọn giáo trình, nguồn nghe và danh mục Academic Lexicon...' },
            { title: 'Tổng hợp thời khóa biểu & kế hoạch Mock Test', desc: 'Hoàn thiện lịch học hàng ngày và phân bổ bài thi thử...' }
        ];

        let loadingTimer = null;

        const inputBandOptions = [
            { val: 3.5, label: '3.5', level: 'Beginner' },
            { val: 4.0, label: '4.0', level: 'Elementary' },
            { val: 4.5, label: '4.5', level: 'Pre-Inter' },
            { val: 5.0, label: '5.0', level: 'Foundation' },
            { val: 5.5, label: '5.5', level: 'Intermediate' },
            { val: 6.0, label: '6.0', level: 'Upper-Inter' },
            { val: 6.5, label: '6.5', level: 'Competent' },
            { val: 7.0, label: '7.0', level: 'Good User' },
            { val: 7.5, label: '7.5+', level: 'Advanced' }
        ];

        const targetBandOptions = [
            { val: 5.5, label: '5.5', desc: 'Tốt nghiệp' },
            { val: 6.0, label: '6.0', desc: 'Đầu ra ĐH' },
            { val: 6.5, label: '6.5', desc: 'Xét tuyển ĐH' },
            { val: 7.0, label: '7.0', desc: 'Du học Top' },
            { val: 7.5, label: '7.5', desc: 'Học bổng cao' },
            { val: 8.0, label: '8.0', desc: 'Mastery' },
            { val: 8.5, label: '8.5+', desc: 'Expert' }
        ];

        const monthPresets = [1, 2, 3, 6, 9, 12];

        const hourPresets = [
            { hours: 1, label: '1 Giờ / ngày', desc: 'Thư thái · Tích lũy bền bỉ', icon: 'fa-feather' },
            { hours: 2, label: '2 Giờ / ngày', desc: 'Tiêu chuẩn vàng (Khuyên dùng)', icon: 'fa-bolt', badge: 'Khuyên dùng' },
            { hours: 3, label: '3 Giờ / ngày', desc: 'Tăng tốc · Cường độ cao', icon: 'fa-fire' },
            { hours: 4, label: '4+ Giờ / ngày', desc: 'Siêu tốc · Bứt phá thần tốc', icon: 'fa-rocket' }
        ];

        const purposePresets = [
            { icon: '🎓', label: 'Du học Đại học Top đầu (Anh, Úc, Mỹ, Canada)' },
            { icon: '🏛️', label: 'Xét tuyển Đại học trong nước (ĐH Ngoại Thương, ĐHQG, NEU)' },
            { icon: '💼', label: 'Thăng tiến sự nghiệp & Tập đoàn Đa quốc gia' },
            { icon: '✈️', label: 'Định cư & Visa làm việc toàn cầu' },
            { icon: '🎯', label: 'Đạt chuẩn đầu ra tốt nghiệp & Nhận bằng' }
        ];

        const skillOptions = [
            { id: 'Listening', label: 'Listening', icon: 'fa-headphones' },
            { id: 'Reading', label: 'Reading', icon: 'fa-book-open' },
            { id: 'Writing', label: 'Writing Task 1 & 2', icon: 'fa-pen-nib' },
            { id: 'Speaking', label: 'Speaking', icon: 'fa-comments' }
        ];

        const formData = ref({
            inputBand: 5.0,
            targetBand: 7.0,
            months: 3,
            purpose: 'Xét tuyển Đại học trong nước (ĐH Ngoại Thương, ĐHQG, NEU)',
            studyHours: 2,
            focusSkills: ['Reading', 'Writing']
        });

        const lastMeta = ref({
            inputBand: 5.0,
            targetBand: 7.0,
            months: 3,
            purpose: 'Xét tuyển Đại học',
            studyHours: 2,
            focusSkills: ['Reading', 'Writing']
        });

        const bandDelta = computed(() => {
            const delta = Number((formData.value.targetBand - formData.value.inputBand).toFixed(1));
            return delta;
        });

        const toggleSkill = (skillId) => {
            const idx = formData.value.focusSkills.indexOf(skillId);
            if (idx > -1) {
                if (formData.value.focusSkills.length > 1) {
                    formData.value.focusSkills.splice(idx, 1);
                }
            } else {
                formData.value.focusSkills.push(skillId);
            }
        };

        const setPurposePreset = (presetText) => {
            formData.value.purpose = presetText;
        };

        onMounted(() => {
            const savedHtml = localStorage.getItem('ielts_ai_roadmap');
            const savedMeta = localStorage.getItem('ielts_ai_roadmap_meta');
            const savedMarkdown = localStorage.getItem('ielts_ai_roadmap_raw');
            if (savedHtml) {
                aiRoadmapHtml.value = savedHtml;
                rawMarkdown.value = savedMarkdown || '';
                if (savedMeta) {
                    try {
                        lastMeta.value = JSON.parse(savedMeta);
                    } catch (_) {}
                }
                hasRoadmap.value = true;
            }
        });

        const createRoadmap = async () => {
            const apiKey = localStorage.getItem('gemini_api_key');
            if (!apiKey) {
                showToast("Vui lòng cấu hình Gemini API Key trong phần Cài đặt trước khi tạo lộ trình.", "error");
                return;
            }

            if (!formData.value.purpose || !formData.value.purpose.trim()) {
                showToast("Vui lòng chọn hoặc nhập mục đích học tập của bạn.", "error");
                return;
            }

            if (formData.value.targetBand <= formData.value.inputBand) {
                showToast("Band mục tiêu nên cao hơn Band hiện tại để AI thiết lập lộ trình bứt phá!", "warning");
            }

            isLoading.value = true;
            loadingStepIndex.value = 0;

            loadingTimer = setInterval(() => {
                if (loadingStepIndex.value < loadingSteps.length - 1) {
                    loadingStepIndex.value++;
                }
            }, 3000);

            try {
                let enrichedPurpose = formData.value.purpose.trim();
                if (formData.value.focusSkills.length > 0) {
                    enrichedPurpose += ` (Kỹ năng ưu tiên tập trung bứt phá: ${formData.value.focusSkills.join(', ')})`;
                }

                const markdownText = await generateRoadmap(
                    formData.value.inputBand,
                    formData.value.targetBand,
                    formData.value.months,
                    enrichedPurpose,
                    formData.value.studyHours
                );

                const html = window.marked ? window.marked.parse(markdownText) : markdownText;
                aiRoadmapHtml.value = html;
                rawMarkdown.value = markdownText;
                lastMeta.value = { ...formData.value };
                hasRoadmap.value = true;

                localStorage.setItem('ielts_ai_roadmap', html);
                localStorage.setItem('ielts_ai_roadmap_raw', markdownText);
                localStorage.setItem('ielts_ai_roadmap_meta', JSON.stringify(lastMeta.value));

                showToast("Đã khởi tạo lộ trình học IELTS thành công!", "success");
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (e) {
                showToast("Lỗi tạo lộ trình: " + e.message, "error");
            } finally {
                if (loadingTimer) clearInterval(loadingTimer);
                isLoading.value = false;
            }
        };

        const resetRoadmap = () => {
            hasRoadmap.value = false;
        };

        const clearSavedRoadmap = () => {
            if (confirm("Bạn có chắc chắn muốn xóa lộ trình đã lưu để cấu hình lại từ đầu?")) {
                localStorage.removeItem('ielts_ai_roadmap');
                localStorage.removeItem('ielts_ai_roadmap_raw');
                localStorage.removeItem('ielts_ai_roadmap_meta');
                hasRoadmap.value = false;
                aiRoadmapHtml.value = '';
                rawMarkdown.value = '';
                showToast("Đã làm mới không gian lộ trình!", "info");
            }
        };

        const copyRoadmap = async () => {
            try {
                const textToCopy = rawMarkdown.value || aiRoadmapHtml.value.replace(/<[^>]*>?/gm, '');
                await navigator.clipboard.writeText(textToCopy);
                showToast("Đã sao chép toàn bộ nội dung lộ trình vào Clipboard!", "success");
            } catch (_) {
                showToast("Không thể sao chép tự động. Vui lòng thử lại!", "error");
            }
        };

        const printRoadmap = () => {
            window.print();
        };

        const exportToWord = () => {
            const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Lộ trình IELTS - LexiLearn Pro</title><style>body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 20px; } h1, h2, h3, h4 { color: #4338ca; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; } h1 { font-size: 24pt; border-bottom: 2px solid #6366f1; padding-bottom: 6px; } h2 { font-size: 18pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; } h3 { font-size: 14pt; } p { margin-bottom: 1em; } ul, ol { margin-left: 20px; margin-bottom: 1em; } li { margin-bottom: 4px; } strong { color: #0f172a; } blockquote { border-left: 4px solid #6366f1; padding-left: 12px; color: #475569; font-style: italic; margin-bottom: 1em; background: #f8fafc; padding-top: 6px; padding-bottom: 6px; }</style></head><body><div class='markdown-body'>";
            const postHtml = "</div></body></html>";
            const html = preHtml + aiRoadmapHtml.value + postHtml;

            const blob = new Blob(['\ufeff', html], {
                type: 'application/msword'
            });
            
            const url = URL.createObjectURL(blob);
            const downloadLink = document.createElement("a");
            
            downloadLink.href = url;
            downloadLink.download = `Lo-Trinh-IELTS-Band-${lastMeta.value.inputBand}-to-${lastMeta.value.targetBand}.doc`;
            
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
            showToast("Đã xuất file Word thành công!", "success");
        };

        return { 
            store, hasRoadmap, isLoading, aiRoadmapHtml, rawMarkdown, formData, 
            lastMeta, bandDelta, inputBandOptions, targetBandOptions, monthPresets, 
            hourPresets, purposePresets, skillOptions, loadingStepIndex, loadingSteps,
            toggleSkill, setPurposePreset, createRoadmap, resetRoadmap, clearSavedRoadmap,
            copyRoadmap, printRoadmap, exportToWord 
        };
    },
    template: `
        <div class="max-w-5xl mx-auto space-y-6 pb-20 select-none">
            <!-- Top Navigation & Return -->
            <div class="flex items-center justify-between">
                <button @click="store.navigate('dashboard')" class="text-gray-500 hover:text-indigo-600 font-bold flex items-center gap-2 transition text-sm">
                    <i class="fa-solid fa-arrow-left"></i> Quay lại Trang chủ
                </button>
                <button v-if="hasRoadmap && !isLoading" 
                        @click="resetRoadmap"
                        class="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 flex items-center gap-2 transition shadow-sm">
                    <i class="fa-solid fa-sliders"></i> Tùy Chỉnh Mục Tiêu Mới
                </button>
            </div>

            <!-- Premium Hero Banner -->
            <div class="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-white shadow-xl"
                 style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 75%, #6366f1 100%);">
                <!-- Atmospheric Glow & Grid Aura -->
                <div class="absolute -right-20 -top-20 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none"></div>
                <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

                <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div class="space-y-3 max-w-2xl">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 backdrop-blur-md text-amber-300 border border-amber-300/30 flex items-center gap-1.5 shadow-sm">
                                <i class="fa-solid fa-wand-magic-sparkles text-amber-400"></i>
                                <span>AI NEURAL ROADMAP 2.0</span>
                            </span>
                            <span class="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-100 backdrop-blur-md border border-white/10">
                                Chuẩn Khảo Thí Cambridge & IDP
                            </span>
                        </div>
                        <h1 class="text-3xl sm:text-4xl font-black tracking-tight text-white">
                            Lộ Trình Học IELTS Cá Nhân Hóa
                        </h1>
                        <p class="text-indigo-100/90 text-sm sm:text-base leading-relaxed">
                            Thuật toán AI phân tích khoảng cách Band Score, phân kỳ chiến lược theo từng tháng và tối ưu hóa thời khóa biểu học tập riêng biệt cho bạn.
                        </p>
                    </div>

                    <!-- Visual Band Target Preview Indicator -->
                    <div class="w-full md:w-auto p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex md:flex-col items-center justify-around gap-4 shrink-0 shadow-lg text-center">
                        <div>
                            <p class="text-[10px] uppercase tracking-wider font-bold text-indigo-200">Mục tiêu hiện tại</p>
                            <p class="text-2xl font-black text-white mt-0.5">
                                {{ formData.inputBand }} <i class="fa-solid fa-arrow-right text-xs text-amber-400 mx-1"></i> {{ formData.targetBand }}
                            </p>
                        </div>
                        <div class="h-8 w-[1px] md:h-[1px] md:w-full bg-white/20"></div>
                        <span class="px-2.5 py-1 rounded-lg text-xs font-black"
                              :class="bandDelta >= 1.5 ? 'bg-amber-400 text-amber-950' : 'bg-emerald-400 text-emerald-950'">
                            {{ bandDelta > 0 ? '+' + bandDelta : '0' }} Band Score
                        </span>
                    </div>
                </div>
            </div>

            <!-- ================= STATE 1: LOADING NEURAL REACTOR ================= -->
            <div v-if="isLoading" class="glass-panel p-10 sm:p-14 rounded-3xl text-center space-y-8 bg-white border border-gray-100 shadow-sm animate-fade-in">
                <!-- Neural Quantum Reactor Animation Core -->
                <div class="relative w-32 h-32 mx-auto flex items-center justify-center">
                    <div class="absolute inset-0 rounded-full neural-ring-outer"></div>
                    <div class="absolute inset-2.5 rounded-full neural-ring-mid"></div>
                    <div class="absolute inset-5 rounded-full neural-ring-inner"></div>
                    <div class="w-3 h-3 rounded-full bg-amber-400 neural-particle-1 absolute"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-cyan-400 neural-particle-2 absolute"></div>
                    <div class="w-3 h-3 rounded-full bg-pink-400 neural-particle-3 absolute"></div>
                    <div class="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 neural-core-center flex items-center justify-center text-white text-2xl shadow-xl z-10">
                        <i class="fa-solid fa-brain neural-brain-icon drop-shadow-md"></i>
                    </div>
                </div>

                <!-- Cycling AI Thinking Stages -->
                <div class="space-y-3 max-w-lg mx-auto">
                    <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs tracking-wide">
                        <i class="fa-solid fa-sparkles text-amber-500 animate-spin" style="animation-duration: 3s;"></i>
                        <span>Giai đoạn {{ loadingStepIndex + 1 }} / {{ loadingSteps.length }}</span>
                    </div>
                    <h3 class="text-xl font-black text-gray-900 tracking-tight transition-all duration-300">
                        {{ loadingSteps[loadingStepIndex].title }}
                    </h3>
                    <p class="text-xs font-semibold text-gray-500 leading-relaxed">
                        {{ loadingSteps[loadingStepIndex].desc }}
                    </p>
                </div>

                <!-- Shimmer Progress Track -->
                <div class="w-full max-w-md mx-auto bg-gray-100 rounded-full h-2 overflow-hidden relative">
                    <div class="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-500 relative overflow-hidden"
                         :style="{ width: ((loadingStepIndex + 1) / loadingSteps.length * 100) + '%' }">
                        <div class="absolute inset-0 bg-white/40 neural-shimmer"></div>
                    </div>
                </div>
            </div>

            <!-- ================= STATE 2: CONFIGURATION STUDIO ================= -->
            <div v-else-if="!hasRoadmap" class="space-y-6 animate-fade-in">
                <!-- SECTION 1: BAND SCORES -->
                <div class="glass-panel p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-6">
                    <div class="flex items-center gap-3 pb-3 border-b border-gray-100">
                        <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-black shadow-sm">
                            1
                        </div>
                        <div>
                            <h3 class="text-base font-black text-gray-900">Mục Tiêu & Trình Độ IELTS (Band Scores)</h3>
                            <p class="text-xs text-gray-500">Chọn trình độ ước lượng hiện tại và điểm tổng mong muốn</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Input Band -->
                        <div class="space-y-3">
                            <label class="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center justify-between">
                                <span>Band Hiện Tại (Ước lượng)</span>
                                <span class="text-indigo-600 font-bold">Band {{ formData.inputBand }}</span>
                            </label>
                            <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                <button v-for="opt in inputBandOptions" :key="'in-' + opt.val"
                                        type="button"
                                        @click="formData.inputBand = opt.val"
                                        class="p-2.5 rounded-xl text-center border-2 transition-all flex flex-col items-center justify-center gap-0.5"
                                        :class="formData.inputBand === opt.val 
                                            ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-black shadow-sm ring-2 ring-indigo-200' 
                                            : 'border-gray-100 hover:border-gray-200 text-gray-700 bg-white'">
                                    <span class="text-base font-black">{{ opt.label }}</span>
                                    <span class="text-[10px] text-gray-400 font-bold truncate max-w-full">{{ opt.level }}</span>
                                </button>
                            </div>
                        </div>

                        <!-- Target Band -->
                        <div class="space-y-3">
                            <label class="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center justify-between">
                                <span>Band Mục Tiêu IELTS</span>
                                <span class="text-purple-600 font-bold">Band {{ formData.targetBand }}</span>
                            </label>
                            <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                <button v-for="opt in targetBandOptions" :key="'target-' + opt.val"
                                        type="button"
                                        @click="formData.targetBand = opt.val"
                                        class="p-2.5 rounded-xl text-center border-2 transition-all flex flex-col items-center justify-center gap-0.5"
                                        :class="formData.targetBand === opt.val 
                                            ? 'border-purple-600 bg-purple-50/80 text-purple-950 font-black shadow-sm ring-2 ring-purple-200' 
                                            : 'border-gray-100 hover:border-gray-200 text-gray-700 bg-white'">
                                    <span class="text-base font-black">{{ opt.label }}</span>
                                    <span class="text-[10px] text-gray-400 font-bold truncate max-w-full">{{ opt.desc }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECTION 2: TIME & INTENSITY -->
                <div class="glass-panel p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-6">
                    <div class="flex items-center gap-3 pb-3 border-b border-gray-100">
                        <div class="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg font-black shadow-sm">
                            2
                        </div>
                        <div>
                            <h3 class="text-base font-black text-gray-900">Quỹ Thời Gian & Cường Độ Học Tập</h3>
                            <p class="text-xs text-gray-500">Phân bổ thời gian ôn thi và số giờ tự học mỗi ngày</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Months Presets -->
                        <div class="space-y-3">
                            <label class="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center justify-between">
                                <span>Thời Gian Ôn Thi (Tháng)</span>
                                <span class="text-purple-600 font-bold">{{ formData.months }} Tháng</span>
                            </label>
                            <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                <button v-for="m in monthPresets" :key="'month-' + m"
                                        type="button"
                                        @click="formData.months = m"
                                        class="py-3 px-2 rounded-xl text-center border-2 transition-all font-black text-sm"
                                        :class="formData.months === m 
                                            ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-sm ring-2 ring-purple-200' 
                                            : 'border-gray-100 hover:border-gray-200 text-gray-700 bg-white'">
                                    {{ m }} Thg
                                </button>
                            </div>
                        </div>

                        <!-- Hours Presets -->
                        <div class="space-y-3">
                            <label class="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center justify-between">
                                <span>Số Giờ Học Mỗi Ngày</span>
                                <span class="text-indigo-600 font-bold">{{ formData.studyHours }} Giờ / ngày</span>
                            </label>
                            <div class="grid grid-cols-2 gap-2">
                                <button v-for="h in hourPresets" :key="'hour-' + h.hours"
                                        type="button"
                                        @click="formData.studyHours = h.hours"
                                        class="p-3 rounded-xl text-left border-2 transition-all flex items-center gap-2.5 relative"
                                        :class="formData.studyHours === h.hours 
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold ring-2 ring-indigo-200' 
                                            : 'border-gray-100 hover:border-gray-200 text-gray-700 bg-white'">
                                    <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0"
                                         :class="formData.studyHours === h.hours ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'">
                                        <i :class="'fa-solid ' + h.icon"></i>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <div class="text-xs font-black">{{ h.label }}</div>
                                        <div class="text-[10px] text-gray-400 truncate">{{ h.desc }}</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECTION 3: PURPOSE & FOCUS SKILLS -->
                <div class="glass-panel p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-6">
                    <div class="flex items-center gap-3 pb-3 border-b border-gray-100">
                        <div class="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center text-lg font-black shadow-sm">
                            3
                        </div>
                        <div>
                            <h3 class="text-base font-black text-gray-900">Mục Đích Luyện Thi & Kỹ Năng Ưu Tiên</h3>
                            <p class="text-xs text-gray-500">Giúp AI định hình chiến lược và trọng tâm bài tập</p>
                        </div>
                    </div>

                    <!-- Purpose Quick Tag Selectors -->
                    <div class="space-y-3">
                        <label class="text-xs font-black text-gray-700 uppercase tracking-wider">
                            Gợi Ý Nhu Cầu Phổ Biến (Chọn nhanh)
                        </label>
                        <div class="flex flex-wrap gap-2">
                            <button v-for="(p, idx) in purposePresets" :key="'purpose-' + idx"
                                    type="button"
                                    @click="setPurposePreset(p.label)"
                                    class="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 text-left"
                                    :class="formData.purpose === p.label 
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-200' 
                                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'">
                                <span>{{ p.icon }}</span>
                                <span>{{ p.label }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Purpose Input Detail -->
                    <div class="space-y-2">
                        <label class="text-xs font-black text-gray-700 uppercase tracking-wider">
                            Chi Tiết Mục Đích Hoặc Ghi Chú Riêng (Bắt buộc)
                        </label>
                        <input type="text" v-model="formData.purpose"
                               placeholder="Ví dụ: Du học Thạc sĩ tại Anh kỳ Thu 2026, cần gánh Speaking 7.0+, thời gian gấp..."
                               class="w-full p-3.5 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 focus:bg-white transition">
                    </div>

                    <!-- Focus Skills Multi-Select -->
                    <div class="space-y-2 pt-2">
                        <label class="text-xs font-black text-gray-700 uppercase tracking-wider">
                            Kỹ Năng Muốn Tập Trung Đột Phá
                        </label>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button v-for="sk in skillOptions" :key="sk.id"
                                    type="button"
                                    @click="toggleSkill(sk.id)"
                                    class="p-3 rounded-xl border-2 transition-all flex items-center gap-2 text-xs font-bold"
                                    :class="formData.focusSkills.includes(sk.id) 
                                        ? 'border-pink-500 bg-pink-50 text-pink-900 ring-2 ring-pink-200' 
                                        : 'border-gray-100 hover:border-gray-200 text-gray-600 bg-white'">
                                <i :class="'fa-solid ' + sk.icon" class="text-pink-500"></i>
                                <span>{{ sk.label }}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Launch Primary CTA Bar -->
                <div class="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div class="space-y-1 text-center sm:text-left">
                        <p class="text-xs text-indigo-200 font-bold uppercase tracking-wider">Tóm tắt cấu hình lộ trình</p>
                        <p class="text-sm sm:text-base font-black text-white">
                            Band {{ formData.inputBand }} → {{ formData.targetBand }} ({{ bandDelta > 0 ? '+' + bandDelta : '0' }} Band) · {{ formData.months }} Tháng · {{ formData.studyHours }}h/ngày
                        </p>
                    </div>
                    <button @click="createRoadmap"
                            class="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shrink-0">
                        <i class="fa-solid fa-wand-magic-sparkles text-base"></i>
                        <span>Tạo Lộ Trình Bằng AI</span>
                    </button>
                </div>
            </div>

            <!-- ================= STATE 3: ROADMAP RESULTS ================= -->
            <div v-else class="space-y-6 animate-fade-in">
                <!-- Executive Summary HUD Bar -->
                <div class="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-black border border-indigo-200 flex items-center gap-1.5">
                            <i class="fa-solid fa-bullseye"></i>
                            <span>Band {{ lastMeta.inputBand }} → Band {{ lastMeta.targetBand }}</span>
                        </span>
                        <span class="px-3 py-1 rounded-xl bg-purple-50 text-purple-700 text-xs font-black border border-purple-200 flex items-center gap-1.5">
                            <i class="fa-solid fa-calendar-days"></i>
                            <span>{{ lastMeta.months }} Tháng</span>
                        </span>
                        <span class="px-3 py-1 rounded-xl bg-amber-50 text-amber-700 text-xs font-black border border-amber-200 flex items-center gap-1.5">
                            <i class="fa-solid fa-clock"></i>
                            <span>{{ lastMeta.studyHours }}h / ngày</span>
                        </span>
                        <span v-if="lastMeta.focusSkills && lastMeta.focusSkills.length" class="px-3 py-1 rounded-xl bg-pink-50 text-pink-700 text-xs font-black border border-pink-200 flex items-center gap-1.5">
                            <i class="fa-solid fa-fire"></i>
                            <span>Trọng tâm: {{ lastMeta.focusSkills.join(', ') }}</span>
                        </span>
                    </div>

                    <!-- Action Bar Toolbar -->
                    <div class="flex items-center gap-2">
                        <button @click="copyRoadmap" 
                                class="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                                title="Sao chép toàn bộ lộ trình">
                            <i class="fa-solid fa-copy"></i>
                            <span class="hidden sm:inline">Sao chép</span>
                        </button>
                        <button @click="exportToWord" 
                                class="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition flex items-center gap-1.5"
                                title="Xuất file Word Microsoft (.doc)">
                            <i class="fa-solid fa-file-word"></i>
                            <span>Xuất Word</span>
                        </button>
                        <button @click="printRoadmap" 
                                class="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                                title="In hoặc lưu file PDF">
                            <i class="fa-solid fa-print"></i>
                            <span class="hidden sm:inline">In / PDF</span>
                        </button>
                    </div>
                </div>

                <!-- Markdown Formatted Content Sheet -->
                <div class="glass-panel p-6 sm:p-10 rounded-3xl shadow-sm bg-white text-gray-800 border border-gray-100 leading-relaxed">
                    <div class="markdown-body font-sans text-sm sm:text-base space-y-4" v-html="aiRoadmapHtml"></div>
                </div>

                <!-- Bottom Navigation Toolbar -->
                <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button @click="clearSavedRoadmap" 
                            class="px-5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition border border-rose-200 flex items-center gap-2">
                        <i class="fa-solid fa-trash-can"></i>
                        <span>Xóa lộ trình này</span>
                    </button>
                    <div class="flex items-center gap-3">
                        <button @click="resetRoadmap" 
                                class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2">
                            <i class="fa-solid fa-sliders"></i>
                            <span>Cấu hình & Tạo lộ trình mới</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
};
