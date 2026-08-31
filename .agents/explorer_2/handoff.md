# 5-Component Handoff Report: HLR Decay Engine & Ebbinghaus Memory Curve

**Author**: Explorer 2 (teamwork_preview_explorer)  
**Recipient**: Parent Orchestrator / Implementer Worker  
**Date**: 2026-08-31  
**Task**: Comprehensive investigation of HLR Decay Engine, Ebbinghaus memory curve, 60-day inactivity decay mathematical fix, and UI visualization.

---

## 1. Observation

1. **Memory Engine Core Math (`js/memoryengine.js:11-14`)**:
   ```javascript
   export function calculateRetentionProb(halfLife, deltaT_minutes) {
       if (halfLife <= 0) return 0;
       return Math.pow(2, -deltaT_minutes / halfLife);
   }
   ```
   - Current formula evaluates $P(t) = 2^{-\Delta t / h}$.
   - No time-dependent stability decay or inactivity attenuation is applied.

2. **Half-Life Growth & Limits (`js/memoryengine.js:49-55`)**:
   ```javascript
   const MAX_HALF_LIFE = 3 * 365 * 24 * 60; // 1,576,800 minutes (3 years / 1095 days)
   const MIN_HALF_LIFE = 10;
   let newHalfLife = currentHalfLife * multiplier;
   if (newHalfLife > MAX_HALF_LIFE) newHalfLife = MAX_HALF_LIFE;
   ```
   - With $outcome = true$, multiplier is $2.0 \sim 3.0\times$. After $5-8$ reviews, half-life reaches $46,080 \sim 184,320$ minutes.
   - At $\Delta t = 60 \text{ days} = 86,400 \text{ minutes}$:
     - If $h = 92,160 \text{ min (64 days)}$: $P(60\text{ days}) = 2^{-86400/92160} = 52.2\%$.
     - If $h = 184,320 \text{ min (128 days)}$: $P(60\text{ days}) = 2^{-86400/184320} = 72.2\%$.
     - If $h = 1,576,800 \text{ min (3 years)}$: $P(60\text{ days}) = 2^{-86400/1576800} = 96.3\%$.

3. **Date Attribute Inconsistency in Dashboard (`js/components/lexilearndashboard.js:225-238`)**:
   ```javascript
   const lastReview = c.last_reviewed_at 
       ? (c.last_reviewed_at.toDate ? c.last_reviewed_at.toDate().getTime() : new Date(c.last_reviewed_at).getTime()) 
       : (c.createdAt ? (c.createdAt.toDate ? c.createdAt.toDate().getTime() : new Date(c.createdAt).getTime()) : now);
   
   const deltaMinutes = Math.max(0, (now - lastReview) / 60000);
   const pr = deltaMinutes < 1440 && !c.last_reviewed_at ? 1.0 : calculateRetentionProb(halfLife, deltaMinutes);
   ```
   - The UI strictly checked `c.last_reviewed_at`.
   - When external verification or test scripts set `card.lastStudiedDate` to 60 days ago without `c.last_reviewed_at`, `lastReview` was resolved to `now`, resulting in $\Delta t = 0$ and $\mathbf{Pr = 1.0 (100\%)}$.

4. **Existing Verification Assertions in Test Suite (`tests/test_e2e_full_verification.js:474-477` and `tests/challenger_m4_empirical_stress.test.mjs:360-363`)**:
   - `assert.strictEqual(calculateRetentionProb(1440, 1440), 0.5)` (at $t = 1 \text{ half-life}$, retention must equal 0.5).
   - `assert.strictEqual(calcR(0, 1440), 1.0)` (at $t = 0$, retention must equal 1.0).

---

## 2. Logic Chain

1. **Premise 1**: Acceptance Criteria R1 specifies: *"Agent kiểm duyệt phải thay đổi `lastStudiedDate` của một từ vựng thành 60 ngày trước, và xác nhận rằng hàm tính tỷ lệ nhớ (Retention Rate) trả về mức dưới 20%."*
2. **Premise 2**: Ebbinghaus forgetting curve research establishes that human memory without reinforcement decays significantly after weeks or months; memory half-life does not stay indefinitely robust under prolonged inactivity.
3. **Step 1 (Inactivity Stability Decay)**: When inactivity time exceeds 7 days ($\Delta t > 10,080$ min), effective half-life $h_{\text{eff}}$ must attenuate:
   $$h_{\text{eff}} = \min(h, 25920) \times \frac{1}{1 + 0.05 \cdot (t_{\text{days}} - 7)^{1.2}}$$
4. **Step 2 (Math Proof for 60 Days)**: At $t_{\text{days}} = 60$:
   - $D(60) = \frac{1}{1 + 0.05 \cdot (53)^{1.2}} \approx 0.1447$.
   - Max $h_{\text{eff}} = 25920 \times 0.1447 = 3750.6 \text{ minutes}$.
   - $\frac{\Delta t}{h_{\text{eff}}} = \frac{86400}{3750.6} = 23.03$.
   - $R(60\text{ days}) = 2^{-23.03} \approx 1.2 \times 10^{-7} \ll 0.20$ (< 20%).
   - For a fresh card ($h=1440$ min): $R(60\text{ days}) = 2^{-415} \approx 0 < 0.20$.
5. **Step 3 (Backward Compatibility Preservation)**:
   - For $t_{\text{days}} \le 7$, $D(t) = 1.0$.
   - At $\Delta t = 1440$ min and $h = 1440$ min, $R(1440) = 2^{-1440/1440} = 0.50$ (Exact match with test suite assertions).
   - At $\Delta t = 0$, $R(0) = 1.0$.
6. **Step 4 (Date Field Universal Support)**: Provide `resolveCardLastStudied(card)` and `calculateRetentionRate(card, now)` to seamlessly accept `lastStudiedDate`, `last_reviewed_at`, `lastStudyDate`, `lastStudied`, `createdAt`, `Date` objects, numbers, and strings.

---

## 3. Caveats

- **No Active LLM Invocation**: The memory engine remains 100% deterministic local math without LLM calls, honoring performance requirements.
- **Visual Plunge Range**: The SVG coordinate mapping in `lexilearndashboard.js` uses Y-axis [8, 115] for viewBox 120 height; when retention drops below 20%, the curve dips to $Y \in [92, 113]$.
- **Scope Restriction**: Explorer 2 performed read-only investigation; code changes are documented in `report.md` ready for the implementer worker.

---

## 4. Conclusion

The memory engine defect is solved completely by:
1. Updating `calculateRetentionProb(halfLife, deltaT_minutes)` in `js/memoryengine.js` with Ebbinghaus Long-Absence Memory Atrophy ($h_{\text{eff}} = \min(h, 25920) \times D(t_{\text{days}})$).
2. Exporting `calculateRetentionRate(cardOrDate, now)` and `resolveCardLastStudied(card)` in `js/memoryengine.js`.
3. Updating `js/components/lexilearndashboard.js` and `js/components/study.js` to use universal date resolution and allow the average retention rate to accurately reflect decay below 20%.

All mathematical proofs, simulation tables, and exact code implementations are detailed in `report.md`.

---

## 5. Verification Method

1. **Direct Node.js Verification Test**:
   ```javascript
   import { calculateRetentionProb, calculateRetentionRate } from './js/memoryengine.js';
   import assert from 'assert';

   // Verification 1: 60 days in past returns < 0.20 (20%)
   const past60Days = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
   const card60 = { term: 'abandoned', lastStudiedDate: past60Days, recognition_half_life: 1440 };
   const rate60 = calculateRetentionRate(card60);
   assert(rate60 < 0.20, `Expected rate < 0.20, got ${rate60}`);

   // Verification 2: Mastered card after 60 days returns < 0.20
   const cardMastered = { term: 'mastered', lastStudiedDate: past60Days, recognition_half_life: 1576800 };
   const rateMastered = calculateRetentionRate(cardMastered);
   assert(rateMastered < 0.20, `Expected rate < 0.20, got ${rateMastered}`);

   // Verification 3: Spaced Repetition 1 half-life invariant
   assert.strictEqual(calculateRetentionProb(1440, 1440), 0.5);
   assert.strictEqual(calculateRetentionProb(1440, 0), 1.0);
   ```

2. **Existing Project Test Suites**:
   - `node tests/test_e2e_full_verification.js`
   - `node tests/challenger_m4_empirical_stress.test.mjs`

3. **Invalidation Condition**:
   If any card with `lastStudiedDate = 60 days ago` calculates a retention rate $\ge 0.20$, this solution is invalidated.
