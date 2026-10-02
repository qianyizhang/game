import type { Enemy, Intent } from './types';

export const ASCENSIONS = [
  'Standard ascent',
  'More elite rooms',
  'Deadlier normal enemies',
  'Deadlier elites',
  'Deadlier bosses',
  'Heal 75% of missing HP between acts',
];
/** Per-move tuning, not a blanket multiplier. See research for the curated HP/content boundary. */
const DAMAGE: Record<string, Record<string, number>> = {
  cultist: { 'Dark Strike': 6 },
  jawWorm: { Chomp: 12, Thrash: 7 },
  redLouse: { Bite: 7 },
  greenLouse: { Bite: 6 },
  acidSlimeM: { 'Corrosive Spit': 8, Tackle: 12 },
  spikeSlimeM: { 'Flame Tackle': 10 },
  acidSlimeL: { 'Corrosive Spit': 12, Tackle: 18 },
  spikeSlimeL: { 'Flame Tackle': 18 },
  gremlinNob: { Rush: 16, 'Skull Bash': 8 },
  lagavulin: { Attack: 20 },
  sentry: { Beam: 10 },
  chosen: { Poke: 6, Zap: 21, Debilitate: 12 },
  centurion: { Slash: 14, Fury: 7 },
  mystic: { Attack: 9 },
  sphericGuardian: { Attack: 11, Slam: 11, Harden: 11 },
  snakePlant: { Chomp: 8 },
  bookOfStabbing: { 'Multi-Stab': 7, 'Single Stab': 24 },
  taskmaster: { 'Scouring Whip': 7 },
  slaverBlue: { Stab: 13, Rake: 8 },
  slaverRed: { Stab: 14, Scrape: 9 },
  spiker: { Cut: 9 },
  repulsor: { Bash: 13 },
  exploder: { Slam: 11, Explode: 30 },
  orbWalker: { Laser: 11, Claw: 16 },
  spireGrowth: { 'Quick Tackle': 18, Smash: 25 },
  giantHead: { Count: 13 },
  nemesis: { Attack: 7, Scythe: 45 },
  slimeBoss: { Slam: 38 },
  guardian: { 'Fierce Bash': 36, 'Roll Attack': 10 },
  hexaghost: { Tackle: 6, Inferno: 3 },
  champ: { 'Heavy Slash': 18, 'Face Slap': 14, Execute: 12 },
  bronzeAutomaton: { Flail: 8, 'HYPER BEAM': 50 },
  collector: { Fireball: 21 },
  donu: { Beam: 12 },
  deca: { Beam: 12 },
  timeEater: { Reverberate: 8, 'Head Slam': 32 },
};
export function ascensionIntent(enemy: Enemy, original: Intent, kind: string): Intent {
  const threshold =
    kind === 'boss'
      ? 4
      : kind === 'elite' && !['slaverRed', 'slaverBlue'].includes(enemy.definitionId)
        ? 3
        : 2;
  const intent = structuredClone(original);
  if (enemy.ascension < threshold) return intent;
  const amount = DAMAGE[enemy.definitionId]?.[intent.name];
  for (const effect of intent.effects) {
    if (effect.type === 'damage' && amount !== undefined) effect.amount = amount;
    if (
      enemy.definitionId === 'bronzeAutomaton' &&
      intent.name === 'Boost' &&
      effect.type === 'status'
    )
      effect.amount = 4;
    if (enemy.definitionId === 'collector' && intent.name === 'Buff') {
      if (effect.type === 'block') effect.amount = 18;
      if (effect.type === 'special') effect.amount = 4;
    }
    if (enemy.definitionId === 'champ' && intent.name === 'Anger' && effect.type === 'status')
      effect.amount = 9;
    if (enemy.definitionId === 'cultist' && effect.type === 'special') effect.amount = 4;
  }
  return intent;
}
