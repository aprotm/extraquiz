import { ref } from 'vue';
import { store } from '../store.js';

export default {
    setup() {
        const activeSection = ref('getting-started');

        const sections = [
            { id: 'getting-started', title: '🚀 Khởi Động & Cá Nhân Hóa', desc: 'Thiết lập giao diện, giọng đọc & chế độ tập trung', icon: 'fa-solid fa-rocket', color: 'indigo' },
            { id: 'memory-science', title: '🧠 Khoa Học Não Bộ & Trí Nhớ', desc: 'Đường cong Ebbinghaus & thuật toán HLR', icon: 'fa-solid fa-brain', color: 'purple' },
            { id: 'gamification-guide', title: '⚡ Bí Kíp Leo Rank & Cấp Độ', desc: 'Tích lũy LexiCredit & mở khóa 25 Cấp bậc', icon: 'fa-solid fa-trophy', color: 'amber' },
            { id: 'decks-import', title: '🗂️ Quản Lý Thẻ & Nhập Liệu', desc: '7 trường dữ liệu học thuật & AI Auto-fill', icon: 'fa-solid fa-file-import', color: 'blue' },
            { id: 'study-modes', title: '🎮 Các Chế Độ Luyện Tập', desc: 'Lật thẻ 3D, Trắc nghiệm, Gõ chính tả, Ghép thẻ', icon: 'fa-solid fa-gamepad', color: 'emerald' },
            { id: 'ai-features', title: '🤖 Trợ Giảng AI Toàn Năng', desc: 'Chấm Writing IELTS Band 8.0 & Paraphrase Coach', icon: 'fa-solid fa-wand-magic-sparkles', color: 'cyan' },
            { id: 'persona-dna', title: '🧬 Hồ Sơ AI Tâm Lý Học', desc: 'Radar 4 chỉ số tư duy & phản xạ não bộ', icon: 'fa-solid fa-dna', color: 'rose' }
        ];

        const goBack = () => {
            store.navigate('dashboard');
        };

        return { store, activeSection, sections, goBack };
    },
    template: `
        <div class="w-full max-w-full space-y-8 pb-32 select-none px-2 sm:px-6">
            
            <!-- HEADER -->
            <div class="flex items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                <div class="flex items-center gap-4">
                    <button @click="goBack" class="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow-sm hover:shadow hover:bg-purple-50 transition text-gray-600 dark:text-gray-300 hover:text-purple-600 border border-gray-200 dark:border-gray-700 text-lg font-black">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <div class="flex items-center gap-3 flex-wrap">
                            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
                                <span class="text-3xl select-none">📚</span>
                                Sổ Tay Hướng Dẫn ExtraQuiz Pro
                            </h1>
                            <span class="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">Cẩm Nang Toàn Diện</span>
                        </div>
                        <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-semibold mt-1">Phương pháp khoa học não bộ & Cẩm nang sử dụng hệ sinh thái học tập</p>
                    </div>
                </div>
            </div>

            <!-- MAIN GRID LAYOUT -->
            <div class="flex flex-col lg:flex-row gap-8 items-start">
                
                <!-- SIDEBAR MENU -->
                <div class="w-full lg:w-80 glass-panel p-4 rounded-3xl flex-shrink-0 sticky top-20 z-10 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-2">
                    <div class="px-3 py-1.5 text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Danh Mục Hướng Dẫn
                    </div>
                    <nav class="flex flex-col gap-1.5">
                        <button v-for="sec in sections" :key="sec.id" 
                                @click="activeSection = sec.id"
                                class="flex items-start gap-3.5 px-4 py-3.5 rounded-2xl text-left transition-all group border"
                                :class="activeSection === sec.id 
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-lg shadow-indigo-500/20' 
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/60 border-transparent hover:border-gray-200 dark:hover:border-gray-700'">
                            <div class="w-7 flex justify-center text-lg mt-0.5" :class="activeSection === sec.id ? 'text-white' : 'text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform'">
                                <i :class="sec.icon"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <span class="font-extrabold text-sm block truncate" :class="activeSection === sec.id ? 'text-white' : 'text-gray-900 dark:text-gray-100'">{{ sec.title }}</span>
                                <span class="text-xs block truncate mt-0.5 opacity-80" :class="activeSection === sec.id ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'">{{ sec.desc }}</span>
                            </div>
                        </button>
                    </nav>

                    <div class="mt-4 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-center space-y-2">
                        <p class="text-xs font-black text-indigo-950 dark:text-indigo-200">Cần hỗ trợ trực tiếp?</p>
                        <p class="text-[11px] text-gray-600 dark:text-gray-400 font-medium">Trợ lý AI & Đội ngũ ExtraQuiz sẵn sàng</p>
                        <button @click="store.navigate('dashboard')" class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider transition shadow-sm">
                            Về Trang Chủ
                        </button>
                    </div>
                </div>

                <!-- MAIN CONTENT DISPLAY AREA -->
                <div class="flex-1 w-full glass-panel-strong p-6 sm:p-10 lg:p-12 rounded-3xl min-h-[70vh] bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-gray-800 shadow-sm text-gray-800 dark:text-gray-200">
                    
                    <!-- 1. KHỞI ĐỘNG & CÀI ĐẶT -->
                    <div v-if="activeSection === 'getting-started'" class="animate-fade-in space-y-8">
                        <div class="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
                            <div class="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl font-black shadow-sm">
                                <i class="fa-solid fa-rocket"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">1. Khởi Động & Cá Nhân Hóa Không Gian Học</h2>
                                <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-semibold mt-0.5">Thiết lập môi trường học tập lý tưởng nhất cho não bộ của bạn</p>
                            </div>
                        </div>
                        
                        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-l-4 border-indigo-600 p-5 rounded-r-2xl shadow-sm">
                            <p class="text-indigo-950 dark:text-indigo-200 text-base font-bold m-0 leading-relaxed">
                                <strong>💡 Mẹo tâm lý học:</strong> Môi trường học tập gọn gàng, âm thanh phát âm rõ ràng và màu sắc hợp tâm trạng giúp tăng khả năng tập trung (Attention Span) lên tới <strong>40%</strong>!
                            </p>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                            <div class="p-6 rounded-2xl bg-gray-50/80 dark:bg-slate-800/60 border border-gray-200/80 dark:border-gray-700/60 space-y-3 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all">
                                <div class="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xl font-bold">
                                    <i class="fa-solid fa-moon"></i>
                                </div>
                                <h4 class="font-black text-lg text-gray-900 dark:text-white">Chế Độ Tối (Dark Mode)</h4>
                                <p class="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">Giảm ánh sáng xanh, chống mỏi mắt khi học từ vựng ban đêm hoặc trong không gian tối.</p>
                            </div>

                            <div class="p-6 rounded-2xl bg-gray-50/80 dark:bg-slate-800/60 border border-gray-200/80 dark:border-gray-700/60 space-y-3 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all">
                                <div class="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-xl font-bold">
                                    <i class="fa-solid fa-volume-high"></i>
                                </div>
                                <h4 class="font-black text-lg text-gray-900 dark:text-white">Giọng Đọc Chuẩn Bản Xứ (Voice TTS)</h4>
                                <p class="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">Tùy chọn giữa giọng Anh-Mỹ (US) và Anh-Anh (UK) để làm quen ngữ điệu bài thi IELTS/TOEIC.</p>
                            </div>

                            <div class="p-6 rounded-2xl bg-gray-50/80 dark:bg-slate-800/60 border border-gray-200/80 dark:border-gray-700/60 space-y-3 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all">
                                <div class="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center text-xl font-bold">
                                    <i class="fa-solid fa-shield-heart"></i>
                                </div>
                                <h4 class="font-black text-lg text-gray-900 dark:text-white">Focus Mode (Siêu Tập Trung)</h4>
                                <p class="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">Ẩn toàn bộ thanh menu và thông báo gây xao nhãng, chỉ hiển thị duy nhất thẻ học trước mắt bạn.</p>
                            </div>

                            <div class="p-6 rounded-2xl bg-gray-50/80 dark:bg-slate-800/60 border border-gray-200/80 dark:border-gray-700/60 space-y-3 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all">
                                <div class="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-900/60 text-pink-600 dark:text-pink-300 flex items-center justify-center text-xl font-bold">
                                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                                </div>
                                <h4 class="font-black text-lg text-gray-900 dark:text-white">Avatar Dicebear Nghệ Thuật</h4>
                                <p class="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">Hệ thống tạo hình đại diện phong cách Notionist độc bản theo tên hoặc email của riêng bạn.</p>
                            </div>
                        </div>
                    </div>

                    <!-- 2. KHOA HỌC NÃO BỘ & TRÍ NHỚ -->
                    <div v-if="activeSection === 'memory-science'" class="animate-fade-in space-y-8">
                        <div class="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
                            <div class="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 text-2xl font-black shadow-sm">
                                <i class="fa-solid fa-brain"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">2. Khoa Học Não Bộ & Bí Quyết Ghi Nhớ 90%+</h2>
                                <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-semibold mt-0.5">Khám phá cơ chế hoạt động của trí nhớ dài hạn và thuật toán HLR</p>
                            </div>
                        </div>

                        <!-- Theory 1: Ebbinghaus -->
                        <div class="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white space-y-4 shadow-lg">
                            <div class="flex flex-wrap items-center justify-between gap-2">
                                <span class="px-3.5 py-1 rounded-full text-xs font-black bg-white/15 text-cyan-300 border border-white/20">Định Luật Ebbinghaus</span>
                                <span class="text-xs sm:text-sm text-gray-300 font-mono font-bold">P(t) = 2^(-Δt / h)</span>
                            </div>
                            <h3 class="text-xl sm:text-2xl font-black text-white">Đường Cong Quên Lãng (The Forgetting Curve)</h3>
                            <p class="text-base text-gray-200 leading-relaxed font-medium">
                                Nhà tâm lý học Hermann Ebbinghaus đã chứng minh: <b>Sau 24 giờ, não bộ tự động xóa bỏ tới 70% từ mới học</b> nếu không có tác động gợi nhớ. Sau 1 tháng, bạn chỉ còn nhớ dưới 15%.
                            </p>
                            <div class="p-4 rounded-xl bg-white/10 border border-white/15 text-sm sm:text-base text-cyan-100 leading-relaxed font-medium">
                                🔬 <b>Giải pháp của ExtraQuiz:</b> Thuật toán <b>HLR (Half-Life Regression)</b> liên tục tính toán chu kỳ bán rã của từng từ và tự động "nhắc nhở" bạn ôn tập <b>đúng thời điểm sắp quên</b>, đưa trí nhớ phục hồi về 100%!
                            </div>
                        </div>

                        <!-- Comparison: Cramming vs Active Recall -->
                        <div class="space-y-4 pt-2">
                            <h3 class="font-black text-lg sm:text-xl text-gray-900 dark:text-white flex items-center gap-2.5">
                                <i class="fa-solid fa-scale-balanced text-indigo-600"></i>
                                So Sánh: Học Vẹt Nhồi Nhét vs. Học Khoa Học Não Bộ
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div class="p-6 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2.5">
                                    <div class="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-black text-base">
                                        <i class="fa-solid fa-circle-xmark text-rose-500 text-lg"></i>
                                        Học Vẹt Nhồi Nhét (Cramming)
                                    </div>
                                    <ul class="text-sm sm:text-base text-gray-700 dark:text-gray-300 space-y-1.5 pl-5 list-disc font-medium">
                                        <li>Đọc đi đọc lại một danh sách từ vựng dài dằng dặc.</li>
                                        <li>Tạo cảm giác "ảo tưởng là mình đã thuộc".</li>
                                        <li>Quên sạch 85% chỉ sau 3 đến 5 ngày thi xong.</li>
                                    </ul>
                                </div>

                                <div class="p-6 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-2.5">
                                    <div class="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-base">
                                        <i class="fa-solid fa-circle-check text-emerald-500 text-lg"></i>
                                        Chủ Động Truy Xuất (Active Recall)
                                    </div>
                                    <ul class="text-sm sm:text-base text-gray-700 dark:text-gray-300 space-y-1.5 pl-5 list-disc font-medium">
                                        <li>Bắt nơ-ron não bộ tự tìm kiếm đáp án trước khi lật thẻ.</li>
                                        <li>Tạo liên kết nơ-ron thần kinh bền vững và sâu sắc.</li>
                                        <li>Khắc sâu từ vựng vào <b>Trí nhớ dài hạn</b> vĩnh viễn.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. BÍ KÍP LEO RANK & SĂN BADGE -->
                    <div v-if="activeSection === 'gamification-guide'" class="animate-fade-in space-y-8">
                        <div class="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
                            <div class="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 text-2xl font-black shadow-sm">
                                <i class="fa-solid fa-trophy"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">3. Bí Kíp Leo Rank Thần Tốc & Săn Huy Hiệu</h2>
                                <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-semibold mt-0.5">Chiến lược tích lũy LexiCredit trọn đời và mở khóa toàn bộ 25 Cấp bậc</p>
                            </div>
                        </div>

                        <!-- LexiCredit Rules -->
                        <div class="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border border-amber-200 dark:border-amber-800/60 space-y-3.5 shadow-sm">
                            <h3 class="text-xl sm:text-2xl font-black text-amber-950 dark:text-amber-200 flex items-center gap-2.5">
                                <span class="text-2xl select-none">💎</span>
                                Công Thức Tính Điểm & Cấp Độ
                            </h3>
                            <p class="text-base text-gray-800 dark:text-gray-200 leading-relaxed font-semibold">
                                Điểm <b>LexiCredit (LC)</b> là thành quả trọn đời của bạn và <b>không bao giờ bị trừ đi</b>. Cứ tích lũy đủ <b>50 LexiCredit</b>, bạn sẽ thăng lên 1 Cấp Độ (Level) mới!
                            </p>
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-sm font-bold">
                                <div class="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-slate-700 shadow-sm">
                                    <div class="text-amber-600 dark:text-amber-400 text-base font-black">+10 LC</div>
                                    <div class="text-xs text-gray-600 dark:text-gray-400 font-semibold mt-1">Hoàn thành Flashcard</div>
                                </div>
                                <div class="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-slate-700 shadow-sm">
                                    <div class="text-emerald-600 dark:text-emerald-400 text-base font-black">+15 LC</div>
                                    <div class="text-xs text-gray-600 dark:text-gray-400 font-semibold mt-1">Đạt 100% Trắc nghiệm</div>
                                </div>
                                <div class="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-slate-700 shadow-sm">
                                    <div class="text-blue-600 dark:text-blue-400 text-base font-black">+20 LC</div>
                                    <div class="text-xs text-gray-600 dark:text-gray-400 font-semibold mt-1">Thắng Ghép Thẻ 3D</div>
                                </div>
                                <div class="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-slate-700 shadow-sm">
                                    <div class="text-purple-600 dark:text-purple-400 text-base font-black">+25 LC</div>
                                    <div class="text-xs text-gray-600 dark:text-gray-400 font-semibold mt-1">Chấm bài Writing AI</div>
                                </div>
                            </div>
                        </div>

                        <!-- 25 Ranks Showcase -->
                        <div class="space-y-3.5 pt-2">
                            <h3 class="font-black text-lg sm:text-xl text-gray-900 dark:text-white">Bảng Phân Hạng 25 Cấp Bậc (3D Rank Tier)</h3>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-sm">
                                <div class="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center gap-3.5">
                                    <span class="text-3xl select-none">🌱</span>
                                    <div><b class="text-gray-900 dark:text-white text-base">Tân Binh (Lv.1-3)</b><div class="text-xs text-gray-500 dark:text-gray-400 font-medium">0 - 150 LC</div></div>
                                </div>
                                <div class="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center gap-3.5">
                                    <span class="text-3xl select-none">🎓</span>
                                    <div><b class="text-gray-900 dark:text-white text-base">Tập Sự (Lv.4-6)</b><div class="text-xs text-gray-500 dark:text-gray-400 font-medium">150 - 300 LC</div></div>
                                </div>
                                <div class="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center gap-3.5">
                                    <span class="text-3xl select-none">📖</span>
                                    <div><b class="text-gray-900 dark:text-white text-base">Học Giả (Lv.7-12)</b><div class="text-xs text-gray-500 dark:text-gray-400 font-medium">300 - 600 LC</div></div>
                                </div>
                                <div class="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center gap-3.5">
                                    <span class="text-3xl select-none">📜</span>
                                    <div><b class="text-indigo-950 dark:text-indigo-200 text-base">Thông Thái (Lv.13-18)</b><div class="text-xs text-indigo-600 dark:text-indigo-400 font-bold">600 - 900 LC</div></div>
                                </div>
                                <div class="p-4 bg-purple-50/80 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 flex items-center gap-3.5">
                                    <span class="text-3xl select-none">🔮</span>
                                    <div><b class="text-purple-950 dark:text-purple-200 text-base">Bậc Thầy (Lv.19-24)</b><div class="text-xs text-purple-600 dark:text-purple-400 font-bold">900 - 1200 LC</div></div>
                                </div>
                                <div class="p-4 bg-amber-50/80 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-center gap-3.5">
                                    <span class="text-3xl select-none">👑</span>
                                    <div><b class="text-amber-950 dark:text-amber-200 text-base">Huyền Thoại (Lv.25+)</b><div class="text-xs text-amber-700 dark:text-amber-400 font-bold">1200+ LC</div></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 4. QUẢN LÝ THẺ & NHẬP HÀNG LOẠT -->
                    <div v-if="activeSection === 'decks-import'" class="animate-fade-in space-y-8">
                        <div class="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
                            <div class="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-black shadow-sm">
                                <i class="fa-solid fa-file-import"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">4. Quản Lý Thẻ & Nhập Hàng Loạt Chuẩn IELTS</h2>
                                <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-semibold mt-0.5">7 trường dữ liệu học thuật và bí quyết dán trực tiếp từ Excel / Google Sheets</p>
                            </div>
                        </div>

                        <div class="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <table class="min-w-full bg-white dark:bg-slate-900 text-sm sm:text-base">
                                <thead class="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th class="py-3.5 px-5 font-black text-gray-800 dark:text-gray-200 text-left">Cột Excel</th>
                                        <th class="py-3.5 px-5 font-black text-indigo-700 dark:text-indigo-300 text-left">Trường Dữ Liệu</th>
                                        <th class="py-3.5 px-5 font-black text-gray-800 dark:text-gray-200 text-left">Ví Dụ Mẫu</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                                    <tr><td class="py-3 px-5 font-bold text-gray-600 dark:text-gray-400">Cột 1</td><td class="py-3 px-5 font-black text-indigo-700 dark:text-indigo-300">Thuật ngữ tiếng Anh (*)</td><td class="py-3 px-5 font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-800/60 font-bold">Resilience</td></tr>
                                    <tr><td class="py-3 px-5 font-bold text-gray-600 dark:text-gray-400">Cột 2</td><td class="py-3 px-5 font-black text-indigo-700 dark:text-indigo-300">Định nghĩa tiếng Việt (*)</td><td class="py-3 px-5 font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-800/60 font-bold">Khả năng phục hồi, sự kiên cường</td></tr>
                                    <tr><td class="py-3 px-5 font-bold text-gray-600 dark:text-gray-400">Cột 3</td><td class="py-3 px-5 text-gray-700 dark:text-gray-300">Phiên âm IPA</td><td class="py-3 px-5 font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-800/60">/rɪˈzɪliəns/</td></tr>
                                    <tr><td class="py-3 px-5 font-bold text-gray-600 dark:text-gray-400">Cột 4</td><td class="py-3 px-5 text-gray-700 dark:text-gray-300">Loại từ (Part of Speech)</td><td class="py-3 px-5 font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-800/60">noun</td></tr>
                                    <tr><td class="py-3 px-5 font-bold text-gray-600 dark:text-gray-400">Cột 5</td><td class="py-3 px-5 text-gray-700 dark:text-gray-300">Cụm từ Collocation</td><td class="py-3 px-5 font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-800/60">emotional resilience</td></tr>
                                    <tr><td class="py-3 px-5 font-bold text-gray-600 dark:text-gray-400">Cột 6</td><td class="py-3 px-5 text-gray-700 dark:text-gray-300">Từ đồng nghĩa Synonyms</td><td class="py-3 px-5 font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-800/60">toughness, adaptability</td></tr>
                                    <tr><td class="py-3 px-5 font-bold text-gray-600 dark:text-gray-400">Cột 7</td><td class="py-3 px-5 text-gray-700 dark:text-gray-300">Ví dụ ngữ cảnh thực tế</td><td class="py-3 px-5 font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-800/60">Her resilience helped her overcome adversity.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-base text-indigo-950 dark:text-indigo-200 space-y-1.5">
                            <p><b>✨ Tuyệt chiêu AI Auto-fill:</b> Bạn chỉ cần paste danh sách từ ở Cột 1, sau đó bấm nút <b>"Master Checkbox" $\rightarrow$ "AI Tự điền hàng loạt"</b>. Trí tuệ nhân tạo sẽ tự động điền trọn vẹn cả 6 cột còn lại chỉ trong vài giây!</p>
                        </div>
                    </div>

                    <!-- 5. CÁC CHẾ ĐỘ HỌC TẬP -->
                    <div v-if="activeSection === 'study-modes'" class="animate-fade-in space-y-8">
                        <div class="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
                            <div class="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-2xl font-black shadow-sm">
                                <i class="fa-solid fa-gamepad"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">5. Các Chế Độ Học Tập Chuyên Sâu</h2>
                                <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-semibold mt-0.5">Luyện tập đa giác quan từ nhận diện mắt đến phát âm và phản xạ tay</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div class="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 shadow-sm space-y-2.5">
                                <div class="flex items-center gap-3.5">
                                    <div class="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-lg font-bold">
                                        <i class="fa-solid fa-layer-group"></i>
                                    </div>
                                    <h4 class="font-black text-lg text-gray-900 dark:text-white">Lật Thẻ 3D (Flashcards)</h4>
                                </div>
                                <p class="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">Đánh giá 3 cấp độ (Khó / Vừa / Dễ). Thuật toán Ebbinghaus tự xếp lại lịch nhắc ôn tương ứng.</p>
                            </div>

                            <div class="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 shadow-sm space-y-2.5">
                                <div class="flex items-center gap-3.5">
                                    <div class="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center text-lg font-bold">
                                        <i class="fa-solid fa-list-check"></i>
                                    </div>
                                    <h4 class="font-black text-lg text-gray-900 dark:text-white">Trắc Nghiệm (Quiz Pro)</h4>
                                </div>
                                <p class="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">Luyện phản xạ nhận diện nghĩa với 4 đáp án gây nhiễu thông minh, tính thời gian phản xạ (Latency).</p>
                            </div>

                            <div class="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 shadow-sm space-y-2.5">
                                <div class="flex items-center gap-3.5">
                                    <div class="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center text-lg font-bold">
                                        <i class="fa-solid fa-keyboard"></i>
                                    </div>
                                    <h4 class="font-black text-lg text-gray-900 dark:text-white">Gõ Chính Tả (Dictation)</h4>
                                </div>
                                <p class="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">Nghe âm thanh phát âm bản ngữ và tự gõ chính xác 100% chính tả (Spelling), khắc phục lỗi sai chính tả.</p>
                            </div>

                            <div class="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 shadow-sm space-y-2.5">
                                <div class="flex items-center gap-3.5">
                                    <div class="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center text-lg font-bold">
                                        <i class="fa-solid fa-puzzle-piece"></i>
                                    </div>
                                    <h4 class="font-black text-lg text-gray-900 dark:text-white">Ghép Thẻ Tốc Độ (Matching Game)</h4>
                                </div>
                                <p class="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">Kéo thả các thẻ từ và định nghĩa bay lơ lửng để triệt tiêu chúng. Rèn luyện phản xạ nhanh như tia chớp.</p>
                            </div>
                        </div>
                    </div>

                    <!-- 6. HỆ SINH THÁI AI -->
                    <div v-if="activeSection === 'ai-features'" class="animate-fade-in space-y-8">
                        <div class="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
                            <div class="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-100 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-2xl font-black shadow-sm">
                                <i class="fa-solid fa-wand-magic-sparkles"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">6. Hệ Sinh Thái AI Trợ Giảng Toàn Năng</h2>
                                <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-semibold mt-0.5">Tích hợp mô hình ngôn ngữ lớn biến ExtraQuiz thành gia sư 1-1 riêng biệt</p>
                            </div>
                        </div>

                        <div class="space-y-5">
                            <div class="p-6 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-gray-700 space-y-2.5">
                                <h4 class="font-black text-lg text-indigo-700 dark:text-indigo-400 flex items-center gap-2.5">
                                    <i class="fa-solid fa-pen-nib"></i> AI Chấm Điểm IELTS Writing (Band 8.0+ Rewriter)
                                </h4>
                                <p class="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                    Chấm điểm chi tiết theo 4 tiêu chí giám khảo quốc tế (Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range). Đặc biệt, AI tự động viết lại bài văn mẫu đạt chuẩn <b>Band 8.0+</b> dựa trên chính ý tưởng của bạn!
                                </p>
                            </div>

                            <div class="p-6 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-gray-700 space-y-2.5">
                                <h4 class="font-black text-lg text-purple-700 dark:text-purple-400 flex items-center gap-2.5">
                                    <i class="fa-solid fa-arrows-rotate"></i> AI Paraphrasing Coach (Nâng Cấp Câu Văn)
                                </h4>
                                <p class="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                    Biến đổi những câu nói đơn giản thành 3 cấp độ diễn đạt sang trọng: Band 6.0 $\rightarrow$ Band 7.0 $\rightarrow$ Band 8.5+ với từ vựng học thuật đỉnh cao.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- 7. PERSONA -->
                    <div v-if="activeSection === 'persona-dna'" class="animate-fade-in space-y-8">
                        <div class="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
                            <div class="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 text-2xl font-black shadow-sm">
                                <i class="fa-solid fa-brain"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">7. Hồ Sơ AI Tâm Lý Học (Learning Persona)</h2>
                                <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-semibold mt-0.5">Hệ thống phân tích hành vi học tập ngầm để phác họa chân dung người học</p>
                            </div>
                        </div>

                        <div class="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 space-y-5 shadow-sm">
                            <h4 class="font-black text-base sm:text-lg text-gray-900 dark:text-white uppercase tracking-wider">4 Chỉ Số Tâm Lý Trên Radar Chart</h4>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
                                <div class="p-4 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/60">
                                    <b class="text-blue-950 dark:text-blue-200 text-base">1. Tính Kiên Định (Consistency)</b>
                                    <p class="text-gray-700 dark:text-gray-300 mt-1 font-medium">Đo lường sự đều đặn vào app học mỗi ngày, duy trì chuỗi Streak.</p>
                                </div>
                                <div class="p-4 bg-red-50/80 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900/60">
                                    <b class="text-red-950 dark:text-red-200 text-base">2. Độ Tập Trung (Focus)</b>
                                    <p class="text-gray-700 dark:text-gray-300 mt-1 font-medium">Đo tốc độ phản xạ và loại bỏ tình trạng ngâm màn hình quá 30 giây.</p>
                                </div>
                                <div class="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/60">
                                    <b class="text-emerald-950 dark:text-emerald-200 text-base">3. Sự Bền Bỉ (Persistence)</b>
                                    <p class="text-gray-700 dark:text-gray-300 mt-1 font-medium">Khắc phục thói quen Rage-click khi làm sai, khuyến khích đọc kỹ phân tích.</p>
                                </div>
                                <div class="p-4 bg-amber-50/80 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/60">
                                    <b class="text-amber-950 dark:text-amber-200 text-base">4. Tự Nhận Thức (Metacognition)</b>
                                    <p class="text-gray-700 dark:text-gray-300 mt-1 font-medium">Khả năng tự đánh giá chính xác mức độ khó/dễ của từ vựng.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `
};
