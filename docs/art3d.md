# 3D object studies

Open **3D art gallery** from any table, or visit `/?art=3d`. Six existing illustrations have exportable 3D interpretations with their original live SVGs beside them.

| Study    | Form and material                                                                                                            | Six-second motion loop                                                              |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Nightjar | Living dusk plumage, low crown and compressed chest, fitted folded wings, descending tail and a thin rising branch           | Small head turn, brief blink and delayed wing/tail response                         |
| Catalyst | Flattened smoked-glass decanter and slender companion vial, dark olive liquid and meniscus, fitted copper and suspended seal | Gas bubbles rising inside the liquid, and expanding surface ripples in both vessels |
| Phoenix  | Living ember plumage, unequal wing gestures, overlapping charcoal-tipped vanes, swept crest and tail above basalt            | Restrained shoulder flex, delayed wrist motion, head movement and tail follow       |
| Spiral   | Cream shell with an expanding whorl, double wall and open aperture, quiet brass mount                                        | Slow rigid display oscillation                                                      |
| Vajra    | Aged metal grip and paired pierced curved lobes with continuous joined tips                                                  | Slow rigid display oscillation                                                      |
| Hydra    | Living moss-green skin, coiled muscle, overlapping armor, worn horn crowns and recessed amber eyes                           | Three independently bending necks, watchful heads and hinged jaws                   |

The [aesthetic rulebook](art-direction.md) governs gesture, cohesive stylization, construction, materials and visual review. The [creature redesign record](creature-redesign-2026-10-06.md) explains the user-led change in direction. These are procedural object studies. The three creatures use living skin or plumage and authored motion; they are not biological simulations. The [guided Sol 6.1 trial record](art-review-sol61-creatures-2026-10-06.md) records Nightjar and Phoenix ownership, review rounds and evidence.

## Explore and export

Drag to orbit; scroll or pinch to zoom. Named camera buttons also work by keyboard. **Play/Pause animation**, speed selection and a scrubbable timeline inspect the six-second loops. Reduced-motion preferences disable initial playback. Layer separation is available for Nightjar, Catalyst and Phoenix and pauses motion while active. Spiral, Vajra and Hydra retain their assembled form; the gallery disables layer separation for these studies. Slow turntable, wireframe and three lighting presets remain available. Returning restores keyboard focus to the gallery entry.

**Download 3D model** exports the assembled asset as binary glTF (`.glb`) with named meshes, embedded pigment and normal textures, and one animation clip. It excludes the plinth, lighting, current camera and inspection transforms. Hydra includes a 28-bone skin rig: the coil stays anchored while three neck chains deform the flesh and fitted armor; heads and jaws move at their own pivots. Nightjar and Phoenix also use skinned continuous body/neck surfaces, with facial parts following the head frame and articulated feather groups moving around fitted pivots. Their lower bodies and grips stay anchored. The remaining studies animate node transforms around authored pivots. These are authored loops, not biological simulations. Glass uses glTF transmission and alpha blending; the liquid uses a translucent layer so its contents remain visible in the real-time renderer. These are appearance approximations, not a simulation of nested optical media. Appearance depends on the importing viewer.

**Save animation loop** records six seconds of actual canvas frames as WebM, from the current camera and lighting. It records the authored animation at 1× speed with the turntable stationary, including when preview playback is paused. Keep the gallery visible during recording; changing tabs or leaving the gallery cancels it. Controls lock during capture. WebM recording requires browser MediaRecorder/canvas capture support; unsupported browsers can still export animated GLBs. **Save image** captures the current rendered view as PNG.

## Durable sources

- `src/art3d/models.ts`: study registration, material/caption metadata, the glass Catalyst builder, inspection separation and resource disposal. Construction normalizes vertex normals, including the exporter's fallback for collapsed tips, so live rendering and GLB export use the same data.
- `src/art3d/nightjar.ts`: continuous living bird body, fitted bill/eyes, folded feather planes, gripping feet, branch and subject-specific motion tracks.
- `src/art3d/phoenix.ts`: continuous firebird breast/neck/head, articulated unequal wings and tail, fitted basalt grip and subject-specific motion tracks.
- `src/art3d/newStudies.ts`: isolated shell and pierced metal instrument geometry, plus the shared closed loft helper. These rigid object studies use a small display oscillation.
- `src/art3d/hydra.ts`: the living Briar Hydra interpretation. Fused shoulder/neck/coil geometry, locally generated scale pigment and relief, fitted keratin armor, sculpted cranial planes, gums, dentition, tongue and horns; independent neck chains share one skin rig.
- `src/art3d/animation.ts`: sampled periodic clips shared by live playback and GLB export. Endpoints match exactly; gas bubbles become small before wrapping.
- `src/art3d/recording.ts`: video capture with format detection, visible-tab requirement, cancellation and stream cleanup.
- `src/art3d/StudyViewer.tsx`: renderer, orbit controls, large softbox reflection cards, softened shadows, a quiet radial backdrop, bounds-based camera framing, animation mixer, export and resource disposal. Rendering pauses in hidden tabs; pixel ratio is capped at 2.
- `src/art3d/ArtStudio.tsx` and `ArtStudio.css`: responsive gallery, source comparison, playback controls and downloads.
- `src/app/Hub.tsx`: lazy gallery navigation. Three.js loads when the gallery opens.

Geometry, textures and animation are authored locally. There are no remote textures or model downloads. WebGL is required for the interactive view. These are authored interpretations of the SVG subjects. Game mechanics and save formats are unaffected.

## Verification

Run `npm run check` and `npm run test:browser -- tests/browser/art3d.spec.ts tests/browser/shell.spec.ts`. Follow `AGENTS.md` for macOS browser execution. Unit checks cover animation targets, finite tracks, loop continuity, normalized skin weights, fixed support regions and attached head frames. The browser export check reloads the three creatures’ animated GLBs and compares sampled deformed vertices and all animated node transforms with the live models at three times. It also saves identically lit live/exported PNGs for material review. Browser checks cover all six rendered studies, scrubbed pose changes, animated GLB contents, video downloads and decoding with changing frames, desktop/phone fit, PNG downloads, reduced motion, return focus and save preservation. Inspect desktop, detail and phone screenshots under `test-results/browser/` for visual quality.

The 2026-10-06 Nightjar/Phoenix delivery passed **252 unit tests and 11 gallery/shell browser tests**. Final model, video, image and source-hash evidence is under `test-results/sol61-creatures-delivery/`; the [trial record](art-review-sol61-creatures-2026-10-06.md) separates Sol's four guided rounds per bird from the parent's direct finishing work and records remaining visual limits.
