# Motion evaluation

Assess one performance against explicit criteria. Keep measured results, visual judgments
and reference fidelity separate. There is no aggregate quality score and no automatic
"authentic" verdict.

## Small reusable interface

`evaluate(criteria, measurements, observations)` returns findings:

- **Criterion:** the question, dimension and rationale. A metric criterion adds units,
  bounds and their basis (technical tolerance or art direction); a rubric adds a prompt.
- **Measurement:** a finite value, units and coverage. Missing or incompatible evidence
  yields `unassessed`, never a pass. A metric outside the stated bounds yields `revise`.
- **Observation:** a reviewer's `pass` or `revise` judgment, explanation and evidence
  references. A rubric stays `unassessed` until these are supplied.
- **Finding:** criterion, result and the exact evidence used. Passing one criterion does
  not confer acceptance on another or imply user approval.

The core knows no skeleton names, meshes or species. `motion.ts` supplies shared pose,
pacing, weight and reference rubrics, and adapts saved motion contracts and optional
native contact receipts into measurements. The
[canid profile](../subjects/canid/evaluation.ts) supplies this family's timing targets
and rubric prompts. A second rig should supply its own profile and measurement adapter
where its evidence differs; reuse the core without introducing a general rig solver.

```sh
npm run dcc:canid -- evaluate
npm run dcc:canid -- evaluate path/to/candidate/deliveries
```

The command reports each motion and character, pinned to the delivered model and motion
hashes. It leaves perceptual rubrics unassessed. A review can call `evaluateCanid(receipt,
observationsByClip)` to attach evidence-backed judgments to the same report. These results
are review evidence, not a replacement for the export gate.
The [canid timing review](../assets/canid/refined/timing-review.json) is the first saved
application: pose observations accompany measured timing/contact findings, while perceived
pacing, weight and reference fidelity remain explicitly unassessed. Stills support pose
review; they cannot substitute for watching a performance at its intended speed.

## Starting dimensions

| Dimension          | Measured signals                                                       | Review questions                                                   |
| ------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Timing             | Duration, cycle frequency, marker latency, attack drive, recovery tail | Are preparation, action and recovery distinct at 1×?               |
| Mechanics          | Planted slip/height, floor penetration, limb reach, rolling support    | Does the measured support agree with visible loading?              |
| Readability        | No automatic aesthetic proxy                                           | Is intent clear from multiple views at display size?               |
| Plausibility       | Contact evidence assists but cannot decide                             | Do weight transfer, coordination and follow-through look coherent? |
| Reference fidelity | Requires an identified reference and matched comparison                | Which observed behavior agrees, and where does stylization depart? |

Timing markers are authored intent, not motion-detected impacts. Contact measurements
cover authored frame samples and declared support intervals, not continuous collision.
Model units are not metres; do not transfer spatial thresholds to another scale without
declaring its convention. Per-frame slip also depends on sampling cadence. Future
normalization should use a declared anatomical length, not a guessed bounding box.

The timing/readability rubric draws on [Lasseter's animation principles](https://users.cs.northwestern.edu/~animation/Lasseter_1987.pdf).
Canine coordination references include [Dog locomotion kinematics](https://pmc.ncbi.nlm.nih.gov/articles/PMC4517757/).
These inform questions, not universal numeric cutoffs. The current profile's responsiveness
ranges are artistic decisions for this trial. Physiological or species-accurate validation
remains unassessed without matched reference motion and appropriate scale.
