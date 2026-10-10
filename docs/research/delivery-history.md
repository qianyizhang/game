# Historical delivery evidence

Chronological milestone records through 2026-10-06. Current test and verification contracts are governed by [checks](../engineering/checks.md). Retired intermediate artifacts are documented in [cleanup triage](../engineering/history/cleanup-triage.md).

## Workshop v3 core features

| Area               | Delivered scope                                                                          | Evidence                                                     |
| ------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Spire depth        | Ironclad & Silent, A0–A5, 9 Act I–III boss encounters, Poison/Shiv/discard engines       | 12 complete seeded ascents, card-zone conservation checks    |
| Combat clarity     | Authoritative combat frames, playback controls (speed/pause/step/seek/skip), damage logs | Immutable trace regressions, replay integrity preserved      |
| Practice lab       | Replay prefix reconstruction, custom scenarios, scenario import/export                   | Cross-game replay tests; normal save byte isolation verified |
| Mods               | Local typed packs, numeric/ID validation, replay manifests                               | Enabled example packs verified across real game rules        |
| Blindside strategy | 6 packs, 6 permanent vouchers, 4 skip tags                                               | Atomic purchase/skip regressions; mobile pack UI verified    |
| Hearth strategy    | Upcoming pairing previews, last-seen scouting, bot positioning heuristics                | Snapshot isolation, bot decision tests, 12 lobbies verified  |
| Local evidence     | Automatic run summaries, choice tracking, cohort filters, fixed-seed comparison          | Recorder/filter tests; browser export/clear save isolation   |

## Delivery progression

| Milestone          | Date       | Codebase & Content scope                                                                                                             | Verification summary                                                                     |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Workshop v3        | 2026-10-03 | Base implementations across all 3 games                                                                                              | 140 unit tests, 32 seeded lifecycle runs, 22 browser cases                               |
| Integrated cleanup | 2026-10-03 | [Challenges](../guide/challenges.md), [engines](../guide/engines.md), [challenge art](../art/svg.md#source-map)                      | 170 unit tests, 44 browser cases, 3/3 challenges solved, 523 SVGs                        |
| Hearth AI (v5)     | 2026-10-04 | 5 heroes with powers, [agent interface](../engineering/hearth-agents.md), [AI v1 experiment](experiments/2026-10-04-hearth-ai-v1.md) | 186 unit tests, 46 browser cases, 50 AI lobbies (search placement 4.65 vs baseline 4.50) |
| Mixed Rivals       | 2026-10-04 | [8-seat arena](../guide/hearth-arena.md), rotating priority, [arena experiment](experiments/2026-10-04-hearth-arena-v1.md)           | 199 unit tests, 48 browser cases, 320/320 experiment lobbies                             |
| Recruitment v2     | 2026-10-04 | [Ablation protocol](hearth-recruitment-v2.md), [recruitment experiment](experiments/2026-10-04-hearth-recruitment-v2.md)             | 212 unit tests, 2 browser checks, 1,200 lobbies (1,074,229 decision rows)                |
| Tavern spells      | 2026-10-06 | 8 [tavern spells](../guide/tavern-spells.md) (Hearth rules v6 / arena v2), delayed income, coupons                                   | 233 unit tests, 25 lobbies (267 spells cast), 604 SVGs, 57 browser checks                |

## Evidence paths

- **Domain regressions:** `src/games/*/domain/*.test.ts`
- **Replay & mods:** `src/shared/*.test.ts`, `src/mods/enabled.test.ts`
- **Browser tests:** `tests/browser/*.spec.ts`
- **Golden fixtures:** `tests/fixtures/` (deterministic win/loss replays pinned to current rules versions)
- **Detailed playtest logs:** [Workshop v3 playtests](playtests/2026-10-02-workshop-v3.md)
