# Content expansion history

Historical records for the first card expansion (rules v2) and Night Market (rules v4). For current Hearth rules v6 / arena v2, see [tavern spells](../guide/tavern-spells.md).

## Card suite expansion

Supplies **12 Blindside Jokers**, **12 Last Hearth recruits**, and artwork for the concurrent Spire expansion's **39 Silent cards and Void status** under rules v2.

### Blindside additions (52 total Jokers)

| Build direction      | Cards                               | Choices introduced                                                         |
| -------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| Held cards           | Observatory, Royal Locket, Undertow | Hold Aces/Kings or reserve ≥4 cards instead of playing a full hand         |
| Resource timing      | Sundial, Hourglass, Encore          | Front-load chips, exhaust discards for multipliers, or gain extra discards |
| Deck shaping         | Mosaic, Glassblower                 | Reward enhanced cards or count of Glass cards in deck                      |
| Suit & rank patterns | Harlequin, Compass                  | Score three distinct suits or play ≥3 numbered cards                       |
| Economy & growth     | Orchard, Palimpsest                 | Earn cash from scoring 7s or scale a High Card engine                      |

_Source:_ `src/games/balatro/content/expansion-jokers.ts` · `ui/ExpansionArtwork.tsx`

### Last Hearth additions (48 total recruits)

| Tier | Recruits                    | Build direction                                             |
| ---: | --------------------------- | ----------------------------------------------------------- |
|    1 | Copper Beetle, Bog Toad     | Mech deathrattle support; early Reborn Beast                |
|    2 | Lantern Keeper, Tide Wisp   | Recruitment gold; scaling Taunt Elemental                   |
|    3 | Thorn Stag, Cinder Witch    | Combat Beast buffs; permanent Demon Attack                  |
|    4 | Brass Heron, Mist Weaver    | Windfury and Mech summon; health for summoned Elementals    |
|    5 | Moon Moth, Soul Bell        | Reborn Beast support; Demon death damage behind Taunt       |
|    6 | Storm Roc, Ancient Tortoise | Windfury and death damage; large Taunt leaving health buffs |

_Source:_ `src/games/battlegrounds/content/expansion-minions.ts` · `ui/ExpansionPortraits.tsx`

### Compatibility & Verification

- Advances Blindside and Hearth to **rules v2** (new draws change seeds). Versioned storage preserves v1 data intact.
- Re-exported **385 SVGs** (base) and **463 SVGs** (with Silent/Void).
- Regressions cover held-card ordering, boss debuffs, golden battlecries, tribe matching, and 20 seeded lifecycle runs.

## Night Market

Adds **8 Jokers**, **12 recruits**, **16 shop illustrations**, and **12 Silent upgrade scenes** under rules v4.

### Blindside additions (60 total Jokers)

| Joker           | Build decision                                                          |
| --------------- | ----------------------------------------------------------------------- |
| Velvet Purse    | Hold Gold cards for immediate chips and payout cash                     |
| Silver Filigree | Add mult following each held Steel card multiplier (held order matters) |
| Nightjar        | Hold exactly one face card for ×2 mult (Aces are not face cards)        |
| Prism Cabinet   | Score ≥3 different card enhancements                                    |
| Gilded Loom     | Reach 12 enhanced cards in the permanent deck for +90 chips             |
| Empty Pockets   | Spend down to ≤$5 for +24 mult                                          |
| Moon Ledger     | Save cash for blind income: $1 per $10 saved (capped at $6)             |
| Receipt Ribbon  | Convert purchase prices of owned Jokers into chips (capped at +100)     |

_Source:_ `src/games/balatro/content/night-market-jokers.ts`

### Last Hearth additions (60 total recruits)

| Tier | Recruits                             | Support                                                           |
| ---: | ------------------------------------ | ----------------------------------------------------------------- |
|    1 | Rivet Mouse · Wick Imp               | Permanent Mech Health; temporary Demon Health on death            |
|    2 | Street Apothecary · Glass Imp        | Targeted permanent +1/+3; fragile shielded Demon                  |
|    3 | Coil Serpent · Night Porter          | Attack for summoned Mechs; Taunt and team Attack deathrattle      |
|    4 | Furnace Scribe · Clockwork Manta     | Buying Demons grows board; shielded Mech summons two Scraplings   |
|    5 | Mask Merchant · Ember Notary         | Menagerie scaling; combat growth when friendly Demons die         |
|    6 | Lantern Engine · Twilight Auctioneer | +3/+3 for summoned Mechs; recruitment gold and bonus Deathrattles |

_Source:_ `src/games/battlegrounds/content/night-market-minions.ts`

### Artwork & Assets

- **Cabinet exports:** Produces **511 standalone SVGs** (48 additions, 12 upgrade scenes, 451 pixel-identical to baseline).
- **Shop assets:** 6 pack plates, 6 vouchers, and 4 skip tags.
- **Silent upgrades:** Distinct compositions for 12 key upgraded cards (`SilentPrimitives.tsx`).

### Compatibility & Verification

- Advances Blindside and Hearth to **rules v4**. Spire remains **v3**.
- Passed **150 unit tests**, **25 browser checks**, and 20 seeded verification runs (8 Blindside, 12 Hearth).
