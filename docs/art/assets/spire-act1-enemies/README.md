# Spire Act I enemy silhouettes · draft review

[Issue #42](https://github.com/qianyizhang/game/issues/42) identifies six early enemies whose repeated portrait templates obscure their distinct roles in the main combat stage. Baseline: main `3dfba6aeadefe0dcbdc1a7b80bf847822d40196e`. Source: `src/games/spire/ui/ActOneEnemyArt.tsx`, dispatched only for Jaw Worm, Red/Green Louse, Lagavulin, Sentry and Gremlin Nob. All other enemy portraits keep their existing renderer.

| Matched view                      | Before                                | Proposal                           |
| --------------------------------- | ------------------------------------- | ---------------------------------- |
| Common trio in combat, 1440 × 900 | [Baseline](before-common-1440.webp)   | [Proposal](after-common-1440.webp) |
| Common trio, 390 × 844            | [Baseline](before-common-390.webp)    | [Proposal](after-common-390.webp)  |
| Elite trio in combat, 1440 × 900  | [Baseline](before-elites-1440.webp)   | [Proposal](after-elites-1440.webp) |
| Elite trio, 390 × 844             | [Baseline](before-elites-390.webp)    | [Proposal](after-elites-390.webp)  |
| Common figures, 150 px            | [Side-by-side](sheet-common-150.webp) | —                                  |
| Common figures, 300 px            | [Side-by-side](sheet-common-300.webp) | —                                  |
| Elite figures, 150 px             | [Side-by-side](sheet-elites-150.webp) | —                                  |
| Elite figures, 300 px             | [Side-by-side](sheet-elites-300.webp) | —                                  |

The Jaw Worm now coils into a forward bite, while Red and Green Louse share shell anatomy but differ in stance and front material. Lagavulin rests low under overlapping stone armor; Sentry stands on three supports with a beam aperture; Gremlin Nob has a planted lunge and raised club. This is author self-review. The poses and broad planes are readable at the 150 px combat size; the 300 px sheets show their construction. Independent visual review remains open.

The [context receipt](context-receipt.json) records four fresh matched Practice Lab scenarios using one seed and identical setup per revision. Enemy target names, combat text and synthetic save SHA-256 match at both widths; there are no page errors or document-width overflow. The published WebPs decode to the exact pixels of the browser captures. The [export receipt](export-receipt.json) records 644 existing catalogue SVGs unchanged; these combat figures are inline presentation art outside that catalogue.

No rules, enemy definitions, intents, card text, target hit areas, game commands, save/replay format, new requests or motion were changed. Required exact-head checks and independent review remain to be recorded. No Site publication.
