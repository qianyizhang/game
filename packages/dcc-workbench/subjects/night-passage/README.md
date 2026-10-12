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
acceptance. The ordinary enemy batch below adds four native families; guardians
and environments remain blockouts.
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
and enemy identity. Guardians retain their existing blockouts.

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
