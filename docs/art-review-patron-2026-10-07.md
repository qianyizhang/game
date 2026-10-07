# Abyssal Patron — twenty-first sequential creature conversion

**Scope:** Hearth `devourer`, registered as `patron` in the 3D gallery. `HornedPatron({ herald: false })` in `FiendIllustrations.tsx` supplies the violet long face, outward-swept horns, pale lavender eyes, small fangs and dark tailored shoulder panels. The living Hydra is the accepted construction reference; Phoenix supplies the fitted-motion comparison. Earlier creature builders remain unchanged.

The model is authored and reviewed directly. Author review does not establish user approval.

## Brief and interpretation

A broad, heavy patron considers the room with one palm extended and the other held across the body. Staggered boots carry the shifted weight; a short split-front coat frames the trousers below. The long violet face, pale swept horns and muted lapels retain the portrait’s identity. The lower body and hand gestures extend the source’s bust-length view. Skin, keratin and woven cloth have separate surface treatments. Gallery, enlarged inspection and phone views are the target sizes. No external models or textures are imported.

## Construction review

The first candidate reuses proven local mesh, material and fitting techniques with new proportions, arm paths, swept horns, short coat tails and separate trousers. The coat has a closed lining and hem, an open front and a waist fitted to the upper garment. The original Herald builder remains unchanged. The first clay views exposed a thigh breaking through the coat and a low rounded crotch. Raising the pelvis and fitting the coat outside the furthest trouser intersection repaired the contact. The first fitting pass still produced sharp ridges: clearance was applied only after intersection, and independently fitting the lining could move it through the outer shell. A smooth radial clearance transition, a slightly fuller hem and a lining derived from the finished outside remove those defects. Tests now check thigh clearance, the open front and positive lining thickness. The first five checks passed despite the visible clothing collision, so that earlier green result was insufficient for visual acceptance. Construction, fitting and shell candidates retain separate frozen sources and captures under `test-results/patron-*`.

## Motion and verification

A three-bone anchor/neck/head rig carries the continuous neck and face. Horns, eyes, mouth and small fangs follow the head. Four fitted skin lids close over two eyes. Feet, hands, coat and trousers remain fixed. The six-second loop is authored motion, not a biological or cloth simulation.

Subject checks cover closed outward connected surfaces, valid skin weights, grounded boots, fixed hands and garments, attached head fittings, unobstructed eyes, actual lid closure, fitted lapels, thigh clearance and positive coat-lining thickness. All six subject checks pass. The full unit run finishes with **372 passes and one timeout across 62 files**: unchanged Watcher construction took 5.085 seconds against its five-second limit while browser rendering was active. The isolated Watcher rerun passes in 3.61 seconds after browser work finishes. No timeout or assertion was relaxed; this is separate rerun evidence, not a clean full-suite result.

Final verification also passes **8 trace tests**, **7 selected browser checks**, the production build, owned-file formatting and diff whitespace checks. Browser coverage includes all 27 studies’ exports and save preservation; Patron’s clay/front/side/rear/silhouette, enlarged, gallery and phone views; sampled motion, direct links, reduced motion and playable video; and shell navigation. The inspected live and reimported images agree in material appearance and pose. The coat’s final clay and enlarged views show no thigh breakthrough or lining ridges.

`npm run check` stops at the unrelated concurrent `docs/viz.md` formatting change. That file remains untouched. The production build retains the existing large-chunk advisory.

| Final artifact property          | Observed value                             |
| -------------------------------- | ------------------------------------------ |
| GLB size                         | 20,009,668 bytes                           |
| Skins / distinct bones           | 1 / 3                                      |
| Animated nodes / embedded images | 6 / 9                                      |
| Maximum reimport vertex error    | 4.31475473951565e-8 model units            |
| Maximum reimport node error      | 0                                          |
| H.264 preview                    | 994 × 674, 6.033333 seconds, 125,449 bytes |

Final captures and exports are in `test-results/patron-final/`. The final builder is frozen in `patron-final-source/`; `patron-delivery/` packages the GLB, WebM/H.264 clips, rendered views, verification logs, roundtrip measurements and a SHA-256 manifest for 40 source files. All 50 baseline-protected files remain unchanged. Technical checks establish the tested construction and export behavior, not user approval of the artwork.

## Remaining visual limits

The standing gesture, lower garments and boots are interpretations of the original portrait. Small garment boundaries remain sampled meshes. Other GLB viewers may shade the materials differently. Original SVGs, game rules and save formats remain unchanged.
