# Hearth Squire — twenty-second sequential creature conversion

**Scope:** Hearth `squire`, registered as `squire` in the 3D gallery. `HumanPortrait({ kind: 'squire' })` in `MinionArt.tsx` supplies the closed steel helmet, narrow visor, muted gray clothing and pale shoulder plates. The accepted living Hydra supplies the construction reference; Phoenix supplies the fitted-motion comparison. Earlier models and the original SVG remain unchanged.

The model is authored and reviewed directly. Author review does not establish user approval.

## Brief and interpretation

A compact adult guard braces behind a forward shield, the other hand around a sheathed sword. The shield leads the gesture; the turned helmet and unequal arms answer it. Staggered boots carry the weight. Dull steel, woven linen, leather and painted wood separate the surfaces. The standing pose and equipment extend the source’s bust portrait, informed by Squire’s existing defensive role. Gallery, enlarged and phone views are the target sizes. No external models or textures are imported.

## Construction review

The first clay views exposed shoulder plates spreading across the upper chest and broad triangular shading on the curved shield. Bounded shoulder shells replace the original radial fitting; a sampled curved shield face replaces the warped sparse triangulation. The first technical checks also found duplicate walls along the helmet’s closed seam, eyelids just behind the eyeball surface and a finger curl that did not fully surround its handle. Seam closure, slightly deeper lids and longer curls address these separately. A second fit pass lowers the shoulder domes and narrows the visor. A straight shield handle and two mounts remove the bowed handle’s separation from the grip. The sword-grip ray checks avoid the loft’s exact duplicated longitudinal seam, where floating-point edge intersection could miss the handle. A final surface pass quiets steel reflections and adds restrained, vertically mapped wood grain; the visor’s lower edge follows a pointed chin contour. An intermediate wood-texture expression failed TypeScript parsing and was corrected before rendering; that failed log remains separate from final evidence. Frozen sources and views retain those rejected candidates under `test-results/squire-*`.

## Motion and verification

A three-bone anchor/neck/head rig carries the continuous neck and head. Helmet, visor and eyes follow the head; the shield, sword, hands, garments and boots stay fixed. Four fitted eyelids blink behind the real visor opening. The six-second loop is authored motion, not a biological, cloth or combat simulation.

All six subject checks pass: closed outward connected solids and normalized weights; grounded boots and fixed equipment; head/helmet fitting; a real visor opening with closing skin lids; fingers surrounding both handles; and shoulder plates fitted over the sleeves without crossing the chest. The final full unit run passes **381 tests across 63 files with one worker**.

Final verification also passes **8 trace tests**, **7 selected browser checks**, the production build, owned-file formatting and diff whitespace checks. Browser coverage includes all 28 studies’ exports and save preservation; Squire’s clay/front/side/rear/silhouette, enlarged, gallery and phone views; motion controls, direct links, reduced motion and playable video; and shell navigation. The inspected live and reimported views agree in material appearance and pose. The shield retains its broad curved surface through export.

`npm run check` stops at the unrelated concurrent `docs/viz.md` formatting change. That file remains untouched. The production build retains the existing large-chunk advisory. The full unit run uses one worker after browser work finishes to avoid competing construction/rendering load; no timeout or assertion was relaxed.

| Final artifact property          | Observed value                             |
| -------------------------------- | ------------------------------------------ |
| GLB size                         | 26,564,604 bytes                           |
| Skins / distinct bones           | 1 / 3                                      |
| Animated nodes / embedded images | 6 / 12                                     |
| Maximum reimport vertex error    | 2.342392214253977e-8 model units           |
| Maximum reimport node error      | 0                                          |
| H.264 preview                    | 994 × 674, 6.033333 seconds, 119,580 bytes |

Final captures and exports are in `test-results/squire-final/`. The final builder is frozen in `squire-final-source/`; `squire-delivery/` packages the GLB, WebM/H.264 clips, rendered views, verification logs, roundtrip measurements and a SHA-256 manifest for 42 source files. All 52 baseline-protected files remain unchanged. Technical checks establish the tested construction and export behavior, not user approval of the artwork.

## Remaining visual limits

The full-body equipment and pose interpret a bust portrait. Small garment edges remain sampled surfaces. Other GLB viewers may shade materials differently. Original game rules, SVGs and save formats remain unchanged.
