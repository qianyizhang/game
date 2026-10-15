# Night Passage agent play

Night Passage has a deterministic agent interface, a baseline player and three
constrained heuristic policies. The browser and headless interface use the same
application commands and accepted-command replay. Headless runs can be imported
into the game or watched in the replay viewer.

## Score and objective

Current rules-5/content-4 chronicles use `night-passage-score-2`:

**Score = 100 × cleared combat chambers + escape × (10,000 + speed bonus).**

`speedBonus = floor(2000 × 36000 / (36000 + executedTicks))`.
An escape at 5/10/20 combat minutes earns 1,333/1,000/666 bonus points. Every
escape outranks every failed attempt; rooms and speed trade off within victories.
Only executed combat ticks count, including control delay. Pauses, menus,
wall-clock computation, replay speed and unused requested ticks do not count.
Deaths/timeouts retain chamber points but receive no speed bonus. Returning to the
quay closes the score; the next passage starts at zero.

Rules-4/content-3 chronicles remain playable and replayable with original Standard
combat and `night-passage-score-1`: 100 per combat chamber plus 10,000 for escape.
Their envelope and scoring are preserved; no silent migration occurs. Older rules
remain unsupported. New difficulty is recorded in each accepted start command.

For a fixed suite compare wins first, mean score second and median winning ticks
third. Include deaths and timeouts in the score denominator; errors invalidate an
experiment. Compare within the same gameplay, score and control identities.

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

This exact reference view is structured tactical information, not a screenshot-based agent. Exact
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
An optional string or numeric `id` is echoed. One process owns one chronicle. `serve` defaults to the exact reference; `play` and `benchmark` default to standard constrained controls.

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
advance or modify the game itself. The exact reference retains three bounded configuration knobs:
decision interval (default 6 ticks), bow distance (230), and melee reach ratio (0.7).

```sh
npm run --silent engine:night-passage -- play --control exact --rules night-passage-4 --seed a-light-in-the-dark --weapon bow --out test-results/night-passage-agent/run.json --replay test-results/night-passage-agent/run.replay.json
npm run --silent engine:night-passage -- benchmark --control exact --rules night-passage-4 --suite training --out test-results/night-passage-agent/training.json
npm run --silent engine:night-passage -- benchmark --control exact --rules night-passage-4 --suite held-out --out test-results/night-passage-agent/held-out.json
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

## Constrained control and policy work

`application/control.ts` owns a player's history, redaction, held input, delayed
delivery, eight-direction movement and per-tick aim bound. Policy functions receive
only a detached `Sight`; the evaluator owns exact results and replay export.

A decision sees an aged snapshot; early bootstrap is explicitly marked until enough
history exists. Every observation returned by the constrained protocol—including
rejected steps—uses this view. Enemy windup, player buffer/strike/cooldown clocks,
hazard offset/cycle/countdown and exact projectile velocity/lifetime are omitted.
Visible attack geometry and coarse early/late warnings remain. Projectile velocity
is a continuous sensor estimate from consecutive aged simulation snapshots, even
between delivered decisions; first sightings are marked unknown. It can be exact
for straight-moving shots, so this is still richer perception than screenshots.
Menus and terminal states are current, and transitions reset history and held input.

History retains at most `observationTicks + 3` immutable chronicles. Exact views are
constructed only when requested, then redacted from that detached copy; previous
projectile positions come from the adjacent simulation sample. Keeping the historical
chronicle also preserves its replay capacity when checking legal actions. The benchmark
reads its exact result once per decision. This changes allocation work, not policy
observations, metered work or replay semantics; see the
[local implementation comparison](../research/experiments/2026-10-15-night-passage-observation.md).

Chronicle dispatch owns canonical accepted-command payloads for every recording path.
Agent, controller and live-play callers cannot place extra metadata in the journal.
The controller still validates commands before computing delays and constructs its own
detached low-level controls; Chronicle owns recording rather than controller timing.

Compute delay is `reactionTicks + ceil(workUnits / workPerTick)`. The supplied
policies charge marked entity scans, escape candidate evaluations and distance,
threat-containment and cover helpers. This proxy excludes general arithmetic,
allocation, menu ranking and some additional scans; it is not an instruction count.
Holding
controls costs `max(holdTicks, requestedTicks) + switchTicks × min(changes, 3)`.
Changes count movement direction, offensive slot and a newly requested dash.
Previous controls continue during computation; new controls then remain active
through the hold. Actual low-level inputs reconstruct the same outcome without
rerunning a policy. Controller identity/configuration survives import/export as
origin metadata, not certification of later manually appended commands.

Quick checks four executable escape directions; balanced checks eight; deliberate
checks eight landings and their intermediate path points. All share observations
and control rules. Additional work can improve a choice or lose time; no policy
ranking is forced. Their ability request windows are shared, so changing control
cadence can also change when a buffered ability actually starts.

`light`, `standard` and `heavy` are separately measured control presets. The original
proposal's 100 ms perception/50 ms reaction settings were initial tuning inputs,
not a human timing requirement. Final calibration and targets are recorded in the
[balance report](../research/experiments/2026-10-14-night-passage-control.md).
These are structured tactical controls, not a calibrated human model.

The JSONL `reset` operation accepts `control`, `policy` and `rules`. `act` computes
and submits the selected policy with its measured work. `suggest` previews without
advancing time. `step` accepts caller-declared `workUnits` for external cooperative
policies; it cannot securely measure arbitrary caller code. Constrained `export`
is refused until the passage ends so a policy does not accidentally recover exact
state from a replay. A trusted caller choosing a seed can still reconstruct state:
this research process is not a hostile-code sandbox. `suggest` followed by a
manual `step` can underreport work; use evaluator-owned `act` or `evaluate` for
metered built-in policy comparisons.

```sh
npm run --silent engine:night-passage -- play --control standard --policy deliberate --difficulty veteran --seed my-seed --out test-results/night-passage-control/run.json --replay test-results/night-passage-control/run.replay.json
npm run --silent engine:night-passage -- evaluate --split development --seeds 10 --controls yes --witnesses yes --out test-results/night-passage-control/development.json
```

Freeze policy, difficulty and control parameters before running `--split evaluation`
on fresh seeds. If those results inform more tuning, retire that evaluation pool and
reserve a fresh pool (`--pool 2`, then 3, etc.) before the next evaluation claim.
Light/standard/heavy comparisons keep balanced fixed; exact uses the separate
original baseline and cannot isolate the effect of perception alone.
Raw reports and replays stay
under ignored `test-results/`; retain compact receipts and reproducible commands.

### Frozen legacy baseline · 2026-10-13

The unchanged baseline escaped on all 30 measured episodes. No parameter search
preceded this result. The [compact receipt](evidence/night-passage-agent-baseline.json)
pins the identical source graph used by both suites and retains individual outcomes.
Its historical `application/session.ts` path belongs to that recorded source revision;
current callers use `application/chronicle.ts`. Historical hashes are not rewritten
after a refactor.

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
