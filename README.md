# Shader Pipeline Lab

A small, inspectable rendering pipeline for learning how a triangle becomes a pixel.
This is an isolated Git repository with a dependency-free application. It does not modify or import the
Card Workshop application. All rendering math is plain JavaScript; WebGL is used
only in the comparison view.

## Run

```sh
npm start
```

Open http://127.0.0.1:4178. Set `PORT=4180 npm start` if needed. There is no install
or build step. Use a modern browser with JavaScript modules. WebGL is optional:
if it is unavailable, the full CPU lesson remains usable. Node is pinned to
24.21.0 in `.nvmrc`, matching the parent workspace.

```sh
nvm use
npm run check
```

Browser verification is optional and reuses the parent repository's installed
Playwright/Chrome harness. With the server running, use `npm run test:browser`
from this folder. It checks all stages, CPU/GPU agreement, controls, clipping and
reset, narrow reflow, a small window equivalent to desktop 200% zoom, and the
WebGL-unavailable fallback. Only browser verification depends on the parent; `npm start` and `npm run check` work
with Node alone. Set `CAPTURE_REVIEW=1 npm run test:browser` to save successful
review screenshots; routine runs capture only failures.

## Workspace and learning journey

- **Scene:** the cube and its retained parameter values.
- **Viewport:** the current stage's visual output. It stays mounted while you
  change stages, inspect data, or read code.
- **Inspector:** stage controls followed by **Data**, **Trace**, and **Code** views.
  Only this bounded panel scrolls; changing tabs keeps the output beside it.
- **Pipeline navigator:** the floating stage selector at the bottom. Previous/next
  and its menu share one stage state. Escape closes the menu and restores focus.

On a phone, the viewport stays above the inspector in the same window. Stage
controls have their own bounded region; the current stage's experiment appears
before upstream scene settings. Long payloads remain in the inspector, and wide
fragment tables have an explicit horizontal-scroll cue.

1. Start at **Vertex input**. Choose a triangle in the viewport toolbar. Its
   model-space record appears in **Data**; there are no scene knobs at this stage.
2. Use the floating navigator to advance. Controls appear only where their effect
   reaches the current stage. Their values and the selected triangle/pixel survive
   navigation. **Reset scene** restores defaults without changing the stage.
3. At **Rasterize & interpolate**, toggle perspective correction and compare the
   UV gradients. In **Trace**, compare screen weights λ with attribute weights q.
4. At **Fragment shader**, toggle the checker or lighting. Light direction is
   disabled when lighting is off. Perspective correction is disabled when the
   checker is off, since it cannot change this stage's color in that state.
5. At **Depth test**, select a pixel and open **Trace** to see writes/rejections.
   Use **Disable depth test** to expose draw order. Shading knobs are absent from
   this depth-only view because they do not change its depth output.
6. At **Clip triangles**, use **Clip the cube**, or increase the near plane to 7
   for a fully clipped scene. **Reset scene** recovers it.
7. At **Framebuffer**, use **Compare GPU** to place the actual WebGL result beside
   the CPU image, with one shared set of settings. Comparison is specific to the
   final color stage; it is hidden elsewhere and restored when you return.
8. Use **Code** for the actual CPU implementation. Relevant stages also offer an
   **Equivalent GLSL** disclosure. Data, code and controls all share the viewport.

Control applicability and order have one executable owner: `src/controls.js`.
It distinguishes hidden out-of-stage knobs from disabled dependent controls.
The vertex shader diagram shows its unclipped output; clipping first applies in
**Clip triangles**. In **Vertex shader**, the near value is a retained projection
constant rather than an exposed experiment; it becomes adjustable at clipping.

## The asset

One cube: 8 spatial corners, 24 face-specific vertex records, 12 triangles.
Every record contains position, normal, color and UV. Each face has a different
color and a procedural 6 × 6 checker. Duplicate records at corners let adjacent
faces use different normals and UVs. No model download, image texture or asset
pipeline obscures the calculations.

## The pipeline

| Stage             | Input                       | Process                             | Output                          | Owner          |
| ----------------- | --------------------------- | ----------------------------------- | ------------------------------- | -------------- |
| Vertex input      | Vertex records, indices     | Assemble indexed triangles          | Corner attributes               | Application    |
| Vertex shader     | Position, matrices, normal  | Model → view → projection           | Clip XYZW, varyings             | Programmable   |
| Clipping          | Clip-space triangles        | Six-plane homogeneous clipping      | Retained triangles, new corners | Fixed function |
| Divide & viewport | Clip XYZW                   | Divide by w, map to screen          | XY pixels, depth                | Fixed function |
| Rasterization     | Screen triangles            | Coverage, barycentric interpolation | Candidate fragments             | Fixed function |
| Fragment shader   | UV, normal, material, light | Checker × diffuse lighting          | RGBA                            | Programmable   |
| Depth test        | RGBA, depth, stored depth   | LESS comparison                     | Accepted writes                 | Fixed function |
| Framebuffer       | Accepted colors             | Store and display pixels            | RGBA image                      | Output         |

The CPU follows this teaching order literally. Real GPUs may reorder eligible
depth tests and parallelize work. A fragment is a candidate sample contribution,
not necessarily a final visible pixel. Clipping interpolates in homogeneous space
before division. UVs use perspective-correct weights; window depth uses screen
barycentric weights. Shared triangle edges use a top-left ownership rule.

The first four large views are explicitly labeled **geometry diagrams**, not raw
framebuffers. The model-input diagram uses a fixed orthographic viewing aid; later
geometry diagrams show transformed/projected positions. A cyan triangle follows
the selection. UV and fragment-color diagnostic images deliberately use last-write
order with no depth test. Only the depth/final views apply the depth setting.
The fragment-stage numeric example prefers the selected triangle at the inspected
pixel, then falls back to the first actual contribution; its triangle ID is shown.
The coordinate trace follows an original corner even if that corner is clipped;
it labels corners outside the clip volume.

## Read the code in this order

- `src/mesh.js`: the complete asset data.
- `src/math.js`: small vector/matrix helpers; column-major matrices, column vectors.
- `src/pipeline.js`: the CPU pipeline and retained intermediate results. Each named
  function is a teaching boundary. `render()` runs the stages in order.
- `src/gpu.js`: equivalent GLSL and the WebGL setup/draw calls.
- `src/lessons.js`: stage explanations, separate from calculations.
- `src/controls.js`: stage applicability, order and dependent-control reasons.
- `src/app.js`: controls, stage diagrams and inspectors; no authoritative math.
- `tests/pipeline.test.js`: numeric expectations, clipping, interpolation, shared
  edges, shading and complete visibility/empty-scene journeys.

## Scope and limits

This MVP teaches one opaque draw with one point sample per pixel and diffuse plus
ambient lighting. No blending, back-face culling, stencil, MSAA, shadows, gamma
conversion, nonuniform scale, tessellation or geometry shaders. The checker is a
procedural function, not a texture sampler. The normal transform assumes rotation
only. Viewport coordinates use a top-left canvas origin; WebGL uses bottom-left.

CPU calculations use JavaScript double precision; WebGL uses shader/device
precision. Edge ownership, checker boundaries and color rounding may differ
slightly. The comparison is educational, not a bit-for-bit GPU conformance suite.
Buffers are 192 × 192, enlarged with nearest-neighbor display. No worker or
continuous animation runs: calculations happen only at initial load or after
scene/pixel controls change. Intermediate buffers live in memory and are replaced
on the next render. Nothing is uploaded or saved by the app.

## Verified locally — 2026-11-04

- `npm run check`: all maintained JavaScript syntax checks and 8 CPU tests pass.
- Browser checks exercise every exposed knob at every stage and require an actual
  change in the viewport or live output data; stage navigation and inspector
  scrolling preserve viewport bounds and retained selections.
- Five browser journeys cover dependencies, keyboard tabs/menu dismissal,
  CPU/WebGL comparison, clipping/reset, phone and small-window layouts, and
  unavailable WebGL. The default CPU/GPU scene differs by more than 2 color
  levels at 1 of 36,864 pixels; scoped numerical agreement is not GPU conformance.
- Screenshot review is separate from technical checks. Temporary review maps,
  captures and capture scripts were retired at closeout; the conclusions and
  regression journeys remain in this guide and the tests. Parent game, simulation,
  Blender and maintenance scopes are unaffected by this standalone workspace.

## Delivery and retention

This independent repository lives under the game's ignored
`.work/shader-pipeline-lab/` directory on branch `codex/shader-pipeline-lab`. Its
source, tests and guide are committed together; parent game sources are separate.
No push, hosted issue, PR or deployment is part of this slice. The portable UI
lessons live in repo-kit's `user/practices/ui-ux.md`, with their provenance in
`docs/reviews/README.md` there.

`npm run check` covers every maintained JavaScript source with syntax checks and
numeric/end-to-end CPU tests. `npm run test:browser` covers the actual controls
and GPU comparison. Parent game, simulation and native-art suites do not cover
this independent app and are outside this slice.

Keep the learning app and its tests as source. `.artifacts/` is ignored temporary
verification output: retire successful review captures after conclusions are
recorded, and review remaining failure/debug evidence within 30 days. Nothing
cleans up automatically.

Reference: [Khronos rendering pipeline overview](https://wikis.khronos.org/opengl/Rendering_Pipeline_Overview).
The stage grouping here is deliberately simplified for one WebGL draw.
