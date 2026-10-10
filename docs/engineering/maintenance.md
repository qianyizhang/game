# Maintenance governance

Every maintained source must enter an enforced check scope. The inventory gate rejects uncovered files and documentation outside canonical homes; it has no migration exemptions. [Migration and cleanup history](cleanup-triage.md) records the completed 2026-10-07 work and original-source recovery.

## Check scope and finish line

Use [verification contracts](checks.md) for gate coverage, CI, browser/native execution and geometry budgets. Run `npm run check:maintenance` for maintained tooling and static checks; `npm run check` also runs application tests and seeded simulations. Geometry is opt-in through `npm run check:full` for the [affected areas](checks.md#gate-selection). Report those scopes separately. Technical checks do not establish aesthetic acceptance.

Use `nvm install && nvm use`, hydrate native binaries with `git lfs install --local` and `git lfs pull`, then run `npm ci` and `uv sync --locked`. Runtime versions come from [`.node-version`](../../.node-version), [`.python-version`](../../.python-version) and [`package.json`](../../package.json); dependency versions come from the lockfiles. Git LFS follows the [native storage decision](decisions/0004-native-asset-storage.md); the inventory check names unhydrated binaries before delivery validation.

Upgrade TypeScript and typed ESLint together when peer support and repository checks agree. Native scripts retain Python 3.11 syntax for Blender 4.5; standalone checks use the pinned Python runtime. Four Blender-stub assignment exceptions cover Workbench/Cycles engine enums and sRGB/Non-Color color-space names. Native rendering and isolated construction exercise these calls; there is no blanket missing-import or untyped-file suppression.

## Source ownership

- The application owns rules, content, sessions and presentation. Game rules remain browser-independent and seeded.
- `@card-workshop/session-review` owns session and curated evidence presentation, shared by offline exports and local review.
- `@card-workshop/tools` owns maintenance commands. Future script families move into this workspace with documented inputs, outputs, dependencies and meaningful tests.
- `@card-workshop/dcc-workbench` owns Blender authoring and asset delivery. Its editable artist source is independent of rebuild recipes.
- Moves and new files must enter the owning checker scopes in the same change.
- Preserve concurrent changes. Record starting status and source hashes, edit only the slice, and report the owned delta. Do not reset or broadly stage the worktree.
- A move or formatting change can change experiment source pins and asset receipts. Preserve historical reports, hashes, rules versions and frozen environments. Validate new outputs as new results; never rewrite old evidence to match current code.

## Documentation homes

`docs/README.md` is the entry point. `guide/` owns current user behavior; `engineering/` owns architecture, maintenance and decisions; `art/` owns visual standards and asset records; `research/` owns mechanics, experiment protocols and findings. Package READMEs own their commands and integration contracts.

Original paths and hashes are preserved in the [document migration record](../../maintenance/document-migration.json); [cleanup history](cleanup-triage.md#source-recovery) explains recovery. New top-level review or completion documents fail the gate. Consolidate duplicate descriptions, then update inbound links in the same slice. Keep one authoritative rulebook. Durable documents describe current contracts or explicitly dated research, not a transcript of work.

Before removing a script, inspect imports, npm commands, CI, documentation and frozen reproduction callers. Retain a historical source pin at its recorded revision. Before removing a dated report, preserve its lasting conclusions and an exact Git recovery reference. Update callers and verify the affected behavior in the same change.

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
- Per completed session: promote lasting conclusions, resolve or hand off open work, then explicitly close temporary notes. Close a completed handoff only after its durable promotion is committed and its retained files are hashed.
