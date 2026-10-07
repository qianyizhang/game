# Infernal Herald — twentieth sequential creature conversion

**Scope:** Hearth `infernal`, registered as `herald` in the 3D gallery. `HornedPatron({ herald: true })` in `FiendIllustrations.tsx` supplies the pale long face, inward-curling horns, amber eyes, russet clothing, ochre shoulder panels and forked staff. The living Hydra is the accepted construction reference; Phoenix supplies the fitted-motion comparison. Earlier creature builders remain unchanged.

The model is authored and reviewed directly. Author review does not establish user approval.

## Brief and interpretation

A standing herald addresses the room with an open hand while leaning toward a planted staff. The long pale face and inward curls lead the silhouette; the free hand and bent staff arm make unequal negative spaces. Dark shoulder fabric, ochre cloth lapels, russet folds, dull keratin and a worn bronze staff head separate the surfaces. Staggered boots and a long robe extend the source’s bust-length portrait. Gallery, enlarged inspection and phone views are the target sizes. No external models or textures are imported.

## Construction revisions

The first clay pass exposed horn-root caps, an open waist seam and an ankle pushing through the robe. The staff grip also had 60 open mesh edges where its wrist exceeded the sampling volume. Moving the horn roots inside the skull, fitting the robe to the coat’s radial surface, lowering the boot ankle and enlarging the grip’s sampling volume repaired those defects. Smaller cheek, jaw and brow relief gives the long face quieter planes.

The first waist repair fit only one height; the rear view still showed competing surfaces below the top ring. Fitting at each overlapping height and keeping a small outer clearance removes that interference. The original neckline also let the bare chest cover the new lapels. Restricting the chest surface to the actual opening gives the cloth a fitted border. Broader normal gradients soften visible sleeve centerline bands. Earlier construction captures and their source snapshots remain under `test-results/herald-construction*`, `herald-structure2*`, `herald-materials-fixed*` and `herald-fitting*`.

Two intermediate local edit errors prevented candidates from loading: a duplicate color variable and an unmatched helper-call parenthesis. Their failed logs remain separate from final evidence.

## Motion and verification

A three-bone anchor/neck/head rig carries the continuous neck and face. Horns, eyes, small fangs and the mouth follow the head. Four fitted skin lids close over the two eyes; the blink includes a short fully closed interval so sampled animation preserves closure. The staff, grip, raised hand, robe and boots stay fixed. This is a six-second authored gesture, not a biological or cloth simulation.

Subject checks cover closed outward solids, connected surfaces, normalized skin weights, planted boots and staff, a grip surrounding the shaft, head fittings, unobstructed eyes, actual lid closure and lapel-to-coat fitting. Final verification passes **365 unit tests across 61 files with one worker**, **8 trace tests**, **7 selected browser checks**, the production build, owned-file formatting and diff whitespace checks. Browser coverage includes Herald’s front/side/rear/clay/silhouette, enlarged, actual gallery and phone views; motion controls, reduced motion, direct links and a playable video; all 26 studies’ exports and save preservation; and shell navigation. The live and reimported images agree in the inspected material and pose views.

`npm run check` stops at the unrelated concurrent `docs/viz.md` formatting change. That file remains untouched. The production build retains the existing large-chunk advisory. Unit tests use one worker because earlier subjects approached the default construction timeout under parallel CPU load; no test timeout or assertion was relaxed.

| Final artifact property          | Observed value                             |
| -------------------------------- | ------------------------------------------ |
| GLB size                         | 16,257,304 bytes                           |
| Skins / distinct bones           | 1 / 3                                      |
| Animated nodes / embedded images | 6 / 12                                     |
| Maximum reimport vertex error    | 1.934168467485183e-8 model units           |
| Maximum reimport node error      | 0                                          |
| H.264 preview                    | 994 × 674, 6.033333 seconds, 130,667 bytes |

Final captures and exports are in `test-results/herald-final/`. The final builder is frozen in `herald-final-source/`; `herald-delivery/` packages the GLB, WebM/H.264 clips, rendered views, verification logs, roundtrip measurements and a SHA-256 manifest for 38 source files. All 48 baseline-protected files remain unchanged. Technical checks establish the tested construction and export behavior, not user approval of the artwork.

## Remaining visual limits

The stance, lower robe, boots and hand gestures extend the original portrait. Small garment edges remain visibly sampled under close inspection. Other GLB viewers may shade the materials differently. Original SVGs, game rules and save formats remain unchanged.
