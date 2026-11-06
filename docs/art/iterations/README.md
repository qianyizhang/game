# Asset history and game selection

The 2D gallery keeps artwork revisions beside their generation or authoring
attempts. Open `/__art/` on the local development server, or follow **2D asset
gallery** in the game. Current SVG exports link each asset to the offline
`history.html` view. Offline exports embed artwork and available prompt/settings
text; writes require the local gallery. The live browser loads metadata first, then
requests only the viewed asset's editable source and retained revisions. GIF bytes
are requested on explicit play or download. Reloading or navigating discards pending
previews; reload after an external history change. Missing or changed revision files
show an error on that preview without preventing other assets from being browsed.
Editable-source reads render the requested slot afresh, excluding game selections;
they still bundle the shared source catalogue. Complete offline exports deliberately
render and embed every source, revision and available attachment.

## Save, compare and use

- Find an asset by its name, stable ID or collection. Each revision shows its
  source image, compact view, lineage, and the attempt's original prompt,
  request/settings, response or failure record. Missing historical facts remain
  unknown. Shared packed requests are stored once. Unassigned source studies
  remain browsable without an invented game identity.
- Unchanged assets are discovered through their live renderer, stable ID and
  source revision. Initial catalogue coverage creates no frozen artwork files.
  **Save source revision**, or `assets:history snapshot <asset-id>`, explicitly
  freezes that asset before its first edit. Reuse an identical saved checkpoint.
  After editing, save the changed source. `assets:history snapshot` without an ID
  saves only changed or new assets; it does not freeze the unchanged catalogue.
  This is explicit work, with no watcher, generation call or automatic reroll.
- **Use in game** pins one compatible static SVG revision as the repository's
  default for that slot. Refresh the game or rebuild production to see it.
  Select an older revision to roll back. **Use editable source** removes the pin.
  The renderer retains sizing, HTML labels, stats and gameplay state; the selected
  SVG supplies only artwork. Canvas SVG consumers decode a selection once into
  their sprite cache before play; failures keep the game unready with an error.
  Shared primitives and playing-card interiors use
  their actual runtime dimensions rather than their framed cabinet specimens.
- Generation agreement, an author's review and user acceptance remain historical
  facts. A selection records what the game uses, without rewriting those facts.
  GIFs remain source studies until a game owns their effect, trigger and timing.
  Viewing/copying settings makes no API request and cannot reproduce stochastic
  output exactly.

## Register new work

1. **Before work:** identify the affected IDs and inspect their live gallery art.
   Explicitly checkpoint each existing asset before its first edit or generation
   trial. Preserve that checkpoint through the change; new assets have no prior
   version. Keep scratch comparisons in ignored outcome bundles rather than
   exporting and retaining the unchanged catalogue.
2. **On each terminal attempt:** retain its exact sent prompt, sanitized request
   and settings, reference inputs, original result, usage/request ID or error,
   and review outcome under `docs/art/iterations/files/<asset-or-attempt>/`.
   Keep each paid retry separate. Register a failed attempt with no invented
   image and unknown billing where usage was not returned.
3. **Register outputs:** use `assets:history import <prepared-history.json>`.
   The input follows [the library schema](library.json): `schema: 1`, `assets`,
   `attempts`, and `revisions`. Supply added entries; existing slot identity and
   dimensions must agree. Reuse an existing attempt for a packed sheet's
   extractions. Give each original, extracted cell and adaptation a revision,
   with known parents and cell/transform notes. Keep exact originals distinct
   from derivatives. Put the temporary import document in the working bundle,
   not among retained inputs unless it has a lasting consumer.
4. **After hand edits:** save the changed source through `snapshot <asset-id>`.
   For a new catalogue ID, use `snapshot` without an ID to register new/changed
   slots only.
   The saved output becomes a real revision. A source change cannot replace its
   registration digest until the prior output has a preserved checkpoint; recover
   an omitted baseline from the recorded source revision before continuing.
5. **Before review-ready:** run `npm run assets:history -- verify`. Resolve every
   changed source without registration and every unregistered managed file.
   Open each affected asset in the gallery; inspect its actual revision, native/
   compact views, parent links and exact prompt/settings or failure. An unassigned
   sheet remains a source study until its extracted cells have known game slots.
   Gallery registration and technical checks do not establish aesthetic approval.

Never store credentials. Store shared sheets once and link their extracted
revisions. `file` and `digest` identify the review source; `runtimeFile` and
`runtimeDigest` identify a compatible static SVG adaptation, or are both null.
The SHA-256 fields are consumed by import, selection and verification; changed
bytes need a new revision.

The frontend selection file contains only pinned SVG delivery snapshots and their
revision/digest. Full history stays out of game bundles. Each asset's
`sourceRevision` records the Git base for its last source capture; saved revision
notes identify included working-tree edits. The preserved SVG is the exact
result. `sourceDigest` records the last source output registered with this workflow. These small registration facts
remain after deliberate image removal so unchanged art does not need another
frozen copy. The gate renders sources for comparison without saving images.
The executable store owns schema, path containment, SVG restrictions, freshness,
file ownership and mutation rules. Verification is part of the maintained gate;
the catalogue contract also requires a registered identity and working selection
route for every current SVG ID.

## Remove deliberately

Accepted November 6, 2026: explicit guarded removal replaces the blanket Image
2.6 preservation hold **for records deliberately chosen for removal**. Other
artwork and source obligations retain their existing protection.

**Remove** shows the record, owned files to delete and shared/historical files
that stay. A game-selected revision must be replaced first. Surviving derivatives
keep a short note identifying their removed parent. Remove an attempt after its
revisions are gone; failed attempts can be removed directly. Removal changes the
working tree and keeps Git history. It does not reclaim historical Git objects.

Automatic deletion remains outside this workflow. Only unshared files in the
managed `files/` home can be deleted. External source/document consumers retain
those files. Imported legacy art remains in its existing historical homes because
old galleries, reviews and documentation still use it; removing its new index
entry does not delete those shared originals. A later migration can retire those
consumers explicitly. The removal preview makes that retained storage visible.

Writes reject stale state and concurrent publishers. File changes, unsupported
SVG resources, incompatible aspect ratios and symlinked paths fail before a
selection changes. Failed removal staging restores its files and leaves the
library intact. Reload history after a conflict; inspect the current state before
retrying.
