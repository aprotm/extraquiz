import { ref } from 'vue';
import { store } from '../store.js';

export default {
    setup() {
        const activeSection = ref('getting-started');

        const sections = [
            { id: 'getting-started', title: '🚀 Khởi Động & Cài Đặt', icon: 'fa-solid fa-rocket' },
            { id: 'memory-science', title: '🧠 Khoa Học Não Bộ & Trí Nhớ', icon: 'fa-solid fa-brain' },
            { id: 'gamification-guide', title: '⚡ Bí Kíp Leo Rank & Săn Badge', icon: 'fa-solid fa-trophy' },
            { id: 'decks-import', title: '🗂️ Quản Lý Thẻ & Nhập Hàng Loạt', icon: 'fa-solid fa-file-import' },
            { id: 'study-modes', title: '🎮 Các Chế Độ Học Tập', icon: 'fa-solid fa-gamepad' },
            { id: 'ai-features', title: '🤖 Hệ Sinh Thái AI Thông Minh', icon: 'fa-solid fa-wand-magic-sparkles' },
            { id: 'persona-dna', title: '🧬 Hồ Sơ AI Tâm Lý Học', icon: 'fa-solid fa-brain' }
        ];

        const goBack = () => {
            store.navigate('dashboard');
        };

        return { store, activeSection, sections, goBack };
    },
    template: `
        <div class="h-full flex flex-col max-w-6xl mx-auto w-full p-4 lg:p-8 animate-fade-in pb-24 select-none">
            
            <!-- Header -->
            <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-4">
                    <button @click="goBack" class="w-10 h-10 flex items-center justify-center rounded-2xl bg-white shadow-sm hover:bg-purple-50 transition text-gray-500 hover:text-purple-600 border border-gray-100">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <div class="flex items-center gap-2">
                            <h1 class="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                <span class="text-2xl select-none">📚</span>
                                Sổ Tay Hướng Dẫn ExtraQuiz Pro
                            </h1>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 uppercase tracking-wider">Cẩm Nang 2026</span>
                        </div>
                        <p class="text-sm text-gray-500 font-medium mt-1">Phương pháp học tập não bộ khoa học & Hướng dẫn toàn diện mọi tính năng</p>
                    </div>
                </div>

                <button @click="store.navigate('quotes')" class="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all">
                    <i class="fa-solid fa-sparkles"></i>
                    <span>Góc Động Lực</span>
                </button>
            </div>

            <div class="flex flex-col lg:flex-row gap-8 items-start">
                
                <!-- Sidebar Menu -->
                <div class="w-full lg:w-72 glass-panel p-3.5 rounded-3xl flex-shrink-0 sticky top-24 z-10 bg-white border border-gray-100 shadow-sm">
                    <div class="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                        Danh Mục Hướng Dẫn
                    </div>
                    <nav class="flex flex-col gap-1.5">
                        <button v-for="sec in sections" :key="sec.id" 
                                @click="activeSection = sec.id"
                                class="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left group"
                                :class="activeSection === sec.id ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'">
                            <div class="w-6 flex justify-center text-sm" :class="activeSection === sec.id ? 'text-white' : 'text-indigo-500 group-hover:scale-110 transition-transform'">
                                <i :class="sec.icon"></i>
                            </div>
                            <span class="truncate">{{ sec.title }}</span>
                        </button>
                    </nav>

                    <div class="mt-4 p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-center">
                        <p class="text-[11px] font-bold text-indigo-900 mb-1">Cần hỗ trợ trực tiếp?</p>
                        <p class="text-[10px] text-gray-500 mb-2">Đội ngũ AI Coach luôn sẵn sàng 24/7</p>
                        <button @click="store.navigate('lexilearn-dashboard')" class="w-full py-1.5 rounded-xl bg-indigo-600 text-white text-[10px] font-extrabold uppercase hover:bg-indigo-700 transition">
                            Vào AI Lab Pro
                        </button>
                    </div>
                </div>

                <!-- Main Content Area -->
                <div class="flex-1 w-full glass-panel-strong p-6 lg:p-10 rounded-3xl min-h-[65vh] text-base leading-relaxed bg-white border border-gray-100 shadow-sm">
                    
                    <!-- 1. KHỞI ĐỘNG & CÀI ĐẶT -->
                    <div v-if="activeSection === 'getting-started'" class="animate-fade-in space-y-6">
                        <div class="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-xl">
                                <i class="fa-solid fa-rocket"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl font-black text-gray-900">1. Khởi Động & Cá Nhân Hóa Không Gian Học</h2>
                                <p class="text-xs text-gray-500 font-medium">Thiết lập môi trường học tập lý tưởng nhất cho não bộ của bạn</p>
                            </div>
                        </div>
                        
                        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-2xl">
                            <p class="text-indigo-900 text-sm font-medium m-0 leading-relaxed">
                                <strong>💡 Mẹo tâm lý học:</strong> Môi trường học tập gọn gàng, âm thanh phát âm rõ ràng và màu sắc hợp tâm trạng giúp tăng khả năng tập trung (Attention Span) lên tới <strong>40%</strong>!
                            </p>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div class="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                                <div class="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                    <i class="fa-solid fa-moon"></i>
                                </div>
                                <h4 class="font-extrabold text-sm text-gray-900">Chế Độ Tối (Dark Mode)</h4>
                                <p class="text-xs text-gray-600 leading-relaxed">Giảm ánh sáng xanh, chống mỏi mắt khi học từ vựng ban đêm hoặc trong không gian tối.</p>
                            </div>

                            <div class="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                                <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                                    <i class="fa-solid fa-volume-high"></i>
                                </div>
                                <h4 class="font-extrabold text-sm text-gray-900">Giọng Đọc Chuẩn Bản Xứ (Voice TTS)</h4>
                                <p class="text-xs text-gray-600 leading-relaxed">Tùy chọn giữa giọng Anh-Mỹ (US) và Anh-Anh (UK) để làm quen ngữ điệu bài thi IELTS/TOEIC.</p>
                            </div>

                            <div class="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                                <div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                                    <i class="fa-solid fa-shield-heart"></i>
                                </div>
                                <h4 class="font-extrabold text-sm text-gray-900">Focus Mode (Siêu Tập Trung)</h4>
                                <p class="text-xs text-gray-600 leading-relaxed">Ẩn toàn bộ thanh menu và thông báo gây xao nhãng, chỉ hiển thị duy nhất thẻ học trước mắt bạn.</p>
                            </div>

                            <div class="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                                <div class="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
                                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                                </div>
                                <h4 class="font-extrabold text-sm text-gray-900">Avatar Dicebear Nghệ Thuật</h4>
                                <p class="text-xs text-gray-600 leading-relaxed">Hệ thống tạo hình đại diện phong cách Notionist độc bản theo tên hoặc email của riêng bạn.</p>
                            </div>
                        </div>
                    </div>

                    <!-- 2. KHOA HỌC NÃO BỘ & TRÍ NHỚ -->
                    <div v-if="activeSection === 'memory-science'" class="animate-fade-in space-y-6">
                        <div class="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div class="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 text-xl">
                                <i class="fa-solid fa-brain"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl font-black text-gray-900">2. Khoa Học Não Bộ & Bí Quyết Ghi Nhớ 90%+</h2>
                                <p class="text-xs text-gray-500 font-medium">Khám phá cơ chế hoạt động của trí nhớ dài hạn và thuật toán HLR</p>
                            </div>
                        </div>

                        <!-- Theory 1: Ebbinghaus -->
                        <div class="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 to-[#111628] text-white space-y-4">
                            <div class="flex items-center justify-between">
                                <span class="px-3 py-1 rounded-full text-xs font-black bg-white/10 text-cyan-300 border border-white/10">Định Luật Ebbinghaus</span>
                                <span class="text-xs text-gray-400 font-mono">P(t) = 2^(-Δt / h)</span>
                            </div>
                            <h3 class="text-xl font-black text-white">Đường Cong Quên Lãng (The Forgetting Curve)</h3>
                            <p class="text-sm text-gray-300 leading-relaxed">
                                Nhà tâm lý học Hermann Ebbinghaus đã chứng minh: <b>Sau 24 giờ, não bộ con người tự động xóa bỏ tới 70% lượng từ vựng mới học</b> nếu không có tác động gợi nhớ. Sau 1 tháng, bạn chỉ còn nhớ vỏn vẹn dưới 15%.
                            </p>
                            <div class="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-cyan-200 leading-relaxed">
                                🔬 <b>Giải pháp của ExtraQuiz:</b> Thuật toán <b>HLR (Half-Life Regression)</b> liên tục tính toán chu kỳ bán rã của từng từ và tự động "nhắc nhở" bạn ôn tập <b>đúng vào thời điểm bạn sắp quên</b>, đưa trí nhớ vọt trở lại 100% với nỗ lực tối thiểu!
                            </div>
                        </div>

                        <!-- Comparison: Cramming vs Active Recall -->
                        <div class="space-y-3 pt-2">
                            <h3 class="font-extrabold text-base text-gray-900 flex items-center gap-2">
                                <i class="fa-solid fa-scale-balanced text-indigo-600"></i>
                                So Sánh: Học Vẹt Nhồi Nhét vs. Học Khoa Học Não Bộ
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="p-5 rounded-2xl bg-rose-50/70 border border-rose-100 space-y-2">
                                    <div class="flex items-center gap-2 text-rose-700 font-extrabold text-sm">
                                        <i class="fa-solid fa-circle-xmark text-rose-500"></i>
                                        Học Vẹt Nhồi Nhét (Cramming)
                                    </div>
                                    <ul class="text-xs text-gray-700 space-y-1.5 pl-4 list-disc">
                                        <li>Đọc đi đọc lại một danh sách từ vựng dài dằng dặc.</li>
                                        <li>Tạo cảm giác "ảo tưởng là mình đã thuộc" (Illusion of Competence).</li>
                                        <li>Quên sạch 85% chỉ sau 3 đến 5 ngày thi xong.</li>
                                    </ul>
                                </div>

                                <div class="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-2">
                                    <div class="flex items-center gap-2 text-emerald-700 font-extrabold text-sm">
                                        <i class="fa-solid fa-circle-check text-emerald-500"></i>
                                        Chủ Động Truy Xuất (Active Recall)
                                    </div>
                                    <ul class="text-xs text-gray-700 space-y-1.5 pl-4 list-disc">
                                        <li>Bắt não bộ tự tìm kiếm đáp án trước khi lật thẻ.</li>
                                        <li>Tạo liên kết nơ-ron thần kinh bền vững và sâu sắc.</li>
                                        <li>Khắc sâu từ vựng vào <b>Trí nhớ dài hạn (Long-term Memory)</b> vĩnh viễn.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. BÍ KÍP LEO RANK & SĂN BADGE -->
                    <div v-if="activeSection === 'gamification-guide'" class="animate-fade-in space-y-6">
                        <div class="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div class="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 text-xl">
                                <i class="fa-solid fa-trophy"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl font-black text-gray-900">3. Bí Kíp Leo Rank Thần Tốc & Săn Huy Hiệu</h2>
                                <p class="text-xs text-gray-500 font-medium">Chiến lược tích lũy LexiCredit trọn đời và mở khóa toàn bộ 25 Cấp bậc</p>
                            </div>
                        </div>

                        <!-- LexiCredit Rules -->
                        <div class="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 space-y-3">
                            <h3 class="text-lg font-black text-amber-900 flex items-center gap-2">
                                <span class="text-xl select-none">💎</span>
                                Công Thức Tính Điểm & Cấp Độ
                            </h3>
                            <p class="text-xs text-gray-700 leading-relaxed">
                                Điểm <b>LexiCredit (LC)</b> là thành quả trọn đời của bạn và <b>không bao giờ bị reset hay trừ đi</b>. Cứ tích lũy đủ <b>50 LexiCredit</b>, bạn sẽ thăng lên 1 Cấp Độ (Level) mới!
                            </p>
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs font-bold">
                                <div class="p-2.5 bg-white rounded-xl border border-amber-100 shadow-sm">
                                    <div class="text-amber-600 text-sm font-black">+10 LC</div>
                                    <div class="text-[10px] text-gray-500 mt-0.5">Hoàn thành phiên Flashcard</div>
                                </div>
                                <div class="p-2.5 bg-white rounded-xl border border-amber-100 shadow-sm">
                                    <div class="text-emerald-600 text-sm font-black">+15 LC</div>
                                    <div class="text-[10px] text-gray-500 mt-0.5">Đạt 100% điểm Trắc nghiệm</div>
                                </div>
                                <div class="p-2.5 bg-white rounded-xl border border-amber-100 shadow-sm">
                                    <div class="text-blue-600 text-sm font-black">+20 LC</div>
                                    <div class="text-[10px] text-gray-500 mt-0.5">Thắng Ghép Thẻ tốc độ cao</div>
                                </div>
                                <div class="p-2.5 bg-white rounded-xl border border-amber-100 shadow-sm">
                                    <div class="text-purple-600 text-sm font-black">+25 LC</div>
                                    <div class="text-[10px] text-gray-500 mt-0.5">Chấm bài IELTS Writing AI</div>
                                </div>
                            </div>
                        </div>

                        <!-- 25 Ranks Showcase -->
                        <div class="space-y-3 pt-2">
                            <h3 class="font-extrabold text-base text-gray-900">Bảng Phân Hạng 25 Cấp Bậc (3D Rank Tier)</h3>
                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                <div class="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2.5">
                                    <span class="text-2xl select-none">🌱</span>
                                    <div><b class="text-gray-900">Tân Binh (Lv.1-3)</b><div class="text-[10px] text-gray-400">0 - 150 LC</div></div>
                                </div>
                                <div class="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2.5">
                                    <span class="text-2xl select-none">🎓</span>
                                    <div><b class="text-gray-900">Tập Sự (Lv.4-6)</b><div class="text-[10px] text-gray-400">150 - 300 LC</div></div>
                                </div>
                                <div class="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2.5">
                                    <span class="text-2xl select-none">📖</span>
                                    <div><b class="text-gray-900">Học Giả (Lv.7-12)</b><div class="text-[10px] text-gray-400">300 - 600 LC</div></div>
                                </div>
                                <div class="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center gap-2.5">
                                    <span class="text-2xl select-none">📜</span>
                                    <div><b class="text-indigo-900">Thông Thái (Lv.13-18)</b><div class="text-[10px] text-indigo-500">600 - 900 LC</div></div>
                                </div>
                                <div class="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center gap-2.5">
                                    <span class="text-2xl select-none">🔮</span>
                                    <div><b class="text-purple-900">Bậc Thầy (Lv.19-24)</b><div class="text-[10px] text-purple-500">900 - 1200 LC</div></div>
                                </div>
                                <div class="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center gap-2.5">
                                    <span class="text-2xl select-none">👑</span>
                                    <div><b class="text-amber-900">Huyền Thoại (Lv.25+)</b><div class="text-[10px] text-amber-600">1200+ LC</div></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 4. QUẢN LÝ THẺ & NHẬP HÀNG LOẠT -->
                    <div v-if="activeSection === 'decks-import'" class="animate-fade-in space-y-6">
                        <div class="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div class="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl">
                                <i class="fa-solid fa-file-import"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl font-black text-gray-900">4. Quản Lý Thẻ & Nhập Liệu Hàng Loạt Chuẩn IELTS</h2>
                                <p class="text-xs text-gray-500 font-medium">7 trường dữ liệu học thuật và bí quyết dán trực tiếp từ Excel / Google Sheets</p>
                            </div>
                        </div>

                        <div class="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
                            <table class="min-w-full bg-white text-xs">
                                <thead class="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th class="py-3 px-4 font-extrabold text-gray-700 text-left">Cột Excel</th>
                                        <th class="py-3 px-4 font-extrabold text-indigo-600 text-left">Trường Dữ Liệu</th>
                                        <th class="py-3 px-4 font-extrabold text-gray-700 text-left">Ví Dụ Mẫu</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100">
                                    <tr><td class="py-2.5 px-4 font-bold text-gray-500">Cột 1</td><td class="py-2.5 px-4 font-bold text-indigo-700">Thuật ngữ tiếng Anh (*)</td><td class="py-2.5 px-4 font-mono text-gray-700 bg-gray-50">Resilience</td></tr>
                                    <tr><td class="py-2.5 px-4 font-bold text-gray-500">Cột 2</td><td class="py-2.5 px-4 font-bold text-indigo-700">Định nghĩa tiếng Việt (*)</td><td class="py-2.5 px-4 font-mono text-gray-700 bg-gray-50">Khả năng phục hồi, sự kiên cường</td></tr>
                                    <tr><td class="py-2.5 px-4 font-bold text-gray-500">Cột 3</td><td class="py-2.5 px-4 text-gray-700">Phiên âm IPA</td><td class="py-2.5 px-4 font-mono text-gray-700 bg-gray-50">/rɪˈzɪliəns/</td></tr>
                                    <tr><td class="py-2.5 px-4 font-bold text-gray-500">Cột 4</td><td class="py-2.5 px-4 text-gray-700">Loại từ (Part of Speech)</td><td class="py-2.5 px-4 font-mono text-gray-700 bg-gray-50">noun</td></tr>
                                    <tr><td class="py-2.5 px-4 font-bold text-gray-500">Cột 5</td><td class="py-2.5 px-4 text-gray-700">Cụm từ Collocation</td><td class="py-2.5 px-4 font-mono text-gray-700 bg-gray-50">emotional resilience</td></tr>
                                    <tr><td class="py-2.5 px-4 font-bold text-gray-500">Cột 6</td><td class="py-2.5 px-4 text-gray-700">Từ đồng nghĩa Synonyms</td><td class="py-2.5 px-4 font-mono text-gray-700 bg-gray-50">toughness, adaptability</td></tr>
                                    <tr><td class="py-2.5 px-4 font-bold text-gray-500">Cột 7</td><td class="py-2.5 px-4 text-gray-700">Ví dụ ngữ cảnh thực tế</td><td class="py-2.5 px-4 font-mono text-gray-700 bg-gray-50">Her resilience helped her overcome adversity.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 space-y-1">
                            <p><b>✨ Tuyệt chiêu AI Auto-fill:</b> Bạn chỉ cần paste danh sách từ ở Cột 1, sau đó bấm nút <b>"Master Checkbox" $\rightarrow$ "AI Tự điền hàng loạt"</b>. Trí tuệ nhân tạo sẽ tự động điền trọn vẹn cả 6 cột còn lại chỉ trong 5 giây!</p>
                        </div>
                    </div>

                    <!-- 5. CÁC CHẾ ĐỘ HỌC TẬP -->
                    <div v-if="activeSection === 'study-modes'" class="animate-fade-in space-y-6">
                        <div class="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-xl">
                                <i class="fa-solid fa-gamepad"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl font-black text-gray-900">5. Các Chế Độ Học Tập Chuyên Sâu</h2>
                                <p class="text-xs text-gray-500 font-medium">Luyện tập đa giác quan từ nhận diện mắt đến phát âm và phản xạ tay</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-2">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                        <i class="fa-solid fa-layer-group"></i>
                                    </div>
                                    <h4 class="font-extrabold text-sm text-gray-900">Lật Thẻ 3D (Flashcards)</h4>
                                </div>
                                <p class="text-xs text-gray-600 leading-relaxed">Đánh giá 3 cấp độ (Khó / Vừa / Dễ). Hệ thống tự động xếp lại lịch ôn tập tương ứng theo thuật toán Ebbinghaus.</p>
                            </div>

                            <div class="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-2">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                        <i class="fa-solid fa-list-check"></i>
                                    </div>
                                    <h4 class="font-extrabold text-sm text-gray-900">Trắc Nghiệm (Quiz Pro)</h4>
                                </div>
                                <p class="text-xs text-gray-600 leading-relaxed">Luyện phản xạ nhận diện nghĩa với 4 đáp án gây nhiễu thông minh, tính thời gian phản xạ (Latency).</p>
                            </div>

                            <div class="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-2">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                                        <i class="fa-solid fa-keyboard"></i>
                                    </div>
                                    <h4 class="font-extrabold text-sm text-gray-900">Gõ Chính Tả (Dictation)</h4>
                                </div>
                                <p class="text-xs text-gray-600 leading-relaxed">Nghe âm thanh phát âm bản ngữ và tự gõ chính xác 100% chính tả (Spelling). Tuyệt chiêu khắc phục lỗi viết sai chính tả.</p>
                            </div>

                            <div class="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-2">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                                        <i class="fa-solid fa-puzzle-piece"></i>
                                    </div>
                                    <h4 class="font-extrabold text-sm text-gray-900">Ghép Thẻ Tốc Độ (Matching Game)</h4>
                                </div>
                                <p class="text-xs text-gray-600 leading-relaxed">Kéo thả các thẻ từ và định nghĩa bay lơ lửng để triệt tiêu chúng. Rèn luyện tốc độ kết nối ý nghĩa nhanh như tia chớp.</p>
                            </div>
                        </div>
                    </div>

                    <!-- 6. HỆ SINH THÁI AI -->
                    <div v-if="activeSection === 'ai-features'" class="animate-fade-in space-y-6">
                        <div class="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div class="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 text-xl">
                                <i class="fa-solid fa-wand-magic-sparkles"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl font-black text-gray-900">6. Hệ Sinh Thái AI Trợ Giảng Toàn Năng</h2>
                                <p class="text-xs text-gray-500 font-medium">Tích hợp mô hình ngôn ngữ lớn biến ExtraQuiz thành gia sư 1-1 riêng biệt</p>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div class="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                                <h4 class="font-extrabold text-sm text-indigo-700 flex items-center gap-2">
                                    <i class="fa-solid fa-pen-nib"></i> AI Chấm Điểm IELTS Writing (Band 8.0+ Rewriter)
                                </h4>
                                <p class="text-xs text-gray-600 leading-relaxed">
                                    Chấm điểm chi tiết theo 4 tiêu chí giám khảo quốc tế (Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range). Đặc biệt, AI tự động viết lại bài văn mẫu đạt chuẩn <b>Band 8.0+</b> dựa trên chính ý tưởng của bạn!
                                </p>
                            </div>

                            <div class="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                                <h4 class="font-extrabold text-sm text-purple-700 flex items-center gap-2">
                                    <i class="fa-solid fa-arrows-rotate"></i> AI Paraphrasing Coach (Nâng Cấp Câu Văn)
                                </h4>
                                <p class="text-xs text-gray-600 leading-relaxed">
                                    Biến đổi những câu nói đơn giản thành 3 cấp độ diễn đạt sang trọng: Band 6.0 $\rightarrow$ Band 7.0 $\rightarrow$ Band 8.5+ với từ vựng học thuật đỉnh cao.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- 7. PERSONA -->
                    <div v-if="activeSection === 'persona-dna'" class="animate-fade-in space-y-6">
                        <div class="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div class="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 text-xl">
                                <i class="fa-solid fa-brain"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl font-black text-gray-900">7. Hồ Sơ AI Tâm Lý Học (Learning Persona)</h2>
                                <p class="text-xs text-gray-500 font-medium">Hệ thống phân tích hành vi học tập ngầm để phác họa chân dung người học</p>
                            </div>
                        </div>

                        <div class="p-6 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-sm">
                            <h4 class="font-bold text-sm text-gray-900 uppercase tracking-wider">4 Chỉ Số Tâm Lý Trên Radar Chart</h4>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div class="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                                    <b class="text-blue-900">1. Tính Kiên Định (Consistency)</b>
                                    <p class="text-gray-600 mt-1">Đo lường sự đều đặn vào app học mỗi ngày, duy trì chuỗi Streak.</p>
                                </div>
                                <div class="p-3 bg-red-50/60 rounded-xl border border-red-100">
                                    <b class="text-red-900">2. Độ Tập Trung (Focus)</b>
                                    <p class="text-gray-600 mt-1">Đo tốc độ phản xạ và loại bỏ tình trạng ngâm màn hình quá 30 giây.</p>
                                </div>
                                <div class="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                                    <b class="text-emerald-900">3. Sự Bền Bỉ (Persistence)</b>
                                    <p class="text-gray-600 mt-1">Khắc phục thói quen Rage-click khi làm sai, khuyến khích đọc kỹ phân tích.</p>
                                </div>
                                <div class="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                                    <b class="text-amber-900">4. Tự Nhận Thức (Metacognition)</b>
                                    <p class="text-gray-600 mt-1">Khả năng tự đánh giá chính xác mức độ khó/dễ của từ vựng.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `
};
