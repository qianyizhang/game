import type { Boon, GodId, Move, RuneId, Weapon, WeaponId } from './types';

export { CONTENT_VERSION } from './contracts';
export const ARENA = { width: 960, height: 600, margin: 42 };
export const CHAMBERS_PER_REGION = 8;
const move = (
  name: string,
  damage: number,
  windup: number,
  recovery: number,
  reach: number,
  arc: number,
  kind: Move['kind'],
  knockback: number,
): Move => ({ name, damage, windup, recovery, reach, arc, kind, knockback });
export const WEAPONS: readonly Weapon[] = [
  {
    id: 'sword',
    name: 'Dawnless Edge',
    color: '#ffc78a',
    description: 'Three-hit cleave combo. A wide special punishes crowded rooms.',
    attack: move('Cleave', 23, 7, 12, 100, 1.8, 'arc', 13),
    special: move('Moon sweep', 42, 22, 26, 135, Math.PI * 2, 'nova', 36),
    dash: move('Crosscut', 31, 3, 14, 120, 1.7, 'arc', 24),
  },
  {
    id: 'spear',
    name: 'Wayfarer',
    color: '#a9e4d0',
    description: 'Long, narrow thrusts. Throw a piercing lance with your special.',
    attack: move('Thrust', 25, 9, 14, 164, 0.5, 'arc', 16),
    special: move('Star lance', 44, 20, 24, 720, 0, 'shot', 20),
    dash: move('Vault strike', 33, 3, 15, 185, 0.8, 'arc', 30),
  },
  {
    id: 'shield',
    name: 'Oathkeeper',
    color: '#e4c7ff',
    description: 'Heavy bashes. Your rushing special guards its windup and breaks through enemies.',
    attack: move('Bash', 32, 13, 20, 91, 1.8, 'arc', 40),
    special: move('Bulwark rush', 48, 28, 25, 240, 1.6, 'rush', 65),
    dash: move('Rebuke', 35, 3, 16, 110, 2.5, 'nova', 50),
  },
  {
    id: 'bow',
    name: 'Far Lantern',
    color: '#b1d8ff',
    description: 'Deliberate piercing arrows. A fan of five arrows controls close approaches.',
    attack: move('Draw shot', 37, 22, 10, 780, 0, 'shot', 14),
    special: move('Lantern fan', 18, 18, 24, 520, 1.1, 'fan', 12),
    dash: move('Quickshot', 27, 3, 12, 640, 0, 'shot', 12),
  },
  {
    id: 'fists',
    name: 'Ember Knuckles',
    color: '#ff9fa4',
    description: 'Fast alternating punches. Your leaping uppercut closes distance.',
    attack: move('Flurry', 13, 3, 8, 75, 1.2, 'arc', 7),
    special: move('Rising ember', 46, 16, 22, 155, 1.9, 'rush', 40),
    dash: move('Meteor fist', 24, 2, 10, 100, 1.4, 'arc', 28),
  },
];
export const weapon = (id: WeaponId): Weapon => WEAPONS.find((entry) => entry.id === id)!;
export const GODS: readonly {
  id: GodId;
  name: string;
  title: string;
  color: string;
  effect: string;
}[] = [
  {
    id: 'storm',
    name: 'Aster',
    title: 'Keeper of Storms',
    color: '#f4dc77',
    effect: 'Lightning jumps to a nearby enemy.',
  },
  {
    id: 'tide',
    name: 'Neris',
    title: 'The Returning Sea',
    color: '#6ddbcc',
    effect: 'Push foes back; wall collisions deal bonus damage.',
  },
  {
    id: 'cinder',
    name: 'Vesta',
    title: 'The Last Hearthfire',
    color: '#ff9276',
    effect: 'Scorch enemies for lingering damage.',
  },
  {
    id: 'winter',
    name: 'Isen',
    title: 'Warden of Stillness',
    color: '#a5dfff',
    effect: 'Chill slows enemies; repeated strikes shatter them.',
  },
  {
    id: 'veil',
    name: 'Nyra',
    title: 'Witness in the Dark',
    color: '#ccacff',
    effect: 'Expose foes to heavier follow-up hits.',
  },
];
const slotNames = {
  attack: 'Strike',
  special: 'Flourish',
  dash: 'Passage',
  cast: 'Invocation',
  call: 'Ascendance',
} as const;
export const BASE_CAST = move('Lantern spark', 32, 8, 14, 740, 0, 'shot', 15);
export const SPELLS: Record<GodId, { cast: Move; call: Move; description: string }> = {
  storm: {
    cast: { ...move('Storm needle', 35, 8, 14, 800, 0, 'shot', 12), speed: 16, pierce: 2 },
    call: move('Skybreak', 90, 10, 25, 360, Math.PI * 2, 'nova', 20),
    description: 'Cast a fast piercing lightning bolt.',
  },
  tide: {
    cast: { ...move('Three currents', 24, 10, 18, 600, 0.65, 'fan', 35), shots: 3, speed: 10 },
    call: move('Great returning wave', 85, 12, 28, 340, Math.PI * 2, 'nova', 100),
    description: 'Cast three spreading waves that push foes away.',
  },
  cinder: {
    cast: { ...move('Cinder star', 35, 12, 18, 700, 0, 'shot', 15), speed: 7, blast: 90 },
    call: move('Daybreak pyre', 125, 15, 30, 250, Math.PI * 2, 'nova', 40),
    description: 'Cast a slow fire orb that explodes on hitting a foe.',
  },
  winter: {
    cast: { ...move('Winter branches', 16, 9, 18, 500, 1.2, 'fan', 10), shots: 5, speed: 10 },
    call: move('Stillness falls', 75, 10, 25, 310, Math.PI * 2, 'nova', 15),
    description: 'Cast five frost shards in a broad fan.',
  },
  veil: {
    cast: move('Shadow crossing', 40, 8, 20, 180, 1.2, 'rush', 10),
    call: move('Night’s judgement', 180, 12, 28, 260, 1.7, 'rush', 50),
    description: 'Cross through nearby foes with an exposing shadow strike.',
  },
};
export const BOONS: readonly Boon[] = [
  ...GODS.flatMap((god) =>
    (['attack', 'special', 'dash', 'cast', 'call'] as const).map((slot) => ({
      id: `${god.id}-${slot}`,
      name: `${god.name}’s ${slotNames[slot]}`,
      god: god.id,
      slot,
      description: `${slot === 'call' ? `At full charge, unleash ${SPELLS[god.id].call.name}${god.id === 'veil' ? ', a devastating shadow rush' : ', a wide divine burst'}.` : slot === 'cast' ? SPELLS[god.id].description : slot === 'dash' ? 'Your dodge releases a divine burst.' : `Empower your ${slot}.`} ${god.effect}`,
    })),
  ),
  {
    id: 'steam',
    name: 'Boiling Wake',
    god: 'tide',
    slot: 'duo',
    requires: ['tide', 'cinder'],
    description: 'Tidal hits on burning foes erupt for 24 extra damage.',
  },
  {
    id: 'conductor',
    name: 'Frozen Conductor',
    god: 'storm',
    slot: 'duo',
    requires: ['storm', 'winter'],
    description: 'Lightning jumps twice and deals double chain damage to chilled foes.',
  },
  {
    id: 'eclipse',
    name: 'Eclipse Fire',
    god: 'veil',
    slot: 'duo',
    requires: ['veil', 'cinder'],
    description: 'Burning exposed foes suffer double burn damage.',
  },
];
export const boon = (id: string): Boon => BOONS.find((entry) => entry.id === id)!;
export const RUNES: readonly { id: RuneId; name: string; description: string; unlock: number }[] = [
  { id: 'vigor', name: 'Root', description: '+25 maximum health.', unlock: 0 },
  { id: 'fleet', name: 'Feather', description: 'Dodge cooldown reduced by 25%.', unlock: 0 },
  {
    id: 'focus',
    name: 'Well',
    description: 'Recover a cast every 3 seconds instead of 4.',
    unlock: 0,
  },
  { id: 'fury', name: 'Thorn', description: 'Deal 35% more damage below half health.', unlock: 1 },
  { id: 'echo', name: 'Comet', description: 'Dash attacks deal 30% more damage.', unlock: 2 },
  {
    id: 'mercy',
    name: 'Moth',
    description: 'Heal 3 health when clearing a combat room.',
    unlock: 3,
  },
];
export const REGIONS = [
  {
    name: 'The Root Sepulcher',
    subtitle: 'Where the dead first learn to dream.',
    boss: 'The Bellwarden',
    color: '#a7c5a0',
    floor: '#202d2c',
    hazard: 'Thorn circles',
    hazardKind: 'thorns',
    guardian: 0,
    enemies: ['hunter', 'archer'] as const,
  },
  {
    name: 'The Drowned Archive',
    subtitle: 'Every broken oath returns with the tide.',
    boss: 'The Undertow',
    color: '#77cdd4',
    floor: '#182b38',
    hazard: 'Tidal vents',
    hazardKind: 'tide',
    guardian: 1,
    enemies: ['hunter', 'archer', 'witch'] as const,
  },
  {
    name: 'The Cinder Court',
    subtitle: 'A kingdom kept warm by a stolen sun.',
    boss: 'The Ash Regent',
    color: '#edaa7e',
    floor: '#332522',
    hazard: 'Flame wells',
    hazardKind: 'flame',
    guardian: 2,
    enemies: ['brute', 'witch', 'archer'] as const,
  },
  {
    name: 'The Starless Gate',
    subtitle: 'Carry your borrowed light beyond the night.',
    boss: 'The Unlit Sovereign',
    color: '#bb9cdb',
    floor: '#282439',
    hazard: 'Void seals',
    hazardKind: 'void',
    guardian: 3,
    enemies: ['hunter', 'brute', 'witch', 'archer'] as const,
  },
] as const;
