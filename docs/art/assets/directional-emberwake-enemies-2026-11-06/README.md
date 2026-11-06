# Emberwake directional enemies · candidate study

Candidate-only Ash hound (`hound`) and Cinder acolyte (`cultist`) direction study.
Base: `3a59621069dd1fe912a749d851d27e993507f5dd`, fetched current main on
2026-11-06. No runtime adoption or publication is authorized in this lane.

## Admission and source brief

The inspected [baseline](baseline.png) shows the actual current `figure` renderer
at 4× and native scale beside authored Rook and Hollow archer. `hound` uses the
shared `beast` polygon, while `cultist` uses the generic robed figure. Reusing
these silhouettes cannot supply genuine front/rear diagonal views or the authored
anatomy, cloth and gear detail present in the siblings. A candidate replacement
study is justified for that specific gap. Generic shapes remain required for
mods and bosses, so replacing a shared shape would break other named uses.

The source contracts were verified in
[render.ts](../../../../packages/diablo2/src/ui/render.ts),
[content.ts](../../../../packages/diablo2/src/domain/content.ts), and
[types.ts](../../../../packages/diablo2/src/domain/types.ts). Enemy state has no
facing field. The renderer owns contact shadows, HP/status markers and elite/boss
scaling. `briar` shares `beast`; `regent` shares `cultist`; `lucent` shares `demon`.
Exact content IDs, future facing policy, frame ownership and selection wiring
require a separate integration change. These drawings establish none of those.

- **Hound:** forward tracking head, high withers/low haunch, lean ash-russet body,
  charcoal mane, small ivory jaw; physical melee. Intended native bounds 30×24.
- **Acolyte:** dusty wine/salmon hood, recessed ash face, bent staff in anatomical
  right hand, one close ember in left hand, asymmetric sleeves and planted boots;
  fire ranged. Intended native bounds approximately 30×33.
- **Set:** SE/SW front-quarter and NE/NW rear-quarter; fixed elevated orthographic
  camera, common screen-upper-left light, three broad value groups, isolated
  transparent figures. Square screen tiles; no terrain, baked shadows or VFX.

The eight-cell pilot deliberately excludes Furnace brute, walk animation and
story GIFs. One coherent pair tests living anatomy, rear identity and native
readability before further expansion. The art lane owns its original sheet,
extracts and compact provenance; temporary PNG measurements and gallery exports
stay under ignored `test-results/`. It does not create a second runtime package.

## Request and spending

[request.json](request.json) is the exact single sent request and prompt.
[budget.json](budget.json) records the pre-send bound and pricing sources.
[receipt.json](receipt.json) records the outcome, request ID and returned usage.
The existing network-secret binding was used only through the configured HTTPS
proxy to `https://api.openai.com/v1/images/generations`. No credential was changed.

The request uses `gpt-image-2.6-sunburst`, high reference quality/high complexity,
1536×768, native SVG, one output; SVG author `gpt-6.1-terra`, high effort. The
[official generation reference](https://developers.openai.com/api/reference/resources/images/methods/generate)
permits SVG author selection. The
[image guide](https://developers.openai.com/api/docs/guides/image-generation)
documents native SVG generation and excludes SVG from the edit endpoint. No
unsupported SVG edit/reference route was used. Transparent canvas is specified
in the prompt; `background: transparent` is documented for PNG/WebP and omitted
from this SVG request.

The initial single-call reservation is US$3 from the shared user-reported US$40
pool, with a calculated US$2.942095 bound. It covers the author's full documented
922,000 input/128,000 output limits at long-context Standard rates, the reference
image priced at **max** quality despite the explicit **high** request, and prompt
text conservatively priced using its UTF-8 byte count. No local estimate is an
account-balance verification. The disconnected historical US$7.50 reservation
belongs to another lane and is neither retried nor released here. Any uncertain
outcome holds the entire US$3; no automatic retries or second paid request.

## Outputs and visual review

Open [preview.html](preview.html) for a directional/native-size comparison and
[overview.png](overview.png) for the selected review evidence. The exact generated
[original.svg](original.svg) is preserved byte-for-byte. Eight standalone cell
extracts remove only their outer sheet translations; the
[staged history import](history-import.json) links each one to that original and
one shared request. These remain unassigned source studies with null runtime
files. The shared gallery registry is unchanged; registration was validated and
inspected in an isolated disposable gallery.

**Self-review: four useful hound candidates; four acolyte views held.** The hound
has readable head/mane/jaw, distinct front/rear overlap and a coherent lean
quadruped identity. At exact 0.1 sheet scale it occupies 26.9–30×22.4–23.9px. Its
rump remains a little high and its back more rounded than the requested
high-withers/low-haunch gesture. Fine ear/scar marks are too small to credit as
native-size continuity evidence. This is promising direction work, not user
acceptance or final anatomy approval.

The acolyte's wine cloth, recessed face, staff and close ember read well, and the
hood back is honestly different from its face. However, the two front headings
nearly repeat and the two rear headings nearly repeat: it does **not** establish
four convincing diagonal views. Actual width is 20–20.3px at 32.2–32.4px height,
below the approximately 30×33px intended footprint. All four are retained and
held. Do not relabel duplicate headings as a successful directional set.

The next useful paid request would focus only on the acolyte's shoulder/hip
depth, hood turn and broader asymmetric silhouette; proposed reservation US$3,
subject to coordinator allocation. No second request was made. Furnace brute and
walk/motion work remain deferred. There are eight static views and zero animation
frames, no GIF or per-frame PNG catalogue.

Returned usage: 1,348 image-model text inputs, 916 image outputs; 2,972 Terra inputs
and 21,121 outputs (including 1,238 reasoning tokens). Standard token pricing gives
**US$0.142797** actual usage cost, approximately US$0.01785 per returned view;
US$2.857203 of the initial reservation can return to the pool. The active local
reservation is zero after reconciliation; the external US$7.50 hold is unchanged.
This is a usage-derived receipt, not an independently verified account balance or
billing invoice. Request `req_201e6228029e411fac9e959cfebc9617` completed with HTTP
200 in 286.74 seconds.

## Verification and limits

[validation.json](validation.json) contains measured bounds, alpha margins, the
source review and check results. Nine SVG documents passed the repository's
static vector safety validator. All eight source cells have transparent margins,
no embedded raster, no visible text and no external resources. Native comparison
uses a 38.4px cell canvas at 0.1 source scale, plus a tighter 32px canvas and 4×
inspection. Custom browser checks use installed Chromium in this cloud, not the
user's Mac or a spoofed repository Chrome startup guard.

Formatting/maintenance and the unchanged shared history verification passed.
Isolated import, gallery settings/parent inspection, image decoding and exact
extract-pixel comparison are recorded separately from the visual verdict. Seven
extracts render pixel-identically to their sheet cells. Held `cultist-sw` differs
in 11 channel values across five pixels, at most 2/255; its XML geometry matches
exactly. This browser rasterization exception is retained rather than claiming
exact pixel equivalence for all eight. No
application, native 3D, game-facing or runtime adoption check is claimed. The CI
planner conservatively identifies unknown ownership for new art records; its
broad application fallback was inspected but not run for this candidate-only
bundle with no runtime consumer. Source art remains held from publication until
normal shared gallery import and any required integration gates are completed.

The initial direct-SVG screenshot attempt timed out in Chromium. HTML image
embedding decoded and captured the same SVG successfully; the original was not
modified. A preview capture also encountered a Vite hot-reload navigation during
metadata updates; it was rerun after writes settled. No paid request was repeated.
