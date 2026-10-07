# Hearth recruitment v2: upgrade cadence and replacement spending

**Earlier upgrades improve Tempo in these reserved cohorts; retain Classic as the default.** Against seven Classic bots, upgrading Tempo averaged **5.0500** versus frozen Tempo's **6.4000**, while the Classic reference averaged **4.6000**. Against hidden Mixed Rivals, the corresponding means were **4.2750**, **5.8000** and **3.6250**. Lower placement is better. The replacement-spending intervention added little; it was exercised infrequently.

The implementation provides two independent policy interventions, a replay decision explorer, and a source-pinned run/audit harness. This is a measured improvement to an experimental controller, not a general competitive-strength or human-enjoyment claim. No default, v1 policy bytes, game content, rules version or save format changed.

## Frozen design

- **Implementation:** `f85353fc12603f0b3ca5266d2a620428eba6444e`, arena envelope v1 / Hearth rules v5. SHA-pinned v1 controls and all three v2 variants were frozen before development. No tuning followed either cohort's outcomes.
- **Factors:** earlier upgrade cadence; or, with two gold, a full board and empty hand, sell the weakest unit to afford an improving shop offer. A 2×2 Tempo factorial includes neither, each alone and both. Classic is a fifth reference policy. The [protocol](../hearth-recruitment-v2.md) defines all eligibility, priority and safety guards.
- **Cohorts:** **400 development + 800 separately reserved lobbies**. Each has five seed blocks, one per hero, rotating the complete focal/rival roster through all eight seats. Development uses hidden labels; reserved evaluation crosses hidden/disclosed focal labels. Rivals always receive hidden labels. Fresh seed namespaces and complete case grids were written before play.
- **Population:** seven `baseline-v1` controllers or the established two Tempo / two Economy / two Composition / one Classic roster. Both populations use the same explicit eight-seat arena and rival hero assignments. “Classic bots” here does not mean the separate Classic-mode engine.
- **Information:** policies receive only detached per-seat frames. The evaluator can always inspect identity; policy disclosure is independent. Private environment seed/RNG, pool counts and current rival private states never enter a frame. Inspector alternatives see the same recorded public input and do not simulate future outcomes.
- **Inference:** **five seed-block means** per population/visibility, with eight correlated seat rotations each. Heroes are balanced, but hero and seed are confounded within each cohort. No separate hero effect is identified. Visibility-negative-control repeats are not additional independent strength evidence.
- **Budget:** 6,000 accepted commands per lobby, zero search simulations or provider calls, two workers with 512 MiB heap limits. Full lobbies resolve all eight placements. Whole blocks fail comparison on missing, duplicate, unsuccessful, unverified or mismatched cases.

The [machine-readable evidence](2026-10-04-hearth-recruitment-v2.json) includes full manifests, source/bundle/configuration hashes, every run's outcomes and metrics, and audit hashes. Concurrent artwork changes were recorded in workspace status but excluded from the headless dependency graph and these commits. **No pinned file changed during either cohort.**

## Reserved results

Every cell below contains **40 completed / 40 attempted lobbies**, drawn from five seed blocks. Mean placement:

| Rival population / labels  | Classic reference | Tempo v1 | Upgrade only | Spending only |   Both |
| -------------------------- | ----------------: | -------: | -----------: | ------------: | -----: |
| 7 Classic bots / hidden    |            4.6000 |   6.4000 |       5.0500 |        6.4000 | 5.0500 |
| 7 Classic bots / disclosed |            4.6000 |   6.4000 |       5.0500 |        6.4000 | 5.0500 |
| Mixed Rivals / hidden      |            3.6250 |   5.8000 |       4.2750 |        5.6000 | 4.2000 |
| Mixed Rivals / disclosed   |            3.6250 |   5.7000 |       4.4000 |        5.5000 | 4.3500 |

First-place count · top-four count:

| Rival population / labels  | Classic reference |     Tempo v1 | Upgrade only | Spending only |         Both |
| -------------------------- | ----------------: | -----------: | -----------: | ------------: | -----------: |
| 7 Classic bots / hidden    |      3/40 · 21/40 |  0/40 · 5/40 | 0/40 · 16/40 |   0/40 · 4/40 | 0/40 · 15/40 |
| 7 Classic bots / disclosed |      3/40 · 21/40 |  0/40 · 5/40 | 0/40 · 16/40 |   0/40 · 4/40 | 0/40 · 15/40 |
| Mixed Rivals / hidden      |     10/40 · 28/40 | 0/40 · 10/40 | 2/40 · 24/40 |  0/40 · 13/40 | 2/40 · 24/40 |
| Mixed Rivals / disclosed   |     10/40 · 28/40 | 0/40 · 11/40 | 2/40 · 23/40 |  0/40 · 14/40 | 2/40 · 23/40 |

The upgrade-only change improved over Tempo in **all five reserved blocks** under hidden labels in both populations. Under disclosed Mixed Rivals it improved four blocks and tied one. Its mean improvement versus Tempo was **1.3500 places (SE 0.1601)** against Classic bots and **1.5250 (SE 0.4337)** against hidden Mixed Rivals.

**Remaining gap:** upgrade-only trailed the Classic reference by **0.4500 places (SE 0.3742)** against Classic bots and **0.6500 (SE 0.2107)** against hidden Mixed Rivals. Both interventions together still trailed by **0.4500 (SE 0.3391)** and **0.5750 (SE 0.2000)**. These small-cohort estimates do not justify promoting a new default.

**Counterexample:** Both v2 beat the Classic reference in the Oathkeeper seed block by 0.8750 places against Classic bots and 0.1250 against Mixed Rivals; it lost the other four blocks. One seed per hero cannot distinguish a hero-specific advantage from seed variation.

## Factorial effects and disclosure

Positive effects mean improved (lower) placement. Each main effect averages its two paired comparisons with the other factor off/on. Interaction is upgrade-only + spending-only − Tempo − Both. SE is calculated across **five blocks**, not individual lobbies; it is not a confidence interval or a general-strength test.

| Rival population / labels  | Upgrade main effect | Spending main effect |         Interaction |
| -------------------------- | ------------------: | -------------------: | ------------------: |
| 7 Classic bots / hidden    |  1.3500 (SE 0.1335) |   0.0000 (SE 0.0484) |  0.0000 (SE 0.1250) |
| 7 Classic bots / disclosed |  1.3500 (SE 0.1335) |   0.0000 (SE 0.0484) |  0.0000 (SE 0.1250) |
| Mixed Rivals / hidden      |  1.4625 (SE 0.4470) |   0.1375 (SE 0.0573) | -0.1250 (SE 0.0791) |
| Mixed Rivals / disclosed   |  1.2250 (SE 0.4754) |   0.1250 (SE 0.0523) | -0.1500 (SE 0.0919) |

Spending was enabled in **320 evaluation lobbies**. It selected a sale **47 times across 45 lobbies**, including identical Classic-population visibility controls. Thus this experiment assesses a narrow replacement rule; it does not establish that broader spending plans, purchase sequencing or unused gold are unimportant. In hidden Mixed Rivals, adding spending to the upgrade candidate changed mean placement from 4.2750 to 4.2000.

For Mixed Rivals, disclosure improved Tempo and spending-only by **0.1000 places each (SE 0.0468)**, but worsened upgrade-only by **0.1250 (SE 0.0968)** and Both by **0.1500 (SE 0.1212)**. The same 18/25-HP reserve response therefore has no consistent benefit across these variants. This is not evidence against architectural inspectability or against experimenting with other uses of identity.

All **240 disclosure negative-control pairs** preserved every gameplay command: every Classic-population policy pair, plus the Mixed Classic-reference pair, across all seats and seed blocks. Only setup disclosure differs in those journals.

## Development diagnosis

Development means, again **40 lobbies per cell**:

| Rival population / labels | Classic reference | Tempo v1 | Upgrade only | Spending only |   Both |
| ------------------------- | ----------------: | -------: | -----------: | ------------: | -----: |
| 7 Classic bots / hidden   |            4.8500 |   6.0750 |       5.8750 |        5.9500 | 5.7750 |
| Mixed Rivals / hidden     |            3.6250 |   6.1250 |       4.2000 |        6.0500 | 4.2250 |

The development upgrade effect was 0.1875 places (SE 0.5670) against Classic bots and 1.8750 (SE 0.3075) against Mixed Rivals. The larger reserved Classic improvement illustrates why development point estimates should not be treated as settled strength. No policy parameters changed between cohorts.

At reserved round 5, all **40/40** focal runs per condition still had recruitment turns. Against Classic bots, upgrading changed Tempo's mean tier **1.775 → 2.925**, board **6.500 → 5.175**, and HP **35.600 → 34.425**. Against hidden Mixed Rivals, tier changed **1.675 → 2.950**, board **6.475 → 5.175**, and HP **37.225 → 34.675**. The intervention trades early bodies/health for earlier tavern access and improves final placement in this design. These checkpoints describe the trajectory; they do not separately identify every downstream mechanism.

Round-five unused gold in the new development cohort was already only 0.25 for Tempo in both populations, versus 0.35/0.30 for Classic. The older small-cohort leftover-gold observation did not reproduce as a broad early-game gap. Funding selected 24 sales across the 160 development lobbies with that intervention enabled.

**Next policy hypothesis:** compare Tempo and Classic unit valuation while holding upgrade timing fixed; separately measure hero-power/purchase priority before adding expensive search. Keep the stronger Classic reference. Tavern spells remain a separate game-content slice with their own rules-version and timing contract; they were not added to this experiment.

## Verification and artifacts

- **212 unit tests / 33 files**, formatting, strict TypeScript and production build pass in an isolated snapshot containing only the owned implementation. Regression tests freeze v1 bytes, compare injected/default v1 gameplay, verify sale→buy→play accounting and hidden-state invariance, and reject malformed comparison grids.
- **2/2 browser tests** pass for the standalone explorer using the repository's disposable Chrome harness outside the restricted macOS command sandbox. Desktop navigation, alternative proposals, exact replay-prefix download, step links, invalid links and phone overflow are checked; the phone screenshot was visually inspected. No claim is made that the entire unrelated art/browser suite was rerun for this slice.
- One-worker and two-worker smoke runs produce identical replays and trace decisions after excluding elapsed timing. A tampered metric receipt is rejected by audit; existing output directories are refused.
- **1,200/1,200 lobbies** complete, with supply conservation after every accepted recruitment/round action and exact final-state reconstruction. **Zero failures, command-budget stops, exclusions or source-drift cases.** Development records 356,820 commands and reserved evaluation 718,609, including setup commands.
- Separate audits reconstruct **1,074,229 decision rows** (356,420 development + 717,809 reserved), including **122,557 focal diagnostic records**. They verify input hashes, controller identity, guards/values, accepted commands, turn/upgrade summaries, final placements, and recomputed comparison statistics.

Development took **190.8 s**, reserved evaluation **389.1 s**; measured reserved policy-decision time totaled **13112.5 ms** across all actors. These timings exclude some surrounding work and are not throughput benchmarks: reserved execution overlapped the development audit. Audit wall times were **193.8 s** and **406.5 s**.

Raw evidence remains in ignored `test-results/ai/hearth-recruitment-v2-development/` and `test-results/ai/hearth-recruitment-v2-evaluation/`. The standalone examples under `test-results/ai/hearth-recruitment-v2-inspectors/` show an early upgrade (`upgrade-cadence.html`, step 40) and a funded replacement (`fund-replacement.html`, step 577). Both come from development; they were selected to illustrate the intervention, not to represent average outcomes.

To reproduce from the implementation revision, choose new output directories:

```sh
node scripts/hearth-recruitment-experiment.mjs development test-results/ai/new-r2-development 2
node scripts/hearth-recruitment-experiment.mjs evaluation test-results/ai/new-r2-evaluation 2
node scripts/hearth-recruitment-experiment.mjs audit test-results/ai/new-r2-development 2
node scripts/hearth-recruitment-experiment.mjs audit test-results/ai/new-r2-evaluation 2
node scripts/hearth-recruitment-inspect.mjs \
  test-results/ai/new-r2-development/1-classic-hidden-seat0-tempo-both-v2.replay.json \
  test-results/ai/new-r2-development/1-classic-hidden-seat0-tempo-both-v2.receipt.json \
  /tmp/new-upgrade-inspector.html
```

The viewer reconstructs all five proposals on each recorded focal input and verifies the declared controller's chosen action. Downloaded prefixes include evaluator seed/configuration; policy frames do not. Continuing a prefix in the game uses its v1 preset, while the v2 controller binding remains explicit in the experiment receipt and trace. Saved evidence demonstrates reproducibility of these runs, not new independent trials.
