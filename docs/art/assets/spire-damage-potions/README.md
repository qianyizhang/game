# Spire damage potions

**Two vessels. Clear at 24 px.**

![Fire and Explosive: matched baseline/current at enlarged, native and belt sizes](overview.png)

## Candidate / problem

Fire and Explosive Potion used nearly the same upright opaque bulb. At the
24 px combat belt, color and tiny interior marks carried most of the difference.
The bounded hypothesis: an elongated glass flask versus a squat reinforced vessel
will separate the two damage roles before reading their names.

Latest main inspected: `08ca09dcac428f963c581d8bd05485a097323ad7`.
Open issue/draft ledger inspected before selection: dependency PRs #66/#67 and
standalone studies #53–55/#64; recent game-art issues were complete. This does not
resume a held native trial or overlap the preserved Beyond constructs batch.

## Actual belt · 24 px

![Phone belt, before/current at the real display size](belt-phone.png)

[Desktop belt](belt-desktop.png) · [Desktop combat context](combat-desktop.png) ·
[Phone combat context](combat-phone.png)

## Collection / close-ups

[Desktop collection](collection-desktop.png) · [Phone collection](collection-phone.png) ·
[Native and enlarged pair](native-enlarged.png) · [Representative v1](v1.png)

## V1 → V2

- **Fire:** tilted glass, visible fill level and curved reflections. V1's gold
  flame blended into the glass; v2 raises the coral liquid and uses an ivory flame.
- **Explosive:** broad dark body, reinforced copper band and fitted stopper loop.
  V1's regular star read as a badge; v2 uses an uneven burst and fewer edge cuts.

## Independent review → Fire contrast correction

A separate same-executor reviewer accepted v2 with one nonblocking limit: Fire's
flame merged with highlights at 24 px. A three-path Fire-only correction raised
the coral fill, isolated the flame and removed the nearby lower highlight.

**Independent final verdict: ACCEPT.** Native belt and combat recognition improved;
no visible label, control, spacing or hierarchy regression. No further correction
requested. [Review evidence and exact source pin](independent-review.md).
This does not claim parent pixel review or user approval.

## Scope / verification

- 🟢 **2 changed / 648 unchanged** exported illustrations; all 650 SVGs decode.
- 🟢 Three scoped browser journeys, including keyboard-targeted Fire use,
  area damage, no Energy use, reload, export, collection labels and phone layout.
- 🟢 30 domain tests; targeted ESLint, application/test types, production build,
  formatting and inventory.
- 🟡 Reviewed implementation published for draft delivery; [issue #77](https://github.com/qianyizhang/game/issues/77) owns current PR/CI status and remaining review. No merge authorized.

[Check record and limits](checks.md) · [Pixel scope report](svg-review.json) ·
[Source/image hashes and capture conditions](provenance.json) ·
[Independent review](independent-review.md)

Only `WorldItemArt.tsx` presentation and its relevant browser regression change.
IDs, potion rules, targeting, costs, persistence, unknown-ID fallback and accessible
HTML controls remain intact. The combat witness is a legal prefix of the existing
winning replay. Its enemy portraits are unchanged latest-main assets; no preserved
Beyond candidate files were accessed or transported.

## Delivery

The independently accepted artwork and original comparisons are preserved at
`c3a679c202ae6987d77f1f7f49940f76b772c789`, on
`art/local-spire-damage-potions`. Subsequent delivery documentation does not change
those reviewed source or image bytes. Issue #77 tracks the draft PR, terminal CI
and review decision; it remains open until delivery is complete.
