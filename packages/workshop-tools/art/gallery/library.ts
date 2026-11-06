/** Review metadata only. Content definitions and live renderers own the artwork. */
export const GAME_COLLECTIONS = [
  { id: 'blindside', name: 'Blindside', scope: 'Cards, Jokers, bosses and shop objects.' },
  {
    id: 'spire',
    name: 'Slay the Spire',
    scope: 'Cards, upgrades, enemy portraits, items, scenes and intent cues.',
  },
  {
    id: 'hearth',
    name: 'Last Hearth',
    scope: 'Minions, Golden variants, heroes, powers, spells and combat cues.',
  },
  {
    id: 'cartographer',
    name: 'Dungeon Cartographer',
    scope: 'Inhabitants, navigation and room-material specimens.',
  },
  {
    id: 'emberwake',
    name: 'Emberwake',
    scope:
      'Live Canvas specimens of the three heroes and crypt enemies. Terrain and effects are not exhaustively catalogued.',
  },
  {
    id: 'night-passage',
    name: 'Night Passage',
    scope:
      'Choice symbols and a fixed Canvas fallback scene. Native 3D assets stay in the 3D gallery.',
  },
  {
    id: 'scrapyard',
    name: 'Scrapyard',
    scope: 'A fixed scene from the separate Canvas prototype. No standalone SVG collection.',
  },
] as const;

export type CollectionId = (typeof GAME_COLLECTIONS)[number]['id'];
export function assetCollection(id: string): CollectionId | 'shared' {
  const prefix = id.split('/')[0];
  return GAME_COLLECTIONS.find((game) => game.id === prefix)?.id ?? 'shared';
}

export interface Upgrade {
  id: string;
  game: CollectionId;
  date: string;
  title: string;
  summary: string;
  record: string;
  image: string;
  revision: string;
  recordRevision?: string;
}

/** Retained, dated comparisons; these are not fresh captures or blanket user approval. */
export const RECENT_UPGRADES: Upgrade[] = [
  {
    id: 'backflip',
    game: 'spire',
    date: '2026-10-31',
    title: 'Backflip+ gains a distinct flip silhouette',
    summary:
      'The upgraded card now has an inverted boot and a stronger turning gesture. Current game source includes this replacement.',
    record: 'docs/art/assets/spire-physical-actions/sample-review.md',
    image: 'docs/art/assets/spire-physical-actions/current-set-comparison.png',
    revision: '09b99fa',
  },
  {
    id: 'drake',
    game: 'hearth',
    date: '2026-10-30',
    title: 'Iron Drake becomes a mechanical dragon',
    summary:
      'A swept neck, hooked jaw and fitted wing hinge replace the canine-looking portrait. Normal and Golden variants retain their IDs.',
    record: 'docs/art/assets/hearth-iron-drake/README.md',
    image: 'docs/art/assets/hearth-iron-drake/comparison.webp',
    revision: '3fc9145',
  },
  {
    id: 'constructs',
    game: 'spire',
    date: '2026-10-30',
    title: 'Four Beyond constructs separate their silhouettes',
    summary:
      'Spiker, Repulsor, Exploder and Orb Walker now have different metal structures. Historical captures; independent visual approval is not established here.',
    record: 'docs/art/assets/spire-beyond-constructs/README.md',
    image: 'docs/art/assets/spire-beyond-constructs/overview.webp',
    revision: '9f7ada7',
  },
  {
    id: 'potions',
    game: 'spire',
    date: '2026-10-30',
    title: 'Damage potions read differently at belt size',
    summary:
      'Fire uses tilted glass; Explosive uses a squat reinforced vessel. The retained review includes the actual 24 px belt.',
    record: 'docs/art/assets/spire-damage-potions/README.md',
    image: 'docs/art/assets/spire-damage-potions/overview.png',
    revision: '5735697',
  },
  {
    id: 'planets',
    game: 'blindside',
    date: '2026-10-28',
    title: 'Nine planets gain engraved surface planes',
    summary: 'Material and surface contours distinguish the planets at full and pocket sizes.',
    record: 'docs/art/assets/blindside-planets/README.md',
    image: 'docs/art/assets/blindside-planets/overview.png',
    revision: '49a8105',
  },
  {
    id: 'city',
    game: 'spire',
    date: '2026-10-28',
    title: 'Seven City enemies gain distinct portraits',
    summary:
      'Connected poses and different contours replace repeated combat figures. These live portraits now enter the cabinet too.',
    record: 'docs/art/assets/spire-city-portraits/README.md',
    image: 'docs/art/assets/spire-city-portraits/overview.png',
    revision: '7c851ac',
  },
  {
    id: 'inhabitants',
    game: 'cartographer',
    date: '2026-10-28',
    title: 'Six inhabitants share readable tactical portraits',
    summary:
      'The keeper, guardian, scribe, inkling, censer and king use the same art in tiles and the inspector.',
    record: 'docs/art/assets/cartographer-inhabitants/README.md',
    image: 'docs/art/assets/cartographer-inhabitants/overview.webp',
    revision: '24e5c34',
  },
  {
    id: 'elementals',
    game: 'hearth',
    date: '2026-10-28',
    title: 'Six elementals gain distinct weight and materials',
    summary:
      'Fire, molten rock, storm, dancer, glass funnel and mountain forms replace repeated templates. Golden variants are included.',
    record: 'docs/art/assets/hearth-elementals/README.md',
    image: 'docs/art/assets/hearth-elementals/normal.webp',
    revision: '9ed7497',
    recordRevision: '7ed9181',
  },
  {
    id: 'mechs',
    game: 'hearth',
    date: '2026-10-28',
    title: 'Core mechs gain different working silhouettes',
    summary:
      'Mechanical roles gain different masses and attachments while retaining the existing gameplay definitions.',
    record: 'docs/art/assets/hearth-mech-roles/README.md',
    image: 'docs/art/assets/hearth-mech-roles/normal-1.webp',
    revision: '1326790',
  },
  {
    id: 'opening-jokers',
    game: 'blindside',
    date: '2026-10-28',
    title: 'Opening Jokers receive composed subjects',
    summary: 'Six early Jokers gain stronger material subjects and connected compositions.',
    record: 'docs/art/assets/blindside-opening-jokers/README.md',
    image: 'docs/art/assets/blindside-opening-jokers/sheet-01.png',
    revision: 'e790257',
    recordRevision: '3b92d61',
  },
  {
    id: 'emberwake',
    game: 'emberwake',
    date: '2026-10-27',
    title: 'Heroes and crypt enemies gain distinct silhouettes',
    summary:
      'Rook, Mira, Silas, archer, wraith and Bellkeeper use authored Canvas figures. These are retained staged comparisons, not campaign witnesses.',
    record: 'docs/art/assets/emberwake-silhouettes/README.md',
    image: 'docs/art/assets/emberwake-silhouettes/after-scene.webp',
    revision: 'ad76602',
    recordRevision: '812ec8f',
  },
  {
    id: 'room-materials',
    game: 'cartographer',
    date: '2026-10-28',
    title: 'Rooms gain dry, wet and overgrown stone treatments',
    summary:
      'Static tile planes and joints distinguish room materials. The retained author review includes phone-sized boards; independent acceptance is separate.',
    record: 'docs/art/assets/cartographer-room-materials/README.md',
    image: 'docs/art/assets/cartographer-room-materials/after-bridge-native.webp',
    revision: 'b400e71',
  },
  {
    id: 'threat-rims',
    game: 'night-passage',
    date: '2026-10-27',
    title: 'Threat rims move inside their gameplay footprints',
    summary:
      'Inset bands keep warning interiors open. The retained trial records its draw-cost limits and pending independent visual acceptance.',
    record: 'docs/art/trials/night-passage-threat-rim.md',
    image: 'docs/art/assets/night-passage-threat-rim/inset-canvas.webp',
    revision: 'f557c2f',
  },
];

export interface BatchCandidate {
  id: string;
  game: CollectionId;
  title: string;
  reason: string;
  brief: string;
  current: string[];
  status: 'Review first' | 'SVG trial';
  trial?: { file: string; record: string };
}

export const NEXT_BATCH: BatchCandidate[] = [
  {
    id: 'metallicize',
    trial: {
      file: 'docs/art/assets/spire-image-2.6/metallicize.svg',
      record: 'docs/art/assets/spire-image-2.6/README.md',
    },
    game: 'spire',
    title: 'Metallicize',
    reason:
      'The dominant helmet repeats across several Ironclad cards; small gears carry the hardening identity.',
    brief:
      'A plated forearm hardening into fitted steel, preserving the restrained ink and copper palette.',
    current: ['spire/metallicize', 'spire/metallicize-upgraded'],
    status: 'SVG trial',
  },
  {
    id: 'ghostlyArmor',
    trial: {
      file: 'docs/art/assets/spire-image-2.6/ghostlyArmor.svg',
      record: 'docs/art/assets/spire-image-2.6/README.md',
    },
    game: 'spire',
    title: 'Ghostly Armor',
    reason:
      'A tinted helmet carries most of the shape; spectral details are smaller than the main contour.',
    brief:
      'An empty, hollow suit of spectral armor with open negative space and restrained teal vapor.',
    current: ['spire/ghostlyArmor', 'spire/ghostlyArmor-upgraded'],
    status: 'SVG trial',
  },
  {
    id: 'sentinel',
    trial: {
      file: 'docs/art/assets/spire-image-2.6/sentinel.svg',
      record: 'docs/art/assets/spire-image-2.6/README.md',
    },
    game: 'spire',
    title: 'Sentinel',
    reason: 'The helmet repeats Metallicize; the wall and energy mark remain small secondary cues.',
    brief:
      'A grounded watchman behind a tall shield, with a small energy reserve visible at its edge.',
    current: ['spire/sentinel', 'spire/sentinel-upgraded'],
    status: 'SVG trial',
  },
  {
    id: 'joker-recognition',
    game: 'blindside',
    title: 'Small Joker subjects at pocket scale',
    reason:
      'Constellation, Odd Company and Less Is More rely on small, sparse motifs. Recognition at the smallest use needs a matched review.',
    brief:
      'Compare the existing silhouettes first. Adapt their current primitives only if the review shows a real readability gap.',
    current: ['blindside/jokers/constellation', 'blindside/jokers/odd', 'blindside/jokers/minimal'],
    status: 'Review first',
  },
  {
    id: 'hearth-feedback',
    game: 'hearth',
    title: 'Rebirth and finishing-hit cues',
    reason:
      'Shield loss already has a named shape. Other combat transitions remain proposed in the feedback study.',
    brief:
      'Reuse recorded combat frames and existing ink families; test recognition before adding another cue.',
    current: ['hearth/feedback/shield-break'],
    status: 'Review first',
  },
  {
    id: 'cartographer-terrain',
    game: 'cartographer',
    title: 'Terrain and occupied doorway recognition',
    reason:
      'Room materials and frontier marks exist; their combined phone-size reading needs review before expanding the tile language.',
    brief: 'Compare wall, floor, water and occupied exits using the current renderer and labels.',
    current: ['cartographer/feedback/frontier'],
    status: 'Review first',
  },
  {
    id: 'emberwake-impacts',
    game: 'emberwake',
    title: 'Elemental impact shapes',
    reason:
      'The existing feedback plan proposes distinct physical, fire, cold and poison shapes in crowded combat.',
    brief:
      'Review the current bounded effects pool. Reuse its timing and damage deltas; preserve visible terrain and threats.',
    current: [],
    status: 'Review first',
  },
  {
    id: 'night-passage-threats',
    game: 'night-passage',
    title: 'Threat silhouettes from the gameplay camera',
    reason:
      'The current scene mixes ground warnings and raised effects. Readability must be judged in context.',
    brief:
      'Review one brute or guardian windup and its static reduced-motion pose. Reuse current shapes before authoring new art.',
    current: [],
    status: 'Review first',
  },
  {
    id: 'scrapyard-enemies',
    game: 'scrapyard',
    title: 'Prototype enemy roles at horde scale',
    reason:
      'The prototype deliberately uses simple bodies. A dense-scene review should establish whether additional silhouettes help.',
    brief:
      'Compare the current spitter barrel and windup ring against melee bodies before proposing production assets.',
    current: [],
    status: 'Review first',
  },
];

/** Files copied into the historical comparison reports; paths are also CI inputs. */
export const FEEDBACK_CAPTURES = {
  combat: {
    before: 'docs/art/assets/spire-intent/before-battlefield.webp',
    after: 'docs/art/assets/spire-intent/after-battlefield.webp',
  },
  score: {
    before: 'docs/art/assets/blindside-score/before-score.webp',
    after: 'docs/art/assets/blindside-score/after-score.webp',
  },
  shield: {
    before: 'docs/art/assets/hearth-shield/before-unit.webp',
    after: 'docs/art/assets/hearth-shield/after-unit.webp',
  },
  cartographer: {
    before: 'docs/art/assets/cartographer-map/before-board.webp',
    after: 'docs/art/assets/cartographer-map/after-board.webp',
    threatBefore: 'docs/art/assets/cartographer-map/before-threat.webp',
    threatAfter: 'docs/art/assets/cartographer-map/after-threat.webp',
  },
  emberwake: {
    beforeScene: 'docs/art/assets/emberwake-silhouettes/before-scene.webp',
    afterScene: 'docs/art/assets/emberwake-silhouettes/after-scene.webp',
    beforeZoom: 'docs/art/assets/emberwake-silhouettes/before-zoom.webp',
    afterZoom: 'docs/art/assets/emberwake-silhouettes/after-zoom.webp',
  },
} as const;

export const FEEDBACK_STYLES = [
  'packages/workshop-tools/art/gallery/reviews/gallery.css',
  'src/games/spire/ui/IntentCue.css',
  'src/games/balatro/ui/ScoreFeedback.css',
  'src/games/battlegrounds/ui/ShieldFeedback.css',
  'src/games/cartographer/ui/MapCues.css',
] as const;

/** Explicit filesystem inputs supplement the import graph without loading renderers. */
export const GALLERY_INPUTS: readonly string[] = [
  ...RECENT_UPGRADES.map((upgrade) => upgrade.image),
  ...NEXT_BATCH.flatMap((candidate) =>
    candidate.trial ? [candidate.trial.file, candidate.trial.record] : [],
  ),
  ...Object.values(FEEDBACK_CAPTURES).flatMap((captures) => Object.values(captures)),
  ...FEEDBACK_STYLES,
  'packages/workshop-tools/art/gallery/cabinet.css',
  'packages/workshop-tools/art/gallery/reviews/CHANGELOG.json',
  'src/games/cartographer/ui/styles.css',
];
