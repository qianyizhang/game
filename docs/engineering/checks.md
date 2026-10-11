# Verification contracts

Use exact Node/npm pins via `nvm use` and Python via `uv`. Browser and Blender runs on macOS require approved execution outside the restricted sandbox with disposable profiles.

| Command                            | Scope and evidence provided                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------- |
| `npm run check:maintenance`        | Formatting, lint, types, Python, tools/DCC tests, inventory/link checks, production build     |
| `npm run check`                    | Maintained gate, whole-repo format, app behavior/regressions, simulations (excludes geometry) |
| `npm run check:full`               | Complete check suite including geometry test project                                          |
| `npm run test`                     | Application tests only; `test:watch` uses the same selection                                  |
| `npm run test:geometry`            | Geometry project only (3D animation, deformation and recording regressions)                   |
| `npm run test:browser`             | Browser interactions, persistence, rendering, exported artifact checks                        |
| `npm run test:browser:smoke`       | Four existing game journeys selected by `@smoke` for automatic GitHub CI                      |
| `npm run test:browser:review`      | Opt-in 3D visual contact sheets for human inspection                                          |
| `npm run dcc -- verify`            | Validates artist source, recipe, and published GLB against receipts                           |
| `npm run maintenance -- inventory` | Read-only occurrences, hashes, asset classifications, tracked-text refs                       |
| `npm run maintenance -- prune`     | Check retention eligibility without deleting                                                  |

All maintained source requires enforced check coverage. Passing a slice does not establish whole-repo or aesthetic acceptance. See [testing policy](testing.md) for strategy.

## Gate selection

- **Application & tool code**: Run `npm run check` for game rules, saves, UI, SVG, and tools.
- **Documentation-only work**: Run `npm run format:maintenance` (or focused Prettier and inventory checks). Skip application test suites and simulations.
- **3D / DCC work**: Run `npm run check:full` for changes affecting 3D construction, animation, rendering/export or DCC delivery (`src/art3d`, DCC sources/delivery, or their shared helpers/dependencies). Geometry assertions or configuration affecting their behavior also use this gate. Use `npm run test:geometry -- <file>` for focused iteration.
- **CI**: Runs the non-geometry checks in parallel scopes and `npm run test:browser:smoke`.
  Geometry and full browser rendering/export verification are local completion gates.

GitHub targets **under two minutes of execution**, excluding queue delay. Its four
maintenance scopes run formatting/lint, types/Python, rules/simulations, and tools/DCC
contracts/build independently; inventory and hydration checks run before each scope.
The browser job runs one existing recruitment/play/save-reload journey for Blindside,
Spire, Last Hearth and Emberwake, with one worker and failure artifacts. Jobs have a
five-minute failure ceiling; that ceiling is not the performance target or proof of it.

The 2026-10-11 full hosted run spent **499 seconds** in geometry. Its browser jobs took
**11.6–33.5 minutes**, with a single canid journey taking **4.2 minutes**. Removing geometry
alone cannot meet the target: software-rendered 3D interaction, screenshots and exports
also belong in the local full gate. The user selected this scope on 2026-10-11.

Local full browser runs remain serial and retain every case. Inspect the current selection
with `npm run test:browser -- --list`; counts change when new studies enter the suite.

The `functional` browser project covers all public game journeys and each delivered 3D
asset's loading, motion, phone layout and export. The separate `visual-review` project
generates 29 contact sheets on demand; it does not provide an automated aesthetic verdict.

### Browser prerequisites

`npm run test:browser` selects three explicit projects. Each case belongs to exactly one:

| Project                     | Prerequisite and absence behavior                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `functional`                | Public repository inputs and Chrome; startup failure fails the suite.                                                |
| `requires-blender`          | Fresh Blender-generated samples or edited candidates; missing environment variables skip with a preparation command. |
| `requires-private-evidence` | Authorized local thread exports and retained sculpture evidence; missing exports skip explicitly.                    |

The native cases carry `@requires-blender`; the private group carries
`@requires-private-evidence`. Full local runs skip prerequisite cases explicitly when
their inputs are absent. These skips do not credit native execution or private-history
validation. The last full hosted run at `472a22b` on 2026-10-11 recorded
**144 passed, 8 prerequisite skips**; that is a dated result, not the current suite size.
`--project=functional` selects the
public-only gate. `npm run test:browser:native` and `npm run test:browser:private` select
the conditional groups; neither command silently generates their inputs.

Blender being installed alone is insufficient: the browser needs evidence from a fresh
native run. The producer commands below perform that run and invoke the corresponding
browser case. To supply alternate authorized exports to the private group, set
`TRACE_PRIVATE_INPUT` to their directory; its default is `test-results/trace-visualizer-input`.
Available but invalid inputs fail rather than becoming skips.

Static checks still cover 3D sources. Automatic GitHub smoke checks select four of the
existing functional journeys through a separate `smoke` project; they do not establish
full browser, 3D delivery/export, native or private-evidence verification.
Browser/native gates run locally for affected behavior;
`check:full` does not invoke them. Run the selected completion gate once after the final
change, with one gate owner per checkout to avoid overlapping agent runs. Report the command
used and distinguish application/simulation verification from geometry, browser and native
verification.

## Static-check scope

- **App & tests**: Typed ESLint and strict TypeScript cover `src`, browser/simulation tests, and configs.
- **Tools**: CLI modules, SVG cabinet scripts, and embedded viewer runtimes receive strict typechecks.
- **DCC**: Frontend and delivery CLI use strict TypeScript and ESLint. Python modules use Ruff, strict mypy, and contract tests. Validates GLB budgets, finite normals, joint counts, and pose metadata.

## Native authoring gate

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

- **Vitest**: At most 2 workers. Geometry tests use the project-level budget: 15 seconds locally and 60 seconds when `CI` is set. The hosted runner measured 495 seconds for the geometry suite versus 155 seconds locally; nine tests exceeded the old 15-second limit. Application tests retain their 5-second default. Unit normals on loaded GLBs are verified across all 29 gallery journeys at 0.0005 tolerance. See [test audit](history/test-audit-2026-10-07.md).
- **Browser**: One worker per runner. Test and explicit operation budgets use `browserBudget`: existing local limits and four times those limits when `CI` is set. Default test/assertion limits are 30/5 seconds locally and 120/20 seconds in CI. Cold scene readiness uses `sceneReadyTimeout`, 15 seconds locally and 60 seconds in CI. Per-model export remains 60 seconds locally. Contact sheets use 120 seconds locally. Automatic GitHub smoke checks stop on the first failure; full rendering/export checks run locally.

## Retention and inventory

- Inventory streams hashes and paths from tracked text. Unreferenced files remain protected.
- Automatic cleanup requires explicit receipt-based pruning (`npm run maintenance -- prune --apply`), which re-verifies bytes prior to unlinking.
