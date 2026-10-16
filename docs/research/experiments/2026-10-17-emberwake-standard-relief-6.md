# Emberwake native6 Standard relief — consumed development FAILED

**FAILED consumed development gates: 198/198 attempts; 128 victories, 56 deaths, 14 living stops, 0 errors.** Failed gates: Necromancer: Immediate Relaxed > Standard; Necromancer: Standard Survival > Immediate. This is consumed development, not a calibrated ladder or population result. The [receipt](2026-10-17-emberwake-standard-relief-6.json) pins the frozen proof and independent review.

## Fixed candidate and population

Only Standard incoming damage changes, native5×8 → native6×5, uniformly across heroes. Relaxed×0.75, Severe×12, player per-impact caps unlimited/55%/70%, health-potion recovery 0/20/60 seconds, policy8, observation3, score2, content 2.0.0 and control/budgets remain fixed. Native5 and older replay/save meaning survives exactly.

Ten consumed COHERENT-POLICY3 DEV01–10 blocks ×9 setups ×Immediate/Survival produce 180 attempts; Growth uses the first 2 matched blocks for 18 more. Actual repository pool with 4 workers, 2,048 MiB old generation/worker, 8,000 decisions and unchanged 150,000,000-byte encoded AND decoded gzip limits. Historical D8 stream2 differs from actual stream1/empty options; ignoring configuration in factory source does not make the recordings identical or establish equal compute.

## All native outcomes

Cells are victories/deaths/living stops/errors (attempts); all 27 conditions remain visible.

| Hero        | Policy    | Relaxed       | Standard      | Severe        |
| ----------- | --------- | ------------- | ------------- | ------------- |
| Barbarian   | Immediate | 10/0/0/0 (10) | 8/2/0/0 (10)  | 0/10/0/0 (10) |
| Barbarian   | Survival  | 10/0/0/0 (10) | 10/0/0/0 (10) | 1/8/1/0 (10)  |
| Barbarian   | Growth    | 2/0/0/0 (2)   | 2/0/0/0 (2)   | 0/2/0/0 (2)   |
| Sorceress   | Immediate | 8/0/2/0 (10)  | 5/3/2/0 (10)  | 0/10/0/0 (10) |
| Sorceress   | Survival  | 8/0/2/0 (10)  | 8/0/2/0 (10)  | 4/3/3/0 (10)  |
| Sorceress   | Growth    | 2/0/0/0 (2)   | 2/0/0/0 (2)   | 0/2/0/0 (2)   |
| Necromancer | Immediate | 9/0/1/0 (10)  | 9/0/1/0 (10)  | 0/10/0/0 (10) |
| Necromancer | Survival  | 10/0/0/0 (10) | 10/0/0/0 (10) | 5/5/0/0 (10)  |
| Necromancer | Growth    | 2/0/0/0 (2)   | 2/0/0/0 (2)   | 1/1/0/0 (2)   |

## Nine fixed material comparisons

Counts are A better/tied/B better. Net is (better−worse)/10, with all ties in the denominator; minimum 20 percentage points (pp). This is neither 20% more victories nor 20% faster time. No n=10 significance claim. Official score2 remains exact; practical ties apply only to equally complete victories with 20 × absolute tick difference < maximum ticks. Exact 5% remains directional.

| Contrast                                   | Exact counts | Practical counts | Net material | Status |
| ------------------------------------------ | ------------ | ---------------- | ------------ | ------ |
| Barbarian:Immediate Relaxed > Standard     | 5/4/1        | 2/8/0            | 20pp         | PASS   |
| Barbarian:Survival Standard > Severe       | 10/0/0       | 10/0/0           | 100pp        | PASS   |
| Barbarian:Standard Survival > Immediate    | 7/0/3        | 4/4/2            | 20pp         | PASS   |
| Sorceress:Immediate Relaxed > Standard     | 8/2/0        | 4/6/0            | 40pp         | PASS   |
| Sorceress:Survival Standard > Severe       | 10/0/0       | 7/3/0            | 70pp         | PASS   |
| Sorceress:Standard Survival > Immediate    | 7/0/3        | 6/3/1            | 50pp         | PASS   |
| Necromancer: Immediate Relaxed > Standard  | 7/2/1        | 0/10/0           | 0pp          | FAIL   |
| Necromancer:Survival Standard > Severe     | 8/0/2        | 8/2/0            | 80pp         | PASS   |
| Necromancer: Standard Survival > Immediate | 5/0/5        | 2/7/1            | 10pp         | FAIL   |

## Completion and Severe existence

| Hero        | Required setup    | Victories/10 | Minimum | Status |
| ----------- | ----------------- | ------------ | ------- | ------ |
| Barbarian   | relaxed immediate | 10/10        | 8/10    | PASS   |
| Barbarian   | standard survival | 10/10        | 8/10    | PASS   |
| Sorceress   | relaxed immediate | 8/10         | 8/10    | PASS   |
| Sorceress   | standard survival | 8/10         | 8/10    | PASS   |
| Necromancer | relaxed immediate | 9/10         | 8/10    | PASS   |
| Necromancer | standard survival | 10/10        | 8/10    | PASS   |

| Hero        | Severe Survival/Growth victories | Minimum | Status |
| ----------- | -------------------------------- | ------- | ------ |
| Barbarian   | 1/12                             | 1/12    | PASS   |
| Sorceress   | 4/12                             | 1/12    | PASS   |
| Necromancer | 6/12                             | 1/12    | PASS   |

Severe existence proves only observed audited victories; no population lower bound or human playability claim. **Unchanged-tier controls: 132/132 exact** after ONLY replay format/rulesVersion and state.rulesVersion normalization. Original D8 journals/states remain unchanged; reconstruction is not originally saved policy knowledge.

## Independent evidence and historical continuity

- **Current 198:** independent raw/container/native/input checks cover all 198; 1,104,027 original public inputs reconstructed. Fixed 27 DEV01 cases get saved-input factory reproduction (150,939 proposals); remaining 171 decision-audit verdicts are producer evidence. No new policy episodes were executed by that review.
- **Original native5:** exact 9 campaigns / 43,070 accepted commands / 25 checkpoints; native2/3/4 coverage remains v2: 3 cases / 3 checkpoints, v3: 9 cases / 15 checkpoints, v4: 9 cases / 24 checkpoints. Separate save/replay identities remain; historical policy-audit factory availability is a distinct boundary.
- **Technical 9, excluded from 198:** failed attempt1 actually completed 4 copies; pressure never ran. Corrected attempt2 completed 5 actual executions and passed. The selected Coherent witness is a 105.94 MB decoded victory at 33,440 ticks; the older 119.12 MB max-budget timeout belongs to a different Strength2 seed. Original failed freeze/results remain intact; expectations now bind the full pinned baseline identity before dispatch.
- **Resource scope:** corrected attempt2 peak sampled process RSS 5,683,232,768 bytes (5.29 GiB), including threads. Samples may miss peaks; 2 GiB old-generation settings are not RSS ceilings or isolated throughput evidence.
- **Technical gates:** maintenance/full check passed with 564 application tests and 37 seeded tests; 18 approved disposable-profile Chrome journeys passed. Geometry was unaffected. Frozen bundle/source/protocol/producer/analysis/history receipts are pinned in JSON.

## Limits and next step

The [native5 fresh confirmation](2026-10-16-emberwake-strength-confirmation-5.md) remains **failed**: 1,170 original attempts and its failed Necromancer contrast stay retained. No criterion, reference, score, tolerance or denominator is changed after seeing results. Reused development seeds, route dependence and unequal policy work prevent population, human-difficulty, universal style ordering or equal-compute claims.

Preserve this negative screen and its original native6 environment. Any later pressure candidate requires a separate prospective development protocol and the complete fixed gates before fresh confirmation.
