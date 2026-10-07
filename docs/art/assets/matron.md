# Imp Matron asset record

**Status:** author-reviewed; user approval is unrecorded. Authored and reviewed directly.

**Scope:** Hearth `matron` / Imp Matron, registered as `matron` in the 3D gallery. `Matron()` in `FiendIllustrations.tsx` supplies the long face, swept pale horns, dark hanging hair, pointed bronze crown, muted plum robe, narrow gold edges and diamond pendant. The living Hydra is the accepted construction reference; Phoenix supplies the fitted-motion comparison. Existing builders remain unchanged.

## Brief and interpretation

A living horned matron pauses with weight over one leg, head lowered toward an open hand. The other hand gathers her robe at the hip. Her narrow head, horns, dark hair and long folded robe give a different contour from Coal Imp. Skin, hair, cloth and worn bronze are distinct physical materials. Gallery, enlarged inspection and narrow phone views are the target sizes.

The [Met's standing-woman study](https://www.metmuseum.org/art/collection/search/247579) informs weight distribution, gathered cloth and V-shaped folds. It is a drapery reference, not a material or anatomical template. The source portrait supplies identity; the full stance and hands extend that bust-length illustration. No external textures or model assets are imported.

## Construction and motion

The first clay pass showed protruding cheek masses, tubular hair, a scalloped waist junction, rough sleeve openings and an ankle poking through the skirt. The second pass reduced facial projection, joined the rear hair mass, fitted a sewn waist band and covered the ankle. The third replaced segmented hair tubes with smooth flattened sections and added localized elbow folds.

The first topology run caught an open skirt seam caused by an angular gather that did not wrap at the seam. Wrapped angular distance closed that seam; the duplicated UV boundary now shares matching shading normals. Rounded hair caps and fitted cuff rings resolve the remaining construction edges.

Material inspection exposed a different error: the cutter for the gathering hand's cuff also cut into the neighboring torso. The cutter now applies only to the sleeve before it joins the bodice. Skin was also clipped to fit inside the V neckline, and the diamond was seated at its lower junction. Regression checks sample the robe's front surface near the cuff and the skin's neckline boundary.

Materials separate matte plum cloth, pale skin, dark directional hair, pale horn and restrained bronze. The full-size and phone views preserve the horn/crown contour and unequal hands. Front, side and rear inspection covers the waist, cuffs, hair roots and hem; the blink and three motion poses check the assembled result. These are author observations, not user approval.

Paired reimport review exposed blackened exported hair even after numerical and browser checks passed. The live material ignored vertex colors, while the GLB importer applied a leftover dark color attribute. Removing that unused attribute repaired the mismatch; a regression assertion guards it. Earlier `matron-final/` captures retain the rejected color defect. Numerical deformation checks did not detect this appearance failure.

## Evidence and limits

The full stance, hands and robe extend the original bust-length illustration. Her face is a stylized humanoid interpretation. The restrained six-second head/hair response is authored motion; the cloth remains still and is not a garment simulation. Original SVGs and game mechanics are preserved. Materials may render differently in other GLB viewers.

Retained delivery: `test-results/matron-delivery/` (views, export and source evidence). Superseded intermediate captures, snapshots and repeated whole-gallery exports were retired in the [lean cleanup](../../engineering/cleanup-triage.md). The original dated review remains recoverable from Git.

The original 2026-10-07 review, including exact test counts, export measurements, failed attempts and then-current repository gate limits, is preserved at Git `85462d4924c79328723ca6c30a2d32a3e12d568e:docs/art-review-matron-2026-10-07.md`. [The migration record](../../../maintenance/document-migration.json) pins its SHA-256. Historical verification is not a fresh test or aesthetic acceptance.
