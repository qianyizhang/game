# Blindside score feedback · study 02

**Problem:** scoring playback replaces the table with an unlabeled equation and source
text. The illustration disappears just when its effect resolves. The new view keeps the
recorded source and effect together, reuses familiar card/Joker artwork, and marks each
changed running value with both an outline and the word **Updated**. Cash-only effects
remain visible. A 180 ms emphasis follows the existing frame lifecycle; reduced motion
keeps the same static information.

## Matched review

[Before](before-score.webp) · [After](after-score.webp)

Both captures use main baseline `ecb33e6`, seed `SCORE-FEEDBACK-1`, a validated practice
setup and the same accepted hand: Event 8/10, Spark, +4 mult, 112 Chips and 8 Mult.
The game viewport is 1440 × 1080; complete panel crops retain their true dimensions.
The new desktop panel adds 46 px of height. The 390 px phone view was inspected separately.
Decoded WebP pixels equal the original PNG captures; no artwork was retouched.
The accepted-command save and complete score result are byte-identical before and after.

This is author visual review and automated gameplay interaction, not human playtesting.
Whether the added emphasis improves comprehension or enjoyment remains open.

## Sources, naming and budgets

- Reusable component: [ScoreFeedback.tsx](../../../../src/games/balatro/ui/ScoreFeedback.tsx)
  and [ScoreFeedback.css](../../../../src/games/balatro/ui/ScoreFeedback.css).
- Review ID: `blindside/feedback/score-step`. This is an HTML/SVG composition, not a new
  standalone SVG catalogue entry. Existing card and Joker source artwork is unchanged.
- Portraits reuse [cards.tsx](../../../../src/games/balatro/ui/art/cards.tsx) and
  [jokers.tsx](../../../../src/games/balatro/ui/art/jokers.tsx). No outside assets, fonts,
  purchases or paid generation. The repository has no explicit redistribution license;
  this review grants none.

| Resource            | Budget                                    | Measured                                          |
| ------------------- | ----------------------------------------- | ------------------------------------------------- |
| Feedback source     | ≤ 4 KiB TSX + ≤ 4 KiB CSS                 | 2,421 + 2,684 bytes                               |
| Matched captures    | ≤ 40 KiB combined, lossless               | 11,356 + 23,456 = 34,812 bytes                    |
| Per-frame display   | At most one reused portrait, three values | No new fetch, timer, animation loop or SVG filter |
| Independent gallery | Existing ≤ 600 KiB HTML, zero JavaScript  | Enforced by the existing exporter                 |

These are delivery budgets, not low-end device frame-rate measurements. No geometry,
native Blender source, rule, content, seed, policy, replay version or retention behavior
changed. The shared playback clock is unchanged.

## Validation and lessons

The focused browser journey plays through the actual practice UI, checks all ten recorded
steps (cards, additive Chips/Mult, a multiplier and cash), seeks backward, pauses, changes
speed, uses keyboard controls, checks reduced motion and phone overflow, skips/reopens
playback, and verifies unchanged practice and normal saves. A focused render test covers
blocked and unfamiliar source labels without an invented portrait or positive change.
Current aggregate and hosted gate results are recorded in the draft PR.

- **Do not guess an instance.** `ScoreStep` provides names and values, not actor IDs.
  Illustrations match recognized printed labels; duplicate owned Jokers are not identified.
  Unknown and enhancement labels retain their exact text without a guessed picture.
- **Keep money visible.** A cash-only effect changes neither Chips nor Mult; the third value
  prevents a successful effect from appearing inert.
- **Judge the space cost.** The desktop panel is taller. Player review should decide whether
  faster recognition earns that space, especially on phones.

The independent gallery retains the Spire study and older dated changelog entries. Its new
comparison embeds only the two public-safe panel captures and the live feedback component.
Build with `npm run assets:gallery -- <fresh-directory>`; parent publication remains separate.

Raw captures, the two corrected baseline-selector failures, logs and the matched synthetic
replay remain under `test-results/blindside-score-2026-10-26/` for this active review.
Revisit retention when the PR is reviewed, or by 2026-11-25; keep only evidence still needed
for a retained claim.

## Next review and next candidate

Ask players to name the source and changed value in counterbalanced before/after views,
then play one hand. Record misreads, missed cash effects and phone scrolling; do not equate
screenshots with enjoyment. Exact owned-instance highlighting needs a separate trace
identity design and remains proposed.

The next bounded asset candidate is **Last Hearth shield-break feedback**: distinguish a
lost shield from health damage using existing immutable combat frames, then review one
contact cue at board and phone sizes before considering a 3D pose refinement. The
[roadmap](../../asset-enrichment.md#inventory-and-prioritized-opportunities) keeps the wider
game-specific opportunities visible.
