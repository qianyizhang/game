# Shared room layouts

`src/shared/layout/layout.ts` owns seeded placement, rotation, compatible doorways,
frontier discovery, tile rendering and floor reachability. Cartographer and Emberwake
consume the same placement rules with independent chamber kits and game rules.

The bounded first implementation uses a five-by-five board of nine-by-nine room slots.
Each chamber reserves a three-tile-wide central cross connecting its exits. A new room
must fit an empty slot and connect through at least one compatible neighboring doorway.
Facing doors connect automatically, including loops. Unconnected boundaries stay solid.
`renderLayout` supports one- or three-tile-wide passages. Templates and game-specific
rewards are owned by their consumers; combat, navigation timing and campaigns are not
part of the shared module.

- Cartographer attaches one drafted room at a time, rasterizes narrow passages, and owns
  enemy intentions, room rewards, threat, relics and the expedition ending.
- Emberwake assembles nine rooms before play, converts them into its existing inclusive
  room rectangles, terrain patches and wide connecting paths, then validates the expanded
  content. Its renderer, movement, collisions, encounters and save loader remain authoritative.
  The optional region has reciprocal portals and elite patrols. The existing one-boss-per-act
  rule remains intact.

## Reproducibility

`rooms-1` identifies generator behavior. Named seeded streams isolate layout offers,
placement, encounters and relics. Current Cartographer replay identity pins `cartographer-2`
and `rooms-1`; bounded v1 imports retain `cartographer-1` and the same generator. Difficulty
changes starting/maximum life without changing seeded generation. Changes to rules or
generator replay meaning require the corresponding version bump.

The Charted Vault is an opt-in content expansion. It receives a derived pack identity and
version; the exact expanded geometry is embedded in the versioned Emberwake campaign replay (v2 or v3).
The original content is cloned and never mutated. No existing campaign is regenerated,
and reconstructing a generated campaign does not run the generator again. Adding a region
changes RNG consumption for that new pack, which is part of its new-run identity.

## Verification

- Shared module checks sample thirty seeds, both passage widths, center reachability,
  reproducibility, non-overlap and invalid attachment rejection.
- Cartographer command tests protect action atomicity, draft reconstruction, intent timing,
  interruption and death. Five legal-command expeditions cover room drafting, three relic
  choices, victory and exact replay. This sample establishes playable paths, not universal
  winnability or balance across every draft.
- Browser journeys cover keyboard/pointer play, rotation, mobile layout, save recovery,
  download/import, navigation and a complete victory through visible controls.
- Emberwake checks validate fifteen generated packs, cache reachability, replay and reciprocal
  portal persistence. Its browser journey opts into a campaign pack, then visits and reloads
  the generated region in the explicitly labeled developer sandbox. It does not claim a
  complete normal-mode dungeon clear.

The maintained source lives in existing `src`, `tests`, and `packages/diablo2` check scopes.
Select affected shared-layout and game checks under [verification contracts](checks.md#gate-selection),
including the Cartographer and generated-dungeon functional browser journeys.
No 3D construction or DCC delivery changes are involved.
