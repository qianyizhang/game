# Artifact retention audit — 2026-10-07

**Historical inventory; retention decision superseded by [authorized lean cleanup](cleanup-triage.md).** The original decision was to retain the audited tree. The guarded retention dry run found zero eligible deletions. Duplicate bytes, absence of a textual reference and ignored Git status do not authorize retirement. No artifacts were deleted by this sweep.

## Observed inventory

The read-only inventory ran from **12:10:15 to 12:10:25 UTC**, after the full browser suite at `c30962d`, with no active render/test producers. Scope: `test-results/`, `dcc-backups/` and `packages/dcc-workbench/sources/`. This is a per-file stability observation, not a global atomic snapshot or a permanent current-size claim.

| Classification                                  | Groups |  Files |          Bytes | Groups with literal references |
| ----------------------------------------------- | -----: | -----: | -------------: | -----------------------------: |
| Source or asset present                         |    255 | 14,630 | 10,632,643,905 |                            104 |
| Referenced evidence without source/asset suffix |     54 |  7,549 |  1,320,590,920 |                             54 |
| Unclassified                                    |    421 |  7,742 |    656,631,937 |                              0 |
| Total                                           |    730 | 29,921 | 12,609,866,762 |                            158 |

There are **13,532 distinct stable hashes**: 10,099 occur once and 3,433 occur more than once. Repeated occurrences account for **7,794,002,386 additional bytes**. These are exact-byte duplicate observations, not an estimate of safely reclaimable space. Every occurrence retains its path; no symlinks or changing-file records appeared in this run.

The largest groups include current migration/commit verification, frozen AI reports and creature export/review deliveries. Classification gives source/asset protection priority over textual references; mixed groups remain protected as a whole. Literal tracked-text matching misses implicit, external and historical references. Unreferenced groups are therefore unknown and protected.

## Retention authority and recovery

- The older complete native review is inside its 14-day retention window. The fresh native review is explicitly pinned. Neither is eligible.
- At inventory time the original maintenance handoff, cleanup checkpoint and migration session were open or pinned. Their closure follows the committed [sweep closeout](maintenance-migration.md): original notes remain within the 30-day retention window, and the source-containing migration session remains pinned.
- Artist sources, old GLBs/receipts, frozen experiment reports, source snapshots, accepted artwork and unknown captures remain protected. In particular, `dcc-backups/` and root-level historical `test-results/` evidence are outside automatic pruning.
- `.work/backups/` is outside the inventory roots and automatic deletion authority. Its original maintenance, DCC and document recovery records remain protected separately. DCC source/asset backups matched the original receipt; all 45 original document blobs matched the recorded hashes.
- No deduplication links, bulk disposable registrations, source replacements or hash rewrites were made. The current artist `.blend`, published GLB, audit and poses remain byte-identical to the pre-migration delivery.

The superseded migration inventory snapshots were retired. The lean-cleanup retirement manifest preserves per-file paths, hashes and dispositions, and this dated report preserves the original aggregate observation. [Inventory limits](checks.md#artifact-inventory-limits) and [maintenance governance](maintenance.md#retention-and-deletion-authority) define the reproducible commands and authority boundaries. A separate closure audit under `.work/audits/full-migration-final/` validates session hashes and the final retention dry run after promotion. Future output is outside this dated observation.
