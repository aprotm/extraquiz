# CSS & Styling Architecture Survey Report: Cyber Matrix Neon & Sunset Synthwave 80s Overhaul

## 1. Observation

### 1.1 Styling & Theme Application Architecture
- **Theme Activation Mechanism (`js/store.js:293-327`)**:
  - Method `applyActiveTheme(themeId)` reads `themeId || this.userProfile?.equippedTheme || localStorage.getItem('active_theme') || 'default'`.
  - Removes classes `theme-matrix` and `theme-synthwave` from both `document.documentElement` and `document.body`.
  - When `theme === 'theme_matrix'`, it adds `.theme-matrix` to both `<html>` and `<body>`.
  - When `theme === 'theme_synthwave'`, it adds `.theme-synthwave` to both `<html>` and `<body>`.
  - Stores the active key in `localStorage.setItem('active_theme', theme)`.
  - Method `equipTheme(themeId)` toggles between `themeId` and `'default'`, updating `userProfile.equippedTheme`, `userProfile.inventory.equippedTheme`, and synchronizing Firestore via `updateUserProfile()`.

- **Current CSS Tokens & Theme Definitions (`css/style.css:1-56`, `css/style.css:865-920`)**:
  - Root tokens (`:root` in `css/style.css:2-56`) define semantic colors: `--color-bg`, `--color-bg-secondary`, `--color-surface`, `--color-surface-hover`, `--color-primary`, `--color-primary-hover`, `--color-primary-light`, `--color-secondary`, `--color-text`, `--color-text-muted`, `--color-text-light`, `--color-border`, `--color-danger`, `--color-success`, `--color-warning`.
  - Existing Theme Overrides for Matrix and Synthwave (`css/style.css:867-920`):
    - `html.theme-matrix, body.theme-matrix` currently only overrides `--color-primary: #10B981`, `.glass-panel` border color, `.btn-primary` background gradient, and `aside` border.
    - `html.theme-synthwave, body.theme-synthwave` currently only overrides `--color-primary: #D946EF`, `.glass-panel` border color, `.btn-primary` background gradient, and `aside` border.
    - **Current Gap**: The current implementation is minimal and does NOT style backgrounds, obsidian/synthwave canvas, card faces, text contrast, sidebars, topbars, buttons, modals, game boards, terminal scanlines, or neon glow effects.
  - Existing reference implementation: `theme-handdrawn` (`css/style.css:439-610`) shows the pattern of full scoped CSS overrides on `.glass-panel`, `.interactive-card`, `#settings-panel`, `.btn-primary`, `.btn-ghost`, `input`, `.study-card`, `.progress-bar-track`, etc.

- **LexiStore Catalog Definitions (`js/storeItems.js:143-169`)**:
  - `theme_matrix`: ID `'theme_matrix'`, Title `'Giao Diện Cyber Matrix Neon'`, Rarity `'legendary'`, Price `1800 LC`, Icon `'fa-terminal'`.
  - `theme_synthwave`: ID `'theme_synthwave'`, Title `'Giao Diện Sunset Synthwave 80s'`, Rarity `'legendary'`, Price `2400 LC`, Icon `'fa-sun'`.

- **Settings / UserTool Structure (`js/components/usertool.js:207-495`)**:
  - Trigger: Floating gear button `#user-tool-widget` (line 489).
  - Modal: `#settings-panel` (line 218).
  - Tabs: `display` (Hiển thị), `audio` (Âm thanh), `game` (Học tập), `ai` (AI Key).
  - Current Tab 1 (`display`, line 271) contains: Display Name input, Focus mode switch, Reading font size stepper.
  - **Missing Feature (R3)**: Does not yet have a Theme Selector / Theme Picker to switch between Default, Matrix, and Synthwave.

---

### 1.2 Component Mapping for Full Theme Overhaul

| UI Component | Structural Location | Key HTML Elements / Classes | Styling Overhaul Needed |
| :--- | :--- | :--- | :--- |
| **App Layout & Background** | `index.html`, `js/app.js:571-890` | `body`, `#app`, `div.min-h-screen`, `main#main-content` | Deep Obsidian `#040810` / Synthwave Abyss `#0A0618`, circuit grid background, glowing particle aura. |
| **Desktop Sidebar** | `js/app.js:582-812` | `aside`, `.custom-scrollbar`, nav buttons, bottom profile card | Obsidian/Synth dark glass, neon borders (`#00FF9D`/`#FF2A85`), glowing active item indicator, theme-compliant text contrast. |
| **Mobile Topbar & Bottom Nav** | `js/app.js:817-830`, `js/app.js:865-884` | `header.glass-panel-strong`, `nav.mobile-nav` | Dark glass background, glowing border top/bottom, neon active icons, contrast badges. |
| **Floating Action & Back Buttons** | `js/app.js:833-837`, `js/components/usertool.js:489` | `button[title="Quay lại Dashboard"]`, `#user-tool-widget button` | Themed dark background, neon border, glowing hover state. |
| **Dashboard** | `js/components/dashboard.js:192-250+` | `.glass-panel-strong`, hero banner, Daily Spark quote widget, stats cards, deck cards | Dark obsidian/synthwave hero card, neon borders, emerald/magenta progress rings, bright typography. |
| **Pro Hub (LexiLearn Dashboard)** | `js/components/lexilearndashboard.js:444-550+` | `#070A13` canvas, sidebar `#090D18`, HUD telemetry cards, Heatmap, Radar Matrix | Harmonize with Matrix Emerald / Synthwave Sunset color tokens and glowing scanlines. |
| **Flashcard Study 3D Flip** | `js/components/study.js:251-447` | `.study-card`, `.card-face-front`, `.card-face-back`, `.flashcard-term`, `.study-controls`, `.progress-bar-track` | Front/Back 3D cards with obsidian/synth dark panels, neon emerald/hot pink glowing borders, high-contrast white text, themed controls toolbar (Wrong/Correct buttons). |
| **Arcade: Speed Boss Battle** | `js/components/bossbattle.js:368-520+` | Boss showcase card, boss avatar frame, HP bar, combat question card, options, skill buttons | Cyber terminal battle HUD, neon boss HP bar, themed question cards, glowing skill action buttons. |
| **Arcade: Cyber Cipher** | `js/components/cybercipher.js:430-520+` | Terminal HUD header, clue card, letter slots, letter tiles, action buttons | Emerald/Magenta cyber grid scanlines, glowing letter key tiles, neon clue container. |
| **Arcade: Matching Game** | `js/components/matchinggame.js:304-420+` | Stopwatch card, progress card, combo card, 3D grid card tiles (`normal`, `selected`, `matched`, `wrong`) | Themed 3D tiles with neon glow (`neon-selected-glow`, `cardMatchBurst`), dark glass HUD. |
| **Arcade: AI Arena 1v1** | `js/components/aiarena.js:45-150+` | Arena HUD, bot dialogue boxes, split score progress bars, question cards | Neon vs laser battle HUD, high-contrast dialogue bubbles, themed answer buttons. |
| **LexiStore** | `js/components/lexistore.js:180-445` | Hero banner, LC wallet card, category tabs, active inventory drawer, item cards, rarity badges | Deep Obsidian / Sunset Outrun catalog styling, neon category pills, radiant store item cards, glowing "Active" badges. |
| **Settings & Modals** | `js/components/usertool.js:218-485`, `LevelUpPopup.js:70-100` | `#settings-panel`, modal inputs, switches, tab pills, level-up dialog | Dark glassmorphism modal (`#settings-panel`), neon focus rings, styled switches, Theme Selector picker UI. |
| **AI Modules (Reading, Roadmap, Coach)** | `js/components/reading.js`, `roadmap.js`, `paraphrasingcoach.js`, `writinggrader.js` | Passage containers, IELTS option cards, `.markdown-body`, timeline nodes | Themed markdown body (dark table, blockquote, code blocks), high-contrast text, glowing timeline node cards. |

---

### 1.3 Exact Color Tokens & Visual Palettes

#### A. Cyber Matrix Neon (VIP Hacker Edition)
- **Class Identifier**: `html.theme-matrix`, `body.theme-matrix`
- **Backgrounds**:
  - Deep Obsidian Base: `#040810`
  - Obsidian Secondary / Surface: `#08101E` / `rgba(6, 13, 24, 0.92)`
  - Card Surface Glass: `rgba(8, 18, 34, 0.85)` with `backdrop-filter: blur(16px)`
  - Background Texture: `radial-gradient(circle, rgba(0, 255, 157, 0.09) 1px, transparent 1px) 0 0/28px 28px, linear-gradient(to bottom, #040810 0%, #060e1c 100%)`
- **Accent & Neon Palette**:
  - Cyber Emerald Neon (Primary): `#00FF9D`
  - Deep Matrix Emerald: `#059669` / `#10B981`
  - High-Voltage Mint: `#34D399` / `#6EE7B7`
  - Hacker Cyber Cyan: `#00E5FF` / `#06B6D4`
  - Dark Matrix Surface: `#0A1628`
- **Borders & Shadows**:
  - Neon Border: `1px solid rgba(0, 255, 157, 0.35)`
  - Active / Glow Border: `1.5px solid #00FF9D`
  - Box Shadow (Glow): `0 0 20px -2px rgba(0, 255, 157, 0.25), inset 0 0 15px rgba(0, 255, 157, 0.06)`
- **Buttons**:
  - Primary Button: `background: linear-gradient(135deg, #00FF9D 0%, #059669 100%) !important; color: #020C07 !important; font-weight: 900; box-shadow: 0 0 22px rgba(0, 255, 157, 0.45); border: 1px solid #34D399;`
- **Typography & Contrast**:
  - Headings (`h1, h2, h3, h4, h5, h6`): `#FFFFFF` / `#F0FDF4` (Text-shadow: `0 0 12px rgba(0, 255, 157, 0.3)`)
  - Body Text: `#E2E8F0` / `#CBD5E1` (WCAG AAA contrast)
  - Muted Text: `#86EFAC` / `#94A3B8`
  - Code / Terminal font elements: JetBrains Mono / monospace.

#### B. Sunset Synthwave 80s (Outrun / Retro Laser Edition)
- **Class Identifier**: `html.theme-synthwave`, `body.theme-synthwave`
- **Backgrounds**:
  - Retro Abyss Base: `#0A0618`
  - Deep Synthwave Indigo / Violet: `#130826` / `#1B0C33`
  - Card Surface Glass: `rgba(24, 11, 46, 0.88)` with `backdrop-filter: blur(16px)`
  - Background Texture: `linear-gradient(180deg, #0A0618 0%, #15092A 50%, #2A083B 100%)` with perspective horizon grid lines `linear-gradient(rgba(255,42,133,0.1) 1px, transparent 1px) 0 0/32px 32px, linear-gradient(90deg, rgba(157,0,255,0.1) 1px, transparent 1px) 0 0/32px 32px`
- **Accent & Neon Palette**:
  - Hot Pink / Magenta Laser (Primary): `#FF2A85`
  - Neon Synth Purple (Secondary): `#9D00FF` / `#A855F7`
  - Sunset Radiant Orange: `#FF7B00` / `#FB923C`
  - Laser Cyan / Sky: `#00F0FF` / `#38BDF8`
  - Chrome Gold: `#FDE047`
- **Borders & Shadows**:
  - Laser Border: `1px solid rgba(255, 42, 133, 0.4)`
  - Active / Glow Border: `1.5px solid #FF2A85`
  - Box Shadow (Glow): `0 0 22px -2px rgba(255, 42, 133, 0.3), 0 0 35px -5px rgba(157, 0, 255, 0.25)`
- **Buttons**:
  - Primary Button: `background: linear-gradient(135deg, #FF2A85 0%, #FF7B00 50%, #9D00FF 100%) !important; color: #FFFFFF !important; font-weight: 900; box-shadow: 0 0 25px rgba(255, 42, 133, 0.5); border: 1px solid #F472B6;`
- **Typography & Contrast**:
  - Headings (`h1, h2, h3, h4, h5, h6`): `#FFFFFF` / `#FFF0F7` (Text-shadow: `0 0 15px rgba(255, 42, 133, 0.4)`)
  - Body Text: `#F1F5F9` / `#E2E8F0` (WCAG AAA contrast)
  - Muted Text: `#F472B6` / `#CBD5E1`

---

## 2. Logic Chain

1. **Root & Scoped CSS Strategy**:
   - Because the application uses Tailwind CDN with inline utility classes (`bg-white`, `text-gray-900`, `dark:bg-[#0B0F19]`), standard CSS inheritance on `:root` variables is not enough to repaint all hardcoded utility classes without breaking non-theme states.
   - Therefore, a scoped override architecture anchored to `html.theme-matrix` / `body.theme-matrix` and `html.theme-synthwave` / `body.theme-synthwave` in `css/style.css` provides 100% theme isolation with zero regression on default mode.

2. **Structural Element Overrides**:
   - Targeting major layout selectors (`aside`, `header`, `main#main-content`, `nav.mobile-nav`, `.glass-panel`, `.glass-panel-strong`, `.interactive-card`, `#settings-panel`, `.study-card`, `.study-controls`, `.arcade-game-btn`, inputs, textareas, tables, `.markdown-body`) guarantees seamless visual transformation across all 9 core UI modules.
   - Forcing high-contrast white text (`color: #ffffff !important` or `#F0FDF4` / `#FFF0F7`) on heading tags, card titles, term labels, and body copy inside `.theme-matrix` and `.theme-synthwave` prevents dark text on dark backgrounds.

3. **Settings Theme Selector (R3)**:
   - In `js/components/usertool.js`, adding a "Giao Diện Ứng Dụng (Theme Picker)" card in Tab 1 (`display`) reads `store.userProfile?.inventory?.unlockedThemes` and `store.userProfile?.equippedTheme` (or `localStorage.getItem('active_theme')`).
   - Clicking a theme card invokes `store.equipTheme(themeId)` (or `store.applyActiveTheme(themeId)`), providing immediate 1-click theme switching without needing to go to LexiStore.

---

## 3. Caveats

- **Tailwind CDN Specificity**: Some components use Tailwind specificity classes (e.g. `dark:bg-[#0B0F19]`, `text-gray-900`). The scoped theme CSS in `css/style.css` must use appropriate specificity (e.g., `html.theme-matrix .glass-panel`, `body.theme-matrix div[...]`) with `!important` where needed to reliably override Tailwind inline utilities.
- **Dynamic Background Uploads**: If the user uploads a custom background image (`localStorage.getItem('app-bg')`), the theme background should respect the overlay blur or provide a subtle theme-tinted backdrop so text remains legible.
- **Sound & Animation Performance**: Glowing drop-shadows and scanline keyframe animations should use GPU-accelerated properties (`opacity`, `transform`, `filter: drop-shadow`, `box-shadow`) and adhere to `prefers-reduced-motion` media queries.

---

## 4. Conclusion

- The application's theme engine in `js/store.js` already has the plumbing for toggling `.theme-matrix` and `.theme-synthwave` on `<html>` and `<body>`.
- The comprehensive overhaul requires:
  1. Complete expansion of `.theme-matrix` and `.theme-synthwave` token and component rules in `css/style.css` covering all layout containers, 3D Flashcards, Arcade Arena, LexiStore, Modals, AI Reading, and Roadmap.
  2. Integration of the Theme Picker in `js/components/usertool.js` (Tab Hiển Thị) to satisfy Requirement R3.
- No database migrations or breaking state changes are needed; this is purely an aesthetic, non-regressive CSS & UI enhancement.

---

## 5. Verification Method

1. **CSS Selector Inspection**:
   - Inspect `css/style.css` to verify token definitions for `.theme-matrix` and `.theme-synthwave`.
2. **Theme Switching Verification**:
   - Switch between Default, Matrix (`theme_matrix`), and Synthwave (`theme_synthwave`) in LexiStore and Settings modal (`UserTool`).
   - Check that `document.documentElement.classList` contains `theme-matrix` or `theme-synthwave` appropriately.
3. **Component Visual Spot-Checks**:
   - Check Sidebar & Topbar (Desktop & Mobile)
   - Check Dashboard & Daily Spark Quotes
   - Check Flashcard Study 3D Flip (Front, Back, Controls)
   - Check Arcade Games (Boss Battle, Cyber Cipher, Matching Game, AI Arena)
   - Check LexiStore & Settings Modal
   - Check AI Reading & Roadmap Markdown views
4. **Console & Regression Verification**:
   - Verify 0 JavaScript errors/exceptions during theme switching.
   - Verify that Default mode remains identical to original design when no theme is equipped.
