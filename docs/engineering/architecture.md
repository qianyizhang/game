# Architecture: three independent games, four layers

The [glossary](glossary.md) defines domain terms. [Independent game rules](decisions/0001-independent-game-rules.md) and [accepted-command reconstruction](decisions/0002-reconstruct-from-accepted-commands.md) record foundational design choices. See [testing policy](testing.md) for verification boundaries.

## The dependency direction

```text
React table ──command──> browser session hook ──> application session
                                                   │
                                                   ▼
                                            domain transition
                                             │           │
                                             ▼           ▼
                                         scoring       content hooks
                                             │
                                             ▼
                                     score steps + new state
```

The domain imports content definitions to interpret IDs. Content imports domain **types** and pure poker helpers without importing `game.ts` or UI. The application layer coordinates domain calls; UI submits commands and renders queries. Browser persistence resides strictly in the React adapter. Rules execute headlessly in Vitest without browser or DOM dependencies.

## Trace a concrete action

1. `Table.tsx` renders hands and selection IDs (temporary UI state).
2. `scoreHand(run, ids)` calculates a pure preview without consuming RNG or mutating state.
3. The Play button submits `{ type: 'play', cards: ids }` to `act()`.
4. `transition()` validates selections and phases, returning a cloned new state or the original state upon rejection.
5. `evaluateHand()` identifies poker hand category by visible hand order.
6. `scoreHand()` builds an ordered trace: card enhancements and per-card hooks execute before held effects; whole-hand Jokers resolve left-to-right.
7. `transition()` applies results, Jokers growth, glass breakage, and card-zone movements. Surviving blinds refill hands from draw piles.
8. `act()` appends successful commands to replay history. The browser adapter persists replay state.

## State ownership

| State                                                                  | Lifetime          | Owner       |
| ---------------------------------------------------------------------- | ----------------- | ----------- |
| Deck, enhancements, Joker growth, hand levels, money                   | Whole run         | Domain      |
| Hand/draw/discard IDs, target, hands, discards, first played hand type | Current blind     | Domain      |
| Shop offers and reroll count                                           | Current shop      | Domain      |
| Seed + PRNG integer + next instance ID                                 | Whole run         | Domain      |
| Accepted commands and rules version                                    | Save/replay       | Application |
| Selected IDs, active tab, new-run dialog                               | Current interface | UI          |

Cards and Jokers use **instance IDs** distinct from definition IDs. Copying creates a new instance ID. Active blind piles never duplicate instance IDs.

## Determinism and persistence

`shared/random.ts` provides seed hashing, a serializable PRNG, and Fisher–Yates shuffling. Rules never access time, global randomness, or browser APIs.

Saves store only seed, rules version, and accepted commands. Imports validate and reconstruct state through the legal transition engine. Corrupted or incompatible saves are rejected. Bump `RULES_VERSION`, `SPIRE_VERSION`, or `BG_VERSION` whenever a rule change modifies command interpretation.

## Engine boundaries

`Hub.tsx` lazily loads games on demand. `useLocalGame.ts` handles normal/practice storage; `useSession.ts` adapts Blindside legacy calls. Spire and Hearth share `GameShell.tsx`.

### Slay the Spire turn trace

1. `SpireApp.tsx` submits `playCard` with card instance and optional enemy ID.
2. `transitionSpire` clones state and calls `playCard`.
3. The resolver moves the card from hand, resolving effects in order. Played powers and exhausted cards enter distinct zones.
4. Damage applies via `attackDamage` and `hit` against Block and HP. Lethal damage cancels pending enemy actions.
5. `endTurn` executes end-of-turn effects, enemy intents, and resets energy/hand.
6. Persistent run state owns deck and HP; combat state owns temporary cards, energy, enemies, and status effects.

Module ownership:

- `domain/game.ts`: Run progression and command gateway.
- `domain/combat.ts`: Effect resolution, zones, and turn boundaries.
- `domain/enemies.ts`: Intent selection and enemy reactions.
- `domain/map.ts`: Node routing and encounter pools.
- `domain/rewards.ts`: Card choices, relics, and shops.
- `domain/state.ts`: Cloned transitions and seeded RNG.

### Last Hearth round trace

1. `recruitAction` enforces economic constraints: costs, pool capacity, triples, and Discover.
2. The shared pool owns unallocated copies; boards, hands, and offers own allocated copies.
3. `endRecruit` executes bot turns, triggers end-of-recruit effects, and delivers paired boards to `resolveCombat`.
4. Combat resolver executes simultaneous attacks, damage, and death queues using isolated combat copies.
5. Post-combat applies hero damage, fatigue, and eliminations. Temporary combat modifications never mutate recruitment boards.
6. UI replays immutable animation frames. Advancing frames is local UI state; round progression is an authoritative command.

## State isolation matrix

| State             | Blindside                               | Slay the Spire                                  | Last Hearth                                        |
| ----------------- | --------------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| Persistent        | Deck, money, Jokers, hand levels        | HP, deck, relics, gold, potions, map            | Hero HP, tier, board, hand, supply ownership       |
| Encounter-local   | Draw/discard, played hands, blind score | Combat card copies/zones, status, Block, energy | Isolated combat copies, attack sweeps, death queue |
| Presentation-only | Card selection, inspector tab           | Target selection, inspector tab                 | Selected unit, playback frame and speed            |

Rules code never imports UI, storage, DOM, clock, or global randomness. Replay state is reconstructed from validated commands.

## Workshop shared layers

- `shared/Playback.tsx`: Presentation clock over immutable domain frames without command dispatch.
- `shared/replay.ts`: Validated replay reconstruction and practice envelopes.
- `mods/*.ts`: Local TypeScript content packs. `shared/contentPack.ts` validates packs and enforces checksums.
- `games/*/application/evidence.ts`: Records transitions into lightweight summaries for analysis.
- `WorkshopTools`: Houses `PracticeLab`, `ModsPanel`, and `EvidencePanel`.
