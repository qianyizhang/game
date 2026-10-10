# Playing engines

The playing engine provides a browser-independent command interface across all three games, paired with a bounded solver for tactical challenges. Authoritative rules, scoring, combat, and replay validation remain inside the respective game engines.

## Run the challenge solver

```sh
npm run engine:challenges
# Optional output directory (never overwrites existing):
npm run engine:challenges -- test-results/engines/my-run
```

The headless runner bundles via Vite without browser dependencies. It evaluates challenge definitions, reconstructs solutions via the challenge importer, and outputs:

- `report.json`: Challenge revision/key, content-pinned replay, search budget, outcome, counts, and decision events (marked `automated` and `full-seeded-state`).
- `<id>.attempts.json`: Portable attempts for the **Challenges** UI (**Import attempts**). Validates puzzle restrictions and stopping points.
- `<id>.replay.json`: Deterministic seed, rules version, content pins, setup, and accepted commands.

Unsolved or budget-limited challenges produce a report without a solution and exit non-zero.

## Minimal interface

`src/shared/engine.ts` defines `Engine<Position, Command>`:

| Operation                 | Responsibility                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| `candidates(position)`    | Enumerate concrete commands in stable order (may include illegal actions)                       |
| `step(position, command)` | Apply authoritative transition; record accepted commands; return original position on rejection |
| `outcome(position)`       | Report `active`, `won`, or `lost` via game phase or challenge evaluator                         |
| `key(position)`           | State hash identifying equivalent futures; retains rule state and seeded RNG                    |

`legalActions(engine, position)` filters candidates through `step` without mutating state.

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

`spireEngine` and `hearthEngine` expose identical operations. Each game's `application/engine.ts` owns candidate enumeration (hand ordering, targeting, recruitment, Battlecry, Discover). Native rules enforce timing and legality.

`src/shared/challenge-engine.ts` wraps `Attempt` with `actChallenge` and `attemptResult`, applying challenge restrictions before native legality. `src/engines/challenges.ts` maps each challenge to its game action source.

## Search and limits

The solver performs deterministic breadth-first search (BFS) with state deduplication:

- **Default budgets:** 12 new commands, 10,000 stored positions, 50,000 transitions per puzzle.
- **Outcomes:** `solved`, `exhausted`, `limit` (depth, nodes, transitions), or `aborted` via `AbortSignal`.
- **Search space:** Inspects full seeded state (hidden deck order, RNG). The first solution found minimizes accepted command count in that action space.
- The solver evaluates live objectives and transitions directly; it never reads hints, test cases, or prewritten solutions.

For restricted observation evaluation, see the separate [Hearth agent interface](../engineering/hearth-agents.md).

## Verification

| Suite                            | Scope                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| `src/shared/engine.test.ts`      | Shortest paths, rejection, deduplication, budgets, cancellation, terminal positions    |
| `src/engines/playing.test.ts`    | Complete replay lifecycles, phase actions, targeting, recruitment, resource invariants |
| `src/engines/challenges.test.ts` | Live challenge goals, replay imports, impossible goals, deterministic reconstruction   |
| `tests/browser/engine.spec.ts`   | Challenge screen imports, decision inspection, save isolation                          |

Commands:

```sh
npm run check
npm run engine:challenges
npm run test:browser
```

## Multi-seat Hearth arena

The [Hearth arena](hearth-arena.md) operates as an independent controller boundary:

- `arenaFrame(session, seat)`: Exposes legal recruitment actions for the active seat (`actArenaAgent` rejects inactive seats).
- `arenaSession`: Pure deterministic transition recording multi-seat actions and resolving rounds without running agents.
- `inspectArena`: Exposes declared rival styles independently of hidden agent observations.
