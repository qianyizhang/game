# WIP · Spire defensive identities

Generated and accepted November 6, 2026. Six selected SVG scenes now replace the
three cards' base and upgrade art. All nine packed scenes and the GIF remain in
WIP for reference, with their exact prompts and intermediate work preserved.

## Accepted selection and integration

The user said the batch looked good, requested consolidation into the art skill,
and authorized selecting its best work to replace the current art. Select the
regular row for base art and the stronger third-row silhouettes for upgrades:

| Card          | Base source             | Upgrade source            |
| ------------- | ----------------------- | ------------------------- |
| Metallicize   | `metallicize-base.svg`  | `metallicize-future.svg`  |
| Ghostly Armor | `ghostlyArmor-base.svg` | `ghostlyArmor-future.svg` |
| Sentinel      | `sentinel-base.svg`     | `sentinel-future.svg`     |

The original future-row names identify source cells; their selected art serves
the existing single upgrade level. The middle row remains an unused alternate.
No future game level or card content is added. The GIF remains a retained motion
study, since the requested plate formation was weak. The shared method is in the
[art skill's batch reference](../../../../skills/card-art/references/batch-assets.md).

`src/games/spire/ui/art/defense.tsx` is the live editable JSX adaptation. It removes
each selected SVG's local background and IDs, fits its vectors within the current
160 × 112 `ArtScene`, and keeps the game's palette/backdrop, border and HTML text.
`ironclad.tsx` and `AbilityArt.tsx` use these base/upgrade scenes. Six existing
export IDs migrate; the other illustrations and shared Helmet primitive remain
available to their other consumers. No rules, content, replay or save meaning
changes. The presentation owner maintains the six scenes; no API dependency or
runtime SVG parser is introduced.

The [matched before/current comparison](adoption-comparison.webp) uses the same
live export renderers, frames and sizes. Six `before-*.svg` exports preserve the
former helmets. Original generated sheets, extracted cells, prompts, usage and
all trial artifacts remain under the user's preservation hold. The actual card,
hand and phone browser review is part of this adoption's verification bundle.

## November 6 scope amendment

The user welcomed the earlier artwork and asked to test more illustrations per
large output, including regular and upgrade art together, possible future
upgrade levels, and GIFs as card play effects. Proceed with one 3 × 3 SVG sheet
at 1440 × 1008: the same three identities across regular, upgrade and one future
tier. The future row explores visual progression only; it adds no game content
or rules. Keep the original six-scene proposal below as retained planning history.

The GIF is a single reference-guided Metallicize **play effect**: plates form,
lock and settle. Review the transient action and stable final frame, rather
than requiring idle looping motion. The budget remains at most one SVG request
and, only if its sheet is useful, one GIF request. No automatic retry or reroll.
The exact [SVG prompt](svg-prompt.md) is retained before dispatch. The source
starts from `717b8f0` plus the local gallery/WIP changes.

These are quality replacements for the six existing illustrations. Existing
primitives and the earlier independent SVGs remain comparison sources; the
future tier and motion are retained studies, with no new runtime consumer yet.
The art catalogue owns review and any later migration. Upkeep is one editable
sheet plus nine extracted review scenes and one motion study; it is justified
only if distinct contours and upgrade gestures survive compact display. Do not
promote weak cells merely because they came in the same paid output.

## Generated results and cost

| Output               | Request ID                             | Seconds | Estimated USD |
| -------------------- | -------------------------------------- | ------: | ------------: |
| Nine-scene SVG       | `req_1052fe9d938742108d1c670938af564b` |  208.50 |     $0.155350 |
| Metallicize play GIF | `req_2f290dc5f866441998d486890cc43796` |   28.77 |     $0.058470 |
| Total                | Two successful requests, no retries    |  237.27 | **$0.213820** |

The SVG image stage used 1,082 text input and 1,165 image output tokens. Its
`gpt-6.1-sol` author used 3,055 input and 10,888 output tokens (57 reasoning
tokens are already included in output). The GIF used 390 text input, 630 image
input and 1,716 image output tokens. Estimates use [standard pricing](https://developers.openai.com/api/docs/pricing):
Image 2.6 text input $5/M, image input $8/M, image output $30/M; SVG author input
$2/M and output $10/M. These are usage estimates, not billing statements.

The SVG-only cost is **1.73 cents per generated scene**, compared with 8.48 cents
per scene for the earlier three independent requests. Counting only the six
regular/upgrade candidates gives 2.59 cents each. Those are about 80% and 69%
lower respectively, but the drawings are simpler and quality is not matched.
Six static scenes were selected after user acceptance: SVG cost per selected
illustration is about 2.59 cents, excluding the separate GIF study.

The original [sheet.svg](sheet.svg) is retained byte-for-byte (23,040 bytes,
225 paths), together with its [exact request](svg-request.json),
[response metadata](svg-response.json) and [prompt](svg-prompt.md). All nine
top-level groups have the requested IDs. Extraction removed only each cell's
grid translation and wrapped that group in its own 480 × 336 SVG; every
standalone file retains editable paths. The XML/resource check found no raster
image, script, foreignObject, visible text, animation, external reference or
document entity. The full sheet decoded at 1440 × 1008.

The original [GIF](metallicize-play.gif) is 480 × 336, twelve 100 ms frames,
1.2 seconds total. Its [raster reference](reference.png), [prompt](gif-prompt.md),
[request](gif-request.json), [response](gif-response.json), and
[last-frame still](metallicize-still.png) are retained. All twelve decoded PNG
frames, the contact sheet and execution/rendering helpers remain in the active
`.artifacts/spire-defense-packed-2026-11-06/` bundle under the preservation hold.

Author review, before user acceptance:

- **Packing:** all nine scenes are cleanly separated and have a coherent palette,
  contour weight and light direction. No cell extraction needed a paid repair.
- **Regular/upgrade:** Ghostly Armor changes its sweep and crossing arm clearly.
  Metallicize changes the elbow plates and fist angle only modestly; Sentinel
  changes its shield/contact but keeps a similar stance. Do not overstate tier
  differentiation. The future row makes broader contour changes, especially the
  hollow armor and the arm's shoulderward plates.
- **Detail:** these scenes use broad, simple planes and fewer cuts than the
  earlier independent trials. The lower cost does not demonstrate equal visual
  richness. Compact-size and phone gallery views are part of the delivery review;
  actual in-game frame/hand acceptance is still required before promotion.
- **GIF:** identity and palette follow the SVG reference well. Motion is mainly
  a traveling seam glint and slight settling; meaningful plate formation is
  weak. Retain it as a play-effect study, not an accepted production effect.
  The review player plays once and returns to a still, with a still-only mode
  when reduced motion is enabled. Nothing was wired into gameplay.

## Why this batch

| Subject       | Current issue                                                            | Proposed identity                                                  |
| ------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Metallicize   | The dominant helmet is reused; small gears carry its hardening identity. | Fitted metal plates hardening over a bent forearm.                 |
| Ghostly Armor | A tinted helmet dominates; spectral cues are small.                      | A hollow breastplate and connected armor with open negative space. |
| Sentinel      | The helmet repeats Metallicize; wall and energy marks are secondary.     | A planted watchman, tall shield and restrained energy reserve.     |

The three upgraded scenes currently reuse those same subjects with frame marks.
Six replacements would serve the same six existing export IDs, rather than add
new game content. The WIP gallery shows current base/upgrade output and the
[earlier native SVG trials](../spire-image-2.6/README.md) beside one another.
Those trials are retained directions; they have not been accepted or installed.

Owning renderer: `src/games/spire/ui/AbilityArt.tsx`, with the base subjects in
`ui/art/ironclad.tsx`. The existing frame, labels, card effects, saves and replay
meaning stay game-owned. Reusing or refining the current primitives remains an
alternative if the new candidates do not improve the intended display size.

## Original six-scene proposal, retained planning history

1. **Packed SVG:** one native SVG generation request for a 3-column, 2-row sheet
   at 1440 × 672. Each 480 × 336 cell has the same 10:7 artwork aspect ratio as
   the current 160 × 112 window. Columns are the three subjects; rows are base
   and upgrade. Use the same ink/steel/copper palette, lighting and card-window
   margins. Ask for separable vector groups and distinct upgrade gestures.
2. **Judge the packing:** inspect each cell, extraction boundaries, contour,
   style, editability and compact-size detail. Preserve the original full sheet
   and all extracted trials. A larger shared canvas is an experiment, not proof
   of cheaper or better art. If the layout is tangled or weak, stop and show the
   failure before proposing another paid request.
3. **Reference-guided GIF:** if the sheet is useful, rasterize the Metallicize
   scene as the reference for one native GIF edit. Test a restrained plating and
   settling motion across 12 frames, a clean loop, stable camera/palette and a
   useful still. This is one motion study, not six animated runtime assets.
4. **Review:** compare the six static candidates in current card frames at
   160 × 112, 80 × 56 and actual phone-hand size. Review the GIF separately.
   Agreement to generate is not acceptance of the resulting artwork.

The proposed round contains at most **one SVG and one GIF request**, without
automatic retries or rerolls. Report actual usage, elapsed time, rejected cells
and cost per accepted illustration. The earlier three independent SVG requests
cost about $0.25; that is a comparison point, not a price guarantee for this round.

Proposed models are `gpt-image-2.6-sunburst` and its SVG author `gpt-6.1-sol`,
using medium rendering quality and low SVG-author reasoning. The GIF starts at
12 frames and 200 ms per frame; use a valid model-selected size if necessary.
These are proposed settings, not a record of a request already sent.

## Shared-reference constraint

The [official Image 2.6 guide](https://developers.openai.com/api/docs/guides/image-generation)
supports native SVG through the image generation endpoint, but the image edit
endpoint does not support SVG output. GIF edits can use still reference images.
Therefore the first trial uses a shared SVG sheet for consistency, then a raster
render of that output to guide the GIF. Do not claim a direct reference-image SVG
edit workflow that has not been supported and tested.

## Preservation and later methodology

The user requested preservation of intermediate artwork and prompts on November
6, 2026. Keep the existing trials and all new reference boards, full sheets,
extractions, candidate variants, GIF originals, inspected frame/still outputs,
prompt drafts, exact sent prompts, model/settings, usage, request identifiers,
failures and review notes. Do not delete them at acceptance or rejection under a
routine closeout rule; retain them for future-session reference until the user
revisits this hold. This applies to artwork/prompt lineage, not every routine log.

The accepted trial is consolidated in the existing Card Workshop art skill's
batch reference, including its brief scaffold, reference strategy, extraction,
cost/quality trade-off and selective promotion. Future batches refine that
method; this result does not establish that packing suits every subject or that
the GIF met its requested formation action.
