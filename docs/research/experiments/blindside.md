# Blindside experiment ledger

Dated findings, not a new evaluation. The unchanged JSON receipt retains individual
cases, uncertainty, original protocols and source/tool/runtime/bundle identities.
Recovery links identify the precompaction document, not a new experiment revision.
Raw paths named in old records describe their availability then; closed bulk
recordings were later pruned under the [retention policy](../../engineering/maintenance.md#policy-iteration-retention).
Current interfaces belong to the [policy guide](../../engineering/blindside-agent.md).

<a id="2026-10-16-blindside-policy"></a>

## 2026-10-16 policy adoption

| Design                                                                                                                                                                                                                                             | Outcome / decision                                                                                                                                                                                                                       | Limits                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Rules5, `blindside-policy-1`; Immediate/Survival/Growth across Relaxed/Standard/Severe. Ten development seed blocks × nine conditions = 90 attempts; twenty disjoint reserved blocks × nine = 180. Independent `POLICY-STREAM-1`, 2,000 decisions. | All 270 attempts terminated, with zero errors/timeouts and four passing audits. Growth won 14/20 Standard runs, versus Immediate 3/20 and Survival 5/20. Adopted observation-only extension, original-input recording and replay review. | Fixed local policies/cohorts; no universal strategy ranking, human-skill, enjoyment or calibrated human-difficulty claim. |

Reserved wins / 20 attempts per cell:

| Tier     | Immediate | Survival | Growth |
| -------- | --------: | -------: | -----: |
| Relaxed  |         6 |       14 |     17 |
| Standard |         3 |        5 |     14 |
| Severe   |         1 |        5 |     11 |

Development wins / 10 were Immediate 3/2/1, Survival 6/4/3 and Growth 10/8/7
across the same tier order; no policy tuning followed those results. Reserved mean
progress was Immediate 22.69/19.61/18.14, Survival 23.57/20.42/20.65 and Growth
22.91/21.46/21.03. Growth could win more yet lose earlier; Survival's Severe mean
slightly exceeded Standard. All nine paired progress intervals included zero.
Individual win-rate intervals were unadjusted 95% Wilson; progress used descriptive
Student-t intervals over independent seed blocks, without multiplicity correction.

Native ranking was win, then stages passed plus current score fraction, then cash.
The frozen protocol's phrase “blinds-cleared” was a prose error: implemented progress
always counted cleared **or skipped** stages. Original protocol bytes and results
remain unchanged; no score was recalculated to repair that wording. Standard
retained v4 gameplay while target multipliers became .75/1/1.35.

The public observation withheld environment seed/RNG/future order and bosses.
Original inputs were detached before invocation. Four audits separately checked
integrity, accepted-command replay, permitted knowledge and matching-policy
reproduction; a legal replay alone did not prove the information boundary.
Historical v4 fixture reconstruction, continuation and save-slot isolation passed.
This is a cooperative in-process boundary, not hostile-code isolation.

Recorded provenance includes a subsequently deleted generated entry under macOS
`/var` versus `/private/var`: the retained bundle remains identified, but complete
source-set equality is unavailable for those historical reports. Later import and
policy-ID validation hardened tooling without rerunning the reserved cohort.
The dated final gate was 452 application tests / 37 simulations, with focused browser
review; it is not a current-build verification claim.

- [Exact results and provenance](2026-10-16-blindside-policy.json)
- [Full original report](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-16-blindside-policy.md)
