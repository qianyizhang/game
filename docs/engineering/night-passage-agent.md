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
make rollout files substantially larger than replays; retain them as experiment
evidence under the existing retention rules.

Open **Watch replay → Open rollouts**, selecting one or more `rollout.json` files.
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
extension point. Supply it to `runEpisode`, `runBenchmark` or `recordEpisode` as `player`; no changes to
rules, observations, controls or the episode loop are needed. Its factory runs once
per episode, receives only public configuration, and creates fresh policy memory.
The decision function receives `Sight` and returns the existing `Decision` shape.
Factory exceptions and malformed returns remain reviewable execution errors: traces
retain the attempted input, failure stage and JSON representation of malformed output.
No rejected proposal advances the replay. Factories are created when the episode
first has budget to request a policy decision.

```ts
import { recordEpisode, auditRollout, type PolicyPlayer } from './agent/rollout';
import { createPolicy } from './agent/policy';

const candidate: PolicyPlayer = {
  id: 'my-policy',
  version: 'my-policy-1',
  create(config) {
    const baseline = createPolicy('balanced', config);
    // Replace or refine this rule using only sight and episode-local memory.
    return (sight) => baseline(sight);
  },
};
const rollout = await recordEpisode({
  seed: 'my-development-seed',
  weapon: 'bow',
  control: 'standard',
  player: candidate,
});
const audit = await auditRollout(rollout, candidate);
```

The imports above are relative to the Night Passage directory in a TypeScript/Vite
caller. Local TypeScript modules default-export this same `PolicyPlayer`; the CLI
statically bundles the module with the native controller and pins its source. Start
with [the example module](../../src/games/night-passage/agent/example.ts):

```sh
npm run engine:night-passage -- record --out test-results/my-passage-policy \
  --policy-module src/games/night-passage/agent/example.ts --max-actions 100 --max-ticks 200
npm run engine:night-passage -- audit --input test-results/my-passage-policy/rollout.json \
  --out test-results/my-passage-policy/recheck.json \
  --policy-module src/games/night-passage/agent/example.ts
```

`play` and the published native `benchmark` also accept `--policy-module`. A module
must use its own ID, distinct from quick/balanced/deliberate. Each factory receives
only `PlayerConfig` and starts fresh episode memory. Preserve the `Decision.work`
component counts: their total affects simulated latency. Modules execute as trusted
local code, without a hostile-code sandbox. Audit without a matching custom module
still checks replay and original inputs, but decision reproduction is unavailable.
Browser review likewise preserves original custom inputs without inventing a missing
implementation.

The common workflow backend retains the native rollout schema, delayed controls,
replay, review URL and budgets. `--max-actions` includes the evaluator-owned start;
`--max-ticks` limits actual simulation. Its `--setup` accepts weapon, difficulty,
control, rules and public player `config` (decisionTicks, bowDistance,
meleeReachRatio). Native factories have no recorded policy-seed/options contract;
those shared flags and `--max-decisions` are rejected explicitly.

The common `engine:policy benchmark --game night-passage` freezes its protocol
before execution and records/audits every attempt through the native controller.
Development uses 10 seed blocks; evaluation uses 20 distinct reserved blocks. The
default grid is quick/balanced/deliberate × Standard/Veteran/Ordeal × five weapons
(**450 development or 900 evaluation attempts**). A supplied custom module adds an
explicit policy to this grid. Each attempt retains original inputs, native replay,
audit and a spectator manifest, sharing the retained source-pinned bundle. Errors
and timeouts remain in the denominator. Reports preserve each difficulty/weapon
stratum, native wins/score/win ticks, paired seed comparisons and honest intervals;
weapons are not pooled. These mechanisms do not constitute a new strength result.

Select a bounded development matrix before a larger study; selections and native
budgets are frozen in the protocol:

```sh
npm run engine:policy -- benchmark --game night-passage --split development \
  --out test-results/passage-study --weapon bow --difficulty standard --policy quick \
  --max-actions 100 --max-ticks 200
```

Explicit `--suite training|held-out` selects the labelled legacy summary benchmark
instead. It uses three existing seeds across five weapons for one policy/control
and does not retain per-case original inputs/audits. `--suite` and `--split` cannot
be combined. The original `engine:night-passage benchmark` and `evaluate` commands
and frozen calibration remain separate and retain their published semantics.

Retained bundles are content-addressed. Successive reports may reuse an existing
bundle only when its bytes match exactly; a mismatching file is preserved and
rejected. Fresh report/receipt paths remain exclusive. The
[workflow evidence](../research/experiments/2026-10-16-policy-workflow.md) verifies
native module recording, common CLI dispatch and per-case study inspection without
reinterpreting historical strength results.

Pass source/runtime provenance when retaining custom results through the
programmatic recorder; it labels missing provenance as null. Meter new tactical
work consistently with the documented proxy and bump policy identity/configuration
for changed behavior. A custom policy's presence in a trace does not certify its
hidden dependencies or work claims.

The [adoption audit](../research/experiments/2026-10-16-night-passage-rollout-review.md)
records coverage, concrete footguns and the limits of this slice. Existing frozen
strength/calibration reports remain unchanged; recording/review evidence is not a
new reserved strength comparison.
