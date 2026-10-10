# Recruitment v2 and decision diagnostics

Recruitment v2 tests two specific causes of Tempo's poor v1 placement. **Classic remains the default.** These are versioned experimental controllers, with an offline decision explorer and a fixed factorial comparison. Human coaching, tavern spells and broader search are outside this slice. The subsequent [spell expansion](../guide/tavern-spells.md) uses a separate v6/v2 gameplay environment; these experiments and the decision explorer explicitly retain v5/v1.

## Frozen policy controls

`ai/recruitment-policy.ts`, `ai/policy.ts` and `domain/bots.ts` retain their published v1 bytes; tests pin their SHA-256 hashes. `decideRecruitmentV2` wraps the original controller. The two control IDs reproduce v1 commands exactly and attach diagnostics. No game rules, content, save keys or replay versions change.

| Policy ID          | Earlier upgrades       | Fund replacements |
| ------------------ | ---------------------- | ----------------- |
| `baseline-v1`      | Off; Classic reference | Off               |
| `tempo-v1`         | Off; Tempo control     | Off               |
| `tempo-upgrade-v2` | On                     | Off               |
| `tempo-spend-v2`   | Off                    | On                |
| `tempo-both-v2`    | On                     | On                |

**Earlier upgrades:** after mandatory Discover, deployment and triple-purchase priorities, allow legal upgrades on rounds 2/4/6/8/10 for the next tier. Require at least `min(5, round)` board units (round 2 is exempt), and preserve Tempo's existing health reserve: above 18 HP normally, above 25 HP against a disclosed Tempo opponent. Existing v1 upgrade choices remain available.

**Fund replacements:** when Tempo would otherwise finish or order its board, and has a full board, empty hand and exactly two gold, sell its weakest unit if an available shop offer improves its projected value by more than two heuristic units. Reserve action headroom for sale, purchase, deployment and a possible extra play. Reject this intervention when the subsequent upgrade could consume the purchase budget or a frozen triple would be disrupted. It changes replacement spending, not general reroll behavior. Actual game transitions still own gold, supply and triples.

The policy receives only `ArenaFrame`. No seed, full lobby state or evaluator inspection data enters the controller. Its disclosed-label survival guard is deliberately retained as an experimental condition. Labels remain inspectable at the evaluator boundary regardless of policy visibility.

## Decision explorer

Each focal trace includes the legacy proposal, guard results, selected intervention, replacement projection and unit-value components. These explain the implemented heuristic; they are not causal attribution or win probabilities. Rival traces retain their v1 reasons. Exact input hashes permit reconstruction without storing duplicate full observations.

```sh
node packages/workshop-tools/hearth/recruitment-inspect.ts \
  path/to/CASE.replay.json path/to/CASE.receipt.json /tmp/new-inspector.html
```

Open the standalone HTML. Step through focal decisions, switch among five policy proposals on the **same recorded input**, inspect guard failures and values, or download an accepted-command prefix. Alternatives do not simulate future consequences. The viewer verifies the receipt's replay hash, validates the journal and setup, and checks that the declared focal controller reproduces every recorded focal action. Its provenance includes the inspector bundle hash: it is a current reconstruction, not a replacement for the frozen experiment audit.

The arena journal stores explicit commands and v1 style-family presets. A v2 controller ID belongs to the experiment receipt/trace, not the rules configuration. Downloaded prefixes are historical arena-v1/Hearth-v5 journals. Reconstruct them with `arenaSessionV1` or open them in a v1 checkout; the current arena-v2 UI rejects them as incompatible. In a v1 checkout, subsequent automatic turns use the recorded v1 style preset. The viewer is an evaluator surface and includes the private environment seed/configuration in replay downloads; those are never supplied to the policy.

## Frozen experiment design

`RECRUITMENT_PLAN` and `recruitmentCases` define the full grid before execution:

- **Development:** 5 fresh seed blocks × 8 seats × 2 rival populations × 5 policies = **400 lobbies**, hidden labels.
- **Reserved evaluation:** 5 distinct fresh seed blocks × 8 seats × 2 populations × 5 policies × 2 visibility conditions = **800 lobbies**.
- **Heroes:** Forgekeeper, Quartermaster, Wildspeaker, Archivist and Oathkeeper, one per seed block in each cohort. All five have equal weight. Hero and seed are confounded within a cohort; this does not estimate a separate hero effect.
- **Populations:** seven Classic controllers, or the existing Mixed Rivals roster (two each Tempo/Economy/Composition, one Classic). The rival hero roster is held fixed between population conditions; focal hero and roster rotate together through all eight seats.
- **Visibility:** hidden or disclosed only to the focal policy; rivals always receive hidden frames. All Classic-population hidden/disclosed pairs and the Mixed Classic-reference pairs must have identical gameplay commands: **240 negative-control pairs** in evaluation.
- **Budget:** 6,000 accepted commands per lobby, zero search simulations, two independent worker threads by default, 512 MiB heap cap per worker. CLI allows 1–4 workers. No provider calls or paid model runs.

Primary outcome is mean focal placement (lower is better). Report first-place/top-four counts, survival rounds, changed decisions, and surviving-turn tier/gold/board/HP checkpoints. Estimate upgrade and spending main effects plus interaction from the four Tempo variants. Positive effects mean lower placement. Uncertainty uses **five seed-block means**, never 40 independent seat observations; checkpoint denominators exclude already-eliminated players and can differ across policies.

A seed block is excluded in full for missing, duplicate, failed, incomplete, unverified or mismatched cases or disclosure-negative-control failures. Unexpected cases are reported and fail the runner. Fresh namespaces are `HEARTH-R2-DEV-20261004-1..5` and `HEARTH-R2-EVAL-20261004-1..5`. Reserved outcomes do not trigger automatic tuning or promotion. Different decisions consume different random-stream positions; these are bounded population comparisons, not guarantees of broad competitive strength.

## Run and audit

```sh
node packages/workshop-tools/hearth/recruitment-experiment.ts smoke test-results/ai/new-recruitment-smoke 2
node packages/workshop-tools/hearth/recruitment-experiment.ts development test-results/ai/new-recruitment-development 2
node packages/workshop-tools/hearth/recruitment-experiment.ts evaluation test-results/ai/new-recruitment-evaluation 2
node packages/workshop-tools/hearth/recruitment-experiment.ts audit test-results/ai/new-recruitment-evaluation 2
```

Every output directory must be new. Before games start, a manifest records the complete case list, plan/configuration hash, source revision/status, hashes of the actual headless dependency graph and harness, runtime, worker budget and bundle digest. UI-only concurrent edits are outside this graph. Outputs include per-case replay, receipt, compact JSONL decision trace, and a comparison. Failures remain in place. Source drift fails the run; no evidence is overwritten.

Every episode checks supply conservation after accepted commands and reconstructs its exact final state. The separate audit requires the frozen source/bundle, then reconstructs every input, controller binding, decision, guard/value diagnostic, accepted command, metric summary and final placement. It writes per-artifact hashes and a separate audit receipt. Worker scheduling cannot change deterministic gameplay; elapsed timings are observational only.

## Source map

- `src/games/battlegrounds/ai/recruitment-v2.ts`: versioned interventions and diagnostics.
- `src/engines/hearth/recruitment-experiment.ts`: frozen grid, controller binding, complete-block comparison.
- `src/engines/hearth/recruitment-inspector.ts`: replay reconstruction and same-input proposals.
- `packages/workshop-tools/hearth/recruitment-*.ts`: checked run/audit harness and source pins. Historical reports retain their original source pins; reproduce those runs from their recorded revision.
- `packages/workshop-tools/hearth/recruitment-inspect.ts`, `recruitment-viewer.ts` and `recruitment-viewer.html`: standalone interactive viewer behind the original inspect command.

## Verified result

The [frozen development and reserved evaluation](experiments/2026-10-04-hearth-recruitment-v2.md) completed and audited **1,200/1,200 lobbies**. Earlier upgrades improved Tempo's reserved mean placement in both rival populations, but Classic retained the best mean. The narrowly enabled replacement-spending intervention added little. No policy was promoted or tuned after the outcomes; the report retains all denominators, block uncertainty, disclosure controls and diagnostic receipts.
