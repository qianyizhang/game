# Emberwake · Diablo II gameplay study

A playable single-player action RPG baseline in `@card-workshop/diablo2`. Three heroes follow an original four-act lantern story. Canvas sprites and compact maps keep visual costs low while rules, exploration, loot, builds, and bosses remain playable.

## Play and check

From the repository root, use its pinned runtime with `nvm use`:

```sh
npm run dev
npm run test:diablo2
npm run typecheck
npm run test:browser -- tests/browser/diablo2.spec.ts
```

Open `http://127.0.0.1:5173/?game=diablo2`, or select **Emberwake · Diablo II** in the workshop picker. On this Mac, browser-launching commands require approved execution outside the restricted sandbox with disposable profiles; see the root AGENTS.md.

The [player guide](../../docs/guide/emberwake.md) owns controls, campaign and simplified mechanics. Rules tests clear the campaign using accepted commands for each hero, test resource failures and replay reconstruction. Browser tests exercise early live play, reload, keyboard dialogs, mod import and a reconstructed victory; the imported victory is not a full browser campaign playthrough. The new source is included in ESLint, workspace TypeScript, Vitest, formatting and the maintained inventory gate.

## Package ownership

- `src/domain/content.ts` owns the baseline definitions: heroes, skills, items, monsters and maps.
- `src/domain/game.ts` exposes `createGame`, `applyCommand`, `stats` and `validateContent`. Rejected commands return the original state and preserve RNG/resources. Rules operate independently of browser/React APIs. An `advance` tick is exactly 100 ms; callers supply ticks, not wall-clock time.
- `src/application/session.ts` owns accepted-command journals, validation and reconstruction. Replay embeds the exact content pack, seed and rules version. Autosave uses `card-workshop.emberwake.v1`, separate from the other games.
- `src/ui` renders state and submits commands. Gameplay pauses while inspecting panels, when the window loses focus, and while the tab is hidden. A loaded field save begins paused.
- `src/domain/campaign-policy.ts` is a verification policy, not an autoplay feature. It uses legal player commands without injected resources or powers.

Imports: `@card-workshop/diablo2/rules`, `/content`, `/session`; the default export is the React screen. The package shares no universal rules engine with the card games.

## Make content mods

In the hero chooser or Journal, **Export content pack** downloads editable JSON. Copy the pack, change its `id` and `version`, edit definitions, then **Load content mod** and start a fresh journey. An invalid import preserves the current journey. Mods replace the complete pack; extending one definition means retaining the rest. Existing replays carry their original pack and do not silently adopt a new mod.

| Extension    | Definition and constraints                                                                                                                                                                                                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero         | Unique lowercase ID, name, class, color, base attributes/life/mana, `attack` (`melee`/`ranged`), starter weapon, exactly three skill IDs. The first skill must unlock at level 1. Any hero can use equipment that meets its strength requirement.                                                    |
| Spell        | `effect`: projectile, nova, melee, leap, summon or curse; choose physical/fire/cold/poison damage, strength/energy scaling, piercing, slow duration, mana, cooldown, range, radius and unlock level. Cooldown/slow units are 100 ms ticks. New effect families need a rule implementation and tests. |
| Item         | Base slot (`weapon`, `armor`, `charm`), damage, armor and integer grid width/height. Seeded loot adds rarity, vitality/energy/resistance/leech and sockets. New affix families require a rule change.                                                                                                |
| Monster/boss | Base life, damage, movement, attack range, element/resistances, sprite shape and attack pattern (melee/ranged/nova/summoner); `hazardRadius` sizes the targeted boss warning. Map boss IDs select the final guardian.                                                                                |
| Map          | 41×29 grid, inclusive floor rectangles in `rooms`, start/waypoint/exit/boss positions, ward stones, chests, monster pool and story text. Validator requires every objective to be connected. Packs support 1–12 maps. Encounters and drops are seeded.                                               |

`validateContent` checks JSON structure, bounds, references, unique IDs and objective reachability. No mod code executes on import. Renderer shapes and the six skill effect families are intentionally finite extension points. Baseline sprites are approximate; a new hero gets a generic robed silhouette until an authored renderer is added.

Every behavior/content change that alters replay meaning requires a pack version update; rules changes also bump `RULES_VERSION`. Old rules versions are rejected explicitly. Save imports reconstruct every command, reject invalid histories, cap JSON at 16 MB, commands at 50,000 and simulation ticks at 100,000 (2h 46m 40s). Export and start a fresh journey for longer sessions. Network, multiplayer, external mod execution, the full Diablo II content catalogue, and exact frame-table fidelity are outside this baseline.
