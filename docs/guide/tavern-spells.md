# Last Hearth tavern spells

**Eight local spells add recruitment choices in Classic and Mixed Rivals.** Current games use **Hearth rules v6 / arena envelope v2**. Previous v5/v1 saves remain stored separately; current import rejects those versions. The historical AI experiment paths explicitly retain their v5/v1 codecs and frozen controllers.

## Play

A tavern has its normal minion offers plus **one spell offer**, chosen uniformly from the spells at or below its tier using the environment's seeded RNG. Spell offers use no minion-pool copies. Buy a spell into the spell hand, then cast for free during recruitment or hold it across rounds. Minions and spells share **ten hand slots**.

Friendly spells target the selected warband minion, named below the spell panel. The collection displays every spell's cost, tier, effect and illustration. The Practice lab's **Spell workshop** starts with a Wolf, an Imp and three held spells; its setup and replay remain separate from normal runs.

| Spell           | Tier | Buy cost | Cast effect                                                   |
| --------------- | ---: | -------: | ------------------------------------------------------------- |
| Pocket Change   |    1 |   1 gold | Gain 2 gold now                                               |
| Promissory Note |    1 |   1 gold | Gain 3 extra gold at the next recruitment, if still alive     |
| Whetstone       |    1 |   1 gold | Friendly minion: permanent +3 Attack                          |
| Hearth Bread    |    1 |   1 gold | Friendly minion: permanent +3 Health                          |
| Guard Oath      |    2 |   2 gold | Friendly minion: permanent +1/+2 and Taunt                    |
| Market Polish   |    2 |   2 gold | Current tavern minions: +2/+2, retained when bought or frozen |
| Recruit Coupon  |    2 |   1 gold | Next minion purchase this round costs 1 gold                  |
| Warband Banner  |    3 |   3 gold | Current warband: permanent +1/+1                              |

These are original workshop definitions, with a bounded timing model. They are not a commercial-game spell catalogue or balance-parity claim.

## Timing and accounting

- **Offer lifecycle:** refreshing for 1 gold replaces minions and the spell offer, and clears freeze. Freeze preserves both; missing minion and spell slots refill next recruitment. Buying a spell leaves its slot empty until refresh or the next recruitment. Upgrade changes eligibility for later draws; it does not redraw existing offers.
- **Cast boundary:** resolve pending Discover first. A spell must be in the actor's hand; friendly targets must belong to that actor's board. Empty-board/empty-shop buffs reject without consuming the spell. Casts charge no extra gold and consume the spell once. Invalid actions preserve the original state, resources, RNG and journal.
- **Income:** unused current gold still expires. Notes stack as delayed income, added once after normal next-round income and hero income; this bonus can exceed the normal ten-gold income cap. Elimination clears held spells and unpaid notes.
- **Coupon:** discounts one successful minion purchase by 2 gold; normal recruits cost 3. Failed purchases, spell purchases, Recall, upgrades and Discover do not consume it. A second coupon cannot be cast while one is active. It expires at next recruitment. The coupon card itself can be held for a later round.
- **Buff ownership:** board buffs modify permanent recruitment units. Combat copies cannot write wounds or shield consumption back. Shop buffs travel with a bought or frozen minion, contribute to a triple's retained bonuses, and disappear with replaced offers. Neither spells nor their buffs create extra minion copies.
- **Hand capacity:** purchasing a minion or spell, taking Discover, and Recall all enforce the combined ten-slot limit. Casting frees a slot; minion deployment retains its existing seven-board-slot limit.

## Controllers, observations and replay

Classic's new gameplay controller wraps the frozen minion heuristic with a small spell heuristic. Mixed Rivals uses the same spell wrapper around its four style families. Held usable spells are cast before new spending; immediate income can fund a recruit, while most spell purchases use gold left after core recruitment choices. Targets use the existing visible unit valuation. Market Polish and coupons have affordability guards; Banner requires at least three friendly units for automatic purchase. These are readable heuristics, with no claim of stronger play.

The domain owns `buySpell` and `castSpell` validity and effects. Replay stores accepted commands and content pins, including the spell definitions. Agent frames expose only the actor's spell offer, spell hand, pending income and coupon; rival private spell state, seed/RNG and exact supply remain excluded. Existing protocol/observation envelope names stay v1, with additive fields distinguished by `rulesVersion: 6` and `arenaVersion: 2`. Catalogues include spell definitions. A `tavern` transition event records actor spell-state changes alongside resource and unit events.

**Historical boundary:** `bgSessionV5` and `arenaSessionV1` are explicit codecs for old study reconstruction and the published experiment/decision-explorer paths. Their factories omit all spell state and draws. `bots.ts`, `ai/policy.ts` and `ai/recruitment-policy.ts` retain their SHA-pinned bytes. No old evidence, scores, seed pools or fixture histories are rewritten. Reproducing an original source-pinned audit still requires its recorded revision and bundle. New rules have not undergone a reserved policy-strength comparison.

## Source map

| Responsibility                       | Source                                                             |
| ------------------------------------ | ------------------------------------------------------------------ |
| Spell data                           | `src/games/battlegrounds/content/spells.ts`                        |
| Ownership, casts, hand size, pricing | `domain/spells.ts`, `domain/recruitment.ts`, `domain/heroes.ts`    |
| Classic gameplay heuristic           | `domain/spell-controller.ts`                                       |
| Arena gameplay wrapper               | `ai/spell-policy.ts`, `application/arena-controller.ts`            |
| Replay and historical codecs         | `application/session.ts`, `application/arena.ts`                   |
| Agent menus, catalogue and events    | `application/engine.ts`, `application/agent.ts`                    |
| UI and SVG subjects                  | `ui/TavernSpells.tsx`, `ui/SpellCard.tsx`, `ui/TavernSpellArt.tsx` |

Paths in the table below the first row are relative to `src/games/battlegrounds/`.

## Historical acceptance evidence — 2026-10-06

- **233 unit tests / 34 files**, formatting, TypeScript and production build pass. Spell tests cover invalid actions, capacity, pending Discover, purchase/cast accounting, income/reset/elimination, permanent and frozen buffs, triple ownership, coupon consumption/expiry, tier eligibility, practice replay and redaction. Existing tests retain exact historical v5 final-state hashes and frozen policy-source hashes.
- **20/20 Classic seeded lobbies**, four per hero, finish with legal actions, supply conservation after every action, combined hand/board limits and exact replay reconstruction. The focal controllers cast **267 spells**. These are development lifecycle checks; the observed two victories do not estimate general playing strength or human enjoyment.
- **5/5 complete Mixed Rivals lobbies**, one focal setup per hero, resolve all eight placements. All commands preserve supply/capacity/nonnegative gold and reconstruct exactly; all seats cast **629 spells** in total. Each lobby has a 6,000-command ceiling and each seat retains its 120-action turn limit. No provider calls or search simulations are used.
- **604 SVG exports:** eight additions, zero removed/changed previous assets, and **596 identical existing pixel hashes** under the recorded Sharp renderer. Every new subject was inspected enlarged and at native size, then in desktop/phone collection and recruitment UI.
- **57/57 full-suite browser checks pass**, recorded in [completion evidence](../research/delivery-history.md). Targeted checks cover keyboard casting, chosen target, purchase/cast costs, held spells, delayed income, coupon prices, reload, old-key preservation and phone layout. Profiles are disposable and launches use approved execution outside the restricted macOS command sandbox.

The [machine-readable lifecycle receipt](../research/playtests/2026-10-06-tavern-spells.json) retains source/content pins, all 25 summaries, replay/fixture hashes and the art comparison. Raw automated histories, summaries and art review receipts remain under ignored `test-results/tavern-spells-*`. New checked-in normal fixtures are `tests/fixtures/battlegrounds-v6-win.json` (`SPELLS-11`) and `battlegrounds-v6-loss.json` (`SPELLS-10`), copied from legal full runs. Original v5 fixtures remain unchanged. Human balance and pacing remain unmeasured; visual and scripted interaction review establish usability of the implemented controls.

```sh
npm run check
npx vitest run --config vitest.playtest.config.ts tests/simulation/battlegrounds.test.ts tests/simulation/hearth-spells-arena.test.ts
npm run assets:export -- test-results/new-spell-art
npm run test:browser
```
