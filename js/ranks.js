export const LC_PER_LEVEL = 50;

export const RANK_LIST = [
    { minLevel: 1, maxLevel: 9, title: 'Mầm Non Ngôn Ngữ', icon: '🌱' },
    { minLevel: 10, maxLevel: 19, title: 'Kẻ Nhặt Con Chữ', icon: '✍️' },
    { minLevel: 20, maxLevel: 34, title: 'Kẻ Săn Từ Vựng', icon: '🗡️' },
    { minLevel: 35, maxLevel: 49, title: 'Học Giả Lang Thang', icon: '📜' },
    { minLevel: 50, maxLevel: 69, title: 'Phù Thủy Chính Tả', icon: '🧙' },
    { minLevel: 70, maxLevel: 89, title: 'Ma Sứ Ngữ Pháp', icon: '🔮' },
    { minLevel: 90, maxLevel: 119, title: 'Chiến Binh Flashcard', icon: '⚔️' },
    { minLevel: 120, maxLevel: 149, title: 'Kỵ Sĩ Từ Điển', icon: '🛡️' },
    { minLevel: 150, maxLevel: 179, title: 'Bậc Thầy Ghi Nhớ', icon: '📚' },
    { minLevel: 180, maxLevel: 219, title: 'Thợ Săn LexiCredit', icon: '💎' },
    { minLevel: 220, maxLevel: 259, title: 'Bậc Thầy Học Thuật', icon: '👑' },
    { minLevel: 260, maxLevel: 299, title: 'Hiền Triết Tri Thức', icon: '🦉' },
    { minLevel: 300, maxLevel: 349, title: 'Chúa Tể Từ Điển', icon: '📖' },
    { minLevel: 350, maxLevel: 399, title: 'Đại Pháp Sư Ngôn Từ', icon: '🔥' },
    { minLevel: 400, maxLevel: 449, title: 'Long Kỵ Sĩ Từ Vựng', icon: '🐉' },
    { minLevel: 450, maxLevel: 499, title: 'Lãnh Chúa Ngôn Ngữ', icon: '⚡' },
    { minLevel: 500, maxLevel: 599, title: 'Đế Vương Khẩu Ngữ', icon: '🦁' },
    { minLevel: 600, maxLevel: 699, title: 'Sứ Giả Đa Ngôn Ngữ', icon: '🌍' },
    { minLevel: 700, maxLevel: 799, title: 'Kiến Trúc Sư Ngôn Ngữ', icon: '🌌' },
    { minLevel: 800, maxLevel: 899, title: 'Kẻ Chinh Phục Tri Thức', icon: '☄️' },
    { minLevel: 900, maxLevel: 999, title: 'Thực Thể Tri Thức', icon: '✨' },
    { minLevel: 1000, maxLevel: 1199, title: 'Huyền Thoại ExtraQuiz Pro', icon: '🌌' },
    { minLevel: 1200, maxLevel: 1499, title: 'Kẻ Viết Lại Từ Điển', icon: '👁️' },
    { minLevel: 1500, maxLevel: 1999, title: 'Chúa Tể Ngôn Ngữ', icon: '🚀' },
    { minLevel: 2000, maxLevel: Infinity, title: 'Singularity - Điểm Kỳ Dị Tri Thức', icon: '🌌' }
];

export function getLevelFromLifetimeLC(totalLC) {
    if (!totalLC || totalLC < 0) totalLC = 0;
    return Math.floor(totalLC / LC_PER_LEVEL) + 1;
}

export function getRankFromLevel(level) {
    for (const rank of RANK_LIST) {
        if (level >= rank.minLevel && level <= rank.maxLevel) {
            return rank;
        }
    }
    // Fallback
    return RANK_LIST[RANK_LIST.length - 1];
}

export function getLevelProgressInfo(totalLC) {
    if (!totalLC || totalLC < 0) totalLC = 0;
    const currentLevel = getLevelFromLifetimeLC(totalLC);
    const currentLevelMinimum = (currentLevel - 1) * LC_PER_LEVEL;
    const nextLevelMinimum = currentLevel * LC_PER_LEVEL;
    
    // How much LC we've earned IN THIS LEVEL
    const currentProgress = totalLC - currentLevelMinimum;
    // How much LC is required to pass THIS LEVEL
    const requiredLC = LC_PER_LEVEL;
    
    const percent = Math.min(100, (currentProgress / requiredLC) * 100);
    
    return {
        currentLevel,
        currentProgress,
        requiredLC,
        percent,
        totalLC,
        currentLevelMinimum,
        nextLevelMinimum
    };
}
