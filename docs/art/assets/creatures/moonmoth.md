# Moon Moth asset record

**Status:** author-reviewed; user approval is unrecorded. Authored and reviewed directly.

**Scope:** Hearth `moonmoth` / Moon Moth, registered as `moonmoth` in the 3D gallery. Its source illustration in `ExpansionPortraits.tsx` supplies pale green wings, ochre-ringed eyespots, trailing hindwings and comb-shaped antennae. The accepted living Hydra direction and Phoenix's fitted motion supply the construction and review standard. Earlier creature builders and the original SVG remain unchanged.

## Brief and interpretation

The moth rests on a rising twig, opening unequal wing planes while its antennae reach into the air. The right pair folds farther back than the left. Two broad forewings overlap rounded hindwings, which continue into narrow curved tails. Six slender legs clasp the twig behind a soft ivory thorax and tapered, lightly segmented abdomen.

The [UF/IFAS Luna moth account](https://ask.ifas.ufl.edu/publication/IN737) informed the separation of forewings/hindwings, hindwing tails, eyespots and comb-like antennae. These features guide construction; this is a fantasy interpretation of the game's Moon Moth, not a species reconstruction. The source's gold becomes ochre pigment in the wing surface rather than metallic trim.

## Consequential revisions

| Pass            | Finding and correction                                                                                                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Construction    | The twig base had a visible join and its upper tip read as a third antenna. Lowered the tip and replaced the two-piece base with a continuous loft and flat sole.                                                                                                                           |
| Structure       | Six thick leg curves read as loops. Slimmed and tucked them under the thorax. Increased the right wings' fold, reduced the protruding eyes and introduced gentle abdominal segmentation.                                                                                                    |
| First materials | Coarse thorax tufts read as pale sprinkles; the wing markings were mechanically regular. Thinned the down, curved and branched the veins, varied the eyespot contours and broke up the bark grain.                                                                                          |
| Final pigment   | The first contour variation made the eyespots too triangular. Reduced that variation, retaining rounded rings with mild irregularity.                                                                                                                                                       |
| Export repair   | The first full browser run found that the exporter's normal-map sign conversion tried to draw a DataTexture through a canvas image API. Prepacked the green channel and paired it with negative Y normal scale, matching the existing creature convention while preserving the live relief. |

Generated evidence is ignored. The builder, integration, tests and this record are durable sources.

## Structure, materials and motion

The connected body uses the existing implicit-surface helper. Four wings are closed, curved thin solids with subdivided interiors; outward winding is preserved on both sides. Each wing has an anchored skin rig for gradual margin flex, and the hindwing tails have delayed motion. Fitted hinges remain inside the thorax. The six legs, body and twig stay fixed throughout the six-second loop; antennae move from their head-mounted roots. This is a resting pose with authored flex, not flight simulation.

Wing pigment, vein marks, scale relief, normal maps and packed roughness remain embedded in the GLB. Eyespots lie in the wing material. The underside uses quieter coloration. Fine thorax down and comb filaments are local geometry; the bark uses local pigment and normal textures. There are no downloaded textures or models.

Open `/?art=3d&study=moonmoth`. The gallery presents the original SVG beside the model, supports phone framing, reduced-motion startup, timeline inspection, PNG export, animated GLB export and browser-recorded WebM. Layer separation is disabled for the fitted assembly.

## Evidence and limits

**Visual limits:** wing scales, down and antenna filaments are stylized and become less distinct at phone size. Wing thickness is a display interpretation; there is no biological translucency or flight dynamics. The broad still-wing pose and relatively simple body remain visible limits. Passing tests and author review do not establish user approval or equal visual quality to Hydra.

Retained delivery: `test-results/moonmoth-delivery/` (views, export and source evidence). Superseded intermediate captures, snapshots and repeated whole-gallery exports were retired in the [lean cleanup](../../../engineering/history/cleanup-triage.md). The original dated review remains recoverable from Git.

The original 2026-10-07 review, including exact test counts, export measurements, failed attempts and then-current repository gate limits, is preserved at Git `85462d4924c79328723ca6c30a2d32a3e12d568e:docs/art-review-moonmoth-2026-10-07.md`. [The migration record](../../../../maintenance/document-migration.json) pins its SHA-256. Historical verification is not a fresh test or aesthetic acceptance.
