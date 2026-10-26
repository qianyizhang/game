# Workshop tools

This private npm workspace owns repository governance, artifact retention and offline build/experiment commands. It runs on Node with explicit filesystem contracts. Governance does not import game rules; experiment commands bundle the relevant game runtime deliberately.

`runtime-bundle.ts` shares runtime build configuration and dependency-graph pinning.
Callers own temporary directories, typed imports, worker lifetimes, retained outputs
and cleanup. Source pins hash files after building; they are not an atomic snapshot
of concurrent edits. Night Passage and Hearth recruitment pins include this shared module.

Use `nvm use`, then run root npm commands. `npm run maintenance -- help` lists governance commands:

| Command                                  | Contract                                                                                                                                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run maintenance -- check`           | Reject uncovered source, misplaced documents, broken local documentation links, changed pinned skills and unhydrated native binaries. Includes tracked and non-ignored untracked files; reports `managedSources` and `errors`. |
| `npm run maintenance -- inventory`       | Read-only streamed hashes, occurrence groups and tracked-text references for artifact roots. See [inventory limits](../../docs/engineering/checks.md#retention-and-inventory).                                                 |
| `npm run maintenance -- files`           | Rank committed Git blobs by bytes and physical lines, identify LFS payloads and large duplicate blobs, and suggest purpose-aware reviews. See the audit contract below.                                                        |
| `npm run maintenance -- prune [--apply]` | Dry run by default; apply rechecks exact files in receipt-qualified session/disposable roots. See [retention authority](../../docs/engineering/maintenance.md#retention-and-deletion-authority).                               |

Retain audit JSON in ignored session directories. The root lockfile supplies runtime dependencies; [verification contracts](../../docs/engineering/checks.md) own lint, types, tests and gate coverage. Root npm scripts are the public command entry points.

`npm run assets:gallery -- <fresh-output-directory>` generates the independent
[game asset review gallery](../../docs/art/asset-enrichment.md). The single offline HTML
contains only named asset captures, inline SVG/CSS and independently expandable reviews;
it ships no JavaScript. Its visible Latest changes section and companion `CHANGELOG.json`
come from the preserved dated source history. This command never publishes the gallery.

## Committed-file size audit

`npm run maintenance -- files` prints Markdown rankings for the largest blobs and most physical lines, plus review suggestions. Defaults: `--ref HEAD --top 20 --min-bytes 262144 --min-lines 1000`. Lines at least 2,000 bytes also receive a signal, so one-line JSON cannot hide behind a low line count. `--json` returns the complete inventory; `--top` limits only Markdown sections. For clean JSON redirection use `npm run --silent maintenance -- files --json > .work/sessions/<session>/files.json` after creating the session directory.

The command resolves a commit once, enumerates its tree with NUL-delimited paths, and streams unique blobs through Git. Staged edits, deleted worktree files, untracked outputs and LFS hydration do not change the result. Binary files and invalid UTF-8 have no line count; physical lines include blanks and an unterminated last line. These are not semantic code LOC. LFS pointer bytes contribute to Git totals; declared payload bytes are reported separately. Submodules are listed without traversing them. This audits one tree, not historical repository growth, compressed pack size or network transfer.

Valid JSON up to 8 MiB includes a compact-size estimate and its three largest top-level fields to help locate bulk arrays. Parsing/re-encoding is diagnostic only; it is not a byte-preserving rewrite recipe. Larger or invalid JSON still receives exact byte and line metrics. Duplicate groups use identical Git blob IDs at the byte threshold and count repeated path bytes, not proven reclaimable storage.

Size flags prompt review; they do not prove complexity or obsolescence. Role hints come from paths. Inspect actual callers, producers and recovery before deciding:

- **Split** source at cohesive responsibilities or separate small metadata from bulk samples. Splitting alone does not reduce total bytes.
- **Simplify** repeated logic or future generated diagnostics after verifying the consumer contract. Preserve existing evidence hashes.
- **Remove** only confirmed obsolete outputs with verified recovery and updated callers; this tool never deletes files or rewrites history.
- **Keep** dependency lockfiles, editable artist sources and frozen evidence unless their owning contract changes. Review storage separately for large binaries and immutable sample data.

The snapshot review in [committed-file review](../../docs/engineering/committed-file-review.md) records the first measured candidates and caller checks. This module and its integration tests join the existing tools lint/type/inventory gate and `test:tools`.

## Session evidence

The optional [Repo Workbench plugin](../../docs/engineering/repo-workbench.md) owns session reading, visualization and usage accounting. `trace/case-study.json` retains this project's authored sculpture case and collection conventions.

## Art scaffolding and SVG tools

`npm run assets:export -- [new-output]` creates a fresh cabinet (default: `test-results/card-art-<UUID>`). It bundles the maintained React catalogue, emits self-contained SVGs and a manifest, and embeds the separately checked cabinet runtime. `npm run assets:review -- id ... --from export --out new-review [--before baseline] [--sharp-module absolute-path]` decodes the inputs with an existing Sharp installation. `--from` and `--out` are required; no renderer is installed automatically. Input asset symlinks may not escape the export directory. The review's pixel comparison is not aesthetic approval.

`npm run assets:scaffold -- NameArt path/NameArt.tsx [card|plate|symbol]` creates a formatted empty drawing scaffold. It refuses an existing file, a path outside the repository, or a symlinked destination parent. Registration remains explicit.

`npm run assets:scaffold -- study otter .work/sessions/otter-study` creates a fresh native-study packet: `brief.md`, `study.ts.template` and `handoff.md`. It refuses existing directories, root escapes and symlinked parents. The [native modeling playbook](../../skills/card-art/references/native-modeling.md) owns the saved-source workflow and review requirements. The template supplies only a baked `MotionStudy` consumer adapter; the owner chooses anatomy, controls, support checks and clip count, creates the native assets and explicitly registers the study. It launches no Blender process and does not modify an existing asset.

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

## Night Passage agent commands

`npm run --silent engine:night-passage -- serve` runs an isolated JSONL chronicle
on stdin/stdout. `play` exports one episode; `benchmark` evaluates a fixed
training or held-out suite. Both default to standard constrained controls; `--control exact`
selects the original baseline. `evaluate --split development|evaluation --pool N --seeds N`
runs the policy/difficulty grid; `--controls yes` adds balanced Light/Heavy and a
separate exact-baseline diagnostic. `--witnesses yes` writes standard-control winning
paths and their byte hashes. Evaluation reports pin source/tool/bundle hashes and
retain compiled bytes beside the output. `--out` writes a report and `play --replay` writes a
portable chronicle. Paths resolve from the current working directory; explicit
outputs overwrite existing files. Keep regenerable reports and replays under
ignored `test-results/`.

The `night-passage/` modules bundle the game's public agent interface into a
temporary runtime, pin source and bundle hashes, and remove that runtime on exit.
The [agent guide](../../docs/engineering/night-passage-agent.md) owns requests,
scoring, baseline configuration and benchmark interpretation. The package test
command covers the real JSONL process; lint, types and inventory cover these modules.

## Frozen Hearth experiments and inspector

`hearth/experiment.ts` owns the single-seat plan, `arena-experiment.ts` and `arena-audit.ts` own the arena plan and reconstruction, and the `recruitment-*` modules own the bounded worker harness and inspector. All resolve inputs, output arguments and Git provenance from the repository root. Existing output and audit receipts are refused; failed partial runs remain available for inspection.

Plans, reserved seed sets and v5/v1 replay semantics remain frozen. New runs pin the current implementation paths and exact headless dependency graph; historical reports keep their original paths and hashes. Recruitment audit requires the recorded bundle, source hashes and exact case grid, then reconstructs decisions, controller bindings, diagnostics, metrics, placement, lifecycle and comparison totals. Restore the recorded checkout when auditing an older environment; do not edit its receipts to match a newer one. Worker results are validated against their assigned case, and early exits reject the pool instead of leaving it waiting indefinitely.

`node packages/workshop-tools/hearth/recruitment-inspect.ts replay.json receipt.json new.html` validates the replay/receipt hash and case, reconstructs evaluator-only observations, and embeds a separately checked viewer runtime. The output works offline. Alternative proposals inspect the same position; they neither simulate future turns nor estimate playing strength. Downloaded prefixes require the frozen arena-v1/Hearth-v5 environment; the current game rejects them.

## Policy adoption commands

Policy benchmarks default to summaries, per-case outcomes/audit verdicts and one
compiled bundle, with no per-case rollout files. Use `--retain-rollouts all` for a
named detailed investigation, or `record` for selected episodes. The protocol/report
records `rolloutRetention`. Shared retained rollouts default to `.json.gzip`; use
`--rollout-format json` for an explicit plaintext requirement. Manifests and retained
study rows identify encoded/decoded bytes; the protocol records the storage mode.
Apply the [iteration retention rule](../../docs/engineering/maintenance.md#policy-iteration-retention)
when closing a study. The native Night
Passage recorder retains its existing plaintext format.

`npm run engine:policy -- run|record|benchmark|audit` supplies the checked policy
workflow for Blindside, Spire, current Mixed Rivals, Emberwake, Cartographer and Night Passage. Built-in policies and trusted local TypeScript
factory modules use the same game-owned observation/command adapter. `record` and
`benchmark` require fresh output directories, retain source-pinned compiled bundles,
native results and audit verdicts. `record` and explicitly opted-in benchmarks also
retain original inputs/proposals; `audit` writes an
exclusive new receipt. Benchmark writes its frozen protocol before cases execute.
No policy module receives the hidden environment seed. See the
[Blindside contract](../../docs/engineering/blindside-agent.md) for options, extension
example, fairness limits, difficulty/metrics, reserved cohorts and isolated review.
The [Spire contract](../../docs/engineering/spire-agent.md) uses explicit `--setup` JSON
for character/Ascension. Each adapter owns its study setups, ranking and review URL;
reports keep character/hero strata separate over paired independent seed blocks.
`policy-study-2` adds setup/stratum identities and paired win differences; original
`policy-study-1` receipts remain unchanged.

[Hearth policy play](../../docs/engineering/hearth-policy.md) uses aliased public commands
and all-actor native journal spans. Audits never rerun rival policies. `benchmark --pool
1–4` distributes independent cases, validates assigned-case replies, fails on early worker
exit and produces matching serial results (and exact rollout bytes when retained); source pins include the worker tooling.

[Emberwake policy play](../../docs/engineering/emberwake-policy.md) uses first-death
campaign attempts, conservative structured sensors and game-owned setup JSON. Native
requested-tick cursor units remain distinct from executed time; living budget stops
remain timeouts. The initial 270/540-case cohorts use `--max-decisions 4000`.

[Cartographer policy play](../../docs/engineering/cartographer-policy.md) uses public
announced-turn forecasts and accepted-command cursors. Recordings identify their
wire game as `dungeon-cartographer`; the CLI selector remains `cartographer`.

[Night Passage](../../docs/engineering/night-passage-agent.md) preserves its native
`PolicyPlayer` work/timing and action/tick budgets. Common benchmark freezes recorded
10/20-block studies; explicit `--suite` retains legacy summary semantics. Every native
study case retains its outcome/audit verdict; `--retain-rollouts all` additionally
saves original knowledge, replay and a spectator manifest. See the
[six-game workflow evidence](../../docs/research/experiments/2026-10-16-policy-workflow.md).

Shared policy benchmarks accept `--cohort NEW-NAMESPACE`, `--blocks 10|20|40|60|100|400`
and `--policies ID,ID`. Defaults preserve the original adoption populations. Increasing
blocks reuses the seed prefix; choose a fresh namespace for a new reserved study.
Policy subsets enter the frozen protocol and complete-grid validation. Spire's
[prospective confirmation](../../docs/research/experiments/2026-10-16-spire-strength-3-protocol.md)
uses separate primary/companion grids with explicit denominators and an inferential
addendum; the common report remains descriptive.

Games may declare `study.score.components` and return a matching numeric
`metrics.score` vector. The study compares components in declared order and
direction, reports their distributions and paired better/tied/worse/invalid counts,
and excludes execution errors and incomplete/failed audits from score ranking. This ordinal score has no scalar
mean or automatic promotion verdict. Historical records without these components
require their original contract; retain evaluator rescoring as a separate sidecar.

### Recording and audit

`--setup` contains game-owned configuration. The five shared-recording adapters use
`--max-decisions`, independent `--policy-seed` and JSON `--policy-options`. Night Passage
uses native `--max-actions` (including evaluator start), `--max-ticks` and public
`PlayerConfig`; unsupported shared flags fail explicitly. Native work totals determine
control latency and must retain their breakdown.

`benchmark --split development|evaluation` reports every attempted outcome/audit verdict
within its game-owned setup and character/hero/weapon stratum. Reports are written
after the complete matrix returns; an interrupted summary-only study has no final
report. Night Passage's legacy native `benchmark`/`evaluate` commands and
`--suite training|held-out` retain their labelled summary semantics; they cannot
supply missing original knowledge retroactively.

Audit auto-detects each recorded identity, including Night Passage's native schema.
An implementation that is absent leaves policy reproduction unavailable while native
replay and information-boundary checks remain independent.
