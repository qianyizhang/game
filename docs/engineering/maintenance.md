# Maintenance governance

The maintenance direction was accepted on 2026-10-07. The source and documentation migration has adopted the original backlog; final artifact and clean-checkout closeout remains tracked in the protected handoff. New maintained source must have enforced checks. The [migration inventory](../../maintenance/migration.json) is empty; new work must enter enforced scopes rather than extend a directory-wide exemption.

## Check scope and finish line

`npm run check:maintenance` enforces formatting for the new homes and tools, typed ESLint and strict JavaScript/TypeScript checking for the tools package, DCC frontend and delivery CLI, and all application, geometry and experiment sources under `src`, browser/simulation tests and root TypeScript configuration, Ruff and strict mypy for all DCC native Python and contract/tests, tooling/trace/DCC tests, inventory and local document links, root TypeScript checking and a production build. The GitHub maintenance workflow also runs the DCC and shell browser cases.

`npm run check` adds whole-repository formatting and the full existing application/geometry unit suite and seeded simulation checks. A green maintenance slice does not establish a green application suite or aesthetic acceptance. The two gates retain distinct scopes; full migration closeout also requires browser/native evidence and clean-checkout validation.

All eight Python files under `packages/dcc-workbench/blender` are checked. Native scripts retain Python 3.11 syntax for Blender 4.5 while the standalone checker uses pinned Python 3.12. Generated stubs need four documented assignment exceptions: Workbench and Cycles engine enums, and the sRGB and Non-Color image color-space names. Native rendering and isolated construction exercise these calls. There is no blanket missing-import or untyped-file suppression.

The supported stack is **Node 24.21.0 LTS, npm 11.19.0, Python 3.12.13 and TypeScript 6.0.3**. Node/npm engines are enforced; `.node-version` and `.nvmrc` agree. Use `nvm install && nvm use`, `npm ci`, then `uv sync --locked`. The existing Blender 4.5 authoring runtime remains separate; its scripts retain compatibility with its embedded Python.

TypeScript 7.0.2 is upstream stable, but `typescript-eslint@8.71.1` supports versions below 6.1. TypeScript 6.0.3 is the newest compatible stable patch and is pinned alongside typed ESLint. Upgrade this pair only when peer support and repository checks agree. Do not use preview compilers, force peer dependencies, or create separate compiler versions for lint and build.

## Source ownership and migration

- The application owns rules, content, sessions and presentation. Game rules remain browser-independent and seeded.
- `@card-workshop/tools` owns maintenance commands. Future script families move into this workspace with documented inputs, outputs, dependencies and meaningful tests.
- `@card-workshop/dcc-workbench` owns Blender authoring and asset delivery. Its editable artist source is independent of rebuild recipes.
- Each migration removes its exact paths from the backlog and adds executable check coverage. New files outside covered scopes fail the inventory gate. Expanding the backlog is a policy change requiring a stated reason in review.
- Preserve concurrent changes. Record starting status and source hashes, edit only the slice, and report the owned delta. Do not reset or broadly stage the worktree.
- A move or formatting change can change experiment source pins and asset receipts. Preserve historical reports, hashes, rules versions and frozen environments. Validate new outputs as new results; never rewrite old evidence to match current code.

## Documentation homes

`docs/README.md` is the entry point. `guide/` owns current user behavior; `engineering/` owns architecture, maintenance and decisions; `art/` owns visual standards and asset records; `research/` owns mechanics, experiment protocols and findings. Package READMEs own their commands and integration contracts.

Original paths and hashes are preserved in the [documentation migration record](documentation-migration.md). New top-level review or completion documents fail the gate. Consolidate duplicate descriptions, then update inbound links in the same slice. Keep one authoritative rulebook. Durable documents describe current contracts or explicitly dated research, not a transcript of work.

## Retention and deletion authority

`npm run maintenance -- inventory` reports streamed content hashes, every occurrence path and tracked-text references for the artifact roots. It does not grant deletion authority. [Verification contracts](checks.md#artifact-inventory-limits) describe its consistency and reference limits.

| Material                                                                     | Home                                                           | Lifetime                                        |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------- |
| Active discussions and handoffs                                              | `.work/sessions/<session>/`                                    | Protected while open or pinned                  |
| Closed session notes                                                         | Same, with valid closure receipt and tracked promotion targets | 30 days after closure                           |
| Reproducible disposable renders and test output                              | `test-results/disposable/<run>/`                               | 14 days after closure                           |
| Artist sources, backups, accepted evidence, experiments and frozen snapshots | Existing source/evidence homes                                 | Protected; explicit migration decision required |

`npm run maintenance -- prune` is read-only. `npm run maintenance -- prune --apply` automatically deletes only eligible entries in the first two opt-in roots. The monthly local maintenance automation runs tests and governance checks first, then uses this same command. No files are eligible merely because they are old or ignored by Git.

Each candidate has a versioned `.retention.json` with `kind`, `state`, `pinned`, UTC `closedAt` and SHA-256 `files`. Sessions also name Git-tracked durable `promotedTo` documents. Open, unclassified, pinned, changed, source-containing, tracked or symlinked entries are retained. Apply rechecks the planned bytes and removes only the enumerated files. New arrivals stop directory removal. Root-level `test-results/` evidence and `dcc-backups/` are outside automatic deletion authority.

The DCC review renderer writes four PNGs into a fresh run directory and closes it only after all four succeed. Interrupted runs remain unclassified and protected. Pin a needed review by setting its receipt's `pinned` to true before expiry; retain a separately identified durable evidence set before linking it as lasting proof.

## Maintenance cadence

- Per change: run the relevant maintained gate, expand coverage with the code, and update the authoritative documentation.
- Weekly: review dependency-update PRs. npm and GitHub Actions are configured; review Python pins and regenerate `uv.lock` deliberately.
- Monthly: execute the guarded local cleanup. Notify on actual deletion, failed checks or required user decisions; stay quiet when nothing is actionable.
- Per completed session: promote lasting conclusions, resolve or hand off open work, then explicitly close temporary notes. The current migration handoff stays open until the sweep is finished.

CI uses the same exact Node/Python version files as local checks; tools are pinned in npm and uv locks. Native Blender remains an authoring dependency, not a frontend-build dependency. Local browser and Blender launches follow the macOS execution rules in `AGENTS.md`.
