# Spire policy adoption · 2026-10-16

Spire now supports local observation-only policy extensions, public legal menus and
original-input rollout review for both characters at existing Ascensions 0/2/5.
All **540 recorded cases** completed and passed four audit checks. Policy quality
remains limited: reserved evaluation produced only **3 wins in 360 attempts**, all
Silent A0. This slice establishes the development mechanisms and measured baselines,
not strong play or a calibrated win-rate ladder.

The [game contract](../../engineering/spire-agent.md) owns information boundaries,
setup, metrics, extension/review commands and limitations. The [receipt](2026-10-16-spire-policy.json)
contains complete case metrics/digests, original protocols/summaries, exact report and
bundle hashes, source/tool/runtime pins and corrected paired-win analysis. Full original
rollouts/audits/bundles remain protected under `test-results/spire-policy/`.

## Frozen comparison

- **Environment:** rules v3 and existing content/replay; Ironclad and Silent crossed
  with Ascensions 0, 2 and 5. Setup is an ordinary recorded evaluator command, excluded
  from policy actions. No rule/content meaning or historical fixture changed.
- **Policies:** `spire-policy-1` Immediate, Survival and Growth; public-effect estimates
  and legal-menu ranking, without true seeded transition lookahead. Different priorities
  affect damage/defense/scaling, rewards, upgrades, routes and investments. Utility
  scores and top alternatives are diagnostics, not probabilities or causal explanations.
- **Seeds/budgets:** 10 development blocks × 18 conditions = **180 attempts**; 20
  disjoint reserved blocks × 18 = **360 attempts**. One fixed independent policy stream,
  2,000 decisions maximum. Both characters are separate strata; repeated characters
  on one seed are not pooled as independent samples.
- **Objective:** win → rooms reached → HP → gold. Rooms reached is
  `16*(act-1)+max(0,row+1)`, not cleared rooms. The legacy defeat message's 17-floor
  stride is not used for scoring. Work counts legal candidates scored, excluding
  other bookkeeping and recording, and is not elapsed compute time.
- **Freeze:** development-only probes informed mechanics corrections, including target-
  specific Weak, upgraded reward valuation, self-harm avoidance and collection healing
  capacity. The canonical development/evaluation recordings use the same frozen
  policy/boundary/forecast sources. No reserved tuning or game rerun occurred.

## Reserved results

Every table cell has **20 attempts**, all terminal; **zero errors/timeouts** occurred
in either cohort. All **540 audits** passed integrity, recorded-proposal/delivered-replay
reconstruction, permitted-input reconstruction and deterministic policy reproduction.

| Character / Ascension | Immediate wins / mean rooms reached | Survival wins / mean rooms reached | Growth wins / mean rooms reached |
| --------------------- | ----------------------------------- | ---------------------------------- | -------------------------------- |
| Ironclad A0           | 0/20 · 25.05                        | 0/20 · 25.50                       | 0/20 · 21.20                     |
| Ironclad A2           | 0/20 · 23.80                        | 0/20 · 23.90                       | 0/20 · 19.40                     |
| Ironclad A5           | 0/20 · 22.75                        | 0/20 · 20.50                       | 0/20 · 19.40                     |
| Silent A0             | 0/20 · 24.00                        | 2/20 · 28.75                       | 1/20 · 19.55                     |
| Silent A2             | 0/20 · 20.50                        | 0/20 · 22.80                       | 0/20 · 16.25                     |
| Silent A5             | 0/20 · 19.80                        | 0/20 · 19.60                       | 0/20 · 14.40                     |

**Uncertainty:** 0/20 wins has a 95% Wilson interval of approximately **0–16%**, not
zero population win probability. 1/20 is approximately 1–24%; 2/20 is 3–30%. The
receipt contains full per-cell intervals. Paired progress intervals use approximate
Student t uncertainty over twenty independent seed blocks within a setup, without
multiple-comparison correction. Five of eighteen exploratory progress comparisons
exclude zero; this does not establish a complete or universal ordering.

**Counterexamples:** Growth is often worse, especially for Silent. Its growth weighting can
trade immediate protection for later value; this study does not isolate the cause.
The public model approximates special interactions, per-hit mitigation/ordering and
long-horizon consequences. Immediate and Survival frequently overlap. Ironclad Growth reached farther
on development A0 (28.6 versus Immediate 24.5), but less far on reserved A0 (21.2 versus
25.05). All mean progress rows decrease or tie as Ascension rises, but scarce victories
prevent useful win-rate calibration. Future strength improvements require new versions,
development and fresh reserved cohorts; these policies are extension baselines.

## Independent review correction

The frozen analyzer applied a Student t interval to paired binary win differences.
With both policies losing every sampled case, sample variance is zero; it reported
`[0,0]` in **15/18 reserved pairs**. A finite rare-event sample cannot establish exact
population equality. A fresh Astra reviewer found this defect.

Original reports/protocols remain unchanged. The receipt explicitly separates
`originalFrozenPaired` from source-pinned `correctedPaired`. Corrected binary analysis
retains signed point estimates and discordance counts, with the paired-binomial interval
**unavailable** and an explicit reason. Individual Wilson win-rate intervals and
continuous progress intervals remain unchanged. Future reports use the correction.
The variance-based helper also marks constant continuous samples unavailable rather
than reporting zero-width certainty; no Spire progress comparison has zero variance,
so its numeric progress intervals are unchanged. Historical Blindside reports remain
original. No policy tuning, new reserved cases or game execution was used for this reanalysis.

## Mechanisms and checks

- **Public boundary:** seed/RNG/order, room encounter payloads, chance accumulators,
  AI cycle/history, internal continuations and unobserved card registry stay private.
  An allocated treasure relic remains hidden until the chest opens. Enemy targetability
  uses actual public alive/rebirth semantics, including potions. Only declared public
  relic counters are exposed; adding a rules counter cannot silently expand observation.
- **Legal actions:** shared pure combat preconditions, public event/shop/rest checks,
  pending choices, cost/status/target validation; no policy-visible seeded successor
  search. Historical win/loss replay samples cover every phase. Controlled tests cover
  an unopened chest, rebirth, special costs, Entangled, Clash, card choices and stale
  actions. An intentional evaluator-RNG leak fails input audit while replay stays valid.
- **Extension/evidence:** fresh factory memory, fixed public setup and independent
  policy stream; original inputs/proposals/work/alternatives and replay cursor spans.
  A local TS example completes an episode and independently audits. Unknown factories
  leave reproduction unavailable; current audits expose source identity separately.
- **Review:** isolated native map/combat/table with original knowledge/proposal default,
  explicit evaluator view, original-byte downloads, phase/turn/direct navigation,
  before/after and play/speed. Passive command controls preserve pile/deck inspection.
  Browser tests prove no Storage access and unchanged live saves during review.

**Verification:** final `npm run check` passes maintained/static scopes, **462 application
tests across 78 files** and **37 seeded simulations across eight files**. Four tools
regressions cover runtime source identity, independent strata/complete grids and
unavailable uncertainty for rare/constant observations. Six
focused/legacy browser journeys passed, followed by a final spectator-polish rerun.
Desktop/390-pixel screenshots were inspected with no document overflow. Geometry/native
asset gates are outside the changed rules/UI/evidence tooling.

The fresh Astra review uses base `473a61d`; the statistical finding and floating-point
constant-sample guard are fixed, while original measured policies/replays remain intact. Fairness is a cooperative in-process boundary,
not hostile-code isolation. Structured public data/arithmetic and limited local cohorts
do not establish human-equivalent play, enjoyment or general playing strength.
