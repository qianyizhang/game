# Spire experiment ledger

All studies below retained native rules3; policy development did not rebalance the
game. Unchanged JSON receipts retain case results, inference, original source/bundle
pins and historical audit coverage. The [strength4 protocol](2026-10-16-spire-strength-4-protocol.md)
remains a byte-pinned analyzer input. Current APIs belong to the
[policy guide](../../engineering/spire-agent.md). Recovery links identify old documents;
historical raw-path and “retained” statements do not override later bulk-recording
[retirement](../../engineering/maintenance.md#policy-iteration-retention).

<a id="2026-10-16-spire-policy"></a>

## 2026-10-16 adoption and statistical correction

Policy1 crossed two characters, A0/2/5 and Immediate/Survival/Growth: ten development
blocks gave 180 attempts and twenty disjoint reserved blocks gave 360, all under
2,000 decisions and an independent policy stream. All 540 terminated without
errors/timeouts and passed four audits. Reserved wins were **3/360**, all Silent A0:
Survival 2/20 and Growth 1/20; every other policy/character/Ascension cell was 0/20.
These established extension/review mechanisms, not strong play or calibration.

The first analyzer incorrectly reported zero-width paired binary intervals in
15/18 reserved comparisons where both policies lost every sampled case. Corrected
analysis preserved point estimates/discordance, marked paired binary intervals
unavailable, and left individual Wilson and nonconstant progress intervals unchanged.
0/20's Wilson interval was about 0–16%, not zero population win probability.
Original frozen and corrected inference remain distinguishable; no policy rerun or
reserved tuning occurred. Five of eighteen exploratory progress intervals excluded
zero without multiplicity correction; no complete strategy order follows.

- [Results and original/corrected inference](2026-10-16-spire-policy.json)
- [Original adoption report](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-16-spire-policy.md)

<a id="2026-10-16-spire-strength"></a>
<a id="2026-10-16-spire-strength-protocol"></a>
<a id="2026-10-16-spire-strength-3-protocol"></a>

## 2026-10-16 strength2 and strength3: failed confirmations

Both prospective designs required zero execution errors, four audits per case,
complete paired grids, no source drift and **every attempt terminal**. Their four
primary contrasts used exact conditional binomial tests with one Holm family;
strength required A0 Wilson lower bound >10%, improvement ≥10 percentage points
and adjusted p<.05. Difficulty required A0–A5 gap ≥10 points, adjusted p<.05 and
the intermediate A2 point estimate between the endpoints. Paired binary intervals
remained unavailable. Samples were fixed without optional stopping or reserved tuning.

| Study               | Frozen population / reference                                                                                                                                                                                                                                | Result / rejection                                                                                                                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Strength2 / policy2 | `SPIRE-STRENGTH-2-RESERVED-01..60`; six character/A0/2/5 conditions × four policies = 1,440 attempts, 2,000 decisions. Development selected Ironclad Growth and Silent Survival, frozen across Ascensions; exact policy1 factories were historical controls. | All terminal, four audits each. Ironclad Growth A0 6/60 versus historical 2/60, A2 3/60, A5 0/60: failed strength/difficulty. Silent Survival 20/60, 14/60, 4/60 versus historical A0 4/60 passed its statistical criteria. Overall failed; the alternative Ironclad Survival's 11/60 cannot replace the frozen reference afterward. |
| Strength3 / policy3 | New `SPIRE-STRENGTH-3-RESERVED-01..100`; Survival3 versus exact Survival1 at six conditions = 1,200 primary attempts; Immediate/Growth3 on first twenty matched blocks = 240 companions. `POLICY-STREAM-1`, 2,000 decisions; all 42 pins held.               | Four audits on all 1,440; zero execution errors. Ironclad's A0 Wilson lower bound 7.0% missed >10%. Three historical-control timeouts also violated the terminal requirement. Overall `integrity:false` and `allCriteriaPassed:false`, despite Silent's passing statistical criteria.                                                |

Strength3 primary wins / 100:

| Character | Survival3 A0 / A2 / A5 | Historical Survival1 A0 | Strength adjusted p | A0–A5 adjusted p |
| --------- | ---------------------- | ----------------------: | ------------------: | ---------------: |
| Ironclad  | 12 / 8 / 2             |                       0 |             .000977 |           .00635 |
| Silent    | 35 / 25 / 5            |                      11 |             .000116 |     .00000000745 |

All 600 current primary and 240 companion attempts terminated. Historical-control
timeouts were Ironclad A5/block20, Ironclad A0/block35 and Silent A0/block41;
all remain in their denominators. Descriptive twenty-block comparisons used those
same twenty primary blocks, not the full hundred or extra independent observations.
Different policy work prevents an equal-compute causal claim.

Policy3 fixed a public persistent-Block stall: the frozen policy2 lost the complete
Spheric Guardian regression after 44 decisions; policy3 won in 13 with 40 HP.
A broader boss-pressure variant was rejected. The public-only beam used depth5,
width12 and stopped at uncertain draws/hidden phases; it never received seeded
private state. Local combat correctness did not guarantee full-run strength.

- [Both failed confirmations and full matrices](2026-10-16-spire-strength.json)
- [Original strength report](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-16-spire-strength.md)
- [Full strength2 preregistration](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-16-spire-strength-protocol.md)
- [Full strength3 preregistration](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-16-spire-strength-3-protocol.md)

<a id="2026-10-16-spire-strength-development-4"></a>

## 2026-10-16 policy4 development

Forty consumed `SPIRE-STRENGTH-4-DEV` blocks were reused deliberately, with Survival4
and 2,000 decisions. A0/A2/A5 formed 240 complete four-audit cases; the later A3 screen
added 80 recordings, with four independently rerun four-audit cases and producer
coverage for the other 76.

| Character |    A0 |    A2 |    A3 |   A5 |
| --------- | ----: | ----: | ----: | ---: |
| Ironclad  |  9/40 | 12/40 | 12/40 | 3/40 |
| Silent    | 16/40 | 10/40 |  9/40 | 5/40 |

Ironclad's middle-tier inversion remained negative evidence. A3 was selected for its
native elite-pressure meaning before the A3 probe, not substituted after seeing the
inversion. Repairs covered ordered public hand-end/health-loss effects, disclosed
enemy effects, stasis energy and collection choices. Broader horizons, Fire Breathing,
boss targets and health-reserve/growth variants did not establish reproducible
improvement and were rejected. A source-drift attempt was not a valid frozen study.
Retaining development source bytes afterward was not a prospective freeze.

- [Development results and audit scope](2026-10-16-spire-strength-development-4.json)
- [Original development report](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-16-spire-strength-development-4.md)

<a id="2026-10-16-spire-strength-confirmation-4"></a>

## 2026-10-16 strength4: fresh confirmation passed

The [retained prospective protocol](2026-10-16-spire-strength-4-protocol.md) fixed
400 fresh paired reserved blocks **per character**, A0/3/5, Survival4 versus exact
historical Survival1: 4,800 primary attempts. Immediate/Growth4 added 240 companion
attempts on the first twenty matched blocks. Native rules3/observation1/progress1,
base content3 digest `8192b770`, `POLICY-STREAM-1` and 2,000 decisions were fixed.
Unlike the failed predecessors, this protocol prospectively counted budget stops
as nonwins rather than requiring universal native termination.

| Character | Survival4 A0                       |     A3 |     A5 | Historical Survival1 A0 | Strength / endpoint adjusted p |
| --------- | ---------------------------------- | -----: | -----: | ----------------------: | ------------------------------ |
| Ironclad  | 98/400; 24.5%, Wilson 20.5–28.9%   | 86/400 | 32/400 |                   5/400 | 1.34×10⁻²³ / 9.90×10⁻¹¹        |
| Silent    | 135/400; 33.75%, Wilson 29.3–38.5% | 74/400 | 43/400 |                  43/400 | 3.97×10⁻¹⁵ / 1.96×10⁻¹⁵        |

Both characters passed useful strength and endpoint separation; A3 point estimates
lay between endpoints. There were 5,033 native endings, seven budget timeouts and
zero errors. Silent4 supplied three stops (two A0, one A5), historical Ironclad
four (three A0, one A3). All 5,040 attempts retained producer audits; independent
review checked all original payload/input/native links and freshly reproduced
27 cases in four parts, leaving 5,013 with producer reproduction coverage.
The 44 source pins and rebuilt bundles matched the freeze; independent arithmetic
and an analyzer rerun matched. These are historical audit claims, not promised
current raw-file availability.

Holm controlled four tests within this study, not the adaptive series. No adjacent-
Ascension significance, universal strategy order, equal-compute effect, human
equivalence or guaranteed natural campaign completion follows. Silent Growth beat
Survival on the small A5 companion subset; the earlier failures and Ironclad
development inversion remain failures.

- [Exact confirmation, companion matrices and provenance](2026-10-16-spire-strength-confirmation-4.json)
- [Original confirmation report](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-16-spire-strength-confirmation-4.md)
