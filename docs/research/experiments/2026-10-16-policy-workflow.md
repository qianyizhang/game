# Six-game policy workflow · 2026-10-16

All six games now support common `run`, `record`, `benchmark` and `audit` entry points
with local TypeScript extensions. Night Passage retains its native controller, work
latency and rollout schema; its audited study backend records original knowledge for
each attempt. This slice closes workflow gaps and makes **no new strength claim**.

The [canonical guide](../../engineering/policy-development.md#common-cli-game-owned-policies)
maps selectors, extension examples and owning contracts. The [receipt](2026-10-16-policy-workflow.json)
contains six independent CLI round trips, manifest/file hashes, exact source/tool pins,
the bounded native study report and independent case audit.

## Implemented workflow

- **Six selectors:** `blindside`, `spire`, `hearth`, `emberwake`, `cartographer` and
  `night-passage`. Audit dispatches from the recorded identity/schema, without requiring
  the caller to guess a game selector. Actual record → audit regressions cover the
  Cartographer wire-ID mapping and Night Passage's separate native schema.
- **Extensions:** static source-pinned local TS modules, fresh episode memory, exact
  original input/proposal/work retention, exclusive outputs and source-drift guards.
  Native custom IDs cannot collide with built-ins. Absent implementations leave
  reproduction unavailable while replay/input audits remain independent.
- **Native study:** default Night Passage benchmark freezes 10 development or 20
  reserved independent blocks across three effort policies, three tiers and five
  weapons: **450/900 attempts**. Every attempted case retains its original rollout,
  native replay, audit and review manifest. Results keep each weapon/difficulty stratum,
  native score/wins/winning time and paired uncertainty separate.
- **Compatibility:** explicit `--suite training|held-out` preserves labelled legacy
  summaries; original native benchmark/evaluate commands keep their meanings. Native
  action/tick budgets, start-action accounting and structured `Decision.work` remain
  unchanged. Unsupported generic seed/options/decision-budget flags fail explicitly.

## Verified evidence

All **six CLI record → independent audit round trips** passed integrity, replay,
permitted-input reconstruction and policy reproduction, with
`originalSourceMatches: true`. Five shared adapters used deliberately short two-decision
episodes; Night Passage used its custom module and native timing budgets. These are
interface checks, not gameplay comparisons.

A selected native development study recorded **30 cases**: ten independent development
blocks × bow/Standard × Quick/Balanced/Deliberate. Budgets were 100 accepted actions
including start and 50 actual ticks. All **30 living timeouts passed four audits**,
with zero execution errors. Protocol links and all per-case artifact hashes match.
An independent CLI audit of a retained study case also passed with matching sources.

Reproduce the selected study in a fresh output directory:

```sh
npm run engine:policy -- benchmark --game night-passage \
  --split development --weapon bow --difficulty standard \
  --max-actions 100 --max-ticks 50 \
  --out test-results/night-passage-policy-workflow/development-2
npm run engine:policy -- audit \
  --input test-results/night-passage-policy-workflow/development-2/cases/standard/bow/quick/POLICY-ADOPTION-1-DEV-01/rollout.json \
  --out test-results/night-passage-policy-workflow/development-2/independent-case-audit.json
```

The retained witness used `development-1`; the commands use `development-2` to
preserve its original bytes. No policy filter means all three effort policies run.

No large default matrix or new reserved strength study was run merely to verify this
dispatch. Historical Night Passage calibration remains the strength evidence, with
its original provenance and limitations. Other games' dated adoption reports retain
their independent result and calibration limits.

Two actual produced manifests opened successfully in disposable Chrome: a native study
case and an external custom-policy recording. Browser assertions checked original
knowledge, late before/after navigation, evaluator hidden by default and byte-exact original
downloads. The custom recording correctly left browser reproduction unavailable.

## Independent review and closeout

Fresh Astra review found that exclusive bundle writes broke successive native
development/evaluation reports sharing one content-addressed bundle directory.
Identical existing bytes are now reusable; a mismatching retained file is preserved
and rejected. A regression exercises both cases. The common dispatcher and supporting
I/O/statistics sources are pinned alongside native workflow code.

Final `npm run check` passes maintained/static/build scopes, **507 application tests
across 89 files** and **37 seeded simulations across eight files**. Seven focused
workflow/tool regressions and both produced-manifest browser journeys pass. Core
rules, native controller and game UI behavior are unchanged in this capstone;
geometry/native asset verification is outside the affected scope.

Policies remain cooperative in-process modules. Shared verbs preserve game-owned
observation, timing, score and setup semantics; they do not establish comparable
scores or human-equivalent playing strength across games.
