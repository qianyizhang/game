# Card Workshop

Three complete, local card-game studies for learning game design and having fun changing the rules. Choose a game from the sidebar; each keeps its own save.

| Playable game                               | Core loop                                                                                      | Curated content                                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Blindside** · Balatro                     | Build poker hands, score ordered effects, shop and beat eight antes, with optional blind skips | 60 Jokers, 18 consumables, six packs, six vouchers, four skip tags, eight bosses                |
| **Slay the Spire** · Ironclad & Silent      | Read enemy intent, spend energy, shape a deck and choose a route through three acts            | 95 obtainable cards, 33 relics, eight potions, nine boss encounters, Ascensions 0–5             |
| **Last Hearth** · Hearthstone Battlegrounds | Recruit, upgrade, form triples, position a warband and auto-battle seven local rivals          | 60 recruits across six tiers, four tokens, five heroes, eight tavern spells, finite shared pool |

Blindside and Last Hearth use original content names. Slay the Spire uses original-game identities and researched mechanics with curated Ironclad and Silent pools; all illustrations and code are local. These are curated studies with explicit simplifications, not exact commercial-game replicas.

## Play locally

Use the pinned Node 24 LTS and npm versions; `.nvmrc` and `.node-version` identify the exact release. Maintenance checks also use Python 3.12 through `uv`.

```sh
nvm install
nvm use
npm ci
npm run dev
```

Open the local URL printed by Vite. Gameplay needs no account, backend, remote assets or network calls. **Export** saves a portable JSON replay. **Import** validates and reconstructs it through legal commands. **New run** replaces only the selected game's save. Switching games preserves all three runs. Browser storage failure is reported; export remains available.

### First moves

- **Blindside:** select 1–5 cards and play or discard. Reach the blind target before hands run out. Buy Jokers that reinforce a strategy; reorder them and inspect the scoring trace. Card enhancements, held effects and whole-hand effects have distinct stages.
- **Slay the Spire:** choose Ironclad/Silent and Ascension 0–5, choose Neow’s blessing, then a connected map node, select an enemy, and play cards within your energy budget. Read intent before ending the turn. Rewards can be skipped; upgrades, removal and rest shape the whole ascent. The inspector shows card zones and effect order.
- **Last Hearth:** choose a hero, buy a minion and deploy it from hand. Recruit costs 3 gold, refresh 1, sell 1, freeze free. Upgrade for stronger future offers. Three matching copies make a golden; play it for a higher-tier Discover. **Ready** resolves combat, with stepping and speed controls for studying what happened.

Keyboard-operable buttons/selects and responsive layouts support desktop and phone. Wide hands and warbands scroll within their own panels. Desktop is the primary design target.

## Learn and modify

The [documentation home](docs/README.md) groups guides, engineering, art and research. [Maintenance governance](docs/engineering/maintenance.md) defines the current check coverage, migration boundary and document lifecycle.

Start with [architecture](docs/architecture.md), then [make a mod](docs/modding.md). Each game has its own rules, typed content, application session and UI under `src/games/`. Domain code runs without React or a browser; interfaces submit commands and render authoritative results. Shared utilities handle seeded randomness, replay envelopes, presentation clocks, content validation and local evidence; each game keeps its own rules and observations.

[Research home](docs/research/README.md) holds mechanisms, sources, exact local timing, design questions and playtest notes for every game. [Settled decisions](docs/decisions.md) records scope; [completion evidence](docs/completion.md) maps requirements to checks.

[The Card Workshop art skill](skills/card-art/SKILL.md) defines the creation and review workflow for SVG and 3D artwork; the [aesthetic rulebook](docs/art-direction.md) is the shared visual standard. The [SVG source map and tools](docs/card-art.md) cover renderers, scaffolding and before/after contact sheets. Run `npm run assets:export` to create a fresh standalone SVG cabinet; the command prints its path under `test-results/`.

The **[3D art gallery](docs/art3d.md)** contains six material studies: Nightjar, Catalyst, Phoenix, Hydra, Spiral and Vajra. The three creatures have authored motion, Catalyst has rising bubbles, and Spiral and Vajra use rigid display motion. Open **3D art gallery** from a table, or `/?art=3d`, to orbit, pause/scrub motion, inspect supported layers and download animated GLB models, six-second WebM loops or PNG images.

The **[creation trace visualizer](docs/engineering/trace-visualizer.md)** is a separate local tool connecting requests, revisions, reviews, retained captures and source changes. Rebuilding the example requires local thread exports and evidence under ignored `test-results/`; `npm run test:trace` checks the reusable normalizer without those files and is included in `npm run check`.

[Card suite expansion](docs/card-expansion.md) lists the twelve new Jokers, twelve new recruits, and the new Silent illustrations.

| Area                                               | Responsibility                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/games/{balatro,spire,battlegrounds}/content/` | Card definitions, descriptions and tuning                              |
| `src/games/*/domain/`                              | State, legal actions, timing, resource accounting and progression      |
| `src/games/*/application/`                         | Game-specific replay validation and sessions                           |
| `src/games/*/ui/`                                  | Game tables, cards, catalogues and inspectors                          |
| `src/app/`                                         | Game navigation, browser storage and shared shell; Blindside's shell   |
| `src/shared/`                                      | Seeded RNG, replay envelope, content validation, playback and evidence |
| `tests/simulation/`                                | Legal fixed-seed policies and run evidence                             |
| `tests/browser/`                                   | Real controls, persistence and rendered layout checks                  |

**Practice lab** offers decision rewind, saved branches and validated custom scenarios in separate practice saves. **Content packs** previews trusted local TypeScript examples; **Playtesting** shows automatically recorded summaries, picks/skips and encounter outcomes, with export/clear controls.

**[Challenges](docs/challenges.md)** offers three short tactical puzzles: Joker order, Artifact/Poison sequencing and warband positioning. Optional hints, authoritative decision reviews and retries from a chosen decision help you compare attempts. Challenge progress saves separately from normal runs and practice branches.

**[Playing engines](docs/engines.md)** provides typed action enumeration and authoritative command execution for all three games. Run `npm run engine:challenges` to search the live puzzles and export verified solutions for challenge import/review. This bounded solver uses full seeded state, including hidden information.

**[Hearth AI experiments](docs/hearth-ai.md)** adds five typed hero powers, a player-visible agent protocol, structured decision traces, a full-run heuristic policy and sampled formation search. Run `npm run experiment:hearth -- development` for a paired cohort, or connect an external agent with `node scripts/hearth-agent.mjs`. The [development track](docs/development-track.md) separates game depth from competitive AI work.

Mods are trusted local TypeScript edits in `src/mods/`. Change a definition, keep its text consistent, bump that game's rules version if replay meaning changes, and start a fresh run. Rules versions deliberately reject incompatible histories; there are no automatic migrations or arbitrary third-party plugin loading.

## Scope and differences

- **Blindside:** immediate Buffoon/Celestial/Standard pack choices, permanent vouchers and Small/Big Blind skip tags. Original values, bosses and growth timing; no Arcana/Spectral packs, seals, editions, unlocks or endless mode.
- **Slay the Spire:** Ironclad and Silent at A0–A5; 15 rooms plus a seeded boss per act. All nine boss encounter families are present. Curated cards/enemies/events; no other classes, A6–A20, keys or Act IV. HP, move weights, shops and map generation retain documented simplifications.
- **Last Hearth:** curated foundational Battlegrounds, with composition-aware sequential local bots and last-seen opponent scouting; no network/timer, seasonal systems, armor or damage cap. Combat snapshots are isolated. Escalating fatigue after round 15 bounds the lobby; detailed death ordering is our documented local convention.

The content supports several interacting builds in each game. Balance and human difficulty remain provisional; automated wins demonstrate reachable progression, not fun or parity with the originals.

## Verify

```sh
npm run check          # formatting, rule/replay tests, strict TypeScript, production build
npm run test:browser   # Chrome, disposable profile, once-per-run startup guard
npm run playtest       # 8 Blindside + 12 Slay the Spire + 12 Last Hearth fixed-seed runs
npm run format        # format source, fixtures and documentation
```

On this Mac, browser-launching agent commands require approved execution outside the restricted sandbox. Ordinary checks remain sandboxed. The harness stops at the first startup failure and never uses a personal Chrome profile.

Simulations write ignored evidence under `test-results/simulation/`, `test-results/spire/` and `test-results/battlegrounds/`. Browser evidence is isolated under `test-results/browser/`. Full legal winning command histories are kept in `tests/fixtures/`; browser tests import them to verify terminal UI. Those fixtures contain no injected money, health or cards. Policies use the same legal transitions. Spire uses one-command lookahead that can observe consequences of hidden draws, so it is not a fair-play benchmark; Last Hearth checks every recruitable definition's supply after every human action and resolved bot round.

The [Night Market expansion](docs/night-market.md) adds new Joker and recruit builds, illustrated shop items and twelve distinct Silent upgrade scenes. Blindside uses rules v4; Hearth now uses v6; Spire remains v3.

The [tavern spells expansion](docs/tavern-spells.md) adds buy/hold/cast decisions, delayed income, permanent buffs and shop manipulation in Classic and Mixed Rivals. Current saves use Hearth v6 / arena v2; historical AI experiments retain their explicit v5/v1 codecs and frozen policies.

## DCC workbench

The private [`@card-workshop/dcc-workbench`](packages/dcc-workbench/README.md) package pilots a Blender authoring pipeline with Briar Hydra: concept brief → editable scene → animated GLB → browser inspection. Open **DCC workbench** from a game table or use `/?workbench=dcc`. Run `npm run dcc -- doctor` for Blender discovery and `npm run dcc -- verify` to check the published source/asset receipt. Blender is needed for authoring, not for viewing the delivered asset.
