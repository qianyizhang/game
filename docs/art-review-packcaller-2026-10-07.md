# Pack Caller — thirteenth sequential creature conversion

**Scope:** Hearth `leader` / Pack Caller, registered as `packcaller` in the 3D gallery. The `CreatureIllustrations.tsx` Wolf variant selected by `MinionArt.tsx` supplies the cool forest coat, pale face/throat, leather collar and brass pendant. The living Hydra is the anatomical direction; Phoenix supplies the fitted-motion and export standard. Earlier models and SVG sources remain unchanged.

The model was authored and reviewed directly, without delegation. It is **author-reviewed**, not user-approved.

## Brief and interpretation

A seated canid raises its muzzle to call, supported by two planted forelegs and folded haunches. A low tail curves around the hip. The upward chest-to-muzzle line leads the pose; unequal ears and the collar answer it. This gives Pack Caller a distinct action from the standing Greatwood Wolf and hesitant Briar Stray. Gallery, enlarged inspection and narrow phone views are the intended sizes.

The [Smithsonian explanation of wolf howling](https://nationalzoo.si.edu/animals/news/why-do-wolves-howl-and-other-top-wolf-questions-answered) supplied the communication context for the calling gesture. The seated pose, fantasy palette and restrained silent animation are authored interpretations, not a biological reconstruction or recorded vocalization.

## Revisions seen in pixels

| Pass         | Finding and correction                                                                                                                                                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial clay | The seated silhouette and lifted head read, but the lower jaw ended flat and a separate oval palate looked like a plate inside the mouth. Replaced the oral roof with a surface fitted directly to the sculpted muzzle; removed the separate lower mouth-floor oval. |
| Collar       | The first band showed its inward-facing surface. Reversed the winding, retaining a closed band with thickness. A geometry check caught the negative enclosed volume.                                                                                                 |
| Jaw contour  | Tapering the original sectional jaw still produced a pointed profile. Rebuilt it as a fused mandibular root, body and rounded tip rather than continuing to adjust the taper.                                                                                        |
| Material     | Added restrained leather grain and edge wear to distinguish the collar from the coat. The pale muzzle/throat and small brass pendant remain the main color accents.                                                                                                  |

Frozen candidates are in `test-results/packcaller-construction/`, `packcaller-structure2/`, `packcaller-materials/` and `packcaller-jaw/`, each with a corresponding `-source/` snapshot. Final browser evidence is in `test-results/packcaller-final/`; delivered PNGs, model, video, logs and source hashes are in `test-results/packcaller-delivery/`. Generated evidence is ignored; the builder, integration, tests and this review are durable.

## Construction and motion

A continuous implicit surface joins the seated pelvis, folded thighs, planted limbs, rising chest, neck and skull. Recessed eyes, cupped ears, a shaped nose and short whiskers follow the head. The lower jaw has a fitted hinge, a quiet dark inner surface, a small tongue and four simplified canine teeth. Its roof lining follows the actual muzzle surface. The curved tail begins within the rump.

The leather band is constructed around radial intersections with the actual neck field. It has a thin inner wall and edge surfaces, and shares the body’s skin-weight function. A small pierced brass pendant hangs from a visible bail on its lower front edge. The pendant lies below the deforming neck region and remains fixed.

Three skinned meshes share five bones: body, tail and collar use the anchor, neck, head and two tail frames. The head and jaw move slightly, the ears answer, the eyes briefly blink and the distal tail sweeps at a delay. Four soles and sixteen claws stay fixed. This is a six-second authored calling loop, not a walking cycle or a biomechanical simulation.

The original SVG appears beside the model at `/?art=3d&study=packcaller`. Timeline, reduced-motion startup, phone framing, PNG, animated GLB and recorded WebM remain available. Layer separation stays disabled for the fitted assembly. Earlier canid material techniques and shared implicit-surface helpers were reused locally; those builders were preserved.

## Verification and limits

Four subject tests cover closed outward body/tail/ears/jaw/collar geometry, finite normalized weights, four grounded soles, stable support vertices and claws, fitted face attachments, fixed tail root and tail clearance. Sampled collar-to-body distances remain close through the loop; the pendant bail stays at its fitted band edge and the jaw articulates around its fixed hinge. Shared tests cover animation binding and matching loop endpoints. The full unit suite passes **320 tests across 54 files**, the trace suite passes **8 tests**, and the production build and owned-file formatting pass. The final selected browser suite passes **7 checks**: Pack Caller construction views, direct-link reduced motion and video recording/decoding; all nineteen studies’ rendering, phone layout and exports/reimports; and three shell navigation checks. Earlier creatures’ video tests are not repeated in this pass. The export test’s time budget now scales with the study count; the previous eighteen-study pass already took about 84 seconds.

The animated GLB retains **three skinned meshes using five shared bones**, **9 animated nodes** and **9 embedded images**. Sampled live/reimported poses differ by at most **5.723985852706575e-8 scene units** at vertices and **0** at measured nodes. Both identically lit rendered views were inspected. The GLB is **10,530,680 bytes**. The delivered H.264 preview is **994 × 674**, **6.033333 seconds**; the original WebM is preserved beside it.

All twelve prior creature builders and their subject tests match their delivery hashes. The shared surface-sculpt helper and its tests match their preserved hashes. Original Hydra, Phoenix, Nightjar, common loft, source SVG and minion content remain unchanged. The source snapshot and SHA-256 manifest pin the final reviewed implementation.

`npm run check` stops at the concurrent `docs/viz.md` formatting edit. That file remains with its author; owned-file formatting and test/build stages are run separately. The existing large gallery-chunk warning remains.

**Visual limits:** the muzzle, seated haunches and ear posture remain stylized. The mouth has simplified lining and four canine teeth rather than complete dentition. Leather grain, whiskers and the pendant’s pierced detail diminish on a phone. The silent display loop keeps the seated pose throughout. Fitted parts and surface layers are display geometry rather than a manufacturing-ready unified mesh. Technical checks and author review do not establish user approval or equal visual quality to Hydra.
