# Nest Guardian — ninth sequential creature conversion

**Scope:** Hearth `rat` / Nest Guardian, registered as `guardian` in the 3D gallery. Its existing `AnimalPortrait` in `MinionArt.tsx` supplies the pointed muzzle, broad ears, whiskers, grey-brown coat and pale facial planes. Hydra supplies the living anatomical direction and Phoenix the fitted-motion comparison. Original artwork and earlier creature builders remain unchanged.

The model was authored and reviewed directly, without delegation. It is **author-reviewed**, not user-approved.

## Brief and interpretation

A nest guardian rises into a listening pause, settling weight into its hindquarters while unequal forepaws gather beside the chest. The tapered muzzle reaches across the upright torso; the long tail curves around the stance. Broad ears and small dark eyes answer the head turn. The gallery, enlarged inspection and narrow phone view are the intended sizes.

The [Smithsonian's Norway rat reference](https://nationalzoo.si.edu/animals/norway-rat) informed the contrast between short grey-brown fur and the exposed nose, ears and tail, the pale underside, and active whiskers. [Animal Diversity Web's house rat account](https://animaldiversity.org/accounts/Rattus_rattus/) informed the broad ears, narrow skull and long tail. These are construction references for the existing fantasy artwork, not a species reconstruction.

## Revisions seen in pixels

| Pass         | Finding and correction                                                                                                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Construction | The first torso was uniformly rounded and the far ear nearly disappeared edge-on. Narrowed the upper body, shifted the haunch transition and turned the far ear toward the viewer. |
| Face         | The raised brow resembled an attached strip. Replaced it with a shallow socket and adjusted head weights so fitted mouth details follow the jaw surface during the turn.           |
| Surface      | Replaced the flat inner-ear patch with a continuous concave cup and regional color. Added quiet short-fur relief and a separate fine ring pattern along the tail.                  |
| Feet         | Most hind toes were buried inside the furry foot mass. Shortened that mass, exposed more bare foot and rotated the unequal forepaws to make their fingers readable.                |

Frozen candidates are under `test-results/guardian-construction/`, `guardian-structure2/`, `guardian-structure3/`, `guardian-materials/` and `guardian-materials2/`. Final verification is in `test-results/guardian-final/`; delivered images, model, video, logs and source hashes are in `test-results/guardian-delivery/`. Generated evidence is ignored; source geometry, integration, tests and this review are durable.

## Construction and motion

One implicit skin joins torso, neck, skull, muzzle, haunches and limbs. Two grounded hind feet carry five exposed toes each; two raised hands carry four fingers each. Eighteen small claws follow their digits. Rounded concave ear cups, recessed eye groups, a bare nose, fitted mouth curves and two whisker fans follow the head. The tail is a separate closed tapered surface whose root is buried inside the rump.

Five bones anchor the body, blend neck/head motion and move the distal tail through two frames. Tail rotations stay in the floor plane. The tail cap centers bind to their own ends rather than inheriting the loft helper's neutral cap UV. Ears rotate at their roots; whisker fans move with a small sensing response; a brief blink scales the fitted eyes. The six-second loop is an authored listening pose, not locomotion or physical muscle simulation.

Locally generated fur pigment, normal relief and packed roughness are embedded in exports. The tail has its own longitudinal mapping and subdued ring relief; ear cups and bare digits use quiet matte skin. The original SVG appears beside the model at `/?art=3d&study=guardian`. Timeline, reduced-motion startup, phone framing, PNG, animated GLB and recorded WebM remain available; layer separation is disabled for the fitted assembly.

## Verification and limits

Subject tests cover welded body/tail closure, finite normalized weights, stable hind feet and raised hands, eighteen fixed claws, face/head fit, ear and whisker roots, anchored tail base, unchanged tail heights and moving tail tip across the loop. Shared tests cover bindings and exact endpoints. Final verification passes **299 unit tests across 50 files**, **8 trace tests**, **29 browser checks**, the production build and owned-file formatting. Browser coverage includes all fifteen studies’ renders/exports, animation recording, reduced-motion startup and shell navigation. The delivered H.264 preview is **994 × 674**, **6.033333 seconds**; the original recorded WebM is preserved beside it.

The GLB retains **2 skinned meshes using five shared bones**, **10 animated nodes** and **6 embedded images**. Sampled live/reimported poses differ by at most **2.882642229115255e-8 scene units** at vertices and **0** at measured nodes. Both identically lit rendered views were inspected. The GLB is **6,133,320 bytes**.

Earlier Prowler, Wolf, Matriarch, Thornstag, Moonmoth, Bogtoad, Crocolisk and Scavenger builders/tests match their delivery hashes. Shared surface-sculpt code/tests match the Matriarch delivery; original Hydra, Phoenix, Nightjar and SVG/content files remain unchanged. The final source snapshot and SHA-256 manifest preserve the exact reviewed implementation.

`npm run check` stops at the concurrent `docs/viz.md` formatting edit. That file remains with its author; owned-file formatting and all test/build stages are run separately. The existing large gallery-chunk warning remains.

**Visual limits:** this remains a stylized display creature in one raised stance. The coat mapping and bare-skin transition simplify regional anatomy; fine whiskers, fur and tail rings lose detail on a phone. Separate ears, claws, fingers, facial details and tail are fitted display geometry rather than a manufacturing-ready unified mesh. Passing tests and author review do not establish user approval or equal visual quality to Hydra.
