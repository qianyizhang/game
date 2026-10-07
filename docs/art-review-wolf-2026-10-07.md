# Greatwood Wolf — second sequential creature conversion

**Scope:** Hearth `wolf` / Greatwood Wolf, registered as `wolf` in the 3D gallery. The existing elder Wolf illustration supplies the pointed ears, canine muzzle, forest coat, pale throat and branching antlers. Living Hydra and Phoenix supply the construction, material, motion and review standard. Their model sources remain unchanged.

The model was authored and reviewed directly, without delegation. Its status is **author-reviewed**; user approval has not been given for this model.

## Brief

A woodland sentry stands with its head raised to listen. The lifted muzzle and antlers lead the gesture; the descending back and relaxed brush tail answer it. Staggered planted paws support the chest, and the hind hocks remain compact. The antlers have unequal branching contours with seated roots. Fur is quiet over the flank, fuller at the throat and short around the fitted face. This is a living fantasy interpretation, not a carved antlered dog or a species reconstruction.

## Revisions and evidence

| Pass                | Observed defect and response                                                                                                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Construction        | The initial antlers dominated a small head; the tight tail curve and visible ear roots weakened the silhouette. Enlarged the head, shortened the antlers, buried the ear roots and relaxed the tail.                                                                                                         |
| Neutral clay        | Neck ridges persisted without texture or cast shadows. The tapered-spine field minimized distance to each bare segment before subtracting its radius. Corrected the minimization to account for changing radius; the repeated ridges disappeared. A causal field/gradient regression now covers this defect. |
| Surface 1–2         | Thin separate throat-fur patches first showed inward faces, then looked like pasted tabs after their winding was corrected. Rejected the separate-patch representation.                                                                                                                                      |
| Surface 3           | Fusing many small locks into the body produced jagged, evenly tiled grooves. Rejected that pattern rather than masking it with texture.                                                                                                                                                                      |
| Surface 4 and final | Replaced the rows with a few broad swept forms, reduced their side relief, and kept the fine coat quiet. The reverse view exposed an overextended rear hock; shortened that bend before final export.                                                                                                        |

Construction evidence is under `test-results/wolf-construction/`, `wolf-clay/` and `wolf-structure2/`. Rejected surface passes are preserved under `wolf-surface1/` through `wolf-surface4/`. Final visual and functional receipts are in `test-results/wolf-final/`; delivery copies and a source hash manifest are in `test-results/wolf-delivery/`. The H.264 preview decodes at 994 × 674 for 6.033 seconds. These generated directories are ignored. `src/art3d/wolf.ts` is the durable model source.

## Construction and motion

One implicit skin connects skull, neck, chest, flank and all four legs. Field-gradient normals describe the large planes without the surface sampling grid. The antler forks form one fused branch surface and follow the fitted head frame. Regional fur coordinates and embedded pigment, normal and packed roughness maps distinguish the short coat, antler and leather nose. Whiskers, lips, recessed eyes and inner ears fit the head.

A ten-bone rig anchors the paws and lower body while the neck/head transition and separate brush tail move. The six-second loop combines a listening head turn, brief blink, ear response and delayed tail movement. The antlers stay attached to the head. This is a planted pose with authored motion, not a gait or a hair/muscle simulation.

Open `/?art=3d&study=wolf`. The original SVG remains beside the model. The standard gallery supports animated GLB, PNG and recorded WebM exports, reduced-motion startup, timeline inspection and phone framing. Layer separation is disabled for the connected model.

## Verification

The complete unit suite passes **271 tests in 42 files**; **8 trace tests** and the production build also pass. Unit coverage includes welded skin closure, finite normalized skin weights, fixed support vertices at the plinth's 0.105-unit top, head/nose and head/antler attachment, moving head and tail, animation bindings, loop endpoints and the corrected tapered-spine field.

The final gallery/shell browser run passes **all 15 checks**, including eight playable video exports, reduced-motion direct links, phone fit, save preservation and Wolf visual captures. Receipts are in `test-results/wolf-final/`. The export check reloads all five living models. For Wolf, the maximum sampled deformed-vertex difference is **5.915e-8 model units**, and maximum animated-node matrix difference is **0**, across two skinned meshes and eleven animated nodes. Identically lit live/exported images were inspected; the coat and antler materials remain present after reimport.

The author inspected the final hero, front, side, reverse, enlarged, phone, neutral clay, silhouette, blink and motion views. These inspections are visual judgments, separate from the automated checks.

`npm run check` stops at the repository-wide formatting gate on concurrently edited `docs/viz.md`. That file was left to its author. Owned-file formatting and the full test/build stages were run separately. The existing large gallery-chunk build warning remains.

**Visual limits:** the coat uses surface maps and simplified broad ruff forms rather than individual hairs. Small facial and paw forms remain stylized. Motion is restrained and all four paws stay planted. Passing technical checks and author review do not establish user approval or equivalence in visual quality to Hydra.
