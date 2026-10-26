# Last Hearth shield feedback · study 03

**Problem:** after Clockwork Pup absorbs a hit, its Shield keyword disappears while its
Health stays at 1. The attack caption does not name that loss. The new cue puts a split
shield and **Shield broken** on the affected card, adds that phrase to its accessible name,
and announces side, minion and slot in the existing polite combat caption.

## Matched review and boundary

[Before](before-unit.webp) · [After](after-unit.webp)

Baseline: main `ecb33e6`. Both captures use seed `SHIELD-FEEDBACK-1`, the same validated
practice setup (`pup`, `cobalt`) and accepted fight command. Event 2/7 shows Clockwork Pup
attacking Copper Beetle: the Pup remains at 1 Health while the rival loses Health.
The 1440 × 1080 game viewport and 127 px unit capture width match. The card grows from
204 to 224 px. The full panel grows by 61 px on desktop and 58 px on the 390 px phone
in this fixture. Complete combat captures are retained separately.
WebP encoding is lossless; decoded pixels equal the source screenshots.
The practice save and complete combat result are byte-identical before and after.

The UI compares the same unit ID on the same side in adjacent recorded frames. It never
recalculates damage or infers events from captions. Initial frames, health damage, absent
units and a new Reborn instance do not establish shield loss. A later recorded shield
regain resets the comparison. Backward seeking uses the chronological predecessor.
Rules, content, frame schema, playback clock, saves/replays, policies and retention are unchanged.

## Sources, provenance and budgets

- [ShieldBreakArt.tsx](../../../../src/games/battlegrounds/ui/ShieldBreakArt.tsx): original
  asymmetric split-shield contour, ochre surfaces, pale edge and forest-brown ink. It follows
  Last Hearth's existing palette. Catalogue ID: `hearth/feedback/shield-break`.
- [ShieldBreakCue.tsx](../../../../src/games/battlegrounds/ui/ShieldBreakCue.tsx) and
  [ShieldFeedback.css](../../../../src/games/battlegrounds/ui/ShieldFeedback.css): the same
  symbol/text component is used by the game and gallery. Display sizes: 22 px desktop,
  18 px phone; a 64 px specimen supports shape review.
- [shieldFeedback.ts](../../../../src/games/battlegrounds/ui/shieldFeedback.ts): read-only
  comparison of the current and preceding snapshots. The caption retains its original text.
- No external artwork, fonts, paid generation, purchases or new dependencies. The repository
  has no explicit redistribution license; this review grants none.

| Resource              | Budget                                                                            |
| --------------------- | --------------------------------------------------------------------------------- |
| New symbol            | One 64 × 64 SVG, ≤ 2 KiB standalone; measured 563 bytes                           |
| CSS                   | ≤ 2 KiB; measured 1,120 bytes. Finite 180 ms emphasis; reduced motion disables it |
| Matched unit captures | ≤ 16 KiB combined; measured 6,130 + 7,536 = 13,666 bytes                          |
| Runtime               | No new request, timer, animation loop, SVG filter or frame mutation               |
| Independent gallery   | Existing ≤ 600 KiB HTML limit and zero JavaScript                                 |

These are delivery budgets, not low-end frame-rate measurements. Reserved keyword space
keeps the cue readable but makes combat cards taller. Human clarity and enjoyment remain untested.

## Verification and failure lessons

Three snapshot tests cover simultaneous losses, duplicate definitions, reordered slots,
side identity, health damage, removals, rebirth and shield regain. The browser journey uses
the actual practice controls, checks the broken shield separately from rival Health damage,
then exercises pause/seek, speed, keyboard inspection, playback, reduced motion and phone
overflow. It checks unchanged normal/practice saves and resumes the saved practice after reload.
Aggregate gates, the complete SVG export comparison and hosted CI are reported in the draft PR.

- **Resume deliberately.** The first browser test incorrectly expected reload to reopen
  practice. The existing app returns to the normal run. The corrected journey uses
  **Resume last practice**; persistence semantics were preserved. The failure trace remains retained.
- **Do not infer damage.** A shield disappearing establishes lost protection, not an amount
  of blocked damage. Removed or replaced units are not safe matches.
- **Keep the gallery bounded.** Full combat images total 74,238 bytes before embedding.
  Matched unit captures show the local change within budget; complete desktop and phone views
  were also inspected. No screenshot content was retouched.

## Additive gallery handoff

This branch starts from main and contains no unmerged PR19 implementation. Its generated
gallery contains Spire and Hearth. **Do not replace a combined published gallery wholesale.**
To retain the separate Blindside review, add only these Hearth inputs to that gallery:

1. [HearthShieldReview.tsx](../../../../src/asset-gallery/HearthShieldReview.tsx), the cue/art
   components above, `ShieldFeedback.css`, and the `.shield-*` gallery CSS rules.
2. The two unit WebPs, supplied through its `evidence` prop; insert this independent section
   alongside existing comparisons. Its IDs are `review-hearth-shield` and `asset-hearth-shield`.
3. Prepend the `2026-10-26-hearth-shield` entry from
   [CHANGELOG.json](../../../../src/asset-gallery/CHANGELOG.json), preserving all prior entries.
4. Keep the 600 KiB budget, image decoding, independent expansion, phone and no-script checks.

Build this branch's review with `npm run assets:gallery -- <fresh-directory>`. Parent owns
private publication and reconciliation with PR19. No Site or access setting changed here.

Raw captures, the baseline export, failed browser trace and synthetic practice save remain
under `test-results/hearth-shield-2026-10-26/` for active review. Revisit retention when the
draft is reviewed, or by 2026-11-25; preserve only evidence still needed for retained claims.
