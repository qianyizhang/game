# Verification contracts

Use the exact Node/npm pins through `nvm use`, and the Python pin through `uv`. Browser and Blender launches on this Mac require approved execution outside the restricted sandbox; browser tests use disposable profiles and a once-per-run startup guard.

| Command                            | Evidence it provides                                                                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check:maintenance`        | Formatting, lint, types, Python and tests for the adopted maintenance scope, inventory/link checks, and production build                       |
| `npm run check`                    | The maintained gate plus whole-repository formatting and all application/geometry behavior and regression checks plus seeded simulation checks |
| `npm run test:browser`             | Browser interaction, persistence, rendering and exported-artifact checks                                                                       |
| `npm run dcc -- verify`            | Current artist source, recipe and published GLB agree with their receipt                                                                       |
| `npm run maintenance -- inventory` | Read-only file occurrences, hashes, source/asset classifications and tracked-text references                                                   |
| `npm run maintenance -- prune`     | Current retention eligibility, without deletion                                                                                                |

The migration inventory is empty; all maintained source has enforced check coverage. Passing the maintained slice alone does not establish a green application or browser suite. Local verification does not establish a remote CI result or aesthetic acceptance. The [testing policy](testing.md) defines which behaviors deserve tests and which surface to use; these command contracts describe execution scope.

## Adopted static-check scope

Typed ESLint covers all of `src`, browser/simulation tests and root TypeScript configuration; root TypeScript checking covers the whole application and browser tests. The maintenance formatter covers these adopted directories. Each simulation writes a fresh uniquely named directory below `test-results`; earlier run bytes remain intact. The root full gate includes simulation checks. JSON enters as unknown data and is narrowed before access; rejected archives remain available for recovery. File import handlers use the existing caught-error import contract and preserve request cancellation/order semantics.

The tools package includes typed trace, SVG export/review/scaffold, comparison, challenge, Hearth agent, experiment and recruitment-inspection commands and their tests. The SVG cabinet script is independently typechecked before embedding. Shared bundling uses declared repository entries and removes only its private temporary directory. Root configuration is checked by the root TypeScript project. Trace and recruitment viewer runtimes are typed modules embedded into self-contained HTML; their source receives static checks and browser coverage.

The DCC package checks its frontend and delivery CLI with typed ESLint and strict TypeScript. All native Python receives Ruff, strict mypy and pure entry-point/contract tests. Native builder smoke tests use an isolated candidate; export reads the saved artist source without resaving it. Fresh receipts pin current code and preserve preceding receipt bytes. GLB budgets, finite values, weights, loops and native pose metadata are checked before publication; browser tests independently compare evaluated Blender poses with Three.js. These checks establish technical compatibility, not aesthetic acceptance.

## Geometry test budgets

Vitest tests use at most two workers. Procedural geometry tests have a 15-second per-case budget; other application tests retain Vitest's five-second default. Retained geometry regressions verify connectivity, closed surfaces, skin weights, fitted motion and loop endpoints. Finite unit normals are inspected in all 29 gallery download journeys on the actual loaded GLB, with the preceding 0.0005 tolerance and a damaged-export negative control. The [test audit](test-audit-2026-10-07.md) records this replacement of the repeated source-construction checks.

The budget follows the 2026-10-07 baseline: Banner Bearer construction alone measured about 5.4 seconds; the default concurrent suite reported eight five-second timeouts. A one-worker rerun passed six of those cases but still measured two Banner Bearer checks at about 5.1 seconds. Browser work overlapped those measurements. These timings justify a bounded geometry budget; they are not browser performance benchmarks. Future regressions require fresh measurements before changing these limits again.

Each model's browser export case owns its 60-second budget, page and evidence directory. It verifies actual GLB contents and applicable source/export deformation comparisons, phone layout, saved-game bytes, return focus and re-entry. A single timeout no longer prevents later models from receiving their checks. The separate review captures and recording cases retain their own assertions.

## Artifact inventory limits

The inventory streams file hashes and retains every occurrence path. Equal bytes identify possible storage duplication; they do not establish which occurrence may be retired. Literal references are gathered from tracked text, so an absent reference leaves material unclassified and protected. Artist sources, source snapshots, backups and accepted evidence require their own explicit retirement authority.

The report records its start/end times and checks each file for changes while reading. It is not an atomic snapshot of running producers. Retain audits in ignored session directories and refresh them after active output finishes. Only the independent receipt-based retention command can identify eligible automatic cleanup; it rechecks exact bytes before deletion.

## CI coverage

The checked-in workflow runs `npm run check` after clean npm/uv installs, then the full `npm run test:browser` suite with the disposable Chrome startup guard. Its 30-minute job budgets accommodate the measured full geometry/export workload; per-test assertions and budgets are unchanged. The workflow has read-only repository permissions and pins its actions by immutable revision.

Private trace cases skip explicitly when their local exports are absent. Public synthetic trace cases remain part of CI. Blender authoring/export/render checks are local native integration evidence, separate from CI. A valid workflow file and passing local gates do not establish a successful remote Actions run or branch-protection configuration.
