# Wild Amalgam — fifteenth sequential creature conversion

**Scope:** Hearth `amalgam` / Wild Amalgam, registered as `amalgam` in the 3D gallery. The existing portrait in `MinionArt.tsx` supplies the green living body, pale cranial plane, long purple muzzle, swept horn, purple membrane wing, bronze chest plate and blue lower appendage. Hydra supplies the accepted living-sculpture direction; Phoenix supplies the fitted wing and motion comparison. Earlier models and the original illustration remain unchanged.

The model is authored and reviewed directly, without delegation. Author review does not establish user approval.

## Brief and interpretation

A living chimera holds a guarded crouch, stretching its horned head beyond staggered forefeet. The near wing lifts into a bent arm and scalloped membrane; the far wing folds lower. A blue tail curls around the compressed hindquarters. The green skin, pale skull, plum muzzle and single fitted chest plate preserve the source’s mixed character. Gallery, enlarged inspection and narrow phone views are the target sizes.

The [Smithsonian’s bat-wing explanation](https://airandspace.si.edu/stories/editorial/bats) informs the named arm, wrist and elongated finger supports. The source is a fantasy portrait; the quadruped body, additional pair of wings, full tail and crouching action are authored interpretations. This is not a species reconstruction or a flight simulation.

## Construction review

- **First clay:** the wing roots read as cones attached to round shoulder lumps. Removed the extra shoulder masses, buried the roots more deeply and bent the upper arms forward before the wrist sweep.
- **Muzzle and crown:** the round skull and separated rounded lips read too softly. Flattened the cranial plane, formed a blunt muzzle, closed the lip transition and reduced the exposed eye assemblies. Added a transition at the swept horn’s root.
- **Chest plate:** the first plate had mixed face/rim winding and a stepped surface. Fitted the surface with a binary field intersection rather than a stepped sample. A later face-on material review exposed that reversing the entire mesh had hidden its bronze front. Corrected the rim separately and added front/back normal-direction assertions; the final face-on view shows the incised plate.

Frozen sources and pixels are under `test-results/amalgam-construction/` and `test-results/amalgam-structure2/`, with matching `-source/` directories. The material pass added inner wing membranes and separate skin, membrane, horn and bronze surfaces. It exposed a remaining root seam: the shoulder pass fused the upper arms, and the final `amalgam-continuous/` pass carries the same closed body surface all the way to both wrists. Matching source snapshots accompany each pass. A texture-expression syntax error in the earlier `amalgam-materials/` attempt was corrected before `amalgam-textures/`; that failed attempt is not visual evidence. The final clay side view revealed a detached fragment where the narrow tail tip fell below the sampling scale. Widened the terminal taper and added a connected-surface assertion. The final model is in `test-results/amalgam-plate-fixed-source/`, with final model/export evidence in `amalgam-plate-fixed/` and shell checks in `amalgam-final/`. The packaged delivery is in `test-results/amalgam-delivery/`.

## Construction and motion

The continuous skin uses an anchored body with neck, head, two tail frames and two shoulder/wrist chains: nine distinct bones. The fitted chest plate shares that rig. Eight thin, closed, cambered membrane panels and their curved fingers use the same shoulder and wrist bones. Small head and wrist motions, delayed tail movement and a brief blink form one six-second loop. All four soles and twelve claws remain planted. Locally generated scale relief, stretched membrane grain, horn growth and incised bronze details are embedded in the GLB.

## Verification and limits

Four subject tests cover a single connected body surface, closed outward geometry, normalized skin weights, fixed soles/claws/shoulder pivots, skull attachments, membrane-to-finger fitting, and plate/body and wrist/finger contact through motion. The subject tests have a 15-second allowance for the full surface construction and 145-frame contact sweep. These are structural checks, not an aesthetic verdict.

- **331 unit tests across 56 files** and **8 trace tests** pass. After the final plate correction, all **four focused subject tests**, the production build and owned-file formatting pass again.
- **Seven selected browser checks are verified.** The first final run passed six: all twenty-one studies’ render/export/reimport and phone/save checks, Amalgam visual and video review, and three shell navigation checks. The direct-link test stopped at its five-second visibility timeout while the cold gallery was still opening. An explicit 15-second construction wait repaired that test, which passed in a separate run; reduced-motion and title assertions remain intact. After the plate correction, the four gallery checks were rerun, including all twenty-one exports and Amalgam’s visual, direct-link and video checks. Earlier subjects’ individual video tests were not rerun.
- The **13,772,132-byte GLB** retains eighteen skinned meshes using **nine distinct bones**, ten animated nodes and twelve embedded images. Sampled maximum vertex error after reimport is **3.043 × 10⁻⁸ model units**; sampled node-transform error is zero. The paired live/exported renders preserve the reviewed appearance.
- The original browser WebM and derived **994 × 674 H.264 MP4** are preserved. The MP4 is **6.033333 seconds**, **249,675 bytes**; decoded frames were inspected.
- **37 preservation hashes match**, covering the fourteen earlier creature builders/tests, shared sculpt helper/tests, original Hydra/Phoenix/Nightjar builders, SVG art and minion content. The delivery includes exact owned/reference source bytes and their SHA-256 manifest.
- **Repository-wide gate remains blocked:** `npm run check` stops at unrelated formatting in concurrent `docs/viz.md` edits. Separate unit, trace and production build checks pass. The existing large-chunk build warning remains.

The anatomy remains a stylized fantasy construction. Initial model construction can take several seconds. Small scale relief and the chest engraving diminish on a phone; the chest plate is best inspected from the face-on view. Its small display loop holds the crouch; separate fitted parts are not a manufacturing-ready unified mesh. The complete cross-game conversion goal remains active.
