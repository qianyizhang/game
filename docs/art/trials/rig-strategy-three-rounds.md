# Three-species saved-motion trial

## Scope and review authority

The 2026-10-11 campaign applies the refined [canid workflow](canid-retargeting.md)
to three new subjects in sequence: fox, boar, then raven. Each round belongs to a
fresh **Astra/high** session, including construction, refinement, technical checks
and visual self-review. The orchestrator checks delivery/evidence completeness
lightly and passes exercised improvements to the next owner.

The user selected **4–6 polished motions per subject** and continued refinement
until complete, without a preset time limit. This campaign explicitly replaces
the older [delegation protocol](../delegation.md)'s role split, independent verifier
and fixed time/credit stops. Owner acceptance is not independent or user visual
approval. Existing wolf/canid sources and gallery defaults remain protected;
delivery is through the DCC workbench.

## Delivered studies

| Round | Subject and source guide                                                 | Rig and motion result                                     | Local commit | Status                                                             |
| ----- | ------------------------------------------------------------------------ | --------------------------------------------------------- | ------------ | ------------------------------------------------------------------ |
| 1     | [Copper fox](../../../packages/dcc-workbench/subjects/fox/README.md)     | 29 deform joints; idle, walk, trot, listen, ground scent  | `bdc18a3`    | Delivered; owner self-review accepted; parent light audit accepted |
| 2     | [Bracken boar](../../../packages/dcc-workbench/subjects/boar/README.md)  | 19 deform joints; idle, walk, trot, root, charge/recovery | `1e8b12e`    | Delivered; owner self-review accepted; parent light audit accepted |
| 3     | [Corven raven](../../../packages/dcc-workbench/subjects/raven/README.md) | 52 deform joints; idle, walk, look, spread/fold, preen    | `8a1b891`    | Delivered; owner self-review accepted; parent light audit accepted |

Fox reuses selected saved canid performances fitted to its new anatomy, with a new
scenting performance. Boar has original boar control animation and a separate
skeleton. Raven introduces an avian skeleton with independently folding feather
roots. All three have editable character and motion masters, five baked clips and
workbench previews. Reusing the workflow across those subjects does not establish
cross-species motion retargeting.

## Reusable workflow

1. **Establish species and gesture in clay.** Build a fresh subject candidate and
   inspect front, side and rear before material detail. Solve connected anatomy,
   support, and identifying contour first. Preserve previous accepted subjects.
2. **Save character and motion separately.** The character master owns geometry,
   weights, fitted rig and materials; the motion master owns editable source
   performances and their contracts. Native refinements remain authoritative.
3. **Fit actual saved controls.** Evaluate the motion source and create target-bound
   actions. Assert unchanged mesh and weight digests during fitting. Construction
   and motion recipes create candidates; neither runs implicitly during export.
4. **Audit real support geometry.** Use species-specific feet, digits or other
   contact surfaces, saved stance intervals and every authored frame. Inspect
   full-surface floor clearance and loop closure. Apply scene trajectory exactly
   once; skeletal animation and browser travel must not both own it.
5. **Review deformation and timing.** Inspect enlarged native motion extremes,
   desktop and 390 px consumers, clay and material, and actual 1× recordings.
   Decode enough distinct phases to avoid sampling at the gait period. Retiming
   updates control keys, contacts, trajectory and markers together.
6. **Bake and prove the editable path.** Export the saved master to a fresh output.
   On disposable copies, edit a saved motion key, save/reload, fit, export and
   compare original/edited native evaluations with browser deformation. Require
   an observable edited result as well as agreement and unchanged protected bytes.
7. **Retain a compact, honest delivery.** Keep native masters, GLB, motion contract,
   source/export hashes, compact support/edit/agreement reports and selected visual
   evidence. Generate large pose arrays on demand. State visual judgment separately
   from technical passes and preserve named skips and limits.
8. **Transfer tested refinements.** Give the next owner the exact sources, preview,
   commit, checks, self-review and repairs that changed the process. Promote lasting
   guidance to the source-owning documentation; do not copy a species rig merely
   because its tests already exist.

## Refinements established by the rounds

| Evidence                                                                                          | Refinement carried forward                                                                                                                                     | Scope               |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Fox's inherited listening gesture felt rushed at 1×                                               | Stretch saved controls and complete motion metadata together; review the resulting hold and recovery                                                           | Timing workflow     |
| Fox gait stills sampled at the cycle period concealed movement                                    | Inspect dense decoded frames from actual playback, alongside the recording                                                                                     | Review method       |
| Boar's target feet stayed static despite assigned source actions                                  | Evaluate actions on the source object, then key character-bound actions; catch Blender 4.5 action-slot mismatch through actual deformation/support tests       | Native fitting      |
| Boar's enlarged rooting clay exposed a cheek/belly seam hidden in the small browser view          | Replace hard weight-region boundaries with continuous transitions in the native master, then refresh export and evidence                                       | Skinning and review |
| Fox, boar and raven baked deliveries use the same consumer                                        | Keep `MotionStudy` as asset/clip/source/framing data; retain species-specific native rigs and support audits                                                   | Viewer integration  |
| Raven wing endpoints looked acceptable in some views but folding produced shelves and a rigid fan | Derive folds in armature space, convert to local rest axes and control secondary sweep/primary fan closure separately; inspect intermediate and elevated views | Avian articulation  |
| Raven spread opened uniformly                                                                     | Stagger saved shoulder, forearm, wrist and fan controls; update the authored phase marker                                                                      | Performance timing  |
| Raven linear/stationary trajectories contained redundant dense rows                               | Verify endpoint interpolation against every original row before compacting delivery metadata; preserve dense native support audits                             | Delivery size       |

`MotionStudy` lives in `packages/dcc-workbench/src/canid-assets.ts`; the existing
player and comparison component consume it. Small explicit subject adapters and
workbench routes are sufficient. The native exporters are species-specific;
this trial does not establish a universal anatomical generator or exporter.
New maintained Python and TypeScript enter the enforced checker scopes.

## Verification and limits

| Subject | Native/browser agreement                        | Saved-edit observation                                                           | Other evidence                                                                                                                                         |
| ------- | ----------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fox     | Maximum sampled error **2.3914e-6 model units** | Saved head edit changes sniff by **0.11564 units**; fit preserves mesh/weights   | Full gate: 253 application, 4 simulation and 128 geometry tests; final affected viewer journeys passed                                                 |
| Boar    | Maximum sampled error **1.8283e-6 model units** | Saved head edit changes root by **0.15342 units**; fit preserves mesh/weights    | Full gate: 253 application, 4 simulation and 128 geometry tests; final boar native/browser **2/2 passed**                                              |
| Raven   | Maximum sampled error **1.3356e-5 model units** | Saved wrist edit changes spread by **0.12442 units**; fit preserves mesh/weights | Final full gate: 57 DCC, 253 application, 4 simulation and 128 geometry tests; combined consumer/native 10 passed / 4 other-subject prerequisite skips |

Native/browser agreement samples five times per clip and sixteen points per source
mesh; it is not exhaustive continuous-time agreement. Native support audits inspect
all authored frames with the declared support intervals. Other-subject native cases
were explicitly skipped when their required fixture directories were absent; those
skips are not passes. Maintenance, application/geometry, native and browser scopes
remain distinct even when all relevant gates succeed.

The [fox self-review](../../../packages/dcc-workbench/assets/fox/visual-review.json),
[boar self-review](../../../packages/dcc-workbench/assets/boar/visual-review.json)
and [raven self-review](../../../packages/dcc-workbench/assets/raven/visual-review.json)
pin the source, motion, model and retained evidence. Parent light audits recomputed
those pins, checked actual GLB clip names, inspected a representative portrait and
read compact proof reports and gate logs. They did not repeat the owners' full
visual or technical review.

These are stylized authored performances, not captured motion or calibrated animal
biomechanics. Reference fidelity remains unassessed; model units are not metres.
Boar soles use flat planted support rather than a biomechanical hoof-roll model.
Raven supplies grounded motion only: flight, takeoff and landing are outside its
selected five-clip scope. No feather collision, aerodynamic simulation or individual
toe-roll behavior is claimed.
No remote publication or push is part of this campaign.

Raven trajectory compaction is a measured example, not a blanket simplification rule:
**1,229 rows became 10 endpoint rows**, and combined contract/receipt JSON fell from
**208,471 to 10,419 bytes**. Maximum interpolation error was **1.11e-16 model units**
and the GLB remained byte-identical. Nonlinear paths require their own equivalence
check. See the retained [compaction receipt](../../../packages/dcc-workbench/assets/raven/evidence/trajectory-compaction.json).

## Campaign closeout

Three distinct Astra/high sessions completed sequentially, with each successor receiving
the prior owner's handoff and tested refinements. The parent accepted each after a light
evidence audit. Exact session IDs and full working handoffs remain under
`.work/sessions/rig-strategy-three-rounds-2026-10-11/`; the maintained source guides and
review records linked above retain the deliverable contracts and evidence.

Existing fox/boar deliveries stayed unchanged through the raven round. Original
canid/wolf masters and gallery defaults remained protected throughout. No aggregate
visual-quality score or arbitrary-rig compatibility is inferred from this campaign.
