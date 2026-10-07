# Briar Hydra DCC asset record

**Status:** author-reviewed; user approval is unrecorded. This is a separate Blender interpretation of the existing Hydra, not a replacement for the accepted procedural model.

## Source and delivery

The [DCC workflow](../../../packages/dcc-workbench/README.md) owns the editable `.blend`, animated GLB and [published receipt](../../../packages/dcc-workbench/assets/manifest.json). The receipt is the authority for hashes, dimensions, joint counts and source-level audits. The current delivery has 102,181 triangles, 22 joints and a six-second Marsh Vigil action.

The retained [reference description](../../../packages/dcc-workbench/references/README.md) explains the original Hydra reference. Different framing and lighting prevent an objective quality ranking from those pictures.

## Consequential revisions

- Rounded skulls and bead-like throat plates were replaced with subdivided skull cages, recessed eyes, a wider central gape and fitted throat shells.
- Pigment and scale relief were baked from editable native graphs. Browser lighting was reduced after an initial washed-out review.
- An exposed coil cap was buried into the shoulder saddle before remeshing. The final source and exported clay review no longer showed that planar cap.
- Simplification belongs to the delivery copy. The source retains curves, editable meshes, finishing modifiers, packed images, the armature and action.

## Evidence and limits

The 2026-10-07 pilot review recorded five pipeline and six browser checks passing. Its independent Blender/Three.js comparison covered 64 vertices at five times, with maximum sampled position difference 1.11001 × 10⁻⁶ model units. These are historical observations, not a substitute for fresh validation after changes.

Historical captures and comparison JSON remain under ignored `test-results/dcc-pilot/final-browser/`; neutral source renders remain under `test-results/dcc-pilot/native/`. They are protected, unclassified evidence. Missing local evidence must be reported as unavailable, not recreated and described as the historical run.

The exporter emitted NumPy floating-point warnings. Finite numeric accessor, weight, loop and pose checks bounded the published result; they did not explain the warning. The pilot is not hand-retopologized production topology or a mobile performance benchmark. The heads are stylized, the crest sparse and the motion restrained. Construction guides do not regenerate the remeshed skin automatically; changes to procedural graphs or UVs require explicit re-baking.

The original pilot also reported repository-wide formatting and Banner Bearer geometry failures. Current maintenance and application gates report their own results; this asset record makes no claim that the whole repository is green.

## Maintenance migration verification — 2026-10-07

The typed native/CLI migration re-exported the existing artist source without resaving it. The `.blend`, brief, GLB, authoring audit and pose samples remain byte-identical to the preceding delivery. The new receipt pins migrated code and the exact [preceding receipt](../../../packages/dcc-workbench/assets/receipts/872fbf5a08a52abb13b93d8cc92233625cc86b6faa02adf858b95add4913344f.json). Previous delivery bytes and source backups remain protected.

Fresh checks passed: eight Python contract tests, seven DCC pipeline tests, 390 application/geometry tests, four seeded simulation checks and three DCC browser cases. The browser again compared 64 vertices at five times, with maximum sampled error 1.11001 × 10⁻⁶ model units. Captures and comparison JSON are under `test-results/migration-2026-10-07/typed-dcc-browser/`. Desktop, phone and clay captures were inspected; this maintenance verification does not change approval status.

Four fresh native views match the preceding review's PNG headers and decompressed scanlines exactly. The evidence directory `test-results/disposable/dcc-review-20261007T112602Z-e6f9c0457f7c4dd99cdc06676bf1eda5/` is pinned against automatic pruning. The isolated builder smoke test created a separate source and valid export; it did not replace the artist source and is not evidence of byte-deterministic rebuilds.
