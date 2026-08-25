# Project: Full Theme Visual Overhaul Engine (Cyber Matrix Neon & Sunset Synthwave 80s)

## Architecture
The application is a zero-build client-side Vue 3 Single Page Application (SPA) using native browser ES Modules, Tailwind CSS CDN, FontAwesome 6, and Firebase 10.8.0.
The Visual Overhaul Engine operates on a 3-layer architecture:
1. **State & Persistence Layer (`js/store.js`, `js/storeItems.js`)**:
   - Reactive theme state tracking (`store.userProfile.equippedTheme`, `store.userProfile.inventory.unlockedThemes`).
   - Cold-start anti-flicker bootstrapping from `localStorage.getItem('active_theme')`.
   - Dynamic class toggling (`.theme-matrix`, `.theme-synthwave`) on `document.documentElement` and `document.body`.
   - Safe equipping logic supporting `'default'`, `'theme_matrix'`, and `'theme_synthwave'` with ownership validation.
2. **UI & Control Layer (`js/components/usertool.js`, `js/components/lexistore.js`)**:
   - Quick Theme Selector (Theme Picker) integrated into Settings Modal (UserTool) Display Tab.
   - Real-time two-way synchronization between LexiStore item cards and Settings Theme Picker.
   - Instant 1-click theme switching without page reload.
3. **Visual & Styling Engine Layer (`css/style.css`)**:
   - Full CSS Token and Scoped Rules Engine keyed to `html.theme-matrix, body.theme-matrix` and `html.theme-synthwave, body.theme-synthwave`.
   - Comprehensive overhaul across all 9 UI modules (Sidebar, Topbar, Dashboard & Pro Hub, Flashcard Study 3D Flip, Arcade Games Arena, LexiStore, Settings & Modals, AI Reading, Roadmap).
   - High-contrast typography (WCAG AA/AAA >= 4.5:1), glowing neon scanlines/borders, circuit grid backgrounds, chrome laser gradients, and smooth GPU-accelerated micro-interactions.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Cold-Start & Safe Theme State Engine | Immediate theme application on boot, safe default handling, and class synchronization | M1 | Survey (Explorer 2) / R4 |
| F2 | Quick Theme Selector in Settings (UserTool) | 3-item visual theme picker in Display Tab with active badges, 1-click equip, and LexiStore links | M2 | ORIGINAL_REQUEST §R3 |
| F3 | LexiStore & Settings Bi-directional Sync | Real-time state reflection between LexiStore item status and Settings picker | M2 | ORIGINAL_REQUEST §R3 |
| F4 | Cyber Matrix Neon Theme Engine (VIP Hacker) | Deep Obsidian (#040810), Emerald Neon (#00FF9D/#059669), circuit grid, terminal headers, glowing borders across all views | M3 | ORIGINAL_REQUEST §R1 |
| F5 | Sunset Synthwave 80s Theme Engine (Outrun Laser) | Retro Abyss (#0A0618), Hot Pink (#FF2A85), Synth Purple (#9D00FF), Cam Sunset (#FF7B00), laser horizon, chrome gradients across all views | M4 | ORIGINAL_REQUEST §R2 |
| F6 | Seamless Theme Isolation & Zero Regression | Scoped CSS architecture ensuring 100% preservation of Default mode, no pointer event blocking, and 0 console errors | M1, M3, M4, M5 | ORIGINAL_REQUEST §R4 |
| F7 | E2E Visual Contrast & Component Stability Hardening | Comprehensive verification across 10+ interactive views (3D Flip, Boss Fight, Arcade, Reading, Roadmap) | M5 | ORIGINAL_REQUEST Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: State & Theme Engine Hardening | Update `js/store.js` for safe default handling, anti-flicker cold boot, and robust root/body class toggling | none | DONE |
| 2 | M2: Quick Theme Selector in Settings & Sync | Add Theme Picker to `js/components/usertool.js` Display tab and verify 2-way sync with `js/components/lexistore.js` | M1 | DONE |
| 3 | M3: Cyber Matrix Neon & Sunset Synthwave 80s VIP Visual Overhaul Engine | Implement full scoped CSS tokens, neon/laser glow, obsidian/synthwave glass, circuit grid/horizon textures, and 9 module skins in `css/style.css` | M1, M2 | DONE |
| 4 | M4: E2E Verification, Contrast Audit & Regression Hardening | Run automated assertion scripts, verify all 10+ interactive views, test 3D flip, boss battle, and contrast compliance | M3 | DONE |

## Interface Contracts
### `js/store.js` ↔ UI Components (`usertool.js`, `lexistore.js`, `app.js`)
- `store.applyActiveTheme(themeId: string): void`:
  - Strips `.theme-matrix` and `.theme-synthwave` from `document.documentElement` and `document.body`.
  - If `themeId === 'theme_matrix'` -> adds `theme-matrix` to both root and body.
  - If `themeId === 'theme_synthwave'` -> adds `theme-synthwave` to both root and body.
  - Writes to `localStorage.setItem('active_theme', themeId)`.
- `store.equipTheme(themeId: string): Promise<void>`:
  - If `themeId !== 'default'`, checks `store.userProfile.inventory.unlockedThemes.includes(themeId)` (or admin override).
  - Updates `store.userProfile.equippedTheme = themeId`.
  - Invokes `store.applyActiveTheme(themeId)`.
  - Persists to Firestore `users/{uid}`.

### Scoped CSS Tokens ↔ DOM Elements
- Root classes: `html.theme-matrix, body.theme-matrix` and `html.theme-synthwave, body.theme-synthwave`.
- Target components:
  - Layout: `body`, `#app`, `aside`, `header.glass-panel-strong`, `main#main-content`, `nav.mobile-nav`.
  - Glass panels & cards: `.glass-panel`, `.glass-panel-strong`, `.interactive-card`, `#settings-panel`.
  - Flashcard Study: `.study-card`, `.card-face-front`, `.card-face-back`, `.flashcard-term`, `.study-controls`.
  - Arcade Games: Boss battle HUD (`#boss-battle`), Cyber Cipher tiles (`#cyber-cipher`), Matching game tiles (`#matching`), AI Arena HUD (`#ai-arena`).
  - LexiStore: `.store-card`, category tabs, active equipped pills.
  - Modals: `#settings-panel`, `.level-up-dialog`, inputs, select dropdowns.

## Code Layout
- `css/style.css`: Primary stylesheet containing semantic tokens and `.theme-matrix` / `.theme-synthwave` scoped component rules.
- `js/store.js`: Core reactive state management, theme application, and persistence.
- `js/components/usertool.js`: Settings modal and Quick Theme Selector UI.
- `js/components/lexistore.js`: LexiStore theme purchasing and equipping interface.
- `tests/`: Automated test assertion and verification scripts.
