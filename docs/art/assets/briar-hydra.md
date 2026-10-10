# Briar Hydra DCC asset record

**Status:** Author-reviewed Blender interpretation of the Hydra asset (study `hydra`), maintained alongside the accepted procedural reference.

## Source and delivery

The [DCC workflow](../../../packages/dcc-workbench/README.md) manages the authoritative `.blend`, animated GLB, and [manifest](../../../packages/dcc-workbench/assets/manifest.json). Delivery specifications: **108,940 triangles**, **22 joints**, and the 6-second **Marsh Vigil** idle clip. Reference details are in [references](../../../packages/dcc-workbench/references/README.md).

## Consequential revisions

- **Head & Throat:** Replaced rounded skulls with subdivided cages, recessed eyes, wider central gape, and fitted throat shells.
- **Surface Materials:** Baked native procedural graphs for skin pigment and scale relief. Orientated scale geometry against source-skin normals to fix inward-facing faces.
- **Shoulder Integration:** Buried the exposed coil cap into the shoulder saddle prior to remeshing.
- **Scale Projections:** Isolated scale projection rays to their respective neck regions to prevent cross-neck vertex dragging during deformation.

## Matched comparison and low-neck revision (2026-10-07)

Available at `/?workbench=dcc&compare=hydra` via [baseline receipt](../../../packages/dcc-workbench/references/comparison/baseline.json) ([workflow](../../../packages/dcc-workbench/README.md#matched-hydra-comparison)).

- **Gesture adjustment:** Lower searching neck angled forward and down using Euler offsets:
  - `Neck.1.1`: `(0.0528920, -0.0974008, 0.1300597)`
  - `Neck.1.2`: `(0.0608560, -0.0522891, 0.2087161)`
  - `Neck.1.3`: `(0.1081513, 0.0589239, 0.0750418)`
- Offset applies across all keyframes; anchor points remain static with zero drift.

## Semantic head assemblies and control range

The authoring model provides three native head modules (**Scent**, **Search**, **Guard**) via [head authoring workflow](../../../packages/dcc-workbench/README.md#edit-a-head-in-blender):

- **Controls:** Muzzle reach, cranial taper, crown depth, and horn sweep driving 51 fitted meshes across 612 driven shape keys.
- **Control range:** Corrected shape-key clamp limit from 1.0 to 1.5 across all controls. Export rejects mismatches between displayed settings and evaluated shapes.
- **Validation:** Muzzle control adjustments alter evaluated skulls by 0.158–0.183 units and restore with zero residual error.
- **Baseline tracking:** Retained under [quality baseline](../../../packages/dcc-workbench/references/comparison/quality-baseline.json).

## Verification and delivery receipts

- **Receipt:** Pinned by [receipt `872fbf5a08a5`](../../../packages/dcc-workbench/assets/receipts/872fbf5a08a52abb13b93d8cc92233625cc86b6faa02adf858b95add4913344f.json). Delivery model is 10,421,936 bytes (108,940 triangles, 22 joints).
- **Checks:** Passes 11 Python contract tests, 8 DCC pipeline tests, 390 application tests, and 4 simulations.
- **Pose agreement:** Blender-to-Three.js comparison of 64 vertices across 5 timestamps yields max position difference of `8.89538e-7` model units.
- **Receipt details:** Consolidated in [test audit receipt](../../engineering/test-audit-2026-10-07.md#verification-receipt).
