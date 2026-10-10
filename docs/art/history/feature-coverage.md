# Feature artwork coverage

**Historical coverage record:** the baseline exports, regression comparison and review captures described below were retired in the [lean cleanup](../../engineering/history/cleanup-triage.md). Counts describe that recorded run, not a current export inventory. Current artwork source and export commands remain maintained.

The feature expansion added **73 SVG exports**, bringing the catalogue to **596 at delivery**. The subsequent [tavern spells](../../guide/tavern-spells.md) add eight more, for **604 exports at that subsequent delivery**. Renderers are shared by the game and standalone exporter; the [source map](../svg.md) and [art skill](../../../skills/card-art/SKILL.md) govern future additions.

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

Current [SVG integration boundaries](../svg.md#integration-boundaries) own accessibility, observation disclosure and fallback behavior.

## Historical acceptance evidence

The baseline formerly at `test-results/feature-art-before` contained 523 exports. The then-current export formerly at `test-results/feature-art-current` contained 596. The retired `test-results/feature-art-regression/review.json` recorded **73 additions, zero removals, zero changed existing assets, and 523 identical pixel hashes** under its recorded Sharp renderer. This is a regression check, not an aesthetic score.

The art was inspected enlarged and at small sizes, then in the actual desktop and phone UI. Review sheets and screenshots were recorded under ignored `test-results/feature-art-*` and `test-results/feature-art/browser/`. Browser coverage uses the repository's disposable-profile harness; the export cabinet was not browser-tested in this session.

Run `npm run check`, export with `npm run assets:export -- test-results/art-current`, and use the relevant browser files listed in the source map. The manifest remains the authority for current counts as content grows.
