# Cartographer experiment ledger

Historical results and qualifications. The [policy contract](../../engineering/cartographer-policy.md)
owns current rules, observations and use. JSON receipts stay unchanged and retain
complete case outcomes, exact source/bundle identities and detailed audit scope.
Old local evidence paths may have been pruned under the [retention rule](../../engineering/maintenance.md#policy-iteration-retention).
Recovery links identify precompaction prose, not replacement experiment identities.

| Date       | Study                      | Population                                    | Outcome                                                                                                           |
| ---------- | -------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 2026-10-16 | Rules 2 policy adoption    | 90 development +180 reserved                  | All 270 win; saturated outcomes cannot establish a strength or win-rate difficulty order.                         |
| 2026-10-16 | Rules 3 development        | 90, 90,360,360 reused development attempts    | New encounter/resource ladder and bounded combat-history memory; final Survival 40/30/14 wins out of 40 per tier. |
| 2026-10-16 | Performance 2 assessment   | 900 existing artifacts                        | Post hoc rescoring distinguishes resource/speed tradeoffs; no new policy execution or fresh calibration.          |
| 2026-10-16 | Rules 3 fresh confirmation | 100 fresh blocks × 9 conditions =900 attempts | All 5 predeclared criteria pass; 489 wins/360 deaths/51 living budget stops, zero errors.                         |

<a id="2026-10-16-cartographer-policy"></a>

## Rules 2 policy adoption

[Results](2026-10-16-cartographer-policy.json) · [Full original report](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-16-cartographer-policy.md).

`cartographer-2`, `rooms-1`, observation 1, `cartographer-progress-1`; policies
Immediate/Survival/Growth are `cartographer-policy-1`. Ten
`POLICY-ADOPTION-1-DEV` and twenty disjoint `POLICY-ADOPTION-1-RESERVED` blocks
cross 3 policies × 3 HP tiers 48/36/28 with 2,000 decisions and `POLICY-STREAM-1`.
Policies use public turn forecasts/layout BFS, not true seeded successors. Source
and policy configuration froze before both cohorts; no reserved reruns or tuning.

All 270 attempts win and pass four audits, zero errors/timeouts. Every reserved cell
is 20/20 (individual Wilson 95% interval ≈83.9–100%), all clearing 9 rooms. Immediate
uses 86.9 mean turns at each tier; Survival 94.1 and full starting HP; Growth 101.2
and mean attack 6.7 versus 3.0 for the others. Growth takes more threat, 13.35 versus 9.05.
These are resource/efficiency tradeoffs, not a universal ranking. HP-only difficulty
changes remaining HP without separating sampled wins or per-policy command sequences.
Constant-sample and paired-binary intervals remain explicitly unavailable; exploratory
comparisons are unadjusted for multiplicity.

Independent review verified all 270 artifact/30,579 input digests, 8,399 forecasts
with relic combinations, and 3 historical state/continuation witnesses. CLI routing
initially rejected recorded wire ID `dungeon-cartographer`; a separate correction
and actual subprocess audit fixed this without rerunning/repinning the frozen study.
The original in-process audits had passed. Cooperative public policies do not prove
hostile-module isolation or human-equivalent perception.

<a id="2026-10-16-cartographer-strength-3"></a>

## Rules 3 development

[Results](2026-10-16-cartographer-strength-3.json) · [Full original report](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-16-cartographer-strength-3.md).

Rules 3 adds simultaneous enemies/King guards, durability, announced damage and tiered
brace/healing; generator, seeded streams, 9-room objective and ordinary commands stay.
Policy 2 uses bounded memory of previously observed positions/enemy HP to escape a
two-position safety cycle; memory contains no hidden seed/inactive foes/future intent.
Lethal rejection remains. Near-death bombers still produce living stops.

All cohorts reuse `CARTOGRAPHER-STRENGTH-3-DEV` labels with 2,000 decisions; they
are adaptive selection data, not independent replications or reserved confirmation.

| Candidate                                   | DEV blocks / attempts | Survival wins Relaxed / Standard / Severe | Living stops, all policies |
| ------------------------------------------- | --------------------: | ----------------------------------------: | -------------------------: |
| Development 1: initial group/defense ladder |                 10/90 |                                    10/9/3 |                      11/90 |
| Development 2: public combat-history memory |                 10/90 |                                    10/9/4 |                       3/90 |
| Development 3: Standard extra enemies 1→2   |                40/360 |                                  40/39/14 |                     12/360 |
| Development 4: Standard enemy HP bonus 2→4  |                40/360 |                                  40/30/14 |                     24/360 |

All attempted cases pass four audits, zero execution errors. Final Immediate wins 40/9/1,
Survival 40/30/14 and Growth 40/13/0, each out of 40 per tier. Development selection
makes these estimates optimistic. Historical v1/v2 fixtures and continuation hashes
remain exact; v2 continuations were checked against native source `35c0ea1`.
A faulty capture used policy aliases as native IDs; the corrected fixture takes
accepted native journal commands and checks rejection, never deriving old expected
states from the rebalanced resolver. Historical reproduction needs its frozen runtime.

<a id="2026-10-16-cartographer-performance-2"></a>

## Performance 2: post hoc objective assessment

[Results](2026-10-16-cartographer-performance-2.json) · [Full original report](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-16-cartographer-performance-2.md).

`cartographer-performance-2` ranks victory → cleared rooms including entrance →
winning HP fraction → fewer winning accepted commands. The last 2 components are
zero for nonwins; execution errors are invalid, and zero-turn menu actions count.
Native state, observation, policy choices and original score 1 bytes stay unchanged.

This rescored **900 existing artifacts**: 180 rules 2 reserved, 360 development 3 and 360
development 4 cases, the latter reusing the same 40 blocks. No policy ran. Exact
original bytes/native metrics/cursor were checked in each cohort's frozen native
environment. A first attempt failed because two unreleased v3 prototypes shared a
version label but different Standard balance; the accepted sidecar uses each exact
frozen runtime rather than today's resolver.

On development 4's 40 attempted pairs, health-first Survival versus Immediate is
higher/lower/tied 39/1/0 Relaxed, 35/4/1 Standard and 27/11/2 Severe. Moving command
efficiency before health reverses Relaxed preference: Immediate 25/40 versus
Survival 15/40. Conditional winning means exclude different failures and are not
unbiased whole-population comparisons. The old rules 2 Survival adjacent tiers
tie 20/20 under both objectives; all 3 policies' journals match across old tiers.
A score can expose tradeoffs without repairing saturated native difficulty. These
ordinal comparisons are exploratory, not fresh significance tests or fairness audits.

<a id="2026-10-16-cartographer-strength-confirmation-3"></a>

## Rules 3 fresh confirmation

[Results](2026-10-16-cartographer-strength-confirmation-3.json) ·
[unchanged analyzer protocol](2026-10-16-cartographer-strength-3-protocol.md) ·
[Full original report](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-16-cartographer-strength-confirmation-3.md).

Rules 3/`rooms-1`/observation 2/score 2, all 3 `cartographer-policy-2` priorities;
100 fresh `CARTOGRAPHER-STRENGTH-3-RESERVED-01..100` blocks × 3 tiers × 3 policies,
`POLICY-STREAM-1`, 2,000 decisions. Survival is the fixed reference; full source,
bundle, protocol, fixtures and grid froze before execution, with no weakening,
optional stopping or source drift. Plan SHA-256 remains
`d1b81087d1699ab00a0cc4cd94e1178568fae781ccf04d6bc4e2bc6f1d431a17`.

| Wins / 100 attempts | Relaxed | Standard | Severe |
| ------------------- | ------: | -------: | -----: |
| Immediate           |     100 |       40 |      6 |
| Survival            |     100 |       83 |     30 |
| Growth              |     100 |       24 |      6 |

Survival R−S, S−Severe and Severe S−I gaps are **17/53/24 percentage points**,
discordant pairs 17/0, 57/4, 28/4, Holm-adjusted p=0.0000305,
0.00000000000146, 0.0000305. All exceed the predeclared 10 pp gap and pass the three-test
exact paired-binomial family at 0.05. Survival's Wilson 95% intervals are 96.3–100%,
74.5–89.1%, 21.9–39.6%; lower bounds meet >50% Relaxed and >10% Standard. All 5
substantive criteria pass; paired confidence intervals remain unavailable.

All 900 attempted cases remain in the denominators: **489 victories, 360 deaths, 51
living stops, zero errors**. All 4 producer audits pass. Independent review verifies
every original payload, 224,771 input hashes and 900 native reconstructions, then
reruns all four audits on a selected Relaxed win, Severe win, death and timeout; separate
exact statistics/analyzer rerun match. Four seeds favor Severe over Standard Survival
and 4 favor Severe Immediate over Survival. This is calibration for the fixed cohort,
policies and budget, not universal seed ordering, human-equivalent skill or enjoyment.
