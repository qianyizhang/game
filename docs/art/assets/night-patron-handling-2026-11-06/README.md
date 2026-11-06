# Night Passage patron-handling source concepts

[Linked-art review](index.html) · [Source/native/compact contact](contact.png) · [Exact packed SVG](sheet.svg) · [Canonical call/settings/reviews](generation.json)

Six optional future concepts: Aster grounding plate, Neris weir panel, Vesta ritual bellows, Isen cooling wrap, Nyra witness shutter and audience choice rack. [concepts.json](concepts.json) owns their proposed purposes, names and sizes. All are source fiction, with no established ritual, supported runtime identity, new rule, user acceptance or game selection. The names associate proposals with existing affinities, without declaring accepted patron possessions or history.

## Admission and ownership

The existing [content](../../../../src/games/night-passage/domain/content.ts) owns Aster/storm, Neris/tide, Vesta/cinder, Isen/winter and Nyra/veil. The [game](../../../../src/games/night-passage/domain/game.ts) and [player guide](../../../guide/night-passage.md) own three-way audiences and Memory shrines. Existing [choice artwork](../../../../src/games/night-passage/ui/Artwork.tsx) and scene marks use bolts, waves, flames, shards and an eye. Those symbols communicate current choices and affinity; enlarging or recoloring one would not depict a fitted conductor, folding leather bellows, sliding shutter or supported slotted rack. These proposals reuse the established affinity accents and engraved material language while exploring physical handling silhouettes as separate source references.

The primary audit also compared the [first suite's bowls, furniture and reliquaries at its immutable checkpoint](https://github.com/qianyizhang/game/tree/a3351841a981c90bfa1ef4ac0ed34757d678f967/docs/art/assets/expansion-emberwake-night-2026-11-06). This family excludes its footbath, balance, press, curtain, table and resting furniture, as well as the separate decision-tool/rubbing-frame/chute studies. It does not duplicate portraits, scenes, GIF story beats, weapons or category signs. The source index displays all proposals at native 160×112 and compact 80×56; connected load-bearing joints, broad material planes and distinct contours are the intended benefit, rather than more color variants.

Upkeep is this bounded review bundle: one packed original, six exact extracts, one selected lossless contact, one actual call record and small linked index/purpose/validation records. This bundle owns its source evidence; serial registration and any later runtime integration have separate owners. It has **no artwork or registration dependency on PR #141, #147 or #149**. Existing consumers, artwork, rules and selections remain unchanged. No unchanged catalogue is frozen. This admission record and PR suffice for the self-contained source-art review, without a separate issue.

## Provenance, cost and review

[generation.json](generation.json) stores the exact request/prompt/settings once, returned usage/request ID, original and extraction digests, and each output's judgment. The source call used native SVG from `gpt-image-2.6-sunburst`, high quality/complexity, with `gpt-6.1-sol` medium author reasoning. Request ID: `req_94d6e652377540718f87c6b56f6607a9`. Its returned-usage estimate is **US$0.166817**, not verified billing. The per-call authorization is preserved in that canonical record; this delivery makes no API call and copies no live shared-pool ledger.

All seven SVGs and the retained contact are copied byte-for-byte from completed production. Each child is its exact source group with only the grid translation removed; paint and geometry are unchanged. The contact's lossless optimization verified RGBA pixels, dimensions, alpha and color interpretation before delivery; it is not re-encoded here. There are no duplicate prompt files, embedded base64 response bodies, permanent render frames or prepared-history catalogue.

Four outputs remain candidates and two candidates with caveats. Neris's aqua ribbon is a symbolic current rather than convincing continuous fluid through a full weir. Isen's broad cyan highlight makes the intended ceramic insert resemble a glass lens. These observations remain in the canonical reviews; technical validity is not aesthetic acceptance or a physical behavior claim.

## Validation and draft blocker

[validation.json](validation.json) records scoped checks. Seven SVGs passed resource safety, self-contained references, decoding and background-excluded bounds; six extraction trees match their source groups exactly. Translating a full sheet versus rebasing a child changes some antialiased edge pixels only (at most 7 channel levels over 39 pixels per cell), without geometry or paint changes. Official Google Chrome 157.0.8103.38 inspected the linked index at 1440px/390px and all seven imported revisions' canonical settings/lineage in the actual repository history gallery. Native and compact self-review remains separate from user acceptance.

Formatting/inventory and current `assets:history -- verify` cover this delivery. No runtime code, tests, dependencies, defaults, owner rules or shared registry are changed; unrelated broad local suites were not repeated. Hosted results belong to the PR's exact tested head and do not establish aesthetic approval.

**Draft blocker: shared canonical registration is pending serial coordination.** A fresh-main isolated import of this bundle alone passed: one attempt, seven unassigned source revisions and unchanged selections. This is not a merge-ready claim. Actual game placement or new interactions need their own runtime contract and later approval.

## Reconstruct the temporary history import

Run this tested recipe from the repository root to write `/tmp/night-patron-prepared-history.json`. It derives registration from the canonical record and makes no shared-history write. No first-suite import is needed. The serial coordinator can review/import it through the normal guarded workflow; IDs preserve `expansion-en-cont-20261106/night-patron-handling/{sheet,subject-id}`. No bulky duplicate import is committed.

```python
from pathlib import Path
import json
root=Path.cwd();b=root/'docs/art/assets/night-patron-handling-2026-11-06';prefix=b.relative_to(root).as_posix();a='expansion-en-cont-20261106/night-patron-handling';j=json.loads((b/'generation.json').read_text())
h={'schema':1,'assets':[],'attempts':[{'id':a,'title':'Night Passage patron handling · optional future source concepts','date':'2026-11-06','outcome':'returned','notes':'Exact request/settings, returned usage, cost and reviews recorded once in generation.json. Unassigned source concepts; user acceptance pending.','files':[prefix+'/generation.json',prefix+'/contact.png']}],'revisions':[]}
h['revisions'].append({'id':a+'/sheet','asset':None,'attempt':a,'label':'Patron handling · exact packed original','file':prefix+'/'+j['original']['file'],'digest':j['original']['sha256'],'parents':[],'runtimeFile':None,'runtimeDigest':None,'notes':'Exact native vector original; 3×2 cells of 480×336. No accepted ritual or runtime identity.'})
for i,o in enumerate(j['outputs']):
 h['revisions'].append({'id':a+'/'+o['id'],'asset':None,'attempt':a,'label':o['id']+' · '+o['verdict'],'file':prefix+'/'+o['id']+'.svg','digest':o['sha256'],'parents':[a+'/sheet'],'runtimeFile':None,'runtimeDigest':None,'notes':f'Exact group extraction, zero-based cell {i}, origin ({i%3*480},{i//3*336}); remove only grid translation, preserve paint. '+o['note']})
Path('/tmp/night-patron-prepared-history.json').write_text(json.dumps(h,indent=2)+'\n');print('Prepared one attempt/seven revisions without shared writes')
```
