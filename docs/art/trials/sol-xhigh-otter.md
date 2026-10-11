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

## Status

Both findings returned to the same Sol/xhigh owner. Post-audit repair and parent
reinspection are pending; no final model-quality comparison is concluded yet.
