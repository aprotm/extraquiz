## 2026-08-31T05:40:34Z
Task: Milestones M1 & M2 (Firebase Strict Sync & Data Integrity, Ebbinghaus 60-Day Decay Engine)
Scope:
1. Firebase Strict Sync & Heatmap Persistence (F1):
   - js/store.js & js/db.js: recordStudyActivity() saves stats (streak, lastStudyDate, todayWords, history) directly to Firestore users/{uid} via updateUserProfile(uid, { studyStats }).
   - On network/API failure during recordStudyActivity() or addLexiCredit(): rollback to previous confirmed state; set/emit a red warning error notification (store.syncError = { active: true, message: ... } / store.showRedSyncWarning(...)).
   - js/components/profile.js & js/app.js: Ensure spendable LexiCredit display on Profile matches Header 100% (store.userProfile?.lexiCredit || 0). Remove hardcoded fallback 1250 in lexilearndashboard.js.
2. Ebbinghaus Memory Curve & HLR 60-Day Inactivity Decay (F2):
   - js/memoryengine.js: Update calculateRetentionProb(halfLife, deltaT_minutes) to apply Inactivity Stability Decay when deltaT > 7 days (h_eff = min(h, 25920) * 1 / (1 + 0.05 * (t_days - 7)^1.2)), ensuring that at 60 days of inactivity retention rate drops below 20% (< 0.20), while keeping R(1 half-life) = 0.50 and R(0) = 1.00.
   - Export calculateRetentionRate(cardOrDate, now) and resolveCardLastStudied(card) supporting lastStudiedDate, last_reviewed_at, lastStudyDate, strings, Dates, and timestamps.
   - Update js/components/lexilearndashboard.js and js/components/study.js to use resolveCardLastStudied and calculateRetentionRate.
3. Verification:
   - Run node tests/test_e2e_full_verification.js to ensure all tests pass.
