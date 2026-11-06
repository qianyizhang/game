# Historical delivery and lifecycle evidence

Dated outcomes through 2026-10-06. These fixed development policies and cohorts
establish legal lifecycle, replay and resource behavior; they do not establish human
skill, enjoyment, calibrated difficulty or comparable strength across rule versions.
Current verification belongs to [checks](../engineering/checks.md); experiment
results belong to the [game ledgers](README.md#policy-evidence).

## Delivery progression

| Date       | Milestone          | Delivered scope                                                                                                                                                                                                               | Verification recorded then                                                                                                                                           |
| ---------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-03 | Workshop v3        | Ironclad/Silent A0–A5 and nine boss families; immutable combat playback; replay-prefix practice; validated typed mods; Blindside six packs/six vouchers/four skip tags; Hearth scouting/positioning; local evidence/filtering | 140 unit tests, 32 seeded lifecycle runs, 22 browser cases; card-zone, replay, save-isolation, purchase/skip and snapshot regressions                                |
| 2026-10-03 | Integrated cleanup | [Challenges](../guide/challenges.md), [playing interface](../guide/engines.md) and [challenge art](../art/svg.md#source-map)                                                                                                  | 170 unit tests, 44 browser cases, 3/3 challenges solved, 523 SVGs                                                                                                    |
| 2026-10-04 | Hearth AI v5       | Five heroes with powers and [agent interface](../engineering/hearth-agents.md)                                                                                                                                                | 186 unit tests, 46 browser cases; 50 AI lobbies, search mean placement 4.65 versus baseline 4.50; [experiment ledger](experiments/hearth.md#2026-10-04-hearth-ai-v1) |
| 2026-10-04 | Mixed Rivals       | [Eight-seat arena](../guide/hearth-arena.md), rotating priority                                                                                                                                                               | 199 unit tests, 48 browser cases, 320/320 experiment lobbies; [results](experiments/hearth.md#2026-10-04-hearth-arena-v1)                                            |
| 2026-10-04 | Recruitment v2     | [Factorial ablation protocol](hearth-recruitment-v2.md)                                                                                                                                                                       | 212 unit tests, two browser checks, 1,200 lobbies and 1,074,229 decision rows; [results](experiments/hearth.md#2026-10-04-hearth-recruitment-v2)                     |
| 2026-10-06 | Tavern spells      | Eight [spells](../guide/tavern-spells.md), delayed income and coupons; Hearth6/arena2                                                                                                                                         | 233 tests, 57 browser checks; 25 lifecycle lobbies; 604 SVGs, eight added/596 unchanged. Cast counts are separated below.                                            |

<a id="2026-10-02-blindside"></a>
<a id="2026-10-02-emberpath"></a>
<a id="2026-10-02-slay-the-spire"></a>
<a id="2026-10-02-last-hearth"></a>
<a id="2026-10-02-workshop-v3"></a>

## 2026-10-02 development playtests

Ordinary starting resources and accepted commands were used within each run. Every
run in the rows below terminated and reconstructed exactly from its exported replay.
The cohorts were development probes, not human sessions or fair-playing strength
benchmarks. In particular, Spire's one-command transition lookahead could observe
consequences of hidden draws.

| Scope / rules                          | Fixed seed cohort and denominator                                                                                  | Outcome                                                               | Decision or limitation                                                                                                                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blindside1, initial and revised passes | `FIRST-LIGHT`, `GARDEN`, `PAIR-CRAFT`, `LONG-DISTANCE`, `NEST-EGG`, `WORKSHOP`, `MOD-01`, `MOD-02`; eight per pass | Initial 0/8; revised 2/8 wins (`FIRST-LIGHT`, `NEST-EGG`)             | Five initial runs reached the final boss. Its target changed 96,000→76,800 while cash-trigger scoring was also corrected: not a controlled single-variable comparison. The heuristic undersampled consumable/deck-shaping strategies.                                  |
| Emberpath1                             | `EMBER-01..06`; six                                                                                                | 4/6 wins (`01`, `03`, `04`, `06`)                                     | Historical predecessor superseded by Spire2, **not Emberwake**. No current Spire balance inference.                                                                                                                                                                    |
| Spire2 Ironclad                        | `IRONCLAD-01..06`; six                                                                                             | 2/6 wins (`02`, `04`)                                                 | Spheric Guardian exposed a policy undervaluing damage to Block; the policy was corrected without changing enemy difficulty. Reachable victory/defeat does not establish exhaustive timing parity or human balance.                                                     |
| Hearth1                                | `HEARTH-01..12`; twelve, rotating forgekeeper/quartermaster/wildspeaker                                            | 2/12 first places (`02`, `07`); ten eliminations                      | Per-action/round nonnegative gold, capacity and definition-level supply conservation passed. Late summons incorrectly catching up on lifetime attacks prompted a left-to-right-sweep correctness repair; results are after that repair, not controlled balance tuning. |
| Workshop Blindside3                    | Same eight Blindside seeds                                                                                         | 1/8 win (`MOD-02`); six losses reached ante7/8                        | Policy bought ordinary stock/planets; focused rules/browser checks, not this cohort, exercised packs, vouchers and skips.                                                                                                                                              |
| Workshop Spire3                        | `IRONCLAD-01..06`, `SILENT-01..04`, `SILENT-A5-01`, `IRONCLAD-A5-01`; twelve                                       | 4/12 wins: Ironclad `06`, Silent `02..04`; both A5 runs lost in Act I | Complete wins were reachable for both characters. Two sampled A5 losses do not establish human A5 balance.                                                                                                                                                             |
| Workshop Hearth3                       | `HEARTH-01..12`; twelve                                                                                            | 1/12 first place (`HEARTH-11`); all supply checks passed              | Human slot was driven by a development policy with positioning slightly different from its seven opponents.                                                                                                                                                            |

The detailed per-run tables and original fixture descriptions remain recoverable:
[Blindside1](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/playtests/2026-10-02-blindside.md),
[Emberpath1](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/playtests/2026-10-02-emberpath.md),
[Spire2](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/playtests/2026-10-02-slay-the-spire.md),
[Hearth1](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/playtests/2026-10-02-last-hearth.md),
and [Workshop3](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/playtests/2026-10-02-workshop-v3.md).
This revision recovers the documents; it is not an invented experiment source pin.

Old generated v3 cohort directories were retired during [lean cleanup](../engineering/history/cleanup-triage.md).
Selected tracked replay fixtures remain. A new simulation produces a fresh result,
not the original evidence. `tests/fixtures/` contains versioned histories, including
older rule environments; current tests own their precise selection and interpretation.
Browser prefix imports do not click every action of all 32 v3 runs.
[Matched-playtest comparison](../../packages/workshop-tools/README.md#headless-comparison-and-challenge-commands)
owns current comparison commands and exclusions.

Unanswered human questions remain: recognition of build identity and boss-driven
routing; Silent strategy clarity; meaningful defensive, shop and deck-removal choices;
playback comprehension; and whether skip/scouting/positioning benefits earn their cost.
These hypotheses do not authorize new studies or tuning only to known seeds.

## 2026-10-06 tavern-spell lifecycle

The unchanged [structured receipt](playtests/2026-10-06-tavern-spells.json) retains
source baseline `57842643b1e21f7d5fd231672cf005c33c80dce6`, content/source/fixture/replay
hashes, all 25 case summaries and the original art/verification scope.

| Scope               | Seed cohort / budget                                                              | Outcome                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Classic Hearth6     | `SPELLS-01..20`; 20 runs                                                          | 20/20 complete; 267 focal casts; two first places (`07`, `11`); accepted-command replay and supply checks |
| Mixed Rivals arena2 | `SPELLS-ARENA-1..5`; five lobbies; 6,000 commands/lobby and 120 actions/seat-turn | 5/5 complete; 629 all-seat casts; hidden policy labels retained                                           |

Later replay reconstruction passed 25/25 and cleanup browser checks 4/4. These are
separate dated checks; neither the cast totals nor repeated checks create additional
independent samples. The receipt's historical paths and hashes remain unchanged.

<a id="content-expansions"></a>

## Original card expansions

| Historical delivery | Scope                                                                                                                             | Compatibility and recorded checks                                                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First card suite    | +12 Blindside Jokers (52 total), +12 Hearth recruits (48 total), artwork for 39 Silent cards and Void                             | Blindside/Hearth→rules2: new draws change seeded outcomes; v1 storage preserved. 385 base/463 Silent-inclusive SVGs; held-card/scoring order, bosses, golden battlecries/tribes and 20 seeded lifecycle runs. |
| Night Market        | +8 Jokers (60 total), +12 recruits (60 total), 16 shop illustrations (six packs/six vouchers/four tags), 12 Silent upgrade scenes | Blindside/Hearth→rules4; Spire remained3. 511 SVGs, 451 baseline-identical; 150 unit/25 browser checks plus 20 seeded runs (eight Blindside/twelve Hearth).                                                   |

Card-by-card history is recoverable in the [original expansion record](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/content-expansions.md).
Current content definitions own current cards and effects; these dated counts do not.

## Evidence owners

Rules/resource regressions live in `src/games/*/domain/*.test.ts`; replay and mods in
`src/shared/*.test.ts` and `src/mods/enabled.test.ts`; browser journeys in
`tests/browser/*.spec.ts`. The [original delivery record](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/delivery-history.md)
retains its complete precompaction scope. No current pass is implied by these old gates.
