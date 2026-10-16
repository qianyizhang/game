# Spire strength and difficulty protocol · 2026-10-16

This prospective protocol is fixed before the new reserved study. The game remains
Spire rules v3 with both characters and Ascensions 0/2/5. Historical adoption studies
and their 3/360 reserved wins remain unchanged.

## Frozen population and policies

- **Development:** `SPIRE-STRENGTH-2-DEV-01..10`, six character/Ascension conditions,
  Immediate/Survival/Growth. Earlier probes and development-1/2/3 informed corrections;
  none is reserved evidence. All attempted cases remain retained.
- **Reserved:** `SPIRE-STRENGTH-2-RESERVED-01..60`, paired across six conditions and
  four policies: the three `spire-policy-2` strategies and `legacy-reference`.
  The fixed budget is 2,000 decisions. Every case records original knowledge and
  four independent audits. Errors and timeouts stay in denominators.
- **Reference selection:** highest development A0 wins, then mean rooms reached,
  then fixed Immediate/Survival/Growth order. Development-3 selects **Growth for
  Ironclad (3/10 wins)** and **Survival for Silent (5/10 wins)**. This choice is frozen
  for all three Ascensions; reserved results cannot select another policy.
- **Historical control:** `legacy-reference` selects the corresponding strategy
  from the exact retained `spire-policy-1` bundle
  `ebb2e5a27cd1591d94ff2ddf354900ea120b9913c7860b829fb254e86b8bbb47`.
  A local module statically bundles/pins those bytes and chooses by public character.
  Both versions play the same current v3 environment; no old report is reinterpreted.
- **Freeze:** the CLI writes the exact seed grid, source/tool/module/bundle identities,
  policy versions, budgets and analysis contract before executing cases. The local
  reference module and old bundle are retained with the new study. Any execution-time
  source drift prevents a completed report.

## Success criteria and uncertainty

The native ranking remains **win → rooms reached → HP → gold**. Entering a room is
not clearing it. Character strata keep independent denominators; no pooled hero or
Ascension claims are allowed.

The primary family has **four** paired binary contrasts: new versus historical
reference at A0 for each character, and A0 versus A5 under the frozen new reference
for each character. Report signed differences, discordant counts, exact two-sided
conditional binomial tests and Holm-adjusted p-values across this complete family.
Paired confidence intervals remain explicitly unavailable. Individual win rates use
95% Wilson intervals; progress uses approximate paired Student t intervals.

- **Useful strength:** each frozen reference's A0 Wilson lower limit exceeds 10%,
  observed gain over its historical reference is at least ten percentage points,
  and that paired contrast has Holm-adjusted p < 0.05.
- **Difficulty separation:** each character's reference has at least a ten-point
  A0–A5 win-rate difference and Holm-adjusted p < 0.05. The intermediate A2 win rate
  must lie between the endpoint rates; adjacent confidence intervals and room-progress
  contrasts are reported without claiming all adjacent differences significant.
  This calibrates the observed ladder for these policies, not human difficulty.
- **Strategy differentiation:** report the entire policy matrix and paired native
  outcomes/work; strategic priorities are not an assumed total strength order.
  Stronger policies also use more computation. The comparison is of complete policy
  implementations, not an isolated search algorithm at equal work.
- **Integrity:** zero execution errors, all attempted cases retained, all four audits
  passed, all **1,440 cases terminal (zero timeouts)**, no source drift and all paired
  cases present are required for promotion. Per-stratum statistical thresholds alone
  cannot authorize promotion when this overall integrity gate fails.

Publish every criterion, including failures. A failed criterion remains open; tuning
informed by these outcomes makes them development evidence and requires another
version and a genuinely new reserved namespace. There is no optional stopping or
post-hoc expansion of the sixty-block sample.

## Reproduce

```sh
npm run engine:policy -- benchmark --game spire --split evaluation \
  --cohort SPIRE-STRENGTH-2 --blocks 60 \
  --policy-module test-results/spire-strength/baseline-reference.ts \
  --out test-results/spire-strength/evaluation-1
```

The local reference module and historical bundle are source-pinned experiment inputs;
their retained hashes and recovery references belong in the final receipt. Fresh
output directories are required. Increasing block count alone does not create fresh
cases: the namespace determines seed identity.
