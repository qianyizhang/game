# Cartographer performance score v2 · post hoc assessment

**Implemented score semantics; exploratory comparisons only.** The new score separates
successful health preservation and action efficiency from victory/progress. It does
not establish fresh policy strength or win-rate difficulty calibration. The
[receipt](2026-10-16-cartographer-performance-2.json) records exact old artifact hashes,
frozen native bundles, new scoring provenance and every rescored tuple.

## Declared objective

`cartographer-performance-2` compares this numeric vector in order:

| Component                    | Direction | Meaning                                                  |
| ---------------------------- | --------- | -------------------------------------------------------- |
| Victory                      | Maximize  | One for a native victory, zero otherwise                 |
| Rooms cleared                | Maximize  | Includes the entrance                                    |
| Victorious health fraction   | Maximize  | HP / max HP for victories; zero otherwise                |
| Victorious accepted commands | Minimize  | Full native journal length for victories; zero otherwise |

Every earlier component takes precedence; no weighted sum or cross-game score is
implied. This is an explicit health-first objective. Native losses and living budget
stops retain progress but receive no resource/efficiency bonus. Execution errors
remain invalid evidence. Attack, damage dealt, generated choices, threat and relic
counts do not earn farmable points. Command count includes zero-turn drafting,
relics and cancellations, so an otherwise identical winning cancel/redraft loop
scores worse even though native turn count is unchanged.

The score is evaluator output, not extra policy knowledge. Observations, commands,
policy choices, native game state, seeded generation and replay formats are unchanged.
Original score-1 artifacts retain their exact bytes and identity; score-2 sidecars
identify a different evaluator interpretation explicitly.

## Reconstructed evidence

The assessment reuses **900 existing artifacts**, not 900 new episodes:

- **Historical v2:** 20 originally reserved seed blocks × three policies × three
  tiers = 180 artifacts. Their reuse for the new score is post hoc exploration.
- **V3 development 3:** 40 blocks × nine conditions = 360 artifacts.
- **V3 development 4:** the same 40 development blocks × nine conditions = 360
  artifacts. These two candidates are not independent replications.

For each artifact, verify the exact original rollout digest/bytes and its cohort's
original frozen native bundle. Reconstruct that native replay, verify all original
native metrics and accepted-command cursor, then calculate the new tuple with the
current score-2 metrics implementation. No policy is called. The retained receipt
includes the analysis script bytes/digest and current scoring bundle/pins.

An initial diagnostic correctly failed when it tried to restore an earlier v3
prototype with the current v3 resolver: Standard's unreleased balance had changed
between development candidates sharing the v3 label. The accepted assessment uses
each cohort's exact frozen native environment. The failed attempt remains in
`test-results/cartographer-strength/score-assessment-2`; the accepted sidecar is in
`test-results/cartographer-strength/score-assessment-2-final`.

## Current v3 development comparisons

These are paired ordinal score counts over all 40 attempted seeds, including
failures and budget stops. They are not win counts or new significance tests.

| Comparison                          | A scores higher | B scores higher |   Ties |
| ----------------------------------- | --------------: | --------------: | -----: |
| Relaxed: Survival versus Immediate  |         39 / 40 |          1 / 40 | 0 / 40 |
| Standard: Survival versus Immediate |         35 / 40 |          4 / 40 | 1 / 40 |
| Severe: Survival versus Immediate   |         27 / 40 |         11 / 40 | 2 / 40 |
| Survival: Relaxed versus Standard   |         39 / 40 |          1 / 40 | 0 / 40 |
| Survival: Standard versus Severe    |         34 / 40 |          4 / 40 | 2 / 40 |

Conditional summaries describe only the winning subset, whose size changes with
difficulty. They must not be read as unbiased comparisons of the full attempted
population:

| V3 development 4, Survival | Wins / attempts | Winning mean HP fraction | Winning mean accepted commands |
| -------------------------- | --------------: | -----------------------: | -----------------------------: |
| Relaxed                    |         40 / 40 |                    0.988 |                         117.75 |
| Standard                   |         30 / 40 |                    0.731 |                         257.33 |
| Severe                     |         14 / 40 |                    0.533 |                         263.64 |

**Objective sensitivity:** if accepted commands precede health fraction, Relaxed
Immediate outranks Survival on 25/40 pairs, and Survival outranks Immediate on 15/40.
That reversal is a real safety/speed tradeoff, not proof of a universal policy ranking.
Growth's permanent attack upgrades remain separately reported rather than rewarded
solely because that policy pursues them.

## Why score alone does not repair the former difficulty ladder

In the original v2 cohort all three policies won 20/20 at each tier. Survival ended
at full HP fraction on every seed and used the same native commands across tiers.
Its adjacent tiers tie on **20/20 pairs** under both health-first and command-first
rankings. All three policies' accepted native command sequences were identical
across tiers on all 20 paired seeds. Raw remaining HP would mostly encode the
48/36/28 starting budget; normalized performance exposes the saturation.

A score can distinguish v2 policies' resource/speed tradeoffs, while the reviewed
v3 encounters introduce actual challenge differences. Keep those claims separate.
The [prospective v3 protocol](2026-10-16-cartographer-strength-3-protocol.md) retains
its primary win-rate criteria; no reserved outcomes have been executed for it in
this assessment.

## Verification boundary

Native regressions cover victory before failure/partial progress, health before
speed, and a replay with two additional accepted zero-turn actions that reaches an
identical complete native state but scores worse. Historical native replay fixtures
remain exact. Shared scoring comparison/reporting is independently owned and gated;
post hoc rescoring alone is not a full rollout fairness audit or human playability test.
