## 2026-08-25T00:46:18Z

You are Worker for Milestone 2: Quick Theme Selector in Settings (UserTool) & LexiStore Sync.
Working directory: e:/flashcardbyvanhngo/.agents/teamwork_preview_worker_m2/
Please read ORIGINAL_REQUEST.md at e:/flashcardbyvanhngo/.agents/ORIGINAL_REQUEST.md and PROJECT.md at e:/flashcardbyvanhngo/PROJECT.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
You exclusively own `js/components/usertool.js`.

Task:
1. Examine `js/components/usertool.js`.
2. In the `display` (Hiển thị) tab, implement a VIP Quick Theme Selector (Theme Picker):
   - 3 Themes:
     1. `'default'`: "Chuẩn Gốc (Default Light/Glass)" - Icon: `fa-palette`, visual preview swatch (Slate / Sky gradient), always unlocked.
     2. `'theme_matrix'`: "Cyber Matrix Neon" - Icon: `fa-terminal`, visual preview swatch (Deep Obsidian #040810 with Emerald Neon #00FF9D border & text), 1800 LC.
     3. `'theme_synthwave'`: "Sunset Synthwave 80s" - Icon: `fa-sun`, visual preview swatch (Abyss #0A0618 with Hot Pink #FF2A85 / Purple #9D00FF / Orange #FF7B00 gradient), 2400 LC.
   - Status & Actions:
     - For active theme: show glowing "Đang Dùng" (Active) badge.
     - For unlocked (or admin): show "Áp Dụng" button that calls `store.equipTheme(themeId)` with instant reactive activation.
     - For locked: show "🔒 Mở Khóa" button that navigates/opens LexiStore (`store.navigate('store')` or emits store open).
   - Ensure mobile responsiveness, elegant layout, and zero regression on other UserTool tabs (`audio`, `game`, `ai`).
3. Create automated unit / integration test in `tests/test_usertool_theme.js` to verify:
   - Theme options definition and availability.
   - Dynamic unlocking check (unlockedThemes, admin bypass, default always unlocked).
   - Instant equip execution and reactive active state reflection.
4. Execute tests via node/command and ensure passing.
5. Write your complete handoff report to `e:/flashcardbyvanhngo/.agents/teamwork_preview_worker_m2/handoff.md` and report back with send_message.
