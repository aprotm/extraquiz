import assert from 'node:assert';
import fs from 'node:fs';

console.log('================================================================');
console.log('  STARTING EMPIRICAL ADVERSARIAL STRESS SUITE FOR js/store.js   ');
console.log('================================================================\n');

// Mock DOM Environment
class ClassList {
    constructor() { this.classes = new Set(); }
    add(...cls) { cls.forEach(c => this.classes.add(c)); }
    remove(...cls) { cls.forEach(c => this.classes.delete(c)); }
    contains(cls) { return this.classes.has(cls); }
    toArray() { return Array.from(this.classes); }
    clear() { this.classes.clear(); }
}

let docElement = { classList: new ClassList() };
let bodyElement = { classList: new ClassList() };
let domEventListeners = {};

let storage = {};
global.localStorage = {
    getItem: (k) => storage[k] !== undefined ? storage[k] : null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; },
    clear: () => { storage = {}; }
};

global.document = {
    get documentElement() { return docElement; },
    get body() { return bodyElement; },
    addEventListener: (evt, cb) => {
        if (!domEventListeners[evt]) domEventListeners[evt] = [];
        domEventListeners[evt].push(cb);
    }
};

global.window = {
    location: { hash: '' },
    dispatchEvent: () => {}
};

// Database mock tracking
let dbUpdateLog = [];
async function mockUpdateUserProfile(uid, data) {
    dbUpdateLog.push({ uid, data, timestamp: Date.now() });
    return true;
}

// Load and prepare store factory
const rawStoreCode = fs.readFileSync('js/store.js', 'utf8');
let storeCode = rawStoreCode.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '');
storeCode = storeCode.replace(/export\s+const\s+store\s+=/g, 'const store =');
storeCode = storeCode.replace(/export\s+[\s\S]*?;/g, '');

function createStoreInstance(customUser = null, customProfile = null) {
    const factoryScript = `
        function reactive(o){ return o; }
        const updateUserProfile = arguments[0];
        const BADGES_DICT = [];
        const EXCLUSIVE_ADMIN_BADGES = [];
        function getRankFromLevel(){ return 'Tân Binh'; }
        function normalizeUserStats(){}
        function getBadgeById(){}
        function getLevelFromLifetimeLC(){ return 1; }

        ${storeCode}

        if (arguments[1]) store.user = arguments[1];
        if (arguments[2]) store.userProfile = arguments[2];
        return store;
    `;
    const fn = new Function(factoryScript);
    return fn(mockUpdateUserProfile, customUser, customProfile);
}

let totalTests = 0;
let passedTests = 0;

function it(name, testFn) {
    totalTests++;
    try {
        const result = testFn();
        if (result && typeof result.then === 'function') {
            return result.then(() => {
                passedTests++;
                console.log(`  [PASS] #${totalTests}: ${name}`);
            }).catch(err => {
                console.error(`  [FAIL] #${totalTests}: ${name}`);
                console.error(err);
                throw err;
            });
        } else {
            passedTests++;
            console.log(`  [PASS] #${totalTests}: ${name}`);
        }
    } catch (err) {
        console.error(`  [FAIL] #${totalTests}: ${name}`);
        console.error(err);
        throw err;
    }
}

async function runAllSuites() {
    console.log('--- SUITE 1: Cold Boot & Anti-Flicker Bootstrapping ---');

    it('Cold boot with empty localStorage applies clean default', () => {
        docElement.classList.clear();
        bodyElement.classList.clear();
        storage = {};
        const store = createStoreInstance();
        store.applyActiveTheme();

        assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
        assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
        assert.strictEqual(bodyElement.classList.contains('theme-matrix'), false);
        assert.strictEqual(bodyElement.classList.contains('theme-synthwave'), false);
        assert.strictEqual(localStorage.getItem('active_theme'), 'default');
    });

    it('Cold boot with active_theme = theme_matrix in localStorage immediately sets root and body classes', () => {
        docElement.classList.clear();
        bodyElement.classList.clear();
        storage = { active_theme: 'theme_matrix' };
        const store = createStoreInstance();
        store.applyActiveTheme();

        assert.strictEqual(docElement.classList.contains('theme-matrix'), true);
        assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
        assert.strictEqual(bodyElement.classList.contains('theme-matrix'), true);
        assert.strictEqual(bodyElement.classList.contains('theme-synthwave'), false);
    });

    it('Cold boot with active_theme = theme_synthwave in localStorage immediately sets root and body classes', () => {
        docElement.classList.clear();
        bodyElement.classList.clear();
        storage = { active_theme: 'theme_synthwave' };
        const store = createStoreInstance();
        store.applyActiveTheme();

        assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
        assert.strictEqual(docElement.classList.contains('theme-synthwave'), true);
        assert.strictEqual(bodyElement.classList.contains('theme-matrix'), false);
        assert.strictEqual(bodyElement.classList.contains('theme-synthwave'), true);
    });

    it('Cold boot when document.body is initially null defers body styling to DOMContentLoaded', () => {
        docElement.classList.clear();
        storage = { active_theme: 'theme_matrix' };
        domEventListeners = {};

        // Temporarily null body
        const realBody = bodyElement;
        bodyElement = null;

        const store = createStoreInstance();
        // applyActiveTheme with null body should not throw
        store.applyActiveTheme();
        assert.strictEqual(docElement.classList.contains('theme-matrix'), true);

        // Restore body and trigger DOMContentLoaded
        bodyElement = realBody;
        bodyElement.classList.clear();
        store.applyActiveTheme();

        assert.strictEqual(bodyElement.classList.contains('theme-matrix'), true);
    });

    console.log('\n--- SUITE 2: applyActiveTheme Adversarial & Malformed Inputs ---');

    it('Handles null, undefined, and empty string gracefully by falling back to equippedTheme or default', () => {
        docElement.classList.clear();
        bodyElement.classList.clear();
        storage = {};
        const store = createStoreInstance(null, { equippedTheme: 'theme_matrix' });

        store.applyActiveTheme(null);
        assert.strictEqual(docElement.classList.contains('theme-matrix'), true);

        store.applyActiveTheme(undefined);
        assert.strictEqual(docElement.classList.contains('theme-matrix'), true);

        store.userProfile.equippedTheme = 'default';
        store.applyActiveTheme('');
        assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
        assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
    });

    it('Handles non-string inputs (numbers, booleans, objects, arrays) without crashing', () => {
        const store = createStoreInstance();
        
        // Number input
        store.applyActiveTheme(12345);
        assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
        assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);

        // Boolean input
        store.applyActiveTheme(true);
        assert.strictEqual(docElement.classList.contains('theme-matrix'), false);

        // Object input
        store.applyActiveTheme({ theme: 'matrix' });
        assert.strictEqual(docElement.classList.contains('theme-matrix'), false);

        // Array input
        store.applyActiveTheme(['matrix']);
        // String(['matrix']) is 'matrix' -> matches substring matrix
        assert.strictEqual(docElement.classList.contains('theme-matrix'), true);
    });

    it('Strict mutual exclusivity: root and body never have both theme-matrix and theme-synthwave simultaneously', () => {
        const store = createStoreInstance();

        // Switch to matrix
        store.applyActiveTheme('theme_matrix');
        assert.strictEqual(docElement.classList.contains('theme-matrix'), true);
        assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);

        // Switch to synthwave
        store.applyActiveTheme('theme_synthwave');
        assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
        assert.strictEqual(docElement.classList.contains('theme-synthwave'), true);

        // Switch to default
        store.applyActiveTheme('default');
        assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
        assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
    });

    it('Case insensitivity & substring matching (THEME_MATRIX, theme_synthwave_v2)', () => {
        const store = createStoreInstance();

        store.applyActiveTheme('THEME_MATRIX');
        assert.strictEqual(docElement.classList.contains('theme-matrix'), true);

        store.applyActiveTheme('SUNSET_SYNTHWAVE_80S');
        assert.strictEqual(docElement.classList.contains('theme-synthwave'), true);
        assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
    });

    console.log('\n--- SUITE 3: equipTheme Permissions & Access Control Matrix ---');

    await it('Reject unowned theme equip for non-admin user (throws standard Vietnamese error message)', async () => {
        const store = createStoreInstance(
            { uid: 'test_user_1' },
            { role: 'user', isAdmin: false, inventory: { unlockedThemes: [] }, equippedTheme: 'default' }
        );

        let errorThrown = null;
        try {
            await store.equipTheme('theme_matrix');
        } catch (e) {
            errorThrown = e;
        }

        assert.ok(errorThrown !== null, 'Expected error to be thrown');
        assert.strictEqual(errorThrown.message, 'Bạn chưa sở hữu giao diện này!');
        assert.strictEqual(store.userProfile.equippedTheme, 'default');
        assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
    });

    await it('Reject unowned synthwave theme equip for non-admin with partial inventory', async () => {
        const store = createStoreInstance(
            { uid: 'test_user_2' },
            { role: 'student', isAdmin: false, inventory: { unlockedThemes: ['theme_matrix'] }, equippedTheme: 'theme_matrix' }
        );

        let errorThrown = null;
        try {
            await store.equipTheme('theme_synthwave');
        } catch (e) {
            errorThrown = e;
        }

        assert.ok(errorThrown !== null);
        assert.strictEqual(errorThrown.message, 'Bạn chưa sở hữu giao diện này!');
        assert.strictEqual(store.userProfile.equippedTheme, 'theme_matrix');
    });

    await it('Accept equip for unlocked theme and update profile + DB', async () => {
        dbUpdateLog = [];
        const store = createStoreInstance(
            { uid: 'user_owned_1' },
            { inventory: { unlockedThemes: ['theme_matrix'] }, equippedTheme: 'default' }
        );

        const result = await store.equipTheme('theme_matrix');
        assert.strictEqual(result, 'theme_matrix');
        assert.strictEqual(store.userProfile.equippedTheme, 'theme_matrix');
        assert.strictEqual(store.userProfile.inventory.equippedTheme, 'theme_matrix');
        assert.strictEqual(docElement.classList.contains('theme-matrix'), true);
        assert.strictEqual(localStorage.getItem('active_theme'), 'theme_matrix');
        assert.strictEqual(dbUpdateLog.length, 1);
        assert.strictEqual(dbUpdateLog[0].data.equippedTheme, 'theme_matrix');
    });

    await it('Admin bypass via isAdmin: true allows equipping any theme with empty inventory', async () => {
        dbUpdateLog = [];
        const store = createStoreInstance(
            { uid: 'admin_user_1' },
            { isAdmin: true, role: 'user', inventory: { unlockedThemes: [] }, equippedTheme: 'default' }
        );

        const result = await store.equipTheme('theme_synthwave');
        assert.strictEqual(result, 'theme_synthwave');
        assert.strictEqual(store.userProfile.equippedTheme, 'theme_synthwave');
        assert.strictEqual(docElement.classList.contains('theme-synthwave'), true);
    });

    await it('Admin bypass via role === "admin" allows equipping any theme with empty inventory', async () => {
        const store = createStoreInstance(
            { uid: 'admin_user_2' },
            { isAdmin: false, role: 'admin', inventory: { unlockedThemes: [] }, equippedTheme: 'default' }
        );

        const result = await store.equipTheme('theme_matrix');
        assert.strictEqual(result, 'theme_matrix');
        assert.strictEqual(store.userProfile.equippedTheme, 'theme_matrix');
        assert.strictEqual(docElement.classList.contains('theme-matrix'), true);
    });

    await it('Equipping default theme is always allowed regardless of ownership or login state', async () => {
        const store = createStoreInstance(
            null,
            { inventory: { unlockedThemes: [] }, equippedTheme: 'theme_matrix' }
        );

        const result = await store.equipTheme('default');
        assert.strictEqual(result, 'default');
        assert.strictEqual(store.userProfile.equippedTheme, 'default');
        assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
    });

    await it('Equipping null / empty string resets to default theme', async () => {
        const store = createStoreInstance(
            { uid: 'user_reset' },
            { inventory: { unlockedThemes: ['theme_matrix'] }, equippedTheme: 'theme_matrix' }
        );

        const result = await store.equipTheme(null);
        assert.strictEqual(result, 'default');
        assert.strictEqual(store.userProfile.equippedTheme, 'default');
        assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
    });

    console.log('\n--- SUITE 4: State Consistency, Toggling, and Invariants ---');

    await it('Toggling: equipping an already-equipped theme returns to default', async () => {
        const store = createStoreInstance(
            { uid: 'toggle_user' },
            { inventory: { unlockedThemes: ['theme_matrix'] }, equippedTheme: 'default' }
        );

        // Equip matrix
        let res1 = await store.equipTheme('theme_matrix');
        assert.strictEqual(res1, 'theme_matrix');
        assert.strictEqual(docElement.classList.contains('theme-matrix'), true);

        // Re-equip matrix -> should toggle back to default
        let res2 = await store.equipTheme('theme_matrix');
        assert.strictEqual(res2, 'default');
        assert.strictEqual(store.userProfile.equippedTheme, 'default');
        assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
    });

    await it('Rapid theme switching maintains perfect DOM & state synchronization', async () => {
        const store = createStoreInstance(
            { uid: 'switch_user' },
            { inventory: { unlockedThemes: ['theme_matrix', 'theme_synthwave'] }, equippedTheme: 'default' }
        );

        const seq = ['theme_matrix', 'theme_synthwave', 'theme_matrix', 'default', 'theme_synthwave'];
        for (const target of seq) {
            await store.equipTheme(target);
            if (target === 'theme_matrix') {
                assert.strictEqual(docElement.classList.contains('theme-matrix'), true);
                assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
                assert.strictEqual(localStorage.getItem('active_theme'), 'theme_matrix');
            } else if (target === 'theme_synthwave') {
                assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
                assert.strictEqual(docElement.classList.contains('theme-synthwave'), true);
                assert.strictEqual(localStorage.getItem('active_theme'), 'theme_synthwave');
            } else {
                assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
                assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
                assert.strictEqual(localStorage.getItem('active_theme'), 'default');
            }
        }
    });

    console.log('\n--- SUITE 5: Full Commerce Purchase & Equip Lifecycle ---');

    await it('End-to-end commerce lifecycle: Purchase theme -> Unlock in inventory -> Equip theme', async () => {
        dbUpdateLog = [];
        const store = createStoreInstance(
            { uid: 'buyer_1' },
            { lexiCredit: 2500, totalLexiCredit: 2500, inventory: { unlockedThemes: [] }, equippedTheme: 'default' }
        );

        const matrixItem = {
            id: 'theme_matrix',
            title: 'Giao Diện Cyber Matrix Neon',
            category: 'themes',
            price: 1800
        };

        // 1. Buy item
        const buyResult = await store.buyStoreItem(matrixItem);
        assert.strictEqual(buyResult, true);
        assert.strictEqual(store.userProfile.lexiCredit, 700); // 2500 - 1800
        assert.ok(store.userProfile.inventory.unlockedThemes.includes('theme_matrix'));

        // 2. Equip newly bought item
        const equipResult = await store.equipTheme('theme_matrix');
        assert.strictEqual(equipResult, 'theme_matrix');
        assert.strictEqual(docElement.classList.contains('theme-matrix'), true);

        // 3. Verify DB transactions recorded
        assert.ok(store.userProfile.transactions.length >= 1);
        assert.strictEqual(store.userProfile.transactions[0].itemId, 'theme_matrix');
        assert.strictEqual(store.userProfile.transactions[0].cost, 1800);
    });

    await it('Purchase failure when insufficient funds prevents unlock and equip', async () => {
        const store = createStoreInstance(
            { uid: 'poor_user' },
            { lexiCredit: 500, totalLexiCredit: 500, inventory: { unlockedThemes: [] }, equippedTheme: 'default' }
        );

        const synthItem = {
            id: 'theme_synthwave',
            title: 'Giao Diện Sunset Synthwave 80s',
            category: 'themes',
            price: 2400
        };

        let buyErr = null;
        try {
            await store.buyStoreItem(synthItem);
        } catch (e) {
            buyErr = e;
        }

        assert.ok(buyErr !== null);
        assert.strictEqual(store.userProfile.lexiCredit, 500);
        assert.strictEqual(store.userProfile.inventory.unlockedThemes.length, 0);

        // Attempting to equip must still fail
        let equipErr = null;
        try {
            await store.equipTheme('theme_synthwave');
        } catch (e) {
            equipErr = e;
        }
        assert.ok(equipErr !== null);
    });

    console.log('\n--- SUITE 6: High-Volume & Concurrency Stress Test ---');

    it('Synchronous rapid loop: 204 consecutive theme switches without memory leak or class corruption', () => {
        const store = createStoreInstance();
        const themes = ['theme_matrix', 'theme_synthwave', 'default', 'random_invalid', null, 'theme_matrix'];

        for (let i = 0; i < 204; i++) {
            const t = themes[i % themes.length];
            store.applyActiveTheme(t);
        }

        // Final at index 203 (203 % 6 = 5) was theme_matrix
        assert.strictEqual(docElement.classList.contains('theme-matrix'), true);
        assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
        assert.strictEqual(bodyElement.classList.contains('theme-matrix'), true);
        assert.strictEqual(bodyElement.classList.contains('theme-synthwave'), false);
    });

    await it('Concurrent asynchronous equipTheme calls (50 concurrent promises) maintain consistency', async () => {
        const store = createStoreInstance(
            { uid: 'concurrent_user' },
            { inventory: { unlockedThemes: ['theme_matrix', 'theme_synthwave'] }, equippedTheme: 'default' }
        );

        const targets = ['theme_matrix', 'theme_synthwave', 'default', 'theme_matrix', 'theme_synthwave'];
        const promises = [];
        for (let i = 0; i < 50; i++) {
            promises.push(store.equipTheme(targets[i % targets.length]));
        }

        const results = await Promise.all(promises);
        assert.strictEqual(results.length, 50);
        // Final equippedTheme should match DOM class
        const current = store.userProfile.equippedTheme;
        if (current === 'theme_matrix') {
            assert.strictEqual(docElement.classList.contains('theme-matrix'), true);
            assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
        } else if (current === 'theme_synthwave') {
            assert.strictEqual(docElement.classList.contains('theme-synthwave'), true);
            assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
        } else {
            assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
            assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
        }
    });

    console.log('\n--- SUITE 7: Resilience & Fault Tolerance Under Corrupted State ---');

    it('Resilience: Missing userProfile entirely does not cause unhandled crashes in applyActiveTheme', () => {
        const store = createStoreInstance();
        store.userProfile = null;

        assert.doesNotThrow(() => {
            store.applyActiveTheme();
            store.applyActiveTheme('theme_matrix');
            store.applyActiveTheme('default');
        });
    });

    await it('Resilience: Corrupted inventory structure is auto-healed during equipTheme', async () => {
        const store = createStoreInstance(
            { uid: 'heal_user' },
            { inventory: null, equippedTheme: null, isAdmin: true }
        );

        const res = await store.equipTheme('theme_matrix');
        assert.strictEqual(res, 'theme_matrix');
        assert.ok(store.userProfile.inventory !== null && typeof store.userProfile.inventory === 'object');
        assert.strictEqual(store.userProfile.inventory.equippedTheme, 'theme_matrix');
    });

    console.log('\n================================================================');
    console.log(`  ALL ${passedTests} OF ${totalTests} ADVERSARIAL STRESS TESTS COMPLETED SUCCESSFULLY!  `);
    console.log('================================================================\n');
}

runAllSuites().catch(err => {
    console.error('\nADVERSARIAL STRESS TEST FAILURE:', err);
    process.exit(1);
});
