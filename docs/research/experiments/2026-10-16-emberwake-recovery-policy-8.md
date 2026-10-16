# Emberwake recovery policy8 · 2026-10-16

**Implemented: safe recovery finishers and earlier projectile escape. The 198-case development run supports taking profile D to fresh confirmation.**
Native4 rules, observation3 and completion/time score2 remain the production
boundary. [Policy7](2026-10-16-emberwake-recovery-policy-7.md) and all earlier negative
pressure records stay intact. No native5 or calibrated-ladder claim is made.

## Fixed D development baseline

The separately identified D diagnostic runs policy7 on two consumed coherent seed
blocks × three heroes × three tiers × three priorities: **54 attempts, 32 victories,
21 deaths, one living stop and zero API errors**. Its incoming damage is
**0.75/8/12**, player-only per-hit ceilings are **unlimited/55%/70% of maximum HP**
with a minimum of one damage, and life recovery is **0/20/60 seconds**. Enemy health,
maps, content, rewards, mana and score2 remain unchanged; ally damage is uncapped.

The ceiling applies after existing mitigation and rounding, then takes the minimum
with `max(1, floor(maxHp * fraction))`. The minimum-one rule means a custom maximum
of one HP can still die from a full-health hit. No applied single-impact damage
reached maximum HP on the tested base-campaign paths, and no lethal single impact
or multi-impact advance began at at least 95% HP. Three multi-impact deaths from
lower starting HP remain in the denominator. This does not establish playability.

Two raw, uncapped Severe impacts exceeded maximum HP, but the actual rule limited
them: Sorceress **126→66**, leaving 29/95 HP; Necromancer **128→77**, leaving 33/110 HP.
These are raw counterfactuals and actual applied damage, not actual one-hit lethal
potential. Their public prefixes were reconstructed afterward, explicitly labeled,
and verified against the complete original native journals and states. They were
not originally retained decision inputs.

**Policy7 baseline floor:** every Barbarian Severe priority loses both attempts. Original
D source snapshots, transformed modules, native journals, complete evaluator states,
scalar events and available original input windows remain frozen. D is unaccepted.

## What the two Barbarian traces establish

| Original Survival decision      | Public situation and original control                                                                                                   | Separately executed native alternative                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| DEV01, decision 1687, tick 7720 | 80/269 HP; hound 18 HP, 1.004 units away, plus a distant visible archer; Cleave offered; no warnings/shots; retreat, then death at 7721 | Offered Cleave plus advance 5 kills the hound and retains 80 HP through 7725      |
| DEV02, decision 1262, tick 5255 | 44/145 HP; visible arrow; current five-tick class appears safe; hold, escape at 5260, death at 5262                                     | Earlier offered north move, advance 5, stop, advance 5 retains 44 HP through 5265 |

Both original saved inputs/proposals match reconstruction, and complete native prefix
states match. Last health drinks were at ticks 6920/4825; the deaths still had potion
stock 8/7 and recovery 19.95/38.15 seconds remaining. A 20-second recovery would have
elapsed on those exact prefixes, but that alone predicts neither later decisions
nor campaign success. Both deaths also have avoidable public-control alternatives.
No recovery-duration experiment is started from that observation.

## Implemented repair boundary

During stocked pending Survival recovery, an offered nonmoving instant melee/nova
skill may finish all currently visible living nonwarded foes. It must cover and
finish every such foe, with no disclosed hazards or hostile shots. Exact rank,
scaling, resistance and curse arithmetic belongs in shared pure native helpers;
the policy must not query a private successor or duplicate an approximate formula.
Movement spells, projectiles, summons and uncertain partial kills are excluded.

**Visibility counterexample:** DEV01's later tick 7720 frame contains a distant
archer, so the all-known-foes condition rejects its finisher. The
original saved tick 7715 frame shows only the weak hound and supplies the earlier
acceptance case. These are different public inputs; a successful native partial
kill at7720 does not establish that the policy should select it under the narrower
condition.

The second repair separates a ten-tick disclosed-projectile threat horizon from
the unchanged five-tick combat decision cadence, only during pending Survival
recovery. Public stamina, slowing and initial alignment need explicit allowances.
The original earlier escape must actually become distinguishable from holding;
adding a comparison that cannot change the ranking is insufficient. This remains
public geometry with no prediction of hidden walls, future shots or foe movement.

Healthy controls and Immediate/Growth keep their earlier ranking paths. The
delegating example also receives version8. Native damage-helper extraction keeps
the previous operation order; all 24 original native4 checkpoint continuations and
existing v3/v2 fixtures remain exact.

## Local proofs and historical continuity

Four fresh-factory policy decisions use exactly reproduced original native prefixes.
They are single-input checks, not teacher-forced policy8 histories or campaign claims.
The corrected branch schedule advances each surviving alternative exactly ten ticks;
the earlier uneven schedule is retained as superseded evidence.

| Prefix              | Policy7 branch  | Policy8 branch                          | Supported conclusion                                            |
| ------------------- | --------------- | --------------------------------------- | --------------------------------------------------------------- |
| A DEV04, tick 1030  | 51 HP at 1040   | 51 HP at 1040                           | Earlier recovery hold remains intact.                           |
| A DEV05, tick 38225 | 175 HP at 38235 | 175 HP at 38235                         | Earlier recovery stop remains intact.                           |
| D DEV01, tick 7715  | 80 HP at 7725   | 80 HP at 7725; hound killed; XP 259→289 | Safe finisher; both fixed-control branches survive this window. |
| D DEV02, tick 5255  | Dies at 5262    | 44 HP at 5265                           | Earlier projectile escape prevents this local death.            |

DEV01's original continued policy7 campaign later dies at 7721. That historical
outcome differs from the earlier fresh-factory branch with fixed subsequent control;
the local finisher comparison does not establish a saved death.

Independent Astra replay reproduces all **54 original D7 native journals** through
the D8 native bundle, normalizing only diagnostic replay/state identity. Complete
states, accepted commands and tick accounting match: **212,377 commands**,
**1,252,780 requested ticks**, **1,252,728 executed ticks**. No policy executes in
that parity check. Original native4 continuity contributes 24 fixed checkpoints;
v3/v2 fixtures remain exact. This does not grant diagnostic D native4-header support.

## Verification

- **Focused:** 28 tests pass independently under fresh Astra review; all seven frozen
  source/fixture hashes match the experiment freeze. The final post-cohort test-only
  guard compares the example version directly with its delegated builtin; runtime
  bytes are unchanged. Valid old-policy regressions and all superseded/no-verdict
  attempts remain retained.
- **Isolated full gate:** maintenance, **561 application tests across 93 files** and
  **37 seeded tests across 8 files** pass. Geometry is unaffected and was not run.
- **Browser:** **14/14 journeys pass** using approved execution, the disposable Chrome
  harness and its startup guard. They cover historical campaigns, saves, original
  policy knowledge, decision/tick navigation, native before/after inspection,
  evaluator opt-in, narrow display and exact compressed download.
- **Full worker witness:** consumed native4 Barbarian Severe Survival DEV02 wins in
  **31,265 native ticks**, with all four original-input audits and 30 source/tool pins
  unchanged. JSON 97,089,367 bytes becomes gzip 1,904,077 bytes losslessly. This is a
  technical witness, not fresh strength evidence. It is 1,125 ticks slower than the
  retained policy7 witness; that pair is within the declared 5% practical time tie.

## Complete D8 development

The frozen run comprises **198 consumed cases**: 180 Immediate/Survival cases on
`EMBERWAKE-COHERENT-POLICY3-DEV-01..10`, plus 18 Growth cases on blocks 01..02,
covering all three heroes and tiers. It uses the exact D pressure above and score2,
`INDEPENDENT-POLICY-2`, two 99-case processes capped at 768 MiB each and an 8,000-decision
limit. Both processes exit 0 with no retained, workspace or additional source drift.
No source/parameter tuning occurs within the run.

**Totals: 108 victories, 76 deaths, 14 living decision-budget stops, 0 API errors.**
The complete original native journals, full evaluator states, scalar damage events,
tail/worst windows and selected original critical-impact inputs remain retained.
These diagnostics are not a full original-input four-audit population matrix.

| Hero        | Immediate wins: Relaxed / Standard / Severe | Survival wins: Relaxed / Standard / Severe | Growth wins: Relaxed / Standard / Severe |
| ----------- | ------------------------------------------- | ------------------------------------------ | ---------------------------------------- |
| Barbarian   | 10/10 · 2/10 · 0/10                         | 10/10 · 8/10 · 1/10                        | 2/2 · 1/2 · 0/2                          |
| Sorceress   | 8/10 · 2/10 · 0/10                          | 8/10 · 7/10 · 4/10                         | 2/2 · 2/2 · 0/2                          |
| Necromancer | 9/10 · 3/10 · 0/10                          | 10/10 · 9/10 · 5/10                        | 2/2 · 2/2 · 1/2                          |

Living stops remain nonwins. They include 2 Relaxed Immediate Sorceress, 1 Relaxed
Immediate Necromancer; 2 Standard and 1 Severe Survival Barbarian; 2 Relaxed,
3 Standard and 3 Severe Survival Sorceress. No zero-death group is automatically
counted as a complete win rate.

### Material score comparisons

Score2 compares completion, bosses, wards and regions lexicographically; winning
native time breaks a completion tie. The practical development comparison treats
winning times as tied only when `20 * abs(tA - tB) < max(tA, tB)`. An exact 5%
difference remains directional. The table shows **better / tied / worse** across
all ten matched blocks, retaining ties in the denominator.

| Hero        | Relaxed−Standard, Immediate | Standard−Severe, Survival | Survival−Immediate, Standard |
| ----------- | --------------------------- | ------------------------- | ---------------------------- |
| Barbarian   | 8 / 2 / 0                   | 8 / 2 / 0                 | 9 / 0 / 1                    |
| Sorceress   | 8 / 2 / 0                   | 5 / 4 / 1                 | 8 / 2 / 0                    |
| Necromancer | 7 / 3 / 0                   | 6 / 3 / 1                 | 6 / 3 / 1                    |

These development differences support selecting exact profile D for a versioned
rules candidate and a prospectively frozen fresh confirmation. They do not establish
universal tier/policy ordering, population effects, human difficulty or calibration.
In particular, Growth is a distinct preference, not a guaranteed stronger policy.
No reserved Emberwake5 cohort has run; production remains native4 in this slice.

### Matched controls and counterexamples

All 36 overlapping Immediate/Growth native journals and complete states match
policy7 after diagnostic identity normalization. All 72 retained tail/worst files
are byte-exact, covering 2,240 unique original decisions with zero work deltas;
that work comparison covers those original windows only. Of 18 overlapping Survival
cases, 7 journals change; practical scores improve 4 times, tie 14 and worsen 0.
The complete 54-case subset moves from 32 to 33 wins. Both originally traced Severe
Barbarian DEV01/02 campaigns still die later under policy8: their local control repairs do
not solve those complete campaigns. These are selected consumed comparisons, not a
population repair-effect estimate.

Across all 198 attempts there are **zero applied single impacts at least maximum HP**
and **zero near-full-HP single-impact deaths**. Five raw uncapped counterfactual
impacts reach or exceed maximum HP; original public critical windows are now retained for
these nonfatal cap demonstrations too. The earlier D7 reconstructed examples remain
labeled as reconstructed.

**Unresolved damage counterexample:** 15 multi-impact accepted advances end in death,
including one from near-full HP. Severe Barbarian Survival DEV08 starts at 363/363 HP;
three 134-damage fire impacts in the same tick take 363→229→95→0. Each impact is
below the 254-damage per-hit ceiling. A per-impact ceiling therefore does not prevent
a lethal volley or guarantee a reaction opportunity. This original window remains
in the evidence and does not trigger further tuning within this run.

Fresh Astra independently reconstructs all 198 native journals and complete states,
recomputes all 36 score-pair groups, derives every score2 vector from native state,
and verifies all 1,635 retained files. The companion
[receipt](2026-10-16-emberwake-recovery-policy-8.json) pins the source, gates and
retained original experiment evidence.
