// ==========================================================================
// LEXILEARN PRO - TROPHY ROOM & BADGE SYSTEM (28 STANDARD + ADMIN EXCLUSIVE)
// ==========================================================================

export const BADGES_DICT = [
    // ==================================================
    // 1. CƠ BẢN & THÓI QUEN HỌC TẬP (6 Badges)
    // ==================================================
    {
        id: 'first_deck',
        category: 'Cơ Bản',
        icon: '🌱',
        emoji: '🌱',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Seedling/3D/seedling_3d.png',
        title: 'Khởi Đầu Mới',
        desc: 'Tạo bộ thẻ từ vựng đầu tiên của bạn.',
        condition: (profile) => profile.hasFirstDeck === true
    },
    {
        id: 'night_owl',
        category: 'Cơ Bản',
        icon: '🦉',
        emoji: '🦉',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Owl/3D/owl_3d.png',
        title: 'Cú Đêm',
        desc: 'Chăm chỉ học bài vào lúc 0h đêm đến 4h sáng.',
        condition: () => false // Manually unlocked in study.js
    },
    {
        id: 'flash',
        category: 'Cơ Bản',
        icon: '⚡',
        emoji: '⚡',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/High%20voltage/3D/high_voltage_3d.png',
        title: 'Tia Chớp',
        desc: 'Nhớ ra từ vựng siêu tốc dưới 2 giây.',
        condition: () => false // Manually unlocked in study.js
    },
    {
        id: 'weekend_warrior',
        category: 'Cơ Bản',
        icon: '⚔️',
        emoji: '⚔️',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Crossed%20swords/3D/crossed_swords_3d.png',
        title: 'Chiến Binh Cuối Tuần',
        desc: 'Chăm chỉ học vào thứ Bảy hoặc Chủ Nhật.',
        condition: () => false // Manually unlocked in store.js
    },
    {
        id: 'word_activator',
        category: 'Cơ Bản',
        icon: '⭐',
        emoji: '⭐',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Glowing%20star/3D/glowing_star_3d.png',
        title: 'Word Activator',
        desc: 'Luyện tập và làm chủ từ vựng xuất sắc trong chế độ Học Đa Chiều.',
        condition: () => false // Manually unlocked in learn.js
    },
    {
        id: 'perfect_week',
        category: 'Cơ Bản',
        icon: '🔥',
        emoji: '🔥',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Fire/3D/fire_3d.png',
        title: 'Tuần Lễ Vàng',
        desc: 'Duy trì chuỗi học liên tục suốt 7 ngày.',
        condition: (profile) => (profile.currentStreak || 0) >= 7
    },

    // ==================================================
    // 2. CHUỖI NGÀY HỌC (5 Badges)
    // ==================================================
    {
        id: 'streak_3',
        category: 'Chuỗi Ngày',
        icon: 'zap',
        emoji: '✨',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Sparkles/3D/sparkles_3d.png',
        title: 'Spark',
        desc: 'Học tập liên tục 3 ngày liên tiếp.',
        condition: (profile) => (profile.currentStreak || 0) >= 3
    },
    {
        id: 'streak_7',
        category: 'Chuỗi Ngày',
        icon: 'flame',
        emoji: '🔥',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Fire/3D/fire_3d.png',
        title: 'Flame',
        desc: 'Học tập liên tục 7 ngày liên tiếp.',
        condition: (profile) => (profile.currentStreak || 0) >= 7
    },
    {
        id: 'streak_30',
        category: 'Chuỗi Ngày',
        icon: 'flame-kindling',
        emoji: '❤️‍🔥',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Red%20heart/3D/red_heart_3d.png',
        title: 'Inferno',
        desc: 'Học tập kiên trì liên tục 30 ngày.',
        condition: (profile) => (profile.currentStreak || 0) >= 30
    },
    {
        id: 'streak_100',
        category: 'Chuỗi Ngày',
        icon: 'mountain',
        emoji: '🏔️',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Mountain/3D/mountain_3d.png',
        title: 'Bất Khả Chiến Bại',
        desc: 'Học tập phi thường liên tục 100 ngày.',
        rarity: 'legendary',
        condition: (profile) => (profile.currentStreak || 0) >= 100
    },
    {
        id: 'streak_365',
        category: 'Chuỗi Ngày',
        icon: 'crown',
        emoji: '👑',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Crown/3D/crown_3d.png',
        title: 'Huyền Thoại 365',
        desc: 'Đạt chuỗi học 365 ngày trọn vẹn 1 năm.',
        rarity: 'mythic',
        condition: (profile) => (profile.currentStreak || 0) >= 365
    },

    // ==================================================
    // 3. LEXICREDIT (4 Badges)
    // ==================================================
    {
        id: 'lc_100',
        category: 'LexiCredit',
        icon: 'coins',
        emoji: '🪙',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Coin/3D/coin_3d.png',
        title: 'Đồng Xu Đầu Tiên',
        desc: 'Tích lũy đạt mốc 100 LexiCredit.',
        condition: (profile) => (profile.lexiCredit || 0) >= 100
    },
    {
        id: 'lc_500',
        category: 'LexiCredit',
        icon: 'gem',
        emoji: '💰',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Money%20bag/3D/money_bag_3d.png',
        title: 'Nhà Sưu Tầm',
        desc: 'Tích lũy đạt mốc 500 LexiCredit.',
        condition: (profile) => (profile.lexiCredit || 0) >= 500
    },
    {
        id: 'lc_1000',
        category: 'LexiCredit',
        icon: 'gem',
        emoji: '💎',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Gem%20stone/3D/gem_stone_3d.png',
        title: 'Đại Gia',
        desc: 'Sở hữu trên 1,000 LexiCredit.',
        condition: (profile) => (profile.lexiCredit || 0) >= 1000
    },
    {
        id: 'lc_10000',
        category: 'LexiCredit',
        icon: 'trophy',
        emoji: '🏆',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Trophy/3D/trophy_3d.png',
        title: 'Triệu Phú',
        desc: 'Đạt mốc đỉnh cao 10,000 LexiCredit.',
        rarity: 'legendary',
        condition: (profile) => (profile.lexiCredit || 0) >= 10000
    },

    // ==================================================
    // 4. VÕ ĐÀI TRÒ CHƠI ARCADE (4 Badges)
    // ==================================================
    {
        id: 'boss_slayer',
        category: 'Trò Chơi Arcade',
        icon: 'skull',
        emoji: '💀',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Skull/3D/skull_3d.png',
        title: 'Đồ Tể Boss',
        desc: 'Đánh bại Boss thành công trong chế độ Đấu Trùm Speed Rush.',
        condition: () => false // Manually unlocked in bossbattle.js
    },
    {
        id: 'speed_demon',
        category: 'Trò Chơi Arcade',
        icon: 'bolt',
        emoji: '⚡',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Zap/3D/zap_3d.png',
        title: 'Thần Tốc Cyber Grid',
        desc: 'Hoàn thành bài Nối Cặp Từ Cyber Grid dưới 20 giây.',
        condition: () => false // Manually unlocked in matchinggame.js
    },
    {
        id: 'cyber_hacker',
        category: 'Trò Chơi Arcade',
        icon: 'terminal',
        emoji: '💻',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Laptop/3D/laptop_3d.png',
        title: 'Cyber Phantom',
        desc: 'Giải mã thành công toàn bộ chiến dịch mật mã Cyber Cipher.',
        condition: () => false // Manually unlocked in cybercipher.js
    },
    {
        id: 'ai_duelist',
        category: 'Trò Chơi Arcade',
        icon: 'robot',
        emoji: '🤖',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Robot/3D/robot_3d.png',
        title: 'Khắc Tinh AI',
        desc: 'Chiến thắng vang dội trước Bot trong Đấu Trí AI Arena.',
        condition: () => false // Manually unlocked in aiarena.js
    },

    // ==================================================
    // 5. KỸ NĂNG & CÔNG CỤ AI (4 Badges)
    // ==================================================
    {
        id: 'bookworm',
        category: 'Kỹ Năng AI',
        icon: 'book-open',
        emoji: '📚',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Books/3D/books_3d.png',
        title: 'Mọt Sách AI',
        desc: 'Đạt điểm tuyệt đối 100đ trong bài luyện Reading.',
        condition: () => false // Manually unlocked in reading.js
    },
    {
        id: 'dictation_hero',
        category: 'Kỹ Năng AI',
        icon: 'headphones',
        emoji: '🎧',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Headphone/3D/headphone_3d.png',
        title: 'Đôi Tai Vàng',
        desc: 'Hoàn thành bài Nghe - Chép Chính Tả với độ chính xác 100%.',
        condition: () => false // Manually unlocked in dictation.js
    },
    {
        id: 'essay_master',
        category: 'Kỹ Năng AI',
        icon: 'pen-nib',
        emoji: '✍️',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Fountain%20pen/3D/fountain_pen_3d.png',
        title: 'Cây Bút Vàng',
        desc: 'Gửi bài chấm điểm AI Writing Grader và nhận phân tích chi tiết.',
        condition: () => false // Manually unlocked in writinggrader.js
    },
    {
        id: 'paraphrase_pro',
        category: 'Kỹ Năng AI',
        icon: 'bullseye',
        emoji: '🎯',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Direct%20hit/3D/direct_hit_3d.png',
        title: 'Bậc Thầy Diễn Đạt',
        desc: 'Hoàn thành xuất sắc phiên luyện tập cùng Huấn Luyện Viên Paraphrase.',
        condition: () => false // Manually unlocked in paraphrasingcoach.js
    },

    // ==================================================
    // 6. TRÍ TUỆ NÃO BỘ & AI PERSONA (5 Badges)
    // ==================================================
    {
        id: 'ai_focus',
        category: 'Trí Tuệ Não Bộ',
        icon: 'target',
        emoji: '🎯',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Bullseye/3D/bullseye_3d.png',
        title: 'Siêu Tập Trung',
        desc: 'Chỉ số Tập Trung (Focus) đạt ≥ 80 điểm trong mô hình HLR Persona.',
        condition: (profile) => (profile.learning_persona?.focus || 0) >= 80
    },
    {
        id: 'ai_persistence',
        category: 'Trí Tuệ Não Bộ',
        icon: 'biceps',
        emoji: '🥊',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Flexed%20biceps/Default/3D/flexed_biceps_3d_default.png',
        title: 'Bền Bỉ Vô Song',
        desc: 'Chỉ số Kiên Trì (Persistence) đạt ≥ 80 điểm sau các lần thử thách.',
        condition: (profile) => (profile.learning_persona?.persistence || 0) >= 80
    },
    {
        id: 'ai_wisdom',
        category: 'Trí Tuệ Não Bộ',
        icon: 'crystal-ball',
        emoji: '🔮',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Crystal%20ball/3D/crystal_ball_3d.png',
        title: 'Trí Tuệ Sâu Sắc',
        desc: 'Chỉ số Nhận Thức (Metacognition) đạt ≥ 80 điểm khi nghiên cứu gợi ý AI.',
        condition: (profile) => (profile.learning_persona?.metacognition || 0) >= 80
    },
    {
        id: 'ai_explorer',
        category: 'Trí Tuệ Não Bộ',
        icon: 'compass',
        emoji: '🧭',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Compass/3D/compass_3d.png',
        title: 'Nhà Thám Hiểm',
        desc: 'Chỉ số Khám Phá (Exploration) đạt ≥ 80 điểm khi chủ động nạp từ mới.',
        condition: (profile) => (profile.learning_persona?.exploration || 0) >= 80
    },
    {
        id: 'ai_confidence',
        category: 'Trí Tuệ Não Bộ',
        icon: 'brain',
        emoji: '🧠',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Brain/3D/brain_3d.png',
        title: 'Tự Tin Tuyệt Đối',
        desc: 'Chỉ số Tin Cậy (Confidence) của Hồ Sơ Não Bộ đạt ≥ 80 điểm.',
        condition: (profile) => (profile.learning_persona?.confidence || 0) >= 80
    }
];

// ==========================================================================
// EXCLUSIVE ADMIN / FOUNDER LEGACY BADGES (Dành Riêng Cho Admin)
// ==========================================================================
export const EXCLUSIVE_ADMIN_BADGES = [
    {
        id: 'founder',
        category: 'Đặc Quyền Admin',
        icon: 'crown',
        emoji: '👑',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Crown/3D/crown_3d.png',
        title: 'Founder & Architect',
        desc: 'Huy hiệu Nhà Sáng Lập & Kiến Trúc Sư Tối Cao của LexiLearn Pro.',
        isExclusive: true,
        rarity: 'mythic'
    },
    {
        id: 'admin_nexus',
        category: 'Đặc Quyền Admin',
        icon: 'shield',
        emoji: '🛡️',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Shield/3D/shield_3d.png',
        title: 'Hệ Thống Tối Cao',
        desc: 'Quyền năng Quản trị viên Tối Cao kiểm soát toàn bộ cơ sở dữ liệu.',
        isExclusive: true,
        rarity: 'mythic'
    },
    {
        id: 'dna_academic',
        category: 'Di Sản Exclusive',
        icon: 'graduation-cap',
        emoji: '🎓',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Graduation%20cap/3D/graduation_cap_3d.png',
        title: 'Academic DNA (Legacy)',
        desc: 'Di sản huy hiệu DNA Học thuật thời kỳ Alpha.',
        isExclusive: true,
        rarity: 'legendary'
    },
    {
        id: 'dna_business',
        category: 'Di Sản Exclusive',
        icon: 'briefcase',
        emoji: '💼',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Briefcase/3D/briefcase_3d.png',
        title: 'Business DNA (Legacy)',
        desc: 'Di sản huy hiệu DNA Thương mại thời kỳ Alpha.',
        isExclusive: true,
        rarity: 'legendary'
    },
    {
        id: 'dna_tech',
        category: 'Di Sản Exclusive',
        icon: 'laptop',
        emoji: '💻',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Laptop/3D/laptop_3d.png',
        title: 'Tech DNA (Legacy)',
        desc: 'Di sản huy hiệu DNA Công nghệ thời kỳ Alpha.',
        isExclusive: true,
        rarity: 'legendary'
    },
    {
        id: 'dna_science',
        category: 'Di Sản Exclusive',
        icon: 'microscope',
        emoji: '🔬',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Microscope/3D/microscope_3d.png',
        title: 'Science DNA (Legacy)',
        desc: 'Di sản huy hiệu DNA Khoa học thời kỳ Alpha.',
        isExclusive: true,
        rarity: 'legendary'
    },
    {
        id: 'dna_arts',
        category: 'Di Sản Exclusive',
        icon: 'palette',
        emoji: '🎨',
        image3d: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Artist%20palette/3D/artist_palette_3d.png',
        title: 'Arts DNA (Legacy)',
        desc: 'Di sản huy hiệu DNA Nghệ thuật thời kỳ Alpha.',
        isExclusive: true,
        rarity: 'legendary'
    }
];

// Helper: Lấy danh sách huy hiệu hiển thị theo vai trò người dùng
export function getVisibleBadges(profile) {
    if (!profile) return BADGES_DICT;
    if (profile.role === 'admin' || profile.isAdmin === true) {
        return [...BADGES_DICT, ...EXCLUSIVE_ADMIN_BADGES];
    }
    return BADGES_DICT;
}

// Helper: Tìm kiếm thông tin huy hiệu theo ID từ toàn bộ từ điển
export function getBadgeById(id) {
    const all = [...BADGES_DICT, ...EXCLUSIVE_ADMIN_BADGES];
    return all.find(b => b.id === id) || null;
}
