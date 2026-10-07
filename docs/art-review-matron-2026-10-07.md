# Imp Matron — seventeenth sequential creature conversion

**Scope:** Hearth `matron` / Imp Matron, registered as `matron` in the 3D gallery. `Matron()` in `FiendIllustrations.tsx` supplies the long face, swept pale horns, dark hanging hair, pointed bronze crown, muted plum robe, narrow gold edges and diamond pendant. The living Hydra is the accepted construction reference; Phoenix supplies the fitted-motion comparison. Existing builders remain unchanged.

The model is authored and reviewed directly. Author review does not establish user approval.

## Brief and interpretation

A living horned matron pauses with weight over one leg, head lowered toward an open hand. The other hand gathers her robe at the hip. Her narrow head, horns, dark hair and long folded robe give a different contour from Coal Imp. Skin, hair, cloth and worn bronze are distinct physical materials. Gallery, enlarged inspection and narrow phone views are the target sizes.

The [Met's standing-woman study](https://www.metmuseum.org/art/collection/search/247579) informs weight distribution, gathered cloth and V-shaped folds. It is a drapery reference, not a material or anatomical template. The source portrait supplies identity; the full stance and hands extend that bust-length illustration. No external textures or model assets are imported.

## Review and verification

The first clay pass showed protruding cheek masses, tubular hair, a scalloped waist junction, rough sleeve openings and an ankle poking through the skirt. The second pass reduced facial projection, joined the rear hair mass, fitted a sewn waist band and covered the ankle. The third replaced segmented hair tubes with smooth flattened sections and added localized elbow folds.

The first topology run caught an open skirt seam caused by an angular gather that did not wrap at the seam. Wrapped angular distance closed that seam; the duplicated UV boundary now shares matching shading normals. Rounded hair caps and fitted cuff rings resolve the remaining construction edges.

Material inspection exposed a different error: the cutter for the gathering hand's cuff also cut into the neighboring torso. The cutter now applies only to the sleeve before it joins the bodice. Skin was also clipped to fit inside the V neckline, and the diamond was seated at its lower junction. Regression checks sample the robe's front surface near the cuff and the skin's neckline boundary.

Materials separate matte plum cloth, pale skin, dark directional hair, pale horn and restrained bronze. The full-size and phone views preserve the horn/crown contour and unequal hands. Front, side and rear inspection covers the waist, cuffs, hair roots and hem; the blink and three motion poses check the assembled result. These are author observations, not user approval.

Frozen source and matching review captures are retained under `test-results/matron-construction-source/`, `matron-construction/`, `matron-structure2-source/`, `matron-structure2/`, `matron-structure3-source/`, `matron-structure3/`, `matron-materials-source/`, `matron-materials/`, `matron-fittings-source/` and `matron-fittings/`. The initial full unit run passed 342 of 343 tests; unchanged Amalgam construction exceeded its five-second normal-check timeout while the browser suite was active. The full rerun with two workers passed **343 tests across 58 files** in 101.32 seconds. No timeout or assertion was weakened. The production build and eight trace tests pass. The repository-wide check stops at unrelated `docs/viz.md` formatting.

All seven selected browser checks passed, including all twenty-three exports. Visual comparison of the paired reimport images nevertheless exposed blackened exported hair. The source hair material ignores vertex color, but the geometry carried a dark color attribute that glTF included and the importer applied. Removing the unused hair color attribute corrects that mismatch without changing live appearance. A regression assertion now rejects that attribute on the hair mesh. The corrected builder passes its **four subject tests** and the production build; the final **four gallery browser checks pass again**, including all twenty-three studies’ rendering/export/save-preservation and phone check, plus Matron multi-view review, direct-link/reduced-motion behavior and playable video capture. The initial three shell checks remain the shell evidence; this is not a rerun of every older study’s individual video check. Numerical deformation checks alone did not detect this appearance failure.

## Final delivery evidence

| Check             | Observed result                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| Animated GLB      | 20,344,348 bytes; 2 skins sharing 5 distinct bones; 6 animated nodes; 15 embedded images                         |
| Reimported motion | Maximum sampled vertex error 5.7237e-8 model units; node-transform error 0                                       |
| Paired appearance | Corrected live and exported renders inspected with matched camera/light; plum hair and the other materials agree |
| Video             | Browser WebM plus H.264 MP4; 994 × 674 pixels; 6.033333 seconds; MP4 120,071 bytes                               |
| Preservation      | All 42 baseline-pinned earlier-model and original-source files unchanged                                         |
| Source evidence   | 34 exact source files and SHA-256 manifest retained with the delivery                                            |

The delivery is `test-results/matron-delivery/`: animated GLB, WebM/MP4, video frame sheet, clay/material/phone/UI images, paired reimport images, metrics, logs and source snapshot. Final browser evidence is in `test-results/matron-export-fixed/`, with the exact builder in `matron-export-fixed-source/`. Earlier `matron-final/` evidence is retained to show the color defect; it is superseded for delivery. No SVG or game-rule changes were made. Owned-file formatting and `git diff --check` pass; the production build retains its existing gallery chunk-size advisory.

## Remaining visual limits

The full stance, hands and robe extend the original bust-length illustration. Her face is a stylized humanoid interpretation. The restrained six-second head/hair response is authored motion; the cloth remains still and is not a garment simulation. Original SVGs and game mechanics are preserved. Materials may render differently in other GLB viewers.
