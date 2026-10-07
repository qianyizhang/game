# Storm Roc asset record

**Status:** author-reviewed; user approval is unrecorded. Authored and reviewed directly.

**Scope:** Hearth `stormroc` / Storm Roc, registered as `stormroc` in the 3D gallery. The original `ExpansionPortraits.tsx` illustration supplies the cool sea-blue plumage, pale throat, hooked bill, gold-toned toes and unequal raised wing gesture. Hydra supplies the living anatomical direction; Phoenix supplies the feather-region and fitted-motion comparison. Original SVGs and earlier creature builders remain unchanged.

## Brief and interpretation

A living storm raptor braces on a low stone ledge, leaning into a gust. One wing rises higher while the other bends outward and back. The forward chest, hooked bill and pale throat lead the reach; a short tail fan balances it. Matte blue-grey contour plumage, thin flight vanes, dark keratin and ochre-scaled toes carry the material hierarchy. Gallery, enlarged inspection and narrow phone views are the intended sizes.

The [Cornell Golden Eagle reference](https://www.allaboutbirds.org/guide/Golden_Eagle/id) informed the strongly hooked bill and broad-winged raptor silhouette. The [Cornell feather anatomy guide](https://academy.allaboutbirds.org/feathers-article/) informed separate flight vanes, body contours and wing coverts. The pose and palette remain a fantasy interpretation, not a species reconstruction. The source illustration's airborne gesture becomes a supported bracing moment; its drawn lightning marks are not extruded into attached objects.

## Consequential revisions

| Pass              | Finding and correction                                                                                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Construction      | Wing leading edges read as bare tubes; thighs stopped in abrupt cuffs over thin shins. Rebuilt the wing as a flattened continuous envelope with clearer, unequal elbow bends; reshaped thighs and their feather transition.                       |
| Feather contour   | Uniform pointed vanes gave a sawtooth edge. Broadened the terminal vane shape while keeping unequal sides and thin curved surfaces.                                                                                                               |
| Roots and wrist   | Covert roots made raised square edges and the hand coverts formed bulky wrist caps. Narrowed and buried roots, reduced hand volume, and made the hand coverts follow the primary fan.                                                             |
| Fitted coverts    | Flat covert strips still formed repeated strap edges. Replaced them with low-relief surfaces fitted directly around the actual curved wing envelope. Widened the overlapping secondary vanes to close narrow slots in their inner trailing plane. |
| Body and material | Head and breast contours looked tiled in the enlarged view. Reduced relief and color contrast, reserved the short head contours for the nape, and quieted the wing palette. Added local toe-shield markings.                                      |
| Grip              | Testing all eight toe surfaces against the actual ledge found a small clearance under one toe. Lowered the grip assembly and fitted the tarsus endpoint to it; the tightened contact check passes.                                                |

The first paired GLB review exposed a smooth exported rock where the live view had flat facets. Three.js material `flatShading` did not preserve those planes by itself. The correction stores independent face vertices and face normals in the geometry; a subject regression check now covers them.

## Construction and motion

A closed sectional surface runs from the compressed pelvis through the forward chest and neck into the crown, with shallow orbital recesses. A three-bone skin rig blends the neck and head above an anchored lower body. Fitted contour surfaces share the same rig. The hooked upper/lower bill, small eyes, brows and swept nape feathers follow the head.

Each wing has a closed flattened envelope through its shoulder, elbow and wrist. Fitted mantle and covert surfaces wrap that envelope; fourteen overlapping secondaries and nine asymmetric primaries form distinct flight regions. Seven short rectrices form the tail fan. Feather helpers and generated material logic were adapted locally from Phoenix; that earlier model was not edited. Thin vanes are closed geometry; low-relief fitted plumage is intentionally a surface layer.

The two shoulder pivots flex slightly, wrist pivots respond after a delay, and the short tail follows. A small head turn and brief blink answer that motion. The ledge, thighs, tarsi, eight toes and eight claws stay fixed. This is a six-second authored bracing loop, not flight or a biomechanical simulation.

Generated feather pigment, barb relief, roughness and toe-shield textures remain embedded in the animated export. The original SVG appears beside the model at `/?art=3d&study=stormroc`. Timeline, reduced-motion startup, phone framing, PNG, animated GLB and recorded WebM remain available. Layer separation is disabled for the fitted assembly.

## Evidence and limits

**Visual limits:** feather spacing, skull planes and the rock remain stylized; the small display loop does not fold or fly the wings. The wing envelope, vane overlap and nape simplify avian anatomy. Fine barbs, toe scales and facial detail diminish on a phone. Fitted parts and surface layers are display geometry rather than a manufacturing-ready unified mesh. Technical checks and author review do not establish user approval or equal visual quality to Hydra.

Retained delivery: `test-results/stormroc-delivery/` (views, export and source evidence). Superseded intermediate captures, snapshots and repeated whole-gallery exports were retired in the [lean cleanup](../../engineering/cleanup-triage.md). The original dated review remains recoverable from Git.

The original 2026-10-07 review, including exact test counts, export measurements, failed attempts and then-current repository gate limits, is preserved at Git `85462d4924c79328723ca6c30a2d32a3e12d568e:docs/art-review-stormroc-2026-10-07.md`. [The migration record](../../../maintenance/document-migration.json) pins its SHA-256. Historical verification is not a fresh test or aesthetic acceptance.
