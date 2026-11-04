# Scrapyard horde prototype

Open `?prototype=scrapyard` from the workshop's prototype link. This is a small
Brotato-style experiment in the existing TypeScript, React and Canvas stack,
with no new dependencies or shared combat engine.

## Play and replay

Move with WASD or arrow keys while the arena has focus. Six automatic weapons
handle targeting: three rivet guns, two scatterguns and a scrap cannon. Escape
or Pause stops combat; leaving the window also pauses it. The overlay owns Resume.
Keyboard input is supported; narrow layout does not imply touch controls.

Survive three 30-second waves. The selected 100/300/500 enemy population is
maintained by replacing kills. Teal Spitters keep their distance, show a barrel
and windup ring, and fire coral diamond bullets. Their aim locks during windup.
Enemy bodies do not absorb those bullets; player contact consumes them even
while invulnerable. Local separation spreads crowds but permits small overlaps
under pressure. There is no rigid-body physics or obstacle pathfinding.

Green pickups become scrap. Completed waves bank uncollected scrap plus a bonus.
Between waves, buy damage, speed or a full repair, once per item per shop. Damage
and speed last for the run. The seed and population controls apply to the next
run. These are prototype rules, not calibrated difficulty settings.

Runs are session-only. Export under **Prototype & replay** to keep the seed,
accepted commands and rules identity. Import validates and reconstructs before
replacing the current run, then pauses it. Failed or superseded imports retain
the current run. Reload starts fresh; there is no automatic save.

`scrapyard-2` owns replay meaning. Rules-1 files are rejected, not reinterpreted.
Changes affecting reconstruction require a new identity. Malformed/out-of-phase
commands and duplicate or unaffordable purchases are rejected without changing
state or replay. Imports and packed histories have bounded capacity.

## Ownership

- `domain/content.ts`: rules identity, arena, enemies, weapons, shop and storage limits.
- `domain/world.ts`: browser-independent seeded simulation and replay. Mutable
  entity storage stays private; callers borrow a read-only view or retain a
  detached snapshot. Enemy replacement and projectiles reuse storage. Excess
  pickups merge value rather than losing scrap.
- `ui/`: bounded 60 Hz clock, Canvas drawing, input lifecycle and React menus/HUD.
  The HUD copies display values only, not enemy/projectile arrays. Canvas draws
  confirmed state, scales to pixel density up to 2× and disposes its observer.

Separation rebuilds the spatial grid for two symmetric local correction passes.
Coincident positions use deterministic ID-based directions without consuming
RNG. The final grid serves targeting and friendly swept collision. Hostile
bullets use swept collision against the player. Friendly and hostile limits are
separate, so enemy fire cannot starve player weapons. Content owns the numeric
parameters. No 3D animation or elaborate effects are implemented.

## Verification

Use the pinned runtime and approved disposable-profile Chrome harness:

```sh
nvm use
npx vitest run --project application src/games/scrapyard --maxWorkers=1
npx playwright test tests/browser/scrapyard.spec.ts --project=functional
SCRAPYARD_BENCHMARK=1 npx playwright test tests/browser/scrapyard.spec.ts --project=functional --grep='bounded 100'
```

Rules tests cover all populations, sustained projectile load, scrap conservation,
three-wave lifecycle/shop accounting, rejection atomicity, replay equality,
reduced overlap, ranged damage before contact, defeat and pause/catch-up.
Browser journeys exercise workshop navigation, real keyboard movement/auto-fire,
pause including bullet state, shop, downloaded replay recovery, population
selection, defeat/retry, empty seed and narrow layout. These scripted witnesses
are not policy-strength or human combat-feel evaluation.

Run the benchmark serially without other checks or active game tabs. It uses the
production rules, renderer and clock in an isolated document, fixed seed and
waypoint input, with normal health/damage. Three rounds rotate density order.
Each workload warms for 120 ticks and measures the next 600. Acceptance requires
population retention, survival, median >=200 hostile bullets and no sampled cap
saturation. Bullet distributions distinguish sustained load from a brief peak.
CPU timing thresholds are not correctness gates.

## Local performance finding, 2026-11-04

Apple M5 Pro / 64 GB RAM, macOS 26.6.2, headless Chrome 156; a 960×600 arena at
DPR 1. Ranges span three rounds per population:

| Enemies | Hostile bullets min / median / peak | Simulation CPU p95 | Canvas submission p95 | Combined CPU p95 | RAF interval p95 |
| ------- | ----------------------------------- | ------------------ | --------------------- | ---------------- | ---------------- |
| 100     | 210 / 564 / 605                     | 0.2 ms             | 0.9 ms                | 1.0 ms           | 16.7–16.8 ms     |
| 300     | 582 / 1,445–1,446 / 1,488           | 0.3 ms             | 4.2–4.4 ms            | 4.4–4.6 ms       | 16.7–16.8 ms     |
| 500     | 1,021 / 2,391 / 2,479               | 0.4 ms             | 9.0–9.1 ms            | 9.4 ms           | 16.7–16.8 ms     |

Every measured frame had >=200 hostile bullets; none of 5,402 intervals exceeded
25 ms or sampled the hostile cap. Total projectile peaks were 611 / 1,490 / 2,481.
Final kills and health were identical across rounds. Canvas submission dominated
CPU work; the current stack maintained roughly 60 Hz for this workload.

The earlier rules-1 trial lacked separation and enemy fire. Combined CPU p95 was
0.2 / 0.2–0.3 / 0.3 ms, with only 9 / 8 / 7 peak projectiles. This comparison
expands workload; it is not an optimization speedup. Subsequent HUD-only cleanup
leaves the measured simulation, renderer and clock unchanged, so this evidence
is reused rather than rerun.

Timing granularity was about 0.1 ms. CPU submission is not GPU completion. The
harness excludes the React HUD, file controls and human input latency; it does
not establish high-DPI, other-device, memory/thermal or long-session performance.

The ignored `.artifacts/scrapyard-prototype/` bundle owns raw rules-1/rules-2
measurements and representative captures, with one README and a **2026-12-04**
review date. Retire or remeasure this claim if its evidence or tested inputs
change. Scoped technical and browser checks do not establish independent visual
acceptance, human feel or unrelated/native-suite coverage.
