# Make a local content pack

Preview bundled mod examples and active replay manifests in **Practice lab → Content packs**. Mods are local TypeScript modules; activating a pack requires enabling it in code and starting a fresh run.

## Getting started

| Game        | File                    | Example content                                     |
| ----------- | ----------------------- | --------------------------------------------------- |
| Blindside   | `src/mods/blindside.ts` | Patience: Joker hook rewarding remaining discards   |
| Spire       | `src/mods/spire.ts`     | Measured Riposte, Practice Shield, Sparring Partner |
| Last Hearth | `src/mods/hearth.ts`    | Grove Cub and a board-buff hero                     |

1. Set `enabled: true` on the pack. Use stable, namespaced IDs.
2. Edit effect definitions and descriptions together using the game's typed effect vocabulary.
3. Increment the pack's `version` on semantic changes, run `npm run check`, and start a fresh run.

## Slay the Spire: compose effects

```ts
{
  id: 'workshop:riposte',
  name: 'Measured Riposte',
  character: 'ironclad',
  kind: 'attack',
  cost: 1,
  rarity: 'common',
  symbol: '†',
  family: 'Defense',
  target: true,
  text: 'Gain 4 Block. Deal 5 damage.',
  upgradeText: 'Gain 6 Block. Deal 8 damage.',
  effects: [{ type: 'block', amount: 4 }, { type: 'damage', amount: 5 }],
  upgradedEffects: [{ type: 'block', amount: 6 }, { type: 'damage', amount: 8 }],
}
```

Add custom cards/relics to a scenario's `deck` and `relics`. New timing mechanisms require typed effects in `domain/combat.ts` or `enemies.ts`.

## Blindside: pure hooks

| Hook     | Timing                              | Returned effects                |
| -------- | ----------------------------------- | ------------------------------- |
| `onCard` | Scoring cards (including repeats)   | Chips, mult, factor, cash       |
| `onHeld` | Non-debuffed held cards             | Same effect shape               |
| `onHand` | Whole-hand pass in Joker slot order | Same effect shape               |
| `grow`   | After unblocked hands               | Persistent growth increment     |
| `income` | Blind-clear payout                  | Cash                            |
| `rule`   | Named domain stage                  | Explicit resource/rule modifier |

Hooks must remain pure: inspect context and return effects without mutating state, consulting clocks, or calling `Math.random()`.

## Last Hearth: pool and abilities

Custom minions respect shared pool supply, triples, and Battlecries. Heroes define declarative abilities:

- `{ type: 'buff', target: 'board', attack: 0, health: 1 }`
- `{ type: 'recall' }`
- `{ type: 'income', amount: 1 }`

Permanent gains persist post-combat; combat wounds and temporary tokens do not.

## Versioning and compatibility

Replays pin base rules versions (`RULES_VERSION`, `SPIRE_VERSION`, `BG_VERSION`) and pack ID/version/checksum. Incompatible histories are rejected on import.

## Comparing playtests

```sh
# Compare automated baseline and candidate runs
npm run playtest:compare -- baseline.json candidate.json
```

Matches runs by seed, character, hero, and setup. Excludes incomplete runs and outputs candidate-minus-baseline delta metrics.
