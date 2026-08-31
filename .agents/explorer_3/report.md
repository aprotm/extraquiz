# Comprehensive Investigation Report: Motivation, Punishment, Lockdown & Routing Systems

**Agent**: Explorer 3 (`teamwork_preview_explorer`)  
**Workspace**: `e:\flashcardbyvanhngo`  
**Date**: 2026-08-31  

---

## 1. Executive Summary

This report delivers a full architectural analysis of the user profile, progression, streak, credit accounting, missed study day detection, punishment mechanics, lockdown system, urgency alerts, and routing mechanisms in the **LexiLearn Pro** web platform.

The core application is a **zero-build client-side Vue 3 Single Page Application (SPA)** using native ES modules, Tailwind CSS CDN, FontAwesome 6, and Firebase 10.8.0 Firestore/Auth. Routing is implemented via reactive hash routing (`window.location.hash` and `store.currentRoute`).

---

## 2. Existing System Architecture & State Management

### 2.1 User Profile Schema & Firestore Integration
User profile records are loaded on authentication in `js/app.js` (`onAuthStateChanged`) via `fetchUserProfile(userId)` in `js/db.js`, fetching from Firestore collection `users/{uid}`.

**Current Profile Schema (`store.userProfile` & Firestore `users/{uid}`):**
```javascript
{
    level: 1,                          // Integer calculated from lifetime LexiCredit (50 LC/level)
    rank: 'Mầm Non Ngôn Ngữ',          // Title string matching RANK_LIST in js/ranks.js
    lexiCredit: 0,                     // Current spendable currency
    totalLexiCredit: 0,                // Lifetime cumulative LexiCredit earned
    dailyCreditEarned: 0,              // Daily earned credit tracker (Cap: 200)
    lastCreditDate: 'YYYY-MM-DD',      // Date string of last credit earning
    badges: [],                        // Array of unlocked badge IDs (js/badges.js)
    equippedBadge: null,               // Equipped badge ID
    equippedTheme: 'default',          // Active theme ('default', 'theme_matrix', 'theme_synthwave')
    equippedAvatarFrame: null,         // Active cosmetic avatar frame
    inventory: {                       // Owned virtual items & buffs
        streakFreezes: 0,
        activeBoosters: [],
        aiHints: 0,
        unlockedThemes: [],
        unlockedDecks: [],
        unlockedFrames: []
    },
    transactions: [],                  // Purchase history log
    geminiApiKey: '',                  // User-configured Gemini API Key
    isBanned: false,                   // Account ban status
    banUntil: null                     // Ban expiration timestamp
}
```

### 2.2 Rank & Level Mechanics (`js/ranks.js`)
- **Scaling Metric**: `LC_PER_LEVEL = 50` (50 lifetime LexiCredit per level).
- **Level Formula**: `getLevelFromLifetimeLC(totalLC) = Math.floor(totalLC / 50) + 1`.
- **Rank Hierarchy**: 25 distinct ranks defined in `RANK_LIST`:
  - Levels 1–9: *Mầm Non Ngôn Ngữ* (Sprout)
  - Levels 10–19: *Kẻ Nhặt Con Chữ* (Search)
  - Levels 20–34: *Kẻ Săn Từ Vựng* (Bullseye)
  - ... up to Level 2000+: *Singularity - Điểm Kỳ Dị Tri Thức*.
- **`normalizeUserStats(profile)` in `js/ranks.js` (Lines 75–92)**:
  - *Current behavior*:
    ```javascript
    const spendable = Math.max(0, parseInt(profile.lexiCredit) || 0);
    const existingTotal = Math.max(0, parseInt(profile.totalLexiCredit) || 0);
    const levelDerivedTotal = Math.max(0, ((parseInt(profile.level) || 1) - 1) * LC_PER_LEVEL);
    
    const trueTotalLC = Math.max(existingTotal, spendable, levelDerivedTotal);
    const trueLevel = Math.max(parseInt(profile.level) || 1, getLevelFromLifetimeLC(trueTotalLC));
    const trueRankObj = getRankFromLevel(trueLevel);
    ```
  - **CRITICAL FINDING FOR PUNISHMENT / DEMOTION**:
    `Math.max(parseInt(profile.level) || 1, ...)` and `levelDerivedTotal` prevent `level` and `rank` from dropping if `totalLexiCredit` is penalized. To allow rank demotion during punishment, `normalizeUserStats` must derive `level` directly from `totalLexiCredit` rather than clamping against the previous `profile.level`.

### 2.3 Streaks, Study Activity & Heatmap Logging (`js/store.js`)
Currently, study statistics are stored in `localStorage` under `stats_${uid}` via `store.recordStudyActivity(wordsCount, timeMinutes)`:
- `stats.streak`: Consecutive days studied.
- `stats.lastStudyDate`: Last study date in `YYYY-MM-DD` ISO format.
- `stats.todayWords`: Count of cards/words studied today.
- `stats.history`: Array of `{ date: 'YYYY-MM-DD', words: N }` for up to 400 days (powering the 365-day heatmap and 7-day velocity chart in `lexilearndashboard.js` and `dashboard.js`).
- **PROBLEM**: `stats_${uid}` is currently stored only in browser `localStorage`. To fulfill R1 and R2 strict requirements, stats must be synchronized to Firestore (`study_stats/{uid}` or inside `users/{uid}`) immediately on study activity.

---

## 3. Missed Study Days Detection & Punishment System

### 3.1 Detection Mechanism on App Boot
- **Location**: In `js/app.js` during `onAuthStateChanged` after `fetchUserProfile` loads, or inside `store.initializeSession(user)`.
- **Date Comparison Formula**:
  ```javascript
  const todayISO = store.getTodayDateStr(); // 'YYYY-MM-DD'
  const lastStudyDate = stats.lastStudyDate; // 'YYYY-MM-DD'
  
  if (lastStudyDate && lastStudyDate !== todayISO) {
      const [y1, m1, d1] = lastStudyDate.split('-').map(Number);
      const [y2, m2, d2] = todayISO.split('-').map(Number);
      const lastStudyUTC = Date.UTC(y1, m1 - 1, d1);
      const todayUTC = Date.UTC(y2, m2 - 1, d2);
      const diffDays = Math.round((todayUTC - lastStudyUTC) / (24 * 60 * 60 * 1000));
      
      if (diffDays > 1) {
          const missedDays = diffDays - 1; // e.g. diffDays = 3 => missedDays = 2 intermediate days or 3 days inactive
          // Trigger Punishment Engine
      }
  }
  ```

### 3.2 Punishment Mechanics (The 3 Penalties)
When `diffDays >= 2` (user missed 1 or more study days, e.g. 3 days absent):

1. **Streak Destruction**:
   - If user has `inventory.streakFreezes > 0`, consume 1 freeze per missed day to preserve streak.
   - If no freeze available: `stats.streak = 0`.
2. **LexiCredit Deduction**:
   - Deduct penalty per missed day (e.g. `PENALTY_PER_DAY = 30` or `50` LC).
   - E.g. for 3 days absence: `totalPenalty = 3 * PENALTY_PER_DAY = 150` LC.
   - Spendable balance: `profile.lexiCredit = Math.max(0, profile.lexiCredit - totalPenalty)`.
   - Cumulative balance: `profile.totalLexiCredit = Math.max(0, profile.totalLexiCredit - totalPenalty)`.
3. **Rank Demotion**:
   - Recalculate level: `profile.level = Math.max(1, getLevelFromLifetimeLC(profile.totalLexiCredit))`.
   - Recalculate rank: `profile.rank = getRankFromLevel(profile.level).title`.
4. **Idempotence & Anti-Double-Punishment Guard**:
   - Store `profile.lastPunishedDate = todayISO` in Firestore and `stats.lastPunishedDate = todayISO` locally.
   - If user reloads the page multiple times on the same day without studying, punishment is NOT applied again.
5. **Immediate Firestore Persistence**:
   - Update Firestore `users/{uid}` immediately.
   - If Firestore update fails, display red error banner and request retry.

---

## 4. Lockdown System for Pro Features

### 4.1 Daily Quota Threshold
- Minimum Quota: `DAILY_QUOTA = 50` cards (or `store.settings.dailyTarget || 50`).
- Progress: `todayWords = store.getStudyStats()?.todayWords || 0`.
- Quota Status:
  - `isDailyQuotaCompleted = (todayWords >= 50)`
  - `remainingCards = Math.max(0, 50 - todayWords)`

### 4.2 Pro & Entertainment Feature Inventory (Locked when `todayWords < 50`)

| Feature | Route | Component | Choke Point |
|---|---|---|---|
| **AI Reading Studio** | `reading` | `js/components/reading.js` | `store.navigate('reading')` & `#reading` |
| **AI Writing Grader** | `writing` | `js/components/writinggrader.js` | `store.navigate('writing')` & `#writing` |
| **Paraphrase AI Coach** | `paraphrase` | `js/components/paraphrasingcoach.js` | `store.navigate('paraphrase')` & `#paraphrase` |
| **Lexi Pro Hub** | `lexilearn-dashboard` | `js/components/lexilearndashboard.js` | `store.navigate('lexilearn-dashboard')` & `#lexilearn-dashboard` |
| **Boss Battle Arcade** | `boss-battle` | `js/components/bossbattle.js` | `store.navigate('boss-battle')` & `#boss-battle` |
| **Cyber Cipher Arcade** | `cyber-cipher` | `js/components/cybercipher.js` | `store.navigate('cyber-cipher')` & `#cyber-cipher` |
| **AI Arena 1v1** | `ai-arena` | `js/components/aiarena.js` | `store.navigate('ai-arena')` & `#ai-arena` |
| **Matching Game** | `matching` | `js/components/matchinggame.js` | `store.navigate('matching')` & `#matching` |
| **LexiStore** | `store` / `lexistore` | `js/components/lexistore.js` | `store.navigate('store')` & `#store` |

### 4.3 Core Study Features (Permitted & Prioritized during Lockdown)
- `study` (`Study.js` - 3D Flip Flashcard SRS)
- `learn` (`Learn.js` - Multiple Choice Learning)
- `quiz` (`Quiz.js` - Speed Quiz)
- `dictation` (`Dictation.js` - Listening Dictation)
- `deck-detail` (`DeckDetail.js` - Deck overview and study launcher)
- `dashboard` (`Dashboard.js` - Displays Red Lockdown Alert Banner)
- `profile` (`Profile.js` - Account view)

---

## 5. Urgency State: Continuous Red Alert & Forced Redirect

### 5.1 Urgency Behaviors
1. **Cold-Start App Load Check**:
   - If `!store.isDailyQuotaCompleted()` on app load:
     - Trigger **Red Alert Modal / Urgency Popup**: A high-priority modal with red strobe glow, siren icon, displaying:
       - `🚨 TRẠNG THÁI KHẨN CẤP: LOCKDOWN ĐANG KÍCH HOẠT`
       - `Bạn chưa hoàn thành nhiệm vụ tối thiểu hôm nay (Đã học: ${todayWords}/50 thẻ). Mọi tính năng giải trí và AI Pro đều bị phong tỏa!`
       - Action button: **"CƯỠNG CHẾ VÀO HỌC NGAY"** (`VÀO HỌC NGAY`) -> redirects directly to `study` mode.
2. **Forced Redirect on Pro Navigation**:
   - If user attempts to enter any Pro or Arcade route (via clicking buttons or typing `#reading` in browser address bar):
     - Navigation guard intercepts request.
     - Displays red alert toast / modal: `⛔ TRUY CẬP BỊ TỪ CHỐI! Hoàn thành đủ 50 thẻ học để mở khóa tính năng này.`
     - Forces immediate redirect to `study` (or `deck-detail` if cards need selection).
3. **Sticky Topbar Urgency Bar**:
   - Renders at top of the screen:
     `🚨 LOCKDOWN ACTIVE: Hoàn thành 50 thẻ để mở khóa AI & Game. [Tiến độ: ${todayWords}/50 thẻ]` with a pulse effect.

---

## 6. Routing Mechanism & Navigation Guard Architecture

### 6.1 Routing Model
The application uses Vue 3 client-side hash routing (`window.location.hash` and `store.currentRoute`).

```
User Action (Click button / URL hashchange)
                    │
                    ▼
          `store.navigate(route, data)`
                    │
   ┌────────────────┴────────────────┐
   ▼                                 ▼
Admin Check Guard            Lockdown & Quota Guard
(if route === 'admin')       (if PRO_ROUTES.includes(route))
   │                                 │
   │ Is user admin?                  │ Is todayWords >= 50?
   ├── No ──> Redirect 'dashboard'   ├── No ──> Block, Show Red Alert Modal,
   └── Yes ─> Allow                  │          Redirect to 'study'
                                     └── Yes ─> Allow navigation
                                                 │
                                                 ▼
                                     Set `store.currentRoute = route`
                                     Set `window.location.hash = route`
                                     Vue App dynamically renders Component
```

### 6.2 Implementation Blueprint for `store.navigate`

```javascript
const PRO_ROUTES = [
    'reading', 'writing', 'paraphrase', 'lexilearn-dashboard', 
    'boss-battle', 'cyber-cipher', 'ai-arena', 'matching', 'store', 'lexistore'
];

navigate(route, data = null) {
    // 1. Admin Guard
    if (route === 'admin' && this.user?.email !== 'test@test.com' && !this.userProfile?.isAdmin && this.userProfile?.role !== 'admin') {
        this.currentRoute = 'dashboard';
        window.location.hash = 'dashboard';
        return;
    }

    // 2. Lockdown / Daily Quota Guard
    const stats = this.getStudyStats() || { todayWords: 0 };
    const isQuotaMet = (stats.todayWords || 0) >= 50;

    if (PRO_ROUTES.includes(route) && !isQuotaMet) {
        if (window.showToast) {
            window.showToast("🚨 KHÓA TÍNH NĂNG: Bạn cần hoàn thành tối thiểu 50 thẻ học hôm nay!", 'error');
        }
        window.dispatchEvent(new CustomEvent('lockdown-urgency-alert', {
            detail: { todayWords: stats.todayWords || 0, target: 50, attemptedRoute: route }
        }));
        
        // Auto-select deck if needed and redirect to study
        if (!this.activeCards || this.activeCards.length === 0) {
            if (this.decks && this.decks.length > 0) {
                this.activeDeck = this.decks[0];
                this.activeCards = this.decks[0].cards || [];
            }
        }
        
        route = (this.activeCards && this.activeCards.length > 0) ? 'study' : 'deck-detail';
        this.currentRoute = route;
        window.location.hash = route;
        return;
    }

    // 3. Normal Route Handling
    if (route === 'study' && (!this.activeCards || this.activeCards.length === 0)) {
        if (this.decks && this.decks.length > 0) {
            this.activeDeck = this.decks[0];
            this.activeCards = this.decks[0].cards || [];
        } else {
            route = 'dashboard';
        }
    }
    if (route === 'deck-detail' && !this.activeDeck && !data) {
        route = 'dashboard';
    }

    if (data && route === 'deck-detail') this.activeDeck = data;
    if (data && route === 'edit-deck') this.editDeckData = data;
    
    this.currentRoute = route;
    window.location.hash = route;
}
```

---

## 7. Synthesis & Concrete Implementation Plan

### Step-by-Step Implementation Map for Builders:

1. **`js/ranks.js` Fix**:
   - Update `normalizeUserStats` so that when `profile.totalLexiCredit` is reduced by penalty, `profile.level` and `profile.rank` accurately demote downwards instead of being pinned to old level values.

2. **`js/store.js` Enhancement**:
   - Add `checkMissedDaysAndPunish()` method on boot.
   - Add `isDailyQuotaCompleted()` and `getRemainingDailyQuota()` helper methods.
   - Update `navigate()` with the Lockdown Guard.
   - Ensure `recordStudyActivity()` updates both `localStorage` and syncs stats to Firestore.

3. **`js/app.js` Updates**:
   - Call `store.checkMissedDaysAndPunish()` in `onAuthStateChanged`.
   - Add `UrgencyModal` / Lockdown Alert Modal component to app template.
   - Add sticky red Lockdown status bar when in urgency state.

4. **UI Visual Lock Indicators**:
   - In `js/components/dashboard.js`, `js/components/deckdetail.js`, `js/components/lexilearndashboard.js`:
     - Show lock badges (`🔒 Khóa`) on Pro cards when daily quota is unmet.

5. **Automated Verification Script (`tests/test_motivation_lockdown_punishment.js`)**:
   - Simulate 3-day absence -> verify credit penalty, streak reset to 0, rank demotion.
   - Simulate navigating to `#reading` when quota < 50 -> verify navigation interception & redirect to `study`.
   - Verify quota completion at 50 cards -> verify unlock of Pro features.

---
*Report completed by Explorer 3.*
