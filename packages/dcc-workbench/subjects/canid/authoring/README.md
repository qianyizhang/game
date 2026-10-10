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
