# Equipment and quiet sanctums

[Open the review index](index.html). **38 native SVG concepts**: 18 Emberwake equipment/skill studies and 20 Night Passage patron-sanctum props/plates. All seven packed originals, 38 extracted SVGs and seven contact PNGs are retained byte-for-byte from `a3351841a981c90bfa1ef4ac0ed34757d678f967`. No runtime/default, gameplay, shared-registry, owner-rule, merge or deployment change.

## Review and provenance

Primary-author self-review remains **26 candidates, 11 candidates with caveats and one hold**. `vesta-coal-tongs` remains held because the coal is not clearly supported by both jaws. Its image and judgment are unchanged. Material/compact caveats include illustrated glass, ceramic reading as stone, Nyra's rigid gray screen, thin chime cords, two flat-cut skill motifs and a clay votive reading as bread. User aesthetic acceptance and runtime adoption are unrecorded.

[study.json](study.json) indexes the seven canonical call records and common formats. Each family's `generation.json` stores its exact request/prompt/settings once, every unique returned response/usage fact, request ID/timing, estimated cost, original path/digest and ordered extracted-output judgments/digests. The exact decoded native SVG replaces redundant base64 wrappers; no original artwork is removed. The linked HTML reuses actual SVG files rather than embedding encoded geometry twice. Duplicate prompt copies, digest inventories, per-file passing measurement dumps and frozen import scaffolding are no longer retained.

Seven calls succeeded sequentially with no failures/retries: **US$0.970265 estimated**, zero uncertainty or outstanding reservation for this saved suite. Creation used the historical US$9 lane cap and conservative US$7 call reservations; cleanup makes no paid call. Rates and actual usage are preserved in the canonical records; totals are estimates, not account billing. Another prior study's reported US$0.331047 was outside this suite/allocation.

## Admission and source audit

The source base and inspected paths are in `study.json`; Git identifies their exact bytes, so a second file-hash inventory is unnecessary. AGENTS, Card Workshop art/batch/history rules, art direction, both player guides, Night Passage engineering and the Emberwake world-runtime ADR were inspected. The original audit excluded PR #137's wolves, sword actions, relics, category marks and Blindside materials. No installed user-level .agents skills existed in that environment.

Emberwake's five present item types and nine skills did not cover the proposed hooked/heavy/curved equipment, wearables and six force/material concepts. Current category symbols continue serving their categorical use; enlarging them would not depict these contours. Existing worn-hide/moss/cinder references informed palette and structure. No supported skill is renamed and no future concept declares new mechanics.

Night Passage already has 26 choice/loadout symbols, five patrons and four authored arena kits. Existing pillars, lamps, arches, paving, furnace monuments and patron effect marks remain intact. Proposed intimate instruments, reliquaries, low furniture and five interior plates have a distinct future noncombat-composition purpose; they are not replacement signs, native 3D deliveries, collision geometry or accepted patron lore. Reuse the material vocabulary and engraving rather than duplicate existing mark geometry.

## Extraction and evidence

Outputs are ordered row-major, three columns by two rows. Each child copies its named source group, removes only the grid translation and retains root paint definitions/inherited presentation attributes. The original is the parent for every extraction; child IDs, bytes and judgments are unchanged. Card cells are 480×336 and review at 160×112/80×56. Plate cells are 720×384 and review at 360×192/180×96.

Chromium 154.0.8037.57 Canvas2D used default sRGB and device scale 1 for review rasters. Temporary rasters stay temporary. Selected contact PNGs include enlarged/native/compact views with DejaVu Sans labels outside the art. Optimization verified decoded RGBA pixels, dimensions, alpha and color metadata before retaining smaller bytes; unique optimization and crop-comparison outcomes remain in each call record. Exact geometry rebased from the sheet can differ at antialiased edges, so crop equality is recorded rather than assumed. No unchanged catalogue was frozen.

## Validation and limits

[validation.json](validation.json) keeps compact results and actual exceptions; distinct command logs remain under `logs/`. Historical runtime/tooling/dependency inputs are unchanged, so their maintenance/build, 589 application, 37 simulation and eight shader results remain applicable. The original broad browser run had 188 passed, four fixture skips and three local 30-second timeouts. All three focused reruns passed with the documented hosted 120-second total budget. The initial run is not relabeled green, and no assertion or repository timeout setting changed.

The published baseline's hosted [run 42244231708](https://github.com/qianyizhang/game/actions/runs/42244231708) passed 15 jobs with six conditional skips. Cleanup separately verifies artwork hashes, canonical facts, linked desktop/phone HTML, temporary history import/gallery and affected checks. Actual gameplay adoption, native geometry and independent aesthetic acceptance are not claimed.

## Temporary history import

This bundle remains **unregistered in the shared gallery**, pending central reconciliation. The following tested recipe reconstructs seven attempts and 45 source revisions in `/tmp/emberwake-night-history.json` without writing the shared registry. It preserves the existing `expansion-en-20261106/` attempt/revision IDs and parent graph; all `asset`/`runtimeFile` values remain null. Central registration applies the temporary document through the normal guarded import path. The newer local continuation depends only on these stable parent IDs and retained artwork; its historical ledger reference is pinned to the immutable original Git commit.

Run from the repository root:

```python
from pathlib import Path
import json
root = Path.cwd()
bundle = 'docs/art/assets/expansion-emberwake-night-2026-11-06'
study = json.loads((root / bundle / 'study.json').read_text())
history = {'schema': 1, 'assets': [], 'attempts': [], 'revisions': []}
for family in study['calls']:
    folder = f'{bundle}/{family}'
    call = json.loads((root / folder / 'generation.json').read_text())
    attempt = study['history_prefix'] + family
    history['attempts'].append({'id': attempt, 'title': family + ' · future concepts',
        'date': '2026-11-06', 'outcome': 'returned',
        'notes': 'Source study; exact request, usage, lineage and unchanged judgments in generation.json.',
        'files': [folder + '/generation.json', folder + '/contact.png']})
    for index, output in enumerate([call['original'], *call['outputs']]):
        original = index == 0
        identity = 'sheet' if original else output['id']
        history['revisions'].append({'id': attempt + '/' + identity, 'asset': None,
            'attempt': attempt, 'label': family + ' · exact packed original' if original else identity + ' · ' + output['verdict'],
            'file': folder + '/' + (output['file'] if original else identity + '.svg'),
            'digest': output['sha256'], 'parents': [] if original else [attempt + '/sheet'],
            'runtimeFile': None, 'runtimeDigest': None,
            'notes': 'Exact decoded native original.' if original else
                f'Ordered source cell {index}; copy named group and remove only grid translation. ' + output['note']})
Path('/tmp/emberwake-night-history.json').write_text(json.dumps(history, indent=2) + '\n')
print('Prepared 7 attempts / 45 source revisions; shared registry unchanged.')
```
