import { ref } from 'vue';

export const toasts = ref([]);
let toastId = 0;
export function showToast(message, type = 'info', duration = 3000) {
    const id = ++toastId;
    toasts.value.push({ id, message, type, duration });
    setTimeout(() => {
        const t = toasts.value.find(t => t.id === id);
        if (t) t.hiding = true;
        setTimeout(() => {
            toasts.value = toasts.value.filter(t => t.id !== id);
        }, 350);
    }, duration);
}
