# Balatro → Blindside

## Reference and scope

[The official FAQ](https://www.playbalatro.com/faq) confirms the ante structure (small, big, boss), eight-ante victory, boss restrictions, Jokers that alter scoring/economy, and consumables that edit playing cards. It is a high-level source, not a complete timing specification. Our values, card names, and graphics are original.

The community [activation-sequence guide](https://balatrogame.fandom.com/wiki/Guide%3A_Activation_Sequence) supports the distinction between scoring-card, held-card and independent-Joker stages, and why additive/multiplicative order matters. We preserve those stages for our supported effects. This is a secondary source; it is not evidence that every original edge case is implemented.

## Mechanism map

| System           | Workshop contract                                                                                                         | Decision it creates                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Hand recognition | Select 1–5 cards; recognize the strongest contained poker hand, including duplicate-card hands                            | Reliable small hands versus rarer high-value hands                     |
| Scoring          | Hand base → scoring cards → held effects → Jokers left to right; floor chips × mult                                       | Build around additive chips, additive mult, then multiplicative growth |
| Draw economy     | Eight-card hand; four plays and three discards per ordinary blind; played/discarded cards do not return during that blind | Spend redraws now or preserve flexibility                              |
| Jokers           | Five slots; distinct effects with visible trigger order; reorder between plays                                            | Opportunity cost of a slot and of early investment                     |
| Deck building    | Suit changes, rank changes, enhancement, duplication, destruction                                                         | Improve the probability distribution of future hands                   |
| Hand levels      | A permanent level per hand category; consumables increase base chips and mult                                             | Specialize without committing every Joker slot                         |
| Money            | Buy, sell, reroll; payout for spare hands and capped interest                                                             | Spend to survive versus save to compound                               |
| Bosses           | A named restriction announced before entering                                                                             | Prepare an alternative to the strongest habitual play                  |
| Run              | Three blinds per ante; eight antes; loss if the target remains unmet with no plays                                        | A succession of short deadlines                                        |

These are implementation contracts, not claims of exact numerical equivalence. See [rules](../../src/games/balatro/domain/game.ts) and [scoring](../../src/games/balatro/domain/scoring.ts).

## Resolution contract

1. Validate the command against the phase, selected card IDs, and resources.
2. Identify the hand using card ranks/suits. Debuffed cards still participate in recognition.
3. Start with that hand's level-dependent chips and multiplier.
4. Resolve scored cards in the player's visible order, including their enhancements and per-card Joker triggers.
5. Resolve held-card effects, then each whole-hand Joker in slot order. Money earned earlier in scoring is visible to later money-dependent hooks.
6. Record every contributing step with chips, mult and cash deltas. Round the final product down once.
7. Apply persistent Joker growth and earned money; consume a play; move played cards out of hand; resolve breakage.
8. Award a win before checking loss. On a continuing blind, refill from its remaining draw pile.

Example: +20 mult followed by ×2 differs from ×2 followed by +20. The inspector and regression suite must make this visible. A preview must never consume randomness or mutate growth.

## Design hypotheses to test

- A modest set of interacting effects can generate more choices than a large set of interchangeable bonuses.
- Four accessible build families—pairs, flushes, straights, economy/scaling—should all have a plausible early path.
- Immediate scoring feedback should explain success without removing every source of uncertainty.
- A weak early scaling card needs a readable future payoff; otherwise players cannot learn the intended tradeoff.

## Deliberate first-release cuts

No Arcana/Spectral packs, seals, editions, unlock progression, additional starting decks or endless mode. Direct consumable purchases cover deck edits and hand levels. Bosses, Joker values and target progression are curated for this smaller pool. Balance is provisional until humans play; automated completion proves reachability, not fun or original-game parity.

## Playtest notebook

For each run, record seed, decisive purchases, intended build, loss/win point and a sentence about the least interesting decision. Compare identical seeds after a single balance change. Do not optimize only for bot win rate.

Initial evidence: [2026-10-02 development playtest](playtests/2026-10-02-blindside.md).

## Pack, voucher and tag strategy (v3)

Two packs are offered per shop. Buying opens a committed immediate choice; unused options are discarded. Buffoon packs add Jokers subject to the five-slot limit, Celestial choices apply their planet immediately, and Standard choices add playing cards. Mega variants permit two choices. Rerolls affect ordinary stock, not packs or vouchers. These are local subsets of the [booster-pack mechanism](https://balatrogame.fandom.com/wiki/Booster_Packs), with curated card probabilities.

A $10 voucher permanently changes a resource rule: hands, discards, hand size, interest cap, reroll cost or prices. One voucher is offered per ante; purchased vouchers cannot recur. This preserves the long-horizon tradeoff described in the [voucher reference](https://balatrogame.fandom.com/wiki/Vouchers), while using six local definitions.

Small/Big Blinds display skip tags before entry. Skipping forfeits the blind payout, spare-hand income, interest and shop. Economy doubles cash up to a $40 gain; Orbital grants three levels to the shown hand; Buffoon opens a free Mega pack; Investment pays $25 after the next boss victory. Bosses cannot be skipped. [Tag reference](https://balatrogame.fandom.com/wiki/Tags).

Experiment: is the displayed tag worth losing both a payout and a shop? Record the skip and the next boss result instead of comparing only immediate money. [Current v3 cohort](playtests/2026-10-02-workshop-v3.md).
