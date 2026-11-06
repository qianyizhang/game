# Briar Mantis family proposal

**Prepared, never dispatched. No reservation or output.** This proposes one normal
portrait pilot, followed only after visual review and a separate pool grant by one
ascended portrait. Deliver the two useful poses as one candidate family. No paid
request, runtime slot, game rule, accepted canon or publication is implied.

## Brief and admission decision

Purpose: evaluate an elongated, articulated insect silhouette for the user's
requested future Hearth expansion candidates. Six connected legs, the triangular
head and unequal folded forelegs supply a distinct compact reading. The mantis
was in the original unexecuted inventory; neither that packed brief nor this
single-subject proposal has been sent. Tortoise and badger are excluded.

At source base `3a59621069dd1fe912a749d851d27e993507f5dd`, inspected
[Copper Beetle and Moon Moth](../../../../src/games/battlegrounds/ui/ExpansionPortraits.tsx)
already provide insect subjects. Copper Beetle's broad armored body and six
short limbs do not supply a mantis's long prothorax, raptorial forelegs or narrow
diagonal gesture. Reuse the existing Hearth art window and palette conventions;
retain its beetle intact. A moth would overlap the existing
[Moon Moth SVG and living 3D study](../creatures/moonmoth.md), so defer that original
inventory item rather than generate another moth. Open-PR title/body search for
mantis found no other proposal at preparation time.

This is a preliminary source comparison, not a claim that matched visual admission
has passed. Before a generated family becomes review-ready, compare it with those
live portraits at matched 160x112 and 64x45 sizes and record the distinct benefit.
No existing asset needs a checkpoint because this proposal edits none. The family
owner retains at most two original SVGs, shared exact call records and a useful
combined review sheet; no dependency, runtime export or permanent frame catalogue
is proposed. Central registration and user review remain later gates.

Normal: poised on a low diagonal twig, two forelegs at unequal heights and four
walking feet visibly anchored. Ascended: the same species, proportions, palette
and lighting leaning outward on a forked branch; one foreleg opens diagonally,
the other folds close to the thorax, wing covers lift asymmetrically and four
supporting feet grip two branch levels. Gesture, support and silhouette change
together. This is a meaningful second pose, not a recolor or separate tiny PR.

## Exact pilot and transport

[The sole prepared payload](pilot-request.json) uses
`gpt-image-2.6-sunburst`, `n=1`, `output_format=svg`, `size=1024x720`,
`quality=medium`, `complexity=medium`, and
`svg={model:gpt-6.1-terra, reasoning:{effort:medium}}`.
Send only its JSON body to `https://api.openai.com/v1/images/generations` if a
future grant explicitly reserves this call. Use the existing bound credential
through the configured HTTPS proxy, standard processing, TLS verification,
1800-second client timeout, no redirects and no automatic retries. This document
contains no dispatch helper. Never reuse either unknown creature request.

The 737,280-pixel canvas has 16-pixel-divisible edges and is 17.7% smaller in total
area than the old 1600x560 pair, while giving its single subject more room than
one old cell. Contain-fit it into 160x112, 80x56 and 64x45 windows. Forty to
sixty-five paths is a soft drawing target, not an output-token limit. The API
does not expose a SVG-author output-token cap in this request schema.

The [official guide](https://developers.openai.com/api/docs/guides/image-generation)
separates reference quality, reference complexity and SVG author effort. It warns
that higher complexity can increase latency. SVG uses one image and cannot
stream partials; image edits cannot return SVG. No unverified raster-reference,
heartbeat or asynchronous workaround is proposed. Share textual species constants
with the later pose and judge consistency side by side.

## Evidence for a smaller Terra pilot

| Observed request                                                      | Settings and scope                                                       |    Time | SVG output tokens |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------: | ----------------: |
| [Scrapyard actors](../scrapyard-suite/actors/response.json)           | Terra/low; medium quality, high complexity; six simple sprites, 1152x768 |  82.41s |             4,251 |
| [Scrapyard equipment](../scrapyard-suite/equipment/response.json)     | Same controls; six simple objects                                        |  66.53s |             3,234 |
| [Single Cub](../hearth-effort-comparison/single-medium-response.json) | Sol/medium; high quality/complexity; one creature, 1280x896              | 208.80s |             9,895 |

The Cub returned but retained eye/foreleg quality limits. The earlier low-effort
packed Hearth trial had structural failures; see the
[batch workflow](../../../../skills/card-art/references/batch-assets.md).
Terra/low is faster in those simple historical examples, but subject, prompt,
quality and output length also differ. These are not controlled comparisons.
Recommend **Terra/medium** for this connected living subject; low effort is a
supported alternative with insufficient anatomy evidence, not an automatic retry.
Changing effort does not reduce the model's conservative maximum token budget.

The owner's continuation receipt at local commit
`28734956a69f613992189783680e7a7b57023a28`, under
`docs/art/assets/expansion-hearth-blindside-scrapyard-continuation-2026-11-06/`,
records returned Sol/medium ram/heron pairs at 225.44/229.84s and two separate
tortoise/badger disconnects at 301.04s. Both clients already used 1800s timeouts.
The repeated boundary is consistent with a service/intermediary close near 300s;
available diagnostics do not identify which. Smaller scope and simpler reference
planning are a plausible latency experiment, not a guarantee of avoiding it or
preserving quality. Do not retry either unknown request.

## Proposed bound and funding gate

**Request a maximum reservation of US$4.20 for one pilot; nothing is granted or
reserved here.** Standard pricing only, no Fast mode or regional premium:

- [Terra](https://developers.openai.com/api/docs/models/gpt-6.1-terra) has a 1.05M
  context and 128K output limit. Reserve even the full context as input at the
  long-context $2/M rate plus 128K output at $7.50/M: $2.10 + $0.96 = **$3.06**.
  This deliberately overcounts input/output overlap and covers either effort.
- Retain **$1.14** for the image reference and prompt: 32,768 reference-output
  tokens at [$30/M](https://developers.openai.com/api/docs/models/gpt-image-2.6-sunburst)
  plus at most 8,000 UTF-8 prompt bytes at $5/M, with 10% contingency, totals
  $1.125344. This is the prior accepted sub-megapixel reservation policy, far
  above the observed 915 reference-output tokens for larger medium examples.
  The 32,768 allowance is a conservative planning assumption, not a documented or
  enforceable image-output cap. Reconfirm the size/quality calculator and rates
  before a future grant; do not represent $4.20 as an API-enforced charge ceiling.

Coordinator receipt at preparation: shared free capacity **$3.487463**, so this
proposal is **$0.712537 short** even under that conservative policy. If a strict
documented worst-case reference-token maximum is required, that maximum remains
unverified and must be resolved before spending. Do not shrink the reservation
merely to fit. A later ascended call needs its own separately confirmed $4.20
reservation; two calls would total at most $8.40 under this policy, not reserved
now. No third call or automatic revision is proposed.

Our lane remains **$0.750694 known usage estimate, $7.50 tortoise unknown + $7.50
badger unknown, zero active requests**. These holds are separate and unreleased;
the owner ledger remains canonical. Other workers' reservations are coordinated
externally, not duplicated here. The shared $40 pool is not this lane's allowance.

## Future review and stop

If funded, first inspect the exact SVG at native and compact sizes: six connected
legs, distinct antennae, thorax-to-abdomen continuity, convincing twig contacts,
clear foreleg negative spaces, restrained eye size and three readable value groups.
Check resource safety, viewBox/bounds, safe margins and true native vector content.
Anatomy failure holds the pilot; it does not automatically authorize another call.
Only a useful reviewed normal permits proposing the ascended payload and grant.

Retain each actual call once with its original, usage/request ID or exact error,
plus meaningful QA and any actual derivative lineage. Inspect rendered pixels
temporarily; retain only useful combined review evidence. On any uncertain result,
keep the full new reservation and stop. No fabricated history attempt or gallery
entry exists for this unexecuted proposal. Registration, matched live comparison
and both-pose visual review must precede a candidate draft; adoption stays with
the user.

Preparation checks: pinned Node 24.21.0/npm 11.19.0
`npm run format:maintenance` passed (901 managed sources, no errors). Payload
parsing, 16-pixel dimensions, 737,280-pixel area, 2,578-byte prompt, seven local
links and two-file scope passed. No visual verdict exists before generation.
