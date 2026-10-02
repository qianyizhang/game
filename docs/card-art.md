# SVG card artwork

The three games render original vector illustrations directly from React components. Artwork is presentation only: card identities, effects, scoring, randomness and saved replays still belong to the existing content and rules layers. There are no external image requests or image dependencies.

## Visual direction

Use a clear silhouette and a small number of deliberate shadow planes. Complex creatures work as cropped heads or busts; small whole-body figures lose anatomy at hand and warband sizes. Blindside uses cream paper, classical profiles and a few printing inks. Spire uses forged metal, asymmetric cloth folds and muted copper. Last Hearth uses distinct species silhouettes and sculpted fantasy portraits.

Keep one dominant subject in each illustration. Supporting effects should sit behind it at lower contrast. Fine engraving describes a material; it should not compete with the contour. Avoid uniform heavy outlines, smiling symbol faces, stick limbs, and a scatter of equally prominent accessories.

Review actual rendered contact sheets at enlarged and card sizes after changing geometry. In particular, interpolated SVG path coordinates need explicit separators: valid SVG syntax can still produce an unintended shape far outside the intended drawing. Compare related cards together so species, poses and effects remain distinguishable.

## Browse and save the assets

Run `npm run assets:export`, then open `test-results/card-art/index.html`. The cabinet filters by game or category and searches by name. Select an illustration to open its standalone `.svg`; `manifest.json` lists each file, name, category and intrinsic size. The exported SVGs include their colors and work without the application's stylesheets. The exporter resolves scene color variables to literal values for compatibility with vector editors and SVG rasterizers.

Pass an output directory when needed:

```sh
npm run assets:export -- /tmp/card-workshop-art
```

The current set exports **349 SVGs**: 52 playing cards, 40 Jokers, 18 consumables, 8 bosses, 63 Spire cards, 57 upgraded Spire cards, 40 minions, 40 golden minions and 31 shared glyphs. Counts follow the live content registries when the exporter runs. Statuses and curses do not get upgrade exports. Exported playing cards include a cream face, corner ranks and suit pips; the other exports are illustrations, with gameplay text and stats supplied by the game's accessible HTML controls.

Generated files live under the ignored `test-results/` directory by default. The editable source is the durable asset library; regenerate the cabinet after artwork or content changes.

## Composition layers

| Layer                    | Source                                     | Responsibility                                                                                                |
| ------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Shared scene and objects | `src/shared/art/CardArt.tsx`               | Seven color palettes, four backdrops, 31 reusable glyphs                                                      |
| Blindside                | `src/games/balatro/ui/Artwork.tsx`         | Suit paths, rank-count pip layouts, mirrored court portraits, illustrated Joker/tool/planet/boss combinations |
| Slay the Spire           | `src/games/spire/ui/AbilityArt.tsx`        | Blades, fists, helmets, cloaks and other objects composed into individual action scenes; upgrade ornaments    |
| Last Hearth              | `src/games/battlegrounds/ui/MinionArt.tsx` | Creature anatomy, mechanical chassis, elemental bodies, equipment and golden accents                          |
| Export catalogue         | `scripts/card-art-catalogue.tsx`           | Renders the same components against the content registries; adds a full playing-card face for export          |

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

The artwork browser checks cover every rendered collection, all 349 standalone SVGs decoding without app CSS, cabinet filtering, phone overflow, and keyboard selection of illustrated playing cards. Existing browser suites cover buying, reordering, recruitment, combat playback and save/resume. These checks complement visual inspection of the resulting screenshots; they do not assess game balance or replace rule tests.
