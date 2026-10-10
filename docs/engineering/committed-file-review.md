# Committed-file review

Measured on 2026-10-10 at commit `8545ab0ec670ce40a63a45b698385409a8fbab41` with `npm run maintenance -- files`. The table below preserves the original committed-tree baseline. Canid cleanup subsequently landed as `e04b67e`, removing **16,542,467 JSON bytes / 15.78 MiB** and leaving **24,906,601 JSON bytes / 23.75 MiB** before the selected cleanup below.

## Selected cleanup

The user selected byte-preserving LFS storage for all 13 pose-sample files and source splits for CSS plus both artwork catalogues. The [storage decision](decisions/0004-native-asset-storage.md) records the extended LFS scope. Research results, review receipts, release identities and existing Git history retain their original evidence.

| Owned surface            | Result                                                                                                                                                                                                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pose arrays              | **13 files / 16,375,169 bytes** are staged as **1,704 bytes** of LFS pointers, reducing ordinary-Git blobs in the next tree by **16,373,465 bytes**. Hydrated bytes and every release hash remain unchanged. The early hydration check also diagnoses pose pointers. Historical copies are retained. |
| Shared and Blindside CSS | Global defaults remain in `src/styles.css` (**158 lines**); shared layout moves to `src/app/layout.css` (**892**); Blindside table controls, cards and shop move to their owning UI sheets (**815 / 187 / 155**). Declarations are preserved per selector and media condition.                       |
| Blindside art            | `Artwork.tsx` remains a **6-line** entry point; `art/` owns joker, consumable, boss, card and primitive modules, each below 650 lines.                                                                                                                                                               |
| Spire art                | `AbilityArt.tsx` remains a **51-line** renderer; `art/` owns primitives (**510 lines**) and Ironclad scenes (**648**). Silent scenes keep their existing homes.                                                                                                                                      |

These source splits improve ownership/navigation; they do not promise lower total source bytes. All **604 standalone SVGs** matched the original exported bytes after the split. `maintenance -- files` measures the selected committed tree and excludes index/worktree edits; the baseline above deliberately records the tree before this cleanup. The initial adoption preserves existing history and hydrated disk storage.

## Cleanup verification

- **Maintained gate:** `npm run check:full` passed formatting, lint, types, Python checks, 81 tool tests, 52 DCC tests, inventory checks for 511 managed sources and the production build. The existing usage-server test was skipped because sandbox loopback binding was unavailable.
- **Application and geometry:** The same full gate passed 253 application tests, four seeded simulations and 127 geometry tests across 28 files. Browser and native checks are separate evidence.
- **Preserved artwork:** Compared the exported asset manifests and all 604 SVG files before and after the split; every byte matched.
- **Preserved CSS:** In 14 sampled desktop/phone views, replacing the new sheets with the original stylesheet on the same DOM produced no computed-style changes. Ten screenshots were byte-identical; four Blindside screenshots had small pixel differences, so the evidence does not establish universal pixel identity.
- **LFS recovery:** Verified each staged pointer against its original payload size and SHA-256, checked the local objects and hydrated working files, then hydrated all 13 paths from 12 unique objects in a fresh disposable repository with an independent LFS store. Every payload hash matched and `git lfs fsck --objects` passed. This used local object copies, with no remote transfer.
- **Affected browser journeys:** 21 passed across shell navigation, all three games, collection artwork, standalone SVG loading, native downloads and lazy study loading. One sealed-candidate comparison was explicitly skipped because `DCC_SAVED_CANDIDATE` was not supplied. Native Blender authoring was not rerun; this pass preserves its source and release payload bytes.

Local verification artifacts live under `.work/sessions/file-cleanup-2026-10-10-01a12657/`, including `svg-comparison.json`, `cascade-comparison.json`, `browser-comparison.json`, `lfs-verification.json`, `lfs-hydration.json` and gate logs. Remote availability of the new LFS objects remains unverified.

## Findings

| Measure                          | Committed baseline                                   |
| -------------------------------- | ---------------------------------------------------- |
| Files                            | **1,117**                                            |
| Git blob bytes, summed per path  | **127,648,234 bytes / 121.73 MiB**                   |
| JSON                             | **240 files / 41,449,068 bytes / 39.53 MiB / 32.5%** |
| LFS                              | **58 pointers / 468,991,537 declared payload bytes** |
| Size or line review signals      | **131 files**, including intentionally kept evidence |
| Identical blobs at least 256 KiB | **0 groups**                                         |

LFS payload bytes are separate from Git blob bytes. Physical lines include blank lines; they are not semantic code LOC. The tool ranks one committed tree, so it does not measure historical Git growth or compressed clone size. File length is a review signal, not proof that a file is unnecessary.

## Prioritized decisions

| Candidate                                                                                        | Observed bytes and lines                                                                        | Recommendation and reason                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assets/canid/refined/{ash,moss,russet}.json` in the DCC package                                 | **15,575,644 bytes total / 177,394 lines each**                                                 | **Simplify the delivery contract.** Ten clips per character embed sampled geometry; these samples alone occupy about 6.0 MB when compactly encoded across all three files. Separate small receipts and motion metadata from temporary native-verification arrays. This is the strongest producer/consumer change to pursue.                          |
| Published `pose-samples.json` files in the DCC package                                           | **13 files / 16,375,169 bytes total**; largest Phoenix file **5,406,726 bytes / 208,207 lines** | **Review future storage and sampling.** These are hash-pinned release outputs used by native/Three comparison contracts. Keep frozen release bytes; design a smaller future sample format or deliberate storage migration with recovery. Splitting existing JSON into more files would not reduce total bytes.                                       |
| [Recruitment experiment evidence](../research/experiments/2026-10-04-hearth-recruitment-v2.json) | **2,618,227 bytes / 69,598 lines**                                                              | **Keep frozen evidence.** The accompanying report explicitly preserves manifests, source/configuration hashes, per-run outcomes and audit hashes for 1,200 lobbies. Future studies can keep a small readable summary beside bulk cohort data; removal would weaken the existing study's provenance.                                                  |
| Wolf release `evidence/baseline-root-intersections.json`                                         | **1,419,013 bytes / 109,245 lines**                                                             | **Simplify future diagnostics.** The `rows` field dominates; the entire document has an estimated compact size of 329,346 bytes. Keep the accepted baseline, and consider a small finding summary plus separately stored detail for future releases. Formatting alone changes evidence hashes and does not establish obsolescence.                   |
| [Shared application styles](../../src/styles.css)                                                | **36,265 bytes / 2,160 lines**                                                                  | **Split by ownership when editing.** The file includes application/sidebar chrome and Blindside board, joker and shop selectors, while Spire and Battlegrounds already own separate stylesheets. Extract shared shell styles and Blindside styles while preserving import/cascade order. This improves navigation, with little expected byte saving. |
| [Blindside artwork catalogue](../../src/games/balatro/ui/Artwork.tsx)                            | **44,657 bytes / 1,370 lines**                                                                  | **Consider a family split; keep the art.** The module exposes suit, joker, consumable, boss and poker art and contains a large motif catalogue. Split by those families if editing becomes difficult; a long catalogue does not imply algorithmic complexity.                                                                                        |
| [Spire ability art](../../src/games/spire/ui/AbilityArt.tsx)                                     | **35,407 bytes / 1,149 lines**                                                                  | **Low-priority split review.** Much of the file is shared drawing primitives and an authored scene table. Separate primitives/scenes only if it makes the public renderer easier to maintain; preserve the rendered catalogue.                                                                                                                       |
| Dependency lockfiles                                                                             | Included in all-file rankings                                                                   | **Keep.** They are generated dependency authority. Manual splitting or pruning because of line count would damage reproducibility.                                                                                                                                                                                                                   |

The refined canid receipts and published pose files together account for **31,950,813 bytes / 77.1% of all JSON bytes** in this snapshot. This concentration makes generated geometry diagnostics a better first target than broad source-file splitting.

## Caller evidence

These caller checks used the same baseline commit as the byte metrics. File links open the current working copy; use `git show 8545ab0:<path>` to recover the exact inspected source.

- **Canid playback:** [canid assets](../../packages/dcc-workbench/src/canid-assets.ts) imports `.motions.json` and GLBs. The player already has a smaller metadata surface.
- **Canid verification at the baseline:** [delivery verification](../../packages/dcc-workbench/canid.ts) read full receipts and checked `receipt.clips`; [browser native comparison](../../tests/browser/canid-evidence.ts) imported the large JSON files and consumed `clip.samples`. Commit `e04b67e` replaced these committed arrays with on-demand native samples and kept small delivery metadata.
- **Published samples:** [release sealing](../../packages/dcc-workbench/releases.ts) records the pose filename and SHA-256; [saved-export contracts](../../packages/dcc-workbench/contracts.ts) validate native samples; [native browser verification](../../tests/browser/native-assets.spec.ts) compares candidate pose samples against delivered geometry. These establish a real purpose for the format, although lifetime/storage can still be reconsidered.
- **Research evidence:** [the recruitment report](../research/experiments/2026-10-04-hearth-recruitment-v2.md) explicitly links the JSON as machine-readable frozen evidence and describes its source pins and denominators.
- **Stylesheet ownership:** [the app entry](../../src/main.tsx) imports the shared sheet together with already separated Spire and Battlegrounds sheets; the shared sheet contains shell and Blindside selectors. Preserve cascade order during any extraction.

## Repeat the audit

```sh
nvm use
npm run maintenance -- files --top 20
npm run maintenance -- files --ref 8545ab0 --json
npm run maintenance -- files --min-bytes 1048576 --min-lines 1500
```

The [tool contract](../../packages/workshop-tools/README.md#committed-file-size-audit) defines thresholds, streaming, JSON estimates, duplicate accounting and interpretation limits. The full first-run inventory and Markdown rankings are retained locally under `.work/sessions/committed-file-audit-2026-10-10-01a12657/`; generated inventories stay outside Git. No deletion or history rewrite was performed by this audit.
