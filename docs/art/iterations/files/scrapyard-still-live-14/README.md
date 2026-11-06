# Still Live — held story candidate

Proposed fiction for a future Scrapyard story, **not established campaign canon**.
This independent study does not reuse the held “Between Waves” repair scene.
One first-clip request completed; the result is held for visual defects. No second
clip, reroll, gallery registration, game selection or runtime change was made.

[Original native GIF](apparent-victory.gif) · [sent PNG](reference.png) ·
[composed SVG](reference.svg) · [selected review](review.png) ·
[exact sanitized request](request.json) · [receipt and finite grant](receipt.json).

## Cause and consequence

At source commit `3a59621069dd1fe912a749d851d27e993507f5dd`,
`src/games/scrapyard/domain/content.ts` defines four Spitter pellets with 0.18-radian
spacing, independent speed 1.6, life 300 and damage 6. The automatic Scrap cannon
fires one round with damage 42, sufficient for the Spitter’s 30 HP.
`src/games/scrapyard/domain/world.ts` emits shots with their own velocity/lifetime,
updates them independently of enemies, drops scrap on defeat, and respawns the
enemy elsewhere. The vignette does not portray that offscreen respawn.

The proposed first beat is apparent victory: a cannon round defeats the Spitter;
one green chip appears while four hostile pellets continue. The proposed later
beat is a small diagonal step toward scrap that crosses one fixed pellet path;
that pellet disappears on contact and one restrained hit cue appears. End upright,
with scrap uncollected. Spawn protection must have expired, and this is mid-wave:
wave transitions clear all shots. Collection is below 18 units and attraction
below 110. No homing, knockback, handheld gun or new damage rule is implied.
The second beat was not generated or funded by this task.

## Reuse and reference lineage

Manual composition, **not a production screenshot**. No new SVG API call.
Current merged `src/games/scrapyard/ui/art-data.ts` supplies exact paths, paints
and path order; `src/games/scrapyard/ui/Artwork.tsx` supplies its centered uniform
fit. Source catalogue revisions point to merged `5e26f4aace8c151a15122f6a62195b81b9a39c7e`.
The suite’s retained actor review and native-size sheet were inspected, along with
a temporary native-size rendering of the current definitions.

Exact IDs: `scrapyard/survivor`, `scrapyard/spitter`, `scrapyard/heavy-round`,
`scrapyard/hostile-diamond`, `scrapyard/scrap-pickup`, `scrapyard/player-hit`,
`scrapyard/floor-tile`. The last two combat marks remain references for consequences;
no pickup or hit is inserted into the initial frame. Source dimensions are
26×32, 24×24, 14×14, 8×8, 8×8, 48×48 and 40×40 respectively.

Placement only: fitted actors/projectiles uniformly enlarged 1.5×; survivor center
(104,266), Spitter (352,142), heavy round (299,164). Four diamond centers are a
90px-radius fan from the Spitter, centered at 2.874 radians with offsets
−0.27, −0.09, +0.09, +0.27. The floor is one original tile uniformly enlarged 12×,
centered at (240,168), clipped by the canvas. This replaced a cluttered repeated
floor during reference preparation. Overall draw order is floor, Spitter, pellets,
round, survivor. No source geometry or paints changed.

The 480×336 composed reference and 358px compact rendering passed self-review:
yellow hood/dark face/steel shoulder, teal vessel and muzzle, four coral diamonds
and one cream round are distinct. Reuse through composition meets the story need
without parallel actor assets. The owning story bundle retains only original GIF,
reference SVG/PNG, one useful review PNG and concise request/receipt/prose.
Decoded frames and browser captures stay temporary. No frame-PNG catalogue.

## Result and visual hold

Native GIF: 480×336, eight 200ms frames, 1.6 seconds. Exact original bytes are
unchanged. `loop=0` means **infinite looping**, including a jump back to the opening;
this is not a once-playing story assembly. Any future assembly must be a distinct
derivative with lineage.

Every decoded native frame and actual Chromium playback were inspected at 480×336
and at 358px art width in an actual 390px viewport. Four distinct pellets remain
visible throughout; the cream round reaches the Spitter in frame 3, the Spitter
is replaced by one stationary green chip in frame 4, and the single survivor
remains upright without collecting it. No hit or repeated bright flash occurs.

**Hold:** the API redraws actor contours and staging slightly. More seriously,
24.88–32.52% of each frame is unexpectedly transparent, in changing large floor
patches. A matching forest backing reduces their visibility but does not repair
floor continuity; the checker-backed panel exposes the issue. Pellet movement
also stalls around frames 2–3 and accelerates at the end, with path/fan drift
from the supplied straight-ray staging. The core event reads, but the locked
staging and constant trajectories are insufficient for a coherent continuation.
No endpoint PNG or second-call proposal is promoted from this held result.

## Spend and verification

Grant `story-scrapyard-still-live-14`: exactly one request, no retries. Eight frames
were chosen to keep the conservative planning estimate $0.2476128 within the
$0.25 reservation; this was not an endpoint-enforced charge cap.
HTTP 200, request `req_7ab9d8cf9bb3456e8fdcdf34f3a3a313`.
Usage: 542 text input, 630 image input, 1109 image output tokens.
Estimated charge **$0.041020**, not an invoice; this task’s unused reservation is
$0.208980. Historical unknown holds and the Emberwake allocation are unchanged.
Do not interpret the task’s original shared-pool snapshot as a fresh balance.

Technical decode, eight-frame timing and retained-byte hashes pass.
`npm run format:maintenance` passed with pinned Node 24.21.0/npm 11.19.0;
maintenance reported 901 managed sources and no errors. `git diff --check` passed.
Visual verdict is held. Gallery registration is deliberately deferred to the coordinator’s serial
publication workflow; this bundle is not gallery-ready. No PR, merge or deployment.
Browser `file://` navigation was unsupported (`ERR_BLOCKED_BY_ADMINISTRATOR`);
local allowed file reads and in-memory browser document rendering completed review.
