# Game mechanics research

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

Checked: 2026-10-02. All three games are implemented. The notes distinguish reference mechanisms, local contracts and unresolved balance questions.

## Experiments and historical delivery

- [Hearth recruitment protocol](hearth-recruitment-v2.md): frozen v5/v1 interventions, factorial grid, audit and decision explorer.
- [Initial formation-search experiment](experiments/2026-10-04-hearth-ai-v1.md), [eight-seat arena study](experiments/2026-10-04-hearth-arena-v1.md), and [recruitment results](experiments/2026-10-04-hearth-recruitment-v2.md): original conditions, denominators, uncertainty and source receipts.
- [Content expansion history](content-expansions.md): original v2 card set and v4 Night Market; counts and verification belong to those dated deliveries.
- [Delivery history](delivery-history.md): dated implementation checks across workshop, arena, recruitment and spells. Current checks are defined in [engineering](../engineering/checks.md).

Machine-readable research receipts and frozen experiment outputs retain their original source paths and hashes. Moving explanatory Markdown changes navigation, not those records or their conclusions.
