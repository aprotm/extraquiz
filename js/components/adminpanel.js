import { ref, onMounted, watch } from 'vue';
import { store } from '../store.js';
import { fetchAllUsers, updateOtherUser } from '../db.js';
import { showToast } from '../app.js';
import { getLevelFromLifetimeLC, getRankFromLevel } from '../ranks.js';

export default {
    setup() {
        const usersList = ref([]);
        const isLoading = ref(true);
        const editingUser = ref(null);
        
        // Form states
        const editForm = ref({ level: 1, lexiCredit: 0 });
        
        watch(() => editForm.value.lexiCredit, (newLc) => {
            editForm.value.level = getLevelFromLifetimeLC(newLc || 0);
        });
        
        const showBanModal = ref(false);
        const banForm = ref({ durationDays: '1' });
        const selectedUserToBan = ref(null);

        onMounted(async () => {
            if (store.user?.email !== 'test@test.com') {
                store.navigate('dashboard');
                return;
            }
            await loadUsers();
        });

        const loadUsers = async () => {
            isLoading.value = true;
            try {
                usersList.value = await fetchAllUsers();
            } catch(e) {
                showToast("Lỗi khi tải danh sách users: " + e.message, 'error');
            } finally {
                isLoading.value = false;
            }
        };

        const openEditModal = (user) => {
            editingUser.value = user;
            editForm.value = { level: user.level || 1, lexiCredit: user.lexiCredit || 0 };
        };

        const saveEditUser = async () => {
            try {
                let lc = parseInt(editForm.value.lexiCredit) || 0;
                let lvl = parseInt(editForm.value.level) || 1;
                let newRank = getRankFromLevel(lvl);
                
                await updateOtherUser(editingUser.value.id, {
                    level: lvl,
                    rank: newRank.title,
                    lexiCredit: lc
                });
                
                // Nếu tự buff cho chính mình, cập nhật store ngay lập tức
                if (editingUser.value.id === store.user?.uid) {
                    store.userProfile.level = lvl;
                    store.userProfile.rank = newRank.title;
                    store.userProfile.lexiCredit = lc;
                }
                
                showToast("Cập nhật thành công!", 'success');
                editingUser.value = null;
                await loadUsers();
            } catch(e) {
                showToast("Lỗi cập nhật: " + e.message, 'error');
            }
        };

        const openBanModal = (user) => {
            selectedUserToBan.value = user;
            showBanModal.value = true;
            banForm.value.durationDays = '1';
        };

        const applyBan = async () => {
            try {
                let banUntil = null;
                let days = parseInt(banForm.value.durationDays);
                if (days === 9999) { // Permanent
                    banUntil = Date.now() + 100 * 365 * 24 * 60 * 60 * 1000; // ~100 years
                } else {
                    banUntil = Date.now() + days * 24 * 60 * 60 * 1000;
                }
                
                await updateOtherUser(selectedUserToBan.value.id, {
                    isBanned: true,
                    banUntil: banUntil
                });
                showToast("Đã khóa tài khoản!", 'success');
                showBanModal.value = false;
                selectedUserToBan.value = null;
                await loadUsers();
            } catch(e) {
                showToast("Lỗi khóa acc: " + e.message, 'error');
            }
        };

        const unbanUser = async (user) => {
            if (!confirm(`Bạn chắc chắn muốn mở khóa cho ${user.email || user.id}?`)) return;
            try {
                await updateOtherUser(user.id, {
                    isBanned: false,
                    banUntil: null
                });
                showToast("Đã mở khóa tài khoản!", 'success');
                await loadUsers();
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

        return { 
            store, usersList, isLoading, 
            editingUser, editForm, openEditModal, saveEditUser,
            showBanModal, banForm, selectedUserToBan, openBanModal, applyBan, unbanUser, formatBanDate
        };
    },
    template: `
        <div class="max-w-6xl mx-auto space-y-6 pb-20">
            <div class="flex items-center justify-between">
                <h1 class="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                    <i class="fa-solid fa-user-shield text-red-500"></i>
                    Admin Control Panel
                </h1>
                <button @click="store.navigate('dashboard')" class="btn-ghost px-4 py-2 text-sm font-bold text-gray-600">
                    <i class="fa-solid fa-arrow-left mr-2"></i> Quay lại
                </button>
            </div>

            <div v-if="isLoading" class="text-center py-20 text-gray-500">
                <i class="fa-solid fa-spinner fa-spin text-3xl mb-4"></i>
                <p>Đang tải danh sách người chơi...</p>
            </div>

            <div v-else class="glass-panel rounded-3xl overflow-hidden shadow-lg">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-widest text-gray-500">
                                <th class="p-4 font-bold">Email / ID</th>
                                <th class="p-4 font-bold">Cấp Độ</th>
                                <th class="p-4 font-bold">LexiCredit</th>
                                <th class="p-4 font-bold">Trạng Thái</th>
                                <th class="p-4 font-bold text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody class="text-sm">
                            <tr v-for="u in usersList" :key="u.id" class="border-b border-gray-50 hover:bg-gray-50/50 transition">
                                <td class="p-4 font-medium text-gray-900">
                                    {{ u.email || 'Ẩn danh' }}
                                    <span v-if="u.id === store.user?.uid" class="ml-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase font-bold">Bạn</span>
                                    <div class="text-xs text-gray-400 font-mono mt-0.5">{{ u.id }}</div>
                                </td>
                                <td class="p-4">
                                    <div class="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                                        {{ u.level || 1 }}
                                    </div>
                                </td>
                                <td class="p-4 font-mono font-bold text-amber-500">{{ u.lexiCredit || 0 }} <i class="fa-solid fa-gem text-xs"></i></td>
                                <td class="p-4">
                                    <span v-if="u.isBanned" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">
                                        <i class="fa-solid fa-lock text-[10px]"></i> Bị khóa ({{ formatBanDate(u.banUntil) }})
                                    </span>
                                    <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600">
                                        <i class="fa-solid fa-check text-[10px]"></i> Hoạt động
                                    </span>
                                </td>
                                <td class="p-4 text-right space-x-2">
                                    <button @click="openEditModal(u)" class="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition" title="Sửa Level/XP">
                                        <i class="fa-solid fa-pen"></i>
                                    </button>
                                    <button v-if="u.id !== store.user?.uid && !u.isBanned" @click="openBanModal(u)" class="p-2 text-red-500 hover:bg-red-50 rounded-xl transition" title="Khóa tài khoản">
                                        <i class="fa-solid fa-ban"></i>
                                    </button>
                                    <button v-if="u.id !== store.user?.uid && u.isBanned" @click="unbanUser(u)" class="p-2 text-green-500 hover:bg-green-50 rounded-xl transition" title="Mở khóa tài khoản">
                                        <i class="fa-solid fa-unlock"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Edit XP/Level Modal -->
            <div v-if="editingUser" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
                    <h3 class="text-xl font-bold text-gray-900 mb-4">Chỉnh sửa {{ editingUser.email || 'User' }}</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Level (Tự động hoặc tùy chỉnh)</label>
                            <input type="number" v-model="editForm.level" class="input-field" min="1">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-amber-500 uppercase mb-1"><i class="fa-solid fa-gem mr-1"></i>LexiCredit</label>
                            <input type="number" v-model="editForm.lexiCredit" class="input-field border-amber-200 focus:border-amber-400 focus:ring-amber-100" min="0">
                        </div>
                        <div class="flex gap-3 pt-4">
                            <button @click="editingUser = null" class="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition">Hủy</button>
                            <button @click="saveEditUser" class="btn-primary flex-1 py-3 text-sm">Lưu</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Ban Modal -->
            <div v-if="showBanModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
                    <div class="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-xl mb-4 mx-auto">
                        <i class="fa-solid fa-gavel"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-1 text-center">Khóa Tài Khoản</h3>
                    <p class="text-sm text-gray-500 mb-6 text-center text-balance">Bạn đang ban <b>{{ selectedUserToBan?.email }}</b>. Chọn thời hạn khóa:</p>
                    
                    <div class="space-y-4">
                        <select v-model="banForm.durationDays" class="input-field w-full cursor-pointer">
                            <option value="1">Khóa 1 ngày</option>
                            <option value="7">Khóa 7 ngày</option>
                            <option value="30">Khóa 30 ngày</option>
                            <option value="9999">Khóa Vĩnh Viễn</option>
                        </select>
                        <div class="flex gap-3 pt-4">
                            <button @click="showBanModal = false" class="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition">Hủy bỏ</button>
                            <button @click="applyBan" class="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-md shadow-red-200 transition">Thi hành</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    `
};
