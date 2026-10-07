# Bog Toad — sixth sequential creature conversion

**Scope:** Hearth `bogtoad` / Bog Toad, registered as `bogtoad` in the 3D gallery. The source in `ExpansionPortraits.tsx` establishes the broad pale jaw, raised amber eyes, green skin and folded crouch. The accepted living Hydra direction and Phoenix's fitted motion provide the construction and review standard. Earlier builders and the original SVG remain unchanged.

The model was authored and reviewed directly, without delegation. It is **author-reviewed**, not user-approved.

## Brief and interpretation

The toad watches from a low crouch with one forehand set farther forward. A broad jaw and short, neckless body lead into folded haunches. Four fingers on each forehand and five slender toes on each hind foot spread against the ground. The raised amber eyes and pale throat provide the strongest accents; mottling and low skin bumps stay quieter than the posture.

The [Missouri Department of Conservation's American toad guide](https://mdc.mo.gov/discover-nature/field-guide/american-toad) informed the raised glands behind the eyes; its [toad/frog comparison](https://mdc.mo.gov/blogs/discover-nature-notes/toad-or-frog) informed the restrained webbing. These are construction references for a fantasy Bog Toad, not a species reconstruction.

## Revisions seen in pixels

| Pass         | Finding and correction                                                                                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Construction | Detached-looking eye spheres exposed jagged carved socket edges. Removed the socket cuts and fitted thin, curved eye surfaces directly to the skull, blending their outer pigment into the skin.     |
| Structure    | Uniform blunt fingers and a pale mask extending toward the feet weakened the pose. Varied the digit lengths, confined the pale region to jaw/throat and lowered the toe ends to contact the support. |
| Skin         | Added irregular pigment, sparse low bumps fused into the back and fine embedded granular relief. Skin remains matte while the eyes retain a small highlight.                                         |
| Final feet   | Over-tapered tips read as claws. Replaced them with rounded, skin-colored ends and retained the planted contact.                                                                                     |

Frozen candidates and captures are in `test-results/bogtoad-construction/`, `bogtoad-structure2/`, `bogtoad-materials/` and `bogtoad-materials2/`. Final verification is in `test-results/bogtoad-final/`; delivered images, model, video and source hashes are in `test-results/bogtoad-delivery/`. Generated evidence is ignored. The builder, integration, tests and this review are durable sources.

## Construction and motion

One implicit skin joins torso, head, raised eye hoods, glands, limbs and palms. Sparse dorsal relief belongs to that skin rather than a layer of attached spheres. Eighteen tapered toes overlap inside the palms; their rounded terminal forms remain in the same skin material. The mouth and nostrils are fitted to the actual face surface.

A three-bone anchor/head/throat rig preserves the crouch. The head moves slightly, a localized throat region changes with a six-second breathing loop, and the eyes close briefly at 3.35 seconds. Ground-level skin and all toes stay fixed. The loop is authored display motion, not a respiration or locomotion simulation.

Pigment, granular normal texture and packed roughness are generated locally and embedded in GLB exports. Normal-map channel convention matches the existing creatures, including the Moonmoth export repair. The original SVG is shown beside the model at `/?art=3d&study=bogtoad`. Timeline, reduced-motion startup, phone framing, PNG, animated GLB and recorded WebM remain available; layer separation is disabled for the fitted assembly.

## Verification and limits

Subject tests cover welded skin closure, normalized weights, fixed support skin and all eighteen toes, sole heights, fitted face/head movement and bounded throat motion. Shared tests cover finite animation tracks, binding targets and seamless loop endpoints.

Final verification passes **286 unit tests across 47 files**, **8 trace tests**, **23 browser checks**, the production build and owned-file formatting. The browser run includes all twelve studies' renders/exports, animation recording, reduced-motion startup and shell navigation. Visual review covers neutral clay, silhouette, front, side, reverse, enlarged, phone, blink and motion, plus identically lit live/reimported GLB views.

The exported GLB retains **1 skin and 4 animated nodes**. Sampled live/reimported poses differ by at most **2.0062962493492698e-8 scene units** at vertices and **0** at measured nodes. Both rendered views were inspected. The delivered H.264 preview is **994 × 674**, **6.033333 seconds**; the original recorded WebM is preserved beside it.

Earlier Prowler, Wolf, Matriarch, Thornstag and Moonmoth builders/tests match their delivery hashes. Shared surface-sculpt code/tests match the Matriarch delivery; original Hydra, Phoenix, Nightjar and source SVG/content files remain unchanged. The final source snapshot and SHA-256 manifest preserve the exact reviewed implementation.

`npm run check` stops at the concurrent `docs/viz.md` formatting edit. That file remains with its author; owned-file formatting and all test/build stages are run separately. The existing large gallery-chunk warning remains.

**Visual limits:** skin, eyes, folds and digits are stylized; small relief becomes less distinct at phone size. The model stays in its fixed crouch, with no hop or walking cycle. Separate toe-tip volumes are fitted display geometry, not one manufacturing-ready mesh. Passing tests and author review do not establish user approval or equal visual quality to Hydra.
