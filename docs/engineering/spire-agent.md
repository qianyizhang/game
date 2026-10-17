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
| 3                   | More elites, deadlier normal enemies and deadlier elites.                            |
| 5                   | Adds cumulative elite/boss changes and recovers only 75% of missing HP between acts. |

These reuse existing selectable Ascensions 0–5 without rule/content or replay changes.
The current development-selected study points are 0/3/5; earlier studies retain
their original 0/2/5 points. All native integer Ascensions 0–5 are accepted by the
policy adapter. Both Ironclad and Silent run each matrix, reported separately. Character cases
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

### Visible-hand planning

`spire-policy-4` keeps Immediate as a greedy strategy; Survival and Growth additionally
search at most five visible-hand actions with beam width twelve, replanning after each
actual command. Candidate evaluations are included in recorded work. Collection
choices value lasting scaling, energy relics and redundant-card costs; routes consider
three connected future rows of public node kinds, and low-health campfires prioritize
healing. These policies have different work costs as well as strategic priorities.

The projector constructs a **synthetic state from the public observation and fixed
placeholder private fields**, then reuses native deterministic card resolution. It
never receives the real state, seed, RNG, ordered draw pile, AI history or replay.
Draws, generated cards, random effects, pending choices, Hex generation, Dark Embrace
draws, stasis release and Time Warp turn endings cut a branch. Lethal Awakened One
branches also stop because its private phase flag is unavailable. The model asserts
that its placeholder RNG did not change. Current displayed intents stay intact unless
a native deterministic public trigger changes them. Future intent selection and
unobserved draws are never simulated as if known.

The v4 HP forecast shares native ordered Burn/Regret hand triggers, distinguishes
Block-preventable damage from direct HP loss, and applies public enemy buffs/debuffs
in announced execution order. This prevents wasting Block potions against Regret and
missing the Collector's debuff before its minions attack. It remains an approximation
of the announced phase, including incomplete retaliation/end-turn kill modeling;
it never selects a true future intent or draw. Native rules/replay meaning is unchanged.

Survival Ironclad additionally uses `agent/collection.ts` for reward, shop and campfire
choices. Its curated public priorities adapt the existing simulation heuristic's card
ratings without importing its privileged combat lookahead. Duplicate penalties and
addition thresholds favor a compact deck; healthy campfires upgrade high-priority
cards, while legal relic restrictions and affordability come from the offered menu.
Immediate, Growth and Silent retain their own collection behavior. Ratings are policy
preferences rather than authoritative game scores. Original inputs and the chosen
collection reason remain inspectable in each rollout.

The endpoint utility and estimates beyond those deterministic effects remain
approximate. Regression witnesses protect Block absorption, Sharp Hide before Rage,
Reaper healing only after survival, public Split cancellation and indirect draw cuts.
Do not duplicate a second combat resolver: the first hand-written projection missed
these orders and could stall safely winnable fights. All received observations remain
detached, and hidden-state substitutions produce identical policy decisions.

Persistent defenses require a separate progress check: avoiding current-turn damage
can still lose a winnable long fight. The v3 policy values breaking Spheric Guardian's
retained Block; its complete encounter regression wins in thirteen decisions where
the frozen v2 policy loses after forty-four. A local valuation fix is evidence for that
encounter, not a substitute for fresh full-run strength calibration.

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
repetitions. Any adjusted significance claim requires a preregistered contrast family
and an explicit inferential addendum, separate from descriptive study summaries. Publish
negative results and uncertainty; future tuning needs a new version/protocol/fresh cases.

The [dated adoption report](../research/experiments/2026-10-16-spire-policy.md) owns measured
results, sparse-win limits and the source-pinned correction to original paired-win analysis.

## Current strength and historical evidence

The [strength-4 confirmation](../research/experiments/2026-10-16-spire-strength-confirmation-4.md)
passed every declared criterion for both characters. Its [prospective protocol](../research/experiments/2026-10-16-spire-strength-4-protocol.md)
fixed Survival v4, exact historical Survival v1, 400 fresh primary blocks per character
and twenty matched companion blocks. Victory within 2,000 decisions was the endpoint;
seven budget stops remain nonwins. Errors, incomplete grids, audit failures and source
drift still block promotion. Holm correction covers four tests in this study, not the
adaptive series of confirmations.

Survival v4 wins per 400 attempts at Ascensions 0/3/5 were **98/86/32 Ironclad** and
**135/74/43 Silent**; historical Survival v1 A0 wins were 5 and 43. Absolute-strength,
paired-improvement and A0–A5 separation criteria pass, with A3 estimates between the
endpoints. Adjacent-tier significance, equal-compute causality, universal strategy
ordering and human difficulty remain untested.

Shared benchmarks accept `--cohort NEW-NAMESPACE`,
`--blocks 10|20|40|60|100|400` and `--policies ID,ID`. Increasing the block count alone
reuses the same prefix. Original adoption seeds and historical factories/bundles retain
their identities; different current sources cannot certify historical reproduction.

The [earlier strength report](../research/experiments/2026-10-16-spire-strength.md)
retains both failed confirmations. Their [strength-2](../research/experiments/2026-10-16-spire-strength-protocol.md)
and [strength-3](../research/experiments/2026-10-16-spire-strength-3-protocol.md) protocols
remain unchanged. Those failures were not retrospectively repaired by the later
budget endpoint or successful confirmation. Dated reports own full counts, audit
coverage and inferential limits; this page owns the current developer contract.
