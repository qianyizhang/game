# Feature artwork coverage

The feature expansion adds **73 SVG exports**, bringing the catalogue to **596** with the current content registries. Renderers are shared by the game and standalone exporter; the [source map](card-art.md) and [art skill](../skills/card-art/SKILL.md) govern future additions.

| Feature                                           |                             Assets | In-game placement                                                                                       |
| ------------------------------------------------- | ---------------------------------: | ------------------------------------------------------------------------------------------------------- |
| Hearth heroes, including Recall and Fortification |      5 portraits + 5 power symbols | Hero selection, active power, eight-seat lobby, rival inspector                                         |
| Mixed Rivals and historical scouting              |          1 arena scene + 5 symbols | Inspector, disclosed recruitment styles, scouting heading; observed minions reuse existing creature art |
| Practice, content packs, playtesting evidence     |                           3 scenes | Workshop panel introductions, with full-width descriptions on phones                                    |
| Ironclad, Silent, Ascensions 0–5                  | 2 portraits + 1 progression symbol | Character selection, combat, resolution playback, difficulty selector                                   |
| Spire items                                       |              33 relics + 8 potions | Collection, relic rack, potion belt, rewards, boss relic choices, shop                                  |
| Three-act route                                   |      3 act scenes + 7 room symbols | Act heading, route nodes and legend, campfire, treasure and event rooms                                 |
| **Added**                                         |                             **73** | **Presentation only**                                                                                   |

Existing Blindside shop/card expansions, Hearth minions and golden variants, Spire abilities and upgrades, and challenge plates keep their established assets. Enemy portraits retain the legacy renderer; this expansion covers the feature surfaces above, not a redraw of every encounter.

## Integration boundaries

- HTML retains names, effects, costs, counts, keywords and control labels. Inline SVGs are decorative and non-focusable. Standalone exports receive accessible titles from the catalogue.
- Scouting renders the same previously seen board or eliminated-warband snapshot as its text. Artwork does not inspect a rival's hidden current board.
- Rival symbols follow the existing style-label disclosure. The inspector retains its explicit disclosure notice.
- Content registries supply export IDs. New relics or potions need entries in `WorldItemArt.tsx`; its `data-art-fallback` marker lets collection coverage catch omissions. Custom unknown IDs remain renderable.
- No content, rules, seeds, replay versions, persistence or agent policies change.

## Acceptance evidence

The baseline at `test-results/feature-art-before` contains 523 exports. The current export at `test-results/feature-art-current` contains 596. `test-results/feature-art-regression/review.json` records **73 additions, zero removals, zero changed existing assets, and 523 identical pixel hashes** under its recorded Sharp renderer. This is a regression check, not an aesthetic score.

The art was inspected enlarged and at small sizes, then in the actual desktop and phone UI. Review sheets and screenshots remain under ignored `test-results/feature-art-*` and `test-results/feature-art/browser/`. Browser coverage uses the repository's disposable-profile harness; the export cabinet was not browser-tested in this session.

Run `npm run check`, export with `npm run assets:export -- test-results/art-current`, and use the relevant browser files listed in the source map. The manifest remains the authority for current counts as content grows.
