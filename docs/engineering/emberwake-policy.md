# Emberwake policy play

Emberwake policies play the base campaign through ordinary commands, ending on the
first death or victory. Normal gameplay retains respawns. The [canonical standard](policy-development.md)
owns shared policy, evidence and review principles; this page owns Emberwake's sensor,
control and result semantics.

## Public knowledge

`packages/diablo2/src/agent/observation.ts` provides a detached structured observation:
own resources, equipment/inventory/stash, learned skills/cooldowns and derived stats;
current region and seen terrain; visible enemies and conservative active effects;
discovered static markers; public atlas topology/progress; public definitions without
region geometry; and an ordinary action menu. Environment seed, RNG, allocation
counters, unexplored tiles/objective positions and other regions' live entities remain
private. Instance IDs use stable first-seen aliases; hidden allocations cannot change
the public numbering.

Terrain is seen-only. Live enemies use radius eight plus line of sight. Allies,
projectiles and hazards use that same conservative sensor, narrower than ordinary
canvas rendering. Drops and static markers use discovered cells. The native atlas
already discloses region names/connections, chapter ward/boss regions and dungeon
topology; this does not disclose unseen coordinates. This is a declared structured
sensor, not a claim of human-equivalent perception. `armySize` is an explicit
structured owned-unit count beyond the visual sensor; unseen allies' positions
remain private. This count supports public summon-capacity checks.

Actions bind aliases to native commands after membership validation. Respawn and
developer commands are excluded. Movement targets one adjacent known walkable cell;
policy BFS treats unknown cells as blocked. Sending a distant waypoint to native
full-map pathfinding would silently grant navigation knowledge. Ordinary native
target-following after a selected visible attack is assisted game control between
decisions; it is not policy lookahead. Public menus must not probe hidden sampled
successors or hidden rejection conditions. A native rejection stays an explicit
failed attempt and original evidence.

Collision checks need the same knowledge boundary: knowing a leap's destination
cell does not imply knowing every neighboring cell touched by the avatar footprint.
Require the entire footprint to be known before offering the landing. A paired-state
regression varies an undisclosed neighboring tile while keeping public fields equal;
the action menu must remain equal too.

## Difficulty and results

Campaign rules v3 add Relaxed/Standard/Severe incoming hostile damage multipliers
**0.75/1/1.3**. Standard retains existing arithmetic, map/RNG and rewards. Old rules-v2
replays retain their original Standard meaning and can be explicitly restored from
their old save slot. New campaigns use a separate v3 save. Sandbox keeps its existing
rules and ordinary developer controls; it is outside this fair campaign study.

The three priorities are Immediate (damage/direct objectives), Survival (defense,
earlier protection and safer positioning), and Growth (loot, upgrades and scaling).
These are versioned heuristics with fresh factory memory, not a total strength order.
All three heroes—Barbarian, Sorceress and Necromancer—are separate setup strata.
Work is self-reported heuristic action/entity/BFS accounting, excluding sorting,
helper loops and recording. It is neither CPU time nor a complete operation count.

Rank victory, then bosses defeated, wards lit and distinct regions visited. Numeric
`progress = 10000*bosses + 100*wards + regions` preserves this ordering for the base
campaign's four bosses, eight wards and twenty regions. Report these components,
level/XP, HP and actual executed ticks separately. Act number alone is unsuitable
because travel can revisit an earlier chapter. Timeouts/errors remain attempted cases.

Native portal/return healing is ordinary gameplay, including its zero-tick refill.
It is permitted and reported rather than mislabeled cheating. A separate decision
budget bounds zero-tick commands; policy refill logic must avoid stationary loops.
Use native attack reach to approach an out-of-range visible foe through known
cells. Loot collection must check public inventory geometry rather than item count,
or an uncollectible drop can cause endless collection advances.

## Extend, record and inspect

```sh
npm run engine:policy -- run --game emberwake --policy survival --setup '{"hero":"sorceress","difficulty":"standard"}'
npm run engine:policy -- record --game emberwake --policy growth --out test-results/new-emberwake-rollout
npm run engine:policy -- run --game emberwake --policy-module packages/diablo2/src/agent/example.ts
npm run engine:policy -- audit --input test-results/new-emberwake-rollout/rollout.json --out test-results/new-emberwake-audit.json
```

A local TS module default-exports the game-typed `PolicyFactory<Observation, PolicyCommand>`.
It receives public setup, independent policy seed and explicit JSON options, with
fresh memory each episode. Code runs in-process and is trusted. Recording retains
the original detached input before invocation, output/work/diagnostics/errors, native
replay, result, audits and source/tool/runtime pins. A changed source graph cannot
successfully close a frozen study.

Native replay merges adjacent advances. Its navigation cursor counts requested
advance ticks, or one unit for a zero-tick command, independent of packing. Actual
executed ticks are separate: death can stop a requested 50-tick advance after one
tick. Remaining requested units are replay syntax, not elapsed simulation time.
The public own-history `requestedTicks` and its 100,000 limit prevent recording
native histories that the importer would reject. Advance candidates exclude an
overflow; exhausting this resource is not death or victory.
Seeking can split a packed advance and inspect multiple decisions at the same tick.
Native replay alone cannot recover original alias history or decision sampling;
the retained original input is authoritative. Audit reconstructs original proposals
and input history without rerunning policy code.

The passive viewer caches native checkpoints every 128 packed commands. It validates
the complete campaign replay, preserves the sandbox rejection and checks replay bytes
before reusing an index. Split advances, backward seeks and terminal padding must
match independent prefix reconstruction. Checkpoints accelerate presentation only;
they cannot recover or replace original policy knowledge.

Open `/?game=diablo2&review=policy` for isolated rollout review. Original knowledge
and proposal are the default, with before/after, direct/phase navigation, playback,
multi-file filters and exact downloads. Evaluator state requires explicit opt-in.
The passive native canvas further masks unknown terrain: ordinary rendering's dim
adjacent cells would otherwise reveal more than the declared sensor. No live game
save hooks, input or simulation timer mount on this route.

## Evaluate without hiding limitations

Use ten development and twenty disjoint reserved seed blocks, crossing three heroes,
three tiers and three priorities (270/540 attempted episodes). Freeze sources/setup,
ranking and budget before reserved evaluation. Report each hero/tier separately with
paired seed uncertainty and counterexamples; do not count hero repetitions as extra
independent seeds. Paired binary and constant-sample intervals remain explicitly
unavailable where the analyzer cannot justify uncertainty. Never tune on reserved
outcomes or relabel the historical full-state, respawn-tolerant campaign verifier as
an observation-only first-death policy.

The initial cohort uses a 4,000-decision limit. Built-ins advance at most twenty
ticks per decision, so requested ticks cannot reach the native limit in this study.
Long living campaigns remain timeouts with their actual partial progress; they are
not counted as deaths. Retaining every original structured input also has a storage
cost: a 500-decision development probe occupied approximately 10 MB. Start extensions
with short episodes; the shared review parser limits one JSON rollout to 150 MB.
