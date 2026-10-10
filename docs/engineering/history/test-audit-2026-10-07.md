# Test audit: behavior and delivery (2026-10-07)

Audit inventory of starting test files and the consolidation of procedural construction checks into end-to-end delivery journeys.

## Initial cluster disposition

| Cluster at start                                     |   Files | Disposition      | Target outcome                                                    |
| ---------------------------------------------------- | ------: | ---------------- | ----------------------------------------------------------------- |
| Game rules: Blindside (6), Spire (2), Hearth (7)     |      15 | Keep             | Score order, combat timing, legal transitions, pool accounting.   |
| Application / replay / mods                          |       9 | Keep             | Replay round-trips, atomic rejection, scenario isolation.         |
| Engine & agent protocols (`src/engines/*.test.ts`)   |       7 | Keep             | External agent protocol, native legality, seat binding.           |
| Hearth policies (`ai/*.test.ts`)                     |       3 | Keep             | Information hiding, legal action enumeration.                     |
| Seeded simulations (`tests/simulation/*.test.ts`)    |       4 | Keep             | Whole-run completion, replay reconstruction.                      |
| Browser (`tests/browser/*.spec.ts`)                  |      22 | Keep/Consolidate | Interactive controls, persistence, gallery delivery.              |
| Gallery normal validity (`src/art3d/models.test.ts`) |       1 | Replaced/Deleted | Moved 29 model checks to gallery download journeys.               |
| Creature geometry regressions (26 creatures)         |      26 | Retained legacy  | Mesh connectivity, fitted motion, skin weights.                   |
| Animation regression (`src/art3d/animation.test.ts`) |       1 | Retained         | Loop continuity, grounded support, rigid objects.                 |
| Recording lifecycle (`src/art3d/recording.test.ts`)  |       1 | Retained         | Hidden tabs, render failures, resource cleanup.                   |
| Surface sculpt (`src/art3d/surfaceSculpt.test.ts`)   |       1 | Retained         | Smooth joins on neck ridges.                                      |
| Workshop tools & governance                          |       8 | Retained         | Artifact generation, retention, schema validation.                |
| DCC pipeline & authoring                             |       4 | Retained         | Delivery verification and native Blender edit loop.               |
| **Total**                                            | **102** | **101 (post)**   | Replaced repeated construction checks with delivery verification. |

## Normal-validity replacement

Superseded 29 isolated procedural mesh tests with verification in the 29 existing [gallery journeys](../../../tests/browser/art3d.spec.ts). Journeys load downloaded GLBs through glTF loaders and inspect normals for presence, finite components, and unit length ([inspection helper](../../../tests/browser/study-normals.ts)). The Cub journey tests negative controls with deliberately corrupted normals.

## Blender-first consolidation

Per [ADR 0003](../decisions/0003-blender-first-authoring.md), new 3D authoring moved to Blender:

| Surface                       | Before      | After                                                                      | Retained coverage                                             |
| ----------------------------- | ----------- | -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Legacy gallery delivery       | 29 journeys | 29 journeys, now with per-asset scrubbed motion                            | GLB validity, normals, layout, saves, navigation.             |
| Shared reduced-motion startup | 23 journeys | 3 representatives                                                          | Vajra (rigid), Hydra (skinned), Banner Bearer (heavy).        |
| Shared recording              | 29 journeys | 4 representatives                                                          | Adds transparent Catalyst to test video download and frames.  |
| Cub / Stray construction      | 6 cases / 2 | 6 cases in [legacy-creatures](../../../src/art3d/legacy-creatures.test.ts) | Closed surfaces, valid weights, grounded supports.            |
| Native Blender edit loop      | Ad hoc      | `npm run test:dcc:native`                                                  | Evaluates controls, clamping, save/reload, and export parity. |

Reduced gallery browser cases from 81 to 36, eliminating 45 redundant journeys while preserving full delivery verification.

## Retro outcomes

- **Behavior over counts**: Tests protect named observable failures via [testing policy](../testing.md).
- **Skills at point of need**: Mapped skills to development tasks ([agent skills](../agent-skills.md)).
- **Domain vocabulary**: Clarified shared vs game-local concepts in [glossary](../glossary.md).
- **Sparse ADRs**: Recorded foundational choices in [decisions/](../decisions/README.md).
