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

The accepted baseline remains **policy8 under native7** with these pressure settings.
Policies 10, 11 and 12 are rejected by their independently audited D12/D13/D14 screens; the
working built-ins have been restored exactly to policy8 after each source-hold release. The [native5 fresh confirmation](../research/experiments/2026-10-16-emberwake-strength-confirmation-5.md)
failed one contrast; the [native6 Standard-relief screen](../research/experiments/2026-10-17-emberwake-standard-relief-6.md)
failed two. The [native7 Standard-pressure screen](../research/experiments/2026-10-17-emberwake-standard-pressure-7.md)
also fails overall: all six difficulty comparisons pass on consumed development
seeds, while two Standard policy comparisons fail. The full contract remains
uncalibrated; no fresh confirmation7 is launched.

| Tier     | Hostile damage multiplier | Player per-impact ceiling | Life-potion recovery |
| -------- | ------------------------- | ------------------------- | -------------------- |
| Relaxed  | 0.75                      | Unlimited                 | 0 seconds            |
| Standard | 7                         | 55% of current maximum HP | 20 seconds           |
| Severe   | 12                        | 70% of current maximum HP | 60 seconds           |

Player damage scales once after mitigation and rounds once, then takes the minimum
with `max(1, floor(currentMaxHp * fraction))` when a ceiling applies. Allies retain
uncapped floating impact arithmetic with the same tier multiplier. A per-impact
ceiling does not prevent several impacts within one accepted advance from killing
a full-health player; a custom one-HP maximum can also die to the minimum-one floor.
Health recovery uses the owned cooldown key
`@health-potion`; content IDs cannot occupy that namespace. The public menu excludes
unavailable drinks, and the live HUD displays remaining recovery. Mana potions retain
their original behavior. Maps, content and rewards remain unchanged.

Native portal availability and the public menu use the same living, nonwarded enemy
sensor: radius eight plus line of sight. An undisclosed enemy behind a wall cannot
make an offered portal fail. Historical rules v3 retain the original distance-three
native guard, instant life potions and **0.75/1/1.3** player damage arithmetic; rules
v2 retain their original Standard meaning. Historical v4 keeps **0.75/3/6**, no hit
ceiling and **0/20/60-second** recovery. Historical v5 keeps Standard ×8 and v6 keeps Standard ×5, with the same caps and
recovery. V7, v6, v5, v4, v3 and v2 campaigns have separate save slots and exact
versioned replay reconstruction. First upgrade checks v7/v6/v5/v4/v3 slots in that
order and preserves unreadable bytes; a valid loaded campaign keeps its original
rules. V2 remains explicitly restorable. Starting v7 requires an explicit new
journey when an older game loads.
Sandbox keeps its existing rules and ordinary developer controls, outside this study.
The [native5 record](../research/experiments/2026-10-16-emberwake-pressure-5.md)
pins development adoption and compatibility evidence; fresh calibration is separate.

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

Rejected policy9 tested timed projectile ranking for nonpending Survival warning
escapes at every health level, including a low-health empty belt. It accounted for
disclosed stamina/slow state, alignment and speed transitions. Pending ten-tick
recovery, nonwarning behavior and Immediate/Growth behavior stayed fixed.
Teleport endpoint geometry stayed fixed; blink selection could change. This was
an experimental policy change under native7/observation3/score2, not a native rebalance.

Its bounded Necromancer Standard DEV06 continuation used the original policy8
prefix at tick 16,465: policy8 died after 14 executed ticks, while policy9 retained
258/325 HP through the fixed 40-tick cap. The counterfactual policy9 branch used
recorded policy8 public-history warmup. Accepted warmup commands matched, but six
full proposal/diagnostic outputs differed; full-output identity is not claimed.
The [D11 development result](../research/experiments/2026-10-17-emberwake-policy-9-development.md)
rejects policy9 after the full cross-hero screen. A local escape success did not
establish campaign strength. Policy8 remains the accepted baseline; the subsequent
policy10 D12 screen is also independently confirmed negative.

The rejected traces expose two unresolved control boundaries: Standard Barbarian
DEV01 used damaging Leap into disclosed warnings before later HP losses, and Severe
Barbarian DEV09 pursued a remembered foe toward three disclosed incoming shots.
These are recorded-action findings, not executed alternatives or exact damage
attribution. A successor should check the movement/continuation boundary that
advances time, preserve finite progress and validate actual native continuations;
it must not infer campaign strength from either local repair.

Rejected policy10 started from policy8's conservative geometry and checked three
Survival boundaries: damaging Leap landing admission, remembered pursuit, and the
pending control before advance. Unknown target positions remained unknown. The
attack-intent model treated a disclosed target point as movement even when native
ranged reach and clear line of sight leave the attack stationary, including while
cooldown prevents firing; this
limits the model's interpretation of native control priority. A replacement had
to strictly improve the danger prefix, so foe clearance alone could not redirect
control. Tied danger, including all-unsafe ties, or no strictly improving offered
defense retained bounded ordinary advancement. Nonmovement casts retained
movement; zero-tick relocation was reassessed separately. Immediate/Growth,
recovery and the pending ten-tick model stayed fixed. The public calculation was
heuristic, not a prediction of future shots, walls or foe motion.

The two historical policy9 Barbarian prefixes are counterfactual local tests,
not policy10 campaigns from the start. Producer results reach 40 executed ticks
alive in both cases: Standard tick7,010 with 311 HP; Severe tick16,390 with 258.8 HP.
Original9 references reproduce deaths at ticks6,983 and16,362. Candidate warmup
uses exact original9 public history, with command/full-output differences 8/151
and 28/245 respectively. Fresh independent audit verified all 4,799 warmup inputs, 39 branch proposals,
four complete native replays and six guard records. Severe's improving rank still
indicates exposure. No local result establishes campaign strength or difficulty
calibration; the complete D12 screen is independently confirmed negative. The local
four branches remain outside that cohort.

Rejected policy11 modeled in-range, public-clear-LOS attacks as stationary even on
cooldown, while preserving other owned movement. Added exposed-margin detours shared
one allowance reset by observed tracked foe damage/death or monotone objective
progress; class-clearing escapes remained available. Native7/observation3/score2 and
warning/recovery geometry stayed fixed. Its [D13 screen](../research/experiments/2026-10-17-emberwake-policy-11-development.md)
([receipt](../research/experiments/2026-10-17-emberwake-policy-11-development.json)) is negative:
107 victories, 61 deaths and 30 living timeouts across 198 attempts, with zero errors;
eight of nine comparisons, five of six completion floors and all three Severe-existence
checks pass. Exact policy8 was restored after hold release. The report owns detailed
results and audit limits; this correctness repair did not establish stronger play.

Rejected policy 12 began from accepted policy 8 and required Survival cached-frontier retention to remain eligible under current public adjacent fog; stale caches fell through the existing ranker. It inherited no policy 11 guard patches. The [D14 screen](../research/experiments/2026-10-17-emberwake-policy-12-development.md)
([receipt](../research/experiments/2026-10-17-emberwake-policy-12-development.json)) is independently negative: 125 victories, 67 deaths and 6 living timeouts / 198, zero errors; eight of nine comparisons and all completion/existence gates pass, but Necromancer Standard>Severe remains net −.30. All 90 matched Survival pairs show 11 gained / 3 lost victories, with completion regressions in Barbarian Standard 9/10 → 8/10 and Sorceress Severe 4/10 → 3/10. Exact policy 8 was restored without a hero split. This was the final attempt; calibration remains unresolved. The future victory-primary design is not started, and no new study or fresh confirmation follows.

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

The initial study used ten development and twenty disjoint reserved seed blocks,
crossing three heroes, three tiers and three priorities (270/540 attempted episodes).
Later designs declare their own complete grids and budgets in dated protocols.
Freeze sources/setup, ranking and budget before reserved evaluation. Report each hero/tier separately with
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
Native rules-v2/v3/v4/v5/v6 replay reconstruction remains unchanged. Winning development
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
was unchanged in that assessment. The later native5 [fresh confirmation](../research/experiments/2026-10-16-emberwake-strength-confirmation-5.md)
retains all 1,170 attempts: 571 victories, 450 deaths, 149 living stops and no execution
errors. All six absolute completion and three Severe-existence gates pass; only
Necromancer Survival Standard–Severe fails the nine-contrast family (15-point net
material effect, Holm p=0.149613). Its Standard/Severe wins are 46/60 and 37/60.
All 1,170 original-input/native sequences and 27 full factory reproductions were
independently audited. Keep this negative confirmation intact; further development
and a new prospective namespace are required before claiming full calibration.

The [native6 Standard-relief development](../research/experiments/2026-10-17-emberwake-standard-relief-6.md)
tested Standard damage ×5 under a separate rules identity while retaining Relaxed
and Severe. Its 198 consumed attempts produced 128 victories, 56 deaths and
14 living budget stops, with no execution errors. Seven of nine separation checks
passed; Necromancer Immediate Relaxed–Standard had ten practical ties, and its
Standard Survival–Immediate advantage was 0.10 against the fixed 0.20 threshold.
All six completion floors, three Severe-existence gates and 132 unchanged-tier
controls passed. This negative candidate is not promoted to fresh confirmation;
score2 and every threshold remain unchanged. Original native6 source, recordings
and native histories are retained separately from the then-committed native5 baseline.

Native7 changes only uniform Standard incoming damage from ×5 to ×7. Original
native6 was frozen before this change; nine full native campaigns containing 51,300
accepted commands, 25 branch checkpoints and 15 atomic rejections preserve its
replay/save meaning alongside native5/4/3/2. Source breakpoints motivated the
candidate; they did not predict campaign outcomes.

The [native7 development result](../research/experiments/2026-10-17-emberwake-standard-pressure-7.md)
and [machine receipt](../research/experiments/2026-10-17-emberwake-standard-pressure-7.json)
retain **198 consumed attempts: 117 victories, 69 deaths, 12 living budget stops and
no execution errors**. Ten matched blocks × three heroes × three tiers ×
Immediate/Survival give 180 attempts; Growth on the first two blocks adds 18.
Each of nine contrasts retains all ten pairs, including ties, and requires
`(materially better - materially worse) / 10 >= 0.20`. This is a descriptive
score-direction gate, not a victory-rate effect or statistical significance test.
Score2 stays exact; equally complete victories are practical ties only when
`20 * abs(ticksA - ticksB) < max(ticksA, ticksB)`. Exact 5% differences remain
directional.

All six tier comparisons and Sorceress's Standard policy comparison pass. All
six completion floors pass (at least 8/10 each): Relaxed Immediate wins are 10/8/9 and
Standard Survival wins are 9/8/9 for Barbarian/Sorceress/Necromancer. The three
Severe observed-victory gates also pass (1/12, 4/12 and 6/12 Survival/Growth attempts
respectively). Two Standard Survival–Immediate comparisons still fail:

| Hero        | Exact better/worse/tied | Practical better/worse/tied | Net material effect | Required |
| ----------- | ----------------------- | --------------------------- | ------------------- | -------- |
| Barbarian   | 6/4/0                   | 4/4/2                       | 0.00                | ≥0.20    |
| Necromancer | 7/3/0                   | 4/3/3                       | 0.10                | ≥0.20    |

The producer reports all four audits on all 198 attempts, unchanged sources and
132 exact Relaxed/Severe native control journals/full states versus original6 after
only replay format, replay rules version and state rules version normalization.
Both actual configurations use `POLICY-STREAM-1`, policy8, empty options and the
8,000-decision budget; original6 artifacts are preserved, not rerun or relabeled.
The dated report owns the final independent audit's precise scope. Five current7
technical executions are separate from the 198; prior6's failed four plus corrected
five technical executions remain historical and excluded too.

This negative consumed screen does not support population, human-difficulty or
equal-compute claims. The fixed thresholds and old5/6 negatives remain intact;
confirmation7 stays dormant. The subsequent policy9 repair was tested with native7
pressure fixed; its rejection does not relabel these policy8 results.

The [rejected policy9 D11 screen](../research/experiments/2026-10-17-emberwake-policy-9-development.md)
([machine receipt](../research/experiments/2026-10-17-emberwake-policy-9-development.json))
retains **198 consumed attempts: 115 victories, 70 deaths, 13 living stops and no
execution errors**. Its producer analysis passes seven of nine contrasts, including
all six difficulty comparisons. Two Standard Survival–Immediate directions fail
against the same 0.20 net material threshold over all ten matched pairs:

| Hero        | Practical better/worse/tied | Net material effect | Required |
| ----------- | --------------------------- | ------------------- | -------- |
| Barbarian   | 4/6/0                       | −0.20               | ≥0.20    |
| Necromancer | 4/3/3                       | 0.10                | ≥0.20    |

Barbarian Standard Survival also fails the completion floor at **7/10** wins
(required 8/10); Barbarian Severe Survival/Growth has **0/12** observed victories
(required at least 1/12). The producer reports **108 Immediate/Growth native journals and full states**
matching original policy8 under native7 exactly, with no normalization. Five separate
Growth technical executions and the two local branches are outside the 198.
The dated report owns the final independent audit's actual scope; these consumed
results have no population, human-difficulty or equal-compute interpretation.

Policy9 was not adopted; its closeout restored the three tested source files
exactly to committed policy8. The subsequent independently audited D12 screen
rejects policy10 under unchanged native7/observation3/score2. Its closeout also
restored those working files exactly to policy8 after source-hold release. The accepted policy8 baseline and all negative
results remain retained. Both version9 and version10
are consumed by their native recordings; any later behavioral revision needs a
fresh identity. Never reuse a rejected identity.
A current factory with a different identity cannot audit policy9 decision
reproduction: use the retained frozen policy9 runtime bundle and complete source
snapshots for factory audits.
Native7 journal replay and the original recorded policy knowledge remain valid and
inspectable. Preserve original policy9 inputs, proposals, scores and receipts without
relabeling them as policy8 or retrospectively rescoring them.

## Rejected policy10 development

The [D12 development result](../research/experiments/2026-10-17-emberwake-policy-10-development.md)
([machine receipt](../research/experiments/2026-10-17-emberwake-policy-10-development.json))
is **negative: 102 victories, 59 deaths, 37 living timeouts and zero execution
errors across 198 consumed attempts**. It passes **8/9 material comparisons,
4/6 completion floors and 3/3 Severe-existence checks**. Independent audit verifies all 198 original inputs and native finals, plus 27 fixed
factory reproductions; the other 171 factory checks remain producer-qualified.
These are consumed development results, not a fresh confirmation.

| Failed gate                             | Producer result                        | Fixed requirement           |
| --------------------------------------- | -------------------------------------- | --------------------------- |
| Barbarian Standard Survival > Immediate | Net −0.20; 3 better / 5 worse / 2 tied | Net ≥0.20 over all 10 pairs |
| Barbarian Standard Survival completion  | 7/10 victories                         | ≥8/10                       |
| Sorceress Standard Survival completion  | 3/10 victories                         | ≥8/10                       |

All six difficulty comparisons pass. Necromancer's Standard policy comparison
passes at net 0.30, and every hero has an observed Severe Survival/Growth victory
among its 12 declared attempts. These existence results are not population win-rate
bounds. All four producer audits pass, with **108 Immediate/Growth native journals
and full final states exact against original policy8/native7**, without normalization.
The separate five Growth technical executions do not assure Survival performance.

Selected saved traces show a stationary ranged attack replaced by retreat and a
retreat/pursuit cycle that advances time without observed combat/objective progress.
Defensive detours need a progress bound; a ticking clock is insufficient. No
alternate native continuation ran in this diagnosis. The causal share of these
findings in the whole-campaign regressions is unresolved; no counterfactual
survival or completion is claimed. The dated report owns the complete evidence scope.

Policy10 is rejected and consumed. Following the exact restoration, current policy8
cannot reproduce its decisions: use the retained frozen policy10 bundle and source
snapshots. Native7 replay and the original recorded policy knowledge remain
inspectable. Preserve original inputs, proposals, scores and all old5/6/7/9 negatives;
no calibrated ladder, fresh promotion or reused rejected identity follows.
