# Handoff Report — Explorer 1

## 1. Observation

### 1.1 Codebase & Tech Stack
- **Architecture**: Zero-build client-side Vue 3 Single Page Application (SPA) using native browser ES Modules loaded via `<script type="importmap">` in `index.html` (lines 57–68) with Tailwind CSS, FontAwesome 6, Marked.js, Canvas Confetti, and Firebase 10.8.0.
- **Secondary Next.js Project**: `lexilearn-dashboard/` with its own `package.json` (Next.js 16.2.11, React 19.2.4, Tailwind v4).
- **Core State Store**: `js/store.js` line 8: `export const store = reactive({...})`.
- **Firebase Configuration**: `js/firebase-config.js` lines 8–15: project `flashcard-for-my-self`.
- **Database Services**: `js/db.js` providing `fetchUserProfile`, `updateUserProfile`, `fetchDecks`, `fetchCards`, `fetchAllUserCards`, `saveNewDeck`, `updateExistingDeck`, `updateCardMemoryState`.

### 1.2 Data Loss on Heatmap (Learning Matrix)
- In `js/store.js` lines 102–182:
  ```javascript
  recordStudyActivity(wordsCount = 1, timeMinutes = 1) {
      if (!this.user) return;
      const key = `stats_${this.user.uid}`;
      let stats = JSON.parse(localStorage.getItem(key) || '{"streak": 0, "lastStudyDate": "", "todayWords": 0, "history": []}');
      ...
      localStorage.setItem(key, JSON.stringify(stats));
  }
  ```
  `recordStudyActivity` writes ONLY to local browser `localStorage.setItem(key, ...)`. It does NOT call `updateUserProfile` or any Firestore API to save `stats` or `history`.
- In `js/db.js` lines 226–258: `fetchUserProfile(userId)` queries `users/{userId}` in Firestore, but does not fetch or restore `stats` or `history`.
- In `js/components/lexilearndashboard.js` lines 136–187: The 365-day Heatmap relies on `realStats.history` from `store.getStudyStats()`, which reads `localStorage`. On a new device or cleared cache, the Heatmap is 100% empty.

### 1.3 LexiCredit Sync & Discrepancies
- In `js/store.js` lines 514–547:
  ```javascript
  this.userProfile.lexiCredit = (this.userProfile.lexiCredit || 0) + finalAmount;
  this.userProfile.totalLexiCredit = Math.max((this.userProfile.totalLexiCredit || 0) + finalAmount, this.userProfile.lexiCredit);
  ...
  await updateUserProfile(this.user.uid, { ... });
  ```
  In-memory `this.userProfile.lexiCredit` is mutated BEFORE awaiting Firestore. If offline or if the API rejects the write, the local state retains the uncommitted balance without displaying any red error alert or rolling back.
- In `js/app.js` lines 800, 832: Header and Sidebar show `store.userProfile?.lexiCredit || 0` (spendable LC).
- In `js/components/profile.js` lines 277–288: Profile shows `currentLevelInfo.currentExp / maxExp EXP` (derived from lifetime `totalLexiCredit`), lacking an explicit synchronized spendable LexiCredit display badge matching Header.
- In `js/components/lexilearndashboard.js` line 1114: `{{ store.userProfile?.totalLexiCredit || store.userProfile?.lexiCredit || 1250 }}` contains a hardcoded `1250` fallback.

### 1.4 Ebbinghaus Decay & Retention Rate
- In `js/memoryengine.js` lines 11–14:
  ```javascript
  export function calculateRetentionProb(halfLife, deltaT_minutes) {
      if (halfLife <= 0) return 0;
      return Math.pow(2, -deltaT_minutes / halfLife);
  }
  ```
- In `js/components/lexilearndashboard.js` lines 225–238:
  ```javascript
  const lastReview = c.last_reviewed_at 
      ? (c.last_reviewed_at.toDate ? c.last_reviewed_at.toDate().getTime() : new Date(c.last_reviewed_at).getTime()) 
      : (c.createdAt ? (c.createdAt.toDate ? c.createdAt.toDate().getTime() : new Date(c.createdAt).getTime()) : now);
  ```
  If a card has `lastStudiedDate` or `lastStudyDate` set to 60 days ago instead of `last_reviewed_at`, `lastReview` defaults to `now`, resetting $\Delta t = 0$ and yielding $P(t) = 1.0$ (100%) instead of $< 20\%$.

### 1.5 Test Infrastructure
- Standalone Node.js test runner in `tests/test_e2e_full_verification.js`.
- Running `node tests/test_e2e_full_verification.js` executes 89 assertions across 12 suites with 100% pass rate.

---

## 2. Logic Chain

1. **Heatmap Data Loss**:
   - `recordStudyActivity()` saves data strictly to `localStorage` (Obs. 1.2).
   - `fetchUserProfile()` in `db.js` never reads or writes `stats` on Firestore (Obs. 1.2).
   - Therefore, any cache wipe, session renewal, or login from another device loses all 365-day history.
   - *Fix*: Store `studyStats` directly inside Firestore `users/{uid}` and sync on every activity.

2. **LexiCredit State Drift & Sync Failures**:
   - `addLexiCredit()` updates in-memory variables prior to database confirmation (Obs. 1.3).
   - If network is disconnected, local in-memory state is altered without server acknowledgment, and no red warning is shown (Obs. 1.3).
   - When refreshed, the application re-fetches the older Firestore state, causing a mismatch between pre-reload and post-reload screens.
   - *Fix*: Implement strict sync with rollback upon network/API failure, display red warning toast/banner, and harmonize Header/Profile spendable and lifetime displays.

3. **Ebbinghaus Decay Calibration**:
   - Time calculations in `lexilearndashboard.js` ignore `lastStudiedDate` and `lastStudyDate`, defaulting to `now` (Obs. 1.4).
   - This prevents old vocabulary from decaying below the mandated 20% mark.
   - *Fix*: Normalize timestamp checking across `lastStudiedDate`, `last_reviewed_at`, and `lastStudyDate` in `memoryengine.js` and `lexilearndashboard.js`, ensuring 60-day inactivity yields $< 20\%$ retention.

4. **Motivation & Lockdown Enforcement**:
   - Inactivity check must compare `today` with `lastStudyDate` on app load; if $> 1$ day has elapsed (e.g. 3 days), deduct LexiCredit, reset Streak to 0, demote Rank, and push to Firestore.
   - `store.navigate()` must inspect `stats.todayWords < 50`; if true, block Pro routes (`reading`, `writing`, `paraphrase`, arcades), redirect to `study`, and display the red Lockdown Urgency Banner.

---

## 3. Caveats

- In `lexilearndashboard/`, a separate Next.js React project is present alongside the root Vue 3 SPA. All active routing and user-facing features described in `PROJECT.md` and `index.html` run via the root Vue 3 SPA (`js/app.js`).
- Firestore security rules currently enforce a max 100 LC increase per client update (`firestore.rules` lines 28–36). Any batch credit modifications must remain within rule thresholds or be applied as delta increments.

---

## 4. Conclusion

The root causes of Heatmap data loss, LexiCredit desynchronization, and unrealistic Ebbinghaus retention curves have been identified with exact line references:
1. Heatmap loss is caused by storing study history only in `localStorage` without Firestore synchronization.
2. LexiCredit desynchronization is caused by eager in-memory mutations without rollback/red error handling on sync failure and disparate balance rendering between Header and Profile.
3. Ebbinghaus curve defect is caused by missing `lastStudiedDate` normalization, causing elapsed time $\Delta t$ to default to 0.
4. Motivation & Lockdown requires an inactivity penalty engine on cold start and route-guard redirection in `store.navigate()`.

---

## 5. Verification Method

To independently verify these findings:
1. **Static Inspection**:
   - View `js/store.js` lines 102–182 to confirm `recordStudyActivity` only writes to `localStorage`.
   - View `js/store.js` lines 514–547 to confirm eager `this.userProfile.lexiCredit` mutation.
   - View `js/components/lexilearndashboard.js` lines 225–238 to confirm date fallback to `now`.
2. **Automated Test Run**:
   - Run `node tests/test_e2e_full_verification.js` to verify existing baseline (89 passing assertions).
