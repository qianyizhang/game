# Spire act scene review

Issue [#34](https://github.com/qianyizhang/game/issues/34) reworks the three `160 × 112` map introductions. The baseline is main `8918f475831f55dd1016779f4ee24550c7c2013d`. The comparison exports both revisions through the same SVG catalogue; the map captures replay `tests/fixtures/spire-win.json` to the first map state of each act at desktop 1440 px and phone 390 px.

| View                                                  | Before                      | Proposed                     |
| ----------------------------------------------------- | --------------------------- | ---------------------------- |
| Act II in the map header, same desktop crop           | [Before](before-scene.webp) | [Proposed](after-scene.webp) |
| Acts I–III, left to right; enlarged above native size | [Before](before-zoom.webp)  | [Proposed](after-zoom.webp)  |

Act I is a broken gate and traversable approach; the unequal stone faces and fallen blocks give the entrance weight. Act II is a stacked city with a visible street, lit windows and contrasting roof/wall planes. Act III is a fractured celestial height with a central spire, offset fragments and a lower void. The map enlarges each scene to 240 px while keeping the route controls and labels below it.

The current export contains 644 SVG entries; the comparison reports only `spire/acts/1`, `spire/acts/2` and `spire/acts/3` changed. Independent visual review and final technical gates are pending. These images are review evidence for repository artwork, not a Site publication.
