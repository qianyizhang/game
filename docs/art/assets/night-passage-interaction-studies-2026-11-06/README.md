# Night Passage interaction source studies

Six new native SVG interaction-object concepts, plus three targeted authored derivatives and one retained failed authored construction. These are optional future source studies, not accepted rituals, current commands, native 3D props or runtime selections. [Review index](index.html).

## Scope and reuse decision

The current game already owns the quay, market, ash banking, Memory shrine, Oath of danger, quiet spring and their choice symbols. It does not depict the proposed tangible cleat, rubbing frame, ash tray, exchange chute, oath knot or supported flow diverter. They have distinct physical contours and possible noncombat-composition uses; existing generic marks and earlier furniture keep their current purpose. Material/contour language is reused instead of duplicating existing patron symbols. Exact purpose proposals are in [study.json](study.json). No character, lantern/root story scene or GIF is produced.

The new sheet contains three candidates and three candidates with caveats (mesh detail, subtle channels, stylized knot continuity). Native/compact review is 160×112/80×56. [Contact sheet](night-passage-decision-tools/contact.png). Its one [generation record](night-passage-decision-tools/generation.json) owns exact prompt/settings, response usage/request ID, original/child digests and judgments. High-quality native Image 2.6 Sunburst with medium Sol author reasoning returned successfully for **US$0.148576 estimated**; no retry or uncertainty belongs to this request. This is usage estimation, not billing.

## Targeted derivatives and dependency

[Matched parent/derivative comparison](targeted-derivatives/comparison.png) and [canonical authoring record](targeted-derivatives/authoring.json). Coal is moved to rest in the dish, avoiding an unsupported lift. One opaque frame fill is removed to reveal Nyra's already-authored plum folds. A smooth glaze-body sibling replaces the coffer's stone-like faceting. Original held/caveated parents and their judgments remain unchanged. The initial incorrect coffer cutoff removed its lid/rim and is retained as a held failed sibling, with no invented quality acceptance. These four authored SVG states cost **US$0** in API calls.

The authored parents are genuine dependencies on **[PR #141](https://github.com/qianyizhang/game/pull/141)**. Its immutable source checkpoint is `a3351841a981c90bfa1ef4ac0ed34757d678f967`; metadata cleanup retains the referenced artwork paths, bytes and revision IDs. Parent records specify exact path/digest/revision under that checkpoint. This current-main branch contains only the new Night Passage bundle, with no first-suite ancestor files or copied metadata catalogue. First-suite and serial canonical registration are **draft blockers**, not a merge-ready claim. The six new decision concepts themselves are self-contained.

## Concise records and checks

Art stays as native SVG. Only two distinct lossless contact/comparison PNGs are retained; temporary raster measurements and history exports remain temporary. No base64 artwork, duplicated prompt files, frozen passing-check arrays or repeated import inventory is committed. Parent metadata is shared once in the authoring record. [validation.json](validation.json) keeps meaningful results and exceptions.

Source audit used AGENTS, Card Workshop art/batch/history rules, art direction, Night Passage guide/engineering and actual domain/content/UI sources. The shared runtime/tooling/dependencies are unchanged from the successful original suite checks; no game or gallery code changed. Source safety/bounds, original/child hashes, native/compact self-review, lossless evidence, canonical-import dependency/parent graph, actual gallery and desktop/390px linked review are verified separately. User aesthetic acceptance, gameplay adoption and 3D placement are unrecorded.

## Temporary canonical import

The following tested recipe writes only `/tmp/night-passage-interaction-history.json`. Before applying that staged document, the serial owner must import #141's normalized canonical first-suite history so the authored parent IDs exist. Local validation uses an isolated copy, preserving game selections. No shared registry or defaults are edited here. Run from the repository root:

```python
from pathlib import Path
import json
root=Path.cwd();bundle='docs/art/assets/night-passage-interaction-studies-2026-11-06';b=root/bundle;study=json.loads((b/'study.json').read_text());history={'schema':1,'assets':[],'attempts':[],'revisions':[]};prefix=study['history_prefix']
def revision(identity,attempt,label,file,digest,parents,note):
 return {'id':identity,'asset':None,'attempt':attempt,'label':label,'file':file,'digest':digest,'parents':parents,'runtimeFile':None,'runtimeDigest':None,'notes':note}
a=prefix+'authored';m=json.loads((b/study['authored']).read_text());history['attempts'].append({'id':a,'title':'Targeted Night Passage authored derivatives','date':'2026-11-06','outcome':'manual','notes':'Three optional derivatives and one retained failed construction; original parent judgments unchanged; $0 API spend.','files':[bundle+'/targeted-derivatives/authoring.json',bundle+'/targeted-derivatives/comparison.png']})
for o in m['outputs']:history['revisions'].append(revision(a+'/'+o['id'],a,o['id']+' · '+o['verdict'],bundle+'/targeted-derivatives/'+o['file'],o['sha256'],[m['parents'][o['parent']]['revision']],o['note']))
for family in study['families']:
 f=family['id'];c=json.loads((b/f/'generation.json').read_text());a=prefix+f;history['attempts'].append({'id':a,'title':f+' · future source concepts','date':'2026-11-06','outcome':'returned','notes':'Exact request, usage, source/child lineage and self-review in the one canonical call record; no runtime identity.','files':[bundle+'/'+f+'/generation.json',bundle+'/'+f+'/contact.png']});history['revisions'].append(revision(a+'/sheet',a,f+' · exact original',bundle+'/'+f+'/'+c['original']['file'],c['original']['sha256'],[],'Exact decoded native SVG original.'))
 for i,o in enumerate(c['outputs']):history['revisions'].append(revision(a+'/'+o['id'],a,o['id']+' · '+o['verdict'],bundle+'/'+f+'/'+o['id']+'.svg',o['sha256'],[a+'/sheet'],f'Ordered source cell {i+1}; copy named group, remove only grid translation and preserve paint. '+o['note']))
Path('/tmp/night-passage-interaction-history.json').write_text(json.dumps(history,indent=2)+'\n');print(len(history['attempts']),'attempts',len(history['revisions']),'revisions; registry untouched')
```
