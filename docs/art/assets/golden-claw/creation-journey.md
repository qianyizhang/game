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
