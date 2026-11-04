export const RULES_VERSION = 'scrapyard-2';
export const ARENA = { width: 960, height: 600 } as const;
export const STEP_MS = 1000 / 60;
export const WAVE_TICKS = 1800;
export const DENSITIES = [100, 300, 500] as const;
export type Density = (typeof DENSITIES)[number];
export const ENEMIES = [
  { name: 'Drifter', hp: 22, radius: 10, speed: 0.85 },
  { name: 'Runner', hp: 22, radius: 10, speed: 1.15 },
  { name: 'Brute', hp: 48, radius: 15, speed: 0.65 },
  { name: 'Spitter', hp: 30, radius: 12, speed: 0.85 },
] as const;
export const RANGED = {
  kind: 3,
  cooldown: 100,
  windup: 22,
  pellets: 4,
  spread: 0.18,
  speed: 1.6,
  life: 300,
  damage: 6,
  radius: 3,
  near: 220,
  far: 290,
} as const;
export const LIMITS = { friendlyShots: 512, hostileShots: 4096, pickups: 256 } as const;
export const SEPARATION = { gap: 2, iterations: 2, maxPush: 4 } as const;
export const WEAPONS = [
  { name: 'Rivet gun', cooldown: 16, damage: 14, speed: 9, pellets: 1, radius: 3 },
  { name: 'Rivet gun', cooldown: 19, damage: 14, speed: 9, pellets: 1, radius: 3 },
  { name: 'Rivet gun', cooldown: 22, damage: 14, speed: 9, pellets: 1, radius: 3 },
  { name: 'Scattergun', cooldown: 42, damage: 10, speed: 7, pellets: 3, radius: 3 },
  { name: 'Scattergun', cooldown: 47, damage: 10, speed: 7, pellets: 3, radius: 3 },
  { name: 'Scrap cannon', cooldown: 65, damage: 42, speed: 6, pellets: 1, radius: 7 },
] as const;
export const SHOP = {
  damage: { name: 'Hotter rounds', detail: '+25% weapon damage', cost: 12 },
  speed: { name: 'Better boots', detail: '+15% movement speed', cost: 10 },
  repair: { name: 'Field repair', detail: 'Restore all HP', cost: 8 },
} as const;
export type Upgrade = keyof typeof SHOP;
