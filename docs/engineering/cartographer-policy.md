# Dungeon Cartographer policy play

Cartographer exposes a detached public position, ordinary action menu and seedless
announced-turn forecasts. Its three local policies use the same native rules and
record original knowledge for replay inspection. The [canonical guide](policy-development.md)
owns shared development and evidence principles.

## Knowledge and ordinary actions

`src/games/cartographer/agent/observation.ts` owns the boundary. All previously
placed rooms, their terrain, known atlas frontiers, player resources/relics and the
active room's living enemies and announced intentions are public. Draft offers
appear only during a draft; relic offers only during relic selection. Environment
seed, future named-stream outcomes and inactive rooms' enemy arrays stay private.
Instance aliases are stable over observed history and reset per episode.

The public template/monster/relic catalog is a permitted model of known mechanics.
Compatibility checks against already placed geometry may identify buildable frontiers;
they cannot sample future room offers. A legal menu uses public preconditions and
validates the selected ordinary command at the authoritative boundary. Stale IDs
and foreign commands reject atomically.

Forecasts apply only visible announced-turn consequences: player movement, strike,
shove/water/wall effects, flare/focus, kill/interrupt cancellation, ordered enemy
intentions, shell/brace mitigation, room healing and victory. They do not invoke
authoritative `applyCommand` or generate future encounters, relics or intentions.
The older full-state simulation policy remains a rules verifier, not fair-policy
evidence. New mechanics must enter public forecasts explicitly and gain behavior
comparisons where relevant.

## Tiers, priorities and score

Rules v2 set starting/max HP to **48/36/28** for Relaxed/Standard/Severe. Standard
preserves v1 arithmetic and seeded generation. Generator `rooms-1` is unchanged.
Historical v1 journals retain their original state shape and Standard semantics,
including continuation; the old slot remains available through explicit restore
and export. New v2 saves have a separate slot. Setup drafts affect a new expedition;
the current expedition's effective tier is displayed independently.

Immediate favors current damage, interrupts and direct progress. Survival prioritizes
announced damage avoidance, healing and defensive relics. Growth favors permanent
attack and relic combinations, accepting different room risk. Public-floor BFS
handles atlas routes and tactical approach around obstacles. Persistent stationary
bracing can stall against ranged enemies; Manhattan distance can oscillate around
walls. Use announced-position benefit and actual public walkable routes instead.

Rank victory, then rooms cleared **including the entrance**, then remaining HP;
turns are secondary. Report attack, threat and relics separately. Work counts menu,
relic/draft/forecast/frontier candidates and expanded BFS nodes; sorting, helper
loops and recording are omitted. This is a declared proxy, not elapsed compute time.

## Extend, record and review

```sh
npm run engine:policy -- run --game cartographer --policy survival --setup '{"difficulty":"standard"}'
npm run engine:policy -- record --game cartographer --policy growth --out test-results/new-cartographer-rollout
npm run engine:policy -- run --game cartographer --policy-module src/games/cartographer/agent/example.ts
npm run engine:policy -- audit --input test-results/new-cartographer-rollout/rollout.json --out test-results/new-cartographer-audit.json
```

Local modules default-export `PolicyFactory<Observation, PolicyCommand>`; factory
configuration contains public setup, independent policy seed and explicit JSON options.
Each episode gets fresh memory. Modules are trusted in-process code. Recording retains
exact detached original inputs, output/work/diagnostics/errors, native accepted-command
cursors, final results, audit and source/tool/runtime identities.

Open `/?game=cartographer&review=policy`. The passive native-style tactical board shows
public intentions, placed-room atlas and revealed choices, without mounting the live
app's save hooks or keyboard commands. Shared navigation links original knowledge and
proposal to before/after state, phase/turn/direct links, playback, multi-file filtering
and exact downloads. Full evaluator state requires opt-in. Replay seeks and input
reconstruction do not call the policy; reproduction separately uses original inputs.
Turns and accepted-command cursors differ because draft/relic choices are zero-turn.

## Evidence and limits

Ten development and twenty reserved independent seed blocks cross three tiers and
three priorities: **90/180 attempted episodes**. Freeze sources/ranking/budgets first;
report per-tier paired results without counting repeated tiers as new independent
seeds. Preserve timeouts/errors and uncertainty. Wilson intervals retain uncertainty
at all/zero wins; constant-sample and paired-binomial intervals are unavailable where
the analyzer cannot justify them. Do not tune on reserved outcomes.

The [initial adoption study](../research/experiments/2026-10-16-cartographer-policy.md)
has saturated wins/progress. It demonstrates playable policies with distinct resource
and turn behavior, not a total strength ordering or a calibrated win-rate difficulty
ladder. Structured exact intentions and public arithmetic do not establish human
equivalent perception or enjoyment.
