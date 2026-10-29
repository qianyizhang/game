# Verification contracts

Use the pinned Node/npm runtime (`nvm use`) and Python through `uv`. One gate owner per checkout; retain failure logs. Passing a focused check does not credit full validation, native execution or visual quality.

| Local command                              | Required scope                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| `npm run format:maintenance`               | Documentation formatting, inventory and links.                                         |
| `npm run check`                            | Maintenance/build, every application test and 37 seeded simulations; no geometry.      |
| `npm run check:full`                       | `check` plus every geometry test; no browser/native execution.                         |
| `npm run test:geometry -- <file>`          | Focused construction/motion iteration.                                                 |
| `npm run test:browser:smoke`               | Six real game journeys, including phone cue/layout regression; limited smoke evidence. |
| `npx playwright test --project=functional` | All public loading, interaction and exported-artifact journeys.                        |
| `npm run test:browser`                     | Functional plus conditional native/private projects.                                   |

## Gate selection

Choose local checks by affected behavior and dependency risk, not change size alone.
Feature changes must reuse or add relevant E2E journeys and pass scoped validation
locally in the authorized development environment before acceptance. Include affected
application, browser, geometry or native checks as appropriate; use the broader
commands above when that scope warrants them. Documentation-only edits require
formatting, inventory and links, not unrelated functional suites. See [testing policy](testing.md).

Regular hosted CI is a selective core/must-pass sanity layer, never the only or
final delivery guard. Run full suites deliberately for releases, major refactors
or broad/uncertain risk, not every tiny change. PR verification evidence retains
affected scope, chosen commands and rationale, exact revision, passed/failed/blocked
coverage and remaining limits. Use the
[shared GitHub guide](https://github.com/qianyizhang/repo-kit/blob/main/user/practices/github.md)
to shape the public brief and link or collapse detailed evidence. Hosted green
cannot replace missing required local E2E evidence.

Keep runtime and security guards intact. If local E2E is barred or prerequisites
are unavailable, report it blocked; require a reviewed, explicitly authorized local
mode where needed. Never spoof CI flags, bypass startup guards or relabel a preview
as the required suite. This strategy does not change existing job selection or
workflow permissions; changes to execution modes require separate review.

Routine CI and full validation have separate triggers. Focused policy regressions and complete rollout matrices remain in the application suite; policy/rules changes retain the affected matrix.

| Trigger                                                                                | Required coverage                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Allowlisted prose/review images on PR/main                                             | Diff whitespace, inventory and local links in hosted CI; local formatting/inventory remains required.                                                                                                                                                                                     |
| Ordinary PR/main source diff                                                           | Safety core: static checks, Python/tool/DCC contracts, build, simulations, shared/focused policy regressions and six smoke journeys. Add affected application files and bounded browser families.                                                                                         |
| Shared/configuration/unknown/deleted source, unresolved imports or missing diff base   | Every application file and the bounded browser set. An unavailable diff base also selects all geometry; this fallback does not select exhaustive rendering or campaigns.                                                                                                                  |
| Constructor dependency or explicit construction-test change                            | Only affected geometry test files plus routine browser delivery. New/deleted constructor sources, unresolved constructor imports, and runtime/lockfile changes conservatively select all geometry. Native assets and saved delivery/viewer changes do not select procedural constructors. |
| Manual Repository checks with `full: true`, or reusable release call with `full: true` | Every application file, geometry and all public functional browser journeys, including all asset deliveries and the continuous campaign.                                                                                                                                                  |

Modules: [safety core](../../.github/workflows/check-core.yml), [application](../../.github/workflows/check-application.yml), [asset checks](../../.github/workflows/asset-build.yml), orchestrated by [Repository checks](../../.github/workflows/maintenance.yml). Selection precedes dispatch so documentation can skip runtime jobs. The aggregate gate requires every selected module to succeed and allows only intentional skips. A reusable release caller must pass `full: true` and depend on this aggregate gate; standalone asset validation is not a release gate. Main pushes use their before-SHA diff; they do not repeat the full browser suite. There is no scheduled exhaustive run.

Hosted documentation fast selection is narrower than the local documentation rule: it accepts only allowlisted prose without executable blocks and raster review evidence in two explicitly classified documentation-only asset directories. Images consumed by the gallery retain normal coverage. It checks changed whitespace, tracked-file inventory and local links without hydrating LFS or installing dependencies. Prettier remains part of local `format:maintenance`; the fast hosted path does not run it. Policy/test contracts, code examples, manifests, unknown paths and unavailable diffs use conservative normal coverage. Mixed changes retain normal selection. The required aggregate gate still verifies the selected documentation job.

Normal mixed-code selection classifies reviewed documentation per file. The potion,
Beyond-construct and Iron Drake review bundles have an explicit non-runtime evidence
allowlist; executable/symlink reports, unknown files and gallery-consumed images remain
conservative. Extending that list requires a consumer audit. A failed docs-only fast
classification still receives full normal application coverage. Changed browser specs
run directly without selecting every suite they cover; source dependencies select the
other families. Game/SVG changes retain offline gallery delivery. Real Studio imports
can still select 3D delivery, and affected policy dependencies retain their rollouts.
The exact mixed PR inputs are retained in the planner regression fixture.

Selection uses Git merge-base diff and the exact checkout SHA. Plan version 4 carries the geometry-file list and complete browser-shard matrix. The parent validates that matrix before dispatch; browser plans reuse it without another planning runner. Empty, geometry-only and standalone calls retain the asset planning/validation fallback. Execution and the aggregate gate reject stale/malformed plans, including omitted or duplicate shards. An empty geometry list runs no construction tests. Plan mode is `documentation`, `scoped`, `application` (conservative application fallback), or `full` (explicit exhaustive validation). There is no GitHub path-filter diff limit. Generated policy bundles need explicit semantic ownership as well as literal import edges.

Normal tool checks include `assets:check` behavior: source pins, saved GLB fingerprints, embedded resources and motion metadata, without executing constructors.

Routine browser execution uses `ci-games` and `ci-assets`. Baked studies receive a lightweight load/parse check with no WebGL rendering or procedural imports. The expensive source/export reconstruction comparison requires `STUDY_REBUILD_PARITY=1`; CI enables it only when geometry tests are selected. Bake acceptance uses that mode explicitly. The first keeps public game interactions, replay/import recovery and bounded loading failures; smoke-tagged journeys run once in the safety core. The second selects the existing Vajra, Hydra and Catalyst delivery journeys. The retained expensive files are declared once in `ci/selection.ts` and shared with Playwright configuration. Game-owned CSS selects its game family without unrelated cross-game journeys. Full mode uses `functional` without these exclusions. All local default test commands retain complete discovery. A routine pass is not full asset acceptance.

```sh
CI_BASE=<exact-base-sha> npm run ci -- plan /tmp/ci-plan.json
npm run ci -- core
CI_PLAN="$(cat /tmp/ci-plan.json)" CI_SHARD=1 npm run ci -- run unit
CI_FULL=1 npm run ci -- plan /tmp/full-plan.json
CI_PLAN="$(cat /tmp/full-plan.json)" CI_SHARD=1 npm run ci -- run browser
ASSET_BUILD_CI=1 npm run check:full
```

Run every shard listed in the selected plan. Empty selections execute nothing. Complete the local browser/native journeys relevant to affected deliveries; this does not require unrelated full-suite coverage. The continuous campaign retains its assertions, control cadence and deadline; its known timeout is unresolved, not a passing or removed check. Browser jobs have a 15-minute routine failure ceiling and 90 minutes in explicit full mode; ceilings are not performance targets. Measure hosted elapsed time separately from queue delays and summed runner time.

### Measured CI evidence (2026-10-27)

| Revision/run                                                                                                   | Result and time                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Historical `97983798`, [40272928660](https://github.com/qianyizhang/game/actions/runs/40272928660)             | Geometry was already excluded. Rules-1 log span 201.9 s: application command 177.1 s, checkout 13.7 s, Node/cache 4.9 s, npm 3.4 s, other 2.8 s. Rules-2 span 193.4 s.                                                                                                                            |
| Before scoped selection `1b587da`, [40480644866](https://github.com/qianyizhang/game/actions/runs/40480644866) | All 9 lean jobs pass; 574 tests across 93 files. Concurrent log window 160.9 s; slowest job 159.8 s (test 138.25 s). Two-minute target **not met**. Overlapping job spans total 753.6 runner-seconds, not elapsed time.                                                                           |
| Same head, [40480645028](https://github.com/qianyizhang/game/actions/runs/40480645028)                         | Geometry 128/28 pass 292.28 s. Browser 59 pass, 1 fails, 180 not run: Cartographer phone horizontal-overflow assertion, not timeout.                                                                                                                                                              |
| Scoped `257d44e`, [40491962820](https://github.com/qianyizhang/game/actions/runs/40491962820)                  | Safety core 6/6 passes 89.1 s; all 574 application and 128 geometry tests pass. Overall 14 jobs pass/4 fail. Public browser 144 pass, 3 fail, 2 fixture skips, 91 not run: Cartographer phone overflow, Night Passage cooldown timing and campaign 960000 ms. Model delivery file takes 49.9 min. |
| Earlier local full gate                                                                                        | Maintenance/build, 574 app tests and 37 simulations pass. Sequential logged span 538.6 s; application 368.55 s. Five smoke journeys pass 36.2 s.                                                                                                                                                  |
| Local public browser                                                                                           | 145 pass, 2 fixture skips, 1 Night Passage campaign timeout, 92 not run. Existing 16-minute per-test deadline fired before 90-minute process ceiling. No clean-main campaign rerun; rendering source unchanged is not proof of baseline reproduction.                                             |

Log spans use timestamped markers, not official step API durations; queue/pre-log time is unknown. Runner differences and changed revisions prevent a controlled speedup claim. The separate policy split measured 119.77 s before/121.78 s after for the full matrix: it improves selectable feedback, not full execution cost. Focused 41 tests took 2.38 s in that worker. In this checkout they passed in 2.57 s (3.23 s process wall); the complete 90-test safety core passed in 13.65 s (14.82 s wall, overlapping maintenance lint). These are local timings, not hosted guarantees.

Final local application selection retained **574 tests across 95 files**, passing in 353.2 seconds process wall time. The reviewed policy patch was applied byte-for-byte; its full matrices, seeds and assertions are unchanged.

Follow-up local checks reproduce the cooldown failure on clean main and PR source; protocol calls consume 3.3 s around a 180 ms hold. Controlled time retains all assertions and passes both scene journeys. Cartographer's wider-font probe overflows 337 px at 320 px; wrapping controls fixes it, and all six smoke journeys pass locally in 46.2 s. A faster campaign-cadence experiment still fails the 16-minute deadline; it is unpromoted, and the original campaign assertions/cadence/budget remain unchanged.

### Browser prerequisites

Browser suites use disposable profiles and a single startup guard. On macOS,
launching the browser outside the restricted sandbox requires approved execution.

Playwright is pinned to 1.64.0. The harness uses the installed stable Chrome channel; CI installs its current release, so Chrome itself is not version-pinned. `functional` selects public inputs; startup failure fails. `requires-blender` and `requires-private-evidence` skip explicitly when their named evidence is absent; available invalid evidence fails. `visual-review` produces 29 contact sheets, not automated aesthetic approval. Static checks/smoke do not establish model delivery or native acceptance.

A local executor can unpack a Google Chrome package into a user-writable directory
and set `CARD_WORKSHOP_CHROME_EXECUTABLE` to its absolute binary path. The startup
guard checks its `Google Chrome` version string, and Playwright workers launch
that same path; unset, the normal `chrome` channel remains in use. The version
string is a compatibility check, not proof of origin. Record the official vendor
download URL, package version and checksum as separate provenance evidence.

Run `npm run test:browser -- --list` to inspect current discovery. Fresh producer commands below supply native evidence; installed Blender alone is insufficient. Private input uses `TRACE_PRIVATE_INPUT`; available authorized exports remain required. Repo Workbench owns Canvas verification in repo-kit, including the historic 1.64.1 pointer diagnostic; game verification remains here.

## Asset construction and delivery inventory

All rebuild families are below; the [28-file geometry list](asset-geometry-tests.txt), [catalogue](../../src/art3d/catalogue.ts), [factory](../../src/art3d/procedural/factory.ts) and [DCC registry](../../packages/dcc-workbench/registry.json) identify concrete assets. Memory/time not measured per family stays unknown.

| Family / command                                                                 | Input → validation/output                                                                                                                            | When / cost                                                                                                                              |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 24 procedural studies + legacy Cub/Stray: `test:geometry`                        | Catalogue/factory → meshes, skinning, motion assertions.                                                                                             | Affected constructor inputs or explicit full validation; 2 workers; full 128 tests 292.28 s hosted/440.03 s local with dedicated budget. |
| Shared animation, surface sculpt and gallery recording: `test:geometry`          | Construction/animation/recording helpers → geometric and recording invariants.                                                                       | Affected shared dependencies or explicit full validation; included above, individual cost unknown.                                       |
| DCC contracts: `test:dcc`, `check:python`                                        | Hydrated masters, receipts and GLBs → hashes, finite normals, joints, pose/pointer/integrity assertions.                                             | Always-on CI + release; no native rebuild; per-family time/RAM unknown.                                                                  |
| SVG: `test:tools`, `assets:export -- <destination>`                              | [SVG sources](../art/svg.md) → validated temporary catalogue/manifest.                                                                               | SVG/tool changes + release; contracts always-on; export time/RAM/size varies, unmeasured.                                                |
| Public browser: `playwright test --project=functional`                           | Delivered assets + Chrome → loading, motion, layout, export/download/roundtrip checks.                                                               | Affected presentation/delivery + comprehensive runs; 1 worker/runner; heavy full jobs 35–90 min and failing as above.                    |
| Saved-source native: `test:dcc:runtime`, `test:dcc:saved`, `test:dcc:native`     | Blender 5.2 masters → fresh samples, edits, exports/parity.                                                                                          | Affected native sources/release; local; per-family time/RAM unknown; unrun here (installed 4.3.2).                                       |
| Canid, fox, boar, raven, otter producers                                         | [Species commands](../../packages/dcc-workbench/README.md#extending-motion-studies-copper-fox) → edit/export proofs.                                 | Corresponding source/release; Blender; cost unknown.                                                                                     |
| Night Passage hero/enemies/guardians/weapons/environments                        | [Native producers](../../packages/dcc-workbench/subjects/night-passage/README.md#reproduce-and-extend) → saved masters, exports and review evidence. | Corresponding source/release; Blender; cost unknown.                                                                                     |
| Conditional/private/visual browser: `test:browser:native`, `:private`, `:review` | Fresh native/private inputs → parity; visual views → contact sheets.                                                                                 | Affected evidence/review; 1 worker; explicit absence skips; cost unknown.                                                                |

Construction outputs (not necessarily deployed meshes): Watcher: 306,112 vertices / 576,812 triangles / 24,051,404 raw bytes; Banner Bearer: 509,409 / 968,512 / 30,390,396; Matron: 269,770 / 515,220 / 17,203,496. Raw attributes/indices are not total RAM. A separate sampled process-family RSS peak 1,107,636,224 bytes double-counts shared pages; allocations are not retained memory. Other costs unknown. Local limits: 4 CPU / 16 GiB, not measured usage or hosted capacity.

Baked gallery deliveries have file fingerprints and motion metadata in `src/art3d/baked/manifest.json`. Native delivered byte/triangle/material counts belong to each [DCC release](../../packages/dcc-workbench/releases.ts)/subject manifest. Larger dedicated budgets did not fix historical 15-second geometry timeouts. Local four-case comparison had 2 failures with 2 workers (44.3 s), all 4 pass serially (56.1 s); fidelity/assertions were preserved.

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
