import assert from 'node:assert';
import fs from 'node:fs';

console.log('================================================================================');
console.log('  EMPIRICAL TWO-WAY REACTIVITY & STRESS HARNESS: LEXISTORE <-> USERTOOL (M2)   ');
console.log('================================================================================\n');

// Mock DOM Environment
class ClassList {
  constructor(initial = []) {
    this.classes = new Set(initial);
  }
  add(...cls) { cls.forEach(c => this.classes.add(c)); }
  remove(...cls) { cls.forEach(c => this.classes.delete(c)); }
  contains(cls) { return this.classes.has(cls); }
  toArray() { return Array.from(this.classes); }
  clear() { this.classes.clear(); }
}

class MockElement {
  constructor(initialClasses = []) {
    this.classList = new ClassList(initialClasses);
    this.listeners = new Map();
  }
  addEventListener(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(fn);
  }
  removeEventListener(event, fn) {
    if (this.listeners.has(event)) {
      const arr = this.listeners.get(event).filter(f => f !== fn);
      this.listeners.set(event, arr);
    }
  }
  dispatchEvent(event) {
    const arr = this.listeners.get(event.type) || [];
    arr.forEach(fn => fn(event));
  }
  contains() { return false; }
}

let storage = {};
global.localStorage = {
  getItem: (k) => storage[k] !== undefined ? storage[k] : null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { storage = {}; }
};

let docElement = new MockElement();
let bodyElement = new MockElement();

global.document = {
  get documentElement() { return docElement; },
  get body() { return bodyElement; },
  getElementById: (id) => new MockElement(),
  addEventListener: () => {},
  removeEventListener: () => {}
};

global.window = {
  location: { hash: '' },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  confetti: (opt) => {}
};

// Database Mock Tracker
let dbUpdateLog = [];
async function mockUpdateUserProfile(uid, data) {
  dbUpdateLog.push({ uid, data, timestamp: Date.now() });
  return true;
}

// 1. Prepare Store Factory
const rawStoreCode = fs.readFileSync('js/store.js', 'utf8');
let storeCode = rawStoreCode.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '');
storeCode = storeCode.replace(/export\s+const\s+store\s+=/g, 'const store =');
storeCode = storeCode.replace(/export\s+[\s\S]*?;/g, '');

function createStoreInstance(customUser = null, customProfile = null) {
  const factoryScript = `
    function reactive(o) { return o; }
    const updateUserProfile = arguments[0];
    const BADGES_DICT = [];
    const EXCLUSIVE_ADMIN_BADGES = [];
    function getRankFromLevel() { return 'Tân Binh'; }
    function normalizeUserStats() {}
    function getBadgeById() {}
    function getLevelFromLifetimeLC() { return 1; }

    ${storeCode}

    if (arguments[1]) store.user = arguments[1];
    if (arguments[2]) store.userProfile = arguments[2];
    return store;
  `;
  const fn = new Function(factoryScript);
  return fn(mockUpdateUserProfile, customUser, customProfile);
}

// 2. Prepare UserTool Factory
const rawUserToolCode = fs.readFileSync('js/components/usertool.js', 'utf8');
let usertoolCode = rawUserToolCode.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '');
usertoolCode = usertoolCode.replace(/export\s+const\s+THEME_OPTIONS\s+=/g, 'const THEME_OPTIONS =');
usertoolCode = usertoolCode.replace(/export\s+default/g, 'const UserTool =');

function createUserToolComponent(storeInstance, toasts = []) {
  const factoryScript = `
    function ref(v) {
      return {
        _val: v,
        get value() { return this._val; },
        set value(n) { this._val = n; }
      };
    }
    function computed(getter) {
      return {
        get value() { return getter(); }
      };
    }
    function onMounted(fn) { fn(); }
    function onUnmounted(fn) {}
    function watch(src, fn) {}
    const store = storeInstance;
    const updateUserProfile = mockUpdateUserProfile;
    function t(k) { return k; }
    function getAvailableEnglishVoices() { return []; }
    function speakEnglishText(text, opt) {}
    function showToast(msg, type) { toasts.push({ msg, type }); }

    ${usertoolCode}

    return { UserTool, THEME_OPTIONS };
  `;
  const fn = new Function('mockUpdateUserProfile', 'storeInstance', 'toasts', factoryScript);
  return fn(mockUpdateUserProfile, storeInstance, toasts);
}

// 3. Prepare LexiStore Factory
const rawStoreItemsCode = fs.readFileSync('js/storeItems.js', 'utf8');
let storeItemsCode = rawStoreItemsCode.replace(/export\s+const\s+/g, 'const ');

const rawLexiStoreCode = fs.readFileSync('js/components/lexistore.js', 'utf8');
let lexistoreCode = rawLexiStoreCode.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '');
lexistoreCode = lexistoreCode.replace(/export\s+default/g, 'const LexiStore =');

function createLexiStoreComponent(storeInstance, toasts = []) {
  const factoryScript = `
    function ref(v) {
      return {
        _val: v,
        get value() { return this._val; },
        set value(n) { this._val = n; }
      };
    }
    function computed(getter) {
      return {
        get value() { return getter(); }
      };
    }
    const store = storeInstance;
    function showToast(msg, type) { toasts.push({ msg, type }); }

    ${storeItemsCode}
    ${lexistoreCode}

    return { LexiStore, STORE_ITEMS, STORE_CATEGORIES };
  `;
  const fn = new Function('storeInstance', 'toasts', factoryScript);
  return fn(storeInstance, toasts);
}

let totalTests = 0;
let passedTests = 0;

async function testStep(name, fn) {
  totalTests++;
  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      await res;
    }
    passedTests++;
    console.log(`  ✅ [PASS #${totalTests}] ${name}`);
  } catch (err) {
    console.error(`  ❌ [FAIL #${totalTests}] ${name}`);
    console.error(err);
    throw err;
  }
}

async function runComprehensiveSuite() {
  console.log('--- SUITE 1: Direction A (LexiStore -> UserTool Reactive Reflection) ---');

  await testStep('Initial baseline: Non-owned themes are locked in UserTool and unowned in LexiStore', () => {
    storage = {};
    docElement.classList.clear();
    bodyElement.classList.clear();

    const store = createStoreInstance(
      { uid: 'user_sync_1', email: 'student@test.com' },
      { lexiCredit: 5000, totalLexiCredit: 5000, inventory: { unlockedThemes: [] }, equippedTheme: 'default', isAdmin: false }
    );

    const toastsUserTool = [];
    const toastsLexiStore = [];

    const { UserTool } = createUserToolComponent(store, toastsUserTool);
    const { LexiStore, STORE_ITEMS } = createLexiStoreComponent(store, toastsLexiStore);

    const ut = UserTool.setup();
    const ls = LexiStore.setup();

    const matrixItem = STORE_ITEMS.find(it => it.id === 'theme_matrix');
    const synthItem = STORE_ITEMS.find(it => it.id === 'theme_synthwave');

    // UserTool checks
    assert.strictEqual(ut.isThemeActive('default'), true, 'UserTool default should be active');
    assert.strictEqual(ut.isThemeUnlocked('theme_matrix'), false, 'UserTool matrix should be locked');
    assert.strictEqual(ut.isThemeUnlocked('theme_synthwave'), false, 'UserTool synthwave should be locked');

    // LexiStore checks
    assert.strictEqual(ls.isItemOwned(matrixItem), false, 'LexiStore matrix should not be owned');
    assert.strictEqual(ls.isItemOwned(synthItem), false, 'LexiStore synthwave should not be owned');
    assert.strictEqual(ls.isItemActive(matrixItem), false, 'LexiStore matrix should not be active');
    assert.strictEqual(ls.isItemActive(synthItem), false, 'LexiStore synthwave should not be active');
  });

  await testStep('Purchase theme_matrix in LexiStore -> Instant unlock, auto-equip, and reflection in UserTool', async () => {
    storage = {};
    docElement.classList.clear();
    bodyElement.classList.clear();

    const store = createStoreInstance(
      { uid: 'user_sync_1', email: 'student@test.com' },
      { lexiCredit: 5000, totalLexiCredit: 5000, inventory: { unlockedThemes: [] }, equippedTheme: 'default', isAdmin: false }
    );

    const toastsUserTool = [];
    const toastsLexiStore = [];

    const { UserTool } = createUserToolComponent(store, toastsUserTool);
    const { LexiStore, STORE_ITEMS } = createLexiStoreComponent(store, toastsLexiStore);

    const ut = UserTool.setup();
    const ls = LexiStore.setup();

    const matrixItem = STORE_ITEMS.find(it => it.id === 'theme_matrix');

    // Purchase theme in LexiStore
    await ls.handlePurchase(matrixItem);

    // 1. LexiStore state checks
    assert.strictEqual(store.userProfile.lexiCredit, 3200, 'LC balance should be 5000 - 1800 = 3200');
    assert.strictEqual(ls.isItemOwned(matrixItem), true, 'LexiStore matrix item is now owned');
    assert.strictEqual(ls.isItemActive(matrixItem), true, 'LexiStore matrix item is now active');

    // 2. UserTool instant reflection checks
    assert.strictEqual(ut.isThemeUnlocked('theme_matrix'), true, 'UserTool matrix theme should immediately report unlocked');
    assert.strictEqual(ut.isThemeActive('theme_matrix'), true, 'UserTool matrix theme should immediately report active');
    assert.strictEqual(ut.isThemeActive('default'), false, 'UserTool default theme should no longer be active');
    assert.strictEqual(ut.isThemeUnlocked('theme_synthwave'), false, 'UserTool synthwave theme should remain locked');

    // 3. DOM and LocalStorage verification
    assert.strictEqual(docElement.classList.contains('theme-matrix'), true);
    assert.strictEqual(bodyElement.classList.contains('theme-matrix'), true);
    assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
    assert.strictEqual(storage['active_theme'], 'theme_matrix');
  });

  await testStep('Purchase second theme (theme_synthwave) in LexiStore -> Instant reflection and state transition in UserTool', async () => {
    const store = createStoreInstance(
      { uid: 'user_sync_1', email: 'student@test.com' },
      { lexiCredit: 3200, totalLexiCredit: 5000, inventory: { unlockedThemes: ['theme_matrix'] }, equippedTheme: 'theme_matrix', isAdmin: false }
    );

    const toastsUserTool = [];
    const toastsLexiStore = [];

    const { UserTool } = createUserToolComponent(store, toastsUserTool);
    const { LexiStore, STORE_ITEMS } = createLexiStoreComponent(store, toastsLexiStore);

    const ut = UserTool.setup();
    const ls = LexiStore.setup();

    const matrixItem = STORE_ITEMS.find(it => it.id === 'theme_matrix');
    const synthItem = STORE_ITEMS.find(it => it.id === 'theme_synthwave');

    // Purchase synthwave in LexiStore
    await ls.handlePurchase(synthItem);

    // 1. LexiStore state
    assert.strictEqual(store.userProfile.lexiCredit, 800, 'LC balance should be 3200 - 2400 = 800');
    assert.strictEqual(ls.isItemOwned(synthItem), true, 'Synthwave is now owned in LexiStore');
    assert.strictEqual(ls.isItemActive(synthItem), true, 'Synthwave is now active in LexiStore');
    assert.strictEqual(ls.isItemActive(matrixItem), false, 'Matrix is now inactive in LexiStore');

    // 2. UserTool instant reflection
    assert.strictEqual(ut.isThemeUnlocked('theme_matrix'), true, 'UserTool matrix still unlocked');
    assert.strictEqual(ut.isThemeUnlocked('theme_synthwave'), true, 'UserTool synthwave is now unlocked');
    assert.strictEqual(ut.isThemeActive('theme_synthwave'), true, 'UserTool synthwave is now active');
    assert.strictEqual(ut.isThemeActive('theme_matrix'), false, 'UserTool matrix is now inactive');
    assert.strictEqual(ut.isThemeActive('default'), false, 'UserTool default is inactive');

    // 3. DOM and LocalStorage
    assert.strictEqual(docElement.classList.contains('theme-synthwave'), true);
    assert.strictEqual(bodyElement.classList.contains('theme-synthwave'), true);
    assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
    assert.strictEqual(storage['active_theme'], 'theme_synthwave');
  });

  await testStep('Unequip/toggle active theme from LexiStore -> Instant reversion to default in UserTool and DOM', async () => {
    const store = createStoreInstance(
      { uid: 'user_sync_1', email: 'student@test.com' },
      { lexiCredit: 800, totalLexiCredit: 5000, inventory: { unlockedThemes: ['theme_matrix', 'theme_synthwave'] }, equippedTheme: 'theme_synthwave', isAdmin: false }
    );

    const toastsUserTool = [];
    const toastsLexiStore = [];

    const { UserTool } = createUserToolComponent(store, toastsUserTool);
    const { LexiStore, STORE_ITEMS } = createLexiStoreComponent(store, toastsLexiStore);

    const ut = UserTool.setup();
    const ls = LexiStore.setup();

    const synthItem = STORE_ITEMS.find(it => it.id === 'theme_synthwave');

    // Toggle equip in LexiStore
    await ls.handleToggleEquip(synthItem);

    // Should revert to default
    assert.strictEqual(store.userProfile.equippedTheme, 'default');
    assert.strictEqual(ls.isItemActive(synthItem), false, 'LexiStore synthwave inactive');
    assert.strictEqual(ut.isThemeActive('default'), true, 'UserTool default active');
    assert.strictEqual(ut.isThemeActive('theme_synthwave'), false, 'UserTool synthwave inactive');
    assert.strictEqual(ut.isThemeActive('theme_matrix'), false, 'UserTool matrix inactive');
    assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
    assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
    assert.strictEqual(storage['active_theme'], 'default');
  });

  console.log('\n--- SUITE 2: Direction B (UserTool -> LexiStore Reactive Reflection) ---');

  await testStep('Equip theme_matrix from UserTool -> Instant reflection in LexiStore active state and inventory drawer', async () => {
    const store = createStoreInstance(
      { uid: 'user_sync_2', email: 'student@test.com' },
      { lexiCredit: 2000, totalLexiCredit: 5000, inventory: { unlockedThemes: ['theme_matrix', 'theme_synthwave'] }, equippedTheme: 'default', isAdmin: false }
    );

    const toastsUserTool = [];
    const toastsLexiStore = [];

    const { UserTool } = createUserToolComponent(store, toastsUserTool);
    const { LexiStore, STORE_ITEMS } = createLexiStoreComponent(store, toastsLexiStore);

    const ut = UserTool.setup();
    const ls = LexiStore.setup();

    const matrixItem = STORE_ITEMS.find(it => it.id === 'theme_matrix');
    const synthItem = STORE_ITEMS.find(it => it.id === 'theme_synthwave');

    // Equip matrix in UserTool
    await ut.handleEquipTheme('theme_matrix');

    // 1. UserTool reflection
    assert.strictEqual(ut.isThemeActive('theme_matrix'), true);
    assert.strictEqual(ut.isThemeActive('default'), false);

    // 2. LexiStore instant reflection
    assert.strictEqual(ls.isItemActive(matrixItem), true, 'LexiStore matrix item must reflect active');
    assert.strictEqual(ls.isItemActive(synthItem), false, 'LexiStore synthwave item must reflect inactive');
    assert.strictEqual(store.userProfile.equippedTheme, 'theme_matrix');

    // 3. DOM reflection
    assert.strictEqual(docElement.classList.contains('theme-matrix'), true);
    assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
  });

  await testStep('Equip theme_synthwave from UserTool -> LexiStore switches active badge immediately', async () => {
    const store = createStoreInstance(
      { uid: 'user_sync_2', email: 'student@test.com' },
      { lexiCredit: 2000, totalLexiCredit: 5000, inventory: { unlockedThemes: ['theme_matrix', 'theme_synthwave'] }, equippedTheme: 'theme_matrix', isAdmin: false }
    );

    const toastsUserTool = [];
    const toastsLexiStore = [];

    const { UserTool } = createUserToolComponent(store, toastsUserTool);
    const { LexiStore, STORE_ITEMS } = createLexiStoreComponent(store, toastsLexiStore);

    const ut = UserTool.setup();
    const ls = LexiStore.setup();

    const matrixItem = STORE_ITEMS.find(it => it.id === 'theme_matrix');
    const synthItem = STORE_ITEMS.find(it => it.id === 'theme_synthwave');

    // Equip synthwave in UserTool
    await ut.handleEquipTheme('theme_synthwave');

    // 1. UserTool
    assert.strictEqual(ut.isThemeActive('theme_synthwave'), true);
    assert.strictEqual(ut.isThemeActive('theme_matrix'), false);

    // 2. LexiStore
    assert.strictEqual(ls.isItemActive(synthItem), true, 'Synthwave active in LexiStore');
    assert.strictEqual(ls.isItemActive(matrixItem), false, 'Matrix inactive in LexiStore');

    // 3. DOM
    assert.strictEqual(docElement.classList.contains('theme-synthwave'), true);
    assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
  });

  await testStep('Equip default from UserTool -> LexiStore clears active status across all theme cards', async () => {
    const store = createStoreInstance(
      { uid: 'user_sync_2', email: 'student@test.com' },
      { lexiCredit: 2000, totalLexiCredit: 5000, inventory: { unlockedThemes: ['theme_matrix', 'theme_synthwave'] }, equippedTheme: 'theme_synthwave', isAdmin: false }
    );

    const toastsUserTool = [];
    const toastsLexiStore = [];

    const { UserTool } = createUserToolComponent(store, toastsUserTool);
    const { LexiStore, STORE_ITEMS } = createLexiStoreComponent(store, toastsLexiStore);

    const ut = UserTool.setup();
    const ls = LexiStore.setup();

    const matrixItem = STORE_ITEMS.find(it => it.id === 'theme_matrix');
    const synthItem = STORE_ITEMS.find(it => it.id === 'theme_synthwave');

    // Equip default in UserTool
    await ut.handleEquipTheme('default');

    assert.strictEqual(ut.isThemeActive('default'), true);
    assert.strictEqual(ls.isItemActive(matrixItem), false);
    assert.strictEqual(ls.isItemActive(synthItem), false);
    assert.strictEqual(store.userProfile.equippedTheme, 'default');
    assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
    assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
  });

  console.log('\n--- SUITE 3: Adversarial Guardrails, Role Bypasses & Edge Cases ---');

  await testStep('Adversarial Equip without ownership in UserTool is rejected and does not mutate LexiStore or DOM', async () => {
    const store = createStoreInstance(
      { uid: 'unauthorized_user', email: 'student@test.com' },
      { lexiCredit: 100, totalLexiCredit: 100, inventory: { unlockedThemes: [] }, equippedTheme: 'default', isAdmin: false }
    );

    const toastsUserTool = [];
    const toastsLexiStore = [];

    const { UserTool } = createUserToolComponent(store, toastsUserTool);
    const { LexiStore, STORE_ITEMS } = createLexiStoreComponent(store, toastsLexiStore);

    const ut = UserTool.setup();
    const ls = LexiStore.setup();

    const matrixItem = STORE_ITEMS.find(it => it.id === 'theme_matrix');

    // Attempt unauthorized equip
    await ut.handleEquipTheme('theme_matrix');

    // Verify error toast
    assert.ok(toastsUserTool.some(t => t.type === 'error' && t.msg.includes('chưa sở hữu')));
    assert.strictEqual(store.userProfile.equippedTheme, 'default');
    assert.strictEqual(ut.isThemeActive('theme_matrix'), false);
    assert.strictEqual(ls.isItemActive(matrixItem), false);
    assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
  });

  await testStep('Insufficient balance purchase in LexiStore does not unlock theme or mutate UserTool', async () => {
    const store = createStoreInstance(
      { uid: 'poor_user', email: 'student@test.com' },
      { lexiCredit: 500, totalLexiCredit: 500, inventory: { unlockedThemes: [] }, equippedTheme: 'default', isAdmin: false }
    );

    const toastsUserTool = [];
    const toastsLexiStore = [];

    const { UserTool } = createUserToolComponent(store, toastsUserTool);
    const { LexiStore, STORE_ITEMS } = createLexiStoreComponent(store, toastsLexiStore);

    const ut = UserTool.setup();
    const ls = LexiStore.setup();

    const matrixItem = STORE_ITEMS.find(it => it.id === 'theme_matrix');

    // Attempt purchase with 500 LC for 1800 LC item
    await ls.handlePurchase(matrixItem);

    assert.ok(toastsLexiStore.some(t => t.type === 'error' && t.msg.includes('còn thiếu')));
    assert.strictEqual(store.userProfile.lexiCredit, 500);
    assert.strictEqual(ls.isItemOwned(matrixItem), false);
    assert.strictEqual(ut.isThemeUnlocked('theme_matrix'), false);
    assert.strictEqual(ut.isThemeActive('theme_matrix'), false);
    assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
  });

  await testStep('Admin Bypass: Admin can equip any theme from UserTool and LexiStore synchronizes immediately', async () => {
    const store = createStoreInstance(
      { uid: 'admin_user', email: 'test@test.com' },
      { lexiCredit: 0, totalLexiCredit: 0, inventory: { unlockedThemes: [] }, equippedTheme: 'default', isAdmin: true, role: 'admin' }
    );

    const toastsUserTool = [];
    const toastsLexiStore = [];

    const { UserTool } = createUserToolComponent(store, toastsUserTool);
    const { LexiStore, STORE_ITEMS } = createLexiStoreComponent(store, toastsLexiStore);

    const ut = UserTool.setup();
    const ls = LexiStore.setup();

    const synthItem = STORE_ITEMS.find(it => it.id === 'theme_synthwave');

    // Admin should see theme as unlocked in UserTool
    assert.strictEqual(ut.isThemeUnlocked('theme_synthwave'), true, 'Admin has unlocked state');

    // Admin equips theme in UserTool
    await ut.handleEquipTheme('theme_synthwave');

    assert.strictEqual(store.userProfile.equippedTheme, 'theme_synthwave');
    assert.strictEqual(ut.isThemeActive('theme_synthwave'), true);
    assert.strictEqual(ls.isItemActive(synthItem), true, 'LexiStore reflects active for admin');
    assert.strictEqual(docElement.classList.contains('theme-synthwave'), true);
  });

  console.log('\n--- SUITE 4: High-Frequency Interleaved Stress Test (1,000 Cycles) ---');

  await testStep('1,000 Interleaved operations across LexiStore and UserTool preserve invariants', async () => {
    storage = {};
    docElement.classList.clear();
    bodyElement.classList.clear();

    const store = createStoreInstance(
      { uid: 'stress_user', email: 'student@test.com' },
      { lexiCredit: 100000, totalLexiCredit: 100000, inventory: { unlockedThemes: ['theme_matrix', 'theme_synthwave'] }, equippedTheme: 'default', isAdmin: false }
    );

    const toastsUserTool = [];
    const toastsLexiStore = [];

    const { UserTool } = createUserToolComponent(store, toastsUserTool);
    const { LexiStore, STORE_ITEMS } = createLexiStoreComponent(store, toastsLexiStore);

    const ut = UserTool.setup();
    const ls = LexiStore.setup();

    const matrixItem = STORE_ITEMS.find(it => it.id === 'theme_matrix');
    const synthItem = STORE_ITEMS.find(it => it.id === 'theme_synthwave');

    const themes = ['default', 'theme_matrix', 'theme_synthwave'];
    const items = [matrixItem, synthItem];

    const cycles = 1000;
    const startTime = Date.now();

    for (let i = 0; i < cycles; i++) {
      const op = i % 4;
      if (op === 0) {
        // UserTool equip
        const target = themes[i % themes.length];
        await ut.handleEquipTheme(target);
      } else if (op === 1) {
        // LexiStore toggle equip
        const item = items[i % items.length];
        await ls.handleToggleEquip(item);
      } else if (op === 2) {
        // UserTool direct default
        await ut.handleEquipTheme('default');
      } else {
        // Direct store equip
        const target = themes[(i + 1) % themes.length];
        await store.equipTheme(target);
      }

      // Continuous invariant check
      const current = store.userProfile.equippedTheme;
      const isMatUT = ut.isThemeActive('theme_matrix');
      const isSynUT = ut.isThemeActive('theme_synthwave');
      const isDefUT = ut.isThemeActive('default');

      const isMatLS = ls.isItemActive(matrixItem);
      const isSynLS = ls.isItemActive(synthItem);

      const dMat = docElement.classList.contains('theme-matrix');
      const dSyn = docElement.classList.contains('theme-synthwave');
      const bMat = bodyElement.classList.contains('theme-matrix');
      const bSyn = bodyElement.classList.contains('theme-synthwave');

      // 1. Invariant: Mutual exclusivity in DOM
      if (dMat && dSyn) throw new Error(`DOM class clash at cycle ${i}`);
      if (bMat && bSyn) throw new Error(`Body class clash at cycle ${i}`);
      if (dMat !== bMat || dSyn !== bSyn) throw new Error(`DOM root-body mismatch at cycle ${i}`);

      // 2. Invariant: Two-way parity between UserTool and LexiStore
      if (isMatUT !== isMatLS) throw new Error(`Parity mismatch for theme_matrix between UserTool and LexiStore at cycle ${i}`);
      if (isSynUT !== isSynLS) throw new Error(`Parity mismatch for theme_synthwave between UserTool and LexiStore at cycle ${i}`);

      // 3. Invariant: Single active theme in UserTool
      const activeCountUT = [isMatUT, isSynUT, isDefUT].filter(Boolean).length;
      if (activeCountUT !== 1) throw new Error(`UserTool active theme count != 1 at cycle ${i} (count: ${activeCountUT})`);

      // 4. Invariant: Active state matches store.equippedTheme
      if (current === 'theme_matrix') {
        if (!isMatUT || !isMatLS || !dMat) throw new Error(`Matrix state discrepancy at cycle ${i}`);
      } else if (current === 'theme_synthwave') {
        if (!isSynUT || !isSynLS || !dSyn) throw new Error(`Synthwave state discrepancy at cycle ${i}`);
      } else {
        if (!isDefUT || isMatLS || isSynLS || dMat || dSyn) throw new Error(`Default state discrepancy at cycle ${i}`);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`    -> Completed 1,000 cross-component cycles in ${elapsed}ms (0 invariant violations)`);
  });

  console.log('\n================================================================================');
  console.log(`🎉 ALL ${passedTests} OF ${totalTests} TWO-WAY REACTIVITY STRESS TESTS PASSED SUCCESSFULLY! 🎉`);
  console.log('================================================================================\n');
}

runComprehensiveSuite().catch(err => {
  console.error('\n💥 STRESS HARNESS FAILED:', err);
  process.exit(1);
});
