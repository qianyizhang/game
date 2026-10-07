# Thorn Stag — fourth sequential creature conversion

**Scope:** Hearth `thornstag` / Thorn Stag, registered as `thornstag` in the 3D gallery. The existing expansion portrait supplies the narrow muzzle, pale throat, large ears, dun coat and ochre thornlike antlers. Living Hydra and Phoenix supply the construction, material and review standard. Earlier creature builders and source illustrations remain unchanged.

The model was authored and reviewed directly, without delegation. It is **author-reviewed**, not user-approved.

## Brief

The stag halts at a sound, holding one forehoof clear of the ground while three cloven hooves carry its weight. The head turns toward the viewer above a pale throat. The narrow flank, long lower legs, spreading antler crown and short tail distinguish its silhouette from the Wolf. Keratin and short fur remain separate materials; the crown's ochre color interprets the printed gold as a living antler surface.

## Revisions seen in pixels

| Pass                | Finding and correction                                                                                                                                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Construction        | Rear legs curved too broadly and the hooves looked like boots. Smaller rounded toe shells and more explicit knee/hock/cannon paths made the lower legs read as supports.                                                                                                     |
| Antler construction | Very thin field-meshed tips fragmented below the sampling scale. Kept the fused fork structure and joined continuous analytic terminal lofts into it.                                                                                                                        |
| Second construction | Two extra branches doubled back or overlapped the main beams in the hero view. Removed those forks, preserving a broad unequal crown with clearer negative space. The separate pale tail patch also looked attached; replaced it with underside pigment on the tail surface. |
| Pose revision       | The lifted far forehoof was partly hidden. Moved the lifted gesture to the near side and planted the opposite foreleg, making the halt readable in the main view.                                                                                                            |
| Final color         | A head-space muzzle mask extended down onto the raised foreleg. Bounded it to the actual face; the pale throat remains a separate intentional region.                                                                                                                        |

Snapshots and visual evidence are in `test-results/thornstag-construction/`, `thornstag-structure2/` and `thornstag-structure3/`. Final checks and captures are in `test-results/thornstag-final/`. Delivery images, GLB, video and source hashes are in `test-results/thornstag-delivery/`. Generated evidence is ignored; `src/art3d/thornstag.ts` and its tests are the durable sources.

## Construction and motion

One implicit skin connects body, four limbs, neck and skull. It uses the existing `surfaceSculpt.ts` helper without changing earlier builders. Mouth lines fit the actual muzzle surface, and facial features follow the fitted head frame. Each hoof has two closed toe shells with a visible cleft and a flat sole. The three support soles sit at the plinth's 0.105-unit top; the lifted sole stays at 0.42 units.

A three-bone anchor/neck/head rig keeps the stance fixed while the neck and head turn gently. Ears, blink and short-tail motion complete a six-second authored loop. The antler roots and terminal tips follow the head. This is a halted pose, not a walking cycle or balance simulation.

Pigment, normal and packed roughness textures remain embedded in the exported GLB. Fine coat detail stays quieter than the throat, face and antler silhouette. The original SVG is shown beside the model. Open `/?art=3d&study=thornstag`; gallery controls provide animated GLB, PNG and recorded WebM exports, timeline inspection, reduced-motion startup and phone framing. Layer separation is disabled for the connected assembly.

## Verification and limits

Unit coverage checks welded skin closure, finite normalized weights, fixed lower-body vertices and hoof frames, exact sole heights, fitted nose/head and crown/head relationships, head rotation and tail movement. The first motion assertion measured head-pivot translation, which is small near the upright neck axis; it was corrected to measure the intended head rotation. Shared checks cover animation bindings and seamless endpoints.

Final verification passes **278 unit tests in 45 files**, **8 trace tests**, **19 gallery/review/shell browser checks**, owned-file formatting and the production build. The browser suite uses the repository's disposable-profile startup guard with approved execution on macOS.

The exported GLB contains one skinned mesh and seven animated nodes. Across the sampled poses, its maximum deformed-vertex difference from the live model is **2.9641e-8 model units**; maximum animated-node transform difference is **0**. The identically lit live and reimported images retain the same fitted features, coat and antler appearance. These comparisons verify this export path, not arbitrary third-party viewers.

The author inspected final hero, front, side, reverse, enlarged, phone, neutral clay, silhouette, blink and three motion frames. The halted gesture reads at phone size; cloven toes and fine terminal antler junctions are primarily visible in larger views. The supplied MP4 is H.264, **994 × 674 pixels**, **6.033 seconds**, converted from the browser-recorded WebM. Source snapshots and SHA-256 hashes accompany the delivery. Prowler, Wolf and Matriarch builders/tests and the shared sculpt helper match their previous delivery hashes; the original Hydra, Phoenix, Nightjar and source portrait files remain unchanged.

`npm run check` stops at the repository-wide formatting gate on the concurrent `docs/viz.md` edit. That file was left to its author. Owned-file formatting and the complete test/build stages are run separately. The existing large gallery-chunk build warning remains.

**Visual limits:** antlers, fur and small hoof/facial forms remain stylized. Separate terminal lofts preserve the fine antler tips; the crown is not one manufacturing-ready mesh. The stance remains fixed during the loop. Passing checks and author review do not establish user approval or equal visual quality to Hydra.
