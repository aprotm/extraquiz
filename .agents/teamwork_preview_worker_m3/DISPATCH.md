## 2026-08-25T00:56:46Z
You are Worker for Milestone 3: Cyber Matrix Neon & Sunset Synthwave 80s VIP Visual Overhaul Engine.
Working directory: e:/flashcardbyvanhngo/.agents/teamwork_preview_worker_m3/
Please read ORIGINAL_REQUEST.md at e:/flashcardbyvanhngo/.agents/ORIGINAL_REQUEST.md, PROJECT.md at e:/flashcardbyvanhngo/PROJECT.md, and Explorer 1 Survey Report at e:/flashcardbyvanhngo/.agents/teamwork_preview_explorer_survey_1/handoff.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
You exclusively own `css/style.css`.

Task:
Implement the comprehensive, VIP-tier scoped CSS Visual Overhaul Engine for both Cyber Matrix Neon and Sunset Synthwave 80s in `css/style.css`:

1. Cyber Matrix Neon Theme Engine (`html.theme-matrix`, `body.theme-matrix`):
   - Palette: Deep Obsidian (`#040810`, `#08101E`, `rgba(6,13,24,0.92)`), Cyber Emerald Neon (`#00FF9D`, `#059669`, `#10B981`, `#34D399`), Cyan accents (`#00E5FF`).
   - Ambient visual texture: Circuit matrix grid / scanline particle background (`radial-gradient(circle, rgba(0, 255, 157, 0.09) 1px, transparent 1px) 0 0/28px 28px, linear-gradient(to bottom, #040810 0%, #060e1c 100%)`).
   - Glow effects: Fluorescent emerald neon borders (`1px solid rgba(0, 255, 157, 0.35)` / `box-shadow: 0 0 20px -2px rgba(0, 255, 157, 0.25)`).
   - Chrome neon buttons: Emerald-to-green gradients, high-voltage borders, glowing hover states.
   - Comprehensive module skins:
     * App Shell, Sidebar (`aside`), Mobile Nav & Topbar Header
     * Dashboard cards, stats, score rings, Daily Spark widget
     * Flashcard Study 3D Flip (`.study-card`, `.card-face-front`, `.card-face-back`, `.flashcard-term`, `.study-controls`, feedback buttons)
     * Arcade Arena: Speed Boss Battle (HP bar, boss HUD, skill buttons), Cyber Cipher (terminal letter tiles & slots), Matching Game (3D tiles & glowing match feedback), AI Arena (battle HUD & chat bubbles)
     * LexiStore: Store cards, category pills, legendary rarity badges, LC wallet
     * Modals: `#settings-panel`, Level Up dialog, input fields, select dropdowns
     * AI Modules: Reading Studio, Roadmap timeline nodes, Markdown body (`.markdown-body`)
   - High-contrast typography: Headers `#FFFFFF` / `#F0FDF4`, Body `#E2E8F0` / `#CBD5E1` (WCAG AAA >= 7:1).

2. Sunset Synthwave 80s Theme Engine (`html.theme-synthwave`, `body.theme-synthwave`):
   - Palette: Retro Abyss (`#0A0618`, `#130826`, `#1B0C33`), Hot Pink/Magenta Laser (`#FF2A85`), Neon Synth Purple (`#9D00FF`, `#A855F7`), Sunset Radiant Orange (`#FF7B00`, `#FB923C`), Laser Cyan (`#00F0FF`).
   - Ambient visual texture: Perspective synthwave horizon grid texture (`linear-gradient(180deg, #0A0618 0%, #15092A 50%, #2A083B 100%)` with dual-color grid lines).
   - Glow effects: Radiant laser borders (`1px solid rgba(255, 42, 133, 0.4)` / `box-shadow: 0 0 22px -2px rgba(255, 42, 133, 0.3), 0 0 35px -5px rgba(157, 0, 255, 0.25)`).
   - Chrome laser buttons: Sunset tri-gradient (`linear-gradient(135deg, #FF2A85 0%, #FF7B00 50%, #9D00FF 100%)`).
   - Comprehensive module skins across all 9 modules above.
   - High-contrast typography: Headers `#FFFFFF` / `#FFF0F7`, Body `#F1F5F9` / `#E2E8F0` (WCAG AAA >= 7:1).

3. Quality & Non-Regression:
   - Scoped strictly under `html.theme-matrix, body.theme-matrix` and `html.theme-synthwave, body.theme-synthwave`.
   - Default theme must remain 100% untouched.
   - Ambient backgrounds must use `pointer-events: none` so no clicks are blocked.
   - Animations must be hardware-accelerated.

4. Create automated validation script in `tests/test_theme_visual_engine.js` verifying:
   - Complete CSS token definitions for both Matrix and Synthwave.
   - Complete selector coverage for all 9 UI modules.
   - Color contrast luminance ratios exceeding WCAG AA (4.5:1) and AAA (7:1).
   - Preservation of existing theme-handdrawn and default styles.
5. Run the test script and ensure 100% passing.
6. Write your complete handoff report to `e:/flashcardbyvanhngo/.agents/teamwork_preview_worker_m3/handoff.md` and report back with send_message.
