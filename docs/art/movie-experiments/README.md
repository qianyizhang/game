# Movie experiments

Standalone movie trials, their editable deliveries, rendered exports, and known
limitations. Each trial has one home here. The linked records preserve the
original briefs, techniques, review history, and technical results.

| Trial                                      | Retained delivery                                               | Duration   | Outcome                                                                                                                 |
| ------------------------------------------ | --------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| [Haunted Island](haunted-island/README.md) | GIF                                                             | 15 seconds | Simplified pixel-art treatment; depth outlines and finer effects remain incomplete.                                     |
| [Little Haunt](little-haunt/README.md)     | GIF                                                             | 15 seconds | Detailed ghost-hunt diorama; the export is retained without an editable scene.                                          |
| [Lantern Keep](lantern-keep/README.md)     | Offline Three.js HTML and GIF                                   | 15 seconds | Pixel-art ghost hunt with depth outlines and deterministic capture.                                                     |
| [Golden Claw](golden-claw/README.md)       | Offline HTML, character masters, GIF, MP4, and comparison views | 30 seconds | Reference-based 2.5D action animatic with contact-staging improvements; the original 3D cinematic target remains unmet. |

Original deliveries: [#53](https://github.com/qianyizhang/game/pull/53),
[#54](https://github.com/qianyizhang/game/pull/54),
[#55](https://github.com/qianyizhang/game/pull/55), and
[#64](https://github.com/qianyizhang/game/pull/64). Their commits remain in the
collection's Git history.

## Retention and reuse

The three haunted-island treatments share a brief and retain different rendering
and delivery choices for comparison. Golden Claw retains the cutout-animation
approach and the contact-staging lessons documented in its creation journey.
Their value here is as movie experiments with explicit results and limitations.
Combining their designs into one movie would erase those comparative outcomes.

The repository owns this collection and its offline playback checks. The retained
source, exports, masters, and comparison views occupy about 158 MiB. Lantern Keep
retains its embedded Three.js library and MIT license in the HTML.

Continue from the retained source or export for the chosen trial. Keep its
character masters, embedded library licenses, and meaningful comparison views
together. Place new revisions in the same owning trial rather than making a
parallel copy in the game asset catalogue. The [art admission rule](../README.md#asset-admission-reuse-improve-then-expand)
governs later expansion.

Retention of a trial records its outcome; its documented quality gaps remain
open. These records distinguish technical delivery, visual review, and original
brief acceptance. The [art rulebook](../art-direction.md) owns visual standards.

## Verification

Repository formatting, inventory, and link checks cover the records and HTML.
The Golden Claw tool contracts check its offline source, embedded character
masters, and complete GIF timing. Browser journeys load the original Golden
Claw and Lantern Keep HTML bytes, reject network dependencies, and exercise
playback, deterministic seeking, and narrow viewports:

```sh
node --test packages/workshop-tools/art/golden-claw.test.ts
npx playwright test --project=functional tests/browser/golden-claw.spec.ts tests/browser/lantern-keep.spec.ts
```

For changed media exports, decode the complete file and verify dimensions,
frame count, duration, and the intended action beats. Preserve unchanged media
bytes when moving a trial. Source and delivery changes require affected checks
under the [verification contracts](../../engineering/checks.md#gate-selection).
