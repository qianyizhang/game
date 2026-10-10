export interface Point {
  x: number;
  y: number;
}
export type Element = 'physical' | 'fire' | 'cold' | 'poison';
export type Attribute = 'strength' | 'dexterity' | 'vitality' | 'energy';
export type Slot = 'weapon' | 'armor' | 'charm';
export interface SkillDef {
  id: string;
  name: string;
  description: string;
  effect: 'projectile' | 'nova' | 'melee' | 'leap' | 'summon' | 'curse';
  element: Element;
  scaling: 'strength' | 'energy';
  pierce: boolean;
  slow: number;
  damage: number;
  mana: number;
  cooldown: number;
  range: number;
  radius: number;
  level: number;
}
export interface HeroDef {
  id: string;
  name: string;
  className: string;
  attack: 'melee' | 'ranged';
  description: string;
  color: string;
  hp: number;
  mana: number;
  attributes: Record<Attribute, number>;
  skills: string[];
  weapon: string;
}
export interface ItemDef {
  id: string;
  name: string;
  slot: Slot;
  damage: number;
  armor: number;
  width: number;
  height: number;
}
export interface MonsterDef {
  id: string;
  name: string;
  hp: number;
  damage: number;
  speed: number;
  range: number;
  element: Element;
  resist: Partial<Record<Element, number>>;
  color: string;
  shape: 'beast' | 'skeleton' | 'cultist' | 'demon';
  pattern: 'melee' | 'ranged' | 'nova' | 'summoner';
  hazardRadius: number;
}
export type Theme = 'marsh' | 'desert' | 'crypt' | 'inferno';
export type Rect = [number, number, number, number];
export interface TerrainPatch {
  kind: 'water' | 'lava' | 'rock' | 'road' | 'grass' | 'sand' | 'moss' | 'floor';
  bounds: Rect;
}
export interface Landmark {
  name: string;
  kind: 'tree' | 'ruin' | 'pillar' | 'bones' | 'altar' | 'bridge' | 'camp';
  at: Point;
}
export interface RegionPortal {
  id: string;
  name: string;
  at: Point;
  target: string | null;
  arrival: string | null;
  requires: 'none' | 'wards' | 'boss';
}
export interface RegionDef {
  id: string;
  act: string;
  name: string;
  description: string;
  theme: Theme;
  width: number;
  height: number;
  dungeon: string | null;
  floor: number | null;
  rooms: Rect[];
  paths: Point[][];
  terrain: TerrainPatch[];
  landmarks: Landmark[];
  start: Point;
  waypoint: Point | null;
  bossPosition: Point | null;
  boss: string | null;
  ward: Point | null;
  monsters: string[];
  encounters: number;
  chests: Point[];
  portals: RegionPortal[];
}
export interface ActDef {
  id: string;
  name: string;
  subtitle: string;
  introduction: string;
  conclusion: string;
  objective: string;
  entry: string;
  wards: string[];
  bossRegion: string;
}
export interface DungeonDef {
  id: string;
  act: string;
  name: string;
  floors: string[];
}
export interface Content {
  id: string;
  version: string;
  heroes: HeroDef[];
  skills: SkillDef[];
  items: ItemDef[];
  monsters: MonsterDef[];
  acts: ActDef[];
  regions: RegionDef[];
  dungeons: DungeonDef[];
}
export interface Item {
  uid: number;
  base: string;
  name: string;
  slot: Slot;
  rarity: 'normal' | 'magic' | 'rare' | 'unique';
  damage: number;
  armor: number;
  vitality: number;
  energy: number;
  resist: number;
  leech: number;
  width: number;
  height: number;
  cell: number;
  value: number;
  requiredStrength: number;
  sockets: number;
  runes: number;
}
export interface Enemy extends Point {
  uid: number;
  kind: string;
  hp: number;
  maxHp: number;
  boss: boolean;
  elite: boolean;
  cooldown: number;
  slow: number;
  cursed: number;
  windup: number;
  phase: number;
}
export interface Drop extends Point {
  uid: number;
  kind: 'gold' | 'health' | 'mana' | 'rune' | 'item';
  amount: number;
  item?: Item;
}
export interface Hazard extends Point {
  uid: number;
  radius: number;
  delay: number;
  damage: number;
  element: Element;
  life: number;
}
export interface Projectile extends Point {
  uid: number;
  dx: number;
  dy: number;
  damage: number;
  element: Element;
  life: number;
  friendly: boolean;
  radius: number;
  pierce: boolean;
  hits: number[];
  slow: number;
}
export interface Ally extends Point {
  damage: number;
  uid: number;
  hp: number;
  cooldown: number;
}
export interface World {
  tiles: string[];
  seen: number[];
  enemies: Enemy[];
  drops: Drop[];
  hazards: Hazard[];
  projectiles: Projectile[];
  allies: Ally[];
  ward: boolean;
  visited: boolean;
  revealOrigin: number;
  chests: boolean[];
  bossDefeated: boolean;
  waypoint: boolean;
}
export interface Player extends Point {
  hp: number;
  mana: number;
  stamina: number;
  level: number;
  xp: number;
  gold: number;
  attributes: Record<Attribute, number>;
  statPoints: number;
  skillPoints: number;
  skills: Record<string, number>;
  inventory: Item[];
  equipment: Partial<Record<Slot, Item>>;
  stash: Item[];
  healthPotions: number;
  manaPotions: number;
  runes: number;
  cooldowns: Record<string, number>;
  attackCooldown: number;
  slow: number;
  destination: Point | null;
  path: Point[];
  direction: Point;
  target: number | null;
  running: boolean;
  corpse: { act: number; region: string; position: Point; gold: number } | null;
}
export interface State {
  rulesVersion: string;
  contentId: string;
  contentVersion: string;
  hero: string;
  seed: string;
  rng: number;
  nextUid: number;
  tick: number;
  status: 'playing' | 'dead' | 'victory';
  location: 'town' | 'field';
  act: number;
  unlocked: number;
  region: string;
  worlds: Record<string, World>;
  player: Player;
  portal: { act: number; region: string; position: Point } | null;
  log: string[];
}
export type Command =
  | { type: 'advance'; ticks: number }
  | { type: 'move'; target: Point }
  | { type: 'steer'; direction: Point }
  | { type: 'attack'; target: number }
  | { type: 'cast'; skill: string; target: Point }
  | { type: 'potion'; kind: 'health' | 'mana' }
  | { type: 'interact' }
  | { type: 'portal' }
  | { type: 'travel'; act: number; region?: string }
  | { type: 'use-portal'; id: string }
  | { type: 'return' }
  | { type: 'respawn' }
  | { type: 'equip' | 'sell' | 'stash' | 'withdraw' | 'socket' | 'drop'; uid: number }
  | { type: 'buy'; kind: 'health' | 'mana' | 'gear' }
  | { type: 'attribute'; attribute: Attribute }
  | { type: 'learn'; skill: string }
  | { type: 'run'; enabled: boolean };
export interface Replay {
  format: 'emberwake-replay-v2';
  rulesVersion: string;
  content: Content;
  seed: string;
  hero: string;
  commands: Command[];
}
