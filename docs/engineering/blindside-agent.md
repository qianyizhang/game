# Blindside policy play

Blindside v5 exposes detached public observations, three fixed strategic priorities,
selectable target pressure and original decision evidence. Rules and accepted-command
replays remain game-owned. The shared recorder/auditor and review navigation implement
[policy development](policy-development.md); they do not calculate authoritative scores.

## Information and actions

`src/games/balatro/agent/observation.ts` owns `Observation`. It includes visible hand
order/card definitions, canonical unordered permanent deck composition, remaining
rank counts, current-ante boss, score/target, resources, Joker order/growth, levels,
consumables and current offers/tags/pack choices. This is structured public information,
not a claim of human-equivalent perception.

Environment seed/RNG, ordered future draws, future-ante bosses and next internal ID
remain evaluator-only. For example, choosing a flush from visible cards is permitted;
stepping the true seeded state to discover the next draw violates this boundary.

Policies propose ordinary game commands. The evaluator configures difficulty before
play and excludes `configure` from policy commands. Rejected commands preserve the
session/replay and end this benchmark attempt as an execution error. Terminal calls,
factory/decision exceptions and malformed outputs retain original inputs and failures.
The default budget is 2,000 policy decisions; timeout/error cases remain attempts.

The pure scoring model builds an explicit sanitized forecast from observation fields.
Its placeholders for seed/RNG/future bosses are inert: policy code never calls hidden
seeded transitions. Shop values use a seven-card sample of known permanent composition
with independent policy RNG. This model approximates purchase value and future growth;
it does not see a future hand. Work counts scored candidate hands, omitting sorting,
JSON/recording and other ordinary bookkeeping. Work is a deterministic proxy, not time.

## Difficulty and native result

| Tier     | Target multiplier | Other rules         |
| -------- | ----------------- | ------------------- |
| Relaxed  | 0.75              | Unchanged           |
| Standard | 1.00              | Historical gameplay |
| Severe   | 1.35              | Unchanged           |

Multipliers apply after the existing ante/blind/boss target calculation. They do not
change seeded deck, shops, resources or RNG consumption. Players select the tier before
the first accepted gameplay action; the choice locks even when skipping into another
ready phase. Current saves use v5. Original v4 saves/fixtures retain Standard and exact
state reconstruction, including replay prefixes, continuation and practice branches.
The preserved v4 local slot can be restored explicitly; it is not overwritten by v5.

Primary comparison: **win, then progress, then cash**. Progress is blind stages passed
(cleared or deliberately skipped), plus capped current-blind score fraction on playing/
lost states. Reports separately count cleared/skipped/passed blinds, terminal outcome,
round score/target, cash and commands. Round score resets per blind and is not cumulative.
Neither multiplier names nor a successful replay establish calibrated human difficulty.

| Policy    | Concrete priorities                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------- |
| Immediate | Best current visible hand, short-horizon scoring purchases, limited redraw pressure.                  |
| Survival  | More redraw pressure, resource-granting Jokers/vouchers and near-term score reliability.              |
| Growth    | Permanent Joker growth, projected income/scaling horizon, selected public skip tags and engine packs. |

All reset memory each episode. Their policy stream defaults to `POLICY-STREAM-1`, independent
of the hidden environment seed. These are different heuristics, not a promised strength order.

## Run and extend

Use the pinned Node/npm runtime (`nvm use`). Existing `engine:challenges` remains a
privileged tactical/search tool; it is not this restricted policy evaluator.

```sh
npm run engine:policy -- run --game blindside --policy survival --difficulty standard
npm run engine:policy -- record --game blindside --policy growth --out test-results/my-new-rollout
npm run engine:policy -- run --game blindside --policy-module src/games/balatro/agent/example.ts
npm run engine:policy -- audit --input test-results/my-new-rollout/rollout.json --out test-results/my-new-audit.json
```

Use `--policy-options '{"key":"value"}'` to pass an explicit JSON object to a custom
factory; the policy owns validation of its options.

A local TypeScript module default-exports `PolicyFactory<Observation, Command>` from
`src/shared/policy/types.ts`. `agent/example.ts` is a complete extension example: a new
factory creates private per-episode memory, delegates choices and adds diagnostics.
It intentionally chooses the same actions as Immediate; it is not a fourth strategy.
A new policy does not edit rules, observations, replay or the episode loop. Factory
configuration contains public setup, policy options and independent policy seed only.

Local modules are trusted in-process code. Restricted inputs, reconstruction and source
review support cooperative fairness; hostile code could import private modules or use
ambient Node capabilities. No sandbox/isolation claim is made.

`record` requires a fresh directory and retains `rollout.json`, `replay.json`, `audit.json`,
`manifest.json` and the compiled bundle. Source/tool hashes and runtime identify the
implementation; source drift stops successful closeout. Original knowledge is captured
before the policy can mutate its input. Factory/malformed-output failures retain raw
JSON output or an explicit unsupported-value marker.

## Review original decisions

Open `/?game=balatro&review=policy` and load one or several rollout files, or use the
manifest's same-site review URL. The isolated route does not mount live save hooks.
Filter runs, compare matched-condition descriptive groups, jump to first/previous/next/
last or a numbered decision, choose an ante/phase marker, play at a selected speed,
and inspect before/after consequences on a passive Blindside table.

Original policy knowledge and proposal/work/diagnostics are the default. The explicit
privileged evaluator view reconstructs hidden state at the selected boundary. Download
original rollout bytes independently of replay availability. A damaged/unsupported
replay preserves artifact inspection and audit, while stale table/evaluator state clears.
A local-file link requires reopening that file after reload; same-site artifact URLs can
link directly with `decision=N`. Async imports never override a newer explicit selection.

Four separate current-runtime verdicts mean:

- **Integrity:** retained payload/input digests agree.
- **Replay:** recorded proposals and delivered replay reconstruct native outcome/metrics.
- **Inputs:** recorded knowledge matches the permitted view at each original boundary.
- **Reproduction:** matching deterministic policy recreates proposal/work/diagnostics.

Unknown custom factories leave reproduction unavailable. Incomplete checks remain
unavailable. Audit failure points to the first mismatch; a legal replay cannot excuse
an injected hidden input. Hashes do not certify truth, fairness or historical source
availability. The retained bundle supports pinned historical execution; current browser
audits use current code and report identities explicitly.

## Evaluate without leaking reserved cases

```sh
npm run engine:policy -- benchmark --game blindside --split development --out test-results/new-dev-study
npm run engine:policy -- benchmark --game blindside --split evaluation --out test-results/new-evaluation-study
```

Each split freezes `protocol.json` before execution. Development has ten independent
seed blocks, evaluation twenty disjoint reserved blocks, crossed with all three tiers
and all three strategies. Use the same policy stream and decision budget throughout.
Every attempt retains full original rollout and audit, including errors/timeouts.
Freeze policies after development; never tune on reserved results and rerun under the
same claimed holdout. The study reports paired progress differences with uncertainty.
The [dated adoption report](../research/experiments/2026-10-16-blindside-policy.md)
owns measured results and limitations.
