# Canid rig and motion pilot

## Accepted refinement, 2026-10-10

The user accepted the first delivery as an initial baseline and requested more developed
body detail and substantially more believable, energetic movement. The second revision
keeps stylized canid identity, with stronger anatomy, articulated paws, integrated facial
structures, directional fur groups, and restrained surface finish. The supplied dragon
diagram guides detail layering, not species or an SDF implementation.

Deliver alert idle, brisk walk, energetic trot, and a sharper planted look. Improve support,
loading/push-off, paw articulation, shoulders, pelvis, and restrained spine and secondary
motion. Author shared source motion once and fit it to all three characters. This remains
a bounded visual/rigging trial; production retopology, dense hair grooming, runtime LOD
generation, attacks, and jumps are outside this revision.

Procedural sources are first-class asset recipes in the
[family authoring home](../../../packages/dcc-workbench/subjects/canid/authoring/README.md).
Recipes generate distinct candidates; accepted saved Blender masters remain authoritative
for export. Preserve initial sources, deliveries, and receipts. Refine Ash first, then
propagate the construction to Russet and Moss, with matched baseline/refined review.

Make scoped commits for ownership, visual construction, and motion/delivery. Verify
source edit/save/reload/export, retargeting, contact and loop behavior, browser agreement,
and actual multi-view appearance. Mechanical checks do not establish visual acceptance.

## Initial baseline

The initial implementation and receipts below remain historical evidence. The user's
acceptance was specifically **initial baseline**, not a verdict that its gait or detail
was finished. The refined revision and its findings are recorded at the end of this page.

Accepted scope, 2026-10-10. Build a new animation-ready canid master, one appearance
variant with the same proportions, and one shorter-legged, heavier variant. Preserve
existing Wolf masters and gallery publications.

## What this must prove

- Author idle, walk, and planted look clips once in an editable Blender family source.
- Reuse saved motion directly on the appearance variant. Retarget the same motion to
  the proportion variant with explicit fitting and contact corrections; independently
  generating a target gait is not retargeting evidence.
- Keep connected anatomy, readable weight shifts, stable contacts, and clean shoulder
  and hip deformation. Prove the base in clay before finishing variants.
- Deliver editable character sources, baked GLBs, and an interactive workbench with
  matched cameras, shared time, clip selection, clay/material views, and ground contact.
- Demonstrate that editing a saved source clip updates all three deliveries while
  preserving character mesh data. Report source/export agreement and visual judgment
  separately. Elaborate fur, facial acting, external motion import, and gallery
  replacement are outside this pilot.

## Ownership and authoring

The DCC workbench owns the family rig, saved motion, character fitting, retargeting,
and export. Browser consumers select baked clips; they do not run a retarget solver.
The family source owns motion. Each character source owns geometry, skin weights,
materials, fitted rest skeleton, and native controls. Source creation is an explicit
bootstrap operation; export must not rebuild geometry or regenerate source animation.

A control rig is the animator's editing interface. The deformation skeleton is the
delivery interface. The retarget profile records chain correspondence, reference-pose
alignment, proportion handling, and target corrections. Start with one canid family;
introduce another family only when a second anatomy demonstrates the need.

## Verification and commits

Use coherent commits for the authoring contract and working master, motion reuse and
target fitting, then browser comparison and evidence. New Python and frontend sources
must enter existing checker scopes. Run `npm run check:full` plus affected native and
disposable-profile browser checks. Native and browser launches on this Mac use approved
execution outside the restricted sandbox.

Visual review inspects matched front, side, rear, and portrait views, motion extremes,
and small displays. Numerical checks cover contact error, finite normalized skinning,
loop continuity, shared-source propagation, and exported playback agreement. Passing
those checks does not establish aesthetic or user approval.

## Implementation and findings

The workbench pilot is available at `/?workbench=dcc&compare=canid`. Its maintained
commands and source ownership are documented in the [DCC package](../../../packages/dcc-workbench/README.md#canid-rig-and-retargeting-pilot).

| Character | Purpose                | Geometry         | Delivery                                           |
| --------- | ---------------------- | ---------------- | -------------------------------------------------- |
| Ash       | Base canid             | 27,074 triangles | 20 joints; idle, walk, look                        |
| Russet    | Appearance reuse       | 27,074 triangles | Same proportions and shared source motion          |
| Moss      | Proportion retargeting | 26,350 triangles | 1.07 length, 1.22 width, 0.77 height/stride scales |

Sources are editable native Blender files with animator controls, IK constraints,
bone-heat skinning, materials, and actions. The prototype uses a connected voxel-remeshed
skin and simplified facial anatomy; it is not hand-retopologized production topology.
The family convention fixes control axes, chain names, clip durations, and walk contact
phases. This proves fitting within one family, not arbitrary third-party skeleton
compatibility or anatomically different creatures.

### Corrections established by review

- First clay construction: overlapping tail masses read as segments, and lower-leg
  weights produced pinching. Continuous tapered forms replaced the tail and limb masses.
- Provisional distance weights produced sharp belly/shoulder transitions. Native
  bone-heat weights replaced them, with rigid supporting sole vertices and normalized
  four-influence delivery weights.
- The first export bake used stale parent transforms. Browser/native comparison caught
  errors up to 0.48 model units. Explicit parent-relative baking corrected the mismatch;
  the comparison tolerance remained 0.0001 model units.
- Contact checks now inspect supporting mesh vertices as well as ankle controls at all
  planted frames. Ground-grid travel comes from the delivered clip metadata.

### Acceptance and limits

The shared-motion mutation check changes the saved source look action and proves that
all three fitted characters receive it without changing mesh or skin-weight digests.
The browser checks every delivered character and clip at five native sample times,
including the exact loop endpoint. Sampling does not prove agreement at every possible
intermediate time. All native contact checks use the declared family stance intervals;
changing those intervals requires updating the family convention.

The parent reviewed the base clay construction and the matched browser material view.
Visual scope is a restrained stylized canid with readable weight and fitted movement;
elaborate fur and facial acting remain outside this pilot. Numerical agreement is
technical evidence, not user visual approval. Existing gallery sources and release
pointers are unchanged.

The [review receipt](../../../packages/dcc-workbench/assets/canid/review.json) links the
selected native edit proof, original and mutated consumer comparisons, and final
preview by hash. Final sampled pose error is below **0.0000014 model units**; the
largest planted-sole height or per-frame slip is below **0.0000008 model units**.
These values apply to the recorded poses and declared contact intervals, respectively.

![Canid motion study](../../../packages/dcc-workbench/assets/canid/evidence/preview.png)

## Four-clip refinement · historical · `e5630aa`

At this revision, the workbench defaulted to the refined family. **Revision** selects the initial baseline,
the refinement, or a matched before/after pair for any character. Both revisions retain
their authored cadence during comparison; the clock is elapsed seconds rather than
artificially synchronized gait phases. The floor scrolls continuously across repeated loops.

| Property              | Initial baseline             | Refined family                                             |
| --------------------- | ---------------------------- | ---------------------------------------------------------- |
| Deformation joints    | 20                           | 28, including scapulae, hocks/pasterns and ears            |
| Saved clips           | Idle 4 s, walk 2 s, look 4 s | Alert idle 4 s, walk 0.90 s, trot 0.60 s, look 2.50 s      |
| Sampling              | 24 fps                       | 60 fps                                                     |
| Ash / Russet geometry | 27,074 triangles             | 78,190 triangles                                           |
| Moss geometry         | 26,350 triangles             | 77,752 triangles                                           |
| Refined delivery size | —                            | 3.35–3.37 MB per GLB, including packed fine normal texture |

The body has a more differentiated chest, tucked waist, shoulder and thigh transitions,
articulated hocks, toe shapes and clefts, claws, fitted lids, nostrils and ear bowls.
Broad fur locks merge into the continuous ruff, cheek and brush silhouette. Fine relief,
regional pigment and a packed normal texture finish the surface without covering the
quiet flanks in repeated ornament. The first detached fur-lock pass was rejected because
it read as tiled scales. These are detail stages; no runtime LOD system is claimed.

### Motion corrections and references

The original controls pointed along world Z, making Blender's local Z channel point along
world −Y. A native read of the preserved baseline confirmed that its front paw varied in
height by only **0.0000011 model units** across the walk. The old contact checks examined
declared stance intervals and did not require swing clearance, so they missed this defect.
The refined foot/body controls have explicit world XYZ axes. Delivery checks now require
vertical clearance for every moving foot and examine all low foot/claw vertices for
penetration, alongside planted toe height/slip, limb reach and loop closure.

The walk uses a lateral footfall sequence; the trot pairs opposite fore/hind limbs.
Foot trajectories match ground velocity at lift-off and touchdown. Paw roll pivots about
the supporting toe; target fitting removes the source pivot offset, scales travel/lift,
and reapplies the saved rotation around the target's proportioned toe. Shoulders, pelvic
rotation, restrained spine response, head stabilization and delayed tail/ear motion
accompany the limbs. A foreleg reach failure and late-swing heel penetration were corrected
before final export, without relaxing the contact thresholds.

These are authored stylized movements informed by measured canine locomotion, not mocap
or biomechanical validation. [Gait transitions](https://journals.biologists.com/jeb/article/216/12/2257/11423/Gait-transitions-and-modular-organization-of)
informed the distinction between stance, swing and gait ordering. The
[pelvis/lumbar study](https://pubmed.ncbi.nlm.nih.gov/26831181/) supports pelvic motion coupled
to the limbs with relatively restrained spinal excursions. The
[hind-limb kinematics study](https://pmc.ncbi.nlm.nih.gov/articles/PMC6242825/) informs the
need for articulated hocks and proportion-aware fitting. Exact recipe values are artistic
choices; model units have not been calibrated to metres.

### Verification and review

All three native deliveries pass toe contact, ground penetration, reach and loop checks.
The largest planted toe height/slip error is below **0.0000012 model units**. Across the
three characters, the least-raised foot reaches at least **0.122 model units** in walk and
**0.184 model units** in trot. Those are sampled peak clearances, not instantaneous minimum
heights throughout swing. Ground penetration at the inspected low vertices is below
**0.0000007 model units**, within floating-point noise.

The saved-source mutation proof changes the look action at frame 45 by 0.18 radians,
saves/reloads, fits and exports every character with unchanged mesh/weight digests. It also
checks that recipe construction refuses existing masters. Browser/native sampled agreement
is below **0.0000019 model units** for both original and edited deliveries. The three affected
browser cases pass. See the [review receipt](../../../packages/dcc-workbench/assets/canid/refined/review.json)
for exact coverage and repository-gate status. The local `npm run check:full` gate passed:
maintenance/build, 253 application tests, four simulations and 127 geometry tests. One
unrelated usage-tool loopback case was skipped by the restricted sandbox; remote CI was
not run.

Parent review covered native clay/material, a trot extreme, browser side/portrait and
front/rear views, before/after comparison and phone layout. This remains a stylized visual
and rigging trial with remeshed topology. Dense fur grooming, production retopology,
runtime LODs and arbitrary external-rig compatibility remain outside scope. User visual
approval is pending; technical checks are not a substitute.

![Initial baseline and refined Ash](../../../packages/dcc-workbench/assets/canid/refined/evidence/before-after.png)

## Action trial · accepted scope · 2026-10-10

Extend the refined family with gallop, a turning and accelerating flee performance,
three distinct one-shot attacks (lunge, articulated bite and forepaw swipe), and a
playful shoulder-over-back roll that returns to its feet. Review Ash, Russet and
shorter, broader Moss in clay and material, including inverted poses and contact changes.
The initial baseline remains intact; Git revision `e5630aa` preserves the preceding
four-clip refined sources and delivery.

The saved motion master owns each clip's duration, loop/one-shot behavior, scene
trajectory, named support phases and visual timing markers. Recipes initialize these
fields; fitting and export consume the saved values without regenerating the performance.
Scene travel has one owner in playback, separate from the local skeleton. Retargeting
must preserve world-space stance during turns and refit rolling contact to each body.
Full-body floor checks complement paw contacts; one-shot actions do not require loop closure.

Last Hearth keeps its card board and adds a focused 3D attack stage for Briar Stray.
Lunge, bite and swipe are deterministic presentation variants of already-resolved attacks.
The replay clock drives both views, including pause, seek, speed and reduced motion.
Damage and outcome remain authoritative in the existing combat rules. Flee and playful
roll remain workbench performances because the game has no corresponding rules.

Completion requires saved-source edit/save/reload/export propagation, native/browser pose
agreement, one-shot completion and replay, visible scene travel, contact evidence across
all three bodies, and the full repository gate plus affected browser checks. Technical
verification remains separate from visual review. This section records the accepted scope;
the delivered evidence is recorded below.

## Action delivery

The current refined sources contain **29 deformation joints and ten clips at 60 fps**.
The independent jaw opens the bite; foot pole controls keep knees oriented through inversion.
Saved Blender actions own playback, scene trajectory, support phases and timing markers.
The [authoring home](../../../packages/dcc-workbench/subjects/canid/authoring/README.md)
documents the maintained recipe modules and saved custom properties.

| New motion   | Duration | Playback / intent                              |
| ------------ | -------- | ---------------------------------------------- |
| Gallop       | 0.70 s   | Loop, faster asymmetrical footfall cycle       |
| Lunge        | 1.80 s   | Crouch, forward strike, planted recovery       |
| Bite         | 1.40 s   | Open jaw, snap, recover                        |
| Paw swipe    | 1.60 s   | Lift and sweep the near forepaw                |
| Playful roll | 4.00 s   | Shoulder, back, opposite flank, regain feet    |
| Flee         | 3.60 s   | Turn approximately 80 degrees, accelerate, run |

Idle, walk, trot and look retain their prior durations. Workbench one-shot actions hold the
final pose and offer replay; phase buttons jump to named moments. Scene travel follows the
authored path once. In-place inspection moves the grid while keeping the character centered.
Both views apply planar travel exactly once. Flee ends in a running pose; seamless transitions
between arbitrary clips are not part of this trial.

Last Hearth adds an Ash-based Briar Stray attack stage above the existing card board, with the
actual target card. Attack ordinal selects lunge, bite or swipe deterministically. The same
replay clock drives the board and stage, including pause and speed; seeking shows the contact
pose. Reduced motion uses a still pose. Between attacks the stage retains its space to avoid
shifting the board. The integration changes presentation only: no combat rules, abilities,
damage calculation, seeded state or replay schema changed. Flee and roll remain workbench-only.

### Contact and export findings

Turning stance fitting fixes toes in world space. Roll fitting adapts reach and knee direction
to each body's proportions and grounds the evaluated skin. A rejected Moss roll rested on its
folded thigh before its back; restricting inverted limb folding corrected the support.
Attack tail penetration and gallop overreach were also corrected before delivery.

Across the three bodies and ten motions, the largest measured planted sole height is
**0.000032 model units**, and per-frame planted slip is **0.000071 model units**. The largest
declared flank/back support gap is **0.00338 model units**; full-body floor penetration is
below **0.0000009 model units**. Those checks cover authored 60 fps samples and the declared
support intervals, not arbitrary continuous-time collision or self-intersection.

Ash and Russet each have **83,776 triangles**; Moss has **83,398**. Every GLB remains below
the unchanged **4,000,000-byte** trial budget. These are stylized procedural characters with
remeshed topology and empirical animation recipes, not motion capture or production retopology.

The [action review receipt](../../../packages/dcc-workbench/assets/canid/refined/action-review.json)
records the selected visual evidence, saved-source mutation proof, native/browser agreement
and final gate results. The earlier refinement receipt and images remain historical evidence.
Visual review and user approval remain separate from technical verification.

The saved-source proof edits head and jaw keys at exported sample frames, plus a contact
marker. All three characters retain their mesh/weight digests and receive the changes after
save/reload, fitting and export. The browser must both match those native samples and differ
from the original poses. Maximum sampled agreement error is below **0.000002 model units**.
All **five browser journeys** pass. `npm run check:full` passes maintenance/build, **253
application tests**, **4 simulations** and **127 geometry tests**. One unrelated usage-tool
loopback test is sandbox-skipped; remote CI was not run.

![Briar Stray attack stage above the card board](../../../packages/dcc-workbench/assets/canid/refined/evidence/actions/last-hearth-attack.png)

## Second timing review — 2026-10-10

The user's next critique was sluggish motion. This pass retains the saved poses and
character geometry while revising each clip's cadence and internal timing. The preceding
library remains recoverable at `f9b5774`; the original three-clip baseline is unchanged.

| Motion | Before → after | Refinement                                                               |
| ------ | -------------- | ------------------------------------------------------------------------ |
| Idle   | 4.00 → 3.60 s  | Small change; preserve the quiet alert stance.                           |
| Walk   | 0.90 → 0.80 s  | Brisker cycle without turning the walk into a run.                       |
| Trot   | 0.60 → 0.50 s  | Quicker diagonal exchange; preserve planted toes.                        |
| Gallop | 0.70 → 0.50 s  | Faster gathered/extended cycle and matching scene travel.                |
| Look   | 2.50 → 1.60 s  | Earlier head turn and a shorter return.                                  |
| Lunge  | 1.80 → 0.95 s  | Contact at 0.304 s, previously 0.792 s; retain the crouch.               |
| Bite   | 1.40 → 0.70 s  | Contact at 0.238 s, previously 0.602 s; compress jaw drive.              |
| Swipe  | 1.60 → 0.85 s  | Contact at 0.289 s, previously 0.752 s; retain the lifted paw.           |
| Roll   | 4.00 → 2.40 s  | Back phase at 1.08 s; quicker transition through inversion and recovery. |
| Flee   | 3.60 → 2.40 s  | Running phase at 0.648 s, previously 1.440 s.                            |

These are art-direction choices for the trial, not physiological timing norms. A monotone
phase warp retimes controls, trajectory, contacts and markers together. Gait resampling
works in toe space to avoid introducing contact slip while interpolating ankle rotation.
Retargeting retains each character's mesh/weight digest. The saved Blender masters remain
export authority; [timing.py](../../../packages/dcc-workbench/subjects/canid/authoring/timing.py)
is an explicit, guarded revision recipe with its parent source documented in the authoring home.

The workbench and continuous combat replay previously capped each animation-frame delta
at 50 ms. Under rendering load that lost elapsed time and produced slow motion. They now
account for visible elapsed time and reset their timestamp on visibility changes. A browser
regression injects a 180 ms main-thread stall. Last Hearth still uses the resolved combat
replay clock; the table above describes the source clips, not independently scheduled game
attacks. Fixed attack framing was also widened after Moss's muzzle clipped the review view.

### Reusable evaluation

[Motion evaluation](../../../packages/dcc-workbench/evaluation/README.md) is the maintained
home for criteria, measurements, review observations and findings. The core has no rig or
species assumptions. Shared motion rubrics cover pose readability, perceived pacing, weight
and reference fidelity; the canid profile supplies family-specific numeric targets. Missing
evidence yields `unassessed`. There is no overall quality score or automatic authenticity
verdict. Future assets can reuse the core and rubrics with their own measured signals,
scale conventions and targets.

The [timing review](../../../packages/dcc-workbench/assets/canid/refined/timing-review.json)
pins the new deliveries, before/after timing, every motion's pose observations and evidence.
Review covered four side phases and one portrait phase for each motion across all three
characters. The key poses remain distinct; the look and jaw are easier to read in portrait.
**Perceived pacing, weight and reference fidelity remain unassessed** in the saved rubrics:
phase stills and passing contact checks do not prove those perceptual properties. User
visual acceptance remains pending.

Native save/reload and source-edit propagation passed with unchanged character meshes and
weights. Six focused browser cases passed, including native/edited deformation agreement,
slow-frame playback, one-shot behavior, scene travel, phone layout and Last Hearth
result/save isolation. Native/browser sampled deformation differed by at most
0.00000190 model units. Final repository-gate results are recorded in the timing review;
remote CI was not run.

![Revised lunge phases across the three bodies](../../../packages/dcc-workbench/assets/canid/refined/evidence/timing/lunge.jpg)
