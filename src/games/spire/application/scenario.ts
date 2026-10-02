import { object, integer, ids } from '../../../shared/scenario';
import { CARD_BY_ID } from '../content/cards';
import { ENEMY_BY_ID, RELIC_BY_ID } from '../content/world';
import { createSpire } from '../domain/game';
import { startCombat } from '../domain/combat';
import { grantRelic } from '../domain/rewards';

export function spireScenario(seed: string, value: unknown) {
  const setup = object(value, [
    'character',
    'ascension',
    'deck',
    'relics',
    'enemies',
    'upgrades',
    'hp',
    'gold',
  ]);
  const character = setup.character ?? 'ironclad';
  if (character !== 'ironclad' && character !== 'silent')
    throw new Error('character: choose ironclad or silent.');
  const run = createSpire(seed, {
    character,
    ascension: integer(setup.ascension, 'ascension', 0, 5, 0),
  });
  run.practiceEncounter = true;
  const cards = ids(setup.deck, 'deck', CARD_BY_ID, 1, 60);
  const relics = ids(setup.relics ?? [], 'relics', RELIC_BY_ID, 0, 30);
  const enemies = ids(setup.enemies, 'enemies', ENEMY_BY_ID, 1, 5);
  const upgrades =
    setup.upgrades === undefined ? [] : ids(setup.upgrades, 'upgrades', CARD_BY_ID, 0, 60);
  run.deck = cards.map((definitionId) => ({
    id: `card-${run.nextId++}`,
    definitionId,
    upgraded: upgrades.includes(definitionId),
  }));
  run.relics = [];
  for (const id of new Set(relics)) grantRelic(run, id);
  run.hp = integer(setup.hp, 'hp', 1, run.maxHp, run.maxHp);
  run.gold = integer(setup.gold, 'gold', 0, 999, 99);
  const boss = enemies.some((id) => ENEMY_BY_ID[id].kind === 'boss');
  run.act = Math.max(...enemies.map((id) => ENEMY_BY_ID[id].act));
  run.row = boss ? 15 : 0;
  run.currentNode = 'practice-encounter';
  run.map = [
    {
      id: run.currentNode,
      row: run.row,
      lane: 3,
      kind: boss ? 'boss' : 'fight',
      encounter: enemies,
      visited: true,
      next: [],
    },
  ];
  startCombat(run, enemies);
  run.notice = 'Practice encounter. Your normal run is preserved.';
  return run;
}
export const SPIRE_SCENARIOS = [
  {
    name: 'Poison versus Artifact',
    setup: {
      character: 'silent',
      ascension: 0,
      deck: [
        'deadlyPoison',
        'catalyst',
        'legSweep',
        'noxiousFumes',
        'defend',
        'defend',
        'backflip',
        'neutralize',
      ],
      relics: ['ringOfTheSnake'],
      enemies: ['sentry'],
      hp: 70,
    },
  },
  {
    name: 'Exhaust engine versus Guardian',
    setup: {
      character: 'ironclad',
      ascension: 0,
      deck: [
        'corruption',
        'feelNoPain',
        'darkEmbrace',
        'defend',
        'defend',
        'bodySlam',
        'trueGrit',
        'strike',
        'bash',
      ],
      relics: ['burningBlood'],
      enemies: ['guardian'],
      hp: 80,
    },
  },
  {
    name: 'Twelve-card clock',
    setup: {
      character: 'silent',
      ascension: 0,
      deck: [
        'bladeDance',
        'bladeDance',
        'accuracy',
        'afterImage',
        'backflip',
        'legSweep',
        'defend',
        'neutralize',
      ],
      relics: ['ringOfTheSnake'],
      enemies: ['timeEater'],
      hp: 70,
    },
  },
];
