# Offline Codex usage dashboard

A standalone local tool inspired by [CC Switch's usage dashboard](https://github.com/farion1231/cc-switch/tree/main/src/components/usage) and [session-log analysis](https://github.com/farion1231/cc-switch/blob/main/src-tauri/src/services/session_usage_codex.rs). It reads Codex JSONL directly, without a proxy, account API, credentials or network access. It does not participate in game rules or persistence.

## Run

```sh
nvm use
npm run usage:dashboard -- --serve
```

Open the loopback URL printed by the command (default: `http://127.0.0.1:4381/`). Refresh logs resumes appended files and reuses unchanged files from a persistent disk index. Stop the process with Ctrl-C. It never modifies source logs.

Without `--serve`, the command produces a self-contained `index.html` and adjacent `usage.json` in a fresh ignored `test-results/disposable/usage-dashboard-<UUID>/` directory. The HTML embeds compressed usage data and a bundled runtime; it works directly offline in modern browsers supporting DecompressionStream; refresh requires rebuilding or running the local server. Each invocation creates a new directory; explicit existing output is refused. Default builds use the [tools package retention contract](../../packages/workshop-tools/README.md#offline-codex-usage); use `--out` for lasting evidence or pin the default receipt before expiry.

```sh
npm run usage:dashboard -- --root /path/to/sessions --root /path/to/archive --out test-results/my-new-usage
npm run usage:dashboard -- --root /path/to/rollout.jsonl --serve --port 4382
npm run test:usage
npm run test:browser -- tests/browser/usage-dashboard.spec.ts
```

Default roots are `sessions` and `archived_sessions` inside `CODEX_HOME`, or `~/.codex`. Explicit roots replace those defaults. Missing roots are reported as coverage gaps. Relative arguments resolve from the repository. Output must be a new directory inside the repository, with an existing parent and no input overlap; symlinked parents may not escape the repository. Discovery ignores symlinked entries.

## Views and calculations

- **Overview:** tokens, usage events, sessions, input cache share and reasoning share of output; daily trends (seven-day buckets for ranges over 90 days); a 182-day activity map; model/project/effort comparisons with reasoning shares; paginated, header-sortable sessions with row-click and keyboard source drilldown.
- **Filters:** inclusive calendar dates in the selected time zone, model, project, effort and session search. **Ignore auto-review sessions** is on by default and persists in this browser, including across Reset. It excludes sessions whose metered records all use `codex-auto-review`, based on the full scanned history before other filters; mixed-model sessions stay visible. Toggle it off to include review sessions again. Initial range is the last 30 calendar days in Asia/Shanghai. All time includes all metered history. Charts, totals, session details and CSV share the filtered population; the activity map explicitly shows its narrower 182-day window.
- **Pricing:** official current Standard API rates checked on **2026-10-09**, with editable USD per million tokens, browser-local persistence and pricing JSON import/export. Every model requires all four rates; an empty model remains unpriced. Estimates sum uncached input, cache read, cache write and output at their respective rates. Unpriced events remain in token totals and are excluded from the labelled priced cost subtotal. Current rates apply to all history; historical prices and model aliases are not inferred. Above 272K request input tokens, eligible models use 2× input/cache rates and 1.5× output. Processing-tier and region premiums are not inferred. GPT-5.6 Sol uses its current promotional rate. Older models with unpublished cache-write rates remain unpriced if writes are recorded; the displayed zero only applies when writes are absent. Unknown internal models such as `codex-auto-review` remain unpriced. Sources: [official pricing](https://developers.openai.com/api/docs/pricing) and the individual [model pages](https://developers.openai.com/api/docs/models/gpt-6.1-sol). Restore official rates resets browser overrides.
- **Evidence:** normalized records link the physical source path and line, accounting method, session and source SHA-256. Drawers show up to 100 recent selected usage records. **Open full trace** opens the existing Card Workshop trace visualizer in a new tab, with message and tool previews, recorded patches, and locally retained images. Opening a turn or record loads full text in a scrollable panel, with block navigation beyond 64 Ki characters; images load when expanded. A global Raw text switch selects original text or rendered Markdown/code. Search covers the loaded previews, which is labelled in the viewer. It reads the selected session and indexed descendants on demand, including history outside the usage filters. Provenance includes physical lines, timestamps, source hashes and omitted-record coverage. Duplicate archived sessions use the largest available source; missing descendants and unavailable encrypted payloads remain gaps. Private reasoning is excluded and commands are inert. This link requires `--serve`; standalone HTML explains how to start it. The top-level CSV export retains the filtered usage population and escapes spreadsheet formula prefixes.

Total tokens = input + output. Cache read/write are subsets of input; reasoning tokens are a subset of output. Cache share = cache read / input. Reasoning share = summed recorded reasoning / summed output, rather than an average of percentages. It is undefined without output. Records lacking reasoning counters contribute zero recorded reasoning, so their presence explicitly marks the share as a lower bound. Usage events are metered records, not user prompts, turns or completed tasks. Zero-token records do not create activity. A day without recorded usage does not prove no activity outside the scanned roots.

## Accounting and coverage

Newer `token_usage_record` entries use `(thread_id, response_id)` identity and take precedence over legacy snapshots in the same session. Inherited records belonging to another thread are excluded; archived/copied responses are deduplicated globally. Model and effort come from the corresponding turn context when available.

Older `event_msg/token_count` entries use per-request `last_token_usage` when available. Repeated cumulative/last snapshots within a limit lane are ignored. Cumulative-only events use positive deltas; decreasing or inconsistent intervals are excluded with a coverage gap. Model changes do not reset the session counters. Initial cumulative-only observations include their available totals; their time attribution reflects the observed snapshot, rather than reconstructed historical request times.

Delegation parentage is retained separately from explicit fork origin and history base. A delegated child with no inherited-history metadata counts its own recorded usage even if its parent file is unavailable; older logs that copied history without recording that relationship may therefore overcount. This remains an exploratory usage estimate.

Forked legacy logs compare their replay prefix with the explicit parent's and ancestors' timestamped snapshots before the fork timestamp. Missing/cyclic explicit history lineage excludes those snapshot records visibly rather than counting inherited history. Modern per-response identities are preferred because they avoid this inference. For an explicit history base without a retained cumulative baseline, the first cumulative-only observation establishes a baseline but is excluded with a coverage gap.

Mixed-generation sessions use their response records exclusively. Snapshots are not added to fill apparent holes because they may overlap responses. Missing earlier response records can therefore reduce coverage; a gap is reported when legacy snapshots predate the available response records. Counter reconciliation warnings mean `input_tokens + output_tokens != total_tokens`; they do **not** identify failed requests. For example, a snapshot can record input=0, output=0 and total=19,102. Such a snapshot has no trustworthy input/output split and is excluded; valid records elsewhere in the same session remain counted. Sources shows grouped occurrence counts, example counters and exact source lines. A file without supported metered usage is reported separately.

Malformed lines, unsupported counters, invalid timestamps, inaccessible paths and source mutation are visible in Sources. A valid final JSON line without a newline is accepted; a partial line is reported and retried on refresh.

Reads stop at the file size observed when opening it. The hash covers exactly those scanned bytes, including the observed prefix of a growing log. Usage sources and generated dashboard reports retain no message content, prompts, tool arguments, private reasoning or account information. Generated HTML/JSON/CSV do retain local file paths, project paths, session identifiers and usage counts; keep them local unless you intend to share that metadata. The separate full-trace page contains observable conversation and tool content in memory only; the server keeps one cached preview index and reloads changed sources when reopened. Full bodies are read from byte ranges and checked against per-record hashes, so rewritten sources require reopening the trace. Large text and image bodies are never bundled into the initial page. It does not write that trace into the usage report or disk index, fetch remote images, execute commands or upload anything.

## Persistent incremental index

The CLI keeps a root-specific index under ignored `test-results/usage-index/<root-key>/`. Each source has a compressed metadata-only entry; a versioned manifest identifies active entries. Writes use temporary files and atomic rename, with private file permissions. Only changed entries are rewritten; missing or damaged entries rebuild from their own source. Deleted sources disappear from aggregates and the manifest. Parser-version changes rebuild the index.

Unchanged size, modification/change times and file identity reuse the entry across process restarts. Growing files with the same identity and unchanged trailing 4 KiB resume at the last newline, carrying model/effort/turn context forward. A provisional final line is replaced on append, so unfinished JSON can complete without duplicate accounting. Truncation, inode replacement, same-size edits or boundary changes trigger full parsing of that file. The append-only assumption cannot detect a rewrite far before the boundary combined with growth; remove the root's index to force a full rebuild if logs were rewritten deliberately.

Serialized SHA-256 state at a 64-byte boundary retains exact whole-source hashes without rereading historical bytes. Raw message fragments are never persisted, including unfinished tails; the small hash suffix is reread. Sources reports unchanged/appended/full-scan counts and bytes streamed, excluding the bounded boundary probes. Line parsing and hashing are incremental; cross-session deduplication and filtered aggregates are rebuilt from normalized usage metadata.

## Verification scope

The maintained source lives in `packages/workshop-tools/usage/`, with the JSONL adapter in `packages/workshop-tools/trace/`, covered by existing formatting, typed ESLint, TypeScript and inventory gates. Its tests join the tools workspace gate. Synthetic journeys protect response/snapshot precedence, archive and fork deduplication, source hashes, filtering, pricing, failed sources and refresh. The browser journey uses the repository's disposable-profile harness and startup guard; on macOS its first launch requires approved execution outside the restricted sandbox. Loopback server tests also need execution permitting a local bind; sandbox EPERM is an explicit skip, not evidence that the server passed.

## Code ownership

`packages/workshop-tools/usage/browser/` owns the dashboard presentation: `main.ts` coordinates filters, sessions, pricing and refresh; `charts.ts` owns charts and their interactions; `evidence.ts` owns inspection and focus handling; `dom.ts` contains their small shared helpers. `index.html` and `styles.css` are embedded by `build.ts` into the offline report. Accounting, prices, scanning and source indexing remain in the parent usage directory. Session trace pages use the separate [session-review frontend](../../packages/session-review/README.md).
