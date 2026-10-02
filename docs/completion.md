# Completion evidence

Verified 2026-10-02. The current Slay the Spire implementation replaces the earlier Emberpath prototype. All three games have playable victory/defeat lifecycles; the content subsets and fidelity limits remain explicit in their research notes.

| Area             | Current implementation                                                                                                                                                                               | Evidence                                                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Blindside        | Eight antes / 24 blinds, ordered scoring, 40 Jokers, 18 consumables, shops and deck editing                                                                                                          | Rule/replay tests, eight simulated runs, browser controls and terminal screens                                                                 |
| Slay the Spire   | Original-game Ironclad at A0; three 15-room maps plus bosses; 57 obtainable cards, six statuses/curses, 32 relics, eight potions; Exhaust choices, enemy reactions, rewards and boss relic tradeoffs | 30 focused rule tests; six legal runs with two wins; browser combat, shops, campfires, boss chests, suspended-choice reload and victory/defeat |
| Last Hearth      | Eight-player lobby, seven bots, six tavern tiers, 36 recruits/four tokens, triples, shared finite supply, combat playback                                                                            | Combat/recruitment/accounting tests, 12 complete lobbies, browser recruitment and lifecycle                                                    |
| Architecture     | Independent browser-free engines, typed content, application replay adapters and presentation                                                                                                        | TypeScript build; module ownership in architecture guide                                                                                       |
| Persistence      | Per-game versioned command replays, validated imports, corruption recovery, isolated restarts                                                                                                        | Exact reconstruction of every simulated run; real browser imports and reloads; Emberpath v1 storage preserved                                  |
| Interface/art    | Game switching, original SVG illustrations, searchable collections, desktop/phone layouts, keyboard-operable controls                                                                                | 16 browser tests; rendered desktop/phone screenshots inspected; SVG export and console-error checks                                            |
| Research/modding | Source-linked mechanics, executable local timing, named simplifications, module map and mod examples                                                                                                 | Documentation links resolve locally; current Spire research supersedes the hybrid design                                                       |

## Gates

- `npm run check`: **86 unit tests across seven files**, formatting, strict TypeScript and production build pass.
- `npm run test:browser`: **16/16 pass**, with the repository startup guard and disposable Chrome profiles. Browser launching uses approved execution outside the restricted macOS sandbox.
- `npm run playtest`: **three suites pass**, covering **26 completed runs** (8 Blindside + 6 Ironclad + 12 Last Hearth). Final states reconstruct exactly from exported accepted commands. Last Hearth also checks pool conservation throughout.

Browser tests click representative real controls and import full legal run histories for late-game screens; they do not click every turn of all 26 runs. Simulations traverse those runs through the engine. The Spire development policy uses one-command lookahead and is not a fair-playing agent evaluation. Balance, human enjoyment and exhaustive commercial-game timing parity are not established by these checks.

## Evidence locations

- `src/games/*/domain/*.test.ts`: rules and interaction regressions.
- `tests/browser/`: controls, illustrations, save/recovery and responsive-layout checks.
- `tests/simulation/`: deterministic development policies and run checks.
- `tests/fixtures/`: full legal winning/losing command histories, without injected terminal state.
- `test-results/browser/`: regenerated screenshots and failure traces; ignored.
- `test-results/{simulation,spire,battlegrounds}/`: regenerated replays and summaries; ignored.
- [Ironclad playtest](research/playtests/2026-10-02-slay-the-spire.md): current Spire outcomes and limitations.
- [Blindside playtest](research/playtests/2026-10-02-blindside.md) and [Last Hearth playtest](research/playtests/2026-10-02-last-hearth.md): other game cohorts.

The previous Emberpath report remains historical and is explicitly labeled superseded. Old Emberpath exports are incompatible with Slay the Spire v2; the implementation does not reinterpret them as a different game.
