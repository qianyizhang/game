# Make your first mod

## 1. Change a familiar effect

Open `src/games/balatro/content/jokers.ts`. Find **Spark**. Change its `mult: 4` to `mult: 6`, and change its description to match. Start a new run and inspect a hand with Spark.

Before preserving saves under changed rules, bump `RULES_VERSION` in `domain/game.ts`. Vite can refresh the UI while you edit, but an existing in-memory run belongs to its previous rules. Always start a fresh run after a rule edit.

Run `npm run check`. The scoring-order regression intentionally mentions Spark's +4 effect; update its expected arithmetic only after you can explain the new result.

## 2. Add a conditional Joker

Add this definition inside the exported `JOKERS` array:

```ts
joker({
  id: 'mod-patience',
  name: 'Patience',
  symbol: '⌛',
  family: 'Economy',
  price: 5,
  description: '+12 mult if no discards remain.',
  onHand: (context) =>
    context.run.discardsLeft === 0 ? { mult: 12 } : undefined,
}),
```

The catalogue and shop read the registry, so the new Joker becomes visible and purchasable without a UI change. Its ID must be unique and stable. Adding content changes shop randomness and therefore requires a rules-version bump. Update the content-count regression if changing the pool; it describes the curated release, not an engine limit. Displayed counts update automatically.

The question to test: does this encourage a thoughtful redraw decision, or merely reward wasting discards? Compare a lower bonus with the same seed. Look at decisions, not only the final score.

## 3. Know the available hooks

| Hook                           | When it runs                                  | Return                                            |
| ------------------------------ | --------------------------------------------- | ------------------------------------------------- |
| `onCard(context, card, owned)` | Each scoring card; again on repeats           | Chips, additive mult, multiplicative factor, cash |
| `onHeld(context, card, owned)` | Each non-debuffed held card                   | Same effect shape                                 |
| `onHand(context, owned)`       | Whole-hand pass, in Joker slot order          | Same effect shape                                 |
| `grow(context)`                | After a hand that is not blocked by The Lock  | Persistent growth increment                       |
| `income(run, owned)`           | Blind-clear payout                            | Cash amount                                       |
| `rule`                         | Named rule modifier interpreted by the domain | A declared modifier, not arbitrary UI logic       |

Hooks should be pure functions: inspect context, return a value. Never mutate it. A hook that reads the wall clock, fetches a URL or uses `Math.random()` breaks determinism. Add genuinely new mechanics to explicit domain stages with timing tests; do not bury a large rules system in one Joker function.

## 4. Change the environment

`content/blinds.ts` holds ante targets and boss descriptions. New boss IDs need behavior in the relevant domain stage—resource setup, legal-action validation, or scoring—and a regression proving it. Keep the displayed rule and the implemented rule consistent.

`content/consumables.ts` holds planets and deck-editing tools. A new effect type needs a typed union member and a case in `useConsumable`; it should also have a test for targets, permanent state and resource consumption.

## Three exercises

1. Put **Spark** before and after **Nest Egg** at $25. Calculate the result, then check the inspector.
2. Add a Joker rewarding exactly four played cards. Does it create a build, or merely fight the poker rules?
3. Change one boss restriction while preserving its target. Record what changed about preparation and counterplay.

Use [research](research/README.md) to keep your hypothesis, intended tradeoff and observed result together. Keep a replay before changing rules, and record which version produced it.

## Slay the Spire: add an attack that changes the next hand

Inside the `CARDS` array in `src/games/spire/content/cards.ts`, add:

```ts
card({
  id: 'mod-cinder-step',
  name: 'Cinder Step',
  kind: 'attack',
  cost: 1,
  rarity: 'common',
  target: true,
  family: 'Draw',
  text: 'Deal 4 damage. Draw 1.',
  upgradeText: 'Deal 7 damage. Draw 1.',
  effects: [damage(4), draw(1)],
  upgradedEffects: [damage(7), draw(1)],
}),
```

The reward/shop registries derive from the card list. The helpers in this example already exist beside it. Increment `SPIRE_VERSION` in `domain/game.ts`; update the curated content-count test and documentation. Start a new run.

**Timing to test:** put Cinder Step in hand with an empty draw pile and one card in discard. It draws the discarded card; it cannot draw itself, because it is still resolving. If its attack kills the final enemy, the later draw is canceled. An upgraded instance keeps its upgrade in the permanent deck across encounters. These interactions belong in `domain/game.test.ts`.

**Design question:** compare this with the existing Pommel Strike card. A strictly weaker card adds clutter; give it a meaningful tradeoff, such as Exhaust, a lower cost with a small effect, or a conditional payoff. Change both rule and description. Do not add a special UI branch for one card.

Enemy moves and relic descriptions live in `content/world.ts`; move selection lives in `domain/enemies.ts`. Relic behavior lives at explicit start/end/attack/exhaust/reward hooks in the domain. A new status or power requires a typed union member, initialization, timing, text and tests. Avoid adding a generic event bus until there is a concrete need.

## Last Hearth: create a new recruitment direction

Inside `MINIONS` in `src/games/battlegrounds/content/minions.ts`, add a definition like:

```ts
{
  id: 'mod-moss-keeper',
  name: 'Moss Keeper',
  symbol: '❧',
  tribe: 'beast',
  tier: 3,
  attack: 2,
  health: 5,
  text: 'At recruitment end, give your Beasts +1/+1 permanently.',
  endTurn: { type: 'tribe', tribe: 'beast', attack: 1, health: 1 },
},
```

The catalogue and pool derive from the list. Increment `BG_VERSION`, update the six-per-tier/content-count regression and this release's documented counts, and start a fresh lobby. A new recruit changes the pool distribution and therefore changes every old seed's offers.

**Timing to test:** recruit Moss Keeper alongside a Beast and a Mech. At recruitment end, the Keeper and Beast gain +1/+1, while the Mech does not. Golden Keeper grants +2/+2. Combat damage then changes only the cloned warband; the permanent gains remain afterward. Verify supply accounting through buying, a triple and selling the golden.

**Design question:** this overlaps existing tribe-scaling cards. Does bringing it to tier 3 create an interesting early commitment, or remove the cost of leveling? Compare the same shop sequence with a weaker bonus, then try fresh seeds.

For death effects, use the existing typed `deathrattle` and named hooks. A genuinely new trigger needs an explicit place in `domain/combat.ts`, frame text, and a regression for simultaneous deaths or full boards. Test an interaction, not merely whether an object contains the new value.

## A repeatable mod experiment

1. Export a baseline run and record its seed and rules version.
2. Write one hypothesis under `docs/research/playtests/`: which decision should change, and what might become too easy?
3. Make one coherent rule/content change, update its text/version, and start a new run with that seed.
4. Run `npm run check`, then the relevant browser and simulation checks. Winning replay fixtures belong to their rules version; regenerate them through legal actions after changes.
5. Play unfamiliar seeds as well. Record confusing decisions, dominant choices and dead cards. Bot win rate is evidence about that policy, not proof of game quality.
