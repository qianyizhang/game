# Briar Stray — twelfth sequential creature conversion

**Scope:** Hearth `stray` / Briar Stray, registered as `stray` in the 3D gallery. The original `CreatureIllustrations.tsx` Wolf variant supplies the forest coat, pale facial mask and ragged throat, tall pointed ears, long muzzle and amber eyes. The model follows the living-anatomy direction of Hydra and the fitted animation/export standard of Phoenix. Previous illustrations and creature builders remain unchanged.

The model was authored and reviewed directly, without delegation. It is **author-reviewed**, not user-approved.

## Brief and interpretation

A lean forest canid pauses mid-step and turns toward a sound. One forepaw folds below its raised wrist while three paws support the body. Unequal cupped ears, a long muzzle, a pale throat and a low brush tail carry the gesture. The raised paw and lighter frame distinguish it from the standing, antlered Greatwood Wolf. Gallery, enlarged inspection and narrow phone views are the intended sizes.

The [Smithsonian red-wolf reference](https://nationalzoo.si.edu/animals/red-wolf) informed the relatively thin body, long legs and tall ears. The palette and expression follow the source illustration; this is a fantasy canid, not a species reconstruction.

## Revisions seen in pixels

| Pass             | Finding and correction                                                                                                                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First clay views | The raised foreleg curved like a tube, the far hock overextended, and the ears showed flat bases. Folded the wrist and paw more clearly, shortened the hock, lifted the head and buried deeper ear cups in the skull.   |
| Silhouette       | The tail tip hooked back toward the body and a throat lock ended in a long point. Extended the low tail sweep and shortened the lock into the bib.                                                                      |
| Face             | The nose read as an oval bead and the eyes protruded. Flattened the nose crown, narrowed its lower plane and reduced the eye assembly.                                                                                  |
| Material review  | The enlarged image exposed a hard, jagged socket boundary and weak coat-region separation. Smoothed the socket subtraction, deepened the forest coat, strengthened the pale mask/throat and reduced fine normal relief. |

Frozen candidates are in `test-results/stray-construction/`, `stray-structure2/` and `stray-materials/`, each with a corresponding `-source/` snapshot. Final browser evidence is in `test-results/stray-final/`; delivered images, model, video, logs and source hashes are in `test-results/stray-delivery/`. Generated evidence is ignored; geometry, integration, tests and this review are durable.

## Construction and motion

A continuous implicit surface joins the ribcage, tucked abdomen, pelvis, staggered limbs, throat, neck and turned skull. Four short digits form each paw. Two closed curved ear cups sit within the skull; recessed eyes, fitted lip curves, short whiskers and a shaped nose follow the head. A closed sectional brush tail emerges inside the rump. Locally generated coat pigment, relief and roughness use quiet short strands with pale facial and ventral regions.

Two skinned meshes share five bones: an anchor, neck, head and two tail frames. Three supporting soles, the folded forepaw and all sixteen claws remain fixed. The head listens, the ears respond unequally, the eyes briefly blink and the distal tail follows. This is a six-second authored listening loop, not a walking cycle or a biomechanical simulation.

The original SVG appears beside the model at `/?art=3d&study=stray`. Timeline, reduced-motion startup, phone framing, PNG, animated GLB and recorded WebM remain available. Layer separation is disabled for the fitted assembly. Shared implicit-surface helpers and local material techniques come from earlier conversions; those builders are preserved.

## Verification and limits

Subject tests cover closed outward body/tail/ear geometry, finite normalized weights, three grounded soles and one raised paw, fixed support vertices and claws through the loop, fitted head attachments, fixed tail root and maintained tail clearance. Shared tests cover animation binding and loop endpoints. The full unit suite passes **314 tests across 53 files**, the trace suite passes **8 tests**, and the production build and owned-file formatting pass. The final browser suite passes **35 checks**, including all eighteen studies’ exports, Stray construction views, reduced-motion startup and video decoding. The delivered H.264 preview is **994 × 674**, **6.033333 seconds**; the original WebM is preserved beside it.

The GLB retains **two skinned meshes using five shared bones**, **8 animated nodes** and **6 embedded images**. Sampled live/reimported poses differ by at most **6.073827383809848e-8 scene units** at vertices and **0** at measured nodes. Both identically lit rendered views were inspected. The GLB is **7,296,816 bytes**.

All eleven prior creature builders and their subject tests match their delivery hashes. The shared surface-sculpt helper and its tests match their preserved hashes. Original Hydra, Phoenix, Nightjar, common loft and source SVG/minion content remain unchanged. The final source snapshot and SHA-256 manifest preserve the exact reviewed implementation.

`npm run check` stops at the concurrent `docs/viz.md` formatting edit. That file remains with its author; owned-file formatting and test/build stages are run separately. The existing large gallery-chunk warning remains.

**Visual limits:** limb transitions, eyelids and throat locks remain stylized. Fine coat strands, whiskers and digits diminish on a phone. The pose holds a raised paw throughout the loop. Fitted parts are display geometry rather than a manufacturing-ready unified mesh. Technical checks and author review do not establish user approval or equal visual quality to Hydra.
