# Test audit: behavior and delivery

**Replaced 29 source-normal cases with delivery checks in 29 existing browser export journeys.** The user accepted a preference for overall behavior and end-to-end journeys on 2026-10-07. This audit inventories all 102 starting test files by cluster and reviews representative assertions. It is not an assertion-by-assertion verdict on the entire suite, and does not establish that most unit tests are useless.

The starting working tree contained concurrent Hydra/DCC changes, including the new Hydra comparison browser spec. Those changes are outside this slice. Bundled runtimes, dependencies and generated artifacts are excluded from the inventory. File counts are not executed-case counts; loops and parameterized cases expand at runtime.

## Cluster disposition

| Cluster at start                                                                                    |   Files | Disposition                                                    | Protected behavior and next action                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------- | ------: | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Game rules: Blindside domain (6), Spire domain (2), Last Hearth domain (7)                          |      15 | Keep; review overlap within mechanics                          | Score membership/order, combat timing, legal actions and resource accounting. Sampled combat and spell checks specify outcomes that a broad journey may miss.                                                                                                      |
| Application/replay/mods: three game application files, five shared files and enabled mods           |       9 | Keep; consolidate repeated envelope examples when demonstrated | Replay round-trips, rejection atomicity, challenge restrictions, content identity, observer behavior and actual mod activation.                                                                                                                                    |
| Engine/protocol/evaluation: `src/engines/*.test.ts`                                                 |       7 | Keep                                                           | Complete external-agent episodes, native legality, seat binding, block exclusion and replay audits. These are mostly interface or process behavior, despite the unit-suite label.                                                                                  |
| Last Hearth policies: `ai/*.test.ts`                                                                |       3 | Keep                                                           | Observable legal decisions, hidden-information invariance, budgets and frozen experimental controls. Frozen-byte assertions preserve published evidence rather than aesthetic or coding preferences.                                                               |
| Seeded simulations: `tests/simulation/*.test.ts`                                                    |       4 | Keep                                                           | Legal whole-run completion, reconstruction and conservation. These do not prove browser interaction or playing strength.                                                                                                                                           |
| Browser: `tests/browser/*.spec.ts`                                                                  |      22 | Keep; distinguish live play from fixture restoration           | Controls, reload/recovery, practice, agent replay import, inspection and art delivery. Some terminal-screen cases restore finished fixtures; classify them as restoration coverage. The untracked Hydra comparison spec is concurrent work.                        |
| Gallery normal validity: former `src/art3d/models.test.ts`                                          |       1 | Replace, then delete superseded file                           | Move 29 repeated model-construction checks to the 29 existing gallery download journeys. Inspect every normal on the loaded delivered model.                                                                                                                       |
| Creature-specific geometry regressions: 26 named creatures                                          |      26 | Consolidation candidates; retained                             | Samples repeat topology helpers and bind to mesh names, exact supports and fitting coordinates. Separate real motion/contact defects from incidental construction choices before further removal; export agreement alone does not cover live construction defects. |
| Animation regression suite: `src/art3d/animation.test.ts`                                           |       1 | Consolidation candidate; retained                              | Loop continuity, support contacts, rigid-object behavior and documented loft/material defects. Review overlap with browser round-trips, which currently sample only a few animation times.                                                                         |
| Recording lifecycle: `src/art3d/recording.test.ts`                                                  |       1 | Keep; review incidental call-count assertions separately       | Cancellation, hidden-tab behavior, render/start failures and resource release. Controlled failure injection covers paths happy-path video journeys do not.                                                                                                         |
| Surface taper defect: `src/art3d/surfaceSculpt.test.ts`                                             |       1 | Keep                                                           | The explicit neck-ridge regression checks smooth sample joins; a bounded mathematical test has a named visible defect.                                                                                                                                             |
| Tools: art, experiment commands, contracts, inventory, retention, governance, trace normalize/build |       8 | Keep                                                           | Real file outputs, classification, pinned installation, recoverability and trace completeness. Retention protections and source provenance require negative cases.                                                                                                 |
| DCC pipeline                                                                                        |       1 | Keep; concurrent edits excluded                                | Delivery/receipt and artifact validation. Actual native execution remains a distinct integration surface.                                                                                                                                                          |
| Native authoring/head/review plans                                                                  |       3 | Keep pending deeper behavior review                            | Pure planning and geometry contracts. Inventory classification is not a claim that native Blender delivery was exercised here.                                                                                                                                     |
| **Total**                                                                                           | **102** | **101 after the pilot**                                        | No new test case or assertion quota. One browser helper is added within existing lint/type scope.                                                                                                                                                                  |

## Normal-validity replacement

The previous file instantiated each of the 29 studies and checked finite unit normals at a tolerance of 0.0005. Its isolated baseline passed **29 cases** before removal. It did not download or reload an export.

The existing [gallery journeys](../../tests/browser/art3d.spec.ts) already render the model, download its GLB, exercise phone presentation, preserve game saves and check exporter normal-repair warnings. They now load the actual downloaded bytes through the real glTF loader and inspect every mesh's normals for presence, matching vertex count, finite components and unit length at the same tolerance. [The inspection helper](../../tests/browser/study-normals.ts) constructs no new procedural study.

The Cub journey also zeroes one normal in a copy of its downloaded binary and requires inspection to reject it. This negative control checks the replacement's ability to detect a corrupted delivered artifact. It does not alter an artist source or the successful download. Source-only details that an exporter legitimately repairs are not part of the delivered-normal contract; the existing console-warning check continues to catch exporter normalization repairs.

This moves the gate from internal construction to consumer delivery. A standalone `npm test` no longer verifies the gallery-wide normal contract; the browser job owns it. The repository workflow already runs both. No browser startup restriction, assertion or timeout is weakened to make this replacement pass.

## Retro outcomes

- **Behavior over counts:** the [testing policy](testing.md) gives each retained or new test a named failure and a stable interface, with replacement coverage before deletion.
- **Skills at the point of need:** [project mapping](agent-skills.md#use-the-skills-at-the-point-of-need) and conditional AGENTS pointers now connect actual naming, architecture and review work to the installed skills.
- **Durable domain meanings:** the [glossary](glossary.md) distinguishes shared play/replay concepts from game-local lifetimes. It consolidates existing contracts rather than renaming the code wholesale.
- **Sparse ADRs:** two [architectural records](decisions/README.md) preserve established trade-offs, without inventing fresh approvals or turning test policy into an ADR.

## Verification receipt

| Check                                            | Result                                             | Scope and limit                                                                                                                                                                                                                                |
| ------------------------------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pre-removal normal suite                         | **29 passed**                                      | Original source-construction assertions, before deletion                                                                                                                                                                                       |
| Gallery export journeys                          | **29 passed**                                      | Actual rendering/download/reload, all exported normals, phone layout and saved-game isolation; Cub also rejected the deliberately damaged normal                                                                                               |
| Application/geometry Vitest suite                | **361 passed in 63 files**                         | Shared working tree after removing the 29 superseded cases; retained rules and geometry regressions                                                                                                                                            |
| Seeded simulations                               | **4 passed**                                       | Shared working tree; whole-run rules and replay evidence                                                                                                                                                                                       |
| Production build and whole-repository formatting | **Passed**                                         | Shared working tree; existing bundle-size warning remains                                                                                                                                                                                      |
| `check:maintenance` in isolated checkout         | **Passed**                                         | Committed baseline plus this slice's exact owned edits; lint, types, Python, tools/DCC tests, inventory/links and build                                                                                                                        |
| Shared `npm run check` attempt                   | **Failed in concurrent DCC delivery verification** | Stale receipt for `blender/scale_components.py`; left untouched. Maintenance formatting, lint, types, Python and tools tests passed before that failure. Remaining application/simulation/build/format steps ran separately as reported above. |

At this slice's closeout, the complete shared gate was not green, and the full browser suite was not rerun: browser verification covered the 29 affected export journeys. No artistic approval, native Blender execution or runtime improvement is inferred from those results. Raw baseline inventory, file hashes, isolated source identity and command output are retained in the local `.work/sessions/behavior-tests-2026-10-07/` working record.

The subsequent combined worktree review on 2026-10-07 resolved the DCC receipt mismatch and passed `npm run check`, including maintenance, 361 application/geometry cases and four simulations. Its selected gallery, DCC, comparison and shell browser run passed 88 of 89 cases; an incorrect accessible-name locator in a new comparison navigation assertion was corrected, then both comparison cases passed. All 89 selected cases are covered across those runs. Logs are under `test-results/worktree-review-2026-10-07/`. This is still a selected browser scope, not the entire browser suite.

## Blender-first consolidation — 2026-10-07

The user accepted the bounded follow-up and clarified that new 3D authoring is moving to
the Blender package. [ADR 0003](decisions/0003-blender-first-authoring.md) records that
direction. The earlier browser-cluster "keep" verdict was too broad: end-to-end scope alone
does not justify repeating a shared behavior for every artwork.

| Surface                           | Before             | After                                           | Retained failure coverage                                                                                                              |
| --------------------------------- | ------------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Legacy gallery delivery           | 29 journeys        | 29 journeys, now with per-asset scrubbed motion | Loading, visible motion, downloaded GLB validity/normals, source/export agreement where applicable, phone layout, saves and navigation |
| Shared reduced-motion startup     | 23 journeys        | 3 representatives                               | Rigid Vajra, skinned Hydra and heavy Banner Bearer exercise the shared paused startup                                                  |
| Shared recording                  | 29 journeys        | 4 representatives                               | Those three plus transparent Catalyst exercise actual capture, download, decoding and changing frames                                  |
| Cub/Stray construction and motion | 6 cases in 2 files | 6 cases in one compatibility file               | Closed outward selected surfaces, valid weights, grounded supports, attached faces and anchored/moving tail                            |
| Recorder lifecycle                | 6 cases            | 6 cases with looser scheduling expectations     | Cancellation/hidden state, render/start failure, successful output and resource release                                                |
| Native Blender edit loop          | Ad hoc evidence    | Repeatable local `test:dcc:native` gate         | Control range, evaluated changes/restoration, clamping rejection, save/reload persistence, edited export and browser pose agreement    |

The gallery browser matrix falls from **81 to 36 cases**, removing **45 repeated journeys**.
All 29 supported assets retain their delivery and visible-motion checks. This change drops
exhaustive per-asset recording and reduced-motion combinations deliberately; the ordinary
gallery cases and selected representatives cover different contracts. No runtime saving is
inferred from the case count.

The [legacy compatibility file](../../src/art3d/legacy-creatures.test.ts) shares the two
creatures' topology and weight checks, removes exact skinned-mesh/claw counts and arbitrary
minimum sample counts, and uses a contact tolerance at the existing ground datum. It keeps
six independently named regressions. Names and landmark coordinates remain localized
legacy fixtures; no production rig abstraction was added for them. Other creature suites
are retained until their own behavior review or asset migration. Artist sources and
comparison baselines are unchanged.

Temporary defect injection demonstrated rejection of a detached Cub nose, moving support
and invalid skin weights. The injected copies were removed after the checks; their logs and
the starting source hashes are under `test-results/testing-transition-2026-10-07/`.
The normal-validity damaged-export check remains in the Cub browser journey.

The native gate exercised all twelve controls at 0, 1.3, 1.5 and their restored values,
checked actual evaluated mesh movement, rejected a clamped key, saved/reloaded a Search
muzzle edit and loaded its fresh export in the browser. The published source, GLB and
receipt retained their hashes. Its one browser case explicitly skips in ordinary runs
without native input; that skip is not native coverage. The retained pure head mathematics
tests remain useful fast checks but cannot replace this integration gate.

Closeout verification passed `npm run check`: the maintained scope (including 14 Python
files and 11 Python tests), 361 application/geometry cases in 62 files, and four seeded
simulations. The final per-paw sampling adjustment also passed all six legacy cases and
targeted lint/format checks. The selected gallery, DCC, comparison and shell browser run
passed **44 cases**, with the native-only case explicitly skipped; `test:dcc:native`
separately passed that case. Its maximum browser/native pose error was **9.19e-7 model
units**, below the 1e-4 tolerance. Logs are under
`test-results/testing-transition-2026-10-07/`; native source-copy and pose evidence is under
`test-results/dcc-native/edit-loop-oXNTJq/source-edit/`. This verifies the selected browser
scope and local native loop, not the entire browser suite or remote CI.

## Next bounded review

Prioritize the next Blender asset's edit and delivery contracts. As legacy studies are replaced or removed from the UI, review their remaining construction tests for retirement alongside the replacement evidence. Investigate actual player-journey gaps before adding more fixture-restoration cases. There is no target deletion count, performance claim or unit-to-E2E ratio.
