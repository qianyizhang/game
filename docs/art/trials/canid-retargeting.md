# Canid rig and motion pilot

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
