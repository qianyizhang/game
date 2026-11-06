# SVG assets: source map and tools

The [aesthetic rulebook](art-direction.md) defines composition, anatomy, materials, variants and visual acceptance across SVG and 3D. The [Card Workshop art skill](../../skills/card-art/SKILL.md) routes the workflow. This page covers source locations and tooling. Artwork is presentation only; definitions and game rules remain authoritative.

## Source map

Paths below are relative to the repository root. Extend the existing renderer for a content ID; the export catalogue renders those same components.

| Asset family                           | Entry point / reusable sources                                                                                                                             | Reference to study                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Shared scenes                          | `src/shared/art/CardArt.tsx` · `ArtScene`, `ART_PALETTES`, `ArtGlyph`                                                                                      | Fixed 160 × 112 scenes; seven palettes and four backdrops                              |
| Blindside cards, Jokers, tools, bosses | `src/games/balatro/ui/Artwork.tsx` exposes `art/{cards,jokers,consumables,bosses,primitives}.tsx` · `ExpansionArtwork.tsx`, `NightMarketArtwork.tsx`       | `nightjar`: coherent bird profile, perch, restrained moon and engraving                |
| Shop assets                            | `src/games/balatro/ui/ShopArt.tsx` · `MarketPrimitives.tsx`                                                                                                | Shared coins, tickets, stars and printing inks                                         |
| Spire abilities                        | `src/games/spire/ui/AbilityArt.tsx` composes `art/ironclad.tsx` and `art/primitives.tsx` · `SilentArt.tsx`, `SilentUpgradeArt.tsx`, `SilentPrimitives.tsx` | `catalyst` base/upgrade: a recognizably related but distinct alchemy scene             |
| Hearth creatures                       | `src/games/battlegrounds/ui/MinionArt.tsx` · `CreatureIllustrations.tsx`, `FiendIllustrations.tsx`, `ExpansionPortraits.tsx`, `NightMarketPortraits.tsx`   | `Phoenix`: curved pinions, chest and trailing plumage; `Hydra`: separate neck gestures |
| Challenges                             | `src/shared/art/ChallengeArt.tsx` · `src/app/ChallengeArtwork.tsx`, `src/app/challenge-art.css`                                                            | Three 360 × 192 plates and 64 × 64 symbols; illustrated status keeps its HTML label    |
| Game introductions                     | `src/app/guide/GameGuideArt.tsx`                                                                                                                           | Six 360 × 192 engraved plates; explanatory text and Play links remain HTML             |
| Standalone export                      | `packages/workshop-tools/art/gallery/catalogue.tsx` · `export.ts`                                                                                          | Content registry → live renderer → self-contained SVG + manifest                       |

Feature artwork extends the source map:

| Asset family              | Entry point                                              | Composition / display size                                                                                      |
| ------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Hearth spells             | `src/games/battlegrounds/ui/TavernSpellArt.tsx`          | Eight 160 × 112 material subjects; spell cards retain cost, tier and effect labels                              |
| Hearth heroes and powers  | `src/games/battlegrounds/ui/HeroArt.tsx`                 | Five 160 × 112 portraits and five 64 × 64 power symbols; portraits also appear in the lobby and rival inspector |
| Spire characters          | `src/games/spire/ui/CharacterArt.tsx` via `Portrait.tsx` | Ironclad and Silent at 180 × 180; curved cloth, overlapping armor, diagonal weapons                             |
| Spire relics and potions  | `src/games/spire/ui/WorldItemArt.tsx`                    | Distinct 64 × 64 objects, readable at 24 px in the rack and belt; unknown mod IDs use a marked fallback         |
| Spire route and acts      | `src/games/spire/ui/SpireSceneArt.tsx`                   | Seven 64 × 64 room symbols and three 160 × 112 act scenes                                                       |
| Workshop and rival styles | `src/shared/art/WorkshopArt.tsx`                         | Four 160 × 112 tool scenes and six 64 × 64 symbols; `rivalArt.ts` maps styles to symbols in presentation        |
| Night Passage choices     | `src/games/night-passage/ui/Artwork.tsx`                 | 26 patron/duo, rune, weapon and reward symbols; 24–64 px beside HTML labels                                     |
| Feature placement         | `src/shared/art/FeatureArt.css`                          | Scoped desktop/phone sizing; symbols remain decorative beside HTML labels                                       |

Spire's six [intent cues](asset-enrichment.md) live in
`src/games/spire/ui/IntentArt.tsx` and `IntentCue.tsx`. They retain exact rule-owned
action text and export under `spire/intents/`. `npm run assets:gallery -- <fresh-directory>`
builds the unified offline asset gallery, including the dated before/after reports.

Spire's [selected defensive illustrations](assets/spire-defense-batch/README.md)
live in `src/games/spire/ui/art/defense.tsx`: editable JSX adapted from six packed
SVG cells, shared by the current card renderer and export catalogue. The original
sheet, unused cells, earlier independent trials, prompts and before/current
comparisons remain preserved; selected third-row artwork serves existing card
upgrades, without introducing a new game level. The API batch method is in the
[art skill](../../skills/card-art/references/batch-assets.md).

Last Hearth’s [Iron Drake portrait](assets/hearth-iron-drake/README.md) uses the existing
`MetalPortrait` renderer in `src/games/battlegrounds/ui/MinionArt.tsx`. Normal/golden
exports retain their IDs; this SVG study does not change the 3D gallery model.

Last Hearth's [shield-loss feedback](assets/hearth-shield/README.md) uses
`src/games/battlegrounds/ui/ShieldBreakArt.tsx` and `ShieldBreakCue.tsx`.
The 64 × 64 symbol exports as `hearth/feedback/shield-break` and appears at 22/18 px
beside explicit HTML text. `HearthShieldReview.tsx` owns its additive gallery comparison.

Cartographer's [map-cue study](assets/cartographer-map/README.md) uses
`src/games/cartographer/ui/FrontierArt.tsx` and `MapCues.tsx`. The 64 × 64 arrow
exports as `cartographer/feedback/frontier`; occupied frontiers display it at
12–16 px. Existing threat cells receive a static, filled warning triangle.

Cartographer's [inhabitants](assets/cartographer-inhabitants/README.md) share
`src/games/cartographer/ui/InhabitantArt.tsx` between tactical tiles, the life panel
and enemy inspector. Six 64 × 64 subjects export as `cartographer/inhabitants/{kind}`;
phone tiles display them around 35 px. HTML retains names, HP, intentions and selection.

`ArtGlyph` uses a local 100 × 100 coordinate system; `x`, `y` and `size` position it. Reuse game primitives before adding another shared abstraction. Keep gameplay text in HTML. The [card expansion](../research/delivery-history.md#content-expansions), [Night Market](../research/delivery-history.md#content-expansions), and [feature artwork coverage](history/feature-coverage.md) document their sets.

## Integration boundaries

- HTML retains names, effects, costs, counts, keywords and control labels. Inline SVGs are decorative and non-focusable; standalone exports receive accessible titles from the catalogue.
- Scouting artwork depicts the same previously observed board or eliminated-warband snapshot as its text. It does not inspect a rival's hidden current board.
- Rival symbols follow the existing style-label disclosure; the inspector retains its disclosure notice.
- Content registries supply export IDs. New relics and potions need entries in `WorldItemArt.tsx`; its `data-art-fallback` marker exposes omissions while keeping unknown mod IDs renderable.
- Artwork changes do not change authoritative content, rules, seeds, replay versions, persistence or agent policies.

## Scaffold and export

```sh
npm run assets:scaffold -- CopperKestrelArt src/games/battlegrounds/ui/CopperKestrelArt.tsx card
npm run assets:gallery -- test-results/art-current
```

The scaffold accepts `card`, `plate` or `symbol`. It creates a formatted TSX component with backdrop, silhouette, depth and accent groups, calculates its shared-scene import, and refuses to overwrite a file. Draw the empty layers before integrating it. It changes no renderer, registry, stylesheet or rules automatically.

The commands resolve relative paths from the repository, even when called from another working directory. Export output must be a new directory; the default is `test-results/asset-gallery-<UUID>/`. Root npm commands invoke the owning implementations directly.

The exporter produces `manifest.json`, an offline `index.html` cabinet, and one `.svg` per entry. The manifest is the current count and ID authority; tokens, statuses and curses have no upgrade export. SVGs contain intrinsic dimensions, accessible labels and resolved palette colors. Export to separate directories for before/after review. Generated exports and reviews normally belong under ignored `test-results/`.

Current gallery pages embed their image previews, including candidate comparisons
and retained upgrade captures. They can display those images when a preview host
receives only the HTML and cannot load neighbouring files. The separate SVG files,
manifest and review records remain in the export for source access; keep the full
directory when opening those files or moving between game pages. View controls
update the current document's fragment without navigating an isolated preview to
its host's base URL. Browser coverage tests both the full export and an isolated,
sandboxed HTML document with sibling-file requests unavailable.

The cabinet also writes one page per game: `blindside.html`, `spire.html`,
`hearth.html`, `cartographer.html`, `emberwake.html`, `night-passage.html`, and
`scrapyard.html`, plus `shared.html`. Each page has **Current assets**, **Recent
upgrades**, and **WIP** views. `wip.html` opens directly on the proposed batches.
Links to the former `#candidates` view still open WIP. Spire combat portraits enter the same SVG
manifest. Canvas games use fixed specimens from their current presentation
renderers; Cartographer room samples reuse its current CSS. The scope statement
on each page names coverage limits. No session, save, background clock, polling,
or API request runs while browsing.

Generated WIP batches can display a packed original, extracted regular/upgrade/
future-tier scenes and a GIF play-effect study. Previews remain embedded in each
HTML file. Effects start only from their play control, return to the retained
still after one play, and use the still when reduced motion is enabled. These
review controls do not install artwork or effects into any game. The batch
record retains exact requests, prompts, response usage and quality limitations.

`packages/workshop-tools/art/gallery/library.ts` owns curated upgrade records,
WIP batch proposals and candidate metadata. WIP shows the proposed scope and
current/earlier-trial comparisons before any new generation. A batch proposal
does not authorize API calls; follow the [batch workflow and preservation hold](README.md#image-26-batch-workflow).
The renderer/content catalogue still owns current SVG identity and artwork.
The same export writes retained feedback-study comparisons under `reviews/`, linked
from **Recent upgrades**. Their dated history records review transitions rather than
the current game's full upgrade inventory. Each historical report remains at most
600 KiB with zero JavaScript; current gallery pages use scripts for navigation,
filtering and fixed renderer specimens. Opening any page makes no generation request.

The [Image 2.6 Spire trial](assets/spire-image-2.6/README.md) stages three SVG
replacement candidates next to current base and upgrade art. These files are
review sources, not active game artwork. Promotion still requires the reuse-first
admission decision, actual-size and in-game review, and a decision about upgrade
art. The gallery is rebuilt after changes; generated SVGs are not automatically
installed into a game.

For a generated proposal, set its `trial: { file, record }` in `library.ts` to the
candidate SVG and its owning Markdown review record. The exporter copies and links
that record with the candidate; proposals from the same batch share one copied record.
Keep generation inputs, usage and review limits in that owning record rather than
adding another gallery receipt. Proposals without a trial do not imply generation.

## Repeatable review

Before changing approved assets, export a baseline. After editing, export the current version and select IDs to inspect:

The helper needs an **existing Sharp module**. It looks in local Node dependencies; otherwise add `--sharp-module /absolute/path/to/sharp` to the review command below. In Codex desktop, locate the bundled package through `load_workspace_dependencies`. It installs nothing, launches no browser and fetches no assets. If no rasterizer is available, report that limitation and use an already permitted visual-review surface.

```sh
npm run assets:gallery -- test-results/art-before
# Edit the source artwork, then:
npm run assets:gallery -- test-results/art-current
npm run assets:review -- hearth/phoenix hearth/phoenix-golden \
  --from test-results/art-current --before test-results/art-before \
  --out test-results/phoenix-review
```

It decodes **every SVG** in both manifests, compares rendered pixels by stable ID, and writes:

- `sheet-01.png`, etc.: selected subjects enlarged and at native size, with before/after columns. Oversized images are reduced to fit and labelled.
- `review.json`: renderer versions, decoded counts, added/removed/changed IDs, unchanged count and pixel hashes. Without `--before`, the comparison is explicitly absent.

Use a new `--out` directory for each review. Unknown IDs, malformed images, duplicate IDs and existing output directories fail visibly. A changed count includes expected revisions; judge whether those IDs belong to the requested scope. Pixel equality is specific to the recorded renderer, not proof of aesthetic quality or identical output on every platform. Inspect the sheets and the actual UI before accepting work.

## Verification

`npm run check` covers formatting, unit tests and the production build. Choose browser coverage for the surface changed:

| Surface                                             | Browser files under `tests/browser/`            |
| --------------------------------------------------- | ----------------------------------------------- |
| Cards, collections, keyboard selection              | `artwork.spec.ts`                               |
| Export cabinet, standalone SVG decoding             | `art-export.spec.ts`                            |
| Challenge art at phone/tablet/desktop sizes         | `challenge-art.spec.ts`, `challenges.spec.ts`   |
| Heroes, items, workshop tools, character contrast   | `feature-art.spec.ts`                           |
| Tavern spell purchase, casting, hand and collection | `tavern-spells.spec.ts`                         |
| Hero powers, Mixed Rivals, scouting, persistence    | `battlegrounds.spec.ts`, `hearth-arena.spec.ts` |
| Spire rooms, map, shops, characters, practice       | `spire.spec.ts`, `expansion.spec.ts`            |

Follow `AGENTS.md` for approved browser execution on macOS and disposable profiles. Respect any session-specific access restrictions. A blocked browser check is not a failed game assertion; the raster helper supplements UI review, it does not replace it.
