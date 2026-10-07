# DCC workbench

`@card-workshop/dcc-workbench` is a local, private workspace package for taking an asset from an authored brief through Blender to an animated browser preview. The first pilot is a new **Briar Hydra** interpretation. The existing procedural Hydra and game art are preserved.

Open **DCC workbench** from any game table, or visit `/?workbench=dcc`. Intent, Form, Surface, Motion and Delivery expose the brief and different inspection views of the same published asset. These are not historical stage snapshots. The page supports orbit/zoom, named views, clay/wire inspection, a rig overlay, pause/scrub, reduced motion and downloads of both the GLB and editable Blender source.

## Quick start

From the repository root:

```sh
npm ci
npm run dev
npm run dcc -- doctor
npm run dcc -- verify
```

Viewing or building the frontend does **not** require Blender. The published asset is checked in, uses embedded textures and makes no remote asset requests. Blender is required only to author, render or export.

The pilot was built with **Blender 4.5.14 LTS**, macOS ARM64. Discovery checks `BLENDER_BIN`, `/Applications/Blender.app`, the ignored package-local `.runtime/Blender.app`, then `blender` on PATH. This checkout has the official app in `.runtime/`; it is not a package dependency and is not committed. Other machines should install Blender 4.5 LTS from [Blender](https://www.blender.org/download/lts/4-5/) or set an executable explicitly:

```sh
BLENDER_BIN=/path/to/blender npm run dcc -- doctor
```

The local runtime came from [the official release directory](https://download.blender.org/release/Blender4.5/). The ARM64 DMG's verified SHA-256 was `65134d9b07b20e2fa8d3c9e44f6f44ffb5c9774dd521b95f50387310241ca170`.

## The vertical pipeline

```text
briefs/briar-hydra.json
    ↓ build_hydra.py — native Blender construction and material baking
sources/briar-hydra.blend  ← hand-edit this source in Blender
    ↓ export_asset.py — evaluate, simplify, skin audit, export
assets/briar-hydra.glb + manifest.json + pose-samples.json
    ↓ GLTFLoader + AnimationMixer
src/Workbench.tsx — /?workbench=dcc
```

| Stage        | Authority and output                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ideation     | Brief: physical interpretation, gesture, specific polish decisions, palette and delivery budgets. The UI gesture diagram is a schematic, not a concept render.            |
| Construction | Native Bezier gesture guides, fused voxel-remeshed skin, a quad skull cage, fitted throat shells, retained subdivision modifiers and a 22-joint armature.                 |
| Surface      | Blender Noise/Voronoi shader graphs, UV layout, and packed pigment/normal bakes. Shader graphs remain as editable upstream references; the browser uses the baked images. |
| Motion       | One editable `Marsh Vigil` action, 24 fps, source frames 1–145. Neck/head/jaw phases differ; the coil anchor is fixed.                                                    |
| Delivery     | A copy of the scene has finishing modifiers applied, is joined and simplified, and has weights limited to four influences. Export shifts animation to 0–6 seconds.        |
| Display      | The package loads the exported GLB. The browser owns camera, lighting, inspection and playback; game rules remain independent.                                            |

`CONSTRUCTION` curves are retained guides, not a live dependency graph for the remeshed skin. Edit the skin directly for hand finishing. Change the recipe to regenerate anatomy. Voxel remeshing is applied; subdivision and deformation remain live in the saved source.

## Edit, publish and rebuild

1. Open `sources/briar-hydra.blend` in Blender. The delivery collection, named rig and skin identify the export contract. Make mesh, material, weight or action edits and save.
2. Run `npm run dcc -- export`. This reads the saved source and preserves its bytes. It does not regenerate it from Python. Re-bake the retained procedural graphs if changing those graphs or UVs; publishing does not silently replace an artist's baked images.
3. Run `npm run dcc -- verify`, then inspect `/?workbench=dcc` at front, side, back, motion extremes and phone size. Use `npm run dcc -- render` for four neutral Blender-source renders under a fresh ignored `test-results/disposable/dcc-review-<run>/` directory. Complete runs are eligible for cleanup 14 days after closure; pin any run needed as lasting evidence.
4. To regenerate from the recipe, run `npm run dcc -- build --rebuild`. Existing source is copied to ignored `test-results/dcc-backups/` first. Plain `build` refuses to overwrite an existing source. A first build without a source needs no flag.

The pilot's reserved delivery collection and rig/body names are used by the exporter; arbitrary renamed scenes are not supported. This is a small one-asset pipeline, not an asset manager or a general Blender add-on. Hand edits need not round-trip back into the Python recipe. Asset authors should review and commit the `.blend`, exported GLB and receipt together.

On this Mac, the restricted command sandbox caused Blender to crash during Metal initialization before Python ran. Run Blender authoring/render/export with approved execution outside that sandbox. Follow the root `AGENTS.md` for browser-launch approval and disposable profiles. Ordinary hash, unit and frontend build checks remain sandboxed.

## Verification and provenance

```sh
npm run test:dcc
npm run check
npm run test:browser -- tests/browser/dcc-workbench.spec.ts tests/browser/shell.spec.ts
```

- Blender checks finite source vertices, normalized skin weights, anchored support and loop closure across five frames.
- Publishing parses the actual binary GLB, rejects non-finite accessors, external resources, invalid weights, broken loop endpoints and budget overruns. Budgets are 180,000 triangles, 16,000,000 bytes and 64 joints; these are pilot limits, not mobile performance guarantees.
- The receipt pins the brief, editable source, recipe, exporter, pipeline, GLB, authoring audit and sampled poses with SHA-256. `verify` rejects stale delivery after source changes. A failed candidate validation leaves the previous GLB in place; a changed source still requires a successful export.
- An independent browser check matches 64 evaluated Blender vertices at five times against Three.js skinning. Browser checks also exercise playback, exact loop images, downloads, phone layout, reduced motion, error handling, return focus and save preservation.
- Native review renders and browser review captures live under ignored `test-results/dcc-pilot/`. The source and published deliverables live in this package.

The before image in `references/` is a copy of the user-accepted living Hydra direction from `test-results/hydra-delivery/hydra-hero.png`; it is a visual reference, not a frozen executable baseline or an equal-lighting comparison. The original builder remains `src/art3d/hydra.ts`. The [shared art rulebook](../../docs/art/art-direction.md) governs visual review. Passing checks establishes export/interaction behavior, not superior art or user approval.

The [durable asset record](../../docs/art/assets/briar-hydra.md) records review status, consequential revisions, historical evidence and remaining limits. The superseded session review has been consolidated there.

## Maintained native pipeline

`npm run check:python` runs Ruff, strict mypy and pure contract tests for every Python file in `blender/`. Builder, exporter and renderer have explicit entry points; importing them does not load Blender or mutate a scene. Blender 4.5 uses Python 3.11, so native syntax remains compatible despite the separate Python 3.12 checker runtime. The typed delivery CLI and compatibility `pipeline.mjs` entry are covered by strict TypeScript, typed ESLint and publication tests.

Build and export write fresh candidates. Export checks source stability, geometry, native audit and all 64 pose samples at five times before publishing. Every successful export retains the exact preceding manifest under `assets/receipts/<sha256>.json`, pins that receipt in the new manifest, and archives the preceding four delivery files under protected `test-results/dcc-delivery-history/<sha256>/`. Publication installs data before its receipt; interruption is detectable by `verify`, and the previous bytes remain recoverable. These histories are outside automatic pruning. Native rendering never resaves the artist source.

## Package boundary

- `blender/`, `briefs/`, `sources/` and `assets/` own authoring and delivery. No game-module imports or rule/save changes.
- `src/` is the frontend entry. The application shell lazy-loads this private workspace package. The existing gallery does not depend on it.
- Authoring happens locally through the CLI and Blender. The frontend has no filesystem write or arbitrary Python-execution bridge.
- The retained source is suitable for further sculpting and rig work. It is not hand-retopologized production character topology, a biological model, or a complete LOD pipeline.

## Matched Hydra comparison

Choose **Compare Hydra versions** in the workbench, or open `/?workbench=dcc&compare=hydra`.
The comparison starts paused in clay. Named front/side/back/portrait views, orbit/zoom,
silhouette/clay/material display, a shared six-second timeline and **Swap sides** apply to
both panels. **Accepted vs candidate** compares the preserved procedural delivery with the
current Blender export; **Quality before / after** compares the preserved gesture revision with the current export; **Original pilot vs current** retains the earlier pilot comparison. Narrow screens stack equally sized views.

One renderer, camera, lighting setup and clock govern both panels. The first-pose geometry
is grounded once, without changing authored scale. Camera distance is fitted to the union
of all four assets at five sampled times, including versions not currently displayed;
switching pairs or sides never refits an individual subject. Raw model units are not a
measured physical scale, and equal animation times are not equivalent anatomical poses.
This is visual comparison evidence, not a benchmark of authoring tools.

[Preserved reference hashes](references/comparison/baseline.json) pin the original baseline GLBs,
the original procedural export's source hashes, and the Git revision containing the
pre-revision Blender source. These baseline files are checked by `npm run test:dcc`.
`tests/browser/hydra-comparison.spec.ts` covers the shared controls, loop closure, preserved
saves, narrow layout, reduced motion and failed asset loading.

The source and fresh-build recipe include the low-neck gesture and the semantic head modules described below. Hand edits still belong to the saved source; export never rebuilds it. The [asset record](../../docs/art/assets/briar-hydra.md) separates revisions, technical verification and user judgment.

## Edit a head in Blender

1. Open `sources/briar-hydra.blend`. In the Outliner, select **EDIT | Head.Search**, **EDIT | Head.Scent**, or **EDIT | Head.Guard**.
2. In **Object Properties → Custom Properties**, adjust **Muzzle reach**, **Cranial taper**, **Crown depth**, or **Horn sweep**. Values range from 0 to 1.5; zero restores that aspect of the original source cage. The selected head’s 51 fitted meshes share these controls. The jaw, teeth, oral surfaces, eyes and brows follow coordinated anatomical transforms, while the existing animation remains editable on the rig.
3. Use the **HEAD | Search/Scent/Guard** collections to find the meshes. Meshes retain native shape keys and armature modifiers. Edit their Basis or a named key when a parameter alone is insufficient; keep fitted parts in view.
4. Save, then run `npm run dcc -- export` and review the browser comparison. Export verifies that each evaluated head shape matches its displayed control, then freezes the saved shape-key mix only in a delivery copy before simplification and skin export. The source retains its keys and drivers. Material/UV changes that affect the baked skin still require an explicit re-bake.

This is the fluent edit loop for the current source: **named control → inspect in Blender → save → export → inspect the same deformation in the browser**. Sliders are authoring controls, not new browser morph targets.

## Modules and creation

Run `npm run test:dcc:native` from the repository root after changing native authoring or
export behavior. It uses `BLENDER_BIN`, the installed Blender app or the bundled package
runtime, then the existing disposable-profile browser harness. On macOS the whole command
requires approved execution outside the restricted sandbox. Ordinary Python checks remain
sandboxed and do not replace this native gate.

The gate copies the saved source into a fresh `test-results/dcc-native/edit-loop-*/source-edit/`
directory, checks all twelve head controls at 0, 1.3, 1.5 and their restored values, and proves
the clamping guard rejects a damaged key. It saves/reloads a Search muzzle edit, exports that
copy and compares 64 native vertices at five times with the actual browser-loaded GLB.
It never publishes the candidate and requires the original source, delivered GLB and receipt
to retain their hashes. Evidence contains an editable source and is protected from disposable
render pruning. The corresponding browser test explicitly skips without this native input.

| Module                         | Interface and current reuse                                                                                                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blender/head_shape.py`        | Pure head-local shape offsets and three role presets. A small anatomical coordinate convention keeps muzzle, jaw and facial details aligned.                                           |
| `blender/head_components.py`   | `install_heads(collection, rig)` installs three named native assemblies, four controls each, and coordinated shape keys. It refuses to replace existing artist shape keys or controls. |
| `blender/scale_components.py`  | `install_scales(collection, rig)` fits three editable flank/dorsal patches to their own skin regions and inherits skin weights. It rejects sibling-neck binding.                       |
| `blender/author_components.py` | Installs modules into a fresh candidate copied from the existing artist source. It neither resets the scene nor replaces the animation.                                                |

`npm run dcc -- components` is a one-time upgrade of an older Hydra source: it creates a fresh candidate, checks source stability, backs up the source, installs the candidate and exports it. On the current source it refuses a second installation; use its existing controls. Backups live under `test-results/dcc-backups/`. As with source edits, a failed export leaves the saved source requiring correction or restoration; the previous delivery is retained until candidate validation succeeds.

Fresh `dcc build` also installs these modules. `build --rebuild` is an explicit full reconstruction with a source backup, and does not preserve later hand edits. The pure head deformation is reusable; the current installers deliberately know the Hydra rig names, anatomical frames and source materials. Reusing them for another creature requires an adapter for those contracts. This is a working three-head authoring system, not a general character generator or a retopology tool.

The scale patches remain ordinary editable meshes. Their density and footprint are recipe choices in `scale_components.py`, not live sliders. Whole-body gesture, remeshed anatomy, UV changes and material baking remain distinct authoring work. The next extraction should follow another actual asset, keeping these interfaces small.
