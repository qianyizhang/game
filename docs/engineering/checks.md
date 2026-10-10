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
| `npm run test:browser:review`      | Opt-in 3D visual contact sheets for human inspection                                          |
| `npm run dcc -- verify`            | Validates artist source, recipe, and published GLB against receipts                           |
| `npm run maintenance -- inventory` | Read-only occurrences, hashes, asset classifications, tracked-text refs                       |
| `npm run maintenance -- prune`     | Check retention eligibility without deleting                                                  |

All maintained source requires enforced check coverage. Passing a slice does not establish whole-repo or aesthetic acceptance. See [testing policy](testing.md) for strategy.

## Gate selection

- **Application & tool code**: Run `npm run check` for game rules, saves, UI, SVG, and tools.
- **Documentation-only work**: Run `npm run format:maintenance` (or focused Prettier and inventory checks). Skip application test suites and simulations.
- **3D / DCC work**: Run `npm run check:full` for changes affecting 3D construction, animation, rendering/export or DCC delivery (`src/art3d`, DCC sources/delivery, or their shared helpers/dependencies). Geometry assertions or configuration affecting their behavior also use this gate. Use `npm run test:geometry -- <file>` for focused iteration.
- **CI**: Always executes `npm run check:full` and `npm run test:browser`.

The two CI jobs run independently and both must pass. Hosted browser runs stop at the
first failed case so its diagnostics and artifacts survive before similar journeys repeat
the fault; successful runs execute the full selected suite.

The `functional` browser project covers all public game journeys and each delivered 3D
asset's loading, motion, phone layout and export. The separate `visual-review` project
generates 29 contact sheets on demand; it does not provide an automated aesthetic verdict.

Static checks still cover 3D sources. Browser/native gates run separately for affected behavior;
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

## Budgets

- **Vitest**: At most 2 workers. Geometry tests use the project-level budget: 15 seconds locally and 60 seconds when `CI` is set. The hosted runner measured 495 seconds for the geometry suite versus 155 seconds locally; nine tests exceeded the old 15-second limit. Application tests retain their 5-second default. Unit normals on loaded GLBs are verified across all 29 gallery journeys at 0.0005 tolerance. See [test audit](history/test-audit-2026-10-07.md).
- **Browser**: One worker. Test and explicit operation budgets use `browserBudget`: existing local limits and four times those limits in CI. Default test/assertion limits are 30/5 seconds locally and 120/20 seconds in CI. Per-model export remains 60 seconds locally and 240 seconds in CI. Contact sheets use 120 seconds locally. The hosted graphics trace showed slow loading, readback and pointer updates; these budgets preserve the same assertions. The browser CI job has a 45-minute limit and stops on its first failure.

## Retention and inventory

- Inventory streams hashes and paths from tracked text. Unreferenced files remain protected.
- Automatic cleanup requires explicit receipt-based pruning (`npm run maintenance -- prune --apply`), which re-verifies bytes prior to unlinking.
