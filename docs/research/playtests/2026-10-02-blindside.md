# Blindside: first development playtest

**Historical snapshot.** The current rules-v3 cohort is in [Workshop v3 playtests](2026-10-02-workshop-v3.md). Outcomes and fixtures below belong to the earlier rules/content revision.

Date: 2026-10-02. Rules version: 1 (pre-release tuning). Source: `npm run playtest`, implemented in `tests/simulation/playtest.test.ts`.

## What was checked

Eight fixed seeds were played from an ordinary fresh run through accepted commands only. No targets, starting money, deck contents or resources were changed inside those runs. Each exported replay was re-imported and compared with the final state. A separate progression unit test deliberately lowers fixture targets; it is not part of this balance observation.

The simple policy searches legal subsets of its visible hand, uses a heuristic redraw, samples known deck composition for purchases, and estimates future scaling. It cannot see the future draw order. It does not strategically use most deck-editing consumables. This is a development probe, not a strong bot, user study or estimate of human win rate.

## Observed

The initial final boss required 96,000 points after a 36,000-point Big Blind. All eight runs ended legally; five reached that final boss, and none won. The final target was reduced to **76,800**, preserving a substantial final challenge for the curated pool. During the same development pass, money-dependent scoring was corrected so later Jokers see earlier cash triggers. Therefore the two sets are **not** a clean single-variable experiment.

| Seed          | Initial result / ante | Revised result / ante | Revised final score / encountered target |
| ------------- | --------------------- | --------------------- | ---------------------------------------- |
| FIRST-LIGHT   | Loss / 8              | **Win / 8**           | 78,959 / 76,800                          |
| GARDEN        | Loss / 8              | Loss / 8              | 67,804 / 76,800                          |
| PAIR-CRAFT    | Loss / 8              | Loss / 8              | 58,006 / 76,800                          |
| LONG-DISTANCE | Loss / 7              | Loss / 7              | 27,324 / 28,000                          |
| NEST-EGG      | Loss / 8              | **Win / 8**           | 82,499 / 76,800                          |
| WORKSHOP      | Loss / 7              | Loss / 7              | 23,490 / 28,000                          |
| MOD-01        | Loss / 1              | Loss / 1              | 380 / 400                                |
| MOD-02        | Loss / 6              | Loss / 6              | 9,128 / 16,000                           |

The revised cohort is **2 wins / 8 runs** under this particular policy. This proves two reachable legal completions and successful replay reconstruction. It does not prove that all build families are equally viable or that the difficulty is right for people.

## Inspectable evidence

- `tests/fixtures/blindside-win.json`: the complete FIRST-LIGHT win, 138 accepted commands and 24 blind starts; used by the browser victory/resume regression.
- `test-results/simulation/*.json`: regenerated full replays and `summary.json` from the current playtest command (ignored development output).
- Domain and browser tests cover scoring order, legal actions, resource accounting, save/import and rendered interactions separately.

## Next human playtest

Try a run without reading the simulation replay. Record one purchase that felt difficult, one card that felt useless, and the moment the build acquired an identity. In particular, test a suit/flush build and a deck-shaping build: this bot favors immediately measurable chip/mult engines, so its choices undersample those strategies.

Keep changes small. Compare the same seeds while also playing fresh ones, to avoid tuning only for a known sequence.
