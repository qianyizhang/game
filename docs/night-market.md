# Night Market

An original content and SVG expansion: **8 Jokers, 12 recruits, 16 shop illustrations and 12 Silent upgrade scenes**. All new card effects use existing scoring and recruitment hooks. There are no new commands, keywords or timing rules.

## Blindside: keep, craft or spend

| Joker           | Build decision                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| Velvet Purse    | Hold Gold cards for chips now and their usual income at payout.                                                |
| Silver Filigree | Add mult immediately after each held Steel card's multiplier; held-card order still matters.                   |
| Nightjar        | Keep exactly one face card in hand for ×2 mult. Aces are not face cards.                                       |
| Prism Cabinet   | Score at least three different enhancements; plain cards do not count.                                         |
| Gilded Loom     | Reach twelve enhanced cards in the permanent deck for +90 chips.                                               |
| Empty Pockets   | Spend down to $5 or less for +24 mult; scoring income can cross that threshold.                                |
| Moon Ledger     | Save for additional blind income: $1 per $10, capped at $6, calculated before payout.                          |
| Receipt Ribbon  | Turn the actual prices paid for currently owned Jokers into chips, capped at +100. Free cards contribute zero. |

The built-in pool now contains **60 Jokers**. Definitions live in `src/games/balatro/content/night-market-jokers.ts`; the registry retains the existing validated mod assembly.

## Last Hearth: two recruits per tier

| Tier | Recruits                             | Support                                                                           |
| ---- | ------------------------------------ | --------------------------------------------------------------------------------- |
| 1    | Rivet Mouse · Wick Imp               | Permanent Mech Health; temporary Demon Health on death.                           |
| 2    | Street Apothecary · Glass Imp        | Targeted permanent +1/+3; a fragile shielded Demon.                               |
| 3    | Coil Serpent · Night Porter          | Attack for summoned Mechs; Taunt and a team Attack deathrattle.                   |
| 4    | Furnace Scribe · Clockwork Manta     | Buying Demons grows the board; a shielded Mech summons two Scraplings.            |
| 5    | Mask Merchant · Ember Notary         | Menagerie growth; combat growth when friendly Demons die.                         |
| 6    | Lantern Engine · Twilight Auctioneer | +3/+3 for summoned Mechs; recruitment gold and an additional Deathrattle trigger. |

The pool now contains **60 recruits, ten per tier**, plus four existing tokens. The twelve additions comprise four Mechs, four Demons and four neutral supports. Golden versions use the existing doubling rules. The Mask Merchant selects at most one unit per Beast/Mech/Demon/Elemental pass and never buffs a unit twice in that pass.

Definitions live in `src/games/battlegrounds/content/night-market-minions.ts`. Combat buffs remain confined to combat clones; recruitment buffs persist.

## Artwork and assets

- **Jokers:** engraved curios, a nocturnal bird, filigree, alchemical prisms, a loom and paper ephemera.
- **Recruits:** distinct mechanical silhouettes, candlelit demons and market tradespeople; twelve normal and twelve golden exports.
- **Shop:** six pack plates, six vouchers and four tags, rendered in offers, skip rewards and owned voucher badges. Prices, effects and button labels remain accessible HTML.
- **Silent upgrades:** Deadly Poison, Blade Dance, Cloak and Dagger, Catalyst, Bouncing Flask, Noxious Fumes, Accuracy, Infinite Blades, After Image, Envenom, Thousand Cuts and Die Die Die. These use new compositions as well as the existing upgrade ornaments. Spire card rules are unchanged.
- **Reusable objects:** engraved coins, tickets, stars and moons in `MarketPrimitives.tsx`; Silent daggers, flasks, cowls and other objects in `SilentPrimitives.tsx`. Extracting the Silent primitives preserves every base illustration.

`npm run assets:export` produces **511 standalone SVGs**, including **48 additional files** and **12 revised upgrade illustrations**. Of the previous 463 exports, **451 remain pixel-identical**, including both Phoenix variants. Shop assets have their own pack, voucher and tag categories. See [the artwork guide](card-art.md) for export paths and composition conventions.

## Compatibility and verification

Blindside and Hearth use **rules version 4** because larger pools change seeded draws. Version 3 exports are rejected rather than reinterpreted; their stored saves remain under their original keys. Spire remains version 3. Current content manifests include the new definitions. Four Blindside/Hearth browser fixtures were regenerated from legal version 4 runs.

The fixed development policies completed and replayed **8 Blindside runs and 12 Hearth lobbies**. Blindside produced two wins and six losses; Hearth produced one first place and eleven lower finishes. Hearth supply was checked after every command. These are lifecycle and determinism checks, not a balance estimate; the policies do not optimize the new builds.

Focused unit coverage checks Steel ordering and debuffs, scored-versus-held conditions, enhancement diversity, cash thresholds, actual paid prices, pre-payout income, stacked Mech support, targeted buffs, golden tokens and repeated Deathrattles. Rendered contact sheets and desktop/phone browser evidence live under the ignored `test-results/night-market/` and `test-results/art-round-two-review/` directories.

Final commit verification ran in an isolated snapshot above the workshop mechanism commit: **150 unit tests**, **25 browser checks**, the 20 seeded runs, formatting and production build pass. All **511 SVGs** rasterize successfully. The standalone cabinet was checked with the SVG rasterizer; the browser checks exercised the games and their illustrations.

Cleanup lets owned Joker cards grow to fit their descriptions and action buttons, preserves the shop illustrations' natural aspect ratio, aligns owned voucher art with its label, consolidates the Silent palette and refines the Ember Notary's profile and seal-holding hand. The separate challenge feature remains outside this commit.
