# Last Hearth experiment ledger

Dated findings, not current strength guarantees. The [agent](../../engineering/hearth-agents.md),
[policy](../../engineering/hearth-policy.md) and [recruitment](../hearth-recruitment-v2.md)
contracts own current use. JSON receipts retain the original case rows, statistical
details and source/configuration/bundle identities unchanged. Raw local evidence may
have been pruned under the [retention rule](../../engineering/maintenance.md#policy-iteration-retention).
Recovery links below identify the precompaction documents, not new experiment source revisions.

| Date       | Study                       | Attempted population                   | Decision / limitation                                                                                            |
| ---------- | --------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 2026-10-04 | Formation search v1         | 10 development + 40 reserved lobbies   | Retain heuristic baseline: reserved search mean place 4.65 versus 4.50.                                          |
| 2026-10-04 | Arena v1 / style disclosure | 64 development + 256 reserved lobbies  | Retain Classic: Tempo trails it in every reserved seed block; tested disclosure response has no positive result. |
| 2026-10-04 | Recruitment v2 factorial    | 400 development + 800 reserved lobbies | Earlier upgrades improve Tempo, but it still trails Classic; replacement spending is infrequently exercised.     |
| 2026-10-16 | Public-policy adoption      | 450 development + 900 reserved cases   | All complete and audit; priorities differ without a universal strength order or human-calibrated ladder.         |

<a id="2026-10-04-hearth-ai-v1"></a>

## Formation search v1

[Results](2026-10-04-hearth-ai-v1.json) · [Full original report](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-04-hearth-ai-v1.md).

Source `77dad48f696803b07ebfc1430734c9beab47d5f4`, Hearth rules 5;
`heuristic-v1` versus `scout-search-v1` changes formation only. Seat 0 faces seven
fixed sequential bots. Five rotating-hero `HEARTH-DEV-20261004-1..5` blocks precede
twenty separate `HEARTH-EVAL-20261004-1..20` blocks; each runs both policies.
Search considers at most 24 orders × 16 combat samples, conditioned on last-seen
scouting, maximizing immediate hero damage dealt minus taken. Public input excludes
live private purchases and environment RNG. Configuration froze before evaluation.

| Measure                     | Development baseline / search | Reserved baseline / search |
| --------------------------- | ----------------------------: | -------------------------: |
| Completed / attempted       |                     5/5 / 5/5 |              20/20 / 20/20 |
| Mean place, lower is better |                   4.80 / 4.40 |                4.50 / 4.65 |
| First places                |                     0/5 / 1/5 |                3/20 / 1/20 |
| Top four                    |                     2/5 / 3/5 |               9/20 / 10/20 |

Reserved search is better/tied/worse on **8/4/8 pairs**; mean paired improvement
is **−0.15 places, SE 0.646**. All 50 lobbies reconstruct exactly, conserve supply
after every accepted action, and exclude no pairs; 6,467 decision rows were audited.
Search uses 65,280 reserved combat simulations and 1,122.0 ms measured policy time
versus baseline 77.4 ms. Timing excludes environment/menu/I/O/build/replay work and is
not throughput or equal-compute evidence. Selecting the favorable top-four count
would hide worse mean placement and first-place count. Stale opponent models and
short-horizon objectives remain hypotheses, not isolated causes. Inspected seeds
cannot support a later fresh-confirmation claim; no human-enjoyment claim follows.

<a id="2026-10-04-hearth-arena-v1"></a>

## Arena v1 and style disclosure

[Results](2026-10-04-hearth-arena-v1.json) · [Full original report](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-04-hearth-arena-v1.md).

Evaluation source `de0675f6cf9e0e42f6b71aa3a407d3ecd3f2944c`, Hearth 5/arena 1.
Development used a pinned dirty snapshot based on `a185240`; intervening UI/report
fixes did not change recruitment policies or mechanics. Two development
`HEARTH-ARENA-DEV-20261004` blocks and eight reserved `HEARTH-ARENA-EVAL-20261004`
blocks cross all 8 focal seats with baseline/Tempo × hidden/disclosed labels.
The seed block is the independent unit; seat rotations and repeated baseline
visibility conditions are correlated controls. Rivals are two Tempo, two Economy,
two Composition and one Classic, always receiving hidden labels. Disclosure changes
only focal Tempo's upgrade reserve 18→25 HP against a Tempo opponent. Budgets are
6,000 accepted commands/lobby, 120 non-ending actions/turn plus Discover, ≤5 refreshes,
and zero search simulations. Policies were not tuned after inspection.

| Reserved condition | Complete / attempted | Mean place ↓ | First / top-four |
| ------------------ | -------------------: | -----------: | ---------------: |
| Baseline hidden    |                64/64 |       3.0156 |    22/64 / 49/64 |
| Baseline disclosed |                64/64 |       3.0156 |    22/64 / 49/64 |
| Tempo hidden       |                64/64 |       5.5000 |     0/64 / 18/64 |
| Tempo disclosed    |                64/64 |       5.5938 |     0/64 / 18/64 |

Over 8 block means, Tempo improvement is **−2.4844 (SE 0.3386)** hidden and
**−2.5781 (SE 0.3598)** disclosed. Disclosure effect is **−0.0938 (SE 0.0515)**;
baseline gameplay commands match across visibility, a zero-effect negative control.
All 320 lobbies finish with distinct placements, exact reconstruction and supply
conservation; no failure, command-limit stop or exclusion. The audit matches 295,712
decision rows and exact inputs/actions. Development round 5 shows Tempo's larger
board but delayed tier and more unused gold; this does not isolate the cause of its
placement deficit. It neither proves disclosure universally harmful nor compares
directly with the earlier single-seat opponent environment. Recorded 227.1 s evaluation
wall time overlapped other work and is not a throughput benchmark.

<a id="2026-10-04-hearth-recruitment-v2"></a>

## Recruitment v2: upgrade and replacement-spending interventions

[Results](2026-10-04-hearth-recruitment-v2.json) · [Full original report](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-04-hearth-recruitment-v2.md).

Source `f85353fc12603f0b3ca5266d2a620428eba6444e`, Hearth 5/arena 1. Frozen
Tempo 2× 2 factors are earlier upgrade cadence and an eligible two-gold weakest-unit
sale to fund an improving offer; Classic is the fifth reference. Five
`HEARTH-R2-DEV-20261004-1..5` and five disjoint `HEARTH-R2-EVAL-20261004-1..5`
seed blocks rotate all 8 seats against seven Classic controllers or hidden Mixed
Rivals. Development uses hidden labels; evaluation crosses focal hidden/disclosed
labels. Each result cell contains 40 lobbies but only 5 independent block means;
hero and seed are confounded. Budget 6,000 commands, zero search/provider calls,
two 512 MiB-heap workers. Policies, setup and pinned sources stayed fixed.

| Reserved population / labels | Classic | Tempo 1 | Upgrade | Spending |   Both |
| ---------------------------- | ------: | ------: | ------: | -------: | -----: |
| Classic / hidden             |  4.6000 |  6.4000 |  5.0500 |   6.4000 | 5.0500 |
| Classic / disclosed          |  4.6000 |  6.4000 |  5.0500 |   6.4000 | 5.0500 |
| Mixed / hidden               |  3.6250 |  5.8000 |  4.2750 |   5.6000 | 4.2000 |
| Mixed / disclosed            |  3.6250 |  5.7000 |  4.4000 |   5.5000 | 4.3500 |

Entries are mean placement, lower is better; every cell is 40/40 complete. Upgrade-only
improves Tempo in all 5 hidden blocks in both populations, but trails Classic by
**0.4500 places (SE 0.3742)** against Classic and **0.6500 (SE 0.2107)** against
hidden Mixed Rivals. Both beats Classic in only the Oathkeeper block, losing the
other 4; this cannot separate hero advantage from seed variation. Spending selects
47 sales across 45 of 320 enabled evaluation lobbies. Its small observed effect does
not establish that broader spending is unimportant. Disclosure helps Tempo/spending
by 0.1000 places each, but worsens Upgrade/Both by 0.1250/0.1500: no consistent benefit.
All 240 disclosure negative-control pairs retain identical gameplay commands.

All 1,200 lobbies finish with exact reconstruction and per-action supply conservation;
zero failures, budget stops, exclusions or source drift. Audits reconstruct 1,074,229
decision rows, including 122,557 focal diagnostics. Earlier upgrades trade early
bodies/health for tavern access. The old unused-gold development gap does not
reproduce broadly. Classic stays default; neither intervention changes game rules,
save formats or v1 policy bytes. Unit valuation and purchase priority remain future
hypotheses requiring separate versioned studies, not authorized successor execution.

<a id="2026-10-16-hearth-policy"></a>

## Public-policy adoption

[Results](2026-10-16-hearth-policy.json) · [Full original report](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-16-hearth-policy.md).

Hearth 6/content 6 (`4a2950bf`), arena 3, `hearth-policy-observation-1`,
`hearth-placement-1`, `mixed-rivals-v6-hidden-1`; Immediate/Survival/Growth all
`hearth-policy-1`. Ten `POLICY-ADOPTION-1-DEV` blocks × 45 conditions give 450
development cases; twenty disjoint `POLICY-ADOPTION-1-RESERVED` blocks give 900
reserved cases. Five heroes × 3 starting-HP tiers 52/40/28 × 3 policies share paired
seeds, independent `POLICY-STREAM-1` and 2,000 focal decisions. Mean placement is
primary; first-place and top-four counts are secondary. Repeated heroes are not
extra independent blocks. Serial/four-worker artifacts match; sources froze before
both cohorts and reserved outcomes did not tune policies.

All **1,350/1,350** cases finish and pass integrity/native replay/original-input/policy
audits, with zero errors/timeouts. Full 45-cell placements, rates and intervals remain
in the receipt. Only **2/45** exploratory paired progress intervals exclude zero,
without multiplicity correction; binary paired intervals and constant-sample
continuous intervals remain unavailable. Quartermaster Standard Immediate places
better than Growth (**3.20 vs 4.20**) but wins less often (**1/20 vs 7/20**), exposing
objective sensitivity. Survival is not consistently stronger; development Forgekeeper
Immediate places 4.2/4.9/3.8 across tiers, a counterexample to universal monotonicity.

Opaque first-seen aliases prevent hidden allocation gaps; native-span audit does not
call current focal/rival policies. A deliberate RNG leak fails input audit even when
replay/reproduction pass. A missing-difficulty replay-label UI defect was fixed
separately without rerunning or repinning frozen cohorts. A local extension completed
140 focal decisions/1,233 native commands and passed all four audits with matching source.
The boundary assumes cooperative modules; these local heuristics establish neither
hostile-code isolation, human-equivalent skill, enjoyment nor a calibrated human ladder.
