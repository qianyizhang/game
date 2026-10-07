# Pit Watcher — nineteenth sequential creature conversion

**Scope:** Hearth `watcher` / Pit Watcher, registered as `watcher` in the 3D gallery. `Watcher()` in `FiendIllustrations.tsx` supplies the broad single amber eye, muted violet skin, low curling horns, heavy shoulders and dark shoulder panels. The living Hydra is the accepted construction reference; Phoenix supplies the fitted-motion comparison. Earlier builders remain unchanged.

The model is authored and reviewed directly. Author review does not establish user approval.

## Brief and interpretation

A heavy living sentinel leans forward to inspect the room. One hand rests at the edge of an open leather jerkin while the other hangs ready beside staggered feet. A broad eye, low horns and short neck make the head the dominant mass. The lower garment and stance extend the source’s bust-length view. The source’s dark shoulder panels are interpreted as worn leather; skin, keratin, eye and leather use distinct surface treatments. Gallery, enlarged inspection and narrow phone views are the target sizes.

The existing portrait is the reference for the single-eye construction, horn contour and broad shoulders. No external models or textures are imported.

## Construction revisions

The first clay pass showed a projecting eye, bulbous cheeks, loose garment edges and thighs intersecting the wrap. The next pass recessed the eye, reduced cheek and brow relief, brought the hand toward the lapel and widened the lower wrap. Shaping the vest from the whole body introduced cloth fragments on the forearm, so its field was restricted to torso and neck. Garment topology then closed successfully. Lowering the armhole tops leaves continuous leather bridges over the shoulders instead of disconnected strap ends. The resulting collar cut initially coincided with a sampling layer, collapsing cap triangles and leaving 88 open edges; placing that cut between layers restores the closed cap.

Replacing the raised iris disc with pigmentation on one continuous eye surface exposed a deeper anatomical defect: the neck union partly refilled the eye opening. Cutting the socket after the neck/skull union preserves a single unobstructed eye. A regression check casts rays through the visible eye over the motion cycle; positional eye bounds alone had not detected the occlusion.

The wrap needed two separate corrections. Its side-wall winding was opposite the intended outward orientation even though the rim directions were correct. Side walls were reversed independently, and tests now check signed volume, radial wall normals and both rim normals. Its fitted radius also briefly picked up the relaxed arm; fitting now uses only the torso and legs. Binary refinement of that radius removes visible stepped bands without changing the subject’s stance. Skin sampling around the eye rim was refined as well.

Frozen builders and matching views are retained in `test-results/watcher-construction-source/`, `watcher-structure2-source/`, `watcher-structure3-source/`, `watcher-structure4-source/` and `watcher-materials-source/`, with corresponding capture directories. Failed candidates remain as review history rather than final delivery evidence.

## Motion and technical verification

A three-bone anchor/neck/head rig deforms the skin and fitted jerkin. Horns, mouth and eye socket follow the head. The continuous eye surface makes a small scan within the opening. The first blink compressed the eye and exposed an empty dark socket in the motion review. Fitted upper and lower skin lids now rotate closed, with a brief fully closed interval that survives animation sampling. Tests verify lid closure and a ray hitting the lids before the eye. Feet, hands, claws and hip wrap remain still. The six-second clip is authored motion, not a biological or garment simulation.

The first full run caught the collar-cap defect. After repair, a subsequent full run hit the five-second timeout during Watcher construction; the assertions did not fail. Conservative bounds now skip distant limb-field samples. The first bounded pass completed all 358 tests. A wider final margin preserves the earlier shape more closely: comparison against the pre-optimization candidate found a maximum position difference of 2.3842e-7 model units, with matching vertex counts. The wider version still approached the five-second construction limit with two workers, so the final full run uses one worker. No assertion or timeout was relaxed.

Six subject tests cover closed outward solids, connected body topology, finite normalized skin weights, planted soles, fixed hands/claws, fitted facial parts and palm roots, eye clearance and gaze bounds, lid closure, and clothing winding and clearance.

## Verified delivery

- **Unit checks:** 358 tests across 60 files passed with one worker before the final eyelid revision. After adding the lids and closed interval, all 8 affected Watcher, model-contract and animation checks passed again. The full suite was not repeated after that local revision.
- **Browser checks:** all 7 selected checks passed on the final source. Coverage includes Watcher visual review, direct-link/reduced-motion behavior, animation controls and video capture, all 25 studies’ export/reimport and phone checks, save preservation, and shell navigation.
- **Build and ancillary checks:** production build and 8 trace tests passed. Owned-file formatting and diff whitespace checks passed. `npm run check` stops at the unrelated concurrent `docs/viz.md` formatting change; that file is preserved.
- **Visual review:** final front, side, rear, clay, silhouette, large, phone, actual gallery, sampled motion and closed-blink views were inspected. Paired live/exported images show matching materials and silhouette. Technical checks support construction and export integrity; they do not establish user approval of the artwork.

| Final artifact property          | Observed value                             |
| -------------------------------- | ------------------------------------------ |
| GLB size                         | 26,883,660 bytes                           |
| Skins / distinct bones           | 2 / 3                                      |
| Animated nodes / embedded images | 5 / 9                                      |
| Maximum reimport vertex error    | 5.2729059711327315e-8 model units          |
| Maximum reimport node error      | 0                                          |
| H.264 preview                    | 994 × 674, 6.033333 seconds, 141,170 bytes |

Final browser evidence is in `test-results/watcher-lid-final/`; the exact final builder is retained in `watcher-lids-final-source/`. `test-results/watcher-delivery/` packages the GLB, WebM/H.264 clips, rendered views, roundtrip measurements, verification logs and a SHA-256 manifest for 36 source files. All 46 baseline-protected files remain unchanged. The earlier `watcher-final/` blink capture is superseded and retained as failure evidence.

## Remaining visual limits

The stance, hands, leather interpretation and lower garment extend the original portrait. The eye is a stylized cyclopean interpretation; its restrained scan and blink are authored transforms. Close inspection still shows some sampled edges around the garment openings and eye corners. Materials may render differently in other GLB viewers. Original SVGs and game mechanics remain unchanged.
