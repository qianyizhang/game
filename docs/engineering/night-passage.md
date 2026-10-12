# Night Passage architecture and delivery

Night Passage lives in `src/games/night-passage`. Its rules are independent of React, Canvas, Three.js and the other games. Rules reuse the existing seeded random and JSON narrowing utilities; presentation also uses the shared Three.js resource disposal helper. The [player guide](../guide/night-passage.md) owns controls and game behavior; the [glossary](glossary.md#night-passage) owns terminology.

## Ownership

| Module                                     | Responsibility and extension path                                                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/types.ts`                          | Game vocabulary and serializable state/commands. Add a genuinely new concept here before its callers.                                                 |
| `domain/content.ts`                        | Weapons, move timing, gods, boons, runes, regions, arena dimensions and content version. Add variants here when existing behavior suffices.           |
| `domain/chamber-content.ts`                | Four ordinary combat layouts: cover, hazard sites and reinforcement positions. Geometry is authored here and validated independently of the renderer. |
| `domain/geometry.ts`                       | Movement bounds, pillar collision and clear lines between actors.                                                                                     |
| `domain/combat.ts`                         | Player input buffering, move execution, projectiles and the fixed-step combat sequence.                                                               |
| `domain/boon-offers.ts`                    | Seeded blessing eligibility and slot-diverse audience drafts. Returns offered IDs and the next RNG state without changing a build.                    |
| `domain/game.ts`                           | Command validation, run lifecycle, rewards, markets and progression. `applyCommand` rejects atomically and returns the original state on failure.     |
| `application/session.ts`                   | Accepted-command journal, bounded replay validation, export and reconstruction. No serialized state snapshot is trusted.                              |
| `ui/NightPassageApp.tsx`                   | Input collection, bounded realtime accumulator, save lifecycle, HUD and decision screens.                                                             |
| `ui/presentation/`                         | Renderer lifecycle, viewport sizing, ground projection and 2D/2.5D drawing of confirmed state. Damage and collision stay in rules.                    |
| `tests/simulation/night-passage-policy.ts` | Legal-command verification pilot. It is not a player-facing autoplay feature.                                                                         |

Enemy stats and guardian pattern definitions live in `domain/encounter-content.ts`. `domain/encounters.ts` owns enemy decisions and hazard consequences. `domain/threats.ts` produces the same geometric shapes used by damage and `ui/presentation/threats.ts`; a warning is not an independent approximation of a hit. `domain/effects.ts` owns damage, charge accounting, elemental effects and bounded duos. `ui/audio.ts` is an optional, replaceable presentation consumer.

## Combat audio feedback

`ui/audio.ts` reads confirmed state transitions without changing combat, RNG or
replay. The app submits only live combat steps, never save restores. Enemy damage
uses five equipped-weapon palettes: a layered sword impact,
a higher spear tone, a low shield thump, a short bright bow response, and a brief
fist impact. A kill adds a rising accent. Player damage, defeat, dash and chamber
clear use separate envelopes. A four-millisecond attack avoids starting tones at
full gain. No external sound file is required; the envelope definitions are the
authoritative source.

The prior single 65 ms cooldown could discard player-damage feedback immediately
after an outgoing hit. The new 45 ms throttle applies only to ordinary impacts;
hurt and defeat bypass it. Each confirmed transition emits at most two cues,
with danger first, and simultaneous enemy hits coalesce into one impact. The
live mixer caps overlap at six voices and evicts a lower-priority voice when
needed. Muting stops current sources and zeros the output bus immediately.
Close releases the bus/context; a pending resume cannot revive a closed player.
Identical snapshots, tick rewinds, different runs and noncombat transitions do
not replay effects.

These are synthesized damage-confirmation sounds. The impact palette follows
the equipped weapon even for spell or status damage: current snapshots do not
retain per-hit source attribution. This slice does not claim material-accurate
foley, independently reviewed sound quality, equal loudness across devices or
improved human reaction times. Playback is optional; warnings and status remain
fully visual. Rules/content versions remain 4/3, with replay bytes unchanged.

Verification: `npm run check` passed maintenance/build gates, 383 application
tests and 22 seeded simulations. The nine Canvas/2.5D browser journeys and two
focused audio journeys passed. The latter render actual Web Audio envelopes at
24 kHz, check finite/distinct waveforms and silent tails, and exercise a real
dodge, immediate mute, unmute and context cleanup through the UI. Six identical
shield-kill voices through the 0.8 output bus peaked at 0.676 (clipping starts at
1.0). This is a declared overlap stress case, not a human listening review.

Regenerate with `npx playwright test tests/browser/night-passage-audio.spec.ts --project=functional`.
It writes ignored `test-results/night-passage-audio/metrics.json` and
`audition.wav`. The 7.7-second audition has 0.7-second slots: sword, spear, shield,
bow, fists, sword kill, hurt, defeat, dash, clear, then six overlapping shield
kills. Keep the small synthesis definitions authoritative; do not commit the
regenerable WAV or measurements.

## Blessing draft variety

Rules **4** use `domain/boon-offers.ts` for ordinary chamber, trial and market
audiences. Shuffle the eligible pool with the explicit run RNG, reserve one
currently empty action slot if available, then take the first candidates with
different slots until three choices are present. An eligible duo may occupy
one choice; it does not count as filling an empty action slot. The five patrons
remain available, including replacements and rank-ups. Caps and duo prerequisites
still filter eligibility before the draw. Upgrade shrines continue to draw only
owned, uncapped regular boons, with the existing 45-gold exhaustion fallback.

The 2026-10-13 comparison uses the rules-3 shuffle at `638b585` and rules-4 draft
on the same **512 RNG seeds** (`reward-variety-0` through `reward-variety-511`)
for each of three declared loadouts. These are controlled reward draws, not
human runs or reward-frequency measurements across a campaign.

| Loadout                   | Audiences with repeated slots, old → new | No empty-slot choice, old → new | Distinct unordered triples, old → new |
| ------------------------- | ---------------------------------------- | ------------------------------- | ------------------------------------- |
| Empty                     | 237/512 → 0/512                          | 0/512 → 0/512                   | 467 → 424                             |
| Attack/cast/dash, level 2 | 211/512 → 0/512                          | 108/512 → 0/512                 | 472 → 417                             |
| All five slots, level 2   | 216/512 → 0/512                          | Not applicable                  | 481 → 457                             |

The partial build carries storm attack, winter cast and veil dash; the full
build adds tide special and cinder call. All five patrons and every eligible
blessing appeared in each sampled condition: 25, 26 and 28 distinct blessings
respectively. The tradeoff is fewer combinations: filtering competing same-slot
options improves the breadth of a decision while reducing combinatorial variety.
This does not prove equal patron probabilities, subjective enjoyment or balance.

`tests/simulation/night-passage-rewards.test.ts` regenerates the comparison under
ignored `test-results/night-passage-rewards/`. Command-level tests cover choosing
an empty slot, preserving existing equipment, caps, duos, determinism and shrine
rank-ups. Fifteen legal weapon/seed campaigns still clear all four guardians.
The browser journey covers offered slot labels, selection, portable replay and
reload; previous rules-3 bytes remain downloadable until explicit replacement.

Only the rules identity advances to `night-passage-4`; content remains
`night-passage-content-3` and the packed replay format is unchanged. Older rules
are rejected for reconstruction and retained for export/recovery, following the
[accepted-command replay decision](decisions/0002-reconstruct-from-accepted-commands.md).
They are not silently reinterpreted with the new draft.

Delivery checks passed: maintenance/build, 378 application tests, 22 simulations
and 12 affected browser journeys. No renderer or native asset changed. A bounded
browser-test worker supplied the reward and previous-save journeys; both passed
integration without rework. The primary owned rules, comparison and review; no
single-agent timing comparison was measured.

## Chamber layouts

Ordinary combat routes pair rewards with one of four authored layouts in
`domain/chamber-content.ts`. Route generation shuffles the eligible layouts with
the explicit rules RNG, excluding the current combat layout and assigning distinct
layouts to the two combat choices. Safe stops and guardians have dedicated
arrangements; after either, all four ordinary layouts are eligible again. The
opening chamber remains Open Court without active hazards.

The selected layout fixes cover and hazard sites across all waves. Reinforcements
shuffle eight perimeter sites, exclude positions within 140 ground units of the
player, then place ranged enemies in farther 100-unit distance bands and melee
enemies in nearer bands. Seeded ordering resolves ties. Wave sizes, health, rewards
and guardian mechanics were unchanged by this layout slice. Its introduction
advanced rules and content to version 3; the current blessing draft uses rules 4.

To add terrain, extend `LayoutId` and the layout catalog together. Keep the entry
clear, preserve navigable gaps, separate reinforcement sites from cover and hazard
centers, and retain enough distant sites for a five-enemy wave anywhere the player
can stand. Catalog tests check geometry and navigation; lifecycle tests check route
promises, wave stability and safe entry. Legal campaigns and browser route/save
journeys remain the playability gates. The four renderer captures are controlled
layout comparisons, not evidence of human combat balance. No renderer or native
asset changes are part of this slice.

The 2026-10-13 layout delivery checks all 81 entry/spawn endpoint pairs in each
layout using the existing enemy steering (324 paths total). Initial denser cover
made that steering oscillate; adjusted pillar spacing/radii resolve those probes
without changing the movement rules. All 15 weapon/seed campaigns encounter all
four layouts and clear all four guardians. The layout browser journey covers
announced terrain, selected geometry, export/import and paused reload, plus
byte-exact recovery of an incompatible version-2 chronicle. Controlled captures
from `night-passage-layouts-review.ts` show distinct cover silhouettes and readable
route descriptions in the existing 2.5D renderer; this is visual self-review,
not user acceptance or human difficulty evidence.

Two bounded delegated subtasks produced the catalog/navigation checks and browser
journeys while integration remained with the primary agent. Catalog review caught
the steering issue; browser execution caught one unresolved bare-module import in
the test harness, repaired by using the established Vite helper pattern. Both
outputs were usable after that bounded rework; no elapsed-time comparison against
a single-agent implementation was measured.

## Presentation lifecycle

`ui/presentation/renderer.ts` defines the game-owned renderer interface: draw confirmed state, project a client-coordinate pointer and screen-relative movement onto the combat plane, and dispose owned resources. The renderer never advances rules, draws randomness from the rules stream or mutates state. `canvas.ts` supplies the baseline implementation; `draw.ts` owns its artwork and `threats.ts` draws the shared damage geometry. `scene/` supplies the angled orthographic Three.js implementation. There is no general engine or renderer registry.

React creates one renderer per mounted arena and disposes it on unmount, independently of pause/resume and the simulation clock. Canvas owns its resize observer and pixel-density backing store (capped at 2×); the stage keeps the 8:5 arena aspect ratio. Disposal disconnects observation, drops retained state and releases the backing buffer. Repeated disposal and drawing after disposal are inert. The input layer stores client coordinates, then requests a fresh ground point for each simulation command, so resizing or future camera motion does not leave aim in stale world coordinates. Zero-size or disposed views return no ground point. Rules, seeded output and replay versions are unchanged. The 2.5D input adapter rotates screen-relative movement into ground-plane command coordinates; accepted commands still replay without a renderer.

The browser presentation journey exercises resizing at 2× pixel density, aiming at a stationary screen pointer after viewport changes, disposal on game switching and saved-state reconstruction after remounting. Existing live-combat and guardian journeys continue to cover the baseline view.

### 2.5D chamber slice

The default view is now 2.5D; **View** selects the retained 2D baseline. Switching views pauses the passage and replaces the canvas because a single surface cannot host both context types. The view preference is separate from replay. On WebGL creation failure or context loss, the game pauses in 2D and preserves the chronicle. StrictMode cleanup releases owned resources without invalidating a canvas that React will immediately reuse; detached WebGL surfaces also release their contexts.

`scene/camera.ts` owns the orthographic camera, viewport fitting and inverse projection. Rules `(x,y)` map to scene `(x,0,z)`; height is cosmetic. `room.ts` builds a replaceable raised arena and columns from the actual collision footprints. Columns fade when they occlude actors or when attack warnings need ground visibility. `ground-effects.ts` places the shared 2D threat paths on a transparent ground decal; circles, sectors, annuli and capsule lines retain their rules dimensions. Projectiles, hazard phases, player position/aim and transient cues share this plane. `actors.ts` combines the authored hero with four pooled native enemy families, five held weapon identities, health/status cues, four authored guardians and asset-load fallbacks. Grounded actor roots follow confirmed positions; reduced motion removes cosmetic sway without hiding essential warnings.

The **playable renderer vertical slice**, campaign parity and planned authored
asset batches are delivered. All four regions have authored room kits. Authored
hero, weapon, ordinary enemy and all four guardian batches are described below.
Campaign-parity coverage exercises all four regions, five weapons and every
spell/threat family. Local enemy draw-submission measurements are recorded below;
high-DPI and cross-device performance remain unmeasured.

Verification adds projection/viewport and screen-direction scenarios, live 2.5D movement/dodge/casts, a complete ranged chamber, live melee on a reconstructed guardian approach, all four guardians' initial warning views, view switching/reload, narrow layout and real WebGL context-loss recovery. Guardian screenshots are reconstructed approaches, not complete human-played guardian victories. Review output is regenerable under `test-results/night-passage-scene/`. The original renderer slice changed no saved native files. The hero slice below adds its own saved-source and native/browser agreement evidence.

### Spell and threat readability

`scene/combat-marks.ts` draws patron projectile contours, cast/call crests,
concurrent enemy status marks and distinct transient outcomes. It reads confirmed
projectiles, cues, boons and timers; it introduces no events, wall-clock animation,
randomness, saved fields or gameplay changes. Ground marks remain on the existing
single decal. The authored hero's material does not need to flash for damage
immunity to remain visible. Warning geometry still comes from `attackShapes` and
`projectileAngles`, and hazard timing still comes from the rules.

`scene/patron-effects.ts` adds five authored camera-facing light forms above this
ground layer. Confirmed windup, projectile and cue timers place and fade them;
the adapter keeps no emitter history. Reduced motion removes decorative rise and
expansion, while pause retains identical snapshots. A 48-sprite pool bounds
decoration without suppressing ground warnings. Five small Canvas textures and
private sprite materials belong to the renderer lifecycle; solid native assets
keep their existing saved-source authority. The [patron light record](../art/assets/night-passage/patrons.md)
documents silhouettes, actual-size review and the legacy cue-color mapping.

The browser parity matrix covers **85 controlled rendering cases**. It uses explicitly controlled encounter/build snapshots,
then real `applyCommand` steps for release outcomes. It covers all five patrons'
casts/calls, patron-marked weapon projectiles, all ordinary and guardian attack
patterns, four hazards and concurrent statuses. Pixel probes independently check
selected threat interiors and safe space; repeated paused draws check stability
and input snapshots remain unchanged. This is renderer family coverage, not a
claim of human-played campaign completion. Five additional legal-command campaigns
render all 32 chamber entries and victory for each weapon: **165 checkpoints**,
covering all four regions and guardians. Each checkpoint checks painted pixels
and snapshot purity; four region captures must differ. Initial hero/weapon
activation is observed, but later checkpoints do not wait for every native
family. These fast-forwarded campaigns establish renderer traversal and purity;
the continuous UI campaign below separately checks authored readiness at every
chamber entry.

The [combat-mark review](../art/assets/night-passage/combat-marks.md) retains a
matching before/after comparison and an angled play-scale capture. The remaining
matrix images and summaries are regenerable ignored output. Owner visual review
is separate from technical coverage and user acceptance.

### Authored hero and weapon batches

The [native source guide](../../packages/dcc-workbench/subjects/night-passage/README.md)
locates the authoritative hero and armory Blender masters, saved-source exporters
and verification commands. The fitted masked humanoid and five authored weapon
identities activate together after both deliveries load. The fallback stays
playable during loading or on failure; late results after disposal are released.
Loading also redraws a paused arena. Hero and armory adapters own their imported
resources; procedural held wrappers remain actor-owned.

Sixteen baked hero clips cover idle/run, dodge, five basic weapon body actions,
five distinct specials, a left punch, cast and collapse. `scene/hero.ts` samples
confirmed rules ticks and shares contact phase with `scene/weapons.ts`. Attacks
align with windup/recovery; pause and reduced motion hold stable poses. Fists use
the rules' right/left/right three-hit cycle. Both gauntlets attach to their native
hand sockets. The armory preserves export transforms and game-unit dimensions.
The bow string and nocked arrow draw together, release at recovery and renock at
rest. Animation introduces no rules RNG, timing or replay changes.

These are lightweight authored assets with owner visual self-review. Precise
two-hand choreography, directional locomotion and hit reactions remain polish
opportunities. The guardian and first environment batches are described below. Native
checks cover every authored hero frame, all weapon vertices at three bow draw
values, and saved motion/geometry edits. Browser comparisons, unretimed playback,
real socket attachment and live chamber journeys provide separate evidence.

### Ordinary enemy assets

`scene/enemies.ts` owns four lazy-loaded native families with separate pooled
skeletons, mixers and material feedback. The library shares geometry/textures;
clones own their skeletons and materials. Disposal releases clones before the
library and rejects late arrivals. Missing or incomplete clips retain the
procedural enemy. Enemy root position, radius and facing remain confirmed rules
state; native geometry never changes collision.

Each family owns idle, locomotion, attack and stagger clips. Windup samples the
attack before its 0.45 contact; the first 18 cooldown ticks settle the motion,
then locomotion resumes. This visual settle window does not delay rules movement.
Confirmed stagger temporarily takes priority. Stable reduced-motion poses retain
warning geometry; repeated paused draws hold their pose. Pool reuse resets
movement observation by passage, chamber and enemy identity. Material flash is
per opponent and restores native emission afterwards. The archer's nocked arrow
hides at contact and returns after the visual settle window; native bow/draw-hand
motion remains in the saved action.

`scene/batches.ts` combines compatible opaque surfaces with the same material
once per loaded family, before actors clone the library. Meshes must share their
parent, transforms, skin binding and attribute layout; incompatible or directly
animated mesh hierarchies remain intact. The nocked arrow stays separate. Cloned
meshes share one private skeleton per compatible rig, while different actors keep
independent bones and feedback. Batching owns only derived runtime geometry;
saved sources and GLB delivery remain authoritative.

The [enemy source guide](../../packages/dcc-workbench/subjects/night-passage/README.md#ordinary-enemy-family)
locates saved masters, exporters and edit proofs. The
[visual record](../art/assets/night-passage/enemies.md) distinguishes native
surface agreement from owner art self-review. Browser coverage exercises all
sixteen clips, real actor activation, matching native/fallback combat views at
desktop and 390 pixels, independent paused poses and reduced motion. The native
journey compares saved and deliberately edited masters to delivered surfaces.
These are controlled presentation encounters; legal campaign and live UI
journeys remain separate evidence. The four guardian batches follow below; the first environment batch follows below.

### Authored guardians

The [Bellwarden review](../art/assets/night-passage/bellwarden.md) records the
bronze bell construct, saved master and six performances. The
[Undertow review](../art/assets/night-passage/undertow.md) adds a shell-backed tide
creature with charge, volley and pulse performances. The
[Ash Regent review](../art/assets/night-passage/ashregent.md) adds a crowned furnace
construct with cross, rain and volley performances. The
[Unlit Sovereign review](../art/assets/night-passage/sovereign.md) completes the
set with a broken orbital crown and four attacks. `scene/guardians.ts` owns
per-region lazy libraries and private actor poses/materials. A pooled boss can
move between all four regions and reactivate its cached model. Failed, incomplete and late loads preserve fallback and disposal
behavior independently for each library. Health bars clear the authored bodies.

Guardian motion maps each region's active pattern to its own attack clips: three
for the first three guardians and four for Sovereign. A pattern increment
selects the completed attack for contact and 18 ticks of visual settling, rather
than prematurely switching to the next windup. Observed durations stay fixed if
health crosses the enrage threshold mid-action. A newly loaded mid-action snapshot
has no historical duration field, so preparation/settling is inferred from the
remaining ticks and current health; that cosmetic pose can differ from continuous
observation. Contact still follows the actual attack transition. No rules state,
RNG, damage geometry or replay version changes are part of this artwork slice.

### Rendering cost

The [dated enemy draw-submission comparison](../research/experiments/2026-10-13-night-passage-rendering.md)
uses the production renderer and unchanged assets at five-enemy campaign density
and a synthetic 24-enemy expansion workload. At 960 × 600 and DPR 1 on the local
M5 Pro, batching reduced total draw calls by 31% and 46%, respectively. CPU
submission p95 fell; display cadence remained approximately 60 Hz before and
after. This establishes local rendering headroom, not a cross-device FPS claim.
The benchmark also guards zero repeated draws for unchanged paused snapshots.

`night-passage-batches.spec.ts` compares material/attribute tuples, oriented
triangles and deformed vertices in the actual deliveries before/after batching.
The runtime lifecycle tests cover incompatible delivery fallback, independent
actors and resource release. No native source or delivery change is required.

## Time and saves

Rules advance at 60 fixed steps per simulated second. A frame command supplies bounded movement, aim, buttons and 1–120 ticks. The browser caps accumulated work at six steps per display frame and pauses on blur/hidden state. Rendering reads confirmed state; the HUD refreshes at approximately 10 Hz and immediately after decisions.

Rules copy the bounded active state per command. Session history uses persistent linked entries so appending does not copy the full history. Identical adjacent frame inputs pack into at most two-second commands. Export reverses that history into a linear replay and encodes frame inputs as `[ticks, x, y, aim, buttonMask]` tuples without changing numeric values. Rules version 4 and content version 3 use the unchanged replay envelope v2. Version-1/2/3 rules histories are rejected and remain downloadable; there is no migration that reinterprets their old commands. Import validates every command and reconstructs through the same interface. Rules and content changes that alter replay meaning require explicit version bumps before further delivery.

Initial content is source-authored. Arbitrary content-pack import is not implemented. Adding a sixth weapon presently requires its ID, three move definitions, validation membership through `WEAPONS`, and a presentation decision; introducing a new move family also requires combat rules and behavioral evidence. Regions select their enemy pool, guardian pattern set, hazard kind and palette. Campaign traversal follows `REGIONS.length`; `CHAMBERS_PER_REGION` currently specifies eight chambers per region. New region entries reuse the lifecycle without changing its bounds. New threat families require a shared geometry rule, presentation and damage/safe-space evidence. There is no universal game engine or arbitrary code execution in content imports.

## Verification and limits

New source is covered by the existing `src` TypeScript, lint, formatting, inventory and application-test scopes. React hook checks explicitly include this UI. Simulation policy and journeys enter the existing `tests` scopes.

```sh
nvm use
npx vitest run --project application src/games/night-passage
npx vitest run --config vitest.playtest.config.ts tests/simulation/night-passage.test.ts
npm run test:browser -- tests/browser/night-passage.spec.ts
npm run test:browser -- tests/browser/night-passage-scene.spec.ts tests/browser/night-passage-parity.spec.ts tests/browser/night-passage-layouts.spec.ts
NIGHT_PASSAGE_ENEMY_RESULTS=test-results/night-passage-enemies/native npm run test:browser -- tests/browser/night-passage-enemies.spec.ts
npm run check:full
```

Browser launching requires approved execution outside the macOS command sandbox, using the existing disposable-profile harness.

The campaign simulation exercises every guardian with each weapon on three fixed seeds, including the default player seed and the cover-navigation regression seed. A separate trial scenario checks its extra wave and exact reward. Narrow command tests cover timing, dodge protection, buffered actions, distinct casts, charge, all three duos, reward eligibility, markets, death, rejection atomicity, banking and replay.

Browser journeys cover live first-room combat, cursor tracking while moving, reward decisions, pause/reload, portable saves, reconstructed victory/progression, original-save recovery, unavailable storage, export-before-reset and guardian warning rendering. Imported victory and guardian approaches remain reconstruction evidence. The separate continuous UI journey starts at the quay and drives the actual application through all 32 chamber entries, four guardian fights and victory using keyboard, pointer and decision controls under virtual time; it then reloads its own saved chronicle and returns to the quay. It never imports progress or injects rules state. It is automated UI play, not human play or a frame-rate benchmark.

The default-seed automated pilot takes roughly 6–10 minutes of simulated combat, excluding reward decisions. That is not a measured human run duration, and the earlier 25–40 minute suggestion is not yet established. The delivery is a complete lightweight gameplay study, not commercial Hades fidelity. Desktop keyboard/mouse is supported; touch controls and arbitrary mod-pack import are outside this slice. Visual review covers the authored hero, weapons, ordinary enemies, all four guardians, spell/status light marks, all four environment kits and reward/loadout symbols. Difficulty balance and subjective combat feel still benefit from human playtesting.

## Requirement evidence

| Requested behavior                                   | Owned evidence                                                                                                                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Four regions, branching rewards and guardians        | Fifteen legal campaigns cover five weapons on three seeds; one continuous bow UI campaign covers 32 chamber entries, all four guardians and authored readiness.          |
| Five weapons with attack, special and dash moves     | Source move definitions plus full campaigns for every weapon; buffered-action and dodge scenarios protect ordering.                                                      |
| Five patrons, casts, calls, upgrades, runes and duos | Build scenarios check distinct cast delivery, meter requirements, eligibility, replacement, all three duos and rune boundaries; campaigns exercise loadouts and unlocks. |
| Shops, healing, optional challenges and economy      | Market conservation, exact trial rewards, run banking and progression scenarios; browser victory/return/train/new-run journey.                                           |
| Save/resume and original identity                    | Versioned reconstruction, tamper rejection, real browser pause/reload/export/import/reset/recovery; original game route, characters and story.                           |
| Maintainability and expansion                        | Named module ownership, source-authored content, shared threat geometry, strict checker scope and replaceable Canvas/audio consumers.                                    |

## Reward and loadout symbols

`ui/Artwork.tsx` owns 26 editable SVG symbols for patrons, duos, runes, weapons
and rewards. `NightPassageApp.tsx` places them beside existing decision text and
in the build sidebar. Typed symbol maps cover the domain IDs; paired marks derive
from boon requirements. Inline symbols are decorative and non-focusable. The
[visual record](../art/assets/night-passage/symbols.md) covers small-size review,
standalone export and legal keyboard/save journeys. This changes presentation
only, with no rules or content version bump.

## Authored environments

All four region kits now replace their blockouts. Root Sepulcher uses native
stone slabs, low tomb boundaries, root-bound cover pillars and bronze lanterns.
Drowned Archive uses blue paving over narrow still-water joints, recessed folio
niches, paired scroll capitals and caged aqua lamps. Its [visual review](../art/assets/night-passage/archive.md) records native and production views. Cinder Court adds a dark basalt floor,
three peaked furnace monuments, six-sided copper-bound columns and open braziers;
its [visual record](../art/assets/night-passage/cinder.md) covers the third kit.
Starless Gate completes regional coverage with midnight slate, a broad open
limestone arch, slotted columns and caged cold lights; its
[visual record](../art/assets/night-passage/starless.md) covers the fourth kit.
[Visual review](../art/assets/night-passage/sepulcher.md) separates geometry proof
from owner self-review. `scene/environment.ts` owns lazy regional four-part libraries
and private placed materials; `room.ts` owns fallback and occlusion policy.
Loading an incomplete kit keeps the entire fallback, and successful load
invalidates a paused frame. Libraries load only on first regional use and remain
cached until arena disposal. Switching regions hides the previous kit immediately;
a late arrival cannot select the wrong region. All four regions retain a complete fallback for unavailable or invalid delivery.

`Floor` and `Boundary` use the arena center; `Pillar` and `Lantern` use local
bases. Pillars scale horizontally to the actual rules radius and keep their
81-unit height. Every pillar material fades for actor occlusion or active
windups. Floor surfaces stay at or below the combat plane; raised boundaries
stay outside the playable interior. Content, rules versions, seeded layouts
and collisions are unchanged. The [source guide](../../packages/dcc-workbench/subjects/night-passage/README.md#root-sepulcher-environment)
owns saved-source export and edit-proof commands.

## Integrated delivery audit · 2026-10-13

The scoped 2.5D refinement milestone is delivered. The audit covers the committed
game at `fc7abf6`, adds campaign UI and rune evidence, and leaves rules version 4,
content version 3 and all native sources/deliveries unchanged. The requirement
matrix above is the completion boundary; further regions and systems are new scope.

- **Continuous UI campaign:** the bow with Root/Feather, seed
  `a-light-in-the-dark`, traversed 32 chamber entries, defeated all four guardians,
  won, reloaded its own exact chronicle and returned to the quay. All required
  hero/weapon, environment and current enemy roots were active at each entry.
  The run defeated 207 foes and finished with 239 HP. Its 27 combat clears exclude
  noncombat chambers. Virtual time and synthetic DOM input make this a repeatable
  application journey, not human pacing or a performance measurement.
- **Rune audit:** eight controlled cases protect Thorn's strict half-health
  boundary, Comet's simultaneous dodge attack and Moth's once-per-clear capped
  healing/reset. The ordinary campaign pilot uses Root/Feather and could win
  without exposing defects in these other runes.
- **Native coverage:** the [hash audit](evidence/night-passage-native-audit.json)
  checks all 14 current source/model receipts and 97 retained evidence files:
  no missing delivery or mismatched pin. Coverage is the 16-clip hero, five held
  weapons, four ordinary enemy families, four guardians and four environment kits.
  Native edit/export and visual proofs remain their dated, hash-matched records;
  this read-only audit did not rerun Blender. The current hero authority is the
  weapons review; the earlier first-hero review is deliberately historical.
- **Other authored assets:** 26 editable reward/loadout symbols and five raised
  patron light forms have their own browser/visual records above. Load-failure
  fallbacks remain intentional recovery behavior, not missing normal deliveries.
- **Expansion:** the ownership table, content/versioning contracts and
  [saved-source guide](../../packages/dcc-workbench/subjects/night-passage/README.md)
  describe adding content and editing/exporting assets. Rules remain seeded and
  browser-independent; rendering and audio consume confirmed state.

The [campaign receipt](evidence/night-passage-campaign.json) retains compact
results, source pins and image hashes. Detailed progress and the remaining
captures are regenerable under `test-results/night-passage-campaign/`.
Run `npx playwright test night-passage --project=functional` for the current game
suite, or select `tests/browser/night-passage-campaign.spec.ts` for this journey.

Visual self-review of the four live guardian-warning captures found distinct
region palettes and visible warning edges/safe ground around the player.
Damage flashes whiten a struck guardian in these instants; their dedicated native
records remain the authority for material and silhouette review. The retained
[first guardian](../art/assets/night-passage/campaign/region-0-warning.png),
[last guardian](../art/assets/night-passage/campaign/region-3-warning.png) and
[victory](../art/assets/night-passage/campaign/victory.png) show actual UI progression.
This is agent self-review, not independent aesthetic acceptance. Human difficulty
and combat-feel testing, high-DPI/cross-device performance and touch controls are
not established by this audit. The dated local performance comparison above
remains the performance evidence; concurrent completion checks are not a benchmark.

Final verification passed: `npm run check:full` covered maintenance/static checks,
392 application tests, 22 seeded simulations and 128 geometry tests. Its sandbox
loopback skip was resolved by all nine `test:usage` cases under approved execution.
All 48 Night Passage functional browser journeys passed in the disposable Chrome
harness. Native Blender execution is not included in that functional project;
the unchanged native evidence is revalidated separately above. Results and the
final focused campaign rerun are recorded with the campaign receipt.

Two bounded agent audits found the rune coverage and integrated UI evidence gaps; the rune additions
integrated without repair. Root's new UI harness needed timer handling at lazy
startup and reload. A separate read-only review confirmed the UI/observer boundary.
No controlled agent speedup measurement was made.

## Progressive refinement

The lightweight campaign was the playable baseline. The completed refinement goal delivers a maintainable 2.5D campaign across all four regions, with authored gameplay assets, seeded reward and encounter variety, combat-audio feedback and measured rendering improvements. Hades informs the camera, readability and responsiveness; Night Passage retains its own characters, environments and visual identity.

Each turn selects **one general direction** and finishes one bounded, reviewable slice. Examples include graphics, seeded generation, a map, an incomplete feature, a module refactor, performance or an asset family. Tests, documentation and cleanup supporting that direction belong to the same slice. Unrelated opportunities stay queued. Begin with the observed problem and a finish line; conclude with the implemented change, verification, remaining limits and a scoped commit. A milestone can span several turns.

### Milestones

| Milestone               | Finish line                                                                                                                                                                                                                                                                                                              | Status                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Playable baseline       | Four regions, five weapons, patron spells, runes, complete run lifecycle and portable saves; rules and browser journeys pass.                                                                                                                                                                                            | Delivered; original baseline superseded by the authored campaign below.                                                             |
| Presentation boundary   | A game-owned renderer lifecycle separates view creation, resize, drawing, pointer-to-ground conversion and disposal from input, sessions and decision UI. Keep the current Canvas view usable for comparison.                                                                                                            | Delivered; Canvas baseline retained.                                                                                                |
| **2.5D vertical slice** | One complete chamber plays through an angled orthographic 3D scene: camera projection and inverse aiming, grounded hero/enemies, depth and occlusion handling, light/shadow, terrain, projectiles and exact ground-plane telegraphs. Validate movement, dodge, melee, ranged attacks and a guardian at actual play size. | Playable renderer, hero and five weapon identities delivered.                                                                       |
| **2.5D campaign**       | All four regions and guardians, five weapons and every spell/threat family work through the new presentation. Pause, resize, import/resume, context/resource lifecycle and reduced-motion behavior remain usable.                                                                                                        | Delivered; renderer parity, authored readiness at all 32 UI chamber entries and local enemy submission benchmark.                   |
| Authored asset coverage | Replace gameplay-critical placeholders in small coherent batches: hero and motion set; five weapon identities and attacks; ordinary enemy families; four guardians; four environment kits; patron spell effects and reward/icon treatment. Track each asset's source, delivery, motion coverage and visual review.       | Delivered; all listed batches present, 14 native receipts revalidated, symbols and raised patron effects reviewed.                  |
| Campaign refinement     | Independently close combat-feel, reward/RNG variety, encounter/map variety and measured performance slices. Compare declared seeds and loadouts, review actual play and document tuning rationale.                                                                                                                       | Delivered; measured rendering, four-layout encounters, seeded blessing drafts, audio feedback and continuous automated UI campaign. |
| Delivery closeout       | Complete campaigns and browser journeys cover the final content/rendering; no gameplay-critical placeholder remains; extension and asset-authoring paths are documented; report technical results separately from visual self-review and user feedback.                                                                  | Delivered; integrated audit above records scope, evidence and human-review limits.                                                  |

The 2.5D implementation uses the existing Three.js dependency and a fixed angled orthographic camera over the authoritative two-dimensional combat plane. Elevation and animation are presentation until a separately scoped gameplay change says otherwise. Shared threat geometry must project into the scene without changing its damage footprint. Foreground scenery must not conceal actionable enemies or warnings. Establish camera, silhouette, contact and depth before decorative detail. Keep the baseline renderer through migration until campaign parity is established.

Asset work follows the [art workflow](../../skills/card-art/SKILL.md), [aesthetic rulebook](../art/art-direction.md) and [native modeling workflow](../../skills/card-art/references/native-modeling.md). Editable saved Blender masters own native geometry and animation; baked deliveries serve the browser. Reuse proven loading/export utilities while keeping game-specific presentation local. Start with one representative authored character/environment combination, verify its edit/export/consumer loop, then expand. A completed model count or passing geometry check does not establish visual quality. Compare matching views and inspect actual motion, combat readability and enlarged forms.

### Compatibility and evidence

- Preserve seeded rules and validated command replay. Renderer changes must not consume rules RNG or alter combat timing. Changes to gameplay or reward generation explicitly decide rules/content versioning and old-save recovery.
- Use `npm run check` for code, UI and rules. Changes to 3D construction, animation, rendering/export or DCC delivery require `npm run check:full` plus affected browser/native checks. Browser launches use the approved disposable-profile harness. Review screenshots and motion separately from automated results.
- Establish performance measurements on a named local browser/device, viewport and repeatable combat workload before selecting budgets or claiming improvements. Track frame timing, long stalls, loaded asset size and memory/resource cleanup as applicable. Do not convert simulation speed into a human pacing claim.
- Keep test inputs regenerable. Commit authoritative source and delivery assets, compact evidence and owned code; exclude disposable screenshots and bulky generated replay fixtures.
- Optional Astra/Sol trials own one bounded subtask within the turn's direction. Give explicit file ownership and acceptance criteria, preserve concurrent edits and compare elapsed time, rework and usable output before expanding delegation. The primary agent remains responsible for integration and verification.

The goal closes when the milestones above are delivered and their evidence is recorded. New regions, weapon counts or unrelated systems are subsequent scope, rather than reasons to expand this goal indefinitely.
