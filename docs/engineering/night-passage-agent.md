# Night Passage agent play

Night Passage has a scored, deterministic agent interface and a baseline player.
The first milestone is a working player and a reproducible comparison, not a trained
or optimized policy. The browser and headless interface use the same application
commands and accepted-command replay. Headless runs can be imported into the game.

## Score and objective

**Passage score = 100 × cleared combat chambers + 10,000 for escape.**

- A chamber pays once after its last wave. A guardian chamber also pays 100.
- Kills, summoned enemies, damage, gold, ash, safe stops and waiting award no points.
- Death or retirement retains the points already earned. Returning to the quay
  closes the score; the next passage starts at zero.
- At most 32 combat chambers can pay, so every escape outranks every failed attempt.
- Among equally successful runs, this deliberately rewards clearing more combat
  rooms before optimizing speed. A market or spring can improve survival but gives
  no score. This is a declared objective, not a claim that those routes are inferior.

The score is derived from authoritative state by `domain/score.ts`, with its own
`night-passage-score-1` identity. It does not alter game rules, RNG or replay meaning.
Rules/content remain 4/3. The HUD and terminal results use this same function.

For equal individual scores, prefer lower **executed simulation ticks**. For a fixed
benchmark suite, compare **wins first, mean score second, median winning ticks third**.
All episodes, including deaths and timeouts, remain in the mean-score denominator.
Errors are reported separately and must be repaired before accepting a candidate.
At 60 ticks per second, simulation time is not wall-clock runtime or human play time.

## Observation and action interface

`src/games/night-passage/application/agent.ts` owns three operations:

```ts
const agent = createAgent('my-seed');
const observation = agent.observe();
const result = agent.step({ type: 'start', weapon: 'bow', runes: ['vigor', 'fleet'] });
const replay = agent.exportReplay();
```

`observe()` returns a detached JSON-compatible snapshot: phase, simulation tick,
score, player resources, current enemies/projectiles, terrain, current threat
geometry, hazard timing, offered rewards, routes and legal discrete actions. Current
weapon and blessing definitions describe the choices. `frame` describes continuous
control bounds while combat permits input. Coordinates are ground-plane units;
angles are radians, positive x is right and positive y is down.

This is structured tactical information, not a screenshot-based agent. Exact
positions, cooldowns and warning timing are exposed. Seed, RNG state, future
encounters/reward draws and the internal journal are omitted. The exported replay
contains its seed for reproducibility; the baseline policy never reads that export.
The process is a cooperative research interface, not a security sandbox for hostile
policy code with access to the repository.

`step(unknown)` validates through the same application dispatch used by the UI.
Its result contains `accepted`, `error` and the next observation. Invalid commands
leave state and replay unchanged. Modifying an observation cannot change the game.
Time advances only on accepted `frame` commands, up to 120 ticks per command, and
stops at decisions and terminal phases. There is no background clock in headless play.

## Local JSON API

Use the pinned runtime (`source ~/.nvm/nvm.sh && nvm use`). Start a persistent process:

```sh
npm run --silent engine:night-passage -- serve
```

Write one JSON request per line to stdin; read one response per line from stdout.
An optional string or numeric `id` is echoed. One process owns one chronicle.

```json
{"id":1,"op":"reset","seed":"my-seed"}
{"id":2,"op":"observe"}
{"id":3,"op":"step","command":{"type":"start","weapon":"bow","runes":["vigor","fleet"]}}
{"id":4,"op":"suggest"}
{"id":5,"op":"step","command":{"type":"frame","ticks":6,"input":{"x":0,"y":-1,"aim":-1.57,"attack":true,"special":false,"dash":false,"cast":false,"call":false}}}
{"id":6,"op":"export"}
```

- `reset`: start a fresh chronicle with a seed of 1–120 characters.
- `observe`: read without advancing time.
- `step`: submit a command; `ok` matches `accepted`.
- `suggest`: return the baseline's next command without submitting it. Start the
  passage first; the baseline handles combat and decisions, not quay or terminal phases.
- `export`: return the portable replay string. Write it to a JSON file and use
  **Import** in Night Passage to inspect the resulting run.

To watch the actions unfold, use **Watch replay → Open replay** instead of Import.
The spectator validates the chronicle and advances its recorded commands on an
isolated timeline; seeking reconstructs from the seed. Your saved game is untouched.
For a local generated artifact, `/?game=night-passage&watch=1&replay=/test-results/night-passage-agent/run.replay.json`
opens it directly while the development server is running. The URL loader accepts
only same-origin files and leaves playback paused until **Play replay** is pressed.

All requests return `ok`; errors include a message. Parse failures do not kill the
session. A separate process gives an independent game. There is no open network port.

## Baseline and benchmarks

The baseline adapts the earlier verification pilot: approach or kite the nearest
enemy, avoid announced threats/projectiles/pillars, use available attacks, prioritize
survival rewards and fill blessing slots. Its input is only `Observation`; it cannot
advance or modify the game itself. It has three bounded configuration knobs:
decision interval (default 6 ticks), bow distance (230), and melee reach ratio (0.7).

```sh
npm run --silent engine:night-passage -- play --seed a-light-in-the-dark --weapon bow --out test-results/night-passage-agent/run.json --replay test-results/night-passage-agent/run.replay.json
npm run --silent engine:night-passage -- benchmark --suite training --out test-results/night-passage-agent/training.json
npm run --silent engine:night-passage -- benchmark --suite held-out --out test-results/night-passage-agent/held-out.json
```

Each suite uses three fixed seeds × five weapons, with a fresh profile and Root/Feather
runes in every episode. Budgets are 20,000 accepted actions (including start) and
120,000 executed ticks. Reports identify engine, score, API, benchmark, rules/content,
configuration, seed suite, budgets and source/bundle hashes. Large replays and raw
reports stay under ignored `test-results/`; regenerate them when needed.

The TypeScript functions `runEpisode(options)` and `runBenchmark(options)` accept
configuration and budget overrides. Invalid configuration is an error, not a model
loss. A timeout preserves partial score and remains a non-win. The baseline is frozen
before its separate held-out suite is inspected; do not tune against that suite.

## Next: bounded hill-climbing

1. Keep the baseline report and configuration fixed as the incumbent.
2. Change one engine parameter or heuristic, keeping score, game versions, seeds,
   loadouts and budgets fixed. Compare paired training episodes.
3. Reject broken runs and win-rate regressions. Accept a candidate only when the
   declared ranking improves; retain its parameters and source pins.
4. Freeze the candidate, then run held-out evaluation. If those results inform
   another change, those seeds become development data; reserve fresh evaluation
   seeds before making a generalization claim.

A three-seed suite is a small baseline sample. Passing it establishes playable
paths, not universal success, human-like play or a statistically established gain.
Automatic search is intentionally a subsequent milestone.

### Baseline measurement · 2026-10-13

The unchanged baseline escaped on all 30 measured episodes. No parameter search
preceded this result. The [compact receipt](evidence/night-passage-agent-baseline.json)
pins the identical source graph used by both suites and retains individual outcomes.

| Suite               | Escapes | Mean score | Median winning ticks | Errors / timeouts |
| ------------------- | ------- | ---------- | -------------------- | ----------------- |
| Training            | 15/15   | 12,780     | 28,995               | 0 / 0             |
| Separate evaluation | 15/15   | 12,786.67  | 26,929               | 0 / 0             |

Win rate is already saturated on this small sample. The next search should preserve
those wins, then improve the declared score/time ranking. Broaden the seed set before
interpreting a small time gain as general robustness. Evaluation seeds cease to be
held out if later decisions are tuned to their individual results.

## Verification

Application tests protect observation isolation, rejected-action atomicity, score
accounting, replay reconstruction and bounded episode outcomes. Seeded simulations
exercise the player through the public agent interface across all weapons. The
tooling check launches the actual JSONL process and checks state preservation and
export after malformed input. A browser journey imports a winning agent replay,
checks the identical score after reload, and verifies the next run starts at zero.
The spectator journey covers play/pause, speed, seek/restart, both views and phone
layout while preserving the player's exact save. Invalid or external replay links
leave the viewer available for file recovery.

Run `npm run check` and the focused
`tests/browser/night-passage-agent.spec.ts` journey. Native assets and rendering
are unchanged; geometry/native gates are outside this slice.
