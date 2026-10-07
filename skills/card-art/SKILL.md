---
name: card-art
description: Create or refine Card Workshop SVG illustrations and 3D object studies. Use for artwork, materials, composition and visual review in this repository, not game mechanics or standalone raster generation.
---

# Card Workshop art

Make a distinct, readable subject and review it in its actual UI. Read the [aesthetic rulebook](../../docs/art/art-direction.md) for the shared direction, medium-specific criteria and visual acceptance. It is the single visual standard. Draw and review directly unless the user requests delegation.

## Establish the subject

Inspect the diff and requested content IDs; preserve concurrent work. The [source map](../../docs/art/svg.md) locates renderers, primitives and export integration. Extend the existing illustration implementation.

Keep a brief in working notes:

> **ID / subject / pose or action / identifying contour / material + light / approved sibling / variant difference / display size.**

For a set, draw and inspect its hardest or most representative subject before repeating the approach. For living subjects, follow the rulebook’s “From blockout to a living subject” sequence: interpretation and gesture, anatomical transitions, surface hierarchy, fitted motion, then multi-view and export review.

When delegation is requested, use the rulebook's “Guided delegation trials” protocol. Record the model/effort, ownership and parent interventions; distinguish the guided result from unaided model capability. Require a front/side/rear construction review before surface polish; review the returned pixels independently and send specific defects back to the author. Keep the shared rulebook authoritative rather than copying a second aesthetic checklist into the task.

## Choose the medium

For SVG illustrations, follow the build and export workflow below. For 3D studies, use the [3D source map and verification](../../docs/art/3d.md); preserve exportable geometry, animation bindings, reduced motion and camera fit. Review still structure before animating. SVG export is necessary only when SVG sources change.

## Build

For a new component, use the scaffold; for a refinement, edit the existing scene:

```sh
npm run assets:scaffold -- CopperKestrelArt src/games/battlegrounds/ui/CopperKestrelArt.tsx card
```

Formats: `card` 160 × 112 with `ArtScene`; `plate` 360 × 192; `symbol` 64 × 64. The [layer template](assets/layers.tsx.template) orders backdrop, silhouette, depth and accents. It is an empty drawing surface, not finished art. Registration remains explicit.

Use explicit colors or established scene variables. Separate interpolated coordinates with spaces: valid SVG syntax can still draw outside the frame. Give line paths `fill="none"`. Avoid DOM IDs, random geometry and external resources. Inline SVGs are decorative and non-focusable; HTML owns labels and interaction. The exporter adds standalone labels and resolves palette variables. Art alone does not change rules versions.

## Accept the result

1. **Keep a baseline.** Export approved art before editing; use separate directories for concurrent reviews.
2. **Inspect pixels at two sizes.** The [review helper](../../docs/art/svg.md#repeatable-review) creates enlarged/native-size sheets and before/after comparisons. Check identity, anatomy, material, clutter and consistency. Reject an enlarged-image improvement that regresses at card size. Pixel equality and successful decoding do not establish quality.
3. **Inspect the actual UI yourself.** Check the full card and smallest hand/board view, text/stats, selected/golden states and phone layout. Preserve accessible control names.
4. **Verify scope.** Run `npm run check`, export all assets when SVG sources changed, and run the [relevant browser checks](../../docs/art/svg.md#verification). Follow `AGENTS.md` for browser execution; report blocked checks. Investigate unexpected changed or missing IDs. Repeat checks after material fixes, not to accumulate passing runs.

Finish with a preview, the changes, verification and material limitations. Keep generated reviews under ignored `test-results/`; components, catalogue integration and this skill are the durable sources.
