---
name: card-art
description: Create, extend, or refine Card Workshop's code-native SVG cards, creatures, challenge plates, and visual primitives. Use for this repository's vector artwork and visual review, not game mechanics or raster image generation.
---

# Card Workshop art

Make a distinct, readable illustration and review it in its actual UI. The direction is restrained, engraved fantasy: deliberate silhouettes, curved anatomy, overlapping material planes and a few printing inks. Draw and review directly unless the user requests delegation.

## Establish the subject

Inspect the diff and requested content IDs; preserve concurrent work. The [source map](../../docs/card-art.md) locates renderers, primitives and export integration. Extend the existing illustration implementation.

Keep a brief in working notes:

> **ID / subject / pose or action / identifying contour / material + light / approved sibling / variant difference / display size.**

For a set, draw and inspect its hardest or most representative subject before repeating the approach.

## Visual rules

- **Silhouette first.** One dominant subject; supporting effects stay quieter and behind it. Leave breathing room around identifying contours. Avoid defaulting every creature to a cropped portrait.
- **Anatomy carries identity.** Curve bodies and overlap forms; reserve hard edges for beaks, blades and armor. Phoenix: separated wings, coherent chest, flowing tail. Hydra: distinct neck arcs. Feline: short muzzle, broad brow. Avoid symbol faces, stick limbs and uniformly triangular bodies.
- **Shape creates depth.** Establish light, midtone and shadow before engraving. Interior lines describe material without competing with the contour. Do not outline every plane with the same heavy stroke.
- **Primitives serve a composition.** Reuse flasks, feathers or coins, but change proportion, overlap, angle and negative space to create a gesture. Avoid pictogram collages. Share a primitive after a useful second application; keep species anatomy in its game module.
- **Respect family inks.** Blindside: cream, forest ink, ochre, restrained coral. Spire: forged metal, asymmetric cloth, muted copper; Silent adds sage, poison green and plum. Hearth: natural creature colors, selective gold, flight and serpentine poses. Reuse palette constants.
- **Variants remain recognizable.** Golden accents preserve anatomy. A requested distinct upgrade changes action, pose or supporting objects, not only tint. Compare base and variant together. Puzzle art suggests its subject without revealing the solution.

## Build

For a new component, use the scaffold; for a refinement, edit the existing scene:

```sh
npm run assets:scaffold -- CopperKestrelArt src/games/battlegrounds/ui/CopperKestrelArt.tsx card
```

Formats: `card` 160 × 112 with `ArtScene`; `plate` 360 × 192; `symbol` 64 × 64. The [layer template](assets/layers.tsx.template) orders backdrop, silhouette, depth and accents. It is an empty drawing surface, not finished art. Registration remains explicit.

Use explicit colors or established scene variables. Separate interpolated coordinates with spaces: valid SVG syntax can still draw outside the frame. Give line paths `fill="none"`. Avoid DOM IDs, random geometry and external resources. Inline SVGs are decorative and non-focusable; HTML owns labels and interaction. The exporter adds standalone labels and resolves palette variables. Art alone does not change rules versions.

## Accept the result

1. **Keep a baseline.** Export approved art before editing; use separate directories for concurrent reviews.
2. **Inspect pixels at two sizes.** The [review helper](../../docs/card-art.md#repeatable-review) creates enlarged/native-size sheets and before/after comparisons. Check identity, anatomy, material, clutter and consistency. Reject an enlarged-image improvement that regresses at card size. Pixel equality and successful decoding do not establish quality.
3. **Inspect the actual UI yourself.** Check the full card and smallest hand/board view, text/stats, selected/golden states and phone layout. Preserve accessible control names.
4. **Verify scope.** Run `npm run check`, export all assets and run the [relevant browser checks](../../docs/card-art.md#verification). Follow `AGENTS.md` for browser execution; report blocked checks. Investigate unexpected changed or missing IDs. Repeat checks after material fixes, not to accumulate passing runs.

Finish with a preview, the changes, verification and material limitations. Keep generated reviews under ignored `test-results/`; components, catalogue integration and this skill are the durable sources.
