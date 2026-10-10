# Greatwood Wolf asset record

**Status:** author-reviewed; user approval is unrecorded. Authored and reviewed directly.

**Scope:** Hearth `wolf` / Greatwood Wolf, registered as `wolf` in the 3D gallery. The existing elder Wolf illustration supplies the pointed ears, canine muzzle, forest coat, pale throat and branching antlers. Living Hydra and Phoenix supply the construction, material, motion and review standard. Their model sources remain unchanged.

## Brief

A woodland sentry stands with its head raised to listen. The lifted muzzle and antlers lead the gesture; the descending back and relaxed brush tail answer it. Staggered planted paws support the chest, and the hind hocks remain compact. The antlers have unequal branching contours with seated roots. Fur is quiet over the flank, fuller at the throat and short around the fitted face. This is a living fantasy interpretation, not a carved antlered dog or a species reconstruction.

## Consequential revisions

| Pass                | Observed defect and response                                                                                                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Construction        | The initial antlers dominated a small head; the tight tail curve and visible ear roots weakened the silhouette. Enlarged the head, shortened the antlers, buried the ear roots and relaxed the tail.                                                                                                         |
| Neutral clay        | Neck ridges persisted without texture or cast shadows. The tapered-spine field minimized distance to each bare segment before subtracting its radius. Corrected the minimization to account for changing radius; the repeated ridges disappeared. A causal field/gradient regression now covers this defect. |
| Surface 1–2         | Thin separate throat-fur patches first showed inward faces, then looked like pasted tabs after their winding was corrected. Rejected the separate-patch representation.                                                                                                                                      |
| Surface 3           | Fusing many small locks into the body produced jagged, evenly tiled grooves. Rejected that pattern rather than masking it with texture.                                                                                                                                                                      |
| Surface 4 and final | Replaced the rows with a few broad swept forms, reduced their side relief, and kept the fine coat quiet. The reverse view exposed an overextended rear hock; shortened that bend before final export.                                                                                                        |

Rejected surface passes are preserved under `wolf-surface1/` through `wolf-surface4/`. The H.264 preview decodes at 994 × 674 for 6.033 seconds. These generated directories are ignored. `src/art3d/procedural/wolf.ts` is the durable model source.

## Construction and motion

One implicit skin connects skull, neck, chest, flank and all four legs. Field-gradient normals describe the large planes without the surface sampling grid. The antler forks form one fused branch surface and follow the fitted head frame. Regional fur coordinates and embedded pigment, normal and packed roughness maps distinguish the short coat, antler and leather nose. Whiskers, lips, recessed eyes and inner ears fit the head.

A ten-bone rig anchors the paws and lower body while the neck/head transition and separate brush tail move. The six-second loop combines a listening head turn, brief blink, ear response and delayed tail movement. The antlers stay attached to the head. This is a planted pose with authored motion, not a gait or a hair/muscle simulation.

Open `/?art=3d&study=wolf`. The original SVG remains beside the model. The standard gallery supports animated GLB, PNG and recorded WebM exports, reduced-motion startup, timeline inspection and phone framing. Layer separation is disabled for the connected model.

## Evidence and limits

**Visual limits:** the coat uses surface maps and simplified broad ruff forms rather than individual hairs. Small facial and paw forms remain stylized. Motion is restrained and all four paws stay planted. Passing technical checks and author review do not establish user approval or equivalence in visual quality to Hydra.

Retained delivery: `test-results/wolf-delivery/` (views, export and source evidence). Superseded intermediate captures, snapshots and repeated whole-gallery exports were retired in the [lean cleanup](../../../engineering/history/cleanup-triage.md). The original dated review remains recoverable from Git.

The original 2026-10-07 review, including exact test counts, export measurements, failed attempts and then-current repository gate limits, is preserved at Git `85462d4924c79328723ca6c30a2d32a3e12d568e:docs/art-review-wolf-2026-10-07.md`. [The migration record](../../../../maintenance/document-migration.json) pins its SHA-256. Historical verification is not a fresh test or aesthetic acceptance.
