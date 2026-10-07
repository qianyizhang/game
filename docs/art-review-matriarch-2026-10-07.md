# Briar Matriarch — third sequential creature conversion

**Scope:** Hearth `mother` / Briar Matriarch, registered as `matriarch` in the 3D gallery. The existing adult `Bear` illustration supplies the shoulder hump, rounded ears, broad pale muzzle and warm brown coat. Living Hydra and Phoenix supply the construction and review standard. Previous creature model sources remain unchanged.

This model was authored and reviewed directly, without delegation. Its status is **author-reviewed**, not user-approved.

## Brief

A protective bear braces behind a low, watchful head. The high shoulders carry the weight toward staggered forepaws; the broad back descends into short, planted hind legs. The muzzle is broad, the ears small and round, and the eyes recessed under the brow. Warm umber fur, a pale muzzle, dark feet and exposed claws distinguish this subject from the preceding forest feline and antlered wolf. The original SVG appears beside the model.

## Revisions seen in pixels

| Pass                | Finding and correction                                                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| First construction  | The hump was too peaked and the face too long. The mouth/philtrum curves floated in front of the muzzle. Lowered and broadened the hump, widened the skull, shortened the snout and fitted the mouth to the implicit skin surface.                                       |
| Second construction | The revised face and shoulder line held together, but the heavy hind legs retained a folded hock and a sharp transition below the thigh. Straightened the lower-leg paths and tapered their radii into the planted feet.                                                 |
| Surface             | Coarse relief made the coat look corrugated and exposed mapping transitions around the haunch. Reduced that relief and moved the subtle larger pigment variation into continuous object-space vertex color. Fine guard-hair texture remains quiet over the broad planes. |
| Final               | Inspected the final material, neutral clay, silhouette, reverse view, enlarged face/body, phone framing, blink and motion samples. Exported and reloaded the animated model for geometry and material comparison.                                                        |

Initial source snapshots and images are under `test-results/matriarch-construction/`, `matriarch-structure2/` and `matriarch-surface/`. Final receipts are under `test-results/matriarch-final/`. Delivery images, model, video and source hashes are in `test-results/matriarch-delivery/`. Generated evidence is ignored; the model and its tests are durable sources.

## Construction and motion

The joined implicit surface carries the skull, neck, shoulder hump, barrel, limbs, paws and short tail. The `surfaceSculpt.ts` helper uses the corrected tapered-field method developed during Wolf construction, smooth unions and field-gradient normals. Its regression test checks the tapered surface and gradient across sampling joins. Existing Wolf and Prowler builders were not modified.

Mouth curves are sampled onto the actual muzzle surface. The fitted nose, eyes, ear shells and mouth share the head frame. Pigment, normal and packed roughness maps are embedded in the GLB. Fur, leather and claw materials use different surface responses.

A three-bone anchor/neck/head rig keeps the body and paws planted. A restrained six-second head turn with small scenting motion, ear response and brief blink supplies the idle loop. Claws remain fixed with their paws. This is a posed animal study, not a gait, hair or muscle simulation.

Open `/?art=3d&study=matriarch`. The existing gallery supports animated GLB, PNG and WebM exports, reduced-motion startup, timeline inspection and phone framing. Layer separation is disabled for the connected model.

## Verification and limits

The complete unit suite passes **275 tests in 44 files**. **8 trace tests** and the production build also pass. Matriarch coverage checks welded skin closure, finite normalized weights, support vertices at the plinth's 0.105-unit top, stable paws/claws, fitted head/nose motion and a moving head. Shared checks cover animation targets and seamless endpoints.

The final browser run passes **all 17 checks**. Receipts in `test-results/matriarch-final/` cover the nine-study gallery, animated model exports, reimport comparisons for six living creatures, nine video recordings with decoded changing frames, reduced motion, phone framing and shell/save behavior. Matriarch’s maximum sampled deformed-vertex difference is **6.147e-8 model units**; maximum animated-node matrix difference is **0**, across one skinned mesh and six animated nodes. Identically lit live/exported images were inspected with no observed material loss. The H.264 preview decodes at 994 × 674 for 6.039 seconds.

`npm run check` stops at the repository-wide formatting gate on the concurrent `docs/viz.md` edit. That file was left to its author. Owned-file formatting and the test/build stages were run separately. The existing large gallery-chunk build warning remains.

**Visual limits:** the fur is a surface approximation, with simplified broad forms and small facial details. The feet stay planted and the motion is deliberately restrained. Author review and passing checks do not establish user approval or equal visual quality to Hydra.
