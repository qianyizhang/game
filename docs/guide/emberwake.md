# Emberwake: player guide

A Diablo II-inspired action RPG study (`/?game=diablo2`). Choose a hero and seed, resupply at the refuge, and explore connected maps.

## Heroes and skills

| Hero                | Play style                      | Skills                                      |
| ------------------- | ------------------------------- | ------------------------------------------- |
| Rook · Barbarian    | Melee cleave and burst movement | Cleave, Leap strike, War cry                |
| Mira · Sorceress    | Ranged elements, crowd control  | Fire bolt, Frost nova, Teleport             |
| Silas · Necromancer | Minion armies, piercing, curses | Bone spear, Raise skeleton, Withering curse |

Start with one skill learned. Skills 2 and 3 unlock at levels 2 and 3. Each level grants 5 attribute points and 1 skill point, restoring life and mana. Raise skeleton requires an unconsumed, non-boss corpse within 5 paces (cap: 5 minions).

## Act structure and regions

Four acts, each featuring **2 outdoor regions and a 3-floor dungeon** (20 regions total):

| Act               | Outdoor regions                       | Dungeon floors 1 → 2 → 3                                                  | Boss               |
| ----------------- | ------------------------------------- | ------------------------------------------------------------------------- | ------------------ |
| Briarfen          | Lantern Approach, Drowned Grove       | Rootbound Catacombs: Root Cellars → Buried Sanctuary → Heart of the Briar | The Briar Widow    |
| Saltreach         | Caravan Reach, Shattered Oasis        | Sunken Glassworks: Sand Cistern → Glass Galleries → Regent’s Vault        | The Glass Regent   |
| Hollow Bells      | Silent Courtyard, Graveyard of Echoes | Ossuary of Bells: Sepulcher Steps → Bell Foundry → Unburied Choir         | The Bellkeeper     |
| The First Furnace | Ashen March, Cinder Crossing          | First Furnace: Slagworks → Chain Galleries → Lucent’s Crucible            | Lucent, Unlit King |

Locate ward stones in outdoor region 2 and dungeon floor 2 to unlock floor 3 stairs and drop boss invulnerability. Bosses drop guaranteed unique loot and ember runes.

## Controls

| Action      | Control                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------- |
| Move        | WASD / arrows / click reachable terrain                                                  |
| Attack      | Click enemy or press Space for nearest target                                            |
| Cast        | Q / E / R or right-click selected skill                                                  |
| Interact    | F or on-screen Interact button beside objects                                            |
| Potions     | 1 for Life, 2 for Mana; restores 60% max pool                                            |
| Run / Walk  | Shift or Walk/Run toggle; running consumes stamina                                       |
| Town Portal | T or Town Portal button (usable when clear of close foes)                                |
| Panels      | I (Inventory), K (Skills), J (Journal), Tab (Minimap), Esc (Pause/Close), F8 (Dev tools) |

## Loot, inventory, and death

- **Inventory**: 8×4 backpack grid. Items occupy 1 to 4 cells. Equip gear in Inventory.
- **Rockets and runes**: Socket runes into gear at the refuge: weapon runes boost damage, armor runes add armor, all add elemental resistance.
- **Death**: Leaves a grave with 25% of carried gold and deducts 10% of current-level XP threshold without demoting level. Equipment remains equipped. Interact with grave to reclaim lost gold.

## Saves, content packs, and sandbox

- **Persistence**: Autosaves locally every 5 simulation seconds. Export/import portable JSON replays.
- **Content packs**: JSON-based modding for heroes, skills, loot, and maps. See [package README](../../packages/diablo2/README.md#make-content-mods).
- **Developer sandbox (F8)**: Level 20 testing environment with God mode, map reveal, teleports, and cooldown resets. Saves independently from the campaign.
