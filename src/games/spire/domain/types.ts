export type Status = 'strength' | 'dexterity' | 'weak' | 'vulnerable' | 'frail' | 'artifact';
export type Power =
  | 'metallicize'
  | 'demonForm'
  | 'barricade'
  | 'feelNoPain'
  | 'darkEmbrace'
  | 'corruption'
  | 'combust'
  | 'combustHp'
  | 'rupture'
  | 'fireBreathing';
export type Rarity = 'basic' | 'common' | 'uncommon' | 'rare' | 'special';
export type Effect =
  | {
      type: 'damage';
      amount: number;
      hits?: number;
      all?: boolean;
      random?: boolean;
      strengthScale?: number;
      xHits?: boolean;
      fromBlock?: boolean;
      strikeScale?: number;
      heal?: boolean;
      fatalMaxHp?: number;
    }
  | { type: 'block' | 'draw' | 'energy' | 'heal' | 'loseHp'; amount: number }
  | { type: 'status'; status: Status; amount: number; target: 'self' | 'enemy' | 'all' }
  | { type: 'power'; power: Power; amount: number }
  | {
      type: 'generate';
      card: string;
      amount: number;
      zone: 'hand' | 'draw' | 'discard';
      copySource?: boolean;
    }
  | { type: 'choose'; action: 'exhaust' | 'topdeck' | 'upgrade'; random?: boolean }
  | { type: 'exhaustHand'; nonAttacks?: boolean; blockEach?: number; damageEach?: number }
  | { type: 'doubleBlock' | 'doubleStrength' | 'noDraw' }
  | { type: 'temporary'; stat: 'strength' | 'rage' | 'flameBarrier'; amount: number };
export interface CardDefinition {
  id: string;
  name: string;
  kind: 'attack' | 'skill' | 'power' | 'status' | 'curse';
  cost: number;
  rarity: Rarity;
  symbol: string;
  family: string;
  text: string;
  upgradeText: string;
  effects: Effect[];
  upgradedEffects?: Effect[];
  upgradedCost?: number;
  target?: boolean;
  exhaust?: boolean;
  upgradedExhaust?: boolean;
  ethereal?: boolean;
  starter?: boolean;
  token?: boolean;
  onlyAttacks?: boolean;
}
export interface Card {
  id: string;
  definitionId: string;
  upgraded: boolean;
}
export interface Fighter {
  hp: number;
  maxHp: number;
  block: number;
  status: Record<Status, number>;
  freshDebuffs: Status[];
}
export type EnemyEffect = Effect | { type: 'special'; action: string; amount?: number };
export interface Intent {
  name: string;
  effects: EnemyEffect[];
}
export interface EnemyDefinition {
  id: string;
  name: string;
  symbol: string;
  hp: number;
  act: number;
  kind: 'normal' | 'elite' | 'boss' | 'summon';
  intents: Intent[];
  behavior?: string;
  artifact?: number;
  block?: number;
  description: string;
}
export interface Enemy extends Fighter {
  id: string;
  definitionId: string;
  intentIndex: number;
  turn: number;
  history: number[];
  powers: Record<string, number>;
}
export interface RelicDefinition {
  id: string;
  name: string;
  symbol: string;
  text: string;
  rarity: 'starter' | 'common' | 'uncommon' | 'rare' | 'boss' | 'event';
}
export interface CardChoice {
  action: 'exhaust' | 'topdeck' | 'upgrade';
  options: string[];
  effects: Effect[];
  sourceId: string;
  targetId?: string;
  exhaust: boolean;
  x: number;
}
export interface Combat {
  turn: number;
  energy: number;
  player: Fighter;
  enemies: Enemy[];
  cards: Record<string, Card>;
  hand: string[];
  draw: string[];
  discard: string[];
  exhaust: string[];
  powersPlayed: string[];
  resolving: string | null;
  powers: Record<Power, number>;
  attacksPlayed: number;
  skillsPlayed: number;
  cardsPlayed: number;
  damageTaken: number;
  attackBonus: number;
  attackMultiplier: number;
  rage: number;
  flameBarrier: number;
  temporaryStrength: number;
  noDraw: boolean;
  choice: CardChoice | null;
}
export type NodeKind = 'fight' | 'elite' | 'shop' | 'rest' | 'event' | 'treasure' | 'boss';
export interface MapNode {
  id: string;
  row: number;
  lane: number;
  kind: NodeKind;
  encounter: string[];
  visited: boolean;
  next: string[];
}
export interface ShopOffer {
  id: string;
  kind: 'card' | 'relic' | 'potion';
  definitionId: string;
  price: number;
}
export type Potion =
  'fire' | 'block' | 'strength' | 'dexterity' | 'energy' | 'blood' | 'explosive' | 'weak';
export interface SpireState {
  version: number;
  seed: string;
  rng: number;
  nextId: number;
  character: 'ironclad';
  phase:
    | 'neow'
    | 'map'
    | 'combat'
    | 'reward'
    | 'bossRelic'
    | 'rest'
    | 'shop'
    | 'event'
    | 'treasure'
    | 'won'
    | 'lost';
  act: number;
  row: number;
  lane: number | null;
  map: MapNode[];
  currentNode: string | null;
  hp: number;
  maxHp: number;
  gold: number;
  deck: Card[];
  relics: string[];
  relicCounters: Record<string, number>;
  potions: Potion[];
  combat: Combat | null;
  reward: string[];
  rewardRelic: string | null;
  rewardPotion: Potion | null;
  bossRelics: string[];
  rewardUpgrades: string[];
  fightsThisAct: number;
  lastEncounter: string;
  lastElite: string;
  rareOffset: number;
  potionChance: number;
  shop: ShopOffer[];
  removalUsed: boolean;
  removals: number;
  event: string;
  eventDone: boolean;
  log: string[];
  notice: string;
}
export type SpireCommand =
  | { type: 'neow'; choice: 'maxHp' | 'lament' | 'gold' | 'bossSwap' }
  | { type: 'chooseNode'; id: string }
  | { type: 'playCard'; id: string; target?: string }
  | { type: 'chooseCard'; id: string }
  | { type: 'endTurn' }
  | { type: 'takeReward'; card: string | null }
  | { type: 'bossRelic'; id: string | null }
  | { type: 'rest'; choice: 'heal' | 'upgrade' | 'leave'; card?: string }
  | { type: 'buy'; id: string }
  | { type: 'removeCard'; id: string }
  | { type: 'leaveShop' }
  | { type: 'event'; choice: string; card?: string }
  | { type: 'takeTreasure'; skip?: boolean }
  | { type: 'potion'; index: number; target?: string }
  | { type: 'discardPotion'; index: number };
