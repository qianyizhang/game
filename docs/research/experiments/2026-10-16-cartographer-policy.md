# Cartographer policy adoption · 2026-10-16

Cartographer now supports public-menu local policies, seedless announced-turn
forecasts and original-input rollout review. All **270 recorded episodes** finished
in victory and passed all four audits, with **zero errors/timeouts**. Saturated
outcomes leave strength ordering and a win-rate difficulty ladder unestablished.

The [game contract](../../engineering/cartographer-policy.md) owns boundaries, tiers,
metrics and extension commands. The [receipt](2026-10-16-cartographer-policy.json)
retains every case metric/digest, original protocols/summaries/paired results,
source/tool/runtime pins and report/bundle hashes. Original evidence remains under
`test-results/cartographer-policy/`.

## Frozen comparison

- **Environment:** rules v2, unchanged `rooms-1` generator; starting/max HP 48/36/28
  across Relaxed/Standard/Severe. Standard preserves v1 arithmetic/RNG. Three frozen
  historical journals and continuations match complete-state hashes.
- **Policies:** deterministic versioned Immediate, Survival and Growth, using public
  turn forecasts and public-layout BFS; no true seeded successor search. Different
  priorities affect tactical tradeoffs, chambers and relics. Work is declared candidate
  and BFS accounting, omitting sorting/helper/recording costs.
- **Design:** 10 development blocks × 9 conditions = **90 attempts**; 20 disjoint
  reserved blocks × 9 = **180 attempts**, maximum 2,000 decisions. Tiers share paired
  seeds and are not pooled as independent blocks. Sources froze before both cohorts.
- **Objective:** victory → rooms cleared including entrance → HP, with turns secondary.
  All cells clear nine rooms. No policy tuning or game rerun followed reserved results.

## Reserved results

Every cell has **20/20 wins**. Its 95% Wilson interval is approximately **83.9–100%**,
not certainty of a perfect population win rate. All nine progress means are nine.

| Tier     | Immediate mean HP / turns | Survival mean HP / turns | Growth mean HP / turns |
| -------- | ------------------------- | ------------------------ | ---------------------- |
| Relaxed  | 32.4 / 86.9               | 48.0 / 94.1              | 47.7 / 101.2           |
| Standard | 20.4 / 86.9               | 36.0 / 94.1              | 35.7 / 101.2           |
| Severe   | 12.4 / 86.9               | 28.0 / 94.1              | 27.7 / 101.2           |

**Tradeoffs:** Immediate is faster but loses more life. Survival finishes at full starting
life in every sampled case. Growth averages 6.7 attack versus 3.0 for the others,
with higher threat (13.35 versus 9.05) and more turns. These are descriptive resource
and efficiency differences; they do not establish a universal policy ranking.

**Calibration limit:** decreasing initial HP lowers remaining life without changing
sampled wins, rooms or per-policy mean turns. This cohort therefore cannot validate
a win-rate difficulty ladder. The receipt keeps all constant-sample intervals explicitly
unavailable; finite identical observations do not establish zero population uncertainty.
Paired win differences retain point estimates/discordance counts without a misleading
zero-width interval. Exploratory comparisons have no multiple-comparison correction.

## Independent audit and correction

Fresh Astra review found that the public audit CLI accepted selector `cartographer`
but rejected recorded wire identity `dungeon-cartographer`. Both frozen studies had
already passed their four in-process audit dimensions; the defect affected independent
CLI routing. The mapping is corrected and a subprocess regression exercises actual
record → audit commands.

Original protocols/reports/bundles remain unchanged. The receipt includes exact original
tool source bytes/digests and a separate corrected-CLI audit receipt. Gameplay, policies,
forecast and statistical analysis are unchanged; no reserved case was rerun. Independent
CLI audit now passes all four checks with `originalSourceMatches: true`.

Astra additionally checked all 270 original artifact digests and **30,579 original input
digests**, all six relics separately/together over **8,399 public forecasts**, and the
three pre-change state/continuation hashes. No policy/future-stream access is needed for
native replay or permitted-input reconstruction.

**Verification:** five native/policy browser journeys passed in a disposable profile,
including complete victory, original before/after knowledge, draft inspection,
storage isolation, tier/history restoration, reload, keyboard/mobile controls and save
recovery. Desktop/phone screenshots were inspected; source/test bytes matched the frozen
candidate. A local TS extension completed a native winning episode and independently passed all
four audits with `originalSourceMatches: true`. Final isolated `npm run check` passed
maintained/static/build scopes, **507 application tests across 89 files** and **37
seeded simulations across eight files**.
Geometry/native asset gates are outside this slice. Cooperative structured policies
are not hostile isolation or evidence of human-equivalent perception.
