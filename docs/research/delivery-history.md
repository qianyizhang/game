# Historical delivery evidence

These are dated delivery observations through 2026-10-06, not the current repository gate. [Verification contracts](../engineering/checks.md) own current checks. Original research receipts remain unchanged.

The six accepted workshop improvements are implemented on the three independent game engines. This page records the initial **v3** workshop delivery. The later [Night Market expansion](content-expansions.md) advances Blindside and Last Hearth to **v4**; Spire remains **v3**. Content manifests and separate practice saves make compatibility explicit. Research notes describe the curated content and fidelity limits.

| Area               | Delivered                                                                                                                                | Evidence                                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Spire depth        | Ironclad/Silent, A0–A5, all nine boss encounter families, Poison/Shiv/discard/defense cards, room/shop improvements                      | Boss/Silent/timing regressions; 12 complete seeded ascents with wins for both characters; card-zone conservation after every accepted action |
| Combat clarity     | Paced authoritative frames, speed/pause/step/seek/skip controls, damage arithmetic and snapshots                                         | Immutable trace regression; browser controls leave the saved replay unchanged                                                                |
| Practice lab       | Validated prefix reconstruction, separate branches/checkpoints, custom scenarios, import/export and normal-run return                    | Cross-game replay/scenario tests; browser verifies normal save bytes survive branching and invalid setup                                     |
| Mods               | Trusted local typed packs, examples/previews, numeric/ID/reference checks and replay manifests                                           | Disabled/invalid/changed-data tests; all three enabled example packs exercised through real rules                                            |
| Blindside strategy | Six immediate-choice packs, six permanent vouchers, four skip tags                                                                       | Atomic payment/choice, stock persistence, payout and skip regressions; phone pack/voucher interaction                                        |
| Hearth strategy    | Fixed upcoming pairing, last-seen board scouting, composition/triple/positioning heuristics                                              | Snapshot isolation, bot decision tests, 12 complete lobbies with supply accounting                                                           |
| Local evidence     | Automatic summaries, offered choices/skips and encounter outcomes; cohort filters, retention, export/clear; fixed-seed comparison script | Recorder/reload/cohort/denominator tests; browser export/clear preserves the normal save                                                     |

## Checks

Checked 2026-10-02–03 against the isolated workshop v3 commit snapshot, excluding concurrent Night Market and challenge work:

- **140 unit tests across 16 files** pass.
- **32 seeded runs** complete and reconstruct exactly: 8 Blindside, 12 Spire, 12 Last Hearth. The three simulation suites pass.
- **22 browser cases pass:** 21 in the suite plus the checkpoint recovery case in a targeted retest after correcting an ambiguous test selector. Coverage includes quota-failure export, practice isolation, paced playback, mod previews, evidence clearing and unreadable checkpoint preservation. Profiles are disposable; launch used approved execution outside the restricted macOS sandbox.
- Desktop/phone screenshots for combat, cards, pack selection and the workshop were inspected. Existing layout, recovery, import/export and victory/defeat tests remain covered.
- **`npm run check` passes:** formatting, strict TypeScript, all unit tests and the production build. Fixed-seed comparison self-check matches all 12 Spire pairs with zero metric deltas; local documentation links resolve.

Final cleanup separates the practice panel from the dialog shell, archives unreadable checkpoint libraries before replacement, handles replay-file read failures, validates stored playback speeds and wraps long checkpoint names on phones. Game rules and seeded outcomes are unchanged by this cleanup.

Browser tests click representative actions and import legal full-run histories for late-game screens. They do not click every command of all 32 runs. The Spire development policy uses one-command lookahead; none of these checks establishes human difficulty, fun or exhaustive commercial rule parity.

## Integrated cleanup · 2026-10-03

The current tree includes the Night Market content, [tactical challenges](../guide/challenges.md), [playing adapters and bounded solver](../guide/engines.md), and [challenge artwork](../art/svg.md#source-map).

- **`npm run check` passes:** 170 unit tests across 22 files, formatting, strict TypeScript and the production build.
- **44 browser cases pass** with approved execution and disposable Chrome profiles. Added checks cover unreadable/oversized replay files, pending imports superseded by moves/imports/game switches, navigation state, named dialogs and returning from a loading challenge without losing table selection.
- Challenge screenshots at **320, 768 and 1440 px** were inspected. Jokers wrap without overlap and show their complete effect text.
- **3/3 live challenges** are solved and replay-validated by `npm run engine:challenges`. The solver uses full seeded state; it does not establish hidden-information playing strength.
- **523 standalone SVGs** export and decode in the browser. Cabinet search handles empty results; each export removes its temporary build bundle.

This cleanup changes presentation, import handling and export tooling; game rules and replay versions remain unchanged. Final browser screenshots are under the ignored `test-results/cleanup-final/` directory. The v3 simulation evidence below is historical and was not rerun for this cleanup.

## Game depth and observable AI · 2026-10-04

Last Hearth now has five heroes with typed abilities, including Archivist recall and Oathkeeper fortification. Hearth uses rules **v5**; old v4 save keys remain untouched. The agent interface exposes restricted observations, legal action IDs, structured transition events and a JSON-lines process. Two full-run policies and a reproducible paired experiment are documented in [Hearth AI](../engineering/hearth-agents.md).

- **186 unit tests across 26 files pass**, including full external-process play, hidden-state observation invariance, stale-action rejection, native legality parity, bounded deterministic search, retained failures and hero accounting. Formatting, strict TypeScript and the production build pass.
- **46/46 browser cases pass** using approved execution and disposable Chrome profiles. After a final keyword-label visibility/accessibility fix, all **11 affected Hearth/challenge browser cases** and the build pass again. Both new hero powers and phone layouts were visually inspected; reload and v4-save preservation are covered.
- **32 fixed-seed lifecycle runs** pass across all three games; **3/3 tactical challenges** remain solver-verified.
- **50/50 AI experiment lobbies** complete and replay exactly with per-action pool conservation. The reserved 20-pair result is baseline mean placement **4.50** versus search **4.65**, with search better/tied/worse in **8/4/8** pairs. The candidate is not promoted as stronger. [Experiment report and receipts](experiments/2026-10-04-hearth-ai-v1.md) retain configuration, provenance, compute and uncertainty.
- The two checked-in Hearth fixture histories were reconstructed through legal v5 commands; their previous winning/losing outcomes remain unchanged. Prior exports are preserved, not silently migrated.

The evaluated engine is pinned to `77dad48`; later selected-unit keyword labels change only presentation. Raw experiment outputs are under `test-results/ai/`, full browser evidence under `test-results/hearth-ai-final-browser/`, and final keyword screenshots under `test-results/hearth-keywords-browser/`.

## Evidence locations

- `src/games/*/domain/*.test.ts`: mechanism and lifecycle regressions.
- `src/shared/*.test.ts`, `src/shared/evidence/`, `src/mods/enabled.test.ts`: replay, compatibility, recording and live example-pack behavior.
- `tests/browser/`: controls, art, persistence and responsive layout.
- `test-results/workshop-polish/`: final check logs, browser screenshots/traces and comparison output, ignored by Git. The earlier full suite remains in `test-results/browser-final/`.
- `test-results/workshop-polish/playtests/{simulation,spire,battlegrounds}/`: the isolated v3 command histories, summaries and automated evidence exports. Ordinary simulation runs write to `test-results/{simulation,spire,battlegrounds}/`.
- `tests/fixtures/`: normal-run victory/defeat histories pinned to each game's current rules version, without injected terminal state.
- [Workshop v3 playtests](playtests/2026-10-02-workshop-v3.md): outcomes, methods and remaining human questions.

Old saves/exports are preserved under their previous keys and are rejected as incompatible rather than silently replayed against changed mechanics. No automatic migration is provided. Original game seed compatibility and complete commercial content remain outside scope.

## Eight-seat arena and Mixed Rivals · 2026-10-04

Implementation commit `de0675f` adds rotating recruitment priority, independent per-seat policy frames, a complete-lobby resolver, three new rival preferences and a separate Mixed Rivals save/replay envelope. The inspector always exposes configured identities; policy disclosure is independently configurable. Classic's full win/loss states match pre-arena `a185240` byte-for-byte. See the [arena contract](../guide/hearth-arena.md) and [frozen experiment](experiments/2026-10-04-hearth-arena-v1.md).

- **199 unit tests across 30 files**, formatting, TypeScript and production build pass, including in an isolated archive of the owned commit.
- **48 distinct browser scenarios covered:** 47 passed in the initial full suite; the new Mixed Rivals phone-layout case exposed inspector overflow. Both arena cases passed after the dialog fix. Screenshots were inspected; profiles were disposable and launches used approved execution. Artifacts: `test-results/browser-hearth-arena-v1/` and `test-results/browser-hearth-arena-v1-fixed/`.
- **32 seeded lifecycle runs** pass and **3/3 challenges** remain solved. The external JSONL test controls seat 6 through a completed lobby and checks private-state redaction and stale/other-seat rejection.
- **320/320 experiment lobbies** complete (64 development, 256 reserved), with eight unique placements, exact replay reconstruction and supply accounting. Independent audits match **295,712** input/decision/command rows. No runs fail, hit the limit or are excluded.
- **Keep the baseline:** reserved mean placement is 3.0156 baseline, 5.5000 Tempo/hidden and 5.5938 Tempo/disclosed. This is evidence for retaining Classic, not a claim that the new rivals are stronger or more fun.

Concurrent card-art files were excluded from the arena commits. Source manifests record their workspace status and exact executed hashes; the evaluated policy source did not change during the runs.

## Recruitment ablations and decision diagnostics · 2026-10-04

Implementation `f85353f` adds independent earlier-upgrade and replacement-spending interventions around frozen v1 controllers, a replay decision explorer and a bounded parallel run/audit harness. Game rules, content, save formats and default policies are unchanged. See the [protocol](hearth-recruitment-v2.md) and [complete experiment evidence](experiments/2026-10-04-hearth-recruitment-v2.md).

- **212 unit tests / 33 files**, formatting, TypeScript and production build pass in an isolated snapshot of the owned implementation. Frozen v1 hashes, control replay parity, legal sale→buy→play accounting, hidden-state invariance, complete comparison grids, worker-count determinism and rejection of altered receipts are covered.
- **2/2 focused browser checks** pass with disposable profiles and approved macOS execution. The viewer supports recorded/alternative proposals, exact replay-prefix download, step navigation and a phone layout. Screenshots were inspected. Artifacts: `test-results/browser-recruitment-v2/`.
- **1,200/1,200 lobbies** complete: 400 development and 800 reserved, balancing five heroes, all eight seats and both rival populations. Exact final replay reconstruction and supply conservation pass. **240 disclosure negative-control pairs** preserve all gameplay commands. No failures, command-limit stops, exclusions or source drift.
- Separate audits reproduce **1,074,229 decision rows**, including **122,557 focal diagnostic records**, and verify per-run metrics and comparison statistics. Raw evidence and two standalone viewer examples remain under `test-results/ai/hearth-recruitment-v2-*`; source and artifact hashes are retained in the checked-in machine record.
- **Keep Classic:** earlier upgrades improve Tempo's reserved mean placement to 5.05 against Classic bots and 4.275 against hidden Mixed Rivals, but the Classic reference remains ahead at 4.60 and 3.625. Narrow replacement funding adds little; disclosure effects vary by variant. These are local population estimates across five seed blocks, not general strength claims.

Concurrent artwork files were preserved and excluded from these commits. No reserved-outcome tuning or automatic policy promotion occurred.

## Tavern spells closeout · 2026-10-06

Eight spells are playable in both Hearth modes with explicit purchase/cast commands, shared hand capacity, seeded/frozen offers, delayed income and coupon timing. New games use rules v6 / arena v2. Historical fixtures, policy bytes, published evidence and old save keys are preserved through explicit v5/v1 study codecs. See the [spell contract and source map](../guide/tavern-spells.md).

- **233 unit tests / 34 files**, formatting, strict TypeScript and production build pass.
- **25/25 lifecycle lobbies**: 20 Classic across all five heroes and five complete Mixed Rivals lobbies; every accepted action checks supply/capacity and every final state replays exactly. These checks do not establish balance, enjoyment or policy strength.
- **604 exported SVGs**, eight new spell subjects; all 596 earlier assets retain identical recorded pixel hashes. New artwork and real UI are inspected at desktop/phone sizes.
- **57/57 browser checks pass** in the full suite, including all games, challenge playback, the export cabinet, historical decision explorer and new spell controls. Disposable Chrome profiles ran outside the restricted macOS command sandbox. Screenshots remain in `test-results/browser-tavern-spells-final/`. All four spell browser cases were rerun successfully after the action-enumeration cleanup, under `test-results/browser-tavern-spells-cleanup/`.

The prior feature-art expansion is closed in `5784264`, with 212 unit tests/build and seven targeted artwork browser checks passing before its commit. Its 73 additions are included in the current catalogue.
