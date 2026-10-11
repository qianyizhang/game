# Corven raven

Corven is a new stylized living raven at `/?workbench=dcc&compare=raven`.
The heavy wedge bill, continuous breast/nape, throat hackles, wedge tail and
anisodactyl feet were built for this study. No existing bird or quadruped source
was modified or used as its skeleton.

## Saved authority

- `motion.blend`: five editable control actions with playback, contact intervals,
  trajectory and phase markers.
- `raven/source.blend`: geometry, weights, avian control rig and fitted actions.
- `raven/fitting.json`: saved-control fitting identity and mesh/weight digest.
- `../../assets/raven/raven.glb`: deform-only skeleton with five named baked clips.
  Adjacent JSON receipts pin source, motion, exporter and support evidence.
- `../../assets/raven/visual-review.json`: owner visual self-review and retained evidence.

Construction writes fresh candidates. Fitting reads the saved MotionRig actions on
their original object slots and keys character-bound actions; it preserves geometry
and weights. Export reads those saved actions and geometry without rebuilding either.
This is direct fitting between matching raven rigs, not cross-species retargeting.

## Avian articulation

Shoulder, elbow and wrist each have a semantic rotation control. Nine secondary
feather joints on each wing share that side's secondary-sweep control. Their roots
remain attached to the forearm while the vanes sweep during folding. Nine primary
joints per side close the outer fan independently around their own roots; a rigid
fan looked correct extended but projected upward when the wrist folded. The continuous
mantle blends across the three arm joints; the secondaries overlap into a trailing
plane and the outer primary tips separate. The breast remains a quiet connected volume.

The folded wing rotations are derived from armature-space directions, then converted
to each joint's local rest axes. Applying the same world Euler roll at every joint
produced shelves and hanging feathers in rejected clay candidates. Review folded,
intermediate and extended poses; one correct endpoint does not establish a good fold.

Two independent foot targets drive the shank and tarsometatarsus chains. The thigh is
within the feathered body; the reverse hock is distinct from the toes. Each foot has
three forward toes plus a rear hallux. Support probes use actual toe meshes, not hoof
or paw labels. Grounded flat-foot support is a stylized constraint, not a captured
biomechanical claim. Scene travel is owned once by the saved trajectory and browser.

## Workflow

Use pinned Node via `nvm use`. On this Mac, Blender and browser launches require
approved execution outside the restricted sandbox; ordinary checks stay sandboxed.

```sh
npm run dcc:raven -- check
npm run dcc:raven -- bootstrap --root test-results/raven-new-candidate
npm run dcc:raven -- fit --root test-results/raven-new-candidate
npm run dcc:raven -- export --root test-results/raven-new-candidate --output test-results/raven-new-export
npm run dcc:raven -- review --output test-results/raven-review --clip spread --frame 156
npm run dcc:raven -- verify --output test-results/raven-native
RAVEN_NATIVE_RESULTS=test-results/raven-native npm run test:browser -- tests/browser/raven.spec.ts
RAVEN_REVIEW_FRAMES=1 npm run test:browser -- tests/browser/raven.spec.ts
```

All outputs must be fresh. The native verification copies both masters, changes a
saved wing-wrist key, saves/reloads, fits, exports and samples original/edited poses.
Browser comparison checks actual evaluated surface deformation. Temporary pose arrays
are deleted after successful agreement; compact reports remain with selected images
and real 1× movies. The published masters and GLB must keep their hashes throughout.

The saved spread keys were resampled by joint group: shoulder leads, forearm and
wrist follow, and primary fans open last. The left wing responds 0.07 seconds later.
The open marker was updated to 2.07 seconds; the stationary contacts and zero
trajectory remain unchanged. Timing edits operate on saved actions, outside export.

The delivered source includes deliberate native repairs to neck weights, scapular
planes, wing thickness and feather overlap. The construction recipe is a fresh starting
point, not a byte-identical reconstruction of those saved repairs. Fitting preserves
the final repaired mesh/weight digest.

The full-frame export audit checks all toe support intervals, target reach, minimum
surface height and loop closure. Linear or stationary delivery trajectories retain only their endpoints after the
dense native audit; every authored position must match endpoint interpolation.
The delivery contract enforces source/script pins,
finite geometry, normalized skin weights, named clips, timing and those support limits.
Python enters Ruff/strict mypy/inventory explicitly. Use `npm run check:full` for native
construction changes and run browser/native verification separately.

## Review standard and references

Inspect whole-subject clay before surface polish; enlarged wing/preening extremes
before accepting weights; then multiview material, 390 px consumer layout and real 1×
playback. Decode walking at enough temporal density to avoid stride-period aliasing.
The single owner supplies visual self-review; automated gates do not establish
independent approval, reference fidelity or measured animal biomechanics.

The [Cornell raven identification guide](https://www.allaboutbirds.org/guide/Common_Raven/id)
informs the bill, throat and wedge-tail identity. Its
[feather anatomy guide](https://academy.allaboutbirds.org/feathers-article/) informs
overlapping secondary vanes, hand primaries and covert hierarchy. These are design
references, not synchronized motion ground truth.

The existing `MotionStudy` interface carries baked data, text, source links and framing.
The new raven adapter adds no species logic to the player. Saved-source fitting,
compact provenance and native/browser agreement transfer across fox, boar and raven;
wing folds, feather sweep and bird support remain in this subject's authoring modules.
