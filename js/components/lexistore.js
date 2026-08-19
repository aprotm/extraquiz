import { ref, computed } from 'vue';
import { store } from '../store.js';
import { STORE_CATEGORIES, STORE_ITEMS } from '../storeItems.js';
import { showToast } from '../toast.js';

export default {
    name: 'LexiStore',
    setup() {
        const activeCategory = ref('all');
        const isPurchasing = ref(false);
        const searchQuery = ref('');
        const selectedItemForDetail = ref(null);

        // Check if user is Admin
        const isAdmin = computed(() => {
            return store.user?.email === 'test@test.com' || 
                   store.userProfile?.isAdmin === true || 
                   store.userProfile?.role === 'admin';
        });

        // Filtered store catalog
        const filteredItems = computed(() => {
            let items = STORE_ITEMS;
            if (activeCategory.value !== 'all') {
                items = items.filter(it => it.category === activeCategory.value);
            }
            if (searchQuery.value.trim()) {
                const q = searchQuery.value.toLowerCase().trim();
                items = items.filter(it => 
                    it.title.toLowerCase().includes(q) || 
                    it.description.toLowerCase().includes(q) ||
                    (it.features && it.features.some(f => f.toLowerCase().includes(q)))
                );
            }
            return items;
        });

        // Inventory state
        const inventory = computed(() => {
            return store.userProfile?.inventory || {
                streakFreezes: 0,
                activeBoosters: [],
                aiHints: 0,
                unlockedThemes: [],
                unlockedDecks: [],
                unlockedFrames: []
            };
        });

        // Check if an item is already purchased / owned
        const isItemOwned = (item) => {
            const inv = inventory.value;
            if (item.category === 'decks') {
                return (inv.unlockedDecks || []).includes(item.id);
            }
            if (item.category === 'themes') {
                return (inv.unlockedThemes || []).includes(item.id);
            }
            if (item.category === 'cosmetics') {
                return (inv.unlockedFrames || []).includes(item.id);
            }
            return false;
        };

        // Purchase action
        const handlePurchase = async (item) => {
            if (isItemOwned(item)) {
                if (item.category === 'decks') {
                    showToast("Bạn đã sở hữu bộ thẻ này! Đang mở danh sách...", "info");
                    store.navigate('dashboard');
                }
                return;
            }

            const cost = item.price || 0;
            const currentLC = store.userProfile?.totalLexiCredit || store.userProfile?.lexiCredit || 0;

            if (currentLC < cost) {
                showToast(`Bạn còn thiếu ${cost - currentLC} LC. Hãy làm bài tập hoặc thắng Boss để tích lũy thêm!`, 'error');
                return;
            }

            try {
                isPurchasing.value = true;
                store.showLoading();
                await store.buyStoreItem(item);

                // Celebratory Confetti if available
                if (window.confetti) {
                    window.confetti({
                        particleCount: 80,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }

                showToast(`🎉 Mở khóa thành công "${item.title}"!`, 'success');
            } catch (err) {
                console.error("Purchase error:", err);
                showToast(err.message || "Lỗi giao dịch!", 'error');
            } finally {
                store.hideLoading();
                isPurchasing.value = false;
            }
        };

        const rarityBadgeStyle = (rarity) => {
            switch (rarity) {
                case 'mythic':
                    return 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]';
                case 'legendary':
                    return 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]';
                case 'epic':
                    return 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/40';
                default:
                    return 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-500/40';
            }
        };

        return {
            store,
            isAdmin,
            activeCategory,
            categories: STORE_CATEGORIES,
            filteredItems,
            inventory,
            isItemOwned,
            handlePurchase,
            rarityBadgeStyle,
            searchQuery,
            isPurchasing,
            selectedItemForDetail
        };
    },
    template: `
        <div class="min-h-screen bg-slate-50 dark:bg-[#070A13] text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8 transition-colors duration-300" style="font-family: 'Plus Jakarta Sans', sans-serif;">
            
            <!-- ADMIN ACCESS GUARD -->
            <div v-if="!isAdmin" class="max-w-md mx-auto my-20 bg-white dark:bg-[#0E152B] border border-gray-200 dark:border-[#192445] rounded-3xl p-8 text-center shadow-xl space-y-4">
                <div class="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-3xl mx-auto">
                    <i class="fa-solid fa-lock"></i>
                </div>
                <h2 class="text-xl font-black text-gray-900 dark:text-white">LexiStore Đang Thử Nghiệm</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Tính năng Cửa Hàng Trao Đổi LexiStore hiện đang trong giai đoạn thử nghiệm nội bộ dành cho Quản Trị Viên (Admin). Vui lòng quay lại sau!
                </p>
                <button @click="store.navigate('dashboard')" class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-all">
                    Về Trang Chủ
                </button>
            </div>

            <!-- MAIN STORE CONTENT (ADMIN ONLY) -->
            <div v-else class="max-w-[1240px] mx-auto space-y-8">
                
                <!-- TOP HEADER HERO BANNER -->
                <div class="relative bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 dark:from-[#0E152B] dark:via-[#0A0F1F] dark:to-[#070A14] border border-indigo-800/40 dark:border-[#192445] rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl text-white">
                    <!-- Glow Accents -->
                    <div class="absolute -right-16 -top-16 w-80 h-80 rounded-full blur-[120px] bg-amber-500/20 pointer-events-none"></div>
                    <div class="absolute -left-16 -bottom-16 w-80 h-80 rounded-full blur-[120px] bg-indigo-600/20 pointer-events-none"></div>

                    <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div class="space-y-2">
                            <div class="flex items-center gap-2">
                                <button @click="store.navigate('dashboard')" class="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-gray-200 hover:text-white transition-all backdrop-blur-sm">
                                    <i class="fa-solid fa-arrow-left text-indigo-300"></i> Trang Chủ
                                </button>
                                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/30 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                                    <i class="fa-solid fa-sparkles text-amber-300"></i> LexiStore (Admin Beta)
                                </span>
                            </div>
                            <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                                Cửa Hàng & Trao Đổi LexiStore 🏬
                            </h1>
                            <p class="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
                                Đổi điểm thưởng <b class="text-amber-300 font-extrabold">LexiCredit (LC)</b> để mở khóa các bộ từ vựng cao cấp, vật phẩm bảo vệ chuỗi Streak và hiệu ứng độc quyền.
                            </p>
                        </div>

                        <!-- User Wallet Card -->
                        <div class="bg-black/30 backdrop-blur-md border border-white/15 rounded-2xl p-5 shadow-xl flex items-center gap-5 shrink-0">
                            <div class="w-14 h-14 rounded-2xl bg-amber-500/25 border border-amber-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                                <i class="fa-solid fa-coins text-2xl text-amber-300 animate-bounce-short"></i>
                            </div>
                            <div>
                                <div class="text-[10px] font-black uppercase tracking-widest text-gray-300">Số Dư Khả Dụng</div>
                                <div class="text-3xl font-black text-white font-mono flex items-baseline gap-1.5">
                                    {{ store.userProfile?.totalLexiCredit || store.userProfile?.lexiCredit || 0 }}
                                    <span class="text-sm font-black text-amber-300">LC</span>
                                </div>
                                <div class="text-[10px] text-gray-300 mt-0.5 flex items-center gap-1">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Level {{ store.userProfile?.level || 1 }} · {{ store.userProfile?.rank || 'Học Viên' }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CATEGORY NAVIGATION & SEARCH -->
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <!-- Category Tabs -->
                    <div class="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
                        <button v-for="cat in categories" :key="cat.id"
                                @click="activeCategory = cat.id"
                                class="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 select-none"
                                :class="activeCategory === cat.id ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-400/40' : 'bg-white dark:bg-[#0E152B] hover:bg-gray-100 dark:hover:bg-[#152042] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-[#192445] shadow-sm'">
                            <i :class="cat.icon"></i>
                            <span>{{ cat.name }}</span>
                        </button>
                    </div>

                    <!-- Search Input -->
                    <div class="relative min-w-[240px]">
                        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                        <input v-model="searchQuery" type="text" placeholder="Tìm bộ thẻ, vật phẩm..." 
                               class="w-full bg-white dark:bg-[#0E152B] border border-gray-200 dark:border-[#192445] rounded-2xl py-2.5 pl-9 pr-4 text-xs text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 shadow-sm transition-all">
                    </div>
                </div>

                <!-- INVENTORY QUICK DRAWER (Active Inventory) -->
                <div class="bg-white dark:bg-[#0A0F21] border border-gray-200/80 dark:border-[#162244] rounded-3xl p-5 space-y-3 shadow-sm transition-colors">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-300">
                            <i class="fa-solid fa-briefcase text-indigo-500"></i> Túi Đồ Của Bạn (Active Inventory)
                        </div>
                        <span class="text-[10px] text-gray-400 dark:text-gray-500">Tự động đồng bộ</span>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <!-- Streak Freeze Count -->
                        <div class="bg-slate-50 dark:bg-[#0E152B] border border-gray-200/80 dark:border-[#192445] rounded-2xl p-3.5 flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                                <span class="text-xl">🧊</span>
                            </div>
                            <div>
                                <div class="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Băng Bảo Vệ</div>
                                <div class="text-sm font-black text-gray-900 dark:text-white font-mono">{{ inventory.streakFreezes || 0 }} <span class="text-[10px] text-gray-400">lượt</span></div>
                            </div>
                        </div>

                        <!-- 2x XP Boosters Active -->
                        <div class="bg-slate-50 dark:bg-[#0E152B] border border-gray-200/80 dark:border-[#192445] rounded-2xl p-3.5 flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                                <span class="text-xl">⚡</span>
                            </div>
                            <div>
                                <div class="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">2x Booster</div>
                                <div class="text-sm font-black text-gray-900 dark:text-white font-mono">{{ (inventory.activeBoosters || []).length > 0 ? 'Đang bật' : 'Chưa bật' }}</div>
                            </div>
                        </div>

                        <!-- AI Hints -->
                        <div class="bg-slate-50 dark:bg-[#0E152B] border border-gray-200/80 dark:border-[#192445] rounded-2xl p-3.5 flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                                <span class="text-xl">💡</span>
                            </div>
                            <div>
                                <div class="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Gợi Ý AI</div>
                                <div class="text-sm font-black text-gray-900 dark:text-white font-mono">{{ inventory.aiHints || 0 }} <span class="text-[10px] text-gray-400">lượt</span></div>
                            </div>
                        </div>

                        <!-- Unlocked Decks -->
                        <div class="bg-slate-50 dark:bg-[#0E152B] border border-gray-200/80 dark:border-[#192445] rounded-2xl p-3.5 flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                <span class="text-xl">📚</span>
                            </div>
                            <div>
                                <div class="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Bộ Thẻ Mở Khóa</div>
                                <div class="text-sm font-black text-gray-900 dark:text-white font-mono">{{ (inventory.unlockedDecks || []).length }} <span class="text-[10px] text-gray-400">bộ</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- STORE ITEMS GRID -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div v-for="item in filteredItems" :key="item.id" 
                         class="bg-white dark:bg-gradient-to-b dark:from-[#0E152B] dark:to-[#0A0F1F] border border-gray-200/90 dark:border-[#192445] hover:border-indigo-500/50 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl group relative overflow-hidden">
                        
                        <!-- Top Row: Icon, Rarity, Badge -->
                        <div>
                            <div class="flex items-start justify-between gap-3 mb-4">
                                <div class="w-16 h-16 rounded-2xl bg-indigo-50/60 dark:bg-[#121A33] border border-indigo-100 dark:border-[#202E59] flex items-center justify-center p-2 group-hover:scale-105 transition-transform shrink-0 shadow-sm">
                                    <img v-if="item.icon3d" :src="item.icon3d" :alt="item.title" class="w-12 h-12 object-contain drop-shadow-md">
                                    <span v-else class="text-3xl">{{ item.fallbackIcon || '📦' }}</span>
                                </div>
                                <div class="flex flex-col items-end gap-1.5">
                                    <span v-if="item.badge" class="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                                        {{ item.badge }}
                                    </span>
                                    <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border" :class="rarityBadgeStyle(item.rarity)">
                                        {{ item.rarity }}
                                    </span>
                                </div>
                            </div>

                            <!-- Title & Description -->
                            <h3 class="text-base font-extrabold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors leading-snug mb-2">
                                {{ item.title }}
                            </h3>
                            <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2 mb-4">
                                {{ item.description }}
                            </p>

                            <!-- Features List -->
                            <div class="space-y-1.5 mb-6 pt-3 border-t border-gray-100 dark:border-[#192445]/80">
                                <div v-for="(feat, idx) in (item.features || [])" :key="idx" class="flex items-center gap-2 text-[11px] text-gray-700 dark:text-gray-300">
                                    <i class="fa-solid fa-circle-check text-emerald-500 dark:text-emerald-400 text-[10px]"></i>
                                    <span class="truncate">{{ feat }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Price & Action Button -->
                        <div class="pt-4 border-t border-gray-100 dark:border-[#192445] flex items-center justify-between gap-4 mt-auto">
                            <div>
                                <span class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase">Giá mở khóa</span>
                                <div class="flex items-baseline gap-1.5 text-xl font-black text-amber-500 dark:text-amber-400 font-mono">
                                    <i class="fa-solid fa-coins text-sm"></i>
                                    <span>{{ item.price }}</span>
                                    <span class="text-xs text-gray-400 dark:text-gray-500">LC</span>
                                </div>
                            </div>

                            <!-- Action Button -->
                            <button v-if="isItemOwned(item)" 
                                    @click="handlePurchase(item)" 
                                    class="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center gap-1.5 shadow-sm">
                                <i class="fa-solid fa-check text-xs"></i>
                                <span>{{ item.category === 'decks' ? 'Học Ngay' : 'Đã Sở Hữu' }}</span>
                            </button>
                            <button v-else 
                                    @click="handlePurchase(item)" 
                                    :disabled="isPurchasing"
                                    class="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95">
                                <i class="fa-solid fa-unlock text-xs"></i>
                                <span>Mở Khóa</span>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `
};
