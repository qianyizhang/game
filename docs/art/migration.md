# Native 3D asset migration

Governs migration of principal 3D gallery assets into editable Blender (`.blend`) sources, with parent-accepted GLBs replacing procedural defaults. Emphasizes selective reconstruction (preserving sound existing geometry) and desktop-first delivery with mobile framing verification. The [art rulebook](art-direction.md) governs the visual bar, and the [testing policy](../engineering/testing.md) sets check scopes.

## Implementation boundary

The DCC registry ([`packages/dcc-workbench/registry.json`](../../packages/dcc-workbench/registry.json)) registers **nine native subjects**:

- **Six base assets:** `briar-hydra` (maps to study `hydra`), `nightjar`, `phoenix`, `stormroc`, `prowler`, `wolf`.
- **Three Wolf variants:** `wolf-bloom`, `wolf-elder`, `wolf-thorn` (selectable within study `wolf`).

The gallery maintains 29 total studies. Authoritative sources reside in DCC `subjects/<id>/`. Acceptance receipts are documented in [native pilots](assets/native-pilots.md), [batch 1 retrospective](assets/native-batch-1.md), [Prowler trial](assets/native-prowler-trial.md), [Wolf trial](assets/native-wolf-trial.md), and [Wolf evolved forms](assets/wolf-evolutions.md).

## File responsibilities and layout

| Directory / File                       | Responsibility                                                           |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `packages/dcc-workbench/registry.json` | Asset identities, legacy study mappings, inputs, and delivery profiles   |
| DCC `subjects/<asset-id>/`             | Authoritative `source.blend`, brief, and native adapters                 |
| DCC `blender/`                         | Reusable geometry modules, surface generators, and rig helpers           |
| DCC `assets/<asset-id>/`               | Immutable releases: frozen source, GLB model, audit, poses, and receipts |
| DCC `references/`                      | Curated comparisons and baseline benchmarks                              |
| Gallery `src/art3d/`                   | Runtime loading, orbit controls, lighting presets, VFX, and downloads    |
| `docs/art/assets/`                     | Status records, consequential revisions, limits, and evidence links      |
| `.work/sessions/<trial>/`              | Isolated working candidates and telemetry ledgers                        |

The saved `.blend` file is the sole artist source; exporters read it directly. Direct mesh, modifier, and weight editing must remain functional beneath high-level controls.

## Authoring layers

| Layer             | Responsibility                                    | Extraction boundary                                                |
| ----------------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| Subject           | Identity, silhouette, and proportions             | Local to brief and adapter                                         |
| Semantic assembly | Fitted head, feather region, wing, or paw         | Extract when a second subject demonstrates shared utility          |
| Native mechanism  | Modifiers, shape keys, constraints, and armatures | Native Blender features; expose semantic controls with clear units |
| Delivery          | Evaluated geometry, materials, and baked loops    | Handled by `export_saved.py` (rigid/skinned loops)                 |
| Frontend          | Viewing, playback, VFX, and basic framing         | Presentation only; no runtime geometry synthesis                   |

## Promotion lifecycle

1. **Candidate Assignment:** Pin exact paths, accepted baselines, and budgets.
2. **Byte Verification:** Check source, dependency, and model hashes against review captures.
3. **Delivery Validation:** Verify profile contracts, numeric bounds, and native/consumer agreement.
4. **Acceptance & Publication:** Parent approval seals an immutable release receipt and atomically updates pointers.
5. **Consumer Integration:** Switch gallery defaults only for accepted releases with `gallery` review scope.

Git LFS tracks binary `.blend` and `.glb` files. Briefs, manifests, and receipts remain standard Git files. Storage retention follows [maintenance governance](../engineering/maintenance.md#retention-and-deletion-authority).

## Verification responsibilities

| Surface                 | Validated behavior                                                              |
| ----------------------- | ------------------------------------------------------------------------------- |
| Registry & Publication  | IDs, input pins, cross-asset collisions, atomic promotion, and rollbacks        |
| Offered deliveries      | Finite geometry, embedded textures, normalized weights, loop timing             |
| Native editing          | Semantic controls survive deformation, save/reload, and export roundtrip        |
| Source/Export agreement | Matching orientation, plinth contact, and vertex samples at 5 timestamps        |
| Browser suite           | Models load, animate, and download correctly across desktop and phone viewports |
| Visual inspection       | Multi-view review of actual candidate pixels against matched baselines          |

Run native editing tests:

```sh
npm run test:dcc:saved -- --asset <id>
```

See the [DCC command contract](../../packages/dcc-workbench/README.md#verification-and-provenance) for details.

## Planned cohort: 29 existing studies

Inventory from [`STUDIES`](../../src/art3d/models.ts) (26 creatures/humanoids, 3 deferred props):

| Reuse family            | Study ID       | Subject           | Migration stage                                      |
| ----------------------- | -------------- | ----------------- | ---------------------------------------------------- |
| Serpentine & multi-neck | `hydra`        | Briar Hydra       | Native gallery default                               |
| Plumage & fitted grips  | `nightjar`     | Nightjar          | Native gallery default                               |
| Plumage & fitted grips  | `phoenix`      | Phoenix           | Native gallery default                               |
| Plumage & fitted grips  | `stormroc`     | Storm Roc         | Native gallery default (direct parent finish)        |
| Fur, paws, muzzles      | `prowler`      | Alley Prowler     | Native gallery default (delegated tail edit)         |
| Fur, paws, muzzles      | `wolf`         | Greatwood Wolf    | Native gallery default (delegated + 3 evolved forms) |
| Fur, paws, muzzles      | `matriarch`    | Briar Matriarch   | Queued                                               |
| Fur, paws, muzzles      | `thornstag`    | Thorn Stag        | Queued                                               |
| Fur, paws, muzzles      | `scavenger`    | Briar Scavenger   | Queued                                               |
| Fur, paws, muzzles      | `guardian`     | Nest Guardian     | Queued                                               |
| Fur, paws, muzzles      | `stray`        | Briar Stray       | Queued                                               |
| Fur, paws, muzzles      | `packcaller`   | Pack Caller       | Queued                                               |
| Fur, paws, muzzles      | `cub`          | Briar Cub         | Queued                                               |
| Amphibian & reptile     | `bogtoad`      | Bog Toad          | Queued                                               |
| Amphibian & reptile     | `crocolisk`    | Ancient Crocolisk | Queued                                               |
| Amphibian & reptile     | `tortoise`     | Ancient Tortoise  | Queued                                               |
| Thin membranes          | `moonmoth`     | Moon Moth         | Queued                                               |
| Thin membranes          | `amalgam`      | Wild Amalgam      | Queued                                               |
| Thin membranes          | `imp`          | Coal Imp          | Queued                                               |
| Humanoids & equipment   | `matron`       | Imp Matron        | Queued                                               |
| Humanoids & equipment   | `juggler`      | Soul Juggler      | Queued                                               |
| Humanoids & equipment   | `watcher`      | Pit Watcher       | Queued                                               |
| Humanoids & equipment   | `herald`       | Infernal Herald   | Queued                                               |
| Humanoids & equipment   | `patron`       | Abyssal Patron    | Queued                                               |
| Humanoids & equipment   | `squire`       | Hearth Squire     | Queued                                               |
| Humanoids & equipment   | `bannerbearer` | Banner Bearer     | Queued                                               |
| Glass & liquid          | `catalyst`     | Catalyst          | Deferred prop                                        |
| Rigid mathematical      | `spiral`       | Spiral            | Deferred prop                                        |
| Pierced metalwork       | `vajra`        | Vajra             | Deferred prop                                        |
