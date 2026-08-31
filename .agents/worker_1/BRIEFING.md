# BRIEFING — 2026-08-31T12:40:34+07:00

## Mission
Implement Milestones M1 & M2: Firebase Strict Sync & Data Integrity (F1) and Ebbinghaus 60-Day Inactivity Decay Engine (F2).

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: e:\flashcardbyvanhngo\.agents\worker_1\
- Original parent: 5a955d0d-f7e1-4a2f-ace9-8ac0dda4f63f
- Milestone: M1 & M2

## 🔒 Key Constraints
- Genuine implementation with no hardcoded test shortcuts, facade implementations, or simulated results.
- Network/API failure rollback with red error notification.
- Inactivity stability decay at >7 days reaching <0.20 at 60 days.
- Ensure all tests in `tests/test_e2e_full_verification.js` pass.

## Current Parent
- Conversation ID: 5a955d0d-f7e1-4a2f-ace9-8ac0dda4f63f
- Updated: not yet

## Task Summary
- **What to build**:
  - M1: Study activity stats sync to `users/{uid}` via `updateUserProfile(uid, { studyStats })`. Rollback state on error with red sync warning banner/error state. Profile spendable LexiCredit matching Header `store.userProfile?.lexiCredit || 0` and removing 1250 hardcoded fallback.
  - M2: Inactivity decay formula in `js/memoryengine.js`, `calculateRetentionRate`, `resolveCardLastStudied`, and UI updates in `lexilearndashboard.js` & `study.js`.
- **Success criteria**: All e2e and unit tests pass; real mathematical decay and real Firestore sync rollback logic.
- **Code layout**: Root `js/` directory for application code, `tests/` for tests.

## Change Tracker
- **Files modified**: TBD
- **Build status**: Pending
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pending initial test run
- **Lint status**: Clean
- **Tests added/modified**: TBD

## Loaded Skills
- None specified
