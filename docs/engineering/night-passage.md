# Night Passage architecture and delivery

Night Passage lives in `src/games/night-passage`. Its rules are independent of React, Canvas, Three.js and the other games. Rules reuse the existing seeded random and JSON narrowing utilities; presentation also uses the shared Three.js resource disposal helper. The [player guide](../guide/night-passage.md) owns controls and game behavior; the [glossary](glossary.md#night-passage) owns terminology.

## Ownership

| Module                                     | Responsibility and extension path                                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/types.ts`                          | Game vocabulary and serializable state/commands. Add a genuinely new concept here before its callers.                                             |
| `domain/content.ts`                        | Weapons, move timing, gods, boons, runes, regions, arena dimensions and content version. Add variants here when existing behavior suffices.       |
| `domain/geometry.ts`                       | Movement bounds, pillar collision and clear lines between actors.                                                                                 |
| `domain/combat.ts`                         | Player input buffering, move execution, projectiles and the fixed-step combat sequence.                                                           |
| `domain/game.ts`                           | Command validation, run lifecycle, rewards, markets and progression. `applyCommand` rejects atomically and returns the original state on failure. |
| `application/session.ts`                   | Accepted-command journal, bounded replay validation, export and reconstruction. No serialized state snapshot is trusted.                          |
| `ui/NightPassageApp.tsx`                   | Input collection, bounded realtime accumulator, save lifecycle, HUD and decision screens.                                                         |
| `ui/presentation/`                         | Renderer lifecycle, viewport sizing, ground projection and 2D/2.5D drawing of confirmed state. Damage and collision stay in rules.                |
| `tests/simulation/night-passage-policy.ts` | Legal-command verification pilot. It is not a player-facing autoplay feature.                                                                     |

Enemy stats and guardian pattern definitions live in `domain/encounter-content.ts`. `domain/encounters.ts` owns enemy decisions and hazard consequences. `domain/threats.ts` produces the same geometric shapes used by damage and `ui/presentation/threats.ts`; a warning is not an independent approximation of a hit. `domain/effects.ts` owns damage, charge accounting, elemental effects and bounded duos. `ui/audio.ts` is an optional, replaceable presentation consumer.

## Presentation lifecycle

`ui/presentation/renderer.ts` defines the game-owned renderer interface: draw confirmed state, project a client-coordinate pointer and screen-relative movement onto the combat plane, and dispose owned resources. The renderer never advances rules, draws randomness from the rules stream or mutates state. `canvas.ts` supplies the baseline implementation; `draw.ts` owns its artwork and `threats.ts` draws the shared damage geometry. `scene/` supplies the angled orthographic Three.js implementation. There is no general engine or renderer registry.

React creates one renderer per mounted arena and disposes it on unmount, independently of pause/resume and the simulation clock. Canvas owns its resize observer and pixel-density backing store (capped at 2×); the stage keeps the 8:5 arena aspect ratio. Disposal disconnects observation, drops retained state and releases the backing buffer. Repeated disposal and drawing after disposal are inert. The input layer stores client coordinates, then requests a fresh ground point for each simulation command, so resizing or future camera motion does not leave aim in stale world coordinates. Zero-size or disposed views return no ground point. Rules, seeded output and replay versions are unchanged. The 2.5D input adapter rotates screen-relative movement into ground-plane command coordinates; accepted commands still replay without a renderer.

The browser presentation journey exercises resizing at 2× pixel density, aiming at a stationary screen pointer after viewport changes, disposal on game switching and saved-state reconstruction after remounting. Existing live-combat and guardian journeys continue to cover the baseline view.

### 2.5D chamber slice

The default view is now 2.5D; **View** selects the retained 2D baseline. Switching views pauses the passage and replaces the canvas because a single surface cannot host both context types. The view preference is separate from replay. On WebGL creation failure or context loss, the game pauses in 2D and preserves the chronicle. StrictMode cleanup releases owned resources without invalidating a canvas that React will immediately reuse; detached WebGL surfaces also release their contexts.

`scene/camera.ts` owns the orthographic camera, viewport fitting and inverse projection. Rules `(x,y)` map to scene `(x,0,z)`; height is cosmetic. `room.ts` builds a replaceable raised arena and columns from the actual collision footprints. Columns fade when they occlude actors or when attack warnings need ground visibility. `ground-effects.ts` places the shared 2D threat paths on a transparent ground decal; circles, sectors, annuli and capsule lines retain their rules dimensions. Projectiles, hazard phases, player position/aim and transient cues share this plane. `actors.ts` combines the authored hero with cached enemy blockout silhouettes, five held weapon shapes, health/status cues and a crowned guardian. Grounded actor roots follow confirmed positions; reduced motion removes cosmetic sway without hiding essential warnings.

This is the **playable renderer vertical slice**, not completed art production. The room kit and enemies remain temporary procedural blockouts. Authored hero and weapon batches are delivered separately below. The campaign-parity coverage below exercises all four regions, five weapons and every spell/threat family. Measured performance remains a separate queued refinement. Region identities currently use the same architectural kit and guardian silhouette with different palettes. Native enemy, guardian and environment assets remain queued.

Verification adds projection/viewport and screen-direction scenarios, live 2.5D movement/dodge/casts, a complete ranged chamber, live melee on a reconstructed guardian approach, all four guardians' initial warning views, view switching/reload, narrow layout and real WebGL context-loss recovery. Guardian screenshots are reconstructed approaches, not complete human-played guardian victories. Review output is regenerable under `test-results/night-passage-scene/`. The original renderer slice changed no saved native files. The hero slice below adds its own saved-source and native/browser agreement evidence.

### Spell and threat readability

`scene/combat-marks.ts` draws patron projectile contours, cast/call crests,
concurrent enemy status marks and distinct transient outcomes. It reads confirmed
projectiles, cues, boons and timers; it introduces no events, wall-clock animation,
randomness, saved fields or gameplay changes. Ground marks remain on the existing
single decal. The authored hero's material does not need to flash for damage
immunity to remain visible. Warning geometry still comes from `attackShapes` and
`projectileAngles`, and hazard timing still comes from the rules.

The browser parity matrix covers **85 controlled rendering cases**. It uses explicitly controlled encounter/build snapshots,
then real `applyCommand` steps for release outcomes. It covers all five patrons'
casts/calls, patron-marked weapon projectiles, all ordinary and guardian attack
patterns, four hazards and concurrent statuses. Pixel probes independently check
selected threat interiors and safe space; repeated paused draws check stability
and input snapshots remain unchanged. This is renderer family coverage, not a
claim of human-played campaign completion. Five additional legal-command campaigns
render all 32 chamber entries and victory for each weapon: **165 checkpoints**,
covering all four regions and guardians. Each checkpoint checks painted pixels
and snapshot purity; four region captures must differ. Native activation is
observed before capture. These fast-forwarded browser campaigns complement the
live UI combat/save journeys and the three-seed campaign simulations.

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
opportunities. Enemies, guardians and environments remain blockouts. Native
checks cover every authored hero frame, all weapon vertices at three bow draw
values, and saved motion/geometry edits. Browser comparisons, unretimed playback,
real socket attachment and live chamber journeys provide separate evidence.

## Time and saves

Rules advance at 60 fixed steps per simulated second. A frame command supplies bounded movement, aim, buttons and 1–120 ticks. The browser caps accumulated work at six steps per display frame and pauses on blur/hidden state. Rendering reads confirmed state; the HUD refreshes at approximately 10 Hz and immediately after decisions.

Rules copy the bounded active state per command. Session history uses persistent linked entries so appending does not copy the full history. Identical adjacent frame inputs pack into at most two-second commands. Export reverses that history into a linear replay and encodes frame inputs as `[ticks, x, y, aim, buttonMask]` tuples without changing numeric values. Rules/content version 2 uses replay envelope v2; older prototype histories are rejected and remain downloadable. Import validates every command and reconstructs through the same interface. Rules and content changes that alter replay meaning require explicit version bumps before further delivery.

Initial content is source-authored. Arbitrary content-pack import is not implemented. Adding a sixth weapon presently requires its ID, three move definitions, validation membership through `WEAPONS`, and a presentation decision; introducing a new move family also requires combat rules and behavioral evidence. Regions select their enemy pool, guardian pattern set, hazard kind and palette. Campaign traversal follows `REGIONS.length`; `CHAMBERS_PER_REGION` currently specifies eight chambers per region. New region entries reuse the lifecycle without changing its bounds. New threat families require a shared geometry rule, presentation and damage/safe-space evidence. There is no universal game engine or arbitrary code execution in content imports.

## Verification and limits

New source is covered by the existing `src` TypeScript, lint, formatting, inventory and application-test scopes. React hook checks explicitly include this UI. Simulation policy and journeys enter the existing `tests` scopes.

```sh
nvm use
npx vitest run --project application src/games/night-passage
npx vitest run --config vitest.playtest.config.ts tests/simulation/night-passage.test.ts
npm run test:browser -- tests/browser/night-passage.spec.ts
npm run test:browser -- tests/browser/night-passage-scene.spec.ts tests/browser/night-passage-parity.spec.ts
npm run check:full
```

Browser launching requires approved execution outside the macOS command sandbox, using the existing disposable-profile harness.

The campaign simulation exercises every guardian with each weapon on three fixed seeds, including the default player seed and the cover-navigation regression seed. A separate trial scenario checks its extra wave and exact reward. Narrow command tests cover timing, dodge protection, buffered actions, distinct casts, charge, all three duos, reward eligibility, markets, death, rejection atomicity, banking and replay.

Browser journeys cover live first-room combat, cursor tracking while moving, reward decisions, pause/reload, portable saves, reconstructed victory/progression, original-save recovery, unavailable storage, export-before-reset and guardian warning rendering. Imported victory and guardian approaches are reconstruction evidence, not a live browser campaign playthrough.

The default-seed automated pilot takes roughly 6–10 minutes of simulated combat, excluding reward decisions. That is not a measured human run duration, and the earlier 25–40 minute suggestion is not yet established. The delivery is a complete lightweight gameplay study, not commercial Hades fidelity. Desktop keyboard/mouse is supported; touch controls and arbitrary mod-pack import are outside this slice. Visual review covers the authored hero and weapons, spell/status light marks, and the remaining actor/scenery blockouts. Difficulty balance and subjective combat feel still benefit from human playtesting.

## Requirement evidence

| Requested behavior                                   | Owned evidence                                                                                                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Four regions, branching rewards and guardians        | Fifteen legal campaigns traverse all four guardians; rendered reconstructed approaches expose distinct warning patterns.                                           |
| Five weapons with attack, special and dash moves     | Source move definitions plus full campaigns for every weapon; buffered-action and dodge scenarios protect ordering.                                                |
| Five patrons, casts, calls, upgrades, runes and duos | Build scenarios check distinct cast delivery, meter requirements, eligibility, replacement and all three synergy effects; campaigns exercise loadouts and unlocks. |
| Shops, healing, optional challenges and economy      | Market conservation, exact trial rewards, run banking and progression scenarios; browser victory/return/train/new-run journey.                                     |
| Save/resume and original identity                    | Versioned reconstruction, tamper rejection, real browser pause/reload/export/import/reset/recovery; original game route, characters and story.                     |
| Maintainability and expansion                        | Named module ownership, source-authored content, shared threat geometry, strict checker scope and replaceable Canvas/audio consumers.                              |

## Progressive refinement

The lightweight campaign is the playable baseline. The next delivery goal is a maintainable 2.5D campaign across all four regions, with authored gameplay assets and progressively improved combat feel. Hades informs the camera, readability and responsiveness; Night Passage retains its own characters, environments and visual identity.

Each turn selects **one general direction** and finishes one bounded, reviewable slice. Examples include graphics, seeded generation, a map, an incomplete feature, a module refactor, performance or an asset family. Tests, documentation and cleanup supporting that direction belong to the same slice. Unrelated opportunities stay queued. Begin with the observed problem and a finish line; conclude with the implemented change, verification, remaining limits and a scoped commit. A milestone can span several turns.

### Milestones

| Milestone               | Finish line                                                                                                                                                                                                                                                                                                              | Status                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Playable baseline       | Four regions, five weapons, patron spells, runes, complete run lifecycle and portable saves; rules and browser journeys pass.                                                                                                                                                                                            | Delivered; placeholder graphics and initial balance.                                            |
| Presentation boundary   | A game-owned renderer lifecycle separates view creation, resize, drawing, pointer-to-ground conversion and disposal from input, sessions and decision UI. Keep the current Canvas view usable for comparison.                                                                                                            | Delivered; Canvas baseline retained.                                                            |
| **2.5D vertical slice** | One complete chamber plays through an angled orthographic 3D scene: camera projection and inverse aiming, grounded hero/enemies, depth and occlusion handling, light/shadow, terrain, projectiles and exact ground-plane telegraphs. Validate movement, dodge, melee, ranged attacks and a guardian at actual play size. | Playable renderer, hero and five weapon identities delivered.                                   |
| **2.5D campaign**       | All four regions and guardians, five weapons and every spell/threat family work through the new presentation. Pause, resize, import/resume, context/resource lifecycle and reduced-motion behavior remain usable.                                                                                                        | Renderer parity delivered; authored assets and measured performance remain separate milestones. |
| Authored asset coverage | Replace gameplay-critical placeholders in small coherent batches: hero and motion set; five weapon identities and attacks; ordinary enemy families; four guardians; four environment kits; patron spell effects and reward/icon treatment. Track each asset's source, delivery, motion coverage and visual review.       | Hero, sixteen motions, five weapons and symbolic combat marks delivered; other families queued. |
| Campaign refinement     | Independently close combat-feel, reward/RNG variety, encounter/map variety and measured performance slices. Compare declared seeds and loadouts, review actual play and document tuning rationale.                                                                                                                       | Queued; select one direction at a time.                                                         |
| Delivery closeout       | Complete campaigns and browser journeys cover the final content/rendering; no gameplay-critical placeholder remains; extension and asset-authoring paths are documented; report technical results separately from visual self-review and user feedback.                                                                  | Pending preceding milestones.                                                                   |

The 2.5D implementation uses the existing Three.js dependency and a fixed angled orthographic camera over the authoritative two-dimensional combat plane. Elevation and animation are presentation until a separately scoped gameplay change says otherwise. Shared threat geometry must project into the scene without changing its damage footprint. Foreground scenery must not conceal actionable enemies or warnings. Establish camera, silhouette, contact and depth before decorative detail. Keep the baseline renderer through migration until campaign parity is established.

Asset work follows the [art workflow](../../skills/card-art/SKILL.md), [aesthetic rulebook](../art/art-direction.md) and [native modeling workflow](../../skills/card-art/references/native-modeling.md). Editable saved Blender masters own native geometry and animation; baked deliveries serve the browser. Reuse proven loading/export utilities while keeping game-specific presentation local. Start with one representative authored character/environment combination, verify its edit/export/consumer loop, then expand. A completed model count or passing geometry check does not establish visual quality. Compare matching views and inspect actual motion, combat readability and enlarged forms.

### Compatibility and evidence

- Preserve seeded rules and validated command replay. Renderer changes must not consume rules RNG or alter combat timing. Changes to gameplay or reward generation explicitly decide rules/content versioning and old-save recovery.
- Use `npm run check` for code, UI and rules. Changes to 3D construction, animation, rendering/export or DCC delivery require `npm run check:full` plus affected browser/native checks. Browser launches use the approved disposable-profile harness. Review screenshots and motion separately from automated results.
- Establish performance measurements on a named local browser/device, viewport and repeatable combat workload before selecting budgets or claiming improvements. Track frame timing, long stalls, loaded asset size and memory/resource cleanup as applicable. Do not convert simulation speed into a human pacing claim.
- Keep test inputs regenerable. Commit authoritative source and delivery assets, compact evidence and owned code; exclude disposable screenshots and bulky generated replay fixtures.
- Optional Astra/Sol trials own one bounded subtask within the turn's direction. Give explicit file ownership and acceptance criteria, preserve concurrent edits and compare elapsed time, rework and usable output before expanding delegation. The primary agent remains responsible for integration and verification.

The goal closes when the milestones above are delivered and their evidence is recorded. New regions, weapon counts or unrelated systems are subsequent scope, rather than reasons to expand this goal indefinitely.
