# Golden Claw creation journey

This account covers the initial delivery. A subsequent reference-based revision
is recorded at the end.

The brief called for a hyperreal cinematic cat-superhero fight: 30 seconds,
16:9, 30fps, black armor and gold-white electricity, feline movement, no music,
a standalone HTML with no UI, and a GIF submitted to the `game` repository.
The delivered result is a **2.5D action animatic**, short of the requested
fully realized cinematic CG film.

1. **Build a procedural 3D attempt.** I used Three.js to construct a feline hero,
   articulated armor, fur fibers, ten armored enemies, an industrial hall,
   lighting, cameras and an attack timeline. Reviewing rendered frames exposed
   rounded, toy-like anatomy, blocky enemies and foreground figures obscuring
   the hero. These were visual failures despite the scene rendering correctly.

2. **Try a more detailed face, then change approach.** Image Gen produced a
   frontal brown-tabby head, which I projected onto curved facial geometry.
   This improved facial detail but left the body and overall scene unconvincing.
   I then replaced the 3D renderer with Canvas 2D compositing. This was my
   implementation decision; the user did not approve a reduction of the original
   quality target.

3. **Generate the final image assets.** Image Gen supplied an eight-pose armored
   cat atlas, a four-pose mercenary atlas and an empty industrial-hall plate.
   The generated cat-head image remained in the closeups. All four images were
   embedded in the HTML. The moving sequence was coded rather than generated
   as video.

4. **Stage the seven-part fight.** I combined interpolated travel paths and
   discrete pose changes with camera transforms, layered depth, afterimages,
   electrical claws, sparks, debris, impact pauses and wipes. The enemy count
   increased from six to ten. Review caught and corrected foreground occlusion
   and a bug that made defeated enemies stand up again during the ending.

5. **Synthesize the soundtrack.** Web Audio generated electrical crackle, air
   movement, impacts, metallic vibration and breathing, with no music. These
   are synthesized effects, not recorded production sound. GIF remained silent;
   MP4 retained the soundtrack.

6. **Render and adjust the exports.** I captured all 900 frames from the
   1280 × 720 HTML canvas. The first GIF was about 314 MiB. Resolution and
   palette reductions produced the final 512 × 288, approximately 81 MiB GIF;
   the MP4 remained 960 × 540. A timing check caught a 30.01-second GIF export;
   correcting the final delay gave exactly 30 seconds, using 30/40ms frame
   delays to average 30fps.

7. **Verify and submit.** Offline HTML, deterministic seeking, aspect ratio,
   sound and the final black frame passed browser checks. Both media files
   decoded fully, and Chrome presented all 900 MP4 frames during actual playback.
   Repository checks passed, including 574 application, 37 simulation and
   128 geometry tests. The work was submitted as [draft PR #64](https://github.com/qianyizhang/game/pull/64).

The technical checks establish a working delivery, not cinematic quality.
Continuous skeletal motion, convincing contact and deformation, true 3D camera
movement, subtle ear animation and physical destruction remain unresolved.
The main lesson is to prove a short sequence containing a closeup, a full-body
pounce and a clear impact against the visual brief before expanding the timeline
and committing to final exports.

## Revision using the supplied character reference

The user then supplied a front, three-quarter and rear character sheet and asked
for a redo using it as an asset. Image Gen produced reference-derived transparent
front and back masters with the compact feline proportions, furry paws, jagged
black armor, glowing seams and chest lightning emblem. These are derived assets,
not pixel-exact extractions of the supplied sheet.

I replaced the hero's eight whole-body pose stamps with fitted head, ear, torso,
limb, paw and tail cutouts. Two-segment limb IK and interpolated poses provide
continuous motion, with foot placement constraints, ear movement and a bending
tail. Front/back views support the aerial and wall sequences. Enemy states now
distinguish recoverable blows from terminal defeats, across twelve opponents.

A short combat sample exposed a clipped forehead, a tail crossing the floor,
floating distant enemies and enemy-atlas crops that included neighboring figures.
These were corrected before the full export. The initial opening and action
stills remain as baseline evidence. Full-sequence review also caught a cropped
face in the upside-down shot; its camera was retargeted to the animated head.
The revised film retains the 30-second,
900-frame delivery contract and the stated 2.5D limitations.

## Contact staging continuation

Review of the actual first-impact MP4 sequence found a low body position and an
oversized claw arc that separated the apparent hit from the gesture. The paw
already extended; simply moving a flash would not solve the staging. A bounded
revision added a visible chamber, a reachable torso-height strike and a narrow
trail sampled from the solved paw. Independent review accepted that short proof,
which was preserved in local commit `5604a30ecea5fbd8d7d1c03861c705bfa9d924b6`.
This was acceptance of the first-contact improvement only.

I surveyed the remaining impacts before extending the change. Four initial
trials at 2.60, 5.85, 18.00 and 23.72 seconds exposed three related problems:
deep body compression on low hits, airborne hand/foot targets that missed the
opponent, and direction changes driven by travel instead of the current target.
The rapid sequence also moved an opponent toward its next attack before the
current contact. Matched short samples led to 15 local pose fits, seven further
trail-only corrections, held strike directions and delayed next-hit approaches.
The existing front/back image masters, camera shots and sound timeline were reused.

Ten matched short segments (331 frames) were reviewed through decoded motion
samples and impact frames before one full 900-frame capture refreshed the GIF,
MP4 and preview stills together. The accepted first-contact frames remained
pixel-identical. The [delivery notes](README.md#接触动作修订) record the affected
times, reach/support checks and capture source hash.

This pass makes the surveyed contacts easier to read. It does not resolve the
2.5D cutout seams, physical deformation, true 3D camera movement or original
cinematic quality gap. The user has not approved a reduction of that original
quality target, and neither the local contact acceptance nor the technical
checks establish acceptance of the complete film.
