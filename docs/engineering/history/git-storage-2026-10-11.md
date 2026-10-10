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

Publication requires uploading the historical LFS objects, exact leases for each rewritten remote branch and verification of the final main revision. Local tests and storage checks do not establish successful remote CI; its run and fresh-clone receipts are separate session evidence.
