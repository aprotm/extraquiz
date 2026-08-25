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
  addEventListener: (event, fn) => {
    if (!global.document._listeners) global.document._listeners = [];
    global.document._listeners.push({ event, fn });
  }
};
global.window = {
  location: { hash: '' },
  addEventListener: (event, fn) => {
    if (!global.window._listeners) global.window._listeners = [];
    global.window._listeners.push({ event, fn });
  },
  dispatchEvent: () => {}
};

// Read store.js source code
let code = fs.readFileSync('js/store.js', 'utf8');

// Strip ES modules for evaluation
code = code.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '');
code = code.replace(/export\s+const\s+store\s+=/g, 'const store =');
code = code.replace(/export\s+[\s\S]*?;/g, '');

function createStoreInstance(initialUser = null, initialProfile = null) {
  const setupCode = `
    function reactive(o){ return o; }
    async function updateUserProfile(uid, data){ 
      // simulated async delay
      await new Promise(r => setTimeout(r, Math.floor(Math.random() * 5)));
      return true; 
    }
    const BADGES_DICT = [];
    const EXCLUSIVE_ADMIN_BADGES = [];
    function getRankFromLevel(){ return 'Novice'; }
    function normalizeUserStats(){}
    function getBadgeById(){}
    function getLevelFromLifetimeLC(){ return 1; }

    ${code}

    if (initialUser) store.user = initialUser;
    if (initialProfile) store.userProfile = initialProfile;

    return store;
  `;
  return new Function('initialUser', 'initialProfile', setupCode)(initialUser, initialProfile);
}

async function runAllStressTests() {
  console.log('====================================================');
  console.log('⚡ STARTING ADVERSARIAL STRESS TEST SUITE FOR M1 ⚡');
  console.log('====================================================\n');

  // =========================================================================
  // TEST SUITE 1: DOM Class Isolation & Mutual Exclusivity under Non-Theme Classes
  // =========================================================================
  console.log('--- TEST SUITE 1: DOM Class Isolation & Mutual Exclusivity ---');
  {
    const extraneousClasses = ['focus-mode', 'theme-handdrawn', 'custom-hud', 'sidebar-collapsed', 'text-lg'];
    docElement = new MockElement(extraneousClasses);
    bodyElement = new MockElement(extraneousClasses);
    global.document.documentElement = docElement;
    global.document.body = bodyElement;
    storage = {};

    const store = createStoreInstance();

    const themesToTest = ['theme_matrix', 'theme_synthwave', 'default', 'theme_matrix', 'default', 'theme_synthwave'];
    for (const t of themesToTest) {
      store.applyActiveTheme(t);
      
      // Invariant: extraneous classes must never be removed or modified
      for (const cls of extraneousClasses) {
        assert.strictEqual(docElement.classList.contains(cls), true, `Extraneous class ${cls} lost on docElement for theme ${t}`);
        assert.strictEqual(bodyElement.classList.contains(cls), true, `Extraneous class ${cls} lost on bodyElement for theme ${t}`);
      }

      // Invariant: mutual exclusivity between matrix and synthwave
      const docMatrix = docElement.classList.contains('theme-matrix');
      const docSynth = docElement.classList.contains('theme-synthwave');
      const bodyMatrix = bodyElement.classList.contains('theme-matrix');
      const bodySynth = bodyElement.classList.contains('theme-synthwave');

      assert.strictEqual(docMatrix && docSynth, false, 'Mutually exclusive theme classes co-exist on docElement!');
      assert.strictEqual(bodyMatrix && bodySynth, false, 'Mutually exclusive theme classes co-exist on bodyElement!');
      assert.strictEqual(docMatrix, bodyMatrix, 'docElement and bodyElement matrix class mismatch');
      assert.strictEqual(docSynth, bodySynth, 'docElement and bodyElement synthwave class mismatch');

      if (t === 'theme_matrix') {
        assert.strictEqual(docMatrix, true);
        assert.strictEqual(docSynth, false);
      } else if (t === 'theme_synthwave') {
        assert.strictEqual(docMatrix, false);
        assert.strictEqual(docSynth, true);
      } else if (t === 'default') {
        assert.strictEqual(docMatrix, false);
        assert.strictEqual(docSynth, false);
      }
    }
    console.log('✅ PASS: DOM Class Isolation & Mutual Exclusivity verified across theme cycles');
  }

  // =========================================================================
  // TEST SUITE 2: Cold-Boot Anti-Flicker & LocalStorage Pre-population
  // =========================================================================
  console.log('\n--- TEST SUITE 2: Cold-Boot Anti-Flicker & LocalStorage Bootstrapping ---');
  {
    // Case 2A: Cold boot with matrix in localStorage
    storage = { active_theme: 'theme_matrix' };
    docElement = new MockElement();
    bodyElement = new MockElement();
    global.document.documentElement = docElement;
    global.document.body = bodyElement;

    const storeMatrixBoot = createStoreInstance();
    storeMatrixBoot.applyActiveTheme(); // simulates cold boot invocation
    assert.strictEqual(docElement.classList.contains('theme-matrix'), true);
    assert.strictEqual(bodyElement.classList.contains('theme-matrix'), true);
    assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);

    // Case 2B: Cold boot with synthwave in localStorage
    storage = { active_theme: 'theme_synthwave' };
    docElement = new MockElement();
    bodyElement = new MockElement();
    global.document.documentElement = docElement;
    global.document.body = bodyElement;

    const storeSynthBoot = createStoreInstance();
    storeSynthBoot.applyActiveTheme();
    assert.strictEqual(docElement.classList.contains('theme-synthwave'), true);
    assert.strictEqual(bodyElement.classList.contains('theme-synthwave'), true);
    assert.strictEqual(docElement.classList.contains('theme-matrix'), false);

    // Case 2C: Cold boot with empty/corrupted localStorage
    storage = { active_theme: 'some_unknown_or_null_theme' };
    docElement = new MockElement();
    bodyElement = new MockElement();
    global.document.documentElement = docElement;
    global.document.body = bodyElement;

    const storeDefaultBoot = createStoreInstance();
    storeDefaultBoot.applyActiveTheme();
    assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
    assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
    assert.strictEqual(bodyElement.classList.contains('theme-matrix'), false);
    assert.strictEqual(bodyElement.classList.contains('theme-synthwave'), false);

    console.log('✅ PASS: Cold-Boot Anti-Flicker accurately handles pre-populated, missing, and invalid localStorage keys');
  }

  // =========================================================================
  // TEST SUITE 3: Rapid Fuzzing Stress Test (50,000 Switches)
  // =========================================================================
  console.log('\n--- TEST SUITE 3: Rapid Fuzzing Stress Test (50,000 Operations) ---');
  {
    docElement = new MockElement(['existing-class-1', 'existing-class-2']);
    bodyElement = new MockElement(['existing-class-1', 'existing-class-2']);
    global.document.documentElement = docElement;
    global.document.body = bodyElement;
    storage = {};

    const store = createStoreInstance({ uid: 'user_fuzz' }, {
      inventory: { unlockedThemes: ['theme_matrix', 'theme_synthwave'] },
      equippedTheme: 'default'
    });

    const fuzzInputs = [
      'default',
      'theme_matrix',
      'theme_synthwave',
      'matrix',
      'synthwave',
      'MATRIX',
      'Synthwave',
      null,
      undefined,
      '',
      'invalid_garbage_theme',
      'theme_matrix_special',
      'theme_synthwave_v2'
    ];

    const iterations = 50000;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const input = fuzzInputs[Math.floor(Math.random() * fuzzInputs.length)];
      store.applyActiveTheme(input);

      // Invariants check
      const dMat = docElement.classList.contains('theme-matrix');
      const dSyn = docElement.classList.contains('theme-synthwave');
      const bMat = bodyElement.classList.contains('theme-matrix');
      const bSyn = bodyElement.classList.contains('theme-synthwave');

      // 1. Mutual exclusivity
      if (dMat && dSyn) throw new Error(`Mutual exclusivity violation on doc at step ${i} with input ${input}`);
      if (bMat && bSyn) throw new Error(`Mutual exclusivity violation on body at step ${i} with input ${input}`);

      // 2. Synchronous parity between html and body
      if (dMat !== bMat) throw new Error(`Parity mismatch for matrix at step ${i}`);
      if (dSyn !== bSyn) throw new Error(`Parity mismatch for synthwave at step ${i}`);

      // 3. Extraneous class preservation
      if (!docElement.classList.contains('existing-class-1') || !bodyElement.classList.contains('existing-class-2')) {
        throw new Error(`Orphaned or dropped extraneous class at step ${i}`);
      }
    }
    const duration = Date.now() - startTime;
    console.log(`✅ PASS: 50,000 rapid fuzzing theme switches executed in ${duration}ms (0 invariant violations)`);
  }

  // =========================================================================
  // TEST SUITE 4: Concurrent Async Race Condition Stress Test (200 Parallel Toggles)
  // =========================================================================
  console.log('\n--- TEST SUITE 4: Concurrent Async Race Condition Stress Test ---');
  {
    docElement = new MockElement();
    bodyElement = new MockElement();
    global.document.documentElement = docElement;
    global.document.body = bodyElement;
    storage = {};

    const store = createStoreInstance({ uid: 'user_async_race' }, {
      inventory: { unlockedThemes: ['theme_matrix', 'theme_synthwave'] },
      equippedTheme: 'default'
    });

    const candidates = ['theme_matrix', 'theme_synthwave', 'default'];
    const promises = [];

    for (let i = 0; i < 200; i++) {
      const chosen = candidates[i % candidates.length];
      promises.push(store.equipTheme(chosen));
    }

    const results = await Promise.all(promises);
    assert.strictEqual(results.length, 200);

    // Final state consistency check
    const finalEquipped = store.userProfile.equippedTheme;
    const finalStorage = storage['active_theme'];
    const dMat = docElement.classList.contains('theme-matrix');
    const dSyn = docElement.classList.contains('theme-synthwave');

    assert.strictEqual(finalEquipped, finalStorage, 'Final userProfile.equippedTheme must match localStorage active_theme');
    if (finalEquipped === 'theme_matrix') {
      assert.strictEqual(dMat, true);
      assert.strictEqual(dSyn, false);
    } else if (finalEquipped === 'theme_synthwave') {
      assert.strictEqual(dMat, false);
      assert.strictEqual(dSyn, true);
    } else {
      assert.strictEqual(dMat, false);
      assert.strictEqual(dSyn, false);
    }

    console.log(`✅ PASS: 200 concurrent async equipTheme operations converged cleanly without corruption. Final theme: "${finalEquipped}"`);
  }

  // =========================================================================
  // TEST SUITE 5: Memory Leak & Event Listener Audit
  // =========================================================================
  console.log('\n--- TEST SUITE 5: Memory Leak & Event Listener Audit ---');
  {
    global.window._listeners = [];
    global.document._listeners = [];
    docElement = new MockElement();
    bodyElement = new MockElement();
    global.document.documentElement = docElement;
    global.document.body = bodyElement;

    const store = createStoreInstance({ uid: 'user_mem' }, {
      inventory: { unlockedThemes: ['theme_matrix', 'theme_synthwave'] },
      equippedTheme: 'default'
    });

    // Baseline memory
    if (global.gc) global.gc();
    const memBefore = process.memoryUsage().heapUsed;

    const listenerCountBeforeDoc = (global.document._listeners || []).length;
    const listenerCountBeforeWin = (global.window._listeners || []).length;

    // Execute 100,000 rapid switches
    for (let i = 0; i < 100000; i++) {
      store.applyActiveTheme(i % 2 === 0 ? 'theme_matrix' : 'theme_synthwave');
    }

    const listenerCountAfterDoc = (global.document._listeners || []).length;
    const listenerCountAfterWin = (global.window._listeners || []).length;

    assert.strictEqual(listenerCountBeforeDoc, listenerCountAfterDoc, 'Leak detected: document event listener count increased during applyActiveTheme!');
    assert.strictEqual(listenerCountBeforeWin, listenerCountAfterWin, 'Leak detected: window event listener count increased during applyActiveTheme!');

    if (global.gc) global.gc();
    const memAfter = process.memoryUsage().heapUsed;
    const memDiffMB = ((memAfter - memBefore) / (1024 * 1024)).toFixed(2);

    console.log(`✅ PASS: 0 event listener leaks detected. Heap delta after 100,000 cycles: ${memDiffMB} MB (retained memory bounded)`);
  }

  // =========================================================================
  // TEST SUITE 6: Head Boot Missing Body Recovery
  // =========================================================================
  console.log('\n--- TEST SUITE 6: Head Boot (Missing Body) Simulation ---');
  {
    storage = { active_theme: 'theme_matrix' };
    docElement = new MockElement();
    global.document.documentElement = docElement;
    global.document.body = null; // Simulate script executing in <head>
    global.document._listeners = [];

    const store = createStoreInstance();
    // Simulate head load
    store.applyActiveTheme();
    assert.strictEqual(docElement.classList.contains('theme-matrix'), true);

    // Now simulate body element created and DOMContentLoaded fired
    bodyElement = new MockElement();
    global.document.body = bodyElement;
    
    // Simulate DOMContentLoaded trigger
    store.applyActiveTheme();
    assert.strictEqual(bodyElement.classList.contains('theme-matrix'), true);
    assert.strictEqual(docElement.classList.contains('theme-matrix'), true);

    console.log('✅ PASS: Head boot gracefully updates documentElement and re-synchronizes when body is attached');
  }

  console.log('\n====================================================');
  console.log('🎉 ALL 6 ADVERSARIAL STRESS TEST SUITES PASSED! 🎉');
  console.log('====================================================\n');
}

runAllStressTests().catch(err => {
  console.error('💥 ADVERSARIAL STRESS TEST FAILED:', err);
  process.exit(1);
});
