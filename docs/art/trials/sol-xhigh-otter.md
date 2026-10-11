# Sol xhigh otter modeling trial

## Question and design

Started 2026-10-11 from `729e515d06e8313ab724c5578d963604d7807f62`.
The user requested one new creature built by **GPT-6.1 Sol / xhigh**, followed by
more parent auditing to assess quality against the earlier Astra/high studies.
This is a single observational trial: species, accumulated scaffolding and review
intensity differ. It cannot isolate a model effect or establish a numerical
quality regression rate.

The implementation owner builds a stylized **river otter** with five intended
land-based performances, editable character and motion masters, baked GLB and an
interactive DCC study. Swimming and water simulation are outside scope. The
owner starts from the [promoted playbook](../../../skills/card-art/references/native-modeling.md)
and performs its own diagnosis, repair and review without another model doing
the creative or implementation work. There is no preset time limit.

The parent owns this audit and bookkeeping. Existing canid, fox, boar and raven
sources, deliveries and selected evidence are pinned before construction in the
local session's `baseline.json`. The owner freezes a committed **first self-approved
submission** before parent feedback. Parent findings and subsequent owner repairs
are recorded separately so final polish does not erase first-submission defects.

## Audit decided before submission

| Area                  | Parent inspection                                                                      | Failure worth sending back                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Identity and form     | Front, side, rear clay; portrait and phone; compare fox/boar finish standards          | Generic elongated quadruped, disconnected muzzle/limbs/tail, primitive seams, unreadable otter proportions  |
| Deformation           | Enlarged torso, shoulder, neck and tail at intermediate poses and extremes             | Pinching, detached dependents, stretched regions or intersections concealed by default framing              |
| Performance           | Every clip at actual 1×, dense distinct phases, loop and one-shot endings              | Indistinguishable clips, mechanical timing, foot sliding, unsupported weight, abrupt loops or poor recovery |
| Source authority      | Inspect fitting/export boundaries and independently check pins and edit proof          | Rebuild during export, mesh/weight changes during fitting, source edit fails to reach actual playback       |
| Delivery and consumer | Real route, controls, source downloads, phone framing and contact/equivalence evidence | Missing or misleading delivery, clipped motion, double travel, untested prerequisites reported as passes    |
| Maintainability       | Inspect owned diff, checker coverage, species boundaries and handoff                   | Copied species assumptions, weakened tests, unnecessary shared framework, missing reuse instructions        |

Use named findings with **view/time, visible or measured defect, severity and
requested correction**. Classify each area as acceptable, needs repair or unassessed;
do not combine these into a fabricated quality score. Compare equivalent clay/material
views and normalized display sizes where possible, and disclose unmatched coverage.
Historical owner judgments are supporting context, not independent baseline approval.

The owner runs `check:full` and affected native/browser checks. The parent inspects
the actual evidence and adds targeted independent checks for uncovered risks,
without duplicating the entire completion gate. Record skips and limits explicitly.

## First submission and parent findings

The owner froze `6e1560f376c247492dbfdc1bca06ccae09f772f4`: Alder, five clips,
100,140 triangles, 22 deformation joints and a 3,940,712-byte GLB. Its full gate and
affected native/browser journeys passed. Maximum sampled native/browser surface
error was 2.230004e-6 model units. All 203 protected baseline files were unchanged.
These technical passes did not establish motion quality.

Parent inspected all four clay views, material portrait, enlarged scent/groom,
intermediate groom and bound compression, every clip's decoded actual-playback
sheet, phone evidence, and live consumer controls. The first submission requires
repair in two areas:

| Finding                          | Evidence and consequence                                                                                                                                                                                                                                                                                     | Requested correction                                                                                                                                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F1: grooming support and gesture | At the 2.60 s cheek phase, side clay shows a long near-horizontal torso ahead of the rear feet, both forepaws raised and rump/tail still elevated. It reads as hovering/rearing, despite the stated seated wash. The front recording conceals this.                                                          | Establish visible weight-bearing support through lift, strokes and recovery. A convincing sit or an honestly named supported three-paw wash is acceptable; inspect side and three-quarter at actual 1×.                                          |
| F2: object-transform blind spot  | On disposable copies, translating `Paw web fore.L` upward by 0.05 units changes its evaluated world minimum from 0.019059516 to 0.069059558. Export still accepts it, reports only 0.001060072 planted-height error and retains the same mesh digest. Evaluated local coordinates omit the object transform. | Measure evaluated scene-space support/clearance or reject unsupported transforms explicitly. Cover upward paw and below-floor surface mutations, preserve meaningful transforms in the source digest, and prove valid-source export still works. |

The [first grooming side view](../../../packages/dcc-workbench/assets/otter/parent-audit/first-groom-side.jpg)
and [independent transform probe](../../../packages/dcc-workbench/assets/otter/parent-audit/first-transform-probe.json)
preserve the original findings. The probe confirms authoritative source/delivery
bytes were unchanged. F2 also appears in the earlier exporter pattern, so it is an
uncovered workflow weakness, not evidence of a Sol-specific regression.

Neutral identity, material restraint, connected silhouette and the inspected gait
phases are provisionally comparable to the earlier stylized studies. That judgment
does not accept the grooming performance. The comparison uses actual baseline
pixels rather than only their owner acceptance statements. Identity criteria are
consistent with the [Smithsonian river otter description](https://www.nationalzoo.si.edu/animals/north-american-river-otter);
reference-matched motion and calibrated biomechanics remain unassessed.

## Repair and independent reinspection

The same Sol/xhigh owner repaired both findings in one parent-feedback round,
committed as `8d6d22e` after the frozen initial submission `6e1560f`.
It replaced the hovering sit with a low three-paw cheek wash. Its first repair
attempt overextended the forearm; the owner caught that in the opposite
three-quarter view, shortened the reach and lowered the head before resubmission.
The saved repair changes grooming keys without rebuilding the neutral sculpt or
weights. The other four performances remain unchanged.

The exporter now checks evaluated world-space sole/clearance geometry and rejects
unsupported object, parent-inverse and scene transforms through every authored
frame. Geometry digest v2 includes transforms and weight-group names. The owner
added disposable unapplied and applied transform faults plus valid-source export.

Parent independently repeated an upward paw translation of **0.05 units** and a
body translation of **-0.5 units** on fresh copied masters. Both are rejected with
an actionable object/matrix error; both change the digest; authoritative files
remain unchanged. See the [paw report](../../../packages/dcc-workbench/assets/otter/parent-audit/repaired-paw-transform-probe.json)
and [body report](../../../packages/dcc-workbench/assets/otter/parent-audit/repaired-body-transform-probe.json).
These outcomes close F2 for the otter exporter; they do not retroactively repair
older species exporters.

Parent reviewed the repaired native lift, strokes, recovery and enlarged arm;
then reloaded the actual workbench, inspected side and orbited opposite
three-quarter views, and checked the one-shot standing recovery at 6.00 s.
The three-paw support and cheek gesture are acceptable at this study's stylized
bar. See the [consumer view](../../../packages/dcc-workbench/assets/otter/parent-audit/repaired-groom-opposite-consumer.jpg)
and [pinned reinspection](../../../packages/dcc-workbench/assets/otter/parent-audit/reinspection.json).
All **203** pinned baseline files remain byte-identical.

## What the model comparison supports

| Area                                            | First self-approved submission                                        | After parent feedback                                |
| ----------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| Identity, neutral form and restrained materials | Acceptable; broadly comparable to inspected fox/boar/raven studies    | Preserved                                            |
| Grooming weight and gesture                     | Needs repair; side view contradicts seated-wash claim                 | Acceptable three-paw wash after owner refinement     |
| Other four performances                         | Acceptable in inspected phases/playback                               | Preserved                                            |
| Source/export contract                          | False acceptance of transformed geometry; inherited workflow weakness | Independent faults rejected; valid export retained   |
| Self-review                                     | Missed a material support problem despite passing technical gates     | Same owner responds effectively to concrete evidence |

**Observed construction quality remained broadly comparable with Sol/xhigh.
Accepting its first self-approval would have shipped an important motion defect.** Targeted parent feedback brought the result to the
established stylized study bar. The higher review intensity could also have found
misses in earlier Astra rounds; one different creature cannot establish that
Astra would have avoided this defect, quantify a model quality gap, or compare
cost/speed. No matched reference motion or biomechanical validation was performed.

Three refinements are reusable: inspect weight-bearing torso support in side and
opposite views, distinguish planted-foot metrics from convincing weight transfer,
and challenge source/export checks with disposable faulty geometry. Preserve the
first self-approved submission separately from repaired delivery when comparing
models; otherwise the repair process erases the evidence being compared.

## Completion evidence

The repaired delivery passes `npm run check:full`: **253 application tests,
4 seeded simulations, 128 geometry tests, 59 DCC tests and 16 Python tests**;
62 Python modules type-check and the inventory covers 555 maintained sources.
The tooling suite has 83 passes and one sandbox loopback skip; the separately
approved usage suite passes **9/9 with no skips**, including that loopback journey.
The focused functional browser and fresh native/browser suites each pass.

Fresh sampled native/browser maximum surface error remains **2.230004e-6 model
units**; the saved +0.12-radian scent key edit changes the exported surface by
**0.102135 units**. Sampling covers every clip at 12 Hz plus endpoints and 16
vertices per mesh; it is not exhaustive continuous-surface proof. The repair
preserves the mesh/weight/transform digest and the four other decoded animation
tracks. Four owner fault cases and two independent parent fault cases reject bad
sources. Valid saved-source export passes.

The final source, motion and delivery hashes are recorded in the
[separate repair review](../../../packages/dcc-workbench/assets/otter/repair-review.json).
Parent documentation formatting and maintenance inventory checks pass. No parent
finding remains open on this delivery; user aesthetic approval remains separate.
