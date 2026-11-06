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
    scope:
      'Twenty native SVG sources, cached Canvas sprites and bounded hit/pickup cues; generated source sheets remain in WIP.',
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
    id: 'spire-defense-packed',
    game: 'spire',
    date: '2026-11-06',
    title: 'Three defensive cards gain distinct base and upgrade silhouettes',
    summary:
      'Selected six packed SVG scenes replace the repeated helmets. Stronger third-row scenes become the actual upgrades; unused variants, originals and prompts remain preserved.',
    record: 'docs/art/assets/spire-defense-batch/README.md',
    image: 'docs/art/assets/spire-defense-batch/adoption-comparison.webp',
    revision: '2026-11-06 adoption',
  },
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
  status: 'Review first' | 'SVG trial' | 'Installed';
  trial?: { file: string; record: string };
}

export interface BatchProposal {
  id: string;
  game: CollectionId;
  title: string;
  reason: string;
  candidates: string[];
  reference: string;
  deliverables: string;
  requests: { format: 'SVG' | 'GIF'; plan: string }[];
  stop: string;
  acceptance: string[];
  record: string;
  state?: 'Generating' | 'Generated · awaiting review' | 'Accepted · selected art installed';
  study?: {
    summary: string;
    sheet: string;
    subjects: { title: string; tiers: { label: string; file: string }[] }[];
    effect?: { title: string; file: string; still: string; durationMs: number };
    attachments: string[];
  };
}

const SCRAPYARD_BATCHES = [
  {
    family: 'actors',
    title: 'Five actor silhouettes',
    reason:
      'Replaces shared circular bodies with five distinct contours, preserving aimed state overlays.',
    subjects: ['survivor', 'drifter', 'runner', 'brute', 'spitter'],
  },
  {
    family: 'equipment',
    title: 'Equipment and shop tools',
    reason: 'Replaces text glyphs with named salvage tools while HTML retains controls and prices.',
    subjects: [
      'rivet-gun',
      'scattergun',
      'scrap-cannon',
      'hotter-rounds',
      'better-boots',
      'field-repair',
    ],
  },
  {
    family: 'combat',
    title: 'Combat marks and bounded VFX',
    reason:
      'Keeps tiny mark footprints and adds confirmed hit/collection cues with bounded lifetimes.',
    subjects: [
      'light-round',
      'heavy-round',
      'hostile-diamond',
      'scrap-pickup',
      'player-hit',
      'scrap-sparkle',
    ],
  },
  {
    family: 'arena',
    title: 'Quiet arena materials',
    reason:
      'Composes a 35% material layer over the original dark floor and keeps the inset boundary cue.',
    subjects: ['floor-tile', 'boundary-strip', 'corner-join'],
  },
];

/** Proposed and retained batches. Generation agreement and artwork acceptance are separate. */
export const WIP_BATCHES: BatchProposal[] = [
  ...SCRAPYARD_BATCHES.map(({ family, title, reason, subjects }): BatchProposal => {
    const folder = `docs/art/assets/scrapyard-suite/${family}`;
    return {
      id: `scrapyard-${family}`,
      state: 'Generated · awaiting review',
      game: 'scrapyard',
      title,
      reason,
      candidates: [],
      reference:
        'Worn steel, cloth and forest ink; three values, cream upper-left light and existing role accents.',
      deliverables: `${subjects.length} extracted native SVG sources; editable local adaptation and matched native/phone review.`,
      requests: [
        {
          format: 'SVG',
          plan: `One Image 2.6 Sunburst native SVG sheet, 1152×768, named 384px cells for ${family}. Terra SVG author, low reasoning.`,
        },
      ],
      stop: 'Generation complete. No artwork rerolls or revisions used. The shared US$5 cap includes all four families; publication and user acceptance remain pending.',
      acceptance: [
        'Technical XML/resource validation and standalone decoding.',
        'Review every source at actual logical and 390px phone scale.',
        'Matched sparse and 100/300/500-enemy comparisons; preserve collision geometry and state-driven overlays.',
        'Separate application/browser/performance evidence from author visual review.',
      ],
      record: 'docs/art/assets/scrapyard-suite/README.md',
      study: {
        summary:
          'Locally integrated for review. Native source originals, prompts and usage are preserved; no published runtime change or user visual acceptance is implied.',
        sheet: `${folder}/sheet.svg`,
        subjects: subjects.map((id) => ({
          title: id.replaceAll('-', ' '),
          tiers: [{ label: 'Source candidate · local adaptation', file: `${folder}/${id}.svg` }],
        })),
        attachments: [
          'prompt.md',
          'request.json',
          'response.json',
          'cells.json',
          'extraction.json',
          'review.png',
        ].map((name) => `${folder}/${name}`),
      },
    };
  }),
  {
    id: 'spire-defense-01',
    state: 'Accepted · selected art installed',
    game: 'spire',
    title: 'Batch 01 · Three defensive identities',
    reason:
      'Selected scenes now replace the repeated helmets with a plated arm, hollow armor and planted shield bearer, each with a distinct upgrade.',
    candidates: ['metallicize', 'ghostlyArmor', 'sentinel'],
    reference:
      'Ironclad ink, steel and copper; the live game frame and light direction. Earlier independent SVGs and unused packed cells remain reference material.',
    deliverables:
      'Nine SVG illustrations: regular, upgrade and future-tier concepts for three cards, plus one Metallicize play-effect GIF.',
    requests: [
      {
        format: 'SVG',
        plan: 'One native SVG sheet: 3 columns × 3 rows, 1440 × 1008, with nine separable 480 × 336 scenes. The third row explores a future tier; judge consistency and clean extraction.',
      },
      {
        format: 'GIF',
        plan: 'Only if the SVG sheet is useful: rasterize its Metallicize scene as a shared reference, then request one native 12-frame play-effect GIF. Plates form, lock and settle into a useful still.',
      },
    ],
    stop: 'Two requests completed. The user accepted the batch November 6 and authorized selection for the game. Six static scenes are installed; the GIF remains a motion study. Further paid requests require a new agreed batch.',
    acceptance: [
      'Different subjects and real base/upgrade changes read at 160 × 112 and 80 × 56.',
      'One visual style across the set; clean vector scenes, with no raster wrappers or cross-cell debris.',
      'The GIF preserves the static subject and palette; the play action forms, locks and settles with a useful reduced-motion still.',
      'Review in the actual card frame and phone hand before runtime promotion. Report cost and time per accepted illustration, including rejected work.',
    ],
    record: 'docs/art/assets/spire-defense-batch/README.md',
    study: {
      summary:
        'Six scenes are installed: the regular row supplies base art, and the strongest third-row silhouettes supply upgrades. The middle row remains an alternate. The $0.16 sheet yielded nine scenes (1.7¢ each; 2.6¢ per selected scene). The $0.06 GIF remains a reference study because its formation motion is weak.',
      sheet: 'docs/art/assets/spire-defense-batch/sheet.svg',
      subjects: [
        { id: 'metallicize', title: 'Metallicize' },
        { id: 'ghostlyArmor', title: 'Ghostly Armor' },
        { id: 'sentinel', title: 'Sentinel' },
      ].map(({ id, title }) => ({
        title,
        tiers: [
          { suffix: 'base', label: 'Regular · selected for game' },
          { suffix: 'upgraded', label: 'Alternate upgrade · retained' },
          { suffix: 'future', label: 'Upgrade · selected from future concept' },
        ].map(({ suffix, label }) => ({
          label,
          file: `docs/art/assets/spire-defense-batch/${id}-${suffix}.svg`,
        })),
      })),
      effect: {
        title: 'Metallicize · play-effect study',
        file: 'docs/art/assets/spire-defense-batch/metallicize-play.gif',
        still: 'docs/art/assets/spire-defense-batch/metallicize-still.png',
        durationMs: 1200,
      },
      attachments: [
        'docs/art/assets/spire-defense-batch/svg-prompt.md',
        'docs/art/assets/spire-defense-batch/svg-request.json',
        'docs/art/assets/spire-defense-batch/svg-response.json',
        'docs/art/assets/spire-defense-batch/gif-prompt.md',
        'docs/art/assets/spire-defense-batch/gif-request.json',
        'docs/art/assets/spire-defense-batch/gif-response.json',
        'docs/art/assets/spire-defense-batch/reference.png',
        'docs/art/assets/spire-defense-batch/adoption-comparison.webp',
        ...['metallicize', 'ghostlyArmor', 'sentinel'].flatMap((id) =>
          ['', '-upgraded'].map(
            (suffix) => `docs/art/assets/spire-defense-batch/before-${id}${suffix}.svg`,
          ),
        ),
      ],
    },
  },
  {
    id: 'hearth-small-units-02',
    game: 'hearth',
    title: 'Batch 02 · Six small units, normal and Golden',
    reason:
      'These frequently repeated small units use the same pose for normal and Golden. Give Golden versions a distinct gesture while keeping simple, related shapes.',
    candidates: [
      'hearth-squire',
      'hearth-pup',
      'hearth-imp',
      'hearth-spark',
      'hearth-cub',
      'hearth-wisp',
    ],
    reference:
      'Hearth forest ink, cream planes and warm accents; current species colors and card framing. Gold supports the gesture rather than replacing it.',
    deliverables:
      'Twelve SVG scenes: six normal/Golden pairs in one sheet. Select only cells that improve the existing game art.',
    requests: [
      {
        format: 'SVG',
        plan: 'One 1920 × 1008 sheet, 4 columns × 3 rows of 480 × 336 scenes. Two adjacent normal/Golden pairs per row; preserve separable groups and quiet margins.',
      },
    ],
    stop: 'Await agreement. One SVG request maximum; no automatic retries or rerolls. Show weak cells before proposing repair. Boss transformation and VFX GIFs belong to a separate effect brief.',
    acceptance: [
      'Distinct normal/Golden gestures survive at 160 × 112 and 80 × 56 without relying on color or border.',
      'Connected anatomy, clear material planes, consistent style and clean cell extraction; retain stronger existing normal art when appropriate.',
      'Judge recruitment/combat board and phone sizes before promotion; report cost per useful cell, including rejects.',
    ],
    record: 'docs/art/assets/hearth-small-units-batch/README.md',
  },
];

export const NEXT_BATCH: BatchCandidate[] = [
  ...[
    {
      id: 'squire',
      title: 'Hearth Squire',
      brief: 'Connected shield-bearing arm; Golden raises and angles the shield.',
    },
    {
      id: 'pup',
      title: 'Clockwork Pup',
      brief: 'Compact mechanical paws and head; Golden springs forward on a raised forepaw.',
    },
    {
      id: 'imp',
      title: 'Coal Imp',
      brief: 'Crouched coal-bearing imp; Golden plants its feet and offers the coal outward.',
    },
    {
      id: 'spark',
      title: 'Kindle Spark',
      brief: 'Compact flame with an open center; Golden lifts into a wider sweep.',
    },
    {
      id: 'cub',
      title: 'Briar Cub',
      brief: 'Crouched young bear; Golden raises a leading paw and broadens its shoulder gesture.',
    },
    {
      id: 'wisp',
      title: 'Coal Wisp',
      brief:
        'A single curled spirit; Golden rises on a split tail around the same hollow identity.',
    },
  ].map(({ id, title, brief }): BatchCandidate => ({
    id: `hearth-${id}`,
    game: 'hearth',
    title,
    reason:
      'Normal and Golden currently share the same subject pose; the Golden cue comes from the palette and frame.',
    brief,
    current: [`hearth/${id}`, `hearth/${id}-golden`],
    status: 'Review first',
  })),
  {
    id: 'metallicize',
    trial: {
      file: 'docs/art/assets/spire-image-2.6/metallicize.svg',
      record: 'docs/art/assets/spire-image-2.6/README.md',
    },
    game: 'spire',
    title: 'Metallicize',
    reason:
      'A plated forearm now replaces the repeated helmet; its stronger upgrade extends the connected plating and copper lock.',
    brief:
      'A plated forearm hardening into fitted steel, preserving the restrained ink and copper palette.',
    current: ['spire/metallicize', 'spire/metallicize-upgraded'],
    status: 'Installed',
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
      'Hollow connected armor now replaces the tinted helmet; the upgrade opens its arms around a larger empty center.',
    brief:
      'An empty, hollow suit of spectral armor with open negative space and restrained teal vapor.',
    current: ['spire/ghostlyArmor', 'spire/ghostlyArmor-upgraded'],
    status: 'Installed',
  },
  {
    id: 'sentinel',
    trial: {
      file: 'docs/art/assets/spire-image-2.6/sentinel.svg',
      record: 'docs/art/assets/spire-image-2.6/README.md',
    },
    game: 'spire',
    title: 'Sentinel',
    reason:
      'A planted watchman and tall shield now replace the helmet; the upgrade adds a wider brace and visible copper reserve.',
    brief:
      'A grounded watchman behind a tall shield, with a small energy reserve visible at its edge.',
    current: ['spire/sentinel', 'spire/sentinel-upgraded'],
    status: 'Installed',
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
  ...WIP_BATCHES.map((batch) => batch.record),
  ...WIP_BATCHES.flatMap((batch) =>
    batch.study
      ? [
          batch.study.sheet,
          ...batch.study.subjects.flatMap((subject) => subject.tiers.map((tier) => tier.file)),
          ...(batch.study.effect ? [batch.study.effect.file, batch.study.effect.still] : []),
          ...batch.study.attachments,
        ]
      : [],
  ),
  ...NEXT_BATCH.flatMap((candidate) =>
    candidate.trial ? [candidate.trial.file, candidate.trial.record] : [],
  ),
  ...Object.values(FEEDBACK_CAPTURES).flatMap((captures) => Object.values(captures)),
  ...FEEDBACK_STYLES,
  'packages/workshop-tools/art/gallery/cabinet.css',
  'packages/workshop-tools/art/gallery/reviews/CHANGELOG.json',
  'src/games/cartographer/ui/styles.css',
];
