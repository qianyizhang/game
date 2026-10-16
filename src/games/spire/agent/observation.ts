import { ENEMY_BY_ID } from '../content/world';
import { intentText } from '../domain/combat';
import { currentIntent } from '../domain/enemies';
import { aliveEnemies } from '../domain/state';
import type {
  Card,
  Combat,
  Enemy,
  Fighter,
  Intent,
  MapNode,
  SpireCommand,
  SpireState,
} from '../domain/types';
import { legalActions } from './legality';

export type PolicyCommand = Exclude<SpireCommand, { type: 'configure' }>;
export type PublicFighter = Pick<Fighter, 'hp' | 'maxHp' | 'block' | 'status'>;
export type PublicEnemy = PublicFighter &
  Pick<Enemy, 'id' | 'definitionId' | 'powers'> & {
    intent: Intent;
    intentText: string;
    stasis: boolean;
    targetable: boolean;
  };
export type PublicCombat = Pick<
  Combat,
  | 'turn'
  | 'energy'
  | 'hand'
  | 'draw'
  | 'discard'
  | 'exhaust'
  | 'powersPlayed'
  | 'powers'
  | 'attacksPlayed'
  | 'skillsPlayed'
  | 'cardsPlayed'
  | 'damageTaken'
  | 'attackBonus'
  | 'attackMultiplier'
  | 'rage'
  | 'flameBarrier'
  | 'temporaryStrength'
  | 'noDraw'
  | 'timeWarpPending'
  | 'drawReduction'
  | 'nextTurn'
  | 'blur'
  | 'discarded'
> & {
  player: PublicFighter;
  enemies: PublicEnemy[];
  cards: Record<string, Card>;
  choice: Pick<NonNullable<Combat['choice']>, 'action' | 'options'> | null;
};
export type PublicState = Pick<
  SpireState,
  | 'character'
  | 'ascension'
  | 'phase'
  | 'act'
  | 'row'
  | 'lane'
  | 'currentNode'
  | 'hp'
  | 'maxHp'
  | 'gold'
  | 'deck'
  | 'relics'
  | 'relicCounters'
  | 'potions'
  | 'reward'
  | 'rewardRelic'
  | 'rewardPotion'
  | 'bossRelics'
  | 'rewardUpgrades'
  | 'shop'
  | 'removalUsed'
  | 'event'
  | 'eventDone'
> & {
  map: Omit<MapNode, 'encounter'>[];
  boss: string[];
  removalCost: number;
  combat: PublicCombat | null;
};
export type Observation = PublicState & { actions: PolicyCommand[] };

// These are mechanics shown by enemyPowerText. AI memory/cycle flags remain private.
const enemyPowers = new Set([
  'curlUp',
  'malleable',
  'thorns',
  'ritual',
  'enrage',
  'constrict',
  'metallicize',
  'modeShift',
  'sharpHide',
  'curiosity',
  'regeneration',
  'timeWarp',
  'asleep',
  'intangible',
  'slow',
  'hex',
  'entangle',
  'angered',
]);

const fighter = ({ hp, maxHp, block, status }: Fighter): PublicFighter => ({
  hp,
  maxHp,
  block,
  status,
});

/** Current visible state, not remembered history. Factories may remember prior inputs. */
export function observe(run: SpireState): Observation {
  const c = run.phase === 'combat' ? run.combat : null;
  const combat: PublicCombat | null = c
    ? {
        turn: c.turn,
        energy: c.energy,
        player: fighter(c.player),
        enemies: c.enemies.map((e) => ({
          ...fighter(e),
          id: e.id,
          definitionId: e.definitionId,
          powers: Object.fromEntries(
            Object.entries(e.powers).filter(([key]) => enemyPowers.has(key)),
          ),
          stasis: !!e.stasisCard,
          targetable: aliveEnemies(run).includes(e),
          intent: currentIntent(e, c),
          intentText: intentText(e, c),
        })),
        cards: Object.fromEntries(
          [
            ...new Set([
              ...c.hand,
              ...c.draw,
              ...c.discard,
              ...c.exhaust,
              ...c.powersPlayed,
              ...(c.choice?.options ?? []),
            ]),
          ]
            .sort()
            .map((id) => [id, c.cards[id]]),
        ),
        hand: c.hand,
        draw: [...c.draw].sort(),
        discard: [...c.discard].sort(),
        exhaust: [...c.exhaust].sort(),
        powersPlayed: [...c.powersPlayed].sort(),
        powers: c.powers,
        attacksPlayed: c.attacksPlayed,
        skillsPlayed: c.skillsPlayed,
        cardsPlayed: c.cardsPlayed,
        damageTaken: c.damageTaken,
        attackBonus: c.attackBonus,
        attackMultiplier: c.attackMultiplier,
        rage: c.rage,
        flameBarrier: c.flameBarrier,
        temporaryStrength: c.temporaryStrength,
        noDraw: c.noDraw,
        timeWarpPending: c.timeWarpPending,
        drawReduction: c.drawReduction,
        nextTurn: c.nextTurn,
        blur: c.blur,
        discarded: c.discarded,
        choice: c.choice ? { action: c.choice.action, options: c.choice.options } : null,
      }
    : null;
  const view: PublicState = {
    character: run.character,
    ascension: run.ascension,
    phase: run.phase,
    act: run.act,
    row: run.row,
    lane: run.lane,
    currentNode: run.currentNode,
    hp: run.hp,
    maxHp: run.maxHp,
    gold: run.gold,
    deck: run.deck,
    relics: run.relics,
    relicCounters: Object.fromEntries(
      Object.entries(run.relicCounters).filter(([key]) =>
        ['akabekoUsed', 'penNib', 'neowsLament', 'happyFlower'].includes(key),
      ),
    ),
    potions: run.potions,
    map: run.map.map(({ id, row, lane, kind, visited, next }) => ({
      id,
      row,
      lane,
      kind,
      visited,
      next,
    })),
    boss:
      run.map
        .find((n) => n.kind === 'boss')
        ?.encounter.filter((id) => ENEMY_BY_ID[id].kind === 'boss') ?? [],
    combat,
    reward: run.phase === 'reward' ? run.reward : [],
    rewardRelic: run.phase === 'reward' ? run.rewardRelic : null,
    rewardPotion: run.phase === 'reward' ? run.rewardPotion : null,
    bossRelics: run.phase === 'bossRelic' ? run.bossRelics : [],
    rewardUpgrades: run.phase === 'reward' ? run.rewardUpgrades : [],
    shop: run.phase === 'shop' ? run.shop : [],
    removalUsed: run.removalUsed,
    removalCost: 75 + 25 * run.removals,
    event: run.phase === 'event' ? run.event : '',
    eventDone: run.phase === 'event' ? run.eventDone : false,
  };
  return structuredClone({ ...view, actions: legalActions(view) });
}
