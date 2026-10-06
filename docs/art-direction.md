# Card Workshop aesthetic rulebook

**Direction: cohesive, expressive fantasy sculpture and engraved illustration.** Style, gesture and the relationship between forms come first. References help explain weight, movement and construction; literal resemblance is secondary. The work should feel authored at card size and convincing when enlarged. A serious image can be colorful or playful; darkening the palette, adding grain or increasing polygon count does not repair weak drawing.

This is the shared visual standard for SVG illustration, 3D studies and their presentation. The [art skill](../skills/card-art/SKILL.md) describes the workflow; [SVG tooling](card-art.md) and [3D tooling](art3d.md) locate the implementations. Game rules remain authoritative.

## Judge in this order

| Priority                 | Required reading                                                  | Reject when                                                                                                   |
| ------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Gesture and silhouette   | One dominant subject, a specific pose, useful negative space      | The image is a pile of recognizable primitives or a default mirrored emblem                                   |
| Structure and proportion | Connected anatomy, believable joints, weight and support          | A bird is an egg with attached wings; a head or limb floats; every creature has the same proportions          |
| Large surface planes     | Light, middle and shadow describe the form before decoration      | Tiny details hide a lumpy silhouette or every plane has an equally strong outline                             |
| Material                 | Each surface has its own edge, reflection, thickness and wear     | Everything is glossy plastic; liquid is opaque paint; every edge is gold                                      |
| Detail and accents       | Detail follows structure, with quiet areas between focal passages | Scales, leaves, scratches, ribs or symbols repeat at equal spacing across the whole subject                   |
| Presentation and motion  | Framing and movement clarify the object                           | A flattering angle hides defects; cropped wings, dramatic light or perpetual motion conceal weak construction |

**Fix the first failing row before adding detail below it.** These are visual judgments, not numerical test assertions.

## Living subjects need a designed gesture

The user's correction on 2026-10-06 is decisive: the problem is not pixel accuracy to a reference. Static manufactured objects were more successful; creatures felt like wooden logs stuck together. Smooth connections alone did not fix that.

- Begin with one action line through the whole subject. Decide where weight rests, where the form compresses and where it reaches. A resting animal can still be alert, tense or watchful.
- Design large masses and the negative spaces between them together. Vary their orientation, taper and rhythm; do not arrange repeated parts around a neutral torso.
- Let one gesture lead and the others answer it. Several necks or wings should not be equally upright, equally spread or equally important.
- Make the silhouette and broad untextured planes work before texture. A muted palette, continuous mesh, scales or feathers cannot give an inert pose character.
- Choose a consistent stylization: simplify anatomy into connected, expressive planes and carry the same treatment through body, head, appendages, material and support. Avoid a realistic eye attached to a crude mass or detailed feathers on a generic oval.
- Use a reference for a named design decision, then interpret it. Do not equate species fidelity, procedural complexity, repaired topology or checklist completion with successful art.

## Form before ornament

- Establish an action line and three or four large masses. Inspect a flat silhouette and an untextured form before adding engraving. A reused primitive must change proportion, curvature and overlap for the subject.
- Keep a hierarchy of edges: strongest at the identifying contour, softer where forms turn or overlap, minimal inside quiet surfaces. Uniformly sharp or outlined edges flatten the image.
- Introduce purposeful asymmetry through pose, depth and wear. Do not add random noise to compensate for an otherwise mirrored composition.
- Connect parts through overlapping structure. Roots of feathers disappear under coverts; branches taper through forks; straps and metal collars visibly fit the object they hold.
- Retain enough empty space around a beak, paw, wingtip or weapon to identify it at the actual display size.

## Medium-specific decisions

### SVG prints

Use a small family of printing inks and three readable value groups. Curved anatomy and overlapping planes carry volume; engraving supports it. Reserve straight edges for objects that have them. Avoid symbol faces, stick limbs, triangle bodies and pictogram collages.

Keep established palettes in `src/shared/art/CardArt.tsx`:

| Family      | Palette and construction                                                              |
| ----------- | ------------------------------------------------------------------------------------- |
| Blindside   | Cream, forest ink, ochre, restrained coral; cut-paper overlap and engraved contours   |
| Spire       | Forged metal, asymmetric cloth, muted copper; Silent adds sage, poison green and plum |
| Last Hearth | Natural creature colors, selective gold, distinct flight and serpentine gestures      |

Golden states retain the anatomy and readable silhouette. A distinct upgrade changes action, pose or supporting objects as well as color. Compare the base and upgrade together. Puzzle illustration suggests the subject without exposing the solution. HTML carries names, stats and actions; decorative illustration must not obscure them.

### 3D objects

Choose the physical interpretation before modeling: living creature, carved object, metal casting, glass instrument. Keep its materials and motion consistent with that choice. Translating an SVG means rebuilding its volume, not extruding every drawn mark into a separate object.

- **Birds:** define shoulder, elbow and wrist before flight feathers. Secondaries overlap into a continuous trailing plane; primaries separate mainly toward the tips. Use thin, asymmetric vanes and curved shafts. Coverts lie with the wing. The breast is a continuous volume with restrained surface relief, not a tiled pinecone. A species reference guides head, bill, eye, neck and leg proportions.
- **Feather regions:** the [Cornell feather anatomy guide](https://academy.allaboutbirds.org/feathers-article/) distinguishes mostly flat, asymmetric flight vanes from overlapping body contour feathers and the coverts that smooth wing attachments. Use those roles to design regional construction. One universal leaf or ribbon generator with different lengths is insufficient. Verify visible barb direction, staggered contour tips and buried roots in the enlarged render; merely attaching a texture does not establish a feather surface. Judge texture frequency and contrast in rendered pixels: a dense pattern with only a few color-byte levels of variation may disappear after filtering. Use a readable medium-scale pattern before adding microscopic grain, and keep the hero view quiet.
- **Glass and liquid:** show a rim, wall thickness, distinct fill level and a fitted closure. Preserve enough transmission to distinguish the liquid from painted resin. Avoid large bright bubbles unless the subject calls for foam. Nested transparency is renderer-dependent; inspect exports as well as the live view.
- **Metal:** broad reflections describe curvature; roughness distinguishes polished edges from recessed or worn surfaces. Gold and patina belong to selected regions. Dark material and metallic settings alone do not establish bronze.
- **Wood and stone:** grain and fractures follow the underlying form. Branches taper and toes contact their support. A pedestal frames the subject; it should not dominate its bounds or become a second focal object.
- **Motion:** begin with a convincing still pose. Keep roots attached, support points stable and secondary motion delayed. Breathing should be nearly imperceptible. A periodic rotation is a kinematic study, not evidence of anatomically correct flight. Preserve the still pose under reduced motion.

## Construction checks before surface polish

The first delegated Spiral/Vajra/Hydra review exposed failures that palette and detail rules alone did not prevent. Apply these checks before treating a textured model as ready:

- **Outer faces must face outward.** Inspect curved solids under a single-sided material from front, side and back. Check side-wall and end-cap winding separately. Inward surfaces can look like dark ribbons, hollow jaws or missing limbs. Double-sided rendering is appropriate for an intentional thin sheet, not a repair for a solid mesh. Use a geometric regression check when a shared generator caused the defect.
- **A joint needs a transition volume.** Overlapping an oval and a tube is a blockout. Replace the visible junction with a taper, shoulder or continuous loft; hide cap planes inside that connection. Inspect neck-to-skull and limb-to-body joins from behind. If the primitives remain recognizable as assembled parts, structure is unfinished.
- **Supports are part of the object assembly.** A mount must visibly meet its load in all views and throughout a display animation. Animate the object and its fitted bracket together, or keep the whole assembly still. A rod that happens to overlap in the hero view is not sufficient contact.
- **Interpretation requires identifying construction.** A shell needs a coherent expanding whorl, depth, a visible aperture and a thin lip. A pierced metal object needs an articulated grip, fitted collars, joined prongs and readable interior space. Establish these before stripes, engraving or patina. A generic coil or cage with the right label is still a blockout. Write down the two or three features that distinguish the subject before building it; confirm those features in the rendered view, not only in mesh names.
- **Continuous geometry needs continuous shading.** Merging forms is not enough if the resulting skin shows the meshing grid. Inspect untextured broad highlights; derive smooth normals from the intended surface or repair shared vertex normals before adding texture. A fused detail smaller than the sampling scale can create jagged dents: broaden the intended plane or refine the local representation. Preserve intentionally sharp edges on blades and carved planes.
- **Review contact in world space.** Locate the actual pedestal top. A mount base or paw must sit there, not at an assumed zero plane. For rigid display motion, rotate the full assembly about world up; an object's tilted local axis can make the feet rise or sink even while every mesh-local transform stays unchanged.
- **Restraint leaves structure, not emptiness.** Removing decoration is useful only when the remaining silhouette, plane transitions and material are specific. Large smooth ellipsoids, oversized eyes, detached eyebrow tubes and uniform glossy highlights can retain a toy-like appearance in a muted palette.
- **Read the whole creature from the side.** Trace skull, neck root, back, pelvis and tail as one weight-bearing gesture. A successful face does not rescue a tablet-shaped torso, hook-shaped haunches or cuff-like paws. Resolve those large masses before making skin or scales; small dorsal accents must grow from the back rather than appear as isolated beads.

## Current studies: decisions and failure cases

The user rejected the earlier **Nightjar and Hydra** on 2026-10-06, overruling the favorable technical/construction review. The subsequent living Hydra received the explicit response **“this is much better”** and a request to reuse its methodology. That version is the accepted direction and quality reference for further creature work; its earlier bronze versions remain failure examples. This is not blanket approval of every detail or of the other creatures. Catalyst, Phoenix, Spiral and Vajra remain useful material/presentation comparisons.

| Subject  | Retain                                                                                                      | Failure to avoid                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Nightjar | Continuous crown-to-breast gesture, folded planes fitted to the body, descending tail, light curved support | Separate head blob, a stuffed oval, wing pillows, detached eye beads, thick branched logs               |
| Catalyst | Flattened decanter, slender companion vial, smoked glass, dark olive liquid, fitted copper                  | Two scaled copies of the same round flask, opaque lime-green fill, decorative wire curls everywhere     |
| Phoenix  | Unequal wing planes, tapered breast, layered flight feathers, swept tail, limited gold                      | Mirrored trophy pose, bare tube arms, leaf garlands, fish-scale torso, identical tail ribbons           |
| Spiral   | Expanding joined whorl, exposed aperture, thin lip, quiet growth relief and fitted mount                    | Open spring-shaped coil, sealed balloon end, stripes standing in for structure                          |
| Vajra    | Articulated grip, fitted collars, central and outer prongs, restrained aged brass                           | Generic double cage, gaps at fittings, raised dots replacing shallow relief, disconnected mount         |
| Hydra    | Coiled weight, unequal neck gestures, hooded eyes, shaped jaw hinges and connected living skin              | Uniform hoses, smooth toy skulls, rigid whole-body oscillation presented as life, indiscriminate scales |

Spiral and Vajra passed independent review in round 4 of the delegated exercise. The reviewer's round-5 acceptance of Hydra proved too lenient: fixing continuity and floor contact left a stiff, generic creature. The [review record](art-review-sol-2026-10-06.md) preserves that failed judgment. The current creature rebuild must be assessed for gesture and coherence on its own merits. The user also rejected the next coiled bronze Hydra as overly simplified. The subsequent Hydra direction is a living marsh predator with keratin, skin and independently bending necks; bronze is no longer the material target for that subject. The user positively received this living rebuild. Carry forward its anatomical hierarchy, material specificity and iterative review, not a requirement to make every creature green, armored or skeletal-rigged.

For anatomical reference, [Cornell's Common Nighthawk guide](https://www.allaboutbirds.org/guide/Common_Nighthawk/id) is useful for the small bill, low head/neck relationship and long wings. The fantasy Nightjar is not a species reconstruction. For sculptural comparison, study the relationship of masses, material and surface in the Met's [Rooster](https://www.metmuseum.org/art/collection/search/202249) and [Firebird](https://www.metmuseum.org/art/collection/search/482489); neither is a template to copy.

## From blockout to a living subject

The living Hydra succeeded through reconstruction and visible correction across several passes. Apply the method to the next subject; do not merely repeat its decoration.

1. **Choose the physical interpretation and one moment.** State whether this is flesh, plumage, a casting or an instrument. For a living subject, name its behavior: searching, guarding, threatening, landing or resting with attention. Hydra changed from a bronze display object to a marsh predator. Nightjar needs its own avian behavior and material language.
2. **Give the masses different jobs.** Establish weight, compression and reach; make one gesture lead and another answer. Hydra's raised threatening head, lower searching head and broader watchful head differ in height, direction and proportion. For a bird, the head, chest, shoulder, folded wing and tail must form one gesture before feather detail.
3. **Build the anatomy that produces expression.** Form the eye socket and brow before placing the eye; build jaw hinges, mouth volume and fitted teeth before opening the mouth. In birds, establish a low head/neck transition, fitted bill and orbital plane, shoulder-to-wrist construction and a convincing foot grip. Recesses and transition volumes should carry the expression; attached decorative shapes cannot do that job.
4. **Use three scales of surface information.** Large planes describe mass, medium structures identify regions, and fine texture rewards inspection. Hydra uses cranial planes, overlapping armor and restrained small scales. Bird feathers need equivalent hierarchy: continuous body plumage, fitted covert groups and thin overlapping flight vanes. Keep quiet areas. Vary size, rhythm and orientation according to anatomy; do not cover the whole object with equally prominent tiles.
5. **Make surface coordinates and materials follow the form.** Review junctions, curved silhouettes and horizontal appendages at enlarged size. A plausible front texture can stretch badly around a coil or wing. Use continuous mapping at fused roots, appropriate local mapping along appendages, and subdued relief. Separate skin, keratin, mouth, feather, bark and metal through roughness, thickness and color. Purposeful wear can change a contour, as with Hydra's shortened horn; random damage is not character.
6. **Animate relationships while preserving support.** Start from a complete still pose. Anchor the load-bearing region, then add small, delayed secondary movement and an identifiable action. Hydra's necks and their armor deform together while the coil stays fixed; heads and jaws answer at different phases. Choose fitted pivots or skinning according to the deformation needed. A bone count, global rotation or universal pulse is not evidence of life.
7. **Review in layers, then review the complete UI.** Inspect silhouette and broad planes first; inspect materials and junctions at native and enlarged sizes next; finally inspect motion extremes, phone framing and captions. Keep the same camera, light, timeline and display size for comparisons. The enlarged Hydra pass exposed a chest texture seam that the default view concealed. Correct the actual defect, recapture, and stop repeating checks once the revised concern is resolved.
8. **Carry the same object through export.** Reload the exported animated model, inspect its appearance and sample deformed positions when skinning is used. Verify fixed contacts, finite normalized weights, loop continuity and reduced motion as applicable. Hydra's export revealed a normal-texture conversion fault; its live preview exposed a negative startup frame delta. These were delivery failures despite good still images. Keep implementation-specific lessons in the source map and tests, not as substitutes for visual judgment.

The accepted Hydra baseline is `test-results/hydra-delivery/`; durable construction is in `src/art3d/hydra.ts`, with review history in [the creature redesign record](creature-redesign-2026-10-06.md). Generated evidence may be recreated from source. No screenshot count, polygon count, completed checklist or favorable self-review establishes quality by itself.

## Visual acceptance

Keep the brief small: **subject / physical interpretation / gesture / identifying contour / material and light / target size / reference / intended change**.

1. Preserve a before image and inspect the hardest representative subject before repeating an approach. Compare at the same camera, lighting, animation time and display size.
2. Review the image at native size and enlarged. For SVGs, include the full card and smallest hand/board use. For 3D, include the default, front, side and rear views, a narrow phone viewport and the motion extremes. Check connections and underside surfaces, not just the hero angle.
3. Ask what reads first, what feels structurally wrong and what detail could be removed. Name the observed defect and the correction. A new adjective in the description is not a correction.
4. Run the relevant technical checks and inspect their screenshots. Report functional verification separately from visual assessment. Successful decoding, changed pixels, mesh counts and passing tests cannot establish aesthetic quality.
5. Deliver a preview and say what changed and what remains approximate. Use “reviewed” for the author's own inspection; reserve “approved” for an actual user decision. Do not declare a masterpiece or photorealism on the basis of implementation effort.

Retain screenshots and recordings under a named, ignored `test-results/` review directory. Source geometry, materials, this rulebook and linked workflows are durable. When a user explicitly accepts or rejects a direction, update the relevant example here rather than accumulating contradictory rules in several files.

## Guided delegation trials

Use delegation when the user requests it. Keep one author responsible for one subject, with the parent responsible for direction, independent pixel review and integration. Give the author the accepted sibling, a short construction brief, exact file ownership and the rulebook; do not let workers silently modify siblings or shared helpers.

- Record the model and effort, subject, baseline, owned paths and parent interventions. A guided trial measures the resulting collaboration; it does not establish the model's unaided ability or a general benchmark.
- Require a frozen front/side/rear construction candidate before elaborate surface polish. The author inspects its own images and names remaining defects. The parent then captures or inspects those pixels independently.
- Return a short prioritized critique with **view / visible defect / intended correction**. Describe what is wrong rather than dictating every vertex. Do not accept a technically continuous but inert object because the author completed the requested code.
- Freeze source during each review round and keep its snapshot or hash manifest beside the captures. The parent sends revisions back to the same author. If the parent takes over modeling, state that explicitly in the trial result.
- If successive revisions meet written instructions but retain the same visible failure, reassess the representation. In the Nightjar/Phoenix trial, more feather objects and stronger maps did not by themselves produce convincing plumage; fitted regional construction and direct material work were still needed. More review rounds are not evidence of progress unless the images show it.
- End with the strongest completed candidate, verified exports and a candid account of the review rounds. Keep author self-review, parent acceptance and user response separate. Transfer successful lessons into this rulebook only when the evidence supports them.

The [earlier Sol exercise](art-review-sol-2026-10-06.md) preserves the mistake of accepting repaired topology as sufficient creature quality. The user-approved Hydra direction now supplies a stronger comparison. In the [guided Sol 6.1 bird trial](art-review-sol61-creatures-2026-10-06.md), both high-effort authors supplied useful construction, but four rounds each did not reach that reference; the parent directly finished both models. Preserve this limit alongside the successful methodology.
