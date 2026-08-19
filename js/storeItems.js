// LexiStore Catalog Database
export const STORE_CATEGORIES = [
    { id: 'all', name: 'Tất Cả', icon: 'fa-solid fa-sparkles' },
    { id: 'decks', name: 'Kho Bộ Thẻ', icon: 'fa-solid fa-layer-group' },
    { id: 'buffs', name: 'Vật Phẩm Buff', icon: 'fa-solid fa-bolt' },
    { id: 'themes', name: 'Cyber Themes', icon: 'fa-solid fa-palette' },
    { id: 'cosmetics', name: 'Khung Avatar', icon: 'fa-solid fa-crown' }
];

export const STORE_ITEMS = [
    // ===== 1. KHO BỘ THẺ CAO CẤP (PREMIUM DECKS) =====
    {
        id: 'deck_ielts_80_collocations',
        title: 'IELTS 8.0+ Academic Collocations Master',
        category: 'decks',
        price: 250,
        badge: 'HOT',
        rarity: 'legendary',
        icon3d: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Books.png',
        fallbackIcon: '📚',
        description: 'Tuyển tập 250 cụm Collocations tinh hoa phân loại theo 12 chủ đề Academic Writing Task 2 & Speaking Band 8.0+.',
        features: ['250 thẻ từ vựng chuẩn Cambridge', 'Ví dụ học thuật Band 8.0+', 'Audio phát âm giọng Anh-Mỹ chuẩn'],
        deckData: {
            cards: [
                { id: 'c1', term: 'exert a profound influence on', definition: 'Tạo ra ảnh hưởng sâu sắc lên điều gì', example: 'Digital technology exerts a profound influence on modern education.', status: 'learning' },
                { id: 'c2', term: 'pose a grave threat to', definition: 'Đặt ra mối đe dọa nghiêm trọng đối với', example: 'Climate change poses a grave threat to global biodiversity.', status: 'learning' },
                { id: 'c3', term: 'reap substantial benefits from', definition: 'Gặt hái những lợi ích đáng kể từ', example: 'Students reap substantial benefits from consistent spaced repetition.', status: 'learning' },
                { id: 'c4', term: 'wreak havoc on', definition: 'Gây ra sự tàn phá nặng nề đối với', example: 'Deforestation wreaks havoc on local ecosystems.', status: 'learning' },
                { id: 'c5', term: 'bridge the disparity between', definition: 'Thu hẹp khoảng cách bất bình đẳng giữa', example: 'Universal education bridges the disparity between rich and poor.', status: 'learning' },
                { id: 'c6', term: 'fall prey to', definition: 'Trở thành nạn nhân của', example: 'Unwary consumers often fall prey to deceptive marketing tactics.', status: 'learning' },
                { id: 'c7', term: 'strike a delicate balance', definition: 'Đạt được sự cân bằng tinh tế', example: 'Governments must strike a delicate balance between economic growth and conservation.', status: 'learning' },
                { id: 'c8', term: 'act as a catalyst for', definition: 'Đóng vai trò là chất xúc tác thúc đẩy', example: 'Artificial intelligence acts as a catalyst for educational breakthroughs.', status: 'learning' }
            ]
        }
    },
    {
        id: 'deck_oxford_5000_core',
        title: 'Oxford 3000 & 5000 Core Vocabulary',
        category: 'decks',
        price: 350,
        badge: 'BESTSELLER',
        rarity: 'mythic',
        icon3d: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Graduation%20Cap.png',
        fallbackIcon: '🎓',
        description: 'Kho 5000 từ vựng cốt lõi quan trọng nhất trong tiếng Anh giao tiếp & học thuật do Đại học Oxford chứng nhận.',
        features: ['Từ vựng CEFR B1 - C1', 'Đầy đủ phiên âm IPA & Word Family', 'Mẫu câu áp dụng thực tế đời sống'],
        deckData: {
            cards: [
                { id: 'ox1', term: 'Ambiguity', definition: 'Sự mơ hồ, không rõ ràng, có nhiều nghĩa', example: 'Clear documentation avoids ambiguity in code design.', status: 'learning' },
                { id: 'ox2', term: 'Pragmatic', definition: 'Thực tế, thực dụng, giải quyết dựa trên thực tế', example: 'We took a pragmatic approach to language learning.', status: 'learning' },
                { id: 'ox3', term: 'Cognizant', definition: 'Nhận thức được, hiểu rõ về điều gì', example: 'The researchers were cognizant of potential cognitive biases.', status: 'learning' },
                { id: 'ox4', term: 'Ubiquitous', definition: 'Có mặt ở khắp mọi nơi, phổ biến', example: 'Smartphones have become ubiquitous in daily life.', status: 'learning' },
                { id: 'ox5', term: 'Paradigm', definition: 'Mô hình, mẫu hình tiêu biểu', example: 'Spaced repetition represents a paradigm shift in memory science.', status: 'learning' }
            ]
        }
    },
    {
        id: 'deck_business_negotiation',
        title: 'Business English & Corporate Negotiation',
        category: 'decks',
        price: 200,
        badge: 'PRO',
        rarity: 'epic',
        icon3d: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Briefcase.png',
        fallbackIcon: '💼',
        description: 'Bộ từ vựng đàm phán thương mại, thuyết trình kinh doanh, hợp đồng và quản trị tài chính quốc tế.',
        features: ['180 thuật ngữ kinh doanh cao cấp', 'Kỹ thuật đàm phán & chốt hợp đồng', 'Tình huống thực chiến phòng họp'],
        deckData: {
            cards: [
                { id: 'biz1', term: 'Synergy', definition: 'Sự hợp lực, hiệu ứng cộng hưởng', example: 'The corporate merger generated powerful commercial synergy.', status: 'learning' },
                { id: 'biz2', term: 'Leverage', definition: 'Tận dụng đòn bẩy, tối ưu hóa lợi thế', example: 'We can leverage AI tools to accelerate vocabulary mastery.', status: 'learning' },
                { id: 'biz3', term: 'Due diligence', definition: 'Quá trình thẩm định cẩn trọng, kiểm tra kỹ lưỡng', example: 'The venture capital team conducted thorough due diligence.', status: 'learning' },
                { id: 'biz4', term: 'Bottleneck', definition: 'Điểm nghẽn, nút thắt cản trở quy trình', example: 'Memory decay is the main bottleneck in vocabulary acquisition.', status: 'learning' }
            ]
        }
    },
    {
        id: 'deck_tech_ai_frontier',
        title: 'Tech, AI & Data Science Frontier',
        category: 'decks',
        price: 180,
        badge: 'TRENDING',
        rarity: 'epic',
        icon3d: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Laptop.png',
        fallbackIcon: '💻',
        description: 'Bộ từ vựng công nghệ thế hệ mới: Trí tuệ nhân tạo, Khoa học dữ liệu, Hệ thống phân tán & Cloud Computing.',
        features: ['Thuật ngữ kỹ thuật AI & Coding', 'Tiếng Anh đọc tài liệu Dev / Research', 'Thực hành phỏng vấn FAANG'],
        deckData: {
            cards: [
                { id: 'tech1', term: 'Hallucination', definition: 'Hiện tượng AI tạo ra thông tin giả/sai lệch', example: 'Prompt engineering helps reduce LLM hallucination.', status: 'learning' },
                { id: 'tech2', term: 'Latency', definition: 'Độ trễ truyền tải tín hiệu trong hệ thống', example: 'Edge caching significantly reduces application latency.', status: 'learning' },
                { id: 'tech3', term: 'Heuristic', definition: 'Phương pháp phỏng đoán, thuật giải dựa trên kinh nghiệm', example: 'Heuristic algorithms find practical solutions quickly.', status: 'learning' }
            ]
        }
    },

    // ===== 2. VẬT PHẨM HỖ TRỢ HỌC TẬP (POWER-UPS & BUFFS) =====
    {
        id: 'streak_freeze',
        title: 'Băng Bảo Vệ Chuỗi (Streak Freeze)',
        category: 'buffs',
        price: 120,
        badge: 'ESSENTIAL',
        rarity: 'epic',
        icon3d: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Ice.png',
        fallbackIcon: '🧊',
        description: 'Tự động bảo vệ chuỗi ngày học liên tục nếu bạn bận việc không thể học bài trong 1 ngày.',
        features: ['Tự động kích hoạt khi lỡ học', 'Bảo toàn chuỗi Streak lửa 🔥', 'Tích trữ tối đa 2 lượt trong kho']
    },
    {
        id: 'double_xp_24h',
        title: '2x LexiCredit Booster (24 Giờ)',
        category: 'buffs',
        price: 90,
        badge: 'BUFF',
        rarity: 'rare',
        icon3d: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Coin.png',
        fallbackIcon: '⚡',
        description: 'Nhân đôi toàn bộ số lượng LexiCredit và XP nhận được khi hoàn thành các bài học và trò chơi trong 24h.',
        features: ['Nhân 2 LC từ mọi chế độ', 'Hiệu lực liên tục 24 tiếng', 'Tăng tốc thăng cấp Rank nhanh chóng']
    },
    {
        id: 'ai_hint_pack',
        title: 'Gói 5 Gợi Ý AI Super Hints',
        category: 'buffs',
        price: 60,
        badge: 'UTILITY',
        rarity: 'rare',
        icon3d: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Light%20Bulb.png',
        fallbackIcon: '💡',
        description: 'Cộng thêm 5 lượt gợi ý thông minh từ AI trong chế độ Cyber Cipher, Đấu Trùm Boss và Đấu Trí AI Arena.',
        features: ['5 lượt gợi ý phân tích ký tự', 'Không bị trừ điểm khi dùng', 'Sử dụng tức thì trong các ván game']
    },

    // ===== 3. CYBER THEMES & AURA =====
    {
        id: 'theme_matrix',
        title: 'Giao Diện Cyber Matrix Neon',
        category: 'themes',
        price: 150,
        badge: 'COSMETIC',
        rarity: 'legendary',
        icon3d: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Glowing%20Star.png',
        fallbackIcon: '🌌',
        description: 'Khoác lên toàn bộ phòng lab phong cách hacker Ma Trận xanh ngọc neon với luồng ánh sáng huỳnh quang sống động.',
        features: ['Theme Aura Cyber Emerald', 'Viền phát sáng động', 'Đổi màu nút bấm và biểu đồ']
    },
    {
        id: 'theme_synthwave',
        title: 'Giao Diện Sunset Synthwave 80s',
        category: 'themes',
        price: 150,
        badge: 'COSMETIC',
        rarity: 'legendary',
        icon3d: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Sun.png',
        fallbackIcon: '🌅',
        description: 'Phong cách hoàng hôn Retro Synthwave với sắc hồng tím Laser và hiệu ứng hoàng hôn huyền ảo.',
        features: ['Laser Rose Aura', 'Gradient hoàng hôn rực rỡ', 'Hiệu ứng retro aesthetic']
    },

    // ===== 4. KHUNG AVATAR & DANH HIỆU =====
    {
        id: 'frame_cyber_hex',
        title: 'Khung Avatar Cyber Hexagon Ring',
        category: 'cosmetics',
        price: 160,
        badge: 'EXCLUSIVE',
        rarity: 'mythic',
        icon3d: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Sparkles.png',
        fallbackIcon: '🛡️',
        description: 'Vòng hào quang lục giác công nghệ cao bao quanh Avatar cá nhân của bạn trên toàn bộ hệ thống LexiLearn.',
        features: ['Khung avatar phát sáng', 'Hiển thị trên Topbar & Hồ sơ', 'Hiệu ứng neon xoay nhẹ']
    },
    {
        id: 'frame_gold_crown',
        title: 'Khung Avatar Imperial Gold Crown',
        category: 'cosmetics',
        price: 250,
        badge: 'ROYAL',
        rarity: 'mythic',
        icon3d: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Crown.png',
        fallbackIcon: '👑',
        description: 'Vương miện hoàng gia mạ vàng 24K tôn vinh những người học kiên trì và xuất sắc nhất.',
        features: ['Vương miện vàng 3D lấp lánh', 'Hiệu ứng hào quang hoàng gia', 'Khẳng định vị thế thủ khoa']
    }
];
