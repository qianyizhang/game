# SVG assets: source map and tools

The [aesthetic rulebook](art-direction.md) defines composition, anatomy, materials, variants and visual acceptance across SVG and 3D. The [Card Workshop art skill](../../skills/card-art/SKILL.md) routes the workflow. This page covers source locations and tooling. Artwork is presentation only; definitions and game rules remain authoritative.

## Source map

Paths below are relative to the repository root. Extend the existing renderer for a content ID; the export catalogue renders those same components.

| Asset family                           | Entry point / reusable sources                                                                                                                           | Reference to study                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Shared scenes                          | `src/shared/art/CardArt.tsx` · `ArtScene`, `ART_PALETTES`, `ArtGlyph`                                                                                    | Fixed 160 × 112 scenes; seven palettes and four backdrops                              |
| Blindside cards, Jokers, tools, bosses | `src/games/balatro/ui/Artwork.tsx` · `ExpansionArtwork.tsx`, `NightMarketArtwork.tsx`                                                                    | `nightjar`: coherent bird profile, perch, restrained moon and engraving                |
| Shop assets                            | `src/games/balatro/ui/ShopArt.tsx` · `MarketPrimitives.tsx`                                                                                              | Shared coins, tickets, stars and printing inks                                         |
| Spire abilities                        | `src/games/spire/ui/AbilityArt.tsx` · `SilentArt.tsx`, `SilentUpgradeArt.tsx`, `SilentPrimitives.tsx`                                                    | `catalyst` base/upgrade: a recognizably related but distinct alchemy scene             |
| Hearth creatures                       | `src/games/battlegrounds/ui/MinionArt.tsx` · `CreatureIllustrations.tsx`, `FiendIllustrations.tsx`, `ExpansionPortraits.tsx`, `NightMarketPortraits.tsx` | `Phoenix`: curved pinions, chest and trailing plumage; `Hydra`: separate neck gestures |
| Challenges                             | `src/shared/art/ChallengeArt.tsx` · `src/app/ChallengeArtwork.tsx`, `src/app/challenge-art.css`                                                          | Three 360 × 192 plates and 64 × 64 symbols; illustrated status keeps its HTML label    |
| Standalone export                      | `packages/workshop-tools/art/catalogue.tsx` · `export.ts`                                                                                                | Content registry → live renderer → self-contained SVG + manifest                       |

Feature artwork extends the source map:

| Asset family              | Entry point                                              | Composition / display size                                                                                      |
| ------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Hearth spells             | `src/games/battlegrounds/ui/TavernSpellArt.tsx`          | Eight 160 × 112 material subjects; spell cards retain cost, tier and effect labels                              |
| Hearth heroes and powers  | `src/games/battlegrounds/ui/HeroArt.tsx`                 | Five 160 × 112 portraits and five 64 × 64 power symbols; portraits also appear in the lobby and rival inspector |
| Spire characters          | `src/games/spire/ui/CharacterArt.tsx` via `Portrait.tsx` | Ironclad and Silent at 180 × 180; curved cloth, overlapping armor, diagonal weapons                             |
| Spire relics and potions  | `src/games/spire/ui/WorldItemArt.tsx`                    | Distinct 64 × 64 objects, readable at 24 px in the rack and belt; unknown mod IDs use a marked fallback         |
| Spire route and acts      | `src/games/spire/ui/SpireSceneArt.tsx`                   | Seven 64 × 64 room symbols and three 160 × 112 act scenes                                                       |
| Workshop and rival styles | `src/shared/art/WorkshopArt.tsx`                         | Four 160 × 112 tool scenes and six 64 × 64 symbols; `rivalArt.ts` maps styles to symbols in presentation        |
| Feature placement         | `src/shared/art/FeatureArt.css`                          | Scoped desktop/phone sizing; symbols remain decorative beside HTML labels                                       |

`ArtGlyph` uses a local 100 × 100 coordinate system; `x`, `y` and `size` position it. Reuse game primitives before adding another shared abstraction. Keep gameplay text in HTML. The [card expansion](../research/content-expansions.md#card-suite-expansion), [Night Market](../research/content-expansions.md#night-market), and [feature artwork coverage](history/feature-coverage.md) document their sets.

## Integration boundaries

- HTML retains names, effects, costs, counts, keywords and control labels. Inline SVGs are decorative and non-focusable; standalone exports receive accessible titles from the catalogue.
- Scouting artwork depicts the same previously observed board or eliminated-warband snapshot as its text. It does not inspect a rival's hidden current board.
- Rival symbols follow the existing style-label disclosure; the inspector retains its disclosure notice.
- Content registries supply export IDs. New relics and potions need entries in `WorldItemArt.tsx`; its `data-art-fallback` marker exposes omissions while keeping unknown mod IDs renderable.
- Artwork changes do not change authoritative content, rules, seeds, replay versions, persistence or agent policies.

## Scaffold and export

```sh
npm run assets:scaffold -- CopperKestrelArt src/games/battlegrounds/ui/CopperKestrelArt.tsx card
npm run assets:export -- test-results/art-current
```

The scaffold accepts `card`, `plate` or `symbol`. It creates a formatted TSX component with backdrop, silhouette, depth and accent groups, calculates its shared-scene import, and refuses to overwrite a file. Draw the empty layers before integrating it. It changes no renderer, registry, stylesheet or rules automatically.

All three commands resolve relative paths from the repository, even when called from another working directory. Export output must be a new directory; the default is `test-results/card-art-<UUID>/`. The old script paths remain checked compatibility entry points.

The exporter produces `manifest.json`, an offline `index.html` cabinet, and one `.svg` per entry. The manifest is the current count and ID authority; tokens, statuses and curses have no upgrade export. SVGs contain intrinsic dimensions, accessible labels and resolved palette colors. Export to separate directories for before/after review. Generated exports and reviews normally belong under ignored `test-results/`.

## Repeatable review

Before changing approved assets, export a baseline. After editing, export the current version and select IDs to inspect:

The helper needs an **existing Sharp module**. It looks in local Node dependencies; otherwise add `--sharp-module /absolute/path/to/sharp` to the review command below. In Codex desktop, locate the bundled package through `load_workspace_dependencies`. It installs nothing, launches no browser and fetches no assets. If no rasterizer is available, report that limitation and use an already permitted visual-review surface.

```sh
npm run assets:export -- test-results/art-before
# Edit the source artwork, then:
npm run assets:export -- test-results/art-current
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
