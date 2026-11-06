# Between Waves — held motion study, incomplete

Candidate fiction for future expansion review. This is an incomplete held
motion study: one SVG pilot, one useful Notice GIF and three held Engage
attempts. No Tighten,Test or completed story. See [review](review.md). This scene does not establish a character biography, new repair
rule, shop location, weapon or runtime animation consumer.

The small yellow-hooded survivor notices a loose steel shoulder plate, steadies
it, tightens one fastener, then raises the arm and finds it holds. The final
gesture is quiet readiness: the wrench lowers, the survivor looks toward the
edge of the frame, and the repaired shoulder remains visible. Repair becomes a
readable action with an observable result rather than an unrelated motion loop.

## Grounding and reuse decision

At main `3a59621069dd1fe912a749d851d27e993507f5dd`,
`src/games/scrapyard/domain/world.ts` ends the first two waves in a shop and
applies a purchased full-health repair. `domain/content.ts` names the eight-scrap
item **Field repair**. The scene is a material metaphor for that interval; a
loose fastener and its repair are new candidate events, not simulated mechanics.

The existing actor and equipment review sheets were visually inspected. Reuse
the survivor's angular yellow hood, dark face opening, muted steel plates and
forest shadows from `docs/art/assets/scrapyard-suite/actors/survivor.svg`, and
the broad open-ended wrench/plate language from
`equipment/field-repair.svg`. `src/games/scrapyard/ui/art-data.ts` owns the current
adapted geometry. Palette: ink #142622, forest #30483e, mustard #f4cf74,
steel #a5b4a2, cream #e9dbb7 and restrained copper #b97c5e.

Reusing these symbols unchanged remains appropriate for the 26×32 actor and
24px shop icon. Their isolated poses cannot show a hand engaging a fastener or
the before/after shoulder test. A single story-specific native SVG composition
is proposed for that different purpose, adapting their identity without
duplicating the static suite or replacing those consumers. Existing source
paths and Git revision suffice for comparison; no frozen source catalogue.

## Composition and chapters

Locked waist-up three-quarter view, survivor on the left, shoulder plate on
the image left, matching the source survivor; the opposite hand begins at the
ledge on the image right. Quiet forest background and a narrow steel work ledge. Broad shapes,
upper-left cream light and cut-plane material accents. Keep exactly one wrench,
one visible shoulder plate and one large readable fastener; avoid small moving
fingers, extra tools, labels, camera moves and background spectacle.

1. **Notice:** the survivor looks down at the tilted plate and loose fastener,
   then reaches toward the wrench. End with one hand on its handle. The arm
   beneath the plate rests down; the opposite arm does the repair across the
   chest, avoiding an impossible reach to its own shoulder.
2. **Engage:** lift the wrench and seat its open jaw on the fastener. End with
   stable visible contact; the plate must not disappear or swap shoulders.
3. **Tighten:** one slow short wrench turn brings the plate flush. End with the
   plate aligned and the wrench clear; do not imply a full revolution or sparks.
4. **Test:** raise and lower the arm once, showing the plate stays in place, then
   settle into a ready pose with the wrench lowered. Hold the final result.

Plan: four 16-frame, 300ms, 480×336 native GIF chapters, potentially a 19.2s
joined review if their actual actions form a useful sequence. Keep the initial
story reference and each exact sent PNG input. For later clips, the supported
two-PNG edit pattern can provide the original identity anchor and the actual
previous endpoint. This is verified reference support, not guaranteed motion or
seamless joins. GIF-as-input remains unverified and is not planned.

The SVG pilot is text-guided: existing SVGs inform the prompt and visual
comparison, but are not sent as unsupported edit inputs. Its exact proposed
prompt lives once in `calls/reference.json`; common settings are inherited from
`../continuation-generation.json`. Only after a useful SVG passes review will a
local renderer create its PNG animation reference. The first GIF uses that PNG;
later GIFs use the identity PNG and the actual preceding final frame, extracted
temporarily then retained only if sent. Do not invent references before they
exist or claim a planned request was executed.

Official documentation refreshed November 6: the
[image guide](https://developers.openai.com/api/docs/guides/image-generation)
and [generation schema](https://developers.openai.com/api/reference/resources/images/methods/generate)
describe native SVG generation with a separate author, not SVG editing. The
[edit schema](https://developers.openai.com/api/reference/resources/images/methods/edit)
documents 2–16 GIF frames and still-image edit inputs. Current
[pricing](https://developers.openai.com/api/docs/pricing) agrees with the common
settings' conservative standard-rate estimate. These are documentation checks;
access evidence remains the prior successful story requests, not a new probe.

## Pilot and review gate

First call only: `gpt-image-2.6-sunburst`, native SVG generation at 1280×896,
high quality/complexity, `gpt-6.1-sol` medium SVG author, one output, no retry.
The opening composition must show the recognizable hood, coherent attached
shoulder/arm, loose plate, usable wrench and a practical reach before animation
is warranted. Inspect native and compact sizes, SVG safety/bounds and actual
reference rasterization. A failed identity/anatomy pilot remains held evidence;
do not automatically generate a replacement or begin chapters.

All frames are inspected in temporary output for identity, arm attachment,
wrench contact, plate/fastener counts, hand occupancy and readable cause/effect.
Keep originals byte-for-byte. Retain native GIFs and only actual sent reference
PNGs plus a small useful review preview. Record each call once with usage and
lineage; derive timing/digests from GIFs, not permanent frame catalogues. Review
native GIF playback at desktop, phone, enlarged text and reduced motion; stage
source-study imports for serial registration. No game selection or adoption.

## Historical plan and terminal result

The SVG grant and subsequent GIF grants all settled with usage recorded in their
canonical `calls/*.json` files. This study's five calls total an estimated
**$0.370241**,including all held trials. No paid activity or unknown billing
remains for this package. The finishing block stopped after its one permitted
repair; two unspent calls were canceled. No further motion attempt is planned.

The choreography above is the original proposal,not observed successful action.
Only Notice is a useful complete chapter. All three Engage originals remain
held and inspectable; the planned tightening and test were never generated.

A direct first GIF using the existing survivor and repair-tool SVGs rasterized
as two stills was considered before dispatch. Both unchanged sources were
rendered and inspected temporarily at384×384; the actual left shoulder identity
corrected the planned prompt before spending. That alternative was never sent.
The granted SVG route instead tests a single composed scene before motion. Do
not dispatch a duplicate pilot or reuse its grant for the edit endpoint.
