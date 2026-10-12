# Night Passage · gameplay asset sources

The first native gameplay asset for `/?game=night-passage` is a masked traveller
with a pointed teal hood, asymmetric mantle, fitted sleeves and planted boots.
Broad cloth planes and an ivory face keep the hero readable in the angled arena.
This is an original stylized character, with deliberately simple materials.

## Authority and delivery

- `hero/source.blend` owns editable geometry, weights, materials, fitted armature
  and sixteen saved actions. A single character owns its motions in this first batch;
  there is no separate retargeting master.
- `authoring/` contains fresh-candidate construction, saved-source export,
  native review and disposable edit verification. Ruff and strict mypy include it.
- `../../assets/night-passage/hero.glb` is the deformation-only browser delivery.
  `hero.json` pins the master, delivery and authoring scripts, clip timing and
  per-frame floor/IK audits. `visual-review.json` preserves the first hero review;
  `weapons-review.json` records the current hero/weapon batch with fresh hashes.
- `../../../../src/games/night-passage/ui/presentation/scene/hero.ts` owns loading,
  tick-based motion sampling and cleanup. Rules and replay never depend on it.

`CTRL_body` and `CTRL_L` / `CTRL_R` control body height and feet. Torso, head,
arms and cape are editable FK bones. Export evaluates these saved actions on their
original rig and bakes a separate deformation skeleton. It does not reconstruct
the mesh or rerun motion authoring. The recipe is a starting candidate; saved
native repairs remain authoritative.

The sixteen clips are **idle, run, dodge, slash, thrust, shoot, guard, punch,
punch_left, cast, death**, plus **sword_special, spear_special, shield_special,
bow_special and fists_special**. Idle/run loop; action contact is at normalized phase **0.45**. The browser
maps confirmed windup and recovery to these phases; pause holds the pose. Reduced
motion uses stable poses. Death holds the final collapse because rules stop after
defeat. Specials have separate saved body performances; fists follow the right/left/right
three-hit rules cycle. The additional left socket supports paired gauntlets.

Native coordinates are X-forward/Z-up; glTF is X-forward/Y-up. The model scales
by 28 in the arena. `weapon_socket` preserves browser X-forward/Y-up at rest;
`weapon_socket_L` supports the other fist.
Grip-local weapon meshes attach with inverse scale so their game-unit dimensions
remain unchanged. Actor position and facing remain rules-owned. Run is in place:
the audit does not claim world-space foot locking at every movement speed or
direction. Dedicated strafe/backpedal and hit-reaction clips remain future polish.

## Reproduce and extend

Use the pinned Node/Python runtimes. On this Mac, request approved execution for
native/browser launching. The bundled Blender path below is local; another
installation can run the same Python entrypoint. Output paths must be fresh.

```sh
nvm use
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/hero_delivery.py -- export --source packages/dcc-workbench/subjects/night-passage/hero/source.blend --output test-results/hero-export
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/hero_delivery.py -- review --source packages/dcc-workbench/subjects/night-passage/hero/source.blend --output test-results/hero-review
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/hero_delivery.py -- verify --source packages/dcc-workbench/subjects/night-passage/hero/source.blend --output test-results/hero-native
NIGHT_PASSAGE_NATIVE_RESULTS=test-results/hero-native npm run test:browser -- tests/browser/night-passage-hero.spec.ts tests/browser/night-passage-scene.spec.ts
npm run check:full
```

Use `bootstrap --source <fresh-candidate.blend>` only for new construction.
For refinement, edit and save the existing master, export to a new directory,
inspect enlarged clay/material views and actual play, then replace the owned
delivery. Never use bootstrap to overwrite saved artist edits.

Verification copies the master, changes a cast head key by 0.3 radians, saves and
reloads it, then exports and compares native surfaces to Three.js playback.
Every authored 30 fps frame samples 16 vertices per named mesh. Original source,
delivery and geometry/weights remain unchanged during this proof. Arrays are
regenerable temporary evidence under `test-results`, not committed fixtures.

The browser review records unretimed 1× playback and six phase images per clip.
Native front/side/rear clay, material portrait, action poses, desktop/narrow arena
and this playback are separate visual evidence. Passing checks is not user art
acceptance. The ordinary enemy batch below adds four native families; the four
authored guardians are described below, followed by the first two environment kits.
Precise two-hand string contact and directional movement remain polish opportunities.

## Five weapon identities

`weapons/source.blend` owns six grip-root hierarchies: `weapon_sword`,
`weapon_spear`, `weapon_shield`, `weapon_bow`, `weapon_fists_R` and
`weapon_fists_L`. Select a root and its children in the Outliner, then isolate it
with Local View to edit one armament. All roots stay at the grip origin for export;
the authoring scene is not a laid-out display rack. Mesh vertices and materials
are editable independently of the construction script.

The broad Dawnless blade, leaf-headed Wayfarer spear, enamel Oathkeeper kite
shield, recurved Far Lantern bow and paired Ember gauntlets have distinct
silhouettes and restrained materials. The armory uses game units, unlike the
hero's 28× model scale. Do not reset imported axis-conversion transforms. The
`bow_string` mesh has an editable `Draw` shape: 0 rests, 1 draws back 13 units.
The runtime translates the nocked shaft/head by that same amount, hides them on
release and restores them at rest. This visual morph does not author damage.

`weapons.glb` and `weapons.json` pin the native source and recipe. Static geometry
and a dense morph keep the existing delivery checker applicable. The production
`scene/weapons.ts` adapter owns these resources, binds both sockets and follows
the hero sampler's phase. Failed or late loads and repeated disposal retain the
existing fallback ownership contract.

```sh
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/weapon_delivery.py -- export --source packages/dcc-workbench/subjects/night-passage/weapons/source.blend --output test-results/weapons-export
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/weapon_delivery.py -- review --source packages/dcc-workbench/subjects/night-passage/weapons/source.blend --output test-results/weapons-review
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/weapon_delivery.py -- verify --source packages/dcc-workbench/subjects/night-passage/weapons/source.blend --output test-results/weapons-native
NIGHT_PASSAGE_NATIVE_RESULTS=test-results/hero-native NIGHT_PASSAGE_WEAPON_RESULTS=test-results/weapons-native npm run test:browser -- tests/browser/night-passage-hero.spec.ts tests/browser/night-passage-scene.spec.ts
```

The weapon proof extends the sword tip in a disposable copy, saves/reloads it and
exports it. Browser comparison checks every native and delivered vertex at Draw
0, 0.5 and 1, allowing normal-driven vertex splitting. Authoritative source and
delivery hashes must remain unchanged. The production actor review records all
five attacks and specials using legal commands at 60 rules ticks per second,
with windup/contact/rest captures. Keep the small review sheets and 1× movie;
regenerate bulky sampled arrays instead of committing them.

## Ordinary enemy family

`enemies/{hunter,archer,brute,witch}/source.blend` owns each enemy's editable
geometry, materials, fitted skeleton and four saved clips. The deliveries are
`enemy-{kind}.glb` and `enemy-{kind}.json` in the same asset directory as the hero.
Each receipt pins its native source, delivery and `enemy_*.py` authoring scripts.
The constructor makes fresh candidates; export reads the saved master.

The archer's nondeforming `CTRL_draw` drives the drawing hand through a two-bone
IK chain; its orientation helper keeps the hand aligned with the string. The
brute's saved attack lifts the maul through the shoulder before the contact slam.
`enemy_motion.py` records these reviewed saved-source repairs and the hunter's
joined sickle grip. Do not rerun a construction or repair recipe over subsequent
artist edits; inspect and edit the existing master instead.

The masked sickle hunter leans into pursuit; the reed-hood archer has a narrow
upright profile; the broad plated brute carries a maul; the shrouded witch floats
with a lantern. Their meshes and performances are family-specific. These are
original stylized opponents, not character replicas. All use X-forward native
coordinates and the same 28× arena scale as the hero, before the existing enemy
radius scale. Ground position and facing remain rules-owned.

Each delivery has `idle`, `run`, `attack` and `stagger`. Idle/run loop; the attack's
contact is at normalized phase 0.45. The browser maps the current enemy windup to
that contact, then settles over the first 18 cooldown ticks before returning to
locomotion. The archer's `Reed_arrow` mesh hides from contact through settling
and returns at rest; the gameplay projectile remains rules-owned. Raw native clip
playback does not apply this browser visibility cue. This visual recovery does not stop movement or change the rules
cooldown. Stagger reads the existing nine-tick interruption. Reduced motion holds
stable clip poses; paused snapshots remain unchanged. Dedicated backward/sideways
locomotion and transition blending remain later polish.

`scene/enemies.ts` owns one lazy asset library per arena. Each pooled opponent has
its own cloned skeleton, mixer and materials; geometry and textures remain
library-owned. Hit flash cannot tint another opponent. Missing/incomplete assets
keep the procedural fallback, and late loads after disposal release their owned
resources. Reusing a pooled actor resets movement observation across run, chamber
and enemy identity. The guardian adapter is separate; the four authored guardians are described below.

Before cloning, the renderer batches compatible opaque meshes by material and
keeps the nocked arrow separate. Each cloned rig shares one private skeleton
across its surfaces. This is derived runtime work only: editable native mesh
names, geometry, materials, clips and delivered GLB files remain unchanged.

Use a fresh output directory for every operation; repeat with each saved kind:

```sh
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/enemy_delivery.py -- export --source packages/dcc-workbench/subjects/night-passage/enemies/hunter/source.blend --output test-results/enemy-hunter-export
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/enemy_delivery.py -- review --source packages/dcc-workbench/subjects/night-passage/enemies/hunter/source.blend --output test-results/enemy-hunter-review
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/enemy_delivery.py -- verify --source packages/dcc-workbench/subjects/night-passage/enemies/hunter/source.blend --output test-results/night-passage-enemies/native/hunter
```

Native edit evidence is generated under
`test-results/night-passage-enemies/native/{kind}/`; the browser comparison uses
`NIGHT_PASSAGE_ENEMY_RESULTS=test-results/night-passage-enemies/native` with
`tests/browser/night-passage-enemies.spec.ts`. It compares the published and
saved-edited deliveries to Blender-evaluated surfaces. Keep sampled arrays as
regenerable verification output. The
[enemy visual review](../../../../docs/art/assets/night-passage/enemies.md)
records the representative clay review, play-scale readability and remaining art
limits separately from native agreement.

## Bellwarden

`guardians/bellwarden/source.blend` owns the first guardian's hollow bell shell,
articulated frame, fitted humanoid IK controls and six saved actions: `idle`,
`run`, `sweep`, `rain`, `wheel`, `stagger`. `GuardianRig` uses `CTRL_body`,
`CTRL_L`/`CTRL_R`, FK limbs, `head`, and a separate `bell` suspension joint.
The existing humanoid leg fitter is reused; the construct's meshes and three
attacks are authored specifically for it. There is no cross-character retargeting
claim. Native X-forward/Z-up becomes glTF X-forward/Y-up, at 28× model scale
before the actor's radius scale.

`guardian_delivery.py` reads the saved master and bakes a deformation skeleton.
`guardian_form.py` and `guardian_rig.py` construct fresh candidates only.
`guardian_edit.py` records the first review's neck/attack repair; do not rerun it
over subsequent artist action edits. `guardian_review.py` renders native views
and verifies a disposable saved sweep head-key edit. Receipts pin all contributing
construction/export scripts; temporary vertex samples are never runtime inputs.

```sh
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/guardian_delivery.py -- export --source packages/dcc-workbench/subjects/night-passage/guardians/bellwarden/source.blend --output test-results/bellwarden-export
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/guardian_delivery.py -- review --source packages/dcc-workbench/subjects/night-passage/guardians/bellwarden/source.blend --output test-results/bellwarden-review
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/guardian_delivery.py -- verify --source packages/dcc-workbench/subjects/night-passage/guardians/bellwarden/source.blend --output test-results/night-passage-bellwarden/native
NIGHT_PASSAGE_GUARDIAN_RESULTS=test-results/night-passage-bellwarden/native npm run test:browser -- tests/browser/night-passage-guardian.spec.ts
npm run check:full
```

Every operation requires fresh output paths. Native comparison samples all 237
saved 30 fps frames across six clips and 16 vertices per named mesh. A separate
floor audit evaluates every surface vertex and the planted-foot targets. The
[visual review](../../../../docs/art/assets/night-passage/bellwarden.md) separates
source/export agreement, play-scale appearance and remaining art limitations.

## Undertow

`guardians/undertow/source.blend` owns the second guardian's joined tide-creature
body, pale throat, shellback, asymmetric shoulder fins and forked tail. The six
saved actions are `idle`, `run`, `charge`, `volley`, `pulse`, `stagger`.
`GuardianRig` reuses fitted humanoid foot IK and adds `fin.L`, `fin.R` and `tail`
FK joints. `guardian_undertow.py` constructs fresh candidates only; use
`bootstrap --kind undertow` solely with a new source path. Do not rebuild over
artist edits. Export and review select the saved scene's `guardian_kind`.
`guardian_catalog.py` holds the shared clip identities, and the existing delivery
and review modules evaluate the saved master unchanged.

```sh
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/guardian_delivery.py -- export --source packages/dcc-workbench/subjects/night-passage/guardians/undertow/source.blend --output test-results/undertow-export
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/guardian_delivery.py -- review --source packages/dcc-workbench/subjects/night-passage/guardians/undertow/source.blend --output test-results/undertow-review
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/guardian_delivery.py -- verify --source packages/dcc-workbench/subjects/night-passage/guardians/undertow/source.blend --output test-results/night-passage-undertow/native
NIGHT_PASSAGE_GUARDIAN_RESULTS=test-results/night-passage-bellwarden/native NIGHT_PASSAGE_UNDERTOW_RESULTS=test-results/night-passage-undertow/native npm run test:browser -- tests/browser/night-passage-guardian.spec.ts
npm run check:full
```

Use fresh output directories. Undertow's saved-copy edit changes `head` at frame
10 in `charge`, preserving mesh and weights. Native/browser comparison covers
all 237 saved frames and 16 probes per named mesh. The shared runtime activates
region 1 at the same 28× model scale and rules radius scaling as Bellwarden.
Rules still own the charge's travel and danger footprint. The
[visual review](../../../../docs/art/assets/night-passage/undertow.md) records
native, playback and combat-scale self-review separately from agreement checks.
Generalizing the exporter preserved Bellwarden's model bytes; its current export
receipt was refreshed, while its historical review remains unchanged.

## Ash Regent

`guardians/ashregent/source.blend` owns the crowned furnace construct, ember grate,
faceted shoulder armor, split mantle and hooked cinder blade. Its saved clips are
`idle`, `run`, `cross`, `rain`, `volley`, `stagger`. The fitted humanoid foot IK is
reused, with FK limbs, head and cloth. `guardian_ashregent.py` constructs fresh
candidates only (`bootstrap --kind ashregent` with a new path). `add_regalia` and
`author_attacks` record the reviewed shoulder/mantle and raised-rain treatment;
do not rerun them over subsequent artist edits. Export evaluates the saved master.
The shared catalog, delivery, review and runtime modules add no second pipeline.

```sh
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/guardian_delivery.py -- export --source packages/dcc-workbench/subjects/night-passage/guardians/ashregent/source.blend --output test-results/ashregent-export
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/guardian_delivery.py -- review --source packages/dcc-workbench/subjects/night-passage/guardians/ashregent/source.blend --output test-results/ashregent-review
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/guardian_delivery.py -- verify --source packages/dcc-workbench/subjects/night-passage/guardians/ashregent/source.blend --output test-results/night-passage-ashregent/native
NIGHT_PASSAGE_GUARDIAN_RESULTS=test-results/night-passage-bellwarden/native NIGHT_PASSAGE_UNDERTOW_RESULTS=test-results/night-passage-undertow/native NIGHT_PASSAGE_ASHREGENT_RESULTS=test-results/night-passage-ashregent/native npm run test:browser -- tests/browser/night-passage-guardian.spec.ts
npm run check:full
```

Use fresh output directories. Native/browser comparison covers all 237 saved
frames and 16 probes per named mesh. The disposable saved edit changes `head`
at frame 10 in `cross` while retaining mesh and weights. Region 2 uses 28× model
scale before radius scaling; rules own the crossed lanes, rain and fan release.
The [visual review](../../../../docs/art/assets/night-passage/ashregent.md) records
native shape, playback and combat-scale evidence. Earlier guardian models were
re-exported byte-identically; only their current script receipts were refreshed.

## Unlit Sovereign

`guardians/sovereign/source.blend` owns the faceless porcelain mask, three broken
orbital crown arcs, silver shoulders and divided violet vestments. Seven saved
clips cover `idle`, `run`, `cross`, `rain`, `pulse`, `wheel`, `stagger`; the final
region has four attack patterns. `GuardianRig` reuses fitted humanoid foot IK
and adds an FK `halo` joint for the wheel gesture. `guardian_sovereign.py`
constructs fresh candidates only (`bootstrap --kind sovereign` with a new path).
Export evaluates saved geometry and keys without reconstructing the master.
The shared catalog, exporter, review and runtime accommodate the larger clip set.

```sh
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/guardian_delivery.py -- export --source packages/dcc-workbench/subjects/night-passage/guardians/sovereign/source.blend --output test-results/sovereign-export
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/guardian_delivery.py -- review --source packages/dcc-workbench/subjects/night-passage/guardians/sovereign/source.blend --output test-results/sovereign-review
packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python packages/dcc-workbench/subjects/night-passage/authoring/guardian_delivery.py -- verify --source packages/dcc-workbench/subjects/night-passage/guardians/sovereign/source.blend --output test-results/night-passage-sovereign/native
NIGHT_PASSAGE_GUARDIAN_RESULTS=test-results/night-passage-bellwarden/native NIGHT_PASSAGE_UNDERTOW_RESULTS=test-results/night-passage-undertow/native NIGHT_PASSAGE_ASHREGENT_RESULTS=test-results/night-passage-ashregent/native NIGHT_PASSAGE_SOVEREIGN_RESULTS=test-results/night-passage-sovereign/native npm run test:browser -- tests/browser/night-passage-guardian.spec.ts
npm run check:full
```

Use fresh output directories. Sovereign agreement covers all 280 saved 30fps
frames and 16 probes per named mesh; the earlier guardians retain 237 frames.
A disposable saved edit changes `head` at frame 10 in `cross`, preserving mesh
and weights. Region 3 uses the shared 28× model scale before radius scaling.
Rules own every attack footprint and release. The
[visual review](../../../../docs/art/assets/night-passage/sovereign.md) separates
native agreement, playback, combat-size appearance and remaining limitations.
All earlier guardian models were re-exported byte-identically; only their
current script receipts were refreshed, preserving historical visual evidence.

## Root Sepulcher environment

`environments/sepulcher/source.blend` owns four editable, populated empty roots:
`Floor`, `Boundary`, `Lantern`, `Pillar`. Repeated stone pieces are joined by
material to limit draw calls. `Pillar_cap` remains separately editable for the
saved-mesh edit proof. The delivery is `environment-sepulcher.glb`, with source,
model, exporter and helper hashes in the adjacent JSON receipt.

Native coordinates use Z-up; glTF exports Y-up. Floor and boundary are centered
on the arena origin and placed at game `(480, 0, 300)`. Floor top is zero.
Raised boundary vertices stay outside `abs(x) >= 448` or `abs(z) >= 268`.
Pillars have a 30-unit radial footprint and 81-unit height: runtime scales X/Z
by the rules pillar radius divided by 30, keeping Y unchanged. Lanterns have
an 8-unit radial footprint and 44-unit height. Edit within these contracts;
changing collision footprints belongs to a separate rules change.

Use the repository Blender runtime and fresh output directories:

```sh
BLENDER=packages/dcc-workbench/.runtime/Blender.app/Contents/MacOS/Blender
SOURCE=packages/dcc-workbench/subjects/night-passage/environments/sepulcher/source.blend
SCRIPT=packages/dcc-workbench/subjects/night-passage/authoring/environment_delivery.py
"$BLENDER" --background --python-exit-code 1 --python "$SCRIPT" -- export --source "$SOURCE" --output test-results/sepulcher-export
"$BLENDER" --background --python-exit-code 1 --python "$SCRIPT" -- review --source "$SOURCE" --output test-results/sepulcher-review
"$BLENDER" --background --python-exit-code 1 --python "$SCRIPT" -- verify --source "$SOURCE" --output test-results/sepulcher-native
NIGHT_PASSAGE_ENVIRONMENT_RESULTS=test-results/sepulcher-native npx playwright test tests/browser/night-passage-environment.spec.ts --project=functional --project=requires-blender
```

Publish the GLB and JSON export together after native review. Verification copies
the saved source, raises the cap's top vertices by four game units, saves,
reloads and exports that copy. The browser compares every named mesh's native
vertices with delivery geometry, accounting for normal/material vertex splits.
Original source and published model remain unchanged. Native arrays and edited
copies are disposable `test-results` evidence. The [visual record](../../../../docs/art/assets/night-passage/sepulcher.md)
retains compact native and production captures. This static kit has no animation
claims. Drowned Archive shares these placement contracts; the final two regions
still use blockout scenery.

## Drowned Archive environment

`environments/archive/source.blend` owns the second static kit: broad ink-blue
paving with recessed still-water joints, arched folio shelves, scroll capitals
and caged aqua lamps. `environment_archive.py` constructs fresh candidates only
(`environment_delivery.py -- bootstrap --kind archive --source <fresh.blend>`).
The existing saved-source exporter reads `environment_kind` from the master;
`--kind` affects construction only. The same four part roots, dimensions,
placement and edit-proof contract above apply. `Pillar_cap` stays independently
editable; other repeated detail is joined by material. The source is authoritative,
not the construction recipe. A one-unit inward saved-mesh repair fitted the scrolls
inside the 30-unit disc without changing the shaft or gameplay collision.

Repeat the export, review and verify commands above with the Archive source and
fresh output paths. `review` includes clay/material assembly, rear assembly,
column front/side/rear and lantern views. Use `NIGHT_PASSAGE_ARCHIVE_RESULTS` for
the new native proof alongside `NIGHT_PASSAGE_ENVIRONMENT_RESULTS` for Sepulcher:

```sh
NIGHT_PASSAGE_ENVIRONMENT_RESULTS=test-results/sepulcher-native NIGHT_PASSAGE_ARCHIVE_RESULTS=test-results/archive-native npx playwright test tests/browser/night-passage-environment.spec.ts --project=functional --project=requires-blender
npm run check:full
```

The [visual record](../../../../docs/art/assets/night-passage/archive.md) separates
geometry agreement, production readability and remaining art limits. Re-exporting
the Sepulcher master with the shared exporter preserved its delivered GLB bytes;
its receipt alone now pins the updated scripts. To add the next kit, retain these
part contracts, register its saved kind/builder in the native exporter and its
region/URL in `scene/environment.ts`, then extend the per-kit delivery and browser
cases. Do not introduce region-dependent collision or rules RNG into presentation.
