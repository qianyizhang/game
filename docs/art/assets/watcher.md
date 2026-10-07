# Pit Watcher asset record

**Status:** author-reviewed; user approval is unrecorded. Authored and reviewed directly.

**Scope:** Hearth `watcher` / Pit Watcher, registered as `watcher` in the 3D gallery. `Watcher()` in `FiendIllustrations.tsx` supplies the broad single amber eye, muted violet skin, low curling horns, heavy shoulders and dark shoulder panels. The living Hydra is the accepted construction reference; Phoenix supplies the fitted-motion comparison. Earlier builders remain unchanged.

## Brief and interpretation

A heavy living sentinel leans forward to inspect the room. One hand rests at the edge of an open leather jerkin while the other hangs ready beside staggered feet. A broad eye, low horns and short neck make the head the dominant mass. The lower garment and stance extend the source’s bust-length view. The source’s dark shoulder panels are interpreted as worn leather; skin, keratin, eye and leather use distinct surface treatments. Gallery, enlarged inspection and narrow phone views are the target sizes.

The existing portrait is the reference for the single-eye construction, horn contour and broad shoulders. No external models or textures are imported.

## Consequential revisions

The first clay pass showed a projecting eye, bulbous cheeks, loose garment edges and thighs intersecting the wrap. The next pass recessed the eye, reduced cheek and brow relief, brought the hand toward the lapel and widened the lower wrap. Shaping the vest from the whole body introduced cloth fragments on the forearm, so its field was restricted to torso and neck. Garment topology then closed successfully. Lowering the armhole tops leaves continuous leather bridges over the shoulders instead of disconnected strap ends. The resulting collar cut initially coincided with a sampling layer, collapsing cap triangles and leaving 88 open edges; placing that cut between layers restores the closed cap.

Replacing the raised iris disc with pigmentation on one continuous eye surface exposed a deeper anatomical defect: the neck union partly refilled the eye opening. Cutting the socket after the neck/skull union preserves a single unobstructed eye. A regression check casts rays through the visible eye over the motion cycle; positional eye bounds alone had not detected the occlusion.

The wrap needed two separate corrections. Its side-wall winding was opposite the intended outward orientation even though the rim directions were correct. Side walls were reversed independently, and tests now check signed volume, radial wall normals and both rim normals. Its fitted radius also briefly picked up the relaxed arm; fitting now uses only the torso and legs. Binary refinement of that radius removes visible stepped bands without changing the subject’s stance. Skin sampling around the eye rim was refined as well.

Frozen builders and matching views are retained in `test-results/watcher-construction-source/`, `watcher-structure2-source/`, `watcher-structure3-source/`, `watcher-structure4-source/` and `watcher-materials-source/`, with corresponding capture directories. Failed candidates remain as review history rather than final delivery evidence.

## Construction and motion

A three-bone anchor/neck/head rig deforms the skin and fitted jerkin. Horns, mouth and eye socket follow the head. The continuous eye surface makes a small scan within the opening. The first blink compressed the eye and exposed an empty dark socket in the motion review. Fitted upper and lower skin lids now rotate closed, with a brief fully closed interval that survives animation sampling. Tests verify lid closure and a ray hitting the lids before the eye. Feet, hands, claws and hip wrap remain still. The six-second clip is authored motion, not a biological or garment simulation.

## Evidence and limits

The stance, hands, leather interpretation and lower garment extend the original portrait. The eye is a stylized cyclopean interpretation; its restrained scan and blink are authored transforms. Close inspection still shows some sampled edges around the garment openings and eye corners. Materials may render differently in other GLB viewers. Original SVGs and game mechanics remain unchanged.

Historical captures, snapshots and delivery receipts: `test-results/watcher-construction-source/`; `test-results/watcher-delivery/`; `test-results/watcher-lid-final/`. These retained occurrences remain protected; absent local artifacts must be reported as unavailable.

The original 2026-10-07 review, including exact test counts, export measurements, failed attempts and then-current repository gate limits, is preserved at Git `85462d4924c79328723ca6c30a2d32a3e12d568e:docs/art-review-watcher-2026-10-07.md`. [The migration record](../../../maintenance/document-migration.json) pins its SHA-256. Historical verification is not a fresh test or aesthetic acceptance.
