# Last Hearth policy play

Current policy development uses spell-enabled Mixed Rivals: all eight seats' accepted
commands are journaled, focal policies receive an opaque public view, and original
inputs/proposals link to native replay spans. Classic remains the ordinary default.
The [canonical standard](policy-development.md) owns cross-game principles; the
[existing agent transports](hearth-agents.md) retain their published schemas.

## Public view and opaque identity

`src/games/battlegrounds/agent/observation.ts` owns the adoption input. It includes
own hero/resources/board/hand/shop/Discover/spells, round-opening public lobby, public
recruitment order and own action/refresh counts, last-seen opponent/ghost board and
last combat summary, plus the current legal recruitment menu. Rival styles use a fixed
hidden visibility condition for this study. Current rival hands/shops/boards, exact
supply, environment seed/RNG and internal next-ID counter stay evaluator-only.

The adoption view also removes two side channels in the existing transport:

- **Global `step`:** accepted-command count can reveal earlier rivals' hidden activity.
  Keep it for evaluator replay/transport binding, outside the policy input.
- **Allocation IDs:** `unit-N` / `spell-N` gaps reveal hidden global allocations. Use
  stable first-seen opaque aliases, assigned only from visible entities in visible
  collection order. Translate IDs/targets consistently in public menus; native bindings
  remain evaluator-only. Refreshing after hidden allocations cannot change the alias view.

Original transport schemas and frozen studies remain unchanged. Known hero/definition
IDs and seat/round numbers are public mechanics; opaque instance aliases only identify
entities already observed. Alias memory resets each episode and persists over its
permitted history. Received data cannot mutate evaluator state or another frame.

The native legal-menu helper checks commands on copied rules state. Some copied effects
sample refresh/Discover outcomes, but current acceptance depends only on visible resources,
capacity, targets and timing; no sampled successor reaches policy code. Controlled tests
vary hidden RNG/supply with an affordable refresh and golden reward play. Future content
that rejects commands based on a hidden sampled outcome would invalidate this seam and
must gain a public precondition or a separately declared information condition.

Policies choose an aliased ordinary recruitment command from the current menu. The
adapter validates membership, ignoring property insertion order, binds native IDs and
applies the ordinary seat command. Setup/hero choice, round advancement and other seats'
actions belong to the evaluator. Foreign/stale aliases reject atomically.

## Difficulty, policies and result

| Tier     | Focal starting HP | Every rival                  |
| -------- | ----------------- | ---------------------------- |
| Relaxed  | 52                | 40 HP; existing Mixed Rivals |
| Standard | 40                | 40 HP; existing Mixed Rivals |
| Severe   | 28                | 40 HP; existing Mixed Rivals |

Players choose before hero selection. These are starting-health handicaps, not ranked
names for rival styles. They add no RNG consumption; Standard keeps existing native
resources and rival algorithms. Gameplay uses arena envelope v3 over BG rules/content
v6. Previous v2 journals retain their original environment for import, seeking,
continuation and practice. The old v2 save slot remains unchanged and can be explicitly
restored. Explicit v1/BG-v5 research paths remain available; current v3 UI accepts bounded
v2 history without broadening its historical v1 decoder contract.

All five heroes—Forgekeeper, Quartermaster, Wildspeaker, Archivist and Oathkeeper—are
fixed by evaluator setup before the first actual focal recruitment decision. Seat 0 is
focal; native recruitment priority still rotates each round. Existing mixed rival styles
and spell-aware automatic controllers are unchanged.

| Strategy  | Implemented priorities                                                       |
| --------- | ---------------------------------------------------------------------------- |
| Immediate | Current attack/board value, affordable replacements and tempo.               |
| Survival  | Health/shield value, stronger survival reserves and conservative investment. |
| Growth    | Earlier tiers, scaling engines and tribe/synergy investment.                 |

These are deterministic versioned heuristics, not a claimed total strength order. Work
counts declared visible-unit valuations and legal-command estimates, omitting sort/helper
loops and recording. It is not elapsed compute time. Diagnostics explain heuristic
choices; they do not prove causal performance effects.

Primary objective is **lower final placement**; first-place/top-four rates and survival
rounds are secondary. The adapter exposes `progress = 8 - placement`, seats outlasted,
so mean progress differences are the negative of mean placement differences. Report
native placement, HP, tier, gold and rounds separately. Even after focal elimination,
finish the journaled lobby until all eight exact placements exist. Timeout/error cases
remain attempted cases with explicit incomplete-result status.

## Run and extend

```sh
npm run engine:policy -- run --game hearth --policy survival --setup '{"hero":"archivist","difficulty":"standard"}'
npm run engine:policy -- record --game hearth --policy growth --out test-results/new-hearth-rollout
npm run engine:policy -- run --game hearth --policy-module src/games/battlegrounds/agent/example.ts
npm run engine:policy -- audit --input test-results/new-hearth-rollout/rollout.json --out test-results/new-hearth-audit.json
```

A local TS module default-exports `PolicyFactory<Observation, PolicyCommand>`. Factory
configuration contains public hero/difficulty, independent policy seed and explicit
JSON options. A fresh closure owns per-episode memory. `agent/example.ts` demonstrates
extension without editing rules, public observation or the episode loop; it is not a
fourth strength baseline. Modules are trusted in-process code. No hostile isolation or
human-equivalent perception claim is made.

Recording requires a fresh directory and retains original rollout/replay/audit/manifest
and compiled bundle. Every policy input is copied before invocation. Original output,
work/diagnostics/errors, native accepted-command span, results and source/tool/runtime
identities are retained. Source drift blocks a frozen study's successful closeout.

## Replay spans without rerunning rivals

One focal proposal can span its own accepted command, many rival commands, combat and
round advancement. `before`/`after` refer to global native journal cursors, not policy
decision numbers. Ordinary execution invokes fixed rivals; audit reconstruction uses
the game-owned `replayDecision` interface instead:

1. Bind the focal proposal to its first recorded native command.
2. Apply the recorded all-actor span through native rules, without invoking any policy.
3. Require the exact next focal decision or final lobby result; reject truncation and
   extra focal actions concealed inside a span.
4. Rebuild opaque aliases at the actual observed decision boundaries.

Delivered replay decoding and final metrics are independently checked. Policy
reproduction runs only on retained original inputs, outside authoritative transitions.
A regression disables fresh execution and rival controllers while replay/input audit
still passes. An intentional RNG leak yields legal replay but failed input audit.

## Review and evaluate

Open `/?game=hearth&review=policy`, use a same-site manifest link or load several files.
The isolated route never mounts live game save hooks. Shared filters/condition groups,
first/previous/next/last/numbered links, round markers, play/speed and before/after
controls connect the original decision to its full native span. The passive board uses
the reconstructed public view, with original knowledge/proposal JSON authoritative.
Full evaluator state is explicit. Exact original downloads remain available independently
of playback; current audits and unsupported versions are labeled honestly.

```sh
npm run engine:policy -- benchmark --game hearth --split development --pool 4 --out test-results/new-hearth-dev
npm run engine:policy -- benchmark --game hearth --split evaluation --pool 4 --out test-results/new-hearth-evaluation
```

Ten development seed blocks × five heroes × three tiers × three policies produce
450 attempts; twenty fresh reserved blocks produce 900. Freeze setup/policy/ranking/source
identities in the protocol before execution. Each hero/tier is reported separately over
independent paired seeds; do not count correlated hero repetitions as extra seed blocks.
Four independent workers share no episode state/RNG and preserve exact serial artifact
bytes. Worker failure aborts the incomplete study, retaining completed evidence.

Use approximate paired progress/placement uncertainty and Wilson rate intervals; binary
paired intervals and constant-sample variance intervals remain explicitly unavailable.
No multiple-comparison adjustment or human difficulty claim is implied. Negative results,
errors/timeouts and uncertain separation stay visible. Never tune on reserved cases.
