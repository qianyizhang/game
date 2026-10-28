# Spire act scene review

Issue [#34](https://github.com/qianyizhang/game/issues/34) reworks the three `160 × 112` map introductions. The baseline is main `8918f475831f55dd1016779f4ee24550c7c2013d`. The comparison exports both revisions through the same SVG catalogue; the map captures replay `tests/fixtures/spire-win.json` to the first map state of each act at desktop 1440 px and phone 390 px.

| View                                                  | Before                             | Proposed                            |
| ----------------------------------------------------- | ---------------------------------- | ----------------------------------- |
| Act II in the map header, same desktop crop           | [Before](before-scene.webp)        | [Proposed](after-scene.webp)        |
| Acts I–III, left to right; enlarged above native size | [Before](before-zoom.webp)         | [Proposed](after-zoom.webp)         |
| Acts I–III, desktop map panels and reachable routes   | [Before](before-desktop-maps.webp) | [Proposed](after-desktop-maps.webp) |
| Acts I–III, 390 px map panels and reachable routes    | [Before](before-phone-maps.webp)   | [Proposed](after-phone-maps.webp)   |

Act I is a broken gate and traversable approach; the unequal stone faces and fallen blocks give the entrance weight. Act II is a stacked city with a visible street, lit windows and contrasting roof/wall planes. Act III is a fractured celestial height with a central spire, offset fragments and a lower void. The map keeps its original 176 px scene display size and panel layout.

The [export receipt](export-receipt.json) hashes every SVG and reports 644 exports with only `spire/acts/1`, `spire/acts/2` and `spire/acts/3` changed. The [map layout receipt](map-layout-receipt.json) records matching baseline/proposal state and panel dimensions at both viewports; all five initially reachable route buttons are visible and hit-testable in each act, and one phone route click per act advances to row 0. This is a first-map-state check, not a claim about every later room.

Independent review accepted the proposed artwork pixels at the initial draft head. Final review of the matched map context and exact-head checks is pending. These images are repository review evidence, not a Site publication.
