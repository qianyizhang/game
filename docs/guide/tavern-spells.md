# Last Hearth tavern spells

Eight local spells introduce recruitment choices in Classic and Mixed Rivals under **Hearth rules v6 / arena envelope v2**. Previous v5/v1 saves remain separate and are rejected on v6 import. Historical AI experiment paths retain frozen v5/v1 codecs.

## Play

Taverns offer normal minion selections plus **one spell offer**, chosen uniformly from spells at or below current tier via seeded RNG (separate from minion pool copies). Spells cost gold to purchase into the hand and cast for free during recruitment. Minions and spells share a **10-slot hand limit**. Friendly spells target the selected warband minion.

| Spell           | Tier | Buy cost | Cast effect                                                   |
| --------------- | ---: | -------: | ------------------------------------------------------------- |
| Pocket Change   |    1 |   1 gold | Gain 2 gold now                                               |
| Promissory Note |    1 |   1 gold | Gain 3 extra gold at next recruitment, if alive               |
| Whetstone       |    1 |   1 gold | Friendly minion: permanent +3 Attack                          |
| Hearth Bread    |    1 |   1 gold | Friendly minion: permanent +3 Health                          |
| Guard Oath      |    2 |   2 gold | Friendly minion: permanent +1/+2 and Taunt                    |
| Market Polish   |    2 |   2 gold | Current tavern minions: +2/+2, retained when bought or frozen |
| Recruit Coupon  |    2 |   1 gold | Next minion purchase this round costs 1 gold                  |
| Warband Banner  |    3 |   3 gold | Current warband: permanent +1/+1                              |

## Timing and accounting

- **Offer lifecycle:** Refresh (1 gold) replaces minions and the spell offer, clearing freeze. Freeze preserves both. Buying a spell leaves the slot empty until refresh or next round. Upgrading tiers affects future offers without redrawing existing ones.
- **Cast boundary:** Pending Discover must resolve first. Actor must hold the spell, and friendly targets must reside on actor's board. Empty targets reject without consuming gold or the spell.
- **Income:** Unused gold expires at round end. Promissory Notes stack into delayed income delivered once after standard/hero income (can exceed the normal 10-gold cap). Elimination clears held spells and unpaid notes.
- **Recruit Coupon:** Discounts one minion purchase by 2 gold (standard cost: 3). Spells, Recall, tier upgrades, and Discover do not consume coupons. Coupons do not stack; unused coupons expire at round end.
- **Buff ownership:** Board buffs modify permanent recruitment units (combat copies do not write back). Shop buffs stick to bought/frozen minions, contribute to triples, and vanish when offers refresh. Spells never generate additional minion copies.
- **Capacity:** Buying minions/spells, Discover, and Recall all enforce the 10-slot hand limit. Warbands maintain a 7-minion board limit.

## Controllers and replay

- **Classic & Arena:** Classic wraps frozen minion heuristics with a spell heuristic. Mixed Rivals applies the spell wrapper across all four style families: playable spells cast before recruitment; notes/coupons evaluate affordability; Banner requires ≥3 warband units.
- **Replay & Observation:** Replay stores accepted `buySpell` and `castSpell` commands and content pins. Agent frames expose only the active seat's spell offer, spell hand, pending income, and coupon status (rival spell hands and seed RNG remain private).
- **Historical compatibility:** `bgSessionV5` and `arenaSessionV1` preserve exact v5/v1 replays and experiment codecs.

## Source map

| Responsibility          | Source                                                             |
| ----------------------- | ------------------------------------------------------------------ |
| Spell definitions       | `src/games/battlegrounds/content/spells.ts`                        |
| Rules, ownership, costs | `domain/spells.ts`, `domain/recruitment.ts`, `domain/heroes.ts`    |
| Classic controller      | `domain/spell-controller.ts`                                       |
| Arena wrapper           | `ai/spell-policy.ts`, `application/arena-controller.ts`            |
| Replay codecs           | `application/session.ts`, `application/arena.ts`                   |
| Engine events & frames  | `application/engine.ts`, `application/agent.ts`                    |
| Presentation            | `ui/TavernSpells.tsx`, `ui/SpellCard.tsx`, `ui/TavernSpellArt.tsx` |

_(Relative to `src/games/battlegrounds/` except where specified)_

## Verification

- **Tests:** 233 unit tests across 34 files cover edge cases, Discover sequencing, capacity bounds, coupon expiry, and v5 final-state hashes.
- **Simulation:** 20/20 Classic lobbies (267 spells cast) and 5/5 Mixed Rivals lobbies (629 spells cast) pass supply conservation and replay reconstruction.
- **Assets:** 604 SVG exports (8 new spells, 596 identical hashes) inspected across viewport scales.
- **Browser:** 57/57 disposable-profile browser tests pass (keyboard casting, delayed income, save isolation).
- **Receipts:** Machine-readable validation in [delivery history](../research/delivery-history.md) and [`2026-10-06-tavern-spells.json`](../research/playtests/2026-10-06-tavern-spells.json).

```sh
npm run check
npx vitest run --config vitest.playtest.config.ts tests/simulation/battlegrounds.test.ts tests/simulation/hearth-spells-arena.test.ts
npm run assets:export -- test-results/new-spell-art
npm run test:browser
```
