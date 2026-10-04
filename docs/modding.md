# Make a local content pack

Open **Practice lab → Content packs** to preview the bundled examples and inspect the active replay manifest. These are trusted local TypeScript modules; activating a pack means editing its source and starting a fresh run.

## Start with one example

| Game        | File                    | Working examples                                         |
| ----------- | ----------------------- | -------------------------------------------------------- |
| Blindside   | `src/mods/blindside.ts` | Patience: a pure Joker hook rewarding remaining discards |
| Spire       | `src/mods/spire.ts`     | Measured Riposte, Practice Shield, Sparring Partner      |
| Last Hearth | `src/mods/hearth.ts`    | Grove Cub and a board-buff hero                          |

1. Change the chosen pack’s `enabled` flag to `true`. Keep its stable ID; give a new pack a unique namespaced ID.
2. Change one effect and its description together. Definitions use the game’s own types and existing effect vocabulary.
3. Increment the pack’s semantic `version` whenever its meaning changes. Run `npm run check`.
4. Reload, then start a fresh run or practice scenario. Enabled packs get a distinct save key; a live pre-edit run is not migrated by hot reload.
5. Inspect the card preview, use its ID in a scenario, and study the authoritative resolution. Export evidence before another edit.

The registry validates names, IDs, duplicates, versions and supported numeric bounds, including disabled examples. Active generated-card/summon references must resolve. TypeScript catches invalid effect discriminants. A failed lazy game import presents its error without replacing saves. This validation does not prove that a custom hook is pure or that its description matches its behavior.

## Spire: compose an effect

The supplied attack is ordinary typed content:

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

Put `workshop:riposte` in a scenario’s `deck`, `workshop:practiceShield` in `relics`, and `workshop:sparringPartner` in `enemies`. This exercises the actual combat engine. A new enemy without special behavior cycles through its typed intents. Custom enemies are available to scenarios; adding them to normal routes also requires editing the encounter pools.

A new timing mechanism belongs in `domain/combat.ts` or `enemies.ts`, with a typed effect and a meaningful interaction test. For example, drawing during a resolving attack must not redraw that attack, and lethal damage must cancel later effects. Relics have explicit hooks; the example uses `startBlock`. Avoid a universal event bus until concrete duplication justifies one.

## Blindside: keep hooks small and pure

| Hook     | Timing                               | Result                          |
| -------- | ------------------------------------ | ------------------------------- |
| `onCard` | Each scoring card, including repeats | Chips, mult, factor, cash       |
| `onHeld` | Non-debuffed held cards              | Same effect shape               |
| `onHand` | Whole-hand pass, in Joker slot order | Same effect shape               |
| `grow`   | After a hand not blocked by The Lock | Persistent growth increment     |
| `income` | Blind-clear payout                   | Cash                            |
| `rule`   | A named domain stage                 | Explicit resource/rule modifier |

Inspect context and return an effect; never mutate context, read the clock, fetch data, or call `Math.random()`. New hooks require a domain timing decision, not a UI special case. Booster definitions and permanent voucher/tag effects live in `content/shop.ts`, `domain/shopExtras.ts` and `domain/game.ts`.

Try an economy Joker with two different orders beside a multiplier. Explain the chips/mult result before checking the inspector. A card that merely rewards wasting a resource is a design question, not an automatic improvement.

## Last Hearth: recruitment versus combat

Custom minions use the same finite supply, triples, Battlecries, death effects and permanent end-recruitment growth as the base pool. All heroes use a declarative `ability`: `income`, `buff` (friendly, board or tribe target, with an optional keyword), or `recall`. The example hero uses `{ type: 'buff', target: 'board', attack: 0, health: 1 }`. Recruitment validates and executes these abilities in `domain/heroes.ts`; new timing mechanisms belong in the domain. Hearth v5 replaces the earlier `boardBuff`/`targeted` fields, and the bundled example pack is version 2.0.0.

Test a Beast growth card beside both a Beast and a Mech, then as a golden. Permanent gains must remain after combat; wounds and temporary summons must not. Check supply through purchase, triple formation, selling and elimination. A new trigger needs a defined place in the death queue and an interaction test for simultaneous deaths or full boards.

## Compatibility is explicit

Every replay pins the base rules version and active pack ID/version/data checksum. Import rejects a mismatched manifest. The checksum canonicalizes data and deliberately excludes function source, which changes under minification. **Changing a TypeScript hook requires a pack version bump; changing base rules requires `RULES_VERSION`, `SPIRE_VERSION` or `BG_VERSION` to advance.** The checksum is not a security signature.

The app does not execute uploaded scripts, reinterpret old histories with new rules, or migrate arbitrary states. Preserve old exports and the corresponding source revision if you want to revisit them.

## Repeatable experiment

1. Write a hypothesis under `docs/research/playtests/`: which decision should change, and what could become too easy?
2. Play a normal run or create a practice scenario. Recordings label these separately. Use checkpoints to branch while preserving your normal run.
3. Export baseline evidence from **Practice lab → Playtesting**, or run `npm run playtest` for the fixed automated cohort.
4. Make one coherent change, update its version/text, and repeat with the same seeds and setup.
5. Compare exports:

```sh
npm run playtest:compare -- baseline.json candidate.json
```

Simulation evidence files are `test-results/{simulation,spire,battlegrounds}/evidence.json`. Copy the baseline before rerunning: these generated files are replaced. The comparison matches game, seed, character/difficulty or hero, setup, practice mode and source. It excludes missing, duplicate, partial and unfinished runs, reports both manifests and candidate-minus-baseline metrics. Same seeds can consume RNG differently after different decisions; this is not causal proof.

Human records retain the newest 100 runs, up to 1,000 events per run and 12,000 total events. The UI reports partial histories and uses recorded decision opportunities as the pick-rate denominator. Export/clear affects evidence only. Automated policies are development heuristics; they do not establish human difficulty, playing strength or enjoyment.
