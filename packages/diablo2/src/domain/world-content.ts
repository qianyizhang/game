import type { ActDef, RegionDef, DungeonDef, Point, Rect } from './types';

const at = (x: number, y: number): Point => ({ x: x + 0.5, y: y + 0.5 });
/** Built-in room kit. Content exports the expanded geometry, so mods need no generator code. */
function layout(outdoor: boolean, theme: RegionDef['theme'], floor: number | null) {
  const width = outdoor ? 72 : 64,
    height = outdoor ? 48 : 44;
  const rooms: Rect[] = [
    [2, 17, 14, 29],
    [20, 3, 33, 14],
    [20, 18, 36, 30],
    [20, height - 13, 34, height - 3],
    [43, 7, width - 4, 20],
    [43, 27, width - 4, height - 4],
  ];
  const nodes = [
    at(8, 23),
    at(26, 8),
    at(28, 24),
    at(27, height - 8),
    at(width - 12, 13),
    at(width - 12, height - 10),
  ];
  const paths = [
    [nodes[0], at(16, 23), at(16, 8), nodes[1]],
    [nodes[0], nodes[2]],
    [nodes[2], nodes[3]],
    [nodes[1], at(39, 8), at(39, 13), nodes[4]],
    [nodes[2], at(39, 24), at(39, height - 10), nodes[5]],
    [nodes[4], nodes[5]],
    [nodes[3], at(39, height - 8), nodes[5]],
  ];
  // The lowest floor joins the eastern chambers into one boss arena.
  if (floor === 3) {
    rooms.splice(4, 2, [43, 7, width - 4, height - 4]);
    paths.splice(3, 1, [nodes[1], at(39, 8), at(39, 13), nodes[4]]);
  }
  const base =
    theme === 'marsh'
      ? 'grass'
      : theme === 'desert'
        ? 'sand'
        : theme === 'crypt'
          ? 'moss'
          : 'floor';
  const obstruction = theme === 'marsh' ? 'water' : theme === 'inferno' ? 'lava' : 'rock';
  const terrain: RegionDef['terrain'] = outdoor
    ? [
        ...rooms.map<RegionDef['terrain'][number]>((bounds) => ({ kind: base, bounds })),
        { kind: obstruction, bounds: [22, 20, 25, 27] },
        { kind: obstruction, bounds: [48, 10, 51, 17] },
      ]
    : [
        {
          kind: theme === 'marsh' ? 'moss' : theme === 'desert' ? 'sand' : 'floor',
          bounds: rooms[2],
        },
        { kind: obstruction, bounds: [46, 29, 49, 34] },
      ];
  const landmarks: RegionDef['landmarks'] = [
    {
      name: outdoor ? 'Approach canopy' : 'Entrance pier',
      kind: outdoor && theme === 'marsh' ? 'tree' : 'pillar',
      at: at(4, 19),
    },
    {
      name: outdoor ? 'Roadside remains' : 'Entrance pier',
      kind: outdoor ? 'bones' : 'pillar',
      at: at(12, 28),
    },
    {
      name:
        theme === 'marsh'
          ? 'Black pine'
          : theme === 'desert'
            ? 'Broken obelisk'
            : theme === 'crypt'
              ? 'Chapel column'
              : 'Furnace stack',
      kind: theme === 'marsh' ? 'tree' : theme === 'desert' ? 'ruin' : 'pillar',
      at: at(23, 6),
    },
    {
      name: outdoor ? 'Forgotten camp' : 'Burial altar',
      kind: outdoor ? 'camp' : 'altar',
      at: at(24, height - 6),
    },
    {
      name: theme === 'marsh' ? 'Root bridge' : 'Weathered remains',
      kind: theme === 'marsh' ? 'bridge' : 'bones',
      at: at(40, 13),
    },
  ];
  return {
    width,
    height,
    rooms,
    paths,
    terrain,
    landmarks,
    start: nodes[0],
    chests: [nodes[1], at(31, height - 7)],
  };
}
type RegionStory = Omit<
  RegionDef,
  'width' | 'height' | 'rooms' | 'paths' | 'terrain' | 'landmarks' | 'start' | 'chests'
>;
function region(story: RegionStory, mirror: 'none' | 'x' | 'y' = 'none'): RegionDef {
  const result = { ...layout(story.floor === null, story.theme, story.floor), ...story };
  if (mirror === 'none') return result;
  const point = (p: Point): Point => ({
    x: mirror === 'x' ? result.width - p.x : p.x,
    y: mirror === 'y' ? result.height - p.y : p.y,
  });
  const rect = (r: Rect): Rect =>
    mirror === 'x'
      ? [result.width - 1 - r[2], r[1], result.width - 1 - r[0], r[3]]
      : [r[0], result.height - 1 - r[3], r[2], result.height - 1 - r[1]];
  return {
    ...result,
    start: point(result.start),
    rooms: result.rooms.map(rect),
    paths: result.paths.map((path) => path.map(point)),
    terrain: result.terrain.map((p) => ({ ...p, bounds: rect(p.bounds) })),
    landmarks: result.landmarks.map((l) => ({ ...l, at: point(l.at) })),
    waypoint: result.waypoint ? point(result.waypoint) : null,
    ward: result.ward ? point(result.ward) : null,
    bossPosition: result.bossPosition ? point(result.bossPosition) : null,
    chests: result.chests.map(point),
    portals: result.portals.map((p) => ({ ...p, at: point(p.at) })),
  };
}
export const ACTS: ActDef[] = [
  {
    id: 'briarfen',
    name: 'Briarfen',
    subtitle: 'I · The stolen lantern',
    introduction:
      'For a century, four lanterns kept the buried king asleep. Last night the fen lantern went dark. Warden Elian sends you to recover its ember before the other lights fail.',
    conclusion:
      'Inside the Widow you find a lantern chain bearing the desert regent’s seal. The theft was planned. Follow the salt road.',
    objective: 'Light both ward stones; defeat the Briar Widow.',
    entry: 'fen-1',
    wards: ['fen-2', 'fen-4'],
    bossRegion: 'fen-5',
  },
  {
    id: 'saltreach',
    name: 'Saltreach',
    subtitle: 'II · A kingdom of glass',
    introduction:
      'The salt road ends at a city turned to glass. Its regent traded the second ember for immortality. Two sun obelisks still hold the palace gate shut.',
    conclusion:
      'The Regent shatters. His bargain names the Bellkeeper beneath the monastery, where the lanterns were first forged.',
    objective: 'Kindle the sun obelisks; break the Glass Regent.',
    entry: 'salt-1',
    wards: ['salt-2', 'salt-4'],
    bossRegion: 'salt-5',
  },
  {
    id: 'hollowbells',
    name: 'Hollow Bells',
    subtitle: 'III · The debt of the dead',
    introduction:
      'The monastery rings with voices of the unburied. The Bellkeeper fed the third ember to the dead. Silence his two funeral bells and take the stair below his altar.',
    conclusion:
      'The bells fall silent. The first wardens did not destroy the king: they imprisoned their own founder. His last ember burns under the world.',
    objective: 'Silence both funeral bells; lay the Bellkeeper to rest.',
    entry: 'bells-1',
    wards: ['bells-2', 'bells-4'],
    bossRegion: 'bells-5',
  },
  {
    id: 'firstfurnace',
    name: 'The First Furnace',
    subtitle: 'IV · A light of our own',
    introduction:
      'Lucent built the lanterns to steal the world’s dawn. His wardens rebelled, but their prison is breaking. Return the embers to the two furnace anchors and end his claim to the light.',
    conclusion:
      'Lucent falls. You break the lantern chain instead of wearing his crown. Dawn reaches Briarfen, Saltreach, and the quiet monastery. Elian opens the refuge gates. The light belongs to everyone.',
    objective: 'Restore both furnace anchors; defeat Lucent.',
    entry: 'furnace-1',
    wards: ['furnace-2', 'furnace-4'],
    bossRegion: 'furnace-5',
  },
];
export const DUNGEONS: DungeonDef[] = [
  {
    id: 'fen-depths',
    act: 'briarfen',
    name: 'Rootbound Catacombs',
    floors: ['fen-3', 'fen-4', 'fen-5'],
  },
  {
    id: 'salt-depths',
    act: 'saltreach',
    name: 'Sunken Glassworks',
    floors: ['salt-3', 'salt-4', 'salt-5'],
  },
  {
    id: 'bells-depths',
    act: 'hollowbells',
    name: 'Ossuary of Bells',
    floors: ['bells-3', 'bells-4', 'bells-5'],
  },
  {
    id: 'furnace-depths',
    act: 'firstfurnace',
    name: 'First Furnace',
    floors: ['furnace-3', 'furnace-4', 'furnace-5'],
  },
];
export const REGIONS: RegionDef[] = [
  region(
    {
      id: 'fen-1',
      act: 'briarfen',
      name: 'Lantern Approach',
      description: 'Rain threads between black trees. Lantern trails cross flooded hollows.',
      theme: 'marsh',
      dungeon: null,
      floor: null,
      waypoint: { x: 10.5, y: 26.5 },
      bossPosition: null,
      boss: null,
      ward: null,
      monsters: ['hound', 'archer'],
      encounters: 10,
      portals: [
        {
          id: 'grove',
          name: 'Drowned Grove',
          at: { x: 60.5, y: 13.5 },
          target: 'fen-2',
          arrival: 'return',
          requires: 'none',
        },
        {
          id: 'descent',
          name: 'Rootbound Catacombs · floor 1',
          at: { x: 27.5, y: 40.5 },
          target: 'fen-3',
          arrival: 'up',
          requires: 'none',
        },
      ],
    },
    'none',
  ),
  region(
    {
      id: 'fen-2',
      act: 'briarfen',
      name: 'Drowned Grove',
      description:
        'Drowned roots surround the first ward; the grove loops back to the lantern road.',
      theme: 'marsh',
      dungeon: null,
      floor: null,
      waypoint: null,
      bossPosition: null,
      boss: null,
      ward: { x: 60.5, y: 38.5 },
      monsters: ['hound', 'archer'],
      encounters: 12,
      portals: [
        {
          id: 'return',
          name: 'Lantern Approach',
          at: { x: 8.5, y: 23.5 },
          target: 'fen-1',
          arrival: 'grove',
          requires: 'none',
        },
      ],
    },
    'x',
  ),
  region(
    {
      id: 'fen-3',
      act: 'briarfen',
      name: 'Root Cellars',
      description:
        'Old stone cellars descend beneath the marsh. Root bridges divide the burial rooms.',
      theme: 'marsh',
      dungeon: 'fen-depths',
      floor: 1,
      waypoint: { x: 10.5, y: 26.5 },
      bossPosition: null,
      boss: null,
      ward: null,
      monsters: ['hound', 'archer'],
      encounters: 14,
      portals: [
        {
          id: 'up',
          name: 'Surface · Lantern Approach',
          at: { x: 8.5, y: 23.5 },
          target: 'fen-1',
          arrival: 'descent',
          requires: 'none',
        },
        {
          id: 'down',
          name: 'Stairs down · floor 2',
          at: { x: 52.5, y: 34.5 },
          target: 'fen-4',
          arrival: 'up',
          requires: 'none',
        },
      ],
    },
    'none',
  ),
  region(
    {
      id: 'fen-4',
      act: 'briarfen',
      name: 'Buried Sanctuary',
      description: 'Water seeps into a buried sanctuary. The second ward protects the last stair.',
      theme: 'marsh',
      dungeon: 'fen-depths',
      floor: 2,
      waypoint: null,
      bossPosition: null,
      boss: null,
      ward: { x: 52.5, y: 34.5 },
      monsters: ['hound', 'archer'],
      encounters: 16,
      portals: [
        {
          id: 'up',
          name: 'Stairs up · floor 1',
          at: { x: 8.5, y: 23.5 },
          target: 'fen-3',
          arrival: 'down',
          requires: 'none',
        },
        {
          id: 'down',
          name: 'Stairs down · floor 3',
          at: { x: 52.5, y: 13.5 },
          target: 'fen-5',
          arrival: 'up',
          requires: 'wards',
        },
      ],
    },
    'y',
  ),
  region(
    {
      id: 'fen-5',
      act: 'briarfen',
      name: 'Heart of the Briar',
      description: 'The Briar Widow has rooted herself around the stolen lantern.',
      theme: 'marsh',
      dungeon: 'fen-depths',
      floor: 3,
      waypoint: null,
      bossPosition: { x: 52.5, y: 13.5 },
      boss: 'briar',
      ward: null,
      monsters: ['hound', 'archer'],
      encounters: 18,
      portals: [
        {
          id: 'up',
          name: 'Stairs up · floor 2',
          at: { x: 8.5, y: 23.5 },
          target: 'fen-4',
          arrival: 'down',
          requires: 'none',
        },
        {
          id: 'onward',
          name: 'Road to Saltreach',
          at: { x: 52.5, y: 34.5 },
          target: 'salt-1',
          arrival: null,
          requires: 'boss',
        },
      ],
    },
    'none',
  ),
  region(
    {
      id: 'salt-1',
      act: 'saltreach',
      name: 'Caravan Reach',
      description: 'Dunes bury the caravan road. Rock ridges shelter broken campfires.',
      theme: 'desert',
      dungeon: null,
      floor: null,
      waypoint: { x: 10.5, y: 26.5 },
      bossPosition: null,
      boss: null,
      ward: null,
      monsters: ['wraith', 'cultist', 'hound'],
      encounters: 10,
      portals: [
        {
          id: 'grove',
          name: 'Shattered Oasis',
          at: { x: 60.5, y: 13.5 },
          target: 'salt-2',
          arrival: 'return',
          requires: 'none',
        },
        {
          id: 'descent',
          name: 'Sunken Glassworks · floor 1',
          at: { x: 27.5, y: 40.5 },
          target: 'salt-3',
          arrival: 'up',
          requires: 'none',
        },
      ],
    },
    'none',
  ),
  region(
    {
      id: 'salt-2',
      act: 'saltreach',
      name: 'Shattered Oasis',
      description: 'A shattered oasis holds glass monuments and the first ward.',
      theme: 'desert',
      dungeon: null,
      floor: null,
      waypoint: null,
      bossPosition: null,
      boss: null,
      ward: { x: 60.5, y: 38.5 },
      monsters: ['wraith', 'cultist', 'hound'],
      encounters: 12,
      portals: [
        {
          id: 'return',
          name: 'Caravan Reach',
          at: { x: 8.5, y: 23.5 },
          target: 'salt-1',
          arrival: 'grove',
          requires: 'none',
        },
      ],
    },
    'x',
  ),
  region(
    {
      id: 'salt-3',
      act: 'saltreach',
      name: 'Sand Cistern',
      description: 'Dry stairwells reach cistern chambers beneath the dunes.',
      theme: 'desert',
      dungeon: 'salt-depths',
      floor: 1,
      waypoint: { x: 10.5, y: 26.5 },
      bossPosition: null,
      boss: null,
      ward: null,
      monsters: ['wraith', 'cultist', 'hound'],
      encounters: 14,
      portals: [
        {
          id: 'up',
          name: 'Surface · Caravan Reach',
          at: { x: 8.5, y: 23.5 },
          target: 'salt-1',
          arrival: 'descent',
          requires: 'none',
        },
        {
          id: 'down',
          name: 'Stairs down · floor 2',
          at: { x: 52.5, y: 34.5 },
          target: 'salt-4',
          arrival: 'up',
          requires: 'none',
        },
      ],
    },
    'none',
  ),
  region(
    {
      id: 'salt-4',
      act: 'saltreach',
      name: 'Glass Galleries',
      description: 'Sand pours through vaulted glass galleries. Light the ward before descending.',
      theme: 'desert',
      dungeon: 'salt-depths',
      floor: 2,
      waypoint: null,
      bossPosition: null,
      boss: null,
      ward: { x: 52.5, y: 34.5 },
      monsters: ['wraith', 'cultist', 'hound'],
      encounters: 16,
      portals: [
        {
          id: 'up',
          name: 'Stairs up · floor 1',
          at: { x: 8.5, y: 23.5 },
          target: 'salt-3',
          arrival: 'down',
          requires: 'none',
        },
        {
          id: 'down',
          name: 'Stairs down · floor 3',
          at: { x: 52.5, y: 13.5 },
          target: 'salt-5',
          arrival: 'up',
          requires: 'wards',
        },
      ],
    },
    'y',
  ),
  region(
    {
      id: 'salt-5',
      act: 'saltreach',
      name: 'Regent’s Vault',
      description: 'The Glass Regent hoards the lantern in a sunless glass vault.',
      theme: 'desert',
      dungeon: 'salt-depths',
      floor: 3,
      waypoint: null,
      bossPosition: { x: 52.5, y: 13.5 },
      boss: 'regent',
      ward: null,
      monsters: ['wraith', 'cultist', 'hound'],
      encounters: 18,
      portals: [
        {
          id: 'up',
          name: 'Stairs up · floor 2',
          at: { x: 8.5, y: 23.5 },
          target: 'salt-4',
          arrival: 'down',
          requires: 'none',
        },
        {
          id: 'onward',
          name: 'Road to Hollow Bells',
          at: { x: 52.5, y: 34.5 },
          target: 'bells-1',
          arrival: null,
          requires: 'boss',
        },
      ],
    },
    'none',
  ),
  region(
    {
      id: 'bells-1',
      act: 'hollowbells',
      name: 'Silent Courtyard',
      description: 'Cold courtyards wind among ruined chapels and stone pillars.',
      theme: 'crypt',
      dungeon: null,
      floor: null,
      waypoint: { x: 10.5, y: 26.5 },
      bossPosition: null,
      boss: null,
      ward: null,
      monsters: ['archer', 'wraith', 'cultist'],
      encounters: 10,
      portals: [
        {
          id: 'grove',
          name: 'Graveyard of Echoes',
          at: { x: 60.5, y: 13.5 },
          target: 'bells-2',
          arrival: 'return',
          requires: 'none',
        },
        {
          id: 'descent',
          name: 'Ossuary of Bells · floor 1',
          at: { x: 27.5, y: 40.5 },
          target: 'bells-3',
          arrival: 'up',
          requires: 'none',
        },
      ],
    },
    'none',
  ),
  region(
    {
      id: 'bells-2',
      act: 'hollowbells',
      name: 'Graveyard of Echoes',
      description: 'Gravestones mark a circuit of paths around the first ward.',
      theme: 'crypt',
      dungeon: null,
      floor: null,
      waypoint: null,
      bossPosition: null,
      boss: null,
      ward: { x: 60.5, y: 38.5 },
      monsters: ['archer', 'wraith', 'cultist'],
      encounters: 12,
      portals: [
        {
          id: 'return',
          name: 'Silent Courtyard',
          at: { x: 8.5, y: 23.5 },
          target: 'bells-1',
          arrival: 'grove',
          requires: 'none',
        },
      ],
    },
    'x',
  ),
  region(
    {
      id: 'bells-3',
      act: 'hollowbells',
      name: 'Sepulcher Steps',
      description: 'Sepulcher stairs pass sealed burial rooms and bone caches.',
      theme: 'crypt',
      dungeon: 'bells-depths',
      floor: 1,
      waypoint: { x: 10.5, y: 26.5 },
      bossPosition: null,
      boss: null,
      ward: null,
      monsters: ['archer', 'wraith', 'cultist'],
      encounters: 14,
      portals: [
        {
          id: 'up',
          name: 'Surface · Silent Courtyard',
          at: { x: 8.5, y: 23.5 },
          target: 'bells-1',
          arrival: 'descent',
          requires: 'none',
        },
        {
          id: 'down',
          name: 'Stairs down · floor 2',
          at: { x: 52.5, y: 34.5 },
          target: 'bells-4',
          arrival: 'up',
          requires: 'none',
        },
      ],
    },
    'none',
  ),
  region(
    {
      id: 'bells-4',
      act: 'hollowbells',
      name: 'Bell Foundry',
      description: 'A buried foundry forged the bells that held the dead asleep.',
      theme: 'crypt',
      dungeon: 'bells-depths',
      floor: 2,
      waypoint: null,
      bossPosition: null,
      boss: null,
      ward: { x: 52.5, y: 34.5 },
      monsters: ['archer', 'wraith', 'cultist'],
      encounters: 16,
      portals: [
        {
          id: 'up',
          name: 'Stairs up · floor 1',
          at: { x: 8.5, y: 23.5 },
          target: 'bells-3',
          arrival: 'down',
          requires: 'none',
        },
        {
          id: 'down',
          name: 'Stairs down · floor 3',
          at: { x: 52.5, y: 13.5 },
          target: 'bells-5',
          arrival: 'up',
          requires: 'wards',
        },
      ],
    },
    'y',
  ),
  region(
    {
      id: 'bells-5',
      act: 'hollowbells',
      name: 'Unburied Choir',
      description: 'The Bellkeeper conducts the unburied around the stolen lantern.',
      theme: 'crypt',
      dungeon: 'bells-depths',
      floor: 3,
      waypoint: null,
      bossPosition: { x: 52.5, y: 13.5 },
      boss: 'bellkeeper',
      ward: null,
      monsters: ['archer', 'wraith', 'cultist'],
      encounters: 18,
      portals: [
        {
          id: 'up',
          name: 'Stairs up · floor 2',
          at: { x: 8.5, y: 23.5 },
          target: 'bells-4',
          arrival: 'down',
          requires: 'none',
        },
        {
          id: 'onward',
          name: 'Road to The First Furnace',
          at: { x: 52.5, y: 34.5 },
          target: 'furnace-1',
          arrival: null,
          requires: 'boss',
        },
      ],
    },
    'none',
  ),
  region(
    {
      id: 'furnace-1',
      act: 'firstfurnace',
      name: 'Ashen March',
      description: 'Ash paths wind between ruined watchtowers and cooling slag.',
      theme: 'inferno',
      dungeon: null,
      floor: null,
      waypoint: { x: 10.5, y: 26.5 },
      bossPosition: null,
      boss: null,
      ward: null,
      monsters: ['demon', 'cultist', 'wraith'],
      encounters: 10,
      portals: [
        {
          id: 'grove',
          name: 'Cinder Crossing',
          at: { x: 60.5, y: 13.5 },
          target: 'furnace-2',
          arrival: 'return',
          requires: 'none',
        },
        {
          id: 'descent',
          name: 'First Furnace · floor 1',
          at: { x: 27.5, y: 40.5 },
          target: 'furnace-3',
          arrival: 'up',
          requires: 'none',
        },
      ],
    },
    'none',
  ),
  region(
    {
      id: 'furnace-2',
      act: 'firstfurnace',
      name: 'Cinder Crossing',
      description: 'Bridges cross cinder channels toward the first ward.',
      theme: 'inferno',
      dungeon: null,
      floor: null,
      waypoint: null,
      bossPosition: null,
      boss: null,
      ward: { x: 60.5, y: 38.5 },
      monsters: ['demon', 'cultist', 'wraith'],
      encounters: 12,
      portals: [
        {
          id: 'return',
          name: 'Ashen March',
          at: { x: 8.5, y: 23.5 },
          target: 'furnace-1',
          arrival: 'grove',
          requires: 'none',
        },
      ],
    },
    'x',
  ),
  region(
    {
      id: 'furnace-3',
      act: 'firstfurnace',
      name: 'Slagworks',
      description: 'The slagworks descend through stone chambers scorched by molten seams.',
      theme: 'inferno',
      dungeon: 'furnace-depths',
      floor: 1,
      waypoint: { x: 10.5, y: 26.5 },
      bossPosition: null,
      boss: null,
      ward: null,
      monsters: ['demon', 'cultist', 'wraith'],
      encounters: 14,
      portals: [
        {
          id: 'up',
          name: 'Surface · Ashen March',
          at: { x: 8.5, y: 23.5 },
          target: 'furnace-1',
          arrival: 'descent',
          requires: 'none',
        },
        {
          id: 'down',
          name: 'Stairs down · floor 2',
          at: { x: 52.5, y: 34.5 },
          target: 'furnace-4',
          arrival: 'up',
          requires: 'none',
        },
      ],
    },
    'none',
  ),
  region(
    {
      id: 'furnace-4',
      act: 'firstfurnace',
      name: 'Chain Galleries',
      description: 'Chains hang above the second ward and the sealed crucible stair.',
      theme: 'inferno',
      dungeon: 'furnace-depths',
      floor: 2,
      waypoint: null,
      bossPosition: null,
      boss: null,
      ward: { x: 52.5, y: 34.5 },
      monsters: ['demon', 'cultist', 'wraith'],
      encounters: 16,
      portals: [
        {
          id: 'up',
          name: 'Stairs up · floor 1',
          at: { x: 8.5, y: 23.5 },
          target: 'furnace-3',
          arrival: 'down',
          requires: 'none',
        },
        {
          id: 'down',
          name: 'Stairs down · floor 3',
          at: { x: 52.5, y: 13.5 },
          target: 'furnace-5',
          arrival: 'up',
          requires: 'wards',
        },
      ],
    },
    'y',
  ),
  region(
    {
      id: 'furnace-5',
      act: 'firstfurnace',
      name: 'Lucent’s Crucible',
      description: 'Lucent waits below the furnace, where all four lantern roads converge.',
      theme: 'inferno',
      dungeon: 'furnace-depths',
      floor: 3,
      waypoint: null,
      bossPosition: { x: 52.5, y: 13.5 },
      boss: 'lucent',
      ward: null,
      monsters: ['demon', 'cultist', 'wraith'],
      encounters: 18,
      portals: [
        {
          id: 'up',
          name: 'Stairs up · floor 2',
          at: { x: 8.5, y: 23.5 },
          target: 'furnace-4',
          arrival: 'down',
          requires: 'none',
        },
        {
          id: 'onward',
          name: 'Restore the first flame',
          at: { x: 52.5, y: 34.5 },
          target: null,
          arrival: null,
          requires: 'boss',
        },
      ],
    },
    'none',
  ),
];
