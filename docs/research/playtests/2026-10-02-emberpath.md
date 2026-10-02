# Emberpath: development playtest

**Historical: superseded by the original Slay the Spire implementation (rules v2). These results do not describe the current game.**

2026-10-02 · rules version 1 · `npm run playtest` · `tests/simulation/spire.test.ts`.

Six fixed seeds use ordinary starting resources, visible intents and accepted commands. The heuristic considers immediate damage/block, setup, reward value and route risk. It does not inspect future draw order. These are lifecycle/replay probes, not human difficulty estimates.

| Seed     | Outcome | Reached        | Final HP | Deck size | Relics | Commands |
| -------- | ------- | -------------- | -------- | --------- | ------ | -------- |
| EMBER-01 | Win     | Act 3, floor 6 | 42       | 17        | 8      | 167      |
| EMBER-02 | Loss    | Act 3, floor 6 | 0        | 16        | 7      | 124      |
| EMBER-03 | Win     | Act 3, floor 6 | 45       | 19        | 8      | 163      |
| EMBER-04 | Win     | Act 3, floor 6 | 62       | 19        | 7      | 178      |
| EMBER-05 | Loss    | Act 1, floor 6 | 0        | 13        | 2      | 35       |
| EMBER-06 | Win     | Act 3, floor 6 | 30       | 19        | 8      | 148      |

The cohort produced **4 wins / 6 runs**. Every run terminated and reconstructed exactly from its exported replay. The legal EMBER-01 history is stored in `tests/fixtures/spire-win.json`. Current raw results regenerate under `test-results/spire/`.

Browser checks cover map choice, targeted card play, potions, reward-taking, shops, campfire upgrades, local resume, collection, final victory and phone layout. Rules tests separately check resource timing, power/exhaust distinctions, generated-card isolation, lethal effect cancellation and intent arithmetic.

Next human questions: Is skipping rewards understandable? Does poison need too much setup? Are compact acts long enough to make deck removal meaningful? Record decisions and failed plans, not only the ending.
