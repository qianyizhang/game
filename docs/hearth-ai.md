# Last Hearth agent interface and experiments

Last Hearth now supports an external agent process, a public observation contract, structured decision traces and a bounded competitive-policy experiment. This is the first delivery of the [game depth and AI track](development-track.md). It adds no human coaching interface.

## Gameplay: strategic heroes, rules v5

| Hero       | Power                                                                                                             | Decision                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Archivist  | Once per recruitment, pay 1 gold to return a friendly minion to hand, preserving its identity, stats and keywords | Replay a Battlecry, reopen board space, or move a valuable minion out of combat |
| Oathkeeper | Once per recruitment, pay 1 gold to give a friendly minion +3 Health and Taunt permanently                        | Choose which body takes attacks and where to place it against cleave            |

Recall transfers the existing unit; it creates no pool copies. It rejects a full hand and consumes the power only after validation. Playing a recalled golden does not reset its already consumed Discover reward. All five heroes use typed `ability` definitions, including the original buff/income powers. The example mod hero also uses this contract; its pack version is now 2.0.0. The seven built-in opponents retain their original three-hero rotation so the environment remains a stable baseline.

Hearth advances to **rules v5** and a separate save key. Old v4 saves stay stored; importing them is rejected. There is no automatic migration. The checked-in v5 win/loss fixtures reconstruct the original accepted command sequences under current rules and retain their terminal outcomes. Blindside and Spire versions are unchanged.

## Policy information boundary

`src/games/battlegrounds/application/agent.ts` owns the observation. `src/shared/agent.ts` shares transport shapes only.

| Included                                                                    | Excluded                                                        |
| --------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Own hero, gold, health, tier, board, hand, shop and Discover choices        | Environment seed, RNG, allocation counter and raw replay        |
| Public rival names, heroes, health, tiers and placements                    | Rival private hands, shops, Discover choices and current boards |
| Next opponent's last-seen board and its round, or the public ghost snapshot | Exact shared-pool counts and future recruitment/combat outcomes |
| Last visible combat's result, damage and attack count                       | Resolver RNG and private full-state search access               |
| Rules/content pins and legal commands                                       | Workshop debug-inspector state                                  |

Frames are detached JSON data with protocol `card-workshop.agent.v1`, observation schema `hearth.observation.v1`, an accepted-command `step`, and action IDs valid only for that step. Legality is checked through native recruitment rules. The end-recruitment menu check avoids resolving a hypothetical full lobby. Regression tests compare this menu with authoritative transitions, including pending Discover and terminal phases.

This is an explicit information contract for trusted policy implementations, not a security sandbox for hostile code. Evaluators can access full state to check invariants; policies receive only detached frames. External policy processes should receive stdout from the server, not its evaluator output directory or environment seed.

## External JSON-lines protocol

Start a fresh environment from the repository root:

```sh
node scripts/hearth-agent.mjs MY-ENVIRONMENT-SEED test-results/agents/my-run
# Interactive use is also available through npm run engine:hearth.
```

The process sends one `ready` response immediately. Stdout contains JSON lines only when invoked directly with Node; diagnostics go to stderr. Each request receives one response. Optional string `id` values are echoed for correlation.

```json
{"id":"read","op":"observe"}
{"id":"definitions","op":"catalogue"}
{"id":"move","op":"act","step":0,"action":"a3"}
{"id":"done","op":"quit"}
```

`observe` returns the current frame. `catalogue` returns public hero/minion definitions and content pins. To act, choose an ID from the current frame's action list. Stale steps, unknown actions and malformed requests return errors and do not advance the environment. The server accepts requests up to 64 KiB per line and at most 10,000 accepted commands per episode, matching the replay codec. `quit` or input EOF writes the evaluator's replay and verification receipt to the separate directory. Existing output directories are rejected.

Every accepted response includes the next frame and structured `events`: resource deltas; phase/round changes; units entering, leaving, changing stats or changing positions; and combat summaries. Replays continue to contain only authoritative accepted game commands. Process termination before normal shutdown may prevent the final replay write; use the experiment runner for per-decision durable traces.

The protocol test drives an entire external process through a completed lobby, exercises invalid/stale requests and reconstructs the separate evaluator replay. No browser, model provider, account or network connection is needed.

## Policies and search

`heuristic-v1` reuses the readable recruitment heuristic with a pure board-order proposal. `scout-search-v1` uses the same recruitment choices, then compares a bounded neighborhood of board orders using the real combat resolver. Both control seat 0 against the same seven built-in sequential opponents.

The candidate includes the baseline order and current order, then single-unit relocations, capped at **24 orders**. Each order receives **16 common combat samples** from an independent, fixed policy seed: at most **384 combat simulations per positioning decision**. Search applies the real permanent end-recruitment effects to a cloned own board before combat. It maximizes mean damage dealt minus damage taken; exact ties retain the earlier candidate, starting with the baseline.

The candidate conditions on the opponent's last-seen board. It does not infer their purchases, sample hidden shops, or read the live environment RNG. Unknown boards fall back to baseline positioning. Estimates report wins/ties/losses and damage for those conditional samples; they are not live lobby win probabilities. Planned orders execute through ordinary adjacent-move commands. Accepted actions alone update policy memory.

## Reproducible experiment

```sh
npm run experiment:hearth -- development test-results/ai/my-development
npm run experiment:hearth -- evaluation test-results/ai/my-evaluation
```

The runner freezes its manifest before executing. Five development seeds and twenty separate reserved evaluation seeds rotate the five heroes; every seed/hero runs both policies. The default command budget is 2,000 per episode. Configuration is checked in at `scripts/hearth-experiment.mjs`.

Each output directory contains:

- `manifest.json`: both cohort definitions, policy configuration digest, source revision/status, SHA-256 source digests and Node runtime.
- Per-run `decisions.jsonl`: the exact public policy input, selected command/action, structured events, candidate order estimates, simulation count and measured decision time.
- Per-run `replay.json` and `receipt.json`: accepted commands, content pins, terminal outcome or retained failure/limit, compute totals and exact reconstruction result.
- `comparison.json`: matched pairs, exclusions, mean placement, candidate-better/tied/worse counts, sample standard error of paired placement differences, top-four and first-place denominators, and total policy compute.

Lower placement is better; reported improvement is **baseline placement minus candidate placement**. Missing, duplicated, incomplete, unverified or mismatched pairs are excluded explicitly. The evaluator checks finite-pool conservation after every accepted action and reconstructs every final replay. Repeated runs preserve earlier output directories.

Development results may guide revisions. Once evaluation results are inspected, those seeds are no longer unseen for subsequent tuning; a new reserved cohort is needed for a fresh claim. Matching seeds does not force matching randomness after policies take different actions. This experiment measures performance against fixed local bots from one seat; it is not head-to-head play, self-play, original-game parity or evidence of human enjoyment.

## Further improvements

1. Compare recruitment investment timing and immediate-strength choices, keeping released policies frozen.
2. Separate opponent-model error from formation-search error using labelled evaluator-only diagnostics.
3. Extend the eight-seat arena with additional opponent leagues and compute-matched search policies.
4. Apply the observation/protocol shape to Blindside and Spire while retaining game-owned mechanics.

Verification is recorded in [completion evidence](completion.md). The [initial experiment](research/experiments/2026-10-04-hearth-ai-v1.md) completed all 50 lobbies; search did not demonstrate a mean-placement improvement on the reserved cohort, so the baseline is retained.

## Eight-seat arena follow-up

[Mixed Rivals and the arena](hearth-arena.md) add per-seat controllers, complete-lobby resolution, rotating recruitment priority and explicit rival preferences. The inspector always exposes configured styles; policy observations independently hide or disclose them. Arena journals record all seats and use a separate versioned envelope, preserving Classic v5. [The arena experiment](research/experiments/2026-10-04-hearth-arena-v1.md) compares recruitment policy and disclosure across all eight seat positions with fresh reserved seeds.
