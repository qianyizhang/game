# Spire policy play

Spire uses the shared run/record/benchmark/audit workflow with game-owned public
observations, legal commands, metrics and passive presentation. It retains rules v3
and ordinary accepted-command replay. The [canonical policy standard](policy-development.md)
owns the cross-game contract; existing full-state simulation/search remains diagnostic.

## Public knowledge and commands

`src/games/spire/agent/observation.ts` owns the current structured observation. It
includes character/Ascension, current resources/permanent deck/relics/potions, map
connections/kinds and revealed act boss, current room offers, hand and unordered pile
composition, public enemy states and projected current intents. Combat HP comes from
the current player fighter; run HP outside combat is the persistent resource.

Seed/RNG, internal next ID, hidden room encounters, ordered future draws, drop/rarity
chance accumulators, internal enemy intent history/index, resolution frames and pending
card-effect continuation queues stay evaluator-only. Enemy internal powers are filtered
to declared public mechanics. Only cards in known piles/visible choices enter the
public combat catalog. No hidden stolen-card registry or future encounter is exposed.

Legal menus check public preconditions without executing the true seeded transition.
Shared pure combat checks preserve the rule boundary: costs, living targets, Entangled,
Clash and pending choices. A policy can defend against an already displayed enemy intent;
simulating the real seeded next draw to choose its play violates the boundary.

The current observation intentionally omits remembered order. Headbutt can put a chosen
card on top; a stateful policy may retain that fact from its own prior decisions. Sorting
the current draw pile does not imply that all legitimately remembered order is unknown.
The baseline policies may underuse this advantage. Structured exact card/intent data and
public effect arithmetic are not human-equivalent perception.

The evaluator fixes character/Ascension through an ordinary recorded `configure`
command before policy invocation. Policies cannot reconfigure setup. Proposals use the
ordinary command path; malformed/illegal actions and exceptions are recorded as errors,
not ordinary losses. Opening a rollout never mounts live game persistence hooks.

## Difficulty, strategies and objective

| Evaluated Ascension | Existing cumulative mechanics                                                        |
| ------------------- | ------------------------------------------------------------------------------------ |
| 0                   | Standard gameplay.                                                                   |
| 2                   | More elites and deadlier normal enemies.                                             |
| 5                   | Adds cumulative elite/boss changes and recovers only 75% of missing HP between acts. |

These reuse existing selectable Ascensions 0–5 without rule/content or replay changes.
Both Ironclad and Silent run the complete matrix, reported separately. Character cases
sharing a seed are not counted as independent seeds in pooled confidence intervals.

The primary objective is **win, then rooms reached, then HP, then gold**. Rooms reached
is `16 * (act - 1) + max(0, row + 1)`, from 0 to 48; entering a room is not clearing it.
Report terminal phase, HP/max HP, gold, deck/relic counts, decisions and work separately.
The legacy defeat message uses a different floor stride; it is not score authority.
Default episode budget is 2,000 decisions; error/timeout cases stay in denominators.

| Policy    | Priorities                                                   |
| --------- | ------------------------------------------------------------ |
| Immediate | Damage, kills and near-term card value.                      |
| Survival  | Public incoming danger, block/healing/Weak and safer routes. |
| Growth    | Powers, draw/scaling, upgrades and deck/reward synergy.      |

These are versioned heuristics, not an assumed strength order. Public effect estimates
approximate random effects and future synergy; they never consult actual hidden draws
or future intents. Work counts declared deterministic candidate evaluations, not wall
time or model compute. Private policy memory resets each episode; optional randomness
uses the independent `POLICY-STREAM-1` stream, never the environment seed.

## Run, record, audit and extend

```sh
npm run engine:policy -- run --game spire --policy survival --setup '{"character":"silent","ascension":2}'
npm run engine:policy -- record --game spire --policy growth --out test-results/new-spire-rollout
npm run engine:policy -- run --game spire --policy-module src/games/spire/agent/example.ts
npm run engine:policy -- audit --input test-results/new-spire-rollout/rollout.json --out test-results/new-spire-audit.json
```

A local TypeScript module default-exports `PolicyFactory<Observation, PolicyCommand>`.
The factory gets only public setup, independent policy seed and explicit options;
`--policy-options` supplies its JSON object. It creates a fresh decision function with
private per-episode memory. The complete `agent/example.ts` adds diagnostic memory to
an existing strategy without editing rules, observations or the episode loop; it is not
a distinct strength baseline. Modules are trusted in-process code, not isolated hostile
plugins. Source/dependency review and input audits support cooperative fairness.

Fresh recording directories retain original rollout, accepted-command replay, independent
audit, manifest and compiled source-pinned bundle. The policy sees no evaluator callback,
save/replay handle or environment seed. Original input is copied before invocation;
raw malformed JSON output/factory failures remain inspectable. Source drift blocks
successful experiment closeout. Historical artifacts retain their original identities.

## Review the decision and its consequences

Open `/?game=spire&review=policy` or the manifest's same-site rollout link. Load/filter
several files; condition groups separate game/rules/content, setup, policy/version/
options/stream, budget and source. Use first/previous/next/last/numbered links, act/room/
turn markers, play/speed and before/after boundaries. Original input and proposal/work/
diagnostics are default; full reconstructed evaluator state is explicit.

The native passive board shows the selected room/combat, intents, resources, cards and
map. Pile/deck inspection remains available while command controls are disabled. Download
exact original rollout bytes, replay or a labeled current audit. Damaged replay boundaries
clear stale presentation/evaluator state while preserving inspectable evidence; malformed
artifact envelopes show an error. Async imports cannot override newer explicit selections.
Same-site URL links reload the selected decision; local files must be reopened.

Integrity, replay, permitted-input and matching-policy reproduction are independent
verdicts. A legal replay does not certify fair inputs. Unknown local factories leave
reproduction unavailable; incomplete checks remain unavailable. Retained bundles support
pinned historical execution; the browser audits against current code/identities.

## Freeze and evaluate

```sh
npm run engine:policy -- benchmark --game spire --split development --out test-results/new-spire-dev
npm run engine:policy -- benchmark --game spire --split evaluation --out test-results/new-spire-evaluation
```

Game-owned study definitions declare six character/Ascension setups. Ten development
seed blocks yield 180 attempts; twenty disjoint reserved blocks yield 360 attempts.
Every setup/policy uses the same independent policy stream and fixed decision budget.
Each attempt retains original knowledge and an audit, including errors/timeouts.

The protocol freezes setup/ranking/policy/source identities before execution. Freeze
policies after development, then evaluate once on reserved cases. Report Wilson win-rate
intervals and approximate paired progress intervals per setup over independent seed
blocks. Paired wins retain point estimates/discordance counts; their interval is explicitly
unavailable until a suitable paired-binomial method is supplied. Do not pool character
repetitions or claim adjusted significance. Publish
negative results and uncertainty; future tuning needs a new version/protocol/fresh cases.

The [dated adoption report](../research/experiments/2026-10-16-spire-policy.md) owns measured
results, sparse-win limits and the source-pinned correction to original paired-win analysis.
