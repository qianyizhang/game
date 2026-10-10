# Last Hearth arena and Mixed Rivals

An eight-seat policy arena supporting full-lobby competition. Current modes include [tavern spells](tavern-spells.md) (Hearth v6 / arena v2).

## Play and inspect

Select **Mixed Rivals** beside Classic. Rivals adopt distinct recruitment heuristics:

- **Tempo**: Maximizes immediate board strength; avoids aggressive rerolls.
- **Economy**: Prioritizes tavern tier upgrades when health allows.
- **Composition**: Focuses on tribe synergies and scaling engines.
- **Classic**: Baseline valuation and upgrade heuristic.

Open Workshop Tools for the full configuration inspector. Mixed Rivals journals record actions for all eight seats and resume from saved prefixes.

## Scheduling and rules

- At round `r`, priority starts at seat `(firstSeat + r - 1) % 8` and rotates sequentially.
- Opening shops reserve pool supply in priority order; each seat finishes recruiting before the next starts.
- After all seats call `endRecruit`, the engine resolves combats, hero damage, fatigue, and eliminations.
- Turn budget: 120 actions per seat per round. Full journals capped at 10,000 commands (6,000 in experiments).

## Observation and policy boundaries

`application/arena.ts` exposes two interfaces:

- `arenaFrame(session, seat)`: Detached observation frame containing own state, public lobby summary, previous-round scouting, and legal actions. Excludes private rival boards/shops/spells and PRNG state.
- `inspectArena(state)`: Complete evaluator view, including hidden seat-to-style mappings.

Visibility options: `hidden` (omits style labels) or `disclosed` (exposes rival styles to the policy).

## External controller protocol

```sh
node packages/workshop-tools/hearth/arena-agent.ts PRIVATE-ENV-SEED /tmp/new-arena-run 6 hidden
```

Connects to a specific seat (0–7) via JSON-lines protocol (`observe`, `catalogue`, `act`, `quit`). Step numbers and action IDs correlate with emitted frames.

## Experiments and verification

```sh
# Run experiments
node packages/workshop-tools/hearth/arena-experiment.ts development test-results/ai/new-arena-development
node packages/workshop-tools/hearth/arena-experiment.ts evaluation test-results/ai/new-arena-evaluation

# Audit saved run
node packages/workshop-tools/hearth/arena-audit.ts test-results/ai/new-arena-evaluation
```

Metrics track mean placement across seed blocks. See [recruitment study](../research/experiments/2026-10-04-hearth-recruitment-v2.md) and [v2 diagnostics](../research/hearth-recruitment-v2.md).

## Source map

- `domain/arena.ts`: Lobby setup, scheduling, and command validation.
- `domain/game.ts`: Shared combat resolution.
- `application/arena.ts`: Codec, frame observation, and evaluator inspection.
- `application/arena-controller.ts`: Journaled automated rivals.
- `ai/recruitment-policy.ts`: Stateless rival policies.
- `packages/workshop-tools/hearth/arena-agent.ts`: External agent process entry point.
