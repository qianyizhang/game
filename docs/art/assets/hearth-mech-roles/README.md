# Last Hearth mech roles · draft review

[Issue #36](https://github.com/qianyizhang/game/issues/36) proposes distinct silhouettes for four core mech recruits. Baseline: main `73a24f5c98e77c365c909bbeac9f37347ef845c7`. The portrait source is `src/games/battlegrounds/ui/MinionArt.tsx`; card dimensions, content and rules are unchanged.

| Matched view                                  | Before                           | Proposed                        |
| --------------------------------------------- | -------------------------------- | ------------------------------- |
| Mech-filtered collection, 1440 × 900          | [Baseline](before-desktop.webp)  | [Proposal](after-desktop.webp)  |
| Same filter, 390 × 844                        | [Baseline](before-phone.webp)    | [Proposal](after-phone.webp)    |
| Sunsteel Colossus full card                   | [Baseline](before-colossus.webp) | [Proposal](after-colossus.webp) |
| Harvester / Cobalt at enlarged and 160 × 112  | [Comparison](normal-1.webp)      | —                               |
| Sentinel / Colossus at enlarged and 160 × 112 | [Comparison](normal-2.webp)      | —                               |
| Corresponding Golden exports                  | [First pair](golden-1.webp)      | [Second pair](golden-2.webp)    |

Harvester now leans toward an articulated rake with a rear hopper. Cobalt places a broad shield ahead of a smaller guard. Sentinel is upright on splayed supports, and Colossus carries a wide, heavy body beneath a small crowned head. The four keep the established forged-metal palette and shared card frame; their profiles and visible tasks now differ at native size. This is author self-review, with independent visual review still pending.

The [export receipt](export-receipt.json) records all 644 SVGs decoded, 636 unchanged and only the four named IDs plus their Golden counterparts changed. The [context receipt](context-receipt.json) records identical card text, no page errors, and no horizontal overflow at either viewport. Matched screenshots were captured in fresh browser contexts with the same collection filter and scroll position over the normal Vite HTTP app; the committed WebPs preserve their source screenshot pixels losslessly.

This draft has not yet established actual tavern/warband context or selected-state acceptance. Required code/browser checks and independent final review remain to be recorded at the final head. No rules, seeds, save/replay files, new requests, motion, 3D geometry or Site publication were changed.
