# Architecture: three independent games, four layers

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

The domain imports content definitions to interpret IDs. Content imports domain **types** and pure poker helpers; it does not import `game.ts` or UI. The application calls the domain. UI calls application operations and reads pure queries. Browser storage exists only in the React adapter. Rules can run under Vitest without React, a server, or a DOM.

## Trace a concrete action

1. `Table.tsx` renders the current hand and selected IDs. Selection is temporary UI state.
2. `scoreHand(run, ids)` gives a pure preview. It does not consume RNG, grow Jokers or change the wallet.
3. The Play button submits `{ type: 'play', cards: ids }` to `act()`.
4. `transition()` rejects illegal selections and phase violations before returning a new state. The input state remains untouched; a rejection returns the original object.
5. `evaluateHand()` finds the poker category and scoring membership. Selection click order does not affect resolution: visible hand order does.
6. `scoreHand()` builds an ordered trace. Card enhancements and per-card hooks run before held effects; whole-hand Jokers then resolve left to right. Money earned by an early hook is visible to later money-dependent hooks.
7. `transition()` applies the resolved result, growth, glass breakage and card-zone movement. Victory is checked before exhausted-hand loss. A surviving blind refills the hand from its existing draw pile.
8. `act()` records only a successful command. The browser adapter persists the replay. React renders the result and the inspector renders the same scoring steps.

## State ownership

| State                                                                  | Lifetime          | Owner       |
| ---------------------------------------------------------------------- | ----------------- | ----------- |
| Deck, enhancements, Joker growth, hand levels, money                   | Whole run         | Domain      |
| Hand/draw/discard IDs, target, hands, discards, first played hand type | Current blind     | Domain      |
| Shop offers and reroll count                                           | Current shop      | Domain      |
| Seed + PRNG integer + next instance ID                                 | Whole run         | Domain      |
| Accepted commands and rules version                                    | Save/replay       | Application |
| Selected IDs, active tab, new-run dialog                               | Current interface | UI          |

Cards and Jokers have **instance IDs**, separate from definition IDs. Copying a card creates a new instance; its rank/suit need not be unique. An active blind's piles contain only existing cards without duplicate IDs. A copied card enters the next blind, so it can exist in the permanent deck outside current piles. This exception is intentional.

## Determinism and persistence

`shared/random.ts` provides seed hashing, a serializable PRNG and Fisher–Yates shuffle. No rule uses time, global randomness or browser APIs. The UI may use the current time to propose a new seed; after creation that seed is explicit.

A save stores the original seed, rules version and accepted commands—not an arbitrary state object. Import checks the envelope and commands, then reconstructs through the same legal-action boundary. The loader rejects malformed JSON, incompatible versions, oversized files and illegal action histories. Export does not need a service.

Determinism only holds for the same rules/content version. Content edits are code changes: update the relevant `RULES_VERSION`, `SPIRE_VERSION` or `BG_VERSION` whenever an old command sequence would change meaning. Automatic migrations are outside this release.

## Why three engines

Poker scoring, sequential player turns and simultaneous auto-combat have different timing requirements. The game folders keep those differences explicit. The shared `replayCodec` knows only creation, legal transitions and command validation; it does not know what an attack, card, turn or victory means. Blindside retains a compatibility adapter around the shared codec. Extracting another abstraction should solve observed duplication without hiding the rules.

`Hub.tsx` owns game selection and loads each game on demand through React lazy imports. Its loading screen keeps the game picker available; switching away from a loading game preserves the other game’s save. Browser tabs use the selected game’s title. `useLocalGame.ts` handles separate normal/practice storage for all games; `useSession.ts` adapts Blindside’s legacy call shape. Spire and Hearth share `GameShell.tsx`. Game saves have distinct keys and a versioned game identifier. Switching unmounts one UI and restores the other game's accepted-command history.

## Trace a Slay the Spire turn

1. `SpireApp.tsx` submits `playCard` with an instance ID and an optional enemy ID.
2. `transitionSpire` clones state and calls `playCard`; a rejection returns the original state without spending resources or RNG.
3. The resolver removes the card from hand before resolving its ordered effect array. Draw may shuffle discard, but cannot redraw the resolving card. Played powers and exhausted cards occupy separate zones.
4. Damage uses `attackDamage`, then `hit` for Block/HP. Enemy intents use the same arithmetic. Death cancels later effects; the run layer determines defeat or rewards.
5. `endTurn` performs hand cleanup, end-turn effects, enemy turns and the next player-turn setup. Persistent run state owns the deck and HP; temporary combat state owns copied card instances, zones, energy, enemies and status stacks.
6. After an accepted action, the session records the command, the browser saves it, and the UI displays resulting state and log. Animation does not resolve rules.

Content selects typed `Effect` values. Existing effects compose without resolver edits; genuinely new timing needs a named domain stage and an interaction test. Relic IDs currently map to explicit small hooks rather than a generalized event bus.

### Spire module ownership

- `domain/game.ts`: legal command boundary and run progression.
- `domain/combat.ts`: ordered effects, combat zones, resource spending, turn boundaries.
- `domain/enemies.ts`: move selection, visible dynamic intents, enemy reactions.
- `domain/map.ts`: connected routes and encounter pools.
- `domain/rewards.ts`: loot, shop offers, relic acquisition and end-combat healing.
- `domain/state.ts`: narrow mutations inside a cloned transition and explicit seeded randomness.
- `ui/Card.tsx`, `Combat.tsx`, `Map.tsx`, `Rooms.tsx`: separate presentation surfaces.

A suspended `CardChoice` holds the resolving card and remaining effects. Only `chooseCard` may proceed until that choice is resolved; it is fully replayable. The v3 save identity is `slay-the-spire`; old `emberpath.v1` storage is preserved separately and its exports are rejected as incompatible.

## Trace a Last Hearth round

1. `recruitAction` defines the economic boundary for human and bot commands: prices, available offers, targets, hand/board capacity, triples and Discover.
2. The pool owns unallocated copies; offers, hands, boards and Discover own allocated copies. `supplyTotal` can reconstruct total ownership per definition. A golden carries the sum of its components' copies; tokens own none.
3. `endRecruit` runs each living bot through the same boundary, then applies permanent end-recruitment effects. Pairings were seeded at recruitment start. Lobby code stores last-seen scouting snapshots and hands cloned boards to `resolveCombat`.
4. The resolver owns attack sweeps, RNG targeting, simultaneous damage, a death queue and summoned combat instances. Frames contain snapshots for the viewer. `record=false` skips frame allocation for AI-only battles without changing rules or RNG.
5. Combat returns a result and updated RNG. Lobby code applies hero damage, fatigue and elimination. Wounds, temporary buffs, shield consumption and summoned tokens do not write back to recruitment boards.
6. The UI steps through immutable frames. Advancing a frame is UI state; advancing a round is a recorded domain command.

## Boundaries worth preserving

| State             | Blindside                               | Slay the Spire                                  | Last Hearth                                        |
| ----------------- | --------------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| Persistent        | Deck, money, Jokers, hand levels        | HP, deck, relics, gold, potions, map            | Hero HP, tier, board, hand, supply ownership       |
| Encounter-local   | Draw/discard, played hands, blind score | Combat card copies/zones, status, Block, energy | Isolated combat copies, attack sweeps, death queue |
| Presentation-only | Card selection, inspector tab           | Target selection, inspector tab                 | Selected unit, playback frame and speed            |

Rule code must not import React, storage, DOM, time or global randomness. Content imports types and narrow pure helpers, not the UI or run transition. Replay input is treated as untrusted data and reconstructed through validation; serialized state is never assigned to the engine.

Local import limits are 2 MB and 10,000 commands. Existing corrupt saves are retained until a successful replacement can archive them; import errors preserve the active valid run. This is a local development app, not a hardened hostile-upload service.

## Testing by risk

- Poker examples pin recognition and scoring membership, including duplicate-card and wheel edge cases.
- Scoring examples pin order, money visibility, debuffs, repeats, held effects and preview purity.
- Run tests pin resource accounting, atomic rejection, purchasing, mutation and all 24 transitions.
- Replay tests pin reconstruction and rejection of corrupt inputs.
- Browser tests cover the actual controls and rendered layout using disposable profiles.
- Fixed-seed simulations exercise unmodified runs and export evidence. They are development observations, not a playing-strength benchmark.

- Slay the Spire tests pin zone conservation, damage/debuff timing, lethal cancellation, upgrades and act progression.
- Last Hearth tests pin simultaneous combat, shield/poison/cleave/reborn, summons, triples, pool accounting and lobby termination.
- Whole-run simulations use legal commands, include successful and failed runs, and reconstruct final states exactly. The Last Hearth cohort checks every definition’s supply after every action and round.

## Workshop layers

- `shared/Playback.tsx` is a presentation clock over authoritative frames. Spire frames include post-event fighter/card-zone snapshots and damage arithmetic; Blindside has scoring steps; Hearth retains its combat viewer. Pause, speed and stepping never dispatch game commands.
- `shared/replay.ts` adds validated prefix reconstruction and a practice-only setup envelope. Each game’s `application/scenario.ts` validates its own inputs and builds state through normal domain helpers. Practice saves/checkpoints have distinct keys and are rejected by normal import.
- `mods/*.ts` owns trusted local pack definitions. `shared/contentPack.ts` assembles registries and pins canonical data checksums; game-specific validators remain in `mods/validation.ts`. Game imports fail visibly through `ContentBoundary`. Hook semantics require explicit version bumps.
- `games/*/application/evidence.ts` observes accepted before/command/after transitions. It interprets its own game, producing small common event/summary records. `shared/evidence/recorder.ts` accepts a storage port and bounds local retention. Recording uses wall time only outside the rules/replay state. Storage errors do not reject a legal game command.
- `WorkshopTools` hosts `PracticeLab`, `ModsPanel` and `EvidencePanel`, keeping each panel’s state and controls local. Reporting never changes game state. Automated cohorts use the same observers and are explicitly labeled; the comparison script matches fixed seeds and excludes ambiguous pairs.

New mechanics should stay in the owning game. The shared layers know how to store and display events; they do not determine combat, scoring, legal choices or game outcomes.
