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
Lifecycle verification uses the restricted Survival policy on explicit Relaxed
expeditions; fixed Standard/Severe strength belongs to the separate calibration
matrix. New mechanics must enter public forecasts explicitly and gain behavior
comparisons where relevant. Observation v2 adds the effective public combat profile;
native and forecast hit mitigation use the same small `incomingHit` rule helper.
Room descriptions use the effective healing value without rewriting historical content.

## Tiers, priorities and score

Rules **v3** rebalance all three tiers. Generator `rooms-1`, nine-room victory,
ordinary actions, announced attack cells and seeded stream names stay fixed.
The current ladder changes encounter pressure and defensive resources together:

| Tier     | Starting/max HP | Extra enemies per ordinary room | Enemy HP bonus | Hit damage bonus | Brace per hit | Healing room | King's guards |
| -------- | --------------: | ------------------------------: | -------------: | ---------------: | ------------: | -----------: | ------------: |
| Relaxed  |              48 |                               0 |              0 |                0 |             3 |            8 |             1 |
| Standard |              36 |                               2 |              4 |                1 |             2 |            6 |             2 |
| Severe   |              28 |                               2 |              4 |                2 |             1 |            4 |             3 |

Base encounters have two enemies, or three in permanent-attack upgrade rooms.
Guards accompany the King instead of leaving a permanently interruptible lone boss.
The eight-threat bonus adds one more damage independently. Every enemy's final hit
damage and threatened cells are announced before a turn. No difficulty label changes
policy logic or grants a hidden advantage.

Historical v1 journals retain their original state shape and Standard semantics.
Historical v2 journals retain their own **48/36/28** HP-only ladder. Both dispatch
through their original native arithmetic, generation, continuation and replay-prefix
meaning. Explicit v1/v2 restore/export controls preserve their separate storage slots;
new v3 saves use a third slot. The selected setup applies only to a new expedition.
The current run displays its effective tier, historical version and combat resources.

Immediate favors current damage, interrupts and direct progress. Survival prioritizes
announced damage avoidance, healing and defensive relics. Growth favors permanent
attack and relic combinations, accepting different room risk. Public-floor BFS
handles atlas routes and tactical approach around obstacles. Persistent stationary
bracing can stall against ranged enemies; Manhattan distance can oscillate around
walls. Use announced-position benefit and actual public walkable routes instead.
Policy v2 also remembers previously observed combat positions and enemy life. A bounded
revisit penalty discourages repeated safe movement without progress for every priority;
lethal outcomes retain their explicit rejection value. This history contains no seed,
inactive enemies or unobserved future intent. Effective room healing informs draft values.

Score **`cartographer-performance-2`** is the ordered numeric vector
`[victory, rooms cleared, victorious HP / max HP, victorious accepted commands]`.
Maximize the first three components and minimize the last. Compare components in
order; do not sum them or treat them as a cross-game scale. Rooms include the entrance.
The final two components are zero for every nonvictory, including living budget stops;
failures cannot earn resource/efficiency bonuses by dying quickly or stalling.
Accepted commands include zero-turn draft/relic/cancel actions, so cancel/redraft
loops cannot improve efficiency. Rank victory before progress, then healthy victories,
then fewer actions among otherwise equal victories. Report attack, threat, relics
and native turns separately; none earns extra score by repeated acquisition/damage.

This is a declared health-first objective. A speed-first objective can rank different
policies higher. The [post hoc score assessment](../research/experiments/2026-10-16-cartographer-performance-2.md)
keeps those tradeoffs explicit. Original `cartographer-progress-1` studies and native
replays remain unchanged; rescored sidecars are not fresh policy execution or reserved
confirmation. Work counts menu,
relic/draft/forecast/frontier candidates and expanded BFS nodes; sorting, helper
loops and recording are omitted. This is a declared proxy, not elapsed compute time.

## Extend, record and review

```sh
npm run engine:policy -- run --game cartographer --policy survival --setup '{"difficulty":"standard"}'
npm run engine:policy -- record --game cartographer --policy growth --out test-results/new-cartographer-rollout
npm run engine:policy -- run --game cartographer --policy-module src/games/cartographer/agent/example.ts
npm run engine:policy -- audit --input test-results/new-cartographer-rollout/rollout.json.gzip --out test-results/new-cartographer-audit.json
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

The historical adoption study used ten development and twenty reserved independent
seed blocks crossed with three tiers and priorities: **90/180 attempted episodes**.
Current v3 confirmation uses the separate prospective protocol below. Freeze sources/ranking/budgets first;
report per-tier paired results without counting repeated tiers as new independent
seeds. Preserve timeouts/errors and uncertainty. Wilson intervals retain uncertainty
at all/zero wins; constant-sample and paired-binomial intervals are unavailable where
the analyzer cannot justify them. Do not tune on reserved outcomes.

The [strength development report](../research/experiments/2026-10-16-cartographer-strength-3.md)
retains the balance and cycle investigations and candidate selection. Its reused
development cohorts remain separate from the fresh confirmation below.

The [initial adoption study](../research/experiments/2026-10-16-cartographer-policy.md)
has saturated wins/progress. It demonstrates playable policies with distinct resource
and turn behavior, not a total strength ordering or a calibrated win-rate difficulty
ladder. Structured exact intentions and public arithmetic do not establish human
equivalent perception or enjoyment.

The [fresh 900-case confirmation](../research/experiments/2026-10-16-cartographer-strength-confirmation-3.md)
passed the five predeclared statistical/playability criteria: Survival wins are
100/100 Relaxed, 83/100 Standard and 30/100 Severe. Fifty-one living budget stops
remain nonwins across all policies. Independent raw/native/statistical review passed. The
confirmation does not establish human difficulty or enjoyment.

## Prevent repeated development mistakes

- **HP alone can leave a saturated ladder:** exact warnings plus shove cancellation
  made the former lone King reliably safe. Verify the whole encounter, including
  simultaneous threats and durability, before claiming difficulty from HP labels.
- **Safe movement can oscillate:** inspect unchanged enemy life and repeated positions
  in original inputs. The v2 policies retain public history to escape two-position
  cycles; budget stops remain nonwins and are reported separately from deaths.
- **Aliases are not native IDs:** policy target aliases bind through the adapter.
  Historical continuation witnesses take commands from the accepted native journal;
  dispatching an unbound proposal can attack a different enemy or reject silently.
- **Separate completion coverage from calibration:** use an explicit Relaxed setup
  and the actual public policy for the complete nine-room/relic/replay journey. A
  versioned Standard rebalance can invalidate an old verification heuristic; retain
  victory assertions and repair the journey instead of weakening the game or
  accepting a loss. Standard/Severe strength still requires the frozen matrix.
- **Observe browser evidence directly:** comparing two native evaluator successors
  inside a browser journey checks evaluator consistency. Browser acceptance reads
  its actual saved replay and reloads the ending; that is the stated evidence, not
  a claim that every intermediate browser state was independently inspected.
- **Retain each prototype environment:** unreleased v3 development candidates
  changed balance under the same rules label. Reconstruct a historical development
  journal with its exact frozen native bundle, then apply the new score as a sidecar;
  a matching rules label alone does not identify its original resolver.
- **Freeze before reserved play:** keep negative development runs, fix source versions
  and a reference strategy, then use a new reserved namespace. Changing balance or a
  policy after reserved inspection requires a new prospective study and fresh seeds.
