# Briar Cub — fourteenth sequential creature conversion

**Scope:** Hearth `cub` / Briar Cub, registered as `cub` in the 3D gallery. The `Bear young` variant in `CreatureIllustrations.tsx` supplies the rounder cranium, warmer face, short pale muzzle and prominent foreground paw. The living Hydra is the anatomical direction; Phoenix supplies the fitted-motion and export standard. Matriarch is the adult comparison. Earlier models and SVG sources remain unchanged.

The model was authored and reviewed directly, without delegation. It is **author-reviewed**, not user-approved.

## Brief and interpretation

A young bear lowers its tilted head toward an outstretched forepaw. The short torso rises toward the hindquarters; the second forepaw stays closer to the chest. Rounded ear cups and broad, short-clawed paws carry the curious foraging gesture. The head proportions, compact torso and reach distinguish it from the adult Matriarch’s heavy braced stance. Gallery, enlarged inspection and narrow phone views are the intended sizes.

The [National Park Service black-bear reference](https://www.nps.gov/brca/learn/nature/american-black-bear.htm) informed the rounded ears and short tail. The source illustration supplies the cub proportions and warm palette; the tilted reaching pose is an authored fantasy interpretation, not a species or age reconstruction.

## Revisions seen in pixels

| Pass             | Finding and correction                                                                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Initial clay     | The long torso and low head read more like an adult, with a heavy brow and dish-like ears. Shortened the torso and reach, lifted the head and reduced the brows.                                                               |
| Ear interiors    | A separate inner oval read as a raised coin within each cup. Removed it and colored the continuous cup surface.                                                                                                                |
| Face and ear rim | The remaining brow additions still made a harsh overhang. Removed them and moved the eye assemblies into the revised sockets. Rebuilt the ear shells with a continuous rounded rim profile rather than thin joined disk edges. |
| Coat regions     | The pale muzzle mask also affected the reaching paw. Bounded it in head space so the muzzle remains pale and the paw returns to the warm coat palette.                                                                         |

Frozen candidates are in `test-results/cub-construction/`, `cub-structure2/` and `cub-face/`, each with a corresponding `-source/` snapshot. Final browser evidence is in `test-results/cub-final/`; the packaged images, animated GLB, video, logs and exact source snapshot are in `test-results/cub-delivery/`. Generated evidence is ignored; the builder, integration, tests and this review are durable.

## Construction and motion

A continuous implicit surface joins the compact body, rising rump, staggered limbs, lowered neck and round skull. Five short digits form each broad paw. A small tail is fused into the rump. The two closed ear cups, recessed eyes, shaped nose and surface-fitted mouth curves follow the head. Locally generated coat pigment, short-strand relief and roughness use warm brown, quieter feet and a pale muzzle.

One skinned mesh uses three bones: anchor, neck and head. The head makes a small scenting movement, the ears respond unequally and the eyes briefly blink. Four soles and all twenty claws stay fixed. This is a six-second authored foraging loop, not a walking cycle or biomechanical simulation.

The original SVG appears beside the model at `/?art=3d&study=cub`. Timeline, reduced-motion startup, phone framing, PNG, animated GLB and recorded WebM remain available. Layer separation stays disabled for the fitted assembly. Matriarch’s local material techniques and the shared implicit-surface helper were reused without changing that model.

## Verification and limits

Three subject tests cover closed outward body/ear geometry, finite normalized weights, four grounded soles, fixed support vertices and twenty claws, and fitted nose/eye/ear attachment points through the loop. Shared tests cover animation binding and matching endpoints.

- **325 unit tests across 55 files**, **8 trace tests**, the production build and owned-file formatting pass.
- **7 selected browser checks pass:** all twenty studies render and export, reimport validation, phone framing and save preservation; Cub clay/material/motion review, direct link and reduced-motion behavior, recording and decoded video; and three shell navigation checks. Earlier subjects’ individual video tests were not rerun.
- The **8,865,932-byte GLB** retains one skinned mesh, three bones, six animated nodes and six embedded images. Sampled maximum vertex error after reimport is **2.96 × 10⁻⁸ model units**, with zero sampled node-transform error. The paired live/exported renders were inspected and retain the coat, face, ears and reaching pose.
- The preserved browser WebM and derived H.264 MP4 show the six-second loop. The MP4 is **994 × 674 pixels**, **6.033333 seconds**, and **140,589 bytes**; decoded frames were inspected.
- Hash checks confirm that the thirteen earlier creature builders and tests, shared sculpt helper, original Hydra/Phoenix/Nightjar builders, SVG art and minion content remain unchanged by this conversion. The delivery pins the reviewed source bytes.
- **Repository-wide gate remains blocked:** `npm run check` stops at unrelated formatting in concurrent `docs/viz.md` edits. The separate unit, trace and build checks above pass. The build retains its existing large-chunk warning.

**Visual limits:** the skull, paw transitions and ear posture remain stylized. Fine coat strands, short claws and mouth curves diminish on a phone. The small display loop holds its reaching pose throughout. Fitted parts are display geometry rather than a manufacturing-ready unified mesh. Technical checks and author review do not establish user approval or equal visual quality to Hydra.
