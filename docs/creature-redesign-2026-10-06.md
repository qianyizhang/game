# Creature redesign — gesture and cohesive style

The user rejected the prior Hydra and Nightjar, then clarified the actual problem: living things felt like wooden logs joined together. The request is for style, posture, dynamics and a coherent design, not pixel accuracy or literal fidelity to the source illustration. This correction takes priority over the earlier favorable reviews.

## References and design decisions

- [RSPB Nightjar guide](https://www.rspb.org.uk/birds-and-wildlife/identifying-birds/all-about-nightjars) and [Cornell's photographed Cuban Nightjar](https://ebird.org/species/granig2?siteLanguage=es): inspected the relation between crown, folded wings, tail and resting support. The earlier Nightjar pass interpreted that relation in bronze; it is not a species reconstruction. A literal plumage treatment was tried and discarded when it remained visually inert.
- Gustave Moreau's _Hercules and the Lernaean Hydra_: inspected the painting's unequal neck arcs and negative spaces through a [public reproduction](https://eclecticlight.co/2020/08/29/here-be-monsters-in-paintings/). The [Art Institute collection entry](https://www.artic.edu/artworks/20579/hercules-and-the-lernaean-hydra) identifies the work; its page was blocked in the research browser. [Getty's iconographic record](https://www.getty.edu/cona/CONAIconographyRecord.aspx?iconid=901001023) supplies the serpentine context. The new composition retains three heads from the game's subject, rather than copying the painting.

The photographs and painting were reference material only; no remote image or model was incorporated into the assets.

## Implemented direction

**Nightjar — earlier bronze pass, superseded by the guided living rebuild:** a continuous raised crown, neck, breast and back with a descending tail; thin folded feather planes fit the body surface. The eye position is fitted to the cranial surface. A single curved branch and short gripping feet replace the thick log assembly and decorative moon stand. The sculpture uses the same restrained bronze treatment throughout. Motion is subtle body/wing breathing and tail movement, without the former detached-head pivot.

**Hydra — first coiled pass, subsequently rejected as overly simplified:** a coiled foundation replaces the squat four-legged body. Three necks reach in different directions and occupy different heights; the central sweep carries the composition while the lower heads answer it. Wedge-shaped skulls, articulated jaws, small eyes and limited ventral relief replace the smooth sock heads. Warm aged bronze unifies the subject. Its animation remains a rigid display oscillation, not a living-creature rig.

**Hydra — living rebuild:** the user's further rejection prompted a change in physical interpretation. Moss-green skin, a quieter pale throat and worn keratin replace bronze. The dominant raised head threatens, the lower narrow head searches and the broader side head watches. Recessed eyes, integrated brow/temple planes, interlocking crown plates, curved dentition, gums, palate and tongue replace the smooth wedge faces. Unequal horn crowns include a worn short horn on the lower head. Larger dorsal shields follow the necks and coil; small locally generated scales follow the surface instead of stretching across a planar projection.

A shared 28-bone rig bends the three necks independently, with roots and the coil held still. Fitted armor uses the same skin weights. The heads turn and the jaws open with staggered timing in the six-second loop. The GLB carries the same rig and clip. This is stylized living anatomy and an authored idle, not a simulated animal.

The revisions were made directly in `src/art3d/models.ts`, `src/art3d/newStudies.ts` and `src/art3d/hydra.ts`. Shared rules are consolidated in [the aesthetic rulebook](art-direction.md), especially “Living subjects need a designed gesture.” This record does not grant user approval or claim anatomical realism.

## Review evidence

Before-source snapshots: `test-results/creature-redo-baseline/`. Intermediate multi-view captures: `test-results/creature-redo-round3/` through subsequent numbered directories. Reference browser captures: `test-results/creature-references/` and the Moreau capture under `test-results/creature-redo-nightjar2/`.

Review exposed and corrected depth offsets ignored by the bird section builder, misplaced facial features, overly bulky wing volumes and mobile caption overlap. Tests establish rendering/export behavior; they do not establish whether the style succeeds. The next user response remains the authority on that judgment.

Verification of the previous creature pass: **249 unit tests across 35 files**, formatting and production build pass. The full gallery browser run passes **17 checks**; a subsequent **3-check targeted run** rechecks Nightjar's final closed-vane surface correction, its video and all six GLB exports. Final evidence is under `test-results/creature-redo-final/` and `test-results/creature-redo-finish/`. The 12-second H.264 preview is `test-results/creature-redo-reel/two-creatures.mp4`; decoding and its 360-frame duration were checked. The existing lazy-gallery bundle-size warning remains.

Catalyst, Phoenix, Spiral and Vajra builders were compared against the turn baseline and remain unchanged. No game rule, save format or SVG source was edited. Generated material and geometry remain local and exportable; no external reference image is bundled.

## Living Hydra review

The preserved bronze baseline is `test-results/hydra-living-before/`, with source snapshots in `test-results/hydra-living-source-before/`. The successive `hydra-living-round1/`, `round2/` and `round3/` captures record author review of the hero, front, side, rear, three motion times and phone view. Round 3 also includes an enlarged capture. Review corrected the coil's stretched texture, excessive throat contrast and the abrupt end of the neck armor by continuing low shields onto the coil. The independent neck motion replaces rigid oscillation.

Technical evidence is kept separately from visual judgment. The user subsequently responded “this is much better” and asked to transfer the methodology into the rulebook and trial guided Sol 6.1 production. This accepts the living Hydra direction as a useful quality reference; it is not a claim of photorealism or approval of every detail. The current model remains procedural and stylized; there is no muscle solver, facial soft-tissue simulation or subsurface skin shader.

Current Hydra verification: **249 unit tests across 36 files**, formatting and production build pass. The gallery/shell run passed 16 browser checks and exposed a Hydra normal-map export failure; the corrected map passed a subsequent three-check run covering all six GLB exports, Hydra's multi-view captures and video. Reloaded Hydra GLB vertices match the live deformed skin within 0.0001 model units at three sampled times. A final live-gallery check exposed a negative startup frame delta after model construction; clamping that delta passed the targeted playback/video check. The existing lazy-gallery bundle warning remains.

Delivery files and a source-hash manifest are in `test-results/hydra-delivery/`. Final visual/export evidence is in `test-results/hydra-living-export-fixed/`; startup-clock evidence is in `test-results/hydra-living-clock-fixed/`. Other study builders were compared with the preserved source snapshot and remain byte-identical. No game rules, saves or SVG sources changed.

## Nightjar and Phoenix continuation

The user requested the living-Hydra method in the shared rulebook and explicitly selected **both Nightjar and Phoenix** for the next work. The [guided Sol 6.1 trial](art-review-sol61-creatures-2026-10-06.md) owns the current bird briefs, authorship and review evidence. The earlier bronze Nightjar above is historical context, not the current material target. The Hydra model is preserved through this continuation.
