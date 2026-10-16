# Spire strength v4 confirmation · 2026-10-16

**Both characters pass the preregistered strength and difficulty criteria, with
independent raw/native and statistical review complete.** The analyzer records
`allCriteriaPassed: true`; producer audits pass for all 5,040 attempts.

The [receipt](2026-10-16-spire-strength-confirmation-4.json) pins the exact plan,
reports, inference, bundles, 44 frozen source hashes and independent review evidence.
The [prospective protocol](2026-10-16-spire-strength-4-protocol.md),
[development findings](2026-10-16-spire-strength-development-4.md) and
[earlier failed confirmations](2026-10-16-spire-strength.md) remain unchanged.

## Fixed design and criteria

- **Population:** 400 fresh paired reserved blocks per character, separately for
  Ironclad and Silent at Ascensions **0/3/5**. Survival v4 and exact historical
  Survival v1 produce **4,800 primary attempts**. Immediate/Growth v4 contribute
  **240 companion attempts** on the first twenty identical blocks.
- **Endpoint:** victory within **2,000 decisions**, with `POLICY-STREAM-1`. Every
  budget timeout counts as a nonwin for either policy and stays in its denominator.
  The population, references and sample size were fixed before execution; no optional
  stopping or tuning on partial reserved outcomes was permitted.
- **Strength per character:** A0 Wilson lower bound above 10%, candidate improvement
  over historical A0 of at least ten percentage points, and adjusted p below 0.05.
- **Difficulty per character:** A0–A5 gap of at least ten percentage points, adjusted
  p below 0.05, and A3's point estimate between the endpoints. Four planned paired
  discordant-win tests use exact two-sided conditional binomial probabilities and
  one Holm family. Paired binary confidence intervals are unavailable.
- **Native meaning:** rules3, observation1, score `spire-progress-1`, base content3
  with digest `8192b770`. Native gameplay and replay rules were not rebalanced.
  Policy4 repairs public hand-end exposure, resource/status valuation and collection
  priorities; the historical factory is retained exactly.

## Primary results

Each cell has **400 attempted runs**, including budget stops. Intervals are
individual 95% Wilson intervals, not paired difference intervals.

| Character | Survival v4 A0                   | A3            | A5             | Historical Survival A0 | Strength adjusted p | A0–A5 adjusted p |
| --------- | -------------------------------- | ------------- | -------------- | ---------------------- | ------------------: | ---------------: |
| Ironclad  | **98/400; 24.5% [20.5–28.9%]**   | 86/400; 21.5% | 32/400; 8.0%   | 5/400; 1.25%           |          1.34×10⁻²³ |       9.90×10⁻¹¹ |
| Silent    | **135/400; 33.75% [29.3–38.5%]** | 74/400; 18.5% | 43/400; 10.75% | 43/400; 10.75%         |          3.97×10⁻¹⁵ |       1.96×10⁻¹⁵ |

**Observed gains:** Ironclad improves **23.25 percentage points** over its historical
A0 control and separates A0 from A5 by **16.5 points**. Silent improves and separates
its endpoints by **23 points**. Both useful-strength lower bounds exceed 10%, and both
A3 estimates lie between their endpoints. These satisfy the declared criteria; they
do not establish adjacent-level win-rate significance.

**Completion:** 5,033 attempts ended natively; **seven budget timeouts remain nonwins**
and there are zero execution errors. Candidate Silent accounts for three stops
(two A0, one A5); historical Ironclad accounts for four (three A0, one A3). This bounded
endpoint was declared prospectively and does not change either earlier failed
study's stricter terminal requirement.

## Matched strategy description

These are the first **twenty paired blocks only**, not the 400-block primary estimate.
Different policy work costs prevent a compute-isolated causal interpretation.

| Character / Ascension | Immediate wins | Survival wins | Growth wins |
| --------------------- | -------------: | ------------: | ----------: |
| Ironclad A0           |           0/20 |          6/20 |        2/20 |
| Ironclad A3           |           0/20 |          8/20 |        0/20 |
| Ironclad A5           |           0/20 |          3/20 |        0/20 |
| Silent A0             |           0/20 |          7/20 |        4/20 |
| Silent A3             |           0/20 |          5/20 |        3/20 |
| Silent A5             |           0/20 |          1/20 |        2/20 |

Silent Growth exceeds Survival on this small A5 subset; no universal strategy order
is claimed. Companion progress/work summaries and uncertainty remain in the receipt.

## Independent review and limits

- **Completed:** independent integer-binomial/Holm/Wilson arithmetic and summary
  checks pass; an analyzer rerun is byte-identical. Before execution, 44 source pins
  and both rebuilt bundles matched the prospective freeze.
- **Companion raw verification:** all 240 canonical digests, 81,284 input digests,
  81,524 native commands and native replay metrics/cursors pass. Twelve selected
  cases receive fresh four-part reproduction; the other 228 retain producer audits.
- **Primary raw verification:** all 4,800 canonical digests, 2,173,392 input digests
  and 2,178,192 native commands match, including replay metrics and cursors. Fifteen
  selected cases receive fresh four-part reproduction: the first recorded win and
  death per character/policy, plus all seven budget timeouts.
- **Coverage and closure:** every one of 5,040 raw artifacts and native command
  sequences is independently verified. Fresh full four-part reproductions cover
  **27/5,040**; the remaining **5,013** retain producer four-part audits. All 44 live
  and archived source pins match at final closure. The source freeze is released;
  retained evidence remains unchanged.

Local evidence is retained under `test-results/spire-strength/evaluation-4`,
`alternatives-4`, `frozen-sources-4` and `review-4`; the receipt supplies hashes without
requiring ignored paths as Markdown links.

**Selection limits:** Holm controls four tests within this study, not the adaptive
series of confirmations. Earlier failed cohorts remain failed. Representative
A0/A3/A5 levels were selected during development before the A3 probe; Ironclad's
9/40, 12/40, 3/40 development inversion was retained, not hidden or used to substitute
another middle level. These results do not order every native Ascension, establish
human-equivalent strength or human difficulty, isolate computation as a cause, or
guarantee natural campaign completion.
