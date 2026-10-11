# Native animated modeling

Start here for a new motion study or a native rig/motion refinement. The
[art rulebook](../../../docs/art/art-direction.md) owns aesthetics; this playbook
owns the reusable authoring procedure. Subject guides below locate working code.
The [three-round trial](../../../docs/art/trials/rig-strategy-three-rounds.md)
is supporting evidence, not prerequisite reading.

## Start a subject

For a new study, create a fresh working packet:

```sh
nvm use
npm run assets:scaffold -- study otter .work/sessions/otter-study
```

The command writes `brief.md`, `study.ts.template` and `handoff.md` into a new
repository directory. It creates no model, registers no asset and supplies no
species rig. Fill the brief from the task; the earlier five-clip examples are not
a mandatory clip count. For a refinement, use the existing subject's saved masters.

The adapter template targets `packages/dcc-workbench/src/<id>-study.ts` after
its referenced deliveries exist. Use `MotionStudy` for baked assets, clips, source
links, copy and camera framing; keep anatomy and fitting in native authoring.
Registration in `Workbench.tsx` is explicit. Add new Python/TS to the enforced
checker scopes when introducing it; see the [verification contracts](../../../docs/engineering/checks.md).

## Saved authority and fitting

- **Character master:** geometry, weights, materials, fitted rest skeleton and
  animator controls. **Motion master:** saved source actions with timing, support
  intervals, trajectory and markers. The deformation skeleton is the baked GLB
  interface. Recipes construct fresh candidates; export reads saved masters.
- **Fitting:** evaluate saved actions on their original source object and key
  character-bound actions. Blender 4.5 action slots can leave a target static when
  an action is merely assigned across objects. Prove surface deformation, not just
  action names. Preserve the final mesh/weight digest through fitting.
- **Native repairs:** deliberately repair geometry/weights in the character master,
  then refresh its digest and downstream evidence. Subsequent fitting/export must
  preserve those repairs; a bootstrap recipe need not reproduce every native edit.
- **Reuse boundary:** same-family saved-clip transfer with proportion corrections is
  retargeting. A new species may require its own rig, source performances and fitter.
  Reuse the delivery workflow without claiming cross-species retargeting.

## Form, support and performance

1. Establish gesture and identifying contour in front/side/rear clay before surface
   finish. Inspect intermediate poses as well as motion extremes. For wings, add
   elevated views: side views can hide merged primaries or missing trailing planes.
2. Fit controls and support probes to the animal. Measure actual paw, hoof-digit or
   toe/hallux geometry through every authored support frame, plus target reach,
   whole-surface floor clearance and loop closure. Choose justified subject-scale
   tolerances. A browser trajectory owns planar travel once; avoid double motion.
3. Inspect **enlarged native deformation** alongside desktop and 390 px consumer
   views. Hard weight-region boundaries can pinch connected cheeks/bellies while
   small views and contact checks pass. Repair the saved transition, then re-export.
4. Inspect **actual 1× playback** for pacing, weight and intent. Use sufficiently
   dense decoded frames to see distinct phases; one frame per gait cycle can hide
   all movement. Retiming updates keys, contacts, trajectory and markers together.
   Phase stills alone do not establish pacing.

For articulated birds, derive wing folds in armature space and convert to each
joint's local rest axes. Independent secondary sweep and primary fan closure may
be needed in addition to shoulder/elbow/wrist motion. Inspect folded, intermediate
and open states; stagger joint groups only where it improves the intended action.
These are avian controls, not requirements for every subject.

## Export and edit proof

Export a fresh candidate without rebuilding geometry or performances. On disposable
copies, edit a meaningful saved control key, save/reload, fit, export and compare
native evaluated surfaces with browser playback. Require both agreement and an
observable edited result. Check unchanged authoritative masters/delivery and unchanged
mesh/weights during fitting. Use the existing sampler where its object conventions
fit; otherwise write a small explicit subject adapter.

Keep compact source/motion/model pins, support summaries and edit/agreement reports.
Generate pose arrays on demand and remove them only after successful comparison.
Retain selected images and actual 1× movies behind the visual review's hashes.
Native sampling is not exhaustive continuous-time proof; record sampling coverage.

For stationary or linear trajectories, endpoint compaction is useful **only after
interpolation matches every original authored sample within a declared tolerance**.
Keep dense native support audits. Verify unchanged GLB bytes and a consumer journey;
nonlinear paths need their own equivalence check.

Run the [affected gates](../../../docs/engineering/checks.md#gate-selection).
`check:full` does not run Blender/browser proof. On this Mac use approved execution
for native/browser launches and the disposable-profile harness; ordinary checks stay
sandboxed. Separate pass, skip, blocked, visual judgment and unassessed claims.

## Implementation starting points

| Need                                                        | Read only this starting point                                                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Same-family canid fitting and timing                        | [Canid authoring](../../../packages/dcc-workbench/subjects/canid/authoring/README.md); [fox adapter](../../../packages/dcc-workbench/subjects/fox/README.md) |
| New quadruped rig, target-bound actions, support audit      | [Boar authoring](../../../packages/dcc-workbench/subjects/boar/README.md), especially `authoring/boar_delivery.py` and `boar_verify.py`                      |
| Avian folding, saved timing, verified trajectory compaction | [Raven authoring](../../../packages/dcc-workbench/subjects/raven/README.md), especially `authoring/raven_rig.py` and `raven_delivery.py`                     |
| Baked viewer adapter                                        | [Raven study data](../../../packages/dcc-workbench/src/raven-study.ts) and scaffold `study.ts.template`                                                      |
| Source mutation plus actual consumer playback               | [Raven browser journey](../../../tests/browser/raven.spec.ts); adapt the edited control, support probes and sample coverage                                  |

## Delegation and handoff

Use the user's selected roles and limits. When they select one capable owner with
self-review, that owner builds, diagnoses, repairs, runs gates and reviews pixels;
the orchestrator checks concrete delivery/evidence completeness and passes tested
refinements to the next owner. Report this as **owner self-review**, not independent
or user approval. Keep unassessed reference fidelity/biomechanics explicit.

The scaffold's handoff records exact source/delivery paths and pins, preview,
owned commit, gate scopes/skips, inspected views and actual playback, corrections,
remaining limits, and what the next subject should reuse or replace. Promote only
exercised refinements into their owning code/docs. No whole trial transcript is
needed to continue.
