# DCC workbench

`@card-workshop/dcc-workbench` owns editable Blender subjects, validated GLB candidates and reviewed immutable publications. The registry currently names **Briar Hydra**, **Nightjar**, **Phoenix**, **Storm Roc**, **Alley Prowler** and **Greatwood Wolf**, plus its three separately published evolved forms: **Bloom Warden**, **Elder Sentinel** and **Thorn Tyrant**. Their working masters live under `subjects/`; the earlier Hydra pilot and procedural gallery sources remain preserved. See the [native pilot record](../../docs/art/trials/native-pilots.md) and [batch record](../../docs/art/trials/native-batch-1.md) for the first batch, and the [Prowler trial](../../docs/art/trials/native-prowler-trial.md) for its later delegated native edit and limits. The [Wolf trial](../../docs/art/trials/native-wolf-trial.md) records the next bounded distal-tail refinement. The [evolved forms record](../../docs/art/assets/creatures/wolf-evolutions.md) separates a stopped delegated prototype from the user-authorized direct parent completion.

Open **DCC workbench** from any game table, or visit `/?workbench=dcc&asset=briar-hydra`. **Choose native asset** lists published deliveries. Intent, Form, Surface, Motion and Delivery inspect the same selected release using its frozen brief; they are not historical build stages. Downloads return that release’s exact GLB and editable source. Registered drafts without a publication are absent from the selector and do not break the browser.

## Quick start

Hydrate the [LFS assets](#storage-and-cloning), use the repository’s pinned runtime and setup from [maintenance governance](../../docs/engineering/maintenance.md), then:

```sh
npm run dev
npm run dcc -- list
npm run dcc -- doctor
npm run dcc -- verify --asset briar-hydra
```

Viewing and building need no Blender runtime. Selected deliveries have embedded dependencies and make no remote asset requests. Local authoring uses **Blender 4.5 LTS**; this checkout’s earlier pilot used 4.5.14 on macOS ARM64. Set `BLENDER_BIN` explicitly or use the discovered installed app, ignored `.runtime/Blender.app`, or `blender` on PATH. Blender is not a frontend dependency. The original ARM64 runtime came from the [official Blender 4.5 release directory](https://download.blender.org/release/Blender4.5/); its recorded DMG SHA-256 was `65134d9b07b20e2fa8d3c9e44f6f44ffb5c9774dd521b95f50387310241ca170`. This records that installation, not a checksum for every Blender version.

On this Mac, run commands that launch Blender or a browser with approved execution outside the restricted sandbox. Follow [AGENTS.md](../../AGENTS.md) for disposable browser profiles and startup failures. Hash, unit, lint and frontend-build checks remain sandboxed.

## Storage and cloning

Install Git LFS before cloning. From a clone or this existing checkout, run:

```sh
git lfs install --local
git lfs pull
npm run maintenance -- check
```

The repository’s attributes put `.blend` and `.glb` files under `sources/`, `subjects/`, `assets/` and `references/` in LFS, including preserved legacy binaries when they are next staged. Keep working bytes unchanged and stage only the deliberately owned paths; adoption does not rewrite history. Briefs, receipts, reviews and small accepted captures stay in ordinary Git. Rejected local iterations, test runs and source backups remain protected by retention policy. The [storage decision](../../docs/engineering/decisions/0004-native-asset-storage.md) records the trade-off.

A clone made without hydration can contain a short text file beginning `version https://git-lfs.github.com/spec/v1` where a model or source should be. `npm run maintenance -- check` reports the affected path and hydration command before binary validation; it does not fetch files. After `git lfs pull`, retry the check. A download/access failure is a storage-readiness issue: preserve the pointer, repair access or retrieve the missing object, and do not regenerate the artwork to hide it. `git lfs fsck` checks the local LFS objects; it does not prove that the remote has every required object.

Both CI jobs request LFS hydration and run the early check. On 2026-10-08, the parent verified upload and independent download of the **17,612,728-byte current Hydra GLB** with matching SHA-256; the [storage decision](../../docs/engineering/decisions/0004-native-asset-storage.md) records its identity and evidence. An isolated local-origin checkout also hydrated all 13 binary paths at its pinned scaffold snapshot and passed delivery/build checks. Only the Hydra object's remote transfer is established; availability of every required binary and a full GitHub checkout still need verification after commit/push.

There is currently no deployment workflow; future deployment must build with hydrated assets and publish real build output, including the source downloads offered by the workbench. Git-hosted pointer text is not a usable `.blend` or `.glb` download.

## Sources and delivery boundary

```text
registry.json + subjects/<id>/brief.json
                  ↓ declared identity, dependencies, profile and edit probes
subjects/<id>/source.blend  ← artist edits and saves here
                  ↓ blender/export_saved.py (no regeneration)
.work/runtime/<run>/<id>/   ← GLB, native audit, poses, sealed candidate
                  ↓ independent parent review of named candidate and evidence
assets/<publication>/releases/<receipt-hash>/
                  ↓ atomic current.json pointer
workbench → accepted gallery-scoped release → matching gallery study
```

| Home                                                         | Authority                                                                                                                                                                                                                    |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `registry.json`                                              | Asset IDs, study mapping, working source/brief, native dependencies, delivery profile and owned output paths.                                                                                                                |
| `subjects/<asset-id>/`                                       | Current editable `source.blend` and brief, including declared `nativeEdit` probes and delivery budgets.                                                                                                                      |
| `blender/export_saved.py`                                    | Evaluates saved native geometry, preserves hierarchy and fitted rigid attachments, freezes static authoring shape-key mixes only in the export process, and exports a single scene clip. No joining or automatic decimation. |
| `assets/briar-hydra/current.json`                            | Hydra publication pointer; immutable release contents include source, brief, GLB, audit, poses, receipt and reviewed evidence.                                                                                               |
| `assets/nightjar/published/current.json`                     | Nightjar publication pointer, created only on promotion. Its reserved flat compatibility paths are not duplicate deliverables.                                                                                               |
| `assets/phoenix/published/current.json`                      | Phoenix publication pointer and immutable reviewed source, model and evidence.                                                                                                                                               |
| Earlier `sources/`, `briefs/`, flat `assets/`, `references/` | Preserved pilot sources, outputs, receipts and comparisons; do not overwrite them to match a new source.                                                                                                                     |
| `src/`, application `src/art3d/`                             | Runtime loading, presentation, playback, VFX and simple composition. The frontend does not rebuild principal native anatomy.                                                                                                 |

The current masters combine **preserved triangulated deliveries and selective native reconstruction**. Nightjar's wings and roost, Phoenix's lower-wing coverage and grip, and Storm Roc's local feather coverage, wrists and grip were rebuilt regionally. Meshes, material assignments, rigs and actions are editable; original procedural construction, complete quad topology and a complete LOD pipeline have not been recovered. They declare no rebuild recipe. `dcc build`, `dcc components` and the legacy `dcc render` path do not regenerate or upgrade these masters; use Blender directly and export the saved source.

The registry/GLB interface distinguishes static, rigid and skinned profiles. The maintained saved-source adapter supports **rigid and skinned loops**; it explicitly rejects static delivery and animated shape-key weights. Saved shape-key controls are authoring edits, not exported morph-animation promises. Cameras, lights and temporary review supports belong to presentation; required source geometry and fitted motion belong to the delivery.

## Edit, publish and rebuild

1. Open the registered `subjects/<id>/source.blend`. Edit the named native assemblies, shape keys, material data, weights or actions and save. Preserve fitted dependents and inspect from several views. Export reads saved bytes; it never silently reconstructs the asset.
2. Run `npm run dcc -- export --asset <id>`. Export validates source stability, geometry, declared budgets and native evidence, then seals a fresh candidate under `.work/runtime/`. It does not change publication or artist source bytes.
3. Inspect that exact candidate under the [shared art rulebook](../../docs/art/art-direction.md). Keep named captures under its `evidence/` directory. The art director (the parent in historical trials) records a decision with `writeCandidateReview` in `releases.ts`, binding candidate digest, evidence hashes, observations and either `workbench` or `gallery` scope. Author self-review and user approval remain separate.
4. Run `npm run dcc -- promote --asset <id> --candidate <absolute-path>`. Promotion rechecks input freshness, the expected previous publication and parent review, completes an immutable release, then atomically switches `current.json`. A stale or failed candidate leaves the prior publication intact. Inspect an abandoned promotion lock before recovery; never remove another active publisher’s lock.
5. Run `npm run dcc -- verify --asset <id>`. This checks the published delivery against current working inputs. An artist may continue editing while the browser displays the previous frozen release; verification reports that freshness difference.

Only a release with an **accepted parent review scoped to `gallery`** changes its study’s gallery default. A `workbench` release remains inspectable without that cutover. Browser mapping uses the reviewed release’s frozen study identity, so an unreviewed registry edit cannot redirect existing art. There is no automatic review, promotion or fallback from a broken selected release to a different asset.

For the separated-role trial, follow the [delegation protocol](../../docs/art/delegation.md) and [Matriarch outcome](../../docs/art/trials/native-matriarch-trial.md). The existing `trial.ts` CLI uses v3 receipts: `prototype` unlocks author work; `reopen` permits bounded director polish; fresh independent clearance and `acceptance` unlock a `publisher` handoff. Release reviews retain `reviewer.role: parent`, with `reviewer.name` set to the actual Astra director ID. Sol operations may serialize that decision but cannot supply its own art acceptance. No release schema or historical receipt migration is needed.

A future recipe must explicitly describe which edits reconstruction replaces and produce a separate backed-up candidate. Neither the preserved legacy Hydra recipe nor an imported GLB is a recipe for the current native master. [Migration governance](../../docs/art/migration.md) owns delegation, batching and retention boundaries.

## Edit a native assembly in Blender

For current Hydra, open `subjects/briar-hydra/source.blend` and select **EDIT | Head.Search**. Under **Object Properties → Custom Properties**, **Muzzle reach** ranges from **0 to 1.5**. The declared gate probes **0, 0.75 and 1.5**, checking the cranium, mandible, upper/lower dentition and nostril while the sibling heads and body remain fixed. Inspect all fitted facial parts when editing; the gate is a selected operation’s contract, not proof of every possible sculpt edit.

For Nightjar, open `subjects/nightjar/source.blend` and select **EDIT | Wing.1**. **Fold settle** ranges from **0 to 1**; the gate probes **0, 0.5 and 1**. Shoulder mantle, a primary, a secondary plane and a covert patch move together; declared body, face, grip, branch and opposite-side probes stay fixed. The [brief](subjects/nightjar/brief.json) lists exact names. Regional wings and supported grips passed parent review; narrow rear primary-tip clearance remains a recorded stylization.

Keep direct mesh/shape-key editing available beneath controls. Save, export and compare the delivered result. Material or UV edits may require deliberate texture work; the exporter does not invent a new bake. The current source does not claim the earlier pilot’s four-control head interface or remesh recipe.

## Modules and creation

For Phoenix, open `subjects/phoenix/source.blend` and select **EDIT | Wing.1**. **Fan lift** ranges from **0 to 1**, with **0, 0.5 and 1** as verification values. It lifts the lower extended wing through a six-degree distal arc (about 13 cm at the farthest tip), anchoring its proximal 15 cm. Mantle, coverts, secondary vanes and shafts bend together; the wrist and primary fan retain their saved idle relative to the lifted assembly. The [brief](subjects/phoenix/brief.json) names moved and fixed probes. This is a saved authoring edit, not an exported morph animation.

For Storm Roc, open `subjects/stormroc/source.blend` and select **EDIT | Tail**. **Fan spread** ranges from **0 to 1**, verified at **0, 0.5 and 1**. Six outer tail vanes and their shafts spread around the fixed center feather, anchoring their proximal 6 cm; the maximum tip shift is about 10.3 cm. Body, wings, grip and stone remain fixed under this operation while the saved idle remains available. Its [brief](subjects/stormroc/brief.json) declares the probes. This is a saved authoring edit, not exported morph animation.

For Alley Prowler, open `subjects/prowler/source.blend` and select **EDIT | Tail**. **Tail lift** ranges from **0 to 1**, verified at **0, 0.5 and 1**. It raises the distal curled tail by about 14 cm under the model's unit convention, smoothly anchoring the first half of its centerline arclength. The body, head and paws retain their saved geometry and the ten-bone idle remains fitted. Its [brief](subjects/prowler/brief.json) declares one moving tail and 43 fixed meshes. This is a saved native edit, not exported morph animation.

For Greatwood Wolf, open `subjects/wolf/source.blend` and select **EDIT | Tail**. **Tail relax** ranges from **0 to 1**, verified at **0, 0.5 and 1**, with saved default **0.5**. It opens the distal hook and softens the brush profile while anchoring the first half of original centerline arclength. All 38 other meshes stay fixed under the operation; the ten-joint six-second idle remains fitted. The [brief](subjects/wolf/brief.json) declares the probes. This is a static native authoring edit, not exported morph animation.

Shared investment follows actual variation: Hydra’s fitted muzzle operation and Nightjar’s wing-fold operation are different semantic assemblies built from native shape keys, parenting and rigs. They demonstrate an edit/export mechanism, not one universal anatomical generator. The old `head_shape.py`, `head_components.py` and `scale_components.py` remain part of the preserved reconstruction pilot and its historical contracts.

`blender/saved_export_plan.py` checks source, profile and fresh-output boundaries. `export_saved.py` identifies the delivery collection through `scene["dcc_delivery_collection"]` or a unique `dcc_delivery` tag. It samples every delivery mesh at five times in world Y-up coordinates, including rigid attachments. Native finite/loop checks inspect all evaluated vertices; consumer evidence uses up to 16 points per named mesh. Motion and loop tolerances are **1e-6** and **1e-5 model units**, respectively. Stationary supports are allowed; `dcc_require_rigid_motion` explicitly requires moving rigid attachments where offered.

All Python modules receive Ruff, strict mypy and maintained contract tests while retaining Blender 4.5’s Python 3.11 syntax compatibility. CLI, registry, receipt and frontend code receive typed ESLint and strict TypeScript. Add new nested source homes only together with enforced checker and discovery coverage.

Greatwood Wolf also offers `wolf-bloom`, `wolf-elder` and `wolf-thorn` as separately editable and published forms. Each retains the same native Tail relax operation; all added anatomy stays fixed under that operation. The original `wolf` source and release remain unchanged.

## Verification and provenance

```sh
npm run test:dcc
npm run check:maintenance
npm run check
npm run test:dcc:saved -- --asset briar-hydra
npm run test:dcc:saved -- --asset nightjar
npm run test:dcc:saved -- --asset phoenix
npm run test:browser -- tests/browser/dcc-workbench.spec.ts tests/browser/art3d.spec.ts tests/browser/shell.spec.ts
```

- **Maintained checks:** registry identity and ownership, declared dependency closure, GLB contracts, immutable candidates, review binding, publication isolation and recovery; lint/type/Python checks and production build. `npm run check` also covers application/geometry behavior and seeded simulations.
- **Native edit gate:** `test:dcc:saved` copies the selected source, brief and dependencies into protected `test-results/dcc-native/saved-*/package/`. The brief’s `nativeEdit` declaration names one control, three values and moved/fixed probes. At five frames it checks all probe vertices, movement through adjacent values, fixed parts and restoration within 1e-6; then saves/reloads a distinct edited value, exports and seals the copy, and runs the independent browser comparison. Production source, pointer, published model, source and receipt remain hash-pinned, including on failure. The gate never promotes its candidate.
- **Consumer agreement:** browser comparison matches initial world points by named mesh, then evaluates those same vertices at five times. It includes skinned and rigid meshes and checks errors below 1e-4 model units. Vertex sampling is not exhaustive animation or contact verification.
- **Browser behavior:** correct selected downloads, load errors, playback, reduced motion, phone layout, navigation/focus, save preservation and native/procedural gallery coexistence. Review the captured pixels separately for quality.
- **Legacy native gate:** `npm run test:dcc:native` remains the earlier reconstructed Hydra pilot’s control/save/reload test. It does not substitute for `test:dcc:saved` on current `subjects/` masters. Candidate-dependent browser cases skip when their native input is absent; an ordinary CI/browser pass is not native execution.

Run commands after freezing the owned source/config files; a Vite restart can reset UI selection during a browser test. Final run receipts and candidate decisions belong in the [native pilot record](../../docs/art/trials/native-pilots.md), not an undated passing-count claim here. Delivery budgets bound the selected artifact; neither they nor screenshot correctness establishes phone performance or aesthetic acceptance.

Evidence containing editable sources is protected under [maintenance retention](../../docs/engineering/maintenance.md#retention-and-deletion-authority). Disposable renders require their own retention classification. Publication and test consolidation do not authorize deletion of sources, accepted references or historical receipts.

## Matched Hydra comparison

Open `/?workbench=dcc&asset=briar-hydra&compare=hydra`. Both panels share renderer, camera, light and clock; the comparison starts paused in clay. Front/side/back/portrait views, surface modes and **Swap sides** support inspection against preserved procedural, original-pilot and gesture-revision GLBs. The current panel loads the published native delivery, not an unreviewed working source.

Framing covers the union of the four compared assets at five times without independently normalizing their size. Raw model units are not measured physical scale, and equal clip times are not necessarily equal poses. [Preserved hashes](references/comparison/baseline.json), [quality baseline](references/comparison/quality-baseline.json) and the [earlier pilot record](../../docs/art/assets/creatures/briar-hydra.md) retain historical identity. This is controlled visual evidence, not an automatic authoring-tool score.

## Lean session save and capture protection

For direct Blender session scripts, import the maintained helpers from `blender/`:

```python
from authoring_plan import save_working_source
from review_plan import capture_path, close_captures, new_capture_batch

# Use the existing immutable release as recovery baseline; keep one working source.
save_working_source(source)  # Must be the loaded .blend; preserves the .blend1 backup.
batch = new_capture_batch(workspace)
for name in ["whole.png", "detail.png", "motion.png"]:
    scene.render.filepath = str(capture_path(batch, name))
    bpy.ops.render.render(write_still=True)
close_captures(batch, {"whole.png", "detail.png", "motion.png"})
```

Call `capture_path` immediately before each single-writer render. It refuses existing
files, unsafe names and closed batches. `save_working_source` temporarily disables
Blender backup rotation and restores the preference even on failure; it permits only
an explicit save of the loaded working source. These are opt-in helpers, not a sandbox
for arbitrary Python scripts. The legacy review renderer uses the same capture guard.

Complete render batches reuse the existing 14-day disposable-output retention receipt;
interrupted batches remain unclassified. Before expiry, pin a selected review or copy its
needed captures into the existing candidate evidence set. Keep final/strongest unfinished
sources and consequential rejection evidence; routine previews are temporary. Additional
source milestones need a concrete construction decision. No per-iteration source copies
or lineage manifests are created. Historical sources, backups and evidence keep their
existing protection. See [retention authority](../../docs/engineering/maintenance.md#retention-and-deletion-authority).

## Canid rig and retargeting pilot

Open `/?workbench=dcc&compare=canid`, or choose **Canid motion study** in the workbench.
The refined family has 28 deformation joints and four saved source clips at 60 fps:
alert idle (4 s), brisk walk (0.90 s), trot (0.60 s), and planted look (2.50 s).
Ash supplies the family proportions, Russet changes the coat, and Moss is broader with
shorter legs and fitted stride. The viewer offers both revisions and matched before/after
views with one camera, clay/material and skeleton controls, and real elapsed time.

The initial 20-joint, three-clip baseline remains byte-identical at its original paths.
Use `--baseline` to select its command adapter. The [trial record](../../docs/art/trials/canid-retargeting.md)
records the accepted scope, evidence and limitations. Neither revision replaces the Wolf gallery.

### Source ownership and editing

- [Family authoring recipes](subjects/canid/authoring/README.md) own anatomy, surface,
  rig, motion parameters, fitting and delivery. Their module map and construction/review
  commands live with the code. General native helpers remain shared.
- `subjects/canid/refined/motion.blend` is the shared motion master. Body and foot controls
  use world XYZ axes (X forward, Y left, Z up); head, neck, spine, pelvis, scapula, tail
  and ear controls use their named bone's rest axes. Both source and target use the same
  control convention. Hocks articulate, and toe-pivot compensation grounds heel lift.
- `subjects/canid/refined/<id>/source.blend` owns native geometry, weights, materials,
  fitted rest skeleton, and derived control actions. Each `retarget.json` pins source
  identity, chain mapping, proportion corrections, and mesh/weight digest.
- `assets/canid/refined/<id>.glb` and `<id>.json` are the baked deliveries and receipts.
  They include sampled native poses and contact audits at every authored frame.

Recipes are first-class source material and construct distinct candidates. Saved Blender
masters remain authoritative for export. Fitting samples the saved shared actions rather
than regenerating the gait, and preserves character meshes and weights. It deliberately
replaces the character action library; save local motion experiments separately and move
intended shared edits into the motion master before fitting. Export bakes a temporary
constraint-free deformation skeleton and does not save over the master.

### Commands

Use the pinned Node runtime. Native commands require approved execution outside the
restricted macOS sandbox. `BLENDER_BIN` can select another Blender 4.5 executable.

```sh
nvm use
npm run dcc:canid -- check
npm run dcc:canid -- check --baseline
npm run dcc:canid -- fit
npm run dcc:canid -- export --output test-results/canid-candidate-01
npm run dcc:canid -- verify test-results/canid-edit-proof-01
CANID_NATIVE_RESULTS=test-results/canid-edit-proof-01 npm run test:browser -- tests/browser/canid.spec.ts
```

Export and verification require fresh output files/directories. Inspect new exports before
explicitly replacing the refined delivery; never publish a mutation-test candidate. `check`
validates bundled source/delivery identities, complete clips, normalized skinning and
normals, loop endpoints, foot clearance/contact and budgets. An optional directory argument
checks a fresh export against the current masters. For independent reconstruction use
`bootstrap --root <fresh-directory>`; it refuses existing requested masters before writing.
Ordinary builds and checks do not launch Blender.

The native verifier refuses construction over existing sources, then edits one saved look
key by 0.18 radians on disposable copies. It fits all three targets, checks unchanged mesh
and weight digests, saves/reloads, and exports. The optional browser case compares these
changed deliveries with their native pose receipts. Without `CANID_NATIVE_RESULTS`, that
case is explicitly skipped. Successful technical checks do not establish visual approval.
