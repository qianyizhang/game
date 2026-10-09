# Migration and artifact retirement — 2026-10-07

**Cleanup applied; no unresolved decisions remain.** All 18 compatibility wrappers are removed. Active commands and tests call the tools package directly; root npm names remain stable. Historical source-pinned receipts and reproduction commands retain their original revisions.

## Migration checkpoints

These are dated observations, not current inventory or fresh verification.

| Checkpoint                            | Result and boundary                                                                                                                                                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source/document migration             | Adopted the original 304-source and 45-document backlogs. The intermediate inventory had 359 checked sources including wrappers; wrapper retirement left 341. Current coverage comes from `npm run maintenance -- check`.    |
| Locked clean checkout                 | Full local gate passed: 390 application/geometry tests, four simulations, maintained tools/Python/DCC checks and build. Clean-clone browser cases passed six public cases and explicitly skipped four private-history cases. |
| Working-checkout browser at `c30962d` | 177/177 cases passed with private inputs, one disposable-profile startup and no retries or skips; 17.4 minutes.                                                                                                              |
| Native delivery                       | Isolated construction/render and original artist export parity passed. Browser/native comparison sampled 64 vertices at five times, maximum error 1.1100098638893633e-6 model units. This is technical evidence.             |
| Original retention audit              | 730 groups, 29,921 files and 12,609,866,762 logical bytes; 13,532 stable hashes. Receipt-based pruning found zero eligible deletions. That initial keep decision was superseded by the explicit one-time retirement below.   |

The migration repaired Banner Bearer hair connectivity while preserving geometry assertions;
[verification contracts](checks.md#geometry-test-budgets) retain the measured budgets.
Replays, source pins, rules versions and frozen experiment outcomes were preserved. CI was
configured locally; remote Actions and branch protection were not observed.

## What was removed

| Scope                                                          | Actual result                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Artifact roots                                                 | 24,286 files removed, totaling 11,049,183,904 logical bytes                                      |
| Net artifact footprint                                         | 12.71 GB → 1.70 GB, an 86.6% reduction, including one freshly rebuilt current trace viewer       |
| Verification checkout, redundant backups and migration scratch | 11,821 entries removed, totaling 448,802,390 logical bytes; the clean-install clone is gone      |
| Legacy code                                                    | 18 wrappers and their obsolete TypeScript project removed; 341 maintained sources remain checked |

Sizes use decimal GB and logical file bytes, not measured physical disk reclamation. The artifact comparison covers `test-results/`, `dcc-backups/` and `packages/dcc-workbench/sources/` after verification output settled. It excludes dependencies and active caches.

Deleted material includes repeated whole-gallery exports, superseded browser/regression/simulation runs, intermediate art captures and helpers, generated viewer copies, and temporary migration build candidates. Unique obsolete generated output was also retired: the exact older runs cannot all be reopened. Dated prose records their original findings without presenting retired files as current evidence. Backup copies were deleted only after proving exact recovery from reachable Git blobs or retained files.

## Resolved artist-source decision

The user chose **keep only the later pilot**:

| Editable state                                   | Decision                                                                            |             Size |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- | ---------------: |
| Earlier pilot, SHA-256 prefix `10c5749d`         | Deleted, including duplicate downloads                                              | 2.64 MB per copy |
| Later pilot, SHA-256 prefix `64e40ccc`           | Kept at `test-results/dcc-backups/briar-hydra-1791340517816.blend`                  |          7.63 MB |
| Current artist source, SHA-256 prefix `4b65ee96` | Kept at [briar-hydra.blend](../../packages/dcc-workbench/sources/briar-hydra.blend) |          7.76 MB |

## What remains, and why

- **Current art and curated deliveries:** editable source, published DCC asset/receipts, one delivery set per subject, selected native/browser comparisons and external visual references.
- **Creation-history case:** six original thread inputs, the exact consumed source/capture files, and one rebuilt viewer at `test-results/trace-visualizer-current/`. Its full data and manifest match the prior viewer after normalizing only the collection timestamp: 60 artifacts and 147 captures.
- **Published studies:** original Hearth single-seat, arena and recruitment development/evaluation evidence, their recorded inspectors/audit, and the frozen tavern-spell playtests. These were not rerun or rewritten.
- **Compact provenance:** final check logs, parity receipts, original dated closure records and explicit retirement manifests. Earlier closure records describe their original observation; the retirement manifests explain subsequent removals.

## Verification and receipts

The full application gate passed: 390 unit tests, four simulations, maintained tools/Python/DCC checks, lint, types, formatting and build. All 10 affected browser cases passed on the final run. The first attempt recorded a Vite reconnect during SVG decoding; its log is retained. No assertions or timeouts were weakened. Post-retirement DCC verification passed, retained-file hashes matched, and the trace rebuild preserved complete data and manifest content.

Every one of the 741 pre-retirement artifact groups has a file-level keep/delete disposition. Exact path/hash plans and results are in `.work/sessions/lean-cleanup-2026-10-07/` (`retirement-plan.json.gz`, `retirement-result.json`, `working-material-plan.json.gz`, `working-material-result.json`). Gzip files preserve the original JSON bytes; result receipts identify their SHA-256. This was an explicitly authorized one-time retirement. Automatic expiry policy was not weakened. No push, remote CI execution or new aesthetic approval is claimed.

## Source recovery

The [document migration record](../../maintenance/document-migration.json) preserves all 45
original document paths, destinations and SHA-256 hashes. Use an entry's `sourceRevision`
when present, otherwise the record-level revision. Original bytes remain in Git; redundant
local document copies were retired after byte verification. Private trace recipes keep
their original revision-pinned document paths.

The following reports were consolidated here on 2026-10-09. Their full original bytes are
recoverable at revision `e3c94c5c22562952cb0dff16e13b4ca56fedaf97`:

| Original path                                  | SHA-256                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `docs/engineering/documentation-migration.md`  | `cfb68006e57992dc3082b07754f37f67463d65de1a0563fa40fb85b34358126b` |
| `docs/engineering/maintenance-migration.md`    | `dd01800a2d01f9363d281cc520dfce00f735c287264009c763b47d831a1c072c` |
| `docs/engineering/artifact-retention-audit.md` | `e7412e32baca8fd337de382fb9a78a40090deeba594199a967a72ffd4aad0474` |

Recover either an original migration entry or a report above with its exact revision/path:

```sh
git show REVISION:ORIGINAL_PATH > /tmp/original-document.md
shasum -a 256 /tmp/original-document.md
```

The digest must match the record. Git recovery preserves authored reports; it does not
restore retired captures or turn historical verification into a new result. Original
closure receipts remain dated observations; the retirement manifests explain later removals.
