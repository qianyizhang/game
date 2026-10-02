# Slay the Spire — original game

**Implemented:** Ironclad and Silent, cumulative Ascensions 0–5, three acts and all nine Act I–III boss encounters. This is an independent learning implementation with original illustrations, curated content and explicit simplifications. The user confirmed the original game; Slay the Spire 2 remains future interest.

## Reference and playable content

[Mega Crit’s overview](https://www.megacrit.com/press-kits/slay-the-spire/) establishes the deck-building, branching routes, enemies and relics. Detailed timing references below are community-maintained and were researched on 2026-10-02; they are not official engine specifications.

- **Ironclad:** 80 HP, 99 gold, five Strikes, four Defends, Bash and Burning Blood. Strength, multi-hit attacks, Block conversion, HP costs and Exhaust engines. [Character reference](https://slay-the-spire.fandom.com/wiki/Ironclad).
- **Silent:** 70 HP, five Strikes, five Defends, Survivor, Neutralize and Ring of the Snake; two extra opening draws. The curated pool supports Poison, Shivs, manual discard triggers, Dexterity and retained Block. [Character reference](https://slay-the-spire.fandom.com/wiki/Silent).
- **95 obtainable card definitions**, including shared Strike/Defend; eight additional status/curse/token definitions. **33 relics and eight potions.** Rewards and shops filter to the chosen character.
- **Three acts:** 15 connected rooms plus a boss in each. Treasure occupies row 9 and a campfire row 15. A seeded boss is chosen when its act map is generated and revealed on that map.
- **A0–A5:** A1 raises the local elite room weight by 60%; A2/A3/A4 change normal/elite/boss attack tuning; A5 restores 75% of missing HP between acts. Effects accumulate. All levels are immediately available. [Ascension reference](https://slaythespire.wiki.gg/wiki/Ascension).

## Boss counterplay

Each act chooses one of its three encounter families. Values are encoded in `content/bosses.ts` and `domain/difficulty.ts`; reactions and move selection live in `domain/enemies.ts` and `state.ts`.

| Act | Encounter        | Implemented mechanism and decision                                                                                                                                                    | Reference                                                             |
| --- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| I   | Slime Boss       | Large attack, Slimed cards, interrupt at half HP and split. Push damage before the split to weaken children.                                                                          | [Slime Boss](https://slay-the-spire.fandom.com/wiki/Slime_Boss)       |
| I   | The Guardian     | Losing the Mode Shift HP budget interrupts its move, grants Block and enters defense. Sharp Hide retaliates once per Attack card; the next shift budget increases.                    | [Guardian](https://slay-the-spire.fandom.com/wiki/The_Guardian)       |
| I   | Hexaghost        | Divider locks its per-hit amount from player HP when prepared. A fixed attack cycle culminates in Inferno, upgrading Burns.                                                           | [Hexaghost](https://slay-the-spire.fandom.com/wiki/Hexaghost)         |
| II  | The Champ        | Half-HP transition cleanses debuffs, adds Strength and leads to Execute. Prepare burst before crossing the threshold. Move weights remain simplified.                                 | [Champ](https://slay-the-spire.fandom.com/wiki/The_Champ)             |
| II  | Bronze Automaton | Artifact, two Orbs, repeated Flail/Boost cycle, Hyper Beam then a quiet turn. Orbs steal a high-rarity card from draw/discard; killing the Orb returns it.                            | [Automaton](https://slay-the-spire.fandom.com/wiki/Bronze_Automaton)  |
| II  | The Collector    | Summons/replenishes Torch Heads, buffs allies and applies the scheduled turn-four Mega Debuff. Choose between removing summons and damaging the boss.                                 | [Collector](https://slay-the-spire.fandom.com/wiki/The_Collector)     |
| III | Donu and Deca    | Alternating attacks and party buffs; killing one removes its contribution.                                                                                                            | [Donu and Deca](https://slay-the-spire.fandom.com/wiki/Donu_and_Deca) |
| III | Time Eater       | The card counter persists across turns. Card twelve finishes its pending choices, then ends the turn and grants enemy Strength. A one-time half-HP Haste cleanses and heals.          | [Time Eater](https://slay-the-spire.fandom.com/wiki/Time_Eater)       |
| III | Awakened One     | Powers feed Curiosity in phase one. The first lethal blow schedules Rebirth instead of victory; phase two adds Void and a large opening attack. Cultists flee after its final defeat. | [Awakened One](https://slay-the-spire.fandom.com/wiki/Awakened_One)   |

## Exact local timing

**Card play:** validate, pay Energy, move the card into `resolving`, run play hooks, execute ordered effects, then move to discard/Exhaust/played Powers. A resolving card cannot draw itself. Suspended choices store remaining effects and permit only their completion. Time Warp waits for those choices.

**Damage:** floor(max(0, base + Strength × scaling) × Weak × Vulnerable × attack modifiers), then apply Block. Strength applies per hit. Dexterity/Frail affect card Block; flat relic and power Block do not. Non-Attack damage uses Block unless explicitly an HP loss. Poison is an Artifact-blockable debuff; it deals stack-sized HP loss at the start of that enemy’s turn, then decreases by one. A lethal tick prevents its move. [Poison](https://slay-the-spire.fandom.com/wiki/Poison).

**Discard:** only manual/card discards trigger Reflex/Tactician. Whole-hand discard moves the entire original hand before firing those hooks, then draws the requested replacement hand. Ordinary end-turn cleanup does not trigger them. [Tactician](https://slay-the-spire.fandom.com/wiki/Tactician).

**End turn:** held damage, Ethereal cleanup, temporary Strength expiry, player end-turn powers and Constricted; clear old enemy Block except freshly interrupted Guardian defense; resolve enemy Poison and shown actions. New summons/split children wait until the next round. Fresh debuff durations survive their application phase. Death stops later effects.

**Next turn:** expire player Block unless Barricade or Blur; refill Energy, apply delayed resources, powers/relics, generate Shivs and draw. Noxious Fumes applies Poison at the start of the player turn. Enemy intent arithmetic is authoritative domain output. [Noxious Fumes](https://slay-the-spire.fandom.com/wiki/Noxious_Fumes).

**Combat end:** defeat wins ties when both sides die. Apply healing relics, gold, optional card rewards, potion rolls and elite relics. Act I/II bosses lead to a boss relic choice and the next map. Any Act III boss family can finish the run. The practice encounter factory instead ends its single encounter immediately.

## Rooms and shops

Unknown rooms use fight/treasure/shop chances initially 10%/2%/3%, increasing the missed categories and resetting the selected one. Events are the remaining outcome, do not repeat within the run, and fall back to combat if their curated pool is exhausted. Consecutive shops are excluded. [Unknown Location](https://slay-the-spire.fandom.com/wiki/Unknown_Location).

Shops guarantee two Attacks, two Skills and one Power from the selected character, with a sale card, ordinary relics, potions and escalating removal. Card rewards are optional; rare offsets and boss rarity remain explicit in `domain/rewards.ts`. [Merchant](https://slay-the-spire.fandom.com/wiki/Merchant), [Card rewards](https://slay-the-spire.fandom.com/wiki/Card_Rewards).

## Deliberate limits

Fixed representative HP, curated normal/elite encounters, local map placement and some simplified AI weights remain. A2–A4 use named per-move tuning; this is not an exhaustive numerical parity claim. Neow has four blessing categories. Events expose selected options; fatal HP-cost options are disabled. Chests have one loot scheme. Shops omit colorless cards and shop-exclusive relics. Black Blood remains Ironclad-only.

There is no Defect, Watcher, A6–A20, keys, Act IV, unlock progression or original-game seed compatibility. Relic/effect ordering is our tested local contract rather than a claim of complete commercial queue parity.

## Experiments and evidence

Compare Strength scaling with Exhaust, Poison with Shiv volume, and card discards with ordinary end-turn cleanup. The practice lab can isolate Guardian, Artifact and Time Warp; normal runs remain committed. [Workshop v3 playtests](playtests/2026-10-02-workshop-v3.md) records current automated evidence. Earlier Ironclad v2 and Emberpath reports are historical snapshots.
