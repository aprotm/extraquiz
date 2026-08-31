# Comprehensive Architecture & Codebase Exploration Report

**Date**: 2026-08-31  
**Investigator**: Explorer 1 (`teamwork_preview_explorer`)  
**Target Codebase**: `e:\flashcardbyvanhngo`  
**Milestone**: Investigation & Analysis (R1: Data Sync & Decay Engine; R2: Motivation & Lockdown System)

---

## 1. Executive Summary & Tech Stack Overview

### 1.1 Application Architecture
LexiLearn Pro is an educational SPA with two code layers:
1. **Core Single Page Application (Root Directory)**:
   - **Framework**: Client-side Vue 3 Single Page Application (SPA) running native ES Modules in browser via `<script type="importmap">` in `index.html`.
   - **Styling**: Tailwind CSS (CDN), custom tokens & themes in `css/style.css` (featuring Cyber Matrix Neon and Sunset Synthwave 80s themes), FontAwesome 6, and Google Fonts.
   - **Libraries**: `marked.js` (Markdown parsing), `canvas-confetti` (gamification visuals), `lucide` (icons), `chart.js`.
   - **Backend & Cloud Services**: Firebase 10.8.0 (`firebase/app`, `firebase/auth`, `firebase/firestore`, `firebase/storage`, `firebase/app-check`) configured in `js/firebase-config.js`.
   - **Zero-Build Runtime**: Native browser ES modules without mandatory build step for core SPA.

2. **Dashboard Subsystem (`lexilearn-dashboard/`)**:
   - **Framework**: Next.js 16.2.11 (React 19.2.4), Tailwind CSS v4, Framer Motion, Lucide React, Recharts, Shadcn UI.
   - Configured in `lexilearn-dashboard/package.json`.

3. **Core State Management**:
   - Central reactive store located at `js/store.js` (`export const store = reactive({...})`).
   - Manages user auth state (`store.user`), user profile & gamification (`store.userProfile`), active decks (`store.decks`, `store.activeDeck`, `store.activeCards`), route navigation (`store.currentRoute`, `store.navigate()`), app settings (`store.settings`), themes (`store.applyActiveTheme()`, `store.equipTheme()`), and economy (`store.addLexiCredit()`, `store.buyStoreItem()`).

---

## 2. Deep Dive: Firebase Configuration, Data Sync & Heatmap Data Flow

### 2.1 Firebase Configuration & Security Rules
- **Configuration File**: `js/firebase-config.js`
  - Initializes `app`, `auth`, `db` (Firestore), `storage`.
  - Project ID: `flashcard-for-my-self`.
- **Security Rules**: `firestore.rules`
  - `users/{userId}` allows read/write for owner (`request.auth.uid == userId`) or admin (`test@test.com`).
  - Limits max credit increment per transaction to 100 LC.
  - Prevents modifying `isBanned` / `banUntil` by non-admins.
  - Disallows hard document deletion (`allow delete: if false;`).

### 2.2 Heatmap (Learning Matrix) Data Flow & Root Cause of Data Loss
- **Heatmap Component**: `js/components/lexilearndashboard.js`
  - Computed property `heatmapWeeks` (lines 137–187) iterates over 52 weeks (365 days), matching ISO dates (`YYYY-MM-DD`) against `realStats.history`.
- **Root Causes of Heatmap Data Loss**:
  1. **Local-Only Storage**: In `js/store.js`, `recordStudyActivity(wordsCount, timeMinutes)` only saves study activity to `localStorage.setItem('stats_' + this.user.uid, JSON.stringify(stats))` (lines 102–182).
  2. **No Firestore Sync**: `recordStudyActivity()` never writes `stats` (streak, lastStudyDate, todayWords, history) to Firestore `users/{uid}`.
  3. **No Cold-Start Restoration**: In `js/db.js` (`fetchUserProfile`) and `js/app.js` (`onAuthStateChanged`), the app fetches user profile fields (`lexiCredit`, `totalLexiCredit`, `level`, `badges`, etc.) but never reads or restores `stats` from Firestore.
  4. **Multi-Device / Cache Wipe Failure**: When a user switches browsers, uses incognito, clears site data, or logs in from another device, `localStorage` is empty, causing 100% loss of the 365-day Heatmap and streak history.

---

## 3. Deep Dive: LexiCredit Discrepancy & Strict Firebase Sync Enforcement

### 3.1 LexiCredit State Architecture
- In `js/store.js` & `js/ranks.js`:
  - `userProfile.lexiCredit`: Current spendable LexiCredit balance (used for buying store items, buffs, themes).
  - `userProfile.totalLexiCredit`: Lifetime earned LexiCredit balance (determines Level and Rank tiers; 50 LC per Level).
- **Discrepancy Root Causes**:
  1. **Premature Local State Mutation**: In `js/store.js` (`addLexiCredit`, lines 514–547), `this.userProfile.lexiCredit` and `totalLexiCredit` are mutated immediately in memory before `await updateUserProfile(...)`. If the network is disconnected, offline, or Firebase returns an API error, the in-memory state has updated while Firebase still holds the old balance. Upon page reload, `fetchUserProfile` pulls the old Firestore data, causing an apparent rollback or divergence.
  2. **Missing Error Alerting & Erroneous Persistence**: If `updateUserProfile` fails, no red error toast/banner is shown, and the uncommitted score remains visible until refresh.
  3. **Header vs Profile Visual Sync**:
     - Desktop Sidebar & Mobile Header in `js/app.js` (lines 800, 832) display `store.userProfile?.lexiCredit || 0` (spendable balance).
     - `js/components/profile.js` displays `currentLevelInfo.currentExp / maxExp` (derived from lifetime `totalLexiCredit`) and lacked a dedicated synchronized spendable LexiCredit badge matching the Header.
     - In `js/components/lexilearndashboard.js` (line 1114), the card displayed `{{ store.userProfile?.totalLexiCredit || store.userProfile?.lexiCredit || 1250 }}` with a hardcoded `1250` fallback and conflated lifetime total with spendable credit.

### 3.2 Required Architecture for Strict Firebase Sync
To satisfy Acceptance Criteria R1:
1. **Immediate Dual-Sync with Rollback**:
   - When updating score (`addLexiCredit`) or study activity (`recordStudyActivity`):
     - Store previous state snapshot.
     - Attempt atomic Firestore update via `updateUserProfile(userId, data)`.
     - If sync succeeds: persist to local state/storage.
     - If sync fails (network/API error): immediately rollback in-memory state, display a red error banner (`showToast("Lỗi đồng bộ Firebase: Không thể lưu điểm. Vui lòng thử lại!", "error")`), and do NOT persist erroneous local changes.
2. **Unified Data Model on Firestore**:
   - Store `studyStats: { streak, lastStudyDate, todayWords, history, totalStudyDays }` inside `users/{userId}` doc.
   - `fetchUserProfile` must populate both `store.userProfile` and initialize `stats_${uid}` in `localStorage`.

---

## 4. Deep Dive: Ebbinghaus Memory Curve & HLR Decay Engine

### 4.1 Implementation in `js/memoryengine.js` & `js/components/lexilearndashboard.js`
- **Current Mathematical Model**:
  - Retention Probability: $P(t) = 2^{-\Delta t / h}$, where $\Delta t$ is time elapsed in minutes and $h$ is half-life in minutes.
  - Review Urgency: Mapped around $P(t) = 0.85$.
- **Decay Engine Flaws**:
  1. **Missing Property Support**: In `lexilearndashboard.js` (line 225–228), card timestamps only check `c.last_reviewed_at` or `c.createdAt`. If card data sets `c.lastStudiedDate` or `c.lastStudyDate`, it falls back to `now`, resulting in $\Delta t = 0$ and $P(t) = 1.0$ (100% retention) even after 60 days of inactivity!
  2. **Uncalibrated Default Values**: Fallbacks in `lexilearndashboard.js` returned `avgRetention: 100` and `stabilityScore: 98` when cards or logs were unreviewed.
  3. **Realistic Retention Requirement**: If a user is inactive for 60 days ($\Delta t = 60 \times 1440 = 86,400\text{ min}$), `calculateRetentionProb(halfLife, deltaT_minutes)` and `calculateRetentionRate(card, now)` must drop to $< 20\%$ ($< 0.20$).

---

## 5. Deep Dive: Motivation, Lockdown & Urgency System (R2 Groundwork)

### 5.1 Punishment Engine (Inactivity Penalty)
- **Rules**:
  - When loading the app, if `stats.lastStudyDate` is more than 1 day in the past (e.g. 3 days missed):
    - Streak is reset to `0` (unless Streak Freeze was equipped and consumed).
    - LexiCredit is penalized per missed day (e.g. 10–20 LC deducted per day missed, bounded at $\ge 0$).
    - `totalLexiCredit` is adjusted, Level and Rank are recalculated and downgraded (`normalizeUserStats`).
    - Sync penalty to Firestore immediately.

### 5.2 Mandatory Quota & Lockdown Engine
- **Daily Quota**: Minimum 50 cards per day (`stats.todayWords < 50` $\to$ Lockdown Active).
- **Protected Pro Features**:
  - `reading` (AI Reading Studio)
  - `writing` (Writing Grader)
  - `paraphrase` (Paraphrasing Coach)
  - Arcade games: `boss-battle`, `cyber-cipher`, `ai-arena`, `matching`
- **Interception & Enforced Redirect**:
  - In `store.navigate(route)` and URL hash router:
    - If Lockdown is active and route is a Pro/entertainment feature:
      - Abort navigation.
      - Redirect to study route (`study` or `learn`).
      - Trigger red alert / modal explaining the Lockdown status.

### 5.3 Urgency State UI
- On initial app boot / opening web:
  - If `stats.todayWords < 50`:
    - Display prominent red Urgency Banner / Lockdown Alert: *"Hệ thống đang ở trạng thái Cưỡng chế Học tập (Lockdown): Chưa hoàn thành chỉ tiêu 50 thẻ hôm nay!"*
    - Direct user straight to Flashcard Study.

---

## 6. Existing Tests & Test Runner Infrastructure

### 6.1 Test Suite Overview
- Standalone Node.js test runners in `tests/`:
  - `tests/test_e2e_full_verification.js` (89 assertions across 12 suites)
  - `tests/test_theme_visual_engine.js` (16 assertions)
  - `tests/test_lexistore_usertool_two_way_sync.js` (11 assertions)
  - `tests/test_usertool_theme.js` (7 assertions)
  - `tests/test_store_theme.js` (11 assertions)
  - `tests/test_wcag_contrast_adversarial.js` (65 color pairs)
  - `tests/adversarial_store_stress.test.js` (23 assertions)
  - `tests/adversarial_usertool_stress.test.js` (8 suites)
  - `tests/adversarial_css_style_stress.test.js` (115 assertions)
  - `tests/stress_test_store_theme.js` (6 suites)
- **Execution Method**: Direct invocation with `node tests/<test_script>.js`.
- **Status**: 100% Passing.
- **Strategy for R1 & R2**: We will create comprehensive standalone test scripts (`tests/test_r1_sync_decay.js`, `tests/test_r2_motivation_lockdown.js`, etc.) to verify:
  1. Simulated network failure $\to$ Red warning alert $\to$ No erroneous local state saved.
  2. Header vs Profile LexiCredit synchronization on reload.
  3. 60-day `lastStudiedDate` retention rate $< 20\%$.
  4. 3-day inactivity punishment (Streak = 0, LC deduction, Rank drop).
  5. Lockdown redirection on Pro route access when quota $< 50$.
  6. Red Lockdown urgency warning display.

---

## 7. Recommended Implementation Architecture

| Module | Target Files | Key Changes |
|---|---|---|
| **Data Sync & Firebase Persistence** | `js/db.js`, `js/store.js` | Add `studyStats` to Firestore `users/{uid}`, implement rollback on sync error, trigger red error alert on network failure |
| **LexiCredit & Profile Sync** | `js/store.js`, `js/ranks.js`, `js/components/profile.js`, `js/components/lexilearndashboard.js` | Synchronize spendable LC card on Profile matching Header, remove hardcoded 1250 fallback, enforce atomic updates |
| **HLR Decay Engine** | `js/memoryengine.js`, `js/components/lexilearndashboard.js` | Support `lastStudiedDate` / `last_reviewed_at`, ensure 60-day inactivity yields $< 20\%$ retention rate |
| **Punishment & Inactivity Engine** | `js/store.js`, `js/ranks.js` | Calculate missed days on app load, deduct LC, reset streak to 0, demote rank, persist to Firestore |
| **Lockdown & Route Enforcement** | `js/store.js`, `js/app.js` | Add route guard in `store.navigate()` blocking Pro routes when `todayWords < 50`, redirect to `study`, show red lockdown modal/banner |
| **Automated Verification Suites** | `tests/test_r1_sync_decay.js`, `tests/test_r2_motivation_lockdown.js` | Automated verification of all R1 & R2 acceptance criteria |
