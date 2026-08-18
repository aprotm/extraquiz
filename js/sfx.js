import { store } from './store.js';

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (store?.settings?.enableSfx === false) return false;
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return true;
}

export function playCorrect() {
    try {
        if (!initAudio()) return;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // High pitch "Ting"
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
        console.warn("Audio error:", e);
    }
}

export function playIncorrect() {
    try {
        if (!initAudio()) return;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'sawtooth';
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // Low pitch "Bzz"
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
        console.warn("Audio error:", e);
    }
}

export function playClick() {
    try {
        if (!initAudio()) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(500, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.06);
        osc.start(); osc.stop(audioCtx.currentTime + 0.06);
    } catch (_) {}
}

export function playCombo(streak = 1) {
    try {
        if (!initAudio()) return;
        const baseFreq = 440;
        const multiplier = Math.min(streak, 8);
        const notes = [
            baseFreq * Math.pow(1.12, multiplier),
            baseFreq * Math.pow(1.12, multiplier + 2),
            baseFreq * Math.pow(1.12, multiplier + 4)
        ];
        notes.forEach((freq, idx) => {
            const offset = idx * 0.06;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + offset);
            gain.gain.setValueAtTime(0, audioCtx.currentTime + offset);
            gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + offset + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + offset + 0.15);
            osc.start(audioCtx.currentTime + offset);
            osc.stop(audioCtx.currentTime + offset + 0.16);
        });
    } catch (_) {}
}

export function playBossHit() {
    try {
        if (!initAudio()) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
    } catch (_) {}
}

export function playCrit() {
    try {
        if (!initAudio()) return;
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc1.type = 'sawtooth';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(587, audioCtx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(1174, audioCtx.currentTime + 0.18);
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.18);
        osc1.connect(gain); osc2.connect(gain); gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.22);
        osc1.start(); osc2.start();
        osc1.stop(audioCtx.currentTime + 0.22);
        osc2.stop(audioCtx.currentTime + 0.22);
    } catch (_) {}
}

export function playSkillCast() {
    try {
        if (!initAudio()) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.3);
        osc.connect(gain); gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start(); osc.stop(audioCtx.currentTime + 0.35);
    } catch (_) {}
}

export function playFreeze() {
    try {
        if (!initAudio()) return;
        [1200, 1500, 1900, 2400].forEach((freq, idx) => {
            const offset = idx * 0.04;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + offset);
            osc.connect(gain); gain.connect(audioCtx.destination);
            gain.gain.setValueAtTime(0.12, audioCtx.currentTime + offset);
            gain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + offset + 0.12);
            osc.start(audioCtx.currentTime + offset);
            osc.stop(audioCtx.currentTime + offset + 0.13);
        });
    } catch (_) {}
}

export function playTick() {
    try {
        if (!initAudio()) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.connect(gain); gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
        osc.start(); osc.stop(audioCtx.currentTime + 0.03);
    } catch (_) {}
}

export function playLetterTap() {
    try {
        if (!initAudio()) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(650, audioCtx.currentTime);
        osc.connect(gain); gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);
        osc.start(); osc.stop(audioCtx.currentTime + 0.04);
    } catch (_) {}
}

export function playVictory() {
    try {
        if (!initAudio()) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const offset = idx * 0.12;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + offset);
            osc.connect(gain); gain.connect(audioCtx.destination);
            gain.gain.setValueAtTime(0.25, audioCtx.currentTime + offset);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + offset + 0.35);
            osc.start(audioCtx.currentTime + offset);
            osc.stop(audioCtx.currentTime + offset + 0.4);
        });
    } catch (_) {}
}

export function playGameOver() {
    try {
        if (!initAudio()) return;
        const notes = [440, 392, 349, 293];
        notes.forEach((freq, idx) => {
            const offset = idx * 0.15;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + offset);
            osc.connect(gain); gain.connect(audioCtx.destination);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime + offset);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + offset + 0.25);
            osc.start(audioCtx.currentTime + offset);
            osc.stop(audioCtx.currentTime + offset + 0.28);
        });
    } catch (_) {}
}

export function playComplete() {
    playVictory();
}

export function playLevelUp() {
    playVictory();
}

export function playChestOpen() {
    playCrit();
}
