const QUESTION_TYPES = ['multiple_choice', 'typing', 'flashcard'];

export function normalizeAnswer(value = '') {
    return value.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[\p{P}\p{S}]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function distance(a, b) {
    if (a === b) return 0;
    if (!a || !b) return Math.max(a.length, b.length);
    const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let diagonal = prev[0]; prev[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const saved = prev[j];
            prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
            diagonal = saved;
        }
    }
    return prev[b.length];
}

export function acceptedAnswers(card, direction) {
    const primary = direction === 'en_to_vi' ? card.definition : card.term;
    const enriched = direction === 'en_to_vi'
        ? (card.acceptedAnswers || card.commonTranslations || [])
        : (card.acceptedEnglishAnswers || [card.term, ...(card.synonyms || '').split(',')]);
    return [...new Set([primary, ...enriched].filter(Boolean).map(String))];
}

export function evaluateTyping(answer, card, direction) {
    const input = normalizeAnswer(answer);
    const accepted = acceptedAnswers(card, direction);
    const normalized = accepted.map(normalizeAnswer).filter(Boolean);
    if (!input) return { correct: false, accepted };
    if (normalized.includes(input)) return { correct: true, accepted };
    const fuzzy = normalized.some(target => {
        const threshold = target.length <= 5 ? 1 : Math.max(1, Math.floor(target.length * 0.14));
        return Math.abs(target.length - input.length) <= threshold && distance(input, target) <= threshold;
    });
    return { correct: fuzzy, accepted };
}

function shuffled(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function chooseBalanced(options, index, previous) {
    const candidates = options.length > 1 ? options.filter(x => x !== previous) : options;
    return candidates[index % candidates.length];
}

function optionsFor(card, cards, direction) {
    const correct = direction === 'en_to_vi' ? card.definition : card.term;
    let distractorCards = cards.filter(c => c.id !== card.id && (c.pos === card.pos || !card.pos));
    if (distractorCards.length < 3) {
        const others = cards.filter(c => c.id !== card.id && c.pos !== card.pos && c.pos);
        distractorCards = [...distractorCards, ...others];
    }
    const distractors = shuffled(distractorCards
        .map(c => direction === 'en_to_vi' ? c.definition : c.term)
        .filter(Boolean)).slice(0, 3);
    return shuffled([...new Set([correct, ...distractors])]).slice(0, 4);
}

export function createSession(cards, settings) {
    let pool = settings.starredOnly ? cards.filter(card => card.isStarred) : [...cards];
    if (settings.shuffle) pool = shuffled(pool);
    const types = QUESTION_TYPES.filter(type => settings.questionTypes[type]);
    const directions = ['en_to_vi', 'vi_to_en'].filter(direction => settings.directions[direction]);
    let previousType = null;
    return pool.map((card, index) => {
        const type = chooseBalanced(types, index, previousType);
        previousType = type;
        const direction = chooseBalanced(directions, index, index % 2 ? 'en_to_vi' : 'vi_to_en');
        return { id: `${card.id}-${index}`, card, type, direction, options: type === 'multiple_choice' ? optionsFor(card, pool, direction) : [] };
    });
}

export function scoreUpdate(card, result) {
    const previous = card.learnStats || {};
    const correct = result === 'easy' || result === 'correct';
    const delta = result === 'easy' ? 12 : result === 'correct' ? 8 : result === 'hard' ? 2 : -8;
    return {
        learnStats: {
            correctCount: (previous.correctCount || 0) + (correct ? 1 : 0),
            wrongCount: (previous.wrongCount || 0) + (correct ? 0 : 1),
            easyCount: (previous.easyCount || 0) + (result === 'easy' ? 1 : 0),
            hardCount: (previous.hardCount || 0) + (result === 'hard' ? 1 : 0),
            forgotCount: (previous.forgotCount || 0) + (result === 'forgot' ? 1 : 0),
            reviewCount: (previous.reviewCount || 0) + 1,
            lastReviewed: new Date(),
            masteryScore: Math.max(0, Math.min(100, (previous.masteryScore || 0) + delta))
        },
        last_reviewed_at: new Date()
    };
}
