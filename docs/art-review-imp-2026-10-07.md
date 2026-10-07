# Coal Imp — sixteenth sequential creature conversion

**Scope:** Hearth `imp` / Coal Imp, registered as `imp` in the 3D gallery. `Imp()` in `FiendIllustrations.tsx` supplies the low shoulders, lateral bat ears, curled horns, projecting muzzle, small fangs, warm plum skin and unequal membrane wings. The living Hydra is the accepted construction reference; Phoenix supplies the fitted-motion comparison. Amalgam’s closed membrane and skin-binding techniques are reused without changing that builder.

The model is authored and reviewed directly. Author review does not establish user approval.

## Brief and interpretation

A small living fiend leans forward from a low crouch. One hand reaches farther from the chest; the other stays close to the bent legs. The broad ears and unequal wings answer the tilted head. Two curled horns, hooded amber eyes, a projecting nose and small fangs identify the source character. The full crouch and hands are an authored extension of the portrait. Gallery, enlarged inspection and narrow phone views are the target sizes.

The [Smithsonian bat-wing explanation](https://airandspace.si.edu/stories/editorial/bats) informs the arm, wrist and finger-supported membrane construction, as in Amalgam. The source illustration supplies the ear and facial interpretation. This is a fantasy anatomy and a display loop, not a species reconstruction or flight simulation.

## Review and verification

The first clay pass had swollen thighs, protruding horizontal brows and an exposed wrist stem on the near hand. Front and side inspection exposed those defects before surface work. The second pass reduced and bent the thighs, reduced the brows and chin, and aligned each palm to its actual forearm vector. The cupped hands now meet the arms in the front and side views; the rear view shows continuous shoulder-to-wing transitions.

The material pass uses plum skin with a pale facial/chest region, dark sockets, amber eyes, thin wine-colored webbing and pale keratin tips over dark horn roots. Fine pores, tension wrinkles and axial horn grain stay subordinate to the silhouette. Eyes were recessed during this pass. The membrane and finger rig use the body's attachment-weight field so the lower wing roots stay anchored during flex.

Frozen source and matching captures are retained under `test-results/imp-construction-source/`, `imp-construction/`, `imp-structure2-source/`, `imp-structure2/`, `imp-materials-source/` and `imp-materials/`. Author inspection covers clay front/side/rear, silhouette, enlarged material and phone views. Each capture is an observation, not an aesthetic approval.

Four subject tests pass: closed outward solids and normalized weights; grounded soles and stationary hands/claws; face attachment and membrane/finger fit; actual palm/forearm and body/wing-wrist joins through 145 sampled frames. The full suite passes **337 unit tests across 57 files** and **8 trace tests**. The production build and owned-file formatting pass. `npm run check` stops at the unrelated `docs/viz.md` formatting issue; the remaining commands were run independently. The existing gallery chunk-size advisory remains a warning.

The final **7 selected browser checks pass**: all twenty-two studies' rendering/export/save-preservation and phone check; Imp multi-view review, direct-link/reduced-motion and playable video tests; and three shell/navigation checks. This was a selected run, not a rerun of every older study's individual video test.

| Delivery check          | Observed result                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Animated GLB            | 10,864,308 bytes; 17 skins sharing 7 distinct bones; 10 animated nodes; 9 embedded images                             |
| Reimported motion       | Maximum sampled vertex error 3.0542e-8 model units; node-transform error 0                                            |
| Paired appearance       | Live/reimported images inspected under matching camera and light; pigment, roughness, wings and horn shading retained |
| Video                   | Browser WebM plus H.264 MP4; 994 × 674 pixels; 6.033333 seconds; MP4 190,306 bytes                                    |
| Preservation            | All 40 baseline-pinned earlier-model and original-source files unchanged                                              |
| Durable source evidence | 33 exact source files with SHA-256 manifest in the delivery snapshot                                                  |

Final captures and browser evidence are in `test-results/imp-final/`. The delivery at `test-results/imp-delivery/` contains the animated GLB, WebM/MP4, video frame sheet, clay and material views, phone/UI captures, paired reimport images, metrics, logs and source snapshot. The final builder is byte-identical to the frozen material candidate. No SVG or game-rule changes were made.

## Remaining visual limits

The crouch and hands extend a bust-length SVG into an authored full body. The face remains a broad stylized fiend; its proportions and restrained six-second listening/flex loop are fantasy interpretation, not anatomical or flight evidence. The original in-game SVG is preserved. Texture and lighting appearance can differ in other GLB viewers.
