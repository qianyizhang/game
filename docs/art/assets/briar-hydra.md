# Briar Hydra DCC asset record

**Status:** author-reviewed; user approval is unrecorded. This is a separate Blender interpretation of the existing Hydra, not a replacement for the accepted procedural model.

## Source and delivery

The [DCC workflow](../../../packages/dcc-workbench/README.md) owns the editable `.blend`, animated GLB and [published receipt](../../../packages/dcc-workbench/assets/manifest.json). The receipt is the authority for hashes, dimensions, joint counts and source-level audits. The current delivery has 108,940 triangles, 22 joints and a six-second Marsh Vigil action.

The retained [reference description](../../../packages/dcc-workbench/references/README.md) explains the original Hydra reference. Different framing and lighting prevent an objective quality ranking from those pictures.

## Consequential revisions

- Rounded skulls and bead-like throat plates were replaced with subdivided skull cages, recessed eyes, a wider central gape and fitted throat shells.
- Pigment and scale relief were baked from editable native graphs. Browser lighting was reduced after an initial washed-out review.
- An exposed coil cap was buried into the shoulder saddle before remeshing. The final source and exported clay review no longer showed that planar cap.
- Simplification belongs to the delivery copy. The source retains curves, editable meshes, finishing modifiers, packed images, the armature and action.

## Evidence and limits

The 2026-10-07 pilot review recorded five pipeline and six browser checks passing. Its independent Blender/Three.js comparison covered 64 vertices at five times, with maximum sampled position difference 1.11001 × 10⁻⁶ model units. These are historical observations, not a substitute for fresh validation after changes.

Historical captures and comparison JSON remain under ignored `test-results/dcc-pilot/final-browser/`; neutral source renders remain under `test-results/dcc-pilot/native/`. These selected views and comparison records were retained during lean cleanup; duplicate downloaded assets and earlier test runs were removed. Missing local evidence must be reported as unavailable, not recreated and described as the historical run.

The exporter emitted NumPy floating-point warnings. Finite numeric accessor, weight, loop and pose checks bounded the published result; they did not explain the warning. The pilot is not hand-retopologized production topology or a mobile performance benchmark. The heads are stylized, the crest sparse and the motion restrained. Construction guides do not regenerate the remeshed skin automatically; changes to procedural graphs or UVs require explicit re-baking.

The original pilot also reported repository-wide formatting and Banner Bearer geometry failures. Current maintenance and application gates report their own results; this asset record makes no claim that the whole repository is green.

## Maintenance migration verification — 2026-10-07

The typed native/CLI migration re-exported the existing artist source without resaving it. The `.blend`, brief, GLB, authoring audit and pose samples remain byte-identical to the preceding delivery. The new receipt pins migrated code and the exact [preceding receipt](../../../packages/dcc-workbench/assets/receipts/872fbf5a08a52abb13b93d8cc92233625cc86b6faa02adf858b95add4913344f.json). The earlier delivery bytes equal the current published asset/audit/poses, so their redundant archive was retired. The original receipt stays tracked. The user retained the later pilot backup at `test-results/dcc-backups/briar-hydra-1791340517816.blend` and retired the earlier one.

Fresh checks passed: eight Python contract tests, seven DCC pipeline tests, 390 application/geometry tests, four seeded simulation checks and three DCC browser cases. The browser again compared 64 vertices at five times, with maximum sampled error 1.11001 × 10⁻⁶ model units. Captures and comparison JSON are under `test-results/migration-2026-10-07/typed-dcc-browser/`. Desktop, phone and clay captures were inspected; this maintenance verification does not change approval status.

Four fresh native views match the preceding review's PNG headers and decompressed scanlines exactly. The evidence directory `test-results/disposable/dcc-review-20261007T112602Z-e6f9c0457f7c4dd99cdc06676bf1eda5/` is pinned against automatic pruning. The isolated builder smoke test created a separate source and valid export; it did not replace the artist source and is not evidence of byte-deterministic rebuilds.

## Matched comparison and low-neck revision — 2026-10-07

The workbench now offers a lasting Hydra comparison at `/?workbench=dcc&compare=hydra`.
It preserves the accepted procedural GLB and pre-revision Blender GLB as fixed inputs,
with hashes and the original Blender-source Git revision in the
[baseline receipt](../../../packages/dcc-workbench/references/comparison/baseline.json).
Both pairs share camera, lighting, exposure, model-unit scale, ground alignment and time.
[The workflow](../../../packages/dcc-workbench/README.md#matched-hydra-comparison) documents
framing, controls and limits. User acceptance of the Blender interpretation remains
unrecorded.

**Observed:** front and side clay views showed the Blender pilot's low head participating
in a comparatively upright fan of necks. The procedural reference's necks have more varied
curvature and reach. This observation supports a gesture experiment, not a claim that the
entire procedural model is objectively better.

**Revision:** redirect the low searching neck forward and down through three middle-joint
rotation offsets across the existing six-second action. The native local XYZ Euler offsets
in radians are `Neck.1.1 = (0.0528920, -0.0974008, 0.1300597)`,
`Neck.1.2 = (0.0608560, -0.0522891, 0.2087161)`, and
`Neck.1.3 = (0.1081513, 0.0589239, 0.0750418)`. The offsets apply equally to every existing
key, preserving its motion and loop endpoints. Skin, head, teeth and throat details follow
the existing rig. Mesh geometry, skin weights and materials were not edited; the coil
anchor stays fixed. The saved `.blend` is authoritative. At this stage the construction recipe
did not include the artist edit; the subsequent quality pass incorporated it into fresh builds.

**Author assessment:** the low head now visibly searches below the other two, separating its
role in front and side views. This is a bounded improvement to gesture. The broad simplified
skulls, regular throat bands, sparse crest and restrained animation remain material limits;
this revision does not settle the overall visual comparison or establish superiority of
Blender as a tool.

The native audit still reports 7,725 fixed vertices, zero sampled anchor drift and zero loop
endpoint difference. Delivery remains 102,181 triangles, 22 joints and a six-second clip.
Fresh comparison captures and verification evidence are retained under
`test-results/hydra-comparison/`; the original pilot evidence remains historical.

**Verification:** the maintained gate passes (formatting, typed lint, TypeScript, Python,
tooling, eight DCC tests, inventory and production build). The full application gate also
passes: 390 unit/geometry tests and four seeded simulations. Eight browser cases pass across
the comparison, existing DCC workbench and shell. The independent Blender-to-Three.js check
covers 64 vertices at five times; maximum sampled position difference is
`1.1100098638893633e-6` model units. Front, side, rear, portrait, clay, material and phone
captures were inspected. The first comparison test attempt had an overly strict button
locator and a route interception that also blocked Vite's asset import; both test-harness
issues were corrected without weakening application assertions.

Logs and final browser captures are under `test-results/hydra-comparison/final-browser/`
and `test-results/hydra-comparison/check.log`. The four native views are pinned at
`test-results/disposable/dcc-review-20261007T134809Z-364d6d64432744a99f455d28c1dac5ce/`.
These checks establish technical behavior and the recorded review, not user approval.

## Semantic head modules and quality pass — 2026-10-07

The user requested better Blender artwork and a long-term workflow for maintainable assets
that can be created and edited fluently. The [authoring workflow](../../../packages/dcc-workbench/README.md#edit-a-head-in-blender)
now exposes three native head assemblies: **Scent, Search and Guard**. Each has four shared
shape controls—muzzle reach, cranial taper, crown depth and horn sweep—driving 51 fitted
meshes. Shape keys and drivers remain in the editable source. Export bakes their saved mix
only in the delivery copy. The low searching gesture remains intact.

The heads have longer, tapered muzzles, fuller cranial planes and more backward-swept horns.
Three surface-fitted scale patches add medium-scale detail to the upper neck flanks and
backs. Broad shoulders and the coil remain quiet. This is an author-reviewed improvement
in proportion and surface hierarchy; the coil, regular throat bands and repeated scale
rhythm remain simpler than the accepted procedural reference. User approval is still
unrecorded.

The implementation separates a pure anatomical deformation interface from native Blender
installation and skin-fitted scale construction. The head module is already reused across
three roles. Its current installer knows the Hydra rig, head frames and material names;
reuse on another creature requires an explicit adapter. This is not a general character
generator, retopology system or proof that all future edits will be effortless. The scale
patches are editable meshes with recipe-controlled density, not live parametric sliders.

Two review failures were corrected before delivery:

- Projection rays originally reached neighboring necks, creating stretched spikes during
  deformation. Each patch now projects only onto its own skin region and rejects sibling
  neck weights.
- Native/material rendering concealed inward scale faces. Browser single-sided clay exposed
  them. The generator now orients each closed scale against its source-skin normal; the final
  clay export was inspected from the side and rear.

The exact preceding gesture-only source and GLB are retained, pinned by the
[quality baseline](../../../packages/dcc-workbench/references/comparison/quality-baseline.json).
The comparison has three selectable pairs: accepted direction, the original Blender pilot,
and the gesture-only baseline, each against the current candidate. Baselines are never
regenerated when the current source changes.

**Native edit evidence:** the muzzle control changed each evaluated skull by a maximum of
0.158–0.183 model units in the sampled test; restoring the setting produced zero sampled
error. The three heads retained their existing animation, and the source’s coil audit still
reports zero sampled anchor drift and loop endpoint difference. A separate fresh recipe
build succeeded without replacing the artist source. Logs are under
`test-results/hydra-components/control-audit.log` and `fresh-build-final.log` in the same directory.

**Delivery:** 10,422,040 bytes, 108,940 triangles, 22 joints, one six-second animation. Five
focused browser cases pass, including downloads, preserved saves, matched controls, reduced
motion, failed loading and independent source/export pose agreement. The latter covers 64
vertices at five times; maximum sampled difference is `8.707768411519273e-7` model units.
Final captures are under `test-results/hydra-components/verified-browser/`. Native views are
pinned at `test-results/disposable/dcc-review-20261007T142755Z-241ca48a284b49d7a492d68e9063da95/`.

**Check scopes:** the final maintenance gate passes formatting, typed lint, TypeScript,
13 Python files, 11 Python contract tests, tool/pipeline tests, inventory checks and the
production build. The full application gate also passed during this pass: 361 tests across
63 files and four seeded simulations. The final native face-orientation correction and
workbench copy were subsequently covered by the repeated maintenance and five focused
browser cases. Logs are `test-results/hydra-components/maintenance-final.log` and `check.log`.

## Control-range correction — 2026-10-07

Native inspection found that the head controls advertised a 0–1.5 range while their driven
shape keys retained Blender's default maximum of 1.0. Values above 1.0 were silently clamped:
Search's muzzle reach displayed 1.3 but evaluated as 1.0. The earlier edit check established
movement and restoration, but did not check the upper part of the advertised range.

The source and installer now use matching 0–1.5 limits for all 612 driven keys across the
153 fitted meshes. Export rejects a mismatch between a displayed head setting and its
evaluated shape. Native validation rejected the unrepaired source, then verified each of
the twelve controls at 0, 1.3, 1.5 and its restored setting. The prior source is preserved at
`test-results/worktree-review-2026-10-07/source-before-control-fix.blend`; the prior delivery
remains in the receipt chain. Baseline comparison assets retain their original bytes.

The corrected delivery is 10,421,936 bytes with the same 108,940 triangles, 22 joints and
six-second action. The higher authored settings now take effect; this corrects control
behavior and does not imply new user approval. Native audit, repair and export logs are
under `test-results/worktree-review-2026-10-07/`.

The corrected delivery passed independent browser pose comparison at 64 vertices and five
times, with maximum sampled error `8.895381492067855e-7` model units. Side/rear clay,
portrait material and phone captures were inspected. The full repository gate passed;
the [combined review receipt](../../engineering/test-audit-2026-10-07.md#verification-receipt)
records the selected browser checks and the corrected test locator. Direct comparison exit
now clears its URL state, restores table focus and reopens the ordinary workbench.
