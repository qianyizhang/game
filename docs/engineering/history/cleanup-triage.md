# Migration and artifact retirement

Historical records of repository migrations and artifact cleanups.

## 2026-10-07 Migration

All 18 legacy wrappers were retired; commands invoke the tools package directly.

| Checkpoint                  | Outcome                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| Source/document migration   | Adopted 304 sources and 45 documents. Checked via `npm run maintenance -- check`.           |
| Clean checkout gate         | 390 app/geometry tests, 4 simulations, tools/Python/DCC checks passed.                      |
| Working browser (`c30962d`) | 177/177 cases passed in 17.4 minutes.                                                       |
| Native delivery             | Isolated construction/render parity passed; 64-vertex error ≤ 1.11e-6 model units.          |
| Footprint reduction         | 24,286 artifact files removed; net footprint reduced from 12.71 GB to 1.70 GB (86.6% drop). |

### Artist-source resolution

| State          | Decision                                                                               | Size    |
| -------------- | -------------------------------------------------------------------------------------- | ------- |
| Earlier pilot  | Deleted                                                                                | 2.64 MB |
| Later pilot    | Kept at `test-results/dcc-backups/briar-hydra-1791340517816.blend`                     | 7.63 MB |
| Current source | Kept at [briar-hydra.blend](../../../packages/dcc-workbench/sources/briar-hydra.blend) | 7.76 MB |

## Source recovery

[Document migration record](../../../maintenance/document-migration.json) tracks original paths and SHA-256 hashes. Reports consolidated on 2026-10-09 are recoverable at revision `e3c94c5c22562952cb0dff16e13b4ca56fedaf97`:

| Original path                                  | SHA-256                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `docs/engineering/documentation-migration.md`  | `cfb68006e57992dc3082b07754f37f67463d65de1a0563fa40fb85b34358126b` |
| `docs/engineering/maintenance-migration.md`    | `dd01800a2d01f9363d281cc520dfce00f735c287264009c763b47d831a1c072c` |
| `docs/engineering/artifact-retention-audit.md` | `e7412e32baca8fd337de382fb9a78a40090deeba594199a967a72ffd4aad0474` |

After the [2026-10-11 history migration](git-storage-2026-10-11.md), resolve an original revision through the retained commit map before recovery. The original recorded revisions and content hashes above remain unchanged.

To recover:

```sh
original_revision=e3c94c5c22562952cb0dff16e13b4ca56fedaf97
mapped_revision=$(awk -F, -v old="$original_revision" '$1 == old {print $2}' maintenance/history/2026-10-11-lfs-commit-map.csv)
git show "${mapped_revision:-$original_revision}:ORIGINAL_PATH" > /tmp/original-document.md
shasum -a 256 /tmp/original-document.md
```

## Bounded artifact cleanup — 2026-10-10

- **Removed**: 112 disposable directories (29 usage, 36 trace, 47 synthetic fixtures), freeing 3.59 GB across 4,966 files. Local receipts are `.work/sessions/cleanup-verification-2026-10-10/deletion-receipt.json` and `protected-files.json`; they are ignored evidence and are unavailable in a fresh clone.
- **Retained**: Runtime and session contents, historical test runs, DCC backups, trace inputs, and active current viewers.
- **Recurrence prevention**: Usage/trace default builds now use 14-day retention. Tests register fixture teardown. See [tools contract](../../../packages/workshop-tools/README.md).
