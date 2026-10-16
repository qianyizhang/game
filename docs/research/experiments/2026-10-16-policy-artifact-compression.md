# Lossless policy artifact storage acceptance

**Shared policy recordings can now retain gzip containers without discarding original
inputs or changing native replay identities.** Complete Emberwake policy-5 and
policy-6 development witnesses passed the real worker boundary and actual browser
review; the [receipt](2026-10-16-policy-artifact-compression.json) separates those
checks from the closed independent review and the passing root-owned code gate.

## Storage contract

- **Opt-in:** `record` and `benchmark` accept `--rollout-format json|gzip` for the five
  shared adapters. JSON remains the default; native replay and audit outputs remain
  JSON. Rollout payload schemas, canonical digests and native identities are unchanged.
- **Exact bytes:** manifests and study rows retain encoded/decoded byte counts and
  SHA-256 hashes, filenames and review links. Protocols declare the format and suffix.
  Both codec/storage modules enter the frozen tool pins before execution.
- **Original download:** local and fetched files retain encoded bytes, including BOM
  variants and different gzip headers encoding identical JSON. Selection identity
  hashes original bytes; distinct originals remain independently selectable.
- **HTTP recovery:** new containers use `.json.gzip`, because Vite marks `.gz` as HTTP
  content encoding and Fetch may remove the container. Remote gzip-looking URLs must
  contain gzip magic, even when the response omits the encoding header. Otherwise the
  inspector explains possible decoding/misnaming and offers local-file recovery.
  Ordinary transport-compressed `.json` and an outer HTTP layer over an intact gzip
  container remain valid. Local imports detect containers by magic.

## Complete retained witnesses

Both cases reuse consumed `EMBERWAKE-STRENGTH-2-DEV-02`; these are technical acceptance
runs, **not new independent seeds or difficulty/strength confirmation**. Native rules
are `emberwake-4`, observation 3 and score `emberwake-performance-2`.

| Witness             | Setup and policy              | Decisions / native ticks | Decoded JSON bytes | Gzip bytes | Real worker time |
| ------------------- | ----------------------------- | -----------------------: | -----------------: | ---------: | ---------------: |
| Historical policy 5 | Sorceress / Severe / Growth   |           7,559 / 35,490 |        112,389,735 |  2,194,677 |         21.987 s |
| Current policy 6    | Barbarian / Severe / Survival |           6,689 / 31,270 |         96,340,701 |  1,869,673 |         18.653 s |

Both native outcomes were victories. Each real repository `casePool` worker used the
existing **2,048 MiB V8 old-generation limit**, retained its exact producer, source
snapshot and bundle before execution, and finished all four audits with zero source
drift. The compressed storage is about **98% smaller**. This is disk retention evidence,
not a claim of reduced decoded audit memory, worker peak memory or an RSS ceiling.
The policy-5 receipt's misleading `parentMemoryOnly` field has a separate retained
clarification: RSS is process-wide, including worker threads; the snapshot is not a peak.

Actual Chrome reviewed each complete witness while its matching policy version was
still current. It passed integrity, native reconstruction, exact original inputs and
policy reproduction; navigated first/last knowledge and native before/after boundaries;
checked final native ticks/outcome, explicit evaluator access and 390 px layout; and
downloaded the exact original filename and gzip bytes. The policy-5 bytes remain frozen
historical evidence after policy 6. Separately, the older **106,458,472-byte** policy-4
recording passed Node/Chrome exact encoded and decoded hash checks; that primitive test
did not reproduce its historical policy.

## Review findings and regressions

- **Missing HTTP header:** accepting decoded JSON from a gzip-looking URL could
  falsely promise an original gzip download. The guard now requires gzip magic
  regardless of headers. Actual Vite regressions cover both present and absent headers.
  Valid gzip-header and BOM variants remain independently selectable. Corrupt,
  truncated or concatenated streams, invalid UTF-8 and a 150,000,001-byte expansion
  show errors without replacing the selected run.
- **Native routing boundary:** applying the shared 150 MB cap before schema routing
  changed Night Passage's existing plain audit contract. Plain routing now preserves
  its legacy read/parse path; strict shared validation follows only after excluding
  the native schema. A generated **150,000,001-byte valid native artifact** passes
  automatic and explicit native audit routes. Routing-only BOM removal also preserves
  shared BOM audit while native code continues to receive its original raw input.

The owner’s `node --test packages/workshop-tools/policy/{artifact,cli,pool,runtime}.test.ts`
passed **13/13**, including default JSON, gzip CLI audit, manifests, two-worker study
output, native routing and runtime lifecycle. Independent review separately passed
**12 artifact/CLI/pool tests**, excluding the owner’s runtime-cleanup check; these counts
are separate scopes. Typed lint and TypeScript checks for application and tools passed. Browser acceptance retained the earlier five-journey
run, the subsequent two-journey HTTP-guard run, and the final current-policy-6 full
review. Failed prototype/routing test attempts and the preflight-only version-literal
mistake remain retained; none is represented as an application failure or successful run.

Fresh Astra review closed both supported findings and the related BOM regression.
It verified 30 retained source/tool pins and the bundle, independently re-audited all
four dimensions of the complete frozen policy-5 recording, and inspected the retained
browser receipts. It did not independently launch Chrome or run the combined gate.

Root's isolated `npm run check` passed **maintenance/static/build checks**, **554
application tests in 93 files**, and **37 seeded tests in eight files**. The receipt
pins its gate capsule, log, manifest and recoverable tested source archive. Geometry
was not selected. Final documentation-only formatting/inventory refresh remains root's
closeout responsibility; unrelated guide/art changes are excluded from this code gate.

## Limits

Accepted shared encoded containers and decoded UTF-8 JSON are each capped at
150,000,000 bytes. Browser reads and decompression are bounded. The common CLI's
legacy plain schema-routing read is unbounded; this cap is an accepted-artifact bound,
**not hostile-file or peak-memory isolation**. Parsing, native reconstruction and
input/decision audits still require decoded graphs. Night Passage compression remains
explicitly unsupported. These are technical checks, not calibration, human-skill or
game-feel evidence.
