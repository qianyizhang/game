# Native asset migration pilots

**Status, 2026-10-08:** Hydra and Nightjar are parent-accepted native gallery defaults. Nightjar's regional wing, branch and grip reconstruction completed the second pilot. Both saved native edit gates passed; shared application checks and isolated LFS checkout verification passed at the earlier scaffold snapshot. Neither native revision has new user art approval recorded.

The [migration workflow](../migration.md) owns scope and orchestration; the [package README](../../../packages/dcc-workbench/README.md) owns commands and source-edit instructions. The [art rulebook](../art-direction.md) remains the single aesthetic authority. This record describes the pilots and their limits, without duplicating that rulebook.

## Published pilots

These are measurements of the published deliveries, not physical-phone performance results. Each `current.json` and its immutable receipt determine the selected release.

| Candidate   | Triangles |  GLB bytes | Joints | Native meshes sampled  | Publication scope        |
| ----------- | --------: | ---------: | -----: | ---------------------- | ------------------------ |
| Briar Hydra |   572,476 | 17,612,728 |     28 | 11 skinned + 153 rigid | Gallery; parent accepted |
| Nightjar    |    88,658 | 16,711,200 |      2 | 1 skinned + 84 rigid   | Gallery; parent accepted |

Both candidates retain one six-second idle at 24 fps. Native pose evidence covers five times, all named skinned and rigid meshes, and up to 16 sampled points per mesh for independent browser comparison. Native finite/loop audits inspect all evaluated vertices. Sampling does not prove every possible pose, anatomical contact or user edit.

Hydra’s brief temporarily permits **600,000 triangles and 20,000,000 bytes for this one preservation subject**. This is a conscious fidelity allowance, not a general asset budget or a phone-performance pass. Nightjar’s declared caps are 150,000 triangles and 20,000,000 bytes. Performance and later LOD work need their own evidence.

## Hydra: preserve the accepted subject, then edit natively

The working source is [subjects/briar-hydra/source.blend](../../../packages/dcc-workbench/subjects/briar-hydra/source.blend), with its [brief and edit declaration](../../../packages/dcc-workbench/subjects/briar-hydra/brief.json). It imports the [accepted procedural Hydra delivery](../../../packages/dcc-workbench/references/comparison/accepted-hydra.glb), whose frozen identity is retained in the comparison provenance.

A guided Sol 6.1 high-effort author produced two reconstruction rounds that did not reach the established Hydra bar. The parent rejected that representation and directed preservation of the accepted geometry as the editable native starting point. The resulting workflow is mixed, guided work; it is not evidence that an unaided author or a general primitive system achieved the result.

The native scene retains the coil, unequal neck gestures, fitted head parts, rig and idle. Select **EDIT | Head.Search → Muzzle reach** in Object Properties → Custom Properties. Its usable range is **0–1.5**; the gate checks **0, 0.75 and 1.5**. Cranium, mandible, upper/lower dentition and nostril are the moved probes; the other two crania and joined body are fixed probes. Inspect the full assembly as well as these measured probes.

Global decimation experiments around **300,000** and **180,000 triangles** damaged quiet coil-plate edges. They were not accepted as replacement deliveries. The parent retained the full candidate rather than treat triangle reduction as quality evidence. Regional optimization remains future work.

The editable master is triangulated. Shape keys, rig, actions and materials are native and editable, but procedural construction, quad topology and a retopology workflow have not been recovered. No reconstruction recipe is declared for this master. The earlier reconstructed Hydra source, four-control head modules and their historical evidence remain separate in the [original pilot record](briar-hydra.md).

## Nightjar: selectively rebuild the folded wings and supported grip

The working source is [subjects/nightjar/source.blend](../../../packages/dcc-workbench/subjects/nightjar/source.blend), with its [brief and edit declaration](../../../packages/dcc-workbench/subjects/nightjar/brief.json). It starts from the preserved procedural Nightjar delivery. Guided Sol 6.1 high-effort work progressed from fitted imported wings to reconstructed regional meshes. The parent directed corrections to detached rear crescents, thick coverts and floating toes before gallery acceptance.

Select **EDIT | Wing.1 → Fold settle**. The usable range is **0–1**, with gate values **0, 0.5 and 1**. The declaration probes the shoulder mantle, a primary, a secondary plane and a covert patch; selected body, bill, iris, wrapped toe, branch and opposite-side mantle probes stay fixed. The saved edit moves the assembly inward/downward without repositioning the supporting foot.

The accepted revision has body-following mantles, shallow fitted coverts, converging flight tips, short folded supports and a branched roost. Enlarged side/underside inspection caught a contact defect after the first regional export: three front digits floated about 0.02 m above the branch. The final correction fits all eight digits/halluces to the actual branch and connects ankle, tarsus and thigh. Fourteen attachment probes and branch contacts pass at five idle samples; those measurements supplement the parent's clay/material inspection. The grip correction preserved all 44 reviewed wing meshes, body, branch, controls and complete action content.

The master combines preserved triangulated anatomy with new native regional meshes, editable shape keys, parenting, rig, idle and material data. No reconstruction recipe or complete retopology is claimed. Narrow paired clearance at the rear primary tips remains an accepted stylization. Phoenix and Storm Roc must demonstrate their own feather hierarchy, wing attachment and meaningful edit; this perching-bird solution is not a universal bird generator.

## Delivery and verification boundaries

- **Working source:** edit and save `subjects/<id>/source.blend`. Export reads those bytes and never reconstructs the subject. The current masters have no recipe; legacy build/components commands must not replace them.
- **Candidate:** `dcc export --asset <id>` validates the source and dependencies, native audit, profile and budgets, then seals an immutable candidate identity. It does not publish.
- **Review and publication:** the parent binds observations and capture hashes to that candidate, selects `workbench` or `gallery` scope, and promotes only the reviewed bytes. Promotion writes the full immutable release before switching one pointer. Only an accepted gallery-scoped release changes the matching gallery study.
- **Current publication paths:** Hydra uses `assets/briar-hydra/current.json`; Nightjar uses `assets/nightjar/published/current.json`. Registry flat compatibility paths remain reserved or historical; do not create redundant copies to populate them.
- **Native editing:** `npm run test:dcc:saved -- --asset <id>` checks minimum/interior/maximum control values, moved/fixed probes at five times, restoration, save/reload, export and independent browser geometry. A fresh protected source copy is edited; production source and publication bytes remain hash-pinned. The earlier `test:dcc:native` gate belongs to the legacy reconstructed Hydra pilot.
- **Frontend boundary:** published geometry, materials, clips and the frozen reviewed study mapping reach the browser. Camera, light, playback, VFX and simple composition remain frontend responsibilities. Unpublished drafts do not replace a working gallery subject or break loading.

## Final verification and promotion record

The source, candidate, native edit loop and browser evidence remain separate from parent visual acceptance and user response.

| Subject  | Current pointer                                                                        | Immutable receipt                                                                                                                                             | Parent verdict                                         |
| -------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Hydra    | [current.json](../../../packages/dcc-workbench/assets/briar-hydra/current.json)        | [629eaf0d…](../../../packages/dcc-workbench/assets/briar-hydra/releases/629eaf0d643e011e2e68f7edfc8b9cb0bbce347ef0d92b188312a28aae5b499b/receipt.json)        | Accepted for gallery; accepted form retained           |
| Nightjar | [current.json](../../../packages/dcc-workbench/assets/nightjar/published/current.json) | [98308026…](../../../packages/dcc-workbench/assets/nightjar/published/releases/98308026c04bbde1bd352d97a322899920d1217c285e97720de309c54e54cf3e/receipt.json) | Accepted for gallery; regional wings and grip reviewed |

Each release retains its parent review, clay/material/phone captures, native edit proof, preservation report and independent browser pose result under `evidence/`. Publishing Nightjar left Hydra's pointer unchanged. The former reconstructed Hydra workbench release remains recoverable as `c36825fe…`; the initial Nightjar workbench release remains `18aaabad…`. Their frozen sources and historical evidence were preserved.

- **Native execution:** Blender 4.5.14 LTS, both declared control ranges, five frames, restoration and save/reload passed. Production source and then-current publication pins stayed unchanged. The imported native sources remain directly editable beyond these controls; arbitrary edits are not certified by the selected probes.
- **Independent browser geometry:** Hydra compared 2,624 points across 164 objects at five poses, maximum error **1.233e-6 model units**. Final Nightjar compared 1,360 points across 85 objects, maximum error **2.483e-7**. Both include rigid attachments and skinned anatomy. Final Nightjar native execution is retained at `test-results/dcc-native/saved-aU9yKW/`; default export/browser evidence is at `test-results/asset-migration-nightjar/grip-delivery-browser/`.
- **Initial maintained gate:** formatting, lint, types, Python checks, 31 tools tests, 47 DCC tests, 369 managed-source inventory/link checks and production build passed. The storage update adds a 32nd tools test; see its separate verification below.
- **Application gate:** 361 application/geometry tests and four seeded simulation checks passed. Production build retains a bundle-size warning; it is not a failed gate. Browser delivery metadata is about 5 KiB; pose evidence loads only when a review tool requests it.
- **Affected browser suite:** 42 passed and two conditional edit cases skipped in `test-results/asset-migration-final-browser/`. The separately executed native edit gates above cover both current pilots. Coverage includes all 29 gallery studies, delivered-file agreement, representative recording and phone behavior, DCC selection/download isolation, scoped gallery promotion and failed-load handling. The parent inspected Hydra's final gallery desktop and phone-width captures.
- **Renderer recovery:** one additional browser test passed in `test-results/asset-migration-mount-failure/`, exercising cleanup after partial scene allocation and successful navigation to another study. Its first attempt overlapped the main suite and stopped at the harness's occupied-port guard; the sequential run passed.
- **Final Nightjar cutover:** four workbench/isolation browser cases passed after promotion. The gallery journey exposed an obsolete procedural-layer expectation and a disabled button with the old action label. The label now follows the delivery capability. The corrected run passed five cases covering Nightjar, Hydra, Phoenix, Catalyst and scoped publication/download isolation in `test-results/asset-migration-nightjar/final-gallery-corrected/`. Parent inspection accepted the final Nightjar gallery desktop and 390px stage captures. The failed first run is retained separately.
- **Final maintained gate:** after regional publication and the capability-label correction, formatting, lint, types, 13 Python tests, 32 tools tests, 47 DCC tests, the 369-source inventory and production build passed. The full application/simulation result above belongs to the earlier shared runtime integration; it was not rerun for the final art and label changes.

Phone captures use a 390-pixel desktop-browser viewport; they are framing/interaction evidence, not physical-device frame-rate measurements. The user accepted desktop-first delivery and selective regional reconstruction on 2026-10-08, as recorded in the migration workflow. Keep subject delivery caps explicit while optimized phone deliveries remain later work.

The user subsequently accepted [Git LFS for native binaries](../../engineering/decisions/0004-native-asset-storage.md). Attributes, local filters/hooks, CI hydration and an early missing-binary diagnostic are configured without changing artist or publication bytes. One reviewed Hydra GLB was uploaded and independently downloaded with the same hash. Full remote availability is separate from that one-object proof. Logical file sizes at the storage audit were **33.93 MiB** for working sources/briefs and **99.76 MiB** for the complete DCC delivery/history tree. At the two-pilot average, 26 creatures with one frozen release each would occupy roughly **1.34 GiB** before retained iterations or historical comparisons; this is an extrapolation, not a measured finished cohort.

The storage update passed the maintained gate, now including **32 tools tests**. A separate local-origin LFS checkout hydrated all **13 binary paths**, matched **598 pinned files**, and passed integrity, build, both asset verifications and maintenance checks. It reused installed Node dependencies and required no Blender or ignored trial data. The storage ADR records its exact snapshot and the separate GitHub availability limit.

The planned inventory remains **29 studies: 26 creatures/humanoids, including these two completed pilots, plus three deferred props**. The next bounded batch is Phoenix followed by Storm Roc, one subject through all gates before the next. Preserve source masters, rejected optimization evidence, accepted comparisons and historical receipts under existing retention rules. Batch status belongs to the [migration workflow](../migration.md).
