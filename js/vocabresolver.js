import { fetchCards, fetchAllUserCards } from './db.js';

/**
 * Score card detail completeness to keep highest quality card during deduplication
 */
function getCardDetailScore(card) {
    let score = 0;
    if (card.definition) score += 5;
    if (card.example) score += 3;
    if (card.pronunciation) score += 2;
    if (card.pos) score += 2;
    if (card.synonyms) score += 2;
    if (card.collocations) score += 2;
    if (card.imageUrl) score += 3;
    return score;
}

/**
 * Deduplicate word list by term (case-insensitive & whitespace normalized)
 * keeping the highest quality card definition
 */
export function deduplicateWordList(cards = []) {
    const map = new Map();

    cards.forEach(card => {
        if (!card || !card.term) return;
        const normalizedTerm = String(card.term).trim().toLowerCase();
        if (!normalizedTerm) return;

        const currentScore = getCardDetailScore(card);
        if (!map.has(normalizedTerm)) {
            map.set(normalizedTerm, { card, score: currentScore });
        } else {
            const existing = map.get(normalizedTerm);
            if (currentScore > existing.score) {
                map.set(normalizedTerm, { card, score: currentScore });
            }
        }
    });

    return Array.from(map.values()).map(item => item.card);
}

/**
 * Resolves vocabulary based on source configuration:
 * @param {Object} params
 * @param {string} params.source - 'current' | 'all' | 'selected'
 * @param {string} [params.currentDeckId] - ID of currently active deck
 * @param {Array<string>} [params.selectedDeckIds] - IDs of selected decks
 * @param {string} params.userUid - Current logged in user ID
 * @param {Array} [params.activeCards] - Pre-loaded cards of current deck (optional)
 * @param {Array} [params.allDecks] - List of accessible user decks (optional)
 * @param {number} [params.maxSampleWords=40] - Safe cap for AI prompt context
 * @returns {Promise<{ words: Array, totalUniqueCount: number, selectedDecksCount: number, source: string }>}
 */
export async function resolveVocabulary({
    source = 'current',
    currentDeckId = null,
    selectedDeckIds = [],
    userUid = null,
    activeCards = [],
    allDecks = [],
    maxSampleWords = 40
}) {
    let rawCards = [];
    let selectedDecksCount = 0;

    // Security check: If allDecks provided, ensure requested deck IDs belong to the user
    const accessibleDeckIdSet = new Set(allDecks.map(d => d.id));

    if (source === 'current') {
        if (activeCards && activeCards.length > 0) {
            rawCards = [...activeCards];
            selectedDecksCount = 1;
        } else if (currentDeckId) {
            rawCards = await fetchCards(currentDeckId);
            selectedDecksCount = 1;
        }
    } else if (source === 'all') {
        if (userUid) {
            rawCards = await fetchAllUserCards(userUid);
            selectedDecksCount = allDecks.length || 1;
        } else if (activeCards && activeCards.length > 0) {
            rawCards = [...activeCards];
            selectedDecksCount = 1;
        }
    } else if (source === 'selected') {
        const validIds = selectedDeckIds.filter(id => {
            if (accessibleDeckIdSet.size > 0) {
                return accessibleDeckIdSet.has(id);
            }
            return true;
        });

        selectedDecksCount = validIds.length;
        if (validIds.length > 0) {
            const promises = validIds.map(deckId => fetchCards(deckId));
            const results = await Promise.all(promises);
            results.forEach(deckCards => {
                if (Array.isArray(deckCards)) {
                    rawCards.push(...deckCards);
                }
            });
        }
    }

    // Filter valid cards with non-empty term
    const validCards = rawCards.filter(c => c && typeof c.term === 'string' && c.term.trim().length > 0);

    // Deduplicate
    const uniqueCards = deduplicateWordList(validCards);
    const totalUniqueCount = uniqueCards.length;

    // Safe sampling: if list exceeds maxSampleWords, pick a balanced sample
    let finalSample = uniqueCards;
    if (uniqueCards.length > maxSampleWords) {
        // Prioritize cards with examples and collocations
        const sorted = [...uniqueCards].sort((a, b) => getCardDetailScore(b) - getCardDetailScore(a));
        finalSample = sorted.slice(0, maxSampleWords);
    }

    return {
        words: finalSample,
        totalUniqueCount,
        selectedDecksCount,
        source
    };
}
