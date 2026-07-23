import { ref, onMounted, onUnmounted } from 'vue';
import { store } from '../store.js';

export default {
    setup() {
        const effects = ref([]);
        let effectId = 0;

        const handleCreditAdded = (e) => {
            const { amount, isCritical } = e.detail;
            
            if (!isCritical && store.settings.showFloatingCredit === false) {
                return; // Skip UI effect and sound if disabled
            }

            const newEffect = {
                id: effectId++,
                amount,
                isCritical,
                x: Math.random() * 20 + 40, // Center-ish X
                y: Math.random() * 20 + 40  // Center-ish Y
            };

            effects.value.push(newEffect);

            // Play Sound
            if (isCritical) {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
                audio.volume = 0.6;
                audio.play().catch(()=>{});
            } else {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
                audio.volume = 0.2;
                audio.play().catch(()=>{});
            }

            setTimeout(() => {
                effects.value = effects.value.filter(eff => eff.id !== newEffect.id);
            }, 2000);
        };

        onMounted(() => {
            window.addEventListener('lexi-credit-added', handleCreditAdded);
        });

        onUnmounted(() => {
            window.removeEventListener('lexi-credit-added', handleCreditAdded);
        });

        return { effects, store };
    },
    template: `
        <div class="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            <transition-group name="fade-up">
                <div v-for="eff in effects" :key="eff.id"
                     class="absolute pointer-events-none flex items-center gap-2"
                     :class="eff.isCritical ? 'bottom-10 left-10 scale-150 animate-float-up-slow' : 'top-1/4 left-1/2 -translate-x-1/2 animate-float-up'"
                     :style="eff.isCritical ? '' : \`margin-left: \${(eff.x - 50) * 5}px; margin-top: \${(eff.y - 50) * 5}px;\`">
                    
                    <!-- Chest Icon for Critical Hit -->
                    <div v-if="eff.isCritical && store.settings.showChestAnimation !== false" class="text-4xl animate-bounce">
                        🎁
                    </div>

                    <!-- Number -->
                    <div class="font-extrabold drop-shadow-md"
                         :class="eff.isCritical ? 'text-4xl text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]' : 'text-2xl text-amber-500'">
                        +{{ eff.amount }}
                        <i class="fa-solid fa-gem text-base align-middle ml-1" :class="eff.isCritical ? 'text-xl' : ''"></i>
                    </div>
                </div>
            </transition-group>
        </div>
    `
};
