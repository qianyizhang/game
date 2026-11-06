# Emberwake quest-object source concepts

[Open the linked-art review](index.html) · [Native/compact contact](contact.png) · [Exact packed SVG](sheet.svg) · [Canonical successful call](generation.json)

Six optional future source concepts: root core specimen, fen water gauge, mire dispatch, annealing proof tile, cistern depth spool and glass bead mold. [concepts.json](concepts.json) owns names, purposes and sizes; [generation.json](generation.json) owns exact prompt/settings, response usage/request ID, original/extraction digests and per-cell judgments. Four candidates and two candidates with caveats remain proposals, with no runtime slot, accepted quest, established lore or user acceptance. Source cells are 480×336; review sizes are 160×112 and 80×56.

## Admission and ownership

The existing [world content](../../../../packages/diablo2/src/domain/world-content.ts) and [player guide](../../../guide/emberwake.md) establish Briarfen roots and Saltreach's Glassworks/cistern setting. The proposed evidence carriers and material/survey tools explore these existing materials without inventing quests or characters. Current [equipment](../../../../packages/diablo2/src/domain/content.ts) contains an axe, staff, wand, mail and charm. The existing [hero/crypt comparison](../emberwake-silhouettes/after-zoom.webp) and [hero art](../../../../packages/diablo2/src/ui/hero-art.ts) establish broad weapon/cloth shapes; a category symbol or recolored axe cannot depict a fitted gauge hinge, opened mold or connected survey spool. Material palette and broad engraved construction are reused. No existing illustration is being replaced or assigned a second runtime role.

The earlier [38-concept suite at its immutable checkpoint](https://github.com/qianyizhang/game/tree/a3351841a981c90bfa1ef4ac0ed34757d678f967/docs/art/assets/expansion-emberwake-night-2026-11-06) covers equipment/skills and patron furnishings. This bundle adds portable investigation/material objects rather than duplicate weapons, category symbols, portraits, lantern story beats or furniture. Its upkeep is bounded to one packed original, six exact extracts, one selected contact, two actual call records and this small review/index. The bundle owns its source evidence; canonical registration and any later runtime adoption have separate owners. No artwork dependency on PR #141, unchanged-catalogue export or new runtime consumer is introduced. A separate issue is unnecessary for this self-contained candidate-art review; this owning admission record is the decision to review the additions.

## Preserved outcome and cost

The successful call used `gpt-image-2.6-sunburst`, high image quality/complexity, native SVG and `gpt-6.1-sol` SVG author reasoning at medium effort. Its usage-based estimate is **US$0.174745**, not verified billing. The exact response/request ID is recorded once in generation.json. All seven SVGs and the losslessly optimized RGBA contact are copied byte-for-byte from the completed source study; each extract removes only its parent group's grid translation. Parent sheet and every output digest remain in the canonical record, without duplicate base64 response bodies or prompt files.

The separate [Bells/Furnace request](uncertain-bells-furnace/generation.json) ended with `RemoteDisconnected` after 301.039 seconds, with **no output, usage or request ID**. Its billing/outcome remains unknown and the coordinator retains its **US$7 bound once**. No image or revision exists for that request, and it was not retried. This publication made no paid calls and does not restate the live shared-pool balance or another worker's reservations.

The root resin reads as amber solid/viscous material rather than physical liquid. The proof tile's broad square can resemble a tray. Both remain candidates with caveats; the spool's finest winding ridges recede at 80px. Technical success does not establish aesthetic acceptance or runtime UI suitability.

## Validation and remaining draft blocker

[validation.json](validation.json) records the scoped technical/visual checks. The seven SVGs passed resource safety, self-contained references, rendering and background-excluded bounds checks. Six extraction trees exactly match source groups without translation. Official Google Chrome 157.0.8103.38 inspected all native/compact views, the linked index at 1440px/390px, and all seven revisions' exact settings/lineage plus the unknown attempt in the repository's actual history gallery after isolated import. A sheet translated as a whole versus a rebased extraction differs only at some antialiased edges (at most 3 channel levels/170 pixels per cell); geometry and paint are exact. The retained contact's original optimization verified RGBA pixels, dimensions, alpha and color interpretation; delivery preserves that byte-identical evidence.

Formatting/inventory and `assets:history -- verify` cover this source-only delivery. Runtime code, dependencies and selected-art remain unchanged from main; broad application/native checks were not repeated. Existing runtime-source evidence is retained at [a335184 validation](https://github.com/qianyizhang/game/blob/a3351841a981c90bfa1ef4ac0ed34757d678f967/docs/art/assets/expansion-emberwake-night-2026-11-06/validation.json) and [hosted run 42244231708](https://github.com/qianyizhang/game/actions/runs/42244231708). Those are historical checks, not new checks for this commit.

**Draft blocker: canonical shared history registration is pending serial coordination.** The self-contained import was verified on a disposable copy of fresh main plus only this bundle: two attempts, seven source revisions, unchanged selections. No shared registry was edited. User review and any actual runtime placement remain separate. This source study is not claimed merge-ready.

## Reconstruct the temporary history import

From the repository root, run this recipe to write `/tmp/ember-quest-prepared-history.json`. It derives registration from the canonical records and does not modify shared history. It needs no first-suite import. A serial coordinator can inspect and import this temporary file through the standard guarded `assets:history import` workflow. Attempt/revision IDs preserve the original continuation identities; the unknown request has no revision. No bulky duplicate prepared-history file is committed.

```python
from pathlib import Path
import json
root=Path.cwd(); b=root/'docs/art/assets/emberwake-quest-objects-2026-11-06'; prefix=b.relative_to(root).as_posix(); base='expansion-en-cont-20261106/'; family='ember-fen-salt-quest'; a=base+family
j=json.loads((b/'generation.json').read_text()); h={'schema':1,'assets':[],'attempts':[],'revisions':[]}
for family,record in [('ember-fen-salt-quest','generation.json'),('ember-bells-furnace-quest','uncertain-bells-furnace/generation.json')]:
 d=json.loads((b/record).read_text()); attempt=base+family
 h['attempts'].append({'id':attempt,'title':family+' · optional future source concepts','date':'2026-11-06','outcome':'returned' if d['original'] else 'unknown','notes':'Canonical request, response and outcome in generation.json. No runtime identity or user acceptance.' if d['original'] else 'RemoteDisconnected; no output, usage or request ID. US$7 uncertainty retained once; not retried.','files':[prefix+'/'+record]+([prefix+'/contact.png'] if d['original'] else [])})
h['revisions'].append({'id':a+'/sheet','asset':None,'attempt':a,'label':'Fen/Salt · exact packed original','file':prefix+'/'+j['original']['file'],'digest':j['original']['sha256'],'parents':[],'runtimeFile':None,'runtimeDigest':None,'notes':'Exact native vector output; 3×2 cells of 480×336. Source study only.'})
for i,o in enumerate(j['outputs']):
 h['revisions'].append({'id':a+'/'+o['id'],'asset':None,'attempt':a,'label':o['id']+' · '+o['verdict'],'file':prefix+'/'+o['id']+'.svg','digest':o['sha256'],'parents':[a+'/sheet'],'runtimeFile':None,'runtimeDigest':None,'notes':f'Exact group extraction, zero-based cell {i}, origin ({i%3*480},{i//3*336}); remove only grid translation, preserve paint. '+o['note']})
Path('/tmp/ember-quest-prepared-history.json').write_text(json.dumps(h,indent=2)+'\n'); print('Prepared',len(h['attempts']),'attempts and',len(h['revisions']),'revisions; no shared write')
```
