# An Empty Target · Emberwake opening pilot

Candidate composition study, owned by the Emberwake story worker. Source base:
`3a59621069dd1fe912a749d851d27e993507f5dd`. No accepted history, game selection,
runtime change or completed animation is claimed. Registration belongs to the
serial coordinator after this source is frozen.

## Purpose and reuse decision

Mira / alert standing gesture before an incoming spell / blue hood, swept cyan
cape, fitted split coat, brass belt, upright bronze crescent staff / slate stone,
restrained cold and fire light / accepted hero and crypt siblings / one narrative
composition / 640 × 448 review and 320 × 224 phone plate.

The worker inspected the actual retained pixels in
[accepted hero detail](../../../assets/emberwake-silhouettes/after-zoom.webp),
[crypt entrance](../../../assets/emberwake-crypt-kit/current-entrance.png) and
[crypt combat](../../../assets/emberwake-crypt-kit/current-combat.png). The
middle row of the hero detail establishes Mira's silhouette; broad joined slabs
and quiet routes establish the environment. These existing assets already serve
gameplay and remain the identity references. Reusing them directly would provide
a gameplay screenshot, but would not establish a full-body narrative plate with
a readable incoming missile and a deliberately clear future landing. A separate
text-guided opening study tests that composition before spending on motion.
No reference pixels are sent in this native SVG generation. This is not an
image-conditioned request or a replacement for those accepted assets.

Open studies checked on November 6 include Emberwake directional hound/acolyte,
brute, hound motion, acolyte actions, quest objects and equipment concepts, plus
Night Passage, Cartographer, Hearth, Scrapyard, Spire and Blindside story arcs.
None is edited or adopted here. This distinct story tests spatial timing of one
existing skill rather than a new object family. Its added upkeep is one original
SVG, exact request, compact outcome and this owning review, plus one selected
comparison if useful. The worker owns the frozen source; the coordinator owns
canonical history registration. Rejected art remains preserved.

## Grounding and proposed sequence

[Content](../../../../../packages/diablo2/src/domain/content.ts) defines Mira as
the last lantern scholar, with Teleport in her skill family. Teleport's range is
6 and its description requires a visible, clear landing. The
[cast implementation](../../../../../packages/diablo2/src/domain/combat.ts)
requires a learned rank, range, line of sight and body fit; it moves the player
directly. Hostile shots travel along their velocity and test the player's
current location. The
[world definition](../../../../../packages/diablo2/src/domain/world-content.ts)
places fire-ranged Cinder acolytes in Silent Courtyard. The
[hero source](../../../../../packages/diablo2/src/ui/hero-art.ts) owns Mira's
accepted clothing and staff; the
[effects source](../../../../../packages/diablo2/src/ui/skill-effects.ts) owns
cold `#99eaff` and fire `#ff9952` cues.

Assuming Mira has learned Teleport, a possible later two-clip story is:

1. **Too Close:** one hostile projectile moves left, clearing the future landing
   at right; Mira notices and a restrained cold cue starts.
2. **Empty Target:** she blinks to that now-clear floor behind the projectile;
   it continues through her vacated position. End with exactly one fully visible
   Mira and planted feet.

This is a narrative proposal, not a campaign witness or proof of a particular
simulation timing. It adds no invulnerability, delay, new damage rule or canon.
Keep the camera fixed, staff and feet whole, and projectile ordering readable.
No GIF call is authorized in this pilot.

## One-call preflight

Grant `story-emberwake-pilot-11` reserves **US$3 once**. The exact prompt and
settings occur only in [request.json](request.json); the client trace and grant
status occur in [outcome.json](outcome.json). Persist both before dispatch.
Use only the ready existing `OPENAI_API_TOKEN` network-secret binding and the
verified OpenAI endpoint. Zero automatic retries and no alternate route.

Official documents checked November 6:
[generation guide](https://developers.openai.com/api/docs/guides/image-generation),
[request schema](https://developers.openai.com/api/reference/resources/images/methods/generate),
[Sunburst](https://developers.openai.com/api/docs/models/gpt-image-2.6-sunburst),
[SVG author](https://developers.openai.com/api/docs/models/gpt-6.1-sol) and
[standard prices](https://developers.openai.com/api/docs/pricing).
They support `output_format=svg`, `n=1`, high quality/complexity and
`svg.model` with independent medium reasoning. SVG uses generations, not edits;
no SVG reference-input mechanism is claimed. The 1280 × 896 dimensions are
multiples of 16 and fit the documented size limits. Native vector output must
contain no scripts, external resources or embedded raster.

The guide's current calculator gives **1,284 image output tokens = US$0.03852**
at high quality and 1280 × 896. Text input is US$5/M; Sol standard author input
and output are US$2/M and US$10/M. A conservative **US$2 planning estimate**
allows the author's documented 128,000 maximum output tokens (US$1.28), a
100,000-token author-input allowance (US$0.20), an 8,000-token image-prompt
allowance (US$0.04), the reference image and US$0.44148 contingency. This is
below the US$3 reservation. The input allowance and contingency are planning
assumptions, not enforced API limits; the schema offers no dollar cap. Observed
same-size high/medium-author Cub work cost US$0.145621, but does not guarantee
this scene's cost. Actual usage must replace estimates when returned.

The shared handoff totals are US$6.645626 successful usage estimates,
US$25 unresolved historical reservations, US$4.20 separate acolyte grant and
this US$3 grant: **US$38.845626 inclusive**, US$1.154374 uncommitted. The
approximate US$40 balance/expiry is unverified, estimates are not invoices, and
historical tortoise/badger/Bells-Furnace/brute uncertainties stay reserved.

## Review and continuation

Pending the single request. Preserve its exact original; inspect rendered
pixels at 640 × 448 and 320 × 224. Check one Mira, full crescent staff, human
face, connected limbs, grounded feet, an unambiguous left-moving missile and
empty right landing. Hold defects; no reroll or manual derivative is implied.
Record success or uncertainty immediately, before extended QA. Source and
selection files must remain unchanged. A still pilot is not a completed GIF
series, and one image does not warrant a filler PR.
