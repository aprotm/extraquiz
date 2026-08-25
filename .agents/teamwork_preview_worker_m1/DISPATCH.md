## 2026-08-25T00:35:38Z
You are Worker for Milestone 1: State & Theme Engine Hardening.
Working directory: e:/flashcardbyvanhngo/.agents/teamwork_preview_worker_m1/
Please read ORIGINAL_REQUEST.md at e:/flashcardbyvanhngo/.agents/ORIGINAL_REQUEST.md and PROJECT.md at e:/flashcardbyvanhngo/PROJECT.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
You exclusively own `js/store.js`.

Task:
1. Examine `js/store.js` around `applyActiveTheme()` and `equipTheme()`.
2. Enhance `equipTheme(themeId)`:
   - Allow `'default'` or empty theme without throwing "Bạn chưa sở hữu giao diện này!". Only enforce ownership check if `themeId && themeId !== 'default'`.
   - Support toggling or explicit setting of `themeId`.
   - Update `this.userProfile.equippedTheme = newTheme`.
   - Call `this.applyActiveTheme(newTheme)`.
   - If user is logged in, persist to Firestore.
3. Enhance `applyActiveTheme(themeId)`:
   - Determine target theme: `themeId || this.userProfile?.equippedTheme || localStorage.getItem('active_theme') || 'default'`.
   - Cleanly remove `'theme-matrix'` and `'theme-synthwave'` from both `document.documentElement` and `document.body`.
   - If target is `'theme_matrix'` or contains `'matrix'`, add `'theme-matrix'` class to both `document.documentElement` and `document.body`.
   - If target is `'theme_synthwave'` or contains `'synthwave'`, add `'theme-synthwave'` class to both `document.documentElement` and `document.body`.
   - Persist to `localStorage.setItem('active_theme', targetTheme)`.
4. Add cold-boot anti-flicker invocation:
   - At the bottom of `js/store.js` or during initialization, ensure `store.applyActiveTheme()` is called immediately if running in a browser environment (`typeof window !== 'undefined' && typeof document !== 'undefined'`).
5. Verify syntax and logic thoroughly (e.g. check for any JS syntax errors).
6. Write your complete handoff report to `e:/flashcardbyvanhngo/.agents/teamwork_preview_worker_m1/handoff.md` and report back with send_message.
