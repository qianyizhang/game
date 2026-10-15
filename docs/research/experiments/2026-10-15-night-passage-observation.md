# Night Passage observation construction · 2026-10-15

Local profiling supports retaining two changes: read the evaluator result once per
decision, and construct observations only when requested. The controller keeps its
existing bounded history as immutable chronicles and redacts a freshly detached view.
No cache, new module, rules identity or policy behavior was introduced.

## Measurements

Each normal repetition runs nine bounded episodes: Light/Standard/Heavy controls
crossed with sword/quick/Standard, bow/balanced/Veteran and spear/deliberate/Ordeal.
Seeds are `observation-profile-sword`, `observation-profile-bow` and
`observation-profile-spear`. Each episode permits at most 4,000 ticks and 2,000
actions, including replay and control-trace export.

Each variant runs in a fresh Node 24.21.0 process, with one 300-tick/100-action warmup
using the fifth case, followed by explicit garbage collection. Execution order
alternates within pairs. Timing includes episode execution but excludes building,
import, warmup and result hashing. No other test/build process ran during these comparisons.

| Comparison                            | Repetitions per variant | Median duration before → after | Reduction | Median process peak RSS before → after |
| ------------------------------------- | ----------------------- | ------------------------------ | --------- | -------------------------------------- |
| Original → one evaluator read         | 7                       | 3,029.58 → 2,467.49 ms         | 18.6%     | 139,520 → 139,440 KiB                  |
| One read → lazy construction          | 7                       | 2,439.33 → 1,776.09 ms         | 27.2%     | 139,360 → 139,072 KiB                  |
| Maximum-delay stress: one read → lazy | 3                       | 1,337.94 → 514.94 ms           | 61.5%     | 138,800 → 122,192 KiB                  |

The stress run uses the same nine cases with observation, reaction, hold and switching
settings all set to 60 ticks. This exercises the maximum 63-sample history and long
batches between decisions. It is a separate workload, not a faster run of the normal
conditions. Process peak RSS includes startup and warmup; it is not a direct measure
of retained history size. These local bounded workloads show no material memory
regression, not a universal performance or memory guarantee. The two normal comparisons
are separate runs; their percentages should not be added.

## Behavior preservation

Every repetition within each comparison produced identical full episode results,
including scores, actions, work totals, control traces and replay bytes; no episode
reported an error. A separate comparison checked 2,400 observations across rules 4
and 5 and observation delays of 0, 1, 3 and 60 ticks. It included 3,354 non-null
projectile velocity estimates and 84 bootstrap views. Policy decisions, step results,
exact results, traces, metrics and replay bytes matched the original implementation.

Committed regressions cover nested observation isolation, adjacent-simulation-sample
velocity, unknown first sightings, passage reset and episode budgets under all four
control modes. The implementation preserves historical chronicle context so delayed
legal actions still use the historical replay capacity. It does not infer legality
from the current state or retain mutable public observations.

## Provenance and reproduction

The [receipt](2026-10-15-night-passage-observation.json) pins the baseline revision,
each compiled variant, source/tool hashes, repeated measurements, outcome summaries
and retained local evidence. The baseline is commit `98cb732`. The final executable
matches the timed lazy variant byte-for-byte. Existing calibration reports and their
source identities remain unchanged.

The protected local evidence directory is
`test-results/night-passage-observation-2026-10-15/`. It retains compiled variants,
measurement/reproduction scripts, repeated results and one copy of each identical
episode payload. These ignored files are not promised in a fresh clone.

To repeat locally without overwriting retained evidence, copy that directory to a
fresh temporary directory, use the pinned Node runtime, then run
`node compare.mjs baseline single-read final` from the copy. Use
`OBSERVATION_STRESS=1 PROFILE_PAIRS=3 node compare.mjs single-read final` for the stress
workload, and `node verify-views.mjs` for the observation comparison. Build time is
deliberately outside this benchmark; fresh source changes require new pins and results.
