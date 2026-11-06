# Bulk history migration — 2026-10-11

Completed, explicitly authorized history/LFS migration and dependency integration.
Initial cleanup `fce5ad673e2c1281a4a711c9f8a1e753e5219129` maps to
`3c865aaa232f4c905fcc4d7cd670b4a7cd3c8aa4`. The [storage decision](../decisions/0004-native-asset-storage.md)
records the trade-off; later cleanup proceeds through new commits, not another
implicit history rewrite.

## Storage boundary

Historical `.blend`/`.glb` payloads under DCC `sources/`, `subjects/`, `assets/` and
`references/` moved to LFS, along with `assets/**/pose-samples.json` and six historical
canid arrays (`assets/canid/{ash,moss,russet}.json` plus `refined/` counterparts).
The six current small canid receipts returned to ordinary Git. Research results,
reviews, accepted images and other source bytes were preserved. LFS changes transfer
and storage representation; current native assets still require hydration.

## Preservation evidence

| Check                        | Historical result                                                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| History comparison           | 105 original commits / 71,806 file occurrences; paths/modes and nonmigration bytes preserved apart from attributes; author/committer/timestamps/messages/mapped parents matched |
| Signatures                   | Four signed Dependabot originals remain in backup; rewritten commits omit signatures that cannot authenticate changed objects. LFS normalized their final message newlines.     |
| Conversion                   | 37 unique historical blobs / 121,840,709 bytes converted; 92 local historical LFS objects / 462,032,908 bytes passed SHA-256 checks                                             |
| Publication                  | Atomic update of five remote branch tips with exact leases; all 92 historical LFS objects uploaded                                                                              |
| Fresh GitHub clone `0bbc5d6` | Empty independent LFS store hydrated 71 current paths / 58 unique objects; every payload hash and `git lfs fsck` passed; 29 former ordinary-Git bulk blobs absent               |
| Pack transfer at `65d9fb7`   | 118,948,759→81,911,345 bytes, 31.1% smaller; LFS downloads are additional. Conversion totals are not net compressed-clone savings.                                              |

## Original revision lookup

The [commit map](../../../maintenance/history/2026-10-11-lfs-commit-map.csv) preserves
original and migrated full IDs. Frozen reports keep original identifiers:

```sh
original_revision=fce5ad673e2c1281a4a711c9f8a1e753e5219129
mapped_revision=$(awk -F, -v old="$original_revision" '$1 == old {print $2}' maintenance/history/2026-10-11-lfs-commit-map.csv)
git show "${mapped_revision:-$original_revision}:path/to/file"
```

For an old LFS file, fetch its replacement revision with
`git lfs fetch origin "$mapped_revision"`, then pass the pointer through
`git lfs smudge`. A mapped checkout preserves hydrated bytes; exact original Git
object IDs and pre-migration blob-size measurements require the original bundles.

Protected local recovery remains under
`.work/sessions/git-history-cleanup-2026-10-10-01a12657/`:

- `all-branches-before.bundle`: original history.
- `cleanup-main-before.bundle`: first cleanup commit.
- `publication-result.json`, `fresh-github-clone.json`, `final-sync.json`: publication,
  clone and synchronization receipts; the session also holds leases, plans and comparisons.

These are ignored local recovery material, excluded from normal clones. This dated
migration does not authorize deleting them or any other history, source or evidence.

## Dependency integration and CI

Action/runtime dependency branches were integrated before retirement. Their exact
historical versions and the full debugging chronology remain in the
[original record](https://github.com/qianyizhang/game/blob/5b2c0c7541be385fff36e9a1f417520df463ab9a/docs/engineering/history/git-storage-2026-10-11.md).
Current package/lock/workflow configuration owns present pins and CI selection.

| Failure exposed during migration                                                                  | Durable lesson / current owner                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Links passed locally but failed fresh checkout; absent ignored fixture parent                     | Validate links against inventoried files; create fixture parents explicitly. [Maintenance](../maintenance.md) owns checkout/recovery guidance.                                            |
| Hosted geometry took 495s versus 155s locally; nine cases exceeded 15s without assertion failures | Historical budget became 15s local / 60s CI; retain assertions and report environment/runtime separately. Current [checks](../checks.md) owns budgets.                                    |
| Long graphics batches and transient controls obscured useful failures                             | Separate opt-in contact sheets from functional delivery, distribute workload, observe transient controls before triggering; current [testing policy](../testing.md) owns these contracts. |
| Sparse VP9 and actual one-frame Banner recording                                                  | Decode delivered motion instead of file-size/early-seek heuristics; preserve interior poses and final paint before stopping.                                                              |
| Generic deep binary comparison consumed browser budget                                            | Native exact byte comparison retains corruption detection without per-byte matcher overhead.                                                                                              |
| Paused Hydra/native viewers kept drawing                                                          | Retain the framebuffer while paused; invalidate on actual pose/view/resize/control changes, retaining seek/orbit/motion checks.                                                           |

## Completion — 2026-10-11

Both `65d9fb7` and `472a22b` passed all four historical hosted jobs. The
[final full run](https://github.com/qianyizhang/game/actions/runs/38101219712) at
`472a22b` recorded **253 application tests, four simulations, 128 geometry tests,
144 browser passes and eight explicit prerequisite skips**, plus maintained checks.
Those skips establish neither Blender execution nor private-history validation.
The run establishes neither aesthetic acceptance nor verification of later revisions.
