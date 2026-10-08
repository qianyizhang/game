# Briar Matriarch asset record

**Status:** author-reviewed; user approval is unrecorded. Authored and reviewed directly.

**Scope:** Hearth `mother` / Briar Matriarch, registered as `matriarch` in the 3D gallery. The existing adult `Bear` illustration supplies the shoulder hump, rounded ears, broad pale muzzle and warm brown coat. Living Hydra and Phoenix supply the construction and review standard. Previous creature model sources remain unchanged.

## Brief

A protective bear braces behind a low, watchful head. The high shoulders carry the weight toward staggered forepaws; the broad back descends into short, planted hind legs. The muzzle is broad, the ears small and round, and the eyes recessed under the brow. Warm umber fur, a pale muzzle, dark feet and exposed claws distinguish this subject from the preceding forest feline and antlered wolf. The original SVG appears beside the model.

## Consequential revisions

| Pass                | Finding and correction                                                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| First construction  | The hump was too peaked and the face too long. The mouth/philtrum curves floated in front of the muzzle. Lowered and broadened the hump, widened the skull, shortened the snout and fitted the mouth to the implicit skin surface.                                       |
| Second construction | The revised face and shoulder line held together, but the heavy hind legs retained a folded hock and a sharp transition below the thigh. Straightened the lower-leg paths and tapered their radii into the planted feet.                                                 |
| Surface             | Coarse relief made the coat look corrugated and exposed mapping transitions around the haunch. Reduced that relief and moved the subtle larger pigment variation into continuous object-space vertex color. Fine guard-hair texture remains quiet over the broad planes. |
| Final               | Inspected the final material, neutral clay, silhouette, reverse view, enlarged face/body, phone framing, blink and motion samples. Exported and reloaded the animated model for geometry and material comparison.                                                        |

Generated evidence is ignored; the model and its tests are durable sources.

## Construction and motion

The joined implicit surface carries the skull, neck, shoulder hump, barrel, limbs, paws and short tail. The `surfaceSculpt.ts` helper uses the corrected tapered-field method developed during Wolf construction, smooth unions and field-gradient normals. Its regression test checks the tapered surface and gradient across sampling joins. Existing Wolf and Prowler builders were not modified.

Mouth curves are sampled onto the actual muzzle surface. The fitted nose, eyes, ear shells and mouth share the head frame. Pigment, normal and packed roughness maps are embedded in the GLB. Fur, leather and claw materials use different surface responses.

A three-bone anchor/neck/head rig keeps the body and paws planted. A restrained six-second head turn with small scenting motion, ear response and brief blink supplies the idle loop. Claws remain fixed with their paws. This is a posed animal study, not a gait, hair or muscle simulation.

Open `/?art=3d&study=matriarch`. The existing gallery supports animated GLB, PNG and WebM exports, reduced-motion startup, timeline inspection and phone framing. Layer separation is disabled for the connected model.

## Evidence and limits

**Visual limits:** the fur is a surface approximation, with simplified broad forms and small facial details. The feet stay planted and the motion is deliberately restrained. Author review and passing checks do not establish user approval or equal visual quality to Hydra.

Retained delivery: `test-results/matriarch-delivery/` (views, export and source evidence). Superseded intermediate captures, snapshots and repeated whole-gallery exports were retired in the [lean cleanup](../../engineering/cleanup-triage.md). The original dated review remains recoverable from Git.

The original 2026-10-07 review, including exact test counts, export measurements, failed attempts and then-current repository gate limits, is preserved at Git `85462d4924c79328723ca6c30a2d32a3e12d568e:docs/art-review-matriarch-2026-10-07.md`. [The migration record](../../../maintenance/document-migration.json) pins its SHA-256. Historical verification is not a fresh test or aesthetic acceptance.

## User refinement request — 2026-10-09 Shanghai

The user described the published native result as somewhat cute but toyish and lacking detail, and requested another refinement round. The prior art-direction acceptance below remains a historical decision; it did not establish user aesthetic approval. The round attempted anatomical planes and connected facial/limb/paw construction, but stopped unfinished at the orbital construction gate; regional coat work never began. The previous release remains the gallery default. The [refinement outcome](native-matriarch-refinement.md) records the failed attempts, preserved work and restored bytes.

## Native trial — 2026-10-09 Shanghai

The native Matriarch is now the independently verified, Astra-accepted gallery default; user art approval remains unrecorded. The selective throat/neck repair and editable Guard reach operation preserve the original procedural model and retained GLB. The [native trial retrospective](native-matriarch-trial.md) records exact accepted bytes, work split, costs, checks and remaining limitations. The procedural record above remains the original baseline account.
