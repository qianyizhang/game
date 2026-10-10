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
`blender/canid_*.py` scripts stay byte-identical because the baseline receipts pin them.
They are historical pilot recipes; new authoring belongs here. Refined masters live in
`../refined/`, and refined deliveries in `assets/canid/refined/` within the DCC package.

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

| Module          | Owns                                                                           |
| --------------- | ------------------------------------------------------------------------------ |
| `parameters.py` | Named forms, coordinate convention, clip timing, stance and clearance targets  |
| `anatomy.py`    | Connected masses, grown fur silhouette, paws, fitted face and ear construction |
| `surface.py`    | Regional pigment, subtle directional relief, packed fine normal texture        |
| `geometry.py`   | Local construction and skin-binding helpers; real toe contact probes           |
| `rig.py`        | Deformation joints, shoulder controls, hocks, IK targets and rolling paws      |
| `motion.py`     | One-time authoring of shared source actions; not invoked by fitting/export     |
| `delivery.py`   | Fresh construction, saved-action fitting, baking, contact audit and export     |
| `studio.py`     | Matched native review captures; never saves its temporary review changes       |
| `verify.py`     | Disposable source mutation, save/reload and propagation without remeshing      |

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
npm run dcc:canid -- verify test-results/canid-native-edit
```

Construction refuses any existing requested master before writing. Export requires a fresh
output directory and never calls construction. The shared motion master owns the four clips;
fit deliberately replaces those derived actions in each character. It keeps mesh data,
skin weights and materials intact. Native character action edits must be transferred to the
shared source before fitting if they are intended to survive that replacement.

Review coordinates and travel speeds are in model units; there is no calibrated real-world
metre scale. The stylized gait recipes use empirical canine studies as guidance, not imported
motion capture or a physiological simulation. Read the trial record for sources and limits.
