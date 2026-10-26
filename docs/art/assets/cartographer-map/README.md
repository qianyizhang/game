# Cartographer map cues · study 04

**Problem:** at a 390 px viewport, the hero replaces the arrow on an unexplored
doorway. Its accessible name also loses the doorway direction. The original pale
exclamation is difficult to distinguish on the pale, striped hero tile.

The candidate retains a small directional badge on occupied frontiers and gives
the existing threat marker a filled triangular background. The legend uses that
same warning shape. The initial review was prepared locally; the dated gallery history
retains that stage separately from the subsequent repository review.

## Matched evidence

[Doorway before](before-board.webp) · [Doorway after](after-board.webp) ·
[Threat before](before-threat.webp) · [Threat after](after-threat.webp)

Baseline: main `ee8fb6252d1c1edc8194101cf6d92684d00d3efa`. The visible-control
fixture starts a Relaxed expedition with seed `ink-and-ember`, moves north three
times, explores north, rotates the first offer once, places it at rotation 2,
then braces three times. The Cistern threat is `22,16: Keeper (you); threatened for 2`.
The baseline and candidate accepted-command saves, reconstructed state and threat
labels are byte-identical. The occupied frontier label additionally names its direction.

Board captures are 320 × 321 pixels from the same 390 × 844 viewport. The threat
details are identical 34 × 34 crops from the complete phone panels, at
`[160, 424, 194, 458]`; neither screenshot was retouched. Lossless WebP decoding
matches the source pixels. Complete 1440 × 1080 desktop and phone captures, plus
320 px control checks, remain in `test-results/cartographer-legibility-2026-10-26/`.

## Sources and boundaries

- [FrontierArt.tsx](../../../../src/games/cartographer/ui/FrontierArt.tsx): original
  code-drawn arrow in the game's gold and dark ink. Catalogue ID:
  `cartographer/feedback/frontier`; 64 × 64 viewBox, displayed at 12–16 px.
- [MapCues.tsx](../../../../src/games/cartographer/ui/MapCues.tsx) and
  [MapCues.css](../../../../src/games/cartographer/ui/MapCues.css): decorative,
  non-focusable badges. Existing HTML cell names carry direction and threatened damage.
- No rules, danger sets, grid commands, layout dimensions, click/keyboard handlers,
  save/replay versions, policies, benchmark or retention behavior changed.
- No external artwork, fonts, dependencies, paid generation or purchases. The repository
  has no explicit redistribution license; this review grants none.

| Resource      | Budget and measurement                                               |
| ------------- | -------------------------------------------------------------------- |
| New SVG       | ≤ 1 KiB; 320 bytes standalone                                        |
| Cue CSS       | ≤ 1 KiB; 808 bytes                                                   |
| Four captures | ≤ 8 KiB combined; 7,848 bytes                                        |
| Runtime       | Static markup; no new requests, timers, loops, filters or animations |
| Gallery       | Existing ≤ 600 KiB limit; zero JavaScript or external asset requests |

These are delivery budgets, not low-end frame-rate measurements. Cues remain small
at 320 px. Author visual review and automated browser journeys do not establish
human recognition or enjoyment.

## Verification and lessons

The dedicated browser journey covers all four occupied frontier names, tile-click
and keyboard exploration, exact accepted commands, the threatened hero, reduced
motion, 320 px overflow and unchanged save bytes after desktop resize/reload.
Existing journeys retain complete expedition victory, export/import, unreadable-save
recovery and historical replay slots. The local completion receipt records the
actual results of `npm run check`, the focused browser suite and all SVG exports:
574 application tests, 37 simulations and nine browser journeys passed. All 644 SVGs
decode; the prior 643 are byte-identical. The PR linked from the gallery changelog
records hosted CI on its exact head. Human recognition and enjoyment remain untested.

- **Inspect arrival, not only empty terrain.** The old arrows were legible until
  the hero occupied the tile. The fix keeps occupancy and direction visible together.
- **Give the warning its own background.** Color alone competes with pale terrain
  and striped danger tiles. The existing damage label remains the source of meaning.
- **Retain evidence within the budget.** Four lossless board/tile captures preserve
  the complete older gallery without raising its limit. Full panels remain local.

## Gallery handoff

[CartographerReview.tsx](../../../../src/asset-gallery/CartographerReview.tsx) owns
an independent comparison with IDs `review-cartographer` and `asset-cartographer-map`.
The four WebPs and the cue CSS enter the existing static exporter; no framework was
added. [CHANGELOG.json](../../../../src/asset-gallery/CHANGELOG.json) preserves the initial
local review and every older study. `npm run assets:gallery -- <fresh-directory>`
builds the portable review.

The repository review and independent private gallery deployment are separate steps.
Parent coordinates the Site update; this change does not alter gallery access.

Retain active review evidence through review or 2026-11-25, then reassess under the
existing retention policy; no automatic pruning authority is added.
