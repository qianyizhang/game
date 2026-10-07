# Workshop tools

This private npm workspace owns repository governance, artifact retention and offline build/experiment commands. It runs on Node with explicit filesystem contracts. Governance does not import game rules; experiment commands bundle the relevant game runtime deliberately.

Use the pinned runtime with `nvm use` (or install it with `nvm install`), then run from the repository root:

```sh
npm run maintenance -- check
npm run maintenance -- inventory
npm run maintenance -- prune
npm run maintenance -- prune --apply
npm run check:maintenance
```

`check` validates the source/document migration inventory and local links in maintained documentation. It includes Git-tracked and non-ignored untracked files. New source must enter a checker scope rather than the backlog.

`inventory` streams SHA-256 hashes for `test-results/`, `dcc-backups/` and the DCC artist-source directory. It reports every occurrence, equal-byte groups, source/asset protection and literal references found in tracked text. Symlinks are reported without following them; files that change while being read receive no stable hash. This is an observation of local files, not a deletion plan: equal bytes, age and missing references never authorize retirement. Backups and session notes outside these roots remain protected. Redirect the JSON to an ignored session directory when retaining an audit.

`prune` defaults to a dry run. It inspects direct children of `test-results/disposable/` and `.work/sessions/`. Only explicitly closed, unpinned, unchanged entries can expire. It never deletes tracked files, follows symlinks, scans artist backups for deletion, or deletes generic `test-results/` history. Invalid entries remain protected in the report. `--apply` revalidates the plan and removes exact files; it does not recursively remove an unchecked directory.

The DCC native render command is the first producer of closed disposable outputs. Other producers must adopt the same receipt contract deliberately. Session closure requires promotion targets. [Governance](../../docs/engineering/maintenance.md) is the authority for lifetimes and workflow.

The package is checked with typed ESLint, TypeScript `checkJs` in strict mode, and Node tests covering destructive boundaries. Runtime dependencies are supplied by the pinned root workspace lockfile. Root npm scripts remain the public entry points as more script families migrate here.

## Trace bundles

`npm run trace:build -- [input-directory] [new-output-directory] [case-study.json]` builds a private offline evidence viewer. Relative arguments resolve from the repository root. A default invocation chooses a fresh ignored output directory; an explicit existing output is refused. The old `scripts/trace-visualizer/build.mjs` command delegates to the same checked implementation.

The `trace/` modules validate unknown exports and case specifications, preserve observable record identities and omissions, and associate authored assessments with exact evidence. They execute through the pinned Node runtime with native TypeScript stripping and pass the package strict type/lint gate. `npm run test:trace` selects the trace tests; the package test command also includes them. The browser runtime is separately typechecked and embedded in each offline bundle. Revision-pinned document references preserve original Git bytes through documentation moves. See the [trace guide](../../docs/engineering/trace-visualizer.md) for schema, privacy, output and provenance boundaries.

## SVG tools

`npm run assets:export -- [new-output]` creates a fresh cabinet (default: `test-results/card-art-<UUID>`). It bundles the maintained React catalogue, emits self-contained SVGs and a manifest, and embeds the separately checked cabinet runtime. `npm run assets:review -- id ... --from export --out new-review [--before baseline] [--sharp-module absolute-path]` decodes the inputs with an existing Sharp installation. `--from` and `--out` are required; no renderer is installed automatically. Input asset symlinks may not escape the export directory. The review's pixel comparison is not aesthetic approval.

`npm run assets:scaffold -- NameArt path/NameArt.tsx [card|plate|symbol]` creates a formatted empty drawing scaffold. It refuses an existing file, a path outside the repository, or a symlinked destination parent. Registration remains explicit.

Relative CLI paths resolve from the repository root; explicit absolute export/review paths are supported. Output directories are created exclusively, and interrupted runs remain available for inspection. Only private, uniquely created runtime bundles are removed automatically. Compatibility scripts delegate to this package. These commands do not rewrite artist sources or an existing export directory. Vite, React, TypeScript and Prettier come from the root lockfile; Sharp remains an explicitly supplied optional adapter.

## Headless comparison and challenge commands

`npm run playtest:compare -- baseline.json candidate.json` validates comparison fields, pairs full runs by game/seed/mode/source/context/setup, and reports both content pins with candidate-minus-baseline metric differences. Missing, duplicate, partial and active runs stay excluded. Nonnumeric metrics and malformed evidence are rejected; this is not a general balance or playing-strength verdict.

`npm run engine:challenges -- [new-output]` bundles the typed challenge solver and writes a new report plus verified solution archives. Relative paths resolve from the repository; the default output has a unique name below `test-results`. Existing directories are refused. Solving known seeded positions does not measure hidden-information strength.

## Hearth agent commands

`npm run engine:hearth -- [seed] [new-output]` and `node scripts/hearth-arena-agent.mjs [seed] [new-output] [seat 0–7] [hidden|disclosed]` delegate to the checked `hearth/` package modules. Their JSONL stdout contains policy-safe frames and replies; evaluator replays and verification receipts stay in the separate output directory. Relative outputs resolve from the repository, independent of working directory. Defaults use fresh UUID directories under `test-results/agents`; existing outputs fail before session startup.

Envelope validation covers object shape, request IDs and the 64 KiB bound. Step/action inputs stay unknown until the game adapter rejects or matches them against the current legal frame. The adapters' seeded rules and accepted-command journals are unchanged. Arena controllers stay bound to one seat; automatic rivals and round advancement remain journaled. Protocol integration tests complete both games, assert hidden fields remain absent, reject malformed/stale requests and verify the evaluator replay independently. The historical runtime import path remains a checked delegate for experiment consumers awaiting migration.

## Frozen Hearth experiments and inspector

The legacy `scripts/hearth-*.mjs` paths are checked delegates. `hearth/experiment.ts` owns the single-seat plan, `arena-experiment.ts` and `arena-audit.ts` own the arena plan and reconstruction, and the `recruitment-*` modules own the bounded worker harness and inspector. All resolve inputs, output arguments and Git provenance from the repository root. Existing output and audit receipts are refused; failed partial runs remain available for inspection.

Plans, reserved seed sets and v5/v1 replay semantics remain frozen. New runs pin the current implementation paths and exact headless dependency graph; historical reports keep their original paths and hashes. Recruitment audit requires the recorded bundle, source hashes and exact case grid, then reconstructs decisions, controller bindings, diagnostics, metrics, placement, lifecycle and comparison totals. Restore the recorded checkout when auditing an older environment; do not edit its receipts to match a newer one. Worker results are validated against their assigned case, and early exits reject the pool instead of leaving it waiting indefinitely.

`node scripts/hearth-recruitment-inspect.mjs replay.json receipt.json new.html` validates the replay/receipt hash and case, reconstructs evaluator-only observations, and embeds a separately checked viewer runtime. The output works offline. Alternative proposals inspect the same position; they neither simulate future turns nor estimate playing strength. Downloaded prefixes require the frozen arena-v1/Hearth-v5 environment; the current game rejects them.
