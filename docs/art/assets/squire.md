# Hearth Squire asset record

**Status:** author-reviewed; user approval is unrecorded. Authored and reviewed directly.

**Scope:** Hearth `squire`, registered as `squire` in the 3D gallery. `HumanPortrait({ kind: 'squire' })` in `MinionArt.tsx` supplies the closed steel helmet, narrow visor, muted gray clothing and pale shoulder plates. The accepted living Hydra supplies the construction reference; Phoenix supplies the fitted-motion comparison. Earlier models and the original SVG remain unchanged.

## Brief and interpretation

A compact adult guard braces behind a forward shield, the other hand around a sheathed sword. The shield leads the gesture; the turned helmet and unequal arms answer it. Staggered boots carry the weight. Dull steel, woven linen, leather and painted wood separate the surfaces. The standing pose and equipment extend the source’s bust portrait, informed by Squire’s existing defensive role. Gallery, enlarged and phone views are the target sizes. No external models or textures are imported.

## Consequential revisions

The first clay views exposed shoulder plates spreading across the upper chest and broad triangular shading on the curved shield. Bounded shoulder shells replace the original radial fitting; a sampled curved shield face replaces the warped sparse triangulation. The first technical checks also found duplicate walls along the helmet’s closed seam, eyelids just behind the eyeball surface and a finger curl that did not fully surround its handle. Seam closure, slightly deeper lids and longer curls address these separately. A second fit pass lowers the shoulder domes and narrows the visor. A straight shield handle and two mounts remove the bowed handle’s separation from the grip. The sword-grip ray checks avoid the loft’s exact duplicated longitudinal seam, where floating-point edge intersection could miss the handle. A final surface pass quiets steel reflections and adds restrained, vertically mapped wood grain; the visor’s lower edge follows a pointed chin contour. An intermediate wood-texture expression failed TypeScript parsing and was corrected before rendering; that failure was recorded separately from final evidence.

## Construction and motion

A three-bone anchor/neck/head rig carries the continuous neck and head. Helmet, visor and eyes follow the head; the shield, sword, hands, garments and boots stay fixed. Four fitted eyelids blink behind the real visor opening. The six-second loop is authored motion, not a biological, cloth or combat simulation.

## Evidence and limits

The full-body equipment and pose interpret a bust portrait. Small garment edges remain sampled surfaces. Other GLB viewers may shade materials differently. Original game rules, SVGs and save formats remain unchanged.

Retained delivery: `test-results/squire-delivery/` (views, export and source evidence). Superseded intermediate captures, snapshots and repeated whole-gallery exports were retired in the [lean cleanup](../../engineering/cleanup-triage.md). The original dated review remains recoverable from Git.

The original 2026-10-07 review, including exact test counts, export measurements, failed attempts and then-current repository gate limits, is preserved at Git `85462d4924c79328723ca6c30a2d32a3e12d568e:docs/art-review-squire-2026-10-07.md`. [The migration record](../../../maintenance/document-migration.json) pins its SHA-256. Historical verification is not a fresh test or aesthetic acceptance.
