# Tactical challenges

Open **Challenges** in any game's sidebar. The first set contains three short puzzles for players who know the basics. Goals are explicit, hints are optional, and failed attempts remain useful for comparison.

| Puzzle                              | Goal                                                                       | Decision                                                       |
| ----------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Blindside · The last multiplier     | Score at least 200 with one card                                           | Choose a card and order additive/multiplicative Jokers         |
| Spire · One layer of protection     | Survive the next enemy turn at 70 HP with at least 14 Poison on the Sentry | Remove Artifact, apply Poison, multiply it and pay for defense |
| Last Hearth · Make room for the Cub | Win one fixed battle; a tie does not qualify                               | Order attackers so useful summons and support survive          |

## Attempts and review

- The attempt ends after the one-card play, the next Spire enemy response, or the Hearth battle. Spire begins on turn two, reconstructed by legally ending the opening turn so the Sentry is now preparing Beam. **End attempt & review** also lets a player stop early and read the explanation; an unresolved goal is recorded as **Not yet**.
- A completed review shows actual metrics, hints used, the explanation, and each accepted decision's authoritative scoring/combat events.
- **Try another choice** reconstructs the starting position. **Try from here** reconstructs the prefix before a selected decision. The previous attempt remains available for comparison; the most recent successful replay preserves the cleared status across further retries.
- All retries use the same seed and position. Hearth's result is one deterministic battle, not an estimated win rate. Retrying after reading the explanation is practice, not an unseen assessment.
- **Export attempts** and **Import attempts** move a bounded archive containing the current attempt, previous attempt and latest successful attempt. Each attempt identifies its puzzle and revision. Import reconstructs legal actions and checks the fixed setup, allowed commands, stopping point, rules version and content manifest. A pending import is discarded if the player makes a newer move or leaves the puzzle.

## Save and rules boundaries

Challenge progress uses separate `card-workshop.challenge.*` keys. Normal and practice saves are never written by a challenge. The normal game stays mounted while the challenge screen is open, preserving its current view and selections. Challenge progress and navigation resume after reload when local storage is available.

Progress stores replay commands, hint counts and explicit early endings, not authoritative state or unverified scores. A completion is backed by a replay that still meets the objective. Invalid saves remain in storage and are archived before a replacement is written. If storage fails, the in-memory attempt survives navigation between puzzles and normal runs. It remains playable and exportable, but must be exported before closing or reloading the tab.

Each game defines its own objective, restrictions and explanation in `src/games/*/application/challenges.ts`. Blindside and Spire use their existing practice factories and native transitions. Hearth's fixed practice encounter in `src/games/battlegrounds/domain/challenge.ts` allows only positioning and one combat; it calls the same combat resolver used by normal lobbies, without borrowing units from their finite pools. Shared challenge code handles replay validation and comparison, not game scores or combat.

Challenge revisions identify changed positions, objectives or restrictions. Saves are keyed by challenge revision, rules version and content digest; exports with a different puzzle or revision are rejected. Early workshop exports without a puzzle pin are accepted only after their full replay passes the current position, restrictions and goal checks, and receive the current pin on export. Existing normal replay meaning is unchanged by the challenge feature.

## Verification

`npm run check` runs formatting, unit tests, strict TypeScript and the production build. `src/shared/challenges.test.ts` covers known successful and unsuccessful sequences, restrictions, deterministic reconstruction, decision branches, revision pins, tampered saves and isolated battle snapshots. `tests/browser/challenges.spec.ts` exercises actual controls, comparisons, reload, normal/practice save isolation, portable attempts, stale imports, storage failure, keyboard focus and phone layouts. Use `npm run test:browser` with approved execution outside the restricted macOS sandbox; challenge tests also capture desktop and phone screenshots for visual review.

The set has mechanically verified solutions. Human difficulty and whether the lessons are satisfying still require player feedback.
