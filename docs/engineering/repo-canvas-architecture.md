# Architecture canvas

The editable [canonical map](../../.repo-canvas/architecture.json) describes source at
`1c152a65ec274cdaf3772553eaef687167e75509` (2026-10-18). It is a selected architecture
view, not an import graph. [Architecture](architecture.md) owns layer contracts;
[policy development](policy-development.md) owns evidence and retention requirements.
[Repo Canvas](../../packages/repo-canvas/README.md) owns the UI/MCP contract.

## Read and discuss

The overview has eight concepts: shell, games, policy evidence, shared utilities,
repository tools, art workbench, canvas and proposed seams. Click to inspect ownership,
interfaces, source previews and notes; double-click to enter a focused view. Use
**Fit view** after changing scope and breadcrumbs to return. Search finds nested modules.

- **Game systems** shows all six games. Five use the shared `EpisodeAdapter` policy
  recorder/inspector; Night Passage retains its native controller, chronicle and
  rollout format. Each card gives the real application and policy source paths.
- **Slay the Spire** traces UI → application session → rules, with the policy adapter
  entering through the same session boundary.
- **Last Hearth** distinguishes current Mixed Rivals adoption from recruitment
  harnesses and Classic/frozen transport contracts. All-actor replay spans avoid
  rerunning rivals during reconstruction.
- **Night Passage** distinguishes proposed controls from executed commands and
  retains native timing, budgets and review. Reusing navigation/input helpers does
  not make it a sixth shared adapter.
- **Policy evidence** follows evaluator → permitted observation → policy proposal →
  native accepted commands → record/audit → storage → inspector. Relationships
  describe interfaces; the scope note explains the full loop.
- **Retained evidence** separates default benchmark summaries from opt-in detailed
  recordings. Shared retained rollouts default to gzip; native production stays
  plaintext. Summaries cannot reopen discarded inputs. Compression saves disk,
  not transient audit memory.
- **Proposed seams** contains three discussion options with triggers and tradeoffs:
  retention options, review loading and game-dispatch metadata. They are not
  implemented modules or commitments. There are no proposed imports into live code.

Names are intentionally ordinary: a **game** owns rules; an **adapter** exposes permitted
input and native commands; a **policy** chooses; the **evaluator** runs and audits;
**evidence** is retained output; an **inspector** reviews it. Score units and controller
semantics remain game-owned. Full-state search APIs do not establish policy fairness.

Use stable module IDs in review comments, for example `policy-storage`, `hearth-arena`
or `proposal-review`. Add annotations to the owning module; preserve existing IDs,
layout and unrelated notes. To discuss a feature, identify its owner, input/output,
native exception, and one concrete source before proposing a consolidation. A canvas
proposal edits the diagram; it does not implement the refactor.

## Reproduce locally

From a clean checkout of the PR branch (or its merged successor):

```sh
git fetch origin
git switch --track origin/codex/architecture-canvas
nvm install
nvm use
npm ci
node packages/repo-canvas/src/server/cli.ts --repo "$PWD" --validate
npm run repo:canvas -- --verify --stdio --repo "$PWD"
npm run repo:canvas -- --repo "$PWD" --port 4317
```

Open `http://127.0.0.1:4317`. The pinned runtime is Node 24.21.0 / npm 11.19.0.
This canvas-only workflow needs neither Python/Blender nor game LFS assets.
If the branch already exists locally, switch to it rather than recreating it.
Use a different port for another checkout. Stop the preview with Ctrl-C.

For native Codex integration, run this from the same checkout after `nvm use`:

```sh
codex mcp add repo_canvas -- "$(command -v node)" "$PWD/packages/repo-canvas/src/server/stdio.ts" --repo "$PWD"
```

Fully quit/reopen Codex after registration; open **Repo Canvas** from the apps menu
or call `canvas_open`. The stdio probe reports server health only. Native attachment
is established only when that installed host actually renders the app and a side-chat
request reaches the owning conversation. The localhost preview disables side-chat
sending. Separate server processes share saved JSON, not unsaved drafts or requests.

In the hosted app, select `policy-storage`, ask which outputs are retained by default,
and send to chat. The conversation reads the request with `canvas_read`, inspects
source and replies using `canvas_reply`, optionally with a complete map proposal.
Review → **Apply to draft** → **Save map** → reload. Applying alone must not change the
shared file. If the draft changed after the request, reconcile before applying.

## Validate changes

```sh
node packages/repo-canvas/src/server/cli.ts --repo "$PWD" --validate
npm run typecheck --workspace @card-workshop/repo-canvas
npm run test --workspace @card-workshop/repo-canvas
npm run build --workspace @card-workshop/repo-canvas
npm run repo:canvas -- --verify --stdio --repo "$PWD"
npx playwright test --config packages/repo-canvas/playwright.config.ts
npx prettier --check .repo-canvas/architecture.json docs/engineering/repo-canvas-architecture.md
npm run maintenance -- check
```

The browser suite requires Chrome; on macOS follow the repository's approved browser
execution guidance. It runs on disposable fixtures and tests actual delivered MCP HTML,
proposal review, stale protection, source previews, Save/reload and external-file
conflicts. It does not prove native host attachment or inspect this map's visual layout.

For this map, also inspect overview, six-game view, policy workflow, retained evidence,
Hearth, Night Passage and proposed seams at a desktop viewport. Confirm readable names,
no overlapping cards, usable Fit/zoom, selected-node responsibilities and source previews.
Exercise edits on a disposable checkout: add a note, Save, reload and compare JSON; then
restore the original map. Keep screenshots and run receipts as private review evidence,
not additional permanent architecture snapshots. Documentation/map-only changes use the
formatting/inventory gate; code fixes additionally require the root `npm run check`.
