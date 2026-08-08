import { ref, computed, onMounted, onUnmounted } from 'vue';
import { store } from '../store.js';
import { updateCardMemoryState } from '../db.js';
import { playCorrect, playIncorrect, playClick, playComplete } from '../sfx.js';
import { createSession, evaluateTyping, acceptedAnswers, scoreUpdate } from '../learnengine.js';

const defaults = { shuffle: true, starredOnly: false, soundEffects: true, questionTypes: { multiple_choice: true, typing: true, flashcard: true }, directions: { en_to_vi: true, vi_to_en: true } };

export default {
    setup() {
        const settings = ref({ ...defaults, questionTypes: { ...defaults.questionTypes }, directions: { ...defaults.directions } });
        const showSettings = ref(false), session = ref([]), index = ref(0), answer = ref(''), revealed = ref(false), feedback = ref(null), startedAt = ref(Date.now()), now = ref(Date.now()), completed = ref(false), inputRef = ref(null);
        const stats = ref({ correct: 0, completed: 0, streak: 0, bestStreak: 0, xp: 0 });
        const current = computed(() => session.value[index.value]);
        const starredCount = computed(() => store.activeCards.filter(card => card.isStarred).length);
        const elapsed = computed(() => Math.max(0, Math.floor((now.value - startedAt.value) / 1000)));
        const formatTime = computed(() => `${String(Math.floor(elapsed.value / 60)).padStart(2, '0')}:${String(elapsed.value % 60).padStart(2, '0')}`);
        const enabledTypes = computed(() => Object.values(settings.value.questionTypes).filter(Boolean).length);
        const enabledDirections = computed(() => Object.values(settings.value.directions).filter(Boolean).length);
        const prompt = computed(() => !current.value ? '' : current.value.direction === 'en_to_vi' ? current.value.card.term : current.value.card.definition);
        const expected = computed(() => !current.value ? [] : acceptedAnswers(current.value.card, current.value.direction));
        const accuracy = computed(() => stats.value.completed ? Math.round(stats.value.correct / stats.value.completed * 100) : 0);

        const saveSettings = () => localStorage.setItem('learn-settings-v3', JSON.stringify(settings.value));
        const startSession = () => {
            if (settings.value.starredOnly && !starredCount.value) settings.value.starredOnly = false;
            session.value = createSession(store.activeCards, settings.value);
            index.value = 0; answer.value = ''; revealed.value = false; feedback.value = null; completed.value = !session.value.length; startedAt.value = Date.now(); stats.value = { correct: 0, completed: 0, streak: 0, bestStreak: 0, xp: 0 };
            setTimeout(() => inputRef.value?.focus(), 50);
        };
        const persistScore = (result) => {
            const card = current.value.card;
            const update = scoreUpdate(card, result);
            card.learnStats = update.learnStats;
            updateCardMemoryState(card.id, update);
            const correct = result === 'correct' || result === 'easy';
            stats.value.completed++;
            if (correct) { stats.value.correct++; stats.value.streak++; stats.value.bestStreak = Math.max(stats.value.bestStreak, stats.value.streak); stats.value.xp += result === 'easy' ? 3 : 2; store.recordStudyActivity(); store.addLexiCredit(1, 'action'); if (settings.value.soundEffects) playCorrect(); }
            else { stats.value.streak = 0; if (settings.value.soundEffects) playIncorrect(); }
        };
        const submit = (choice = answer.value) => {
            if (!current.value || feedback.value || current.value.type === 'flashcard') return;
            if (current.value.type === 'multiple_choice') answer.value = choice;
            const evaluation = current.value.type === 'typing' ? evaluateTyping(choice, current.value.card, current.value.direction) : { correct: choice === (current.value.direction === 'en_to_vi' ? current.value.card.definition : current.value.card.term) };
            persistScore(evaluation.correct ? 'correct' : 'forgot');
            feedback.value = { correct: evaluation.correct, accepted: evaluation.accepted || expected.value };
        };
        const rateFlashcard = (result) => { if (!revealed.value || feedback.value) return; persistScore(result); feedback.value = { correct: result !== 'forgot', accepted: expected.value }; };
        const next = () => { if (!feedback.value) return; if (index.value >= session.value.length - 1) { completed.value = true; if (settings.value.soundEffects) playComplete(); return; } index.value++; answer.value = ''; revealed.value = false; feedback.value = null; if (settings.value.soundEffects) playClick(); setTimeout(() => inputRef.value?.focus(), 50); };
        const toggleOption = (group, key) => { if (Object.values(settings.value[group]).filter(Boolean).length === 1 && settings.value[group][key]) return; settings.value[group][key] = !settings.value[group][key]; saveSettings(); };
        const keyboard = (event) => { 
            if (event.key === 'Enter' && feedback.value) next(); 
            if (!feedback.value && current.value?.type === 'multiple_choice') {
                const num = parseInt(event.key);
                if (num >= 1 && num <= current.value.options.length) submit(current.value.options[num - 1]);
            }
        };
        let timer;
        onMounted(() => { if (!store.activeDeck) { store.navigate('dashboard'); return; } try { const saved = JSON.parse(localStorage.getItem('learn-settings-v3')); if (saved) settings.value = { ...defaults, ...saved, questionTypes: { ...defaults.questionTypes, ...saved.questionTypes }, directions: { ...defaults.directions, ...saved.directions } }; } catch (_) {} startSession(); timer = setInterval(() => now.value = Date.now(), 1000); window.addEventListener('keydown', keyboard); });
        onUnmounted(() => { window.removeEventListener('keydown', keyboard); clearInterval(timer); });
        return { store, settings, showSettings, session, index, current, prompt, expected, answer, revealed, feedback, completed, stats, accuracy, formatTime, inputRef, starredCount, enabledTypes, enabledDirections, startSession, submit, rateFlashcard, next, toggleOption, saveSettings };
    },
    template: `
      <div class="max-w-3xl mx-auto pb-20">
        <header class="flex items-center justify-between mb-5"><button @click="store.navigate('deck-detail')" class="btn-ghost px-3 text-sm font-bold"><i class="fa-solid fa-xmark mr-2"></i>Thoát</button><div class="text-sm text-gray-500 font-semibold">{{ index + 1 }} / {{ session.length }}</div><button @click="showSettings = true" class="btn-ghost px-3 text-sm font-bold"><i class="fa-solid fa-sliders mr-2"></i>Cài đặt</button></header>
        <div v-if="!completed" class="progress-bar-track mb-4"><div class="progress-bar-fill" :style="{ width: (index / Math.max(session.length, 1) * 100) + '%' }"></div></div>
        <div v-if="completed" class="glass-panel-strong rounded-3xl p-8 sm:p-12 text-center space-y-5"><div class="text-5xl">🎓</div><h1 class="text-3xl font-extrabold text-gray-900">Hoàn thành phiên học</h1><p class="text-gray-500">{{ stats.completed }} lượt · {{ accuracy }}% chính xác · Chuỗi tốt nhất {{ stats.bestStreak }}</p><div class="grid grid-cols-2 gap-3 text-left"><div class="bg-purple-50 rounded-2xl p-4"><p class="text-xs text-purple-600 font-bold">XP NHẬN ĐƯỢC</p><p class="text-2xl font-bold text-purple-900">+{{ stats.xp }}</p></div><div class="bg-emerald-50 rounded-2xl p-4"><p class="text-xs text-emerald-600 font-bold">ĐỘ CHÍNH XÁC</p><p class="text-2xl font-bold text-emerald-900">{{ accuracy }}%</p></div></div><button @click="startSession" class="btn-primary px-6 py-3">Học lại</button></div>
        <section v-else-if="current" class="glass-panel-strong rounded-3xl overflow-hidden" aria-live="polite"><div class="p-5 sm:p-7 border-b border-gray-100"><div class="flex justify-between gap-3"><p class="text-xs font-bold uppercase tracking-widest text-purple-500">{{ current.type === 'multiple_choice' ? 'Chọn đáp án' : current.type === 'typing' ? 'Nhập đáp án' : 'Flashcard' }} · {{ current.direction === 'en_to_vi' ? 'Anh → Việt' : 'Việt → Anh' }}</p><span class="text-xs font-bold text-gray-400">{{ formatTime }}</span></div><h1 class="mt-5 text-3xl sm:text-4xl font-extrabold text-gray-900 break-words">{{ prompt }}</h1><p v-if="current.direction === 'en_to_vi' && current.card.pronunciation" class="mt-2 text-gray-500 font-mono">{{ current.card.pronunciation }}</p></div>
          <div class="p-5 sm:p-7"><template v-if="current.type === 'flashcard'"><div v-if="!revealed" class="text-center py-8"><button @click="revealed = true" class="btn-primary px-7 py-4">Hiển thị đáp án</button></div><div v-else class="text-center space-y-6"><p class="text-2xl font-bold text-gray-900">{{ expected[0] }}</p><p class="text-sm text-gray-500">Bạn nhớ từ này ở mức nào?</p><div class="grid grid-cols-3 gap-2"><button @click="rateFlashcard('forgot')" class="rounded-xl p-3 font-bold text-red-700 bg-red-50 border border-red-200">Quên</button><button @click="rateFlashcard('hard')" class="rounded-xl p-3 font-bold text-amber-700 bg-amber-50 border border-amber-200">Khó</button><button @click="rateFlashcard('easy')" class="rounded-xl p-3 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">Dễ</button></div></div></template><template v-else-if="current.type === 'multiple_choice'"><div class="grid gap-3"><button v-for="(option, i) in current.options" :key="option" @click="submit(option)" :disabled="!!feedback" class="text-left rounded-2xl border-2 p-4 font-semibold hover:border-purple-400 disabled:cursor-default transition-all flex items-center justify-between group" :class="feedback && feedback.accepted.includes(option) ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : (feedback && answer === option ? 'border-red-500 bg-red-50 text-red-800' : 'border-gray-200 text-gray-800 bg-white')"><span>{{ option }}</span><span class="w-7 h-7 rounded-lg border-2 border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:border-purple-300 group-hover:text-purple-500 transition-colors bg-gray-50" v-if="!feedback">{{ i + 1 }}</span></button></div></template><template v-else><input ref="inputRef" v-model="answer" @keydown.enter.prevent="answer.trim() && submit()" :disabled="!!feedback" class="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 p-4 text-xl font-bold text-center focus:border-purple-500 outline-none" placeholder="Nhập câu trả lời"><div class="flex gap-3 mt-4"><button @click="submit('')" :disabled="!!feedback" class="btn-ghost flex-1 py-3 bg-gray-100 hover:bg-gray-200 font-bold text-gray-600 disabled:opacity-50">Không biết</button><button @click="submit()" :disabled="!answer.trim() || !!feedback" class="btn-primary flex-1 py-3 disabled:opacity-50">Kiểm tra</button></div></template>
          <div v-if="feedback" class="mt-5 rounded-2xl p-4" :class="feedback.correct ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'"><p class="font-bold">{{ feedback.correct ? 'Chính xác' : 'Chưa đúng' }}</p><p v-if="!feedback.correct" class="mt-1 text-sm">Đáp án đúng: <b>{{ expected[0] }}</b></p><button @click="next" class="btn-primary mt-4 w-full py-3">{{ index + 1 === session.length ? 'Xem kết quả' : 'Câu tiếp theo' }}</button></div>
          </div></section>
        <div v-if="!completed" class="mt-8 flex items-center justify-around bg-white border border-gray-100 shadow-sm rounded-2xl p-4">
            <div class="flex flex-col items-center gap-0.5">
                <span class="text-[10px] uppercase font-extrabold tracking-widest text-emerald-500 mb-1"><i class="fa-solid fa-check mr-1"></i> Đúng</span>
                <span class="text-xl font-black text-gray-900">{{ stats.correct }}</span>
            </div>
            <div class="h-8 w-px bg-gray-100"></div>
            <div class="flex flex-col items-center gap-0.5">
                <span class="text-[10px] uppercase font-extrabold tracking-widest text-orange-500 mb-1"><i class="fa-solid fa-fire mr-1"></i> Chuỗi</span>
                <span class="text-xl font-black text-gray-900">{{ stats.streak }}</span>
            </div>
            <div class="h-8 w-px bg-gray-100"></div>
            <div class="flex flex-col items-center gap-0.5">
                <span class="text-[10px] uppercase font-extrabold tracking-widest text-blue-500 mb-1"><i class="fa-solid fa-layer-group mr-1"></i> Còn lại</span>
                <span class="text-xl font-black text-gray-900">{{ session.length - index - 1 }}</span>
            </div>
            <div class="h-8 w-px bg-gray-100"></div>
            <div class="flex flex-col items-center gap-0.5">
                <span class="text-[10px] uppercase font-extrabold tracking-widest text-purple-500 mb-1"><i class="fa-solid fa-bolt mr-1"></i> XP</span>
                <span class="text-xl font-black text-gray-900">{{ stats.xp }}</span>
            </div>
        </div>
        <div v-if="showSettings" class="fixed inset-0 z-50 bg-black/40 p-4 flex justify-end" @click.self="showSettings = false"><aside role="dialog" aria-modal="true" aria-label="Cài đặt Learn Mode" class="w-full max-w-md h-full overflow-y-auto bg-white rounded-3xl p-6"><div class="flex justify-between"><h2 class="text-xl font-bold">Cài đặt phiên học</h2><button @click="showSettings = false" class="icon-button" aria-label="Đóng cài đặt"><i class="fa-solid fa-xmark"></i></button></div><div class="mt-6 space-y-6"><label class="flex justify-between items-center cursor-pointer"><span><b>Xáo trộn từ</b><small class="block text-gray-500">Trộn thứ tự thẻ</small></span><button type="button" @click="settings.shuffle = !settings.shuffle; saveSettings()" role="switch" :aria-checked="settings.shuffle" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0" :class="settings.shuffle ? 'bg-purple-500' : 'bg-gray-300'"><span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="settings.shuffle ? 'translate-x-6' : 'translate-x-1'"></span></button></label><label class="flex justify-between items-center cursor-pointer" :class="!starredCount ? 'opacity-50' : ''"><span><b>Chỉ từ đánh dấu sao</b><small class="block text-gray-500">{{ starredCount ? starredCount + ' từ có sẵn' : 'Không có từ vựng được đánh dấu sao.' }}</small></span><button type="button" @click="if(starredCount) { settings.starredOnly = !settings.starredOnly; saveSettings(); }" :disabled="!starredCount" role="switch" :aria-checked="settings.starredOnly" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 disabled:cursor-not-allowed" :class="settings.starredOnly ? 'bg-purple-500' : 'bg-gray-300'"><span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="settings.starredOnly ? 'translate-x-6' : 'translate-x-1'"></span></button></label><label class="flex justify-between items-center cursor-pointer"><span><b>Âm thanh hiệu ứng</b><small class="block text-gray-500">Không ảnh hưởng phát âm</small></span><button type="button" @click="settings.soundEffects = !settings.soundEffects; saveSettings()" role="switch" :aria-checked="settings.soundEffects" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0" :class="settings.soundEffects ? 'bg-purple-500' : 'bg-gray-300'"><span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="settings.soundEffects ? 'translate-x-6' : 'translate-x-1'"></span></button></label><div><b>Loại câu hỏi</b><div class="mt-2 space-y-2"><label v-for="(label,key) in {multiple_choice:'Trắc nghiệm',typing:'Gõ đáp án',flashcard:'Flashcard'}" :key="key" class="flex items-center justify-between cursor-pointer"><span>{{ label }}</span><button type="button" @click="toggleOption('questionTypes', key)" role="switch" :aria-checked="settings.questionTypes[key]" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0" :class="settings.questionTypes[key] ? 'bg-purple-500' : 'bg-gray-300'"><span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="settings.questionTypes[key] ? 'translate-x-6' : 'translate-x-1'"></span></button></label></div></div><div><b>Chiều trả lời</b><div class="mt-2 space-y-2"><label class="flex items-center justify-between cursor-pointer"><span>Anh → Việt</span><button type="button" @click="toggleOption('directions','en_to_vi')" role="switch" :aria-checked="settings.directions.en_to_vi" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0" :class="settings.directions.en_to_vi ? 'bg-purple-500' : 'bg-gray-300'"><span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="settings.directions.en_to_vi ? 'translate-x-6' : 'translate-x-1'"></span></button></label><label class="flex items-center justify-between cursor-pointer"><span>Việt → Anh</span><button type="button" @click="toggleOption('directions','vi_to_en')" role="switch" :aria-checked="settings.directions.vi_to_en" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0" :class="settings.directions.vi_to_en ? 'bg-purple-500' : 'bg-gray-300'"><span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="settings.directions.vi_to_en ? 'translate-x-6' : 'translate-x-1'"></span></button></label></div></div><button @click="startSession(); showSettings = false" class="btn-primary w-full py-3">Áp dụng và bắt đầu lại</button></div></aside></div>
      </div>`
};
