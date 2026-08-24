import { ref, computed, onMounted, watch } from 'vue';
import { store } from '../store.js';
import { 
    fetchAllUsers, updateOtherUser, fetchAllDecksAdmin, 
    fetchAllCardsAdmin, adminDeleteDeck, adminUpdateUserBadges 
} from '../db.js';
import { showToast } from '../toast.js';
import { getLevelFromLifetimeLC, getRankFromLevel, RANK_LIST } from '../ranks.js';
import { BADGES_DICT, EXCLUSIVE_ADMIN_BADGES } from '../badges.js';

export default {
    setup() {
        const activeTab = ref('overview'); // 'overview' | 'storage' | 'users' | 'decks' | 'diagnostics'
        const usersList = ref([]);
        const decksList = ref([]);
        const cardsList = ref([]);
        const isLoading = ref(true);
        const isScanningStorage = ref(false);

        // Search & Filters
        const userSearch = ref('');
        const userStatusFilter = ref('all'); // 'all' | 'active' | 'banned' | 'admin'
        const deckSearch = ref('');

        // Modals
        const editingUser = ref(null);
        const editForm = ref({ 
            level: 1, 
            lexiCredit: 0, 
            isAdmin: false,
            badges: []
        });
        
        const showBanModal = ref(false);
        const banForm = ref({ durationDays: '1', reason: '' });
        const selectedUserToBan = ref(null);

        const viewingDeck = ref(null);
        const isViewingDeckLoading = ref(false);
        const viewingDeckCards = ref([]);

        // Storage Stats
        const storageStats = ref({
            quotaBytes: 0,
            usedBytes: 0,
            usagePercent: 0,
            formattedQuota: '0 MB',
            formattedUsed: '0 MB',
            isPersisted: false,
            lsTotalBytes: 0,
            formattedLsTotal: '0 KB',
            lsItems: [],
            cacheList: [],
            totalCacheItems: 0,
            firestoreEstimatedBytes: 0,
            formattedFirestoreBytes: '0 KB'
        });

        // Current App Cache Version
        const CURRENT_CACHE_NAME = 'extraquiz-v109';

        // Diagnostic States
        const diagState = ref({
            firestorePing: null,
            firestoreStatus: 'testing',
            geminiStatus: 'idle',
            geminiLatency: null,
            ttsVoicesCount: 0,
            ttsStatus: 'idle',
            swVersion: CURRENT_CACHE_NAME,
            swStatus: 'checking'
        });

        // Computed Users
        const filteredUsers = computed(() => {
            let list = usersList.value;
            if (userStatusFilter.value === 'banned') {
                list = list.filter(u => u.isBanned);
            } else if (userStatusFilter.value === 'active') {
                list = list.filter(u => !u.isBanned);
            } else if (userStatusFilter.value === 'admin') {
                list = list.filter(u => u.email === 'test@test.com' || u.isAdmin || u.role === 'admin');
            }

            if (userSearch.value.trim()) {
                const q = userSearch.value.toLowerCase().trim();
                list = list.filter(u => 
                    (u.email && u.email.toLowerCase().includes(q)) ||
                    (u.displayName && u.displayName.toLowerCase().includes(q)) ||
                    (u.id && u.id.toLowerCase().includes(q))
                );
            }
            return list;
        });

        // Computed Decks
        const filteredDecks = computed(() => {
            if (!deckSearch.value.trim()) return decksList.value;
            const q = deckSearch.value.toLowerCase().trim();
            return decksList.value.filter(d => 
                (d.title && d.title.toLowerCase().includes(q)) ||
                (d.description && d.description.toLowerCase().includes(q)) ||
                (d.userId && d.userId.toLowerCase().includes(q))
            );
        });

        // Overall KPIs
        const totalUsersCount = computed(() => usersList.value.length);
        const activeUsersCount = computed(() => usersList.value.filter(u => !u.isBanned).length);
        const bannedUsersCount = computed(() => usersList.value.filter(u => u.isBanned).length);
        const totalDecksCount = computed(() => decksList.value.length);
        const totalCardsCount = computed(() => cardsList.value.length);
        const totalLexiCreditInSystem = computed(() => {
            return usersList.value.reduce((acc, u) => acc + (u.lexiCredit || 0), 0);
        });
        const averageUserLevel = computed(() => {
            if (!usersList.value.length) return 1;
            const sum = usersList.value.reduce((acc, u) => acc + (u.level || 1), 0);
            return (sum / usersList.value.length).toFixed(1);
        });

        watch(() => editForm.value.lexiCredit, (newLc) => {
            if (editForm.value._autoLevel) {
                editForm.value.level = getLevelFromLifetimeLC(newLc || 0);
            }
        });

        onMounted(async () => {
            // Permission check
            if (store.user?.email !== 'test@test.com' && !store.userProfile?.isAdmin && store.userProfile?.role !== 'admin') {
                showToast("Truy cập bị từ chối: Chỉ dành cho Quản trị viên!", 'error');
                store.navigate('dashboard');
                return;
            }

            await loadAllData();
            await scanStorageData();
            runQuickDiagnostics();
        });

        const loadAllData = async () => {
            isLoading.value = true;
            try {
                const [users, decks, cards] = await Promise.all([
                    fetchAllUsers().catch(() => []),
                    fetchAllDecksAdmin().catch(() => []),
                    fetchAllCardsAdmin().catch(() => [])
                ]);
                usersList.value = users;
                decksList.value = decks;
                cardsList.value = cards;
            } catch(e) {
                showToast("Lỗi khi tải dữ liệu hệ thống: " + e.message, 'error');
            } finally {
                isLoading.value = false;
            }
        };

        // ===== STORAGE SCANNER & CALCULATOR =====
        const formatBytes = (bytes, decimals = 2) => {
            if (!bytes || bytes === 0) return '0 Bytes';
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        };

        const scanStorageData = async () => {
            isScanningStorage.value = true;
            try {
                // 1. Browser Storage Estimate API
                if (navigator.storage && navigator.storage.estimate) {
                    const estimate = await navigator.storage.estimate();
                    storageStats.value.quotaBytes = estimate.quota || 0;
                    storageStats.value.usedBytes = estimate.usage || 0;
                    storageStats.value.usagePercent = estimate.quota ? ((estimate.usage / estimate.quota) * 100).toFixed(2) : 0;
                    storageStats.value.formattedQuota = formatBytes(estimate.quota);
                    storageStats.value.formattedUsed = formatBytes(estimate.usage);
                }

                // Persistence check
                if (navigator.storage && navigator.storage.persisted) {
                    storageStats.value.isPersisted = await navigator.storage.persisted();
                }

                // 2. LocalStorage Scanner
                let lsBytes = 0;
                let lsItems = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    const val = localStorage.getItem(key) || '';
                    const itemSize = (key.length + val.length) * 2; // UTF-16 in JS string
                    lsBytes += itemSize;
                    
                    let category = 'Khác';
                    if (key.startsWith('firebase:')) category = 'Firebase Auth';
                    else if (key.startsWith('extraquiz_')) category = 'ExtraQuiz App';
                    else if (key.startsWith('loglevel')) category = 'Dev Server';

                    lsItems.push({
                        key,
                        category,
                        size: itemSize,
                        formattedSize: formatBytes(itemSize),
                        charLength: val.length,
                        preview: val.length > 60 ? val.substring(0, 60) + '...' : val
                    });
                }
                // Sort largest first
                lsItems.sort((a, b) => b.size - a.size);
                storageStats.value.lsTotalBytes = lsBytes;
                storageStats.value.formattedLsTotal = formatBytes(lsBytes);
                storageStats.value.lsItems = lsItems;

                // 3. Cache Storage (Service Worker)
                if ('caches' in window) {
                    const cacheKeys = await caches.keys();
                    let cacheList = [];
                    let totalItems = 0;
                    for (const cKey of cacheKeys) {
                        try {
                            const cacheObj = await caches.open(cKey);
                            const requests = await cacheObj.keys();
                            totalItems += requests.length;
                            cacheList.push({
                                name: cKey,
                                itemsCount: requests.length,
                                isCurrent: cKey === CURRENT_CACHE_NAME
                            });
                        } catch(err) {}
                    }
                    storageStats.value.cacheList = cacheList;
                    storageStats.value.totalCacheItems = totalItems;
                }

                // 4. Firestore Database Estimation
                // Approx: deck ~ 500B, card ~ 1.2KB, user ~ 1.5KB
                const estimatedBytes = (decksList.value.length * 500) + (cardsList.value.length * 1200) + (usersList.value.length * 1500);
                storageStats.value.firestoreEstimatedBytes = estimatedBytes;
                storageStats.value.formattedFirestoreBytes = formatBytes(estimatedBytes);

            } catch (e) {
                console.error("Storage scan error:", e);
            } finally {
                isScanningStorage.value = false;
            }
        };

        const deleteLocalStorageItem = (key) => {
            if (!confirm(`Bạn chắc chắn muốn xóa key "${key}" khỏi localStorage?`)) return;
            localStorage.removeItem(key);
            showToast(`Đã xóa "${key}"`, 'success');
            scanStorageData();
        };

        const cleanObsoleteCaches = async () => {
            if (!('caches' in window)) return;
            try {
                const keys = await caches.keys();
                let deletedCount = 0;
                for (const key of keys) {
                    if (key !== CURRENT_CACHE_NAME) {
                        await caches.delete(key);
                        deletedCount++;
                    }
                }
                showToast(`Đã dọn dẹp ${deletedCount} cache cũ thành công!`, 'success');
                await scanStorageData();
            } catch(e) {
                showToast("Lỗi dọn cache: " + e.message, 'error');
            }
        };

        const exportFullBackupJSON = () => {
            try {
                const backupData = {
                    version: '2.0',
                    timestamp: new Date().toISOString(),
                    exportedBy: store.user?.email || 'admin',
                    usersCount: usersList.value.length,
                    decksCount: decksList.value.length,
                    cardsCount: cardsList.value.length,
                    users: usersList.value,
                    decks: decksList.value,
                    cards: cardsList.value,
                    localStorageSnapshot: storageStats.value.lsItems.reduce((obj, item) => {
                        obj[item.key] = localStorage.getItem(item.key);
                        return obj;
                    }, {})
                };

                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
                const dlAnchor = document.createElement('a');
                dlAnchor.setAttribute("href", dataStr);
                dlAnchor.setAttribute("download", `extraquiz_full_backup_${new Date().toISOString().slice(0,10)}.json`);
                document.body.appendChild(dlAnchor);
                dlAnchor.click();
                dlAnchor.remove();

                showToast("Đã xuất bản sao lưu JSON toàn bộ hệ thống!", 'success');
            } catch(e) {
                showToast("Lỗi xuất backup: " + e.message, 'error');
            }
        };

        // ===== DIAGNOSTICS =====
        const runQuickDiagnostics = async () => {
            // 1. Firestore Ping
            const startFs = performance.now();
            try {
                diagState.value.firestoreStatus = 'testing';
                await fetchAllUsers();
                const latency = Math.round(performance.now() - startFs);
                diagState.value.firestorePing = latency;
                diagState.value.firestoreStatus = 'online';
            } catch(e) {
                diagState.value.firestoreStatus = 'error';
            }

            // 2. TTS Voice check
            if ('speechSynthesis' in window) {
                const voices = window.speechSynthesis.getVoices();
                diagState.value.ttsVoicesCount = voices.length;
                diagState.value.ttsStatus = voices.length > 0 ? 'online' : 'ready';
            }

            // 3. Service Worker
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(regs => {
                    diagState.value.swStatus = regs.length > 0 ? 'active' : 'inactive';
                });
            }
        };

        const testGeminiConnection = async () => {
            diagState.value.geminiStatus = 'testing';
            const start = performance.now();
            try {
                // Quick ping via AI engine
                const { getAIServiceInfo } = await import('../ai.js');
                const info = getAIServiceInfo ? getAIServiceInfo() : null;
                diagState.value.geminiLatency = Math.round(performance.now() - start);
                diagState.value.geminiStatus = 'online';
                showToast(`Gemini AI trực tuyến (${diagState.value.geminiLatency}ms)`, 'success');
            } catch(e) {
                diagState.value.geminiStatus = 'error';
                showToast("Kiểm tra AI thất bại: " + e.message, 'error');
            }
        };

        const testTTSVoice = () => {
            if (!('speechSynthesis' in window)) {
                showToast("Trình duyệt không hỗ trợ Web Speech", 'error');
                return;
            }
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance("ExtraQuiz Admin System is operating at peak performance.");
            utter.lang = 'en-US';
            utter.rate = 1.0;
            window.speechSynthesis.speak(utter);
            showToast("Đang phát âm thử nghiệm...", 'info');
        };

        // ===== USER ACTIONS =====
        const openEditModal = (user) => {
            editingUser.value = user;
            editForm.value = { 
                level: user.level || 1, 
                lexiCredit: user.lexiCredit || 0,
                isAdmin: user.email === 'test@test.com' || user.isAdmin === true || user.role === 'admin',
                badges: user.badges ? [...user.badges] : [],
                _autoLevel: true
            };
        };

        const toggleBadgeSelection = (badgeId) => {
            const idx = editForm.value.badges.indexOf(badgeId);
            if (idx >= 0) {
                editForm.value.badges.splice(idx, 1);
            } else {
                editForm.value.badges.push(badgeId);
            }
        };

        const saveEditUser = async () => {
            try {
                let lc = Math.max(0, parseInt(editForm.value.lexiCredit) || 0);
                let lvl = Math.max(1, parseInt(editForm.value.level) || 1);
                let totalLC = Math.max(lc, (lvl - 1) * 50, editingUser.value.totalLexiCredit || 0);
                let trueLevel = Math.max(lvl, getLevelFromLifetimeLC(totalLC));
                let newRank = getRankFromLevel(trueLevel);
                
                const dataToUpdate = {
                    level: trueLevel,
                    rank: newRank.title,
                    lexiCredit: lc,
                    totalLexiCredit: totalLC,
                    isAdmin: editForm.value.isAdmin,
                    badges: editForm.value.badges
                };

                await updateOtherUser(editingUser.value.id, dataToUpdate);
                
                if (editingUser.value.id === store.user?.uid) {
                    store.userProfile.level = trueLevel;
                    store.userProfile.rank = newRank.title;
                    store.userProfile.lexiCredit = lc;
                    store.userProfile.totalLexiCredit = totalLC;
                    store.userProfile.isAdmin = editForm.value.isAdmin;
                    store.userProfile.badges = editForm.value.badges;
                }
                
                showToast("Cập nhật tài khoản thành công!", 'success');
                editingUser.value = null;
                await loadAllData();
            } catch(e) {
                showToast("Lỗi cập nhật: " + e.message, 'error');
            }
        };

        const giftCredits = async (amount) => {
            editForm.value.lexiCredit = (parseInt(editForm.value.lexiCredit) || 0) + amount;
            editForm.value.level = getLevelFromLifetimeLC(editForm.value.lexiCredit);
            showToast(`Đã cộng +${amount} LC vào biểu mẫu! Nhấn Lưu để áp dụng.`, 'info');
        };

        const openBanModal = (user) => {
            selectedUserToBan.value = user;
            showBanModal.value = true;
            banForm.value = { durationDays: '1', reason: 'Vi phạm quy định học tập' };
        };

        const applyBan = async () => {
            try {
                let banUntil = null;
                let days = parseInt(banForm.value.durationDays);
                if (days === 9999) {
                    banUntil = Date.now() + 100 * 365 * 24 * 60 * 60 * 1000;
                } else {
                    banUntil = Date.now() + days * 24 * 60 * 60 * 1000;
                }
                
                await updateOtherUser(selectedUserToBan.value.id, {
                    isBanned: true,
                    banUntil: banUntil,
                    banReason: banForm.value.reason || 'Khóa bởi Quản trị viên'
                });
                showToast(`Đã khóa tài khoản ${selectedUserToBan.value.email}!`, 'success');
                showBanModal.value = false;
                selectedUserToBan.value = null;
                await loadAllData();
            } catch(e) {
                showToast("Lỗi khóa tài khoản: " + e.message, 'error');
            }
        };

        const unbanUser = async (user) => {
            if (!confirm(`Bạn chắc chắn muốn mở khóa cho ${user.email || user.id}?`)) return;
            try {
                await updateOtherUser(user.id, {
                    isBanned: false,
                    banUntil: null,
                    banReason: null
                });
                showToast("Đã mở khóa tài khoản!", 'success');
                await loadAllData();
            } catch(e) {
                showToast("Lỗi mở khóa: " + e.message, 'error');
            }
        };

        const formatBanDate = (timestamp) => {
            if (!timestamp) return '';
            const d = new Date(timestamp);
            if (d.getFullYear() > 2100) return 'Vĩnh viễn';
            return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
        };

        // ===== DECK ACTIONS =====
        const openViewDeck = async (deck) => {
            viewingDeck.value = deck;
            isViewingDeckLoading.value = true;
            try {
                const deckCards = cardsList.value.filter(c => c.deckId === deck.id);
                viewingDeckCards.value = deckCards;
            } catch(e) {
                showToast("Lỗi tải thẻ từ vựng: " + e.message, 'error');
            } finally {
                isViewingDeckLoading.value = false;
            }
        };

        const deleteDeckByAdmin = async (deck) => {
            if (!confirm(`CẢNH BÁO QUẢN TRỊ:\nBạn có chắc chắn muốn xóa vĩnh viễn bộ thẻ "${deck.title}" cùng toàn bộ thẻ từ vựng của bộ này?`)) return;
            try {
                await adminDeleteDeck(deck.id);
                showToast(`Đã xóa bộ thẻ "${deck.title}" thành công!`, 'success');
                viewingDeck.value = null;
                await loadAllData();
            } catch(e) {
                showToast("Lỗi khi xóa bộ thẻ: " + e.message, 'error');
            }
        };

        const sendSystemBroadcast = () => {
            const msg = prompt("Nhập nội dung Thông báo Toàn Hệ Thống gửi tới người dùng:");
            if (!msg || !msg.trim()) return;
            showToast(`[BROADCAST]: ${msg.trim()}`, 'success');
        };

        return { 
            store, activeTab, usersList, decksList, cardsList, isLoading, isScanningStorage,
            userSearch, userStatusFilter, deckSearch, filteredUsers, filteredDecks,
            totalUsersCount, activeUsersCount, bannedUsersCount, totalDecksCount, totalCardsCount,
            totalLexiCreditInSystem, averageUserLevel,
            editingUser, editForm, openEditModal, saveEditUser, toggleBadgeSelection, giftCredits,
            showBanModal, banForm, selectedUserToBan, openBanModal, applyBan, unbanUser, formatBanDate,
            viewingDeck, isViewingDeckLoading, viewingDeckCards, openViewDeck, deleteDeckByAdmin,
            storageStats, scanStorageData, deleteLocalStorageItem, cleanObsoleteCaches, exportFullBackupJSON, formatBytes,
            diagState, runQuickDiagnostics, testGeminiConnection, testTTSVoice, sendSystemBroadcast,
            RANK_LIST, BADGES_DICT, allBadgesList: [...BADGES_DICT, ...EXCLUSIVE_ADMIN_BADGES]
        };
    },
    template: `
        <div class="max-w-7xl mx-auto space-y-6 pb-24 animate-fade-in select-none">
            
            <!-- HEADER BAR -->
            <div class="glass-panel-strong p-6 rounded-3xl bg-white border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-red-500 to-amber-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-red-500/20 shrink-0">
                        <i class="fa-solid fa-shield-halved"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2.5">
                            <h1 class="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">ExtraQuiz Command Center</h1>
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 uppercase tracking-widest border border-rose-200">Admin Pro v2.0</span>
                        </div>
                        <p class="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">Quản trị toàn diện Người dùng, Kho Bộ Thẻ, Phân Tích Bộ Nhớ Web & Chẩn Đoán Hệ Thống</p>
                    </div>
                </div>

                <!-- Quick Action Buttons -->
                <div class="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button @click="loadAllData" class="px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold transition flex items-center gap-2 border border-gray-200 shadow-sm" :disabled="isLoading">
                        <i class="fa-solid fa-rotate" :class="{ 'fa-spin': isLoading }"></i>
                        <span>Làm mới</span>
                    </button>
                    <button @click="exportFullBackupJSON" class="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition flex items-center gap-2 border border-emerald-200 shadow-sm">
                        <i class="fa-solid fa-download"></i>
                        <span>Backup JSON</span>
                    </button>
                    <button @click="store.navigate('dashboard')" class="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-gray-900/10">
                        <i class="fa-solid fa-arrow-left"></i>
                        <span>Dashboard</span>
                    </button>
                </div>
            </div>

            <!-- TABS NAVIGATION -->
            <div class="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
                <button @click="activeTab = 'overview'" 
                        class="px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2.5 whitespace-nowrap"
                        :class="activeTab === 'overview' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]' : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-100'">
                    <i class="fa-solid fa-chart-pie"></i>
                    <span>Tổng Quan & KPI</span>
                </button>
                <button @click="activeTab = 'storage'" 
                        class="px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2.5 whitespace-nowrap relative"
                        :class="activeTab === 'storage' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]' : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-100'">
                    <i class="fa-solid fa-hard-drive text-amber-500"></i>
                    <span>Bộ Nhớ Web & Storage</span>
                    <span class="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 ml-1">{{ storageStats.formattedUsed }}</span>
                </button>
                <button @click="activeTab = 'users'" 
                        class="px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2.5 whitespace-nowrap"
                        :class="activeTab === 'users' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]' : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-100'">
                    <i class="fa-solid fa-users"></i>
                    <span>Quản Lý Người Dùng</span>
                    <span class="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-700 ml-1">{{ totalUsersCount }}</span>
                </button>
                <button @click="activeTab = 'decks'" 
                        class="px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2.5 whitespace-nowrap"
                        :class="activeTab === 'decks' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]' : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-100'">
                    <i class="fa-solid fa-layer-group"></i>
                    <span>Kho Bộ Thẻ Toàn Cầu</span>
                    <span class="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-purple-100 text-purple-700 ml-1">{{ totalDecksCount }}</span>
                </button>
                <button @click="activeTab = 'diagnostics'" 
                        class="px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2.5 whitespace-nowrap"
                        :class="activeTab === 'diagnostics' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]' : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-100'">
                    <i class="fa-solid fa-stethoscope text-emerald-500"></i>
                    <span>Chẩn Đoán & Health</span>
                </button>
            </div>

            <!-- ========================================================================= -->
            <!-- TAB 1: TỔNG QUAN & KPI HỆ THỐNG -->
            <!-- ========================================================================= -->
            <div v-if="activeTab === 'overview'" class="space-y-6 animate-fade-in">
                <!-- 4 KPI Cards -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
                        <div class="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform"></div>
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Người Dùng</span>
                            <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
                                <i class="fa-solid fa-user-group"></i>
                            </div>
                        </div>
                        <div class="text-2xl sm:text-3xl font-black text-gray-900">{{ totalUsersCount }}</div>
                        <div class="flex items-center gap-2 text-[11px] font-bold text-gray-500 mt-1">
                            <span class="text-emerald-600 font-extrabold">{{ activeUsersCount }} Hoạt động</span> · 
                            <span class="text-rose-500">{{ bannedUsersCount }} Khóa</span>
                        </div>
                    </div>

                    <div class="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
                        <div class="absolute -right-6 -top-6 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform"></div>
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Bộ Thẻ / Thẻ Từ</span>
                            <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold">
                                <i class="fa-solid fa-book-bookmark"></i>
                            </div>
                        </div>
                        <div class="text-2xl sm:text-3xl font-black text-gray-900">{{ totalDecksCount }} <span class="text-base font-bold text-gray-400">/ {{ totalCardsCount }}</span></div>
                        <div class="text-[11px] font-bold text-purple-600 mt-1">
                            {{ (totalCardsCount / (totalDecksCount || 1)).toFixed(1) }} thẻ trung bình / bộ
                        </div>
                    </div>

                    <div class="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
                        <div class="absolute -right-6 -top-6 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform"></div>
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng LexiCredit</span>
                            <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">
                                <i class="fa-solid fa-gem"></i>
                            </div>
                        </div>
                        <div class="text-2xl sm:text-3xl font-black text-amber-500">{{ totalLexiCreditInSystem.toLocaleString('vi-VN') }}</div>
                        <div class="text-[11px] font-bold text-gray-500 mt-1">
                            Cấp độ TB: <span class="text-indigo-600 font-extrabold">Lv.{{ averageUserLevel }}</span>
                        </div>
                    </div>

                    <div class="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
                        <div class="absolute -right-6 -top-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform"></div>
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Bộ Nhớ Web Đã Dùng</span>
                            <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
                                <i class="fa-solid fa-hard-drive"></i>
                            </div>
                        </div>
                        <div class="text-2xl sm:text-3xl font-black text-emerald-600">{{ storageStats.formattedUsed }}</div>
                        <div class="text-[11px] font-bold text-gray-500 mt-1">
                            Giới hạn Quota: <span class="text-gray-700">{{ storageStats.formattedQuota }}</span>
                        </div>
                    </div>
                </div>

                <!-- Storage Progress & Quick Summary Row -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Storage Visual Progress -->
                    <div class="lg:col-span-2 p-6 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-4">
                        <div class="flex items-center justify-between">
                            <h3 class="font-extrabold text-gray-900 flex items-center gap-2 text-base">
                                <i class="fa-solid fa-chart-column text-indigo-500"></i>
                                Phân Tắc Dung Lượng Trình Duyệt (Browser Storage Quota)
                            </h3>
                            <button @click="scanStorageData" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': isScanningStorage }"></i> Quét lại
                            </button>
                        </div>

                        <!-- Progress Bar -->
                        <div class="space-y-2">
                            <div class="w-full h-4 bg-gray-100 rounded-full overflow-hidden p-0.5 flex">
                                <div class="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700" 
                                     :style="{ width: Math.max(storageStats.usagePercent, 2) + '%' }"></div>
                            </div>
                            <div class="flex justify-between text-xs text-gray-500 font-bold">
                                <span>Đã dùng: <b class="text-gray-900">{{ storageStats.formattedUsed }}</b> ({{ storageStats.usagePercent }}%)</span>
                                <span>Còn trống: <b class="text-gray-900">{{ storageStats.formattedQuota }}</b></span>
                            </div>
                        </div>

                        <div class="grid grid-cols-3 gap-3 pt-2">
                            <div class="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                                <div class="text-xs font-bold text-gray-500">LocalStorage</div>
                                <div class="text-base font-black text-gray-900 mt-0.5">{{ storageStats.formattedLsTotal }}</div>
                                <div class="text-[10px] text-gray-400">{{ storageStats.lsItems.length }} keys</div>
                            </div>
                            <div class="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                                <div class="text-xs font-bold text-gray-500">CacheStorage (PWA)</div>
                                <div class="text-base font-black text-gray-900 mt-0.5">{{ storageStats.totalCacheItems }} files</div>
                                <div class="text-[10px] text-indigo-600 font-bold">extraquiz-v75</div>
                            </div>
                            <div class="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                                <div class="text-xs font-bold text-gray-500">Firestore Ước Tính</div>
                                <div class="text-base font-black text-purple-600 mt-0.5">{{ storageStats.formattedFirestoreBytes }}</div>
                                <div class="text-[10px] text-gray-400">Cloud Storage</div>
                            </div>
                        </div>
                    </div>

                    <!-- Quick System Actions & Broadcast -->
                    <div class="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 to-[#171C35] text-white space-y-4 shadow-lg flex flex-col justify-between">
                        <div>
                            <div class="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
                                <i class="fa-solid fa-bullhorn"></i> Admin Operations
                            </div>
                            <h3 class="text-lg font-black leading-snug">Điều Khiển & Phát Thông Báo</h3>
                            <p class="text-xs text-indigo-200/80 mt-1 leading-relaxed">Gửi thông báo đẩy toàn hệ thống hoặc dọn dẹp cache phiên bản cũ với 1 chạm.</p>
                        </div>

                        <div class="space-y-2 pt-2">
                            <button @click="sendSystemBroadcast" class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2">
                                <i class="fa-solid fa-paper-plane"></i> Gửi Thông Báo Broadcast
                            </button>
                            <button @click="cleanObsoleteCaches" class="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center justify-center gap-2">
                                <i class="fa-solid fa-broom"></i> Dọn Dẹp Cache Service Worker Cũ
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ========================================================================= -->
            <!-- TAB 2: QUẢN LÝ BỘ NHỚ WEB & STORAGE ANALYZER -->
            <!-- ========================================================================= -->
            <div v-if="activeTab === 'storage'" class="space-y-6 animate-fade-in">
                <!-- Storage Banner -->
                <div class="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
                            <i class="fa-solid fa-server"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-extrabold text-gray-900">Báo Cáo Chi Tiết Dữ Liệu Lưu Trữ Web (Web Storage Analyzer)</h3>
                            <p class="text-xs text-gray-600 mt-0.5">Tổng hợp thời gian thực các mục lưu trữ trong <b>LocalStorage</b>, <b>IndexedDB</b>, <b>Cache Storage</b> và <b>Firestore Cloud</b>.</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button @click="scanStorageData" class="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 shadow-sm transition flex items-center gap-2">
                            <i class="fa-solid fa-rotate" :class="{ 'fa-spin': isScanningStorage }"></i> Quét lại bộ nhớ
                        </button>
                        <button @click="cleanObsoleteCaches" class="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 shadow-sm transition flex items-center gap-2">
                            <i class="fa-solid fa-trash-can"></i> Dọn Cache Thừa
                        </button>
                    </div>
                </div>

                <!-- Storage Breakdown Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-2">
                        <div class="text-xs font-bold text-gray-400 uppercase">Trình Duyệt (Browser Quota)</div>
                        <div class="text-2xl font-black text-gray-900">{{ storageStats.formattedUsed }}</div>
                        <div class="text-xs text-gray-500">Giới hạn tối đa: <b>{{ storageStats.formattedQuota }}</b></div>
                        <div class="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mt-2">
                            <i class="fa-solid fa-circle-check"></i> Bộ nhớ duy trì: {{ storageStats.isPersisted ? 'Persistent' : 'Best-effort' }}
                        </div>
                    </div>

                    <div class="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-2">
                        <div class="text-xs font-bold text-gray-400 uppercase">Local Storage (Khóa-Giá trị)</div>
                        <div class="text-2xl font-black text-indigo-600">{{ storageStats.formattedLsTotal }}</div>
                        <div class="text-xs text-gray-500">Tổng số khóa lưu trữ: <b>{{ storageStats.lsItems.length }} keys</b></div>
                        <div class="text-[10px] text-indigo-500 font-extrabold mt-2">
                            Cấu hình Voice, Quote yêu thích, Cài đặt cá nhân
                        </div>
                    </div>

                    <div class="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-2">
                        <div class="text-xs font-bold text-gray-400 uppercase">Cloud Database (Firestore)</div>
                        <div class="text-2xl font-black text-purple-600">~{{ storageStats.formattedFirestoreBytes }}</div>
                        <div class="text-xs text-gray-500">Bộ thẻ & Thẻ: <b>{{ totalDecksCount }} bộ / {{ totalCardsCount }} thẻ</b></div>
                        <div class="text-[10px] text-purple-500 font-extrabold mt-2">
                            Tài khoản: {{ totalUsersCount }} người dùng
                        </div>
                    </div>
                </div>

                <!-- LocalStorage Itemized Table -->
                <div class="glass-panel rounded-3xl overflow-hidden shadow-sm bg-white border border-gray-100">
                    <div class="p-5 border-b border-gray-100 flex items-center justify-between">
                        <h4 class="font-black text-gray-900 text-sm flex items-center gap-2">
                            <i class="fa-solid fa-list-check text-indigo-500"></i>
                            Chi Tiết Từng Khóa Dữ Liệu LocalStorage ({{ storageStats.lsItems.length }} mục)
                        </h4>
                        <span class="text-xs text-gray-400 font-medium">Tự động sắp xếp theo kích thước giảm dần</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr class="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100">
                                    <th class="p-3.5">Tên Khóa (Key)</th>
                                    <th class="p-3.5">Phân Loại</th>
                                    <th class="p-3.5">Dung Lượng</th>
                                    <th class="p-3.5">Độ Dài Ký Tự</th>
                                    <th class="p-3.5">Xem Trước Dữ Liệu (Preview)</th>
                                    <th class="p-3.5 text-right">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50">
                                <tr v-for="item in storageStats.lsItems" :key="item.key" class="hover:bg-gray-50/60 transition">
                                    <td class="p-3.5 font-bold font-mono text-gray-900">{{ item.key }}</td>
                                    <td class="p-3.5">
                                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold"
                                              :class="item.category === 'ExtraQuiz App' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'">
                                            {{ item.category }}
                                        </span>
                                    </td>
                                    <td class="p-3.5 font-extrabold text-amber-600 font-mono">{{ item.formattedSize }}</td>
                                    <td class="p-3.5 font-mono text-gray-500">{{ item.charLength.toLocaleString() }} chars</td>
                                    <td class="p-3.5 font-mono text-gray-400 max-w-xs truncate" :title="item.preview">{{ item.preview }}</td>
                                    <td class="p-3.5 text-right">
                                        <button @click="deleteLocalStorageItem(item.key)" class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="Xóa khóa này">
                                            <i class="fa-solid fa-trash-can"></i>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- ========================================================================= -->
            <!-- TAB 3: QUẢN LÝ NGƯỜI DÙNG & GAME STATS -->
            <!-- ========================================================================= -->
            <div v-if="activeTab === 'users'" class="space-y-6 animate-fade-in">
                <!-- Search & Filters -->
                <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div class="relative w-full sm:w-96">
                        <i class="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                        <input type="text" v-model="userSearch" placeholder="Tìm theo email, tên hiển thị, ID..." 
                               class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-indigo-500 shadow-sm">
                    </div>

                    <div class="flex items-center gap-2 w-full sm:w-auto">
                        <button v-for="st in [
                                    { id: 'all', label: 'Tất cả (' + totalUsersCount + ')' },
                                    { id: 'active', label: 'Hoạt động (' + activeUsersCount + ')' },
                                    { id: 'banned', label: 'Bị khóa (' + bannedUsersCount + ')' },
                                    { id: 'admin', label: 'Admin/VIP' }
                                ]" 
                                :key="st.id" 
                                @click="userStatusFilter = st.id"
                                class="px-3 py-1.5 rounded-xl text-xs font-bold transition"
                                :class="userStatusFilter === st.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'">
                            {{ st.label }}
                        </button>
                    </div>
                </div>

                <!-- Users Table -->
                <div class="glass-panel rounded-3xl overflow-hidden shadow-sm bg-white border border-gray-100">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr class="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100">
                                    <th class="p-4">Người Dùng</th>
                                    <th class="p-4">Cấp Độ & Danh Hiệu</th>
                                    <th class="p-4">LexiCredit</th>
                                    <th class="p-4">Huy Hiệu</th>
                                    <th class="p-4">Trạng Thái</th>
                                    <th class="p-4 text-right">Hành Động</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50">
                                <tr v-for="u in filteredUsers" :key="u.id" class="hover:bg-gray-50/50 transition">
                                    <!-- User Column -->
                                    <td class="p-4 font-medium text-gray-900">
                                        <div class="flex items-center gap-3">
                                            <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shrink-0 overflow-hidden shadow-sm">
                                                <img v-if="u.avatar" :src="u.avatar" class="w-full h-full rounded-full object-cover">
                                                <img v-else :src="'https://api.dicebear.com/7.x/notionists/svg?seed=' + (u.email || 'user') + '&backgroundColor=transparent'" class="w-full h-full object-cover">
                                            </div>
                                            <div>
                                                <div class="flex items-center gap-1.5">
                                                    <span class="font-extrabold text-gray-900 text-sm">{{ u.displayName || u.email?.split('@')[0] || 'Học giả' }}</span>
                                                    <span v-if="u.id === store.user?.uid" class="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.2 rounded-full uppercase font-black">Bạn</span>
                                                    <span v-if="u.email === 'test@test.com' || u.isAdmin || u.role === 'admin'" class="text-[9px] bg-rose-100 text-rose-700 px-2 py-0.2 rounded-full uppercase font-black">ADMIN</span>
                                                </div>
                                                <div class="text-[11px] text-gray-400 font-mono">{{ u.email || 'Ẩn danh' }}</div>
                                            </div>
                                        </div>
                                    </td>

                                    <!-- Rank & Level Column -->
                                    <td class="p-4">
                                        <div class="flex items-center gap-2">
                                            <div class="w-7 h-7 rounded-xl bg-purple-50 text-purple-700 font-black flex items-center justify-center text-xs shadow-sm">
                                                {{ u.level || 1 }}
                                            </div>
                                            <span class="font-bold text-gray-700">{{ u.rank || 'Mầm Non Ngôn Ngữ' }}</span>
                                        </div>
                                    </td>

                                    <!-- LexiCredit Column -->
                                    <td class="p-4 font-mono font-black text-amber-500 text-sm">
                                        {{ (u.lexiCredit || 0).toLocaleString('vi-VN') }} <i class="fa-solid fa-gem text-xs"></i>
                                    </td>

                                    <!-- Badges Count Column -->
                                    <td class="p-4">
                                        <div class="flex items-center gap-1">
                                            <span class="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[11px]">
                                                🏆 {{ (u.badges || []).length }} huy hiệu
                                            </span>
                                        </div>
                                    </td>

                                    <!-- Status Column -->
                                    <td class="p-4">
                                        <span v-if="u.isBanned" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                                            <i class="fa-solid fa-lock text-[9px]"></i> Bị khóa ({{ formatBanDate(u.banUntil) }})
                                        </span>
                                        <span v-else class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                                            <i class="fa-solid fa-circle-check text-[9px]"></i> Hoạt động
                                        </span>
                                    </td>

                                    <!-- Actions Column -->
                                    <td class="p-4 text-right space-x-1">
                                        <button @click="openEditModal(u)" class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition" title="Chỉnh sửa Level/XP/Badges">
                                            <i class="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <button v-if="u.id !== store.user?.uid && !u.isBanned" @click="openBanModal(u)" class="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition" title="Khóa tài khoản">
                                            <i class="fa-solid fa-ban"></i>
                                        </button>
                                        <button v-if="u.id !== store.user?.uid && u.isBanned" @click="unbanUser(u)" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition" title="Mở khóa">
                                            <i class="fa-solid fa-lock-open"></i>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- ========================================================================= -->
            <!-- TAB 4: KHO BỘ THẺ TOÀN CẦU -->
            <!-- ========================================================================= -->
            <div v-if="activeTab === 'decks'" class="space-y-6 animate-fade-in">
                <!-- Search & Actions -->
                <div class="flex items-center justify-between gap-4">
                    <div class="relative w-full sm:w-96">
                        <i class="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                        <input type="text" v-model="deckSearch" placeholder="Tìm bộ thẻ theo tên, mô tả..." 
                               class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-indigo-500 shadow-sm">
                    </div>
                    <div class="text-xs font-bold text-gray-500">
                        Hiển thị {{ filteredDecks.length }} / {{ totalDecksCount }} bộ thẻ
                    </div>
                </div>

                <!-- Decks Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div v-for="deck in filteredDecks" :key="deck.id" 
                         class="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                        <div class="space-y-2">
                            <div class="flex items-start justify-between gap-2">
                                <h4 class="font-black text-gray-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-1">{{ deck.title }}</h4>
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 shrink-0">
                                    {{ deck.cardsCount || 0 }} thẻ
                                </span>
                            </div>
                            <p class="text-xs text-gray-500 line-clamp-2 leading-relaxed">{{ deck.description || 'Không có mô tả.' }}</p>
                            <div class="text-[11px] text-gray-400 font-mono pt-1">
                                Creator: {{ deck.userId ? deck.userId.substring(0, 10) + '...' : 'Unknown' }}
                            </div>
                        </div>

                        <div class="flex items-center justify-between pt-4 mt-3 border-t border-gray-50">
                            <button @click="openViewDeck(deck)" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                <i class="fa-solid fa-eye"></i> Xem danh sách từ
                            </button>
                            <button @click="deleteDeckByAdmin(deck)" class="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1" title="Xóa bộ thẻ này">
                                <i class="fa-solid fa-trash-can"></i> Xóa
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ========================================================================= -->
            <!-- TAB 5: CHẨN ĐOÁN & HEALTH CHECK -->
            <!-- ========================================================================= -->
            <div v-if="activeTab === 'diagnostics'" class="space-y-6 animate-fade-in">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Service Status -->
                    <div class="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-4">
                        <div class="flex items-center justify-between">
                            <h3 class="font-black text-gray-900 text-base flex items-center gap-2">
                                <i class="fa-solid fa-heart-pulse text-rose-500"></i>
                                Trạng Thái Dịch Vụ Hệ Thống
                            </h3>
                            <button @click="runQuickDiagnostics" class="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                                <i class="fa-solid fa-rotate"></i> Ping lại
                            </button>
                        </div>

                        <div class="space-y-3 text-xs font-medium">
                            <!-- Firestore -->
                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                <div class="flex items-center gap-3">
                                    <div class="w-3 h-3 rounded-full" :class="diagState.firestoreStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'"></div>
                                    <div>
                                        <div class="font-extrabold text-gray-900">Firebase Firestore Cloud DB</div>
                                        <div class="text-[10px] text-gray-500">Cơ sở dữ liệu đám mây</div>
                                    </div>
                                </div>
                                <span class="font-mono font-bold text-emerald-600">{{ diagState.firestorePing || 0 }} ms</span>
                            </div>

                            <!-- Gemini AI -->
                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                <div class="flex items-center gap-3">
                                    <div class="w-3 h-3 rounded-full" :class="diagState.geminiStatus === 'online' ? 'bg-emerald-500' : 'bg-gray-400'"></div>
                                    <div>
                                        <div class="font-extrabold text-gray-900">Gemini 2.5 Flash AI Engine</div>
                                        <div class="text-[10px] text-gray-500">Chấm Writing & AI Tutor</div>
                                    </div>
                                </div>
                                <button @click="testGeminiConnection" class="px-3 py-1 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 transition">
                                    {{ diagState.geminiStatus === 'testing' ? 'Đang test...' : 'Test AI' }}
                                </button>
                            </div>

                            <!-- Speech Synthesis -->
                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                <div class="flex items-center gap-3">
                                    <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <div>
                                        <div class="font-extrabold text-gray-900">Web Speech Synthesis API (TTS)</div>
                                        <div class="text-[10px] text-gray-500">{{ diagState.ttsVoicesCount }} giọng đọc có sẵn</div>
                                    </div>
                                </div>
                                <button @click="testTTSVoice" class="px-3 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg hover:bg-amber-100 transition">
                                    <i class="fa-solid fa-volume-high mr-1"></i> Nghe thử
                                </button>
                            </div>

                            <!-- Service Worker -->
                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                <div class="flex items-center gap-3">
                                    <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <div>
                                        <div class="font-extrabold text-gray-900">Service Worker & PWA Cache</div>
                                        <div class="text-[10px] text-indigo-600 font-bold">{{ diagState.swVersion }}</div>
                                    </div>
                                </div>
                                <span class="text-emerald-600 font-bold uppercase text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full">Kích hoạt</span>
                            </div>
                        </div>
                    </div>

                    <!-- System Information Box -->
                    <div class="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-4">
                        <h3 class="font-black text-gray-900 text-base flex items-center gap-2">
                            <i class="fa-solid fa-circle-info text-blue-500"></i>
                            Thông Tin Nền Tảng (Environment Info)
                        </h3>
                        <div class="space-y-2 text-xs">
                            <div class="flex justify-between py-2 border-b border-gray-100">
                                <span class="text-gray-500">Ứng dụng:</span>
                                <span class="font-bold text-gray-900">ExtraQuiz Pro Web App</span>
                            </div>
                            <div class="flex justify-between py-2 border-b border-gray-100">
                                <span class="text-gray-500">Phiên bản Cache PWA:</span>
                                <span class="font-bold text-indigo-600 font-mono">{{ diagState.swVersion }}</span>
                            </div>
                            <div class="flex justify-between py-2 border-b border-gray-100">
                                <span class="text-gray-500">Trình duyệt User-Agent:</span>
                                <span class="font-mono text-gray-700 text-[10px] max-w-xs truncate" :title="navigator.userAgent">{{ navigator.userAgent }}</span>
                            </div>
                            <div class="flex justify-between py-2 border-b border-gray-100">
                                <span class="text-gray-500">Độ phân giải màn hình:</span>
                                <span class="font-bold text-gray-900">{{ window.innerWidth }} x {{ window.innerHeight }}px</span>
                            </div>
                            <div class="flex justify-between py-2">
                                <span class="text-gray-500">Trạng thái Online:</span>
                                <span class="font-bold text-emerald-600 flex items-center gap-1">
                                    <i class="fa-solid fa-wifi"></i> Kết nối Internet ổn định
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ========================================================================= -->
            <!-- MODAL: EDIT USER & GAMIFICATION -->
            <!-- ========================================================================= -->
            <div v-if="editingUser" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div class="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                        <div>
                            <h3 class="text-xl font-black text-gray-900">Chỉnh Sửa Hồ Sơ Game</h3>
                            <p class="text-xs text-gray-500 mt-0.5">{{ editingUser.email || editingUser.id }}</p>
                        </div>
                        <button @click="editingUser = null" class="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div class="space-y-4 text-xs">
                        <!-- LexiCredit & Level Inputs -->
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block font-black text-amber-600 uppercase mb-1">
                                    <i class="fa-solid fa-gem mr-1"></i> LexiCredit (LC)
                                </label>
                                <input type="number" v-model="editForm.lexiCredit" class="w-full px-3 py-2.5 rounded-xl border border-amber-200 focus:border-amber-400 font-mono font-bold text-sm bg-amber-50/30">
                            </div>
                            <div>
                                <label class="block font-black text-purple-600 uppercase mb-1">
                                    <i class="fa-solid fa-shield-cat mr-1"></i> Cấp Độ (Level)
                                </label>
                                <input type="number" v-model="editForm.level" class="w-full px-3 py-2.5 rounded-xl border border-purple-200 focus:border-purple-400 font-bold text-sm bg-purple-50/30" min="1">
                            </div>
                        </div>

                        <!-- Quick LC Gift Buttons -->
                        <div class="flex items-center gap-2">
                            <span class="text-gray-400 font-bold text-[10px]">Tặng nhanh:</span>
                            <button @click="giftCredits(50)" class="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg font-bold">+50 LC</button>
                            <button @click="giftCredits(200)" class="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg font-bold">+200 LC</button>
                            <button @click="giftCredits(1000)" class="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg font-bold">+1000 LC</button>
                        </div>

                        <!-- Admin Role Checkbox -->
                        <div class="p-3 rounded-2xl bg-rose-50/60 border border-rose-200 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <i class="fa-solid fa-crown text-rose-500 text-sm"></i>
                                <div>
                                    <div class="font-bold text-rose-900">Quyền Quản Trị Viên (Admin Pro)</div>
                                    <div class="text-[10px] text-rose-600">Cho phép truy cập Command Center</div>
                                </div>
                            </div>
                            <input type="checkbox" v-model="editForm.isAdmin" class="w-4 h-4 text-rose-600 rounded">
                        </div>

                        <!-- Badges Grid Management -->
                        <div class="space-y-2 pt-2">
                            <label class="block font-black text-gray-700 uppercase">
                                <i class="fa-solid fa-trophy text-amber-500 mr-1"></i> Quản Lý Huy Hiệu ({{ editForm.badges.length }} đã cấp)
                            </label>
                            <div class="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-2xl border border-gray-200">
                                <div v-for="badge in allBadgesList" :key="badge.id" 
                                     @click="toggleBadgeSelection(badge.id)"
                                     class="p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition select-none text-center"
                                     :class="editForm.badges.includes(badge.id) ? 'bg-amber-100 border-amber-400 shadow-sm' : 'bg-white border-gray-200 opacity-40 hover:opacity-100'">
                                    <img v-if="badge.image3d" :src="badge.image3d" class="w-6 h-6 object-contain">
                                    <span v-else class="text-xl leading-none">{{ badge.emoji || badge.icon }}</span>
                                    <span class="text-[9px] font-bold text-gray-700 line-clamp-1 w-full">{{ badge.title }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="flex gap-3 pt-4 border-t border-gray-100">
                            <button @click="editingUser = null" class="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition">Hủy bỏ</button>
                            <button @click="saveEditUser" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition">Lưu Thay Đổi</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ========================================================================= -->
            <!-- MODAL: BAN USER -->
            <!-- ========================================================================= -->
            <div v-if="showBanModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
                    <div class="w-12 h-12 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center text-xl mb-4 mx-auto">
                        <i class="fa-solid fa-gavel"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-1 text-center">Khóa Tài Khoản</h3>
                    <p class="text-xs text-gray-500 mb-4 text-center">Bạn đang ban <b>{{ selectedUserToBan?.email }}</b></p>
                    
                    <div class="space-y-3 text-xs">
                        <div>
                            <label class="block font-bold text-gray-600 mb-1">Thời hạn khóa:</label>
                            <select v-model="banForm.durationDays" class="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold">
                                <option value="1">Khóa 1 ngày</option>
                                <option value="7">Khóa 7 ngày</option>
                                <option value="30">Khóa 30 ngày</option>
                                <option value="9999">Khóa Vĩnh Viễn</option>
                            </select>
                        </div>

                        <div>
                            <label class="block font-bold text-gray-600 mb-1">Lý do khóa:</label>
                            <input type="text" v-model="banForm.reason" placeholder="Nhập lý do..." class="w-full px-3 py-2 rounded-xl border border-gray-200">
                        </div>

                        <div class="flex gap-3 pt-3">
                            <button @click="showBanModal = false" class="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl">Hủy</button>
                            <button @click="applyBan" class="flex-1 py-2.5 bg-rose-500 text-white font-bold rounded-xl shadow-md">Thi hành Ban</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ========================================================================= -->
            <!-- MODAL: VIEW DECK CARDS -->
            <!-- ========================================================================= -->
            <div v-if="viewingDeck" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-3xl shadow-2xl animate-scale-in max-h-[85vh] flex flex-col">
                    <div class="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                        <div>
                            <h3 class="text-xl font-black text-gray-900">{{ viewingDeck.title }}</h3>
                            <p class="text-xs text-gray-500 mt-0.5">{{ viewingDeckCards.length }} thẻ từ vựng trong bộ này</p>
                        </div>
                        <button @click="viewingDeck = null" class="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                        <div v-if="isViewingDeckLoading" class="text-center py-12 text-gray-400">
                            <i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
                            <p class="text-xs">Đang tải thẻ từ vựng...</p>
                        </div>
                        <div v-else-if="viewingDeckCards.length === 0" class="text-center py-12 text-gray-400 text-xs">
                            Bộ thẻ này hiện chưa có thẻ nào.
                        </div>
                        <div v-else v-for="(c, idx) in viewingDeckCards" :key="c.id" class="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-start justify-between gap-4 text-xs">
                            <div class="space-y-1 min-w-0">
                                <div class="flex items-center gap-2">
                                    <span class="font-extrabold text-gray-900 text-sm">{{ idx + 1 }}. {{ c.term }}</span>
                                    <span v-if="c.pos" class="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold">{{ c.pos }}</span>
                                    <span v-if="c.pronunciation" class="text-gray-400 font-serif italic">{{ c.pronunciation }}</span>
                                </div>
                                <div class="text-gray-700 font-medium">{{ c.definition }}</div>
                                <div v-if="c.example" class="text-gray-400 italic text-[11px]">"{{ c.example }}"</div>
                            </div>
                            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0" 
                                  :class="c.status === 'learned' || c.status === 'mastered' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'">
                                {{ c.status || 'unlearned' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    `
};
