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
region geometry; and an ordinary action menu. Observation v3 carries only the current
hero and that hero’s skill definitions, all item/monster mechanical definitions, and
public atlas topology/progress. Act narrative and duplicated portal labels are omitted.
Region-to-dungeon/floor membership remains in the public dungeon floor lists.
`atlas.progress` names visited, ward, boss and waypoint region IDs.
Terrain uses lossless row runs: each `[count, glyph]` pair describes consecutive
cells, including `?` for unknown cells. Import `terrainRows(input.region)` from
`observation.ts` for the ordinary row-string grid; encoding never fills unseen cells. Environment seed, RNG, allocation
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
developer commands are excluded. Movement offers at most four consecutive known walkable cells on a straight cardinal
route. The menu checks every tile in the complete swept avatar rectangle along each
unit segment against masked terrain, including initial fractional alignment and native
x-then-y movement. It reuses the native body radius; distance samples can miss an
unknown corner and are insufficient. This is the unique shortest native grid route; changing hidden
detours cannot change it. Policy BFS treats unknown cells as blocked and selects
the furthest offered straight prefix, stopping at each turn. Arbitrary distant
waypoints remain excluded: native full-map pathfinding would silently grant
navigation knowledge. Ordinary native
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

Campaign rules v4 use these fixed pressure settings. Their measured ordering remains
an evaluation question; the names and parameters alone do not establish calibration.

| Tier     | Hostile damage multiplier | Life-potion recovery |
| -------- | ------------------------- | -------------------- |
| Relaxed  | 0.75                      | 0 seconds            |
| Standard | 3                         | 20 seconds           |
| Severe   | 6                         | 60 seconds           |

Damage scales once at hostile impact, after the player's existing mitigation, and
also applies to summoned allies. Health recovery uses the owned cooldown key
`@health-potion`; content IDs cannot occupy that namespace. The public menu excludes
unavailable drinks, and the live HUD displays remaining recovery. Mana potions retain
their original behavior. Maps, content and rewards remain unchanged.

Native portal availability and the public menu use the same living, nonwarded enemy
sensor: radius eight plus line of sight. An undisclosed enemy behind a wall cannot
make an offered portal fail. Historical rules v3 retain the original distance-three
native guard, instant life potions and **0.75/1/1.3** player damage arithmetic; rules
v2 retain their original Standard meaning. V4, v3 and v2 campaigns have separate
save slots and exact versioned replay reconstruction. First upgrade resumes an old
v3 journey under its original rules; starting v4 requires an explicit new journey.
Sandbox keeps its existing rules and ordinary developer controls, outside this study.

The three priorities are Immediate (damage/direct objectives), Survival (defense,
earlier protection and safer positioning), and Growth (loot, upgrades and scaling).
These are versioned heuristics with fresh factory memory, not a total strength order.
Policy v8 uses five-tick combat observations and ten-tick quiet travel. Healthy
melee warning escapes preserve attack reach after the shared danger priorities;
low-health recovery retains enemy clearance. These tie-breaks do not predict hidden
movement, future shots or wall collision. Navigation tests a current goal from the
actual player position, while hypothetical future nodes use cell centers; otherwise
a fractional start can stall just outside native pickup reach. Its public
scouting preference estimates discovery through known terrain; unknown walls remain
uncertain, and only known walkable cells can become movement destinations.
All three heroes—Barbarian, Sorceress and Necromancer—are separate setup strata.
Work is self-reported heuristic action/entity/BFS accounting, excluding sorting,
helper loops and recording. It is neither CPU time nor a complete operation count.

Score identity `emberwake-performance-2` declares the ordinal vector
`[won, bosses, wards, regions, won ? executedTicks : 0]`. Maximize the first four
components in order, then minimize the last. Every earlier component takes precedence;
there is no weighted sum. Victory outranks any unfinished campaign, and a fast death
or living timeout receives no speed bonus. Among equally complete victories, actual
native executed ticks distinguish campaign efficiency. Policy decisions, packed native
command counts and requested replay padding do not measure elapsed simulation time.
The decision budget still bounds zero-tick commands independently.

Numeric `progress = 10000*bosses + 100*wards + regions` remains a descriptive legacy
metric for the base campaign's four bosses, eight wards and twenty regions. Report
all components, level/XP, HP and gold separately. Act number alone is unsuitable
because travel can revisit an earlier chapter. Timeouts/errors remain attempted cases;
execution errors are invalid evidence rather than ordinary scored losses.

Final HP, mana and potion stocks are deliberately outside the rank: a zero-tick
portal/return can refill them without improving campaign execution. Gold penalizes
legitimate upgrade spending, while optional kills, XP and level can be farmed.
A new resource objective would need its own declared, versioned semantics rather
than silently adding bonuses to this score. The passive board rounds resource
numbers to at most one decimal for readability; original policy JSON stays exact.

Native portal/return healing is ordinary gameplay, including its zero-tick refill.
It is permitted and reported rather than mislabeled cheating. A separate decision
budget bounds zero-tick commands; policy refill logic must avoid stationary loops.
Use native attack reach to approach an out-of-range visible foe through known
cells. Loot collection must check public inventory geometry rather than item count,
or an uncollectible drop can cause endless collection advances. When the public pack
can no longer fit a base item, v2 uses an offered safe portal, sells unequipped gear
and returns. The same tick/location guard used for healing prevents stationary
portal loops. These visits are reported in `portalRefills`, including ordinary refill
side effects.

A visible ranged attacker can stand across impassable water. Greedy movement that
requires every step to reduce straight-line distance can then wait under fire forever.
The same public BFS used for objectives now plans toward reachable attack positions,
allowing an initially sideways or backward known detour. The regression’s original
development tail recorded 2,294 combat advances and no progress before death;
changing native damage or granting private enemy paths would not address that defect.

Detours can temporarily lose sight of the attacker. Keep its last disclosed alias and
position in factory-local memory (`lastSeenFoe` diagnostics), pursue that known route,
and clear the target on an observed corpse, region change or arrival at an attack
position. Updating this memory from hidden live entities would violate the boundary.
Without public-history pursuit, an older exploration frontier can reverse the route
on every lost-sight frame and oscillate until death.

Line of sight does not guarantee that a projectile hits: segmented collision can
clip a known corner. V3 remembers a visible target's disclosed HP and its own casts;
after sustained no-damage feedback it routes toward another known firing position.
V4 preserves failed firing origins across sensor loss and reacquisition, rather than
letting ordinary pursuit return to the same blocked corner. Observed corpses, region
changes and actual HP progress reset this memory. Survival also puts
defensive movement before offensive casts when life is low and healing unavailable.
Movement ranks all disclosed warnings and a five-tick envelope of disclosed hostile
projectiles before enemy clearance. This uses current public geometry and motion;
walls, future shots and enemy movement are not predicted. It is a conservative
heuristic, not an exact native successor simulation or a guarantee against damage.
These repairs address observed control failures; they do not prove higher win rates.

V7 completes Survival's pending-recovery branch: potion stock and an active owned
cooldown permit a short defensive hold, but no offensive fallthrough when no
retreat improves clearance. Empty stock or elapsed recovery cannot justify waiting.
During pending recovery only, relative player/shot motion over the same five-tick
horizon lets an offered escape avoid a shot that crosses the starting position
later. A safer disclosed danger class precedes enemy clearance. The existing
alignment/axis expansion remains; walls, future shots and foe motion are not
predicted. Healthy controls and Immediate/Growth retain their earlier ranking.
The [recovery development record](../research/experiments/2026-10-16-emberwake-recovery-policy-7.md)
distinguishes original saved inputs, reconstructed inputs and local counterfactuals.

V8 considers an offered nonmoving instant melee/nova finisher during pending
Survival recovery only when it covers and kills every visible living nonwarded foe,
with no disclosed hazards or hostile shots. Native casts and this decision reuse
the same pure rank/scaling/resistance/curse arithmetic; the policy has no private
successor access. A distant second foe rejects the option even if the nearby foe
would die. The delegating example has its own matching version8 identity.

Pending recovery also uses a ten-tick disclosed-projectile horizon across two
ordinary five-tick decisions, with alignment and walking/slow-speed allowances.
Healthy controls and Immediate/Growth retain their previous five-tick geometry.
This longer public approximation does not predict wall response, future shots or
enemy movement. The [policy8 record](../research/experiments/2026-10-16-emberwake-recovery-policy-8.md)
separates local native counterfactuals from campaign development results. Additional
public candidate/geometry work is metered; no equal-compute strength claim is made.

BFS must also respect the current action menu at its first edge. A fractional avatar
footprint can make the nominally shortest adjacent center unavailable because it
crosses an unknown corner. Searching through that edge and only checking membership
at the end can again turn a legal detour into endless waiting. Later center-to-center
edges remain over known walkable cells; the root edges come from offered moves.

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

The retained initial cohort uses a 4,000-decision limit. Built-ins advance at most twenty
ticks per decision, so requested ticks cannot reach the native limit in this study.
Long living campaigns remain timeouts with their actual partial progress; they are
not counted as deaths. Retaining every original structured input also has a storage
cost: a 500-decision development probe occupied approximately 10 MB. Start extensions
with short episodes; the shared review parser limits one JSON rollout to 150 MB.

## Long-campaign development

The long-campaign candidate targets completion rather than treating living partial
progress as a win. Development uses original public-policy inputs and a fixed
8,000-decision probe budget before choosing a prospective study. Every current built-in
advance is capped at ten ticks, including an idle dead end, so at most 80,000 requested
ticks can enter such a probe; the native replay limit remains 100,000. Full recorded
envelopes, not input-byte estimates, must remain below the shared 150 MB parser
limit and pass integrity, native replay, original-input and decision audits.
Lossless terrain runs and explicit atlas progress keep long observations inspectable;
pack management bounds repeated carried-item data while serving ordinary gameplay.

Historical observation-v1/v2 and policy-v1/v2 artifacts and frozen bundles retain their original
meaning. Current observation-v3 identity must not claim to audit their original
sampling. Historical score-v1 artifacts also keep their original bytes and evaluator
identity. Current-identity audit availability must not relabel historical identity
mismatches as corrupt recordings. A score-v2 evaluator sidecar may explicitly reconstruct
an old native journal and add a new score, retaining both original and evaluator pins;
it is neither fresh policy execution nor a new audit of original input sampling.
Native rules-v3 replay reconstruction remains unchanged. Winning development
witnesses establish playability on those inputs; they do not establish strength or a
calibrated difficulty ladder on independent seeds.

The [campaign development evidence](../research/experiments/2026-10-16-emberwake-strength-development.md)
retains full recorded wins, failed navigation candidates, the independent swept-collision
audit, recording-memory measurements and the unresolved difficulty ceiling. A successful
main-process recording does not establish that a worker’s heap limit can record, audit
and serialize the same trace. Probe one real worker case before scheduling a cohort.

The [performance score assessment](../research/experiments/2026-10-16-emberwake-performance-2.md)
records the score-v2 reconstruction and exploratory policy comparisons. Better score
discrimination does not establish ordered win-rate difficulty: the retained development
data include tier ties and a Severe campaign faster than Standard. Native balance
was unchanged in that assessment. The later versioned pressure candidate above still
requires prospective calibration on frozen independent seeds.
