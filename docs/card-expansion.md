# Card suite expansion

This addition supplies **12 Blindside Jokers**, **12 Last Hearth recruits**, and their original SVG illustrations. It also supplies illustrations for the concurrent Spire expansion's **39 Silent cards and Void status**. Spire card effects, character rules and encounters belong to that separate feature work.

## Blindside

The built-in collection grows from 40 to **52 Jokers**. Each new card uses existing `onCard`, `onHeld`, `onHand`, growth or resource hooks.

| Build direction        | Cards                               | Choices introduced                                                                |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| Held cards             | Observatory, Royal Locket, Undertow | Keep Aces or Kings, or reserve at least four cards instead of playing a full hand |
| Resource timing        | Sundial, Hourglass, Encore          | Front-load chips, exhaust discards for a multiplier, or gain an extra discard     |
| Deck shaping           | Mosaic, Glassblower                 | Reward enhanced scoring cards or the number of Glass cards in the deck            |
| Suit and rank patterns | Harlequin, Compass                  | Score three printed suits or play at least three numbered cards                   |
| Economy and growth     | Orchard, Palimpsest                 | Earn money from scoring 7s or grow a High Card engine                             |

Definitions: `src/games/balatro/content/expansion-jokers.ts`. Artwork: `src/games/balatro/ui/ExpansionArtwork.tsx`.

## Last Hearth

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

## Compatibility and ownership

Expanding a shop pool changes seeded draws. This pack advances Blindside and Hearth from rules version 1 to **version 2**. Their versioned storage keys leave v1 data intact; v1 exports are rejected as incompatible. The four Blindside/Hearth browser fixtures are regenerated through legal commands and replay-validated. Further mechanism changes may require another version increment.

The pack adds no command types, combat timing, animation, practice, mod-loading or opponent AI logic. The concurrent mechanism work owns those features. The integration points are registry spreads, three illustration lookups, version constants and content-count assertions. Do not remove concurrent registry extensions when editing these files.

## Visual direction and verification

Blindside keeps its cream paper and four inks. Hearth adds complete creature and object silhouettes alongside portraits. Silent uses a muted green palette, bone, curved blades and layered cloth; shared primitives have distinct compositions for individual actions. Her frame contrast is scoped to `SilentArt.css`. Void has its own orbital illustration in `AbilityArt.tsx`.

Review enlarged sheets and actual card-sized renders. Keep the existing Phoenix and other approved illustrations unchanged. Run `npm run assets:export` to regenerate the cabinet from live content: **385 SVGs** with the original Spire definitions, or **463 SVGs** with the separate Silent and Void definitions included. The illustration library is ready for both registries.

Focused rule tests cover held-card order, boss debuffs, resource conditions, preview purity, growth timing, enhancement order, golden battlecries, tribe matching, Reborn support and combat-only buffs. The existing eight Blindside runs and twelve Hearth lobbies check legal completion, replay reconstruction and finite-pool accounting. These are progression and correctness checks; human balance remains provisional.
