# Ancient Crocolisk — seventh sequential creature conversion

**Scope:** Hearth `croc` / Ancient Crocolisk, registered as `crocolisk` in the 3D gallery. `AnimalPortrait` in `MinionArt.tsx` supplies the long pale jaw, hooded amber eye, exposed teeth and armored neck. The accepted living Hydra direction supplies the anatomical and review standard; Phoenix supplies a comparison for fitted motion. Original artwork and earlier creature builders remain unchanged.

The model was authored and reviewed directly, without delegation. It is **author-reviewed**, not user-approved.

## Brief and interpretation

A living marsh predator holds a low watch with its head turned across staggered forefeet. The long, shallow skull leads the gesture; the broad body carries weight into splayed hind limbs and a tail curling back toward the viewer. Quiet olive flank skin separates the pale jaw from the dorsal ridges. The gallery, enlarged inspection and narrow phone view are the target sizes.

The [Australian Museum's estuarine crocodile reference](https://australian.museum/learn/animals/reptiles/estuarine-crocodile/) informed the raised eyes/nostrils, broad snout and muscular tail. The [Smithsonian's Cuban crocodile reference](https://nationalzoo.si.edu/animals/cuban-crocodile) informed the dorsal shield as a distinct anatomical region. These guide construction of the fantasy creature; this is not a species reconstruction.

## Revisions seen in pixels

| Pass         | Finding and correction                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Construction | The rearward tail vanished in the main view, and thick forelimbs made the silhouette read too much like a large lizard. Lowered the body, slimmed the forelimbs and swept the tail forward around the hindquarters. |
| Jaw          | The first gape and dense teeth dominated the head. Reduced the resting gape and number/length of teeth while preserving a separate fitted jaw hinge.                                                                |
| Armor        | A few plate vertices missed the body during projection and fell toward the floor. Shrunk footprints to remain on the actual surface, skipped absent support and added a regression check.                           |
| Surface      | Raised blocks looked too manufactured in the enlarged view. Softened them into lower elongated ridges, reduced their color contrast and rounded the unclawed toe ends.                                              |

Frozen candidates and captures are under `test-results/crocolisk-construction/`, `crocolisk-structure2/`, `crocolisk-armor/`, `crocolisk-armor2/`, `crocolisk-materials/` and `crocolisk-materials2/`. Final verification is in `test-results/crocolisk-final/`; delivered images, model, video and source hashes are in `test-results/crocolisk-delivery/`. Generated evidence is ignored; source geometry, integration, tests and this review are durable.

## Construction and motion

One implicit skin joins skull, neck, torso, limbs, palms and the curved tail. The lower jaw closes its own volume and turns at a fitted hinge; its mouth floor and teeth follow that same frame. Eyes sit against raised orbital planes. Eighteen toes remain fixed with twelve fitted claws; the unclawed ends are rounded display geometry.

Six bones anchor the body, move the head, breathe through a localized upper-body region and give the distal tail a delayed response. Ground-level skin and all feet remain fixed. Each dorsal plate uses the body's skin weights at its own coordinates, so small breathing and tail movements preserve its fit. Jaw and eyes animate at their fitted pivots. The six-second loop is authored watchful motion, not a locomotion or respiration simulation.

Small irregular scale pigment, normal relief and packed roughness are generated locally and embedded in exports. Larger dorsal and tail ridges are geometry. The original SVG appears beside the model at `/?art=3d&study=crocolisk`. Timeline, reduced-motion startup, phone framing, PNG, animated GLB and recorded WebM remain available; layer separation is disabled for the fitted assembly.

## Verification and limits

Subject tests cover welded skin closure, finite normalized weights, planted lower skin, eighteen fixed toes, head/face fit, jaw/teeth fit and tail motion. The armor regression rejects non-finite projections and plates that extend toward the floor. Shared tests cover bindings and exact loop endpoints. Visual review covers silhouette, neutral clay, front, side, rear, large, phone, blink and motion extremes.

Final verification passes **290 unit tests across 48 files**, **8 trace tests**, **25 browser checks**, the production build and owned-file formatting. Browser coverage includes all thirteen studies' renders/exports, animation recording, reduced-motion startup and shell navigation. The delivered H.264 preview is **994 × 674**, **6.033333 seconds**; the original recorded WebM is preserved beside it.

The GLB retains **40 skinned meshes using six shared bones**, **8 animated nodes** and **3 embedded images**. Sampled live/reimported poses differ by at most **3.0087064623438885e-8 scene units** at vertices and **0** at measured nodes. Both identically lit rendered views were inspected. The GLB is **12,926,100 bytes**.

Earlier Prowler, Wolf, Matriarch, Thornstag, Moonmoth and Bogtoad builders/tests match their delivery hashes. Shared surface-sculpt code/tests match the Matriarch delivery; original Hydra, Phoenix, Nightjar and SVG/content files remain unchanged. The final source snapshot and SHA-256 manifest preserve the exact reviewed implementation.

`npm run check` stops at the concurrent `docs/viz.md` formatting edit. That file remains with its author; owned-file formatting and all test/build stages are run separately. The existing large gallery-chunk warning remains.

**Visual limits:** this remains a stylized display creature in one crouch. The plate pattern and scale mapping approximate regional anatomy; there is no gait, swimming cycle or physical muscle simulation. Separate teeth, claws, plates and rounded toe tips are fitted display geometry rather than a manufacturing-ready unified mesh. Small scales become less distinct on a phone. Passing tests and author review do not establish user approval or equal visual quality to Hydra.
