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
            { title: 'Phân tích khoảng cách Band Score', desc: 'Đánh giá điểm mạnh/yếu và thiết lập chiến lược gánh điểm...' },
            { title: 'Tính toán phân bổ điểm 4 kỹ năng', desc: 'Thiết lập mục tiêu Lis & Read gánh điểm cho Writ & Speak...' },
            { title: 'Thiết kế chiến lược phân kỳ theo tháng', desc: 'Xây dựng lộ trình giai đoạn theo từng mốc thời gian...' },
            { title: 'Tuyển chọn tài liệu & phân bổ thời khóa biểu', desc: 'Tuyển chọn Cambridge IELTS, nguồn nghe, bài đọc và lịch học...' },
            { title: 'Tổng hợp kế hoạch Mock Test & Xuất dữ liệu', desc: 'Hoàn thiện lộ trình học tập tối ưu sẵn sàng áp dụng...' }
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

        const monthPresets = [1, 2, 3, 6, 9, 12, 18, 24];

        const hourPresets = [
            { hours: 1, label: '1 Giờ / ngày', desc: 'Thư thái · Tích lũy bền bỉ', icon: 'fa-feather' },
            { hours: 2, label: '2 Giờ / ngày', desc: 'Tiêu chuẩn vàng (Khuyên dùng)', icon: 'fa-bolt', badge: 'Khuyên dùng' },
            { hours: 3, label: '3 Giờ / ngày', desc: 'Tăng tốc · Cường độ cao', icon: 'fa-fire' },
            { hours: 4, label: '4 Giờ / ngày', desc: 'Siêu tốc · Bứt phá thần tốc', icon: 'fa-rocket' },
            { hours: 5, label: '5+ Giờ / ngày', desc: 'Toàn thời gian · Cày cấp marathon', icon: 'fa-meteor' }
        ];

        const strategyPresets = [
            { 
                id: 'pull_strategy', 
                title: 'Chiến Thuật Gánh Điểm (Lis & Read kéo Writ & Speak)', 
                desc: 'Đẩy mạnh Listening & Reading lên 7.5–8.5+ để gánh điểm cho Writing & Speaking. Chiến thuật số 1 cho học sinh Việt Nam xét tuyển ĐH & du học.', 
                icon: 'fa-bolt', 
                badge: 'Khuyên dùng cho HS Việt Nam',
                color: 'amber'
            },
            { 
                id: 'balanced', 
                title: 'Phát Triển Toàn Diện (Đồng đều 4 kỹ năng)', 
                desc: 'Phân bổ thời gian và mục tiêu điểm số đồng đều cho cả 4 kỹ năng Nghe, Nói, Đọc, Viết. Phù hợp người học dài hạn, định cư.', 
                icon: 'fa-scale-balanced', 
                badge: 'Tiêu chuẩn',
                color: 'indigo'
            },
            { 
                id: 'weakness_boost', 
                title: 'Bứt Phá Kỹ Năng Yếu (Targeted Boost)', 
                desc: 'Tập trung 70% thời lượng khắc phục kỹ năng đang bị điểm liệt hoặc yếu nhất để chạm chuẩn đầu vào.', 
                icon: 'fa-crosshairs', 
                badge: 'Đột phá',
                color: 'rose'
            }
        ];

        const purposePresets = [
            { icon: '🎓', label: 'Du học Đại học Top đầu (Anh, Úc, Mỹ, Canada)' },
            { icon: '🏛️', label: 'Xét tuyển Đại học trong nước (ĐH Ngoại Thương, ĐHQG, NEU)' },
            { icon: '💼', label: 'Thăng tiến sự nghiệp & Tập đoàn Đa quốc gia' },
            { icon: '✈️', label: 'Định cư & Visa làm việc toàn cầu' },
            { icon: '🎯', label: 'Đạt chuẩn đầu ra tốt nghiệp & Nhận bằng' }
        ];

        const skillOptions = [
            { id: 'Listening', label: 'Listening', icon: 'fa-headphones', color: 'indigo' },
            { id: 'Reading', label: 'Reading', icon: 'fa-book-open', color: 'purple' },
            { id: 'Writing', label: 'Writing Task 1 & 2', icon: 'fa-pen-nib', color: 'pink' },
            { id: 'Speaking', label: 'Speaking', icon: 'fa-comments', color: 'orange' }
        ];

        const formData = ref({
            inputBand: 5.0,
            targetBand: 7.0,
            months: 3,
            strategyType: 'pull_strategy',
            purpose: 'Xét tuyển Đại học trong nước (ĐH Ngoại Thương, ĐHQG, NEU)',
            studyHours: 2,
            focusSkills: ['Reading', 'Listening']
        });

        const lastMeta = ref({
            inputBand: 5.0,
            targetBand: 7.0,
            months: 3,
            strategyType: 'pull_strategy',
            purpose: 'Xét tuyển Đại học trong nước',
            studyHours: 2,
            focusSkills: ['Reading', 'Listening']
        });

        const bandDelta = computed(() => {
            const delta = Number((formData.value.targetBand - formData.value.inputBand).toFixed(1));
            return delta;
        });

        // Calculate specific (L, R, W, S) target breakdown live
        const calculatedSkillTargets = computed(() => {
            const tb = Number(formData.value.targetBand);
            const strat = formData.value.strategyType;

            if (strat === 'pull_strategy') {
                if (tb <= 5.5) {
                    return { L: 6.0, R: 6.0, W: 5.0, S: 5.0, avg: 5.5, formula: '(6.0 + 6.0 + 5.0 + 5.0) / 4 = 5.5' };
                } else if (tb <= 6.0) {
                    return { L: 6.5, R: 6.5, W: 5.5, S: 5.5, avg: 6.0, formula: '(6.5 + 6.5 + 5.5 + 5.5) / 4 = 6.0' };
                } else if (tb <= 6.5) {
                    return { L: 7.0, R: 7.0, W: 6.0, S: 5.5, avg: 6.375, formula: '(7.0 + 7.0 + 6.0 + 5.5) / 4 = 6.375 → 6.5' };
                } else if (tb <= 7.0) {
                    return { L: 7.5, R: 7.5, W: 6.5, S: 6.0, avg: 6.875, formula: '(7.5 + 7.5 + 6.5 + 6.0) / 4 = 6.875 → 7.0' };
                } else if (tb <= 7.5) {
                    return { L: 8.0, R: 8.5, W: 6.5, S: 6.5, avg: 7.375, formula: '(8.0 + 8.5 + 6.5 + 6.5) / 4 = 7.375 → 7.5' };
                } else if (tb <= 8.0) {
                    return { L: 8.5, R: 9.0, W: 7.0, S: 7.0, avg: 7.875, formula: '(8.5 + 9.0 + 7.0 + 7.0) / 4 = 7.875 → 8.0' };
                } else {
                    return { L: 9.0, R: 9.0, W: 7.5, S: 7.5, avg: 8.25, formula: '(9.0 + 9.0 + 7.5 + 7.5) / 4 = 8.25 → 8.5' };
                }
            } else if (strat === 'balanced') {
                return { L: tb, R: tb, W: tb, S: tb, avg: tb, formula: `(${tb} + ${tb} + ${tb} + ${tb}) / 4 = ${tb}` };
            } else {
                // weakness boost
                return { L: Math.min(9.0, tb + 0.5), R: tb, W: tb, S: Math.max(5.0, tb - 0.5), avg: tb, formula: 'Tập trung bứt phá kỹ năng ưu tiên' };
            }
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
            }, 2800);

            try {
                let enrichedPurpose = formData.value.purpose.trim();
                if (formData.value.focusSkills.length > 0) {
                    enrichedPurpose += ` (Kỹ năng ưu tiên tập trung: ${formData.value.focusSkills.join(', ')})`;
                }

                const markdownText = await generateRoadmap(
                    formData.value.inputBand,
                    formData.value.targetBand,
                    formData.value.months,
                    enrichedPurpose,
                    formData.value.studyHours,
                    formData.value.strategyType
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
            const dateStr = new Date().toLocaleDateString('vi-VN');
            const preHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Lộ trình IELTS - LexiLearn Pro</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page {
    size: A4;
    margin: 20mm 20mm 20mm 20mm;
}
body { 
    font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; 
    line-height: 1.6; 
    color: #1e293b; 
    padding: 0; 
}
.header-banner {
    background-color: #312e81;
    color: #ffffff;
    padding: 24px;
    border-radius: 8px;
    margin-bottom: 24px;
    border-bottom: 4px solid #6366f1;
}
.header-banner h1 {
    color: #ffffff !important;
    margin: 0 0 8px 0;
    font-size: 24pt;
    border-bottom: none !important;
}
.header-banner p {
    color: #e0e7ff !important;
    margin: 0;
    font-size: 11pt;
}
h1, h2, h3, h4 { 
    color: #312e81; 
    font-weight: bold; 
    margin-top: 1.5em; 
    margin-bottom: 0.5em; 
}
h1 { font-size: 20pt; border-bottom: 2px solid #6366f1; padding-bottom: 6px; }
h2 { font-size: 15pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; color: #4338ca; }
h3 { font-size: 13pt; color: #1e1b4b; }
p { margin-bottom: 0.8em; }
ul, ol { margin-left: 20px; margin-bottom: 1em; }
li { margin-bottom: 4px; }
strong { color: #0f172a; }
blockquote { 
    border-left: 4px solid #6366f1; 
    padding: 8px 14px; 
    color: #334155; 
    font-style: italic; 
    margin-bottom: 1em; 
    background-color: #f8fafc; 
}
table { 
    width: 100%; 
    border-collapse: collapse; 
    margin: 16px 0; 
    font-size: 10.5pt;
}
th, td { 
    border: 1px solid #cbd5e1; 
    padding: 8px 12px; 
    text-align: left; 
}
th { 
    background-color: #eef2ff; 
    color: #312e81; 
    font-weight: bold; 
    border-bottom: 2px solid #6366f1;
}
tr:nth-child(even) td { 
    background-color: #f8fafc; 
}
.badge {
    display: inline-block;
    padding: 3px 8px;
    font-size: 9pt;
    font-weight: bold;
    border-radius: 4px;
    background-color: #eef2ff;
    color: #4338ca;
}
</style>
</head>
<body>
<div class="header-banner">
    <h1>KẾ HOẠCH LỘ TRÌNH HỌC IELTS CÁ NHÂN HÓA</h1>
    <p>Hệ thống: LexiLearn AI Neural Roadmap 2.0 · Ngày xuất: ${dateStr}</p>
    <p>Mục tiêu: Band ${lastMeta.value.inputBand} → Band ${lastMeta.value.targetBand} · Thời gian: ${lastMeta.value.months} Tháng (${lastMeta.value.studyHours}h/ngày)</p>
</div>
<div class='markdown-body'>`;
            const postHtml = `</div>
<br><hr style="border:none; border-top:1px solid #e2e8f0; margin-top:30px;">
<p style="font-size:9pt; color:#64748b; text-align:center;">Tài liệu được khởi tạo tự động bởi LexiLearn AI IELTS Studio. Chúc bạn ôn luyện vững vàng và chinh phục Band điểm mục tiêu!</p>
</body>
</html>`;
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
            showToast("Đã xuất file Word (.doc) thành công!", "success");
        };

        return { 
            store, hasRoadmap, isLoading, aiRoadmapHtml, rawMarkdown, formData, 
            lastMeta, bandDelta, calculatedSkillTargets, inputBandOptions, targetBandOptions, 
            monthPresets, hourPresets, strategyPresets, purposePresets, skillOptions, 
            loadingStepIndex, loadingSteps, toggleSkill, setPurposePreset, createRoadmap, 
            resetRoadmap, clearSavedRoadmap, copyRoadmap, printRoadmap, exportToWord 
        };
    },
    template: `
        <div class="max-w-5xl mx-auto space-y-6 pb-20 select-none">
            <!-- Top Navigation & Return -->
            <div class="flex items-center justify-between no-print">
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
            <div class="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-white shadow-xl no-print"
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
                            <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 backdrop-blur-md border border-amber-400/30">
                                Chiến Thuật Gánh Điểm VN
                            </span>
                        </div>
                        <h1 class="text-3xl sm:text-4xl font-black tracking-tight text-white">
                            Lộ Trình Học IELTS Cá Nhân Hóa
                        </h1>
                        <p class="text-indigo-100/90 text-sm sm:text-base leading-relaxed">
                            Thuật toán AI phân tích khoảng cách Band Score, tối ưu hóa chiến lược kéo điểm Lis & Read cho học sinh Việt Nam và thiết kế thời khóa biểu học tập chi tiết.
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
            <div v-if="isLoading" class="glass-panel p-10 sm:p-14 rounded-3xl text-center space-y-8 bg-white border border-gray-100 shadow-sm animate-fade-in no-print">
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
            <div v-else-if="!hasRoadmap" class="space-y-6 animate-fade-in no-print">
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

                <!-- SECTION 2: STRATEGY & SKILL TARGET BREAKDOWN (NEW VIETNAMESE STUDENTS STRATEGY) -->
                <div class="glass-panel p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-6">
                    <div class="flex items-center gap-3 pb-3 border-b border-gray-100">
                        <div class="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-black shadow-sm">
                            2
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-black text-gray-900">Chiến Thuật Phân Bổ Điểm & Kéo Band</h3>
                                <span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800">
                                    Thực chiến VN
                                </span>
                            </div>
                            <p class="text-xs text-gray-500">Tối ưu hóa điểm số dựa trên thế mạnh thực tế của người học Việt Nam</p>
                        </div>
                    </div>

                    <!-- Strategy Preset Selector Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button v-for="strat in strategyPresets" :key="strat.id"
                                type="button"
                                @click="formData.strategyType = strat.id"
                                class="p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between gap-3"
                                :class="formData.strategyType === strat.id 
                                    ? 'border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-200' 
                                    : 'border-gray-100 hover:border-gray-200 bg-white'">
                            <div class="space-y-2">
                                <div class="flex items-center justify-between gap-2">
                                    <span class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                                          :class="formData.strategyType === strat.id ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'">
                                        <i :class="'fa-solid ' + strat.icon"></i>
                                    </span>
                                    <span v-if="strat.badge" 
                                          class="px-2 py-0.5 rounded-full text-[10px] font-black"
                                          :class="formData.strategyType === strat.id ? 'bg-amber-200 text-amber-950 font-black' : 'bg-gray-100 text-gray-600'">
                                        {{ strat.badge }}
                                    </span>
                                </div>
                                <h4 class="text-xs font-black text-gray-900 leading-snug">{{ strat.title }}</h4>
                                <p class="text-[11px] text-gray-500 leading-relaxed">{{ strat.desc }}</p>
                            </div>
                            <div class="text-[10px] font-bold" :class="formData.strategyType === strat.id ? 'text-amber-700' : 'text-gray-400'">
                                <i class="fa-solid" :class="formData.strategyType === strat.id ? 'fa-circle-check text-amber-600' : 'fa-circle text-gray-200'"></i>
                                {{ formData.strategyType === strat.id ? ' Đang kích hoạt' : ' Nhấp để chọn' }}
                            </div>
                        </button>
                    </div>

                    <!-- Dynamic Calculated Target Blueprint HUD -->
                    <div class="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white space-y-3 shadow-inner">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                            <div>
                                <span class="text-[10px] uppercase tracking-wider font-extrabold text-amber-400 flex items-center gap-1.5">
                                    <i class="fa-solid fa-calculator"></i>
                                    Mục tiêu dự kiến từng kỹ năng cho Overall {{ formData.targetBand }}
                                </span>
                                <p class="text-xs text-slate-300 font-semibold mt-0.5">
                                    {{ calculatedSkillTargets.formula }}
                                </p>
                            </div>
                            <div class="px-3 py-1 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black text-center shrink-0">
                                Target: Band {{ formData.targetBand }}
                            </div>
                        </div>

                        <!-- 4 Skill Breakdown Cards -->
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                            <div class="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center space-y-1">
                                <div class="text-[10px] font-bold text-indigo-300 uppercase">Listening</div>
                                <div class="text-2xl font-black text-indigo-400">{{ calculatedSkillTargets.L }}</div>
                                <div class="text-[9px] text-slate-400">Kéo điểm chủ lực</div>
                            </div>
                            <div class="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center space-y-1">
                                <div class="text-[10px] font-bold text-purple-300 uppercase">Reading</div>
                                <div class="text-2xl font-black text-purple-400">{{ calculatedSkillTargets.R }}</div>
                                <div class="text-[9px] text-slate-400">Thế mạnh cốt lõi</div>
                            </div>
                            <div class="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center space-y-1">
                                <div class="text-[10px] font-bold text-pink-300 uppercase">Writing</div>
                                <div class="text-2xl font-black text-pink-400">{{ calculatedSkillTargets.W }}</div>
                                <div class="text-[9px] text-slate-400">Mục tiêu an toàn</div>
                            </div>
                            <div class="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center space-y-1">
                                <div class="text-[10px] font-bold text-orange-300 uppercase">Speaking</div>
                                <div class="text-2xl font-black text-orange-400">{{ calculatedSkillTargets.S }}</div>
                                <div class="text-[9px] text-slate-400">Trôi chảy logic</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECTION 3: TIME & INTENSITY -->
                <div class="glass-panel p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-6">
                    <div class="flex items-center gap-3 pb-3 border-b border-gray-100">
                        <div class="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg font-black shadow-sm">
                            3
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
                            <div class="grid grid-cols-4 sm:grid-cols-8 gap-2">
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

                <!-- SECTION 4: PURPOSE & FOCUS SKILLS -->
                <div class="glass-panel p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-6">
                    <div class="flex items-center gap-3 pb-3 border-b border-gray-100">
                        <div class="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center text-lg font-black shadow-sm">
                            4
                        </div>
                        <div>
                            <h3 class="text-base font-black text-gray-900">Mục Đích Luyện Thi & Kỹ Năng Ưu Tiên</h3>
                            <p class="text-xs text-gray-500">Giúp AI định hình mục tiêu và ngữ cảnh bài học</p>
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
                               placeholder="Ví dụ: Xét tuyển ĐH Ngoại Thương & ĐHQG, cần kéo Reading/Listening 7.5+ để bù điểm..."
                               class="w-full p-3.5 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 focus:bg-white transition">
                    </div>

                    <!-- Focus Skills Multi-Select -->
                    <div class="space-y-2 pt-2">
                        <label class="text-xs font-black text-gray-700 uppercase tracking-wider">
                            Kỹ Năng Ưu Tiên Rèn Luyện
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
                            Band {{ formData.inputBand }} → {{ formData.targetBand }} ({{ bandDelta > 0 ? '+' + bandDelta : '0' }} Band) · {{ formData.months }} Tháng · {{ formData.studyHours }}h/ngày · {{ formData.strategyType === 'pull_strategy' ? 'Chiến thuật Gánh Điểm' : formData.strategyType === 'balanced' ? 'Phát triển Toàn diện' : 'Bứt phá Kỹ năng Yếu' }}
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
                <!-- Executive Summary HUD Bar & Export Suite -->
                <div class="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 no-print">
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
                        <span v-if="lastMeta.strategyType === 'pull_strategy'" class="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 text-xs font-black border border-amber-300 flex items-center gap-1.5">
                            <i class="fa-solid fa-bolt text-amber-600"></i>
                            <span>Gánh điểm Lis & Read</span>
                        </span>
                    </div>

                    <!-- Rich Export Suite Action Bar Toolbar -->
                    <div class="flex flex-wrap items-center gap-2">
                        <button @click="copyRoadmap" 
                                class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
                                title="Sao chép toàn bộ nội dung lộ trình vào Clipboard">
                            <i class="fa-solid fa-copy"></i>
                            <span>Sao chép</span>
                        </button>
                        <button @click="exportToWord" 
                                class="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition flex items-center gap-1.5 shadow-sm"
                                title="Xuất file Microsoft Word (.doc) có định dạng bảng và màu sắc chuẩn">
                            <i class="fa-solid fa-file-word text-blue-600"></i>
                            <span>Xuất Word (.doc)</span>
                        </button>
                        <button @click="printRoadmap" 
                                class="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition flex items-center gap-1.5 shadow-sm"
                                title="In hoặc lưu file PDF khổ A4 chuẩn">
                            <i class="fa-solid fa-print text-emerald-600"></i>
                            <span>In / Lưu PDF</span>
                        </button>
                    </div>
                </div>

                <!-- Printable Document Header (Only shown during print / PDF) -->
                <div class="hidden print:block p-6 rounded-2xl bg-indigo-900 text-white mb-6">
                    <h1 class="text-2xl font-black">LỘ TRÌNH HỌC IELTS CÁ NHÂN HÓA — LEXILEARN AI</h1>
                    <p class="text-sm text-indigo-200 mt-1">
                        Mục tiêu: Band {{ lastMeta.inputBand }} → Band {{ lastMeta.targetBand }} · Thời gian: {{ lastMeta.months }} Tháng ({{ lastMeta.studyHours }}h/ngày) · Chiến thuật: {{ lastMeta.strategyType === 'pull_strategy' ? 'Gánh Điểm Lis & Read' : 'Phát triển toàn diện' }}
                    </p>
                </div>

                <!-- Markdown Formatted Content Sheet -->
                <div class="glass-panel p-6 sm:p-10 rounded-3xl shadow-sm bg-white text-gray-800 border border-gray-100 leading-relaxed">
                    <div class="markdown-body font-sans text-sm sm:text-base space-y-4" v-html="aiRoadmapHtml"></div>
                </div>

                <!-- Bottom Navigation Toolbar -->
                <div class="flex flex-wrap items-center justify-between gap-3 pt-2 no-print">
                    <button @click="clearSavedRoadmap" 
                            class="px-5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition border border-rose-200 flex items-center gap-2 shadow-sm">
                        <i class="fa-solid fa-trash-can"></i>
                        <span>Xóa lộ trình này</span>
                    </button>
                    <div class="flex items-center gap-2">
                        <button @click="resetRoadmap" 
                                class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 hover:scale-105 active:scale-95">
                            <i class="fa-solid fa-sliders"></i>
                            <span>Cấu hình & Tạo lộ trình mới</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
};
