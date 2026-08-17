import { ref, computed, onMounted } from 'vue';
import { store } from '../store.js';

export const MOTIVATIONAL_QUOTES = [
    {
        id: 1,
        quote: "The expert in anything was once a beginner.",
        author: "Helen Hayes",
        translation: "Bất kỳ chuyên gia nào trong mọi lĩnh vực cũng từng là một người mới bắt đầu.",
        category: "growth",
        tag: "Khởi Đầu",
        icon: "fa-solid fa-seedling",
        bgGradient: "from-amber-500/20 via-orange-500/10 to-transparent",
        accentColor: "text-amber-400"
    },
    {
        id: 2,
        quote: "Discipline is choosing between what you want now and what you want most.",
        author: "Abraham Lincoln",
        translation: "Kỷ luật là việc lựa chọn giữa điều bạn muốn ngay bây giờ và điều bạn khao khát nhất.",
        category: "discipline",
        tag: "Kỷ Luật",
        icon: "fa-solid fa-fire-flame-curved",
        bgGradient: "from-rose-500/20 via-orange-500/10 to-transparent",
        accentColor: "text-rose-400"
    },
    {
        id: 3,
        quote: "Small daily improvements over time lead to stunning results.",
        author: "Robin Sharma",
        translation: "Những cải thiện nhỏ mỗi ngày theo thời gian sẽ tạo nên những kết quả phi thường.",
        category: "habits",
        tag: "Thói Quen",
        icon: "fa-solid fa-chart-line-up",
        bgGradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
        accentColor: "text-emerald-400"
    },
    {
        id: 4,
        quote: "A different language is a different vision of life.",
        author: "Federico Fellini",
        translation: "Một ngôn ngữ khác là một lăng kính hoàn toàn mới để nhìn ngắm cuộc đời.",
        category: "language",
        tag: "Ngôn Ngữ",
        icon: "fa-solid fa-earth-americas",
        bgGradient: "from-blue-500/20 via-indigo-500/10 to-transparent",
        accentColor: "text-blue-400"
    },
    {
        id: 5,
        quote: "You don't have to be great to start, but you have to start to be great.",
        author: "Zig Ziglar",
        translation: "Bạn không cần phải vĩ đại để bắt đầu, nhưng bạn phải bắt đầu để trở nên vĩ đại.",
        category: "growth",
        tag: "Hành Động",
        icon: "fa-solid fa-bolt",
        bgGradient: "from-yellow-500/20 via-amber-500/10 to-transparent",
        accentColor: "text-yellow-400"
    },
    {
        id: 6,
        quote: "Repetition is the mother of learning, the father of action, which makes it the architect of accomplishment.",
        author: "Zig Ziglar",
        translation: "Sự lặp lại là mẹ đẻ của học vấn, là cha đẻ của hành động, và là kiến trúc sư của mọi thành tựu.",
        category: "habits",
        tag: "Spaced Repetition",
        icon: "fa-solid fa-rotate-right",
        bgGradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
        accentColor: "text-cyan-400"
    },
    {
        id: 7,
        quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill",
        translation: "Thành công không phải là điểm đến cuối cùng, thất bại cũng chẳng phải vực thẳm diệt vong: lòng can đảm bước tiếp mới là điều đáng giá nhất.",
        category: "resilience",
        tag: "Bền Bỉ",
        icon: "fa-solid fa-shield-halved",
        bgGradient: "from-purple-500/20 via-indigo-500/10 to-transparent",
        accentColor: "text-purple-400"
    },
    {
        id: 8,
        quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
        author: "Mahatma Gandhi",
        translation: "Hãy sống như thể bạn sẽ chết vào ngày mai. Hãy học như thể bạn sẽ sống mãi mãi.",
        category: "wisdom",
        tag: "Tri Thức",
        icon: "fa-solid fa-book-sparkles",
        bgGradient: "from-indigo-500/20 via-purple-500/10 to-transparent",
        accentColor: "text-indigo-400"
    },
    {
        id: 9,
        quote: "The limits of my language mean the limits of my world.",
        author: "Ludwig Wittgenstein",
        translation: "Giới hạn ngôn ngữ của tôi chính là ranh giới thế giới của tôi.",
        category: "language",
        tag: "Tầm Nhìn",
        icon: "fa-solid fa-compass",
        bgGradient: "from-teal-500/20 via-emerald-500/10 to-transparent",
        accentColor: "text-teal-400"
    },
    {
        id: 10,
        quote: "Consistency is what transforms average into excellence.",
        author: "Tony Robbins",
        translation: "Sự kiên định là chiếc chìa khóa duy nhất biến những điều tầm thường thành xuất chúng.",
        category: "discipline",
        tag: "Kiên Trì",
        icon: "fa-solid fa-gem",
        bgGradient: "from-fuchsia-500/20 via-pink-500/10 to-transparent",
        accentColor: "text-fuchsia-400"
    },
    {
        id: 11,
        quote: "It always seems impossible until it is done.",
        author: "Nelson Mandela",
        translation: "Mọi việc dường như luôn bất khả thi cho đến khi nó được hoàn thành.",
        category: "resilience",
        tag: "Đột Phá",
        icon: "fa-solid fa-mountain-sun",
        bgGradient: "from-amber-500/20 via-red-500/10 to-transparent",
        accentColor: "text-amber-400"
    },
    {
        id: 12,
        quote: "Learning another language is not only learning different words for the same things, but learning another way to think about things.",
        author: "Flora Lewis",
        translation: "Học một ngôn ngữ khác không chỉ là học những từ ngữ mới cho cùng một sự vật, mà là học một cách tư duy hoàn toàn mới về vạn vật.",
        category: "language",
        tag: "Tư Duy",
        icon: "fa-solid fa-brain",
        bgGradient: "from-violet-500/20 via-purple-500/10 to-transparent",
        accentColor: "text-violet-400"
    },
    {
        id: 13,
        quote: "If you talk to a man in a language he understands, that goes to his head. If you talk to him in his language, that goes to his heart.",
        author: "Nelson Mandela",
        translation: "Nếu bạn nói chuyện bằng ngôn ngữ người khác hiểu, lời nói chạm vào tâm trí. Nếu bạn nói bằng chính tiếng mẹ đẻ của họ, lời nói chạm thẳng vào trái tim.",
        category: "language",
        tag: "Kết Nối",
        icon: "fa-solid fa-heart",
        bgGradient: "from-rose-500/20 via-pink-500/10 to-transparent",
        accentColor: "text-rose-400"
    },
    {
        id: 14,
        quote: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking.",
        author: "Steve Jobs",
        translation: "Cách duy nhất để tạo nên những thành tựu vĩ đại là hãy yêu điều bạn làm. Nếu bạn vẫn chưa tìm thấy, hãy không ngừng kiếm tìm.",
        category: "growth",
        tag: "Đam Mê",
        icon: "fa-solid fa-fire",
        bgGradient: "from-orange-500/20 via-amber-500/10 to-transparent",
        accentColor: "text-orange-400"
    },
    {
        id: 15,
        quote: "You do not rise to the level of your goals. You fall to the level of your systems.",
        author: "James Clear",
        translation: "Bạn không tự động vươn lên tới tầm cao mục tiêu của mình. Bạn sẽ rơi xuống đúng mức độ vững chắc của hệ thống thói quen bạn xây dựng.",
        category: "habits",
        tag: "Atomic Habits",
        icon: "fa-solid fa-cubes-stacked",
        bgGradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
        accentColor: "text-emerald-400"
    },
    {
        id: 16,
        quote: "Intellectual growth should commence at birth and cease only at death.",
        author: "Albert Einstein",
        translation: "Sự phát triển trí tuệ nên bắt đầu ngay từ lúc chào đời và chỉ dừng lại khi trút hơi thở cuối cùng.",
        category: "wisdom",
        tag: "Khai Phóng",
        icon: "fa-solid fa-atom",
        bgGradient: "from-sky-500/20 via-indigo-500/10 to-transparent",
        accentColor: "text-sky-400"
    },
    {
        id: 17,
        quote: "One language sets you in a corridor for life. Two languages open every door along the way.",
        author: "Frank Smith",
        translation: "Một ngôn ngữ đưa bạn vào một hành lang cuộc đời. Hai ngôn ngữ mở toang mọi cánh cửa dọc theo con đường ấy.",
        category: "language",
        tag: "Cánh Cửa",
        icon: "fa-solid fa-door-open",
        bgGradient: "from-indigo-500/20 via-blue-500/10 to-transparent",
        accentColor: "text-indigo-400"
    },
    {
        id: 18,
        quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
        author: "Aristotle",
        translation: "Chúng ta là những gì chúng ta lặp đi lặp lại hàng ngày. Do đó, sự xuất chúng không phải là một hành động nhất thời, mà là một thói quen bền bỉ.",
        category: "habits",
        tag: "Xuất Chúng",
        icon: "fa-solid fa-crown",
        bgGradient: "from-amber-500/20 via-yellow-500/10 to-transparent",
        accentColor: "text-amber-400"
    },
    {
        id: 19,
        quote: "An investment in knowledge pays the best interest.",
        author: "Benjamin Franklin",
        translation: "Đầu tư vào tri thức và vốn từ luôn là khoản đầu tư mang lại mức sinh lời cao nhất trong đời.",
        category: "wisdom",
        tag: "Đầu Tư",
        icon: "fa-solid fa-coins",
        bgGradient: "from-emerald-500/20 via-lime-500/10 to-transparent",
        accentColor: "text-emerald-400"
    },
    {
        id: 20,
        quote: "It does not matter how slowly you go as long as you do not stop.",
        author: "Confucius",
        translation: "Đi chậm bao nhiêu không quan trọng, miễn là bạn không bao giờ dừng bước chân mình.",
        category: "resilience",
        tag: "Không Bỏ Cuộc",
        icon: "fa-solid fa-person-walking",
        bgGradient: "from-teal-500/20 via-cyan-500/10 to-transparent",
        accentColor: "text-teal-400"
    },
    {
        id: 21,
        quote: "You can never understand one language until you understand at least two.",
        author: "Geoffrey Willans",
        translation: "Bạn không bao giờ thực sự thấu hiểu một ngôn ngữ cho đến khi bạn học được ít nhất hai thứ tiếng.",
        category: "language",
        tag: "Song Ngữ",
        icon: "fa-solid fa-language",
        bgGradient: "from-purple-500/20 via-pink-500/10 to-transparent",
        accentColor: "text-purple-400"
    },
    {
        id: 22,
        quote: "With suitable distribution over space of time, retention is decidedly more advantageous than massing at once.",
        author: "Hermann Ebbinghaus",
        translation: "Chia nhỏ việc ôn tập theo từng khoảng thời gian ngắt quãng (Spaced Repetition) hiệu quả gấp bội so với việc nhồi nhét cùng một lúc.",
        category: "habits",
        tag: "Đường Cong Trí Nhớ",
        icon: "fa-solid fa-wave-pulse",
        bgGradient: "from-blue-500/20 via-cyan-500/10 to-transparent",
        accentColor: "text-blue-400"
    },
    {
        id: 23,
        quote: "The fixed mindset creates the urge to prove yourself; the growth mindset creates a passion for learning.",
        author: "Carol Dweck",
        translation: "Tư duy cố định khiến bạn loay hoay chứng tỏ bản thân; tư duy phát triển thắp sáng ngọn lửa say mê học hỏi suốt đời.",
        category: "growth",
        tag: "Growth Mindset",
        icon: "fa-solid fa-seedling",
        bgGradient: "from-green-500/20 via-emerald-500/10 to-transparent",
        accentColor: "text-green-400"
    },
    {
        id: 24,
        quote: "Those who know nothing of foreign languages know nothing of their own.",
        author: "Johann Wolfgang von Goethe",
        translation: "Những ai không biết gì về ngoại ngữ cũng chẳng thể thực sự hiểu sâu sắc về chính tiếng mẹ đẻ của mình.",
        category: "language",
        tag: "Sâu Sắc",
        icon: "fa-solid fa-feather-pointed",
        bgGradient: "from-indigo-500/20 via-purple-500/10 to-transparent",
        accentColor: "text-indigo-400"
    },
    {
        id: 25,
        quote: "Continuous learning is the minimum requirement for success in any field.",
        author: "Brian Tracy",
        translation: "Học tập liên tục và không ngừng nghỉ là điều kiện tối thiểu để đạt được thành công trong bất kỳ lĩnh vực nào.",
        category: "discipline",
        tag: "Tiến Bước",
        icon: "fa-solid fa-graduation-cap",
        bgGradient: "from-orange-500/20 via-amber-500/10 to-transparent",
        accentColor: "text-orange-400"
    },
    {
        id: 26,
        quote: "To have another language is to possess a second soul.",
        author: "Charlemagne",
        translation: "Sở hữu thêm một ngôn ngữ mới chính là bạn đang nắm giữ một linh hồn thứ hai trong mình.",
        category: "language",
        tag: "Linh Hồn Thứ Hai",
        icon: "fa-solid fa-sparkles",
        bgGradient: "from-fuchsia-500/20 via-purple-500/10 to-transparent",
        accentColor: "text-fuchsia-400"
    },
    {
        id: 27,
        quote: "Do not go where the path may lead, go instead where there is no path and leave a trail.",
        author: "Ralph Waldo Emerson",
        translation: "Đừng chỉ bước đi trên con đường mòn có sẵn, hãy dấn thân vào nơi chưa có lối và để lại dấu ấn của chính bạn.",
        category: "growth",
        tag: "Tiên Phong",
        icon: "fa-solid fa-route",
        bgGradient: "from-amber-500/20 via-rose-500/10 to-transparent",
        accentColor: "text-amber-400"
    },
    {
        id: 28,
        quote: "Waste no more time arguing what a good man should be. Be one.",
        author: "Marcus Aurelius",
        translation: "Đừng lãng phí thêm thời gian tranh luận thế nào là một con người xuất chúng. Hãy bắt tay vào hành động ngay bây giờ.",
        category: "discipline",
        tag: "Hành Động Ngay",
        icon: "fa-solid fa-stopwatch",
        bgGradient: "from-red-500/20 via-orange-500/10 to-transparent",
        accentColor: "text-red-400"
    },
    {
        id: 29,
        quote: "To learn to read is to light a fire; every syllable that is spelled out is a spark.",
        author: "Victor Hugo",
        translation: "Học đọc là thắp lên một ngọn lửa; mỗi âm tiết được đánh vần chính là một tia sáng bừng lên rạng rỡ.",
        category: "wisdom",
        tag: "Tia Sáng",
        icon: "fa-solid fa-book-open-reader",
        bgGradient: "from-amber-500/20 via-orange-500/10 to-transparent",
        accentColor: "text-amber-400"
    },
    {
        id: 30,
        quote: "The journey of a thousand miles begins with one single step.",
        author: "Lao Tzu",
        translation: "Hành trình vạn dặm khởi đầu từ một bước chân vững chãi.",
        category: "resilience",
        tag: "Bước Đầu Tiên",
        icon: "fa-solid fa-shoe-prints",
        bgGradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
        accentColor: "text-emerald-400"
    },
    {
        id: 31,
        quote: "Change is the end result of all true learning.",
        author: "Leo Buscaglia",
        translation: "Sự thay đổi và chuyển hóa tích cực chính là kết quả cuối cùng của mọi quá trình học tập chân chính.",
        category: "growth",
        tag: "Chuyển Hóa",
        icon: "fa-solid fa-arrow-progress",
        bgGradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
        accentColor: "text-cyan-400"
    },
    {
        id: 32,
        quote: "The beautiful thing about learning is that nobody can take it away from you.",
        author: "B.B. King",
        translation: "Điều tuyệt vời nhất của việc học tập là tri thức bạn tích lũy sẽ mãi mãi thuộc về bạn, không ai có thể tước đoạt.",
        category: "wisdom",
        tag: "Vô Giá",
        icon: "fa-solid fa-shield-heart",
        bgGradient: "from-indigo-500/20 via-purple-500/10 to-transparent",
        accentColor: "text-indigo-400"
    }
];

export default {
    setup() {
        const quotes = ref(MOTIVATIONAL_QUOTES);
        const selectedCategory = ref('all');
        const currentIndex = ref(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
        const isSpeaking = ref(false);
        const isCopied = ref(false);
        const favorites = ref(JSON.parse(localStorage.getItem('extraquiz_fav_quotes') || '[]'));
        const isFlipping = ref(false);

        const currentQuote = computed(() => {
            return quotes.value[currentIndex.value] || quotes.value[0];
        });

        const filteredQuotes = computed(() => {
            if (selectedCategory.value === 'all') return quotes.value;
            if (selectedCategory.value === 'fav') return quotes.value.filter(q => favorites.value.includes(q.id));
            return quotes.value.filter(q => q.category === selectedCategory.value);
        });

        const nextQuote = () => {
            isFlipping.value = true;
            setTimeout(() => {
                let nextIdx;
                do {
                    nextIdx = Math.floor(Math.random() * quotes.value.length);
                } while (nextIdx === currentIndex.value && quotes.value.length > 1);
                currentIndex.value = nextIdx;
                isFlipping.value = false;
            }, 250);
        };

        const selectQuote = (idx) => {
            isFlipping.value = true;
            setTimeout(() => {
                currentIndex.value = idx;
                isFlipping.value = false;
            }, 200);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        const toggleFavorite = (id) => {
            const idx = favorites.value.indexOf(id);
            if (idx > -1) {
                favorites.value.splice(idx, 1);
            } else {
                favorites.value.push(id);
            }
            localStorage.setItem('extraquiz_fav_quotes', JSON.stringify(favorites.value));
        };

        const isFav = (id) => {
            return favorites.value.includes(id);
        };

        const copyQuote = (quote) => {
            const textToCopy = `"${quote.quote}" - ${quote.author}\n(${quote.translation})`;
            navigator.clipboard.writeText(textToCopy).then(() => {
                isCopied.value = true;
                setTimeout(() => { isCopied.value = false; }, 2000);
            });
        };

        const goBack = () => {
            store.navigate('dashboard');
        };

        return {
            store,
            quotes,
            selectedCategory,
            currentIndex,
            currentQuote,
            filteredQuotes,
            isCopied,
            isFlipping,
            nextQuote,
            selectQuote,
            favorites,
            toggleFavorite,
            isFav,
            copyQuote,
            goBack
        };
    },
    template: `
        <div class="max-w-6xl mx-auto w-full p-4 lg:p-8 animate-fade-in pb-24 select-none">
            
            <!-- Top Header -->
            <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-4">
                    <button @click="goBack" class="w-10 h-10 flex items-center justify-center rounded-2xl bg-white shadow-sm hover:bg-purple-50 transition text-gray-500 hover:text-purple-600 border border-gray-100">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <div class="flex items-center gap-2">
                            <h1 class="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                                <img src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Sparkles/3D/sparkles_3d.png" class="w-8 h-8 object-contain filter drop-shadow-sm">
                                <span>Góc Động Lực (Daily Motivation)</span>
                            </h1>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-700 uppercase tracking-wider">Tâm Trí Vững Vàng</span>
                        </div>
                        <p class="text-sm text-gray-500 font-medium mt-1">Danh ngôn song ngữ truyền cảm hứng học tập & đánh thức tiềm năng não bộ mỗi ngày</p>
                    </div>
                </div>

                <button @click="nextQuote" class="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all">
                    <i class="fa-solid fa-shuffle" :class="isFlipping ? 'animate-spin' : ''"></i>
                    <span>Đổi Câu Khác</span>
                </button>
            </div>

            <!-- HERO SPOTLIGHT QUOTE CARD -->
            <div class="relative rounded-3xl overflow-hidden shadow-2xl border border-indigo-100/80 bg-gradient-to-br from-[#0F1426] via-[#151A30] to-[#1E1B4B] text-white p-8 lg:p-12 mb-10 transition-all duration-300 transform"
                 :class="isFlipping ? 'opacity-0 scale-95' : 'opacity-100 scale-100'">
                
                <!-- Ambient Background Glows -->
                <div class="absolute -top-24 -right-24 w-80 h-80 bg-purple-600/30 rounded-full blur-[100px] pointer-events-none"></div>
                <div class="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-600/30 rounded-full blur-[100px] pointer-events-none"></div>
                
                <!-- Giant Decorative Quote Mark -->
                <div class="absolute top-6 right-8 text-8xl lg:text-9xl font-serif text-white/5 pointer-events-none select-none leading-none">“</div>

                <div class="relative z-10">
                    <!-- Category Tag & Actions -->
                    <div class="flex items-center justify-between gap-4 mb-6">
                        <div class="flex items-center gap-2">
                            <span class="px-3 py-1 rounded-xl text-xs font-black bg-white/10 backdrop-blur-md text-amber-300 border border-white/10 flex items-center gap-1.5 shadow-sm">
                                <i :class="currentQuote.icon"></i>
                                {{ currentQuote.tag }}
                            </span>
                            <span class="text-xs text-gray-400 font-mono">#{{ currentQuote.id }} / {{ quotes.length }}</span>
                        </div>

                        <div class="flex items-center gap-2">
                            <!-- Copy Button -->
                            <button @click="copyQuote(currentQuote)" 
                                    class="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md border border-white/10 active:scale-95"
                                    :title="isCopied ? 'Đã sao chép!' : 'Sao chép câu nói'">
                                <i class="fa-solid text-sm" :class="isCopied ? 'fa-check text-emerald-400' : 'fa-copy'"></i>
                            </button>

                            <!-- Favorite Button -->
                            <button @click="toggleFavorite(currentQuote.id)" 
                                    class="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all backdrop-blur-md border border-white/10 active:scale-95"
                                    :class="isFav(currentQuote.id) ? 'text-rose-400 bg-rose-500/20 border-rose-500/30' : 'text-white'"
                                    title="Lưu vào mục yêu thích">
                                <i class="fa-solid fa-heart text-sm" :class="isFav(currentQuote.id) ? 'text-rose-400 scale-110' : ''"></i>
                            </button>
                        </div>
                    </div>

                    <!-- English Quote -->
                    <div class="my-4">
                        <p class="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-snug tracking-tight text-white/95 font-serif italic mb-4">
                            "{{ currentQuote.quote }}"
                        </p>
                    </div>

                    <!-- Vietnamese Translation -->
                    <div class="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md max-w-2xl mb-8">
                        <p class="text-base sm:text-lg text-indigo-200 font-medium leading-relaxed">
                            {{ currentQuote.translation }}
                        </p>
                    </div>

                    <!-- Author & Shuffle Button -->
                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-sm text-white shadow-md">
                                {{ currentQuote.author.charAt(0) }}
                            </div>
                            <div>
                                <h4 class="font-bold text-white text-base leading-tight">{{ currentQuote.author }}</h4>
                                <span class="text-xs text-gray-400">Tác giả & Danh nhân</span>
                            </div>
                        </div>

                        <button @click="nextQuote" class="sm:hidden w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30">
                            <i class="fa-solid fa-shuffle"></i>
                            Đổi Câu Khác
                        </button>
                    </div>
                </div>
            </div>

            <!-- CATEGORY FILTER TABS -->
            <div class="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
                <button @click="selectedCategory = 'all'" 
                        class="px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border"
                        :class="selectedCategory === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'">
                    <i class="fa-solid fa-layer-group"></i> Tất Cả ({{ quotes.length }})
                </button>
                <button @click="selectedCategory = 'discipline'" 
                        class="px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border"
                        :class="selectedCategory === 'discipline' ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'">
                    <i class="fa-solid fa-fire-flame-curved text-rose-500"></i> Kỷ Luật
                </button>
                <button @click="selectedCategory = 'habits'" 
                        class="px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border"
                        :class="selectedCategory === 'habits' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'">
                    <i class="fa-solid fa-chart-line-up text-emerald-500"></i> Thói Quen
                </button>
                <button @click="selectedCategory = 'growth'" 
                        class="px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border"
                        :class="selectedCategory === 'growth' ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'">
                    <i class="fa-solid fa-bolt text-amber-500"></i> Khởi Đầu & Phát Triển
                </button>
                <button @click="selectedCategory = 'language'" 
                        class="px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border"
                        :class="selectedCategory === 'language' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'">
                    <i class="fa-solid fa-earth-americas text-blue-500"></i> Ngôn Ngữ
                </button>
                <button @click="selectedCategory = 'fav'" 
                        class="px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border"
                        :class="selectedCategory === 'fav' ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'">
                    <i class="fa-solid fa-heart text-rose-500"></i> Yêu Thích ({{ favorites.length }})
                </button>
            </div>

            <!-- QUOTES GRID COLLECTION -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div v-for="(item, idx) in filteredQuotes" :key="item.id"
                     @click="selectQuote(quotes.indexOf(item))"
                     class="bg-white rounded-3xl p-6 border border-gray-100 hover:border-indigo-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group relative overflow-hidden">
                    
                    <!-- Top Category & Fav -->
                    <div class="flex items-center justify-between mb-4">
                        <span class="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 text-indigo-700 flex items-center gap-1.5">
                            <i :class="item.icon"></i>
                            {{ item.tag }}
                        </span>
                        <button @click.stop="toggleFavorite(item.id)" 
                                class="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                :class="isFav(item.id) ? 'text-rose-500 bg-rose-50' : 'text-gray-300 hover:text-rose-400 hover:bg-rose-50/50'">
                            <i class="fa-solid fa-heart text-xs"></i>
                        </button>
                    </div>

                    <!-- English Text -->
                    <p class="text-gray-900 font-bold text-base leading-snug font-serif italic mb-3 group-hover:text-indigo-600 transition-colors">
                        "{{ item.quote }}"
                    </p>

                    <!-- Vietnamese Text -->
                    <p class="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-4">
                        {{ item.translation }}
                    </p>

                    <!-- Footer Author -->
                    <div class="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span class="font-extrabold text-gray-700">— {{ item.author }}</span>
                        <span class="text-[11px] text-gray-400 font-mono">#{{ item.id }}</span>
                    </div>
                </div>
            </div>

            <!-- Bottom Motivation Banner -->
            <div class="mt-12 p-8 rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50 to-indigo-50 border border-amber-200/60 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div class="flex items-center gap-5">
                    <div class="w-16 h-16 rounded-2xl bg-white p-2 shadow-md shrink-0 flex items-center justify-center text-3xl select-none">
                        ⭐
                    </div>
                    <div>
                        <h3 class="text-lg font-black text-gray-900">Sức mạnh của 1% mỗi ngày!</h3>
                        <p class="text-sm text-gray-600 leading-relaxed mt-1">
                            Nếu bạn tốt hơn 1% mỗi ngày trong vòng 1 năm, bạn sẽ tiến bộ gấp <b>37 lần</b>. Hãy hoàn thành ngay 1 phiên ôn tập hôm nay để duy trì ngọn lửa!
                        </p>
                    </div>
                </div>
                <button @click="store.navigate('dashboard')" class="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all shrink-0">
                    Bắt Đầu Học Ngay 🚀
                </button>
            </div>

        </div>
    `
};
