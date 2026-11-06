# Spire aftermath material source studies

Six static future aftermath illustrations, not active VFX, animation frames, runtime intent symbols or implemented state changes. One **$3.70** shared-pool planning reservation, grant `archive-spire-aftermath-03`, is recorded before dispatch in [call.json](call.json). No other pool capacity or uncertain hold is used.

## Admission and source brief

Current-main base: `3a59621069dd1fe912a749d851d27e993507f5dd`. `src/games/spire/content/world.ts` establishes Chomp/Rush, large-Slime splits, Green Louse Spit Web, Cultist Ritual and Explosive Potion; `content/silent.ts` establishes poison. These provide the material/action context, not a claim that the present game already renders or retains environmental remnants. The ritual cloth/ash interpretation is explicitly a proposed visual treatment, not new canonical history.

`ui/IntentArt.tsx` already supplies readable 64px sword/shield/eye/book/spark/hourglass cues. Reuse those for current HUD semantics; these sources serve a different future encounter/combat-composition purpose at 160×112/80×56. Enemy portraits and card-action art remain useful. This batch contains no enemies, living slimes, sword/defense cards, relics, encounter-location panoramas or Cartographer furniture/route fixtures. Those uses are already represented in earlier studies; no duplicate recolors are admitted.

The six proposed roles are brittle impact scree, opaque viscous poison, empty translucent split-gel membrane, fibrous ruptured web, charred ritual-cloth/ash and heat-scorched crater. Each exact gesture, identifying contour, material and lighting brief is in the prompt once. Three restrained value groups and unequal silhouettes distinguish them without promising timing, trigger, status color, persistence, collision or damage behavior. User selection and any actual game consumer contract come later.

## Provenance and review

The art lane owns one exact API SVG, six actual group extractions and one useful native/compact contact PNG. Existing images and frozen published branches are untouched; there is no old slot to checkpoint or unchanged catalogue to freeze. Only useful candidates should later be selectively adapted, with background/framing, accessibility and actual UI review before adoption. Technical validity and author self-review are separate from independent/user acceptance.

One canonical `call.json` holds the exact request/settings, single grant, client/server request IDs, usage/cost, output file digests/cells and genuine review exceptions. Native SVG uses `gpt-image-2.6-sunburst` high quality/high complexity with `gpt-6.1-terra` SVG author/high reasoning. This is this lane's first Terra-author batch; no previous Sol-authored artwork is swapped or rerun. Terra availability/pricing/ceilings were checked read-only, and another lane reported a successful same-endpoint Terra SVG call. The existing configured proxy/token binding is reused without exposing or changing values.

A unique ASCII `X-Client-Request-Id` is set before dispatch for support tracing only, not idempotency or retrieval. Native SVG uses the non-streaming Images generation endpoint; no `stream`, `partial_images`, Responses/background workaround or automatic retry is used. An uncertain outcome retains the full reservation and stops paid work.

Temporary rasterizations are inspection aids; there is no permanent frame catalogue or player. The derived gallery import is rebuilt from the recipe below into ignored `test-results/spire-aftermath-history-import.json` and validated in isolation. Shared registry/defaults/selections remain unchanged. Central registration is a **draft blocker**, not a merge-ready claim. No local file dependency on frozen #140/#143/#151 exists.

Status: the single request returned successfully for **$0.108179** usage estimate; lane lifetime estimate **$1.201631**, active and uncertain reservations **$0**. No subsequent paid call is granted. The exact prompt is 4,056 ASCII bytes; `n=1`, fixed 1440×672, no reference inputs. The bound uses full published Terra token ceilings, not an exposed token/dollar cap.

Native and 160×112/80×56/64×45 self-review gives **five candidates and one hold**. The [contact sheet](contact.png) makes the web/cloth ambiguity visible: `ruptured-web` reads as torn fabric rather than silk and stays held. Membrane faceting, a 27px inset instead of the requested 28px, and small-size heat-seam limits are recorded once in `call.json`. All six extracted vector groups are unchanged except their grid translation, all six Cairo renders exactly match the original crop, and no foreground is clipped. This does not establish aesthetic acceptance.

Validation passed: repository SVG safety and exact request/artwork digests; six unchanged group extractions; isolated import/verify of seven revisions; actual gallery lineage, hold, prompt/settings and fourteen decoded previews, disabled adoption, phone fit and desktop inspection; `npm run format:maintenance` and live `npm run assets:history -- verify` (709 assets, 92 baseline revisions, zero selections). No current UI is changed, so actual gameplay adoption review remains future work.

## Rebuild staged import

Run at repository root after terminal review. This writes only ignored staging data, not the shared library or game selections.

```python
import json
from pathlib import Path

d = Path("docs/art/assets/spire-aftermath-source-studies-2026-11-06")
c = json.loads((d / "call.json").read_text())
a = c["id"]
revisions = []
for o in c["outputs"]:
    original = "cell" not in o
    note = "Exact API original." if original else f"Cell {o['cell']}; remove its grid translation only. Review: call.json."
    review = c["review"]["exceptions"].get(o["file"], {})
    if review.get("status") == "hold":
        note += " Hold: " + review["reason"]
    revisions.append(dict(
        id=a + ":" + Path(o["file"]).stem, asset=None, attempt=a,
        label="Spire aftermath source / " + Path(o["file"]).stem,
        file=(d / o["file"]).as_posix(), digest=o["sha256"],
        parents=[] if original else [a + ":original"],
        runtimeFile=None, runtimeDigest=None, notes=note,
    ))
h = dict(schema=1, assets=[], attempts=[dict(
    id=a, title="Spire aftermath / one native SVG request",
    date=c["date"][:10], outcome="returned",
    notes="Future source concepts; request, usage, lineage and review: call.json.",
    files=[(d / f).as_posix() for f in ["call.json", "README.md", "contact.png"]],
)], revisions=revisions)
p = Path("test-results/spire-aftermath-history-import.json")
p.parent.mkdir(parents=True, exist_ok=True)
p.write_text(json.dumps(h, indent=2) + "\n")
```
