# Emberwake policy adoption · 2026-10-16

Emberwake now supports restricted campaign policies, first-death attempts, local TS
extensions and original-input replay review. All **810 recorded cases** passed four
audits with **zero execution errors**. There were **29 first deaths and 781 living
timeouts**, with no campaign victories: these are bounded progression baselines.

The [game contract](../../engineering/emberwake-policy.md) owns information boundaries,
controls, difficulty, native cursor and extension commands. The [receipt](2026-10-16-emberwake-policy.json)
retains all case metrics/digests, original protocols/summaries/paired comparisons,
source/tool/runtime pins, report/bundle hashes and independent extension evidence.
Original rollouts and bundles remain under `test-results/emberwake-policy/`.

## Frozen comparison

- **Environment:** base campaign, three heroes and incoming hostile damage scales
  0.75/1/1.3 for Relaxed/Standard/Severe. Rules v3 preserve Standard arithmetic,
  map/RNG/rewards; historical v2 replay/continuation stays supported with a separate
  save slot. Sandbox and ordinary respawns retain their existing behavior.
- **Policies:** Immediate damage/direct objectives, Survival protection/positioning,
  Growth loot/upgrades. They reason from masked known terrain, visible actors and
  public atlas topology, with stable first-seen aliases. No hidden map path search.
  Native target following and zero-tick portal healing are declared ordinary controls.
- **Design:** 10 development blocks × 27 conditions = **270 attempts**; 20 disjoint
  reserved blocks × 27 = **540 attempts**. Sources froze after development control
  probes and before either canonical cohort. The cohorts ran concurrently; no
  reserved outcome was used for tuning or a game rerun. Heroes remain separate strata.
- **Budget:** 4,000 policy decisions. Built-ins advance at most twenty requested ticks
  per decision, keeping the study below the native 100,000 requested-tick import cap.
  Living budget stops remain timeouts, not deaths or losses. Work counts declared
  action/entity/path/goal evaluations, excluding sorting/helper/recording costs.
- **Ranking:** victory → bosses defeated → wards lit → distinct regions visited.
  Encoded progress is `10000*bosses+100*wards+regions` for this fixed four-act/twenty-region
  content. HP, XP/level and executed ticks remain separate. Act number alone can regress
  when visiting an earlier chapter and is not used as progress.

## Reserved results

Each cell contains **20 attempts**. Entries are **mean bosses / wards / regions ·
first deaths**. All remaining cases are living timeouts; there are no victories.

| Hero / tier          | Immediate              | Survival               | Growth                 |
| -------------------- | ---------------------- | ---------------------- | ---------------------- |
| Barbarian Relaxed    | 0.65 / 1.80 / 5.35 · 2 | 0.65 / 1.80 / 5.35 · 2 | 0.65 / 1.80 / 5.45 · 1 |
| Barbarian Standard   | 0.65 / 1.80 / 5.35 · 4 | 0.65 / 1.80 / 5.35 · 3 | 0.65 / 1.80 / 5.45 · 2 |
| Barbarian Severe     | 0.65 / 1.80 / 5.35 · 4 | 0.65 / 1.80 / 5.35 · 4 | 0.65 / 1.80 / 5.45 · 2 |
| Sorceress Relaxed    | 1.00 / 2.30 / 7.10 · 0 | 1.00 / 2.30 / 7.15 · 0 | 0.90 / 2.20 / 6.60 · 0 |
| Sorceress Standard   | 1.00 / 2.30 / 7.10 · 0 | 1.00 / 2.30 / 7.15 · 0 | 0.90 / 2.20 / 6.60 · 0 |
| Sorceress Severe     | 1.00 / 2.30 / 7.10 · 0 | 1.00 / 2.30 / 7.15 · 0 | 0.90 / 2.20 / 6.60 · 0 |
| Necromancer Relaxed  | 1.00 / 2.50 / 7.45 · 0 | 1.00 / 2.75 / 7.60 · 0 | 0.95 / 2.25 / 6.75 · 0 |
| Necromancer Standard | 1.00 / 2.50 / 7.45 · 0 | 1.00 / 2.75 / 7.55 · 0 | 0.95 / 2.25 / 6.75 · 0 |
| Necromancer Severe   | 1.00 / 2.50 / 7.45 · 0 | 1.00 / 2.75 / 7.55 · 0 | 0.95 / 2.25 / 6.75 · 0 |

**Uncertainty:** reserved evaluation has **24 first deaths and 516 timeouts**. All
27 cells have 0/20 victories; their individual Wilson win intervals are approximately
0–16%, not proof of zero population win probability. Only **3/27** exploratory paired
encoded-progress intervals exclude zero; no multiple-comparison adjustment was applied.
Paired binary and constant-sample intervals remain explicitly unavailable where the
analyzer cannot justify them.

**Counterexamples and limits:** harder tiers change damage/survival but barely change
coarse progress within this budget. Growth reaches fewer bosses/regions for the ranged
heroes despite its investment priority; Survival is not universally stronger. Many
living attempts may need a larger budget or better routing to complete the campaign.
These results do not validate a campaign win-rate ladder, strong full-campaign play,
human-equivalent perception or enjoyment. Future tuning needs new policy identities,
development and fresh reserved cohorts.

## Trace findings and prevention

- **Hidden footprint oracle:** fresh Astra found leap eligibility depended on an
  unrevealed neighboring tile. Leap/movement checks now use masked terrain; unknown
  footprint cells block eligibility. A paired natural-reveal shadow fixture proves
  hidden floor/wall changes cannot alter public input or the action menu.
- **Navigation/loot loops:** development traces exposed out-of-reach attack waiting,
  full-inventory collection, competing frontiers and loot routes crossing acquisition
  radius. Use public approach routes, geometric free capacity and retained goals;
  acquisition radius does not cancel an already selected reachable goal.
- **Time and history:** adjacent advances pack in native replay. Requested units can
  exceed executed time when death truncates a command. Public own-history limits stop
  unreplayable tick spans; no synthetic terminal result is introduced. Original alias
  history comes from retained decision inputs, not an arbitrary replay prefix.
- **Passive seeking:** authoritative checkpoints every 128 packed commands preserve
  native prefix state, backward seeks, partial advances, terminal padding, replay-byte
  changes and campaign-only rejection. They accelerate presentation without replacing
  original knowledge. The initial optimization's sandbox guard omission was caught
  and corrected during Astra review.

## Extension and verification

A separate maintained TS extension deliberately exposes itself to visible danger.
It reaches first death through **18 legal public-menu decisions**, with **767 executed
ticks versus cursor 802**. Independent CLI audit passes all four dimensions with
`originalSourceMatches: true`; without its factory, policy reproduction is unavailable
while integrity/replay/inputs pass. This proves terminal integration and is excluded
from strength cohorts.

A real **92,709,740-byte, 4,000-decision** artifact opened and audited in about 5.8 seconds;
late before/after navigation took about 2.0 seconds. Native checkpoint indexing reduced
the two late seeks to about **0.49 seconds**, with about 6.0-second loading/audit. These
are indicative local disposable-Chrome measurements under concurrent study execution,
not a latency guarantee. The browser checked exact original decision-4,000 knowledge,
hidden evaluator state and passive rendering.

Final isolated `npm run check` passes maintained/static/build scopes, **494 application
tests across 86 files** and **37 seeded simulations across eight files**. Nine initial
native/policy browser journeys passed, followed by two final history/phone review
journeys and full-rollout inspection. Desktop/phone screenshots were inspected.
Three pre-change v2 journeys and continuations match full-state hashes; Standard
matches historical arithmetic. Geometry/native asset gates are outside this slice.

Fresh Astra review covers the source, footprint/checkpoint corrections, native history,
original knowledge, independent first-death extension and frozen study evidence. The
boundary assumes cooperative in-process code; hostile isolation is not claimed.
