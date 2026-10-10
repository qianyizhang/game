# Canid authored recipes

This is the maintained home for the canid family's procedural source material.
Named character parameters, anatomy, surface construction, rigging, motion recipes,
and family-specific fitting belong together here. General native type and save helpers
remain in `blender/`.

## Authority

Recipes create **fresh candidates**. The accepted saved character and shared-motion
Blender files are the **delivery masters**. Export reads those files without rebuilding
geometry or animation. Recipe edits take effect only after explicit candidate construction,
visual review, and selection of a new master. Manual native edits survive ordinary fitting
and export; fitting replaces derived character actions from the shared motion master.

The original canid sources and deliveries remain at their existing paths. The original
`blender/canid_*.py` scripts remain the baseline adapter; their exporter now emits summaries
without pose fixtures. Sources and GLBs stay unchanged. New authoring belongs here.
Refined masters live in `../refined/`, and refined deliveries in `assets/canid/refined/`
within the DCC package.

## Review stages

1. **Form:** silhouette, proportions, gesture, and negative space.
2. **Anatomy:** connected shoulders, hips, hocks, paws, and facial planes.
3. **Structural detail:** fitted eyelids, toes, claws, and directional fur groups.
4. **Surface finish:** regional pigment and restrained fine roughness/normal variation.

These are authoring stages, not four runtime LOD meshes. Review Ash in clay and material
before propagating the recipe to Russet and the shorter, broader Moss. Shared motion must
remain independently editable and reach every character without rebuilding its mesh.

The [trial record](../../../../../docs/art/trials/canid-retargeting.md) owns the accepted
scope and review findings. Python recipes enter Ruff and strict mypy through the repository
configuration; delivery and native/browser checks exercise their observable results.

## Module map

| Module             | Owns                                                                           |
| ------------------ | ------------------------------------------------------------------------------ |
| `parameters.py`    | Named forms, coordinate convention, clip timing, stance and clearance targets  |
| `anatomy.py`       | Connected masses, grown fur silhouette, paws, fitted face and ear construction |
| `surface.py`       | Regional pigment, subtle directional relief, packed fine normal texture        |
| `geometry.py`      | Local construction and skin-binding helpers; real toe contact probes           |
| `rig.py`           | Deformation joints, shoulder controls, hocks, IK targets and rolling paws      |
| `motion.py`        | One-time authoring of shared source actions; not invoked by fitting/export     |
| `timing.py`        | Explicit timing revision over saved controls, paths, contacts and markers      |
| `action_motion.py` | Attack, ground-roll and turning escape performances                            |
| `motion_spec.py`   | Saved action playback, trajectory, support phases and visual markers           |
| `contacts.py`      | World-space stance, rolling body support and proportion-aware knee fitting     |
| `delivery.py`      | Fresh construction, saved-action fitting, baking, contact audit and export     |
| `studio.py`        | Matched native review captures; never saves its temporary review changes       |
| `verify.py`        | Disposable source mutation, save/reload and propagation without remeshing      |

## Working commands

Run from the repository root with its pinned Node runtime. Native commands use the local
Blender installation and require approved execution on this Mac.

```sh
npm run dcc:canid -- bootstrap --root test-results/canid-next
npm run dcc:canid -- fit --root test-results/canid-next
npm run dcc:canid -- review --root test-results/canid-next --character ash --output test-results/canid-review
npm run dcc:canid -- export --root test-results/canid-next --output test-results/canid-export
npm run dcc:canid -- check
npm run dcc:canid -- check --baseline
npm run dcc:canid -- evaluate
npm run dcc:canid -- verify test-results/canid-native-edit
```

Construction refuses any existing requested master before writing. Export requires a fresh
output directory and never calls construction. The shared motion master owns ten clips;
fit deliberately replaces those derived actions in each character. It keeps mesh data,
skin weights and materials intact. Native character action edits must be transferred to the
shared source before fitting if they are intended to survive that replacement.

`timing.py` owns the `responsive-2026-10-10` revision: per-motion durations and a monotone
phase warp, with toe-space sampling to preserve planted gait contacts. It makes modest
changes to idle/walk and concentrates attack drive and flee acceleration. Bootstrap applies
it once after pose authoring. The saved master already contains it; normal fit/export do not
repeat it. To reproduce that revision from the pre-revision masters at `f9b5774`:

```sh
npm run dcc:canid -- revise path/to/pre-revision-sources test-results/canid-timing-candidate
npm run dcc:canid -- fit --root test-results/canid-timing-candidate
npm run dcc:canid -- export --root test-results/canid-timing-candidate --output test-results/canid-timing-delivery
```

The command requires an explicit parent directory and fresh output; it rejects an already
retimed master. A later revision should name its own parent timing and profile instead of
silently applying this same warp twice. Candidate fitting verifies unchanged mesh/weight
digests. Family evaluation targets live in `../evaluation.ts`, separately from authoring.

Each registered Blender action owns a `motion_spec` JSON custom property. It records
`seconds`, `playback` (`loop` or `once`), `trajectory` samples, `contacts`, and named `markers`.
The master rig's `motion_clips` property lists the action IDs. Edit these saved properties
alongside control keys; fitting and export read them instead of reapplying recipe defaults.
Trajectory samples are `[seconds, x, z, yaw]` in glTF's Y-up space, in model units and radians.
The local skeleton excludes that planar transform; a consumer applies it exactly once.
Markers describe visual timing, never gameplay hit or damage authority.

The jaw deforms the lower mouth independently. Foot pole controls preserve knee direction
through inversion. Fitting keeps turning stance anchors in world space, corrects rolling
reach for each body, then grounds the evaluated skin. Export audits all mesh vertices for
floor penetration and the declared paw/flank/back support intervals. Loop endpoint checks
apply only to looping clips. `<id>.motions.json` is the compact runtime copy of the same
saved contract; the receipt carries measured support errors. Native reference poses are
generated on demand by `blender/sample_canid.py` into ignored test output, not committed.

Review coordinates and travel speeds are in model units; there is no calibrated real-world
metre scale. The stylized gait recipes use empirical canine studies as guidance, not imported
motion capture or a physiological simulation. Read the trial record for sources and limits.
