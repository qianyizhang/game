# Cartographer v3 strength and difficulty confirmation

**The frozen 900-case study passed all five declared criteria.** Survival won
100/100 Relaxed, 83/100 Standard and 30/100 Severe attempts. Independent final raw
artifact review passed; the source freeze and analyzer results are retained in
the [receipt](2026-10-16-cartographer-strength-confirmation-3.json).

## Fixed comparison

The [prospective protocol](2026-10-16-cartographer-strength-3-protocol.md) declared
100 fresh `CARTOGRAPHER-STRENGTH-3-RESERVED` seed blocks, crossed with three tiers
and three version-2 public policies. All attempts used rules v3, observation v2,
score v2, the same independent policy stream and 2,000 decisions. The reference
was Survival at every tier; no policy weakening or outcome-based sample expansion.

Before execution, we retained the exact compiled bundle, 24 unique source/tool/analysis
pins and matching source bytes, protocol, historical fixtures and fixed grid. The
plan SHA-256 is
`d1b81087d1699ab00a0cc4cd94e1178568fae781ccf04d6bc4e2bc6f1d431a17`.
The source, protocol and reference remained fixed throughout execution and analysis.

## Results

Each cell is victories / 100 independent seed blocks for that condition.

| Policy    | Relaxed | Standard | Severe |
| --------- | ------: | -------: | -----: |
| Immediate | 100/100 |   40/100 |  6/100 |
| Survival  | 100/100 |   83/100 | 30/100 |
| Growth    | 100/100 |   24/100 |  6/100 |

Survival's individual Wilson 95% win-rate intervals are **96.3–100%**, **74.5–89.1%**
and **21.9–39.6%**, respectively. Repeated tiers and policies are paired within the
same seed block, rather than additional independent seeds.

| Predeclared contrast            |         Win-rate gap | Discordant pairs A-only / B-only |  Holm-adjusted p |
| ------------------------------- | -------------------: | -------------------------------: | ---------------: |
| Survival Relaxed minus Standard | 17 percentage points |                           17 / 0 |        0.0000305 |
| Survival Standard minus Severe  | 53 percentage points |                           57 / 4 | 0.00000000000146 |
| Severe Survival minus Immediate | 24 percentage points |                           28 / 4 |        0.0000305 |

All three exceed the declared ten-percentage-point minimum in the intended
direction and pass the three-test Holm family. The exact paired conditional
binomial test uses discordant wins; paired confidence intervals remain unavailable.
Survival also passes the absolute playability checks: Wilson lower bounds exceed
50% on Relaxed and 10% on Standard.

There are counterexamples: four seeds favor Severe over Standard Survival, and four
favor Severe Immediate over Survival. Calibration is a cohort-level finding under
this fixed policy and budget; it does not promise a universal ordering on every seed.

## Integrity and completion

All 900 attempts reported passing integrity, native replay, original-input and
decision audits, with no execution errors or source drift. There were **489 native
victories, 360 native deaths and 51 living budget stops**. The latter remain nonwins
in every attempted denominator; they are not silently described as deaths.

The versioned ordinal score remains victory → rooms cleared → winning health
fraction → winning accepted-command efficiency. Its comparisons remain descriptive;
none replaced the frozen win-rate endpoints after execution. The
[post hoc score assessment](2026-10-16-cartographer-performance-2.md) remains separate
from this fresh study. Original v1/v2 native replay fixtures and earlier saturated
and negative development evidence remain intact.

The final code candidate passed maintenance/static/build gates, **541 application
tests and 37 seeded simulations**. Five maintained policy-browser journeys passed,
including historical Cartographer save/continuation/export. These technical gates
do not establish human perception, enjoyment or human-equivalent skill. Independent
review verified every original payload, all 224,771 input hashes and
all 900 native reconstructions, then independently reran all four rollout audit
dimensions on a selected Relaxed win, Severe win, death and living timeout. Its
separate exact-statistics calculation and analyzer rerun match the retained result.
