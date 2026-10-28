# Last Hearth human crew · issue 44 review

[Issue #44](https://github.com/qianyizhang/game/issues/44) asks five human recruits to read as different board roles. The source is [MinionArt.tsx](../../../../src/games/battlegrounds/ui/MinionArt.tsx). Baseline main is `3dfba6aeadefe0dcbdc1a7b80bf847822d40196e`; the candidate art commit is `f757731`. That baseline includes the accepted mech portraits from PR #39. No content, rules, CSS, controls, save format or replay code changed.

| Role             | Action and identifying contour                                    |
| ---------------- | ----------------------------------------------------------------- |
| Hearth Squire    | Compact guard braced behind a shield; shield is the leading mass. |
| Banner Bearer    | Planted standard and wind-pulled cloth oppose a forward step.     |
| Hearth Captain   | Wide command gesture, raised blade and red sash.                  |
| Menagerie Keeper | Bent handler with a small companion balanced on a gloved arm.     |
| Echo Baron       | Tall court cloak, hollow eye staff and lifted spectral hand.      |

These are static SVG drawings within the existing 160 × 112 frame and the existing Golden palette and corner cues. No external images, fonts, animations, filters or requests were added. The neutral crew uses muted cloth, metal and skin planes with selective highlights. At board size the five leading contours separate; the captain's raised sword overlaps his cap slightly, but the arm gesture and sash remain readable. This is author self-review. Independent visual review remains open.

## Matched evidence

The five columns below are **Squire, Banner, Captain, Keeper, Baron**; the first row is main and the second row is the candidate. The same order and camera apply at both sizes and for Golden variants.

| Export                     | Comparison                           |
| -------------------------- | ------------------------------------ |
| Normal, native 160 × 112   | [Before / after](normal-native.webp) |
| Normal, enlarged 320 × 224 | [Before / after](normal-zoom.webp)   |
| Golden, native 160 × 112   | [Before / after](golden-native.webp) |

The UI screenshots are paired captures from fresh browser contexts at each revision and viewport. The collection uses the neutral filter. The tavern and warband use the same validated Practice Lab setup and seed; the captain is selected. Phone warband and tavern rows scroll horizontally, so their right ends were captured separately.

| View                                    | Main                                   | Candidate                            |
| --------------------------------------- | -------------------------------------- | ------------------------------------ |
| Collection · 1440 px                    | [Before](before-1440-collection.webp)  | [After](after-1440-collection.webp)  |
| Tavern · 1440 px                        | [Before](before-1440-tavern.webp)      | [After](after-1440-tavern.webp)      |
| Five-card warband · 1440 px             | [Before](before-1440-warband.webp)     | [After](after-1440-warband.webp)     |
| Collection · 390 px                     | [Before](before-390-collection.webp)   | [After](after-390-collection.webp)   |
| Tavern, right end · 390 px              | [Before](before-390-tavern-end.webp)   | [After](after-390-tavern-end.webp)   |
| Warband, left end · 390 px              | [Before](before-390-warband.webp)      | [After](after-390-warband.webp)      |
| Warband, right end · 390 px             | [Before](before-390-warband-end.webp)  | [After](after-390-warband-end.webp)  |
| Actual Golden Baron hand · 1440 px      | [Before](before-1440-golden-hand.webp) | [After](after-1440-golden-hand.webp) |
| Selected Golden Baron on board · 390 px | [Before](before-390-golden-board.webp) | [After](after-390-golden-board.webp) |

The [export receipt](export-receipt.json) records SHA-256 hashes for the ten changed SVGs and eight unchanged accepted mech exports. Both revisions exported and decoded 644 SVGs; 634 were unchanged in the pixel comparison. The [context receipt](context-receipt.json) records the matched seeds, commands, card text, accessible names, selection and save hashes. The normal five-card practice save hash matches across revisions and viewports; the Golden Baron save hash also matches. No page errors or document overflow appeared at 390 px. The phone card buttons remain full card-width touch targets. Captures are lossless WebP from Chromium 154 through Playwright 1.64.0; no screenshot pixels were retouched.

These captures verify the proposal in the delivered UI. They do not substitute for the repository's Chrome browser suite or independent visual acceptance. Exact-head CI and browser gate results are recorded with the review handoff.
