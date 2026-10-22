# System Blender runtime

Native authoring targets **Blender 5.2 LTS**, using the system app at
`/Applications/Blender.app`. `BLENDER_BIN` selects another 5.2 executable; PATH is
the only automatic alternative. The active launcher rejects other version families
and does not discover a repo-local app. Viewing, building and offline validation
do not require Blender.

## Tested installation

The 2026-10-22 migration tested **5.2.3 LTS Release Candidate**, build
`fab76e95306d`, macOS ARM64, embedded Python **3.13.13**. The installed app was an
RC; these results do not certify a stable installer or a later patch. Prefer the
[official stable 5.2 LTS download](https://www.blender.org/releases/5-2/) for routine
installation and rerun the native gates after replacing the app.

The former local runtime was **4.5.14 LTS**, installed in
`packages/dcc-workbench/.runtime/Blender.app`. Its original ARM64 DMG SHA-256 was
`65134d9b07b20e2fa8d3c9e44f6f44ffb5c9774dd521b95f50387310241ca170`.
That local app was removed after successful validation; the system app is now the
active runtime. Historical source files and release evidence remain preserved.

## Asset and evidence boundary

All **41** saved masters were opened, evaluated, saved to fresh 5.2 copies and
reopened. Cross-version comparisons cover five frames per scene and declared
motion clip, sampled mesh world coordinates, every rig bone matrix, mesh counts
and saved animation curves. Source hashes bind the old/new comparisons. The
comparison tolerance is **0.0001** per numeric component; save/reopen uses
**0.000001**. These are sampled compatibility checks, not exhaustive geometry,
continuous collision or aesthetic approval.

Original working masters retain their bytes: Blender reads them directly, so a
forced format-only resave would needlessly invalidate source and fitting hashes.
New-format copies remain in the verified local recovery archive. Future artist saves use
the system app. New motion-study and Night Passage exports carry current runtime
and code provenance. Registered assets receive fresh immutable releases after
candidate/native/browser review; prior releases and their reviews stay frozen.

The final gate passed **561 application tests, 37 seeded simulations and 128 geometry
tests**, plus maintenance checks. Browser verification passed **82 functional cases,
10 registered-candidate comparisons, 17 motion-study/Night Passage native comparisons
and one legacy Hydra native case**, with no prerequisite skips in those selected runs.
All **19** motion-study/Night Passage edit/save/reload/export producers passed. The
24 regenerated GLBs retain their named mesh/primitive sizes, joint counts and clip
durations.

The [compact migration evidence](evidence/blender-5.2-migration.json) pins sources,
runtime identity, new deliveries and verification outcomes. Selected captures, logs
and compact comparisons remain under `test-results/blender-migration-2026-10-22/`.
Saved-format copies, native-edit sources and superseded candidates were archived
during closeout; old local paths in the report identify their archive occurrences.
Historical art reviews retain their original claims; migration self-review is not
new independent art approval.

## Cleanup and recovery

The [cleanup receipt](evidence/blender-5.2-cleanup.json) records removal of **2,031**
obsolete migration files and a **1.05 GiB** reduction in allocated footprint after
accounting for the archive. **94** selected captures, logs and compact comparisons
remain live. Current masters, immutable releases and unrelated campaigns were retained.
Routine full browser captures are regenerable and were pruned.

Source-bearing evidence has **956** verified archive occurrences. Four files were
restored and hash-checked; the restored Hydra and edited Otter masters opened and
evaluated in system Blender. The archive is a local recovery copy on the same disk.
Its path, SHA-256 and occurrence manifest are pinned in the cleanup receipt.

To recover the original paths into a fresh directory:

```sh
mkdir /tmp/blender-migration-recovery
tar -xzf .work/artifact-archives/blender-migration-2026-10-22/source-evidence.tar.gz \
  -C /tmp/blender-migration-recovery
```

Editable evidence follows the [retention policy](maintenance.md#retention-and-deletion-authority).

## Code changes

- The active CLI validates and passes a 5.2 executable into the receipt-pinned
  publication coordinator. Historical coordinator bytes and messages remain frozen.
- Hydra construction and canid retiming use layered action channelbags instead of
  removed `Action.fcurves`. EEVEE uses `BLENDER_EEVEE`; shader sockets use `Factor`.
- Python 3.12+ protocol checks use static lookup, which misses Blender's dynamic
  RNA properties. Native boundaries check the actual property values and callable
  methods; a regression covers dynamic properties without launching Blender.
- Python checks use exact `fake-bpy-module-5.2==20260730` stubs. Material arrays use
  their native bulk setters; mesh digests read the same polygon vertices through
  mesh loops. Existing mesh/weight digest meaning is preserved.

The [Blender 5.0 API notes](https://developer.blender.org/docs/release_notes/5.0/python_api/)
document the removed action API and render-engine rename. Native scripts retain a
Python 3.11 syntax subset for historical recipes, while standalone checks use the
repository's pinned Python 3.12.

## Repeatable verification

Use the pinned Node runtime with `nvm use`. On macOS request approved execution
outside the restricted sandbox for native and browser commands; ordinary checks
stay sandboxed. All outputs below must be fresh.

```sh
npm run dcc -- doctor
npm run test:dcc:runtime -- --output test-results/blender-runtime-new
npm run test:dcc:saved -- --asset briar-hydra
npm run test:dcc:native
npm run dcc:canid -- test
npm run check:full
```

For another runtime comparison, add `--baseline PRIOR/samples.json` to
`test:dcc:runtime`; original source inventory and hashes must match. Run saved-edit
gates for each affected registered asset and the owning motion-study/Night Passage
native/browser gates. `check:full` includes maintenance, application/simulation
and geometry checks; it does not launch Blender or Chrome. Report those scopes
separately using the [verification contracts](checks.md).
