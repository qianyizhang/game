# Alder river otter

Alder is a stylized living river otter at `/?workbench=dcc&compare=otter`.
Five land performances explore breathing, a low walk, an elastic bound, scent
investigation, and a seated cheek wash. The long low torso, broad integrated
muzzle, small ears, webbed five-toed paws and muscular tapered tail define the subject.

## Saved authority

- `otter/source.blend`: continuous sculpt, materials, repaired weights, fitted
  rest skeleton, semantic controls and character-bound actions.
- `motion.blend`: five editable source control actions with durations, support
  intervals, trajectories and phase markers.
- `otter/fitting.json`: matching-rig direct fitting and the final mesh/weight digest.
- `../../assets/otter/otter.glb`: 22 deformation joints and five baked named clips.
  Adjacent receipts pin source, motion, exporter, model and dense support results.
- `../../assets/otter/visual-review.json`: owner visual self-review, repairs,
  limitations and hashes of selected native/consumer evidence.

This is original otter performance authoring, not cross-species retargeting.
The delivery workflow and simple geometric helpers come from the boar study.
The torso, proportions, tail, paw geometry, weights and actions are otter-specific.
The browser consumes the existing species-agnostic `MotionStudy` interface.

`CTRL_body` carries pelvis/spine/chest/head, jaw, ears and three tail sections.
Four independent paw targets drive short two-bone limb chains. Paw orientation
remains flat in planted phases; the washing paw tips toward the cheek. The
separate deformation skeleton is the exported interface; controls and IK helpers
stay in Blender.

## Workflow

Use pinned Node through `nvm use` and Python through `uv`. On this Mac request
approved execution outside the restricted sandbox for native/browser launches.
Use fresh output directories and disposable browser profiles.

```sh
npm run dcc:otter -- check
npm run dcc:otter -- bootstrap --root test-results/otter-new-candidate
npm run dcc:otter -- refine --root test-results/otter-new-candidate
npm run dcc:otter -- fit --root test-results/otter-new-candidate
npm run dcc:otter -- export --root test-results/otter-new-candidate --output test-results/otter-new-export
npm run dcc:otter -- review --output test-results/otter-review --clip groom --frame 155 --detail
npm run dcc:otter -- verify --output test-results/otter-native
OTTER_NATIVE_RESULTS=test-results/otter-native npm run test:browser:native -- tests/browser/otter.spec.ts
OTTER_REVIEW_FRAMES=1 npm run test:browser -- tests/browser/otter.spec.ts --grep='otter study plays'
npm run check:full
```

Bootstrap constructs fresh starting candidates. The delivered master contains
additional saved native repairs: shorter muzzle, smaller ears, relaxed tail tip,
restricted throat pigment, simplified redundant triangles and smoother abdomen/limb
weights. A recipe does not reproduce those saved edits byte-for-byte. Fitting and
export preserve them. Export never calls construction or motion authoring.

Fitting evaluates saved actions on their original `MotionRig` slots and keys new
character-bound actions. It requires the geometry and weight digest to remain
unchanged. Assigning foreign Blender 4.5 actions alone can silently leave a target static.

Export audits all 1,082 authored frames at 60 fps. The actual five toe meshes and
connected web sole of each paw are probed through every saved planted interval.
The support plane is z = 0.018 model units; the rounded sole margin is explicit.
Limits are 0.01 target reach error, 0.001 planted slip, 0.002 height error,
-0.008 minimum whole-surface height and 0.0001 loop matrix error. Scene trajectory
is applied once by the browser. Linear or stationary trajectories are compacted
only after every dense authored position agrees with endpoint interpolation.
These are discrete technical checks, not continuous collision or biomechanical proof.

The native proof edits the scent head key at frame 150 by 0.12 radians on copied
masters, saves/reloads, fits, exports and samples both versions. Each clip is sampled
at 12 Hz plus endpoints, with 16 vertices per mesh. Browser comparison requires
agreement below 0.0001 units and an observable edited result. Delete temporary pose
arrays only after successful agreement; retain compact reports and selected evidence.

## Owner review and limits

Inspect native clay front/side/rear and portrait, enlarged scent/wash, and intermediate
seated poses before consumer review. Real 1× consumer movies and densely decoded gait
phases cover timing and loops; the 390 px capture covers the smallest layout.
The review is the sole owner's judgment. Parent audit and user approval are separate.

The [Smithsonian river otter description](https://www.nationalzoo.si.edu/animals/north-american-river-otter)
informs the long muscular body, short legs, webbed paws, small ears and whiskered
muzzle. It is a design reference, not synchronized motion ground truth. No swimming,
water simulation, muscle correctives or measured gait fidelity is claimed.
