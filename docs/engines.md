# Playing engines

The first engine is a small, browser-independent command interface for all three games, plus a bounded solver for the live tactical challenges. Scoring, combat, randomness, resources and replay validation remain in the existing game rules.

## Run the challenge solver

```sh
npm run engine:challenges
# Optional new output directory; existing directories are never overwritten:
npm run engine:challenges -- test-results/engines/my-run
```

The runner builds a temporary headless bundle using the existing Vite dependency. It needs no browser, server or additional package. It searches the current challenge definitions, reconstructs each solution through the challenge importer, and writes:

- `report.json`: challenge revision/key, content-pinned replay, search budget, outcome, counts, objective metrics and decision events. Evidence is labelled `automated` and `full-seeded-state`.
- `<id>.attempts.json`: choose the corresponding puzzle in **Challenges**, then **Import attempts** to inspect the cleared position and decision review. This explicitly replaces that puzzle's current progress; normal and practice saves are separate.
- `<id>.replay.json`: the seed, rules version, content pins, setup and accepted commands. For the challenge screen use the attempts file, which also validates puzzle restrictions and the stopping point.

Every invocation uses a new directory by default. An unsolved or budget-limited challenge produces a report without a solution and makes the command exit nonzero. The CLI itself does not write browser storage or award human completion.

## Minimal interface

`src/shared/engine.ts` defines `Engine<Position, Command>` with four operations:

| Operation                 | Responsibility                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `candidates(position)`    | Enumerate concrete commands in stable order; proposals may be illegal                                           |
| `step(position, command)` | Apply the authoritative transition and record only accepted commands; return the original position on rejection |
| `outcome(position)`       | Report active, won or lost using the game's phase or the challenge's evaluator                                  |
| `key(position)`           | Identify equivalent futures for search; retain rule state and seeded RNG                                        |

`legalActions(engine, position)` filters candidates through `step` without changing the position. Game states and positions are immutable inputs to these functions; callers should not mutate them. Session factories and replay import/export stay in the existing game codecs.

```ts
import { blindsideEngine } from '../src/games/balatro/application/engine';
import { blindsideSession } from '../src/games/balatro/application/session';
import { legalActions } from '../src/shared/engine';

const position = blindsideSession.create('MY-SEED');
const actions = [...legalActions(blindsideEngine, position)];
const next = blindsideEngine.step(position, actions[0]);
if (next.error) throw new Error(next.error);
const replay = blindsideSession.encode(next.position);
```

`spireEngine` and `hearthEngine` expose the same operations. Each game's `application/engine.ts` owns its action enumeration: hand subsets and ordering, card/enemy targets and pending choices, or recruitment slots, Battlecry targets and Discover. Native rules enforce affordability, timing, target validity and terminal states. A custom practice codec can use `sessionEngine(codec, gameCommands)`.

`src/shared/challenge-engine.ts` wraps `Attempt` with the existing `actChallenge` and `attemptResult` functions. It applies puzzle restrictions before native legality. `src/engines/challenges.ts` pairs each live challenge with its game's action source. Adding a future challenge requires registering that pair; changing its rules or objective does not require a scripted answer.

## Search and its limits

The solver uses deterministic breadth-first search with repeated-position detection. Defaults are **12 new commands**, **10,000 stored positions** and **50,000 attempted transitions** per puzzle. TypeScript callers can supply smaller or larger budgets, resume a legal attempt prefix, or pass an `AbortSignal` to `search`. Search is synchronous; interactive callers should put larger searches in a worker. In-thread cancellation is checked between transitions; no transition is interrupted halfway through.

Results distinguish `solved`, `exhausted`, `limit` (depth, nodes or transitions) and `aborted`. A limit is not evidence that the puzzle is impossible. Exhaustion only covers the supplied action source and position keys. The first solution minimizes accepted command count in that action space; it is not a claim about strategic quality. `stats.visited` counts positions retained for expansion, excluding resolved terminal successors; transition counts include rejected commands.

This engine can inspect **full seeded state**, including hidden deck order and RNG. It is suitable for small deterministic puzzles, reproducible rule experiments and future policy development. This full-state challenge adapter does not impose a hidden-information boundary. The separate [Hearth agent interface](hearth-ai.md) supplies restricted observations, full-run policies and conditional sampled-combat estimates; no general playing-strength claim follows from either tool. Ordinary game adapters support play, but exhaustive search across a whole run is not practical at these budgets. Per-game enumeration uses one representative per unordered card subset; commands with irrelevant optional targets are omitted.

The search never reads hints, explanation text, known solution tests or prewritten command lines. Reports and exported attempts are generated from the current objective and actual transitions. A solution found after the author exposes a full position demonstrates solvability, not human mastery or unseen-agent performance.

## Verification

- `src/shared/engine.test.ts`: shortest lines, rejection, repeated states, budgets, cancellation and terminal positions.
- `src/engines/playing.test.ts`: complete existing win/loss replay lifecycles, phase action coverage, card subsets, targets, choice locks, recruitment and unchanged input resources.
- `src/engines/challenges.test.ts`: all live goals, exact replay imports, changed positions and IDs, impossible goals, deterministic output and continuing a prefix.
- `tests/browser/engine.spec.ts`: import generated attempts into all three real challenge screens, inspect decisions, reload cleared progress and preserve the normal save.

Run `npm run check`, `npm run engine:challenges`, and the browser test through the repository's approved macOS browser harness. No rules version bump is needed: engine code only submits existing commands and does not change replay meaning.

## Multi-seat Hearth arena

The [Hearth arena](hearth-arena.md) is a separate game-owned controller boundary. `arenaFrame(session, seat)` exposes legal recruitment actions for the active seat; `actArenaAgent` rejects stale or inactive-seat actions. `arenaSession` records configuration, every seat's recruitment commands and round advancement. Its pure transition resolves the whole lobby without executing policies. `inspectArena` exposes declared rival styles independently of hidden/disclosed policy observations. Classic's existing adapter and save format remain unchanged.
