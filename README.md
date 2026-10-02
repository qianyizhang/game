# Card Workshop

Three complete, local card-game studies for learning game design and having fun changing the rules. Choose a game from the sidebar; each keeps its own save.

| Playable game                               | Core loop                                                                             | Curated content                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Blindside** · Balatro                     | Build poker hands, score ordered effects, shop and beat eight antes / 24 blinds       | 40 Jokers, 18 consumables, eight boss definitions                                                  |
| **Slay the Spire** · Ironclad               | Read enemy intent, spend energy, shape a deck and choose a route through three acts   | 57 obtainable cards, six status/curse definitions, 32 relics, eight potions, three boss encounters |
| **Last Hearth** · Hearthstone Battlegrounds | Recruit, upgrade, form triples, position a warband and auto-battle seven local rivals | 36 recruits across six tiers, four tokens, three heroes, finite shared pool                        |

Blindside and Last Hearth use original content names. Slay the Spire uses original-game identities and researched mechanics with a curated Ironclad pool; all illustrations and code are local. These are curated studies with explicit simplifications, not exact commercial-game replicas.

## Play locally

Use a modern Node.js installation (the pinned Vite release requires Node 20.19+ or 22.12+).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Gameplay needs no account, backend, remote assets or network calls. **Export** saves a portable JSON replay. **Import** validates and reconstructs it through legal commands. **New run** replaces only the selected game's save. Switching games preserves all three runs. Browser storage failure is reported; export remains available.

### First moves

- **Blindside:** select 1–5 cards and play or discard. Reach the blind target before hands run out. Buy Jokers that reinforce a strategy; reorder them and inspect the scoring trace. Card enhancements, held effects and whole-hand effects have distinct stages.
- **Slay the Spire:** choose Neow’s blessing, then a connected map node, select an enemy, and play cards within your energy budget. Read intent before ending the turn. Rewards can be skipped; upgrades, removal and rest shape the whole ascent. The inspector shows card zones and effect order.
- **Last Hearth:** choose a hero, buy a minion and deploy it from hand. Recruit costs 3 gold, refresh 1, sell 1, freeze free. Upgrade for stronger future offers. Three matching copies make a golden; play it for a higher-tier Discover. **Ready** resolves combat, with stepping and speed controls for studying what happened.

Keyboard-operable buttons/selects and responsive layouts support desktop and phone. Wide hands and warbands scroll within their own panels. Desktop is the primary design target.

## Learn and modify

Start with [architecture](docs/architecture.md), then [make a mod](docs/modding.md). Each game has its own rules, typed content, application session and UI under `src/games/`. Domain code runs without React or a browser; interfaces submit commands and render authoritative results. Only seeded randomness, replay envelopes and small UI utilities are shared.

[Research home](docs/research/README.md) holds mechanisms, sources, exact local timing, design questions and playtest notes for every game. [Settled decisions](docs/decisions.md) records scope; [completion evidence](docs/completion.md) maps requirements to checks.

[SVG card artwork](docs/card-art.md) documents the shared visual primitives and each game's illustration layers. Run `npm run assets:export` to browse and save standalone SVGs from `test-results/card-art/index.html`.

| Area                                               | Responsibility                                                       |
| -------------------------------------------------- | -------------------------------------------------------------------- |
| `src/games/{balatro,spire,battlegrounds}/content/` | Card definitions, descriptions and tuning                            |
| `src/games/*/domain/`                              | State, legal actions, timing, resource accounting and progression    |
| `src/games/*/application/`                         | Game-specific replay validation and sessions                         |
| `src/games/*/ui/`                                  | Game tables, cards, catalogues and inspectors                        |
| `src/app/`                                         | Game navigation, browser storage and shared shell; Blindside's shell |
| `src/shared/`                                      | Seeded RNG and the replay envelope used by the later games           |
| `tests/simulation/`                                | Legal fixed-seed policies and run evidence                           |
| `tests/browser/`                                   | Real controls, persistence and rendered layout checks                |

Mods are trusted local TypeScript edits. Change a definition, keep its text consistent, bump that game's rules version if replay meaning changes, and start a fresh run. Rules versions deliberately reject incompatible histories; there are no automatic migrations or arbitrary third-party plugin loading.

## Scope and differences

- **Blindside:** original values, bosses and growth timing; no booster packs, vouchers, seals, editions, blind skips/tags, unlocks or endless mode. Growth happens after scoring. Direct consumable purchases support deck editing.
- **Slay the Spire:** Ironclad at Ascension 0; 15 rooms plus a boss per act, with Slime Boss → The Champ → Donu/Deca. Curated enemies/events; no other classes, Ascension ladder, keys or Act IV. Enemy selection weights, shops and map generation have documented simplifications.
- **Last Hearth:** curated foundational Battlegrounds, with sequential local bots; no network/timer, seasonal systems, armor or damage cap. Combat snapshots are isolated. Escalating fatigue after round 15 bounds the lobby; detailed death ordering is our documented local convention.

The content supports several interacting builds in each game. Balance and human difficulty remain provisional; automated wins demonstrate reachable progression, not fun or parity with the originals.

## Verify

```sh
npm run check          # formatting, rule/replay tests, strict TypeScript, production build
npm run test:browser   # Chrome, disposable profile, once-per-run startup guard
npm run playtest       # 8 Blindside + 6 Slay the Spire + 12 Last Hearth fixed-seed runs
npm run format        # format source, fixtures and documentation
```

On this Mac, browser-launching agent commands require approved execution outside the restricted sandbox. Ordinary checks remain sandboxed. The harness stops at the first startup failure and never uses a personal Chrome profile.

Simulations write ignored evidence under `test-results/simulation/`, `test-results/spire/` and `test-results/battlegrounds/`. Browser evidence is isolated under `test-results/browser/`. Full legal winning command histories are kept in `tests/fixtures/`; browser tests import them to verify terminal UI. Those fixtures contain no injected money, health or cards. Policies use visible state and the same legal transitions; Last Hearth checks every recruitable definition's supply after every human action and resolved bot round.
