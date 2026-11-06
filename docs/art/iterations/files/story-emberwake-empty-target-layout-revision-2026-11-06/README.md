# Empty Target · measured-layout revision

**Held: the visual guide did not resolve scale, baseline or projectile continuity.**
Generation stops. No assembly or draft PR is produced; no further call is granted.

Exactly one targeted new call, grant `story-emberwake-revision-15`, conservative
planning reservation US$0.25, zero retries. Historical source checkpoint
`0c2b7f2c30c8d28168e5547452f50d5f514a14e6` remains in branch ancestry. The unknown
SVG, first native GIF and held second native GIF are never overwritten or retried.

## Supported change and exact inputs

[Request](request.json) preserves the exact sent prompt/settings and ordered
input hashes once. [Call](call.json) records grant, unique trace and outcome.
Image 1 is the actual first-GIF frame-11 PNG, verified against its decoded RGBA
pixels and the historical commit. Image 2 is the reviewed [layout guide](layout-reference.png),
copied byte-for-byte from diagnosis: SHA-256
`a982095cefeb06baf6b05d1e1d8e8998232b6c0612d8383aa5512172496c0282`.
It has one rendered Mira and an empty equal-size destination box, common baseline
and projectile path. It is manually annotated guidance, not another generated
image or a final frame. The prompt requires removal of every annotation.

Before dispatch, the GIF-specific [guide](https://developers.openai.com/api/docs/guides/image-generation)
was checked: it explicitly directs **still reference images** for GIF animation
to `/v1/images/edits`. The [same endpoint's input contract](https://developers.openai.com/api/reference/resources/images/methods/edit)
accepts 1–16 images; its GIF restrictions exclude masks/streaming/partial images/
compression, without limiting ordinary image references to one. Together these
document ordinary multiple-image conditioning for the requested GIF settings.
They do not establish first/last-frame locks, keyframes, rigid translation or
guaranteed geometry. No mask, markup, fidelity, strength or temporal-reference
parameter is sent. Each image uses the supported ordinary `image[]` field.

Compared with the held call, the concrete change is a second measured spatial
reference and a prompt organized around it. The model, high quality/complexity,
480 × 336, `n=1`, 12 frames × 160 ms remain unchanged. Source/destination guide
envelopes are both 115 × 128, offset (+253,0); the foot baseline is y=221 and
projectile center line y=159. The old prompt already supplied these constraints
in text; this trial tests whether an explicit visual relationship helps.
Annotation leakage, redraw, duplication and scale drift remain real risks.

The US$0.25 planning bound allows 4,000 output image tokens (US$0.12), 10,000
input image (US$0.08) and 10,000 text (US$0.05) at current
[Sunburst rates](https://developers.openai.com/api/docs/models/gpt-image-2.6-sunburst).
Two actual one-input GIF calls cost US$0.072185 and US$0.072080 estimated; this
trial adds a second input within the larger input allowance. The bound is not
an endpoint-enforced charge cap. Only the existing authorized `OPENAI_API_TOKEN`
binding is used at the verified OpenAI endpoint; no credential value is retained.

Fresh exposure: US$6.945440 successful estimates + US$28 unknown holds + this
US$0.25 = US$35.195440 inclusive. No other grant is active at authorization.
All earlier holds remain untouched. Save/report receipt or uncertainty before QA.

## Review gate

Inspect every native frame and actual native/phone playback, including the join
against the first clip. Compare the prior cyan-height failure (117 → 146 px),
baseline (y221 → y251), and shot-height jump (y159 → y172). Check one Mira,
full staff/feet, support, projectile crossing after departure and absence of
guide marks. Hold another incoherent result without a reroll. A once-playing
assembly, draft PR and portable registration handoff are conditional on a useful,
coherent story. Originals and C2PA/looping metadata remain exact. No shared
registry/tooling, runtime, defaults, selections, issue, merge or deployment change.

## Receipt and measured comparison

HTTP 200, request `req_83afbb2c94c4481cbf55b505a6b8eb90`, 56.71 seconds.
[Exact native revision](empty-target-revision-original.gif): 315,582 bytes,
SHA-256 `6161cd010fb5d7e530c3b37d43d43902ec481c47a88a4d9e06750116b05973cd`.
The receipt and original were saved and reported before extended QA. Usage was
1,260 image input, 477 text input and 2,126 image output tokens, totaling
**US$0.076245 estimated**, not an invoice. Two ordinary inputs were sent;
this says nothing about keyframe control.

| Matched measurement                        |        Real endpoint | Earlier held opening | Layout revision opening |
| ------------------------------------------ | -------------------: | -------------------: | ----------------------: |
| Cyan vertical span, same color/region mask |               117 px |               146 px |                  140 px |
| Figure-height increase from endpoint       |                    — |                24.8% |                   19.7% |
| Boot baseline, approximately               |                 y221 |                 y251 |                    y243 |
| Warm projectile bounds                     | x191..226, y153..165 | x191..233, y165..179 |    x225..262, y164..178 |

The measured guide slightly reduced the growth and baseline error, but did not
repair them. The projectile also starts roughly 34 px farther right than the
actual endpoint, as well as about 12–13 px lower, before moving left again.
This creates an especially clear discontinuity at the real join. The source
and destination envelopes are guidance, not enforced geometry constraints.

## Every-frame and actual-join review

All 12 native frames were decoded temporarily and inspected at 480 × 336 and
320 × 224. Each is 160 ms, totaling 1.92 seconds; no frame was discarded or
retimed. A real browser preview then displayed the two exact raw GIFs in
sequence, switching at 1.92 seconds without a crossfade, exported assembly or
compensating camera transform. Eleven samples across the join and revised clip
were inspected at both rendered sizes in Google Chrome 157.0.8103.38. The growth,
foot-baseline change, projectile jump and redrawn masonry remain visible.
All decoded frames, join captures and diagnostic sheets stay temporary; the
earlier single compact comparison remains the only retained review image.

No boxes, arrows, baseline strokes, captions or guide legend were observed in
the artwork. One Mira is present on the left in frames 0–4, absent in frames
5–6, and fully present on the right in frames 7–11. No duplicate Mira, ghost,
detached staff or cropped foot was observed; staff and boots appear supported.
The projectile crosses the vacated location after departure. However, the blink
arrives later and the absence lasts longer than requested, while the enlarged
figure settles below the intended baseline. Broad identity and action survive;
the two clips still do not form a consistent fixed-camera story.

The exact raw GIF retains `loop=0` and a `C2PA_GIF` application extension with
21,806 payload bytes. C2PA presence was inspected, not cryptographically verified.
All previous native GIFs, their provenance/looping metadata, the unknown SVG
attempt, manual composition and actual sent PNGs remain byte-for-byte unchanged.
The revision is held separately. No once-playing derivative, fake completion,
additional generation, runtime adoption or story PR is made.

## Portable delta and stop

[This additive delta](history-import.json) adds one returned-but-held attempt and
one unassigned native GIF revision, with no runtime adaptation or selection.
Apply the [historical base import](../story-emberwake-empty-target-gif-2026-11-06/history-import.json)
first, then this delta. The real endpoint is the image parent; the held original
second clip remains a sibling comparison. The guide and its manual origin are
explicit input documents, not generated frames or alternate Miras.

The historical base plus this delta passed `verifyHistory` in a fresh private
snapshot: 709 assets, 96 revisions, zero selections. No canonical registry was
edited. Earlier gallery behavior checks remain valid for the unchanged tooling;
the revised raw images and real join were inspected separately at both sizes.
Canonical registration still requires serial application of those two imports.
Repository `format:maintenance` passed. Canonical `assets:history verify` passed
for the unchanged 709 assets/92 revisions/709 registered sources; it does not
establish registration of the four candidate revisions in the private snapshot.
Exact request/input/output hashes, all 12 durations and historical bytes passed.

Revision settlement would bring successful estimates to US$7.021685; the untouched
US$28 unknown holds give **US$35.021685 inclusive**, subject to central ledger
reconciliation. No active paid grant remains in this lane. Stop this generative
continuation: this tested change did not resolve the named failure, and no further
call is authorized. Canonical registration remains with the serial coordinator;
shared registry, tooling, selections, game/default behavior and issues are unchanged.
