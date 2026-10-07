# Content expansion history

Dated delivery records for the first card expansion (rules v2) and Night Market (rules v4). Counts, tests and compatibility claims below describe those deliveries. Current Hearth gameplay is v6 / arena v2; see the [current guide](../guide/tavern-spells.md).

## Card suite expansion

This records the first expansion. The subsequent [Night Market set](content-expansions.md) grows the live pools to 60 Jokers and 60 recruits and the export catalogue to 511 SVGs.

This addition supplies **12 Blindside Jokers**, **12 Last Hearth recruits**, and their original SVG illustrations. It also supplies illustrations for the concurrent Spire expansion's **39 Silent cards and Void status**. Spire card effects, character rules and encounters belong to that separate feature work.

### Blindside

The built-in collection grows from 40 to **52 Jokers**. Each new card uses existing `onCard`, `onHeld`, `onHand`, growth or resource hooks.

| Build direction        | Cards                               | Choices introduced                                                                |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| Held cards             | Observatory, Royal Locket, Undertow | Keep Aces or Kings, or reserve at least four cards instead of playing a full hand |
| Resource timing        | Sundial, Hourglass, Encore          | Front-load chips, exhaust discards for a multiplier, or gain an extra discard     |
| Deck shaping           | Mosaic, Glassblower                 | Reward enhanced scoring cards or the number of Glass cards in the deck            |
| Suit and rank patterns | Harlequin, Compass                  | Score three printed suits or play at least three numbered cards                   |
| Economy and growth     | Orchard, Palimpsest                 | Earn money from scoring 7s or grow a High Card engine                             |

Definitions: `src/games/balatro/content/expansion-jokers.ts`. Artwork: `src/games/balatro/ui/ExpansionArtwork.tsx`.

### Last Hearth

The pool grows from 36 to **48 recruits**, with **eight per tier**, plus the existing four summoned tokens. Golden variants use the existing doubled stats and trigger scaling.

| Tier | Recruits                    | Build direction                                                    |
| ---- | --------------------------- | ------------------------------------------------------------------ |
| 1    | Copper Beetle, Bog Toad     | Mech deathrattle support; an early Reborn Beast                    |
| 2    | Lantern Keeper, Tide Wisp   | Recruitment gold; a growing Taunt Elemental                        |
| 3    | Thorn Stag, Cinder Witch    | Combat Beast buffs; permanent Demon attack                         |
| 4    | Brass Heron, Mist Weaver    | Windfury and a Mech summon; health for summoned Elementals         |
| 5    | Moon Moth, Soul Bell        | Reborn Beast support; Demon death damage behind Taunt              |
| 6    | Storm Roc, Ancient Tortoise | Windfury and death damage; a large Taunt that leaves a health buff |

Definitions: `src/games/battlegrounds/content/expansion-minions.ts`. Artwork: `src/games/battlegrounds/ui/ExpansionPortraits.tsx`.

### Compatibility and ownership

Expanding a shop pool changes seeded draws. This pack advances Blindside and Hearth from rules version 1 to **version 2**. Their versioned storage keys leave v1 data intact; v1 exports are rejected as incompatible. The four Blindside/Hearth browser fixtures are regenerated through legal commands and replay-validated. Further mechanism changes may require another version increment.

The pack adds no command types, combat timing, animation, practice, mod-loading or opponent AI logic. The concurrent mechanism work owns those features. The integration points are registry spreads, three illustration lookups, version constants and content-count assertions. Do not remove concurrent registry extensions when editing these files.

### Visual direction and verification

Blindside keeps its cream paper and four inks. Hearth adds complete creature and object silhouettes alongside portraits. Silent uses a muted green palette, bone, curved blades and layered cloth; shared primitives have distinct compositions for individual actions. Her frame contrast is scoped to `SilentArt.css`. Void has its own orbital illustration in `AbilityArt.tsx`.

Review enlarged sheets and actual card-sized renders. Keep the existing Phoenix and other approved illustrations unchanged. Run `npm run assets:export` to regenerate the cabinet from live content: **385 SVGs** with the original Spire definitions, or **463 SVGs** with the separate Silent and Void definitions included. The illustration library is ready for both registries.

Focused rule tests cover held-card order, boss debuffs, resource conditions, preview purity, growth timing, enhancement order, golden battlecries, tribe matching, Reborn support and combat-only buffs. The existing eight Blindside runs and twelve Hearth lobbies check legal completion, replay reconstruction and finite-pool accounting. These are progression and correctness checks; human balance remains provisional.

## Night Market

An original content and SVG expansion: **8 Jokers, 12 recruits, 16 shop illustrations and 12 Silent upgrade scenes**. All new card effects use existing scoring and recruitment hooks. There are no new commands, keywords or timing rules.

### Blindside: keep, craft or spend

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

### Last Hearth: two recruits per tier

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

### Artwork and assets

- **Jokers:** engraved curios, a nocturnal bird, filigree, alchemical prisms, a loom and paper ephemera.
- **Recruits:** distinct mechanical silhouettes, candlelit demons and market tradespeople; twelve normal and twelve golden exports.
- **Shop:** six pack plates, six vouchers and four tags, rendered in offers, skip rewards and owned voucher badges. Prices, effects and button labels remain accessible HTML.
- **Silent upgrades:** Deadly Poison, Blade Dance, Cloak and Dagger, Catalyst, Bouncing Flask, Noxious Fumes, Accuracy, Infinite Blades, After Image, Envenom, Thousand Cuts and Die Die Die. These use new compositions as well as the existing upgrade ornaments. Spire card rules are unchanged.
- **Reusable objects:** engraved coins, tickets, stars and moons in `MarketPrimitives.tsx`; Silent daggers, flasks, cowls and other objects in `SilentPrimitives.tsx`. Extracting the Silent primitives preserves every base illustration.

`npm run assets:export` produces **511 standalone SVGs**, including **48 additional files** and **12 revised upgrade illustrations**. Of the previous 463 exports, **451 remain pixel-identical**, including both Phoenix variants. Shop assets have their own pack, voucher and tag categories. See [the artwork guide](../art/svg.md) for export paths and composition conventions.

### Compatibility and verification

Blindside and Hearth use **rules version 4** because larger pools change seeded draws. Version 3 exports are rejected rather than reinterpreted; their stored saves remain under their original keys. Spire remains version 3. Current content manifests include the new definitions. Four Blindside/Hearth browser fixtures were regenerated from legal version 4 runs.

The fixed development policies completed and replayed **8 Blindside runs and 12 Hearth lobbies**. Blindside produced two wins and six losses; Hearth produced one first place and eleven lower finishes. Hearth supply was checked after every command. These are lifecycle and determinism checks, not a balance estimate; the policies do not optimize the new builds.

Focused unit coverage checks Steel ordering and debuffs, scored-versus-held conditions, enhancement diversity, cash thresholds, actual paid prices, pre-payout income, stacked Mech support, targeted buffs, golden tokens and repeated Deathrattles. Rendered contact sheets and desktop/phone browser evidence live under the ignored `test-results/night-market/` and `test-results/art-round-two-review/` directories.

Final commit verification ran in an isolated snapshot above the workshop mechanism commit: **150 unit tests**, **25 browser checks**, the 20 seeded runs, formatting and production build pass. All **511 SVGs** rasterize successfully. The standalone cabinet was checked with the SVG rasterizer; the browser checks exercised the games and their illustrations.

Cleanup lets owned Joker cards grow to fit their descriptions and action buttons, preserves the shop illustrations' natural aspect ratio, aligns owned voucher art with its label, consolidates the Silent palette and refines the Ember Notary's profile and seal-holding hand. The separate challenge feature remains outside this commit.
