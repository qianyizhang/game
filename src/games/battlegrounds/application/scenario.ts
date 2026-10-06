import { object, integer, ids } from '../../../shared/scenario';
import { MINION_BY_ID, HEROES } from '../content/minions';
import { createBG, transitionBG } from '../domain/game';
import { makeUnit } from '../domain/units';
import { returnUnits, UPGRADE_COST } from '../domain/recruitment';
import type { HeroId } from '../domain/types';
import { SPELL_BY_ID } from '../content/spells';

export function hearthScenario(seed: string, value: unknown) {
  const setup = object(value, ['hero', 'tier', 'gold', 'board', 'spells']);
  const hero = setup.hero ?? 'forgekeeper';
  if (!HEROES.some((h) => h.id === hero)) throw new Error('hero: choose an available hero ID.');
  const run = transitionBG(createBG(seed), { type: 'chooseHero', hero: hero as HeroId }).state;
  const player = run.players[0];
  returnUnits(run, [...player.shop, ...player.hand, ...player.board]);
  player.shop = [];
  player.hand = [];
  player.tier = integer(setup.tier, 'tier', 1, 6, 3);
  player.upgradeCost = UPGRADE_COST[player.tier];
  player.gold = integer(setup.gold, 'gold', 0, 10, 10);
  player.tavern!.hand = ids(setup.spells ?? [], 'spells', SPELL_BY_ID, 0, 10).map(
    (definitionId) => ({
      id: `spell-${run.nextId++}`,
      definitionId,
    }),
  );
  player.board = ids(setup.board, 'board', MINION_BY_ID, 0, 7).map((id) => {
    if (MINION_BY_ID[id].token)
      throw new Error('board: use recruitable minions; tokens must be summoned.');
    if (run.pool[id] <= 0) throw new Error(`board: not enough copies of ${id}.`);
    run.pool[id]--;
    return makeUnit(id, `unit-${run.nextId++}`);
  });
  return run;
}
export const HEARTH_SCENARIOS = [
  { name: 'Recruitment workshop', setup: { hero: 'forgekeeper', tier: 3, gold: 10, board: [] } },
  {
    name: 'Spell workshop',
    setup: {
      hero: 'archivist',
      tier: 3,
      gold: 10,
      board: ['wolf', 'imp'],
      spells: ['whetstone', 'promissory-note', 'recruit-coupon'],
    },
  },
];
