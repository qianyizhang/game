# Card Workshop

Six local games for learning game design and modifying rules. Each keeps independent saves; no account or backend is required.

| Game                                               | Inspiration / genre       | Core loop                                                                 |
| -------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------- |
| Blindside                                          | Balatro                   | Poker hands, ordered scoring, Jokers and shops                            |
| Slay the Spire                                     | Slay the Spire 1          | Ironclad/Silent deck building across three acts, Ascensions 0–5           |
| Last Hearth                                        | Hearthstone Battlegrounds | Tavern recruitment, positioning and automatic combat against seven rivals |
| [Emberwake](docs/guide/emberwake.md)               | Diablo II / action RPG    | Connected regions, equipment, wards and four act bosses                   |
| [Dungeon Cartographer](docs/guide/cartographer.md) | Room-drafting tactics     | Draft chambers, read enemy intents and defeat the Unwritten King          |
| [Night Passage](docs/guide/night-passage.md)       | Action roguelite          | Cross four regions, combine patron blessings and bank ash                 |

## Play locally

Requires Git LFS, the pinned Node runtime (`.nvmrc`) and Python (`.python-version`, via `uv`). See [asset setup](packages/dcc-workbench/README.md#storage-and-cloning) for native binaries.

```sh
nvm use
git lfs install --local
git lfs pull
npm ci
npm run dev
```

Open the Vite URL. **Explore all games** explains goals, first moves and controls; **Look up a term** opens the visual glossary. **Export** saves replay JSON; **Import** validates and reconstructs accepted commands.

## Learn and modify

- [Documentation](docs/README.md): playing, engineering, art and research.
- [Architecture](docs/engineering/architecture.md): source ownership and command replay.
- [Modding](docs/guide/modding.md): trusted local TypeScript content packs.
- [Tools](packages/workshop-tools/README.md): export, policy experiments and maintenance commands.
- [DCC workbench](packages/dcc-workbench/README.md): Blender authoring and asset delivery.

## Learning apps

[Shader Pipeline Lab](packages/shader-pipeline-lab/README.md) is a separate frontend
in this repository. It walks through vertex input, shaders, clipping,
interpolation and depth with inspectable calculations. Run `npm run dev:shader-lab`
and open http://127.0.0.1:4178. It shares repository tooling while keeping its UI
and rendering code separate from the games.

[SVG Pose Lab](packages/svg-pose-lab/README.md) groups and transforms SVG objects, edits paths, and exports clean copies. Run `npm run build:svg-lab` to build its standalone offline page.

## Verification

Choose checks by affected behavior using [verification contracts](docs/engineering/checks.md#gate-selection), the authoritative source for local gates, CI scope and browser/native prerequisites. Documentation-only edits use `npm run format:maintenance`; code and UI changes use the relevant application, browser, geometry or native checks.
