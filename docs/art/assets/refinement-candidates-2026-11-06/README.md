# Optional asset refinements · November 6, 2026

Candidate-only study against main `5e26f4aace8c151a15122f6a62195b81b9a39c7e`.
No runtime artwork, rules, catalogue, save or replay behavior changes. The user
chooses what to use later; author review is not user acceptance.

The [offline review](index.html) compares current exports or text-only baselines
with alternatives at enlarged and compact sizes. Each family retains its exact
prompt, request settings, exact native SVG original as `api-original.svg.gz` plus a whitespace-clean review sheet, response usage, extracted
cells and lineage. The study follows the [card-art batch workflow](../../../../skills/card-art/references/batch-assets.md),
[reuse-first gate](../../README.md#asset-admission-reuse-improve-then-expand) and
existing artwork/prompt preservation hold. Nothing supersedes the user's prior
Spire defense selection or the merged Scrapyard suite.

## Admission and ownership

| Family              | Existing source and need                                                                                                              | Reuse comparison and maintenance boundary                                                                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hearth wolves       | `CreatureIllustrations.tsx` Wolf and `MinionArt.tsx`: stray, leader and wolf share the same profile with coat/collar/branch changes.  | Retain current as valid. Three gestures test role identity beyond palette/accessories. Candidate geometry stays here; future selection should adapt only useful parts into the owning Wolf renderer. No Golden study or duplicate small-unit batch.     |
| Spire swords        | `ui/art/ironclad.tsx` and `primitives.tsx`: Cleave, Heavy Blade and Iron Wave share Blade; upgrades currently reuse subject geometry. | Existing Blade remains useful. Six cells test separate actions and base/upgrade contours. Future selective adaptation can share blade/material structure; do not maintain an API parser or automatically install the sheet.                             |
| Cartographer relics | `domain/content.ts`, `ExpeditionChoice.tsx` and `CartographerApp.tsx`: six relics have names/effects only.                            | Existing shared symbols and Spire objects cover some generic tools but do not give all six named objects clear identity. One coherent six-object sheet tests that gap. Proposed 64/32/24px; current UI has no art slot. Preserve names/effects in HTML. |
| Emberwake backpack  | `packages/diablo2/src/ui/CharacterPanels.tsx`: weapon/armor/charm are three category glyphs.                                          | Reusing the glyphs is still valid. Three compact contours test clearer material identities without per-item duplication. Current font 23px, rows 46px desktop/35px phone; rarity/names/equip behavior remain HTML.                                      |
| Blindside materials | `ui/art/consumables.tsx`: mult/glass/steel are already recognizable.                                                                  | Lower priority: test lantern glass/metal, mirror rim/reflection and anvil thickness while preserving cream/forest/ochre print language. Keep current unless a user-selected material improvement warrants adaptation. No planet or Joker duplication.   |

Presentation owns any later selected adaptation. The added cost is one packed
source per family, separable review cells, provenance and a small number of unique
review states; there is no dependency or runtime/API maintenance burden. The
benefit must be judged from matched native output before adoption. All existing
sources and consumers remain preserved. Original and rejected attempts remain
historical studies, never parallel active runtime assets.

## Budget and verification

The task has an aggregate **US$39 ceiling**, separate from the preceding Scrapyard
suite's US$0.174851 estimate. The approximately US$40 balance and tomorrow's expiry
are user reported; neither was independently verified. [Ledger](spend-ledger.json)
records sequential reservations, actual returned usage and estimates, not billing.
No hidden retry, redirect, parallel request or delegated spend is permitted.
An uncertain execution/usage retains its full reservation and stops spending.

Reservations use one medium reference under one megapixel and a conservative
maximum-author-context allowance. **US$4.25 per request** corrects the preceding
suite's US$4.20 rounding: its own formula totals US$4.209744. No claim of an
endpoint-enforced dollar cap is made. Settings and observed costs remain separate.
Rates were checked in the current [official pricing](https://developers.openai.com/api/docs/pricing),
[image guide](https://developers.openai.com/api/docs/guides/image-generation) and
[Terra model specification](https://developers.openai.com/api/docs/models/gpt-6.1-terra).

The current image generation endpoint returns actual static SVG XML through
`output_format: svg`, not a raster wrapper. Image rendering and SVG authoring
have separate usage and both count toward estimates. Standard rates per million:
image text input $5, image input $8, image output $30; Terra input $1/output $5.
No Fast mode or caching was requested. Reasoning tokens already belong to output.

Technical checks cover XML/resource safety, exact expected groups, source-cell
lineage, vector counts, intrinsic dimensions and Chromium content bounds excluding
backgrounds. Visual evidence compares each card at 320/160/80/48px and each symbol
at 64/32/24/23px. Those are authored review surfaces, not a claim of runtime
integration or gameplay acceptance. Collection sizes were also measured in the
current application at desktop and 390px phone widths. Actual hand/warband and
future integrated interaction acceptance remain separate.

The repository documentation/evidence gates apply. Application suites and native
Blender checks are outside this candidate-only slice; no gameplay change is made.

## Results and review decision

| Request                       | Generated cells | Estimated USD | Author disposition                                                                      |
| ----------------------------- | --------------: | ------------: | --------------------------------------------------------------------------------------- |
| Hearth wolves                 |               3 |      0.068145 | Three alternatives; Caller top margin needs attention at later adaptation.              |
| Spire swords                  |               6 |      0.066912 | Four alternatives; two Heavy Blade attempts held for unsupported/crowded wrists.        |
| Cartographer relics           |               6 |      0.054224 | Six alternatives; lens ferrule has low contrast at compact size.                        |
| Emberwake backpack            |               3 |      0.053753 | Three category alternatives readable at 23px.                                           |
| Heavy Blade targeted revision |               2 |      0.039643 | Both held: continuous arm improves, but blade loses heavy-weapon mass. No more rerolls. |
| Blindside materials           |               3 |      0.048370 | Three alternatives; resting anvil hammer changes the current striking gesture.          |
| Total                         |          **23** |  **0.331047** | **19 reviewable alternatives, four on hold, zero user accepted.**                       |

Six sequential HTTP 200 calls, no automatic retries or unresolved outcomes.
The unused amount under the task ceiling is **US$38.668953** before estimate
contingency, not an account balance or a promise that credits remain available.
The ledger reserves US$0; a 10% contingency on actual estimates gives US$0.364152
and US$38.635848 remaining under the task ceiling. Spending stopped because
additional rerolls lack a strong enough benefit, not because the ceiling was met.

The Spire scope update arrived before its first paid request. Strike/Cleave/Pommel
Strike was only an **unsent prompt draft**, preserved as
`spire-swords/prompt-draft-strike-pommel.md`. The actual request uses
**Cleave, Heavy Blade and Iron Wave**, base plus upgrade, matching their current
consumers. No paid duplicate was generated or cancelled. The separate Heavy Blade
repair explicitly targets the two visible construction failures; it is not a
second unreviewed whole-family batch.

The static review embeds every comparison so images survive moving the HTML
alone. Individual SVG/prompt/usage links need the full directory. Expanded phone
context panels show matched current and candidate-only mockups for Pack Caller
and Iron Wave. These are ephemeral browser DOM substitutions in the real collection
card layout, with the original names, effects and stats, not runtime installations.
[UI measurements](ui-sizes.json) record 1360px/390px collection viewports:
Hearth art about 184×129 / 149×104px; Spire about 139×97 / 141×99px.
Actual hand/warband gameplay acceptance remains pending any selection.

[Review manifest](review-manifest.json) records unique per-candidate states and
notes. [Provenance](provenance.json) pins inspected sources, source sheets and
current exports. Existing issues were read and no exact candidate scope was
found; no issue was duplicated, rewritten or closed. Existing art, including
accepted defense, prior small-unit proposals, Night Passage and Scrapyard, stays
intact.

## Delivery checks

[Source checks](source-qa.json) validate six exact group layouts and 29 new SVG
files (six sheets plus 23 candidates), with no raster image, script, visible text,
external resource or document entity. [Content bounds](technical-qa.json) exclude
backgrounds and cover every candidate in Chromium. Technical success does not
remove the four recorded visual holds. Some safe margins are tighter than the
prompt requested; no content crosses its cell or intrinsic viewBox.

[Browser review](review-browser-qa.json) decodes all index images at desktop and
390px phone widths, including expanded context panels, and checks horizontal
fit. The index has zero authored JavaScript; Vite is only a local viewing harness.
The browser's `file:` navigation policy blocked the first inspection attempt;
inspection succeeded through the already-authorized local HTTP server. No policy
or browser guard was changed. [Context record](context-qa.json) distinguishes
mockup frames from current game output.

[PNG verification](png-optimization.json) records lossless IDAT recompression,
original/result byte counts and hashes, unchanged dimensions, decoded RGBA/alpha
and color-profile interpretation. Non-IDAT chunks are retained byte-for-byte;
Sharp and independent Chromium sRGB decoding compare before/after. Unique states,
names, exact compressed API SVG originals and all prompt/settings/usage lineage remain preserved.

The selected repository gate is `npm run format:maintenance`: candidate sources
and review evidence only, no application implementation changes. SVG export of
all 709 current assets succeeded for baseline comparison. New sheets/cells were
separately rendered and inspected. No full application/simulation, geometry,
Blender or integrated game/browser suite is claimed for this slice. Publishing
this branch or opening a PR still needs specific authorization; no push, merge,
deployment or runtime migration was performed.

The raw API XML contained trailing spaces on blank lines. Exact original bytes
are preserved in each family’s `api-original.svg.gz`; decompression hashes are
recorded in provenance and extraction records. Only trailing whitespace was
removed from display sheets/cells so `git diff --check` can pass.
[Whitespace proof](svg-whitespace-qa.json) confirms identical decoded RGBA for all
29 review SVGs, with no geometry, paint, dimensions or title changes. Original
pre-clean extraction copies also remain in the durable temporary bundle.

Lossless PNG storage is **1,451,566 → 1,351,279 bytes**, saving **100,287 bytes
(6.91%)** across 12 selected captures. The original before-byte versions remain
in the durable task bundle; the repository retains the optimized files and proof.
