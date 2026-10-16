# Spire strength-3 confirmation · 2026-10-16

This prospective follow-up retains the failed strength-2 study and uses a genuinely
new reserved namespace. It does not reinterpret the original thresholds as passed.
No strength-3 reserved outcome has been inspected when this protocol is frozen.

## Why another study

The prior protocol selected Ironclad Growth from ten development seeds. On sixty
reserved seeds it won 6/60 versus the historical control's 2/60 and failed both
primary criteria. Silent Survival passed: 20/60 versus 4/60, then 14/60 at A2 and
4/60 at A5. All 1,440 cases were terminal and passed four audits.

That complete result now informs development only. It suggests the earlier small
development selection was unstable: Ironclad Survival won 11/60 versus Growth's
6/60. The follow-up fixes **Survival for both characters**, including all three
Ascensions, before execution. No reserved follow-up selection is allowed.

`spire-policy-3` corrects a traced long-fight defect: preventing current-turn HP loss
could allow Spheric Guardian's retained Block to grow for 137 turns. Its endpoint now
values breaking that public persistent barrier, and a complete native regression
beats that encounter. A broader development-only boss-pressure experiment was
rejected; it is not part of this frozen policy. Otherwise the v2 policy behavior is
retained. The native game rules, score, observation and control contracts are unchanged.

## Frozen design

- **Population:** `SPIRE-STRENGTH-3-RESERVED-01..100`, Ironclad and Silent separately,
  each at Ascensions 0/2/5. All cases share `POLICY-STREAM-1` and 2,000 decisions.
- **Primary matrix:** Survival v3 and `legacy-reference` v1 on every condition:
  **1,200 attempted cases**. The control is the exact retained original v1 bundle
  `ebb2e5a27cd1591d94ff2ddf354900ea120b9913c7860b829fb254e86b8bbb47`,
  using Survival for both characters through a statically source-pinned local module.
  Only its factory runs against the current native adapter.
- **Companion matrix:** Immediate v3 and Growth v3 on the first twenty reserved
  seed blocks, all six conditions: **240 additional attempts**. Compare their results
  with the same twenty primary-matrix blocks, not with one hundred correlated or
  unmatched observations. Denominators remain explicit: 100 for primary calibration,
  20 for strategy comparisons. Companion results cannot change the reference choice.
- **Freeze:** retain protocol, complete exact population, policy/source/module/tool
  pins, compiled bundle and prospective analysis code before execution. The primary
  and companion runs freeze identical source bytes and can run concurrently. Any
  source drift prevents completed report publication. Each original input, proposal,
  work count, native replay and audit remains retained.
- **Analysis:** `analyze-spire.ts` emits an inferential addendum separate from raw
  reports. It requires complete nonempty provenance and coverage by the frozen plan;
  supplied summary rows alone do not constitute independent raw-artifact proof.
  Review must separately verify raw artifacts and retained source bytes.

## Unchanged primary criteria

The primary family again contains four paired binary contrasts: v3 versus v1 at A0
for each character, and A0 versus A5 under v3 Survival for each character. Use exact
two-sided conditional binomial tests on discordant wins, Holm correction across all
four contrasts, individual 95% Wilson win intervals and approximate paired Student t
progress intervals. Paired binary intervals remain unavailable.

- **Strength passes per character** when A0's Wilson lower limit exceeds 10%, the
  observed gain over historical Survival is at least ten percentage points, and its
  Holm-adjusted p-value is below 0.05.
- **Difficulty passes per character** when A0–A5's win-rate difference is at least
  ten percentage points with Holm-adjusted p < 0.05, and A2's point estimate lies
  between them. Adjacent significance and human difficulty are not claimed.
- **Promotion also requires** all 1,200 primary and 240 companion cases terminal,
  zero errors/timeouts, four passing audits per case, complete matched grids and
  no source drift. Statistical flags cannot override an integrity failure.
- **Strategy comparisons** on twenty matched blocks are descriptive and report
  uncertainty/work; no total ordering or isolated equal-compute effect is assumed.

The hundred-block sample is fixed before execution. No optional stopping, peeking
to tune, or post-hoc expansion is permitted. Failure remains failure. Further tuning
would consume these outcomes as development evidence and require another frozen
version/protocol and fresh reserved cases.

## Commands

```sh
npm run engine:policy -- benchmark --game spire --split evaluation \
  --cohort SPIRE-STRENGTH-3 --blocks 100 --policies survival,legacy-reference \
  --policy-module test-results/spire-strength/baseline-reference-3.ts \
  --out test-results/spire-strength/evaluation-2
npm run engine:policy -- benchmark --game spire --split evaluation \
  --cohort SPIRE-STRENGTH-3 --blocks 20 --policies immediate,growth \
  --out test-results/spire-strength/alternatives-2
node packages/workshop-tools/policy/analyze-spire.ts \
  test-results/spire-strength/evaluation-2 \
  test-results/spire-strength/alternatives-2 \
  test-results/spire-strength/evaluation-plan-3.json \
  test-results/spire-strength/evaluation-2/inference.json
```

The final receipt retains plan/module hashes and raw source snapshots. The original
strength-2 protocol, inference and exact code remain preserved under its original
paths, including `test-results/spire-strength/frozen-sources-2`. They are not silently
rerun using this follow-up analyzer or reference mapping.
