# Game research and evidence

This is the home for understanding the games we are studying. Architecture explains how the code works; these notes explain what the game asks players to do and why the rules matter.

| Game                      | Research                             | Implementation status                            |
| ------------------------- | ------------------------------------ | ------------------------------------------------ |
| Balatro                   | [Core mechanisms](balatro.md)        | Implemented: Blindside                           |
| Slay the Spire 1          | [Core mechanisms](slay-the-spire.md) | Implemented: Ironclad/Silent, A0–A5, nine bosses |
| Hearthstone Battlegrounds | [Core mechanisms](battlegrounds.md)  | Implemented: Last Hearth                         |

## Evidence convention

- **Reference:** a mechanism described by a linked source. A source's date matters, especially for Battlegrounds.
- **Design interpretation:** why we think that mechanism produces interesting choices; a hypothesis to test through play.
- **Workshop contract:** an explicit rule selected for our implementation. This can differ from the reference game.
- **Open:** a rule that needs further investigation before implementation. Do not quietly convert it into fact.

Keep source links beside the relevant claims. Do not treat marketing pages as complete rules specifications. When an edge case is resolved, add a concrete example and a regression test. Each implemented mechanic should have a home in its game's domain code and a visible explanation in the interface where useful.

## Questions for every mechanic

1. What can the player observe and choose?
2. Which resources constrain the choice, and over what horizon?
3. What resolves immediately, what triggers later, and in what order?
4. Which state is permanent, encounter-local, or temporary?
5. What counterplay or opportunity cost keeps the choice interesting?
6. Which experiment would reveal whether it improves the game?

## Policy evidence

All six games implement policy extensions and original-input review. Performance
claims remain game-specific; infrastructure completion does not imply calibration.
The linked game ledgers summarize decisions and limits; their unchanged JSON
receipts retain case counts, uncertainty, failures and original audit scope.
On 2026-10-18, closed policy bulk recordings and superseded observations were
intentionally pruned under the [iteration retention rule](../engineering/maintenance.md#policy-iteration-retention).
Historical artifact paths and “preserved” statements describe availability at the
time of the study; they do not promise current raw-input recovery. Policy sources/
bundles, result summaries and lessons remain.

| Game                                                          | Current evidence                                                                                                                                                               | Remaining limit                                                                      |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| [Night Passage](../engineering/night-passage-agent.md)        | [Declared targets met](experiments/night-passage.md#2026-10-14-night-passage-control); [review adopted](experiments/night-passage.md#2026-10-16-night-passage-rollout-review). | Weapon variation; old replays lack original policy knowledge; no prefix branching.   |
| [Blindside](../engineering/blindside-agent.md)                | [Growth wins 14/20 Standard](experiments/blindside.md#2026-10-16-blindside-policy), versus Immediate 3/20 and Survival 5/20.                                                   | Small cohorts; progress and strict tier ordering remain uncertain.                   |
| [Spire](../engineering/spire-agent.md)                        | [Fresh confirmation passed](experiments/spire.md#2026-10-16-spire-strength-confirmation-4) for Ironclad/Silent at Ascensions 0/3/5.                                            | Does not establish every adjacent Ascension or a universal strategy order.           |
| [Last Hearth](../engineering/hearth-policy.md)                | [1,350 audited episodes](experiments/hearth.md#2026-10-16-hearth-policy), including 900 reserved attempts.                                                                     | Hero/objective-dependent strategy results; limited statistical separation.           |
| [Emberwake](../engineering/emberwake-policy.md)               | Native7/policy8 retained; [policy12 rejected](experiments/emberwake.md#2026-10-17-emberwake-policy-12-development).                                                            | Strength/difficulty unresolved; final-attempt limit and paused goal remain in force. |
| [Dungeon Cartographer](../engineering/cartographer-policy.md) | [Fresh 900-case confirmation passed all five criteria](experiments/cartographer.md#2026-10-16-cartographer-strength-confirmation-3).                                           | Fixed policy/budget/cohort; individual seeds can reverse the tier ordering.          |

None establishes human-equivalent skill, human difficulty or enjoyment. The
[six-game workflow evidence](experiments/workflows.md#2026-10-16-policy-workflow)
verifies common CLI dispatch and per-case inspection separately from strength.

**Emberwake stop:** native7/policy8 remains accepted. Policy12 was the final rejected attempt; calibration is unresolved, the saved goal is paused, and no successor experiment is authorized. The proposed victory-primary study was not started.

The [game-owned policy contracts](../engineering/README.md#build-and-evaluate-policies) link each study's protocols, earlier attempts and negative results. [Artifact compression](experiments/workflows.md#2026-10-16-policy-artifact-compression) records storage measurements separately from gameplay findings.

## Effect-authoring studies

- [PVFX Foundry transfer study](pvfx-foundry.md): verified sprite-pack structure, public toolkit mechanisms and a private Cinder timing trial awaiting browser/visual acceptance.

## Historical results

- [Blindside](experiments/blindside.md), [Spire](experiments/spire.md),
  [Hearth](experiments/hearth.md), [Emberwake](experiments/emberwake.md),
  [Cartographer](experiments/cartographer.md) and [Night Passage](experiments/night-passage.md)
  each keep one dated experiment ledger, including failed and superseded studies.
- [Shared workflow and storage](experiments/workflows.md) separates technical
  dispatch/compression evidence from game strength.
- [Delivery and playtests](delivery-history.md) keeps early lifecycle cohorts,
  content expansions and spells. These are dated results; [engineering](../engineering/checks.md)
  owns current checks. The [Hearth recruitment protocol](hearth-recruitment-v2.md)
  remains the current reader-facing factorial/audit reference.

Ledgers link full original prose at exact Git revisions. Frozen JSON paths and hashes
still identify their recorded source environment; they are not rewritten to point at
today's summaries. Three analyzer-input protocols remain unchanged. Three short
report links preserve their direct destinations without duplicating the results.
