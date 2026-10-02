# Slay the Spire: Ironclad development playtest

Rules: `slay-the-spire`, version **2**. Checked 2026-10-02. The cohort below uses unmodified content and only accepted commands; no injected HP, gold, cards or terminal states.

## Method

`tests/simulation/spire-policy.ts` uses a deterministic development heuristic: route preferences, card priorities, and one-command combat lookahead through the real transition function. It does not select by future card identity, but lookahead can observe consequences of hidden draws; this is a lifecycle test, not a fair-playing agent benchmark or an estimate of human difficulty.

Each completed replay is imported again and must reconstruct exactly the same final state. The fixed cohort was selected before its current outcomes. Earlier heuristic failures against Spheric Guardian revealed that the policy did not value damage to Block; the policy was corrected, without changing enemy difficulty.

## Observations

| Seed        | Result | Act / room | HP  | Deck | Relics | Commands |
| ----------- | ------ | ---------- | --- | ---- | ------ | -------- |
| IRONCLAD-01 | lost   | 3 / 14     | 0   | 22   | 5      | 545      |
| IRONCLAD-02 | won    | 3 / 16     | 28  | 22   | 9      | 518      |
| IRONCLAD-03 | lost   | 2 / 16     | 0   | 21   | 6      | 391      |
| IRONCLAD-04 | won    | 3 / 16     | 23  | 24   | 11     | 604      |
| IRONCLAD-05 | lost   | 3 / 11     | 0   | 22   | 7      | 380      |
| IRONCLAD-06 | lost   | 1 / 16     | 0   | 15   | 2      | 148      |

**Two wins and four losses across six runs.** Every run terminated and replayed exactly. These runs demonstrate reachable victory and defeat under normal rules; they do not establish balance, enjoyment, or exhaustive timing parity.

The winning fixture `tests/fixtures/spire-win.json` is IRONCLAD-02 with 518 accepted commands, including all 48 room selections, two boss-relic choices and 16 card-selection commands. The loss fixture is IRONCLAD-06. Browser tests import real prefixes to visit shops, campfires, boss chests and a suspended card choice; the latter is reloaded and then completed through the UI.

## Follow-up experiments

Play several unfamiliar seeds manually. Record whether defensive choices feel meaningful against the Champ, whether the fixed boss route becomes repetitive, and which of the 57 obtainable cards remain unused. Expand a content family only when the new card creates a distinct decision. The next fidelity work is the rest of the boss pool and more exact enemy move restrictions, before higher Ascensions.
