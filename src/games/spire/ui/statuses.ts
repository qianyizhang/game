import type { Enemy, Power, Status } from '../domain/types';

const statusLabels: Record<Status, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  weak: 'Weak',
  vulnerable: 'Vulnerable',
  frail: 'Frail',
  artifact: 'Artifact',
};
const powerLabels: Partial<Record<Power, string>> = {
  metallicize: 'Metallicize',
  demonForm: 'Demon Form',
  barricade: 'Barricade',
  feelNoPain: 'Feel No Pain',
  darkEmbrace: 'Dark Embrace',
  corruption: 'Corruption',
  combust: 'Combust',
  rupture: 'Rupture',
  fireBreathing: 'Fire Breathing',
};
const enemyLabels: Record<string, string> = {
  curlUp: 'Curl Up',
  malleable: 'Malleable',
  thorns: 'Thorns',
  ritual: 'Ritual',
  enrage: 'Enrage',
  constrict: 'Constricted',
  metallicize: 'Metallicize',
};
export const statusText = (values: Record<Status, number>) =>
  Object.entries(statusLabels)
    .filter(([key]) => values[key as Status] !== 0)
    .map(([key, label]) => `${label} ${values[key as Status]}`)
    .join(' · ');
export const powerText = (values: Record<Power, number>) =>
  Object.entries(powerLabels)
    .filter(([key]) => values[key as Power] > 0)
    .map(([key, label]) =>
      ['barricade', 'corruption'].includes(key) ? label : `${label} ${values[key as Power]}`,
    )
    .join(' · ');
/** Display active mechanics; bookkeeping counters and AI flags stay inside the engine. */
export function enemyPowerText(enemy: Enemy) {
  const labels = Object.entries(enemyLabels)
    .filter(([key]) => enemy.powers[key] > 0)
    .map(([key, label]) => `${label} ${enemy.powers[key]}`);
  for (const [key, label] of [
    ['asleep', 'Asleep'],
    ['intangible', 'Intangible'],
    ['slow', 'Slow'],
    ['hex', 'Hex'],
    ['entangle', 'Entangled'],
    ['angered', 'Enraged'],
  ])
    if (enemy.powers[key]) labels.push(label);
  return labels.join(' · ');
}
