# One Quiet Breath — Spire candidate story

Original candidate fiction,not established run history or a new game rule.
The Silent pauses at a campfire: a guarded hand relaxes,her posture eases,and
she looks toward the climb again. The fire provides a place to rest rather than
becoming the plot's transformed object. No weapon manipulation,new enemy or
precise mechanical contact.

## Grounding and reuse

Main3a59621069dd1fe912a749d851d27e993507f5dd defines the Silent and campfires.
`src/games/spire/domain/game.ts` accepts Rest at a campfire and applies the
permitted heal before returning to the map; `ui/Rooms.tsx` owns Rest/Smith/Leave.
This is an emotional illustration of that pause,not an HP animation or claim
about relic eligibility,a specific run,arrival or departure.

The live catalogue sources `spire/characters/silent` and `spire/rooms/rest` were
rendered alone and visually inspected temporarily. `ui/CharacterArt.tsx` owns
the green cowl,bone skull mask,two swept horns and layered cloth; the rest icon
in `ui/SpireSceneArt.tsx` owns the crossed logs and copper/cream flame language.
Reuse their identity,planes and palette. Current combat portrait holds two
blades and cannot show a supported seated rest gesture unchanged. Combining
that upright combat pose with a fire icon also misses the relaxed hand/shoulder
progression. A single native SVG rest composition is justified for this separate
story purpose,not a duplicate portrait suite or runtime replacement. Existing
sources remain live at their pinned paths; no frozen catalogue is retained.

PR153's Spire aftermath material studies and other open story PRs were inspected
for overlap. This is a Silent campfire rest vignette,not their material suite,
the Night Passage lantern sacrifice,Cartographer tile rotation,Hearth hospitality
or held Scrapyard repair. No new named character or canonical history.

## Original storyboard and continuity

Locked landscape waist-up three-quarter view. Silent sits supported on a broad
stone at the left; one bent knee supports one gloved hand,curled at the opening.
The other hand rests inside the cloak and is not separately posed. One small
steady campfire sits at lower right,separated from all cloth. A quiet ascending
stone path in the upper right gives the final gaze a destination. Two horns and
fixed skull-mask openings keep the identity readable; no facial transformation.
Weapons are out of this resting composition,not manipulated or newly designed.

1. **Let Go:** slight downward hood inclination and one slow shoulder release;
   the supported glove gradually uncurls to a loose resting hand on the knee.
   Keep wrist/forearm attachment,knee support and all props stable. End at rest.
2. **Again:** begin from the actual first endpoint. A quiet breath and slight
   straightening lift the mask toward the ascending path. The same relaxed hand
   remains supported; a small cloak-edge motion settles. End seated but ready,
   without an untested full stand,walk,weapon action or magical heal.

Plan two16-frame,300ms,480×336 native GIF chapters,9.6s if joined usefully. Keep
actual actions readable and inspect all32 frames; never promise seamless cuts.
The first GIF uses the reviewed SVG's exact PNG rasterization. The second uses
its actual first-chapter endpoint alone,which already carries identity and state;
avoid a conflicting earlier pose anchor. Still-PNG edit support is established;
GIF-as-input is neither tested nor claimed.

## Pilot,grant and stop

Block `story-next-arc-block-08` authorizes at most ONE native SVG pilot(max$3)
and TWO sequential GIFs(max$1.50each),aggregate$6. Skipping SVG cannot fund a
third GIF. One sequential request stream,no automatic retries,unique client
trace ID and durable reservation before each dispatch. Unknown outcomes retain
the entire remaining block and stop new calls. Stop also if a useful coherent
story is not emerging; no budget-driven filler or extra paid repair.

Pilot: gpt-image-2.6-sunburst native SVG1280×896,high quality/complexity,
gpt-6.1-sol medium SVG author,n1. Inspect source identity,mask/horns,attached
arm/hand/knee and fire/cloth separation at native and160×112 before animation.
Common settings and exact proposed prompt are stored once in their respective
records. The$3 operational reservation is the prior conservative SVG bound,
not an API-enforced charge cap; recent comparable story SVGs cost$0.105976–0.176445.
No new account,credential or billing change.

Keep SVG/GIF originals,only exact actual PNG references,one call record per
request and concise decoded timing/digest evidence. Inspect native playback,
mobile/enlarged text,reduced-motion still and isolated source gallery/import.
Temporary frame/contact-sheet inspection is not committed. A joined GIF is a
clearly labelled local derivative,not generated seamless continuity. No runtime
consumer,selection,canon acceptance or shared registry writes by this worker.

The initial second chapter clipped horn tips during its larger rise. A separate
scoped grant09 produced one smaller mask-turn correction with steady torso
height/scale. Both originals and distinct assemblies remain;see review.md for
observed15–19px revised clearance and the unchanged shared replay limitation.
