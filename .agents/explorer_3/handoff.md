# Self-Contained Handoff Report: Explorer 3

**Agent**: Explorer 3 (`teamwork_preview_explorer`)  
**Target Path**: `e:\flashcardbyvanhngo\.agents\explorer_3\handoff.md`  
**Milestone**: Investigation & Analysis (Motivation, Punishment, Lockdown, Urgency, Routing)  
**Date**: 2026-08-31  

---

## 1. Observation

1. **Routing System & Architecture**:
   - `index.html` (line 60, 77) mounts a zero-build client-side Vue 3 SPA using ES modules from `js/app.js`.
   - `js/app.js` (lines 134–139) listens to `window.addEventListener('hashchange')` and delegates to `store.navigate(hash)`.
   - `js/store.js` (lines 61–86) defines `store.navigate(route, data)` which directly controls `this.currentRoute = route` and `window.location.hash = route`.
   - `js/app.js` (lines 845–866) conditionally renders components using `v-if / v-else-if="store.currentRoute === '...'"`:
     - `Dashboard` (`'dashboard'`)
     - `LexiLearnDashboard` (`'lexilearn-dashboard'`)
     - `LexiStore` (`'store'`, `'lexistore'`)
     - `DeckDetail` (`'deck-detail'`)
     - `Study` (`'study'`)
     - `Quiz` (`'quiz'`)
     - `Dictation` (`'dictation'`)
     - `Learn` (`'learn'`)
     - `Roadmap` (`'roadmap'`)
     - `Reading` (`'reading'`)
     - `ParaphrasingCoach` (`'paraphrase'`)
     - `WritingGrader` (`'writing'`)
     - `MatchingGame` (`'matching'`)
     - `BossBattle` (`'boss-battle'`)
     - `CyberCipher` (`'cyber-cipher'`)
     - `AiArena` (`'ai-arena'`)
     - `Profile` (`'profile'`)
     - `AdminPanel` (`'admin'`)
     - `Guide` (`'guide'`)
     - `Quotes` (`'quotes'`).

2. **User Profile, Rank, & Level Calculations**:
   - `js/ranks.js` (line 1): `LC_PER_LEVEL = 50`.
   - `js/ranks.js` (lines 31–44): `getLevelFromLifetimeLC(totalLC) = Math.floor(totalLC / 50) + 1` and `getRankFromLevel(level)` mapping across 25 ranks in `RANK_LIST`.
   - `js/ranks.js` (lines 75–92): `normalizeUserStats(profile)` currently enforces `trueLevel = Math.max(parseInt(profile.level) || 1, getLevelFromLifetimeLC(trueTotalLC))` and `levelDerivedTotal = Math.max(0, ((parseInt(profile.level) || 1) - 1) * LC_PER_LEVEL)`. This clamp prevents `level` and `rank` from demoting if `totalLexiCredit` is decreased by punishment.

3. **Study Stats & Activity Logging**:
   - `js/store.js` (lines 102–182): `store.recordStudyActivity(wordsCount, timeMinutes)` stores `streak`, `lastStudyDate`, `todayWords`, and `history` only in `localStorage.getItem('stats_' + user.uid)`.
   - `js/store.js` (lines 471–558): `store.addLexiCredit()` updates `userProfile.lexiCredit`, `totalLexiCredit`, and persists to Firestore `users/{uid}` via `updateUserProfile()`.

4. **Pro & Entertainment Features To Lock**:
   - Pro AI Features: `reading` (AI Reading), `writing` (Essay Grader), `paraphrase` (Paraphrase Coach), `lexilearn-dashboard` (Pro Hub).
   - Entertainment Arcade Games: `boss-battle` (Speed Rush), `cyber-cipher` (Cyber Cipher), `ai-arena` (AI Duel 1v1), `matching` (Matching Game), `store`/`lexistore` (LexiStore).
   - Core Study Modes to keep accessible: `study`, `learn`, `quiz`, `dictation`, `deck-detail`, `dashboard`, `profile`.

---

## 2. Logic Chain

1. **Step 1 (Central Choke Point for Navigation)**:
   - Because both button clicks across all components and browser URL hash changes (`hashchange`) pass through `store.navigate(route, data)`, modifying `store.navigate` provides a 100% airtight Client Route Guard.
   - If a user tries to access any Pro/Arcade route while `todayWords < 50`, `store.navigate` can immediately reject the transition, show a red alert toast/modal, and redirect to `study`.

2. **Step 2 (Missed Days Calculation & Punishment)**:
   - On user login (`onAuthStateChanged` in `app.js`), comparing `stats.lastStudyDate` with `todayISO` (`YYYY-MM-DD`) yields `diffDays`.
   - When `diffDays > 1` (e.g. 3 days absent, `diffDays = 3`), the user missed study days.
   - Applying punishment:
     - Streak is reset to `0` (`stats.streak = 0`).
     - LexiCredit is deducted (`lexiCredit = Math.max(0, lexiCredit - penalty)` and `totalLexiCredit = Math.max(0, totalLexiCredit - penalty)`).
     - Because `normalizeUserStats` in `ranks.js` previously prevented levels from decreasing, removing the upward-only level clamp in `normalizeUserStats` allows `level` to drop to `getLevelFromLifetimeLC(totalLexiCredit)` and `rank` to demote to `getRankFromLevel(newLevel).title`.
     - An idempotence check (`lastPunishedDate = todayISO`) ensures punishment is executed exactly once per day.
     - Profile changes are synchronized immediately to Firestore `users/{uid}`.

3. **Step 3 (Lockdown & Urgency State)**:
   - When `todayWords < 50`, the system is in `LOCKDOWN` state.
   - On app boot, a continuous red alert modal is displayed, warning the user that non-study features are blocked until 50 cards are completed, with a primary CTA button taking them directly to `study`.
   - A persistent red urgency bar in the header shows real-time progress (`X / 50 cards`).
   - Once `todayWords >= 50`, lockdown state is lifted and Pro features are unlocked.

---

## 3. Caveats

- **No Caveats**: The codebase architecture is fully inspected, and exact lines for all guards, data structures, and formulas have been identified.

---

## 4. Conclusion

- **Punishment System**: Implement `checkMissedDaysAndPunish()` on app boot in `store.js` / `app.js`, fix `normalizeUserStats` in `ranks.js` to enable rank demotion upon credit deduction, reset streak to 0 on 3-day absence, and sync immediately to Firestore.
- **Lockdown System**: Add route guard inside `store.navigate()` in `js/store.js` protecting all 9 Pro and Arcade routes until `todayWords >= 50`.
- **Urgency State**: Add a red alert modal on cold start and forced redirect to `study` mode, plus a sticky top urgency status bar.

---

## 5. Verification Method

1. **Automated Unit & Scenario Tests (Node.js)**:
   - Create `tests/test_motivation_lockdown_punishment.js`.
   - Test 1: Simulate 3-day absence (`lastStudyDate` = 3 days ago). Verify on boot: `streak === 0`, `lexiCredit` deducted, `rank` demoted from higher rank to lower rank.
   - Test 2: Simulate `todayWords = 10` (< 50). Call `store.navigate('reading')`. Verify returned route is redirected to `'study'`, and lockdown event is emitted.
   - Test 3: Simulate `todayWords = 50`. Call `store.navigate('reading')`. Verify navigation succeeds to `'reading'`.
   - Run command: `node tests/test_motivation_lockdown_punishment.js`.

2. **Browser End-to-End Verification**:
   - Start local web server via `Run_Web_LexiLearn.bat` or `python -m http.server 5500`.
   - Open browser at `http://localhost:5500`.
   - Verify red urgency alert modal on load when quota is not met.
   - Click Pro features (Đọc hiểu AI, Arcade Games) and verify forced redirect to Study mode.
