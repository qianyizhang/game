# Repo Workbench

Repo-kit owns the reusable architecture canvas, session viewer, trace readers, and usage dashboard. Install its optional `@repo-kit/workbench` plugin at user scope or in this repository; the local source and installation guide are `../repo-kit/plugins/repo-workbench/README.md` relative to this checkout. No runtime code is copied into Card Workshop.

Open the installed plugin's Canvas with this repository's absolute path. The existing [architecture map](../../.repo-canvas/architecture.json) remains here; its schema, IDs, notes and positions remain repository-owned. [Map navigation](repo-canvas-architecture.md) explains the game-specific view. Canvas saves to `.repo-canvas/architecture.json`, not its installation directory.

```sh
repo-workbench canvas --repo "$PWD"
repo-workbench canvas --repo "$PWD" --validate
repo-workbench usage --serve
repo-workbench trace --repo "$PWD" --input test-results/trace-visualizer-input --case packages/workshop-tools/trace/case-study.json --out test-results/my-review
```

The [sculpture case definition](../../packages/workshop-tools/trace/case-study.json) owns its subjects, capture filename patterns, evidence references and pinned document revisions. Inputs remain authorized local `read_thread` exports; retained logs/assets and existing exports were not moved or rewritten. Explicit export destinations must be new. The opt-in private-evidence browser tests use the installed `repo-workbench` executable; set `REPO_WORKBENCH_CLI` if it is not on PATH. Their source validation is performed by the installed CLI.

Game policy rollout review remains in the game. Repo Workbench reviews development sessions; it is not the policy recording/replay engine.

The 2026-10-20 extraction moved generic tests, runtime and documentation to repo-kit. Earlier implementation and commands are recoverable from Card Workshop commit `2db3b0d`; historical receipts continue to identify their original source and gates. Existing receipt-qualified outputs retain this repository's retention rules. New plugin output/cache locations follow the plugin's own storage contract.
