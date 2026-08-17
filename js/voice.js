import { store } from './store.js';

export function getAvailableEnglishVoices() {
    if (!('speechSynthesis' in window)) return [];
    const all = window.speechSynthesis.getVoices().filter(v => v.lang && v.lang.startsWith('en'));
    
    // Sort and prioritize Natural, Neural, Online, Google, Apple Siri voices
    return all.sort((a, b) => {
        const aScore = getVoiceQualityScore(a);
        const bScore = getVoiceQualityScore(b);
        if (aScore !== bScore) return bScore - aScore;
        return a.name.localeCompare(b.name);
    });
}

function getVoiceQualityScore(voice) {
    let score = 0;
    const name = (voice.name || '').toLowerCase();
    if (name.includes('natural') || name.includes('neural')) score += 50;
    if (name.includes('online')) score += 30;
    if (name.includes('google')) score += 25;
    if (name.includes('siri') || name.includes('enhanced')) score += 25;
    if (voice.lang === 'en-US' || voice.lang === 'en-GB') score += 10;
    return score;
}

export function getBestEnglishVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = getAvailableEnglishVoices();
    if (voices.length === 0) return null;

    if (store.settings?.voiceUri) {
        const saved = voices.find(v => v.voiceURI === store.settings.voiceUri);
        if (saved) return saved;
    }

    return voices[0];
}

export function speakEnglishText(text, options = {}) {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = options.rate || 0.95;
    utterance.pitch = options.pitch || 1.0;

    const voice = getBestEnglishVoice();
    if (voice) {
        utterance.voice = voice;
        if (voice.lang) utterance.lang = voice.lang;
    }

    if (options.onend) utterance.onend = options.onend;
    if (options.onerror) utterance.onerror = options.onerror;

    window.speechSynthesis.speak(utterance);
}
