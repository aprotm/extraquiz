# E2E Test Infra: LexiLearn Motivation & Data Integrity System

## Test Philosophy
- Opaque-box, requirement-driven. Derives from `ORIGINAL_REQUEST.md` and user-facing contracts.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Interaction + Real-World Workload Testing.

## Feature Inventory
| # | Feature | Source | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Cross) | Tier 4 (Real-World) |
|---|---------|--------|:----------------:|:-----------------:|:--------------:|:-------------------:|
| F1 | Firebase Strict Sync & Red Alert | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F2 | Ebbinghaus 60-Day Decay Curve | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F3 | Motivation Punishment & Rank Demotion | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F4 | Pro & Arcade Route Lockdown Guard | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F5 | Urgency Red Alert Modal & UI State | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |

## Test Suite Architecture
- Test Runner: Node.js standard assertions (`node tests/test_e2e_full_verification.js` and dedicated milestone test scripts).
- Exit code: 0 on all tests passing, >0 on failure.
- Test Files:
  - `tests/test_firebase_sync_strictness.js`: F1 tests (offline simulation, failure rollback, red alert display, Header/Profile LC sync).
  - `tests/test_ebbinghaus_decay_60days.js`: F2 tests (60-day decay < 20%, 0-day retention = 1.0, 1 half-life = 0.5, universal date fields).
  - `tests/test_motivation_punishment_rank.js`: F3 tests (3-day absence, streak reset to 0, credit deduction, rank demotion, daily idempotence).
  - `tests/test_lockdown_route_guard.js`: F4 & F5 tests (blocking 9 Pro/Arcade routes when quota < 50, forced redirect to study, unlocking at 50 cards, urgency state).
  - `tests/test_e2e_full_verification.js`: Master comprehensive test runner executing all tiers.

## Coverage Thresholds
- Tier 1 (Feature Coverage): >= 25 test cases (5 per feature)
- Tier 2 (Boundary & Corner Cases): >= 25 test cases (5 per feature)
- Tier 3 (Cross-Feature Combinations): >= 5 test cases
- Tier 4 (Real-World Application Scenarios): >= 5 realistic end-to-end scenarios
- Total Target: >= 60 tests
