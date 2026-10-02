# Last Hearth: development playtest

2026-10-02 · rules version 1 · `npm run playtest` · `tests/simulation/battlegrounds.test.ts`.

Twelve fixed seeds rotate the three heroes. The test player uses the same visible-state purchasing heuristic as the seven opponents and submits legal commands. No health, offers, gold or minions are injected. Positioning is recorded as ordinary move commands.

| Seed      | Hero          | Placement | Rounds | Commands | Discover choices |
| --------- | ------------- | --------- | ------ | -------- | ---------------- |
| HEARTH-01 | forgekeeper   | 8         | 7      | 51       | 0                |
| HEARTH-02 | quartermaster | 1         | 16     | 160      | 3                |
| HEARTH-03 | wildspeaker   | 2         | 16     | 141      | 2                |
| HEARTH-04 | forgekeeper   | 4         | 12     | 90       | 1                |
| HEARTH-05 | quartermaster | 4         | 12     | 109      | 2                |
| HEARTH-06 | wildspeaker   | 2         | 16     | 158      | 5                |
| HEARTH-07 | forgekeeper   | 1         | 17     | 159      | 3                |
| HEARTH-08 | quartermaster | 5         | 11     | 109      | 1                |
| HEARTH-09 | wildspeaker   | 5         | 13     | 122      | 2                |
| HEARTH-10 | forgekeeper   | 8         | 7      | 47       | 0                |
| HEARTH-11 | quartermaster | 7         | 10     | 98       | 1                |
| HEARTH-12 | wildspeaker   | 7         | 10     | 93       | 1                |

The cohort produced **2 first-place wins / 12 lobbies** and ten eliminations, including second-place finishes. Every run terminated and reconstructed exactly from its accepted-command replay. After every human action and every resolved bot round, the tests assert nonnegative gold, hand/board capacity and conservation of every recruitable definition's total supply. Combat snapshots do not own supply.

The legal HEARTH-02 first-place replay is stored in `tests/fixtures/battlegrounds-win.json`. It includes three triples/Discover choices and reaches round 16. Raw current results regenerate under `test-results/battlegrounds/`.

A late-summon regression found that counting lifetime attacks could let a new token catch up on attacks from before it existed. The resolver now uses current left-to-right sweeps. The table records results after that correction. This is a correctness fix, not a controlled balance experiment.

Browser checks cover hero choice, recruiting/deploying, freeze, hero power, combat stepping, speed-independent saved state, resume, Discover, invalid-import preservation, game switching, first place and phone layout.

These observations demonstrate legal reachability, bounded progression and resource integrity under one heuristic. They do not establish expert bot strength, equal tribe/hero balance, or human fun. Next human tests should compare upgrading against buying tempo, holding pairs against pivoting, and positioning support against Taunt/Cleave. Do not tune exclusively for these twelve known seeds.
