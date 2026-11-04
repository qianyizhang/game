# PVFX Foundry: what transfers to Card Workshop

**Decision, 2026-11-04:** borrow the effect-authoring and timing approach first.
Keep the game's existing silhouettes and snapshot-driven presentation. A
Cinder cooling-phase trial is implemented for [issue #116](https://github.com/qianyizhang/game/issues/116),
but browser and visual acceptance are blocked; it is not an accepted visual upgrade
or a merged change.

## What the link contains

[PVFX Foundry 1.0](https://nerijs.itch.io/pvfx-foundry) ships rendered PNGs and JSON,
not its authoring application. Its bundled license dedicates those assets,
metadata and listed documents to CC0; it explicitly excludes the software, effect
program source and marks. This is different from the MIT-licensed
[pixelfx toolkit](https://github.com/patch-gg/pixelfx/tree/a841596) credited by the
pack. No upstream executable code was installed or run for this study.

The downloaded `PVFX-Foundry-1.0.0.zip` has SHA-256
`4ffa1cbefae83942b8feeb13e992ac21d1630333acc9542a9b89f9c1f6e49b62`.
Local inspection confirms 101 effects, 77 one-shots, 24 loops and 1,826 frames per
tier. There are 404 sheets: lit/strict × grid/packed. All 1,002 checksum entries
match. Every grid frame reconstructs byte-for-byte from its packed counterpart;
strict alpha is binary, and every one-shot ends on an empty frame. Those checks
establish payload consistency, not the aesthetic quality of all 101 effects.

## How it works

There are two separate stages:

1. **Author an effect as code.** In public pixelfx, an effect describes local
   shapes, palettes and timing. Pure effects draw from time and seeded inputs;
   simulated effects maintain particles. The inspected
   [runtime](https://github.com/patch-gg/pixelfx/blob/a841596/src/core/fx.js)
   accumulates time, wraps loops, places the painter, and combines a color buffer
   with an additive-light buffer. Its simulation update subdivides each caller
   delta into steps no larger than 1/120 second. That is not a fixed-step
   accumulator or proof of identical results for arbitrary frame partitions.
2. **Bake and play frames.** PVFX exports its own renderer's output into PNG
   atlases. The game samples the declared durations and frame rectangles rather
   than running that original effect program. Its provenance names
   `pvfx-fx/0.1.0+quickjs-ng-0.16.2+pixelfx-0.3.0-a841596`; the referenced Pixel VFX
   Studio source was not publicly retrievable. The toolkit explains part of the
   approach, not every implementation detail of PVFX's generator.

The public [campfire program](https://github.com/patch-gg/pixelfx/blob/a841596/src/fx/fire/campfire.js)
shows the useful structure: overlapping flame tongues, separate drifting smoke
and embers, a small hot core, and local color ramps. Seeded noise and per-particle
seeds vary the shapes reproducibly. This is authored procedural animation, not a
single image being faded or a runtime image model.

The visual lesson is a readable progression: anticipation, impact, then material-
specific decay. Fire loses white-hot energy and cools; smoke separates and thins.
[Hugo Duprez's authoring note](https://www.spritefusion.com/blog/how-to-make-good-pixel-art-effects-with-claude)
also emphasizes rendering alternatives and iterating against actual motion and
references rather than accepting a first generated draft.

## If we import the sheets later

Use the bundled `IMPORTING.md` and manifests, not legacy assumptions:

- Grid: eight columns, per-effect cell size, row-major order, declared frame count.
  Legacy 0.10 instead uses five columns, 96×96 cells and 50 ms frames.
- Timing: rational milliseconds per frame; respect `loop_mode`. Do not infer frame
  count from transparent grid padding or restart a one-shot forever.
- Packed: preserve the original pivot and trim offset. A pivot outside a crop is
  valid. Empty frames retain duration but draw nothing. Ignoring those facts makes
  anchored effects jump or flash.
- Use nearest filtering, clamp edges and deliberate pixel scale. Lit sheets have
  already baked light into RGBA; adding another glow/blend treatment is a separate
  art decision, not an automatic import requirement.

A bulk pack import or general-purpose effect engine is not justified yet. It would
add asset, playback, disposal and style obligations without a selected consumer.

## First transfer: Cinder only

Night Passage already has the right ownership: the
[patron layer](../../src/games/night-passage/ui/presentation/scene/patron-effects.ts)
reconstructs bounded decoration from a rules snapshot. Existing spell windup owns
anticipation; an impact cue must never invent a second delay.

The trial holds its existing bright cue for two of sixteen ticks, then tints the
same flame toward gold and ember while fading. It adds no textures, particles,
requests, RNG, independent clock or rules changes. Other patrons, projectiles,
windup, ground warnings, shape/placement and the 48-sprite bound remain unchanged.
Every pooled sprite resets its tint before reuse. Reduced motion retains the
original fixed color, fixed spatial pose and linear fade.

Pure envelope tests cover immediate impact, monotonic cooling, expiry, seeking and
reduced motion. A nonrendered Three.js test also checks pooled tint reset for other
patrons and projectiles,
snapshot purity and reduced-motion behavior with canvas drawing doubled. The
existing real-renderer journey is extended to check cooling,
backward reconstruction and tint reset, with extra phase captures at both display
sizes. Those browser checks have **not run**: Chrome fails its startup guard on a
socket permission restriction even after an approved elevated attempt. A separate
cloud preview could not reach the local server. Guards were not weakened.

**Next:** run the affected patron journey in an authorized compatible environment,
inspect matched original/updated 960 px and 390 px phases and crowded warnings,
then decide whether to keep the visual trial. The issue and draft PR are authorized;
merging remains a separate decision after the outstanding acceptance work. This
work does not resume the paused policy studies or performance backlog.
