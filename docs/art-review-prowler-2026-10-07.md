# Alley Prowler — first sequential creature conversion

**Scope:** one new living model, Hearth's `cat` / Alley Prowler, registered as `prowler` in the 3D gallery. The existing `Panther` SVG supplies the forest palette, broad feline muzzle, rounded ears and watchful gaze. Living Hydra is the accepted methodological reference; Phoenix supplies an additional presentation and export comparison. Hydra, Phoenix and Nightjar model sources remain unchanged.

The user requested existing assets converted one model at a time, starting with living creatures. This model was authored and reviewed directly, without delegation. Its review status is **author-reviewed**, not user-approved or a declaration of equal quality to Hydra.

## Brief

A forest-coated predator pauses during a low stalk. The reaching forepaw leads; a compressed, bent hind leg answers it. A turned head, short muzzle, hooded amber eyes and long returning tail identify the feline. The shoulders, flank, haunch, neck and head must read as one connected gesture. Short fur stays subordinate to those large masses. Review includes the normal gallery, enlarged, front/side/rear, motion extremes, blink and 390 px phone view.

## Revisions seen in pixels

| Pass | Finding and response                                                                                                                                                                                                                                 |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | The torso was too heavy, the hind leg folded into a rounded lump, and oversized eyes/ears suggested a juvenile animal. Rebuilt the torso proportions, elbow/hock relationship and head/ear proportions.                                              |
| 2    | The reaching foreleg and hind-leg joints became distinct, but projected markings stretched across the rump and the coat remained too smooth. Revised the coat mapping and texture.                                                                   |
| 3    | The new normal relief looked like repeated scales rather than short fur; cheek accents appeared attached. Rejected that finish. Removed the accents and used smaller, lower-contrast fur marks.                                                      |
| 4    | Regional UV projection removed the cylindrical pole stretching. A finer surface sampling pass followed to improve the small cranial planes. Ear tones were brought closer to the coat. Final exports and final pixels are reviewed separately below. |

Earlier captures and source snapshots are under `test-results/prowler-round1/` through `prowler-round3/`; round 4 captures are under `test-results/prowler-round4/`. Final captures are under `test-results/prowler-final/`. Generated evidence is ignored; `src/art3d/prowler.ts` is the durable model source.

## Construction and delivery

The implicit surface joins the large masses and all four limbs; field-gradient normals preserve smooth broad shading. Regional UVs keep fine fur from stretching around a single cylindrical pole. Geometry carries color variation, while pigment, normal and packed roughness textures are embedded in the GLB. The ear shells have front, rear and joined rim surfaces. Whiskers, nose, mouth, recessed eyes and inner ear features are fitted to the head frame.

A ten-bone skin rig anchors the lower body and paws. A blended neck/head chain turns the head; a separate tail chain adds delayed motion near the tip. Ear flicks and a brief eye closure complete a six-second authored loop. This is a poised animal study, not a walking cycle. It contains no muscle, hair or soft-tissue simulation.

Open `/?art=3d&study=prowler`. The original `cat` artwork appears beside the model. Animated GLB, PNG and recorded WebM use the existing gallery exporters. Reduced motion starts with playback off; layer separation is disabled for the connected assembly.

## Verification

Final delivery passes **267 unit tests in 41 files**, the production build and formatting of every owned file. The trace suite also passed **8 tests** earlier in this turn. The gallery/shell run passed **12 of 13 browser checks** and exposed a slow direct cold load after the finer surface sampling. The corresponding unit construction check hit its five-second limit. Conservative field bounds and UV-vertex reuse reduced redundant construction work; the unchanged direct-link expectation then passed. The final targeted run passed **all 4 checks** covering seven-study GLB export, Prowler visual captures, reduced motion/direct link and Prowler video. The untouched shell and other-study recordings had passed in the preceding run.

Unit coverage checks closed skin after welding UV seams, normalized finite skin weights, anchored paw vertices at the plinth's 0.105-unit top, fitted facial features, tail/head movement, animation binding and loop continuity. Browser coverage reloads the GLB and compares sampled deformed vertices and animated node matrices at three times, including the blink. **Maximum Prowler vertex error: 4.923e-8 model units; maximum animated-node matrix error: 0**, across two skinned meshes and eleven animated nodes. Identically lit live/exported images were visually inspected; no material loss was observed.

Final front, side, rear, enlarged, phone, blink and three motion views were inspected by the author. The completed source, images, animated GLB, WebM and six-second H.264 preview are under `test-results/prowler-delivery/`, with `source-sha256.json`. Test receipts remain in `test-results/prowler-final/` and `test-results/prowler-delivery-checks/`; the former preserves the loading failure and the latter its successful targeted recheck. The MP4 decodes as H.264 at 994 × 674 for 6.033 seconds.

`npm run check` remains blocked at the repository-wide formatting gate by concurrently edited `docs/viz.md` (an earlier attempt also flagged `tests/browser/trace-visualizer.spec.ts`). These files were left to their author. Owned-file formatting, the final complete unit suite and production build were run separately and pass. The gallery retains its existing large-chunk build warning.

**Visual limits:** the coat is a short-fur surface approximation; the small paw and facial forms remain stylized. Motion is restrained and the stance stays planted. Author review and functional checks do not establish user approval.
