# Dungeon Cartographer v3 strength development

**Development candidate ready for independent review; reserved confirmation not yet
run.** Rules v3 replace an HP-only ladder with visible encounter pressure and
resources. Policy v2 uses permitted combat history to avoid repeated safe movement
without progress. Exact historical v1/v2 native replay and continuation witnesses
remain supported.

## Why the earlier ladder saturated

The [initial adoption study](2026-10-16-cartographer-policy.md) recorded 270 wins in
270 attempts across three policies and all tiers. Survival finished at full HP on
every tier. A lone King could be repeatedly shoved to cancel its entire announced
attack. Changing starting/max HP alone did not challenge this strategy.

The approved change is a versioned balance ladder, including Standard. Current
[combat profiles and historical behavior](../../engineering/cartographer-policy.md)
own the shipped arithmetic. v3 adds simultaneous room enemies and King's guards,
more durable opponents, greater announced hit damage, and tiered brace/healing.
It retains the ordinary moves, strikes, shoves, flares, room drafting and relic
choices, nine-room objective, generator and seeded stream names.

## Trace findings and policy repair

A denser encounter exposed a genuine policy defect: Survival alternated between two
positions with unchanged enemy life for almost 2,000 decisions. One position avoided
two marked attacks; moving back prevented approaching enemies from entering that
square. The one-turn value repeatedly preferred the same locally safe cycle.

All three priorities now count previously observed combat positions and living
enemy HP/coordinates. A bounded revisit penalty favors a different route or actual
damage when movement repeats without progress. Lethal outcomes retain their explicit
rejection value. Memory resets for every episode; it contains no environment seed,
inactive foes or unannounced future intent. Draft values also use the effective
healing amount. The shared native `incomingHit` helper keeps announced forecast and
native shell/brace accounting aligned.

Near-death bomber positions can still have no safe attack under these policies.
Those living budget stops remain negative evidence. Revisit penalties do not grant
extra resources or turn timeouts into victories.

## Development selection

All cohorts below use `CARTOGRAPHER-STRENGTH-3-DEV` labels and a 2,000-decision budget.
They are development data, reused intentionally while selecting a candidate; they
are not reserved confirmation or independent repetitions of the same comparison.
Original source-pinned reports, raw inputs, outputs, audits and bundles remain in
`test-results/cartographer-strength/development-1` through `development-4`.

| Candidate     | Independent DEV blocks | Main change                                        | Survival wins: Relaxed / Standard / Severe | Living budget stops, all policies |
| ------------- | ---------------------: | -------------------------------------------------- | ------------------------------------------ | --------------------------------: |
| Development 1 |                     10 | First group/defense ladder; policy v1              | 10 / 9 / 3                                 |                           11 / 90 |
| Development 2 |                     10 | Public combat-history memory for every priority    | 10 / 9 / 4                                 |                            3 / 90 |
| Development 3 |                     40 | Standard extra enemies increased from one to two   | 40 / 39 / 14                               |                          12 / 360 |
| Development 4 |                     40 | Standard enemy HP bonus increased from two to four | 40 / 30 / 14                               |                          24 / 360 |

Every reported attempt passed all four rollout audits, with zero execution errors.
The complete final development matrix is:

| Tier     | Immediate wins / 40 | Survival wins / 40 | Growth wins / 40 | Living budget stops: Immediate / Survival / Growth |
| -------- | ------------------: | -----------------: | ---------------: | -------------------------------------------------- |
| Relaxed  |                  40 |                 40 |               40 | 0 / 0 / 0                                          |
| Standard |                   9 |                 30 |               13 | 7 / 2 / 5                                          |
| Severe   |                   1 |                 14 |                0 | 5 / 2 / 3                                          |

The selected reference Survival has development win rates **100%, 75%, 35%** across
the ladder. Severe Survival exceeds Immediate by **32.5 percentage points** on these
40 development blocks. Selection on these outcomes makes the figures optimistic;
the [prospective confirmation protocol](2026-10-16-cartographer-strength-3-protocol.md)
fixes the reference, three contrasts, absolute playability checks and 100 fresh
reserved blocks before any reserved play.

## Historical evidence and limits

The original v1 continuity fixture remains unchanged. A new v2 fixture contains six
complete expeditions (two seeds crossed with all three old tiers), exact state and
prefix hashes, and native-command continuation hashes. Complete/prefix witnesses
were captured before the rebalance. Continuation witnesses were checked against an
exact Git archive of native code at `35c0ea1`, retaining its source digests.

A capture footgun required correction before acceptance: policy target aliases are
not native journal IDs. Passing an unbound proposal to native dispatch can target a
different enemy or reject silently. The accepted fixture uses the next accepted
command from each original native journal and checks rejection explicitly; the
original faulty capture remains in the protected session evidence. No expected
historical state digest was produced by the modified native resolver.

v1/v2 journals retain exact native reconstruction, continued play, replay seeking,
export and independent storage. The current rollout identity explicitly differs
from old rules/observation identities; reproducing an old policy study requires its
retained original runtime rather than silently reinterpreting its inputs as v3.

Focused native checks protect historical reconstruction/continuation, resource
accounting, original-input detachment and fairness, accepted commands, six announced
forecast journeys across tiers, and the observed two-position cycle. Browser checks
cover old save restoration, continued play, reload and exact exports beside a v3
save. Required isolated whole-repository gates and independent review are reported
at closeout; development wins alone establish neither those gates nor human playability.
