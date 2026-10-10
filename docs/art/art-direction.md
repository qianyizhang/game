# Card Workshop aesthetic rulebook

**Direction: cohesive, expressive fantasy sculpture and engraved illustration.** Style, gesture, and relationships between forms take precedence over literal reference fidelity. Work must read clearly at card size and hold up when enlarged. Serious subjects can be colorful or playful; darkening palettes, adding noise, or increasing polygon counts cannot compensate for weak drawing or inert forms.

This is the shared visual standard for SVG illustration, 3D studies, and presentation. The [art skill](../../skills/card-art/SKILL.md) guides workflow; [SVG tooling](svg.md) and [3D tooling](3d.md) locate implementations.

## Judge in this order

| Priority                 | Required reading                                                  | Reject when                                                                             |
| ------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Gesture and silhouette   | One dominant subject, a specific pose, useful negative space      | The image is a pile of recognizable primitives or a default mirrored emblem             |
| Structure and proportion | Connected anatomy, believable joints, weight and support          | A bird is an egg with attached wings; limbs float; uniform proportions across creatures |
| Large surface planes     | Light, middle, and shadow describe form before decoration         | Tiny details hide a lumpy silhouette or every plane has an equally strong outline       |
| Material                 | Each surface has its own edge, reflection, thickness, and wear    | Everything is glossy plastic; liquid is opaque paint; every edge is gold                |
| Detail and accents       | Detail follows structure, with quiet areas between focal passages | Scales, leaves, scratches, ribs, or symbols repeat at equal spacing across the subject  |
| Presentation and motion  | Framing and movement clarify the object                           | Flattering angles or perpetual motion conceal weak underlying construction              |

**Fix the first failing row before addressing details below it.**

## Living subjects need a designed gesture

- **Action line:** Establish one clear line of action through the whole subject. Define where weight rests, compresses, and extends. Even resting subjects should exhibit alertness and intention.
- **Masses & Negative Space:** Design large masses and negative spaces together. Vary orientation, taper, and rhythm rather than arranging identical parts around a neutral torso.
- **Hierarchy:** One dominant gesture leads while others answer (e.g. heads, wings, or limbs should not be equally upright, spread, or prominent).
- **Form before texture:** Ensure flat silhouettes and untextured forms work before adding texture, scales, feathers, or muted palettes.
- **Stylization:** Simplify anatomy into connected, expressive planes with consistent treatment across the body, head, appendages, and support.
- **Reference usage:** Use references for specific design choices, not for specimen fidelity or mechanical checklist completion.

## Medium-specific decisions

### SVG prints

Use restrained ink families and three readable value groups. Curved anatomy and overlapping planes establish volume; engraving accents it.

| Family      | Palette and construction                                                               |
| ----------- | -------------------------------------------------------------------------------------- |
| Blindside   | Cream, forest ink, ochre, restrained coral; cut-paper overlap and engraved contours    |
| Spire       | Forged metal, asymmetric cloth, muted copper; Silent adds sage, poison green, and plum |
| Last Hearth | Natural creature colors, selective gold, distinct flight and serpentine gestures       |

Upgrades should alter action, pose, or supporting elements alongside color. Cards present names and stats via HTML; illustrations must not obscure them.

### 3D objects

Define the physical medium upfront: living tissue, carved wood, cast metal, or glass instrument.

- **Plumage & Birds:** Define shoulder, elbow, and wrist before flight feathers. Secondaries overlap into a continuous trailing plane; primaries separate at tips. Coverts lie along the wing. The breast is a continuous volume, not a tiled pinecone. Consult the [Cornell feather anatomy guide](https://academy.allaboutbirds.org/feathers-article/) for flight vanes vs body contour feathers.
- **Glass & Liquid:** Model distinct wall thickness, rim, fill level, and closure. Preserve transmission to distinguish liquid from painted resin.
- **Metal & Stone:** Broad specular highlights describe curvature; roughness distinguishes polished edges from recessed wear. Wood grain and fractures follow underlying geometry. Pedestals must support without dominating bounds.
- **Motion:** Anchor load-bearing contact points. Secondary motion should be delayed and subtle. Reduced-motion preferences must preserve a stable still pose.

## Construction checks before surface polish

- **Face winding:** Outer faces must face outward. Check single-sided rendering from front, side, and rear; double-sided materials cannot excuse bad winding.
- **Joint transitions:** Replace primitive intersections with continuous lofts, tapers, or shoulders; hide end caps inside connections.
- **Supports & Mounts:** Mounts must visibly meet their load in all views and throughout animations.
- **Identifying features:** Model the two or three defining anatomical structures (e.g. shell aperture, prong collars) before adding surface decoration.
- **Continuous shading:** Ensure merged forms have continuous surface normals without visible meshing grids or dents.
- **World-space contact:** Anchor contact points against the actual pedestal surface in world space; verify transforms during full rotation.
- **Side profile:** Trace skull, nape, back, pelvis, and tail as a single weight-bearing gesture. Small dorsal accents must emerge from the anatomy.

### Structural rejection versus surface finishing

| Recorded case                                                                                  | Structural failure                                                                                 | Evidence needed for next construction                                                                |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [Wolf evolved forms](assets/wolf-evolutions.md#scope-and-visual-failures)                      | Exposed mantle caps and paddle locks treated as polish residuals; shoulder formed a padded saddle. | Fur roots integrated into neck surface, grown nape contour, and fitted motion on one representative. |
| [Matriarch refinement](assets/native-matriarch-refinement.md#progress-and-failed-construction) | Added eyelid bars and rings left eye detached from coarse orbit.                                   | Connected orbit/lid edge fitted to globe, cheek, and brow, retaining head motion in clay proof.      |

## Current studies: decisions and failure cases

The living **Briar Hydra** (keratin, skin, independently bending necks) represents the accepted visual direction. Early bronze iterations and stiff topologies remain failure references.

| Subject  | Retain                                                                                                | Failure to avoid                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Nightjar | Continuous crown-to-breast gesture, folded planes fitted to body, descending tail, light curved perch | Separate head blob, stuffed oval, wing pillows, detached eye beads, thick branched logs         |
| Catalyst | Flattened decanter, slender companion vial, smoked glass, dark olive liquid, fitted copper            | Two scaled copies of the same round flask, opaque lime-green fill, decorative wire curls        |
| Phoenix  | Unequal wing planes, tapered breast, layered flight feathers, swept tail, limited gold                | Mirrored trophy pose, bare tube arms, leaf garlands, fish-scale torso, identical tail ribbons   |
| Spiral   | Expanding joined whorl, exposed aperture, thin lip, quiet growth relief, fitted mount                 | Open spring-shaped coil, sealed balloon end, stripes substituting for structure                 |
| Vajra    | Articulated grip, fitted collars, central and outer prongs, restrained aged brass                     | Generic double cage, gaps at fittings, raised dots replacing shallow relief, disconnected mount |
| Hydra    | Coiled weight, unequal neck gestures, hooded eyes, shaped jaw hinges, connected living skin           | Uniform hoses, smooth toy skulls, rigid whole-body oscillation, indiscriminate scales           |

References: [Cornell Common Nighthawk guide](https://www.allaboutbirds.org/guide/Common_Nighthawk/id); Met Museum [Rooster](https://www.metmuseum.org/art/collection/search/202249) and [Firebird](https://www.metmuseum.org/art/collection/search/482489).

## From blockout to living subject

1. **Interpretation & Action:** Define the material and behavior (e.g. searching, guarding, threatening).
2. **Differentiated Masses:** Establish weight, compression, and reach; let one gesture lead and others answer.
3. **Anatomical Expression:** Form eye sockets, brow ridges, and jaw hinges before placing eyes or teeth.
4. **Three Scales of Surface:** Large planes define mass; medium structures define regions; fine textures reward inspection. Keep quiet areas.
5. **Form-following Coordinates:** Align UVs and procedural mapping with local curvature. Differentiate materials via roughness, thickness, and color.
6. **Anchored Animation:** Anchor weight-bearing roots; add subtle, delayed secondary motion across joints.
7. **Multi-layer Review:** Inspect silhouette and broad planes, then materials at native and enlarged sizes, then motion extremes and mobile viewports.
8. **Export Agreement:** Re-import exported models (GLB) to verify vertex deformation, normal maps, weight normalization, and animation loops.

The accepted Hydra reference is `test-results/hydra-delivery/` ([creature redesign record](creature-history.md)).

## Visual acceptance

Reviews use the brief format: **subject / physical interpretation / gesture / identifying contour / material & light / target size / reference / intended change**.

1. **Side-by-side comparison:** Compare candidates against baselines at matching camera angles, lighting, animation frames, and display sizes.
2. **Multi-angle inspection:** Review default, front, side, and rear views, mobile viewports (390 px), and motion extremes in clay and textured modes.
3. **Clarity & Restraint:** Check what reads first, what looks structurally weak, and what decorative noise can be removed.
4. **Independent verification:** Report technical checks separately from visual assessments. Passing automated checks does not confer aesthetic approval.

## Maintainable artist sources

Authoring targets editable Blender (`.blend`) sources. Legacy procedural TypeScript builders remain comparison baselines under [testing policy](../engineering/testing.md#blender-authoring-and-legacy-compatibility).

- **Semantic controls:** Ensure parent controls carry fitted dependents (e.g. muzzle edits carry lips, teeth, nostrils).
- **Saved source primacy:** Exporters read saved `.blend` files directly; rebuild recipes produce distinct candidates and do not silently regenerate source.
- **Edit loop verification:** Verify that modifying controls in the native file propagates correctly through export to consumer reloads.

## Guided delegation trials

Delegated trials operate under the [bounded delegation protocol](delegation.md).

- Require a frozen clay candidate (front, side, rear) before detailing surfaces.
- Critique via **view / visible defect / intended correction**.
- Stop when construction stagnates; direct parent intervention is used when repeated worker iterations fail to reach the quality bar ([historical Sol trials](creature-history.md)).
