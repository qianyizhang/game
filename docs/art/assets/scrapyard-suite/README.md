# Scrapyard initial SVG suite

Local candidate study, 2026-11-06. Base: `09be75ec235501786e12773c03bc517705f926f1`.
Branch: `codex/scrapyard-svg-suite`. No push, PR, merge or deployment is authorized.

The user approved up to US$5 for the complete initial suite, including revisions,
and requested applicable VFX. One spending worker, sequential requests only.
The four existing scopes are [actors #135](https://github.com/qianyizhang/game/issues/135),
[equipment #132](https://github.com/qianyizhang/game/issues/132),
[combat/VFX #133](https://github.com/qianyizhang/game/issues/133), and
[arena #134](https://github.com/qianyizhang/game/issues/134). Their actual bodies
were inspected before spending; no duplicate issues or active Scrapyard branches/PRs
were found. These remain open until their acceptance evidence is complete.

## Brief and admission

Purpose: distinguish existing roles and choices while preserving tiny cue footprints.
Five actors, six equipment symbols, four combat marks, two bounded VFX overlays,
and three arena materials. No new content, obstacles, tiers or gameplay meaning.
The [batch workflow](../../../../skills/card-art/references/batch-assets.md) and
[accepted Spire trial](../spire-defense-batch/README.md) own the method.

Shared direction: worn steel/cloth cut planes, dark forest ink, three broad values,
upper-left cream light, restrained copper and existing role accents.
Actors have five different contours; equipment has concrete named subjects;
projectiles and pickups remain simple circles/diamonds. Presentation owns selected
sources and caching. HTML owns names, prices, controls and stats.

Reuse comparison at the base revision: `renderer.ts` already batches circles,
diamonds, a grid, a survivor ellipse and dynamic aimed/windup cues efficiently.
Retain its overlay construction and use it as the matched baseline.
`InhabitantArt.tsx` has attractive hooded figures, but their tall staff/limb and
side-facing contours need substantial redrawing for 20px horde roles.
`WorkshopArt.tsx` has general strategy symbols, not the three named guns;
`WorldItemArt.tsx` has fantasy relics and potions, not these work tools.
These remain untouched. New candidates are justified for evaluation, not yet
blanket quality acceptance. Source inspection alone does not justify promotion.
Arena and tiny cues may retain the current primitives if candidate detail hurts
legibility or draw cost. Selected replacement evidence follows visual review.

Target sizes: survivor 26×32, Drifter/Runner 20, Brute 30, Spitter 24;
equipment 38 and 24; light/heavy round 6/14, hostile/pickup 8 logical pixels.
Arena 960×600, 40px tile, boundary outside the existing 12px inset cue.
Phone inspection uses an actual 390px viewport and the game's canvas scaling.

## Requests and budget

Four packed sheets maximum, in priority order actors, equipment, combat/VFX, arena.
At most two targeted revisions, only after concrete defects; no blind rerolls.
Native `output_format=svg`; Image 2.6 Sunburst, medium reference quality, high
layout complexity; Terra SVG author, low reasoning. Terra replaces the study's
Sol author to keep even a conservative full-author-context reservation feasible.
No runtime API dependency or new package is introduced.

[Spend ledger](spend-ledger.json) records reservations before calls, settings,
request IDs, both usage stages, estimates and conservative remaining budget.
Costs are usage-derived estimates, not verified billing. Missing or uncertain
usage retains the entire reservation and stops further generation.
The first 960×640 attempt returned HTTP400 without artwork or usage; the documented
minimum is 655,360 pixels. Its exact request remains in
[invalid-size-request.json](actors/invalid-size-request.json). Corrected sheets
are 1152×768, 384px cells. This parameter correction is not an artwork reroll.
No response headers, raw error bodies or credentials are retained.

Current official references checked November 6:
[image workflow](https://developers.openai.com/api/docs/guides/image-generation),
[API schema](https://developers.openai.com/api/reference/resources/images/methods/generate),
[pricing](https://developers.openai.com/api/docs/pricing), and
[Terra limits](https://developers.openai.com/api/docs/models/gpt-6.1-terra).

## Preservation

Each family retains its exact prompt, request, original packed sheet, sanitized
response metadata, extraction map and all extracted candidates. Rejected cells
remain with their reason. Originals are never overwritten. The user's artwork
and prompt preservation hold applies. Temporary helpers, baseline renderer and
routine logs remain under `.artifacts/scrapyard-suite/` in this cloud checkout.
No Mac files or runtime are used.

## Review and validation

Generation, technical validation, author visual review, runtime integration and
user acceptance are separate outcomes. Results will be recorded here after the
matching checks; pending work must not be represented as passed.

## Local selection and visual findings

All 20 sources have a local presentation adaptation in `ui/art-data.ts`.
`Artwork.tsx` and `sprites.ts` use the same geometry, palette and bounding fit;
the catalogue exports the same component. Original packed sheets and cell SVGs
remain preserved here. The new active source supersedes five primitive actor
bodies, three loadout glyphs, text-only shop illustrations, four material marks
and the flat floor material. Existing aimed barrels, windup rings, weapon ring,
player ring and invulnerability flash remain state-driven. No domain files,
collision geometry, seeded randomness, replay identity or package dependencies
change. The fixed gallery specimen now uses content-owned enemy radii.

The 20 adaptations add 147 simple vector paths/shapes. Actor and mark
sprites rasterize once at the maximum 2× game density; the floor is composed once
into a 1920×1200 cache (about 9.2 MB RGBA, plus small sprite canvases). Gameplay
submits cached images rather than parsing SVG or filling all art paths each frame.
Presentation owns upkeep; no separate directional copies, weapon instances or
API-dependent runtime are maintained. This replaces existing active roles rather
than adding content. Original source masters and unrelated consumers stay intact.

Author self-review:

- The five actors have connected hood/shoulder planes and different contours:
  slumped Drifter, swept Runner, broad Brute, teal vessel Spitter and yellow survivor.
  Broad contours survive 20–30px display; eye/cloth details become negligible on phone.
- Rivet gun, three-barrel scattergun and broad cannon remain distinct at 38px.
  Cartridge, boot and fitted wrench/patch read at 24px. Names, counts, prices,
  purchase and disabled state remain in HTML. Phone shop has no horizontal overflow.
- Cream circles, coral diamond and green clipped chip keep their 6/14/8/8px
  footprints. The chip differs from hostile fire in contour and value as well as hue.
  The 500-enemy phone scene is still densely crowded; this art does not establish
  that tiny individual faces or every overlapping projectile can be resolved there.
- The first full-opacity floor composition was too repetitive in context. Retain
  its source but composite it at 35% over the existing floor; preserve the grid
  and inset boundary. Tile edges match in the 3×3 review; strips/corners occupy
  only the outer 10px margin and agree under rotation in the full arena.
- Hit and collection overlays have open centers, sparse planes and bounded
  footprints. Real production simulation captures record pickup at tick 66 and
  HP loss at tick 184. They introduce no trails or invented weapon events.

The effect tracker compares captured scalar values from the same live World view.
Confirmed combat HP decrease starts one hit cue for 11 ticks (about 183ms);
combat scrap increase starts one collection cue for 10 ticks (about 167ms), 18px
above the survivor. Each kind coalesces; at most two cues coexist. World identity,
wave, phase or backward-tick changes clear cues. Spawn/wave protection, banking,
purchases, import/reset and repeated paused draws do not create cues. Reduced
motion omits both extra overlays and retains the existing invulnerability flash.
No cue changes authoritative state or RNG. Pause freezes presentation lifetime.

[Native size sheet](native-size.png), [actor study](actors/review.png),
[equipment study](equipment/review.png), [combat study](combat/review.png),
[arena study](arena/review.png), [tile repetition](tile-review.png),
[desktop game](game-500-desktop.png), [phone shop](shop-phone.png),
[purchased state](shop-phone-purchased.png), [hit context](player-hit-context.png),
and [collection context](scrap-sparkle-context.png) retain inspected evidence.
Matched before/after scenes for all three populations are the `before-*` and
`after-*` PNG pairs; `visual-qa.json` records identical state counts and HP.
This is author self-review and local adoption for review, not user acceptance.

## Measured generation usage

| Family     | Source cells | Estimated USD |
| ---------- | -----------: | ------------: |
| Actors     |            5 |      0.053817 |
| Equipment  |            6 |      0.048444 |
| Combat/VFX |            6 |      0.037979 |
| Arena      |            3 |      0.034611 |
| Total      |           20 |  **0.174851** |

Four successful sequential requests, no artwork rerolls or paid revisions.
One synchronous invalid-size HTTP400 preceded the actor success; no artwork or
usage was returned and its validation reservation was released. Its cost is
recorded as zero estimated, not independently verified billing. Usage-derived
remaining budget is **US$4.825149**; the ledger keeps **US$4.807664** after a 10%
contingency on measured usage. No generation remains in flight or reserved.
The 20-cell cost is about 0.874 cents per generated/local-selected source. The
user has not yet accepted the artwork, so this is not a cost per user-accepted asset.

Selected technical evidence: `technical-qa.json` validates the 4 sheets and 20
cell sources; `delivery-qa.json` records all 20 adapted exports loading, zero broken
gallery images, a rendered current specimen and real cue transitions.
`phone-shop-qa.json` records the production replay-derived shop and disabled
purchase state at 390px with no horizontal overflow. Chrome came from the official
vendor package `https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb`,
version 157.0.8103.38, package SHA-256
`a62b277dc03da2cff50cc04589deb66f6875be339c066d46adb49b49eedb629d`.
The provisioned Node 24.21.0/npm 11.19.0 and uv Python 3.12.13 pins were used;
`nvm` is absent in this cloud environment.

## Verification results

The full `npm run check` passed after fixing the adapter's zero-origin viewBox
and formatting its generated JSON metadata. This includes formatting/inventory,
tools and application lint, application/workspace types, uv Python checks,
190 tooling tests, 81 DCC contract tests, production build, 589 application tests
across 100 files, 8 Shader Lab CPU tests and all 37 seeded simulations. The DCC
contracts do not establish native Blender execution. Focused Scrapyard coverage
passed all 11 tests, including the two presentation cue cases.

The existing functional Scrapyard journeys passed (2 passed; the separate opt-in
benchmark was intentionally skipped in that run). They cover movement, fire,
pause, shops, replay recovery, populations, failure/restart and narrow layout.
Earlier failed gate attempts are retained in the temporary bundle: metadata
formatting and the gallery's required integer, zero-origin viewBox. Those defects
were corrected before the successful full check. The original source sheets were
not reformatted or overwritten. An auxiliary image-decode review initially waited
on lazy hidden images; eager loading with a bounded decode wait resolved it.

Technical source validation, browser output decoding and author visual review are
separate. No unrelated browser matrix, native Blender authoring, geometry suite,
mobile hardware trial or GPU timing is claimed. Publication and user acceptance
are still separate decisions. There is no unfinished generation scope or further
API call needed for this initial suite.

## Matched sustained-load comparison

The established workload ran unchanged against the baseline renderer from
`09be75e` and this suite, sequentially with no concurrent checks: three rotated
rounds per density, 120 warmup ticks and 600 measured ticks each. Normal HP,
damage, seed and waypoint inputs were retained. All 18 workloads satisfied the
existing enemy-count, survival, kills, sampled-tick, projectile-density and
capacity assertions. HP and kills matched exactly between renderers in every round.

| Enemy population | Baseline Canvas submission p95 | Local suite Canvas submission p95 |
| ---------------- | -----------------------------: | --------------------------------: |
| 100              |                          1.2ms |                             0.6ms |
| 300              |                      6.4–6.5ms |                         1.4–1.5ms |
| 500              |                    17.2–17.7ms |                         2.2–2.3ms |

At 500, combined simulation/submission p95 was 17.9–18.6ms before and
2.8–2.9ms after. This is a bounded cloud-runner CPU submission comparison,
not GPU completion, general FPS, mobile hardware, thermal or long-session proof.
The full measurements are `performance-before.json`, `performance-after.json`
and `performance-comparison.json`. This supersedes no historical benchmark;
its Chrome/platform and rendering inputs differ from the earlier prototype record.

API request elapsed time totals about 226 seconds including the rejected size
request. The full application-test phase took 210.81 seconds, seeded simulations
17.17 seconds, and the first functional browser run 40.3 seconds. Editing and
one-time dependency setup were interleaved and not separately timed. No hosted
CI or publication wait occurred.

## Lossless evidence and source simplification · November 6

The 35 review PNGs were losslessly recompressed with Oxipng 10.2.1 (`-o 4`,
two threads, without alpha optimization or metadata stripping). They retain every
review state, filename, dimension and decoded RGBA/alpha value. All had no color
profile/gamma/chromaticity chunks; that absence and decoded sRGB interpretation
remain unchanged. ImageMagick raw RGBA and independent Chrome decoding compare
equal for every file. Before bytes remain recoverable at
`ddafc4ffd48c32606d5435a09c7c28e9a58e0a7c`; no duplicate before-images are
committed. The upstream Linux release archive SHA-256 is
`1813750ef592c5350ca79c88f98b2c0876d05c826dc7156245256d4255c1ad17`.

Total PNG storage: **6,993,184 → 5,114,931 bytes**, saving **1,878,253 bytes (26.86%)**. All 35 replacements were smaller.

| Evidence PNG                | Before bytes | After bytes | RGBA / alpha / color |
| --------------------------- | -----------: | ----------: | -------------------- |
| `actors/review.png`         |       75,721 |      58,529 | Equal                |
| `after-100-phone.png`       |       56,762 |      38,086 | Equal                |
| `after-100.png`             |      217,984 |     161,883 | Equal                |
| `after-300-phone.png`       |      100,474 |      68,227 | Equal                |
| `after-300.png`             |      477,610 |     350,100 | Equal                |
| `after-500-phone.png`       |      132,462 |      91,623 | Equal                |
| `after-500.png`             |      683,941 |     502,727 | Equal                |
| `after-desktop.png`         |       99,507 |      86,821 | Equal                |
| `after-phone.png`           |       69,214 |      51,049 | Equal                |
| `arena/review.png`          |       24,672 |      18,233 | Equal                |
| `before-100-phone.png`      |       55,719 |      36,761 | Equal                |
| `before-100.png`            |      148,599 |      96,430 | Equal                |
| `before-300-phone.png`      |      108,439 |      88,324 | Equal                |
| `before-300.png`            |      322,428 |     199,773 | Equal                |
| `before-500-phone.png`      |      131,480 |      91,245 | Equal                |
| `before-500.png`            |      453,567 |     280,069 | Equal                |
| `before-desktop.png`        |       80,433 |      71,659 | Equal                |
| `before-phone.png`          |       61,825 |      45,742 | Equal                |
| `combat/review.png`         |       54,295 |      40,470 | Equal                |
| `equipment/review.png`      |       81,000 |      59,136 | Equal                |
| `gallery.png`               |      122,472 |      89,988 | Equal                |
| `game-100-phone.png`        |      292,074 |     219,269 | Equal                |
| `game-300-phone.png`        |      449,599 |     352,040 | Equal                |
| `game-500-desktop.png`      |      759,917 |     593,221 | Equal                |
| `game-500-phone.png`        |      556,297 |     449,762 | Equal                |
| `game-phone.png`            |      124,067 |      94,488 | Equal                |
| `motion-hit.png`            |      179,524 |     137,130 | Equal                |
| `native-size.png`           |       49,432 |      35,937 | Equal                |
| `player-hit-context.png`    |      242,632 |     137,130 | Equal                |
| `reduced-motion-hit.png`    |      178,473 |     136,309 | Equal                |
| `scrap-sparkle-context.png` |      207,921 |     117,342 | Equal                |
| `shop-desktop.png`          |      159,997 |     133,859 | Equal                |
| `shop-phone-purchased.png`  |      110,789 |      87,447 | Equal                |
| `shop-phone.png`            |      103,626 |      80,275 | Equal                |
| `tile-review.png`           |       20,232 |      13,847 | Equal                |

The typed runtime source now stores the 147 shapes once and resolves shared plain
paint/tool-outline defaults once, before either SVG or Canvas consumes them. Every
normalized field, including non-drawing stroke defaults, matches the earlier
expanded data exactly. Both consumers still emit/use explicit paint values; no
SVG/CSS inheritance assumption was introduced. `adaptation.json` is now a small
lineage descriptor identifying that canonical source, the hash-bound previous
expanded snapshot and the unchanged extraction maps. It no longer repeats the
geometry. All original SVG sheets/cells, prompts, requests, responses, rejects and
usage records remain byte-for-byte intact. The API estimate remains US$0.174851.

Four gallery definitions now share their common projection while retaining their
independent historical subject lists. Full batch metadata compares exactly equal;
a future runtime change cannot silently remove a preserved generated subject.

| Maintained source/data file | Before lines | After lines |
| --------------------------- | -----------: | ----------: |
| `ui/art-data.ts`            |        1,340 |         594 |
| `adaptation.json`           |        1,338 |          16 |
| Gallery `library.ts`        |          917 |         659 |
| Total                       |        3,595 |       1,269 |

This removes 2,326 lines (64.7%) from those representations without deleting unique
geometry or provenance. The 20 standalone SVG exports are byte-identical and all
20 cached native-size sprites have identical RGBA hashes. Full scene, pickup/hit,
shop, phone and active reduced-motion captures also compare pixel-for-pixel to the
baseline; this rendering proof is separate from PNG recompression equality.
Desktop/phone UI equality uses a fixed imported paused replay. Two earlier timed
live-UI captures advanced differently and are retained as excluded comparison
inputs; seeded canvas frames and all native sprites matched directly.
Detailed temporary results and matched captures remain under
`.artifacts/scrapyard-optimization/`; these measurements do not reduce the size of
already-published Git history. Further expensive compression passes were deferred
because the present lossless reduction meets the stated scope.
