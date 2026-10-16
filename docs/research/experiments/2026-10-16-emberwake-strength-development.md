# Emberwake campaign policy development · 2026-10-16

Public policies now complete the full campaign with all three heroes on a retained
development seed. The existing difficulty ladder remains **uncalibrated**: improved
routing exposed a ceiling rather than a reliable tier separation. No fresh reserved
confirmation has run.

The [game contract](../../engineering/emberwake-policy.md) defines observation v2,
policy v2, controls, original-input inspection and historical compatibility. The
[development receipt](2026-10-16-emberwake-strength-development.json) retains exact
source/artifact pins, outcomes and counterexamples. The original adoption study’s
810 cases and zero victories remain unchanged.

## Full campaign witnesses

All rows use historical `POLICY-ADOPTION-1-DEV-01`, Standard and Survival, with an
8,000-decision budget. Each original rollout passes integrity, native replay,
original-input and decision reproduction audits, and the delivered JSON parser.
These are **three development witnesses**, not three independent seed blocks.

| Hero        | Decisions | Executed ticks | Full rollout bytes | Result  |
| ----------- | --------: | -------------: | -----------------: | ------- |
| Barbarian   |     6,979 |         34,325 |        101,316,611 | Victory |
| Sorceress   |     7,820 |         39,545 |        119,350,699 | Victory |
| Necromancer |     7,401 |         37,650 |        114,256,402 | Victory |

Original inputs, proposals, work, native histories, audits and frozen bundle remain
under `test-results/emberwake-strength/recorded-development-3/`. These recordings pin the exact swept-rectangle and
ten-tick-cap candidate, with no source/tool drift during recording. Prior pre-cap
recordings remain retained separately. Their attempted reproduction under the capped
policy correctly differed at known-loot arrivals: the diagnostic goal label did not
identify the shared no-move advance branch. Actual proposal comparison caught that
mistaken impact assumption before publication. Native rules v3 retain their meaning.

## Development ceiling

The earlier compiled v2 development candidate crossed **two new development blocks**,
three heroes, three tiers and three priorities: **54 direct diagnostic episodes**.
This screen retained source identity, but did not retain every original input;
it is not a four-audit benchmark or the final swept-boundary candidate.

Each cell below is wins out of **two seed blocks at each tier**. The same result
appeared at Relaxed, Standard and Severe.

| Hero        | Immediate | Survival | Growth |
| ----------- | --------: | -------: | -----: |
| Barbarian   |       2/2 |      2/2 |    2/2 |
| Sorceress   |       2/2 |      2/2 |    1/2 |
| Necromancer |       2/2 |      2/2 |    1/2 |

There were no deaths or execution errors in this screen. Growth’s six remaining
cases were living decision-budget stops. These outcomes show differing progression
priorities but **no difficulty separation**. Two blocks do not establish population
win rates, a total strategy ordering or human difficulty.

Isolated Severe damage multipliers **3 and 5** also produced 12/12 Survival victories
across the same two development blocks and three heroes. Increasing monster HP to
**2×/3×** with the old Severe incoming multiplier produced **4/6 and 1/6 victories**;
all other cases were living budget stops. Those counterfactuals changed only their
private compiled development runtime, and are not rules-v3 replay evidence. They
suggest combat endurance affects completion cost; they do not demonstrate a
calibrated survival-risk ladder. Combining HP multipliers 2/3 with incoming damage 3 produced **2/6 victories** at each
HP level, again
with only living timeouts among the remaining cases. These diagnostics retain
metrics/provenance and selected failure tails rather than complete original inputs
or counterfactual compiled bundles. They cannot receive a four-audit or independent
confirmation status. Production native balance is unchanged.

## Trace repairs and independent review

- **Known detours:** a Barbarian waited for 2,294 combat advances while an archer shot
  across impassable terrain. Public BFS now finds reachable attack positions even
  when the first step increases straight-line distance.
- **Disclosed history:** losing sight around a detour used to reactivate an older
  frontier and reverse the route repeatedly. Factory-local last-visible alias and
  position now persist in `lastSeenFoe` diagnostics until arrival, known death or
  region change. Hidden live positions never update this memory.
- **Action-aware search:** the shortest center-grid edge can be unavailable from a
  fractional avatar footprint. BFS now restricts its first edges to the current
  public move menu before selecting a route.
- **Swept collision:** fresh Astra found a concrete hidden corner missed by 0.1-unit
  samples, with different native movement after three ticks despite equal inputs.
  The fix checks every tile in the full swept rectangle for each unit segment,
  including native axis-separated slide. It reuses the native body radius.
  Independent review checked 200 fractional starts, 1,632 offered moves,
  1,633,632 dense footprint samples and eight native ticks per paired hidden-world
  move, with **zero remaining mismatches**.
- **Finite resources:** safe native pack-sale visits free geometric pickup capacity.
  Lossless terrain runs and explicit atlas progress reduce repeated input bytes.
  Every built-in advance now stays at or below ten ticks, so 8,000 decisions cannot
  exceed 80,000 requested ticks against the native 100,000 limit.

## Recording capacity and remaining work

A main-process recording passed while the original **512 MiB worker** aborted at the
V8 heap limit after 27 seconds. This is an infrastructure failure with no game verdict.
The bounded **2,048 MiB worker** completed the real full campaign and all four audits;
process RSS peaked at **1,887,338,496 bytes**, sampled every 500 ms. Probe an actual
worker before a large cohort; multiplying JSON byte size alone underestimates heap
needed for input objects, hashing, auditing and serialization.

Fresh reserved calibration requires a settled difficulty design, fixed reference
policies, complete source/protocol/analysis freeze, a fixed seed grid and explicit
resource budget. Retain the ceiling and failed development candidates. A larger
budget or altered native pressure must receive a new declared protocol; neither
can silently convert these development outcomes into a passed confirmation.
