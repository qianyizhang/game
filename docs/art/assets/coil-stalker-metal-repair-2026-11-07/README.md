# Coil Stalker: metal spring repair

[Matched comparison](comparison.png) · [Linked size/density review](index.html) · [Canonical manual record](repair.json)

A manual source derivative of the held [Coil Stalker](../expansion-scrapyard-concepts-2026-11-06/scrapyard-02/coil-stalker.svg). The original three soft copper curl paths are replaced with a continuous rectangular-section steel helix, two separated turns, broad face/shadow planes and fitted ends. All 13 body, head and leg paths, the leaning pose and the 384×384 framing remain exact. Colors reuse the original steel/sage/ink palette. This repairs an existing material defect; it creates no new enemy identity, runtime slot or rule.

The exact parent revision/digest, output digest, changes and self-review are in `repair.json`. Its link to the [original call](../expansion-scrapyard-concepts-2026-11-06/scrapyard-02/call.json) reuses the real prompt/settings/usage instead of copying them. The original `hold-material` judgment remains unchanged.

## Actual inspection and limits

Author self-review compared 384/160/80px views and isolated **30px and 20px**, matching Scrapyard's existing enemy display diameters. The new spring has a consistent narrow section, two open turn gaps and flat metal planes; it reads mechanically at both small sizes. End attachment detail recedes at 20px. The matched density fragment is a synthetic source fixture at 20px, not a game screenshot or camera acceptance.

**Outcome: material-improvement candidate, with the inherited camera/crowd hold retained.** The sideward pose, actual high-oblique game camera, horde overlap, runtime suitability and user aesthetic selection remain unapproved. No art is enlarged to claim small-size readability. No game or selection changes.

One losslessly optimized comparison retains decoded pixels, RGBA mode, dimensions, alpha and color interpretation; temporary processing stays outside the repository. There is no frozen catalogue, embedded artwork JSON or copied original.

## Checks and handoff

SVG safety, bounds and parent/output digests; exact retained 13 paths; isolated additive history import and unchanged selections; actual gallery parent/call/authoring views and desktop/390px source review are checked separately from the material judgment. Formatting/inventory/history and affected browser results are reported on the draft PR. No application, simulation, geometry or runtime-camera acceptance is claimed for this source-only edit.

Shared canonical registration is deliberately deferred to the serial coordinator. The temporary import below adds one manual attempt and one source revision with the real held parent. It has no runtime adaptation or selection. After integration, inspect it in `/__art/` before calling registration complete.

From the repository root:

```python
from pathlib import Path
import json
b = Path('docs/art/assets/coil-stalker-metal-repair-2026-11-07')
j = json.loads((b/'repair.json').read_text())
a = 'manual-coil-stalker-20261107'
p = b.as_posix()
h = {'schema': 1, 'assets': [], 'attempts': [{
    'id': a, 'title': 'Coil Stalker manual metal-spring repair',
    'date': '2026-11-07', 'outcome': 'manual',
    'notes': 'Source-only material improvement; original and camera/crowd holds retained. Zero API calls/spend. Original prompt/settings via parent attempt.',
    'files': [p+'/repair.json', p+'/comparison.png']
}], 'revisions': [{
    'id': a+':metal-spring', 'asset': None, 'attempt': a,
    'label': 'Coil Stalker · manual metal spring · context hold',
    'file': p+'/'+j['output']['file'], 'digest': j['output']['sha256'],
    'parents': [j['parent']['revision']],
    'runtimeFile': None, 'runtimeDigest': None,
    'notes': 'Three curl paths replaced; retained body/head/leg paths exact. Isolated 30/20px material candidate; camera/crowd/user acceptance unclaimed.'
}]}
Path('/tmp/coil-stalker-metal-history.json').write_text(json.dumps(h, indent=2)+'\n')
```

**API calls: 0. API spend: US$0.** No paid grant used; historical unknown requests and their reservations remain untouched.
