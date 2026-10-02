# Completion evidence

The six accepted workshop improvements are implemented on the three independent game engines. Rules versions are **3**; content manifests and separate practice saves make compatibility explicit. Research notes describe the curated content and fidelity limits.

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

## Evidence locations

- `src/games/*/domain/*.test.ts`: mechanism and lifecycle regressions.
- `src/shared/*.test.ts`, `src/shared/evidence/`, `src/mods/enabled.test.ts`: replay, compatibility, recording and live example-pack behavior.
- `tests/browser/`: controls, art, persistence and responsive layout.
- `test-results/workshop-polish/`: final check logs, browser screenshots/traces and comparison output, ignored by Git. The earlier full suite remains in `test-results/browser-final/`.
- `test-results/workshop-polish/playtests/{simulation,spire,battlegrounds}/`: the isolated v3 command histories, summaries and automated evidence exports. Ordinary simulation runs write to `test-results/{simulation,spire,battlegrounds}/`.
- `tests/fixtures/`: current v3 normal-run victory/defeat histories, without injected terminal state.
- [Workshop v3 playtests](research/playtests/2026-10-02-workshop-v3.md): outcomes, methods and remaining human questions.

Old saves/exports are preserved under their previous keys and are rejected as incompatible rather than silently replayed against changed mechanics. No automatic migration is provided. Original game seed compatibility and complete commercial content remain outside scope.
