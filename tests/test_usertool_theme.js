import assert from 'node:assert';
import fs from 'node:fs';

// Mock DOM Environment
class ClassList {
  constructor(initial = []) {
    this.classes = new Set(initial);
  }
  add(...cls) {
    cls.forEach(c => this.classes.add(c));
  }
  remove(...cls) {
    cls.forEach(c => this.classes.delete(c));
  }
  contains(cls) {
    return this.classes.has(cls);
  }
  toArray() {
    return Array.from(this.classes);
  }
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
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { storage = {}; }
};

let docElement = new MockElement();
let bodyElement = new MockElement();

global.document = {
  documentElement: docElement,
  body: bodyElement,
  getElementById: (id) => new MockElement(),
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.window = {
  location: { hash: '' },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {}
};

// Read store.js source code
let storeCode = fs.readFileSync('js/store.js', 'utf8');
storeCode = storeCode.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '');
storeCode = storeCode.replace(/export\s+const\s+store\s+=/g, 'const store =');
storeCode = storeCode.replace(/export\s+[\s\S]*?;/g, '');

function createStoreInstance(initialUser = null, initialProfile = null) {
  const setupCode = `
    function reactive(o){ return o; }
    async function updateUserProfile(uid, data){ return true; }
    const BADGES_DICT = [];
    const EXCLUSIVE_ADMIN_BADGES = [];
    function getRankFromLevel(){ return 'Novice'; }
    function normalizeUserStats(){}
    function getBadgeById(){}
    function getLevelFromLifetimeLC(){ return 1; }

    ${storeCode}

    if (initialUser) store.user = initialUser;
    if (initialProfile) store.userProfile = initialProfile;

    return store;
  `;
  return new Function('initialUser', 'initialProfile', setupCode)(initialUser, initialProfile);
}

// Read usertool.js source code
let usertoolCode = fs.readFileSync('js/components/usertool.js', 'utf8');

// Strip ES modules for evaluation
usertoolCode = usertoolCode.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '');
usertoolCode = usertoolCode.replace(/export\s+const\s+THEME_OPTIONS\s+=/g, 'const THEME_OPTIONS =');
usertoolCode = usertoolCode.replace(/export\s+default/g, 'const UserTool =');

function createUserToolComponent(storeInstance, toasts = []) {
  const setupCode = `
    function ref(v){ 
      return { 
        _val: v, 
        get value() { return this._val; }, 
        set value(n) { this._val = n; } 
      }; 
    }
    function computed(getter){
      return {
        get value() { return getter(); }
      };
    }
    function onMounted(fn){ fn(); }
    function onUnmounted(fn){}
    function watch(src, fn){}
    const store = storeInstance;
    async function updateUserProfile(uid, data){ return true; }
    function t(k){ return k; }
    function getAvailableEnglishVoices(){ return []; }
    function speakEnglishText(text, opt){}
    function showToast(msg, type){ toasts.push({ msg, type }); }

    ${usertoolCode}

    return { UserTool, THEME_OPTIONS };
  `;
  return new Function('storeInstance', 'toasts', setupCode)(storeInstance, toasts);
}

async function runTests() {
  console.log('======================================================');
  console.log('🧪 RUNNING USERTOOL QUICK THEME SELECTOR TEST SUITE 🧪');
  console.log('======================================================\n');

  // =========================================================================
  // TEST 1: Theme Options Structure & Catalog Invariants
  // =========================================================================
  console.log('--- TEST 1: Theme Options Definition & Catalog Availability ---');
  {
    const store = createStoreInstance();
    const { UserTool, THEME_OPTIONS } = createUserToolComponent(store);

    assert.ok(Array.isArray(THEME_OPTIONS), 'THEME_OPTIONS must be an array');
    assert.strictEqual(THEME_OPTIONS.length, 3, 'THEME_OPTIONS must contain exactly 3 themes');

    const [defTheme, matrixTheme, synthTheme] = THEME_OPTIONS;

    // Default Theme
    assert.strictEqual(defTheme.id, 'default');
    assert.ok(defTheme.name.includes('Chuẩn Gốc'));
    assert.ok(defTheme.icon.includes('fa-palette'));
    assert.strictEqual(defTheme.price, 0);
    assert.ok(defTheme.previewClass.includes('slate') || defTheme.previewClass.includes('sky'));

    // Matrix Theme
    assert.strictEqual(matrixTheme.id, 'theme_matrix');
    assert.ok(matrixTheme.name.includes('Cyber Matrix Neon'));
    assert.ok(matrixTheme.icon.includes('fa-terminal'));
    assert.strictEqual(matrixTheme.price, 1800);
    assert.ok(matrixTheme.previewClass.includes('#040810'));
    assert.ok(matrixTheme.previewClass.includes('#00FF9D'));

    // Synthwave Theme
    assert.strictEqual(synthTheme.id, 'theme_synthwave');
    assert.ok(synthTheme.name.includes('Sunset Synthwave 80s'));
    assert.ok(synthTheme.icon.includes('fa-sun'));
    assert.strictEqual(synthTheme.price, 2400);
    assert.ok(synthTheme.previewClass.includes('#0A0618'));
    assert.ok(synthTheme.previewClass.includes('#FF2A85'));

    console.log('✅ PASS: All 3 themes defined with exact ids, icons, color swatches, and LC prices.');
  }

  // =========================================================================
  // TEST 2: Dynamic Unlocking Logic (Standard, Unlocked, Admin Bypass)
  // =========================================================================
  console.log('\n--- TEST 2: Dynamic Unlocking Checks ---');
  {
    const store = createStoreInstance({ uid: 'test_user' }, {
      isAdmin: false,
      inventory: { unlockedThemes: [] },
      equippedTheme: 'default'
    });
    const { UserTool } = createUserToolComponent(store);
    const instance = UserTool.setup();

    // 2.1 Default theme always unlocked
    assert.strictEqual(instance.isThemeUnlocked('default'), true, 'Default theme must always be unlocked');

    // 2.2 Locked themes for new user
    assert.strictEqual(instance.isThemeUnlocked('theme_matrix'), false, 'Matrix should be locked');
    assert.strictEqual(instance.isThemeUnlocked('theme_synthwave'), false, 'Synthwave should be locked');

    // 2.3 User unlocks Matrix theme
    store.userProfile.inventory.unlockedThemes = ['theme_matrix'];
    assert.strictEqual(instance.isThemeUnlocked('theme_matrix'), true, 'Matrix should now be unlocked');
    assert.strictEqual(instance.isThemeUnlocked('theme_synthwave'), false, 'Synthwave should still be locked');

    // 2.4 Admin bypass
    store.userProfile.isAdmin = true;
    assert.strictEqual(instance.isThemeUnlocked('theme_matrix'), true, 'Admin has matrix unlocked');
    assert.strictEqual(instance.isThemeUnlocked('theme_synthwave'), true, 'Admin has synthwave unlocked even if not in inventory');

    // 2.5 Admin bypass via role
    store.userProfile.isAdmin = false;
    store.userProfile.role = 'admin';
    assert.strictEqual(instance.isThemeUnlocked('theme_synthwave'), true, 'Role admin has synthwave unlocked');

    // 2.6 Admin bypass via email
    store.userProfile.role = 'user';
    store.user = { email: 'test@test.com' };
    assert.strictEqual(instance.isThemeUnlocked('theme_synthwave'), true, 'Email test@test.com has synthwave unlocked');

    console.log('✅ PASS: Dynamic theme unlocking behaves correctly across all user roles and inventory states.');
  }

  // =========================================================================
  // TEST 3: Reactive Active Theme State Tracking
  // =========================================================================
  console.log('\n--- TEST 3: Reactive Active Theme State Tracking ---');
  {
    storage = {};
    const store = createStoreInstance({ uid: 'test_user' }, {
      inventory: { unlockedThemes: ['theme_matrix', 'theme_synthwave'] },
      equippedTheme: 'default'
    });
    const { UserTool } = createUserToolComponent(store);
    const instance = UserTool.setup();

    // Initial state: default is active
    assert.strictEqual(instance.isThemeActive('default'), true);
    assert.strictEqual(instance.isThemeActive('theme_matrix'), false);
    assert.strictEqual(instance.isThemeActive('theme_synthwave'), false);

    // Switch state to theme_matrix
    store.userProfile.equippedTheme = 'theme_matrix';
    assert.strictEqual(instance.isThemeActive('default'), false);
    assert.strictEqual(instance.isThemeActive('theme_matrix'), true);
    assert.strictEqual(instance.isThemeActive('theme_synthwave'), false);

    // Switch state to theme_synthwave
    store.userProfile.equippedTheme = 'theme_synthwave';
    assert.strictEqual(instance.isThemeActive('default'), false);
    assert.strictEqual(instance.isThemeActive('theme_matrix'), false);
    assert.strictEqual(instance.isThemeActive('theme_synthwave'), true);

    console.log('✅ PASS: isThemeActive accurately and reactively tracks active theme.');
  }

  // =========================================================================
  // TEST 4: Equip Theme Execution & Toast Notification
  // =========================================================================
  console.log('\n--- TEST 4: Instant Equip Theme Execution & Notifications ---');
  {
    storage = {};
    docElement = new MockElement();
    bodyElement = new MockElement();
    global.document.documentElement = docElement;
    global.document.body = bodyElement;

    const toasts = [];
    const store = createStoreInstance({ uid: 'test_user' }, {
      inventory: { unlockedThemes: ['theme_matrix', 'theme_synthwave'] },
      equippedTheme: 'default'
    });
    const { UserTool } = createUserToolComponent(store, toasts);
    const instance = UserTool.setup();

    // Equip Matrix theme
    await instance.handleEquipTheme('theme_matrix');
    assert.strictEqual(store.userProfile.equippedTheme, 'theme_matrix');
    assert.strictEqual(docElement.classList.contains('theme-matrix'), true);
    assert.strictEqual(bodyElement.classList.contains('theme-matrix'), true);
    assert.strictEqual(toasts.length, 1);
    assert.ok(toasts[0].msg.includes('Cyber Matrix Neon'));

    // Equip Synthwave theme
    await instance.handleEquipTheme('theme_synthwave');
    assert.strictEqual(store.userProfile.equippedTheme, 'theme_synthwave');
    assert.strictEqual(docElement.classList.contains('theme-synthwave'), true);
    assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
    assert.strictEqual(toasts.length, 2);
    assert.ok(toasts[1].msg.includes('Sunset Synthwave 80s'));

    // Revert to Default theme
    await instance.handleEquipTheme('default');
    assert.strictEqual(store.userProfile.equippedTheme, 'default');
    assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
    assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
    assert.strictEqual(toasts.length, 3);
    assert.ok(toasts[2].msg.includes('Chuẩn Gốc'));

    console.log('✅ PASS: Instant equip theme triggers store mutation, DOM classes, and feedback toast.');
  }

  // =========================================================================
  // TEST 5: LexiStore Navigation for Locked Themes
  // =========================================================================
  console.log('\n--- TEST 5: LexiStore Navigation for Locked Themes ---');
  {
    const toasts = [];
    const store = createStoreInstance({ uid: 'test_user' }, {
      inventory: { unlockedThemes: [] },
      equippedTheme: 'default'
    });
    store.currentRoute = 'dashboard';

    const { UserTool } = createUserToolComponent(store, toasts);
    const instance = UserTool.setup();
    instance.isOpen.value = true;

    // Trigger open store for locked theme
    instance.handleOpenStoreForTheme('theme_matrix');
    assert.strictEqual(instance.isOpen.value, false, 'Modal should close when navigating to store');
    assert.strictEqual(store.currentRoute, 'store', 'Current route should be set to store');
    assert.ok(toasts.some(t => t.msg.includes('LexiStore')), 'Toast should inform user of store redirection');

    console.log('✅ PASS: Locked theme redirect closes settings modal and routes directly to LexiStore.');
  }

  // =========================================================================
  // TEST 6: Template Invariant Checks
  // =========================================================================
  console.log('\n--- TEST 6: Template Invariant & UI Layout Integrity ---');
  {
    const store = createStoreInstance();
    const { UserTool } = createUserToolComponent(store);
    const template = UserTool.template;

    assert.ok(template.includes('Giao Diện VIP (Theme Picker)'), 'Template must include Theme Picker section title');
    assert.ok(template.includes('isThemeActive(thm.id)'), 'Template must check isThemeActive');
    assert.ok(template.includes('isThemeUnlocked(thm.id)'), 'Template must check isThemeUnlocked');
    assert.ok(template.includes('handleEquipTheme(thm.id)'), 'Template must bind handleEquipTheme');
    assert.ok(template.includes('handleOpenStoreForTheme'), 'Template must bind handleOpenStoreForTheme');
    assert.ok(template.includes('Đang Dùng'), 'Template must render "Đang Dùng" badge');
    assert.ok(template.includes('Áp Dụng'), 'Template must render "Áp Dụng" button');
    assert.ok(template.includes('Mở Khóa'), 'Template must render "Mở Khóa" button');
    assert.ok(template.includes('activeSettingTab === \'display\''), 'Theme Picker must reside in Display tab');
    assert.ok(template.includes('activeSettingTab === \'audio\''), 'Audio tab must remain intact');
    assert.ok(template.includes('activeSettingTab === \'game\''), 'Game tab must remain intact');
    assert.ok(template.includes('activeSettingTab === \'ai\''), 'AI tab must remain intact');

    console.log('✅ PASS: Template satisfies all visual components, action buttons, and multi-tab isolation.');
  }

  // =========================================================================
  // TEST 7: Bi-directional 2-Way Sync with LexiStore Simulation
  // =========================================================================
  console.log('\n--- TEST 7: Bi-directional LexiStore Simulation & Real-Time Sync ---');
  {
    storage = {};
    docElement = new MockElement();
    bodyElement = new MockElement();
    global.document.documentElement = docElement;
    global.document.body = bodyElement;

    const store = createStoreInstance({ uid: 'sync_user' }, {
      lexiCredit: 5000,
      inventory: { unlockedThemes: [], streakFreezes: 0 },
      equippedTheme: 'default'
    });

    const { UserTool } = createUserToolComponent(store);
    const settingsInstance = UserTool.setup();

    // 1. Initial: Matrix is locked in Settings
    assert.strictEqual(settingsInstance.isThemeUnlocked('theme_matrix'), false);
    assert.strictEqual(settingsInstance.isThemeActive('theme_matrix'), false);

    // 2. User buys Matrix theme in LexiStore
    await store.buyStoreItem({
      id: 'theme_matrix',
      title: 'Giao Diện Cyber Matrix Neon',
      category: 'themes',
      price: 1800
    });

    // 3. User equips Matrix theme
    await store.equipTheme('theme_matrix');

    // 4. Verify UserTool Settings immediately reflects unlocked and active state
    assert.strictEqual(settingsInstance.isThemeUnlocked('theme_matrix'), true);
    assert.strictEqual(settingsInstance.isThemeActive('theme_matrix'), true);
    assert.strictEqual(settingsInstance.isThemeActive('default'), false);
    assert.strictEqual(docElement.classList.contains('theme-matrix'), true);

    // 5. User equips Synthwave from Settings without owning it -> should throw
    let threw = false;
    try {
      await store.equipTheme('theme_synthwave');
    } catch (e) {
      threw = true;
    }
    assert.strictEqual(threw, true, 'Equipping unowned synthwave must fail');

    // 6. User buys Synthwave in LexiStore and equips it from Settings
    await store.buyStoreItem({
      id: 'theme_synthwave',
      title: 'Giao Diện Sunset Synthwave 80s',
      category: 'themes',
      price: 2400
    });

    assert.strictEqual(settingsInstance.isThemeUnlocked('theme_synthwave'), true);
    await settingsInstance.handleEquipTheme('theme_synthwave');

    assert.strictEqual(settingsInstance.isThemeActive('theme_synthwave'), true);
    assert.strictEqual(settingsInstance.isThemeActive('theme_matrix'), false);
    assert.strictEqual(docElement.classList.contains('theme-synthwave'), true);
    assert.strictEqual(docElement.classList.contains('theme-matrix'), false);

    console.log('✅ PASS: Bi-directional synchronization between LexiStore purchases and UserTool picker fully verified.');
  }

  console.log('\n======================================================');
  console.log('🎉 ALL 7 USERTOOL THEME PICKER TEST SUITES PASSED! 🎉');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('💥 TEST RUNNER FAILED:', err);
  process.exit(1);
});
