# Emberwake native5 fresh confirmation protocol

**Prospective design: 1,170 attempts; no reserved case has executed when this protocol is authored.** The completed [D8 development](2026-10-16-emberwake-recovery-policy-8.md) selected the fixed [native5 pressure profile](2026-10-16-emberwake-pressure-5.md), policy8 and the references below. This protocol tests that frozen candidate; it does not confer a calibration pass.

## Candidate and population

| Contract                             | Frozen choice                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Rules / observation / score / policy | `emberwake-5` / `emberwake-observation-3` / `emberwake-performance-2` / `emberwake-policy-8`   |
| Content                              | Base `emberwake` 2.0.0; nine hero/tier setups                                                  |
| Heroes                               | Barbarian, Sorceress, Necromancer; separate strata                                             |
| Tiers                                | Relaxed, Standard, Severe; native5 D pressure without further tuning                           |
| Primary                              | 60 fresh blocks × 3 heroes × 3 tiers × Immediate/Survival = 1,080 attempts                     |
| Companion                            | First 10 blocks × 3 heroes × 3 tiers × Growth = 90 attempts                                    |
| Cohort                               | `EMBERWAKE-STRENGTH-5-RESERVED-01..60`; no earlier prefix is reused                            |
| Policy config                        | `POLICY-STREAM-1`, empty policy options; setup exactly `{hero,difficulty}`                     |
| Episode budget                       | 8,000 decisions; first death or victory; living stops remain nonwins                           |
| Workers                              | Actual repository casePool4, 2,048 MiB old generation per thread                               |
| Artifact                             | Gzip lossless original JSON, `.rollout.json.gzip`; encoded AND decoded limit 150,000,000 bytes |

There are 60 independent initial seed blocks per primary paired contrast within each hero, not 1,170 independent replications. The 90 Growth attempts share the first ten blocks with primary styles. Their matched three-style display covers 270 rows and is descriptive. Matched initial seeds do not force the same later rewards or encounters after different accepted commands consume seeded randomness.

## Score and primary endpoints

Official score2 is `[won,bosses,wards,regions,won ? executedTicks : 0]`, maximizing the first four components lexicographically before minimizing winning native time. A fast death or living budget stop receives no speed bonus. Official scores retain exact native ticks.

For analysis only, equally complete victories tie when `20 * abs(tA - tB) < max(tA,tB)`. Thus a sub 5% time difference is practically tied; an exact 5% difference remains directional. All other score pairs retain their exact lexicographic sign. For each matched block encode `(A materially better,B materially better)` as `(1,0)`, `(0,1)` or `(0,0)`. Report exact score counts alongside practical counts.

The same three contrasts apply separately to each hero. Their explicit per-hero selection is retained verbatim at `test-results/emberwake-strength/strength5-freeze/selection.json`, SHA-256 `1d0f7d1ecb810cf88673214d79ddc57f25927f12948e27b99e85b091dec09220`.

| Contrast         | A                 | B                  |
| ---------------- | ----------------- | ------------------ |
| Lower difficulty | Immediate Relaxed | Immediate Standard |
| Upper difficulty | Survival Standard | Survival Severe    |
| Policy strength  | Survival Standard | Immediate Standard |

All nine contrasts must satisfy BOTH:

- **Material effect:** `(A better - B better)/60 >= 0.20`, retaining every matched block and all ties in the denominator. This is a 20 percentage-point net excess of materially superior blocks, not 20% more wins or 20% faster play.
- **Statistical evidence:** two-sided exact conditional binomial sign test on discordant practical score pairs, with Holm adjustment across the complete nine-test family; adjusted p < 0.05. Ties do not enter the conditional binomial count. No paired confidence interval is invented.

Native victory counts, individual 95% Wilson intervals and paired victory-rate differences are separate descriptive outputs. They cannot substitute for the material score criteria. Multiplicity control covers these nine planned contrasts in this confirmation, not arbitrary repeated future confirmations or adaptive development.

## Absolute viability and Severe witness

- **Six primary completion gates:** for each hero, Immediate Relaxed and Survival Standard must each have a 95% Wilson lower bound strictly above 0.50, with n = 60. Living stops remain nonwins.
- **Three Severe existence gates:** for each hero, at least one fully audited native Severe victory must occur among its 60 Survival and 10 Growth attempts. This is observed existence, not a lower bound on Severe population win probability or human playability.
- **Companions:** all 90 Growth attempts must complete the execution/audit protocol; timeouts remain valid native nonwins. No universal Immediate/Survival/Growth strength ordering is asserted.

## Integrity and evidence gates

Before case1, retain BOTH primary and companion protocols and exact case grids, the selection, compiled bundle, plan, producer, complete transitive native/tool/analysis source bytes and hashes, protocol source, immutable v2/v3/v4 fixtures, and completed current5 resource/continuity proof. Source versions, references, criteria, budgets, stream and container limits remain fixed throughout both matrices. A source hash is identity evidence, not by itself proof that a native continuity or resource gate passed.

Current5 preflight already runs four concurrent independently executed copies of one consumed 8,000-decision case, plus a distinct Severe worker witness. All five pass integrity, native replay, original-input and decision audits; four duplicate stress outputs are not independent population samples. The actual old-generation setting is 2 GiB per worker. Sampled RSS is process-wide and may miss peaks; it is not a hard RSS ceiling or isolated throughput claim.

Each study rollout retains every original structured policy input, selected proposal/work, accepted native command linkage, final metrics/cursor and accepted native replay. Reconstruct the final native state from that journal; do not describe a reconstructed state as an originally saved policy input. Every attempted case must have all four audit dimensions passed. The full grid, matching setup/seed/options/stream, finite metrics/work, current identities, original encoded/decoded bytes, filenames, hashes and exact source-pin set must validate. Check source graphs before and after execution and analysis. Incomplete matrices, execution errors, unavailable/failed audits or drift block promotion; do not reinterpret them as ordinary policy losses. Preserve all attempted errors, deaths and living budget stops.

Fresh independent Astra review will verify raw encoded/decoded artifacts and metadata, original-input/native linkage and outcomes, pinned factory reproduction evidence and exact statistical calculations. It must examine original artifacts in addition to reported audit flags. Record what is independently rerun versus verified through identical bytes or pinned receipts. Source/byte audits do not establish hostile-code isolation, equal compute, human perception or human difficulty.

## Freeze, execution and closeout

The producer has separate preparation and execution phases. Preparation publishes both protocols and all provenance before dispatch; execution requires the root's explicit completed-gate handshake. Use fresh output directories and exclusive writes. The primary 1,080 attempts run before the 90 companion attempts, using the same frozen graph. Retain source closures and negative outcomes even if any criterion fails. No reference changes, seed substitution, policy/rule tuning, budget increase, cap increase or unreported retry is permitted after reserved inspection.

Pass requires the complete integrity grid, all nine material/statistical contrasts, all six completion gates and all three Severe existence gates. If it fails, preserve this result and report the failed criterion. Any later design uses a new prospectively frozen namespace and discloses the preceding result; enlarging this prefix is not fresh confirmation. After final independent review, fix supported issues, polish, verify and make a scoped commit without pushing.
