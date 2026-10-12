export type WeaponId = 'sword' | 'spear' | 'shield' | 'bow' | 'fists';
export type GodId = 'storm' | 'tide' | 'cinder' | 'winter' | 'veil';
export type Slot = 'attack' | 'special' | 'dash' | 'cast' | 'call';
export type Action = Exclude<Slot, 'dash'>;
export type RuneId = 'vigor' | 'fleet' | 'focus' | 'fury' | 'echo' | 'mercy';
export type Reward = 'boon' | 'coin' | 'heart' | 'upgrade' | 'fountain' | 'shop' | 'trial';
export interface Point {
  x: number;
  y: number;
}
export interface Move {
  name: string;
  damage: number;
  windup: number;
  recovery: number;
  reach: number;
  arc: number;
  kind: 'arc' | 'shot' | 'nova' | 'rush' | 'fan';
  knockback: number;
  shots?: number;
  speed?: number;
  pierce?: number;
  blast?: number;
}
export interface Weapon {
  id: WeaponId;
  name: string;
  description: string;
  color: string;
  attack: Move;
  special: Move;
  dash: Move;
}
export interface Boon {
  id: string;
  name: string;
  description: string;
  god: GodId;
  slot: Slot | 'duo';
  requires?: readonly GodId[];
}
export interface BuildBoon {
  id: string;
  level: number;
}
export interface Input {
  x: number;
  y: number;
  aim: number;
  attack: boolean;
  special: boolean;
  dash: boolean;
  cast: boolean;
  call: boolean;
}
export interface Strike {
  action: Action;
  aim: number;
  left: number;
  recovery: number;
  dashed: boolean;
}
export interface Player extends Point {
  hp: number;
  maxHp: number;
  aim: number;
  weapon: WeaponId;
  runes: RuneId[];
  boons: BuildBoon[];
  invulnerable: number;
  dashLeft: number;
  dashCooldown: number;
  dashAim: number;
  recovery: number;
  strike: Strike | null;
  buffer: { action: Action; aim: number; expires: number } | null;
  casts: number;
  castClock: number;
  charge: number;
  combo: number;
  hindered: number;
}
export type EnemyKind = 'hunter' | 'archer' | 'brute' | 'witch' | 'boss';
export interface Enemy extends Point {
  id: number;
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  radius: number;
  aim: number;
  cooldown: number;
  windup: number;
  pattern: number;
  target: Point;
  stagger: number;
  burn: number;
  chill: number;
  exposed: number;
  flash: number;
}
export interface Projectile extends Point {
  id: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  hostile: boolean;
  pierce: number;
  hit: number[];
  god: GodId | null;
  power: number;
  source: Slot;
  blast: number;
  knockback: number;
}
export interface Cue extends Point {
  kind: 'slash' | 'burst' | 'hit' | 'dash' | 'heal';
  radius: number;
  aim: number;
  arc: number;
  color: string;
  life: number;
  total: number;
}
export interface Room {
  name: string;
  reward: Reward;
  boss: boolean;
  wave: number;
  waves: number;
  pillars: (Point & { radius: number })[];
  hazards: Hazard[];
}
export interface Hazard extends Point {
  kind: 'thorns' | 'tide' | 'flame' | 'void';
  radius: number;
  offset: number;
}
export interface Route {
  reward: Reward;
  label: string;
  detail: string;
}
export interface Profile {
  ash: number;
  runs: number;
  wins: number;
  deepest: number;
  vitality: number;
  unlockedRunes: RuneId[];
}
export interface State {
  seed: string;
  rng: number;
  tick: number;
  nextId: number;
  phase: 'hub' | 'combat' | 'reward' | 'route' | 'shop' | 'won' | 'lost';
  profile: Profile;
  runNumber: number;
  region: number;
  chamber: number;
  roomsCleared: number;
  gold: number;
  earnedAsh: number;
  kills: number;
  player: Player;
  room: Room;
  enemies: Enemy[];
  projectiles: Projectile[];
  cues: Cue[];
  offers: string[];
  rewardReturn: 'route' | 'shop';
  routes: Route[];
  purchases: string[];
  message: string;
}
export type Command =
  | { type: 'start'; weapon: WeaponId; runes: RuneId[] }
  | { type: 'frame'; input: Input; ticks: number }
  | { type: 'choose'; id: string }
  | { type: 'travel'; index: number }
  | { type: 'buy'; item: 'heal' | 'heart' | 'boon' }
  | { type: 'leave' }
  | { type: 'return' }
  | { type: 'retire' }
  | { type: 'train' };
