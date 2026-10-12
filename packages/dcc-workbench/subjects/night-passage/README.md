# Night Passage · lantern bearer and armory

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
acceptance. Enemies, guardians and environments remain blockouts.
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
