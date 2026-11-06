# Spire · Image 2.6 replacement trial

Three user-selected SVG replacement candidates, generated November 6, 2026. These are review candidates, not active game art or accepted upgrades. The current base and upgrade renderers remain unchanged.

## Need, reuse and ownership

Metallicize, Ghostly Armor and Sentinel share the Helmet primitive as their dominant subject in `src/games/spire/ui/art/ironclad.tsx`. The existing source-backed cabinet exposed this repetition. The user selected these three for a bounded replacement trial. The purpose is to test whether materially different focal silhouettes improve identity at 160 × 112 and 80 × 56, while matching the existing ink palette.

Reuse and adaptation remain valid alternatives. The generated artwork is compared directly with both current base and upgraded exports in the per-game cabinet. A trial is not admission as a runtime asset. Do not promote a candidate without matched review, a decision about the upgraded illustration, and actual in-game review. No rules, card effects, labels, content IDs, saves or replay versions change.

The art catalogue owns review integration; each SVG is its only generated vector source. There are no new dependencies or generated raster masters. Three review files add about 30 KiB of SVG source. Keep these candidates through the user decision; after acceptance or rejection, retain the decision and accepted source, and retire superseded trial files with their catalogue references. Reassess by November 20, 2026 if undecided.

## Request and provenance

- Endpoint: `POST https://api.openai.com/v1/images/generations`.
- Image model: `gpt-image-2.6-sunburst`.
- SVG author: `gpt-6.1-sol`, reasoning effort `low`.
- Parameters: `n=1`, `output_format=svg`, `size=1280x896`, `quality=medium`, `complexity=high`.
- One successful request per candidate, no automatic retry. Original SVG bytes are preserved.
- Existing API key reused with explicit user authorization; no credentials are stored here.
- Execution used the existing native image request helper, with prompt, size and output directory changed in memory. The trial started from repository revision `4374e8f`.

| Candidate     | Request ID                             | Seconds | Image text input / image output tokens | SVG author input / output tokens | Estimated USD |
| ------------- | -------------------------------------- | ------: | -------------------------------------: | -------------------------------: | ------------: |
| Metallicize   | `req_3485f4cfbedf484198ca06d53d984c8f` |   88.92 |                            372 / 1,060 |                    1,958 / 3,624 |     $0.073816 |
| Ghostly Armor | `req_4ebb20afe59c48eeb39a25a0ee6fcfd9` |  113.97 |                            378 / 1,060 |                    1,964 / 5,229 |     $0.089908 |
| Sentinel      | `req_a51a7130d34743f291a615969d54cff9` |  122.85 |                            383 / 1,060 |                    1,969 / 5,296 |     $0.090613 |

Estimated total: **$0.254337**, using the [standard pricing](https://developers.openai.com/api/docs/pricing): Image 2.6 text input $5/M and image output $30/M; SVG author input $2/M and output $10/M. Author output includes reasoning tokens; those are not added twice. This is a usage-based estimate, not a billing statement.

## Technical and visual review

All three parse as SVG XML with a 1280 × 896 viewBox. Metallicize contains 63 paths (7,730 bytes); Ghostly Armor 65 paths (10,980 bytes); Sentinel 92 paths (10,870 bytes). None contains raster image, script, foreignObject, text, style, animation, event-handler attributes, external references or document entities. Local references resolve to their defined IDs.

The per-game offline gallery browser journey passed alongside the current SVG
cabinet and historical feedback-gallery journeys (3/3). All 689 current SVGs
decode; the three candidate SVGs decode separately. Comparisons show the current
base, current upgrade and generated candidate at 160 × 112 and 80 × 56, with
equal-sized enlarged views available on demand. Desktop and 390 px phone views
were inspected.

Author visual findings:

- **Metallicize:** the diagonal plated arm is distinct from the helmet. Its small
  seams become dense at compact size; simplification may help.
- **Ghostly Armor:** the hollow neckline and open breastplate give it a distinct
  subject. The shoulder and arm-guard edges remain busy at compact size.
- **Sentinel:** the braced body and tall shield separate it from the other two.
  Some body detail merges into the shield at compact size.

These are useful trial directions, not final aesthetic or user approval. The
generated background and framing differ from the current exported scenes; fitting
a selected illustration into the existing game frame remains necessary. No
candidate has been installed into the actual game, and no improved player
recognition or enjoyment is claimed. Distinct upgraded compositions remain open.

## Exact prompts

### Metallicize

Create one original finished native SVG illustration for the artwork window of a fantasy card game. Editable vector paths and simple shapes only. Landscape aspect ratio exactly 10:7, viewBox 0 0 1280 896. Fill the whole rectangular canvas with a dark muted green/slate background; keep the subject within generous margins. Match a restrained engraved print: connected angular and curved planes, three broad value groups, sparse form-following engraving, strong silhouette readable at 160 by 112 pixels and 80 by 56 pixels. Palette: dark ink #172928, shadow #4c5b55, steel #a9b4aa, warm ivory highlights #dfd0b0, restrained copper #b97c5e, spectral teal #80a69c. Avoid glossy plastic, photorealism, bright gradients, tiny clutter, generic repeated emblems. Artwork only: no card border, no frame, no text, no numbers, no labels, no watermark. Keep vector construction economical with meaningful groups. No embedded raster images, scripts, external resources, or fonts. Metallicize: show a single bent gauntleted forearm transforming into overlapping forged steel plates. The broad forearm cuts diagonally upward through the scene; newly fitted metal plates lock together with selective warm copper seams. Show hardening and accumulated protection through connected material planes. The focal silhouette must be the plated arm, not a detached helmet, shield icon, gear, or generic warrior portrait.

### Ghostly Armor

Create one original finished native SVG illustration for the artwork window of a fantasy card game. Editable vector paths and simple shapes only. Landscape aspect ratio exactly 10:7, viewBox 0 0 1280 896. Fill the whole rectangular canvas with a dark muted green/slate background; keep the subject within generous margins. Match a restrained engraved print: connected angular and curved planes, three broad value groups, sparse form-following engraving, strong silhouette readable at 160 by 112 pixels and 80 by 56 pixels. Palette: dark ink #172928, shadow #4c5b55, steel #a9b4aa, warm ivory highlights #dfd0b0, restrained copper #b97c5e, spectral teal #80a69c. Avoid glossy plastic, photorealism, bright gradients, tiny clutter, generic repeated emblems. Artwork only: no card border, no frame, no text, no numbers, no labels, no watermark. Keep vector construction economical with meaningful groups. No embedded raster images, scripts, external resources, or fonts. Ghostly Armor: show an EMPTY spectral breastplate with connected pauldrons and tapered arm guards floating in a calm diagonal sweep. A visibly hollow neckline and open lower hem establish absence of a body. Teal ribbons of vapor pass through gaps between the armor planes and dissolve at the lower edges. The chest and hollow negative space dominate the silhouette; no head, helmet, skull, living face, or detached shield icon.

### Sentinel

Create one original finished native SVG illustration for the artwork window of a fantasy card game. Editable vector paths and simple shapes only. Landscape aspect ratio exactly 10:7, viewBox 0 0 1280 896. Fill the whole rectangular canvas with a dark muted green/slate background; keep the subject within generous margins. Match a restrained engraved print: connected angular and curved planes, three broad value groups, sparse form-following engraving, strong silhouette readable at 160 by 112 pixels and 80 by 56 pixels. Palette: dark ink #172928, shadow #4c5b55, steel #a9b4aa, warm ivory highlights #dfd0b0, restrained copper #b97c5e, spectral teal #80a69c. Avoid glossy plastic, photorealism, bright gradients, tiny clutter, generic repeated emblems. Artwork only: no card border, no frame, no text, no numbers, no labels, no watermark. Keep vector construction economical with meaningful groups. No embedded raster images, scripts, external resources, or fonts. Sentinel: show a compact armored watchman in a low, planted guarding stance behind a tall asymmetrical worn shield. The figure and shield form one connected readable silhouette; one bent knee and one braced rear foot convey weight. A small copper energy core is visible through a gap at the shield edge, held in reserve rather than exploding. The shield, grounded body, and energy reserve must read differently from a floating armor suit or a detached helmet.
