# Hearthstone Battlegrounds → Last Hearth

Status: implemented. Eight-player local lobby (human plus seven bots), six tavern tiers, 60 recruits, four tokens, five heroes, shared finite supply and combat playback. The agreed Hearthstone mode is **Battlegrounds: recruit and auto-battle**.

## Dated reference

[Blizzard's introduction, 2019-11-01](https://hearthstone.blizzard.com/en-us/news/23156373/hearthstone-battlegrounds), describes the foundational eight-player structure: recruiting, refreshing, selling, freezing, upgrades, triples, positioning and automatic battles. We use this launch-era foundation, not current seasonal content or balance.

The community [Battlegrounds reference](https://hearthstone.wiki.gg/wiki/Battlegrounds) supports larger-board-first attacks, alternating left-to-right attacks, Taunt targeting, summons joining combat, and returning the original warband afterward. It is supporting evidence, not a complete specification of every original trigger interaction. Checked 2026-10-02. Our detailed timing contract follows.

## Economy and persistent state

| Mechanism | Workshop contract                                                                          | Decision it creates                                                |
| --------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Gold      | Refreshes from 3 to 10 with round number; unused gold expires                              | Spend efficiently this round; plan purchases and sells together    |
| Tavern    | Buy 3, sell deployed minion 1, refresh 1, freeze free                                      | Keep a useful offer or search for a stronger direction             |
| Tier      | Six tiers; upgrade costs fall by 1 per new round; upgrading affects future offers          | Improve today's board or invest in tomorrow's ceiling              |
| Space     | Seven deployed minions, ten in hand                                                        | A scaling support has a real combat-slot cost                      |
| Triples   | Three non-golden copies across hand and board become one golden in hand                    | Hold an imperfect pair or sell it for tempo                        |
| Discover  | Playing a triple grants one of up to three distinct offers from the next tier, capped at 6 | Time the triple around a tavern upgrade                            |
| Position  | Reorder before combat; select a recipient for targeted Battlecries                         | Protect support and choose which effects happen early              |
| Heroes    | Targeted/tribe buffs, passive gold, recall or Taunt fortification                          | A small rule change alters the value of otherwise identical offers |

Frozen offers survive the next round; empty offer slots fill from the pool at the current tier. A paid refresh replaces the offers and clears their freeze. This follows the community [freezing reference](https://hearthstone.wiki.gg/wiki/Battlegrounds#Freezing).

All eight players use the same legal recruitment function and pool. Supply by tier is 16/15/13/11/9/7 copies per definition. Offers, hands, boards and pending Discover choices own copies. Refreshing, selling, rejecting Discover options and elimination return them. A golden owns three original copies; summoned tokens own zero. An exhausted pool may offer fewer choices, including none.

Triples preserve the sum of buffs from their three components, added to double base stats, and preserve their keywords. Playing a minion triggers its Battlecry again. Golden numeric bonuses double; summoning effects create golden tokens rather than doubling the token count. Keyword semantics stay unchanged. Buy buffs happen on purchase; summon buffs happen on deployment or combat summoning; end-recruitment growth persists into future rounds.

## Combat resolution contract

Source: [combat.ts](../../src/games/battlegrounds/domain/combat.ts). Recruitment lives in [recruitment.ts](../../src/games/battlegrounds/domain/recruitment.ts); lobby progression lives in [game.ts](../../src/games/battlegrounds/domain/game.ts).

1. Seed living-player pairings at recruitment start. Finish bot recruitment and apply each player's permanent end-recruitment effects left to right. Store the resulting public warbands as scouting snapshots and use the already selected pairings. The odd player fights the latest eliminated warband's snapshot.
2. Deep-clone both boards. The larger board attacks first; equal sizes use a seeded coin flip.
3. Alternate sides. Within each side, select the leftmost eligible minion not yet used in the current sweep. Start another sweep when all eligible survivors have attacked. New summons join the current sweep once; they never catch up on earlier sweeps. Zero-Attack minions skip attacking.
4. Choose a random living Taunt, or any random opponent if there are no Taunts. Windfury makes two consecutive swings while the attacker survives.
5. Snapshot both attack values, then exchange damage simultaneously. Shield consumes one positive-damage hit. Poisonous kills only if damage penetrates Shield. Cleave also damages the primary target's immediate neighbors; those neighbors do not retaliate.
6. Remove all mortally wounded minions from both boards before any death effect. Queue the attacking side's deaths left to right, then the defending side's. Surviving friendly death hooks resolve, followed by that minion's Deathrattle repetitions and then Reborn. Newly caused deaths join the queue; no dead minion is revived by a later buff.
7. Summons occupy their source's vacated position, before its surviving right-hand neighbor. Stop at seven slots. Reborn returns base/golden stats with 1 HP and no Reborn keyword; permanent buffs are lost in the combat copy. Living summon hooks can then buff it.
8. Only after the queue empties decide whether combat continues. A winner deals its tavern tier plus surviving minion tiers as hero damage. Token tier is 1. Simultaneous wipe is a tie.

Deathrattle repetition is captured from surviving support when each death batch is collected. Additional support is additive. This explicit queue order is our local timing convention; it does not claim full parity with every Hearthstone play-order/aura edge case. Combat changes never write back into the recruitment boards. The replay viewer reads resolved frames, so playback speed cannot affect RNG or outcomes.

## Lobby, bots and termination

Bots buy, play, sell, upgrade, use powers, refresh and position through the same recruitment rules. Their heuristic values stats, keywords, matching tribes and triples; it does not inspect future randomness or receive free resources. Bots are deterministic opponents for learning, not a claim of expert play. Bot recruitment happens sequentially after the human presses Ready; this ordering is a deliberate local simplification.

Eliminated players return their entire pool allocation. Higher post-combat HP ranks above lower HP in simultaneous eliminations, with stable player ID breaking exact ties. A sole survivor wins; if final fatigue defeats everyone, that same ranking awards first place. The player's run ends on elimination or first place. Remaining AI-only rounds are not played after the human's elimination.

To bound unusual draws, combat becomes a draw after 200 attacks or 300 queued death resolutions. Beginning at round 16, all remaining heroes lose 1 additional fatigue HP, then 2 next round, and so on. Fatigue is an explicit workshop rule, not a foundational Battlegrounds mechanic.

## Build directions and experiments

- **Beasts:** summon bodies, strengthen newcomers, grow after friendly deaths, then buff survivors. Board space and death order constrain the payoff.
- **Mechs:** Shield, refresh-on-summon, resilient tokens and large death summons trade immediate attack for repeated survival.
- **Demons:** permanent growth plus death-trigger damage. Keep support safe long enough to exploit the small bodies.
- **Elementals:** purchase buffs, end-turn scaling, Windfury and shields reward investing in a coherent late board.
- **Mixed boards:** menagerie growth and strong standalone units offer a route while tribe shops are contested.

Test the same two boards over many seeds before judging a position from one outcome. Compare buying a pair with taking the strongest immediate body. Adjust an upgrade cost and record health at the next two rounds, not merely final placement.

## Deliberate cuts and evidence

No network play, real-time recruiting timer, armor, opponent scouting before pairing, damage cap, seasonal spells, buddies, quests, anomalies, trinkets or current-season card pools. Poisonous is the simple reusable lethal keyword used by this study. Heroes, tribe pool, prices, stats and timing edge cases are original and documented above.

[Development playtest](playtests/2026-10-02-last-hearth.md) records 12 seeded lobbies, both winning and losing, with per-action supply conservation and exact replay reconstruction. Unit tests cover combat interactions and recruitment accounting; browser tests exercise recruitment, playback, triples, Discover, save/import, victory and phone layout. Human fun and matchup balance remain open playtesting work.

## Scouting and bot decisions (v3)

The next opponent is known during recruitment. Its preview is the last completed round’s warband and tier, labeled with that round; it never displays that opponent’s upcoming purchases. Round one has no prior board. Ghost previews use the last eliminated board snapshot. These snapshots own no pool copies. Local random pairing does not implement the commercial recent-opponent exclusion system.

Bots use legal recruitment commands and their own offers. They prioritize completing triples, value tribe support and death-effect combinations, preserve money when a refresh cannot lead to a purchase, freeze unaffordable triples, and temper upgrades at low HP. Positioning moves cleave/Windfury attackers forward and support behind them, keeping Taunt at an edge. These are inspectable heuristics, not a claim of expert or stronger-than-baseline play.

The [v3 cohort](playtests/2026-10-02-workshop-v3.md) checks complete lobbies and supply conservation. Human experiments should test whether scouting changes a purchase, target or formation, and whether bot pressure supports multiple builds.

## Strategic hero powers and AI experiments (v5)

The Archivist and Oathkeeper are original workshop content. Recall moves the same deployed unit into hand for 1 gold once per recruitment, retaining buffs, keywords and pool ownership. Replaying it triggers its Battlecry and summon hooks; a consumed golden Discover stays consumed. A full hand or pending Discover prevents the action without payment. Oathkeeper gives one friendly minion +3 Health and Taunt permanently for 1 gold once per recruitment. Both powers reset when a new recruitment round starts.

The original three hero powers and both additions now use typed ability definitions. Opponents keep their original three-hero rotation. The [AI interface and experiment](../engineering/hearth-agents.md) uses public gameplay observations, independent combat samples and replay-verified full lobbies. Its search conditions on last-seen scouting; the debug supply inspector and live rival state are excluded from policy inputs.
