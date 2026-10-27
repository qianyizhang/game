# Verification contracts

Use the pinned Node/npm runtime (`nvm use`) and Python through `uv`. One gate owner per checkout; retain failure logs. Passing a focused check does not credit full validation, native execution or visual quality.

| Local command                              | Required scope                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| `npm run format:maintenance`               | Documentation formatting, inventory and links.                                    |
| `npm run check`                            | Maintenance/build, every application test and 37 seeded simulations; no geometry. |
| `npm run check:full`                       | `check` plus every geometry test; no browser/native execution.                    |
| `npm run test:geometry -- <file>`          | Focused construction/motion iteration.                                            |
| `npm run test:browser:smoke`               | Five real game journeys; limited smoke evidence.                                  |
| `npx playwright test --project=functional` | All public loading, interaction and exported-artifact journeys.                   |
| `npm run test:browser`                     | Functional plus conditional native/private projects.                              |

## Gate selection

Locally, use `check` for code/UI/rules and `check:full` for 3D construction, animation, rendering/export or shared DCC dependencies. Run affected browser/native gates separately. Documentation-only changes use formatting/inventory. See [testing policy](testing.md).

The scoped CI extension separates focused policy regressions from unchanged rollout matrices. Both remain in the default application suite. [PR22](https://github.com/qianyizhang/game/pull/22) retains the dated pre-extension measurements below; measure each final revision rather than assuming a speedup.

| Proposed automatic scope                                                            | What runs                                                                                                                                                           |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every PR                                                                            | Formatting/lint/types, Python and DCC/tool contracts, pointers/hashes/manifests, build, all simulations, shared/focused policy regressions and five smoke journeys. |
| Owned source change                                                                 | Literal import/re-export dependants plus declared browser ownership. HTTP/browser entry points need ownership; imports alone are insufficient.                      |
| Policy/observation/adapter/rules/content/replay change                              | Affected game's complete rollout matrix, including transitive semantic dependants. UI-only changes retain focused policy regressions.                               |
| Shared evaluator/source, configuration, unknown/deleted paths or unclassified tests | Comprehensive fallback: every application file, geometry and public browser journey.                                                                                |
| 3D scene or native source/delivery                                                  | Geometry plus affected browser delivery. Native DCC changes conservatively use comprehensive fallback. Fresh Blender remains a separate local release requirement.  |
| Main push, weekly Monday 03:23 UTC, manual or reusable release call                 | Comprehensive validation. The full suite is not major-release-only.                                                                                                 |

Modules: [safety core](../../.github/workflows/check-core.yml), [application](../../.github/workflows/check-application.yml), [asset build](../../.github/workflows/asset-build.yml), orchestrated by [Repository checks](../../.github/workflows/maintenance.yml). The safety core starts in parallel with selection; the final gate needs no dependency install. The final gate rejects failed/cancelled/skipped required modules. No deployment or protection setting is added. A future release must call `maintenance.yml` and depend on its success; asset-only success is insufficient.

Selection uses Git merge-base diff and exact checkout SHA. Shared/unknown changes fall back to full; there is no GitHub path-filter diff limit. Generated policy bundles cannot be inferred from literal imports: tool contracts, simulations and explicit policy ownership cover that boundary. New source/test roots require scope review.

```sh
CI_BASE=<exact-base-sha> npm run ci -- plan /tmp/ci-plan.json
npm run ci -- core
CI_PLAN="$(cat /tmp/ci-plan.json)" CI_SHARD=1 npm run ci -- run unit
CI_FULL=1 npm run ci -- plan /tmp/full-plan.json
CI=1 ASSET_BUILD_CI=1 npm run check:full
```

Run every shard listed in the plan; use `run browser` or `run geometry` for asset modules. An empty selection explicitly runs nothing. Default `npm test`, `check`, `check:full` and browser commands retain their complete discovery.

### Measured CI evidence (2026-10-27)

| Revision/run                                                                                                   | Result and time                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Historical `97983798`, [40272928660](https://github.com/qianyizhang/game/actions/runs/40272928660)             | Geometry was already excluded. Rules-1 log span 201.9 s: application command 177.1 s, checkout 13.7 s, Node/cache 4.9 s, npm 3.4 s, other 2.8 s. Rules-2 span 193.4 s.                                                                                |
| Before scoped selection `1b587da`, [40480644866](https://github.com/qianyizhang/game/actions/runs/40480644866) | All 9 lean jobs pass; 574 tests across 93 files. Concurrent log window 160.9 s; slowest job 159.8 s (test 138.25 s). Two-minute target **not met**. Overlapping job spans total 753.6 runner-seconds, not elapsed time.                               |
| Same head, [40480645028](https://github.com/qianyizhang/game/actions/runs/40480645028)                         | Geometry 128/28 pass 292.28 s. Browser 59 pass, 1 fails, 180 not run: Cartographer phone horizontal-overflow assertion, not timeout.                                                                                                                  |
| Earlier local full gate                                                                                        | Maintenance/build, 574 app tests and 37 simulations pass. Sequential logged span 538.6 s; application 368.55 s. Five smoke journeys pass 36.2 s.                                                                                                      |
| Local public browser                                                                                           | 145 pass, 2 fixture skips, 1 Night Passage campaign timeout, 92 not run. Existing 16-minute per-test deadline fired before 90-minute process ceiling. No clean-main campaign rerun; rendering source unchanged is not proof of baseline reproduction. |

Log spans use timestamped markers, not official step API durations; queue/pre-log time is unknown. Runner differences and changed revisions prevent a controlled speedup claim. The separate policy split measured 119.77 s before/121.78 s after for the full matrix: it improves selectable feedback, not full execution cost. Focused 41 tests took 2.38 s in that worker. In this checkout they passed in 2.57 s (3.23 s process wall); the complete 90-test safety core passed in 13.65 s (14.82 s wall, overlapping maintenance lint). These are local timings, not hosted guarantees.

Final local application selection retained **574 tests across 95 files**, passing in 353.2 seconds process wall time. The reviewed policy patch was applied byte-for-byte; its full matrices, seeds and assertions are unchanged.

### Browser prerequisites

Playwright 1.64.0 and Chrome are pinned. `functional` selects public inputs; startup failure fails. `requires-blender` and `requires-private-evidence` skip explicitly when their named evidence is absent; available invalid evidence fails. `visual-review` produces 29 contact sheets, not automated aesthetic approval. Static checks/smoke do not establish model delivery or native acceptance.

Run `npm run test:browser -- --list` to inspect current discovery. Fresh producer commands below supply native evidence; installed Blender alone is insufficient. Private input uses `TRACE_PRIVATE_INPUT`; available authorized exports remain required. Repo Workbench owns Canvas verification in repo-kit, including the historic 1.64.1 pointer diagnostic; game verification remains here.

## Asset construction and delivery inventory

All rebuild families are below; the [28-file geometry list](asset-geometry-tests.txt), [catalogue](../../src/art3d/catalogue.ts), [factory](../../src/art3d/procedural/factory.ts) and [DCC registry](../../packages/dcc-workbench/registry.json) identify concrete assets. Memory/time not measured per family stays unknown.

| Family / command                                                                 | Input → validation/output                                                                                                                            | When / cost                                                                                                           |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 24 procedural studies + legacy Cub/Stray: `test:geometry`                        | Catalogue/factory → meshes, skinning, motion assertions.                                                                                             | Affected 3D changes/release; 2 workers; full 128 tests 292.28 s hosted/440.03 s local with dedicated budget.          |
| Shared animation, surface sculpt and gallery recording: `test:geometry`          | Construction/animation/recording helpers → geometric and recording invariants.                                                                       | Shared 3D changes/release; included above, individual cost unknown.                                                   |
| DCC contracts: `test:dcc`, `check:python`                                        | Hydrated masters, receipts and GLBs → hashes, finite normals, joints, pose/pointer/integrity assertions.                                             | Always-on CI + release; no native rebuild; per-family time/RAM unknown.                                               |
| SVG: `test:tools`, `assets:export -- <destination>`                              | [SVG sources](../art/svg.md) → validated temporary catalogue/manifest.                                                                               | SVG/tool changes + release; contracts always-on; export time/RAM/size varies, unmeasured.                             |
| Public browser: `playwright test --project=functional`                           | Delivered assets + Chrome → loading, motion, layout, export/download/roundtrip checks.                                                               | Affected presentation/delivery + comprehensive runs; 1 worker/runner; heavy full jobs 35–90 min and failing as above. |
| Saved-source native: `test:dcc:runtime`, `test:dcc:saved`, `test:dcc:native`     | Blender 5.2 masters → fresh samples, edits, exports/parity.                                                                                          | Affected native sources/release; local; per-family time/RAM unknown; unrun here (installed 4.3.2).                    |
| Canid, fox, boar, raven, otter producers                                         | [Species commands](../../packages/dcc-workbench/README.md#extending-motion-studies-copper-fox) → edit/export proofs.                                 | Corresponding source/release; Blender; cost unknown.                                                                  |
| Night Passage hero/enemies/guardians/weapons/environments                        | [Native producers](../../packages/dcc-workbench/subjects/night-passage/README.md#reproduce-and-extend) → saved masters, exports and review evidence. | Corresponding source/release; Blender; cost unknown.                                                                  |
| Conditional/private/visual browser: `test:browser:native`, `:private`, `:review` | Fresh native/private inputs → parity; visual views → contact sheets.                                                                                 | Affected evidence/review; 1 worker; explicit absence skips; cost unknown.                                             |

Construction outputs (not necessarily deployed meshes): Watcher: 306,112 vertices / 576,812 triangles / 24,051,404 raw bytes; Banner Bearer: 509,409 / 968,512 / 30,390,396; Matron: 269,770 / 515,220 / 17,203,496. Raw attributes/indices are not total RAM. A separate sampled process-family RSS peak 1,107,636,224 bytes double-counts shared pages; allocations are not retained memory. Other costs unknown. Local limits: 4 CPU / 16 GiB, not measured usage or hosted capacity.

Delivered byte/triangle/material counts belong to each [DCC release](../../packages/dcc-workbench/releases.ts)/subject manifest. Larger dedicated budgets did not fix historical 15-second geometry timeouts. Local four-case comparison had 2 failures with 2 workers (44.3 s), all 4 pass serially (56.1 s); fidelity/assertions were preserved.

## Static-check scope

- **App & tests**: Typed ESLint and strict TypeScript cover `src`, browser/simulation tests, and configs.
- **Tools**: CLI modules, SVG cabinet scripts, and embedded viewer runtimes receive strict typechecks.
- **DCC**: Frontend and delivery CLI use strict TypeScript and ESLint. Python modules use Ruff, strict mypy, and contract tests. Validates GLB budgets, finite normals, joint counts, and pose metadata.

## Native authoring gate

The active launcher requires Blender 5.2 LTS. The [runtime record](blender-runtime.md) names the exact tested build and migration evidence. `npm run test:dcc:runtime -- --output test-results/FRESH` opens, samples, saves and reopens every saved master on fresh copies. Add `--baseline PRIOR/samples.json` for a hash-bound cross-version comparison. This checks sampled geometry, rig matrices and saved curves; it does not replace export/browser or visual review.

- `npm run test:dcc:saved -- --asset <id>`: Tests the saved-source edit loop (probe deformation, save/reload, export, and Three.js comparison on disposable copies). See [DCC contracts](../../packages/dcc-workbench/README.md#verification-and-provenance).
- `npm run test:dcc:native`: Evaluates native Blender head-control parity against 64 sampled points.
- `npm run dcc:canid -- test`: Generates temporary poses from saved canid Blender sources,
  checks bundled GLB playback within 0.0001 model units, then removes the arrays after success.
  Ordinary browser runs explicitly skip this comparison without `CANID_POSE_RESULTS`.
- `npm run dcc:canid -- verify test-results/canid-edit-proof-01`, followed by
  `CANID_NATIVE_RESULTS=test-results/canid-edit-proof-01 npm run test:browser:native -- --grep="edited shared motion"`:
  Mutates shared motion on disposable sources, exports all three characters, and compares
  their consumer playback against fresh edited and original samples.

## Budgets

- **Vitest**: At most 2 workers. Geometry tests use the project-level budget: 15 seconds locally, 60 seconds when `CI` is set, and 120 seconds in the dedicated asset-build job. The hosted runner measured 495 seconds for the geometry suite versus 155 seconds locally; nine tests exceeded the old 15-second limit. Application tests retain their 5-second default. Unit normals on loaded GLBs are verified across all 29 gallery journeys at 0.0005 tolerance.
- **Browser**: One worker per runner. Test and explicit operation budgets use `browserBudget`: existing local limits and four times those limits when `CI` is set. Default test/assertion limits are 30/5 seconds locally and 120/20 seconds in CI. Cold scene readiness uses `sceneReadyTimeout`, 15 seconds locally and 60 seconds in CI. Per-model export remains 60 seconds locally. Contact sheets use 120 seconds locally. Automatic GitHub smoke checks stop on the first failure; the asset-build functional browser job also stops on the first failure in CI. Full local rendering/export checks remain required.

## Retention and inventory

- Inventory streams hashes and paths from tracked text. Unreferenced files remain protected.
- Automatic cleanup requires explicit receipt-based pruning (`npm run maintenance -- prune --apply`), which re-verifies bytes prior to unlinking.
