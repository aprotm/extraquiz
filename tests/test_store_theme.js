import assert from 'node:assert';
import fs from 'node:fs';

// Mock DOM
class ClassList {
  constructor() { this.classes = new Set(); }
  add(...cls) { cls.forEach(c => this.classes.add(c)); }
  remove(...cls) { cls.forEach(c => this.classes.delete(c)); }
  contains(cls) { return this.classes.has(cls); }
  toArray() { return Array.from(this.classes); }
}

const docElement = { classList: new ClassList() };
const bodyElement = { classList: new ClassList() };

const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

global.document = {
  documentElement: docElement,
  body: bodyElement
};
global.window = { location: { hash: '' } };

// Read js/store.js
let code = fs.readFileSync('js/store.js', 'utf8');

// Replace imports and exports for testing
code = code.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '');
code = code.replace(/export\s+const\s+store\s+=/g, 'const store =');
code = code.replace(/export\s+[\s\S]*?;/g, '');

const setupCode = `
function reactive(o){ return o; }
async function updateUserProfile(uid, data){ return true; }
const BADGES_DICT = [];
const EXCLUSIVE_ADMIN_BADGES = [];
function getRankFromLevel(){ return ''; }
function normalizeUserStats(){}
function getBadgeById(){}
function getLevelFromLifetimeLC(){ return 1; }

${code}

return store;
`;

const storeFactory = new Function(setupCode);
const store = storeFactory();

console.log('Store instantiated successfully.');

async function runTests() {
  // Test 1: Cold start / default theme
  store.applyActiveTheme();
  assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
  assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
  assert.strictEqual(bodyElement.classList.contains('theme-matrix'), false);
  assert.strictEqual(bodyElement.classList.contains('theme-synthwave'), false);
  console.log('PASS: Cold start default theme');

  // Test 2: Apply Matrix theme
  store.applyActiveTheme('theme_matrix');
  assert.strictEqual(docElement.classList.contains('theme-matrix'), true);
  assert.strictEqual(bodyElement.classList.contains('theme-matrix'), true);
  assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
  assert.strictEqual(localStorage.getItem('active_theme'), 'theme_matrix');
  console.log('PASS: Apply theme_matrix');

  // Test 3: Apply Synthwave theme
  store.applyActiveTheme('theme_synthwave');
  assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
  assert.strictEqual(bodyElement.classList.contains('theme-matrix'), false);
  assert.strictEqual(docElement.classList.contains('theme-synthwave'), true);
  assert.strictEqual(bodyElement.classList.contains('theme-synthwave'), true);
  assert.strictEqual(localStorage.getItem('active_theme'), 'theme_synthwave');
  console.log('PASS: Apply theme_synthwave');

  // Test 4: Apply 'default' theme
  store.applyActiveTheme('default');
  assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
  assert.strictEqual(bodyElement.classList.contains('theme-matrix'), false);
  assert.strictEqual(docElement.classList.contains('theme-synthwave'), false);
  assert.strictEqual(bodyElement.classList.contains('theme-synthwave'), false);
  assert.strictEqual(localStorage.getItem('active_theme'), 'default');
  console.log('PASS: Apply default theme');

  // Test 5: Substring theme matching ('matrix', 'synthwave')
  store.applyActiveTheme('matrix');
  assert.strictEqual(docElement.classList.contains('theme-matrix'), true);
  assert.strictEqual(bodyElement.classList.contains('theme-matrix'), true);
  console.log('PASS: Apply substring matrix');

  store.applyActiveTheme('synthwave');
  assert.strictEqual(docElement.classList.contains('theme-synthwave'), true);
  assert.strictEqual(bodyElement.classList.contains('theme-synthwave'), true);
  assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
  console.log('PASS: Apply substring synthwave');

  // Test 6: equipTheme without ownership throws error
  store.user = { uid: 'user_123' };
  store.userProfile = { inventory: { unlockedThemes: [] }, equippedTheme: 'default' };
  let threw = false;
  try {
    await store.equipTheme('theme_matrix');
  } catch (e) {
    threw = true;
    assert.strictEqual(e.message, 'Bạn chưa sở hữu giao diện này!');
  }
  assert.strictEqual(threw, true);
  console.log('PASS: equipTheme throws if unowned');

  // Test 7: equipTheme 'default' succeeds without ownership check
  const resDefault = await store.equipTheme('default');
  assert.strictEqual(resDefault, 'default');
  assert.strictEqual(store.userProfile.equippedTheme, 'default');
  console.log('PASS: equipTheme default succeeds');

  // Test 8: equipTheme empty string or null succeeds
  const resNull = await store.equipTheme(null);
  assert.strictEqual(resNull, 'default');
  console.log('PASS: equipTheme null succeeds');

  // Test 9: equipTheme owned theme
  store.userProfile.inventory.unlockedThemes = ['theme_matrix', 'theme_synthwave'];
  const resMatrix = await store.equipTheme('theme_matrix');
  assert.strictEqual(resMatrix, 'theme_matrix');
  assert.strictEqual(store.userProfile.equippedTheme, 'theme_matrix');
  assert.strictEqual(docElement.classList.contains('theme-matrix'), true);
  console.log('PASS: equipTheme owned theme_matrix');

  // Test 10: equipTheme toggle when already equipped
  const resToggle = await store.equipTheme('theme_matrix');
  assert.strictEqual(resToggle, 'default');
  assert.strictEqual(store.userProfile.equippedTheme, 'default');
  assert.strictEqual(docElement.classList.contains('theme-matrix'), false);
  console.log('PASS: equipTheme toggles to default');

  // Test 11: equipTheme admin override
  store.userProfile = { isAdmin: true, inventory: { unlockedThemes: [] }, equippedTheme: 'default' };
  const resAdmin = await store.equipTheme('theme_synthwave');
  assert.strictEqual(resAdmin, 'theme_synthwave');
  assert.strictEqual(store.userProfile.equippedTheme, 'theme_synthwave');
  assert.strictEqual(docElement.classList.contains('theme-synthwave'), true);
  console.log('PASS: equipTheme admin bypass');

  console.log('\n========================================');
  console.log('ALL 11 UNIT & INTEGRATION TESTS PASSED!');
  console.log('========================================\n');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
