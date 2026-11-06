---
name: card-art
description: Create or refine Card Workshop SVG illustrations and native Blender models, rigs and animated studies. Use for artwork, materials, motion and visual review in this repository, not game mechanics or standalone raster generation.
---

# Card Workshop art

Make a distinct, readable subject and review it in its actual UI. Read the [aesthetic rulebook](../../docs/art/art-direction.md) for the shared direction, medium-specific criteria and visual acceptance. It is the single visual standard. Draw and review directly unless the user requests delegation.

## Establish the subject

Inspect the diff and requested content IDs; preserve concurrent work. For SVG, the [source map](../../docs/art/svg.md) locates renderers, primitives and export integration.

For every **2D SVG or generated SVG/GIF iteration**, read the
[asset history workflow](../../docs/art/iterations/README.md#register-new-work)
before editing or dispatching a request. It owns the pre-edit checkpoint,
registration of each terminal attempt and derivative, and the gallery inspection
needed before review-ready status. Apply it to hand edits and individual requests
as well as packed batches. Browse unchanged artwork live; save only explicit
checkpoints and real iterations.

Keep a brief in working notes:

> **ID / subject / pose or action / identifying contour / material + light / approved sibling / variant difference / display size.**

For a set, draw and inspect its hardest or most representative subject before repeating the approach. For living subjects, follow the rulebook’s “From blockout to a living subject” sequence: interpretation and gesture, anatomical transitions, surface hierarchy, fitted motion, then multi-view and export review.

When delegation is requested, use the user's selected ownership and budget. For native work in an explicitly selected single-owner self-review mode, use the [native handoff workflow](references/native-modeling.md#delegation-and-handoff); label the result as self-review. For the author/verifier/director mode, read the [asset delegation protocol](../../docs/art/delegation.md). The rulebook remains the visual standard.

## Choose the medium

For SVG illustrations, follow the build and export workflow below. For 3D studies, use the [3D source map and verification](../../docs/art/3d.md); preserve exportable geometry, animation bindings, reduced motion and camera fit. Review still structure before animating. SVG export is necessary only when SVG sources change.

For **API batches, packed sheets, or generated SVG/GIF sets**, read the [batch workflow](references/batch-assets.md). It covers WIP agreement, simple asset families and tile seams, shared references, extraction, cost review and selective promotion. Prefer GIF for purposeful events such as boss transformations and VFX. The asset history workflow owns preservation and explicit guarded removal.

For **animated native modeling, rig fitting, or a new motion study**, read the [native modeling playbook](references/native-modeling.md). It owns the saved-source workflow, species-specific support checks, deformation/timing review and starter scaffold; trial history is optional evidence. It applies when refining an existing native study as well as building a new one.

For direct Blender saves and renders, use the [lean session helpers](../../packages/dcc-workbench/README.md#lean-session-save-and-capture-protection); keep selected decision evidence and temporary previews under the existing retention policy.

## Build SVG

For a new component, use the scaffold; for a refinement, edit the existing scene:

```sh
npm run assets:scaffold -- CopperKestrelArt src/games/battlegrounds/ui/CopperKestrelArt.tsx card
```

Formats: `card` 160 × 112 with `ArtScene`; `plate` 360 × 192; `symbol` 64 × 64. The [layer template](assets/layers.tsx.template) orders backdrop, silhouette, depth and accents. It is an empty drawing surface, not finished art. Registration remains explicit.

Use explicit colors or established scene variables. Separate interpolated coordinates with spaces: valid SVG syntax can still draw outside the frame. Give line paths `fill="none"`. Avoid DOM IDs, random geometry and external resources. Inline SVGs are decorative and non-focusable; HTML owns labels and interaction. The exporter adds standalone labels and resolves palette variables. Art alone does not change rules versions.

## Accept the result

1. **Keep a baseline.** Save an explicit checkpoint for the affected asset before its first edit or generation trial. Reuse an unchanged saved baseline. Keep disposable comparison views separate from preserved artwork.
2. **Inspect pixels at two sizes.** The [review helper](../../docs/art/svg.md#repeatable-review) creates enlarged/native-size sheets and before/after comparisons. Check identity, anatomy, material, clutter and consistency. Reject an enlarged-image improvement that regresses at card size. Pixel equality and successful decoding do not establish quality.
3. **Inspect the actual UI yourself.** Check the full card and smallest hand/board view, text/stats, selected/golden states and phone layout. Preserve accessible control names.
4. **Register and inspect.** Complete the history workflow's registration steps, including failures and rejected outputs. Open each affected asset in the gallery and inspect its revision and prompt/settings. Run `npm run assets:history -- verify`; resolve unregistered changes or managed files before marking review-ready. Report unavailable lineage honestly.
5. **Verify scope.** Use the [gate selection](../../docs/engineering/checks.md#gate-selection): `npm run check` for SVG/UI code, `npm run check:full` for native construction, animation or delivery. Inspect the changed assets through the live gallery and run affected browser/native checks. Build a complete disposable offline export only when its delivery contract or a required gate needs it; do not keep an unchanged catalogue dump. Follow `AGENTS.md` for browser execution; report blocked checks. Repeat checks after material fixes, not to accumulate passing runs.

Finish with a preview, the changes, verification and material limitations. Temporary reviews stay under ignored `test-results/`; retain selected decision evidence with the owning delivery and its hashes. Components, saved native masters and catalogue integration remain the durable sources.
