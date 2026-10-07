# Moon Moth — fifth sequential creature conversion

**Scope:** Hearth `moonmoth` / Moon Moth, registered as `moonmoth` in the 3D gallery. Its source illustration in `ExpansionPortraits.tsx` supplies pale green wings, ochre-ringed eyespots, trailing hindwings and comb-shaped antennae. The accepted living Hydra direction and Phoenix's fitted motion supply the construction and review standard. Earlier creature builders and the original SVG remain unchanged.

The model was authored and reviewed directly, without delegation. It is **author-reviewed**, not user-approved.

## Brief and interpretation

The moth rests on a rising twig, opening unequal wing planes while its antennae reach into the air. The right pair folds farther back than the left. Two broad forewings overlap rounded hindwings, which continue into narrow curved tails. Six slender legs clasp the twig behind a soft ivory thorax and tapered, lightly segmented abdomen.

The [UF/IFAS Luna moth account](https://ask.ifas.ufl.edu/publication/IN737) informed the separation of forewings/hindwings, hindwing tails, eyespots and comb-like antennae. These features guide construction; this is a fantasy interpretation of the game's Moon Moth, not a species reconstruction. The source's gold becomes ochre pigment in the wing surface rather than metallic trim.

## Revisions seen in pixels

| Pass            | Finding and correction                                                                                                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Construction    | The twig base had a visible join and its upper tip read as a third antenna. Lowered the tip and replaced the two-piece base with a continuous loft and flat sole.                                                                                                                           |
| Structure       | Six thick leg curves read as loops. Slimmed and tucked them under the thorax. Increased the right wings' fold, reduced the protruding eyes and introduced gentle abdominal segmentation.                                                                                                    |
| First materials | Coarse thorax tufts read as pale sprinkles; the wing markings were mechanically regular. Thinned the down, curved and branched the veins, varied the eyespot contours and broke up the bark grain.                                                                                          |
| Final pigment   | The first contour variation made the eyespots too triangular. Reduced that variation, retaining rounded rings with mild irregularity.                                                                                                                                                       |
| Export repair   | The first full browser run found that the exporter's normal-map sign conversion tried to draw a DataTexture through a canvas image API. Prepacked the green channel and paired it with negative Y normal scale, matching the existing creature convention while preserving the live relief. |

Frozen construction/material sources and screenshots are under `test-results/moonmoth-construction/`, `moonmoth-structure2/`, `moonmoth-materials/` and `moonmoth-materials2/`. The first full check and captures are under `test-results/moonmoth-final/`; final repaired-export checks and captures are under `test-results/moonmoth-export-fixed/`. Delivered images, GLB, video and source hashes are under `test-results/moonmoth-delivery/`. Generated evidence is ignored. The builder, integration, tests and this record are durable sources.

## Structure, materials and motion

The connected body uses the existing implicit-surface helper. Four wings are closed, curved thin solids with subdivided interiors; outward winding is preserved on both sides. Each wing has an anchored skin rig for gradual margin flex, and the hindwing tails have delayed motion. Fitted hinges remain inside the thorax. The six legs, body and twig stay fixed throughout the six-second loop; antennae move from their head-mounted roots. This is a resting pose with authored flex, not flight simulation.

Wing pigment, vein marks, scale relief, normal maps and packed roughness remain embedded in the GLB. Eyespots lie in the wing material. The underside uses quieter coloration. Fine thorax down and comb filaments are local geometry; the bark uses local pigment and normal textures. There are no downloaded textures or models.

Open `/?art=3d&study=moonmoth`. The gallery presents the original SVG beside the model, supports phone framing, reduced-motion startup, timeline inspection, PNG export, animated GLB export and browser-recorded WebM. Layer separation is disabled for the fitted assembly.

## Verification and limits

Subject tests check four closed wings, outward volume, normalized weights, fixed grips and hinge roots, flat perch contact and moving wing margins/tails. The first new sole check found a roughly 3e-6-unit tilt from the shared loft's estimated tangent. The model now explicitly flattens that sole to the plinth's 0.105-unit top instead of loosening the assertion.

Final verification passes **282 unit tests in 46 files**, **8 trace tests**, owned-file formatting and the production build. The first full gallery/review/shell browser run passed **20 of 21 checks**, with the new model's normal-map export failure described above. After that isolated repair, **all 4 targeted browser checks pass**: the complete eleven-study render/export/phone/save-preservation check, Moonmoth visual review, Moonmoth reduced-motion startup and Moonmoth playable video recording. Both runs used the repository's disposable-profile startup guard with approved macOS execution.

The repaired GLB contains **4 skinned meshes** and **12 animated nodes**. Across three sampled poses, the maximum deformed-vertex difference from the live model is **3.0346e-8 model units**; maximum animated-node transform difference is **0**. The author inspected identically lit live/reimported PNGs and confirmed that the wings, eyespots, fine body detail and bark retain their appearance. This checks this export path, not arbitrary third-party viewers.

Pixel review includes final neutral clay, silhouette, front, side, reverse, enlarged, phone and three motion views. The delivery MP4 is H.264, **994 × 674 pixels**, **6.033 seconds**, converted from the browser-recorded WebM. Source snapshots and SHA-256 hashes accompany the delivery. Earlier Prowler, Wolf, Matriarch and Thornstag builders/tests still match their delivery hashes; Hydra, Phoenix, Nightjar and the original SVG sources remain unchanged.

`npm run check` stops on formatting in the concurrent `docs/viz.md` edit. That file remains with its author; owned-file formatting, unit tests, trace tests and production build are checked separately. The existing large gallery-chunk warning remains.

**Visual limits:** wing scales, down and antenna filaments are stylized and become less distinct at phone size. Wing thickness is a display interpretation; there is no biological translucency or flight dynamics. The broad still-wing pose and relatively simple body remain visible limits. Passing tests and author review do not establish user approval or equal visual quality to Hydra.
