# Empty Target · measured-layout revision

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

Outcome pending. No further paid call is authorized after this revision.
