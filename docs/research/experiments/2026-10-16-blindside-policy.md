# Blindside policy adoption · 2026-10-16

Blindside now supports observation-only policy extensions, three real selectable
target tiers and replay-linked inspection of original policy knowledge. In twenty
reserved environment-seed blocks, Growth won **14/20 Standard runs**, compared with
Immediate **3/20** and Survival **5/20**. This is a bounded local comparison, not a
universal policy ranking or a human-difficulty assessment.

The [game contract](../../engineering/blindside-agent.md) owns APIs, information limits,
score/difficulty semantics, extension and review commands. The [receipt](2026-10-16-blindside-policy.json)
retains complete case metrics/digests, summaries, original protocols, actual source/tool/
runtime/bundle identities and report hashes. Original full rollouts/audits/bundles remain
protected under `test-results/blindside-policy/`.

## Frozen design

- **Environment:** Blindside rules v5; base content pinned in the receipt; one standard
  deck/setup. Relaxed/Standard/Severe scale final blind targets by .75/1/1.35. Other
  rules/resources/RNG consumption stay unchanged. Standard retains v4 gameplay.
- **Policies:** `blindside-policy-1` Immediate, Survival and Growth; identical formulas
  throughout development/evaluation. Policies see public structured cards/resources/
  offers and current boss, never private environment seed/RNG/future order/bosses.
  Each policy resets memory and uses independent stream `POLICY-STREAM-1`.
- **Cohorts:** 10 development seed blocks × 9 policy/tier conditions = **90 attempts**;
  20 disjoint reserved blocks × 9 = **180 attempts**. One environment seed is paired
  across conditions. Maximum 2,000 policy decisions per attempt, held fixed.
- **Native objective:** wins, then stages passed plus current score fraction, then cash.
  Report cleared/skipped/passed separately; round score is not cumulative. Work counts
  explicit public score candidate evaluations, omitting other bookkeeping.
- **Uncertainty:** unadjusted 95% Wilson intervals for evaluation win rates; Student t
  intervals over independent seed blocks for mean/paired progress. Progress intervals
  are descriptive and not clipped to the bounded metric. No multiplicity-adjusted
  significance or ordering of every pair is claimed.

**Protocol prose correction:** the original frozen CLI protocol says “blinds-cleared”
in its ranking string. Implemented/measured progress always counted **stages passed
(cleared or skipped)**, matching the pre-evaluation game contract and separate case
metrics. The reviewer found this wording error; original protocols remain unchanged.
Future protocol prose is corrected. No score or attempted case was recalculated.

The recorder gained a finite per-decision work bound and win-rate interval reporting
between development and evaluation. After evaluation, import row/result validation and
CLI policy-ID validation were hardened. These change evidence tooling, not policy/game
behavior. Original pins also include a generated temporary entry path because macOS canonicalized
`/var` to `/private/var`; that entry has since been deleted. The retained compiled bundle
is available, but source-set equality is unavailable for those historical reports. Future
pins exclude the generated entry by canonical path. Each measured bundle and source pin remains original; new audits use current
code and are labeled separately.

## Reserved results

Each cell has **20 attempts**, all terminal. All **180 audits** passed integrity,
accepted-command reconstruction, permitted-input reconstruction and matching-policy
reproduction. There were **zero errors and zero timeouts** in both cohorts.

| Tier     | Immediate wins (95% interval) | Survival wins (95% interval) | Growth wins (95% interval) |
| -------- | ----------------------------- | ---------------------------- | -------------------------- |
| Relaxed  | 6/20 · 30% (15–52%)           | 14/20 · 70% (48–85%)         | 17/20 · 85% (64–95%)       |
| Standard | 3/20 · 15% (5–36%)            | 5/20 · 25% (11–47%)          | 14/20 · 70% (48–85%)       |
| Severe   | 1/20 · 5% (1–24%)             | 5/20 · 25% (11–47%)          | 11/20 · 55% (34–74%)       |

| Tier     | Immediate mean progress | Survival mean progress | Growth mean progress |
| -------- | ----------------------- | ---------------------- | -------------------- |
| Relaxed  | 22.69                   | 23.57                  | 22.91                |
| Standard | 19.61                   | 20.42                  | 21.46                |
| Severe   | 18.14                   | 20.65                  | 21.03                |

**Counterexamples and uncertainty:** Growth wins more often but sometimes loses early;
its Relaxed mean progress is below Survival. All nine paired progress intervals include
zero. Survival won 5/20 at both Standard and Severe, with slightly higher mean progress
on Severe; this adaptive policy/game interaction prevents a per-policy monotonicity
claim. Immediate and Growth win counts fall across tiers; target pressure is real,
but these small cohorts do not establish a precise human difficulty ladder. The receipt
contains individual cases and full intervals rather than hiding these exceptions.

**Development:** Immediate wins 3/10, 2/10, 1/10; Survival 6/10, 4/10, 3/10; Growth
10/10, 8/10, 7/10 across Relaxed/Standard/Severe. No policy tuning followed these results.
Observed reserved win separation is useful for policy development; close comparisons
and progress ordering remain uncertain. Future improvements require a new version,
new protocol and fresh evaluation cases.

## Mechanisms and evidence

- **Extension:** game-owned `PolicyFactory<Observation, Command>`, fixed evaluator
  setup and independent policy stream; a local TS module runs without rules/loop edits.
  The example completes an ordinary episode and independently reconstructs/audits.
  It adds private decision-count memory/diagnostics to Immediate actions, not a fourth
  strength claim.
- **Original evidence:** input is detached and retained before policy invocation;
  raw proposal/work/diagnostics, exceptions/rejections, accepted-command spans, metrics,
  replay and source identities are recorded. Audit applies recorded proposals without rerunning the policy, then independently
  decodes the delivered accepted-command replay. A rehashed hidden-field injection fails input audit;
  reduced-budget claims fail reconstruction. Incomplete checks stay unavailable.
- **Review:** isolated multi-file browser reviewer, filters/config-separated groups,
  shared first/previous/next/last/numbered navigation, phase markers, play/speed and
  before/after table. Original knowledge/proposal is default, evaluator state explicit.
  Exact original downloads survive unavailable playback; import races cannot replace
  newer selections. The shared decision navigator also serves Night Passage.
- **Historical continuity:** both existing v4 fixture bytes and reconstructed-state
  hashes match their captured baseline. Import, prefix seeking, accepted continuation,
  practice branching and evidence metadata use the original environment. New v5 saves
  preserve the original v4 local slot, with explicit restore.

## Review and verification

A fresh Astra reviewer audited this slice against foundation commit `b066d07` and
reported no remaining material findings after fixes. Independent checks covered all
270 rollout/input digests, result metrics, retained audit/protocol provenance, compact
receipt case fields and artifact hashes; three current-runtime reserved success/failure
audits passed all four verdicts. Repeated unchanged bundles now have identical pins.
The review fixed malformed result metadata crashing inspection, unstable generated
entry pins and protocol wording. Full-gate regression failures also exposed implicit
historical Hearth helpers using current codecs: strict original-version dispatch fixes
that coupling while preserving current decoder rejection and frozen study results.

**Browser:** 25 integration journeys plus final three focused journeys pass. These cover historical replay/practice imports, normal game lifecycle,
Night Passage reused navigation and complete victory, plus original-byte downloads,
damaged artifacts, asynchronous import races, isolated save access and phone layout.
Desktop and 390-pixel screenshots were inspected. **Final gate:** `npm run check` passes maintained/static checks, **452 application
tests across 76 files** and **37 seeded simulation tests across eight files**. Geometry/native
asset checks are outside this slice; renderer/authoring pipelines were not changed.

Fairness remains a cooperative in-process contract: trusted local code could import
privileged modules. Reconstructed inputs and reviewed dependencies are evidence of the
declared boundary, not proof of hostile-code isolation. These policies use structured
public information and exact score forecasts beyond human mental arithmetic. Their
performance does not establish human play quality or general playing strength.
