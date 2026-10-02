import type { EnemyDefinition, EnemyEffect, Intent } from '../domain/types';

const hit = (amount: number, hits = 1): EnemyEffect => ({ type: 'damage', amount, hits });
const block = (amount: number): EnemyEffect => ({ type: 'block', amount });
const strength = (amount: number): EnemyEffect => ({
  type: 'status',
  status: 'strength',
  amount,
  target: 'self',
});
const debuff = (status: 'weak' | 'vulnerable' | 'frail', amount: number): EnemyEffect => ({
  type: 'status',
  status,
  amount,
  target: 'enemy',
});
const special = (action: string, amount = 0): EnemyEffect => ({ type: 'special', action, amount });
const junk = (card: string, amount: number, zone: 'draw' | 'discard' = 'discard'): EnemyEffect => ({
  type: 'generate',
  card,
  amount,
  zone,
});
const move = (name: string, ...effects: EnemyEffect[]): Intent => ({ name, effects });

export const BOSS_POOLS = [
  [['slimeBoss'], ['guardian'], ['hexaghost']],
  [['champ'], ['bronzeAutomaton'], ['collector']],
  [['donu', 'deca'], ['timeEater'], ['cultist', 'awakenedOne', 'cultist']],
] as const;

export const EXTRA_BOSSES: EnemyDefinition[] = [
  {
    id: 'guardian',
    name: 'The Guardian',
    symbol: '⬡',
    hp: 240,
    act: 1,
    kind: 'boss',
    behavior: 'guardian',
    description:
      'Losing 30 HP interrupts its move and grants 20 Block. Defensive Sharp Hide retaliates once per Attack card. The threshold grows by 10 after each cycle.',
    intents: [
      move('Charging Up', block(9)),
      move('Fierce Bash', hit(32)),
      move('Vent Steam', debuff('vulnerable', 2), debuff('weak', 2)),
      move('Whirlwind', hit(5, 4)),
      move('Defensive Mode', special('sharpHide', 3)),
      move('Roll Attack', hit(9)),
      move('Twin Slam', hit(8, 2), special('offensiveMode')),
    ],
  },
  {
    id: 'hexaghost',
    name: 'Hexaghost',
    symbol: '✹',
    hp: 250,
    act: 1,
    kind: 'boss',
    behavior: 'hexaghost',
    description:
      'Divider scales with your HP when its intent is prepared. A fixed cycle builds Strength and upgrades Burns.',
    intents: [
      move('Activate'),
      move('Divider', hit(1, 6)),
      move('Sear', hit(6), junk('burn', 1)),
      move('Tackle', hit(5, 2)),
      move('Inflame', strength(2), block(12)),
      move('Inferno', hit(2, 6), junk('burn', 3), special('upgradeBurns')),
    ],
  },
  {
    id: 'bronzeAutomaton',
    name: 'Bronze Automaton',
    symbol: '▣',
    hp: 300,
    act: 2,
    kind: 'boss',
    artifact: 3,
    behavior: 'automaton',
    description:
      'Summons two Orbs that steal cards. Flail → Boost twice, then Hyper Beam and a stunned turn.',
    intents: [
      move('Spawn Orbs', special('spawnOrbs')),
      move('Flail', hit(7, 2)),
      move('Boost', strength(3), block(9)),
      move('HYPER BEAM', hit(45)),
      move('Stunned'),
    ],
  },
  {
    id: 'bronzeOrb',
    name: 'Bronze Orb',
    symbol: '◉',
    hp: 55,
    act: 2,
    kind: 'summon',
    behavior: 'bronzeOrb',
    description:
      'Stasis steals a rare card from draw, or discard if draw is empty. Defeat the Orb to recover it.',
    intents: [
      move('Stasis', special('stasis')),
      move('Beam', hit(8)),
      move('Support Beam', special('supportAutomaton', 12)),
    ],
  },
  {
    id: 'collector',
    name: 'The Collector',
    symbol: '♜',
    hp: 282,
    act: 2,
    kind: 'boss',
    behavior: 'collector',
    description:
      'Summons up to two Torch Heads. Debuffs on turn four; can replenish fallen minions.',
    intents: [
      move('Spawn', special('spawnTorches')),
      move('Fireball', hit(18)),
      move('Buff', special('allyStrength', 3), block(15)),
      move('Mega Debuff', debuff('weak', 3), debuff('vulnerable', 3), debuff('frail', 3)),
    ],
  },
  {
    id: 'torchHead',
    name: 'Torch Head',
    symbol: '♨',
    hp: 39,
    act: 2,
    kind: 'summon',
    description: 'Attacks every turn; flees if the Collector falls.',
    intents: [move('Tackle', hit(7))],
  },
  {
    id: 'timeEater',
    name: 'Time Eater',
    symbol: '◷',
    hp: 456,
    act: 3,
    kind: 'boss',
    behavior: 'timeEater',
    description:
      'Every 12 cards ends your turn and grants 2 Strength. Once below half HP, prepares a heal and debuff cleanse.',
    intents: [
      move('Reverberate', hit(7, 3)),
      move('Head Slam', hit(26), special('drawReduction', 1)),
      move('Ripple', block(20), debuff('vulnerable', 1), debuff('weak', 1)),
      move('Haste', special('haste')),
    ],
  },
  {
    id: 'awakenedOne',
    name: 'Awakened One',
    symbol: '♟',
    hp: 300,
    act: 3,
    kind: 'boss',
    behavior: 'awakened',
    description:
      'Regenerates 10 HP. Powers grant it Strength before rebirth. Must be defeated twice; Strength survives rebirth.',
    intents: [
      move('Slash', hit(20)),
      move('Soul Strike', hit(6, 4)),
      move('Rebirth', special('rebirth')),
      move('Dark Echo', hit(40)),
      move('Sludge', hit(18), junk('void', 1, 'draw')),
      move('Tackle', hit(10, 3)),
    ],
  },
];
