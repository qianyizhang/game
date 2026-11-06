# Batch assets

Use the existing WIP gallery to agree on a coherent batch before paid calls.
Show current art, the reuse/replacement reason, target sizes, shared direction,
deliverables and a bounded request/retry budget. Artwork acceptance and runtime
promotion remain separate. The [admission gate](../../../docs/art/README.md#asset-admission-reuse-improve-then-expand)
and [preservation hold](../../../docs/art/README.md#image-26-batch-workflow) apply.

## Choose the workload

- **Packed SVG/raster:** simple related subjects, background tiles, repeated
  small minions and normal/upgrade families. Share palette, light, contour weight
  and intended scale. Complex hero or boss portraits may need more canvas and a
  separate request to retain structure and detail.
- **GIF:** a named event with a beginning and result, such as a boss
  transformation, phase change, impact or spell VFX. Keep ordinary portraits
  still unless their motion has a useful role. Define the trigger, anticipation,
  action, settling/hold, playback duration and reduced-motion still. A loop is
  appropriate only when the effect needs one.

## Prepare the batch

Living or humanoid subjects need a stricter pilot before packing. The twelve-cell
Hearth trial produced readable tier differences, but the user found its Squire
and Cub below the quality bar: blocky anatomy and stiff joints survived the
thumbnail check. Use one subject, or a small coherent pair, when anatomy and
gesture need more attention; expand only after a representative passes the
[art rulebook](../../../docs/art/art-direction.md). This is an observed limit of
that batch, not proof that every living subject must be generated alone.

Separate the tuning controls: image complexity plans the reference, image
quality renders it, and SVG-author reasoning constructs the vector output.
The Hearth trial already used high complexity but medium quality and low author
reasoning. More author effort or canvas per subject is a useful next test, not
a guaranteed repair. Avoid judging quality from cell count, technical validity
or visible normal/Golden differences alone.

Use this brief as the scaffold; fill only applicable fields:

> **Purpose / current IDs and evidence / reuse or replacement / shared approved
> reference / subjects × variants or states / cell size and layout / target UI
> sizes / SVG or raster source / motion trigger and phases / request budget and
> stop / acceptance and promotion / owning record.**

For a sheet prompt, specify the exact canvas, cell size, ordering, gutters and
safe margins; give each scene a named, separable group with a local background.
Describe each subject's contour and each variant's gesture. Pair normal and
upgrade scenes visibly; recoloring or adding a border rarely establishes an
upgrade. Future levels are concepts until the game owns that meaning. Include
the existing frame/text exclusion and the required vector/resource constraints.

Tile sheets need a further contract: tile dimensions, which edges join, whether
variants must cross-match, lighting continuity and gutters/bleed for the chosen
atlas consumer. Inspect repeated 3 × 3 tilings and mixed neighbors at the actual
game scale. A visually clean sheet alone does not prove seamless tiles.

Check the [current official API guide](https://developers.openai.com/api/docs/guides/image-generation)
when preparing requests. At the first trial, native SVG used the generation
endpoint; image edits could guide GIF with raster stills but could not output
SVG. A shared SVG sheet established style, then its rasterized scene guided the
GIF. Use supported reference mechanisms rather than promising an untested SVG
reference-edit route. Reuse the user's authorized credential route; keep secrets
out of prompts, records and source.

## Judge and extract

Retain exact sent prompts, parameters, usage, request IDs, original outputs and
intermediates in the owning record/bundle. A failed or weak output ends that
attempt; use the agreed retry budget or return the concrete failure for review.

Inspect the full sheet before extracting: composition, cross-cell debris,
consistent style, contour, vector structure and resource safety. Extract clean
groups without their grid translation. Keep the source original intact and
identify every derivative's source cell. Raster crops need exact rectangles;
SVGs need self-contained resources. Inspect every candidate at native and compact
UI size; rejected cells still count toward the request cost. Judge GIF motion
from decoded frames and playback, including the settled frame and transitions.
A traveling glint does not demonstrate a requested physical transformation.

Measure cost per generated cell and per useful/accepted asset, including rejects
and repairs. Packing is not automatically cheaper at matched quality. The
[first Spire batch](../../../docs/art/assets/spire-defense-batch/README.md)
produced nine separable scenes for about $0.16 versus $0.25 for three earlier
independent scenes, but used simpler drawing. Treat its 3 × 3, 480 × 336 cells
as evidence, not a fixed batch size or quality guarantee.

If a request loses its connection without returning usage or an image, keep the
failed attempt and mark its cost unknown; no output does not establish no charge.
The [Hearth effort comparison](../../../docs/art/assets/hearth-effort-comparison/README.md)
retains one such partial result, without a MAX-quality verdict or an automatic retry.

## Promote selectively

Choose the strongest useful cells rather than installing every output. Record
the selection, adaptation and superseded roles. Preserve unused cells and exact
prompts under the current hold. Adapt selected vectors into the existing live
renderer, with its palette/frame and accessible HTML; the catalogue must render
that same source. Verify actual card/board/hand and phone views before promotion.
Keep future variants and GIF studies out of runtime until they meet their own
purpose. Update WIP/current/recent-upgrade status and propose the next batch with
evidence; agreement on one batch does not authorize the next paid batch.
