# Last Hearth agent interface and experiments

Last Hearth supports external agent processes, public observation contracts, structured decision traces, and competitive policy experiments ([roadmap](roadmap.md)). Current gameplay uses [tavern spells](../guide/tavern-spells.md) (Hearth v6 / arena v2).

## Strategic hero contract (rules v5)

| Hero       | Power                                                                    | Decision                                                       |
| ---------- | ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Archivist  | 1 gold: Return a friendly minion to hand, preserving stats and keywords. | Replay Battlecry, free board space, or protect valuable units. |
| Oathkeeper | 1 gold: Give a friendly minion permanent +3 Health and Taunt.            | Position attacks and mitigate cleave.                          |

Recall transfers existing units without duplicating pool copies. Full hands reject Recall.

## Information boundary

`src/games/battlegrounds/application/agent.ts` defines policy observations; `src/shared/agent.ts` provides transport contracts.

| Included in observation                                           | Excluded from observation                                |
| ----------------------------------------------------------------- | -------------------------------------------------------- |
| Own hero, gold, health, tier, board, hand, shop, Discover options | Environment seed, PRNG, allocation counters, raw replay  |
| Public rival names, heroes, health, tiers, and placements         | Rival hands, shops, Discover choices, and current boards |
| Next opponent's last-seen board/round or ghost snapshot           | Exact pool counts and future recruitment/combat draws    |
| Last combat summary, damage, and attack count                     | Resolver PRNG and full-state search access               |
| Rules/content pins and legal commands                             | Debug inspector state                                    |

Frames use protocol `card-workshop.agent.v1` and schema `hearth.observation.v1`. Action IDs are valid only for the returned `step`.

## External JSON-lines protocol

Launch the environment from the repository root:

```sh
node packages/workshop-tools/hearth/agent.ts MY-ENVIRONMENT-SEED test-results/agents/my-run
```

The process emits a `ready` line on stdout. Requests receive matched JSON responses:

```json
{"id":"read","op":"observe"}
{"id":"definitions","op":"catalogue"}
{"id":"move","op":"act","step":0,"action":"a3"}
{"id":"done","op":"quit"}
```

- `observe`: Returns the current observation frame.
- `catalogue`: Returns public hero/minion/spell definitions and content pins.
- `act`: Executes a command by action ID for the active step.
- `quit`: Terminates and writes evaluator replay and verification receipts.

Accepted actions return the next frame and structured events (resource deltas, phase changes, board movements, and combat results).

## Policies and search

- `heuristic-v1`: Evaluates recruitment choices using baseline valuation and fixed board ordering.
- `scout-search-v1`: Uses baseline recruitment, then searches up to 24 board order candidates (current, baseline, and single-unit relocations). Evaluates candidates against the opponent's last-seen board using 16 seeded combat rollouts (max 384 rollouts per round), maximizing mean damage margin.

## Reproducible experiment

```sh
npm run experiment:hearth -- development test-results/ai/my-development
npm run experiment:hearth -- evaluation test-results/ai/my-evaluation
```

Outputs:

- `manifest.json`: Cohort configs, policy digests, and Git/Node provenance.
- `decisions.jsonl`: Policy inputs, selected commands, structured events, rollout estimates, and timing.
- `replay.json` & `receipt.json`: Authoritative accepted commands and state reconstruction.
- `comparison.json`: Matched pairs, mean placements, win/tie/loss counts, and compute totals.

See [delivery history](../research/delivery-history.md) and [initial experiment](../research/experiments/2026-10-04-hearth-ai-v1.md) for results. [Mixed Rivals](../guide/hearth-arena.md) extends this with an 8-seat policy arena.
