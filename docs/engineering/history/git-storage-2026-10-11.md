# Bulk history migration — 2026-10-11

The user requested committed cleanup, smaller fresh clones, integrated dependency updates and working GitHub CI. The initial cleanup commit was `fce5ad673e2c1281a4a711c9f8a1e753e5219129`; its migrated replacement is `3c865aaa232f4c905fcc4d7cd670b4a7cd3c8aa4`. This record extends the [native storage decision](../decisions/0004-native-asset-storage.md).

## Storage boundary

- **Historical native assets:** Existing `.blend` and `.glb` patterns under DCC `sources/`, `subjects/`, `assets/` and `references/` now apply throughout migrated history.
- **Historical pose arrays:** `assets/**/pose-samples.json` and six exact canid paths (`assets/canid/{ash,moss,russet}.json` and their `refined/` counterparts) retain their payload bytes through LFS. The six current small canid receipts and their future metadata remain in ordinary Git.
- **Other evidence:** Research results, review receipts, accepted images and source files retain their ordinary-Git content. This migration does not delete payloads or edit frozen experiment identifiers.
- **Clone cost:** Moving historical payloads to LFS removes them from ordinary Git history transfer. Current native assets still need hydration; LFS changes storage and download timing, not their size.

## Preservation evidence

The isolated migration compared **105 original commits / 71,806 file occurrences**. Every file path and mode matched; content outside the migration patterns was unchanged apart from `.gitattributes`. Each migrated payload retained its original SHA-256 and size. Authors, committers, timestamps, message text and mapped parent relationships matched. Git LFS normalized the final message newline on four Dependabot commits.

The four signed Dependabot commits retain their signed originals in the backup. Their rewritten versions omit the old signature headers, which cannot authenticate a changed commit; this repair preserved every file tree and updated descendant parents and the revision lookup.

The conversion covered **37 unique historical blobs / 121,840,709 bytes**. All **92 local historical LFS objects / 462,032,908 bytes** passed SHA-256 verification. Restoring current small metadata to ordinary Git follows the conversion, so these figures describe migrated historical payloads rather than net compressed clone savings.

Original Git history is retained locally in `.work/sessions/git-history-cleanup-2026-10-10-01a12657/all-branches-before.bundle`; the separate `cleanup-main-before.bundle` records the first cleanup commit. These backups are excluded from normal clones. The same session contains branch-tip leases, the migration plan, complete comparison receipts and clone measurements. It does not authorize pruning other local history or evidence.

## Original revision lookup

The [commit map](../../../maintenance/history/2026-10-11-lfs-commit-map.csv) retains original and migrated full IDs. Frozen reports keep their original identifiers. Resolve one before reading its replacement:

```sh
original_revision=fce5ad673e2c1281a4a711c9f8a1e753e5219129
mapped_revision=$(awk -F, -v old="$original_revision" '$1 == old {print $2}' maintenance/history/2026-10-11-lfs-commit-map.csv)
git show "${mapped_revision:-$original_revision}:path/to/file"
```

For a historical LFS file, fetch its replacement revision with `git lfs fetch origin "$mapped_revision"` and pass its pointer through `git lfs smudge` to recover the payload. Exact original Git object IDs and pre-migration blob-size measurements require the retained bundle. A mapped checkout preserves hydrated file bytes, while its storage representation and Git commit IDs differ.

## Dependency integration and CI

The original three action branches supply pinned updates for checkout 7.0.1, upload-artifact 7.0.1 and setup-uv. The development branch supplies React plugin 6.1.2, Vite 8.3.3 and Vitest 5.0.3. Their histories are merged into migrated main before branch retirement. Three subsequent Dependabot branches update upload-artifact to 7.0.2, setup-node to 7.1.0 and setup-uv to 10.2.0, retaining the workflow's pinned runtime versions and inputs.

TypeScript remains **6.0.3** because the current `typescript-eslint` 8.71.1 peer range is `>=4.8.4 <6.1.0`. Node types remain **24.19.1** to match the pinned Node 24 runtime. Dependabot ignores versions beyond those compatibility ceilings; change the compiler ceiling together with its parser when validating a future upgrade.

The existing GitHub maintenance job failed on links to ignored local cleanup receipts. The history document now names them as local code-formatted paths, and the link checker rejects locally present targets outside the repository inventory. A regression exercises this exact failure class. Push checks run on main; pull requests retain their checks without duplicate branch-push runs.

The subsequent clean-checkout run exposed a scaffold test that assumed the ignored `test-results/` directory existed. That test now creates its parent directory before allocating its temporary fixture; retained local evidence is untouched.

The first complete hosted geometry run passed 118 of 127 tests; the other nine exceeded 15 seconds, without assertion failures. Its 495-second suite runtime was 3.2 times the local 155-second runtime. Geometry now uses a single project budget of 15 seconds locally and 60 seconds in CI, with redundant per-test overrides removed. Worker limits, assertions and application timeouts retain their existing values.

Browser CI stops at its first failed case so diagnostics and artifacts survive before repeated journeys consume the job limit. It runs independently of maintenance for faster feedback; both jobs remain required for a successful workflow, and successful browser runs retain the full selected test matrix.

The hosted graphics trace rendered Nightjar correctly but exhausted the default test budget during contact-sheet screenshots and orbit dragging; scene readiness also nearly consumed the five-second assertion budget. Browser operation limits now have a four-times CI margin through a shared budget helper. Contact-sheet generation remains available in the opt-in `visual-review` project. Functional CI retains every asset's loading, motion, phone layout and export checks, with a reduced-motion rigid representative protecting pointer orbit independently of animation.

The subsequent functional run passed 29 cases in 43.9 minutes before Banner Bearer's first-frame readiness exceeded 20 seconds. Its failure image shows the rendered subject, and the trace has no application or load error. Scene readiness now has its own bounded 15-second local / 60-second CI budget. Contiguous test sharding would place all 29 long asset journeys on one runner, so round-robin tags distribute 9–10 to each of three runners; individual-case sharding distributes the other 123 cases evenly. Each runner retains one worker, every assertion and a distinct failure artifact. This preserves all 152 selected cases while avoiding a single graphics runner's accumulated suite time.

That balanced run passed every asset journey and exposed two later failures. Catalyst's 10,759-byte VP9 had three decoded frames at 0, 2.852 and 3.801 seconds, so a 20 KB threshold and early 0.5/1.5-second seeks were poor motion contracts. Video checks now decode actual presented frames independently of the active WebGL scene, retaining dimensions and requiring multiple frames with changed pixels. Hydra's paused comparison continuously redrew both heavy panels; it now retains the framebuffer until its pose, camera, surface, pair, size or orbit controls change, and continues drawing during playback. Its full matched-view journey retains its assertions and review captures.

The next run passed all four video exports and Hydra's full comparison, then exposed a canid test waiting for a transient pause button after a 0.95-second action had finished between automation calls. Completion, hold and replay assertions remain; replay observation starts before clicking, and phase selection pauses at a defined pose, whose rendered time and hold are checked. The slow-frame regression starts and measures playback in one browser task to exclude protocol latency and still rejects a renderer that discards elapsed time. A local rerun also caught the development server reloading a newly exported SVG cabinet during decoding; a bounded retry verifies the complete current image count and every decode instead of accepting an empty or partial document.

Shared functional journeys now run before each worker's bulk asset batch for earlier failure diagnostics. Successful runs retain the same 152-case selection and all 29 asset journeys. Locally, the affected 41-case group passed 38 cases with three explicit native-fixture skips; the final replay/clock cases passed, and deliberate 50 ms delta clamping made the clock regression fail at 0.100 seconds against its greater-than-0.160-second requirement.

Publication requires uploading the historical LFS objects, exact leases for each rewritten remote branch and verification of the final main revision. Local tests and storage checks do not establish successful remote CI; its run and fresh-clone receipts are separate session evidence.
