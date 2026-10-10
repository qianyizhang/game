# Workshop tools

This private npm workspace owns repository governance, artifact retention and offline build/experiment commands. It runs on Node with explicit filesystem contracts. Governance does not import game rules; experiment commands bundle the relevant game runtime deliberately.

Use `nvm use`, then run root npm commands. `npm run maintenance -- help` lists governance commands:

| Command                                  | Contract                                                                                                                                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run maintenance -- check`           | Reject uncovered source, misplaced documents, broken local documentation links, changed pinned skills and unhydrated native binaries. Includes tracked and non-ignored untracked files; reports `managedSources` and `errors`. |
| `npm run maintenance -- inventory`       | Read-only streamed hashes, occurrence groups and tracked-text references for artifact roots. See [inventory limits](../../docs/engineering/checks.md#retention-and-inventory).                                                 |
| `npm run maintenance -- prune [--apply]` | Dry run by default; apply rechecks exact files in receipt-qualified session/disposable roots. See [retention authority](../../docs/engineering/maintenance.md#retention-and-deletion-authority).                               |

Retain audit JSON in ignored session directories. The root lockfile supplies runtime dependencies; [verification contracts](../../docs/engineering/checks.md) own lint, types, tests and gate coverage. Root npm scripts are the public command entry points.

## Trace bundles

`npm run trace:build -- [input-directory] [new-output-directory] [case-study.json]` builds a private offline evidence viewer. Relative arguments resolve from the repository root. Default output is a fresh `test-results/disposable/trace-visualizer-<UUID>` directory with a closure receipt after a successful build, eligible for the existing 14-day retention. Explicit output remains unclassified and an existing output is refused.

The `trace/` modules validate unknown exports and case specifications, preserve observable record identities and omissions, and associate authored assessments with exact evidence. They execute through the pinned Node runtime with native TypeScript stripping and pass the package strict type/lint gate. `npm run test:trace` selects the trace tests; the package test command also includes them. The browser runtime is separately typechecked and embedded in each offline bundle. Revision-pinned document references preserve original Git bytes through documentation moves. See the [trace guide](../../docs/engineering/trace-visualizer.md) for schema, privacy, output and provenance boundaries.

## SVG tools

`npm run assets:export -- [new-output]` creates a fresh cabinet (default: `test-results/card-art-<UUID>`). It bundles the maintained React catalogue, emits self-contained SVGs and a manifest, and embeds the separately checked cabinet runtime. `npm run assets:review -- id ... --from export --out new-review [--before baseline] [--sharp-module absolute-path]` decodes the inputs with an existing Sharp installation. `--from` and `--out` are required; no renderer is installed automatically. Input asset symlinks may not escape the export directory. The review's pixel comparison is not aesthetic approval.

`npm run assets:scaffold -- NameArt path/NameArt.tsx [card|plate|symbol]` creates a formatted empty drawing scaffold. It refuses an existing file, a path outside the repository, or a symlinked destination parent. Registration remains explicit.

Relative CLI paths resolve from the repository root; explicit absolute export/review paths are supported. Output directories are created exclusively, and interrupted runs remain available for inspection. Only private, uniquely created runtime bundles are removed automatically. Root npm commands invoke these implementations directly; old `scripts/` compatibility paths have been removed. These commands do not rewrite artist sources or an existing export directory. Vite, React, TypeScript and Prettier come from the root lockfile; Sharp remains an explicitly supplied optional adapter.

## Art trial accounting

`node packages/workshop-tools/art/trial.ts --help` exposes `init`, `record`, `credits`, `status` and `handoff` for append-only trial receipts. The [bounded delegation protocol](../../docs/art/delegation.md#ledger-cli-and-handoffs) owns event fields, cumulative pilot limits, usage coverage and handoff rules. Paths resolve from the repository; initialization requires a new directory under an existing parent, verifies baseline manifest bytes and refuses overwrite. Recording verifies candidate manifest bytes and links receipt hashes. Status is read-only and exits 2 when dispatch is held; invalid data exits 1. Handoffs fail when held. Late evidence remains recordable. This is a dispatch checkpoint, not a scheduler or authenticated billing meter. Synthetic boundary and filesystem tests run in the existing `art/*.test.ts` scope.

`node packages/workshop-tools/art/trial.ts credits DIR WORKING_THREAD_UUID` collects cumulative usage from the ledger's original start and appends a pinned report/event. `node packages/workshop-tools/art/credits.ts --root THREAD_UUID --since ISO --out NEW.json` produces a read-only standalone report; `--through ISO` fixes a cutoff and `--sessions-root DIR` selects a log root. Default discovery uses Codex's local sessions and existing archive. Both commands are offline and use `art/credit-rates.json`; unknown rates/counters or incomplete coverage fail closed with explicit gaps. Reports contain usage and provenance, never message bodies. They normalize Standard credits rather than predicting bills, and distinguish a fresh scan from the last metered response. See the protocol's [accounting contract and limitations](../../docs/art/delegation.md#cost-tracking-and-rate-cards).

## Headless comparison and challenge commands

`npm run playtest:compare -- baseline.json candidate.json` validates comparison fields, pairs full runs by game/seed/mode/source/context/setup, and reports both content pins with candidate-minus-baseline metric differences. Missing, duplicate, partial and active runs stay excluded. Nonnumeric metrics and malformed evidence are rejected; this is not a general balance or playing-strength verdict.

`npm run engine:challenges -- [new-output]` bundles the typed challenge solver and writes a new report plus verified solution archives. Relative paths resolve from the repository; the default output has a unique name below `test-results`. Existing directories are refused. Solving known seeded positions does not measure hidden-information strength.

## Hearth agent commands

`npm run engine:hearth -- [seed] [new-output]` and `node packages/workshop-tools/hearth/arena-agent.ts [seed] [new-output] [seat 0–7] [hidden|disclosed]` run the checked `hearth/` package modules. Their JSONL stdout contains policy-safe frames and replies; evaluator replays and verification receipts stay in the separate output directory. Relative outputs resolve from the repository, independent of working directory. Defaults use fresh UUID directories under `test-results/agents`; existing outputs fail before session startup.

Envelope validation covers object shape, request IDs and the 64 KiB bound. Step/action inputs stay unknown until the game adapter rejects or matches them against the current legal frame. The adapters' seeded rules and accepted-command journals are unchanged. Arena controllers stay bound to one seat; automatic rivals and round advancement remain journaled. Protocol integration tests complete both games, assert hidden fields remain absent, reject malformed/stale requests and verify the evaluator replay independently.

## Frozen Hearth experiments and inspector

`hearth/experiment.ts` owns the single-seat plan, `arena-experiment.ts` and `arena-audit.ts` own the arena plan and reconstruction, and the `recruitment-*` modules own the bounded worker harness and inspector. All resolve inputs, output arguments and Git provenance from the repository root. Existing output and audit receipts are refused; failed partial runs remain available for inspection.

Plans, reserved seed sets and v5/v1 replay semantics remain frozen. New runs pin the current implementation paths and exact headless dependency graph; historical reports keep their original paths and hashes. Recruitment audit requires the recorded bundle, source hashes and exact case grid, then reconstructs decisions, controller bindings, diagnostics, metrics, placement, lifecycle and comparison totals. Restore the recorded checkout when auditing an older environment; do not edit its receipts to match a newer one. Worker results are validated against their assigned case, and early exits reject the pool instead of leaving it waiting indefinitely.

`node packages/workshop-tools/hearth/recruitment-inspect.ts replay.json receipt.json new.html` validates the replay/receipt hash and case, reconstructs evaluator-only observations, and embeds a separately checked viewer runtime. The output works offline. Alternative proposals inspect the same position; they neither simulate future turns nor estimate playing strength. Downloaded prefixes require the frozen arena-v1/Hearth-v5 environment; the current game rejects them.

## Session review frontend

Trace adapters and artifact collection stay in `trace/`; the [session-review workspace](../session-review/README.md) owns the shared React/Vite frontend. Both authored offline bundles and raw local sessions use its explicit delivery contract and HTML builder.

## Offline Codex usage

`npm run usage:dashboard -- --serve` opens a standalone local usage dashboard from Codex session logs. It supports dates, model/project/effort filters, trends, activity, reasoning/output analytics, sortable sessions with row-click evidence, persistent incremental indexing, current official API-equivalent pricing with editable overrides and filtered CSV export. Omit `--serve` for a self-contained offline report. `npm run test:usage` verifies accounting and local refresh; its tests also join this workspace gate. See the [usage dashboard guide](../../docs/engineering/usage-dashboard.md) for source discovery, coverage and privacy boundaries.

Default usage output is `test-results/disposable/usage-dashboard-<UUID>`, closed with a byte-hashed receipt after a successful build. Serving marks it open; graceful shutdown rehashes refreshed files and starts the 14-day retention. Ctrl-C and SIGTERM close the CLI server gracefully. Interrupted or changed outputs stay protected. `--out` selects an unclassified output outside automatic closure. Pin a default receipt before expiry or choose explicit output for lasting evidence.
