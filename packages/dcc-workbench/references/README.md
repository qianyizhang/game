# Pilot reference

`hydra-before.png` copies the accepted living Hydra hero view from `test-results/hydra-delivery/hydra-hero.png`. Its original construction remains in `src/art3d/procedural/hydra.ts` and its direction is recorded in `docs/art/art-direction.md`.

It supplies subject identity and the quality reference. The Blender pilot interprets and refines that subject using native DCC construction; it does not import or attempt to reproduce the original geometry pixel for pixel. Different framing and lighting prevent an objective image-quality ranking from these two previews alone.

## Fixed comparison inputs

`comparison/accepted-hydra.glb` is the exact retained accepted-direction export from
`test-results/hydra-delivery/hydra.glb`. `comparison/blender-before.glb` is the Blender pilot
export immediately before the low-neck gesture revision. Neither file is regenerated from
the current source during a comparison build. [The baseline receipt](comparison/baseline.json)
pins their SHA-256 values and source provenance. The original Blender scene is recoverable
from the receipt's Git revision at `packages/dcc-workbench/sources/briar-hydra.blend`.

These assets intentionally add about 40 MiB of persistent comparison inputs. They are
loaded only after entering comparison mode and stay outside disposable-render cleanup.
The current candidate is loaded from `assets/briar-hydra.glb`; publishing it does not alter
the baselines.

`comparison/blender-gesture.glb` preserves the exact delivery after the low-neck gesture edit and before the semantic-component quality pass. [Its receipt](comparison/quality-baseline.json) pins that GLB and the retained editable source snapshot. It powers **Quality before / after**; the earlier pilot remains separately selectable.
