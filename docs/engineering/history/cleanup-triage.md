# Migration and artifact retirement

Dated migration and cleanup outcomes. Current retention and deletion authority live
in [maintenance](../maintenance.md#retention-and-deletion-authority); none of these
completed operations authorizes further pruning.

## 2026-10-07 Migration

| Scope                 | Recorded result                                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| Ownership             | Retired all 18 legacy wrappers; adopted 304 maintained sources and 45 documents; direct tools-package commands |
| Clean-checkout checks | 390 application/geometry tests, four simulations, tooling/Python/DCC checks passed                             |
| Browser `c30962d`     | 177/177 cases passed in 17.4 minutes                                                                           |
| Native parity         | Isolated construction/render parity passed; 64-vertex error ≤1.11e−6 model units                               |
| Footprint             | Removed 24,286 artifact files; 12.71→1.70 GB, 86.6% reduction                                                  |

### Artist-source resolution

| State          | Historical disposition                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Earlier pilot  | Deleted, 2.64 MB                                                                                         |
| Later pilot    | Retained at `test-results/dcc-backups/briar-hydra-1791340517816.blend`, 7.63 MB; protected artist backup |
| Current source | Retained [briar-hydra.blend](../../../packages/dcc-workbench/sources/briar-hydra.blend), 7.76 MB         |

## Source recovery

The [document migration map](../../../maintenance/document-migration.json) owns its
original paths/hashes. These three additional consolidated reports are recoverable
at original revision `e3c94c5c22562952cb0dff16e13b4ca56fedaf97`; their hashes are not
replaced by the map:

| Original path                                  | SHA-256                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `docs/engineering/documentation-migration.md`  | `cfb68006e57992dc3082b07754f37f67463d65de1a0563fa40fb85b34358126b` |
| `docs/engineering/maintenance-migration.md`    | `dd01800a2d01f9363d281cc520dfce00f735c287264009c763b47d831a1c072c` |
| `docs/engineering/artifact-retention-audit.md` | `e7412e32baca8fd337de382fb9a78a40090deeba594199a967a72ffd4aad0474` |

After the [history migration](git-storage-2026-10-11.md), resolve an old revision
through the retained commit map, preserving the original recorded identity:

```sh
original_revision=e3c94c5c22562952cb0dff16e13b4ca56fedaf97
mapped_revision=$(awk -F, -v old="$original_revision" '$1 == old {print $2}' maintenance/history/2026-10-11-lfs-commit-map.csv)
git show "${mapped_revision:-$original_revision}:ORIGINAL_PATH" > /tmp/original-document.md
shasum -a 256 /tmp/original-document.md
```

## Bounded artifact cleanup — 2026-10-10

| Scope                      | Recorded result / limit                                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Removed                    | 112 disposable directories: 29 usage, 36 trace, 47 synthetic fixtures; 4,966 files / 3.59 GB                                                              |
| Retained                   | Runtime/session contents, historical tests, DCC backups, trace inputs and active viewers                                                                  |
| Local receipts             | `.work/sessions/cleanup-verification-2026-10-10/deletion-receipt.json` and `protected-files.json`; ignored evidence, unavailable in a fresh clone         |
| Recurrence prevention then | Usage/trace defaults used 14-day retention; tests registered fixture teardown. [Tools](../../../packages/workshop-tools/README.md) owns current commands. |

The [precompaction record](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/engineering/history/cleanup-triage.md)
preserves original wording. This consolidation removes no source, backup or receipt.
