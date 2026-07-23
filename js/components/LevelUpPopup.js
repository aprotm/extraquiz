import { ref, onMounted, onUnmounted } from 'vue';

export default {
    setup() {
        const isVisible = ref(false);
        const levelInfo = ref(null);

        const playLevelUpSound = () => {
            const audio = new Audio('./assets/level-up.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.warn('Could not play sound', e));
        };

        const handleLevelUp = (e) => {
            levelInfo.value = e.detail;
            isVisible.value = true;
            
            playLevelUpSound();

            if (window.confetti) {
                const duration = 2500;
                const end = Date.now() + duration;

                const frame = () => {
                    window.confetti({
                        particleCount: 5,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0 },
                        colors: ['#f59e0b', '#fbbf24', '#8b5cf6']
                    });
                    window.confetti({
                        particleCount: 5,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1 },
                        colors: ['#f59e0b', '#fbbf24', '#8b5cf6']
                    });

                    if (Date.now() < end) {
                        requestAnimationFrame(frame);
                    }
                };
                frame();
            }

            // Auto hide after 3 seconds
            setTimeout(() => {
                isVisible.value = false;
            }, 3000);
        };

        onMounted(() => {
            window.addEventListener('level-up', handleLevelUp);
        });

        onUnmounted(() => {
            window.removeEventListener('level-up', handleLevelUp);
        });

        return { isVisible, levelInfo };
    },
    template: `
        <transition
            enter-active-class="transition-all duration-500 ease-out cubic-bezier(0.34, 1.56, 0.64, 1)"
            enter-from-class="opacity-0 scale-50 translate-y-10"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition-all duration-300 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-90"
        >
            <div v-if="isVisible" class="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm pointer-events-none">
                <div class="bg-gradient-to-b from-amber-100 to-amber-50 rounded-3xl p-8 shadow-2xl text-center border-4 border-amber-300 max-w-sm w-full relative overflow-hidden">
                    <div class="absolute inset-0 bg-white/20"></div>
                    <div class="relative z-10">
                        <h2 class="text-3xl font-black text-amber-500 mb-6 drop-shadow-md tracking-wider">LEVEL UP!</h2>
                        
                        <div class="text-7xl mb-4 animate-bounce">
                            {{ levelInfo?.rank?.icon || '⭐' }}
                        </div>
                        
                        <h3 class="text-2xl font-bold text-gray-800 mb-2 uppercase tracking-wide">
                            {{ levelInfo?.rank?.title || 'Chưa rõ' }}
                        </h3>
                        
                        <div class="inline-block bg-amber-500 text-white font-bold text-xl px-6 py-2 rounded-full shadow-lg border-2 border-white">
                            Level {{ levelInfo?.level || 1 }}
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    `
};
