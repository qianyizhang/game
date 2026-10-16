# Emberwake performance score v2 · development assessment

**Score discrimination is implemented; difficulty calibration remains unproven.**
The score rewards campaign completion and winning simulation efficiency, while native
rules, policy decisions and public knowledge remain unchanged. The
[receipt](2026-10-16-emberwake-performance-2.json) retains exact artifact hashes,
scoring provenance, extraction scripts and every exploratory comparison.

## Declared objective

`emberwake-performance-2` compares these components in order:

| Component                 | Direction | Meaning                                         |
| ------------------------- | --------- | ----------------------------------------------- |
| Victory                   | Maximize  | One for native victory, zero otherwise          |
| Bosses defeated           | Maximize  | Distinct completed mandatory bosses             |
| Wards lit                 | Maximize  | Distinct lit campaign wards                     |
| Regions visited           | Maximize  | Distinct visited regions                        |
| Victorious executed ticks | Minimize  | Actual native ticks for victory; zero otherwise |

Earlier components take precedence. No scalar sum or cross-game score is implied.
A fast death or living timeout never gains an efficiency bonus. The legacy
`progress` value and all original metrics remain descriptive. Errors stay invalid
attempted evidence. Native executed ticks measure simulation time; policy decisions,
packed accepted commands and requested replay padding measure different resources.
The separate decision budget continues to bound zero-tick command loops.

**Free healing is a scoring footgun.** Ordinary portal/return restores resources
without advancing native time. A final refill can improve HP, mana and potion stocks
without improving campaign execution, so those values do not earn rank bonuses.
Gold would punish legitimate upgrade purchases, while optional kills, XP and level
can be farmed. These remain descriptive metrics. Winning time is a declared speed
objective; it does not claim to measure every aspect of safe or skillful play.

## Fresh score-v2 witness and historical reconstruction

A fresh **Sorceress / Standard / Survival** recording on already-consumed development
seed `POLICY-ADOPTION-1-DEV-01` reached victory after **7,820 decisions / 39,545 native
ticks** with score `[1,4,8,20,39545]`. Integrity, native replay, original-input and
decision audits all passed, with no source drift. Its complete original knowledge
remains available in the retained rollout. This is one development witness, not an
independent seed cohort or reserved confirmation.

Three earlier score-v1 rollout files retain their exact bytes and original identities.
New evaluator sidecars reconstruct their unchanged rules-v3 native command journals,
verify every original metric, and add the score-v2 interpretation:

| Historical Standard / Survival journal | New score-v2 vector |
| -------------------------------------- | ------------------- |
| Barbarian                              | `[1,4,8,20,34325]`  |
| Sorceress                              | `[1,4,8,20,39545]`  |
| Necromancer                            | `[1,4,8,20,37650]`  |

These are three heroes on the same consumed development seed. Sidecars are explicitly
**evaluator rescoring**, not fresh policy execution or new audits of original sampling.
The fresh Sorceress witness above is a separate recording. Original identity mismatches
must be shown as unavailable current-API checks, not corrupted historical evidence.

## Exploratory policy comparisons

The assessment also annotates **54 retained diagnostic summaries** from two development
seed blocks × three heroes × three tiers × three priorities. Their candidate predates
the corrected swept-footprint boundary and final ten-tick cap; they are historical
behavior diagnostics, not current-source calibration. Complete original-input traces
were not retained for this screen, so no four-audit claim applies. Immediate and
Survival each won 18/18; Growth won 12/18 with six living timeouts.

Standard executed ticks below are paired by development seed 01 / 02. Every listed
victory has four bosses, eight wards and twenty regions:

| Hero        | Immediate       | Survival        | Growth           |
| ----------- | --------------- | --------------- | ---------------- |
| Barbarian   | 33,330 / 30,090 | 35,630 / 31,875 | 33,555 / 32,280  |
| Sorceress   | 35,360 / 38,950 | 33,750 / 40,485 | 36,010 / timeout |
| Necromancer | 39,225 / 40,555 | 38,650 / 36,665 | timeout / 37,560 |

Immediate outranks Survival on 2/2 Barbarian pairs; Survival outranks Immediate on
2/2 Necromancer pairs; Sorceress splits 1/2 each way. These tiny exploratory blocks
show discrimination and counterexamples to a universal priority ordering. They do
not support significance tests or a claim that one priority is universally stronger.

## Difficulty counterexamples and remaining evidence

Score cannot manufacture an ordered challenge ladder from saturated play:

- **Tier ties:** Necromancer Survival on development seed 01 takes 38,650 ticks at
  every tier, despite final HP changing from 400 to 387 to 371.
- **Tier reversal:** Necromancer Survival on seed 02 takes 36,665 ticks on Standard
  and 35,190 on Severe. Severe scores better on the declared speed objective.
- **Survival ceiling:** Immediate and Survival both win every tier in this small
  diagnostic screen. Winning speed distinguishes some policies without establishing
  ordered win-rate difficulty or human difficulty.

Native damage multipliers remain **0.75 / 1 / 1.3** under rules v3. No reserved study
was run for this score change. Prospective strength or difficulty claims still need
frozen current sources, setup, budget, declared objectives and independent seed blocks.
Do not relabel this post hoc analysis as confirmation or hide living timeouts.

## Verification boundary

Focused regressions cover victory before incomplete progress, winning speed from
native state rather than observation/requested cursors, no speed bonus for nonwins,
and exclusion of farmable resource bonuses. The passive resource display rounds to
at most one decimal; original policy knowledge and downloads retain exact numbers.
Shared score comparison/reporting and full repository/browser gates are coordinated
separately; post hoc reconstruction alone does not establish policy fairness.
