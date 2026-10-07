# Last Hearth arena and Mixed Rivals

Last Hearth has a separate eight-seat policy arena. Current Classic and Mixed Rivals include [tavern spells](tavern-spells.md), using Hearth rules **v6** and arena envelope **v2**. Old v5/v1 save keys remain untouched. The original experiment described below explicitly retains the v5/v1 codecs and frozen controllers. Replaying an arena journal never invokes policy code.

## Play and inspect

Choose **Mixed Rivals** next to Classic. Select any of the five heroes, then recruit normally. The lobby displays each rival's policy style: two Tempo, two Economy, two Composition and one Classic. Assignment and rival heroes are shuffled using separate seeded setup streams. The original Classic run and the Mixed Rivals run autosave separately.

- **Tempo:** fill the board, value immediate combat strength and avoid rerolling away the last buying gold.
- **Economy:** accept earlier tavern investments when health allows.
- **Composition:** increase the value of matching tribes and scaling engines.
- **Classic:** the original deterministic value/upgrade heuristic, with its existing formation order.

These labels describe preferences, not proven strength or guarantees. All rivals follow the same legal actions and finite shared supply. Open Workshop tools for the configuration inspector. Export includes the setup and every rival action. Importing a journal prefix resumes unfinished rival turns through new, explicitly recorded commands. Custom practice scenarios remain available in Classic; Mixed Rivals has its own configuration inspector.

## Timing and rules

At round `r`, priority begins at `(firstSeat + r - 1) % 8`, scanning forward and skipping eliminated seats. All opening shops reserve supply in that order, then each seat completes its whole recruitment turn before the next acts. This is a sequential pool-contention experiment, not simultaneous recruitment. Pairings remain seeded and are determined before recruiting.

The final seat's `endRecruit` resolves all combats and eliminations. The shared resolver retains existing combat timing, fatigue and tie-breaking rules. The arena continues until every seat has a placement, including after seat 0 is eliminated. Mixed Rivals automatically finishes those remaining rounds and preserves seat 0's last combat for playback. Headless evaluators can control any seat.

Every turn allows 120 non-ending actions, plus a required pending Discover selection and `endRecruit`. Full journals are capped at 10,000 commands and 2 MB on import; experiment episodes stop at a stricter 6,000 commands. A budget stop is retained as a limited episode, never counted as a completed result.

## Policy and inspection boundaries

`application/arena.ts` exposes two distinct surfaces:

| Surface                     | Contents                                                                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `arenaFrame(session, seat)` | Detached own state, round-opening public lobby, previous-round scouting, own combat summary, turn counters/order, legal actions for the active seat |
| `inspectArena(state)`       | Evaluator configuration, complete seat-to-style mapping and style descriptions, regardless of policy visibility                                     |

Policy frames exclude environment seed/RNG, pool counts, current rival boards, hands, shops and Discover options. Opponents' same-round upgrades stay out of the public snapshot until the round resolves. A non-active seat gets no actions. Returned data is detached from authoritative state.

`config.visibility` is `hidden` or `disclosed`. `visibilitySeat: null` applies it to all policies; a seat ID applies it only to that seat and keeps all others hidden. Hidden frames omit the style property entirely. The inspector remains available in both cases. Neither the seed nor a configuration digest that identifies the hidden mapping appears in a policy frame.

The tempo policy uses disclosed Tempo opponents to raise its health reserve for investment from 18 to 25 HP. Otherwise it uses the neutral reserve. Classic ignores labels and serves as a disclosure negative control. This is a small explicit policy hypothesis to test, not a promise that disclosure helps.

## External controller

```sh
node scripts/hearth-arena-agent.mjs PRIVATE-ENV-SEED /tmp/new-arena-run 6 hidden
```

The process binds one connection to the selected seat (0–7). Evaluator configuration is provided at launch. Its seven rivals recruit automatically. The connection accepts JSON-lines `observe`, `catalogue`, `act` and `quit` requests:

```json
{"op":"observe"}
{"op":"act","step":42,"action":"a0"}
{"op":"quit"}
```

Always use the returned step and action IDs. A successful action may advance through other seats and a round boundary, so step numbers can jump. Responses include structured deltas across that transition. Stale steps, unknown actions, different-seat requests and inspector operations are rejected. Stdout contains policy-safe data; the separate evaluator directory receives the complete replay and verification receipt. The catalogue lists all available styles but does not expose their hidden assignment.

Styles in the configuration declare the preset controllers; a human or external controller may submit any legal command without following that preset. The in-process evaluator can independently assign a controller to every seat. `decideRecruitment` consumes only a detached arena frame and its own style. `transitionArena` only applies commands; it does not know how to run a controller.

## Frozen v5/v1 experiments

```sh
node scripts/hearth-arena-experiment.mjs development test-results/ai/new-arena-development
node scripts/hearth-arena-experiment.mjs evaluation test-results/ai/new-arena-evaluation
```

The plan reserves distinct v1-arena seed namespaces: **2 development blocks / 64 lobbies** and **8 evaluation blocks / 256 lobbies**. Each block rotates the focal hero and a fixed set of seven rivals through all eight seats, then compares baseline and tempo with hidden and disclosed labels. Opponents always have hidden labels. The hero varies across seed blocks; the eight evaluation blocks do not balance all five heroes equally.

**Primary:** mean focal placement, lower is better. **Secondary:** first-place count, top-four count and survival rounds. Report uncertainty across seed-block means; eight seat rotations sharing a seed are not eight independent observations. A whole block is excluded if any condition/seat is missing, duplicated, incomplete, failed, unverified or mismatched. Baseline disclosure must leave all gameplay commands unchanged.

Before play, the script writes source revision, dirty status, SHA-256 source hashes, runtime, configuration digest and budgets. Each episode retains its full journal, receipt, decisions/reasons and the SHA-256 of every exact policy input frame. Frames can be reconstructed from replay prefixes; the compact trace does not store private evaluator state or duplicate entire observations. Replays are checked against exact final state and supply accounting is checked after every accepted recruitment/round command. Existing output directories are rejected. Audit saved episodes with:

```sh
node scripts/hearth-arena-audit.mjs test-results/ai/new-arena-evaluation
```

The audit reconstructs every policy input and decision, matches their recorded hashes and commands, and verifies final placements. It writes a separate `audit.json` without replacing experiment files.

Different actions consume different parts of the seeded RNG stream. These experiments measure this local rival population under a specific recruitment schedule; they do not establish general competitive strength or human enjoyment. Evaluation outcomes do not automatically promote a policy or change Classic.

## Source map

- `domain/arena.ts`: setup, turn schedule, budgets and command validation.
- `domain/game.ts`: shared combat resolver; Classic still runs its original bot wrapper.
- `application/arena.ts`: replay codec, per-seat observations/actions, inspector.
- `application/arena-controller.ts`: journaled automatic rivals.
- `ai/recruitment-policy.ts`: readable stateless recruitment policies.
- `ui/useMixedRivals.ts`: UI controller adapter; no authoritative rules in presentation.
- `src/engines/hearth-arena-experiment.ts`: complete-lobby execution and blocked comparisons.
- `scripts/hearth-arena-agent.mjs`, `scripts/hearth-arena-experiment.mjs`: process and experiment entry points.

## Recruitment v2 diagnostics

[Recruitment v2](../research/hearth-recruitment-v2.md) adds an independent upgrade/spending factorial and a standalone replay decision explorer. It preserves every published v1 policy and the arena rules. The [reserved result](../research/experiments/2026-10-04-hearth-recruitment-v2.md) improves Tempo through earlier upgrades but retains Classic as the default. Experimental v2 controller IDs are bound in receipts/traces; importing a journal prefix into the game continues with its recorded v1 style preset.
