# Spire strength and Ascension calibration · 2026-10-16

**Strength improved and difficulty endpoints separated, but promotion failed.**
Silent Survival passes the preregistered statistical criteria. Ironclad Survival
improves over the historical control but misses the useful-strength confidence
threshold. Three historical-control timeouts also fail the whole-study terminal
requirement. These remain failed confirmations, not completed calibration.

The [receipt](2026-10-16-spire-strength.json) retains protocols, exact source pins,
report hashes, inferential results and complete descriptive matrices. Original
[adoption evidence](2026-10-16-spire-policy.md) remains unchanged.

## Implemented behavior

- **Public-hand planning:** Survival and Growth use a depth-five, width-twelve beam
  over visible cards and current public intents. Replanning follows every actual
  command; uncertain draws, choices and hidden phases stop modeled branches.
- **Native effect order:** a synthetic public-only state reuses deterministic native
  card resolution. It receives fixed placeholder private fields, never the true
  seed/RNG, draw order, encounter schedule or AI history. Boundary substitutions
  produce identical policy decisions.
- **Collection and routes:** value scaling, efficient cards, energy relics and deck
  redundancy; inspect three connected future rows of public node kinds and heal
  appropriately at low HP. Work counts include beam candidate evaluations.
- **Persistent defenses:** v3 corrects a traced Spheric Guardian stall. The frozen
  v2 policy loses the complete regression after **44 decisions**; v3 wins after
  **13**, retaining **40 HP**. A broader boss-pressure development experiment was
  rejected and is absent from the frozen v3 policy.
- **Replay inspection:** real complete win/loss traces exposed a narrow-phone
  overflow from a late location label. Flex labels now shrink correctly; original
  knowledge, before/after boundaries and exact downloads remain inspectable.

Rules v3, ordinary replay, observations, scoring and difficulty arithmetic are unchanged.

## First confirmation: failed reference selection

The [first prospective protocol](2026-10-16-spire-strength-protocol.md) selected
Ironclad Growth and Silent Survival from ten development blocks, then tested sixty
fresh reserved blocks across six conditions and four policies: **1,440 attempts**.
All were terminal with four passing audits. Ironclad Growth won **6/60** at A0 versus
its historical counterpart's **2/60**, then **3/60** at A2 and **0/60** at A5. Its
strength and difficulty tests failed after correction. Silent Survival passed its
statistical tests: **20/60**, **14/60**, **4/60**, versus historical A0 **4/60**.

The alternative Ironclad Survival's 11/60 A0 wins informed further development;
it cannot replace the frozen first reference. The complete failed result and exact
42-file source snapshot remain under `test-results/spire-strength/evaluation-1`
and `frozen-sources-2`.

## Follow-up: stronger policies, incomplete promotion

The [follow-up protocol](2026-10-16-spire-strength-3-protocol.md) fixes Survival for
both characters before execution. A new namespace supplies **100 independent paired
seed blocks** at Ascensions 0/2/5. Survival v3 and exact historical Survival v1 produce
**1,200 primary cases**. Immediate/Growth v3 supply **240 companion cases** on the first
twenty matched blocks. Each attempt has a 2,000-decision budget and POLICY-STREAM-1.
All 42 frozen pins were independently verified before execution and remained unchanged.

| Character | Survival v3 A0, 95% Wilson interval | A2     | A5    | Historical Survival A0 | Strength adjusted p | A0–A5 adjusted p |
| --------- | ----------------------------------- | ------ | ----- | ---------------------- | ------------------- | ---------------- |
| Ironclad  | **12/100; 7.0–19.8%**               | 8/100  | 2/100 | 0/100                  | 0.000977            | 0.00635          |
| Silent    | **35/100; 26.4–44.7%**              | 25/100 | 5/100 | 11/100                 | 0.000116            | 0.00000000745    |

The four planned paired binary contrasts use exact conditional binomial tests and
Holm correction as one family. Both observed difficulty curves are ordered and
both endpoint contrasts meet the ten-percentage-point threshold. Ironclad's strength
gain is twelve points, but its A0 Wilson lower bound is **7.0%**, below the required
**greater than 10%**. Statistical improvement does not satisfy that absolute strength
criterion. Silent meets both statistical criteria; overall promotion remains false.

**Integrity limit:** all 1,440 follow-up cases passed four audits with zero execution
errors. All 600 v3 primary cases and all 240 companion cases were terminal. Of the
600 historical-control cases, **three timed out**: Ironclad A5/block20, Ironclad A0/block35,
and Silent A0/block41. All attempted cases remain in denominators. The prospective
zero-timeout requirement therefore fails; the frozen analyzer records
`integrity: false` and `allCriteriaPassed: false`.

### Matched strategy comparisons

These are **twenty-block descriptive comparisons**, not the hundred-block primary
calibration. Wins below use exactly the same first twenty seeds and conditions.

| Character / Ascension | Immediate | Survival | Growth |
| --------------------- | --------- | -------- | ------ |
| Ironclad A0           | 0/20      | 2/20     | 1/20   |
| Ironclad A2           | 0/20      | 1/20     | 3/20   |
| Ironclad A5           | 0/20      | 0/20     | 0/20   |
| Silent A0             | 0/20      | 10/20    | 4/20   |
| Silent A2             | 0/20      | 4/20     | 1/20   |
| Silent A5             | 0/20      | 1/20     | 0/20   |

The receipt retains Wilson intervals, progress, paired results and work. Strategies
are distinguishable priorities, with no total strength order. Their work differs;
this compares full implementations rather than an equal-compute search effect.
Paired binary intervals remain unavailable. Adjacent difficulty significance and
human-equivalent playing strength are not claimed.

## Verification and recovery

- **Code:** isolated owned candidate passes maintenance, formatting, lint/types,
  production builds, **513 application tests / 89 files**, and **37 seeded simulations /
  8 files**. No geometry change is involved.
- **Browser:** two actual v3 complete development win/loss journeys pass original-input
  inspection, late before/after navigation, evaluator opt-in, byte-exact download and
  390px overflow checks. The maintained late-label regression also passes. These are
  technical inspector checks, not human gameplay acceptance.
- **Independent audit:** fresh Astra verifies the deterministic public model, the
  Guardian old/new witness, exact test arithmetic, frozen sources, complete matrices,
  retained raw artifacts and matching calculations. The follow-up audit checks all
  **1,440 payloads and 632,853 decisions**, reproduces the frozen inference exactly,
  and freshly audits eleven retained-bundle cases, including every control timeout.
  Review findings and fixes are
  promoted into the [canonical guide](../../engineering/policy-development.md).
- **Recovery:** protected directories `test-results/spire-strength/evaluation-1`,
  `evaluation-2` and `alternatives-2` retain reports, protocols, every original rollout,
  replay/audit linkage and compiled bundles. `frozen-sources-2` and `frozen-sources-3`
  retain exact historical source/tool/module bytes. Plan and artifact hashes are in
  the receipt; fresh output paths are required for reproduction.

**Next:** continue Spire development before Emberwake. Diagnose Ironclad's boss-fight
failures and freeze another candidate on genuinely fresh cases. The failed criteria
and control timeouts remain visible; later studies cannot retroactively pass these
protocols or count their consumed seeds as reserved evidence.
