# Hearth arena v1: recruitment and style disclosure

**Retain Classic as the default.** Across eight reserved seed blocks and all eight focal-seat positions, the baseline averaged **3.0156**, versus Tempo's **5.5000 with hidden styles** and **5.5938 with disclosed styles**. Lower placement is better. The new arena and rival styles are implemented; this candidate has not earned promotion as a stronger policy.

## Frozen comparison

- **Implementation:** `de0675f6cf9e0e42f6b71aa3a407d3ecd3f2944c`, arena envelope v1 on Hearth rules v5. Classic retains its original save format and bot behavior. An isolated archive of this commit passes all checks.
- **Information:** every policy receives its own detached state, previous-round scouting and a round-opening public lobby snapshot. Exact supply, environment seed/RNG and current rival private state are excluded. The inspector always exposes the configured style mapping. Only the focal seat's labels vary between hidden and disclosed; all seven rivals always receive hidden labels.
- **Population:** two Tempo, two Economy, two Composition and one Classic rival. Their identities and heroes are seeded and held constant across each four-condition comparison. Rotate the same focal hero and rivals through all eight seats. Initial shop reservations and whole recruitment turns use rotating priority each round.
- **Conditions:** baseline/hidden, baseline/disclosed, tempo/hidden and tempo/disclosed. Baseline ignores style labels. Tempo raises its upgrade health reserve from 18 to 25 HP against a disclosed Tempo opponent. This is the specific disclosure hypothesis tested.
- **Cohorts:** 2 development blocks / 64 lobbies; 8 separately reserved evaluation blocks / 256 lobbies. Evaluation uses Forgekeeper, Quartermaster and Wildspeaker twice each, Archivist and Oathkeeper once each. Every block contains all eight seat positions and four conditions. The independent uncertainty unit is the seed block, not a seat rotation.
- **Budget:** 6,000 accepted commands per episode, 120 non-ending actions per recruitment turn plus required Discover resolution, at most 5 refreshes per policy turn, and no combat-search simulations. All eight placements must resolve, including after the focal seat is eliminated.
- **Pins:** both cohorts use configuration digest `a0b7dc2c31bb53a28f2071d76e983e8f91228617dc09f7eddfc57f7aa35715a5`. The [machine-readable evidence](2026-10-04-hearth-arena-v1.json) retains manifests, all run outcomes, source hashes and artifact hashes.

The development run used a dirty implementation snapshot based on `a185240`; its manifest pins the exact files. Before evaluation, UI layout, terminal observation perspective, combat-event emission and report validation were corrected. Recruitment policies, setup and game mechanics were unchanged. All development input frames and decisions reconstruct exactly using the committed implementation. Evaluation ran from `de0675f` with unrelated concurrent card-art workspace changes recorded in the manifest; no hashed source changed during either cohort. No policy was tuned after development or evaluation results were inspected.

## Reserved results

| Policy / visibility  | Completed / attempted | Mean placement ↓ | First places | Top four | Mean survival rounds |
| -------------------- | --------------------: | ---------------: | -----------: | -------: | -------------------: |
| Baseline / hidden    |               64 / 64 |           3.0156 |      22 / 64 |  49 / 64 |              13.6406 |
| Baseline / disclosed |               64 / 64 |           3.0156 |      22 / 64 |  49 / 64 |              13.6406 |
| Tempo / hidden       |               64 / 64 |           5.5000 |       0 / 64 |  18 / 64 |              11.3281 |
| Tempo / disclosed    |               64 / 64 |           5.5938 |       0 / 64 |  18 / 64 |              11.1250 |

Improvement is baseline placement minus candidate placement. Across **8 seed-block means**, Tempo's hidden-condition improvement is **−2.4844 places (SE 0.3386)** and disclosed improvement is **−2.5781 (SE 0.3598)**. Tempo trails the baseline in every seed block under both conditions.

The disclosure effect for Tempo, hidden placement minus disclosed placement, is **−0.0938 places (SE 0.0515)**. This cohort provides no positive disclosure result for this particular response rule. It does not show that styles should always be hidden or that a better policy cannot use them. Baseline's hidden and disclosed gameplay commands are identical in every matched rotation, giving a **zero-effect negative control**; these repeated baseline conditions are not independent strength evidence.

All **256 evaluation lobbies** and **64 development lobbies** completed with eight distinct placements and exact final-state reconstruction. Supply invariants passed after every recruitment and round-advance command. **Zero runs failed, reached the command limit or were excluded.** Evaluation recorded **237,523 commands**, including configuration commands; development recorded **58,509**. A separate audit reconstructed and matched **295,712 decision rows**: **58,445 development + 237,267 evaluation**, including every exact policy-input SHA-256, chosen decision, accepted command and final placement.

Evaluation took **227.1 seconds wall time**, with **5,083.1 ms** measured inside policy decisions across all seats and lobbies. Decision timing excludes action-menu generation, environment transitions, trace I/O, build and replay reconstruction. The machine also ran the development audit and an isolated check, so wall time is not a throughput benchmark. Policies used **zero search simulations**.

## Development diagnosis and next slice

Development mean placements were **2.4375 baseline**, **4.1875 Tempo/hidden** and **4.3125 Tempo/disclosed**, each over 16 seat rotations from two blocks. This already favored retaining the baseline. The reserved cohort was run without changing the policies to quantify the result under additional seeds and heroes.

At the end of round 5, all **16/16** focal runs per development condition were still present:

| Development checkpoint | Baseline / hidden | Tempo / hidden |
| ---------------------- | ----------------: | -------------: |
| Mean tavern tier       |              3.00 |           1.75 |
| Mean board size        |            5.4375 |           6.75 |
| Mean HP                |            36.875 |        37.1875 |
| Mean unused gold       |              0.50 |           1.00 |

**Observed:** Tempo buys a larger early board, delays tavern access and leaves more gold unused, while its early health advantage is small. **Hypothesis:** the delayed investment and weak late-game scaling outweigh immediate board strength. This checkpoint does not isolate that mechanism; the policies also differ in valuation and hero-power ordering. Diagnostics are retained with the machine-readable record.

**Next bounded experiment:** retain the same architecture and published v1 policies; add a separately versioned candidate that changes only the upgrade cadence, then test a second ablation that changes only unused-gold spending. Keep all eight seats, fixed rival assignments, visibility as a separate factor and mean placement as primary. Use development evidence for tuning and reserve new seed blocks before any new strength claim. Broader formation search, self-play and model-backed controllers should follow a competitive recruitment baseline.

The earlier single-seat search experiment used another opponent environment; its scores cannot be compared directly with these means. These results establish neither general game strength nor human enjoyment. The new Mixed Rivals preset provides distinct opponent preferences, not evidence of higher difficulty.

## Verification and reproduction

- **199 unit tests / 30 files**, formatting, TypeScript and production build pass in the shared checkout and an isolated archive of `de0675f`.
- **48 browser scenarios covered:** 47 passed in the initial full suite; one new arena case found inspector overflow on phones. Both arena cases passed after the dialog/layout fix. Screenshots were inspected. Disposable Chrome profiles ran outside the restricted macOS sandbox.
- **32 seeded lifecycle runs** and **3/3 challenge solvers** pass. Classic's full win/loss final-state SHA-256 values match pre-arena commit `a185240` exactly.
- The external JSONL test completes a lobby from **seat 6**, rejects stale and other-seat requests, exposes no hidden styles or environment RNG, and reconstructs its evaluator replay.

At the implementation revision:

```sh
npm ci
node scripts/hearth-arena-experiment.mjs development test-results/ai/new-arena-development
node scripts/hearth-arena-experiment.mjs evaluation test-results/ai/new-arena-evaluation
node scripts/hearth-arena-audit.mjs test-results/ai/new-arena-development
node scripts/hearth-arena-audit.mjs test-results/ai/new-arena-evaluation
```

Original evidence remains in ignored `test-results/ai/hearth-arena-v1-development/` and `test-results/ai/hearth-arena-v1-evaluation/`. Every episode has a full replay, decision/reason trace with exact input hashes, and a receipt. The deterministic outcomes and accepted commands reproduce; timing does not. Existing output directories and audit files are never overwritten. See the [arena contract](../../hearth-arena.md) for engine inspection, policy visibility and process use.
