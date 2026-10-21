# Architecture canvas

The editable [canonical map](../../.repo-canvas/architecture.json) describes source at
`1c152a65ec274cdaf3772553eaef687167e75509` (2026-10-18). It is a selected architecture
view, not an import graph. [Architecture](architecture.md) owns layer contracts;
[policy development](policy-development.md) owns evidence and retention requirements.
[Repo Canvas](repo-workbench.md) owns the UI/MCP contract.

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
  not transient audit memory. Five shared adapters sync completed summaries to a
  compact case ledger and derive the final report in declared grid order. Interrupted
  runs expose ordered summaries through `policy recover`, without partial aggregates
  or execution resume. Native Night Passage retains its separate path. The frozen Emberwake strength
  validator requires retained gzip receipts, so summary-only output cannot replace
  its historical input contract.
- **Proposed seams** contains two discussion options with triggers and tradeoffs:
  review loading and game-dispatch metadata. They are not
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

## Open and validate

Install [Repo Workbench](repo-workbench.md), then call its `canvas_open` with this repository's absolute path. Each opening has its own repository context. Existing chats may need a restart after replacing the old direct registration.

```sh
repo-workbench canvas --repo "$PWD" --validate
repo-workbench canvas --repo "$PWD"
npx prettier --check .repo-canvas/architecture.json docs/engineering/repo-canvas-architecture.md
npm run maintenance -- check
```

The plugin's generic browser/protocol checks run in repo-kit. This repository owns the saved map and its source accuracy. Review a proposal, Apply to draft, then Save map. A standalone preview has no side-chat host; a passing protocol check alone does not prove native Codex attachment.

The game architecture review remains pinned to the source above. On 2026-10-20, the map's developer-tool source references were updated for extraction to repo-kit, preserving existing IDs, layout and annotations. The earlier combined implementation is recoverable at `2db3b0d`.
