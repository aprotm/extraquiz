import { reactive } from 'vue';
import { updateUserProfile } from './db.js';
import { getLevelFromLifetimeLC, getRankFromLevel } from './ranks.js';
import { BADGES_DICT, EXCLUSIVE_ADMIN_BADGES, getVisibleBadges, getBadgeById } from './badges.js';
export { BADGES_DICT, EXCLUSIVE_ADMIN_BADGES, getVisibleBadges, getBadgeById };

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
    
    getTodayDateStr() {
        const d = new Date();
        const y = d.getFullYear();
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${day}`;
    },

    // Hệ thống Streak & Lịch sử học tập 365 ngày chuẩn ISO
    recordStudyActivity(wordsCount = 1, timeMinutes = 1) {
        if (!this.user) return;
        const key = `stats_${this.user.uid}`;
        let stats = JSON.parse(localStorage.getItem(key) || '{"streak": 0, "lastStudyDate": "", "todayWords": 0, "history": []}');
        if (!Array.isArray(stats.history)) stats.history = [];

        const todayISO = this.getTodayDateStr();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yISO = `${yesterday.getFullYear()}-${(yesterday.getMonth() + 1).toString().padStart(2, '0')}-${yesterday.getDate().toString().padStart(2, '0')}`;

        // Migrate older date format if present (e.g. '19/8/2026')
        if (stats.lastStudyDate && stats.lastStudyDate.includes('/')) {
            const parts = stats.lastStudyDate.split('/');
            if (parts.length === 3) {
                stats.lastStudyDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }

        if (stats.lastStudyDate !== todayISO) {
            // New study day
            if (stats.lastStudyDate === yISO) {
                stats.streak += 1;
            } else if (stats.lastStudyDate !== '') {
                // Check if user has a Streak Freeze in inventory
                const inventory = this.userProfile?.inventory || {};
                if (inventory.streakFreezes && inventory.streakFreezes > 0) {
                    inventory.streakFreezes -= 1;
                    stats.streak += 1; // Preserve streak
                    if (window.showToast) window.showToast("🧊 Băng Bảo Vệ Chuỗi đã tự động kích hoạt bảo vệ Streak!", "info");
                    updateUserProfile(this.user.uid, { inventory: this.userProfile.inventory });
                } else {
                    stats.streak = 1;
                }
            } else {
                stats.streak = 1;
            }
            stats.lastStudyDate = todayISO;
            stats.todayWords = wordsCount;
        } else {
            // Same day study increment
            stats.todayWords += wordsCount;
        }

        // Always keep today's exact word count updated in history
        const existingIdx = stats.history.findIndex(h => h.date === todayISO);
        if (existingIdx > -1) {
            stats.history[existingIdx].words = stats.todayWords;
        } else {
            stats.history.push({ date: todayISO, words: stats.todayWords });
        }

        // Normalize older history entries to ISO date format
        stats.history.forEach(h => {
            if (h.date && h.date.includes('/')) {
                const parts = h.date.split('/');
                if (parts.length === 3) {
                    h.date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
        });

        // Retain up to 400 days of history
        if (stats.history.length > 400) {
            stats.history = stats.history.slice(-365);
        }

        stats.totalStudyDays = stats.history.filter(h => (h.words || 0) > 0).length;

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

    recordStudyStats(wordsCount = 1, timeMinutes = 1) {
        this.recordStudyActivity(wordsCount, timeMinutes);
    },
    
    getStudyStats() {
        if (!this.user) return null;
        const key = `stats_${this.user.uid}`;
        const stats = JSON.parse(localStorage.getItem(key) || '{"streak": 0, "lastStudyDate": "", "todayWords": 0, "history": []}');
        if (!Array.isArray(stats.history)) stats.history = [];
        return stats;
    },

    // ===== LEXISTORE COMMERCE LOGIC =====
    async buyStoreItem(item) {
        if (!this.user || !this.userProfile) {
            throw new Error("Vui lòng đăng nhập để mua vật phẩm.");
        }
        const cost = item.price || 0;
        const currentLC = this.userProfile.totalLexiCredit || this.userProfile.lexiCredit || 0;

        if (currentLC < cost) {
            throw new Error(`Bạn còn thiếu ${cost - currentLC} LexiCredit để sở hữu món đồ này!`);
        }

        // Initialize inventory
        if (!this.userProfile.inventory) {
            this.userProfile.inventory = {
                streakFreezes: 0,
                activeBoosters: [],
                aiHints: 0,
                unlockedThemes: [],
                unlockedDecks: [],
                unlockedFrames: [],
                equippedAvatarFrame: null
            };
        }
        const inv = this.userProfile.inventory;

        // Deduct LexiCredit
        this.userProfile.lexiCredit = Math.max(0, (this.userProfile.lexiCredit || 0) - cost);
        this.userProfile.totalLexiCredit = Math.max(0, (this.userProfile.totalLexiCredit || 0) - cost);

        // Apply item reward to inventory
        if (item.category === 'buffs') {
            if (item.id === 'streak_freeze') {
                inv.streakFreezes = (inv.streakFreezes || 0) + 1;
            } else if (item.id === 'double_xp_24h') {
                const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
                if (!Array.isArray(inv.activeBoosters)) inv.activeBoosters = [];
                inv.activeBoosters.push({ type: 'double_lc', expiresAt, name: '2x LexiCredit Booster' });
            } else if (item.id === 'ai_hint_pack') {
                inv.aiHints = (inv.aiHints || 0) + 5;
            }
        } else if (item.category === 'decks') {
            if (!Array.isArray(inv.unlockedDecks)) inv.unlockedDecks = [];
            if (!inv.unlockedDecks.includes(item.id)) {
                inv.unlockedDecks.push(item.id);
            }
            // Auto add deck to store.decks
            if (item.deckData) {
                const newDeck = {
                    id: 'premium_' + item.id + '_' + Date.now(),
                    title: item.title,
                    description: item.description,
                    cards: item.deckData.cards || [],
                    totalCards: (item.deckData.cards || []).length,
                    isPremium: true,
                    createdAt: new Date().toISOString()
                };
                this.decks.unshift(newDeck);
                const localDecksKey = `decks_${this.user.uid}`;
                localStorage.setItem(localDecksKey, JSON.stringify(this.decks));
            }
        } else if (item.category === 'themes') {
            if (!Array.isArray(inv.unlockedThemes)) inv.unlockedThemes = [];
            if (!inv.unlockedThemes.includes(item.id)) {
                inv.unlockedThemes.push(item.id);
            }
        } else if (item.category === 'cosmetics') {
            if (!Array.isArray(inv.unlockedFrames)) inv.unlockedFrames = [];
            if (!inv.unlockedFrames.includes(item.id)) {
                inv.unlockedFrames.push(item.id);
            }
        }

        // Record transaction
        if (!Array.isArray(this.userProfile.transactions)) {
            this.userProfile.transactions = [];
        }
        this.userProfile.transactions.unshift({
            id: 'tx_' + Date.now(),
            itemId: item.id,
            title: item.title,
            cost: cost,
            category: item.category,
            date: new Date().toISOString()
        });

        // Save profile
        await updateUserProfile(this.user.uid, {
            lexiCredit: this.userProfile.lexiCredit,
            totalLexiCredit: this.userProfile.totalLexiCredit,
            inventory: this.userProfile.inventory,
            transactions: this.userProfile.transactions
        });

        return true;
    },

    // ===== GAMIFICATION LOGIC =====
    // getRankTitle is no longer needed locally as it's replaced by getRankFromLevel in ranks.js

    async checkRetroactiveBadges() {
        if (!this.user || !this.userProfile) return;
        
        let shouldUpdate = false;
        if (!this.userProfile.badges) this.userProfile.badges = [];
        
        const isAdmin = this.userProfile.role === 'admin' || this.userProfile.isAdmin === true;
        const activePool = isAdmin ? [...BADGES_DICT, ...EXCLUSIVE_ADMIN_BADGES] : BADGES_DICT;
        const validBadgeIds = new Set(activePool.map(b => b.id));

        // 1. Purge obsolete/unobtainable badges from regular users
        if (!isAdmin && Array.isArray(this.userProfile.badges)) {
            const cleaned = this.userProfile.badges.filter(id => validBadgeIds.has(id));
            if (cleaned.length !== this.userProfile.badges.length) {
                this.userProfile.badges = cleaned;
                if (this.userProfile.equippedBadge && !validBadgeIds.has(this.userProfile.equippedBadge)) {
                    this.userProfile.equippedBadge = null;
                }
                shouldUpdate = true;
            }
        }

        // 2. Admin Auto-Unlock Exclusive Founder & Admin Badges
        if (isAdmin) {
            if (!this.userProfile.badges.includes('founder')) {
                this.userProfile.badges.push('founder');
                shouldUpdate = true;
            }
            if (!this.userProfile.badges.includes('admin_nexus')) {
                this.userProfile.badges.push('admin_nexus');
                shouldUpdate = true;
            }
        }
        
        const stats = this.getStudyStats();
        const checkProfile = {
            ...this.userProfile,
            currentStreak: stats ? stats.streak : 0
        };

        // 3. Evaluate standard badge conditions
        for (const badge of BADGES_DICT) {
            if (!this.userProfile.badges.includes(badge.id)) {
                if (typeof badge.condition === 'function' && badge.condition(checkProfile)) {
                    this.userProfile.badges.push(badge.id);
                    shouldUpdate = true;
                }
            }
        }

        if (shouldUpdate) {
            await updateUserProfile(this.user.uid, { 
                badges: this.userProfile.badges,
                equippedBadge: this.userProfile.equippedBadge || null
            });
            if (window.confetti) {
                window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#f59e0b', '#fbbf24'] });
            }
        }
    },

    async unlockBadge(badgeId) {
        if (!this.user || !this.userProfile) return;
        if (!this.userProfile.badges) this.userProfile.badges = [];
        
        const badgeObj = getBadgeById(badgeId);
        if (!badgeObj) return;

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
