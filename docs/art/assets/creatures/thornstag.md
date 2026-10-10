# Thorn Stag asset record

**Status:** author-reviewed; user approval is unrecorded. Authored and reviewed directly.

**Scope:** Hearth `thornstag` / Thorn Stag, registered as `thornstag` in the 3D gallery. The existing expansion portrait supplies the narrow muzzle, pale throat, large ears, dun coat and ochre thornlike antlers. Living Hydra and Phoenix supply the construction, material and review standard. Earlier creature builders and source illustrations remain unchanged.

## Brief

The stag halts at a sound, holding one forehoof clear of the ground while three cloven hooves carry its weight. The head turns toward the viewer above a pale throat. The narrow flank, long lower legs, spreading antler crown and short tail distinguish its silhouette from the Wolf. Keratin and short fur remain separate materials; the crown's ochre color interprets the printed gold as a living antler surface.

## Consequential revisions

| Pass                | Finding and correction                                                                                                                                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Construction        | Rear legs curved too broadly and the hooves looked like boots. Smaller rounded toe shells and more explicit knee/hock/cannon paths made the lower legs read as supports.                                                                                                     |
| Antler construction | Very thin field-meshed tips fragmented below the sampling scale. Kept the fused fork structure and joined continuous analytic terminal lofts into it.                                                                                                                        |
| Second construction | Two extra branches doubled back or overlapped the main beams in the hero view. Removed those forks, preserving a broad unequal crown with clearer negative space. The separate pale tail patch also looked attached; replaced it with underside pigment on the tail surface. |
| Pose revision       | The lifted far forehoof was partly hidden. Moved the lifted gesture to the near side and planted the opposite foreleg, making the halt readable in the main view.                                                                                                            |
| Final color         | A head-space muzzle mask extended down onto the raised foreleg. Bounded it to the actual face; the pale throat remains a separate intentional region.                                                                                                                        |

Generated evidence is ignored; `src/art3d/thornstag.ts` and its tests are the durable sources.

## Construction and motion

One implicit skin connects body, four limbs, neck and skull. It uses the existing `surfaceSculpt.ts` helper without changing earlier builders. Mouth lines fit the actual muzzle surface, and facial features follow the fitted head frame. Each hoof has two closed toe shells with a visible cleft and a flat sole. The three support soles sit at the plinth's 0.105-unit top; the lifted sole stays at 0.42 units.

A three-bone anchor/neck/head rig keeps the stance fixed while the neck and head turn gently. Ears, blink and short-tail motion complete a six-second authored loop. The antler roots and terminal tips follow the head. This is a halted pose, not a walking cycle or balance simulation.

Pigment, normal and packed roughness textures remain embedded in the exported GLB. Fine coat detail stays quieter than the throat, face and antler silhouette. The original SVG is shown beside the model. Open `/?art=3d&study=thornstag`; gallery controls provide animated GLB, PNG and recorded WebM exports, timeline inspection, reduced-motion startup and phone framing. Layer separation is disabled for the connected assembly.

## Evidence and limits

**Visual limits:** antlers, fur and small hoof/facial forms remain stylized. Separate terminal lofts preserve the fine antler tips; the crown is not one manufacturing-ready mesh. The stance remains fixed during the loop. Passing checks and author review do not establish user approval or equal visual quality to Hydra.

Retained delivery: `test-results/thornstag-delivery/` (views, export and source evidence). Superseded intermediate captures, snapshots and repeated whole-gallery exports were retired in the [lean cleanup](../../../engineering/history/cleanup-triage.md). The original dated review remains recoverable from Git.

The original 2026-10-07 review, including exact test counts, export measurements, failed attempts and then-current repository gate limits, is preserved at Git `85462d4924c79328723ca6c30a2d32a3e12d568e:docs/art-review-thornstag-2026-10-07.md`. [The migration record](../../../../maintenance/document-migration.json) pins its SHA-256. Historical verification is not a fresh test or aesthetic acceptance.
