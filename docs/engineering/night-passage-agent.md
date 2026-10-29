# Night Passage agent play

Night Passage has a deterministic agent interface, a baseline player and three
constrained heuristic policies. The browser and headless interface use the same
application commands and accepted-command replay. Headless runs can be imported
into the game or watched in the replay viewer.

The [policy development guide](policy-development.md) owns the cross-game standard.
This page owns Night Passage's concrete API and existing evidence. Its controls,
benchmarks and spectator are reference implementations. The completed
[adoption audit](../research/experiments/2026-10-16-night-passage-rollout-review.md)
adds original decision-input recording, rollout navigation and knowledge review,
with historical/runtime limits stated explicitly.

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

The exact baseline approaches/kites enemies, avoids disclosed threats, uses available
attacks and ranks survival rewards. Its public configuration is decision interval
(default 6 ticks), bow distance 230 and melee reach ratio 0.7. `runEpisode` and
`runBenchmark` accept configuration/budget overrides; invalid configuration is an
error, not a model loss. Timeouts retain partial score and remain nonwins.

```sh
npm run --silent engine:night-passage -- play --control exact --rules night-passage-4 --seed a-light-in-the-dark --weapon bow --out test-results/night-passage-agent/run.json --replay test-results/night-passage-agent/run.replay.json
npm run --silent engine:night-passage -- benchmark --control exact --rules night-passage-4 --suite held-out --out test-results/night-passage-agent/held-out.json
```

Legacy `training`/`held-out` suites each use three fixed seeds × five weapons, fresh
profiles and Root/Feather runes. Defaults are 20,000 accepted actions including start
and 120,000 executed ticks. Reports retain game/score/API/configuration/budget and
source/bundle identities. Preserve original evidence under `test-results/`; new
execution needs new output paths. Inspected evaluation seeds are no longer held out.

## Constrained control and policy work

`application/control.ts` owns history, redaction, held input, delayed delivery,
eight-direction movement and per-tick aim bounds. A constrained policy receives
only detached `Sight`; the evaluator owns exact results and replay export.

- **Perception:** aged tactical snapshots omit exact windup, cooldown/buffer/strike,
  hazard-cycle and projectile-lifetime clocks. Coarse early/late warnings remain.
  Velocity is derived from adjacent aged simulation samples, even between decisions;
  first sightings are unknown. Straight flight can therefore reveal exact velocity.
- **Transitions:** bootstrap is marked; menus/terminal states are current. Chamber
  transitions reset history/held input. Rejected commands receive the same restricted
  view. At most `observationTicks + 3` immutable chronicles are retained; the
  [observation comparison](../research/experiments/2026-10-15-night-passage-observation.md)
  records allocation changes without changing inputs, work or replay meaning.
- **Compute delay:** `reactionTicks + ceil(workUnits / workPerTick)`. Work meters
  marked entity scans, escape candidates and distance/threat/cover helpers; general
  arithmetic, allocation, menu ranking and some scans are omitted.
- **Hold:** `max(holdTicks, requestedTicks) + switchTicks * min(changes, 3)`.
  Changes count movement direction, offensive slot and a new dash. Old input continues
  during compute delay. Only delivered low-level controls enter authoritative replay;
  Chronicle owns canonical payloads and strips caller metadata before recording.
- **Effort:** Quick checks four escape landings, Balanced eight, Deliberate eight plus
  intermediate path points. Observations, ability windows and controls are shared;
  additional work can improve a choice or lose time. No ranking is forced.
- **Axes:** Light/Standard/Heavy control presets differ from Standard/Veteran/Ordeal
  gameplay tiers. [Calibration](../research/experiments/2026-10-14-night-passage-control.md)
  met selected Deliberate targets at 49/50, 38/50, 16/50 escapes under Standard controls.
  Heavy is a stress preset; the mechanism is not a human latency model.

JSONL `reset` accepts control/policy/rules. `act` computes and submits evaluator-owned
built-in work; `suggest` previews; manual `step` accepts self-reported work and can
underreport it. Constrained `export` is refused before terminal play, but a trusted
caller can reconstruct a chosen seed. Use `act`/`evaluate` for metered built-in
comparisons; the process is not a hostile-code sandbox. Imported controller metadata
identifies origin, not certification of later manually appended controls.

```sh
npm run --silent engine:night-passage -- play --control standard --policy deliberate --difficulty veteran --seed my-seed --out test-results/night-passage-control/run.json --replay test-results/night-passage-control/run.replay.json
```

Native `evaluate --split development|evaluation` retains its published calibration
meaning. Freeze policies, controls and difficulty first; after tuning on evaluation,
retire that pool and reserve a new one. Light/Standard/Heavy comparisons hold Balanced
fixed; Exact changes both policy and perception and cannot isolate either effect.

### Frozen legacy baseline · 2026-10-13

The exact rules4 baseline escaped 30/30 training/evaluation episodes. The
[original receipt](evidence/night-passage-agent-baseline.json) retains source hashes
and individual outcomes, including the historical `application/session.ts` path.
Current Chronicle ownership does not rewrite those pins. This saturated diagnostic
is separate from constrained-policy calibration and is not human-balance evidence.

## Verification

Select affected application, policy rollout and disposable-profile browser checks under
the [verification contract](checks.md#gate-selection). Existing checks cover observation
isolation, rejected-action atomicity, controller timing/work, replay/score accounting,
JSONL recovery, saved-game isolation and original-input inspection. Imported victories
prove reconstruction; they do not constitute new policy-strength measurements.

## Record and review policy knowledge

Use `record` for new constrained-policy episodes. It keeps the exact `Sight` supplied
at each decision, before policy code can mutate its detached copy, along with the
proposal, work breakdown, acceptance/error and delivery/cancellation timing. Setup is
an evaluator-owned start command; decision 1 is the first policy call after setup.

```sh
npm run --silent engine:night-passage -- record \
  --seed my-development-seed --weapon bow --control standard \
  --policy deliberate --difficulty veteran \
  --out test-results/my-passage-rollout
npm run --silent engine:night-passage -- audit \
  --input test-results/my-passage-rollout/rollout.json \
  --out test-results/my-passage-audit.json
```

Recording requires a **new directory**; auditing requires a new receipt path. Optional
`--max-actions` and `--max-ticks` bound a development probe. The recorder retains
`rollout.json`, `replay.json`, `audit.json`, `manifest.json` and its compiled runtime
under `bundles/`. The manifest pins source/tool/bundle hashes and runtime, records
artifact hashes and provides a same-origin review URL for output inside this repo.
Source drift fails recording. Full observations repeat public definitions and can
make rollout files substantially larger than replays. Keep selected diagnostic
captures under the [iteration retention rule](maintenance.md#policy-iteration-retention).

Open **Watch replay → Open rollouts**, selecting one or more `rollout.json` files.
The viewer also accepts gzip containers (`.gz` or `.gzip`). Local files and linked
responses are limited to 150 MB (150,000,000 bytes), with the same limit applied
after decompression; invalid UTF-8 and corrupt containers are rejected. Original
downloads retain the input bytes, including a UTF-8 BOM or compressed container.
For linked gzip artifacts, serve the original container without HTTP content
decoding; otherwise open the local file to retain its original bytes.

Filter runs by policy, difficulty, controls, outcome, weapon or seed; select an episode,
then use first/previous/next/last, a decision number or a region/chamber/phase marker.
**Before decision** and **After decision** seek the replay to that exact boundary.
Policy input defaults to the original recorded JSON, including legal actions and
control bounds. **Show evaluator view** reveals privileged state at the current
playback position; use Before decision for a decision-time comparison. The view
exposes seed/RNG and exact clocks for review and never supplies them to the policy.

For reloadable links while the dev server runs:

```text
/?game=night-passage&watch=1&rollout=/test-results/my-passage-rollout/rollout.json&decision=2
```

Decision numbers are one-based. Local file selection must be repeated after reload
when no same-origin URL exists. Playback, seeking and downloads use isolated state;
the playable save is untouched. Opening a plain replay clears policy review rather
than displaying stale knowledge from another run. Plain replays and historical
control-only traces do not contain original policy inputs; the viewer never invents
missing knowledge. Original rollout downloads preserve the uploaded file's bytes.

### Audit meanings and runtime precision

- **Replay reconstruction:** recorded proposals delivered through the controller
  reproduce accepted inputs, timing, final result and score. This never reruns a
  policy to decide which actions the game should execute.
- **Artifact integrity:** exact SHA-256 checks cover the payload and each policy input.
- **Permitted inputs:** recorded knowledge matches the reconstructed delayed/redacted
  controller view. Extra hidden fields fail even if an artifact was rehashed.
- **Policy reproduction:** a matching built-in or supplied custom policy reproduces
  proposals/work from the recorded inputs. Unknown policies are explicitly unavailable.

The CLI uses exact comparisons under its pinned runtime. Node and browser runtimes
can differ in the last bits of trigonometric results; the browser declares an absolute
`1e-10` tolerance **only for x/y coordinates, aim and velocity components**, and reports
its count and first numeric difference. Digests, field presence, discrete choices,
clock fields, score and outcomes remain exact. Replay packing differences are compared
by executed spans. Larger differences fail. The original recorded input is always
shown unchanged. Current-code reconstruction is labeled separately from the original
source pins and is not proof against hostile policy code or a reproduction claim for
an unavailable historical executable.

The first mismatch includes its decision, field path and recorded/reconstructed value.
Use **Go to first mismatch** to inspect it. The aggregate for loaded files is descriptive:
its groups keep rules/content/score/policy/configuration/controls/budgets separate, but
selected files do not constitute a frozen experiment or independent strength evidence.
Current heuristic diagnostics contain commands and work, not alternative valuations
or a causal explanation of why a run lost. Prefix branching is not offered by this
reviewer; original replay export remains available for separate experiments.

### Add a developer policy

`PolicyPlayer` in [rollout.ts](../../src/games/night-passage/agent/rollout.ts) is the
extension point for `runEpisode`, `runBenchmark` and `recordEpisode` through `player`.
The factory receives only public `PlayerConfig`, runs once per episode when budget
permits a decision, and creates fresh memory. Its decision receives `Sight` and returns
`Decision`, including the metered `work` breakdown. Errors/malformed output retain
the attempted input and failure stage; rejected proposals never enter replay.

Start from the [local module](../../src/games/night-passage/agent/example.ts):

```sh
npm run engine:policy -- record --game night-passage --policy-module src/games/night-passage/agent/example.ts --out test-results/my-passage-policy --max-actions 100 --max-ticks 200
npm run engine:policy -- audit --input test-results/my-passage-policy/rollout.json --out test-results/my-passage-policy/recheck.json --policy-module src/games/night-passage/agent/example.ts
```

Modules default-export `PolicyPlayer` and use an ID distinct from
quick/balanced/deliberate. The native `play`, `record` and legacy `benchmark` commands
also accept `--policy-module`. Static bundling pins actual sources; modules remain
trusted local code. Missing custom factories leave policy reproduction unavailable
while replay/input audits and original knowledge remain inspectable. Programmatic
recording labels absent source/runtime provenance as null.

The common workflow keeps the native schema, delayed controls and budgets.
`--max-actions` includes evaluator start; `--max-ticks` bounds actual simulation.
`--setup` accepts weapon, difficulty, control, rules and public player config
(decisionTicks, bowDistance, meleeReachRatio). Shared `--max-decisions`,
`--policy-seed` and `--policy-options` are unsupported and rejected explicitly.

| Benchmark route                         | Meaning                                                                                                                                                                                                                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Common `--split` development/evaluation | Freeze 10/20 independent blocks across three effort policies, three gameplay tiers and five weapons (450/900 attempts); retain per-case outcomes/audit verdicts by default. `--retain-rollouts all` saves original rollout/replay/audit/manifest per case. A custom module adds an explicit policy. |
| Explicit `--suite` training/held-out    | Labelled legacy summary: three existing seeds × five weapons, one policy/control, without per-case original inputs/audits. Cannot combine with `--split`.                                                                                                                                           |

Choose a bounded development grid and native budgets before a larger study. Report
weapon/difficulty strata, all errors/timeouts, score, winning time and paired seed
uncertainty; repeated weapons are not independent seeds. Native `benchmark`/`evaluate`
and frozen calibration retain their historical meanings. Summary-only results cannot
supply missing original knowledge for later inspection. They remain the default for
routine iteration; opt into detailed capture only when that inspection is needed.

Content-addressed bundles may be reused only when bytes match; preserve/reject a
conflict. Report/receipt paths remain exclusive. The [workflow evidence](../research/experiments/2026-10-16-policy-workflow.md)
verifies dispatch and inspection; the [adoption audit](../research/experiments/2026-10-16-night-passage-rollout-review.md)
records concrete review failures and fixes. Neither is a new strength comparison.
