# Workshop tools

This private npm workspace owns repository governance and artifact retention. It runs on Node with explicit filesystem contracts; it does not import game rules or require a browser.

Use the pinned runtime with `nvm use` (or install it with `nvm install`), then run from the repository root:

```sh
npm run maintenance -- check
npm run maintenance -- inventory
npm run maintenance -- prune
npm run maintenance -- prune --apply
npm run check:maintenance
```

`check` validates the source/document migration inventory and local links in maintained documentation. It includes Git-tracked and non-ignored untracked files. New source must enter a checker scope rather than the backlog.

`inventory` streams SHA-256 hashes for `test-results/`, `dcc-backups/` and the DCC artist-source directory. It reports every occurrence, equal-byte groups, source/asset protection and literal references found in tracked text. Symlinks are reported without following them; files that change while being read receive no stable hash. This is an observation of local files, not a deletion plan: equal bytes, age and missing references never authorize retirement. Backups and session notes outside these roots remain protected. Redirect the JSON to an ignored session directory when retaining an audit.

`prune` defaults to a dry run. It inspects direct children of `test-results/disposable/` and `.work/sessions/`. Only explicitly closed, unpinned, unchanged entries can expire. It never deletes tracked files, follows symlinks, scans artist backups for deletion, or deletes generic `test-results/` history. Invalid entries remain protected in the report. `--apply` revalidates the plan and removes exact files; it does not recursively remove an unchecked directory.

The DCC native render command is the first producer of closed disposable outputs. Other producers must adopt the same receipt contract deliberately. Session closure requires promotion targets. [Governance](../../docs/engineering/maintenance.md) is the authority for lifetimes and workflow.

The package is checked with typed ESLint, TypeScript `checkJs` in strict mode, and Node tests covering destructive boundaries. It has no runtime dependencies. Root npm scripts remain the public entry points as more script families migrate here.
