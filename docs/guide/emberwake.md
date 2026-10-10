# Emberwake: follow the lantern road

Choose **Emberwake · Diablo II** in the workshop, or open `/?game=diablo2`. Choose a hero and seed, then **Begin journey**. The refuge is safe: buy supplies and take the first road into Briarfen.

## Three heroes

| Hero                | Play style                                                         | Skills                                      |
| ------------------- | ------------------------------------------------------------------ | ------------------------------------------- |
| Rook · Barbarian    | Close distance and cleave packs; strength increases melee damage.  | Cleave, Leap strike, War cry                |
| Mira · Sorceress    | Cast from range, freeze pursuers and teleport to clear ground.     | Fire bolt, Frost nova, Teleport             |
| Silas · Necromancer | Pierce lines, raise slain enemies as allies and weaken resistance. | Bone spear, Raise skeleton, Withering curse |

Your first skill begins learned. Skills two and three unlock at levels 2 and 3; spend earned points in **Character** to learn them. Each level grants five attribute points and one skill point. A level also restores life and mana. Skill ranks increase damage; Raise skeleton ranks increase the army limit, up to five allies. Raising requires an unconsumed, non-boss enemy body within five paces.

## Four connected acts

Four lanterns imprisoned Lucent, a founder who tried to steal the dawn. Their theft draws you from the refuge toward the furnace where they were forged.

| Map               | Objective                                                 | Final boss                                                                |
| ----------------- | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| Briarfen          | Recover the fen ember; light two ward stones.             | The Briar Widow: poison warnings and a close-range blast.                 |
| Saltreach         | Traverse the glass city; kindle two sun obelisks.         | The Glass Regent: missile volleys and targeted fire.                      |
| Hollow Bells      | Silence two funeral bells beneath the monastery.          | The Bellkeeper: cold warnings and summoned guards.                        |
| The First Furnace | Restore both furnace anchors and break the lantern chain. | Lucent, the Unlit King: overlapping fire warnings intensify at half life. |

Each map has connected rooms and passages, optional caches, enemies and elites, exploration fog, a waypoint, two ward objectives and a boss arena. Defeat guards beside a ward before interacting. The boss remains protected until both wards activate. After the boss falls, collect its guaranteed unique loot and ember rune, then use the **road onward**. The final road completes the story. Cleared fields and attuned waypoints persist for the journey.

## Controls

| Action         | Control                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Move           | WASD/arrows, or click reachable ground.                                                                                         |
| Basic attack   | Click an enemy to approach and attack automatically; Space targets the nearest visible foe. Move to cancel pursuit.             |
| Cast           | Aim with the pointer and press Q/E/R; right-click casts the selected skill. Hotbar buttons also cast.                           |
| Interact       | F or **Interact** beside a ward, cache, waypoint, grave or exit.                                                                |
| Potions        | 1 for life, 2 for mana, or click the belt buttons. Each restores 60% of the maximum resource.                                   |
| Run            | Shift or the Walk/Run button toggles running. Running drains stamina; walking/resting restores it.                              |
| Return to town | T or **Town portal** when no active enemy is within three paces. Town heals; the return portal keeps your exact field position. |
| Inspect        | I inventory, K character/skills, J journal, Tab minimap, Esc pause/close.                                                       |

Boss warning circles give time to move before damage lands. Resistances reduce elemental damage; armor reduces physical damage. Cold slows movement, and curse lowers monster resistance. Walls block movement and missiles. The game pauses for inventory/character/journal panels and while the browser is unfocused or hidden. On touch screens, click/tap movement, enemy targeting and the visible spell/potion/interaction controls cover the gameplay loop.

## Loot, equipment and recovery

Walk over drops to collect gold, potions, runes and equipment. Your backpack is an **8×4 grid**; larger items occupy multiple cells. Full backpacks or belt slots leave drops on the ground. Equip items in Inventory; swapping needs enough room for the previous item. Strength can limit armor use. At the refuge, sell unwanted loot, store up to 64 items and spend runes on equipped item sockets. Weapon runes add damage, armor runes add armor, and every rune adds elemental resistance.

Normal, magic, rare and unique loot rolls are seeded. Affixes grant vitality, energy, resistance and melee life leech. Bosses guarantee a unique item and rune. The quartermaster sells life/mana potions and mystery gear; failed purchases spend neither gold nor randomness.

Death ends combat immediately. **Return to the refuge**, resupply, then recover your grave by interacting beside it. Death leaves 25% of carried gold at the grave and removes 10% of the current level's experience threshold, without lowering your level. Equipment stays equipped in this simplified baseline. A second death retains the existing grave and adds the new lost gold to it.

## Saves and mods

The game autosaves locally at accepted decisions and every five simulation seconds. Reloaded field journeys begin paused. **Export journey** downloads a portable replay including the seed, accepted commands, rules version and exact content pack. Imports validate and reconstruct the journey; malformed or unsupported saves report an error and preserve the current game. If storage is blocked, export manually.

The [package README](../../packages/diablo2/README.md#make-content-mods) describes editable hero, spell, item, boss and map definitions. Use **Export content pack**, edit the JSON, and **Load content mod** to begin a new journey. Existing journeys retain their original content.

This baseline follows Diablo II's class/build, combat, exploration, loot, town and act progression ideas with an original story and assets. Reference: [Blizzard's Diablo II manual](https://ftp.blizzard.com/pub/misc/Diablo%20II%20Manual.pdf). It simplifies inventory/equipment slots, hit calculations, potion timing and corpse recovery; it has no exact frame tables, full skill trees, multiplayer, mercenary hiring, durability, difficulty tiers, trading, set-item bonuses or runeword recipes. It is a playable starting point for mods, not a complete Diablo II reproduction.
