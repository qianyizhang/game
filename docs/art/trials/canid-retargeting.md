# Canid rig and motion pilot

## Accepted refinement, 2026-10-10

The user accepted the first delivery as an initial baseline and requested more developed
body detail and substantially more believable, energetic movement. The second revision
keeps stylized canid identity, with stronger anatomy, articulated paws, integrated facial
structures, directional fur groups, and restrained surface finish. The supplied dragon
diagram guides detail layering, not species or an SDF implementation.

Deliver alert idle, brisk walk, energetic trot, and a sharper planted look. Improve support,
loading/push-off, paw articulation, shoulders, pelvis, and restrained spine and secondary
motion. Author shared source motion once and fit it to all three characters. This remains
a bounded visual/rigging trial; production retopology, dense hair grooming, runtime LOD
generation, attacks, and jumps are outside this revision.

Procedural sources are first-class asset recipes in the
[family authoring home](../../../packages/dcc-workbench/subjects/canid/authoring/README.md).
Recipes generate distinct candidates; accepted saved Blender masters remain authoritative
for export. Preserve initial sources, deliveries, and receipts. Refine Ash first, then
propagate the construction to Russet and Moss, with matched baseline/refined review.

Make scoped commits for ownership, visual construction, and motion/delivery. Verify
source edit/save/reload/export, retargeting, contact and loop behavior, browser agreement,
and actual multi-view appearance. Mechanical checks do not establish visual acceptance.

## Initial baseline

Accepted scope, 2026-10-10. Build a new animation-ready canid master, one appearance
variant with the same proportions, and one shorter-legged, heavier variant. Preserve
existing Wolf masters and gallery publications.

## What this must prove

- Author idle, walk, and planted look clips once in an editable Blender family source.
- Reuse saved motion directly on the appearance variant. Retarget the same motion to
  the proportion variant with explicit fitting and contact corrections; independently
  generating a target gait is not retargeting evidence.
- Keep connected anatomy, readable weight shifts, stable contacts, and clean shoulder
  and hip deformation. Prove the base in clay before finishing variants.
- Deliver editable character sources, baked GLBs, and an interactive workbench with
  matched cameras, shared time, clip selection, clay/material views, and ground contact.
- Demonstrate that editing a saved source clip updates all three deliveries while
  preserving character mesh data. Report source/export agreement and visual judgment
  separately. Elaborate fur, facial acting, external motion import, and gallery
  replacement are outside this pilot.

## Ownership and authoring

The DCC workbench owns the family rig, saved motion, character fitting, retargeting,
and export. Browser consumers select baked clips; they do not run a retarget solver.
The family source owns motion. Each character source owns geometry, skin weights,
materials, fitted rest skeleton, and native controls. Source creation is an explicit
bootstrap operation; export must not rebuild geometry or regenerate source animation.

A control rig is the animator's editing interface. The deformation skeleton is the
delivery interface. The retarget profile records chain correspondence, reference-pose
alignment, proportion handling, and target corrections. Start with one canid family;
introduce another family only when a second anatomy demonstrates the need.

## Verification and commits

Use coherent commits for the authoring contract and working master, motion reuse and
target fitting, then browser comparison and evidence. New Python and frontend sources
must enter existing checker scopes. Run `npm run check:full` plus affected native and
disposable-profile browser checks. Native and browser launches on this Mac use approved
execution outside the restricted sandbox.

Visual review inspects matched front, side, rear, and portrait views, motion extremes,
and small displays. Numerical checks cover contact error, finite normalized skinning,
loop continuity, shared-source propagation, and exported playback agreement. Passing
those checks does not establish aesthetic or user approval.

## Implementation and findings

The workbench pilot is available at `/?workbench=dcc&compare=canid`. Its maintained
commands and source ownership are documented in the [DCC package](../../../packages/dcc-workbench/README.md#canid-rig-and-retargeting-pilot).

| Character | Purpose                | Geometry         | Delivery                                           |
| --------- | ---------------------- | ---------------- | -------------------------------------------------- |
| Ash       | Base canid             | 27,074 triangles | 20 joints; idle, walk, look                        |
| Russet    | Appearance reuse       | 27,074 triangles | Same proportions and shared source motion          |
| Moss      | Proportion retargeting | 26,350 triangles | 1.07 length, 1.22 width, 0.77 height/stride scales |

Sources are editable native Blender files with animator controls, IK constraints,
bone-heat skinning, materials, and actions. The prototype uses a connected voxel-remeshed
skin and simplified facial anatomy; it is not hand-retopologized production topology.
The family convention fixes control axes, chain names, clip durations, and walk contact
phases. This proves fitting within one family, not arbitrary third-party skeleton
compatibility or anatomically different creatures.

### Corrections established by review

- First clay construction: overlapping tail masses read as segments, and lower-leg
  weights produced pinching. Continuous tapered forms replaced the tail and limb masses.
- Provisional distance weights produced sharp belly/shoulder transitions. Native
  bone-heat weights replaced them, with rigid supporting sole vertices and normalized
  four-influence delivery weights.
- The first export bake used stale parent transforms. Browser/native comparison caught
  errors up to 0.48 model units. Explicit parent-relative baking corrected the mismatch;
  the comparison tolerance remained 0.0001 model units.
- Contact checks now inspect supporting mesh vertices as well as ankle controls at all
  planted frames. Ground-grid travel comes from the delivered clip metadata.

### Acceptance and limits

The shared-motion mutation check changes the saved source look action and proves that
all three fitted characters receive it without changing mesh or skin-weight digests.
The browser checks every delivered character and clip at five native sample times,
including the exact loop endpoint. Sampling does not prove agreement at every possible
intermediate time. All native contact checks use the declared family stance intervals;
changing those intervals requires updating the family convention.

The parent reviewed the base clay construction and the matched browser material view.
Visual scope is a restrained stylized canid with readable weight and fitted movement;
elaborate fur and facial acting remain outside this pilot. Numerical agreement is
technical evidence, not user visual approval. Existing gallery sources and release
pointers are unchanged.

The [review receipt](../../../packages/dcc-workbench/assets/canid/review.json) links the
selected native edit proof, original and mutated consumer comparisons, and final
preview by hash. Final sampled pose error is below **0.0000014 model units**; the
largest planted-sole height or per-frame slip is below **0.0000008 model units**.
These values apply to the recorded poses and declared contact intervals, respectively.

![Canid motion study](../../../packages/dcc-workbench/assets/canid/evidence/preview.png)
