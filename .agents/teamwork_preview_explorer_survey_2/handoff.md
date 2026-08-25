# Handoff Report — Explorer 2: LexiStore & Settings (UserTool) State Management & Theme Switching Survey

## 1. Observation

Direct investigation of the codebase revealed the following structural details and file locations:

### 1.1 LexiStore Catalog & Theme Definitions
- **File**: `e:/flashcardbyvanhngo/js/storeItems.js` (lines 142–169)
  - `theme_matrix`: 
    - ID: `'theme_matrix'`
    - Title: `'Giao Diện Cyber Matrix Neon'`
    - Category: `'themes'`
    - Price: `1800 LC` (LexiCredit)
    - Rarity: `'legendary'`, Badge: `'COSMETIC'`
    - Icon: `fa-solid fa-terminal`, Background: `'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'`
  - `theme_synthwave`:
    - ID: `'theme_synthwave'`
    - Title: `'Giao Diện Sunset Synthwave 80s'`
    - Category: `'themes'`
    - Price: `2400 LC` (LexiCredit)
    - Rarity: `'legendary'`, Badge: `'COSMETIC'`
    - Icon: `fa-solid fa-sun`, Background: `'bg-pink-500/15 text-pink-500 border-pink-500/30'`
  - Default Theme: `'default'`, implicit base theme (0 LC, built-in).

### 1.2 State Storage & Persistence Architecture
- **File**: `e:/flashcardbyvanhngo/js/store.js`
  - **Reactive State (`store`)**:
    - `store.userProfile.inventory`: `{ streakFreezes: 0, activeBoosters: [], aiHints: 0, unlockedThemes: [], unlockedDecks: [], unlockedFrames: [], equippedTheme: null, equippedAvatarFrame: null }` (lines 210–218).
    - `store.userProfile.equippedTheme`: string identifier (`'theme_matrix'`, `'theme_synthwave'`, or `'default'`).
  - **Local Persistence**:
    - `localStorage.getItem('active_theme')` / `localStorage.setItem('active_theme', theme)` (line 305).
  - **Remote Cloud Persistence**:
    - Firestore `users/{uid}` document updated via `updateUserProfile(uid, { equippedTheme, inventory })` in `js/db.js` (lines 260–264).
  - **Purchase Function (`buyStoreItem`)** (lines 197–290):
    - Verifies user logged in and `lexiCredit >= item.price`.
    - Deducts LC from `userProfile.lexiCredit`.
    - Pushes `item.id` into `userProfile.inventory.unlockedThemes`.
    - Records transaction in `userProfile.transactions`.
    - Persists via `updateUserProfile`.
  - **Theme Activation Function (`applyActiveTheme`)** (lines 293–306):
    - Reads active theme from parameter, `userProfile.equippedTheme`, or `localStorage.getItem('active_theme')`.
    - Removes `.theme-matrix` and `.theme-synthwave` from `document.documentElement` and `document.body`.
    - Adds `.theme-matrix` or `.theme-synthwave` to both `document.documentElement` and `document.body` if active.
    - Saves theme string to `localStorage.setItem('active_theme', theme)`.
  - **Theme Equip Function (`equipTheme`)** (lines 308–327):
    - Validates ownership against `userProfile.inventory.unlockedThemes`.
    - Toggles or sets `newTheme`.
    - Updates `userProfile.equippedTheme` and `userProfile.inventory.equippedTheme`.
    - Calls `this.applyActiveTheme(newTheme)`.
    - Persists to Firestore.

### 1.3 LexiStore UI Component
- **File**: `e:/flashcardbyvanhngo/js/components/lexistore.js`
  - Active check: `isItemActive(item)` checks `(store.userProfile?.equippedTheme || localStorage.getItem('active_theme')) === item.id` (lines 66–74).
  - Equip handler: `handleToggleEquip(item)` calls `store.equipTheme(item.id)` (lines 77–100).
  - Purchase handler: `handlePurchase(item)` calls `store.buyStoreItem(item)` followed by auto-equipping `store.equipTheme(item.id)` (lines 103–147).
  - Inventory summary header: displays active equipped theme badge `🎨 Theme: {{ store.userProfile.equippedTheme }}` (lines 270–273).

### 1.4 Settings Modal (UserTool) Component
- **File**: `e:/flashcardbyvanhngo/js/components/usertool.js`
  - Rendered globally in `js/app.js` (line 887) via `<UserTool v-if="store.user" />`.
  - Triggered by floating gear button (`#user-tool-widget`, lines 488–494) or `window.dispatchEvent(new CustomEvent('open-settings'))` from Dashboard.
  - Tab navigation (4 tabs):
    1. `'display'` (Hiển thị)
    2. `'audio'` (Âm thanh)
    3. `'game'` (Học tập)
    4. `'ai'` (AI Key)
  - Current Display Tab contents (lines 270–321):
    - Nickname input (`customDisplayName`)
    - Focus Mode toggle (`store.settings.focusMode`)
    - Reading font size adjuster (`store.settings.readingFontSize`)
  - **Currently Missing**: Quick Theme Selector (Theme Picker) UI in the Display tab.

---

## 2. Logic Chain

1. **State Reactivity Across Components**:
   - `store` is instantiated as a Vue 3 `reactive` object (`import { reactive } from 'vue'`).
   - When `store.equipTheme(themeId)` updates `store.userProfile.equippedTheme`, any Vue component referencing `store.userProfile.equippedTheme` automatically and reactively triggers a render update without needing page reload or event bus dispatch.
   - When a user changes the theme in `UserTool`, `LexiStore`'s `isItemActive(item)` and inventory header immediately reflect the change.
   - Conversely, when a user equips a theme in `LexiStore`, `UserTool`'s Display tab immediately reflects the change.

2. **DOM Style Mutation Mechanism**:
   - `applyActiveTheme(themeId)` directly manipulates `document.documentElement.classList` and `document.body.classList`.
   - By adding `.theme-matrix` or `.theme-synthwave` to both root and body, CSS rule declarations such as `html.theme-matrix ...` or `.theme-matrix ...` apply instantly across all DOM nodes with 0ms transition latency.

3. **Identified Edge Cases & Necessary Improvements**:
   - **Edge Case 1 — Default Theme Equipping**:
     In `store.js` line 312:
     ```javascript
     if (themeId && !(this.userProfile.inventory?.unlockedThemes || []).includes(themeId)) {
         throw new Error("Bạn chưa sở hữu giao diện này!");
     }
     ```
     When passing `themeId = 'default'`, `'default'` is not present in `unlockedThemes`, which would throw an unhandled error.
     *Fix required*: Check `themeId && themeId !== 'default' && !(...)`.
   - **Edge Case 2 — Direct Switch vs Toggle in Theme Selector**:
     In `store.js` line 316:
     ```javascript
     const newTheme = this.userProfile.equippedTheme === themeId ? 'default' : themeId;
     ```
     In LexiStore, clicking an already active theme button toggles it back to `'default'`. In a radio/card style Theme Picker in Settings, clicking the active theme should keep it active or allow selecting 'default' explicitly.
   - **Edge Case 3 — Cold-Start Anti-Flicker Bootstrapping**:
     Currently in `app.js`, `store.applyActiveTheme(profile.equippedTheme)` is only called after Firebase auth resolves.
     *Improvement*: Invoke `store.applyActiveTheme()` immediately when `store.js` initializes using `localStorage.getItem('active_theme')` to prevent unstyled flash on page refresh.
   - **Edge Case 4 — Unauthenticated / Guest Preview**:
     If an unauthenticated user or local tester changes theme, `store.applyActiveTheme(themeId)` should gracefully update the DOM and `localStorage` without failing on missing `store.user`.

---

## 3. Caveats

1. **Admin Access Filter in LexiStore**:
   - In `lexistore.js` (lines 15–19, 183–194) and `app.js` (line 649), LexiStore route is currently gated to admin users (`store.user?.email === 'test@test.com' || store.userProfile?.isAdmin || store.userProfile?.role === 'admin'`).
   - The Quick Theme Selector in `UserTool` allows regular users who already own unlocked themes (or Admins testing themes) to switch themes conveniently from any view.
2. **Offline Mode**:
   - When Firestore is unreachable, `localStorage.getItem('active_theme')` provides local fallback, ensuring theme settings persist across browser sessions even if offline.
3. **Chart.js Dynamic Re-skinning**:
   - Charts initialized on the Dashboard / Profile (Chart.js canvas elements) may need color palette re-evaluation upon theme switch to match Emerald Neon or Synthwave Pink gradients.

---

## 4. Conclusion

The integration plan for LexiStore and Settings (UserTool) state management & theme switching is well-defined and requires specific enhancements:

1. **`js/store.js` Refinements**:
   - Update `equipTheme(themeId)` to allow `'default'` without ownership validation error.
   - Add immediate invocation of `applyActiveTheme()` upon module load using `localStorage.getItem('active_theme')`.
   - Ensure `applyActiveTheme()` reliably sets classes on both `document.documentElement` and `document.body`.

2. **`js/components/usertool.js` Enhancements (Display Tab Theme Picker)**:
   - Define `themeOptions`:
     1. `default`: "Chuẩn Gốc (Default)"
     2. `theme_matrix`: "Cyber Matrix Neon" (Emerald Glow, Deep Obsidian, 1800 LC)
     3. `theme_synthwave`: "Sunset Synthwave 80s" (Hot Pink/Purple/Orange Horizon, 2400 LC)
   - Add reactive computed properties:
     - `activeThemeId`: returns current active theme.
     - `isThemeUnlocked(themeId)`: returns true for 'default', or if included in `unlockedThemes` (or if admin).
   - Add action handlers:
     - `handleQuickThemeSelect(themeId)`: equips unlocked theme or applies theme instantly.
     - `goToLexiStore()`: opens LexiStore directly for locked themes.
   - Add UI template in Tab 1 (Hiển thị):
     - Interactive theme card grid with visual color swatches, active badges ("Đang Dùng"), equip buttons ("Áp Dụng"), lock badges ("🔒 1800 LC"), and shortcut button to LexiStore.

---

## 5. Verification Method

To verify the state management and theme switching behavior:

1. **Unit / Logic Verification**:
   - Open browser console in application.
   - Execute:
     ```javascript
     store.applyActiveTheme('theme_matrix');
     console.assert(document.documentElement.classList.contains('theme-matrix'), 'Root has theme-matrix');
     console.assert(localStorage.getItem('active_theme') === 'theme_matrix', 'LocalStorage updated');
     
     store.applyActiveTheme('theme_synthwave');
     console.assert(document.documentElement.classList.contains('theme-synthwave'), 'Root has theme-synthwave');
     console.assert(!document.documentElement.classList.contains('theme-matrix'), 'theme-matrix removed');
     
     store.applyActiveTheme('default');
     console.assert(!document.documentElement.classList.contains('theme-synthwave'), 'theme-synthwave removed');
     ```
2. **LexiStore & UserTool Two-Way Synchronization**:
   - Open LexiStore -> Equip "Cyber Matrix Neon".
   - Open Settings Modal (`UserTool`) -> Tab Hiển thị -> Confirm "Cyber Matrix Neon" shows "Đang Dùng".
   - In Settings Modal -> Click "Sunset Synthwave 80s" -> Confirm DOM classes change immediately to `theme-synthwave`.
   - Close Settings Modal -> Confirm LexiStore card for "Sunset Synthwave 80s" now displays "Đang Dùng".
3. **Zero-Flicker Page Refresh**:
   - With `theme_matrix` equipped, refresh the page.
   - Verify `document.documentElement` and `document.body` immediately carry `theme-matrix` without unstyled light mode flash.
