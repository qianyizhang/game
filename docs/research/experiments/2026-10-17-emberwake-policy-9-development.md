# Emberwake policy9 — consumed development FAILED

**FAILED fixed development gates: 198/198 attempts; 115 victories, 70 deaths, 13 living stops, 0 errors.** Failed gates: barbarian:Standard Survival > Immediate; necromancer:Standard Survival > Immediate; barbarian standard survival completion; barbarian Severe existence. This consumed screen does not establish calibration. The [receipt](2026-10-17-emberwake-policy-9-development.json) pins the complete evidence as of 2026-10-16T19:51:05.849Z.

## Promotion decision

**Policy9 was rejected; native7/policy8 remains the baseline.** After the audited render closed, only the three owned policy files were restored to exact commit `a687d1be` bytes. The original policy9 source snapshots, runtime bundle, inputs, proposals and native journals remain intact. Version9 is consumed and must not identify different later code.

The current factory8 cannot reproduce policy9 proposals; that audit requires the retained frozen9 runtime/source. Original decision knowledge and native7 replay navigation remain available. The 571 application tests, 37 seeded tests and 20 browser journeys below concern the tested policy9 candidate; restoration adds no runtime change relative to committed policy8. The receipt records the raw render and later restoration separately.

## Fixed repair and design

Policy9 repairs nonpending Survival warning-escape timing/stamina correctness, including low-HP/empty-belt cases. Ordinary movement is available alongside offered skills; timing/stamina reflect delivered control. Pending ten-tick recovery, nonwarning behavior, Immediate/Growth behavior and teleport endpoint geometry stay fixed; blink selection may change. Native7/observation3/score2/content/RNG remain unchanged: damage 0.75/7/12, player impact ceilings unlimited/55%/70%, health recovery 0/20/60 seconds.

Ten consumed COHERENT-POLICY3 DEV01–10 blocks × nine setups × Immediate/Survival give 180 attempts; Growth adds 18 on the first two same blocks. Actual pool4, 2,048 MiB V8 old generation per worker, 8,000 decisions, POLICY-STREAM-1/empty options, gzip and 150,000,000-byte encoded AND decoded caps remain fixed. Deaths and stops retain every denominator.

## All 27 outcome cells

Cells are victories/deaths/living stops/errors (attempts).

| Hero        | Policy    | Relaxed       | Standard      | Severe        |
| ----------- | --------- | ------------- | ------------- | ------------- |
| barbarian   | immediate | 10/0/0/0 (10) | 6/4/0/0 (10)  | 0/10/0/0 (10) |
| barbarian   | survival  | 10/0/0/0 (10) | 7/2/1/0 (10)  | 0/9/1/0 (10)  |
| barbarian   | growth    | 2/0/0/0 (2)   | 1/1/0/0 (2)   | 0/2/0/0 (2)   |
| sorceress   | immediate | 8/0/2/0 (10)  | 2/8/0/0 (10)  | 0/10/0/0 (10) |
| sorceress   | survival  | 8/0/2/0 (10)  | 8/0/2/0 (10)  | 3/3/4/0 (10)  |
| sorceress   | growth    | 2/0/0/0 (2)   | 2/0/0/0 (2)   | 0/2/0/0 (2)   |
| necromancer | immediate | 9/0/1/0 (10)  | 6/4/0/0 (10)  | 0/10/0/0 (10) |
| necromancer | survival  | 10/0/0/0 (10) | 10/0/0/0 (10) | 6/4/0/0 (10)  |
| necromancer | growth    | 2/0/0/0 (2)   | 2/0/0/0 (2)   | 1/1/0/0 (2)   |

## Nine material comparisons

Counts are A better/tied/B better. Net is (better−worse)/10 with every tie retained; **pp means percentage points of net materially higher-score blocks**, not victory-rate gain or percent time saved. Every direction requires at least 20 pp; n=10 has no significance gate. Official score2 stays exact. Equally complete victories are practical ties only when 20 × absolute tick difference < maximum ticks; exact 5% stays directional.

| Contrast                                  | Exact: better/tied/worse | Practical: better/tied/worse | Net    | Status |
| ----------------------------------------- | ------------------------ | ---------------------------- | ------ | ------ |
| barbarian:Immediate Relaxed > Standard    | 8/1/1                    | 4/6/0                        | 40 pp  | PASS   |
| barbarian:Survival Standard > Severe      | 8/0/2                    | 8/0/2                        | 60 pp  | PASS   |
| barbarian:Standard Survival > Immediate   | 4/0/6                    | 4/0/6                        | -20 pp | FAIL   |
| sorceress:Immediate Relaxed > Standard    | 9/1/0                    | 8/2/0                        | 80 pp  | PASS   |
| sorceress:Survival Standard > Severe      | 6/2/2                    | 5/5/0                        | 50 pp  | PASS   |
| sorceress:Standard Survival > Immediate   | 8/0/2                    | 8/2/0                        | 80 pp  | PASS   |
| necromancer:Immediate Relaxed > Standard  | 8/0/2                    | 4/5/1                        | 30 pp  | PASS   |
| necromancer:Survival Standard > Severe    | 6/0/4                    | 5/5/0                        | 50 pp  | PASS   |
| necromancer:Standard Survival > Immediate | 7/0/3                    | 4/3/3                        | 10 pp  | FAIL   |

## Completion and Severe existence

| Hero        | Required setup    | Wins/10 | Minimum | Status |
| ----------- | ----------------- | ------- | ------- | ------ |
| barbarian   | relaxed immediate | 10/10   | 8/10    | PASS   |
| barbarian   | standard survival | 7/10    | 8/10    | FAIL   |
| sorceress   | relaxed immediate | 8/10    | 8/10    | PASS   |
| sorceress   | standard survival | 8/10    | 8/10    | PASS   |
| necromancer | relaxed immediate | 9/10    | 8/10    | PASS   |
| necromancer | standard survival | 10/10   | 8/10    | PASS   |

| Hero        | Severe Survival/Growth wins | Minimum | Status |
| ----------- | --------------------------- | ------- | ------ |
| barbarian   | 0/12                        | 1/12    | FAIL   |
| sorceress   | 3/12                        | 1/12    | PASS   |
| necromancer | 7/12                        | 1/12    | PASS   |

Severe existence establishes observed audited victories, not a population lower bound or human playability. **Unchanged Immediate/Growth controls: 108/108 exact.** Compare all 90 Immediate plus 18 Growth native7 journals/full states with original policy8 D10, with **NO normalization**. Policy8 versus policy9 metadata/raw recording provenance differs intentionally. Both use stream1/empty options/8,000 decisions. Original raw/native bytes remain unchanged; their reuse is neither new baseline execution nor equal-compute proof.

## Separate local and resource evidence

- **Local prefix:** TWO bounded native/public-alias branches, outside 198, use original8-history warmup over 3,268 saved inputs. Original8 dies after 14 executed ticks; policy9 is still playing after 40 ticks at HP 258. Accepted warmup commands matched while six full proposal/diagnostic outputs differed; full-output identity is not claimed. This is local control evidence, not a campaign win or strength result.
- **Preflight:** the first PREPARE ended with exit 1 on old-format clearance before directories/runtime build/cases; root retained its contemporaneous observation. Corrected clearance ended with exit 0 and no cases. Both preparations remain outside technical5 and development198; this was not a policy failure or episode retry.
- **Technical:** five current policy9 actual-worker Growth executions are separate from 198: four Necromancer Relaxed DEV01 copies and one Necromancer Severe DEV02 control. Their exact outcome/ticks and native journals/states bind to original8 before dispatch, with no normalization. They cover retained Growth resources/control, **not changed Survival outcomes/resources or a guaranteed worst case**. Historical native7 five and native6 failed-four/corrected-five remain separate.
- **Stress witness:** victory, 33,440 ticks, 7,186 decisions, 105,944,101 decoded bytes. Peak sampled process RSS is 5,295,325,184 bytes including threads. Sampling can miss peaks; 2,048 MiB old-generation settings are not RSS ceilings or isolated throughput evidence.

## Independent scope, history and verification

- **All 198:** original raw/container/input/native checks independently passed; 1,017,536 original public inputs reconstructed. Predetermined 27 DEV01 saved-input factory samples additionally reproduce 131,683 proposals; other 171 decision verdicts remain producer evidence. Review adds no policy episode.
- **History:** exact native2–6 environments remain supported. The retained native7 continuity audit covers original6 nine campaigns / 51,300 commands / 25 checkpoints / 15 rejection checks, original5 nine campaigns / 43,070 commands / 25 checkpoints and older2/3/4 fixtures. Policy9 changes no native rule; these are inherited historical receipts, not newly replayed campaigns. Native replay compatibility does not imply old policy-factory availability in the current viewer.
- **Actual gates:** full maintenance/check passed with 571 application and 37 seeded tests; 20 approved disposable Chrome journeys passed. A sole protocol wording clarification then passed formatting/inventory; its old tested bytes remain pinned separately. Geometry was unaffected. Complete source, retained, raw/native/control, independent, technical and browser pin maps were checked before and after rendering.
- **Source scope:** 2,757 live / 2,765 retained pins match **as of 2026-10-16T19:51:05.849Z**. After the audited render, authorized closeout restored the three current policy files to exact committed policy8 bytes and updated documentation; original frozen policy9 snapshots preserve the historical test environment. The receipt binds actual acceptance artifacts and the generator.

## Prior negatives and limits

The [native5 fresh 1,170 confirmation](2026-10-16-emberwake-strength-confirmation-5.md), [native6 consumed 198 screen](2026-10-17-emberwake-standard-relief-6.md) and [native7/policy8 consumed 198 screen](2026-10-17-emberwake-standard-pressure-7.md) remain negative. Nothing is relabeled or retrospectively rescored. No tolerance, reference, seed, criterion, budget or denominator changes during D11. Reused seeds, route dependence and unequal work exclude population calibration, human-equivalent difficulty, universal style ordering and equal-compute claims.

Preserve this negative screen; declare any next development candidate separately without changing these gates or launching confirmation as though they passed.
