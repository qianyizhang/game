# Alley Prowler asset record

**Status:** author-reviewed; user approval is unrecorded. Authored and reviewed directly.

**Scope:** one new living model, Hearth's `cat` / Alley Prowler, registered as `prowler` in the 3D gallery. The existing `Panther` SVG supplies the forest palette, broad feline muzzle, rounded ears and watchful gaze. Living Hydra is the accepted methodological reference; Phoenix supplies an additional presentation and export comparison. Hydra, Phoenix and Nightjar model sources remain unchanged.

## Brief

A forest-coated predator pauses during a low stalk. The reaching forepaw leads; a compressed, bent hind leg answers it. A turned head, short muzzle, hooded amber eyes and long returning tail identify the feline. The shoulders, flank, haunch, neck and head must read as one connected gesture. Short fur stays subordinate to those large masses. Review includes the normal gallery, enlarged, front/side/rear, motion extremes, blink and 390 px phone view.

## Consequential revisions

| Pass | Finding and response                                                                                                                                                                                                                                 |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | The torso was too heavy, the hind leg folded into a rounded lump, and oversized eyes/ears suggested a juvenile animal. Rebuilt the torso proportions, elbow/hock relationship and head/ear proportions.                                              |
| 2    | The reaching foreleg and hind-leg joints became distinct, but projected markings stretched across the rump and the coat remained too smooth. Revised the coat mapping and texture.                                                                   |
| 3    | The new normal relief looked like repeated scales rather than short fur; cheek accents appeared attached. Rejected that finish. Removed the accents and used smaller, lower-contrast fur marks.                                                      |
| 4    | Regional UV projection removed the cylindrical pole stretching. A finer surface sampling pass followed to improve the small cranial planes. Ear tones were brought closer to the coat. Final exports and final pixels are reviewed separately below. |

Generated evidence is ignored; `src/art3d/prowler.ts` is the durable model source.

## Construction and delivery

The implicit surface joins the large masses and all four limbs; field-gradient normals preserve smooth broad shading. Regional UVs keep fine fur from stretching around a single cylindrical pole. Geometry carries color variation, while pigment, normal and packed roughness textures are embedded in the GLB. The ear shells have front, rear and joined rim surfaces. Whiskers, nose, mouth, recessed eyes and inner ear features are fitted to the head frame.

A ten-bone skin rig anchors the lower body and paws. A blended neck/head chain turns the head; a separate tail chain adds delayed motion near the tip. Ear flicks and a brief eye closure complete a six-second authored loop. This is a poised animal study, not a walking cycle. It contains no muscle, hair or soft-tissue simulation.

Open `/?art=3d&study=prowler`. The original `cat` artwork appears beside the model. Animated GLB, PNG and recorded WebM use the existing gallery exporters. Reduced motion starts with playback off; layer separation is disabled for the connected assembly.

Finer sampling initially exceeded the cold-load and construction budgets. Conservative field bounds and UV-vertex reuse reduced redundant work; the unchanged direct-link expectation then passed. Current geometry budgets are documented in [verification contracts](../../engineering/checks.md).

## Evidence and limits

**Visual limits:** the coat is a short-fur surface approximation; the small paw and facial forms remain stylized. Motion is restrained and the stance stays planted. Author review and functional checks do not establish user approval.

Retained delivery: `test-results/prowler-delivery/` (views, export and source evidence). Superseded intermediate captures, snapshots and repeated whole-gallery exports were retired in the [lean cleanup](../../engineering/cleanup-triage.md). The original dated review remains recoverable from Git.

The original 2026-10-07 review, including exact test counts, export measurements, failed attempts and then-current repository gate limits, is preserved at Git `85462d4924c79328723ca6c30a2d32a3e12d568e:docs/art-review-prowler-2026-10-07.md`. [The migration record](../../../maintenance/document-migration.json) pins its SHA-256. Historical verification is not a fresh test or aesthetic acceptance.
