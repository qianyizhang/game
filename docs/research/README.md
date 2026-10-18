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
The linked reports retain full counts, uncertainty, failures and audit scope.
On 2026-10-18, closed policy bulk recordings and superseded observations were
intentionally pruned under the [iteration retention rule](../engineering/maintenance.md#policy-iteration-retention).
Historical artifact paths and “preserved” statements describe availability at the
time of the study; they do not promise current raw-input recovery. Policy sources/
bundles, result summaries and lessons remain.

| Game                                                          | Current evidence                                                                                                                                   | Remaining limit                                                                      |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [Night Passage](../engineering/night-passage-agent.md)        | [Declared targets met](experiments/2026-10-14-night-passage-control.md); [review adopted](experiments/2026-10-16-night-passage-rollout-review.md). | Weapon variation; old replays lack original policy knowledge; no prefix branching.   |
| [Blindside](../engineering/blindside-agent.md)                | [Growth wins 14/20 Standard](experiments/2026-10-16-blindside-policy.md), versus Immediate 3/20 and Survival 5/20.                                 | Small cohorts; progress and strict tier ordering remain uncertain.                   |
| [Spire](../engineering/spire-agent.md)                        | [Fresh confirmation passed](experiments/2026-10-16-spire-strength-confirmation-4.md) for Ironclad/Silent at Ascensions 0/3/5.                      | Does not establish every adjacent Ascension or a universal strategy order.           |
| [Last Hearth](../engineering/hearth-policy.md)                | [1,350 audited episodes](experiments/2026-10-16-hearth-policy.md), including 900 reserved attempts.                                                | Hero/objective-dependent strategy results; limited statistical separation.           |
| [Emberwake](../engineering/emberwake-policy.md)               | Native7/policy8 retained; [policy12 rejected](experiments/2026-10-17-emberwake-policy-12-development.md).                                          | Strength/difficulty unresolved; final-attempt limit and paused goal remain in force. |
| [Dungeon Cartographer](../engineering/cartographer-policy.md) | [Fresh 900-case confirmation passed all five criteria](experiments/2026-10-16-cartographer-strength-confirmation-3.md).                            | Fixed policy/budget/cohort; individual seeds can reverse the tier ordering.          |

None establishes human-equivalent skill, human difficulty or enjoyment. The
[six-game workflow evidence](experiments/2026-10-16-policy-workflow.md)
verifies common CLI dispatch and per-case inspection separately from strength.

**Emberwake stop:** native7/policy8 remains accepted. Policy12 was the final rejected attempt; calibration is unresolved, the saved goal is paused, and no successor experiment is authorized. The proposed victory-primary study was not started.

The [game-owned policy contracts](../engineering/README.md#build-and-evaluate-policies) link each study's protocols, earlier attempts and negative results. [Artifact compression](experiments/2026-10-16-policy-artifact-compression.md) records storage measurements separately from gameplay findings.

## Experiments and historical delivery

- [Night Passage observation construction](experiments/2026-10-15-night-passage-observation.md): local runtime and memory comparisons for repeated evaluator reads and lazy views, with exact behavior checks.
- [Night Passage control and difficulty calibration](experiments/2026-10-14-night-passage-control.md): delayed controls, declared policy work, finishing-time score, preserved legacy play and fresh-seed balance evaluation.
- [Night Passage rendering comparison](experiments/2026-10-13-night-passage-rendering.md): local enemy batching measurements, preserved surfaces and limits of the performance claim.
- [Hearth recruitment protocol](hearth-recruitment-v2.md): frozen v5/v1 interventions, factorial grid, audit and decision explorer.
- [Initial formation-search experiment](experiments/2026-10-04-hearth-ai-v1.md), [eight-seat arena study](experiments/2026-10-04-hearth-arena-v1.md), and [recruitment results](experiments/2026-10-04-hearth-recruitment-v2.md): original conditions, denominators, uncertainty and source receipts.
- [Content expansion history](content-expansions.md): original v2 card set and v4 Night Market; counts and verification belong to those dated deliveries.
- [Delivery history](delivery-history.md): dated implementation checks across workshop, arena, recruitment and spells. Current checks are defined in [engineering](../engineering/checks.md).

Machine-readable research receipts and frozen experiment outputs retain their original source paths and hashes. Moving explanatory Markdown changes navigation, not those records or their conclusions.
