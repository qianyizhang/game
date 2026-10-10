# Card Workshop

Playable studies of Balatro, Slay the Spire 1, and Hearthstone Battlegrounds, plus an Emberwake action RPG, built for learning game design and modifying rules. Choose a game from the sidebar; each maintains independent saves.

| Game                                                 | Core loop                                                        | Curated content                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Blindside** · Balatro                              | Poker hands, ordered scoring effects, shop, 8 antes, blind skips | 60 Jokers, 18 consumables, 6 packs, 6 vouchers, 4 skip tags, 8 bosses        |
| **Slay the Spire** · Ironclad & Silent               | Intent reading, energy management, deck building across 3 acts   | 95 cards, 33 relics, 8 potions, 9 boss encounters, Ascensions 0–5            |
| **Last Hearth** · Hearthstone Battlegrounds          | Recruitment, triples, positioning, and auto-combat vs 7 rivals   | 60 recruits across 6 tiers, 4 tokens, 5 heroes, 8 tavern spells, finite pool |
| **[Emberwake](docs/guide/emberwake.md)** · Diablo II | Real-time combat, equipment, connected maps, dungeon exploration | 3 heroes, 9 skills, 4 acts, 20 regions, multi-floor dungeons                 |

Original illustrations and rules are implemented in browser-independent TypeScript.

## Play locally

Requires Git LFS, Node 24 LTS (`.nvmrc`), and Python 3.12 (`uv`). See [asset setup](packages/dcc-workbench/README.md#storage-and-cloning) for binary downloads.

```sh
nvm use
git lfs install --local
git lfs pull
npm ci
npm run dev
```

Open the local Vite URL. Gameplay runs entirely locally without accounts, backends, or network calls. **Export** saves replay JSON; **Import** validates and reconstructs runs via authoritative commands.

### First moves

- **Blindside:** Select 1–5 cards to play or discard. Reorder Jokers to optimize additive vs multiplicative scoring.
- **Slay the Spire:** Choose character, Ascension, and blessing. Read enemy intents before playing cards within energy budgets.
- **Last Hearth:** Choose hero, recruit minions (3 gold), refresh (1 gold), freeze (free), or upgrade tavern. Triples grant higher-tier Discovers. **Ready** starts auto-combat with step and speed controls.

## Learn and modify

- [Architecture](docs/engineering/architecture.md): Game boundaries, rule separation, and command replay.
- [Modding](docs/guide/modding.md): Create trusted local TypeScript content packs in `src/mods/`.
- [Challenges](docs/guide/challenges.md) & [Playing engines](docs/guide/engines.md): Tactical puzzles and BFS solver (`npm run engine:challenges`).
- [Art direction](docs/art/art-direction.md), [SVG tools](docs/art/svg.md), & [3D gallery](docs/art/3d.md): Visual standards, export cabinet (`npm run assets:export`), and 29 interactive 3D studies (`/?art=3d`).
- [Hearth AI](docs/engineering/hearth-agents.md) & [Arena](docs/guide/hearth-arena.md): Observation protocol, heuristic bots, and 8-seat lobby simulations.
- [Emberwake](packages/diablo2/README.md): Standalone Diablo II-style action RPG package.

### Codebase structure

| Directory                                          | Responsibility                                                   |
| -------------------------------------------------- | ---------------------------------------------------------------- |
| `src/games/{balatro,spire,battlegrounds}/content/` | Card definitions, descriptions, and balancing                    |
| `src/games/*/domain/`                              | Rules, legal actions, combat timing, and progression             |
| `src/games/*/application/`                         | Replay validation, session codecs, and engine adapters           |
| `src/games/*/ui/`                                  | Game tables, cards, collection screens, and inspectors           |
| `src/app/`                                         | Navigation hub, browser persistence, and shell                   |
| `src/shared/`                                      | Seeded RNG, replay envelopes, playback timers, and evidence logs |
| `tests/simulation/`                                | Deterministic fixed-seed runs and verification                   |
| `tests/browser/`                                   | Real user interaction, persistence, and layout checks            |

## Verification

```sh
npm run check          # Maintained checks, application tests, and simulations (excludes geometry)
npm run check:full     # check plus geometry regressions; required for 3D changes
npm run test:geometry  # Geometry regressions only
npm run test:browser   # Disposable Chrome profile browser suite
npm run test:browser:review # Opt-in 3D contact sheets for human review
npm run playtest       # 8 Blindside + 12 Slay the Spire + 12 Last Hearth fixed-seed runs
npm run format         # Format source, fixtures, and documentation
```

On macOS, browser tests require approved execution outside the command sandbox (`sandbox_permissions: require_escalated`). See [verification contracts](docs/engineering/checks.md) for gate selection.

## DCC workbench

The [`@card-workshop/dcc-workbench`](packages/dcc-workbench/README.md) package pilots Blender asset authoring (concept brief → `.blend` → animated GLB → browser review). Access via `/?workbench=dcc` or run:

```sh
npm run dcc -- doctor    # Check Blender availability
npm run dcc -- verify    # Validate published asset receipts
```
