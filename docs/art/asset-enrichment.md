# Game asset enrichment · 2026-10-26 pilot

**Study 03:** [Last Hearth shield feedback](assets/hearth-shield/README.md) marks lost
protection on the affected minion and in the existing combat announcement. This branch
starts from main independently of the [Blindside draft](https://github.com/qianyizhang/game/pull/19);
its gallery handoff is additive. Retain that separate review when combining galleries.

The first slice adds six Spire intent symbols, clearer target feedback and an independent
offline review gallery. It aims to make the next decision easier to read. Human playtesting
has not established improved enjoyment. No rules, content, benchmark, policy, save or
retention behavior changes.

## Inventory and prioritized opportunities

Inspection started at `f01f7c4`. The six games share React/Vite presentation conventions,
but own independent rules and timing. The baseline export catalogue contains 636 SVGs;
the pilot adds six. Tracked asset inventory includes 55 GLBs, 63 Blender sources, 366 PNGs
and 43 JPEGs, including historical/reference captures rather than only runtime assets.
Native binaries use Git LFS. These counts describe inventory, not visual acceptance.

| Priority              | Game / existing visual assets                                                                                                   | Opportunity and intended player benefit                                                                                                                                                                | Owning surface / guardrail                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 · implemented pilot | Spire: engraved ability cards, portraits, relic/potion/route SVGs; muted copper, forged metal, cloth                            | Small action silhouettes paired with exact intent text; explicit target marker. Help players scan a threat and aim a card.                                                                             | `ui/Combat.tsx`, `IntentArt.tsx`, `IntentCue.tsx`; `currentIntent` and `intentText` remain authoritative.                                                                                                                          |
| 2 · separate draft    | Blindside: cream/forest/ochre cut-paper cards, Jokers, shops; ordered score trace                                               | Brief 2D emphasis on the card/Joker causing the current score step, plus a restrained multiplier accent. Make a combination's payoff easier to follow.                                                 | `src/games/balatro/ui/BlindsideApp.tsx`, shared `Playback.tsx`; consume immutable score steps, preserve pause/seek and reduced motion.                                                                                             |
| 3 · implemented slice | Last Hearth: creature SVGs, selected native canid combat stage, immutable combat frames                                         | A split-shield cue names lost protection. Rebirth and finishing-hit shapes, then a fitted 3D contact-pose study, remain proposed after player review.                                                  | `ui/CombatPlayer.tsx`, `ShieldBreakCue.tsx`; compare adjacent recorded snapshots by side and unit ID. Preserve rules, frames and the playback clock.                                                                               |
| 4 · proposed          | Cartographer: DOM room grid, symbolic units, marked threat cells                                                                | Small 2D tile kit that separates hazards, water, cover and exits by contour as well as color. Reduce navigation mistakes.                                                                              | `src/games/cartographer/ui/CartographerApp.tsx`; preserve existing cell labels, danger-cell sets and click/keyboard commands.                                                                                                      |
| 5 · proposed          | Night Passage: Canvas fallback and orthographic Three.js; native hero/enemies/guardians/environment kits, pooled patron effects | Review one brute/guardian anticipation silhouette from the real camera; refine a saved Blender pose or raised threat edge only if it improves reaction clarity. Keep safe space visible under effects. | `ui/presentation/scene/{enemies,guardians,ground-effects}.ts`; preserve rules-tick contact, enrage timing, collision geometry, reduced-motion stills and resource disposal. Native edits require saved-source/export/reload proof. |
| 6 · proposed          | Emberwake: Canvas terrain and sprites, finite elemental skill-effect families                                                   | Different 2D impact shapes for physical, fire, cold and poison; bounded decay and a clear kill finish. Help players read hit confirmation in crowded combat.                                           | `packages/diablo2/src/ui/{render,skill-effects,field-runtime}.ts`; reuse accepted casts/damage deltas and simulation time. No new damage or timing rules.                                                                          |

Items marked proposed remain candidates; the separate Blindside draft is linked above. Existing native
art is a reusable starting point, not permission to infer that every pose works in gameplay.

## Pilot contracts and reusable sources

- `IntentArt` composes the existing Workshop glyphs in 64 × 64 SVGs, displayed at 32 px.
  The attack silhouette widens and tilts the shared sword; the other symbols retain the
  existing shield, eye, book, spark and hourglass contours.
- `intentArtKinds` categorizes only the current visible effect list. Mixed moves retain
  every distinct family. Unknown/special effects get a generic cue, never a guessed effect.
  Empty effects get a waiting cue. It does not calculate scores, damage or future actions.
- `IntentCue` is shared by live combat and gallery specimens. Names, damage, hit counts,
  Block and statuses remain HTML from `intentText`. Icons are decorative/non-focusable;
  target controls keep their existing accessible names and gain intent descriptions.
- Target feedback remains temporary UI state. At phone widths, workshop shortcuts occupy
  normal page flow so they cannot cover combat cues. Their controls remain available.
- The independent gallery uses the project's React static renderer and Vite bundler,
  then delivers native HTML disclosures, inline CSS/SVG and two embedded captures.
  It imports no game sessions, saves, policy recordings, medical assets or private traces.
  It makes no network requests and has no client JavaScript or persistent state.

Asset IDs follow `spire/intents/{attack,block,status,card,special,wait}`. The existing
catalogue exports the live renderer, so there is no separate artwork implementation.
Reversal consists of reverting this presentation slice; no save migration is necessary.
Replay versions, RNG, content pins, simulation semantics and summary-only policy retention
defaults remain unchanged. No cleanup command was run against existing evidence.

## Provenance and budgets

[The manifest](assets/spire-intent/manifest.json) records each exported SVG's size and
SHA-256, naming, source, baseline revision and budgets. All compositions derive from
repository-authored vector primitives. No purchases, paid generation, external images
or fonts were used. No explicit repository redistribution license was found; this change
does not invent a CC0 or other license grant. Reuse and review are within the repository.

| Resource              | Budget                                                         | Measured candidate                                                  |
| --------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| Standalone intent SVG | ≤ 2 KiB each, ≤ 12 KiB combined                                | 695–926 bytes each; 4,771 bytes combined                            |
| In-game delivery      | Zero new asset fetches, timers, animation loops or SVG filters | Inline SVG only; existing event/render lifecycle                    |
| Gallery               | ≤ 600 KiB uncompressed HTML; zero JavaScript                   | About 503 KiB with review history; exporter enforces the byte limit |
| Gallery screenshots   | Only the two approved battlefield crops                        | 360,544 bytes in lossless WebP                                      |

The byte budgets bound delivery cost, not frame-rate guarantees. No low-end device FPS
benchmark was performed. No geometry or DCC source changed, so geometry/native authoring
gates do not apply to this slice.

## Matched evidence and failure lessons

[Before](assets/spire-intent/before-battlefield.webp) and
[after](assets/spire-intent/after-battlefield.webp) capture the same seeded encounter,
selected enemy and 1440 × 1080 viewport. Crops retain the true battlefield height; the new
cue/target marker adds vertical space. Raw PNGs, whole-page desktop/390 px phone captures,
logs and initial rejected candidates remain under `test-results/asset-pilot-2026-10-26/`.
Lossless WebP decoded RGBA hashes match the PNGs:

- Before: `fa8f570f3b108ea4705d26df108ba7f57bf876e0e361062f2f66cb99fb6413fb`.
- After: `073d07a6c7038e579c97dbbd1a56c49409a4e86f5234419828b1727d06bdf352`.

Consequential review lessons:

1. The first upright sword read like a narrow pin at 32 px. A broader diagonal silhouette
   improved the author's recognition; the final gallery retains native/enlarged views.
2. Stacking a single icon above the action text added too much height. Single-family
   cues now place icon and text beside each other; mixed families keep all symbols.
3. The initial embedded-PNG gallery exceeded its 600 KiB budget (650,637 bytes; a later
   compact cue still produced 617,122 bytes). Lossless WebP brought it below budget.
   The failed runs and original images remain available; no quality loss was hidden.
4. Phone captures revealed fixed workshop buttons covering gameplay. A narrow-layout
   rule now places them after the game; the browser regression checks for overlap.
5. Symbols cannot replace exact intent text. In particular, an eye does not imply a
   beneficial status, and a spark does not imply a harmless move. Mixed-action and
   accessible-description checks protect that boundary.

## Validation status and remaining review

The focused Chromium suite initially passed all seven journeys: SVG cabinet decoding
(642 assets), standalone gallery independence/keyboard/history/phone layout, and five
Spire gameplay/import/reload/targeting journeys. The phone-shortcut correction has its
own subsequent rerun. Exact seeded save bytes match before and after the visual pilot;
all 636 pre-existing exported SVG files are unchanged.

**Later validation on 2026-10-26:** the [CI follow-up](../engineering/checks.md#gate-selection)
separates independent scenarios and bounds application concurrency without changing
gameplay or deadlines. The default `npm run check` now passes all **570 application
tests and 37 simulations**, plus the maintained gate. CI runs the complete application
selection in two shards and simulations separately. The earlier failed results below
remain historical evidence; this follow-up changes no asset images or gameplay-test status.

The initial maintained gate passed: formatting/inventory, lint, types, Python (19 tests), tools
(99 tests), DCC contracts (80 tests), and production build. The full `npm run check`
application scope recorded **558 passes and 3 failures**, all default 5-second timeouts:
`src/games/battlegrounds/application/arena-versions.test.ts:136`,
`src/shared/policy/rollout.test.ts`, and
`packages/diablo2/src/domain/sandbox.test.ts:17`. The clean baseline at `f01f7c4`, using
the same pins and two workers, reproduced the Hearth timeout; the other eight tests in
those three files passed in isolation. At that point all three files were byte-identical to baseline;
that initial result did not establish a green default gate. No timeout or benchmark contract was
changed. The retained first baseline probe overlapped simulations and is
explicitly excluded from the clean comparison.

`npm run playtest -- --maxWorkers=2` passed **37 tests in 8 files**. A separate diagnostic
of the three timeout files with `--maxWorkers=2 --testTimeout=20000` passed **9/9 tests**.
That relaxed diagnostic does not satisfy the default 5-second gate. The latest gallery
browser rerun passed independently, and all five cross-game smoke journeys passed.
The production build also reports a >500 kB resources chunk; this slice adds no 3D bundle.
Initial setup errors are retained: missing shared `.agents`
skills, unreachable Python mirror, stale JS/Python installs, and unhydrated LFS pointers.
The pinned cloud runtime is Node 24.21.0, npm 11.19.0 and Python 3.12.13. This workspace
has no `nvm` function; existing exact binaries supply the pins. Official PyPI supplied
identical lockfile-hashed packages without changing locks or registry settings.

**Visual review** means author self-review of rendered desktop/phone/comparison views,
not user approval. **Gameplay-tested** remains false. A useful next check is a short
counterbalanced before/after session: identify the next action and target, then play one
encounter. Record misreads, decision hesitation, missed compound effects, phone scrolling
and whether players prefer the experience. Do not infer entertainment from screenshots
or automated runs.

## Build and review the standalone gallery

```sh
npm run assets:gallery -- test-results/my-asset-review
```

The output directory must be fresh. `index.html` is self-contained and opens offline.
`CHANGELOG.json` accompanies it. The canonical
[dated changelog](../../src/asset-gallery/CHANGELOG.json) renders in the visible
**Latest changes** section, newest first, with asset, before/after and PR links. Add new
entries rather than replacing older conclusions. Proposed, technically verified,
visually reviewed and gameplay-tested are separate claims; explicitly state the scope.

The source lives in `src/asset-gallery/` and the generator in
`packages/workshop-tools/art/gallery.ts`. Existing lint/types/inventory/tool check scopes
cover both. Parent publication/review is separate; this task changes no site or access.
