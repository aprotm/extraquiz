import { reactive } from 'vue';
import { updateUserProfile } from './db.js';
import { getLevelFromLifetimeLC, getRankFromLevel } from './ranks.js';
import { BADGES_DICT } from './badges.js';
export { BADGES_DICT };

// Trạng thái chung (State Management)
export const store = reactive({
    user: null,
    decks: [],
    activeDeck: null,
    activeCards: [],
    allUserCards: [],
    isLoading: true,
    authError: '',
    currentRoute: (window.location.hash && window.location.hash.length > 1) ? window.location.hash.slice(1) : 'dashboard', // Màn hình hiện tại
    editDeckData: null, // Dữ liệu bộ thẻ đang muốn sửa
    
    // User Profile (Gamification)
    userProfile: {
        xp: 0,
        level: 1,
        badges: [],
        rank: 'Tân Binh Mơ Hồ',
        lexiCredit: 0,
        dailyCreditEarned: 0,
        lastCreditDate: ''
    },
    // User Settings
    settings: JSON.parse(localStorage.getItem('app_settings')) || {
        voiceUri: 'Google UK English Female',
        theme: 'light',
        readingFontSize: 16,
        focusMode: false,
        language: 'vi',
        dailyTarget: 20,
        showChestAnimation: true,
        showFloatingCredit: true,
        designStyle: 'modern' // 'modern' or 'handdrawn'
    },
    
    saveSettings() {
        localStorage.setItem('app_settings', JSON.stringify(this.settings));
        // Apply theme immediately
        if (this.settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        // Apply focus mode
        if (this.settings.focusMode) {
            document.body.classList.add('focus-mode');
        } else {
            document.body.classList.remove('focus-mode');
        }
        // Apply design style
        if (this.settings.designStyle === 'handdrawn') {
            document.body.classList.add('theme-handdrawn');
        } else {
            document.body.classList.remove('theme-handdrawn');
        }
    },

    navigate(route, data = null) {
        // Tầng 3: Client Route Protection
        if (route === 'admin' && this.user?.email !== 'test@test.com' && !this.userProfile?.isAdmin && this.userProfile?.role !== 'admin') {
            console.error('Access Denied: Admin Only');
            this.currentRoute = 'dashboard';
            return;
        }

        if (route === 'study' && (!this.activeCards || this.activeCards.length === 0)) {
            console.warn("No active cards. Redirecting to dashboard.");
            route = 'dashboard';
        }
        if (route === 'deck-detail' && !this.activeDeck && !data) {
            console.warn("No active deck. Redirecting to dashboard.");
            route = 'dashboard';
        }

        if (data && route === 'deck-detail') {
            this.activeDeck = data;
        }
        if (data && route === 'edit-deck') {
            this.editDeckData = data; // Truyền data bộ thẻ sang màn chỉnh sửa
        }
        this.currentRoute = route;
        window.location.hash = route;
    },
    
    showLoading() { this.isLoading = true; },
    hideLoading() {
        this.isLoading = false;
    },
    
    // Hệ thống Streak
    recordStudyActivity() {
        if (!this.user) return;
        const key = `stats_${this.user.uid}`;
        let stats = JSON.parse(localStorage.getItem(key) || '{"streak": 0, "lastStudyDate": "", "todayWords": 0, "history": []}');
        
        const today = new Date().toLocaleDateString('vi-VN');
        if (stats.lastStudyDate !== today) {
            // Check if streak breaks
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toLocaleDateString('vi-VN');
            
            if (stats.lastStudyDate === yesterdayStr) {
                stats.streak += 1;
            } else if (stats.lastStudyDate !== '') {
                stats.streak = 1;
            } else {
                stats.streak = 1;
            }
            
            // Save history
            if (stats.history.length === 7) stats.history.shift();
            stats.history.push({ date: stats.lastStudyDate || today, words: stats.todayWords });
            
            stats.lastStudyDate = today;
            stats.todayWords = 1;
        } else {
            stats.todayWords += 1;
        }
        
        // Unlock weekend warrior
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            this.unlockBadge('weekend_warrior');
        }
        // Unlock perfect week
        if (stats.streak >= 7) {
            this.unlockBadge('perfect_week');
        }

        localStorage.setItem(key, JSON.stringify(stats));
    },
    
    getStudyStats() {
        if (!this.user) return null;
        const key = `stats_${this.user.uid}`;
        return JSON.parse(localStorage.getItem(key) || '{"streak": 0, "lastStudyDate": "", "todayWords": 0, "history": []}');
    },

    // ===== GAMIFICATION LOGIC =====
    // getRankTitle is no longer needed locally as it's replaced by getRankFromLevel in ranks.js

    async checkRetroactiveBadges() {
        if (!this.user || !this.userProfile) return;
        
        let shouldUpdate = false;
        if (!this.userProfile.badges) this.userProfile.badges = [];
        
        const stats = this.getStudyStats();
        const checkProfile = {
            ...this.userProfile,
            currentStreak: stats ? stats.streak : 0
        };

        for (const badge of BADGES_DICT) {
            if (!this.userProfile.badges.includes(badge.id)) {
                if (badge.condition(checkProfile)) {
                    this.userProfile.badges.push(badge.id);
                    shouldUpdate = true;
                }
            }
        }

        if (shouldUpdate) {
            await updateUserProfile(this.user.uid, { badges: this.userProfile.badges });
            if (window.confetti) {
                window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#f59e0b', '#fbbf24'] });
            }
        }
    },

    async unlockBadge(badgeId) {
        if (!this.user || !this.userProfile) return;
        if (!this.userProfile.badges) this.userProfile.badges = [];
        if (!this.userProfile.badges.includes(badgeId)) {
            this.userProfile.badges.push(badgeId);
            await updateUserProfile(this.user.uid, { badges: this.userProfile.badges });
            if (window.confetti) {
                window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#f59e0b', '#fbbf24'] });
            }
        }
    },

    async equipBadge(badgeId) {
        if (!this.user || !this.userProfile) return;
        if (!this.userProfile.badges?.includes(badgeId)) return;

        if (this.userProfile.equippedBadge === badgeId) {
            this.userProfile.equippedBadge = null; // unequip
        } else {
            this.userProfile.equippedBadge = badgeId; // equip
        }
        
        await updateUserProfile(this.user.uid, { equippedBadge: this.userProfile.equippedBadge });
    },

    async addLexiCredit(baseAmount, type = 'action') {
        if (!this.user || !this.userProfile) return;

        // Reset daily limit if a new day
        const todayStr = new Date().toLocaleDateString('en-CA');
        if (this.userProfile.lastCreditDate !== todayStr) {
            this.userProfile.dailyCreditEarned = 0;
            this.userProfile.lastCreditDate = todayStr;
        }

        let finalAmount = baseAmount;
        let isCritical = false;

        if (type === 'action') {
            // Apply streak multiplier
            const stats = this.getStudyStats() || { streak: 0 };
            const streak = stats.streak || 0;
            let multiplier = 1;
            if (streak >= 7) multiplier = 1.5;
            else if (streak >= 4) multiplier = 1.2;

            finalAmount = Math.ceil(baseAmount * multiplier);

            // Daily Cap: 200
            if (this.userProfile.dailyCreditEarned >= 200) {
                return; // Silently skip if daily cap reached
            }

            // Cap the earnings to not exceed 200
            if (this.userProfile.dailyCreditEarned + finalAmount > 200) {
                finalAmount = 200 - this.userProfile.dailyCreditEarned;
            }

            // 5% Chance for Lucky Chest
            if (Math.random() < 0.05) {
                isCritical = true;
                const chestBonus = Math.floor(Math.random() * 41) + 10; // 10 to 50
                finalAmount += chestBonus; 
            }

            this.userProfile.dailyCreditEarned += finalAmount;
        }

        this.userProfile.lexiCredit = (this.userProfile.lexiCredit || 0) + finalAmount;
        this.userProfile.totalLexiCredit = (this.userProfile.totalLexiCredit || 0) + finalAmount;
        
        // Cập nhật Level
        let oldLevel = this.userProfile.level || 1;
        let newLevel = getLevelFromLifetimeLC(this.userProfile.totalLexiCredit);
        
        let leveledUp = false;
        
        // Auto-fix level if the formula drastically changes it for old users
        if (newLevel !== oldLevel) {
            if (newLevel > oldLevel) leveledUp = true;
            this.userProfile.level = newLevel;
            const newRank = getRankFromLevel(newLevel);
            this.userProfile.rank = newRank.title;
            
            if (leveledUp) {
                // Dispatch event for the Level Up animation popup if not disabled
                if (this.settings.showLevelUpNotification !== false) {
                    window.dispatchEvent(new CustomEvent('level-up', {
                        detail: {
                            level: newLevel,
                            rank: newRank
                        }
                    }));
                }
            }
        }

        // Save to DB
        await updateUserProfile(this.user.uid, {
            lexiCredit: this.userProfile.lexiCredit,
            totalLexiCredit: this.userProfile.totalLexiCredit,
            dailyCreditEarned: this.userProfile.dailyCreditEarned,
            lastCreditDate: this.userProfile.lastCreditDate,
            level: this.userProfile.level,
            rank: this.userProfile.rank
        });
        
        // Check badges dynamically
        this.checkRetroactiveBadges();

        // We removed the local confetti here, since LevelUpPopup component handles the rich animation

        // Trigger Event for Floating UI
        window.dispatchEvent(new CustomEvent('lexi-credit-added', { 
            detail: { amount: finalAmount, isCritical: isCritical } 
        }));
    }
});
