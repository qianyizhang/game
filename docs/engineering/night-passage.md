# Night Passage architecture and delivery

Night Passage lives in `src/games/night-passage`. Its rules are independent of React, Canvas, Three.js and the other games. Rules reuse the existing seeded random and JSON narrowing utilities; presentation also uses the shared Three.js resource disposal helper. The [player guide](../guide/night-passage.md) owns controls and game behavior; the [glossary](glossary.md#night-passage) owns terminology.

The [agent-play interface](night-passage-agent.md) owns passage scoring, structured
observations/actions, the local JSON API and the baseline player benchmark.

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
| `domain/contracts.ts`                      | Supported legacy/current identities and the three encounter-pressure tiers.                                                                           |
| `application/control.ts`                   | Aged/redacted perception, metered delay, held controls, aim bounds and replayable control scheduling.                                                 |
| `agent/policy.ts`                          | Quick, balanced and deliberate policy work; policies receive only their permitted view.                                                               |
| `application/chronicle.ts`                 | Immutable chronicle values with private accepted-command journals, replay capacity, export and reconstruction.                                        |
| `application/live-chronicle.ts`            | Live chronicle ownership, save cadence, storage status, original-byte recovery and explicit replacement.                                              |
| `application/agent.ts`                     | Detached tactical observations and validated agent commands.                                                                                          |
| `application/playback.ts`                  | Isolated replay timeline, frame splitting and seeking through recorded commands.                                                                      |
| `agent/`                                   | Observation-driven baseline policy and bounded, versioned benchmark episodes.                                                                         |
| `ui/NightPassageApp.tsx`                   | Input collection, bounded realtime accumulator, browser event binding, HUD and decision screens.                                                      |
| `ui/ReplayViewer.tsx`                      | Spectator file loading, playback controls and existing renderer integration.                                                                          |
| `ui/presentation/`                         | Renderer lifecycle, viewport sizing, ground projection and 2D/2.5D drawing of confirmed state. Damage and collision stay in rules.                    |
| `tests/simulation/night-passage-policy.ts` | Legal-command verification pilot. It is not a player-facing autoplay feature.                                                                         |

## Chronicle ownership and live recovery

`application/chronicle.ts` owns immutable chronicle values. Accepted commands return a
successor; rejected commands retain the original value. Published state is deeply frozen
and typed as `StateView`. The linked journal, requested-tick counter and controller identity
are private; controller metadata is validated at construction. Observation trials can discard
successors without committing them. Observations receive the permitted frame size rather
than inspecting the journal. Ordered, frozen command copies serve isolated playback.

`application/live-chronicle.ts` owns the current live chronicle, storage status, original-byte
preservation and replacement ordering. Its storage interface has browser and controlled test
adapters. Decisions and combat phase transitions save immediately; other combat saves retain
the three-second cadence. Pause, visibility, pagehide, teardown and spectator navigation flush
through the same operation. Input collection, rendering and browser event binding stay in the UI.

Unreadable saves and read failures suppress automatic writes until explicit valid replacement.
Imports reconstruct before adoption. Reset requests original/current downloads before adoption;
a download request is not proof of durable disk storage. Write failures leave accepted progress
playable and exportable, and retain known original bytes until a replacement write succeeds.
Failed imports and failed backup requests retain the existing chronicle and recovery state.

Playback owns its independent cursor and frozen snapshots and has no live storage capability.
Replay format, rules/content/score identities, controller encoding, packed frames and requested
tick accounting are unchanged. Unused requested ticks after combat ends still occupy replay time.

Verification covers nested mutation attempts, pure observation trials, canonical legacy/current
replay bytes, controller identity, generated legal histories at production replay limits, save
cadence, recovery failures and retry. Browser journeys retain import/export/reset/reload,
failed replacement recovery and spectator save isolation. These are technical contracts, not
visual acceptance.

Enemy stats and guardian pattern definitions live in `domain/encounter-content.ts`. `domain/encounters.ts` owns enemy decisions and hazard consequences. `domain/threats.ts` produces the same geometric shapes used by damage and `ui/presentation/threats.ts`; a warning is not an independent approximation of a hit. `domain/effects.ts` owns damage, charge accounting, elemental effects and bounded duos. `ui/audio.ts` is an optional, replaceable presentation consumer.

## Combat audio feedback

`ui/audio.ts` reads confirmed state transitions without changing combat, RNG or
replay. The app submits only live combat steps, never save restores. Enemy damage
uses five equipped-weapon palettes: a layered sword impact, a higher spear tone,
a low shield thump, a short bright bow response, and a brief fist impact. A kill
adds a rising accent. Player damage, defeat, dash and chamber clear use separate
envelopes. A four-millisecond attack avoids starting tones at full gain. No
external sound file is required; the envelope definitions are authoritative.

A 45 ms throttle coalesces rapid ordinary impacts; danger, hurt and defeat bypass it.
Each confirmed transition emits at most two cues, danger first, and simultaneous
enemy hits coalesce into one impact. The live mixer caps overlap at six voices
and evicts lower-priority voices when needed. Muting stops current sources and
zeros the output bus immediately; close releases the Web Audio context. Testing
under `tests/browser/night-passage-audio.spec.ts` verifies envelope synthesis,
finite waveforms, silent tails, and mute/unmute lifecycle without requiring
committed audio binaries.

## Blessing draft variety

`domain/boon-offers.ts` generates reward choices for ordinary chamber, trial,
and market audiences. It shuffles the eligible pool with the run RNG, reserves one
empty action slot if available, then selects candidates with different slots until
three choices are present. An eligible duo may occupy one choice without counting
toward empty-slot reservation. The five patrons remain available, including
replacements and rank-ups. Patron caps and duo prerequisites filter eligibility
before the draw. Upgrade shrines draw only owned, uncapped regular boons, falling
back to 45 gold on exhaustion.

The 2026-10-13 comparison used the same 512 RNG seeds across three loadouts for
the rules-3 and rules-4 drafts. Repeated slots and empty-slot droughts disappeared,
while distinct offer combinations decreased: broader slot choices traded away
combinatorial variety. These controlled draws do not establish human enjoyment,
balance or equal patron probabilities. `tests/simulation/night-passage-rewards.test.ts`
regenerates the comparison under ignored `test-results/night-passage-rewards/`.

`src/games/night-passage/domain/boon-offers.test.ts` covers draft determinism,
slot diversity and shrine rank-ups. Current rules 5 and retained
rules 4 use this draft; older rules 1–3 replays are rejected for reconstruction
and preserved for export/recovery, following the [accepted-command replay decision](decisions/0002-reconstruct-from-accepted-commands.md).

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
advanced rules and content to version 3; the later blessing-draft delivery introduced rules 4.

To add terrain, extend `LayoutId` and the layout catalog together. Keep the entry
clear, preserve navigable gaps, separate reinforcement sites from cover and hazard
centers, and retain enough distant sites for a five-enemy wave anywhere the player
can stand. Catalog tests check geometry and navigation; lifecycle tests check route
promises, wave stability and safe entry. Legal campaigns and browser route/save
journeys remain the playability gates. The four renderer captures are controlled
layout comparisons, not evidence of human combat balance. No renderer or native
asset changes are part of this slice.

Pillar spacing and radii are tuned so enemy steering navigates freely across all
81 entry/spawn endpoint pairs in each layout (324 paths total) without oscillation.
All 15 weapon/seed campaign simulations encounter each layout and defeat all four
guardians. The layout browser journey covers announced terrain, selected geometry,
export/import, and paused reload.

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

The browser parity matrix (`tests/browser/night-passage-parity.spec.ts`) covers
85 controlled rendering cases across all five patrons' casts/calls, patron-marked
projectiles, attack patterns, four hazards and concurrent statuses. Pixel probes check
threat interiors and safe space, while paused draws ensure snapshot stability. Five
legal campaigns render 32 chamber entries and victories for each weapon across all
four regions. The [combat-mark review](../art/assets/night-passage/combat-marks.md)
retains a matching before/after comparison.

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

Native checks cover authored hero frames, weapon vertices at three bow draw
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
surface agreement from visual inspection. Browser coverage exercises all
sixteen clips, real actor activation, matching native/fallback combat views at
desktop and mobile widths, independent paused poses and reduced motion. The native
journey compares saved and deliberately edited masters to delivered surfaces.

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

Rules copy the bounded active state per command. Chronicle history uses private persistent linked entries so appending does not copy the full history. Identical adjacent frame inputs pack into at most two-second commands. Export reverses that history into a linear replay and encodes frame inputs as `[ticks, x, y, aim, buttonMask]` tuples without changing numeric values. Supported identities use the same replay envelope v2:

| Rules             | Content                   | Score                   | Status                                    |
| ----------------- | ------------------------- | ----------------------- | ----------------------------------------- |
| `night-passage-5` | `night-passage-content-4` | `night-passage-score-2` | Current; difficulty tiers and speed bonus |
| `night-passage-4` | `night-passage-content-3` | `night-passage-score-1` | Supported original behavior and score     |

Rules 1–3 histories are rejected and remain downloadable until explicit replacement. Import
reconstructs accepted commands; it never reinterprets older commands as current rules. Live
persistence and recovery are owned by the [live chronicle](#chronicle-ownership-and-live-recovery).
Rules and content changes that alter replay meaning require explicit version bumps.

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

## Delivered 2.5D campaign

The 2.5D refinement milestone delivers a complete campaign across all four regions:

- **Authored characters & weapons:** 16-clip masked hero, five held weapon identities with socket attachments and matching animations, four ordinary enemy families with draw batching, and four regional guardians with distinct pattern mappings and phase transitions.
- **Authored environments:** All four regional kits—Root Sepulcher, Drowned Archive, Cinder Court, and Starless Gate—replace earlier blockouts with native boundary, pillar, and lantern geometry.
- **Readability & presentation:** 26 SVG symbols in `Artwork.tsx` for choices and loadouts; five raised patron light forms; ground threat telegraphs on transparent decals; reduced motion support.
- **Verification & evidence:** The 2026-10-13 audit at `fc7abf6` (rules 4 / content 3) recorded one continuous automated bow UI campaign under virtual time: 32 chamber entries, all four guardians defeated, and chronicle reload. Rune audits covered Thorn, Comet, and Moth boundaries. The [campaign receipt](evidence/night-passage-campaign.json) retains compact results, source pins, and image hashes. Retained visual evidence includes [first guardian](../art/assets/night-passage/campaign/region-0-warning.png), [last guardian](../art/assets/night-passage/campaign/region-3-warning.png), and [victory](../art/assets/night-passage/campaign/victory.png).
- **Native coverage:** The [hash audit](evidence/night-passage-native-audit.json), dated 2026-10-13 at the same revision, checked all 14 source/model receipts and 97 retained evidence files without missing deliveries or mismatched pins. It revalidated historical native proofs without a fresh Blender run.
- **Evidence limits:** Visual records are agent self-review, without independent aesthetic acceptance or human combat-feel testing. The automated campaign does not establish human pacing or real-time performance; high-DPI and cross-device performance remain unmeasured.

The full dated reward comparison and delivery reports remain recoverable with
`git show 9e20c67a92a2fcc15a677afd698141e931a6d88d:docs/engineering/night-passage.md`.

### Compatibility and extension

- Seeded rules and validated command replay remain preserved. Renderer changes never consume rules RNG or alter combat timing.
- Adding weapons, enemies, regions, or threat shapes follows the ownership table and content contracts; rules changes bump version identities explicitly.
- Select affected application, browser, geometry and native checks under [verification contracts](checks.md#gate-selection). Use full suites for releases, major refactors or broad risk.
