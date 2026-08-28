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
        bgGradient: "from-blue-500/20 via-cyan-500/10 to-transparent",
        accentColor: "text-blue-400"
    },
    {
        id: 10,
        quote: "Patience, persistence and perspiration make an unbeatable combination for success.",
        author: "Napoleon Hill",
        translation: "Kự kiên nhẫn, lòng bền bỉ và những giọt mồ hôi là công thức tuyệt đỉnh tạo nên thành công không thể quật ngã.",
        category: "discipline",
        tag: "Nỗ Lực",
        icon: "fa-solid fa-fire",
        bgGradient: "from-orange-500/20 via-red-500/10 to-transparent",
        accentColor: "text-orange-400"
    },
    {
        id: 11,
        quote: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
        author: "Dr. Seuss",
        translation: "Đọc càng nhiều, bạn càng biết nhiều điều. Học càng rộng, bạn càng đến được nhiều chân trời mới.",
        category: "wisdom",
        tag: "Mở Rộng",
        icon: "fa-solid fa-book-open-reader",
        bgGradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
        accentColor: "text-emerald-400"
    },
    {
        id: 12,
        quote: "Motivation gets you going, but habit is what keeps you growing.",
        author: "Jim Ryun",
        translation: "Động lực cho bạn lý do để bắt đầu, nhưng chính thói quen mới giúp bạn không ngừng phát triển.",
        category: "habits",
        tag: "Thói Quen Bền Vững",
        icon: "fa-solid fa-arrow-trend-up",
        bgGradient: "from-purple-500/20 via-indigo-500/10 to-transparent",
        accentColor: "text-purple-400"
    },
    {
        id: 13,
        quote: "Knowledge of languages is the doorway to wisdom.",
        author: "Roger Bacon",
        translation: "Tri thức về các ngôn ngữ chính là cánh cửa dẫn tới kho tàng trí tuệ nhân loại.",
        category: "language",
        tag: "Cánh Cửa Tri Thức",
        icon: "fa-solid fa-key",
        bgGradient: "from-amber-500/20 via-yellow-500/10 to-transparent",
        accentColor: "text-amber-400"
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
        quote: "Develop a passion for learning. If you do, you will never cease to grow.",
        author: "Anthony J. D'Angelo",
        translation: "Hãy thắp lên tình yêu say mê học hỏi. Khi ấy, sự trưởng thành của bạn sẽ chẳng bao giờ lụi tàn.",
        category: "growth",
        tag: "Say Mê",
        icon: "fa-solid fa-heart-pulse",
        bgGradient: "from-rose-500/20 via-pink-500/10 to-transparent",
        accentColor: "text-rose-400"
    },
    {
        id: 29,
        quote: "Discipline is the bridge between goals and accomplishment.",
        author: "Jim Rohn",
        translation: "Kỷ luật chính là cây cầu vững chắc kết nối những ước mơ với thành tựu đời thực.",
        category: "discipline",
        tag: "Cây Cầu Kỷ Luật",
        icon: "fa-solid fa-bridge",
        bgGradient: "from-blue-500/20 via-indigo-500/10 to-transparent",
        accentColor: "text-blue-400"
    },
    {
        id: 30,
        quote: "Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.",
        author: "Abigail Adams",
        translation: "Tri thức không bao giờ gõ cửa do may rủi. Nó phải được khát khao kiếm tìm và bồi đắp bằng sự siêng năng.",
        category: "wisdom",
        tag: "Siêng Năng",
        icon: "fa-solid fa-lightbulb",
        bgGradient: "from-amber-500/20 via-orange-500/10 to-transparent",
        accentColor: "text-amber-400"
    },
    {
        id: 31,
        quote: "Change is the end result of all true learning.",
        author: "Leo Buscaglia",
        translation: "Sự thay đổi bản thân hướng tới phiên bản hoàn hảo hơn chính là đơm hoa kết trái của học tập.",
        category: "growth",
        tag: "Thay Đổi",
        icon: "fa-solid fa-butterfly",
        bgGradient: "from-purple-500/20 via-pink-500/10 to-transparent",
        accentColor: "text-purple-400"
    },
    {
        id: 32,
        quote: "If you talk to a man in a language he understands, that goes to his head. If you talk to him in his language, that goes to his heart.",
        author: "Nelson Mandela",
        translation: "Nếu bạn nói bằng ngôn ngữ người khác hiểu, lời nói đi vào trí óc. Nhưng nếu bạn nói bằng chính thứ tiếng mẹ đẻ của họ, lời nói sẽ chạm thấu trái tim.",
        category: "language",
        tag: "Chạm Trái Tim",
        icon: "fa-solid fa-comments text-rose-400",
        bgGradient: "from-rose-500/20 via-amber-500/10 to-transparent",
        accentColor: "text-rose-400"
    }
];

export default {
    setup() {
        const quotes = ref(MOTIVATIONAL_QUOTES);
        const currentQuoteIndex = ref(0);
        const selectedCategory = ref('all');
        const favorites = ref(JSON.parse(localStorage.getItem('fav_quotes') || '[]'));
        const isCopied = ref(false);
        const isFlipping = ref(false);

        const currentQuote = computed(() => {
            return quotes.value[currentQuoteIndex.value] || quotes.value[0];
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
                } while (nextIdx === currentQuoteIndex.value && quotes.value.length > 1);
                currentQuoteIndex.value = nextIdx;
                isFlipping.value = false;
            }, 250);
        };

        const selectQuote = (idx) => {
            currentQuoteIndex.value = idx;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        const toggleFavorite = (id) => {
            const idx = favorites.value.indexOf(id);
            if (idx > -1) {
                favorites.value.splice(idx, 1);
            } else {
                favorites.value.push(id);
            }
            localStorage.setItem('fav_quotes', JSON.stringify(favorites.value));
        };

        const isFav = (id) => favorites.value.includes(id);

        const copyQuote = (q) => {
            const text = `"${q.quote}"\n— ${q.author}\n(${q.translation})`;
            navigator.clipboard.writeText(text).then(() => {
                isCopied.value = true;
                setTimeout(() => { isCopied.value = false; }, 2000);
            });
        };

        onMounted(() => {
            currentQuoteIndex.value = Math.floor(Math.random() * quotes.value.length);
        });

        return {
            quotes, currentQuoteIndex, currentQuote, selectedCategory,
            filteredQuotes, favorites, isCopied, isFlipping, nextQuote,
            selectQuote, toggleFavorite, isFav, copyQuote, store
        };
    },
    template: `
        <div class="w-full max-w-full space-y-10 pb-28 select-none px-2 sm:px-6">
            
            <!-- TOP BAR HEADER -->
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-2">
                <div class="flex items-center gap-5">
                    <button @click="store.navigate('dashboard')" class="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-md hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-indigo-600 transition text-xl font-black">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <div class="flex items-center gap-3">
                            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">Góc Động Lực Học Tập</h1>
                            <span class="px-3.5 py-1 rounded-full text-xs sm:text-sm font-black bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                <i class="fa-solid fa-sparkles text-amber-500"></i>
                                <span>SPARK 32</span>
                            </span>
                        </div>
                        <p class="text-base sm:text-lg text-gray-600 font-semibold mt-1">Truyền cảm hứng rèn luyện trí tuệ, kỷ luật & thói quen kiên trì mỗi ngày</p>
                    </div>
                </div>

                <div class="flex items-center gap-4 w-full sm:w-auto">
                    <button @click="nextQuote" class="flex-1 sm:flex-initial px-7 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-base shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95">
                        <i class="fa-solid fa-shuffle text-lg"></i>
                        <span>Đổi Câu Khác</span>
                    </button>
                </div>
            </div>

            <!-- FEATURED HERO QUOTE CARD (SUPER-SIZED) -->
            <div class="relative overflow-hidden rounded-[36px] p-8 sm:p-14 lg:p-16 text-white shadow-2xl transition-all duration-500"
                 :class="'bg-gradient-to-br ' + currentQuote.bgGradient"
                 style="background-color: #0b0f19;">
                
                <!-- Background Glow Decor -->
                <div class="absolute -right-20 -bottom-20 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
                <div class="absolute top-4 right-10 text-[160px] lg:text-[200px] font-serif text-white/5 pointer-events-none select-none leading-none">“</div>

                <div class="relative z-10">
                    <!-- Category Tag & Actions -->
                    <div class="flex items-center justify-between gap-4 mb-8">
                        <div class="flex items-center gap-3">
                            <span class="px-5 py-2 rounded-2xl text-sm sm:text-base font-black bg-white/15 backdrop-blur-md text-amber-300 border border-white/20 flex items-center gap-2.5 shadow-sm">
                                <i :class="currentQuote.icon" class="text-lg"></i>
                                {{ currentQuote.tag }}
                            </span>
                            <span class="text-sm sm:text-base text-gray-300 font-mono font-bold">#{{ currentQuote.id }} / {{ quotes.length }}</span>
                        </div>

                        <div class="flex items-center gap-3">
                            <!-- Copy Button -->
                            <button @click="copyQuote(currentQuote)" 
                                    class="w-13 h-13 rounded-2xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all backdrop-blur-md border border-white/20 active:scale-95 text-lg"
                                    :title="isCopied ? 'Đã sao chép!' : 'Sao chép câu nói'">
                                <i class="fa-solid" :class="isCopied ? 'fa-check text-emerald-400' : 'fa-copy'"></i>
                            </button>

                            <!-- Favorite Button -->
                            <button @click="toggleFavorite(currentQuote.id)" 
                                    class="w-13 h-13 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all backdrop-blur-md border border-white/20 active:scale-95 text-lg"
                                    :class="isFav(currentQuote.id) ? 'text-rose-400 bg-rose-500/25 border-rose-500/40' : 'text-white'"
                                    title="Lưu vào mục yêu thích">
                                <i class="fa-solid fa-heart" :class="isFav(currentQuote.id) ? 'text-rose-400 scale-110' : ''"></i>
                            </button>
                        </div>
                    </div>

                    <!-- English Quote (Super Big typography) -->
                    <div class="my-8">
                        <p class="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white font-serif italic mb-8 drop-shadow-md">
                            "{{ currentQuote.quote }}"
                        </p>
                    </div>

                    <!-- Vietnamese Translation (Super Big & Clear) -->
                    <div class="p-6 sm:p-8 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md max-w-4xl mb-10 shadow-lg">
                        <p class="text-xl sm:text-2xl lg:text-3xl text-indigo-100 font-bold leading-relaxed">
                            {{ currentQuote.translation }}
                        </p>
                    </div>

                    <!-- Author & Shuffle Button -->
                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-6 border-t border-white/20">
                        <div class="flex items-center gap-5">
                            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-black text-2xl text-white shadow-xl">
                                {{ currentQuote.author.charAt(0) }}
                            </div>
                            <div>
                                <h4 class="font-black text-white text-xl sm:text-2xl leading-tight">{{ currentQuote.author }}</h4>
                                <span class="text-sm sm:text-base text-gray-300 font-semibold">Tác giả & Danh nhân</span>
                            </div>
                        </div>

                        <button @click="nextQuote" class="sm:hidden w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-base flex items-center justify-center gap-3 shadow-xl">
                            <i class="fa-solid fa-shuffle text-lg"></i>
                            Đổi Câu Khác
                        </button>
                    </div>
                </div>
            </div>

            <!-- CATEGORY FILTER TABS (Large & Readable) -->
            <div class="flex items-center gap-3 overflow-x-auto pb-3 scrollbar-hide">
                <button @click="selectedCategory = 'all'" 
                        class="px-7 py-3.5 rounded-2xl text-sm sm:text-base font-black transition-all shrink-0 flex items-center gap-3 border shadow-sm"
                        :class="selectedCategory === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/25 scale-105' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'">
                    <i class="fa-solid fa-layer-group text-lg"></i> Tất Cả ({{ quotes.length }})
                </button>
                <button @click="selectedCategory = 'discipline'" 
                        class="px-7 py-3.5 rounded-2xl text-sm sm:text-base font-black transition-all shrink-0 flex items-center gap-3 border shadow-sm"
                        :class="selectedCategory === 'discipline' ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-500/25 scale-105' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'">
                    <i class="fa-solid fa-fire-flame-curved text-rose-500 text-lg"></i> Kỷ Luật
                </button>
                <button @click="selectedCategory = 'habits'" 
                        class="px-7 py-3.5 rounded-2xl text-sm sm:text-base font-black transition-all shrink-0 flex items-center gap-3 border shadow-sm"
                        :class="selectedCategory === 'habits' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/25 scale-105' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'">
                    <i class="fa-solid fa-chart-line-up text-emerald-500 text-lg"></i> Thói Quen
                </button>
                <button @click="selectedCategory = 'growth'" 
                        class="px-7 py-3.5 rounded-2xl text-sm sm:text-base font-black transition-all shrink-0 flex items-center gap-3 border shadow-sm"
                        :class="selectedCategory === 'growth' ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-500/25 scale-105' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'">
                    <i class="fa-solid fa-bolt text-amber-500 text-lg"></i> Khởi Đầu & Phát Triển
                </button>
                <button @click="selectedCategory = 'language'" 
                        class="px-7 py-3.5 rounded-2xl text-sm sm:text-base font-black transition-all shrink-0 flex items-center gap-3 border shadow-sm"
                        :class="selectedCategory === 'language' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25 scale-105' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'">
                    <i class="fa-solid fa-earth-americas text-blue-500 text-lg"></i> Ngôn Ngữ
                </button>
                <button @click="selectedCategory = 'fav'" 
                        class="px-7 py-3.5 rounded-2xl text-sm sm:text-base font-black transition-all shrink-0 flex items-center gap-3 border shadow-sm"
                        :class="selectedCategory === 'fav' ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/25 scale-105' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'">
                    <i class="fa-solid fa-heart text-rose-500 text-lg"></i> Yêu Thích ({{ favorites.length }})
                </button>
            </div>

            <!-- QUOTES GRID COLLECTION (2-COLUMNS ON DESKTOP FOR WIDE SPACIOUS CARDS!) -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 sm:gap-10">
                <div v-for="(item, idx) in filteredQuotes" :key="item.id"
                     @click="selectQuote(quotes.indexOf(item))"
                     class="bg-white rounded-[32px] p-8 sm:p-10 border-2 border-gray-100 hover:border-indigo-400 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer group relative overflow-hidden">
                    
                    <!-- Top Category & Fav -->
                    <div class="flex items-center justify-between mb-6">
                        <span class="px-4 py-2 rounded-2xl text-xs sm:text-sm font-black bg-indigo-50 text-indigo-800 flex items-center gap-2 border border-indigo-100">
                            <i :class="item.icon" class="text-sm"></i>
                            {{ item.tag }}
                        </span>
                        <button @click.stop="toggleFavorite(item.id)" 
                                class="w-11 h-11 rounded-2xl flex items-center justify-center transition-colors"
                                :class="isFav(item.id) ? 'text-rose-500 bg-rose-50' : 'text-gray-300 hover:text-rose-400 hover:bg-rose-50/60'">
                            <i class="fa-solid fa-heart text-lg"></i>
                        </button>
                    </div>

                    <!-- English Text (Huge & Impactful) -->
                    <p class="text-gray-900 font-black text-xl sm:text-2xl lg:text-3xl leading-snug font-serif italic mb-5 group-hover:text-indigo-600 transition-colors">
                        "{{ item.quote }}"
                    </p>

                    <!-- Vietnamese Text (Clear & Easy on the eyes) -->
                    <p class="text-gray-600 text-base sm:text-lg leading-relaxed line-clamp-3 mb-8 font-semibold">
                        {{ item.translation }}
                    </p>

                    <!-- Footer Author -->
                    <div class="pt-5 border-t border-gray-100 flex items-center justify-between text-base">
                        <span class="font-black text-gray-900 text-base sm:text-lg">— {{ item.author }}</span>
                        <span class="text-xs sm:text-sm text-gray-400 font-mono font-bold">#{{ item.id }}</span>
                    </div>
                </div>
            </div>

            <!-- Bottom Motivation Banner -->
            <div class="mt-10 p-10 sm:p-12 rounded-[36px] bg-gradient-to-r from-amber-50 via-orange-50 to-indigo-50 border-2 border-amber-200/80 flex flex-col md:flex-row items-center justify-between gap-8 shadow-md">
                <div class="flex items-center gap-6">
                    <div class="w-20 h-20 rounded-3xl bg-white p-3 shadow-lg shrink-0 flex items-center justify-center text-5xl select-none">
                        ⭐
                    </div>
                    <div>
                        <h3 class="text-2xl sm:text-3xl font-black text-gray-900">Sức mạnh của 1% mỗi ngày!</h3>
                        <p class="text-base sm:text-lg text-gray-700 leading-relaxed font-semibold mt-2">
                            Nếu bạn tốt hơn 1% mỗi ngày trong vòng 1 năm, bạn sẽ tiến bộ gấp <b>37 lần</b>. Hãy hoàn thành ngay 1 phiên ôn tập hôm nay để duy trì ngọn lửa!
                        </p>
                    </div>
                </div>
                <button @click="store.navigate('dashboard')" class="px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-lg shadow-2xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all shrink-0">
                    Bắt Đầu Học Ngay 🚀
                </button>
            </div>

        </div>
    `
};
