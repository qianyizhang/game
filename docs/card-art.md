# SVG card artwork

The three games render original vector illustrations directly from React components. Artwork is presentation only: card identities, effects, scoring, randomness and saved replays still belong to the existing content and rules layers. There are no external image requests or image dependencies.

## Visual direction

Use a clear silhouette and a small number of deliberate shadow planes. Choose the framing around the creature's identity: a phoenix needs its wings, chest and trailing plumage; a hydra needs separate neck arcs; a feline needs a short muzzle and a broad brow. Cropped portraits suit some creatures, but should not become the default for every subject. Use curved contours, overlapping forms and selective hard edges rather than reducing all anatomy to angular panels. Blindside uses cream paper, classical profiles and a few printing inks. Spire uses forged metal, asymmetric cloth folds and muted copper. Last Hearth combines creature portraits with larger flight and serpentine compositions.

Keep one dominant subject in each illustration. Supporting effects should sit behind it at lower contrast. Fine engraving describes a material; it should not compete with the contour. Avoid uniform heavy outlines, smiling symbol faces, stick limbs, and a scatter of equally prominent accessories.

Review actual rendered contact sheets at enlarged and card sizes after changing geometry. In particular, interpolated SVG path coordinates need explicit separators: valid SVG syntax can still produce an unintended shape far outside the intended drawing. Compare related cards together so species, poses and effects remain distinguishable.

## Browse and save the assets

Run `npm run assets:export`, then open `test-results/card-art/index.html`. The cabinet filters by game or category and searches by name. Select an illustration to open its standalone `.svg`; `manifest.json` lists each file, name, category and intrinsic size. The exported SVGs include their colors and work without the application's stylesheets. The exporter resolves scene color variables to literal values for compatibility with vector editors and SVG rasterizers.

Pass an output directory when needed:

```sh
npm run assets:export -- /tmp/card-workshop-art
```

The current catalogue exports **523 SVGs**: 52 playing cards, 60 Jokers, 18 consumables, 8 bosses, 6 packs, 6 vouchers, 4 tags, 103 Spire cards, 95 upgraded Spire cards, 64 minions, 64 golden minions, 31 shared glyphs, 3 challenge plates and 9 challenge symbols. Counts follow the live content registries. Tokens, statuses and curses do not get upgrade exports. Exported playing cards include a cream face, corner ranks and suit pips; the other exports are illustrations, with gameplay text and stats supplied by accessible HTML controls. [Night Market](night-market.md) adds 48 exports and gives twelve Silent upgrades distinct compositions.

Generated files live under the ignored `test-results/` directory by default. The editable source is the durable asset library; regenerate the cabinet after artwork or content changes.

## Composition layers

| Layer                    | Source                                                 | Responsibility                                                                                                          |
| ------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Shared scene and objects | `src/shared/art/CardArt.tsx`                           | Seven color palettes, four backdrops, 31 reusable glyphs                                                                |
| Blindside                | `src/games/balatro/ui/Artwork.tsx`                     | Suit paths, rank-count pip layouts, mirrored court portraits, illustrated Joker/tool/planet/boss combinations           |
| Slay the Spire           | `src/games/spire/ui/AbilityArt.tsx`                    | Blades, fists, helmets, cloaks and other objects composed into individual action scenes; upgrade ornaments              |
| Last Hearth              | `src/games/battlegrounds/ui/MinionArt.tsx`             | Creature anatomy, mechanical chassis, elemental bodies, equipment and golden accents                                    |
| Creature illustrations   | `src/games/battlegrounds/ui/CreatureIllustrations.tsx` | Individually drawn phoenix, hydra, wolf, panther and bear compositions, with curved plumage and a reusable serpent head |
| Demon illustrations      | `src/games/battlegrounds/ui/FiendIllustrations.tsx`    | Distinct imp, matron, watcher and horned patron anatomy, with soul flames and equipment                                 |
| Expanded Jokers          | `src/games/balatro/ui/ExpansionArtwork.tsx`            | Twelve engraved still lifes and theatrical subjects, using the original four printing inks                              |
| Silent illustrations     | `src/games/spire/ui/SilentArt.tsx`                     | Thirty-nine action scenes composed from curved daggers, flasks, vapor, leather boots, cards and a bone mask             |
| Expanded recruits        | `src/games/battlegrounds/ui/ExpansionPortraits.tsx`    | Twelve distinct recruit silhouettes, including a beetle, heron, moth, stag, roc and tortoise                            |
| Export catalogue         | `scripts/card-art-catalogue.tsx`                       | Renders the same components against the content registries; adds a full playing-card face for export                    |

`ArtScene` uses a `160 × 112` view box. `ArtGlyph` objects are drawn in a `100 × 100` local coordinate system; `x` and `y` locate the top-left corner and `size` scales the object. Surround glyphs with custom paths or transform groups to build a new composition:

```tsx
<ArtScene palette="tide" variant="night">
  <g transform="rotate(-20 80 56)">
    <ArtGlyph kind="shield" x={45} y={20} size={72} />
  </g>
  <ArtGlyph kind="leaf" x={102} y={67} size={25} />
</ArtScene>
```

Palettes: `ember`, `moss`, `tide`, `violet`, `gold`, `slate`, `rose`. Backdrops: `rays`, `night`, `runes`, `hills`. The game modules contain examples of more detailed layered figures and objects.

## Editing a card

1. Find its stable content ID in the appropriate content registry.
2. Edit the matching scene in that game's artwork module. Keep game-specific anatomy and motifs there; move a primitive into the shared module only when it has a useful general purpose.
3. Review both a full card and a small hand/board thumbnail. Keep titles, costs, stats, descriptions and selected/golden states clear.
4. Run `npm run assets:export` and `npm run test:browser -- tests/browser/artwork.spec.ts tests/browser/art-export.spec.ts`. Follow `AGENTS.md` for approved browser execution on macOS. `npm run check` remains the repository's full gate.

Inline artwork is decorative (`aria-hidden`, non-focusable); its card retains the accessible name and interaction. Standalone exports receive their own accessible label. Scenes avoid DOM IDs and random geometry so repeated cards are deterministic and never collide through SVG definitions. An illustration-only edit does not require a rules-version bump.

## Verification scope

The artwork browser checks cover every rendered collection, standalone SVG decoding without app CSS, cabinet filtering, phone overflow, and keyboard selection of illustrated playing cards. Existing browser suites cover buying, reordering, recruitment, combat playback and save/resume. These checks complement visual inspection of the resulting screenshots; they do not assess game balance or replace rule tests.

The [card expansion](card-expansion.md) adds playable Blindside and Hearth content using existing rules hooks. Its Silent and Void illustrations support the separate Spire mechanism expansion. Keep the content pack and illustration modules separate so either can be refined without changing the other.

Night Market components live in `NightMarketArtwork.tsx`, `ShopArt.tsx`, `NightMarketPortraits.tsx` and `SilentUpgradeArt.tsx`. `MarketPrimitives.tsx` shares engraved shop objects; `SilentPrimitives.tsx` shares the Silent scene objects without changing existing base artwork.

## Challenge illustrations

`src/shared/art/ChallengeArt.tsx` contains three original **360 × 192** plates and nine **64 × 64** symbols. They use fixed geometry, cream highlights, restrained engraving and the existing games' green, sage and warm brown inks. Each plate suggests its puzzle's subject without showing a winning sequence.

| Puzzle                  | Illustration                                                      |
| ----------------------- | ----------------------------------------------------------------- |
| The last multiplier     | A brass multiplier dial, engraved playing cards and stacked coins |
| One layer of protection | A suspended ward prism, a poison flask and a protective orbit     |
| Make room for the Cub   | A carved bear miniature, a warband banner and briar leaves        |

The plates appear in the challenge library and puzzle briefs. Symbols accompany choice, resolution, retry, hint, completion, new and active states, save warnings, and Oddly Smooth Stone. Every inline SVG is decorative and non-focusable; the adjoining text and controls retain the information and accessible names. `ChallengeArtwork.tsx` maps the library's existing status labels to symbols. `challenge-art.css` owns the responsive illustration layout, including horizontal tablet tiles.

The exporter includes both families under `challenges/` and `challenges/symbols/`. Run `npm run test:browser -- tests/browser/challenge-art.spec.ts tests/browser/challenges.spec.ts` for responsive artwork and puzzle interaction checks, using the approved macOS browser execution described in `AGENTS.md`. Review the resulting screenshots alongside enlarged and thumbnail SVG renders. This addition changes no gameplay definitions or rules versions.
