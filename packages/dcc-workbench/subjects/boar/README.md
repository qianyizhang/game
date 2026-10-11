# Bracken boar

Bracken is a new stylized woodland boar at `/?workbench=dcc&compare=boar`.
The short loaded forequarters, wedge snout, low barrel, rooted ears and paired
hoof digits were constructed for this subject. Its motion is original boar
control animation; it is not a canid retarget or a claim of measured animal biomechanics.

## Saved authority

- `motion.blend`: five editable control actions, including their trajectory,
  contact intervals, playback mode and named phase markers.
- `boar/source.blend`: sculpt, fitted face/ears/tusks, split hoof meshes, weights,
  boar control rig and character-bound fitted actions.
- `boar/fitting.json`: direct saved-control fitting identity and mesh/weight digest.
- `../../assets/boar/boar.glb`: baked deformation skeleton and five named clips.
  Adjacent JSON files pin native sources, exporter code, support audits and motion contract.
- `../../assets/boar/visual-review.json`: owner visual judgment and selected evidence.

The native source is authoritative. Construction creates a fresh candidate; export
reads saved geometry and actions and never calls construction or motion authoring.
`CTRL_body`, head/chest/pelvis/ear/tail rotation controls and four independent
`CTRL_fore.*` / `CTRL_rear.*` hoof targets remain editable. Deformation bones are
separate from those controls; only deformation bones enter the GLB.

## Workflow

Use pinned Node through `nvm use`. On this Mac, native and browser launches require
approved execution outside the restricted command sandbox; ordinary checks stay sandboxed.

```sh
npm run dcc:boar -- check
npm run dcc:boar -- bootstrap --root test-results/boar-new-candidate
npm run dcc:boar -- fit --root test-results/boar-new-candidate
npm run dcc:boar -- export --root test-results/boar-new-candidate --output test-results/boar-new-export
npm run dcc:boar -- review --output test-results/boar-review --clip root --frame 144
npm run dcc:boar -- verify --output test-results/boar-native
BOAR_NATIVE_RESULTS=test-results/boar-native npm run test:browser -- tests/browser/boar.spec.ts
BOAR_REVIEW_FRAMES=1 npm run test:browser -- tests/browser/boar.spec.ts
```

Outputs must be fresh. Fitting samples the existing saved control action into a
character-bound action while asserting that mesh and weights remain byte-equivalent
under the structural digest. This is direct fitting between the same boar skeletons.
In Blender 4.5, merely assigning an action from another object can retain the wrong
action slot and silently leave the character static. The sampled fitting step creates
the correct character slot; native support and browser edit proof catch this failure.

Export audits every authored frame. It measures both hoof digits through each saved
planted interval after adding the single-owner scene trajectory, limb target reach,
full-surface minimum height and loop closure. These are model-unit technical checks,
not independent aesthetic acceptance. Hooves use actual digit meshes rather than
canid paw probes. The delivered sculpt uses continuous distance-weighted limb transitions: a hard
height/side split produced a pinched cheek and belly in enlarged rooting clay. The
repair changes saved weights; subsequent fitting must preserve that repaired digest.
Review enlarged native extremes as well as the consumer viewport.

The contract uses flat planted soles; it does not claim hoof-roll physics.

Verification copies masters into a disposable directory, edits a saved rooting head
key, saves/reloads, fits, exports and freshly samples both deliveries. Browser checks
require native/GLB agreement and a visible edited deformation, while protected source
hashes and mesh/weight digests remain unchanged. Generated pose arrays are temporary:
remove them after successful agreement and retain the compact reports instead.

## Review and extension

Inspect clay front/side/rear, material portrait, 390 px consumer layout, motion extremes
and actual 1× playback. Dense decoded gait frames avoid accidentally sampling at the
cycle period. Retiming must change controls, contacts, trajectory and markers together.

The common `MotionStudy` interface supplies baked model, metadata, source links and
camera framing. It does not impose species anatomy. A raven can reuse this viewer and
the source/fit/export/evidence boundaries, but needs its own bird joints, folded/extended
wing controls, feather hierarchy and foot/perch support probes. Neither the boar IK
chains nor the hoof audit are a general animal engine.

Maintained Python lives in this subject's `authoring/` directory, covered explicitly by
Ruff, strict mypy and the repository inventory. The source pin, finite geometry, skin,
clip, duration, loop and support contracts run in `npm run test:dcc`; browser/native
checks remain separate from `npm run check:full`.
