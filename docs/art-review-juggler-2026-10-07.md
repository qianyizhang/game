# Soul Juggler — eighteenth sequential creature conversion

**Scope:** Hearth `juggler` / Soul Juggler, registered as `juggler` in the 3D gallery. The `Imp({ juggler: true })` portrait in `FiendIllustrations.tsx` supplies bat ears, curved horns, hooded amber eyes, small fangs, raised hands and two violet spirits. Its wingless silhouette distinguishes it from Coal Imp. The living Hydra is the accepted construction reference; Phoenix supplies the fitted-motion comparison. Earlier builders remain unchanged.

The model is authored and reviewed directly. Author review does not establish user approval.

## Brief and interpretation

A small living fiend attends two spirit flames, one palm higher than the other. The tilted chest rises from a staggered stance. Pale facial planes and chest interrupt muted violet skin; horns and claws use worn keratin. The full stance extends the bust-length source portrait. Gallery, enlarged inspection and narrow phone views are the target sizes.

The existing source portrait is the reference for the ear/horn contour, wingless body and hand-to-spirit relationship. The right spirit has a shorter bent apex and smaller secondary tongue; the left rises into a taller curl. Both are closed sculptural volumes with a pale front core. No external models, textures or particle assets are imported.

## Construction and material review

The first clay pass established the raised-arm negative spaces but exposed protruding eyes, abrupt wrist transitions and shading bands on the limbs. The second pass recessed and flattened the eyes, extended each palm root inside its actual forearm direction, reduced the low pelvic bulge and widened the abdominal transition. Wider finite differences smooth skin normals without changing the contour. The two spirits now have different curves. A small exposed core tip at the flame base was buried inside its outer volume.

Front, side and rear clay views cover the body-to-head transition, shoulders, elbows, wrists, ears and horn roots. The original and revised candidates are frozen in `test-results/juggler-construction-source/` and `juggler-structure2-source/`, with corresponding review directories. The final builder is frozen in `test-results/juggler-materials-source/`; the final multi-view, UI, motion and export captures are in `test-results/juggler-final/`.

Matte violet skin, warmer pale facial planes, directional keratin and restrained emissive spirits separate the materials. The posture and spirits carry identity at phone size; the surface detail remains quiet. These are author observations, not user approval.

## Motion and verification

The body has an anchor/neck/head skin rig. Weighting explicitly excludes the raised arms from head influence despite their height. Horns, mouth, fangs and eyes follow the head; the ears use small fitted pivots. Feet and raised hands stay still. Each flame and its pale core move as one assembly, following a small independent drift and turn. The six-second loop also includes a brief blink.

Subject tests cover closed outward surfaces, connected body topology, finite normalized skin weights, fixed soles and hand/claw transforms, fitted facial parts, palm-to-forearm joins and clearance beneath both spirits over 145 frames. The initial flame test used transformed local bounding boxes, which overestimated their rotated extents; exact transformed vertex bounds confirmed the actual clearance. The motion range check measures peak-to-peak vertical travel across the loop, rather than distance from the unanimated rest offset.

Final verification passes **350 unit tests across 59 files with two workers**, **8 trace tests**, the production build and owned-file formatting. All **7 selected browser checks pass**: all twenty-four studies’ rendering/export/reimport/save-preservation and phone check; Juggler multi-view review, direct-link/reduced-motion behavior and video capture; and three navigation/save checks. This is not a rerun of every older study’s individual video check.

Matched live and exported renders were inspected directly: skin, horn and flame colors, geometry and framing agree. The final phone view, full UI and three motion poses were also inspected. Technical checks and these author observations do not establish user approval.

## Final delivery evidence

| Check             | Observed result                                                                      |
| ----------------- | ------------------------------------------------------------------------------------ |
| Animated GLB      | 11,228,916 bytes; 1 skin with 3 bones; 8 animated nodes; 6 embedded images           |
| Reimported motion | Maximum sampled vertex error 4.3442e-8 model units; node-transform error 0           |
| Paired appearance | Live and reimported skin, horn and spirit materials agree under matched camera/light |
| Video             | Browser WebM and H.264 MP4; 994 × 674 pixels; 6.033333 seconds; MP4 165,414 bytes    |
| Preservation      | All 44 baseline-pinned earlier-model and original-source files unchanged             |
| Source evidence   | 35 exact source files and a SHA-256 manifest retained with the delivery              |

The delivery is `test-results/juggler-delivery/`: animated GLB, WebM/MP4, video frame sheet, clay/material/phone/UI images, paired reimport images, metrics, logs and source snapshot. `npm run check` stops at unrelated `docs/viz.md` formatting; the remaining checks were run separately. `git diff --check` passes. The production build retains its existing gallery chunk-size advisory. No SVG or game-rule changes were made.

## Remaining visual limits

The full stance and hands extend the original bust-length illustration. The spirits are opaque, gently emissive fantasy shapes with authored drift; this is not a fire simulation or a physical juggling trajectory. The restrained head/ear motion is authored animation. Materials may render differently in other GLB viewers. Original SVGs and game mechanics are preserved.
