# One Light Left Behind · candidate story studies

Delivered local study, November 6, 2026. Source studies only; no accepted canon,
runtime slot, selection, gameplay trigger or automatic adoption. Base main:
`3a59621`. The story worker alone owns this directory and its $9 allocation.

The requested experiment joins reference-guided short GIF chapters into a longer
story. Story duration must come from readable changes and consequences.

## Grounding and admission

Inspected Night Passage's guide, region/patron content, presentation source,
Root Sepulcher and Bellwarden records, and the native environment assembly at
full and compact scale. Existing materials establish slate slabs, pale coping,
roots, moss and bronze lanterns. Lantern Quay and four passage regions are
established. This traveler, sealed side doorway and lantern-offering event are
new proposed fiction. They do not establish a guardian's history or a new rule.

Existing movie trials (Haunted Island, Little Haunt, Lantern Keep and Golden
Claw) have separate settings and retained comparative purposes. Recutting them
would not show reference-guided continuity in this game's visual world. The
Spire Metallicize GIF tested a short formation effect, with weak formation; it
cannot supply this setup/change/consequence/ending. Reuse its documented API
route and preservation practice, not its imagery. Existing Night Passage art
continues to serve all current consumers. These are bounded review sources,
not another maintained runtime suite. No existing slot is edited; no baseline
snapshot is needed for a new unassigned study. Presentation/art review owns any
later decision and its source upkeep.

## Arc proposals

- **One Light Left Behind (chosen):** A traveler brings a lantern to a sealed
  side passage, leaves it in a sconce, sees the roots withdraw, and passes into
  darkness while the light remains for the next traveler. An act of leaving
  something useful behind changes the route; no dialogue or invented lore.
- **An Unwritten Page:** In the Drowned Archive a blank page floats upstream;
  the traveler rescues it and finds their route revealed by drying water.
  Candidate fiction only; a harder fluid/material continuity study.
- **The Last Warm Stone:** An ember carried from Cinder Court warms a stone
  at a cold threshold. The traveler rests, then carries the cooled stone on.
  Candidate fiction only; a quieter gesture and material-change study.

## Four-chapter storyboard

| Chapter    | Setup → action → result                                                           | Reference            | Intended time |
| ---------- | --------------------------------------------------------------------------------- | -------------------- | ------------- |
| 1 · Notice | Traveler faces root-sealed door, raises their lantern toward empty sconce, pauses | SVG keyframe raster  | 16 × 300 ms   |
| 2 · Offer  | Traveler hangs the same lantern in the sconce, releases it, lowers hand           | chapter 1 last still | 16 × 300 ms   |
| 3 · Answer | Warm light stays steady; two roots withdraw, leaving a dark open threshold        | chapter 2 last still | 16 × 300 ms   |
| 4 · Pass   | Traveler walks through and disappears; lantern remains beside the opening         | chapter 3 last still | 16 × 300 ms   |

Fixed camera, same cloak/strap/boots, doorway scale, sconce and light palette.
First/last frame comparisons will expose joins. Do not call the individual
clips seamless merely because they share references. A joined derivative may
have explicit chapter holds; originals and every source frame remain intact.

## Capability check

Checked the [official Image guide](https://developers.openai.com/api/docs/guides/image-generation)
and [edit reference](https://developers.openai.com/api/reference/resources/images/methods/edit)
on November 6, 2026. Sunburst and Flare support GIF output with preview access;
the guide lists **2–16 frames**, 20–2000 ms/frame rounded to 10 ms. The edit
reference agrees on 2–16 frames but describes a larger encoded delay cap; this
study stays at 300 ms within both. There is no verified 24-frame request here.
Still images can guide GIF output through `/v1/images/edits`; the documented
route does not establish GIF-as-edit-input or guaranteed temporal continuation.
We use PNG stills, never claim GIF input support. SVG output uses generations,
not edits; SVG itself is not supported as a raster edit input.

[Published pricing](https://developers.openai.com/api/docs/pricing): image text
input $5/M, image input $8/M, image output $30/M. SVG also charges the author;
this study uses Sol standard input $2/M and output $10/M as in the recent study.
Usage estimates are not billing statements; account balance and expiry are
user-reported. Exact calls, reservations, usage and failures stay in this bundle.

## Delivery state

[Open the storyboard/player](index.html), [joined GIF](story.gif),
[all chapter joins](joins.png), or [compact comparison](compact.png).
Serve this directory on loopback if browser policy blocks file URLs. The player
starts still, supports play/pause, restart and frame seeking, and pauses when
hidden. No external service or account is required to view it.

One original native SVG, four original GIF chapters, all 64 composed PNG frames,
and the joined 19.2-second GIF are retained. Each chapter is **16 frames × 300 ms,
480 × 336**. The joined result uses every frame in order with the original delay;
decoded RGBA bytes match all sources exactly. There are direct chapter cuts,
with no interpolation, crossfade, frame removal, added hold or retouch.

The story reads as setup, choice, consequence and departure. The traveler keeps
a recognizable hood/cloak/red-strap identity and the lantern remains one object.
Roots visibly withdraw. The fixture/stone edges and palette drift between fresh
requests. The ending includes a short silhouette fade; its final empty hold is
two frames rather than five requested. This is useful narrative exploration,
not a seamless continuous shot or production animation acceptance. Full
[author findings](review.json) retain those holds.

| Request                                | Model                     | Usage estimate USD |
| -------------------------------------- | ------------------------- | -----------------: |
| SVG opening reference                  | Sunburst + Sol SVG author |           0.176445 |
| Chapter 1                              | Sunburst GIF edit         |           0.063185 |
| Chapter 2                              | Sunburst GIF edit         |           0.063305 |
| Chapter 3                              | Sunburst GIF edit         |           0.063245 |
| Chapter 4                              | Sunburst GIF edit         |           0.063320 |
| Total, five successes, no paid retries |                           |       **0.429500** |

[Ledger](budget.json): **$0 outstanding reservation**, $8.570500 of this worker's
allocation unspent. Exact response usage/request IDs are beside each output;
these are token-derived estimates, not account billing or balance verification.
Requests used `gpt-image-2.6-sunburst`; SVG author `gpt-6.1-sol` at medium reasoning.
PNG data URLs were sent through the edit endpoint via the authorized token
binding and inherited HTTPS proxy. No credentials are retained. Actual successful
calls establish GIF preview access and 16-frame PNG-reference output for this
binding; they do not establish GIF-as-input support. The `*-sent-request.json`
files preserve the request structure with reference bytes represented by path
and SHA-256; request JSON contains the exact prompt string. `*-prompt.txt` keeps
the exact plain prompt bytes; Markdown copies are readable presentations.

## Verification and handoff

- SVG resource/syntax safety passes. Full/native/compact artwork and all frame
  contact sheets inspected. Subject bounds have visual margin review; local
  geometry bounds alone do not establish stroke-complete global fit.
- Every extracted PNG sequence matches the original composed GIF RGBA bytes.
  Every original and joined GIF decodes: 64 total frames, 19.2 seconds. The
  source C2PA bytes remain in the original GIFs. ImageMagick warned about a
  metadata keyword when producing some PNGs; no decoded pixels changed.
- [Browser review](browser-review.json): full real-time play-through, pause,
  restart, local links, still/reduced-motion defaults, 390/320-pixel layout and
  enlarged body text pass. No external requests or page errors. This is a
  disposable Chromium review probe, separate from the repository Google Chrome
  E2E suite. `file://` preview was administratively blocked, never retried;
  normal loopback HTTP preview succeeded.
- [History import](history-import.json) contains six attempts (five paid, one
  manual assembly) and six unassigned source revisions. Reference PNGs, all
  extracted frames and contact sheets are supporting documents, with explicit
  [artifact lineage](artifact-lineage.json); no invented game slots or runtime
  files. Production import/verify passes in a disposable merged-registry copy:
  709 assets, 98 revisions, zero selections. [Isolated validation](history-validation.json)
  and [production gallery review](gallery-review.json) retain evidence. Every
  source revision, request/settings and GIF preview was inspected; all Use in
  game controls disabled. Central registration remains pending.
- Evidence optimization retained a rejected 8-bit thumbnail candidate and a
  pixel-equivalent 16-bit recompression candidate. Neither replaced the original
  evidence; [optimization review](optimization-review.json) records pixel,
  dimension, alpha/channel and color checks. Technical success is not aesthetic
  acceptance.

[Validation record](validation.json) and [maintenance output](maintenance-check.txt)
retain the scoped results. No application,
rule, source renderer or native construction changed; unrelated game and
geometry suites were not run. Next step: central registration can import this
additive bundle, then the user can review its story and animation choices.
No shared registry, selection/default, owner documentation or gallery code is
changed. No push, PR, merge or deployment is authorized in this worker.
