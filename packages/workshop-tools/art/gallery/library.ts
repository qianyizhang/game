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
    id: 'hearth-small-unit-refinement',
    game: 'hearth',
    date: '2026-11-06',
    title: 'Six opening minions gain distinct Golden gestures',
    summary:
      'Refined Squire and Cub pairs, selected packed Pup and Wisp pairs, and hand-refined Golden Imp and Spark replace ten scenes. The stronger existing normal Imp and Spark remain. Author-reviewed under the user’s refinement instruction; earlier failures stay preserved.',
    record: 'docs/art/assets/hearth-refinement/README.md',
    image: 'docs/art/assets/hearth-refinement/comparison.webp',
    revision: '2026-11-06 refinement',
  },
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
  state?:
    | 'Generating'
    | 'Generated · awaiting review'
    | 'Accepted · selected art installed'
    | 'Partial result · MAX request failed'
    | 'Selected · installed after refinement';
  archived?: boolean;
  study?: {
    summary: string;
    sheet: string;
    sheetLabel?: string;
    subjects: {
      title: string;
      tiers: ({ label: string } & (
        { file: string; unavailable?: never } | { file?: never; unavailable: string }
      ))[];
    }[];
    effect?: { title: string; file: string; still: string; durationMs: number };
    attachments: string[];
  };
}

/** Proposed and retained batches. Generation agreement and artwork acceptance are separate. */
export const WIP_BATCHES: BatchProposal[] = [
  {
    id: 'hearth-refinement-04',
    game: 'hearth',
    state: 'Selected · installed after refinement',
    title: 'Batch 04 · Refined Hearth opening units',
    reason:
      'Squire and Cub needed connected anatomy; packed Imp lost its demon identity. Focused pairs and selective reuse now give all six units readable normal/Golden gestures.',
    candidates: [],
    reference:
      'Current Hearth frames, natural creature materials, forest ink, cream and restrained copper. Keep the strong normal Imp and Spark; refine their Golden actions by hand.',
    deliverables:
      'Twelve selected normal/Golden views: ten updated scenes and two retained normals, all from the live game renderer.',
    requests: [
      {
        format: 'SVG',
        plan: 'One focused Squire pair at 1600 × 560, high image quality/complexity and medium SVG-author effort. Returned; adapted gradients to flat planes.',
      },
      {
        format: 'SVG',
        plan: 'One focused Cub pair with the same settings. Returned; Golden steps over a root rather than raising a stiff paw.',
      },
      {
        format: 'SVG',
        plan: 'One focused Imp pair returned HTTP 502 without art or usage; retain the failed attempt.',
      },
      {
        format: 'SVG',
        plan: 'One explicit Imp retry returned HTTP 502 again. Stop that route; reuse its existing face and hand-refine the Golden gesture.',
      },
    ],
    stop: 'The user authorized refinement until author satisfaction. This set passed author review at card, board and phone sizes and is installed locally. Paid refinement has stopped; user acceptance is still distinct from this author selection. No GIF or new cohort was generated.',
    acceptance: [
      'Review every normal/Golden pair at 160 × 112, 80 × 56 and 64 × 45 in current frames.',
      'Check connected support and readable silhouette before material detail; keep stronger current artwork where it wins.',
      'Verify the actual card renderer, selection, labels, stats and compact phone layout; preserve every prompt, original, extraction and failure.',
    ],
    record: 'docs/art/assets/hearth-refinement/README.md',
    study: {
      summary:
        'Author-selected set installed locally. Focused Squire and Cub pairs cost about $0.30 combined; the two Imp 502 attempts have unknown billing. Pup and Wisp come from the original packed sheet; normal Imp/Spark are retained and their Golden gestures are hand-refined. Prior trials are below under history.',
      sheet: 'docs/art/assets/hearth-refinement/selected-sheet.svg',
      sheetLabel: 'Selected set · live game frames',
      subjects: [
        { id: 'squire', title: 'Hearth Squire · guarded / braced' },
        { id: 'cub', title: 'Briar Cub · crouch / root step' },
        { id: 'pup', title: 'Clockwork Pup · sniff / raised forepaw' },
        { id: 'imp', title: 'Coal Imp · portrait / coal offering' },
        { id: 'spark', title: 'Kindle Spark · compact / sweeping flame' },
        { id: 'wisp', title: 'Coal Wisp · curled / rising spirit' },
      ].map(({ id, title }) => ({
        title,
        tiers: ['normal', 'golden'].map((tier) => ({
          label: `${tier === 'golden' ? 'Golden' : 'Normal'} · selected live artwork`,
          file: `docs/art/assets/hearth-refinement/selected-${id}-${tier}.svg`,
        })),
      })),
      attachments: [
        'selection.json',
        'comparison.webp',
        'compact-review.webp',
        'review-desktop.webp',
        'review-phone.webp',
        'squire-r1-prompt.md',
        'squire-r1-request.json',
        'squire-r1-response.json',
        'squire-r1-sheet.svg',
        'squire-r1-normal.svg',
        'squire-r1-golden.svg',
        'squire-selected-normal.svg',
        'squire-selected-golden.svg',
        'cub-r1-prompt.md',
        'cub-r1-request.json',
        'cub-r1-response.json',
        'cub-r1-sheet.svg',
        'cub-r1-normal.svg',
        'cub-r1-golden.svg',
        'imp-r1-prompt.md',
        'imp-r1-request.json',
        'imp-r1-error.json',
        'imp-r2-request.json',
        'imp-r2-error.json',
        'spark-golden-manual.svg',
      ].map((file) => `docs/art/assets/hearth-refinement/${file}`),
    },
  },
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
    id: 'hearth-effort-03',
    archived: true,
    state: 'Partial result · MAX request failed',
    game: 'hearth',
    title: 'Batch 03 · Single medium versus packed MAX',
    reason:
      'The original packed Squire and Cub were below the bar. Compare one dedicated Cub at medium effort with the attempted original sheet at MAX effort.',
    candidates: ['hearth-cub-effort', 'hearth-squire-effort'],
    reference:
      'Same Hearth identity and palette. The repeat sheet kept its original prompt, size and medium image quality; the single Cub used a larger subject canvas and high image quality.',
    deliverables:
      'One returned Cub SVG. The MAX sheet connection closed without an SVG, request ID or usage response; its quality and billing remain unknown.',
    requests: [
      {
        format: 'SVG',
        plan: 'Single normal Cub: 1280 × 896, high image quality and medium SVG-author reasoning. Returned in 208.8 seconds for an estimated $0.145621.',
      },
      {
        format: 'SVG',
        plan: 'Original twelve-scene prompt and 1920 × 1008 layout, medium image quality, author reasoning max. Remote connection closed after roughly ten minutes; no response was returned.',
      },
    ],
    stop: 'Two approved requests attempted, no retries. Keep live game art unchanged. The MAX failure does not establish its quality or a zero charge; another paid attempt needs agreement.',
    acceptance: [
      'Judge connected muzzle/neck/shoulder, planted paws, joints and weight at 160 × 112, 80 × 56 and 64 × 45.',
      'Keep original failures and all new sources; a denser single SVG is still an unaccepted candidate.',
      'Do not attribute every visual difference to reasoning: the internal reference is resampled and the single also changes prompt, canvas and image quality.',
    ],
    record: 'docs/art/assets/hearth-effort-comparison/README.md',
    study: {
      summary:
        'The medium single has more continuous curves, but its far foreleg remains straight and it still needs review. The MAX request failed at the connection after roughly ten minutes; missing slots below are explicit failures. Known single cost: about $0.15. MAX cost: unknown.',
      sheet: 'docs/art/assets/hearth-small-units-batch/sheet.svg',
      sheetLabel: 'Original LOW batch · retained baseline',
      subjects: [
        {
          title: 'Briar Cub · normal',
          tiers: [
            {
              label: 'Current normal · framed',
              file: 'docs/art/assets/hearth-small-units-batch/before-cub.svg',
            },
            {
              label: 'Original batch · LOW · below bar',
              file: 'docs/art/assets/hearth-small-units-batch/cub-normal.svg',
            },
            {
              label: 'Repeat batch · MAX',
              unavailable: 'No SVG returned: connection closed.',
            },
            {
              label: 'Single Cub · MEDIUM · awaiting review',
              file: 'docs/art/assets/hearth-effort-comparison/single-medium.svg',
            },
          ],
        },
        ...[
          { title: 'Briar Cub · Golden', id: 'cub', tier: 'golden' },
          { title: 'Hearth Squire · normal', id: 'squire', tier: 'normal' },
          { title: 'Hearth Squire · Golden', id: 'squire', tier: 'golden' },
        ].map(({ title, id, tier }) => ({
          title,
          tiers: [
            {
              label: `Current ${tier} · framed`,
              file: `docs/art/assets/hearth-small-units-batch/before-${id}${tier === 'golden' ? '-golden' : ''}.svg`,
            },
            {
              label: 'Original batch · LOW · below bar',
              file: `docs/art/assets/hearth-small-units-batch/${id}-${tier}.svg`,
            },
            {
              label: 'Repeat batch · MAX',
              unavailable: 'No SVG returned: connection closed.',
            },
          ],
        })),
      ],
      attachments: [
        'docs/art/assets/hearth-effort-comparison/single-cub-prompt.md',
        'docs/art/assets/hearth-effort-comparison/single-medium-request.json',
        'docs/art/assets/hearth-effort-comparison/single-medium-response.json',
        'docs/art/assets/hearth-effort-comparison/batch-max-prompt.md',
        'docs/art/assets/hearth-effort-comparison/batch-max-request.json',
        'docs/art/assets/hearth-effort-comparison/batch-max-error.json',
        'docs/art/assets/hearth-effort-comparison/comparison.webp',
        'docs/art/assets/hearth-effort-comparison/small-board.webp',
      ],
    },
  },
  {
    id: 'hearth-small-units-02',
    archived: true,
    state: 'Generated · awaiting review',
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
    stop: 'Generation agreed November 6. One SVG request completed, no retries or rerolls. Candidates await artwork acceptance and frame/board integration. Boss transformation and VFX GIFs belong to a separate effect brief.',
    acceptance: [
      'Distinct normal/Golden gestures survive at 160 × 112 and 80 × 56 without relying on color or border.',
      'Connected anatomy, clear material planes, consistent style and clean cell extraction; retain stronger existing normal art when appropriate.',
      'Judge recruitment/combat board and phone sizes before promotion; report cost per useful cell, including rejects.',
    ],
    record: 'docs/art/assets/hearth-small-units-batch/README.md',
    study: {
      summary:
        'Mixed quality: Squire and Cub are below the bar in user review; keep their current art. One $0.16 request produced twelve separable scenes, but tier differences did not establish anatomy quality. Other candidates remain unaccepted. A later medium single returned; the agreed MAX repeat lost its connection. See Batch 03 for the partial comparison; no unapproved reroll was sent.',
      sheet: 'docs/art/assets/hearth-small-units-batch/sheet.svg',
      subjects: [
        { id: 'squire', title: 'Hearth Squire · below bar' },
        { id: 'pup', title: 'Clockwork Pup' },
        { id: 'imp', title: 'Coal Imp' },
        { id: 'spark', title: 'Kindle Spark' },
        { id: 'cub', title: 'Briar Cub · below bar' },
        { id: 'wisp', title: 'Coal Wisp' },
      ].map(({ id, title }) => ({
        title,
        tiers: [
          { suffix: `before-${id}`, label: 'Current normal · framed' },
          { suffix: `${id}-normal`, label: 'Normal candidate · art only' },
          { suffix: `before-${id}-golden`, label: 'Current Golden · framed' },
          { suffix: `${id}-golden`, label: 'Golden candidate · art only' },
        ].map(({ suffix, label }) => ({
          label:
            ['squire', 'cub'].includes(id) && !suffix.startsWith('before-')
              ? `${label} · below bar`
              : label,
          file: `docs/art/assets/hearth-small-units-batch/${suffix}.svg`,
        })),
      })),
      attachments: [
        'docs/art/assets/hearth-small-units-batch/svg-prompt.md',
        'docs/art/assets/hearth-small-units-batch/svg-request.json',
        'docs/art/assets/hearth-small-units-batch/svg-response.json',
        'docs/art/assets/hearth-small-units-batch/comparison.webp',
        'docs/art/assets/hearth-small-units-batch/board-size-review.webp',
      ],
    },
  },
];

export const NEXT_BATCH: BatchCandidate[] = [
  {
    id: 'hearth-cub-effort',
    game: 'hearth',
    title: 'Briar Cub · effort comparison',
    reason:
      'The packed Cub was below the bar. A dedicated medium-effort Cub returned; the MAX batch attempt did not return an image.',
    brief:
      'Review organic transitions, joint placement and planted weight before selecting a replacement.',
    current: ['hearth/cub', 'hearth/cub-golden'],
    status: 'SVG trial',
  },
  {
    id: 'hearth-squire-effort',
    game: 'hearth',
    title: 'Hearth Squire · MAX attempt',
    reason:
      'The original Squire was below the bar. The MAX comparison failed at the connection, so no new Squire can be judged.',
    brief:
      'Keep the current Squire; preserve the attempted request and failure for a later decision.',
    current: ['hearth/squire', 'hearth/squire-golden'],
    status: 'SVG trial',
  },
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
      'The original baseline shared its pose. The later refined set now supplies distinct normal/Golden gestures; the first packed candidates remain preserved here.',
    brief,
    current: [`hearth/${id}`, `hearth/${id}-golden`],
    status: 'SVG trial',
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
          ...batch.study.subjects.flatMap((subject) =>
            subject.tiers.flatMap((tier) => (tier.file ? [tier.file] : [])),
          ),
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
