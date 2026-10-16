# Last Hearth policy adoption · 2026-10-16

Last Hearth now supports observation-only local policies, original-decision review
and spell-enabled Mixed Rivals evaluation. All **1,350 recorded cases** completed
and passed four audits, with **zero errors/timeouts**. Results distinguish policy
priorities but do not establish a universal strength order.

The [game contract](../../engineering/hearth-policy.md) owns information boundaries,
tiers, native replay spans, extension commands and review. The [receipt](2026-10-16-hearth-policy.json)
retains complete case metrics/digests, protocols, summaries, paired comparisons,
report/bundle hashes and source/tool/runtime pins. Original rollouts, audits and
compiled bundles remain under `test-results/hearth-policy/`.

## Frozen comparison

- **Environment:** current BG rules/content v6, arena envelope v3, five heroes and
  fixed existing Mixed Rivals with hidden styles. Focal starting HP is 52/40/28 for
  Relaxed/Standard/Severe; rivals retain 40 HP. Standard preserves native resources,
  RNG consumption and controllers. Classic remains the ordinary default.
- **Policies:** deterministic `hearth-policy-1` Immediate, Survival and Growth use
  current board/tempo, defensive reserves and scaling/tier priorities respectively.
  They select aliased ordinary commands, including v6 spells. Work counts declared
  visible-unit valuations and legal-command estimates, not elapsed compute time.
- **Design:** 10 development blocks × 45 conditions = **450 attempts**; 20 disjoint
  reserved blocks × 45 = **900 attempts**. Each hero/tier has independent paired
  seed comparisons; repeated heroes are not pooled as independent samples. The
  independent policy stream is fixed; the maximum is 2,000 focal decisions.
- **Objective:** lower final placement, with first-place/top-four rates secondary.
  `progress = 8-placement` counts seats outlasted. All eight final placements resolve,
  including native rival commands after focal elimination.
- **Freeze:** both cohorts use identical game, policy, adapter and tool source pins.
  Four workers produce the same case/artifact bytes as serial execution. No reserved
  outcomes were used to tune policies or rerun the cohort.

## Reserved results

Every cell below has **20 attempts**. Entries are **mean placement · first places**;
lower mean placement is better. All original rows and top-four counts are in the receipt.

| Hero / tier            | Immediate   | Survival    | Growth      |
| ---------------------- | ----------- | ----------- | ----------- |
| Forgekeeper Relaxed    | 5.00 · 0/20 | 4.55 · 0/20 | 4.20 · 5/20 |
| Forgekeeper Standard   | 5.75 · 0/20 | 5.15 · 0/20 | 5.50 · 2/20 |
| Forgekeeper Severe     | 6.00 · 0/20 | 6.50 · 0/20 | 6.25 · 1/20 |
| Quartermaster Relaxed  | 2.70 · 2/20 | 3.90 · 1/20 | 3.20 · 8/20 |
| Quartermaster Standard | 3.20 · 1/20 | 4.10 · 1/20 | 4.20 · 7/20 |
| Quartermaster Severe   | 4.80 · 1/20 | 5.40 · 0/20 | 4.60 · 6/20 |
| Wildspeaker Relaxed    | 4.40 · 1/20 | 4.45 · 0/20 | 5.45 · 2/20 |
| Wildspeaker Standard   | 5.20 · 1/20 | 5.05 · 1/20 | 6.00 · 3/20 |
| Wildspeaker Severe     | 6.10 · 0/20 | 5.80 · 0/20 | 7.05 · 0/20 |
| Archivist Relaxed      | 4.65 · 0/20 | 5.00 · 0/20 | 5.30 · 3/20 |
| Archivist Standard     | 5.50 · 0/20 | 5.90 · 1/20 | 6.00 · 1/20 |
| Archivist Severe       | 6.50 · 0/20 | 6.25 · 0/20 | 6.50 · 0/20 |
| Oathkeeper Relaxed     | 4.00 · 2/20 | 3.75 · 0/20 | 4.30 · 6/20 |
| Oathkeeper Standard    | 4.60 · 1/20 | 4.10 · 0/20 | 5.25 · 5/20 |
| Oathkeeper Severe      | 5.40 · 0/20 | 5.70 · 0/20 | 5.65 · 4/20 |

**Uncertainty:** only **2/45** exploratory paired progress comparisons have approximate
95% Student t intervals excluding zero. No multiple-comparison adjustment was applied.
Individual win rates use Wilson intervals; 0/20 has an interval of approximately 0–16%.
Paired binary differences retain point estimates and discordance counts with interval
unavailable. Constant-sample continuous intervals are also explicitly unavailable.

**Counterexamples:** Quartermaster Standard Immediate has better mean placement than
Growth (3.20 versus 4.20), while Growth wins more often (7/20 versus 1/20). Optimizing
first place would support a different conclusion from the declared placement objective.
Survival is not consistently stronger than Immediate. Each reserved mean placement
increases or ties as starting HP falls, but development Forgekeeper Immediate means
were 4.2/4.9/3.8: Severe sometimes did better in a small sample. Starting-health tiers
have a direct mechanical meaning; they are not a human-calibrated difficulty ladder.

## Mechanisms and independent review

- **Public knowledge:** stable first-seen opaque instance aliases remove hidden global
  allocation gaps; the global command counter remains evaluator-only. Own state,
  round-opening public lobby and last-seen opponent information remain available.
  Hidden RNG/supply/other boards/styles changes leave the controlled public input
  unchanged. Future hidden-dependent legal acceptance requires a new public seam.
- **Original evidence:** every input, proposal, work/diagnostics and native cursor span
  is retained. Input audit catches an intentional evaluator-RNG leak even when legal
  replay and policy reproduction pass. The in-process boundary assumes cooperative
  policies and does not isolate hostile modules.
- **Native reconstruction:** one focal decision can include many all-actor commands.
  Replay/input audits apply the recorded native span without calling either the focal
  policy or current rivals. Exact boundaries reject missing/extra focal actions.
- **History:** a pre-change full-state fixture verifies original v1/v2 replay semantics;
  v2 journals continue under their original environment. The old save slot and frozen
  v5 evidence remain intact. New v3 uses explicit current difficulty semantics.
- **Review:** isolated original-input view, aliased passive board, before/after,
  round/direct navigation, playback, multi-file filters, evaluator opt-in and original
  downloads. Browser checks cover live-save isolation and phone/desktop layout.

Fresh Astra review against `807819e` found one UI defect: importing a configured v3
replay with omitted difficulty could display the prior setup draft's Severe label.
Configured omission now resolves to Standard; a Severe28 → implicit Standard40 →
restored Severe browser journey verifies the fix. This changed UI only, preserving
both frozen cohorts. A separate audit with fresh execution and rivals disabled
reconstructed a complete development episode successfully.

**Extension witness:** a local TS module completed 140 focal decisions and 1,233 native
commands. Independent audit passed all four dimensions with `originalSourceMatches: true`.
Its source/receipt hashes accompany the study receipt.

**Verification:** final `npm run check` passed maintained/static/build scopes,
**475 application tests across 81 files** and **37 seeded simulations across eight
files**, using an isolated checkout containing exactly this slice over `807819e`. Browser checks passed 11 focused/legacy journeys,
then three final setup/import/review journeys. Worker regressions compare serial and
parallel artifact bytes and fail early on worker exit. Geometry/native asset gates
are outside this rules/UI/evidence slice. Statistical results describe these local
heuristics and seed cohorts, not human-equivalent play or enjoyment.
