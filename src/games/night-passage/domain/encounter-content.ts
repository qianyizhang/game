import type { EnemyKind } from './types';

export interface AttackPattern {
  name: string;
  kind: 'sweep' | 'burst' | 'charge' | 'cross' | 'rain' | 'pulse' | 'volley' | 'wheel';
  radius: number;
  range: number;
  count: number;
  windup: number;
  recovery: number;
}
const move = (
  name: string,
  kind: AttackPattern['kind'],
  radius: number,
  range: number,
  count: number,
  windup: number,
  recovery: number,
): AttackPattern => ({ name, kind, radius, range, count, windup, recovery });

/** Each guardian has a specific rhythm and spatial problem, rather than a damage reskin. */
export const GUARDIANS: readonly (readonly AttackPattern[])[] = [
  [
    move('Toll of the Bell', 'sweep', 165, 215, 1, 58, 55),
    move('Rootwake', 'rain', 64, 550, 3, 64, 60),
    move('Funeral Chimes', 'wheel', 0, 600, 10, 55, 70),
  ],
  [
    move('Breaking Wave', 'charge', 35, 340, 1, 62, 60),
    move('Split Current', 'volley', 0, 620, 7, 46, 55),
    move('Eye of the Tide', 'pulse', 215, 360, 1, 72, 65),
  ],
  [
    move('Cinder Cross', 'cross', 25, 620, 2, 70, 60),
    move('Falling Embers', 'rain', 75, 600, 4, 64, 60),
    move('Furnace Breath', 'volley', 0, 620, 11, 52, 50),
  ],
  [
    move('Night Divides', 'cross', 30, 680, 2, 62, 50),
    move('Starfall', 'rain', 66, 650, 6, 60, 55),
    move('Hollow Crown', 'pulse', 255, 410, 1, 64, 50),
    move('Wheel of Night', 'wheel', 0, 680, 16, 58, 65),
  ],
];

export const ENEMY_PATTERNS: Record<Exclude<EnemyKind, 'boss'>, AttackPattern> = {
  archer: move('Aimed shot', 'volley', 0, 310, 1, 38, 65),
  witch: move('Hex mark', 'burst', 75, 310, 1, 48, 70),
  brute: move('Crushing blow', 'burst', 92, 112, 1, 52, 75),
  hunter: move('Lunge', 'burst', 55, 110, 1, 38, 65),
};
export const ENEMIES: Record<
  EnemyKind,
  { health: number; damage: number; radius: number; speed: number }
> = {
  hunter: { health: 70, damage: 8, radius: 17, speed: 1.5 },
  archer: { health: 55, damage: 8, radius: 17, speed: 1.5 },
  brute: { health: 145, damage: 14, radius: 24, speed: 0.95 },
  witch: { health: 80, damage: 8, radius: 17, speed: 1.5 },
  boss: { health: 1100, damage: 17, radius: 32, speed: 1.2 },
};
