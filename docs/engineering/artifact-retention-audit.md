# Artifact retention audit — 2026-10-07

**Decision: retain the audited tree.** The guarded retention dry run found zero eligible deletions. Duplicate bytes, absence of a textual reference and ignored Git status do not authorize retirement. No artifacts were deleted by this sweep.

## Observed inventory

The read-only inventory ran from **11:42:55 to 11:43:04 UTC**, after documentation consolidation at `157e080`, with no active render/test producers. Scope: `test-results/`, `dcc-backups/` and `packages/dcc-workbench/sources/`. This is a per-file stability observation, not a global atomic snapshot or a permanent current-size claim.

| Classification                                  | Groups |  Files |          Bytes | Groups with literal references |
| ----------------------------------------------- | -----: | -----: | -------------: | -----------------------------: |
| Source or asset present                         |    255 | 13,112 | 10,014,850,885 |                            104 |
| Referenced evidence without source/asset suffix |     54 |  7,549 |  1,320,590,920 |                             54 |
| Unclassified                                    |    418 |  7,591 |    613,462,316 |                              0 |
| Total                                           |    727 | 28,252 | 11,948,904,121 |                            158 |

There are **13,406 distinct stable hashes**: 10,069 occur once and 3,337 occur more than once. Repeated occurrences account for **7,223,668,166 additional bytes**. These are exact-byte duplicate observations, not an estimate of safely reclaimable space. Every occurrence retains its path; no symlinks or changing-file records appeared in this run.

The largest groups include current migration/commit verification, frozen AI reports and creature export/review deliveries. Classification gives source/asset protection priority over textual references; mixed groups remain protected as a whole. Literal tracked-text matching misses implicit, external and historical references. Unreferenced groups are therefore unknown and protected.

## Retention authority and recovery

- The older complete native review is inside its 14-day retention window. The fresh native review is explicitly pinned. Neither is eligible.
- The original maintenance handoff, cleanup checkpoint and active migration session are open, pinned or unclassified. They remain protected until explicit closeout with promoted targets and exact hashes.
- Artist sources, old GLBs/receipts, frozen experiment reports, source snapshots, accepted artwork and unknown captures remain protected. In particular, `dcc-backups/` and root-level historical `test-results/` evidence are outside automatic pruning.
- `.work/backups/` is outside the inventory roots and automatic deletion authority. Its original maintenance, DCC and document recovery records remain protected separately. DCC source/asset backups matched the original receipt; all 45 original document blobs matched the recorded hashes.
- No deduplication links, bulk disposable registrations, source replacements or hash rewrites were made. The current artist `.blend`, published GLB, audit and poses remain byte-identical to the pre-migration delivery.

The occurrence-level report and dry-run decisions are retained in the protected migration session as `artifact-inventory-closeout.json` and `retention-closeout.json`. [Inventory limits](checks.md#artifact-inventory-limits) and [maintenance governance](maintenance.md#retention-and-deletion-authority) define the reproducible commands and authority boundaries. New verification output after this observation requires a refreshed inventory before final closeout.
