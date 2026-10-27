# Policy development footguns

Use these checks with the [canonical contract](policy-development.md), game-owned
policy guides and [maintenance rules](maintenance.md#prevent-repeated-trace-mistakes).
They summarize retained failures; dated reports own the original evidence. A passing
local regression establishes its behavior, not stronger play or calibrated difficulty.

## Public information and native behavior

| Failure                                                                | Prevention                                                                                                                                   |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Duplicate combat arithmetic misses ordering, retaliation or death.     | Reuse the native deterministic resolver on an explicitly public synthetic state; cut hidden draws, randomness and private phases.            |
| Aliases are mistaken for native entity IDs.                            | Bind proposals through the observation's alias map; use accepted native commands for historical continuations.                               |
| Known destinations cross unknown footprint corners.                    | Check the complete swept body on masked terrain, including fractional starts and native axis order; vary hidden walls in paired-state tests. |
| A pathfinder starts from the cell center and misses interaction reach. | Test the first node from the actual public position; use centers only for hypothetical later nodes.                                          |
| Attack targets are treated as movement endpoints.                      | Inspect native owner priority: an in-range attack can stay stationary even on cooldown, while another owned movement can still apply.        |
| Visible casts are mistaken for damage.                                 | Follow disclosed HP across original decisions; use bounded stall memory and offered repositioning for collision corners.                     |
| A mode is assigned after generation.                                   | Set rules/sandbox identity before generation; compare full initial state, RNG and dynamic spawns against the historical environment.         |
| Save mounting or paused input release adds commands.                   | Flush changed sessions only, release active controls only, and compare untouched imported storage bytes before any new command.              |

## Control, recovery and progress

| Failure                                                       | Prevention                                                                                                                                                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Diagnostic labels are treated as behavior.                    | Assert the command and native consequence first; fallback paths can carry successful-sounding labels.                                                              |
| A safety rank protects only one movement owner.               | Inspect every command that advances time, including pursuit, damaging movement and pending advances; retain finite progress when no offered route improves safety. |
| Recovery flags fall through into offense or pursuit.          | Exercise the no-retreat branch; cancel unsafe owners before a safe hold and require stock plus an active recovery cooldown before waiting.                         |
| Conservative defense becomes permanent passivity.             | Track combat/objective progress, not elapsed ticks or reacquisition; test disclosed, offered instant finishers without ignoring other visible threats.             |
| Untimed danger envelopes rank every route equally unsafe.     | Use an explicit public time horizon; demonstrate that the comparison distinguishes a controlled native crossing.                                                   |
| A warning beyond one decision becomes unavoidable later.      | Separate forecast horizon from decision cadence; account for public stamina, slowing and alignment without claiming exact future shots, walls or enemy motion.     |
| One capped hit is described as protection from death.         | Inspect the whole advance; retain raw, applied and HP-clipped damage separately. Several impacts can still kill.                                                   |
| A recovery change misses portal entry or town ticks.          | Inspect every restoration owner and keep lawful refuge use distinct from cheating. Check dependency differences across all heroes.                                 |
| Preserved teleport geometry is described as unchanged choice. | Name the preserved property precisely: endpoint legality can remain fixed while the policy's selection changes.                                                    |

## Calibration and counterfactuals

| Failure                                                        | Prevention                                                                                                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| A correctness repair is promoted as strength.                  | Run the complete declared development gates; preserve completion regressions and the accepted baseline even when a local continuation improves.   |
| A short functional witness fails after rebalance.              | Pin its intended tier/setup and expected outcome; fix the journey separately from the frozen strength criteria.                                   |
| A weak reference is replaced after reserved outcomes.          | Select it on development, retain the failed confirmation, and require a new prospective study for later claims.                                   |
| A rebalance passes only the upper tier.                        | Check the whole ladder, strategy contrasts, completion floors and observed hard-tier playability; report these as separate requirements.          |
| Tiny timing differences masquerade as useful separation.       | Freeze material-tie tolerance and report exact and practical counts over every attempted pair. Never relax a failed threshold afterward.          |
| Living budget stops are silently counted as deaths or dropped. | Declare budget endpoints before execution, apply them to both policies, and report native completion and execution errors separately.             |
| Larger samples reuse inspected seeds.                          | Use complete new namespaces for fresh claims; increasing the block count preserves the old prefix.                                                |
| Repeated confirmations are presented as one corrected test.    | Retain each negative and state multiplicity scope. Carry forward the literal protocol/analyzer method, including sidedness.                       |
| Matched seeds are assumed to give equal later loot/routes.     | Decisions can consume seeded randomness differently. Compare whole attempts, retain per-seed reversals and avoid unsupported causal explanations. |
| Quiet time is called wasted or loot-caused.                    | Classify public control ownership first; overlapping interval counts are not counterfactual time savings or proof of a pet/combat bug.            |
| A warmed factory is described as an on-policy campaign.        | Name the original history owner, compare full proposals/diagnostics as well as commands, and label bounded branches separately.                   |

## Identity, provenance and publication

When removing forwarding exports, migrate static, dynamic and generated-entry imports.
Typed checks must pass before treating the old surface as unused.

| Failure                                                      | Prevention                                                                                                                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A wrapper imports changed behavior under its old version.    | Update delegated identities, examples and current-version tests together; run all affected policy regression and rollout tests, not only a focused selection.      |
| A rejected version is reused after rollback.                 | Its identity remains consumed. Keep its source/bundle, scores and rejection lesson; apply the iteration retention rule to bulk inputs/proposals.                   |
| Two seed namespaces share a suffix.                          | Bind the complete seed, setup, policy/configuration and artifact hash; validate the native expected outcome before dispatch.                                       |
| A primary matrix passes while companion cases are absent.    | Validate every frozen grid, budget, source pin and audit before promotion; statistics cannot override integrity.                                                   |
| Shared tools change during another game's freeze.            | Coordinate the entire pinned graph under one owner; hold it through execution, independent audit and report rendering.                                             |
| A copied helper assumes the wrong proof schema.              | Read and semantically check actual field names/types before admission: review flags, process exit and scientific verdict differ; path lists are not hash maps.     |
| Syntax checks miss invalid imports or call signatures.       | Resolve paths, run project types/lint and inspect contextual edits before applying a draft. Preserve pre-execution failures separately.                            |
| A reused output path mixes fixture/receipt generations.      | Preflight exclusive outputs, write to a fresh directory, verify the whole candidate, then publish atomically.                                                      |
| Reports verify only a curated intersection of artifact pins. | Rehash complete independent input/output, final-review and technical maps before/after rendering. Derived files need their own later closure.                      |
| Historical maps are treated as current after rollback.       | Qualify each phase: tested candidate, held experiment, published snapshot and restored working source. Keep complete same-file aliases; reject conflicting hashes. |

## Execution and resource checks

| Failure                                                  | Prevention                                                                                                                                                        |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A quiet or foreign process handle is treated as stopped. | Have its owner poll the original handle; retain actual start/terminal receipts and returned-row counts. Observation timeout alone never authorizes restart.       |
| A worker failure loses stderr.                           | Capture both streams; distinguish runtime/infrastructure failure, incomplete output and scientific nonwins.                                                       |
| Searching one-line traces exposes reserved observations. | Locate by filename and parse explicit metadata keys; record accidental exposure rather than continuing content searches.                                          |
| A main-process probe is used to promise worker capacity. | Test one actual recorded/audited worker case first. Budget encoded bytes, decoded graphs, hashing and serialization separately; heap limits are not RSS ceilings. |
| Diagnostics decode every campaign at once.               | Stream large inputs one case at a time; retain compact hashes/receipts between cases.                                                                             |
| A fresh verification clone contains LFS pointers.        | Hydrate declared assets with verified OID/length before inventory; retain infrastructure failures and rerun only the affected check.                              |

## Evidence index

- [Night Passage adoption audit](../research/experiments/2026-10-16-night-passage-rollout-review.md): original knowledge, async navigation, damaged artifacts and incomplete audit verdicts.
- [Spire findings](../research/experiments/2026-10-16-spire-strength.md): native combat projection, reference selection and failed confirmations.
- [Cartographer development](../research/experiments/2026-10-16-cartographer-strength-3.md): saturation, score interpretation and versioned pressure.
- [Emberwake contract](emberwake-policy.md#evidence-and-current-status): linked campaign, recovery, pressure and rejected-policy records.
- [Maintenance prevention rules](maintenance.md#prevent-repeated-trace-mistakes): path discovery, bounded reads, isolated candidates and generated-path provenance.
