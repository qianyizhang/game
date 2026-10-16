# Cartographer v3 strength and ladder confirmation protocol

This protocol is prospective: no `CARTOGRAPHER-STRENGTH-3-RESERVED` outcome has been
executed or inspected when this candidate is declared. Changes after reserved
inspection require a new namespace, protocol and frozen candidate. The
[development report](2026-10-16-cartographer-strength-3.md) records candidate selection.

## Frozen candidate and population

- **Rules:** `cartographer-3`; generator `rooms-1`; observation
  `cartographer-observation-2`; score `cartographer-performance-2`.
- **Policies:** Immediate, Survival and Growth, all `cartographer-policy-2`.
  Survival is the fixed reference at every difficulty. Policy priorities and
  resources remain identical across tiers; no difficulty-specific weakening.
- **Population:** 100 independent seed blocks,
  `CARTOGRAPHER-STRENGTH-3-RESERVED-01` through
  `CARTOGRAPHER-STRENGTH-3-RESERVED-100`. The first 99 use two digits where sufficient;
  the final label is `100`, as emitted by the existing cohort generator. Cross all
  three tiers and all three policies: **900 attempted episodes**. Repeated policies
  and tiers are paired observations within a block, not extra independent seeds.
- **Budget:** 2,000 decisions per episode; independent policy seed and empty explicit
  options as recorded by the benchmark. At most two execution workers. No interim
  stopping or sample-size expansion based on observed results.
- **Balance:** HP 48/36/28; ordinary extra enemies 0/2/2; enemy HP bonus 0/4/4;
  hit bonus 0/1/2; brace mitigation 3/2/1 per hit; healing rooms 8/6/4;
  King's guards 1/2/3, for Relaxed/Standard/Severe respectively. Base room groups
  remain two enemies, or three in permanent-attack upgrade rooms. Existing threat
  adds one damage at eight, independently of the tier bonus.

Before execution, obtain independent review and freeze the complete runtime source
and tool digests, exact bundled bytes, this protocol digest, native replay fixture
hashes, configuration and seed grid. Retain the resulting plan, raw rollouts, audits,
report and exact frozen source bytes. The maintained
`packages/workshop-tools/policy/analyze-cartographer.ts` derives the exact complete
current native/tool pin set through the real Cartographer runtime; its separate
analysis pins include the analyzer, statistical helpers, protocol and both historical
fixtures. Summary validation does not independently prove the raw rollout audits.
Source changes during a study invalidate its
confirmation identity; retained development evidence must not be silently repinned.

## Outcomes and integrity

The primary endpoint is **victory within 2,000 decisions**. Native losses and budget
stops are nonwins in the full attempted denominator. Timeouts remain explicitly
classified living budget stops; they are not silently called native deaths or
execution errors. Report native completion, deaths, timeouts and exact paired
cohort sizes beside win rates and Wilson 95% intervals.

Require exactly 900 distinct planned rows with no missing/duplicate cases, source
or runtime drift, execution errors, invalid proposals or failed audits. All four
rollout checks must pass for every attempt: integrity, replay, original inputs and
policy decision reproduction. A failed integrity requirement prevents confirmation;
it does not delete the case or turn it into a game loss.

Score metadata declares the ordered vector: victory, cleared rooms including the
entrance, victorious HP fraction, then fewer victorious accepted commands. The last
two components are zero for nonvictories. Accepted commands include zero-turn menus.
This score identity/ranking amendment occurred before reserved execution; the three
primary win contrasts and two absolute playability criteria below are unchanged.
Report score comparisons, work, attack, threat, relics and native turns descriptively;
score separation does not substitute for win-rate confirmation. Do not choose a
different primary metric after seeing reserved outcomes.

## Primary criteria

Use a single family of three predeclared contrasts, paired by the same 100 seeds:

| Contrast                                 | Required observed win-rate gap | Statistical criterion  |
| ---------------------------------------- | -----------------------------: | ---------------------- |
| Survival Relaxed minus Survival Standard |                  At least 0.10 | Holm-adjusted p < 0.05 |
| Survival Standard minus Survival Severe  |                  At least 0.10 | Holm-adjusted p < 0.05 |
| Severe Survival minus Severe Immediate   |                  At least 0.10 | Holm-adjusted p < 0.05 |

For every contrast, count discordant paired wins and apply the existing two-sided
exact conditional binomial test (`binaryContrast`). Apply Holm correction to all
three tests together, including negative results. The observed direction must
match the declared direction; a significant reversed effect fails. A paired
confidence interval is unavailable in this analyzer and must remain labeled so.
No unpaired t-test, zero-width interval or repeated-tier sample inflation.

Absolute playability also requires the fixed reference's Wilson 95% lower bound to
exceed **0.50 on Relaxed** and **0.10 on Standard**. These are declared empirical
playability checks; they do not change the three-test family or claim simultaneous
coverage of all descriptive intervals. All five substantive criteria and the full
integrity gate must pass to call this confirmation successful.

Other policy/tier contrasts and metrics are descriptive, including Growth's tradeoff
between permanent attack and present safety. Preserve counterexamples and negative
results. These structured exact-warning policies do not establish human perception,
human-equivalent skill, combat enjoyment or player acceptance.

## Reproduction

```sh
npm run engine:policy -- benchmark --game cartographer --split evaluation --cohort CARTOGRAPHER-STRENGTH-3 --blocks 100 --pool 2 --out test-results/cartographer-strength/evaluation-3
node packages/workshop-tools/policy/analyze-cartographer.ts test-results/cartographer-strength/evaluation-3 FROZEN_PLAN NEW_ANALYSIS
```

Run only after the frozen plan and independent audit are complete. The complete
matrix is required; do not select policies or seeds after looking at outcomes.
