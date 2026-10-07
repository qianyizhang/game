# Ancient Tortoise — tenth sequential creature conversion

**Scope:** Hearth `ancienttortoise` / Ancient Tortoise, registered as `tortoise` in the 3D gallery. Its existing `ExpansionPortraits.tsx` illustration supplies the high olive shell, broad scutes, ochre rim, pale head/feet and small plants growing along the shell. Hydra supplies the living anatomical direction and Phoenix the fitted-motion comparison. Original artwork and earlier creature builders remain unchanged.

The model was authored and reviewed directly, without delegation. It is **author-reviewed**, not user-approved.

## Brief and interpretation

An ancient tortoise pauses beneath a high shell, bracing on staggered feet while its low head turns outward. The broad dome carries the composition; the extended neck and unequal forelegs give it direction. Quiet green scutes, a worn ochre margin and two small sprigs retain the original illustration's forest character. The gallery, enlarged inspection and narrow phone view are the intended sizes.

The [Smithsonian's radiated tortoise reference](https://nationalzoo.si.edu/animals/radiated-tortoise) informed the high dome, blunt head, heavy feet and broad smooth scutes. Its [Aldabra tortoise reference](https://nationalzoo.si.edu/animals/aldabra-tortoise) informed the columnar hind limbs, scaled skin and projecting neck. These guide a fantasy interpretation; this is not a species reconstruction.

## Revisions seen in pixels

| Pass         | Finding and correction                                                                                                                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Construction | The first marginal band occupied too much of the shell, and the side bridge resembled a padded rail. Narrowed the band, shifted the dome's high point and replaced the rail with a closed sloping plate fitted between carapace and plastron. |
| Proportion   | The muzzle was too elongated. Shortened its front volume to retain a blunt tortoise profile.                                                                                                                                                  |
| Bridge       | A strongly sloping bridge read as a dark gap beneath the rim. Widened the plastron and made the bridge more upright; scute markings connect its face to the underside.                                                                        |
| Surface      | Added separate shell growth markings and fine skin scales. Reduced the regularity and contrast of the growth rings after enlarged review.                                                                                                     |
| Forelimbs    | The first raised plates formed a neat grid of beads. Replaced them with fewer, broader, lower plates in a staggered arrangement along each foreleg.                                                                                           |
| Underside    | The unmarked lower shield read as a blank disc. Added paired scute markings with a central seam and reviewed the underside separately.                                                                                                        |

Frozen candidates are under `test-results/tortoise-construction/`, `tortoise-structure2/`, `tortoise-materials/`, `tortoise-materials2/` and `tortoise-materials3/`. Final verification is in `test-results/tortoise-final/`; delivered images, model, video, logs and source hashes are in `test-results/tortoise-delivery/`. Generated evidence is ignored; source geometry, integration, tests and this review are durable.

## Construction and motion

A closed carapace has separate outer and inner surfaces, an enclosed rim and shallow geometric scute seams. A closed plastron and two fitted bridges sit beneath it. Continuous implicit skin joins torso, neck, skull, limbs, feet and short tail. Four grounded feet carry eighteen small claws; fourteen larger forelimb plates are projected onto the actual skin surface. Two stems with six curved leaves meet the shell at inspected roots.

Three bones anchor the body and blend neck/head motion. The shell, feet, claws, forelimb plates and plants remain fixed. Facial details follow the head, and a brief blink scales the fitted eyes. The six-second loop is a watchful pause, not a gait, retraction sequence or biological simulation.

Locally generated shell pigment, growth-ring relief, skin scales and packed roughness are embedded in exports. The lower shell has its own mapped scute markings. The original SVG appears beside the model at `/?art=3d&study=tortoise`. Timeline, reduced-motion startup, phone framing, PNG, animated GLB and recorded WebM remain available; layer separation is disabled for the fitted assembly.

## Verification and limits

Subject tests cover body/shell closure and outward winding, finite normalized skin weights, four planted feet, eighteen fixed claws, fixed shell and plants, head/face fit, projected forelimb plate bounds and plant-root contact with actual geometry. Shared tests cover animation bindings and exact loop endpoints. Final verification passes **304 unit tests across 51 files**, **8 trace tests**, **31 browser checks**, the production build and owned-file formatting. Browser coverage includes all sixteen studies’ renders/exports, animation recording, reduced-motion startup and shell navigation. The delivered H.264 preview is **994 × 674**, **6.033333 seconds**; the original recorded WebM is preserved beside it.

The GLB retains **1 skinned mesh using three bones**, **4 animated nodes** and **7 embedded images**. Sampled live/reimported poses differ by at most **1.8604501557265464e-8 scene units** at vertices and **0** at measured nodes. Both identically lit rendered views were inspected. The GLB is **10,927,432 bytes**. Finished underside, desktop and phone images were also inspected.

Earlier Prowler, Wolf, Matriarch, Thornstag, Moonmoth, Bogtoad, Crocolisk, Scavenger and Guardian builders/tests match their delivery hashes. Shared surface-sculpt code/tests match the Matriarch delivery; original Hydra, Phoenix, Nightjar and SVG/content files remain unchanged. The final source snapshot and SHA-256 manifest preserve the exact reviewed implementation.

`npm run check` stops at the concurrent `docs/viz.md` formatting edit. That file remains with its author; owned-file formatting and all test/build stages are run separately. The existing large gallery-chunk warning remains.

**Visual limits:** this remains a stylized display creature in one braced stance. Scute layout, growth rings and skin mapping simplify regional anatomy. The bridge stays dark beneath the overhanging shell; fine scales and plant details become less distinct on a phone. The fitted shell parts, plates, claws and foliage are display geometry rather than a manufacturing-ready unified mesh. Passing tests and author review do not establish user approval or equal visual quality to Hydra.
