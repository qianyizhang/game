export type Tribe = 'beast' | 'mech' | 'demon' | 'elemental' | 'neutral' | 'all';
export type Keyword = 'taunt' | 'shield' | 'windfury' | 'cleave' | 'poison' | 'reborn';
export type Trigger =
  | { type: 'summon'; card: string; count: number }
  | { type: 'damage'; amount: number }
  | { type: 'buff'; attack: number; health: number; tribe?: Tribe; targeted?: boolean }
  | { type: 'gold'; amount: number };
export interface MinionDefinition {
  id: string;
  name: string;
  symbol: string;
  tier: number;
  tribe: Tribe;
  attack: number;
  health: number;
  text: string;
  keywords?: Keyword[];
  token?: boolean;
  battlecry?: Trigger;
  deathrattle?: Trigger;
  summonBuff?: { tribe: Tribe; attack: number; health: number };
  regainShield?: Tribe;
  deathGrowth?: { tribe: Tribe; attack: number; health: number };
  deathDamage?: { tribe: Tribe; amount: number };
  extraDeathrattle?: number;
  buyBuff?: { tribe: Tribe; attack: number; health: number };
  endTurn?: {
    type: 'self' | 'tribe' | 'perTribe' | 'menagerie';
    tribe?: Tribe;
    attack: number;
    health: number;
  };
}
export interface Unit {
  id: string;
  definitionId: string;
  attack: number;
  health: number;
  maxHealth: number;
  golden: boolean;
  keywords: Keyword[];
  copies: number;
  tripleReward: boolean;
}
export type HeroId = 'forgekeeper' | 'quartermaster' | 'wildspeaker';
export interface HeroDefinition {
  id: HeroId;
  name: string;
  symbol: string;
  text: string;
  cost: number;
  targeted: boolean;
}
export interface Player {
  id: number;
  name: string;
  hero: HeroId;
  hp: number;
  tier: number;
  gold: number;
  upgradeCost: number;
  board: Unit[];
  hand: Unit[];
  shop: Unit[];
  frozen: boolean;
  powerUsed: boolean;
  discover: Unit[];
  eliminatedRound: number | null;
  placement: number | null;
}
export interface CombatUnit extends Unit {
  attacksTaken: number;
}
export interface CombatFrame {
  text: string;
  boards: [CombatUnit[], CombatUnit[]];
  attacker?: string;
  target?: string;
}
export interface CombatResult {
  winner: 0 | 1 | null;
  damage: [number, number];
  frames: CombatFrame[];
  boards: [CombatUnit[], CombatUnit[]];
  rng: number;
  attacks: number;
  stalemate: boolean;
}
export interface MatchSummary {
  left: number;
  right: number | null;
  winner: number | null;
  damage: number;
  ghost: boolean;
}
export interface BGState {
  version: number;
  seed: string;
  rng: number;
  nextId: number;
  phase: 'hero' | 'recruit' | 'combat' | 'won' | 'lost';
  round: number;
  players: Player[];
  pool: Record<string, number>;
  ghost: Unit[];
  ghostTier: number;
  opponent: number | null;
  lastCombat: CombatResult | null;
  matchups: MatchSummary[];
  notice: string;
  log: string[];
}
export type BGCommand =
  | { type: 'chooseHero'; hero: HeroId }
  | { type: 'buy'; id: string }
  | { type: 'play'; id: string; position: number; target?: string }
  | { type: 'sell'; id: string }
  | { type: 'move'; id: string; direction: -1 | 1 }
  | { type: 'refresh' }
  | { type: 'freeze' }
  | { type: 'upgrade' }
  | { type: 'power'; target?: string }
  | { type: 'discover'; id: string }
  | { type: 'endRecruit' }
  | { type: 'nextRound' };
