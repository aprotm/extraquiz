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
  getItem: (k) => storage[k] !== undefined ? storage[k] : null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { storage = {}; }
};

let docElement = new MockElement();
let bodyElement = new MockElement();

const windowListeners = new Map();
global.document = {
  documentElement: docElement,
  body: bodyElement,
  getElementById: (id) => new MockElement(),
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.window = {
  location: { hash: '' },
  addEventListener: (evt, fn) => {
    if (!windowListeners.has(evt)) windowListeners.set(evt, []);
    windowListeners.get(evt).push(fn);
  },
  removeEventListener: (evt, fn) => {
    if (windowListeners.has(evt)) {
      const arr = windowListeners.get(evt).filter(f => f !== fn);
      windowListeners.set(evt, arr);
    }
  },
  dispatchEvent: (evt) => {
    const arr = windowListeners.get(evt.type || evt) || [];
    arr.forEach(fn => fn(evt));
  }
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

    if (initialUser !== undefined) store.user = initialUser;
    if (initialProfile !== undefined) store.userProfile = initialProfile;

    return store;
  `;
  return new Function('initialUser', 'initialProfile', setupCode)(initialUser, initialProfile);
}

// Read usertool.js source code
let usertoolCode = fs.readFileSync('js/components/usertool.js', 'utf8');
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

async function runEmpiricalChallenges() {
  console.log('================================================================');
  console.log('⚔️  RUNNING EMPIRICAL CHALLENGER ADVERSARIAL STRESS SUITE (M2) ⚔️');
  console.log('================================================================\n');

  // =========================================================================
  // CHALLENGE 1: Unauthenticated / Guest User Lifecycle & Fail-Safe Handling
  // =========================================================================
  console.log('--- CHALLENGE 1: Unauthenticated & Guest User Edge Cases ---');
  {
    storage = {};
    docElement = new MockElement();
    bodyElement = new MockElement();
    global.document.documentElement = docElement;
    global.document.body = bodyElement;

    const toasts = [];
    const store = createStoreInstance(null, null); // completely guest / unauthenticated
    const { UserTool, THEME_OPTIONS } = createUserToolComponent(store, toasts);
    const instance = UserTool.setup();

    // 1.1 Unlocked check for guest
    assert.strictEqual(instance.isThemeUnlocked('default'), true, 'Default must be unlocked for guest');
    assert.strictEqual(instance.isThemeUnlocked('theme_matrix'), false, 'Matrix must be locked for guest');
    assert.strictEqual(instance.isThemeUnlocked('theme_synthwave'), false, 'Synthwave must be locked for guest');

    // 1.2 Active check for guest
    assert.strictEqual(instance.isThemeActive('default'), true, 'Default must be active by default');
    assert.strictEqual(instance.isThemeActive('theme_matrix'), false);
    assert.strictEqual(instance.isThemeActive('theme_synthwave'), false);

    // 1.3 Equipping locked theme as guest must gracefully show error toast without crashing
    await instance.handleEquipTheme('theme_matrix');
    assert.strictEqual(toasts.length, 1, 'Should display 1 toast');
    assert.strictEqual(toasts[0].type, 'error');
    assert.ok(toasts[0].msg.includes('Bạn chưa sở hữu'), 'Toast should state theme is not owned');
    assert.strictEqual(instance.isThemeActive('default'), true, 'Active theme must remain default');
    assert.strictEqual(docElement.classList.contains('theme-matrix'), false, 'DOM must not have theme-matrix');

    // 1.4 Equipping default theme as guest should succeed
    await instance.handleEquipTheme('default');
    assert.strictEqual(toasts.length, 2);
    assert.strictEqual(toasts[1].type, 'info');
    assert.ok(toasts[1].msg.includes('Chuẩn Gốc'));
    assert.strictEqual(instance.isThemeActive('default'), true);

    // 1.5 Clicking locked theme store link as guest
    instance.isOpen.value = true;
    instance.handleOpenStoreForTheme('theme_matrix');
    assert.strictEqual(instance.isOpen.value, false, 'Modal should close');
    assert.strictEqual(store.currentRoute, 'store', 'Should route to store');
    assert.strictEqual(toasts.length, 3);
    assert.strictEqual(toasts[2].type, 'info');

    console.log('✅ PASS Challenge 1: Unauthenticated & guest users handled with full fail-safes.');
  }

  // =========================================================================
  // CHALLENGE 2: Locked Theme Invocation & Defense Invariants
  // =========================================================================
  console.log('\n--- CHALLENGE 2: Locked Theme Invocation & Attack Defense ---');
  {
    storage = {};
    docElement = new MockElement();
    bodyElement = new MockElement();
    global.document.documentElement = docElement;
    global.document.body = bodyElement;

    const toasts = [];
    const store = createStoreInstance({ uid: 'normal_user_123' }, {
      lexiCredit: 500,
      inventory: { unlockedThemes: [] },
      equippedTheme: 'default'
    });
    const { UserTool } = createUserToolComponent(store, toasts);
    const instance = UserTool.setup();

    // Adversary attempts direct function invocation on locked Synthwave theme
    await instance.handleEquipTheme('theme_synthwave');
    assert.strictEqual(toasts.length, 1);
    assert.strictEqual(toasts[0].type, 'error');
    assert.strictEqual(store.userProfile.equippedTheme, 'default');
    assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
    assert.strictEqual(bodyElement.classList.contains('theme-synthwave'), false);

    // Adversary passes illegal/invalid theme ids
    await instance.handleEquipTheme('malicious_xss_theme"><script>');
    assert.strictEqual(toasts.length, 2);
    assert.strictEqual(toasts[1].type, 'error');
    assert.strictEqual(store.userProfile.equippedTheme, 'default');
    assert.strictEqual(docElement.classList.contains('malicious_xss_theme'), false);

    console.log('✅ PASS Challenge 2: Direct invocations on locked/invalid themes defended and isolated.');
  }

  // =========================================================================
  // CHALLENGE 3: High-Frequency Fuzzing & Rapid Switching Stress (5,000 ops)
  // =========================================================================
  console.log('\n--- CHALLENGE 3: High-Frequency Fuzzing & Rapid Switching Stress ---');
  {
    storage = {};
    docElement = new MockElement();
    bodyElement = new MockElement();
    global.document.documentElement = docElement;
    global.document.body = bodyElement;

    const toasts = [];
    const store = createStoreInstance({ uid: 'stress_user_456' }, {
      inventory: { unlockedThemes: ['theme_matrix', 'theme_synthwave'] },
      equippedTheme: 'default'
    });
    const { UserTool } = createUserToolComponent(store, toasts);
    const instance = UserTool.setup();

    const themes = ['default', 'theme_matrix', 'theme_synthwave'];
    const startTime = Date.now();
    const ITERATIONS = 5000;

    for (let i = 0; i < ITERATIONS; i++) {
      const targetTheme = themes[i % themes.length];
      await instance.handleEquipTheme(targetTheme);

      // Invariant check on each iteration
      const activeInDoc = docElement.classList.toArray();
      const activeInBody = bodyElement.classList.toArray();
      
      // Mutual exclusivity check: Cannot have both matrix and synthwave
      assert.ok(
        !(activeInDoc.includes('theme-matrix') && activeInDoc.includes('theme-synthwave')),
        `Violation at iteration ${i}: Both themes present in html`
      );
      assert.ok(
        !(activeInBody.includes('theme-matrix') && activeInBody.includes('theme-synthwave')),
        `Violation at iteration ${i}: Both themes present in body`
      );

      // State synchronization check
      const currentEquipped = store.userProfile.equippedTheme;
      if (currentEquipped === 'theme_matrix') {
        assert.ok(activeInDoc.includes('theme-matrix'));
        assert.ok(activeInBody.includes('theme-matrix'));
      } else if (currentEquipped === 'theme_synthwave') {
        assert.ok(activeInDoc.includes('theme-synthwave'));
        assert.ok(activeInBody.includes('theme-synthwave'));
      } else {
        assert.ok(!activeInDoc.includes('theme-matrix') && !activeInDoc.includes('theme-synthwave'));
        assert.ok(!activeInBody.includes('theme-matrix') && !activeInBody.includes('theme-synthwave'));
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`✅ PASS Challenge 3: ${ITERATIONS} rapid equip cycles completed in ${elapsed}ms with 0 invariant violations.`);
  }

  // =========================================================================
  // CHALLENGE 4: Concurrent Async Race Condition Stress (200 parallel calls)
  // =========================================================================
  console.log('\n--- CHALLENGE 4: Concurrent Async Race Condition Stress ---');
  {
    storage = {};
    docElement = new MockElement();
    bodyElement = new MockElement();
    global.document.documentElement = docElement;
    global.document.body = bodyElement;

    const toasts = [];
    const store = createStoreInstance({ uid: 'race_user_789' }, {
      inventory: { unlockedThemes: ['theme_matrix', 'theme_synthwave'] },
      equippedTheme: 'default'
    });
    const { UserTool } = createUserToolComponent(store, toasts);
    const instance = UserTool.setup();

    const targets = ['theme_matrix', 'theme_synthwave', 'default', 'theme_matrix', 'theme_synthwave'];
    const promises = [];

    // Launch 200 concurrent promises in parallel
    for (let i = 0; i < 200; i++) {
      const t = targets[i % targets.length];
      promises.push(instance.handleEquipTheme(t));
    }

    await Promise.all(promises);

    // Final state consistency check
    const finalEquipped = store.userProfile.equippedTheme;
    const finalStorage = storage['active_theme'];
    const activeInDoc = docElement.classList.toArray();

    assert.ok(
      !(activeInDoc.includes('theme-matrix') && activeInDoc.includes('theme-synthwave')),
      'Mutual exclusivity must hold after concurrency burst'
    );
    assert.strictEqual(finalStorage, finalEquipped, 'localStorage must match store.equippedTheme');
    assert.strictEqual(instance.isThemeActive(finalEquipped), true, 'isThemeActive must match final equipped theme');

    console.log(`✅ PASS Challenge 4: 200 concurrent async switches converged cleanly. Final theme: "${finalEquipped}".`);
  }

  // =========================================================================
  // CHALLENGE 5: Dynamic Admin Role Escalation & Revocation Lifecycle
  // =========================================================================
  console.log('\n--- CHALLENGE 5: Admin Escalation & Revocation Dynamics ---');
  {
    storage = {};
    docElement = new MockElement();
    bodyElement = new MockElement();
    global.document.documentElement = docElement;
    global.document.body = bodyElement;

    const toasts = [];
    const store = createStoreInstance({ uid: 'role_user_101', email: 'user@standard.com' }, {
      isAdmin: false,
      role: 'user',
      inventory: { unlockedThemes: [] },
      equippedTheme: 'default'
    });
    const { UserTool } = createUserToolComponent(store, toasts);
    const instance = UserTool.setup();

    // 5.1 Initial state: Normal user -> locked
    assert.strictEqual(instance.isThemeUnlocked('theme_matrix'), false);
    assert.strictEqual(instance.isThemeUnlocked('theme_synthwave'), false);

    // 5.2 Admin Escalation 1: isAdmin flag
    store.userProfile.isAdmin = true;
    assert.strictEqual(instance.isThemeUnlocked('theme_matrix'), true, 'isAdmin: true unlocks theme_matrix');
    assert.strictEqual(instance.isThemeUnlocked('theme_synthwave'), true, 'isAdmin: true unlocks theme_synthwave');

    // Admin equips theme_synthwave
    await instance.handleEquipTheme('theme_synthwave');
    assert.strictEqual(instance.isThemeActive('theme_synthwave'), true);
    assert.strictEqual(docElement.classList.contains('theme-synthwave'), true);

    // 5.3 Admin Escalation 2: role = 'admin'
    store.userProfile.isAdmin = false;
    store.userProfile.role = 'admin';
    assert.strictEqual(instance.isThemeUnlocked('theme_matrix'), true, 'role: admin unlocks theme_matrix');

    // 5.4 Admin Escalation 3: email = 'test@test.com'
    store.userProfile.role = 'user';
    store.user.email = 'test@test.com';
    assert.strictEqual(instance.isThemeUnlocked('theme_synthwave'), true, 'email test@test.com unlocks theme_synthwave');

    // 5.5 Admin Revocation: Stripping all admin status
    store.user.email = 'user@standard.com';
    store.userProfile.isAdmin = false;
    store.userProfile.role = 'user';

    // Verify themes are locked again in inventory check
    assert.strictEqual(instance.isThemeUnlocked('theme_matrix'), false, 'Matrix locked after admin revocation');
    assert.strictEqual(instance.isThemeUnlocked('theme_synthwave'), false, 'Synthwave locked after admin revocation');
    
    // User is currently still wearing Synthwave (active)
    assert.strictEqual(instance.isThemeActive('theme_synthwave'), true);

    // User tries to switch to Matrix without admin privileges -> REJECTED
    await instance.handleEquipTheme('theme_matrix');
    assert.ok(toasts[toasts.length - 1].msg.includes('Bạn chưa sở hữu'));
    assert.strictEqual(instance.isThemeActive('theme_synthwave'), true, 'Should stay on synthwave');

    // User switches back to default -> SUCCEEDS
    await instance.handleEquipTheme('default');
    assert.strictEqual(instance.isThemeActive('default'), true);
    assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);

    // User now attempts to re-equip Synthwave -> REJECTED
    await instance.handleEquipTheme('theme_synthwave');
    assert.ok(toasts[toasts.length - 1].msg.includes('Bạn chưa sở hữu'));
    assert.strictEqual(instance.isThemeActive('default'), true);

    console.log('✅ PASS Challenge 5: Dynamic admin escalation and privilege revocation behave strictly as specified.');
  }

  // =========================================================================
  // CHALLENGE 6: Toggle-off Behavior & Re-equipping Active Theme
  // =========================================================================
  console.log('\n--- CHALLENGE 6: Toggle-Off Behavior & Notification Verification ---');
  {
    storage = {};
    docElement = new MockElement();
    bodyElement = new MockElement();
    global.document.documentElement = docElement;
    global.document.body = bodyElement;

    const toasts = [];
    const store = createStoreInstance({ uid: 'toggle_user' }, {
      inventory: { unlockedThemes: ['theme_matrix', 'theme_synthwave'] },
      equippedTheme: 'default'
    });
    const { UserTool } = createUserToolComponent(store, toasts);
    const instance = UserTool.setup();

    // 1. Equip Matrix
    await instance.handleEquipTheme('theme_matrix');
    assert.strictEqual(instance.isThemeActive('theme_matrix'), true);
    assert.ok(toasts[toasts.length - 1].msg.includes('Cyber Matrix Neon'));

    // 2. Click Matrix again -> should toggle back to default
    await instance.handleEquipTheme('theme_matrix');
    assert.strictEqual(instance.isThemeActive('default'), true);
    assert.strictEqual(instance.isThemeActive('theme_matrix'), false);
    assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
    assert.ok(toasts[toasts.length - 1].msg.includes('Chuẩn Gốc'), 'Must notify user that default theme restored');

    // 3. Equip Synthwave
    await instance.handleEquipTheme('theme_synthwave');
    assert.strictEqual(instance.isThemeActive('theme_synthwave'), true);
    assert.ok(toasts[toasts.length - 1].msg.includes('Sunset Synthwave 80s'));

    // 4. Click Synthwave again -> toggle to default
    await instance.handleEquipTheme('theme_synthwave');
    assert.strictEqual(instance.isThemeActive('default'), true);
    assert.strictEqual(instance.isThemeActive('theme_synthwave'), false);
    assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
    assert.ok(toasts[toasts.length - 1].msg.includes('Chuẩn Gốc'));

    console.log('✅ PASS Challenge 6: Toggle-off behavior and toast feedback confirmed 100% accurate.');
  }

  // =========================================================================
  // CHALLENGE 7: Corrupted / Malformed Inventory & Extreme State Fuzzing
  // =========================================================================
  console.log('\n--- CHALLENGE 7: Corrupted / Malformed Store State Resilience ---');
  {
    storage = {};
    docElement = new MockElement();
    bodyElement = new MockElement();
    global.document.documentElement = docElement;
    global.document.body = bodyElement;

    const malformedProfiles = [
      null,
      undefined,
      {},
      { inventory: null },
      { inventory: { unlockedThemes: null } },
      { inventory: { unlockedThemes: "invalid_string_not_array" } },
      { inventory: { unlockedThemes: 12345 } },
      { inventory: { unlockedThemes: [null, undefined, 42, {}] } },
      { equippedTheme: null },
      { equippedTheme: undefined },
      { equippedTheme: 9999 },
      { equippedTheme: "" }
    ];

    for (let i = 0; i < malformedProfiles.length; i++) {
      const prof = malformedProfiles[i];
      const toasts = [];
      const store = createStoreInstance({ uid: `fuzz_${i}` }, prof);
      const { UserTool } = createUserToolComponent(store, toasts);
      const instance = UserTool.setup();

      // Test all helper methods against malformed profile
      assert.strictEqual(instance.isThemeUnlocked('default'), true);
      assert.strictEqual(instance.isThemeUnlocked('theme_matrix'), false);
      assert.strictEqual(instance.isThemeUnlocked(null), true);
      assert.strictEqual(instance.isThemeUnlocked(undefined), true);
      assert.strictEqual(instance.isThemeUnlocked(''), true);

      assert.doesNotThrow(() => {
        instance.isThemeActive('default');
        instance.isThemeActive('theme_matrix');
        instance.isThemeActive(null);
        instance.isThemeActive(undefined);
      }, `isThemeActive crashed on malformed profile index ${i}`);
    }

    console.log('✅ PASS Challenge 7: Zero crashes across 12 malformed / corrupted profile edge cases.');
  }

  // =========================================================================
  // CHALLENGE 8: Window Event & UI State Integration
  // =========================================================================
  console.log('\n--- CHALLENGE 8: Window Event, Tab Isolation & Settings Reset Invariants ---');
  {
    storage = {};
    const store = createStoreInstance({ uid: 'event_user' }, {
      inventory: { unlockedThemes: ['theme_matrix'] },
      equippedTheme: 'theme_matrix'
    });
    const { UserTool } = createUserToolComponent(store);
    const instance = UserTool.setup();

    // 8.1 Dispatch 'open-settings' event
    assert.strictEqual(instance.isOpen.value, false);
    global.window.dispatchEvent({ type: 'open-settings' });
    assert.strictEqual(instance.isOpen.value, true, 'isOpen must be true after open-settings event');

    // 8.2 Switching tabs should not alter theme state
    instance.activeSettingTab.value = 'audio';
    assert.strictEqual(instance.isThemeActive('theme_matrix'), true);
    instance.activeSettingTab.value = 'game';
    assert.strictEqual(instance.isThemeActive('theme_matrix'), true);
    instance.activeSettingTab.value = 'ai';
    assert.strictEqual(instance.isThemeActive('theme_matrix'), true);
    instance.activeSettingTab.value = 'display';
    assert.strictEqual(instance.isThemeActive('theme_matrix'), true);

    console.log('✅ PASS Challenge 8: Window event listener and multi-tab isolation validated.');
  }

  console.log('\n================================================================');
  console.log('🏆 ALL 8 EMPIRICAL CHALLENGE SUITES PASSED WITHOUT DEFECTS! 🏆');
  console.log('================================================================\n');
}

runEmpiricalChallenges().catch(err => {
  console.error('💥 EMPIRICAL CHALLENGE FAILED:', err);
  process.exit(1);
});
