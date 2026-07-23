import { ref } from 'vue';
import { store } from '../store.js';

export default {
    setup() {
        const activeSection = ref('getting-started');

        const sections = [
            { id: 'getting-started', title: '🚀 Khởi động & Cài đặt', icon: 'fa-solid fa-rocket' },
            { id: 'decks-import', title: '🗂️ Quản lý Thẻ & Nhập liệu', icon: 'fa-solid fa-file-import' },
            { id: 'study-modes', title: '🎮 Các chế độ học tập', icon: 'fa-solid fa-gamepad' },
            { id: 'ai-features', title: '🤖 Hệ sinh thái AI', icon: 'fa-solid fa-wand-magic-sparkles' },
            { id: 'gamification', title: '🏆 Xếp hạng & Huy hiệu', icon: 'fa-solid fa-trophy' },
            { id: 'persona-dna', title: '🧬 Hồ sơ AI Tâm lý', icon: 'fa-solid fa-brain' }
        ];

        const goBack = () => {
            store.navigate('dashboard');
        };

        return { store, activeSection, sections, goBack };
    },
    template: `
        <div class="h-full flex flex-col max-w-6xl mx-auto w-full p-4 lg:p-8 animate-fade-in pb-24">
            
            <!-- Header -->
            <div class="flex items-center gap-4 mb-8">
                <button @click="goBack" class="w-10 h-10 flex items-center justify-center rounded-2xl bg-white shadow-sm hover:bg-purple-50 transition text-gray-500 hover:text-purple-600">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <div>
                    <h1 class="text-2xl font-black text-gray-900 tracking-tight">Sổ tay Hướng dẫn (Pro)</h1>
                    <p class="text-sm text-gray-500 font-medium mt-1">Tài liệu chính thức dành cho người dùng ExtraQuiz</p>
                </div>
            </div>

            <div class="flex flex-col lg:flex-row gap-8 items-start">
                
                <!-- Sidebar Menu -->
                <div class="w-full lg:w-64 glass-panel p-4 rounded-3xl flex-shrink-0 sticky top-24 z-10">
                    <nav class="flex flex-col gap-2">
                        <button v-for="sec in sections" :key="sec.id" 
                                @click="activeSection = sec.id"
                                class="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left"
                                :class="activeSection === sec.id ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'">
                            <div class="w-6 flex justify-center">
                                <i :class="sec.icon" :style="activeSection === sec.id ? 'color: #6d55d1;' : ''"></i>
                            </div>
                            {{ sec.title }}
                        </button>
                    </nav>
                </div>

                <!-- Main Content Area -->
                <div class="flex-1 w-full glass-panel-strong p-6 lg:p-12 rounded-3xl min-h-[60vh] text-base leading-relaxed">
                    
                    <!-- 1. Khởi động & Cài đặt -->
                    <div v-if="activeSection === 'getting-started'" class="animate-fade-in">
                        <h2 class="text-2xl lg:text-3xl font-black mb-6 text-gray-800 border-b pb-4">1. Khởi động & Cài đặt</h2>
                        
                        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl mb-6">
                            <p class="text-blue-800 text-sm m-0"><strong>💡 Lời khuyên:</strong> Hãy cá nhân hóa không gian học tập của bạn trước khi bắt đầu để có cảm hứng tốt nhất!</p>
                        </div>

                        <h3 class="font-bold text-xl text-purple-600 mt-8 mb-3">Tùy chỉnh Giao diện & Trải nghiệm</h3>
                        <p class="text-gray-700 mb-4">
                            Tại màn hình <strong>Dashboard</strong>, nhấp vào biểu tượng <strong>Bánh răng (Settings)</strong> <i class="fa-solid fa-gear text-gray-500 mx-1"></i> ở góc phải để mở bảng điều khiển cá nhân hóa:
                        </p>
                        <ul class="space-y-4 text-gray-700 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <li class="flex items-start gap-3">
                                <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5"><i class="fa-solid fa-moon text-indigo-500"></i></div> 
                                <div><strong>Chế độ tối (Dark Mode):</strong> Bảo vệ mắt khi học ban đêm. Giao diện sẽ chuyển sang các tone màu Slate tĩnh tâm.</div>
                            </li>
                            <li class="flex items-start gap-3">
                                <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5"><i class="fa-solid fa-volume-high text-green-500"></i></div> 
                                <div><strong>Giọng đọc AI (Voice TTS):</strong> Bạn có thể tuỳ chọn giữa giọng đọc Nam/Nữ, Anh-Anh hoặc Anh-Mỹ tùy theo mục tiêu luyện nghe.</div>
                            </li>
                            <li class="flex items-start gap-3">
                                <div class="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0 mt-0.5"><i class="fa-solid fa-image text-pink-500"></i></div> 
                                <div><strong>Đổi Avatar & Hình nền:</strong> Nhấp vào Avatar của bạn hoặc chọn "Đổi ảnh nền" để tải lên hình ảnh cá nhân. <em>(Kích thước ảnh tối đa 2MB)</em>.</div>
                            </li>
                        </ul>

                        <h3 class="font-bold text-xl text-purple-600 mt-8 mb-3">Focus Mode (Chế Độ Siêu Tập Trung)</h3>
                        <p class="text-gray-700 mb-4">
                            Khi kích hoạt <strong>Focus Mode</strong> từ Menu Cài đặt, toàn bộ thanh Menu chính (Header) sẽ bị ẩn đi. Chế độ này thiết kế đặc biệt dành cho những người dễ phân tâm, ép buộc bạn chỉ nhìn thấy Bộ Thẻ đang học. 
                        </p>
                        <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
                            <p class="text-amber-800 text-sm m-0"><strong>⚠️ Lưu ý:</strong> Khi bật Focus Mode, để quay lại màn hình chính, bạn hãy ấn biểu tượng Menu ẩn ở góc hoặc sử dụng nút Thoát Focus tích hợp.</p>
                        </div>
                    </div>

                    <!-- 2. Quản lý Thẻ & Nhập Hàng Loạt -->
                    <div v-if="activeSection === 'decks-import'" class="animate-fade-in">
                        <h2 class="text-2xl lg:text-3xl font-black mb-6 text-gray-800 border-b pb-4">2. Quản lý Thẻ & Nhập Hàng Loạt</h2>
                        
                        <h3 class="font-bold text-xl text-purple-600 mt-6 mb-3">Tạo Thẻ Thủ Công</h3>
                        <p class="text-gray-700 mb-4">
                            Bấm nút <strong>Tạo bộ thẻ mới</strong>. Hệ thống hỗ trợ 7 trường dữ liệu chuẩn IELTS: <em>Thuật ngữ, Định nghĩa, Phiên âm, Loại từ, Collocations, Từ đồng nghĩa, và Ví dụ</em>. Bạn cũng có thể tải ảnh minh họa (< 2MB) lên từng thẻ.
                        </p>

                        <h3 class="font-bold text-xl text-purple-600 mt-8 mb-3">Tính năng Nhập Hàng Loạt (Bulk Import)</h3>
                        <p class="text-gray-700 mb-4">
                            Để tiết kiệm thời gian, bạn có thể copy dữ liệu từ Excel hoặc Google Sheets và paste thẳng vào hệ thống.
                        </p>
                        <div class="overflow-x-auto rounded-xl border border-gray-200 mb-6 shadow-sm">
                            <table class="min-w-full bg-white text-sm">
                                <thead class="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th class="py-3 px-4 font-bold text-gray-700 text-left">Cột Excel</th>
                                        <th class="py-3 px-4 font-bold text-gray-700 text-left">Trường Dữ Liệu Tương Ứng</th>
                                        <th class="py-3 px-4 font-bold text-gray-700 text-left">Ví dụ thực tế</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr class="border-b border-gray-100"><td class="py-2.5 px-4">Cột 1</td><td class="py-2.5 px-4 text-purple-600 font-bold">Thuật ngữ (Anh) *</td><td class="py-2.5 px-4 font-mono text-gray-600 bg-gray-50">abundant</td></tr>
                                    <tr class="border-b border-gray-100"><td class="py-2.5 px-4">Cột 2</td><td class="py-2.5 px-4 text-purple-600 font-bold">Định nghĩa (Việt) *</td><td class="py-2.5 px-4 font-mono text-gray-600 bg-gray-50">dồi dào</td></tr>
                                    <tr class="border-b border-gray-100"><td class="py-2.5 px-4">Cột 3</td><td class="py-2.5 px-4 text-gray-600 font-medium">Phiên âm</td><td class="py-2.5 px-4 font-mono text-gray-600 bg-gray-50">/əˈbʌndənt/</td></tr>
                                    <tr class="border-b border-gray-100"><td class="py-2.5 px-4">Cột 4</td><td class="py-2.5 px-4 text-gray-600 font-medium">Loại từ</td><td class="py-2.5 px-4 font-mono text-gray-600 bg-gray-50">adj</td></tr>
                                    <tr class="border-b border-gray-100"><td class="py-2.5 px-4">Cột 5</td><td class="py-2.5 px-4 text-gray-600 font-medium">Cụm từ (Collocations)</td><td class="py-2.5 px-4 font-mono text-gray-600 bg-gray-50">abundant resources</td></tr>
                                    <tr class="border-b border-gray-100"><td class="py-2.5 px-4">Cột 6</td><td class="py-2.5 px-4 text-gray-600 font-medium">Từ đồng nghĩa</td><td class="py-2.5 px-4 font-mono text-gray-600 bg-gray-50">plentiful</td></tr>
                                    <tr><td class="py-2.5 px-4">Cột 7</td><td class="py-2.5 px-4 text-gray-600 font-medium">Ví dụ (Example)</td><td class="py-2.5 px-4 font-mono text-gray-600 bg-gray-50">Rainfall is more abundant...</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl">
                            <p class="text-rose-800 text-sm m-0"><strong>🚨 Cảnh báo giới hạn:</strong> Để đảm bảo trình duyệt không bị treo, hệ thống giới hạn dán tối đa <strong>200 dòng (thẻ)</strong> trong 1 lần nhập.</p>
                        </div>

                        <h3 class="font-bold text-xl text-purple-600 mt-8 mb-3">Sử dụng Master Checkbox</h3>
                        <p class="text-gray-700">
                            Tại thanh Menu <strong>Hàng Loạt</strong>, bạn sẽ thấy một ô Checkbox tổng. Nhấn vào đó để chọn nhanh toàn bộ thẻ hiện có chỉ với 1 thao tác click chuột. Tính năng này được sinh ra để kết hợp hoàn hảo với <em>AI Tự Điền Hàng Loạt</em>.
                        </p>
                    </div>

                    <!-- 3. Các chế độ học tập -->
                    <div v-if="activeSection === 'study-modes'" class="animate-fade-in">
                        <h2 class="text-2xl lg:text-3xl font-black mb-6 text-gray-800 border-b pb-4">3. Cơ Chế Học Tập Chuyên Sâu</h2>
                        
                        <div class="space-y-8 mt-6">
                            <div class="flex flex-col sm:flex-row gap-5 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <div class="w-14 h-14 flex-shrink-0 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-2xl"><i class="fa-solid fa-layer-group"></i></div>
                                <div>
                                    <h4 class="font-bold text-xl text-gray-800 mb-2">Lật Thẻ (Flashcards) & Spaced Repetition</h4>
                                    <p class="text-gray-700 mb-3">
                                        Không giống học vẹt truyền thống, ExtraQuiz sử dụng thuật toán <strong>Lặp lại Ngắt quãng (Spaced Repetition)</strong> độc quyền. Khi bạn đánh giá mức độ ghi nhớ (Khó/Bình thường/Dễ), hệ thống tính toán đường cong quên lãng (Forgetting Curve).
                                    </p>
                                    <ul class="list-disc pl-5 text-gray-600 text-sm space-y-1.5 font-medium">
                                        <li><strong class="text-red-500">Khó:</strong> Từ sẽ lặp lại ngay trong vòng 1-2 phút.</li>
                                        <li><strong class="text-green-500">Bình thường:</strong> Từ lặp lại sau 10 phút đến 1 ngày.</li>
                                        <li><strong class="text-blue-500">Dễ:</strong> Từ lặp lại sau 3-4 ngày.</li>
                                    </ul>
                                </div>
                            </div>

                            <div class="flex flex-col sm:flex-row gap-5 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <div class="w-14 h-14 flex-shrink-0 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 text-2xl"><i class="fa-solid fa-spell-check"></i></div>
                                <div>
                                    <h4 class="font-bold text-xl text-gray-800 mb-2">Trắc nghiệm (Quiz) & Gõ từ (Dictation)</h4>
                                    <p class="text-gray-700 mb-0">
                                        Rèn luyện <strong>Trí nhớ thụ động</strong> bằng bài trắc nghiệm nhiều đáp án. Sau đó, tiến tới <strong>Trí nhớ chủ động</strong> qua chế độ Gõ từ: Hệ thống đọc phát âm hoặc hiển thị nghĩa tiếng Việt, yêu cầu bạn tự gõ lại chính xác 100% spelling của từ đó.
                                    </p>
                                </div>
                            </div>

                            <div class="flex flex-col sm:flex-row gap-5 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <div class="w-14 h-14 flex-shrink-0 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 text-2xl"><i class="fa-solid fa-puzzle-piece"></i></div>
                                <div>
                                    <h4 class="font-bold text-xl text-gray-800 mb-2">Trò chơi Ghép thẻ (Matching Game)</h4>
                                    <p class="text-gray-700 mb-0">
                                        Thư giãn nhưng vẫn hiệu quả! Các thẻ Anh - Việt sẽ bay lơ lửng trên màn hình. Kéo thả chúng vào nhau để triệt tiêu. Đây là cách tuyệt vời để tăng <strong>Phản xạ dịch (Translation Reflex)</strong> trong khoảng thời gian siêu ngắn.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 4. Hệ Sinh Thái AI -->
                    <div v-if="activeSection === 'ai-features'" class="animate-fade-in">
                        <h2 class="text-2xl lg:text-3xl font-black mb-6 text-gray-800 border-b pb-4">4. Hệ Sinh Thái AI (Powered by Gemini)</h2>
                        
                        <p class="text-gray-700 mb-8 text-lg font-medium text-purple-700">
                            ExtraQuiz không chỉ là Flashcard, nó tích hợp sâu mô hình ngôn ngữ lớn để biến thành một gia sư Tiếng Anh riêng của bạn.
                        </p>

                        <h3 class="font-bold text-xl text-purple-600 mt-6 mb-3">✨ AI Tự Điền Hàng Loạt (Auto-fill)</h3>
                        <p class="text-gray-700 mb-4">
                            Chỉ cần nhập 1 cột "Thuật ngữ tiếng Anh" (VD: nhập 20 từ), sau đó dùng <strong>Master Checkbox</strong> chọn tất cả và bấm <strong>"AI Tự điền đã chọn"</strong>. AI sẽ phân tích ngữ cảnh phổ biến nhất và tự động điền 100% dữ liệu 6 cột còn lại.
                        </p>

                        <h3 class="font-bold text-xl text-purple-600 mt-8 mb-3">📝 AI Chấm điểm Writing (Essay Grader)</h3>
                        <p class="text-gray-700 mb-4">
                            Tại Menu AI, chọn <strong>"Chấm điểm Writing"</strong>. Hệ thống mô phỏng barem chấm thi thật của hội đồng giám khảo IELTS:
                        </p>
                        <ul class="list-disc pl-5 text-gray-700 space-y-2 mb-4">
                            <li>Chấm 4 tiêu chí: Task Response, Coherence, Lexical Resource, Grammatical Range.</li>
                            <li>Bắt lỗi chính tả, lỗi lặp từ.</li>
                            <li><strong class="text-purple-600">Tính năng độc quyền:</strong> Viết lại nguyên văn một bài Essay đạt Band 8.0+ dựa trên ý tưởng bài viết gốc của bạn.</li>
                        </ul>

                        <h3 class="font-bold text-xl text-purple-600 mt-8 mb-3">🔄 AI Huấn luyện viên (Paraphrasing Coach)</h3>
                        <p class="text-gray-700 mb-4">
                            Đừng dùng từ vựng nhàm chán nữa! Nhập một câu cơ bản (VD: <em>"Many people like reading books."</em>). AI Paraphrasing sẽ cung cấp ngay cho bạn 3 biến thể ở 3 cấp độ:
                        </p>
                        <div class="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-inner">
                            <p class="mb-3 text-gray-800"><strong class="text-teal-600">Level 1 (Band 6.0):</strong> A lot of individuals enjoy reading novels.</p>
                            <p class="mb-3 text-gray-800"><strong class="text-blue-600">Level 2 (Band 7.0):</strong> A significant number of people have a strong preference for reading literature.</p>
                            <p class="mb-0 text-gray-800"><strong class="text-fuchsia-600">Level 3 (Band 8.0+):</strong> A substantial proportion of the population harbors a profound inclination towards consuming written literary works.</p>
                        </div>
                    </div>

                    <!-- 5. Xếp hạng & Huy hiệu -->
                    <div v-if="activeSection === 'gamification'" class="animate-fade-in">
                        <h2 class="text-2xl lg:text-3xl font-black mb-6 text-gray-800 border-b pb-4">5. Xếp Hạng & Gamification</h2>
                        
                        <h3 class="font-bold text-xl text-purple-600 mt-6 mb-3">Tiền Tệ Ảo: LexiCredit 💎</h3>
                        <p class="text-gray-700 mb-4">
                            Mỗi hành động tích cực của bạn (ôn thẻ, đạt điểm cao Quiz, tương tác AI) đều rơi ra <strong>LexiCredit</strong>. Điểm LexiCredit mang tính tích lũy trọn đời (Lifetime) và <strong class="text-purple-600 underline">không bao giờ bị trừ</strong>.
                        </p>

                        <h3 class="font-bold text-xl text-purple-600 mt-8 mb-4">Cơ chế Cấp Độ (Rank System)</h3>
                        <p class="text-gray-700 mb-4">
                            Cấp độ (Level) của bạn được tự động tính toán nghiêm ngặt theo công thức: <code class="bg-gray-100 text-purple-600 px-2 py-1 rounded">Level = Lấy phần nguyên(LexiCredit / 50) + 1</code>.
                        </p>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                            <div class="bg-orange-50 border border-orange-200 p-4 rounded-xl text-center shadow-sm"><div class="text-orange-800 font-bold text-lg">Đồng (Bronze)</div><div class="text-sm font-medium text-orange-600/70 mt-1">Lv. 1 - 9</div></div>
                            <div class="bg-slate-50 border border-slate-300 p-4 rounded-xl text-center shadow-sm"><div class="text-slate-600 font-bold text-lg">Bạc (Silver)</div><div class="text-sm font-medium text-slate-500/70 mt-1">Lv. 10 - 24</div></div>
                            <div class="bg-yellow-50 border border-yellow-300 p-4 rounded-xl text-center shadow-sm"><div class="text-yellow-600 font-bold text-lg">Vàng (Gold)</div><div class="text-sm font-medium text-yellow-600/70 mt-1">Lv. 25 - 49</div></div>
                            <div class="bg-teal-50 border border-teal-300 p-4 rounded-xl text-center shadow-sm"><div class="text-teal-600 font-bold text-lg">Bạch Kim</div><div class="text-sm font-medium text-teal-600/70 mt-1">Lv. 50 - 99</div></div>
                            <div class="bg-blue-50 border border-blue-300 p-4 rounded-xl text-center shadow-sm"><div class="text-blue-600 font-bold text-lg">Kim Cương</div><div class="text-sm font-medium text-blue-600/70 mt-1">Lv. 100 - 199</div></div>
                            <div class="bg-fuchsia-50 border border-fuchsia-300 p-4 rounded-xl text-center shadow-sm"><div class="text-fuchsia-700 font-black text-lg uppercase">Thách Đấu</div><div class="text-sm font-medium text-fuchsia-600/70 mt-1">Lv. 200+</div></div>
                        </div>

                        <h3 class="font-bold text-xl text-purple-600 mt-8 mb-3">Phòng Truyền Thống (Trophy Room)</h3>
                        <p class="text-gray-700 mb-4">
                            Hệ thống chứa 4 danh mục Huy hiệu ẩn cần bạn khám phá. Bạn có thể <strong>"Trang bị"</strong> một huy hiệu lên Hồ sơ để khoe với bạn bè.
                        </p>
                        <ul class="list-disc pl-5 text-gray-700 space-y-2">
                            <li><strong>🔥 Streak:</strong> Học liên tục không đứt đoạn (Spark, Flame, Inferno, Unstoppable...).</li>
                            <li><strong>🎯 Cơ bản:</strong> Các mốc quan trọng (Tạo thẻ đầu tiên, Đạt 100 từ vựng).</li>
                            <li><strong>💎 Tài phiệt (Tycoon):</strong> Tích lũy lượng LexiCredit khổng lồ.</li>
                            <li><strong>🧠 DNA:</strong> Phong cách từ vựng (Trùm IELTS, Bậc thầy Business...).</li>
                        </ul>
                    </div>

                    <!-- 6. Persona & DNA -->
                    <div v-if="activeSection === 'persona-dna'" class="animate-fade-in">
                        <h2 class="text-2xl lg:text-3xl font-black mb-6 text-gray-800 border-b pb-4">6. Hồ Sơ AI Tâm Lý (Learning Persona)</h2>
                        
                        <p class="text-gray-700 mb-6 text-lg">
                            Mỗi cú click chuột, khoảng thời gian ngập ngừng, hay tốc độ trả lời của bạn đều được AI phân tích ngầm <em>(Under-the-hood)</em> để vẽ lên một Hồ sơ tâm lý học tập độc nhất.
                        </p>

                        <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
                            <h4 class="font-bold text-lg text-gray-800 mb-4 border-b border-gray-100 pb-3">Giải Mã 4 Chỉ Số Tâm Lý (Radar Chart)</h4>
                            <ul class="space-y-5 text-gray-700">
                                <li class="flex gap-4">
                                    <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-500"><i class="fa-solid fa-calendar-check"></i></div>
                                    <div>
                                        <strong class="block text-gray-900 mb-1">Tính kiên định (Consistency)</strong>
                                        Tăng cực nhanh nếu bạn vào app và hoàn thành 1 phiên Flashcard đều đặn mỗi ngày. Giảm nếu bạn bỏ học dài ngày.
                                    </div>
                                </li>
                                <li class="flex gap-4">
                                    <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 text-red-500"><i class="fa-solid fa-bullseye"></i></div>
                                    <div>
                                        <strong class="block text-gray-900 mb-1">Độ tập trung (Focus)</strong>
                                        AI đo tốc độ phản xạ. Trả lời nhanh, dứt khoát -> Cộng điểm. Bỏ quên màn hình hoặc mất quá 30s cho một câu Flashcard -> Bị trừ điểm trầm trọng.
                                    </div>
                                </li>
                                <li class="flex gap-4">
                                    <div class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 text-green-500"><i class="fa-solid fa-shield-heart"></i></div>
                                    <div>
                                        <strong class="block text-gray-900 mb-1">Sự bền bỉ (Persistence)</strong>
                                        Hệ thống nhận diện hành vi <em class="text-red-500">Rage-click</em> (Click điên cuồng vì bực bội). Nếu bạn trả lời sai, nhưng chưa đầy 0.5s sau đã bấm "Next" qua câu khác mà không đọc đáp án, AI sẽ <strong>trừ thẳng</strong> điểm nhẫn nại!
                                    </div>
                                </li>
                                <li class="flex gap-4">
                                    <div class="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 text-amber-500"><i class="fa-solid fa-lightbulb"></i></div>
                                    <div>
                                        <strong class="block text-gray-900 mb-1">Tự nhận thức (Metacognition)</strong>
                                        Được cộng nếu bạn chịu khó nán lại đọc các dòng phân tích "Insights" sau mỗi buổi học.
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <h3 class="font-bold text-xl text-purple-600 mt-8 mb-3">Vocabulary DNA (Đa giác Từ Vựng)</h3>
                        <p class="text-gray-700">
                            Bằng công nghệ xử lý ngôn ngữ tự nhiên (NLP), AI quét qua toàn bộ cơ sở dữ liệu từ vựng của bạn để phân loại chúng. Bạn sẽ biết mình đang "Nghiêng" về trường phái nào: <em>Academic (Học thuật), Business (Kinh tế), Tech (Công nghệ) hay Casual (Giao tiếp đời sống)</em>. Mức độ chuyên sâu sẽ được thể hiện bằng Radar Chart.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    `
};
