# Emberwake native5 fresh confirmation — FAILED

**FAILED: 1,170/1,170 declared attempts completed.** Native outcomes: **571 victories, 450 deaths, 149 living budget stops, 0 execution errors**. Living stops remain nonwins. The candidate and all criteria stayed frozen.

Only **Necromancer Survival Standard versus Severe** fails: practical counts **20 better / 29 tied / 11 worse**, net material effect **15.0 percentage points** (required ≥20), Holm-adjusted **p=0.149613** (required <0.05). The other eight contrasts, all six completion gates and all three Severe existence gates pass. This preserves a failed confirmation; it does not establish the full ladder.

The [prospective protocol](2026-10-16-emberwake-strength-5-protocol.md) declares 60 fresh initial blocks per hero for Immediate/Survival (1,080 attempts), plus Growth on the first ten blocks (90). Hero strata are separate; 1,170 attempts are not 1,170 independent replications.

## Native outcomes

Each cell gives victories / deaths / living stops (attempts). Errors are reported separately above.

| Hero        | Policy    | Relaxed      | Standard     | Severe        |
| ----------- | --------- | ------------ | ------------ | ------------- |
| Barbarian   | Immediate | 59/0/1 (60)  | 13/47/0 (60) | 0/60/0 (60)   |
| Barbarian   | Survival  | 60/0/0 (60)  | 41/15/4 (60) | 4/46/10 (60)  |
| Barbarian   | Growth    | 9/0/1 (10)   | 6/4/0 (10)   | 0/10/0 (10)   |
| Sorceress   | Immediate | 51/0/9 (60)  | 3/55/2 (60)  | 0/60/0 (60)   |
| Sorceress   | Survival  | 44/0/16 (60) | 42/5/13 (60) | 17/25/18 (60) |
| Sorceress   | Growth    | 3/0/7 (10)   | 2/2/6 (10)   | 2/5/3 (10)    |
| Necromancer | Immediate | 54/0/6 (60)  | 15/43/2 (60) | 0/60/0 (60)   |
| Necromancer | Survival  | 52/0/8 (60)  | 46/2/12 (60) | 37/7/16 (60)  |
| Necromancer | Growth    | 3/0/7 (10)   | 5/1/4 (10)   | 3/3/4 (10)    |

## Declared primary contrasts

Counts are A better / tied / B better. Each net effect uses **all 60 blocks**, including ties. Holm adjusts all nine tests. Official score2 retains exact ticks; only equally complete winning times less than 5% apart receive the declared practical analysis tie.

| Contrast                         | Exact counts | Practical counts | Net material effect | Holm p      | Status |
| -------------------------------- | ------------ | ---------------- | ------------------- | ----------- | ------ |
| barbarian-immediate-difficulty   | 54/5/1       | 47/13/0          | 78.3%               | 9.9476e-14  | PASS   |
| barbarian-survival-difficulty    | 48/8/4       | 46/11/3          | 71.7%               | 3.53339e-10 | PASS   |
| barbarian-standard-strength      | 44/3/13      | 41/7/12          | 48.3%               | 0.000163427 | PASS   |
| sorceress-immediate-difficulty   | 57/3/0       | 56/4/0           | 93.3%               | 2.498e-16   | PASS   |
| sorceress-survival-difficulty    | 47/5/8       | 39/18/3          | 60.0%               | 2.25264e-08 | PASS   |
| sorceress-standard-strength      | 57/2/1       | 56/3/1           | 91.7%               | 6.43929e-15 | PASS   |
| necromancer-immediate-difficulty | 47/2/11      | 43/15/2          | 68.3%               | 3.53339e-10 | PASS   |
| necromancer-survival-difficulty  | 33/6/21      | 20/29/11         | 15.0%               | 0.149613    | FAIL   |
| necromancer-standard-strength    | 45/2/13      | 45/7/8           | 61.7%               | 7.10505e-07 | PASS   |

All nine require net material superiority ≥20 percentage points and adjusted p<0.05. This effect is neither a percentage speedup nor a victory-rate increase.

## Absolute completion and Severe existence

| Hero / required setup           | Wins / 60 | 95% Wilson interval | Lower >50% |
| ------------------------------- | --------- | ------------------- | ---------- |
| barbarian / relaxed immediate   | 59/60     | 91.1%–99.7%         | PASS       |
| barbarian / standard survival   | 41/60     | 55.8%–78.7%         | PASS       |
| sorceress / relaxed immediate   | 51/60     | 73.9%–91.9%         | PASS       |
| sorceress / standard survival   | 42/60     | 57.5%–80.1%         | PASS       |
| necromancer / relaxed immediate | 54/60     | 79.9%–95.3%         | PASS       |
| necromancer / standard survival | 46/60     | 64.6%–85.6%         | PASS       |

| Hero        | Audited Severe Survival/Growth victories / 70 | Observed existence |
| ----------- | --------------------------------------------- | ------------------ |
| barbarian   | 4/70                                          | PASS               |
| sorceress   | 19/70                                         | PASS               |
| necromancer | 40/70                                         | PASS               |

The Severe criterion proves observed victories only; it does not establish a population win probability or human playability.

## Independent evidence and verification

- **All 1,170 original artifacts:** encoded/decoded hashes, retained metadata, native journals/full final states and **5,969,504 original public policy inputs** independently reconstructed; all report rows compared with raw evidence.
- **Factory reproduction:** all four dimensions rerun independently on the fixed 27 seed-01 cases. Original producer audits cover all 1,170; their flags alone are not an independent fresh-factory reproduction of all cases.
- **Source hold:** all 195 live and 202 retained pins remained unchanged. Source hashes identify bytes; native continuity and actual-worker acceptance are separately pinned evidence.
- **Required checks:** final analyzer/protocol candidate passed maintenance, 14 synthetic groups, 563 application tests and 37 seeded tests before case1. Native5 already passed 16 disposable-profile Chrome journeys. UI/runtime remained fixed afterward; geometry was unaffected.

The compact JSON receipt pins the full plan, original reports, closure, analysis and independent audit. Raw original traces remain in the declared ignored evidence directories; navigate those recordings to inspect what the policy knew at each decision.

## Inspect original decision knowledge

Open `/?game=diablo2&review=policy` and import the original `.rollout.json.gzip` files named in the companion JSON receipt’s `navigationExamples`. Original knowledge/proposals are the default; seek backward or directly to a decision, and enable evaluator state explicitly when needed. These examples use first-planned selection, not best performance.

| Example                                                          | Seed                               | Setup                  |
| ---------------------------------------------------------------- | ---------------------------------- | ---------------------- |
| First planned Severe Survival victory: barbarian                 | `EMBERWAKE-STRENGTH-5-RESERVED-27` | `barbarian-severe`     |
| First planned Severe Survival victory: sorceress                 | `EMBERWAKE-STRENGTH-5-RESERVED-02` | `sorceress-severe`     |
| First planned Severe Survival victory: necromancer               | `EMBERWAKE-STRENGTH-5-RESERVED-02` | `necromancer-severe`   |
| First planned Necromancer winning pair with a practical time tie | `EMBERWAKE-STRENGTH-5-RESERVED-02` | `necromancer-standard` |
| First planned Necromancer winning pair with a practical time tie | `EMBERWAKE-STRENGTH-5-RESERVED-02` | `necromancer-severe`   |

The Necromancer pair is a whole-attempt example of the predeclared practical tie, not a traced causal explanation. Across that contrast, **23 exact directional winning-time pairs became practical ties**; changing the tolerance after seeing this result would invalidate the confirmation.

## Limits and retained counterexamples

- Earlier failed and consumed development studies remain retained; this confirmation does not erase them. Nine-test Holm controls this declared family, not adaptive repeated confirmations.
- Growth comparisons on ten matched blocks are descriptive. No universal strategy order, adjacent tier ordering for every style, equal-compute result, hostile-code isolation or human-equivalent difficulty is claimed.
- Deaths, living stops and any failed criterion remain visible above and in the full analysis; no seed, reference, budget, score, cap or candidate was changed after reserved execution.
- Rules5 gameplay pressure and policy8 differ from historical campaigns. Native2/3/4 fixtures and separate replay/save contracts remain exact; official observation3 and score2 are unchanged.
