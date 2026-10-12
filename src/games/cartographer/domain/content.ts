import { DIRECTIONS, type RoomTemplate } from '../../../shared/layout/layout';

export interface Chamber extends RoomTemplate {
  name: string;
  description: string;
  reward: 'heal' | 'power' | 'focus' | 'none';
  danger: number;
}
const tiles = (corners: string[]): string[] => [
  '#########',
  `#${corners[0]}...${corners[1]}#`,
  `#${corners[0]}...${corners[1]}#`,
  '#.......#',
  '#.......#',
  '#.......#',
  `#${corners[2]}...${corners[3]}#`,
  `#${corners[2]}...${corners[3]}#`,
  '#########',
];
export const CHAMBERS: Chamber[] = [
  {
    id: 'crossroads',
    name: 'Crossroads',
    description: 'Four exits. More routes, but threat rises by 2.',
    reward: 'none',
    danger: 2,
    doors: [...DIRECTIONS],
    tiles: tiles(['..', '..', '..', '..']),
  },
  {
    id: 'bridge',
    name: 'Drowned bridge',
    description: 'Water divides the corners. Clear it to recover focus.',
    reward: 'focus',
    danger: 1,
    doors: ['north', 'south', 'east'],
    tiles: tiles(['~~', '~~', '..', '~~']),
  },
  {
    id: 'shrine',
    name: 'Moss shrine',
    description: 'Clear the guardians to restore 8 life.',
    reward: 'heal',
    danger: 1,
    doors: ['north', 'east', 'south'],
    tiles: tiles(['##', '..', '~~', '..']),
  },
  {
    id: 'armory',
    name: 'Forgotten armory',
    description: 'An extra guardian. Gain +1 strike damage after clearing.',
    reward: 'power',
    danger: 2,
    doors: ['north', 'south'],
    tiles: tiles(['##', '##', '..', '..']),
  },
  {
    id: 'garden',
    name: 'Sunken garden',
    description: 'Flooded planting beds. Restore 8 life after clearing.',
    reward: 'heal',
    danger: 1,
    doors: ['north', 'east', 'west'],
    tiles: tiles(['~~', '..', '~~', '..']),
  },
  {
    id: 'crypt',
    name: 'Keeper crypt',
    description: 'Stone alcoves shelter lurking guardians.',
    reward: 'focus',
    danger: 1,
    doors: ['north', 'south', 'west'],
    tiles: tiles(['##', '..', '..', '##']),
  },
  {
    id: 'gallery',
    name: 'Broken gallery',
    description: 'An open firing lane. Restore focus after clearing.',
    reward: 'focus',
    danger: 1,
    doors: ['north', 'east', 'south'],
    tiles: tiles(['..', '##', '..', '##']),
  },
  {
    id: 'cistern',
    name: 'Cistern',
    description: 'Shove enemies into water for a decisive hit.',
    reward: 'none',
    danger: 1,
    doors: ['north', 'south', 'west'],
    tiles: tiles(['~~', '~~', '~~', '~~']),
  },
  {
    id: 'archive',
    name: 'Sealed archive',
    description: 'Two exits through a quiet archive. Restore 8 life.',
    reward: 'heal',
    danger: 1,
    doors: ['north', 'east'],
    tiles: tiles(['##', '..', '##', '~~']),
  },
  {
    id: 'vault',
    name: 'Lantern vault',
    description: 'An extra guardian protects a permanent strike upgrade.',
    reward: 'power',
    danger: 2,
    doors: ['north', 'east', 'west'],
    tiles: tiles(['..', '##', '~~', '##']),
  },
];
export const ENTRANCE: Chamber = {
  id: 'entrance',
  name: 'The first page',
  description: 'Walk to a golden doorway to draft your first room.',
  reward: 'none',
  danger: 0,
  doors: [...DIRECTIONS],
  tiles: tiles(['..', '..', '..', '..']),
};
export const GUARDIAN: Chamber = {
  id: 'guardian',
  name: 'The Unwritten King',
  description: 'Defeat the keeper of this shifting archive.',
  reward: 'none',
  danger: 2,
  doors: [...DIRECTIONS],
  tiles: tiles(['..', '##', '##', '..']),
};
export const chamber = (id: string): Chamber =>
  [...CHAMBERS, ENTRANCE, GUARDIAN].find((c) => c.id === id)!;
export const RELICS = [
  { id: 'chisel', name: 'Iron chisel', text: 'Shove deals +2 damage.' },
  {
    id: 'compass',
    name: 'Ember compass',
    text: 'Strike deals +2 damage while you stand on an inner doorway.',
  },
  { id: 'moss', name: 'Moss vial', text: 'Restore 3 life whenever you attach a room.' },
  { id: 'boots', name: 'Reed boots', text: 'Walk across water. Enemies still cannot.' },
  { id: 'shell', name: 'Keeper shell', text: 'Reduce every incoming hit by 1 (minimum 1).' },
  { id: 'lens', name: 'Surveyor lens', text: 'Choose from four room offers instead of three.' },
] as const;
export type RelicId = (typeof RELICS)[number]['id'];
export type EnemyKind = 'keeper' | 'archer' | 'crawler' | 'bomber' | 'king';
export const ENEMIES: Record<
  EnemyKind,
  { name: string; symbol: string; hp: number; damage: number }
> = {
  keeper: { name: 'Keeper', symbol: 'K', hp: 6, damage: 3 },
  archer: { name: 'Scribe', symbol: 'S', hp: 4, damage: 2 },
  crawler: { name: 'Inkling', symbol: 'I', hp: 3, damage: 2 },
  bomber: { name: 'Censer', symbol: 'C', hp: 5, damage: 3 },
  king: { name: 'Unwritten King', symbol: '♛', hp: 24, damage: 5 },
};
export const ROOM_LIMIT = 9;
