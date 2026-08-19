import { collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, serverTimestamp, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase-config.js";
import { normalizeUserStats } from "./ranks.js";

export async function uploadCardImage(file) {
    if (!storage) throw new Error("Firebase Storage is not initialized");
    const fileRef = ref(storage, `card_images/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
}

// Helper để tạo Document mẫu
export async function createSampleDeck(userId) {
    if (!db) return;
    const docRef = await addDoc(collection(db, "decks"), {
        userId: userId,
        title: "Tiếng Anh Cơ bản (Mẫu)",
        description: "Bộ thẻ mẫu để bạn làm quen với ứng dụng.",
        cardsCount: 4,
        createdAt: serverTimestamp()
    });
    
    const batch = writeBatch(db);
    const sampleWords = [
        { t: "extraordinary", d: "phi thường, đáng kinh ngạc", p: "/ɪkˈstrɔː.dɪn.ər.i/", pos: "adj", ex: "When Leopold Mozart saw how extraordinary his son was...", syn: "amazing, exceptional" },
        { t: "sibling", d: "anh chị em ruột", p: "/ˈsɪblɪŋ/", pos: "n", ex: "When Mozart was born, five of his siblings had already died.", syn: "brother, sister" },
        { t: "ubiquitous", d: "có mặt ở khắp nơi", p: "/juːˈbɪk.wɪ.təs/", pos: "adj", ex: "His music is ubiquitous.", syn: "omnipresent, everywhere" },
        { t: "revere", d: "tôn kính, sùng kính", p: "/rɪˈvɪər/", pos: "v", ex: "He is revered as a national hero.", syn: "respect, admire" }
    ];
    
    sampleWords.forEach(w => {
        const cardRef = doc(collection(db, "cards"));
        batch.set(cardRef, {
            deckId: docRef.id, 
            userId: userId,
            term: w.t, 
            definition: w.d, 
            pronunciation: w.p, 
            pos: w.pos, 
            example: w.ex,
            synonyms: w.syn || '',
            collocations: '',
            wordFamily: '',
            status: 'unlearned', 
            interval: 0, 
            repetition: 0, 
            easinessFactor: 2.5
        });
    });
    
    await batch.commit();
}

export async function fetchDecks(userId) {
    if (!db) return [];
    const q = query(collection(db, "decks"), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(d => !d.isDeleted);
}

export async function fetchCards(deckId) {
    if (!db) return [];
    const q = query(collection(db, "cards"), where("deckId", "==", deckId));
    const snapshot = await getDocs(q);
    let cards = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        if (!data.isDeleted) {
            cards.push({ id: doc.id, ...data });
        }
    });
    return cards;
}

export async function fetchAllUserCards(userId) {
    if (!db) return [];
    const q = query(collection(db, "cards"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    let cards = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        if (!data.isDeleted) {
            cards.push({ id: doc.id, ...data });
        }
    });
    return cards;
}

export async function saveNewDeck(userId, title, description, cards) {
    if (!db) return null;
    const deckRef = await addDoc(collection(db, "decks"), {
        userId: userId,
        title: title,
        description: description,
        cardsCount: cards.length,
        createdAt: serverTimestamp()
    });

    const batch = writeBatch(db);
    cards.forEach(c => {
        const cardRef = doc(collection(db, "cards"));
        batch.set(cardRef, {
            deckId: deckRef.id, 
            userId: userId,
            term: c.term, 
            definition: c.definition, 
            pronunciation: c.pronunciation || '', 
            pos: c.pos || '', 
            example: c.example || '',
            synonyms: c.synonyms || '',
            collocations: c.collocations || '',
            wordFamily: c.wordFamily || '',
            imageUrl: c.imageUrl || null,
            dna_tags: c.dna_tags || [],
            status: 'unlearned', 
            recognition_half_life: 0,
            recall_half_life: 0,
            confidence_score: 'LOW',
            last_reviewed_at: null,
            last_modality: null,
            history_length: 0,
            acceptedAnswers: [],
            learnStats: { correctCount: 0, wrongCount: 0, easyCount: 0, hardCount: 0, forgotCount: 0, reviewCount: 0, masteryScore: 0 }
        });
    });
    await batch.commit();
    return deckRef.id;
}

export async function updateExistingDeck(deckId, userId, title, description, cardsToUpdate, cardsToAdd, cardsToDelete) {
    if (!db) return;
    const batch = writeBatch(db);
    
    const deckRef = doc(db, "decks", deckId);
    const finalCount = cardsToUpdate.length + cardsToAdd.length;
    batch.update(deckRef, { title, description, cardsCount: finalCount });

    cardsToUpdate.forEach(c => {
        const cardRef = doc(db, "cards", c.id);
        batch.update(cardRef, {
            term: c.term, 
            definition: c.definition, 
            pronunciation: c.pronunciation || '', 
            pos: c.pos || '', 
            example: c.example || '',
            synonyms: c.synonyms || '',
            collocations: c.collocations || '',
            wordFamily: c.wordFamily || '',
            imageUrl: c.imageUrl || null,
            dna_tags: c.dna_tags || []
        });
    });

    cardsToAdd.forEach(c => {
        const cardRef = doc(collection(db, "cards"));
        batch.set(cardRef, {
            deckId: deckId, 
            userId: userId, 
            term: c.term, 
            definition: c.definition, 
            pronunciation: c.pronunciation || '', 
            pos: c.pos || '', 
            example: c.example || '',
            synonyms: c.synonyms || '',
            collocations: c.collocations || '',
            wordFamily: c.wordFamily || '',
            imageUrl: c.imageUrl || null,
            dna_tags: c.dna_tags || [],
            status: 'unlearned', 
            recognition_half_life: 0,
            recall_half_life: 0,
            confidence_score: 'LOW',
            last_reviewed_at: null,
            last_modality: null,
            history_length: 0,
            acceptedAnswers: [],
            learnStats: { correctCount: 0, wrongCount: 0, easyCount: 0, hardCount: 0, forgotCount: 0, reviewCount: 0, masteryScore: 0 }
        });
    });

    cardsToDelete.forEach(id => {
        batch.update(doc(db, "cards", id), { isDeleted: true });
    });

    await batch.commit();
}

export async function updateCardMemoryState(cardId, data) {
    if (!db) return;
    await updateDoc(doc(db, "cards", cardId), data);
}

export async function logReviewInteraction(cardId, userId, modality, outcome, latency_ms) {
    // No-op: Optimized to reduce redundant Firestore writes
    return;
}

export async function recordPredictionHistory(cardId, userId, retention_prob, urgency, confidence_score) {
    // No-op: Optimized to reduce redundant Firestore writes
    return;
}

export async function updateVocabularyDNA(userId, tags, outcome, latency_ms) {
    // No-op: Optimized to eliminate unused getDoc/updateDoc latency during flashcard review
    return;
}

export async function deleteDeckAndCards(deckId) {
    if (!db) return;
    const batch = writeBatch(db);
    batch.update(doc(db, "decks", deckId), { isDeleted: true });
    
    const q = query(collection(db, "cards"), where("deckId", "==", deckId));
    const snap = await getDocs(q);
    snap.docs.forEach(docSnap => {
        batch.update(docSnap.ref, { isDeleted: true });
    });
    
    await batch.commit();
}

// ===== USER PROFILE (GAMIFICATION) =====
export async function fetchUserProfile(userId) {
    if (!db) return null;
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        const rawLC = data.lexiCredit || 0;
        const rawTotal = data.totalLexiCredit || 0;
        const rawLevel = data.level || 1;
        
        normalizeUserStats(data);
        
        // Auto-heal if values in Firestore were out of sync
        if (data.totalLexiCredit !== rawTotal || data.level !== rawLevel || data.lexiCredit !== rawLC) {
            updateUserProfile(userId, {
                lexiCredit: data.lexiCredit,
                totalLexiCredit: data.totalLexiCredit,
                level: data.level,
                rank: data.rank
            }).catch(() => {});
        }
        return data;
    } else {
        // Init profile
        const defaultProfile = { 
            level: 1, badges: [], rank: 'Mầm Non Ngôn Ngữ', equippedBadge: null,
            isBanned: false, banUntil: null,
            lexiCredit: 0, totalLexiCredit: 0, dailyCreditEarned: 0, lastCreditDate: ''
        };
        await setDoc(docRef, defaultProfile);
        return defaultProfile;
    }
}

export async function updateUserProfile(userId, dataToMerge) {
    if (!db) return;
    const docRef = doc(db, "users", userId);
    await setDoc(docRef, dataToMerge, { merge: true });
}

export async function fetchAllUsers() {
    if (!db) return [];
    const snap = await getDocs(collection(db, "users"));
    return snap.docs
        .map(doc => {
            const u = { id: doc.id, ...doc.data() };
            return normalizeUserStats(u);
        })
        .filter(u => !u.isDeleted);
}

export async function updateOtherUser(uid, data) {
    if (!db) return;
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, data);
}

export async function fetchAllDecksAdmin() {
    if (!db) return [];
    const snap = await getDocs(collection(db, "decks"));
    return snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(d => !d.isDeleted);
}

export async function fetchAllCardsAdmin() {
    if (!db) return [];
    const snap = await getDocs(collection(db, "cards"));
    return snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(c => !c.isDeleted);
}

export async function adminDeleteDeck(deckId) {
    if (!db) return;
    return await deleteDeckAndCards(deckId);
}

export async function adminUpdateUserBadges(uid, badges) {
    if (!db) return;
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, { badges });
}
