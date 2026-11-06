# Night Passage experiment ledger

Dated results with original identities retained in linked JSON receipts. Current
controls, policy interfaces and reproduction commands belong to the
[agent guide](../../engineering/night-passage-agent.md). Recovery links identify
precompaction prose; old local raw-path claims do not override subsequent
[retirement](../../engineering/maintenance.md#policy-iteration-retention).

<a id="2026-10-13-night-passage-rendering"></a>

## 2026-10-13 enemy draw submission

Baseline `ab2180f` versus same-material enemy mesh batches and one private skeleton
per actor; masters, GLBs, camera, rules, textures and effects stayed unchanged.
Local Apple M5 Pro / Chrome ANGLE Metal, 960×600, DPR1; three rounds per workload,
45 warmup frames and 180 distinct moving snapshots. Five enemies represented ordinary
density; 24 were a synthetic stress case. Baseline ran first, without randomized order.

| Workload   | Draw calls/frame before → after | CPU submission p95   | RAF interval p95         |
| ---------- | ------------------------------- | -------------------- | ------------------------ |
| 5 enemies  | 266 → 184 (31% fewer)           | 1.1 → .8–.9 ms       | 16.7–16.8 → 16.7–16.8 ms |
| 24 enemies | 832 → 448 (46% fewer)           | 2.2–2.3 → 1.5–1.6 ms | 16.7–16.8 → 16.7 ms      |

Six matched screenshots had identical decoded pixels; ten paused frames issued no
draws in each round. All four enemy families matched every skinned vertex and oriented
triangle/material/attribute topology across 550 authored frames and 120 fractional
attack samples, with zero position difference and independent clone bones.
Native saved-edit proofs were reused only after hash checks and renewed browser
agreement; no fresh authoring was claimed. Historical gates included 322 application,
21 simulation and 128 geometry tests plus affected browser/native-agreement checks.

**Decision:** retain batching for lower CPU submission cost and headroom. Both versions
already met local display cadence. Draw/CPU reductions do not establish GPU FPS,
other-device/high-DPI performance, long-session thermals or aesthetic approval.

- [Measurement receipt](2026-10-13-night-passage-rendering.json)
- [Original protocol, measurements and reproduction](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-13-night-passage-rendering.md)

<a id="2026-10-14-night-passage-control"></a>

## 2026-10-14 controls and difficulty calibration

Rules5 separated gameplay pressure, policy effort and control restrictions. Each
condition paired ten seeds × five weapons with a fresh profile and Root/Feather
runes, at most 20,000 accepted policy/menu decisions (including start) and 120,000
executed combat ticks. Deaths/timeouts/errors stayed in denominators; errors invalidated
measurement. Quick/Balanced/Deliberate policy work was metered into delivery delay;
the exact-state baseline changed both policy and perception and was only a diagnostic.

Development used `passage-control-development-1-00..09`, preceded by a three-seed
screen. The 900-episode broad grid had 589 victories, 310 losses, one timeout and zero
errors. Deliberate was the reference at every tier. Veteran damage1.25 and Ordeal1.30
exceeded targets; damage-only reruns selected Veteran1.30 and then Ordeal1.50. The
first reserved Ordeal pool still produced 22/50 wins (44%), missing its 10–40% target.
That failed pool was retired before selecting damage1.65; it is not fresh evidence
for the final settings. Final development Deliberate wins were 50/50, 40/50 and 13/50
for Standard/Veteran/Ordeal.

Final evaluation retained Standard/Veteran reserved pool1 (600 episodes matched the
final executable) and fresh Ordeal pool2. The final frozen bundle was
`d87013f8a87e0512df2b827e3de41d23034ed5e0b212c7232ce9eae4fda0f2e4`.
All 900 episodes had zero errors and one timeout, in Light/Ordeal; all nine
Standard-control policy conditions had zero errors/timeouts.

| Tier     | Quick wins / 50 | Balanced / 50 | Selected Deliberate / 50 | Declared target |
| -------- | --------------: | ------------: | -----------------------: | --------------- |
| Standard |              46 |            46 |                       49 | 80–100%: met    |
| Veteran  |              25 |            26 |                       38 | 40–80%: met     |
| Ordeal   |               2 |             5 |                       16 | 10–40%: met     |

With Balanced held fixed, Light/Standard/Heavy wins were 50/46/11 on Standard,
49/26/1 on Veteran and 32/5/0 on Ordeal, each /50. Heavy/Ordeal's **0/50** makes Heavy
a stress preset, not the default reference. The separate exact-baseline diagnostic
won 49/42/14; it did not dominate Deliberate on every tier.

**Weapon counterexample:** final Deliberate Ordeal wins /10 were sword5, spear0,
shield1, bow8, fists2; spear had 0/10 under all three policies. A first-success
development search found a Standard-control spear escape on
`passage-control-development-1-48` after 39 attempts (13,656 points, 26,257 ticks).
That is feasibility, not an estimated win rate. Fourteen of fifteen terminal witness
files came from evaluation; Spear/Ordeal came from this separate search. Each had
verified hashes, final-engine import/score/tick parity and backward spectator seeks.

Selected Deliberate median **winning-only** combat times were 489.2/464.2/445.9s;
mean scores over all 50 attempts were 13,661.60/11,099.54/5,889.76. Combat-decision
rates were exposure-weighted simulation rates (roughly 13.00–13.31Hz), not CPU
throughput. Exact work was unmetered, not zero computation. Equal timing models did
not imply equal policy work or a causal control-only comparison.

Rules4/content3 chronicles retained original gameplay/score1; the old bow witness
kept 12,700 points and 28,995 ticks through continuation and playback. Provisional
rules5 tuning replays require matching compiled parameters; a version label alone
is insufficient. Ordeal03's compiled bundle was not retained: source/digest receipts
do not constitute a full executable archive. An early `decisionTicks:6` bookkeeping
field was corrected to the constrained request's actual1 without rewriting older
source identities. Historical gates were 418 application / 37 simulation tests and
14 browser journeys. Aggregate target success does not establish equal weapon balance,
human fairness/skill, enjoyment or universal parameter ordering.

- [Frozen parameters, full matrices and provenance](2026-10-14-night-passage-control.json)
- [Full original calibration report](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-14-night-passage-control.md)

<a id="2026-10-15-night-passage-observation"></a>

## 2026-10-15 observation construction

Baseline `98cb732`; nine bounded episodes per repetition crossed Light/Standard/Heavy
with sword/Quick/Standard, bow/Balanced/Veteran and spear/Deliberate/Ordeal on three
`observation-profile-*` seeds. Limits were 4,000 ticks / 2,000 actions. Fresh Node24.21
processes, warmup, explicit GC and alternating paired order excluded build/import/warmup
from timed episodes. No concurrent test/build ran.

| Separate comparison                   | Repetitions/variant | Median duration before → after | Median process peak RSS |
| ------------------------------------- | ------------------: | ------------------------------ | ----------------------- |
| Original → one evaluator read         |                   7 | 3,029.58 → 2,467.49 ms (18.6%) | 139,520 → 139,440 KiB   |
| One read → lazy observations          |                   7 | 2,439.33 → 1,776.09 ms (27.2%) | 139,360 → 139,072 KiB   |
| Maximum-delay stress, one read → lazy |                   3 | 1,337.94 → 514.94 ms (61.5%)   | 138,800 → 122,192 KiB   |

Stress used 60-tick observation/reaction/hold/switch settings and the maximum
63-sample history, a distinct workload. The two normal percentages must not be added.
Process RSS includes startup/warmup and is not retained-history size.
Every repetition preserved full results, traces, work and replay bytes with zero
errors. Another 2,400 observations across rules4/5 and delays0/1/3/60 matched, including
3,354 projectile velocity estimates and 84 bootstrap views. **Decision:** retain one
read and lazy construction, preserving detached historical views; no cache, rule or
policy change. This is local bounded performance evidence, not a universal guarantee.

- [Measurement and source receipt](2026-10-15-night-passage-observation.json)
- [Original method and recovery](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-15-night-passage-observation.md)

<a id="2026-10-16-night-passage-rollout-review"></a>

## 2026-10-16 original-knowledge review adoption

Added opt-in detached original inputs, fresh custom-policy factories, raw proposals,
work/cancellation records, packing-independent replay navigation and separate integrity,
native replay, permitted-input and policy-reproduction verdicts. Existing policy,
control, calibration and replay identities stayed unchanged. Readable current commands
live in the [agent guide](../../engineering/night-passage-agent.md#record-and-review-policy-knowledge).

Independent review fixed budget/terminal enforcement, malformed/custom output handling,
selection independent of playback availability, superseded asynchronous selection and
incorrectly passing unperformed audits. A rehashed hidden-field leak must fail input
audit even when its native replay remains legal. Original-byte downloads cannot be
replaced by pretty-printed reconstructions. Browser coordinate/angle checks declare
`1e-10` absolute tolerance for Node/Chrome last-bit trigonometry drift; hashes, fields,
discrete choices and clocks stay exact. These prevention rules now belong to the
[testing policy](../../engineering/testing.md) and game-owned guide.

A Light/Deliberate bow development run on `a-light-in-the-dark` escaped with 14,081
points at 30,581 ticks. All 12,664 recorded decisions reconstructed with permitted
knowledge and exact CLI reproduction; the pre-pin recording was 60,679,013 bytes.
This is a developer/replay witness, not an independent strength sample. Dated gates:
444 application / 37 simulation tests and nine browser journeys, including complete
victory and damaged-artifact recovery. No new reserved strength matrix was run.

Older replays have no retroactively fabricated knowledge. Exact-state runs remain
diagnostics; unknown factories leave reproduction unavailable. Browser inspection
uses current-code reconstructions; historical exact reproduction requires matching
source/bundle/runtime pins. Prefix branching remains deferred; this is cooperative
in-process policy development, not hostile-code isolation or causal loss attribution.

- [Full original report and audit qualifications](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/research/experiments/2026-10-16-night-passage-rollout-review.md)
