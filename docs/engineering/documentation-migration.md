# Documentation migration provenance

The 2026-10-07 sweep consolidates the original 45 legacy documents into guide, engineering, art and research. The [machine-readable record](../../maintenance/document-migration.json) accounts for all 45 original paths: the trace guide moved earlier, and this batch consolidates the remaining 44. Each entry names its original path, destination and SHA-256. Use the entry-specific `sourceRevision` when present, otherwise the record-level revision.

## What moved and what was consolidated

- Current usage: modding, challenges, engines, Mixed Rivals and tavern spells in `guide/`.
- Engineering: architecture, settled decisions, agent protocol and current roadmap. Delivered workshop/AI plans became a single roadmap linked to dated evidence.
- Art: one authoritative rulebook, SVG/3D source maps, compact asset records and one dated creature-direction/trial history. Repeated conversion counters and then-current full-suite logs remain in original Git records; acceptance status and consequential defects remain beside each asset.
- Research: original expansion conditions, delivery history, recruitment protocol and unchanged machine-readable experiment receipts. Earlier v2/v4 content claims and v5/v1 experiments remain explicitly historical.
- Trace: the long design handoff is superseded by the operational behavior-debugger guide. Observable evidence, coverage, attribution, unknown history and technical-versus-user acceptance remain explicit.

## Recover an original document

Use the `sourceRevision`, `from` and `sha256` fields in the record:

```sh
git show REVISION:ORIGINAL_PATH > /tmp/original-document.md
shasum -a 256 /tmp/original-document.md
```

The output must match the recorded digest. The redundant local document copies were retired after verifying every byte against reachable Git blobs; the recovery metadata remains under `.work/backups/full-migration-docs-2026-10-07/`. Neither new prose nor a missing capture can replace original evidence.

The private trace recipe retains four original art-document paths pinned to an earlier full Git revision. These historical references deliberately remain unchanged. Current navigation points to the new homes; recorded JSON source paths, frozen hashes, rule versions, data and old generated bundles are not rewritten.

Migration is not aesthetic acceptance, an experiment rerun, artifact-retirement authority or proof of remote CI. The [sweep closeout](maintenance-migration.md) records completed verification and retention audit results.
