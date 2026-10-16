# Emberwake native7 Standard pressure — consumed development FAILED

**FAILED fixed development gates: 198/198 attempts; 117 victories, 69 deaths, 12 living stops, 0 errors.** Failed gates: Barbarian: Standard Survival > Immediate; Necromancer: Standard Survival > Immediate. This consumed screen does not establish calibration. The [receipt](2026-10-17-emberwake-standard-pressure-7.json) pins complete evidence.

## Fixed candidate

Only Standard incoming damage changes: native6 ×5 → native7 ×7, uniformly across heroes. Relaxed ×0.75, Severe ×12, player impact caps unlimited/55%/70%, health recovery 0/20/60 seconds, policy8, observation3, score2, content/RNG/control and budgets stay fixed. The read-only two-arrow player breakpoint near 6.91 and 200-HP ally survival limit near 7.86 motivated seven; they do not predict whole campaigns or establish an optimum. Sorceress Standard Survival's completion floor was an explicit risk.

Ten consumed COHERENT-POLICY3 DEV01–10 blocks × 9 setups × Immediate/Survival give 180 attempts; Growth adds 18 on the first two matched blocks. Actual pool with 4 workers, 2,048 MiB V8 old generation/worker, 8,000 decisions and unchanged 150,000,000-byte encoded AND decoded gzip limits. Deaths/stops retain denominators.

## All 27 native outcome cells

Cells are victories/deaths/living stops/errors (attempts).

| Hero        | Policy    | Relaxed       | Standard     | Severe        |
| ----------- | --------- | ------------- | ------------ | ------------- |
| Barbarian   | Immediate | 10/0/0/0 (10) | 6/4/0/0 (10) | 0/10/0/0 (10) |
| Barbarian   | Survival  | 10/0/0/0 (10) | 9/0/1/0 (10) | 1/8/1/0 (10)  |
| Barbarian   | Growth    | 2/0/0/0 (2)   | 1/1/0/0 (2)  | 0/2/0/0 (2)   |
| Sorceress   | Immediate | 8/0/2/0 (10)  | 2/8/0/0 (10) | 0/10/0/0 (10) |
| Sorceress   | Survival  | 8/0/2/0 (10)  | 8/0/2/0 (10) | 4/3/3/0 (10)  |
| Sorceress   | Growth    | 2/0/0/0 (2)   | 2/0/0/0 (2)  | 0/2/0/0 (2)   |
| Necromancer | Immediate | 9/0/1/0 (10)  | 6/4/0/0 (10) | 0/10/0/0 (10) |
| Necromancer | Survival  | 10/0/0/0 (10) | 9/1/0/0 (10) | 5/5/0/0 (10)  |
| Necromancer | Growth    | 2/0/0/0 (2)   | 2/0/0/0 (2)  | 1/1/0/0 (2)   |

## Nine material comparisons

Counts are A better/tied/B better; net is (better−worse)/10 with every tie retained. Minimum 20 percentage points (pp), no n=10 significance gate. The effect is neither 20% more victories nor 20% faster time. Official score2 stays exact; only equally complete victories with 20 × absolute tick difference < maximum ticks receive a practical tie. Exact 5% remains directional.

| Contrast                                   | Exact  | Practical | Net   | Status |
| ------------------------------------------ | ------ | --------- | ----- | ------ |
| Barbarian: Immediate Relaxed > Standard    | 8/1/1  | 4/6/0     | 40pp  | PASS   |
| Barbarian: Survival Standard > Severe      | 10/0/0 | 10/0/0    | 100pp | PASS   |
| Barbarian: Standard Survival > Immediate   | 6/0/4  | 4/2/4     | 0pp   | FAIL   |
| Sorceress: Immediate Relaxed > Standard    | 9/1/0  | 8/2/0     | 80pp  | PASS   |
| Sorceress: Survival Standard > Severe      | 6/2/2  | 4/6/0     | 40pp  | PASS   |
| Sorceress: Standard Survival > Immediate   | 8/0/2  | 8/2/0     | 80pp  | PASS   |
| Necromancer: Immediate Relaxed > Standard  | 8/0/2  | 4/5/1     | 30pp  | PASS   |
| Necromancer: Survival Standard > Severe    | 7/0/3  | 5/4/1     | 40pp  | PASS   |
| Necromancer: Standard Survival > Immediate | 7/0/3  | 4/3/3     | 10pp  | FAIL   |

## Completion and Severe existence

| Hero        | Required setup    | Wins/10 | Minimum | Status |
| ----------- | ----------------- | ------- | ------- | ------ |
| Barbarian   | relaxed immediate | 10/10   | 8/10    | PASS   |
| Barbarian   | standard survival | 9/10    | 8/10    | PASS   |
| Sorceress   | relaxed immediate | 8/10    | 8/10    | PASS   |
| Sorceress   | standard survival | 8/10    | 8/10    | PASS   |
| Necromancer | relaxed immediate | 9/10    | 8/10    | PASS   |
| Necromancer | standard survival | 9/10    | 8/10    | PASS   |

| Hero        | Severe Survival/Growth wins | Minimum | Status |
| ----------- | --------------------------- | ------- | ------ |
| Barbarian   | 1/12                        | 1/12    | PASS   |
| Sorceress   | 4/12                        | 1/12    | PASS   |
| Necromancer | 6/12                        | 1/12    | PASS   |

Severe existence proves observed audited victories only, not a population lower bound or human playability. **Original6 unchanged-tier controls: 132/132 exact.** Both actual configurations use policy8/STREAM1/empty options/8,000 decisions. Only replay format/rulesVersion 6→7 and state.rulesVersion 6→7 are normalized; every other command/field remains exact. Original6 raw inputs/journals/states remain unchanged; their reuse is not a new baseline execution or equal-compute comparison. The old D8 stream2 distinction belongs to earlier history.

## Independent evidence and retained history

- **All 198:** original raw/container/native/input checks independently passed; 1,023,937 original public inputs reconstructed. Fixed 27 DEV01 cases additionally reproduce 136,835 saved-input factory proposals; other 171 decision verdicts remain producer evidence. No new policy episode is claimed by review.
- **Original6 continuity:** nine full campaigns / 51,300 commands / 25 checkpoints / 15 rejection checks remain exact, alongside original5 nine campaigns / 43,070 commands / 25 checkpoints and older2/3/4 fixtures. Native replay compatibility and policy-factory availability are separate.
- **Technical:** five NEW native7 actual-worker executions are outside 198; native6's failed 4 + corrected 5 remain separate historical attempts. Current stress witness: victory, 33,440 ticks, 7,186 decisions, 105,944,101 decoded bytes. It is not the distinct historical Strength2 DEV01 maximal-budget timeout.
- **Resources:** 4,970,233,856 bytes (4.63 GiB) peak sampled process RSS, including threads; sampling can miss peaks. 2 GiB old-generation settings are not RSS ceilings or isolated throughput evidence. Source pins matched through audit and report rendering: 1,832 live / 1,840 retained.
- **Required gates:** full maintenance/check passed with 568 application and 37 seeded tests; 20 actual approved disposable Chrome journeys passed. Geometry was unaffected. Source/bundle/protocol/producer/history/audit bytes are pinned in the JSON receipt.

## Prior failures and limits

The [native5 fresh 1,170 confirmation](2026-10-16-emberwake-strength-confirmation-5.md) remains failed. The [native6 consumed 198 screen](2026-10-17-emberwake-standard-relief-6.md) also remains failed (7/9 directions). Neither is reinterpreted or relabeled as native7. No score, tolerance, reference, seed, criterion or denominator changed during this screen. Reused seeds, route dependence and unequal work exclude population calibration, human-equivalent difficulty, universal style ordering or equal-compute claims.

Preserve this negative screen; declare any next development candidate separately without changing these gates or launching confirmation as though they passed.

Native7 is retained as the development baseline with exact historical replay support. The full screen remains failed; the next slice diagnoses Survival policy control with native7 pressure and score2 fixed.
