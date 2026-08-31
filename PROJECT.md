# Project: LexiLearn Motivation & Data Integrity System

## Architecture
- **Client Application**: Vue 3 SPA using native browser ES Modules loaded via `<script type="importmap">` in `index.html`.
- **Global State & Navigation Choke Point**: `js/store.js` (`store` reactive state, `store.navigate(route, data)` route guard).
- **Backend & Database**: Firebase 10.8.0 (Firestore `users/{userId}`, `decks/{deckId}`, `cards/{cardId}`).
- **Memory Decay Engine**: `js/memoryengine.js` (Half-Life Regression & Ebbinghaus Forgetting Curve).
- **Ranks & Level System**: `js/ranks.js` (25 ranks, XP/Level progression, level demotion on credit deduction).
- **UI Components**:
  - `js/app.js`: Root Vue component, topbar header with synchronized LC balance, route views, red urgency banner.
  - `js/components/lexilearndashboard.js`: Heatmap calendar, retention rate graph, memory decay statistics.
  - `js/components/profile.js`: User profile, synchronized spendable LexiCredit badge, rank display.
  - `js/components/study.js`: Flashcard learning mode, daily quota progress tracker.
  - `js/components/lockdown_modal.js` (or integrated in `app.js`): Red urgency lockdown modal.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Firebase Strict Sync & Red Error Alert | Immediate Firestore sync for Heatmap study stats and LexiCredit. Rollback in-memory state on sync failure and show red warning modal/banner. Synchronize Header and Profile spendable LexiCredit display. | M1 | ORIGINAL_REQUEST §R1 |
| F2 | Ebbinghaus Decay 60-Day Fix | Add inactivity stability attenuation to HLR decay engine, normalize `lastStudiedDate` / `last_reviewed_at`, ensure 60-day inactivity drops retention rate below 20% while keeping $R(h)=0.5$ and $R(0)=1.0$. | M2 | ORIGINAL_REQUEST §R1 |
| F3 | Motivation Punishment Engine | On app boot, detect missed study days (e.g. 3 days absent). Reset streak to 0, deduct LexiCredit, demote Rank by fixing `normalizeUserStats` level clamp, and sync immediately to Firestore with daily idempotence. | M3 | ORIGINAL_REQUEST §R2 |
| F4 | Pro & Arcade Route Lockdown | Intercept navigation in `store.navigate()`. If `todayWords < 50`, lock Pro AI routes (`reading`, `writing`, `paraphrase`, `lexilearn-dashboard`) and arcade games, forcing redirect to `study`. | M4 | ORIGINAL_REQUEST §R2 |
| F5 | Urgency Red Alert UI & Status Bar | Display continuous red urgency modal on app boot when daily quota is not met, topbar sticky red urgency counter, and clear lockdown warning banner. | M4 | ORIGINAL_REQUEST §R2 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Firebase Strict Sync & LexiCredit / Heatmap Integrity | F1: `js/store.js`, `js/db.js`, `js/components/profile.js`, `js/components/lexilearndashboard.js`, `js/app.js` | none | PLANNED |
| M2 | Ebbinghaus Memory Curve & HLR 60-Day Decay | F2: `js/memoryengine.js`, `js/components/lexilearndashboard.js`, `js/components/study.js` | none | PLANNED |
| M3 | Motivation Punishment Engine & Rank Demotion | F3: `js/ranks.js`, `js/store.js`, `js/app.js` | M1 | PLANNED |
| M4 | Pro Feature Lockdown & Urgency Red Alert System | F4, F5: `js/store.js`, `js/app.js`, UI modal & banner | M3 | PLANNED |
| M5 | Final E2E Test Suite & Adversarial Hardening | Pass 100% E2E test suite (Tiers 1-4) + Tier 5 adversarial stress testing + Forensic Audit | M1, M2, M3, M4 | PLANNED |

## Code Layout
- `js/store.js`: Global reactive store, `recordStudyActivity()`, `addLexiCredit()`, `checkMissedDaysAndPunish()`, `store.navigate()` route guard.
- `js/db.js`: Firestore CRUD functions, `fetchUserProfile()`, `updateUserProfile()`, `saveStudyStats()`.
- `js/ranks.js`: Rank calculations, `normalizeUserStats()`, dynamic level/rank demotion.
- `js/memoryengine.js`: `calculateRetentionProb()`, `calculateRetentionRate()`, `resolveCardLastStudied()`.
- `js/app.js`: Top-level app, urgent alert modal, red urgency top banner, route mounting.
- `js/components/profile.js`: Profile view with synchronized spendable LexiCredit.
- `js/components/lexilearndashboard.js`: Heatmap calendar, Ebbinghaus memory curve SVG chart.
- `tests/`: Automated test suites for all milestones and E2E verification.

## Interface Contracts
### `store.recordStudyActivity(wordsCount, timeMinutes)`
- Input: `wordsCount: number`, `timeMinutes: number`
- Behavior: Updates local stats AND immediately awaits `updateUserProfile(uid, { studyStats })`. On error, displays red alert and rolls back local stats.

### `store.addLexiCredit(amount, reason)`
- Input: `amount: number`, `reason: string`
- Behavior: Sends write to Firestore first; on success updates state; on error shows red alert and preserves true server state.

### `calculateRetentionRate(cardOrDate, now)`
- Input: `cardOrDate: object | Date | string | number`, `now?: number`
- Output: `number` between 0.0 and 1.0. For `lastStudiedDate` 60 days in past, returns $< 0.20$.

### `store.checkMissedDaysAndPunish()`
- Input: None (invoked during `onAuthStateChanged`)
- Behavior: Compares `stats.lastStudyDate` with today. If $\ge 2$ days difference, resets streak to 0, deducts LC per missed day, demotes rank, sets `lastPunishedDate = today`, and syncs to Firestore.

### `store.navigate(route, data)`
- Input: `route: string`, `data?: any`
- Behavior: If `todayWords < 50` and `route` is in `LOCKED_PRO_ROUTES`, displays Lockdown Red Modal, redirects to `'study'`.
