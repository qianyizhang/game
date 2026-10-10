# Tactical challenges

Accessible via **Challenges** in each game's sidebar. The initial suite contains three deterministic puzzles with explicit objectives and optional hints.

| Puzzle                              | Goal                                                                       | Decision                                                       |
| ----------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Blindside · The last multiplier     | Score at least 200 with one card                                           | Card choice and Joker ordering (additive vs multiplicative)    |
| Spire · One layer of protection     | Survive the next enemy turn at 70 HP with at least 14 Poison on the Sentry | Strip Artifact, apply Poison, multiply it, and pay for defense |
| Last Hearth · Make room for the Cub | Win one fixed battle; a tie does not qualify                               | Position attackers so useful summons and support survive       |

## Attempts and review

- **Lifecycle:** Attempts end on the target card play, enemy response, or combat resolution. Spire begins on turn two (reconstructed with Sentry preparing Beam). Players can **End attempt & review** early to inspect the explanation (marked **Not yet**).
- **Inspection:** Completed reviews display actual scoring/combat metrics, hint count, and authoritative event traces.
- **Branching:** **Try another choice** restarts from the initial position; **Try from here** restores the state immediately preceding a selected decision.
- **Portability:** **Export attempts** and **Import attempts** bundle the active, previous, and best successful attempts into a portable archive. Import verifies the fixed setup, rules version, content manifest, and stopping point against current rules.

## Save and rules boundaries

- **Save isolation:** Progress writes exclusively to `card-workshop.challenge.*` keys; normal and practice saves remain untouched.
- **Determinism:** Saves record replay command logs and explicit early exits—never unverified authoritative scores. Completions require replay verification against the live objective.
- **Revisions:** Challenge revisions pin position, objectives, and constraints. Exports with mismatched revisions are rejected.
- **Game ownership:** Each game defines objectives and constraints in `src/games/*/application/challenges.ts`. Hearth uses `src/games/battlegrounds/domain/challenge.ts` for an isolated combat resolver without consuming shared minion pools.

## Verification

- **Tests:** `src/shared/challenges.test.ts` exercises solutions, failure paths, constraints, branching, tampered saves, and isolated combat snapshots.
- **Browser:** `tests/browser/challenges.spec.ts` verifies controls, reload persistence, normal/practice save isolation, and mobile viewports.

```sh
npm run check
npm run test:browser
```
