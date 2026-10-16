# Emberwake recovery policy7 · 2026-10-16

**Policy7 completes pending-recovery control and repairs the two traced failures.**
This slice keeps native4 rules, observation3 and completion/time score2. Its
[compact receipt](2026-10-16-emberwake-recovery-policy-7.json) pins original witnesses,
development runs and checks. The separate
[pressure-development record](2026-10-16-emberwake-pressure-development-5.md) retains
the rejected damage-only candidates and the unaccepted durability trial.

## Traced failure

When Survival was recovering and no offered movement improved enemy clearance by
more than half a unit, policy6 could fall through to offensive pursuit or a damaging
leap. A198 Standard Barbarian exposed two matched failures under diagnostic A's
damage6 environment. These are not current native4 Standard damage3 reproductions.

| Witness                                 | What the policy knew                                                | Original policy6 control                        | Independently reproduced local alternative   |
| --------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------- |
| Coherent DEV04, decision213, tick1030   | 51/155 HP, potion recovery15 native units, visible archer           | Move toward the foe                             | Stop, advance30 ticks, then drink: 51→144 HP |
| Coherent DEV05, decision7660, tick38225 | 175/514 HP, recovery155 units, visible demon cluster and projectile | Damaging leap into the cluster; death next tick | Stop and advance5: still175 HP               |

DEV04's earlier public input is reconstructed through the exact frozen bundle;
its complete original accepted journal and final state match. DEV05's input and
proposal are present in the original saved tail and match reconstruction exactly.
The five-tick alternative is a local counterfactual, not evidence of campaign victory.
Survival's earlier healing threshold and extra potion purchases are strategic
differences, not independently identified defects.

## Repair boundary

Pending recovery requires both potion stock and an active owned cooldown. Its
defensive branch must finish without falling through into offensive pursuit or
damaging leaps. It can cancel an existing chase, escape a disclosed danger or hold
briefly. Empty stock and elapsed recovery must not produce indefinite waiting.

The old untimed segment envelope includes the player's starting position in every
movement path. A shot that crosses that position later therefore makes every route
look equally unsafe. During pending Survival recovery only, the candidate uses
relative motion over the same five-tick horizon, with the existing expansion for
alignment and axis movement. It uses disclosed shot motion and an offered player
segment; walls, later shots and foe movement remain unpredicted. A safer danger
class takes priority over foe clearance. This is an approximate public heuristic,
not an exact native successor or a guarantee against damage.

Healthy controls and the Immediate/Growth priorities retain their previous ranking.
The reduced public regressions preserve the traced no-retreat failures without
copying entire campaign state. Exact original witnesses remain separately retained.

## Matched campaign development

Six selected consumed attempts compare policy7 against the original A198 policy6
campaigns: coherent blocks04/05/08, Standard Barbarian, Immediate and Survival.
The frozen diagnostic A environment remains **damage6**, with no gameplay change.

| Survival block | Original policy6    | Policy7                                                  |
| -------------- | ------------------- | -------------------------------------------------------- |
| DEV04          | Death, no bosses    | Victory, 27,690 ticks                                    |
| DEV05          | Death, three bosses | Living stop at8,000 decisions, four bosses, 39,555 ticks |
| DEV08          | Death, three bosses | Victory, 32,680 ticks                                    |

All three Immediate accepted journals and full native states remain byte-exact.
Combined results are **four victories, one death, one living stop, zero API errors**.
These selected repair cases do not estimate population improvement or replace the
failed A198 results. The seven untested Survival Standard blocks cannot be assumed
unchanged, so no revised ten-block win rate is inferred.

**Remaining failure:** DEV05 ends healthy, with no visible enemies and recovery
inactive, cycling through final-region frontier exploration. It is a living budget
stop, not victory or a new recovery wait. Its native journal, complete evaluator
state and original final input windows remain retained.

**Broader counterexample:** a separate fixed C durability screen repeats all54
consumed cases under policy7: **39 victories, 11 deaths, four living stops**, the same
outcome cells as policy6. Survival makes more progress in both Barbarian Severe
cases but still loses both. All36 Immediate/Growth accepted journals, complete
states and metrics remain exact after diagnostic-identity normalization; the72
retained public/proposal windows also match, with no work-count differences.
The pressure profile remains unaccepted.

**Controlled shot counterfactual:** in a known-corridor native fixture, the stationary
control dies from20HP at tick4; the selected offered move preserves20HP through tick5.
This establishes the local geometry/control behavior, not campaign strength.

## Verification and limits

The original valid red regression reproduced both policy6 failures. An earlier
fixture with mismatched hero definitions is retained as a fixture failure with no
verdict. The first policy7 candidate and its bundle were superseded before campaign
execution. A separate valid red check demonstrates the projectile escape failure.
The first native corridor probe had incompatible grid/region dimensions and no
offered move; it is retained as a fixture failure, with no verdict. The corrected
probe has a pre-execution freeze and matching source snapshots.

- **Focused:** 21 policy tests, scoped lint and Diablo2 types pass.
- **Fresh Astra code review:** independently passes all21 tests, reproduces both full
  original public witnesses with policy6 and7 bundles, and checks immutable inputs,
  offered commands and unchanged Immediate/Growth proposals on those witnesses.
- **Isolated maintained gate:** passes formatting, lint, types, tooling, inventory and
  production build; `npm run check` additionally passes **558 application tests in93
  files** and **37 seeded simulations in eight files**. Geometry is unaffected.
- **Current native4 trace:** a consumed Barbarian Severe Survival worker campaign wins
  in **30,140 ticks**, passes all four audits and retains **94,885,351 decoded bytes**
  as a **1,853,412-byte gzip** container. All30 producer/source pins remain unchanged.
- **Chrome:** all14 affected journeys pass against the isolated candidate, including
  historical saves, native controls, first/last original policy knowledge, native
  before/after boundaries, explicit evaluator view, phone layout and byte-exact
  container download. The current policy7 trace passes all four browser audits.

Full-campaign evidence uses consumed development seeds. No population strength,
calibration, native5 adoption or human-playability claim is made. Negative pressure
profiles and every unsuccessful attempt remain preserved.
