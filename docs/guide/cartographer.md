# Dungeon Cartographer

Choose **Dungeon Cartographer** in the game picker, or open `/?game=cartographer`.
A single Lantern Keeper explores the Sunken Archive by drafting rooms onto a square board.
The first slice has ten draftable chamber templates, four ordinary enemy types, six relics,
and the Unwritten King. An expedition contains nine rooms including the entrance and king.

## Play

Choose **Relaxed**, **Standard** or **Severe**, then **New expedition** to apply it.
Starting and maximum life are **48**, **36** or **28** respectively. Standard preserves
original gameplay; seeded rooms, encounters, rewards and combat calculations are unchanged.
The current expedition's tier appears beside Lantern Keeper, independently of the new-run selector.

- Move with arrow keys, WASD, the direction buttons, or an adjacent tile. Reach a gold
  doorway in a cleared room, then use **Explore** or **E** to draft a chamber.
- Choose one of three seeded offers. Rotate its terrain and exits before placing it.
  The Surveyor lens adds a fourth offer. Return through connected doors to choose a
  different frontier; occupied rooms never overlap.
- Select an enemy and use **Strike**, **Shove**, or **Flare**. Red marked tiles show the
  exact attacks that resolve after your action. Shoving interrupts the target's attack;
  killing it prevents its action. Movement also advances combat.
- Strike starts at 3 damage. Shove deals 2, plus 2 against an obstacle or 4 into water.
  Flare deals 4 in a clear straight line up to five tiles and costs one focus.
  Brace / Space waits and blocks 3 damage from each incoming hit.
- Rooms seal during combat. Clearing a room restores three focus. Shrines, gardens and
  archives heal 8; armories and vaults grant +1 strike damage but add an extra enemy.
- Choose one relic after clearing rooms 3, 5 and 7 (the entrance counts). Effects last
  for this expedition. Attached rooms increase threat; at 8, enemies deal +1 damage.
- Room 9 is the king's chamber. Defeat him to win. At zero life the expedition ends.
  New expeditions reset all upgrades. There is no permanent progression in this slice.

The pacing target is a short 15–20 minute expedition; human completion time and difficulty
are not yet calibrated. The automated policy and browser journey demonstrate completion,
not player enjoyment or balance.

## Save and reproduce

Current v2 expeditions save locally under `card-workshop.cartographer.v2`. Export/import carries
seed, fixed difficulty, rules version, generator version and accepted commands. Historical
`cartographer-1` v1 expeditions retain their original Standard meaning and
`card-workshop.cartographer.v1` slot. **Restore previous expedition** and **Export previous
expedition** provide explicit recovery; continuing either version preserves the other slot. Import reconstructs the game;
it does not trust a mutable state snapshot. Replays from unsupported versions are rejected.
A corrupt save remains stored while an unsaved preview runs, until the player explicitly
starts an expedition or imports a valid replay. Storage failure leaves play and export usable.

Room offers, enemy placement and relic offers use independent seeded labels. Combat outcomes
are deterministic. Rotation, selected chambers and relics are recorded decisions.

## Emberwake side dungeon

At Emberwake hero selection, check **Add The Charted Vault** before beginning a journey.
The world seed builds a nine-chamber dungeon with caches and elite patrols. Its entrance is
beside the first cache in Lantern Approach. Interact with the portal to enter and use the
entrance portal to return. It is optional and does not replace campaign wards or bosses.
The developer atlas also lists it for sandbox inspection.

Generated geometry is expanded into the content pack stored in the replay. Loading that
pack or resuming that journey preserves the exact geometry. The checkbox is available for
packs containing the original Briarfen entrance and no existing Charted Vault; imported
expanded packs already include their dungeon. Existing campaigns are unchanged unless a
new journey is explicitly started with the option enabled.

See [map generation](../engineering/map-generation.md) for shared ownership and verification.
