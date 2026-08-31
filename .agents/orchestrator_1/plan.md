# Orchestrator Execution Plan

## Objective
Fulfill all requirements in `e:\flashcardbyvanhngo\.agents\ORIGINAL_REQUEST.md`:
1. R1: Firebase strict sync (Heatmap & LexiCredit), HLR Decay engine memory curve fix (60 days < 20%).
2. R2: Motivation System (Punishment: daily deduction, rank drop, streak loss; Lockdown: AI Pro features locked until daily quota met; Urgency: continuous red popup alert & forced redirect to study mode).
3. Verification: Complete verification against all acceptance criteria in ORIGINAL_REQUEST.md.

## Step-by-Step Plan
1. **Survey Phase**:
   - Spawn 3 parallel `teamwork_preview_explorer` agents:
     - Explorer 1: Focus on Firebase Sync, Firestore/Realtime DB structure, Heatmap data flow, LexiCredit header/profile sync, error handling & red warning alert UI.
     - Explorer 2: Focus on Memory Curve / HLR Decay Engine calculation, parameters, `lastStudiedDate`, retention rate math for 60-day decay.
     - Explorer 3: Focus on Motivation System (Punishment logic on app load, Streak / Rank / LexiCredit penalties for missed days, Lockdown logic for Pro routes like AI Reading/AI Writing, Urgency modal/popup and forced redirect).
2. **Decomposition & Project Specification**:
   - Merge explorer findings into `PROJECT.md` at workspace root.
   - Specify architecture, feature inventory, code layout, interface contracts, and milestones.
3. **Dual Track Dispatch**:
   - E2E Testing Track: Build comprehensive test suites (Tiers 1-4) for all requirements.
   - Implementation Track: Execute milestones with Worker -> Reviewers -> Challengers -> Auditor iteration loop.
4. **Final Integration & Hardening**:
   - Run 100% E2E test verification.
   - Tier 5 adversarial testing & forensic audit clean check.
5. **Synthesis & Human Reporting**:
   - Compile final report, verify all criteria in ORIGINAL_REQUEST.md, report to Sentinel.
