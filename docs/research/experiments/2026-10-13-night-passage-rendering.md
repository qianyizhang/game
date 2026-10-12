# Night Passage enemy draw submission

## Question and comparison

Can batching compatible enemy surfaces reduce rendering work while preserving
the delivered geometry, animation, material feedback and gameplay state?

Baseline: `ab2180f`, with the measurement helper added but no runtime change.
Candidate: same-material enemy mesh batches built once when a family loads, and
one private skeleton shared by that actor's meshes. Saved Blender masters and
GLBs remain unchanged. The comparison does not change shadows, texture resolution,
effects, camera or rules.

## Protocol

- Chrome's disposable repository harness on the local Apple M5 Pro, ANGLE Metal,
  960 × 600 arena, device pixel ratio 1.
- Five enemies represent ordinary campaign density; 24 enemies are an explicitly
  synthetic expansion stress case. Both contain all four ordinary enemy families.
- Three rounds per workload, each with 45 warmup frames and 180 distinct moving
  snapshots. All native assets load before warmup. A fixed final tick supplies
  the matching screenshot; ten unchanged paused frames must issue no draws.
- Time only the production renderer's `draw()` call for CPU submission. RAF
  intervals also include browser scheduling and other page work. Neither is a GPU
  timer. Whole-evaluation CPU sampling guides attribution, including load/warmup.
- Record draw calls from the benchmark canvas's WebGL entry points. Compare
  deformed surfaces, triangle/material assignment and the held arrow separately.
  No wall-clock speed threshold is a correctness gate.

These controlled states measure presentation work. They do not establish human
combat feel, full-session thermal behavior, performance on other devices, or
high-DPI performance. Timing gains must be reported alongside the unchanged
display cadence when the baseline already meets the display refresh interval.

## Results

The [measurement receipt](2026-10-13-night-passage-rendering.json) records all six
rounds per implementation, browser/GPU details, source and delivery hashes, and
the fixed-view image comparisons. Values below span the three rounds; baseline
ran before candidate, without randomized order.

| Workload   | Draw calls per frame, before → after | CPU submission p95, before → after | RAF interval p95, before → after |
| ---------- | ------------------------------------ | ---------------------------------- | -------------------------------- |
| 5 enemies  | 266 → 184 (**31% fewer**)            | 1.1 → 0.8–0.9 ms                   | 16.7–16.8 → 16.7–16.8 ms         |
| 24 enemies | 832 → 448 (**46% fewer**)            | 2.2–2.3 → 1.5–1.6 ms               | 16.7–16.8 → 16.7 ms              |

CPU samples identified vertex-binding setup as the main sampled non-idle cost.
Batching reduces repeated binding and draw submission; sharing a skeleton avoids
repeating the same bone update/upload for every surface. The loaded GLB bytes
are unchanged. Both implementations already met the local display cadence, so
these results support lower submission cost and expansion headroom, not an FPS
improvement or a universal performance budget.

All six matching final screenshots have identical decoded RGBA pixels. Every
round preserves its rules snapshot, and ten paused frames submit zero draws.
Those fixed-view checks complement the deformed-surface and ownership tests;
they do not establish every possible camera/pose combination or human art approval.

The actual-delivery comparison covers **550 authored frames and 120 fractional
attack samples**, every skinned vertex, material/attribute multiplicity and
oriented triangle topology. Maximum world-position difference is zero for all
four families under matching transformed roots. Two clones retain independent
bones while each shares one private skeleton. The earlier native saved-edit
proofs were reused only after their source/delivery hashes matched the unchanged
files, then their browser agreement was rerun. No fresh native authoring is
claimed for this runtime-only change.

Native hierarchy inspection and verification helpers were delegated with
separate file ownership; root integrated the renderer, ran the serial benchmarks
and reviewed the evidence. This separation supported parallel work without a
controlled measurement of agent speedup.

Verification: maintenance passed; its sandbox loopback skip was resolved by the
approved nine-test usage check. The final full gate passed 322 application tests,
21 simulations and 128 geometry tests. Seven affected functional browser cases,
one native-agreement case and both benchmark runs passed.

## Reproduction

Use the pinned Node runtime and approved disposable-profile browser execution.
Run benchmarks serially and without simultaneous check suites:

```sh
nvm use
NP_PERFORMANCE_LABEL=current NP_PERFORMANCE_PROFILE=1 npm run test:browser -- tests/browser/night-passage-performance.spec.ts --project=functional
npm run test:browser -- tests/browser/night-passage-batches.spec.ts --project=functional
```

The helper writes measurements, screenshots and the optional CPU profile under
`test-results/night-passage-performance/<label>/`. Native surface comparisons are
regenerated rather than retained as large pose fixtures.
