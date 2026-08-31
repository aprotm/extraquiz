## 2026-08-31T05:40:33Z

You are the E2E Test Writer (teamwork_preview_test_writer).
Your working directory is: e:\flashcardbyvanhngo\.agents\test_writer_1\
The authoritative user request is in: e:\flashcardbyvanhngo\.agents\ORIGINAL_REQUEST.md (MANDATORY: Read this file first!).
The project plan is in: e:\flashcardbyvanhngo\PROJECT.md
The test architecture is in: e:\flashcardbyvanhngo\TEST_INFRA.md

Your task:
Design and implement comprehensive, opaque-box, requirement-driven automated test suites in Node.js for all features in ORIGINAL_REQUEST.md:
1. `tests/test_firebase_sync_strictness.js`:
   - Tier 1 & 2 tests for F1: simulate network/API errors on study activity & LexiCredit updates, verify red warning alert state is triggered, verify local state does NOT retain erroneous changes (rollback to true state), verify Header and Profile display 100% synchronized spendable LexiCredit.
2. `tests/test_ebbinghaus_decay_60days.js`:
   - Tier 1 & 2 tests for F2: test card with `lastStudiedDate` 60 days in past returns retention rate < 20% (< 0.20) for both fresh and mastered cards; verify invariant $R(0) = 1.0$ and $R(h) = 0.5$; test universal date field support (`lastStudiedDate`, `last_reviewed_at`, `lastStudyDate`, string, timestamp, number).
3. `tests/test_motivation_punishment_rank.js`:
   - Tier 1 & 2 tests for F3: simulate user absent for 3 days on app load (`lastStudyDate` = 3 days ago); verify streak resets to 0; verify LexiCredit is deducted; verify rank is demoted (testing level demotion from lifetime LC drop); verify daily idempotence (`lastPunishedDate`).
4. `tests/test_lockdown_route_guard.js`:
   - Tier 1 & 2 tests for F4 & F5: when `todayWords < 50`, attempting to navigate to any of the 9 Pro/Arcade routes (`reading`, `writing`, `paraphrase`, `lexilearn-dashboard`, `boss-battle`, `cyber-cipher`, `ai-arena`, `matching`, `store`/`lexistore`) redirects to `'study'` and triggers red lockdown alert; when `todayWords >= 50`, Pro routes are accessible; verify urgency state indicators.
5. Integrate all new test suites into `tests/test_e2e_full_verification.js` so running `node tests/test_e2e_full_verification.js` executes the entire suite.
6. Verify your tests run with Node.js and output clean results.
7. Create `e:\flashcardbyvanhngo\TEST_READY.md` at project root summarizing the test suite coverage across Tiers 1-4.
8. Write your handoff to `e:\flashcardbyvanhngo\.agents\test_writer_1\handoff.md`.
When finished, send a completion message back to the parent orchestrator.
