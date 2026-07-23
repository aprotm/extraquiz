export const BADGES_DICT = [
    // ==================================================
    // CƠ BẢN (CŨ)
    // ==================================================
    { id: 'first_deck', category: 'Cơ Bản', icon: '🌱', title: 'Khởi Đầu Mới', desc: 'Tạo bộ thẻ đầu tiên của bạn.', condition: (profile) => profile.hasFirstDeck === true },
    { id: 'night_owl', category: 'Cơ Bản', icon: '🦉', title: 'Cú Đêm', desc: 'Chăm chỉ học bài vào lúc 12h đêm đến 4h sáng.', condition: (profile) => false }, // manually unlocked in study.js
    { id: 'flash', category: 'Cơ Bản', icon: '⚡', title: 'Tia Chớp', desc: 'Nhớ ra từ vựng siêu tốc dưới 2 giây.', condition: (profile) => false }, // manually unlocked in study.js
    { id: 'bookworm', category: 'Cơ Bản', icon: '📚', title: 'Mọt Sách', desc: 'Đạt điểm tuyệt đối 100đ trong bài luyện Reading.', condition: (profile) => false }, // manually unlocked in reading.js
    { id: 'weekend_warrior', category: 'Cơ Bản', icon: '⚔️', title: 'Chiến Binh Cuối Tuần', desc: 'Học vào thứ Bảy hoặc Chủ Nhật.', condition: (profile) => false }, // manually unlocked in store.js getStudyStats
    { id: 'rich_kid', category: 'Cơ Bản', icon: '💎', title: 'Đại Gia', desc: 'Sở hữu hơn 1000 LexiCredit.', condition: (profile) => (profile.lexiCredit || 0) >= 1000 },
    { id: 'perfect_week', category: 'Cơ Bản', icon: '🔥', title: 'Tuần Lễ Vàng', desc: 'Đạt chuỗi học 7 ngày liên tiếp.', condition: (profile) => (profile.currentStreak || 0) >= 7 },

    // ==================================================
    // STREAK
    // ==================================================
    { id: 'word_activator', category: 'Cơ Bản', icon: '🔥', title: 'Word Activator', desc: 'Lần đầu tiên nâng cấp một từ vựng từ Passive lên Active.', condition: (profile) => false }, // manually unlocked
    {
        id: 'streak_3',
        category: 'Streak',
        icon: 'zap',
        title: 'Spark',
        desc: 'Study for 3 consecutive days.',
        condition: (profile) => (profile.currentStreak || 0) >= 3
    },
    {
        id: 'streak_7',
        category: 'Streak',
        icon: 'flame',
        title: 'Flame',
        desc: 'Study for 7 consecutive days.',
        condition: (profile) => (profile.currentStreak || 0) >= 7
    },
    {
        id: 'streak_30',
        category: 'Streak',
        icon: 'flame-kindling',
        title: 'Inferno',
        desc: 'Study for 30 consecutive days.',
        condition: (profile) => (profile.currentStreak || 0) >= 30
    },
    {
        id: 'streak_100',
        category: 'Streak',
        icon: 'mountain',
        title: 'Unstoppable',
        desc: 'Study for 100 consecutive days.',
        rarity: 'legendary',
        condition: (profile) => (profile.currentStreak || 0) >= 100
    },
    {
        id: 'streak_365',
        category: 'Streak',
        icon: 'crown',
        title: 'Legend',
        desc: 'Study for 365 consecutive days.',
        rarity: 'mythic',
        condition: (profile) => (profile.currentStreak || 0) >= 365
    },

    // ==================================================
    // LEXICREDIT
    // ==================================================
    {
        id: 'lc_100',
        category: 'LexiCredit',
        icon: 'coins',
        title: 'First Coin',
        desc: 'Earn 100 LexiCredit.',
        condition: (profile) => (profile.lexiCredit || 0) >= 100
    },
    {
        id: 'lc_1000',
        category: 'LexiCredit',
        icon: 'gem',
        title: 'Collector',
        desc: 'Earn 1000 LexiCredit.',
        condition: (profile) => (profile.lexiCredit || 0) >= 1000
    },
    {
        id: 'lc_10000',
        category: 'LexiCredit',
        icon: 'crown',
        title: 'Millionaire',
        desc: 'Earn 10000 LexiCredit.',
        rarity: 'legendary',
        condition: (profile) => (profile.lexiCredit || 0) >= 10000
    },
    {
        id: 'lc_investor',
        category: 'LexiCredit',
        icon: 'landmark',
        title: 'Investor',
        desc: 'Successfully invest LexiCredit in the Marketplace at least once.',
        condition: (profile) => profile.hasInvested === true
    },
    {
        id: 'lc_tycoon',
        category: 'LexiCredit',
        icon: 'circle-dollar-sign',
        title: 'Tycoon',
        desc: 'Reach the Top 5% of all users ranked by LexiCredit.',
        rarity: 'mythic',
        condition: (profile) => profile.isTop5Percent === true
    },

    // ==================================================
    // AI PERSONA
    // ==================================================
    {
        id: 'ai_focus',
        category: 'AI Persona',
        icon: 'target',
        title: 'Focus Master',
        desc: 'Focus Score ≥ 90',
        condition: (profile) => (profile.aiPersona?.focusScore || 0) >= 90
    },
    {
        id: 'ai_critical',
        category: 'AI Persona',
        icon: 'brain',
        title: 'Critical Thinker',
        desc: 'Confidence Score ≥ 90',
        condition: (profile) => (profile.aiPersona?.confidenceScore || 0) >= 90
    },
    {
        id: 'ai_fast',
        category: 'AI Persona',
        icon: 'rocket',
        title: 'Fast Learner',
        desc: 'Learning Speed is rated High by AI.',
        condition: (profile) => profile.aiPersona?.learningSpeed === 'High'
    },
    {
        id: 'ai_wisdom',
        category: 'AI Persona',
        icon: 'bird',
        title: 'Wisdom',
        desc: 'Metacognition Score ≥ 90',
        condition: (profile) => (profile.aiPersona?.metacognitionScore || 0) >= 90
    },
    {
        id: 'ai_persistence',
        category: 'AI Persona',
        icon: 'dumbbell',
        title: 'Never Give Up',
        desc: 'Persistence Score ≥ 90',
        condition: (profile) => (profile.aiPersona?.persistenceScore || 0) >= 90
    },

    // ==================================================
    // VOCABULARY DNA
    // ==================================================
    {
        id: 'dna_academic',
        category: 'Vocabulary DNA',
        icon: 'flask-conical',
        title: 'Academic DNA',
        desc: 'Academic Vocabulary Score ≥ 90',
        condition: (profile) => (profile.vocabDNA?.academicScore || 0) >= 90
    },
    {
        id: 'dna_business',
        category: 'Vocabulary DNA',
        icon: 'briefcase-business',
        title: 'Business DNA',
        desc: 'Business Vocabulary Score ≥ 90',
        condition: (profile) => (profile.vocabDNA?.businessScore || 0) >= 90
    },
    {
        id: 'dna_tech',
        category: 'Vocabulary DNA',
        icon: 'laptop',
        title: 'Tech DNA',
        desc: 'Technology Vocabulary Score ≥ 90',
        condition: (profile) => (profile.vocabDNA?.techScore || 0) >= 90
    },
    {
        id: 'dna_science',
        category: 'Vocabulary DNA',
        icon: 'microscope',
        title: 'Science DNA',
        desc: 'Science Vocabulary Score ≥ 90',
        condition: (profile) => (profile.vocabDNA?.scienceScore || 0) >= 90
    },
    {
        id: 'dna_arts',
        category: 'Vocabulary DNA',
        icon: 'palette',
        title: 'Arts DNA',
        desc: 'Arts Vocabulary Score ≥ 90',
        condition: (profile) => (profile.vocabDNA?.artsScore || 0) >= 90
    }
];
