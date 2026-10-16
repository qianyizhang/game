# Emberwake native4 pressure candidate

**Native4 is implemented and replay-compatible; policy strength and the difficulty
ladder remain uncalibrated.** The user approved a versioned rebalance and score-first
assessment. This slice adopts fixed native mechanics, preserves historical games,
and verifies inspectable rollouts. The [receipt](2026-10-16-emberwake-pressure-4.json)
pins retained artifact, bundle, script and source-snapshot bytes without embedding
large rollouts.

## Fixed native mechanics

| Tier     | Incoming hostile damage | Health-potion recovery |
| -------- | ----------------------: | ---------------------: |
| Relaxed  |                   ×0.75 |              0 seconds |
| Standard |                      ×3 |             20 seconds |
| Severe   |                      ×6 |             60 seconds |

- **Hostile impacts:** apply the multiplier once, preserving existing player
  mitigation and final rounding and ally melee/projectile floating arithmetic. Mana, maps, content, rewards and score2 are unchanged.
- **Recovery:** health potions still restore 60% maximum health. The reserved
  `@health-potion` key stores 0/200/600 native 100 ms units; each 50 ms tick removes
  0.5 units. A recovering drink rejects atomically. Relaxed drinking records a zero
  key; mana drinking does not set it.
- **Visible legality:** a living, nonwarded enemy blocks a field portal only when
  native `visibleActor` has line of sight and distance strictly below eight. Native
  commands and the offered policy menu share this predicate. A hidden nearby enemy,
  corpse or warded boss cannot veto the current portal action.

## Historical compatibility

Current games use `emberwake-4`, replay-v4 and the v4 save slot; observation3 records
the changed control semantics. Native3 retains original player multipliers
0.75/1/1.3, unscaled ally receipts, instant 60% health potions without the new key,
and its hidden three-pace portal veto. Native2 retains original Standard arithmetic;
sandbox rules and its separate save remain unchanged. Import, continue, export and
reload keep the loaded version and save slot.

**Historical proof:** nine hero/tier rows contain 15 frozen native3 checkpoints and
accepted next-command continuations, including damage, skills, health drinks and
town/return transitions. Native2 has its original continuity fixture. Fresh Astra
independently checked the 15 checkpoints against original bundles and reviewed the
pins. The retained review receipt records those checks and excludes later
policy revisions. Its two locator findings
are closed: `est-results/` became `test-results/`
in two fixture fields. Original fixture SHA `6bfbc039…` and corrected SHA `124874f9…`
are both retained; all other bytes and expected hashes remain exact. The receipt
records full hashes and verifies both original bundle targets. The historical
generator remains intact; future generators should use `path.relative` instead of
slicing a root path that already ends in a separator.

## Verified development and browser behavior

- **Package checks:** 57/57 tests across 14 files pass, plus scoped lint, package
  types and formatting. This includes exact recovery expiry, single damage scaling,
  paired hidden-state portal legality and historical continuity.
- **Native adoption parity:** all 54 frozen diagnostic journals reconstruct exactly
  through production4 after changing only replay format/version and expected
  `state.rulesVersion`. Every other state field, accepted journal and tick count
  matches. This reuses existing decisions; it is neither fresh policy execution nor
  independent confirmation.
- **Actual worker witness:** Sorceress Standard, Survival policy3, wins at
  **38,625 ticks / 7,677 decisions** using the real worker with a 2 GiB old-generation
  setting. The **116,553,448-byte** artifact passes all four audits; source changes
  are empty. Sampled process-wide RSS reached **1,823,014,912 bytes** at 500 ms
  intervals; this includes main and worker and is neither a heap measurement nor
  a hard RSS limit. The retained original producer had a weak one-passed-field exit
  guard. Actual verdicts all passed; a separate closure verifier explicitly checked
  all four, and the future wrapper was corrected without replacing original bytes.
- **Browser acceptance:** 11/11 disposable-profile journeys pass. The actual
  116.55 MB artifact also supports first/last original policy knowledge, final native
  seek, evaluator opt-in, byte-exact download and a 390 px viewport without overflow.
  Policy3 decision auditing passed while that original factory was available;
  subsequent factory versions may make current-factory reproduction unavailable.
  This is reconstructed episode review, not a live human campaign playthrough.

Local evidence remains under `test-results/emberwake-strength/`, including
`rules4-policy3-native-witness`, `native4-browser-1` and `native4-review-1`.
The receipt supplies narrow hashes for those ignored artifacts and retained sources.

## Counterexamples and remaining work

**Policy3 did not establish a strength improvement.** In the matched 54-case screen,
Survival's Severe wins fell from policy2's 5/6 to 4/6. All failed cases remain retained.
Its Relaxed and Standard score pairs also favor Immediate for Barbarian and
Sorceress, illustrating strategy tradeoffs rather than a universal ordering.
The broader **180-case development diagnostic** has no four-audit recorded-study
claim: Necromancer Standard Survival loses 10/10 score pairs against Immediate;
its Survival Standard score is worse than Severe on 6/10 pairs. Sorceress Immediate
Relaxed and Standard tie on all 10 pairs. These are consumed development blocks;
heroes, tiers and priorities cannot be pooled as independent replications.

Policy4 repairs the Sorceress firing-origin loop and the disclosed-projectile escape
case. Its frozen 54-case development screen records **44 wins, six deaths and four
living budget stops**, with no API errors. Growth Sorceress completes all tested
tiers; Barbarian Survival still exposes a healthy-melee hazard/pursuit cycle. An
actual policy4 Growth Sorceress Severe worker witness wins in **33,840 ticks /
7,130 decisions**; its **106,458,472-byte** original artifact passes all four audits.
Sampled process-wide peak RSS is **1,712,603,136 bytes**. This uses adoption-development seed `POLICY-ADOPTION-1-DEV-02`, distinct from
the fixed54 `EMBERWAKE-STRENGTH-2-DEV-02`. The original closure incorrectly
describes its selection from fixed54; a retained correction records both namespaces.
The four-audit result is technical evidence, not exact fixed54 reproduction or fresh
confirmation.

The isolated policy4 candidate passes maintenance, **552 application tests and
37 seeded tests**. Fresh Astra also checks 42 retained policy4 inputs without a
finding. Later policy changes require renewed verification, recorded below.
These phase-specific checks do not establish policy strength, difficulty calibration
or human feel; a prospective study remains necessary.

## Policy 5 local correction and closed development screen

**Policy 5 corrects the healthy-melee escape tie-break; its campaign results remain
mixed.** After warning/projectile danger ties, a melee hero at least 70% healthy
and outside recovery prefers disclosed attack reach. Recovery retains maximum
enemy clearance. Native pressure, score 2, sensors and exploration are unchanged.

The retained original ten-input prefix reproduces policy 4's retreat and policy 5's
closer warning-safe escape. In the separate exact-native-prefix comparison, both
offered directions preserve 263.6 HP over 40 native ticks; the closer direction keeps
the boss visible. This supports the local control correction, not a campaign
strength claim. All policy 4 failures and original receipts remain unchanged.

**Outcomes:** policy 5 records **43 wins, seven deaths and four living budget stops**,
versus policy 4's 44 wins, six deaths and four stops. Both have zero API errors. Each
cell below is **wins/deaths/living budget stops out of two consumed seed blocks**;
each attempt has an 8,000-decision cap. Heroes are separate strata.

| Hero        | Priority  | Relaxed | Standard | Severe |
| ----------- | --------- | ------- | -------- | ------ |
| Barbarian   | Immediate | 2/0/0   | 2/0/0    | 0/2/0  |
| Barbarian   | Survival  | 2/0/0   | 2/0/0    | 0/1/1  |
| Barbarian   | Growth    | 2/0/0   | 2/0/0    | 1/1/0  |
| Sorceress   | Immediate | 2/0/0   | 2/0/0    | 0/2/0  |
| Sorceress   | Survival  | 2/0/0   | 2/0/0    | 2/0/0  |
| Sorceress   | Growth    | 2/0/0   | 2/0/0    | 2/0/0  |
| Necromancer | Immediate | 2/0/0   | 2/0/0    | 1/1/0  |
| Necromancer | Survival  | 2/0/0   | 2/0/0    | 2/0/0  |
| Necromancer | Growth    | 1/0/1   | 1/0/1    | 1/0/1  |

All 42 non-melee or Barbarian Immediate cases retain exactly the same metrics,
command counts and decision counts as policy 4. Barbarian Survival gets beyond
DEV01's first-boss loop but dies after three bosses; DEV02 stops alive while
repeatedly targeting gold at full HP. The latter is a confirmed fractional-position/current-cell arrival mismatch;
an already offered adjacent move collects the gold in five native ticks. This
read-only counterfactual does not establish campaign completion, and policy 5
leaves the navigation boundary unchanged. Growth Necromancer retains its
three final-exit exploration stops. None is converted to a victory or discarded.

### Paired ordinal comparisons

Each cell is **better/tied/worse over two matched blocks** for the first condition.
Score 2 compares completion, bosses, wards and regions before considering lower
native time among victories. No scalar mean or pooled hero denominator is used.

| Hero        | Priority  | Relaxed vs Standard | Standard vs Severe |
| ----------- | --------- | ------------------- | ------------------ |
| Barbarian   | Immediate | 1/1/0               | 2/0/0              |
| Barbarian   | Survival  | 2/0/0               | 2/0/0              |
| Barbarian   | Growth    | 1/1/0               | 1/0/1              |
| Sorceress   | Immediate | 0/2/0               | 2/0/0              |
| Sorceress   | Survival  | 2/0/0               | 2/0/0              |
| Sorceress   | Growth    | 0/1/1               | 0/1/1              |
| Necromancer | Immediate | 1/1/0               | 2/0/0              |
| Necromancer | Survival  | 2/0/0               | 1/0/1              |
| Necromancer | Growth    | 1/1/0               | 0/1/1              |

| Hero        | Severe Survival vs Immediate | Severe Growth vs Immediate |
| ----------- | ---------------------------- | -------------------------- |
| Barbarian   | 2/0/0                        | 2/0/0                      |
| Sorceress   | 2/0/0                        | 2/0/0                      |
| Necromancer | 2/0/0                        | 1/0/1                      |

**Development reference suggestions:** Growth for Barbarian and Sorceress; Survival
for Necromancer. Each beats Immediate on both Severe score pairs here. Barbarian
Growth has one Severe victory and one death; Sorceress Growth wins both and beats
Survival on winning time. Necromancer Survival wins both, while Growth has one win
and one budget stop; their direct score ordering splits 1/1. These are candidates
for a prospective protocol, not confirmed universal strategy rankings.

Survival gives exact Relaxed–Standard ordinal ordering on both blocks for every
hero, but the winning-time differences are only **10–65 native ticks**
(**0.5–3.25 seconds; 0.03–0.17%** of Standard time). These operationally tiny gaps
do not establish meaningful difficulty separation.
Necromancer Survival's Standard–Severe score ordering splits 1/1, and several Growth
pairs reverse or tie. **A calibrated three-tier ladder remains unproven.**

### Policy 5 verification status

- **Focused checks:** five selected policy regressions, scoped lint and package
  types pass; eleven policy tests were unselected in this focused run.
- **Fresh Astra:** the independent focused receipt verifies source/bundle pins and
  reproduces the original healthy prefix, synthetic wounded counterparts and all
  three earlier control regressions without a finding. Its SHA256 is
  `40c9493cde116190be8f04532886ef32682794e36e1a8e7270b8f610fd851b38`.
  This is detached-input review, not a full pipeline or performance study.
- **Full candidate 5 gate:** root's exact isolated candidate passes maintenance,
  **553 application tests and 37 seeded tests**. Its retained log and manifest are
  pinned in the receipt. This excludes subsequent shared gzip integration;
  candidate 4's earlier gate remains a separate historical result.
- **Historical compressed witness:** policy 5 wins its consumed Sorceress Severe
  Growth case in 35,490 ticks. The 112,389,735-byte decoded recording and retained
  gzip bytes pass all four worker and browser audits. Fresh Astra repeats all four
  against its frozen policy 5 bundle. Later policies do not retroactively reproduce
  this result; its original sources and bytes remain retained.

## Policy 6 fractional-position correction

**Policy 6 fixes the gold pickup loop without changing native rules or offered
commands.** The navigation search previously tested its current node at the tile
center. In the retained failure, that center was 0.9904 cells from the gold while
the player was actually 1.3995 cells away, outside native pickup's strict 1.35-cell
radius. Waiting could never collect it. Goal reach now uses the actual player
position for the current node and centers for hypothetical future nodes.

All 40 original failure inputs reproduce policy 5's wait and policy 6's already
offered neighboring move. Native counterfactuals show that this move collects ten
gold and an item in five ticks while waiting collects nothing. The center move is
native-legal but absent from the public menu; no menu widening was needed.

The single consumed Severe Barbarian Survival case now wins in **31,270 ticks /
6,689 decisions**, collecting the former stalled gold during the campaign. Its
source pins remain unchanged during execution. **17 policy tests**, scoped lint
and package types pass. This local regression and one development campaign do not
replace fresh calibration. Policy 5's negative
54-case results remain exact historical evidence. The initial one-case correction
precedes the separate current policy 6 refresh reported below.

Fresh Astra independently reproduces all 40 old-policy and 40 corrected-policy
proposals, offered legality, input immutability and fresh-factory determinism without
a finding. The exact combined isolated candidate also passes maintenance,
**554 application tests and 37 seeded tests**. These checks exclude unrelated dirty
guide and art changes.

A separate complete recording of that same consumed Barbarian Severe Survival case
passes all four audits in the real 2 GiB worker and actual Chrome inspector. Its
**96,340,701 decoded bytes** are retained as **1,869,673 gzip bytes** with exact
encoded/decoded hashes. Original knowledge, native before/after seek, final victory,
explicit evaluator view, phone layout and original download all pass. This was
selected after the repair's known development success, not as an independent seed.

## Current policy 6 development refresh

**The final frozen 54-case refresh records 42 wins, nine deaths and three living
budget stops, with zero API errors.** Both shards close with exact source/bundle
pins. This repeats the same two consumed seed blocks across heroes, tiers and
priorities; it is a native-play development diagnostic, not a four-audit recorded
matrix or fresh confirmation. Earlier policy 4 and 5 results remain separate.

| Hero        | Priority  | Relaxed | Standard | Severe |
| ----------- | --------- | ------- | -------- | ------ |
| Barbarian   | Immediate | 2/0/0   | 2/0/0    | 0/2/0  |
| Barbarian   | Survival  | 2/0/0   | 2/0/0    | 1/1/0  |
| Barbarian   | Growth    | 2/0/0   | 2/0/0    | 0/2/0  |
| Sorceress   | Immediate | 2/0/0   | 2/0/0    | 0/2/0  |
| Sorceress   | Survival  | 2/0/0   | 2/0/0    | 2/0/0  |
| Sorceress   | Growth    | 2/0/0   | 2/0/0    | 2/0/0  |
| Necromancer | Immediate | 2/0/0   | 2/0/0    | 0/2/0  |
| Necromancer | Survival  | 2/0/0   | 2/0/0    | 2/0/0  |
| Necromancer | Growth    | 1/0/1   | 1/0/1    | 1/0/1  |

Each cell is wins/deaths/living budget stops out of two. Severe Survival wins
**1/2 Barbarian, 2/2 Sorceress and 2/2 Necromancer**, while Immediate wins none.
Both Survival and Growth outrank Immediate on both Severe score pairs per hero,
sometimes through unfinished progress. This remains descriptive, with no universal
strategy order. All three remaining stops are Growth Necromancer final-exit stops.

Relaxed–Standard Survival winning times now differ by **0–20 ticks / 0–1 second
/ 0–0.05723%**, smaller than policy 5's historical gaps. Every hero/priority has
**zero better, two tied and zero worse** Relaxed–Standard pairs under the declared
practical comparator: preserve completion/progress order, but treat equally complete
victories less than 5% apart in native time as ties. Exactly 5% remains directional.
This development diagnostic margin leaves authoritative score2 unchanged and is not
a validated human-perception threshold. Exact score ordering alone cannot establish
a useful difficulty ladder. The user selected **further actual gameplay pressure**
under a new rules version, preserving historical v4/older replays and retaining
completion/time scoring. Development-only pressure profiles precede an authoritative
v5 candidate and any new reserved confirmation.
