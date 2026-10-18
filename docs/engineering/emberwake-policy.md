# Emberwake policy play

**Current baseline: native7, observation3, score2, policy8. Calibration remains
unresolved.** Policies9–12 were rejected; policy12 was the final attempt and the
saved calibration goal is paused. The [canonical standard](policy-development.md)
owns shared contracts; [dated evidence](#evidence-and-current-status) owns results.

## Public knowledge

[Observation construction](../../packages/diablo2/src/agent/observation.ts) detaches:

- **Own state:** resources, equipment, inventory/stash, skills, cooldowns and derived
  stats. Observation3 includes only the current hero's skill definitions, all public
  item/monster mechanics, atlas topology and progress.
- **World:** seen terrain, visible enemies/allies/projectiles/hazards, discovered
  drops/static markers and ordinary action choices. Live entities use radius eight
  plus line of sight; this is narrower than ordinary rendering.
- **Public history:** stable first-seen instance aliases and visited/ward/boss/waypoint
  region IDs. `armySize` discloses the owned-unit count beyond visual range, but no
  unseen ally positions. Known atlas connections do not disclose unseen coordinates.
- **Withheld:** environment seed/RNG, allocation counters, unexplored geometry and
  objective positions, and other regions' live entities. This structured sensor is
  not human-equivalent perception.

Terrain stores lossless `[count, glyph]` row runs, including `?` for unknown cells.
Use `terrainRows(input.region)` to decode; never fill unseen cells. Policy memory
may retain disclosed history, never refresh it from hidden live entities.

### Commands and navigation

- Bind observation aliases to native commands only after menu membership validation.
  Respawn/developer commands are excluded. Rejections remain explicit failed attempts.
- Movement offers at most four consecutive known walkable cells on a cardinal route.
  Test the complete swept avatar rectangle against masked terrain, including fractional
  starts and native x-then-y motion. Destination-only checks or sampled centers miss
  unknown corners. Leap landings likewise require the entire footprint to be known.
- Public BFS blocks unknown terrain and chooses an offered straight prefix, stopping
  at turns. Arbitrary distant native waypoints would disclose hidden pathfinding.
  The first node uses the actual player position; later nodes may use cell centers.
- Native target-following after a visible attack is assisted game control between
  decisions, not policy lookahead. Legal menus must not probe hidden successors or
  hidden rejection conditions. Paired hidden-wall/floor states must retain equal menus.

## Difficulty and results

| Tier     | Hostile damage multiplier | Player per-impact ceiling | Life-potion recovery |
| -------- | ------------------------- | ------------------------- | -------------------- |
| Relaxed  | 0.75                      | Unlimited                 | 0 seconds            |
| Standard | 7                         | 55% of current maximum HP | 20 seconds           |
| Severe   | 12                        | 70% of current maximum HP | 60 seconds           |

Player impacts scale once after mitigation and round once, then apply
`min(damage, max(1, floor(maxHp * fraction)))` when capped. Allies retain uncapped
floating damage with the same tier multiplier. Several impacts can still kill
within one advance; the minimum-one floor can kill a one-HP character.

Health recovery owns cooldown key `@health-potion`; content IDs cannot use that
namespace. The menu excludes unavailable drinks and the live HUD shows recovery.
Mana potions, maps, content and rewards retain their existing behavior. Portal
availability and the menu use the same visible living, nonwarded enemy sensor;
an undisclosed enemy behind a wall cannot invalidate an offered portal.

### Historical environments

| Native rules | Preserved behavior                                                             |
| ------------ | ------------------------------------------------------------------------------ |
| v2           | Original Standard campaign.                                                    |
| v3           | Original distance-three portal guard, instant life potions, damage 0.75/1/1.3. |
| v4           | Damage0.75/3/6, no hit ceiling, recovery 0/20/60 seconds.                      |
| v5 / v6      | Standard damage 8 / 5 respectively, with current hit caps/recovery.            |
| v7           | Current Standard damage 7; other tiers retain v5/v6 semantics.                 |

Each has a separate save slot and exact versioned replay reconstruction. Upgrade
checks v7/v6/v5/v4/v3 in order, preserves unreadable bytes and keeps valid loaded
campaigns under their original rules. V2 remains explicitly restorable; starting v7
from an older campaign requires an explicit new journey. Sandbox remains outside
this study with its ordinary developer controls.

## Policy priorities and control

The three heroes—Barbarian, Sorceress and Necromancer—are separate setup strata.
Immediate prioritizes damage/objectives; Survival prioritizes defense/protection;
Growth prioritizes loot/upgrades/scaling. These are heuristics, not a strength order.

Current policy8 uses five-tick combat observations and ten-tick quiet travel. Public
BFS handles objectives, reachable attack positions, loot and inventory geometry;
known detours may initially increase distance. Factory-local memory preserves a
last-seen foe and blocked firing origins across sensor loss, resetting on disclosed
HP progress, corpses or region changes. Visibility alone does not guarantee a hit.

Survival's pending-recovery branch requires potion stock and an active cooldown.
It avoids offensive fallthrough when no retreat improves clearance. Its disclosed
projectile horizon is ten ticks across two ordinary decisions, including alignment,
walking/slow-speed allowances; other controls keep their five-tick geometry. Neither
predicts hidden walls, future shots or enemy motion. An offered nonmoving instant
melee/nova finisher is considered only when it kills every visible living nonwarded
foe and no disclosed hazard or hostile shot remains. It reuses native public damage
arithmetic, without private successor access.

Portal/return healing, including zero-tick refill, is lawful gameplay. Tick/location
guards must prevent stationary refill/selling loops; `portalRefills` reports those
visits and their refill side effects. Work counts declared action/entity/BFS and
public geometry candidates, omitting sorting/helper loops/recording. It is a proxy,
not CPU time or a complete instruction count. Delegating examples retain matching
version identities; changed behavior needs a new identity even after rejection.

## Outcome and score

A benchmark attempt ends at first death or victory; normal gameplay keeps respawns.
Score `emberwake-performance-2` is the ordinal vector
`[won, bosses, wards, regions, won ? executedTicks : 0]`: maximize the first four
components in order, then minimize winning ticks. Victory outranks unfinished play;
losses/timeouts receive no speed bonus. Decisions, packed command counts and requested
replay padding are not elapsed simulation time.

`progress = 10000*bosses + 100*wards + regions` is descriptive legacy reporting for
four bosses, eight wards and twenty regions. Report components, level/XP, HP and gold
separately. Act number can decrease on revisits. Final HP/mana/stocks, farmable XP and
gold are outside the rank: refill or spending can change them without better execution.
A resource objective requires new declared score semantics, not an added bonus.

Keep deaths, living budget stops and execution errors distinct, retaining every
attempt. Errors invalidate evidence; they are not scored losses. Passive rendering
rounds resources to one decimal while original policy JSON stays exact.

## Extend, record and inspect

Start from the [local TypeScript example](../../packages/diablo2/src/agent/example.ts).
It default-exports `PolicyFactory<Observation, PolicyCommand>`; each episode receives
public setup, an independent policy seed/options and fresh memory. Modules are trusted
in-process code. Shared commands, evidence and audit meanings are defined by the
[canonical workflow](policy-development.md#common-cli-game-owned-policies).

```sh
npm run engine:policy -- run --game emberwake --policy survival --setup '{"hero":"sorceress","difficulty":"standard"}'
npm run engine:policy -- record --game emberwake --policy-module packages/diablo2/src/agent/example.ts --out test-results/new-emberwake-rollout
npm run engine:policy -- audit --input test-results/new-emberwake-rollout/rollout.json.gzip --out test-results/new-emberwake-audit.json
```

Open `/?game=diablo2&review=policy` for isolated original-input review. The passive
canvas masks unknown terrain and mounts no live-save hooks, input or simulation timer.
Policy knowledge/proposal is default; evaluator state requires opt-in. Shared filters,
phase/direct navigation, before/after, playback and exact downloads remain available.

Native replay merges advances. Its cursor counts requested ticks, or one unit for a
zero-tick command, regardless of packing; actual execution can stop earlier at death.
Seeking splits packed advances and can expose several decisions at one tick. Cached
checkpoints every 128 packed commands must match independent prefix reconstruction,
including backward seeks and terminal padding. They accelerate presentation only;
original alias history and decision sampling still require the retained input.
The public `requestedTicks` limit is 100,000; exhausting it is not death or victory.

## Evaluate without hiding limitations

Freeze the complete sources/setup, objective, budgets, cohorts and contrasts before
reserved execution. Report hero/tier strata separately; repeated heroes are not extra
independent seed blocks. Unsupported paired-binary or constant-sample intervals stay
unavailable. Never relabel the full-state, respawn-tolerant verifier as a restricted
first-death policy.

Long-campaign development used 8,000 decisions, advances capped at ten ticks and a
native 100,000-requested-tick limit. Retain every original input within the shared 150 MB
encoded/decoded artifact bounds. Probe one real worker's record/audit/serialization
before a bulk cohort; a successful main-process recording proves no worker heap bound.

Historical observation1/2 and score1 artifacts retain their original identities and
bytes. Current observation3 cannot certify their original sampling. A score2 sidecar
may reconstruct an old journal with new evaluator pins; it is neither fresh policy
execution nor an original-input audit. Unavailable historical reproduction is distinct
from corruption; use the retained matching sources/bundle when available.

## Evidence and current status

| Evidence                                                                                                                                                                                                                                                | Retained conclusion                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Campaign development](../research/experiments/2026-10-16-emberwake-strength-development.md)                                                                                                                                                            | Recorded wins, navigation failures, swept-collision audit and memory measurements; local playability does not prove calibration.                                                                                                                |
| [Score assessment](../research/experiments/2026-10-16-emberwake-performance-2.md)                                                                                                                                                                       | Exploratory score2 sidecars improve discrimination, not win-rate ordering.                                                                                                                                                                      |
| [Policy7 recovery](../research/experiments/2026-10-16-emberwake-recovery-policy-7.md) / [policy8 recovery](../research/experiments/2026-10-16-emberwake-recovery-policy-8.md)                                                                           | Bounded native counterfactuals, original versus reconstructed knowledge and current public-control repairs.                                                                                                                                     |
| [Native5 adoption](../research/experiments/2026-10-16-emberwake-pressure-5.md) / [fresh confirmation](../research/experiments/2026-10-16-emberwake-strength-confirmation-5.md)                                                                          | Fresh 1,170-case confirmation failed Necromancer difficulty separation; original verdict remains negative.                                                                                                                                      |
| [Native6 relief](../research/experiments/2026-10-17-emberwake-standard-relief-6.md) / [native7 pressure](../research/experiments/2026-10-17-emberwake-standard-pressure-7.md)                                                                           | Negative 198-case development screens. Native7/policy8 passed six tier checks but failed Barbarian/Necromancer Standard policy separation.                                                                                                      |
| [Policy9](../research/experiments/2026-10-17-emberwake-policy-9-development.md) / [policy10](../research/experiments/2026-10-17-emberwake-policy-10-development.md) / [policy11](../research/experiments/2026-10-17-emberwake-policy-11-development.md) | Rejected candidates; keep accepted policy8, consumed identities, policy sources/bundles and rejection lessons. Bulk recordings follow the iteration retention rule.                                                                             |
| [Policy12 final closeout](../research/experiments/2026-10-17-emberwake-policy-12-development.md)                                                                                                                                                        | 125 wins/67 deaths/6 living stops/198, zero errors; 8/9 contrasts pass. Necromancer Standard–Severe fails; Barbarian Standard and Sorceress Severe completion regress versus policy8. Rejected after independent audit; exact policy8 restored. |

All original thresholds, failures, bundles and replay meanings remain intact. Current
policy8 Standard Survival wins were 9/10, 8/10, 9/10 in consumed development; this is not
fresh confirmation. The selected policy12 travel diagnosis establishes no causal pet
bug. Calibration remains unresolved; the final-attempt limit rules out new candidates,
rebalances, seed expansion or confirmation. The victory-primary concept was not run.
