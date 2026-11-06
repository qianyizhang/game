# WIP · Hearth small units, normal and Golden

Proposed, agreed and generated November 6, 2026. One request produced twelve
normal/Golden candidate illustrations. Artwork acceptance and runtime promotion
are pending. The live game art remains unchanged.

## Generated result

- Image model: `gpt-image-2.6-sunburst`; SVG author: `gpt-6.1-sol`, low reasoning.
- Endpoint: `POST /v1/images/generations`; `n=1`, medium quality, high complexity,
  `output_format=svg`, `size=1920x1008`. No retries or rerolls.
- Request ID: `req_3ccfe6689dec4823a802b38b59809b84`; elapsed time **226.04 s**.
- Image stage: 1,564 text input and 1,014 image output tokens. SVG author: 4,113
  input and 11,354 output tokens; the 34 reasoning tokens are already included.
- Estimated cost: **$0.160006 total; $0.013334 per generated cell**. Uses
  [standard pricing](https://developers.openai.com/api/docs/pricing): Image 2.6
  text input $5/M and image output $30/M; author input $2/M and output $10/M.
  This is a usage estimate, not a billing statement. Cost per accepted asset is
  unresolved while selection is pending.

The original [sheet](sheet.svg), [prompt](svg-prompt.md),
[request](svg-request.json), and [response metadata](svg-response.json) are
retained. The SVG is 25,164 bytes with 202 paths and all twelve requested group
IDs/positions. XML/resource checks found no embedded raster, script, visible
text, style, animation, external reference or document entity. Extraction removes
only each cell's grid translation and wraps its group in a standalone 480 × 336
SVG. Original returned bytes remain unchanged.

Source checkpoint: `09be75e`, with this batch on `codex/hearth-packed-small-units`.
The previously authorized key was reused without credential changes. The helper,
original responses, extraction/rendering review outputs and full-resolution PNG
remain in `.artifacts/hearth-small-units-2026-11-06/` under the preservation hold.

## Author review before acceptance

**User review, November 6:** quality is mixed; the Squire and bear/Cub are below
the bar. Keep their current art. The initial self-review was too generous about
the Cub's anatomy. Pose differences and small-size decoding did not establish
living-subject quality. The user suggested individual generation or greater
effort for living creatures. The batch skill now records this as a pilot/tuning
decision; no further API call is authorized by that feedback.

The [labeled comparison](comparison.webp) shows current normal, new normal,
current Golden and new Golden at 160 × 112 and 80 × 56. The separate
[small-board comparison](board-size-review.webp) uses 64 × 45 to probe compact
phone-board readability. Current images retain the game frame; generated images
are art-only sources, so this is explicitly a subject/pose comparison before
frame integration. The gallery embeds these sources and shows each current/
candidate pair. A grayscale sheet is retained in the local review bundle.

| Pair          | Finding                                                                                                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hearth Squire | Below the bar in user review. The guard/raised-shield distinction is visible, but anatomy and limb construction are blocky. Keep current art.                                                                                                    |
| Clockwork Pup | Crouched sniffing versus raised forepaw separates clearly at all sampled sizes. Connected body, joints and paws make the mechanical identity clear.                                                                                              |
| Coal Imp      | Crouched coal versus raised offering changes the gesture. At 64 × 45 the coal and face are small; the existing close portrait retains stronger facial definition. Review its green/charcoal treatment against the demon family before promotion. |
| Kindle Spark  | Compact curl versus lifted flame is clear, including grayscale. The existing normal flame is already strong and remains a valid choice; the Golden candidate supplies a useful new gesture.                                                      |
| Briar Cub     | Below the bar in user review. Shoulder-to-leg transitions and the raised paw are stiff; the angular body does not establish convincing weight. Keep current art.                                                                                 |
| Coal Wisp     | Sideways curl versus rising split-tail sweep is strong at compact size. Its cool flowing contour separates it from the warm pointed Spark despite their similar face motif.                                                                      |

The stronger remaining directions are Pup and the Golden Spark/Wisp gestures.
Keep existing normal art where it wins on board readability. No cell is marked
accepted or installed. Actual recruitment/combat-frame review remains necessary
when selecting/adapting cells for runtime; this batch does not change rules,
stats, shop odds, combat timing, save or replay semantics.

## Need and reuse

Propose six existing, frequently repeated units: Hearth Squire, Clockwork Pup,
Coal Imp, Kindle Spark, Cub and Wisp. Their normal and Golden exports currently
share the same subject geometry; the Golden cue comes from the palette/backdrop
and frame accents in `src/games/battlegrounds/ui/MinionArt.tsx`. The WIP gallery
displays both current versions. No asset is claimed missing.

| Unit          | Normal direction                                            | Golden distinction                                         |
| ------------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| Hearth Squire | A connected arm visibly supports a compact shield.          | A higher bracing pose and angled broad shield.             |
| Clockwork Pup | A low, compact mechanical pup with connected head and paws. | A forward spring, raised forepaw and fitted copper chest.  |
| Coal Imp      | A small crouched imp holding one coal.                      | A higher planted stance, coal held outward in two hands.   |
| Kindle Spark  | One compact flame body with a quiet inner opening.          | A lifted sweeping flame gesture and broader opening.       |
| Cub           | A crouched young bear with one clear leading paw.           | An alert raised-paw gesture with a wider shoulder contour. |
| Wisp          | A single curled spirit around one dark hollow.              | A rising split-tail sweep around the same hollow identity. |

Existing primitives and normal artwork remain valid alternatives. Replace only
cells that improve the intended board/card size; existing strong normal scenes
may be retained if the packed version is weaker. The goal is six distinct Golden
gestures and a consistent simple family, not twelve mandatory replacements.

## Agreed request, completed

One native SVG sheet: **12 scenes in a 4-column × 3-row layout, 1920 × 1008**.
Each cell is 480 × 336. Each row contains two normal/Golden pairs, side by side.
Shared reference: Hearth forest ink, cream planes and restrained warm accents;
species colors remain recognizable, with gold secondary to gesture. Use a
neutral lighting setup and the current 160 × 112 card-window ratio.

The limit was **one SVG request**, without automatic retry or reroll; that request
is complete. All twelve cells were checked for separation and style before
extraction. The actual usage/cost above includes the whole output, compared with
the first batch's $0.16/nine-scene baseline. That baseline is not a matched-quality
guarantee.

Review at 160 × 112, 80 × 56 and actual recruitment/combat board/phone sizes.
Golden identity must survive without relying on hue or border. Check anatomy,
connected limbs and quiet silhouettes, and keep names/stats in HTML. This batch
would migrate only the same twelve existing export IDs through `MinionArt.tsx`;
it changes no minion definitions, tier, stats, shop odds or combat semantics.
The Hearth presentation owner maintains any selected JSX adaptations. Retain
the master, prompts, request/usage records, all cells and rejected intermediates
under the [current preservation hold](../../README.md#image-26-batch-workflow).

## Later motion direction

Keep these small repeated units still. A separately proposed boss transformation
or spell VFX is a better GIF use. For example, Spire's Slime Boss split could be
judged against the existing boss/child identities and exact split cue, with a
defined anticipation/action/hold and reduced-motion still. It is outside this
one-request proposal and needs its own WIP brief and agreement.

## Original follow-up proposal, later expanded

One single-subject **Briar Cub normal** SVG request at 1280 × 896, high image
quality and higher SVG-author reasoning than this batch's low setting (proposed
medium effort, subject to the author's supported controls). Keep the existing
cub identity, but establish a continuous muzzle/neck/shoulder, planted supporting
paws and an organic weight-bearing crouch before surface detail. Judge against
both the current portrait and this rejected packed Cub at 160 × 112 and 64 × 45.

At most one request, no automatic retry. Stop for review before generating Golden
or moving on to Squire. This changes space, prompt and effort together to seek a
better result; it would not isolate which setting caused any improvement.
The [official generation reference](https://developers.openai.com/api/reference/resources/images/methods/generate)
separates image complexity/quality from SVG-author reasoning; higher complexity
alone is not a higher author-effort setting. The user later authorized this single plus a MAX-effort repeat of the original
batch. The [comparison record](../hearth-effort-comparison/README.md) preserves
the returned single Cub and the MAX transport failure. The twelve-scene
originals and exact prompts remain intact.
