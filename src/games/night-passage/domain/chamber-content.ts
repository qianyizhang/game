import type { LayoutId, Point } from './types';

export type ChamberLayout = Readonly<{
  id: LayoutId;
  name: string;
  description: string;
  pillars: readonly Readonly<Point & { radius: number }>[];
  hazards: readonly Readonly<Point & { offset: number }>[];
  spawns: readonly Readonly<Point>[];
}>;

// Perimeter sites stay separated across every layout, including later waves when
// the player can be anywhere in the room. Encounter rules select their order.
const perimeter = [
  { x: 110, y: 110 },
  { x: 360, y: 90 },
  { x: 600, y: 90 },
  { x: 850, y: 110 },
  { x: 110, y: 490 },
  { x: 360, y: 510 },
  { x: 600, y: 510 },
  { x: 850, y: 490 },
] as const;

export const CHAMBER_LAYOUTS: readonly ChamberLayout[] = [
  {
    id: 'court',
    name: 'Open Court',
    description: 'Twin pillars leave a broad central approach and two open flanks.',
    pillars: [
      { x: 330, y: 265, radius: 30 },
      { x: 630, y: 265, radius: 30 },
    ],
    hazards: [
      { x: 260, y: 390, offset: 0 },
      { x: 700, y: 230, offset: 145 },
    ],
    spawns: perimeter,
  },
  {
    id: 'gallery',
    name: 'Long Gallery',
    description: 'A row of three pillars separates long north and south firing lanes.',
    pillars: [
      { x: 180, y: 265, radius: 30 },
      { x: 480, y: 265, radius: 30 },
      { x: 780, y: 265, radius: 30 },
    ],
    hazards: [
      { x: 360, y: 390, offset: 0 },
      { x: 600, y: 210, offset: 145 },
    ],
    spawns: perimeter,
  },
  {
    id: 'islands',
    name: 'Broken Islands',
    description: 'Three uneven cover islands create diagonal approaches and short retreats.',
    pillars: [
      { x: 250, y: 200, radius: 20 },
      { x: 680, y: 210, radius: 20 },
      { x: 400, y: 340, radius: 20 },
    ],
    hazards: [
      { x: 530, y: 230, offset: 0 },
      { x: 715, y: 380, offset: 145 },
    ],
    spawns: perimeter,
  },
  {
    id: 'crossroads',
    name: 'Four-way Crossing',
    description: 'Four corner pillars frame intersecting central lanes with hazards on the flanks.',
    pillars: [
      { x: 330, y: 200, radius: 24 },
      { x: 630, y: 200, radius: 24 },
      { x: 330, y: 370, radius: 24 },
      { x: 630, y: 370, radius: 24 },
    ],
    hazards: [
      { x: 220, y: 300, offset: 0 },
      { x: 740, y: 300, offset: 145 },
    ],
    spawns: perimeter,
  },
];

export function chamberLayout(id: LayoutId): ChamberLayout {
  return CHAMBER_LAYOUTS.find((layout) => layout.id === id)!;
}
