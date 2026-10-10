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
| `npm run dcc -- verify`            | Validates artist source, recipe, and published GLB against receipts                           |
| `npm run maintenance -- inventory` | Read-only occurrences, hashes, asset classifications, tracked-text refs                       |
| `npm run maintenance -- prune`     | Check retention eligibility without deleting                                                  |

All maintained source requires enforced check coverage. Passing a slice does not establish whole-repo or aesthetic acceptance. See [testing policy](testing.md) for strategy.

## Gate selection

- **Ordinary work**: Run `npm run check` for game rules, saves, UI, SVG, docs, and tools.
- **3D / DCC work**: Run `npm run check:full` for changes affecting 3D construction, animation, rendering/export or DCC delivery (`src/art3d`, DCC sources/delivery, or their shared helpers/dependencies). Geometry assertions or configuration affecting their behavior also use this gate. Documentation-only edits use the default. Use `npm run test:geometry -- <file>` for focused iteration.
- **CI**: Always executes `npm run check:full` and `npm run test:browser`.

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

## Budgets

- **Vitest**: At most 2 workers. Geometry tests have a 15-second budget; application tests have a 5-second default. Unit normals on loaded GLBs are verified across all 29 gallery journeys at 0.0005 tolerance. See [test audit](test-audit-2026-10-07.md).
- **Browser export**: 60-second budget per model for motion, GLB content, phone layout, and save isolation.

## Retention and inventory

- Inventory streams hashes and paths from tracked text. Unreferenced files remain protected.
- Automatic cleanup requires explicit receipt-based pruning (`npm run maintenance -- prune --apply`), which re-verifies bytes prior to unlinking.
