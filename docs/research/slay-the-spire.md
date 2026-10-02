# Slay the Spire — original game, Ironclad

**Implemented:** original Slay the Spire's Ironclad at Ascension 0, with three full-length acts, actual card/enemy/relic identities, and a curated content pool. This replaces the earlier Emberpath hybrid. It is an independent local implementation with original illustrations, not the commercial game or a claim of complete rule/content parity.

The user confirmed the original game on 2026-10-02. Interest in Slay the Spire 2 is a possible later project; its mechanics are not mixed into this implementation.

## Reference scope

[Mega Crit’s original-game overview](https://www.megacrit.com/press-kits/slay-the-spire/) establishes the deck-building roguelike, character pools, branching routes, enemies and relics. Detailed references below are community-maintained rule descriptions, checked 2026-10-02. They support specific mechanics; the official overview alone does not establish interaction timing.

| Mechanism                 | Reference                                                                                                                                                                                                 | Implemented contract                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Ironclad start            | [Ironclad](https://slay-the-spire.fandom.com/wiki/Ironclad), [Burning Blood](https://slay-the-spire.fandom.com/wiki/Burning_Blood)                                                                        | 80 HP, 99 gold, five Strikes, four Defends, Bash, Burning Blood; heal 6 after combat                                              |
| Turn economy              | [Gameplay](https://slay-the-spire.fandom.com/wiki/Gameplay)                                                                                                                                               | Refill 3 Energy, draw 5, discard held cards at turn end; shuffle discard when draw empties; hand limit 10                         |
| Persistent attrition      | [Health](https://slay-the-spire.fandom.com/wiki/Health)                                                                                                                                                   | HP persists between rooms; Rest restores 30% maximum HP; full recovery between acts at Ascension 0                                |
| Card rarity               | [Card rewards](https://slay-the-spire.fandom.com/wiki/Card_Rewards)                                                                                                                                       | Three distinct choices or skip; rare/uncommon/common weighting, rare pity offset, rare boss rewards; Busted Crown reduces choices |
| Exhaust engine            | [Feel No Pain](https://slay-the-spire.fandom.com/wiki/Feel_No_Pain), [Dark Embrace](https://slay-the-spire.fandom.com/wiki/Dark_Embrace), [Corruption](https://slay-the-spire.fandom.com/wiki/Corruption) | Exhaust-triggered Block/draw; Corruption makes Skills free and exhausts them after their effects                                  |
| Deliberate card selection | [True Grit](https://slay-the-spire.fandom.com/wiki/True_Grit), [Headbutt](https://slaythespire.wiki.gg/wiki/Headbutt), [Burning Pact](https://slay-the-spire.fandom.com/wiki/Burning_Pact)                | Upgraded True Grit selects its Exhaust target; Headbutt selects a discard to put on draw; Burning Pact selects before drawing     |
| X cost and multi-hit      | [Whirlwind](https://slay-the-spire.fandom.com/wiki/Whirlwind), [Fiend Fire](https://slay-the-spire.fandom.com/wiki/Fiend_Fire)                                                                            | Spend all current Energy for X repetitions; Fiend Fire snapshots and exhausts the other held cards, then attacks once per card    |
| Block conversion          | [Body Slam](https://slay-the-spire.fandom.com/wiki/Body_Slam)                                                                                                                                             | Current Block is base attack damage; Strength, Weak and Vulnerable still apply; Block is not consumed                             |
| Reflection and draw lock  | [Flame Barrier](https://slay-the-spire.fandom.com/wiki/Flame_Barrier), [Battle Trance](https://slay-the-spire.fandom.com/wiki/Battle_Trance)                                                              | Retaliate on each attack hit, including blocked hits; Battle Trance prevents subsequent draw that turn                            |
| Event cost                | [Shining Light](https://slaythespire.wiki.gg/wiki/Shining_Light)                                                                                                                                          | Lose 20% maximum HP at Ascension 0 and upgrade two random cards                                                                   |

## What is playable

- **57 obtainable cards**, each with its upgrade; six additional status/curse definitions. Ironclad-only drafting, with Strength, multi-hit, Block conversion, self-damage, draw, and Exhaust interactions.
- **32 relics**, including six boss relics with actual tradeoffs, and **eight potions**. Three potion slots; potions cost no Energy.
- **Three acts**, each with 15 connected rooms and a boss. A seven-column graph shows the actual edges. Room 9 is treasure; room 15 is a campfire.
- **31 enemy definitions**, including seven elite encounter families. Slime Boss, The Champ, and Donu/Deca form the current fixed boss route.
- **Eight event definitions**, shops, escalating removal, Neow blessings, treasure, permanent upgrades, optional card rewards, victory and defeat.
- Seeded runs, autosave, portable command replays, a searchable collection, combat pile viewers and an effect log. Draw-pile inspection is alphabetical and hides future draw order.

## Enemy counterplay

| Encounter     | Rule and player decision                                                                                                                                         | Source                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Gremlin Nob   | Opens with Enrage; subsequent Skills grant Strength. Spending a turn on defense can increase later damage.                                                       | [Gremlin Nob](https://slay-the-spire.fandom.com/wiki/Gremlin_Nob)     |
| Lagavulin     | Begins asleep with 8 Block. HP damage wakes it into a stunned turn; otherwise it wakes after three sleeps. Then two attacks followed by Strength/Dexterity loss. | [Lagavulin](https://slay-the-spire.fandom.com/wiki/Lagavulin)         |
| Sentries      | Artifact blocks one debuff; staggered attacks and Dazed test damage distribution and deck cycling.                                                               | [Sentry](https://slay-the-spire.fandom.com/wiki/Sentry)               |
| Slime Boss    | At half HP its intent becomes Split. Two children each inherit remaining HP, making a well-timed burst matter. Large slimes can split again.                     | [Slime Boss](https://slay-the-spire.fandom.com/wiki/Slime_Boss)       |
| The Champ     | At half HP, clears debuffs and gains Strength before Execute. Prepare scaling before crossing the threshold.                                                     | [The Champ](https://slaythespire.wiki.gg/wiki/The_Champ)              |
| Donu and Deca | Alternating attacks, party-wide Strength/Block and Dazed; Artifact protects both. Kill order changes the fight.                                                  | [Donu and Deca](https://slay-the-spire.fandom.com/wiki/Donu_and_Deca) |

## Executable timing contract

The domain is browser-independent. [combat.ts](../../src/games/spire/domain/combat.ts) resolves card and turn effects; [enemies.ts](../../src/games/spire/domain/enemies.ts) owns enemy reactions and intent selection; [game.ts](../../src/games/spire/domain/game.ts) owns progression.

**Card play:** validate target, cost and restrictions; move the card out of hand into `resolving`; pay Energy; run play hooks; resolve the typed effects in order. Finish in discard, Exhaust, or the separate played-Power zone. The resolving card cannot redraw itself. A pending selection stores the remaining effects in state, blocks unrelated commands, and survives save/replay.

**Attacks:** floor(max(0, base + Strength × scaling) × Weak × Vulnerable × attack modifiers), then apply Block. Multi-hit attacks apply Strength per hit. Dexterity and Frail affect Block generated by card effects; flat relic/power Block is unaffected. Damage from Fire Potion uses Block; HP costs alone bypass it. Feed and Reaper still grant their kill/healing benefit on the final blow.

**End turn:** resolve held Burn/Regret; exhaust unplayed Ethereal cards and discard the remaining hand; expire temporary Strength; resolve Combust and end-turn Block/Constricted. Clear the entire enemy side’s old Block before any enemy grants fresh ally Block. Living enemies execute their shown moves in order. Newly split children wait until the next round. Debuff durations tick at the end of the enemy phase; fresh enemy-applied durations are protected for that phase.

**Next turn:** reset player Block unless Barricade; reset temporary Rage/Flame Barrier and No Draw; refill Energy; apply Demon Form and start-turn relics; draw. Enemy intent is computed by the domain using the same damage formula. It is a plan: killing an enemy or reflected damage can interrupt it.

**Combat end:** defeat takes precedence when both sides die. Restore HP from owned end-combat relics; award gold, card choices and possible potion; elites also award a relic. First/second boss rewards lead to a three-relic choice, then full healing and a new map. Defeating Donu/Deca ends Act III with victory; there is no implemented Heart fight.

## Explicit simplifications and remaining fidelity work

The complete _run loop_ is implemented, not the entire commercial content catalogue. Other characters, the rest of the Ironclad pool, colorless cards, all other bosses, Ascension levels, keys/Act IV, unlock progression and achievements are absent.

Enemy HP uses fixed representative values. Several AI move weights and selection restrictions are simplified while retaining visible intent, recognizable moves and the counterplay above. Maps use six seeded walks but a local room-placement algorithm; `?` always chooses an event rather than sometimes a fight/shop. Events have selected options, repeat locally, and fatal HP-cost choices are disabled. Neow offers four fixed blessing categories. Chests use a single loot scheme; shops draw five colored cards without original class-slot guarantees, three unique ordinary relics, and simplified relic/potion price ranges. There are no shop-exclusive relics or colorless offers.

Relic hooks use explicit local ordering, rather than claiming exhaustive commercial queue parity. Original-game seed compatibility, encounter frequencies and balance parity are not goals or verified results. A rules change requires a version bump; source research and an interaction test should accompany future fidelity fixes.

## Learning and evidence

**Build experiments:** compare Strength + Heavy Blade/Whirlwind against immediate attacks; compare Corruption + Feel No Pain/Dark Embrace against conserving Skills; compare Barricade/Entrench/Body Slam against short fights. Skip rewards deliberately and record when a smaller deck changes access to a key card.

[Current development playtest](playtests/2026-10-02-slay-the-spire.md) records the fixed-seed cohort and its limits. The [old Emberpath report](playtests/2026-10-02-emberpath.md) is historical evidence for the superseded prototype, not evidence for this version. Human pacing, difficulty, and long-term enjoyment remain playtesting questions.
