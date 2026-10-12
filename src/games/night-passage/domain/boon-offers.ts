import { shuffle } from '../../../shared/random';
import { BOONS, boon } from './content';
import type { Boon, Player } from './types';

/** Seeded audiences diversify action slots; memory shrines only rank up owned blessings. */
export function drawBoons(
  owned: Player['boons'],
  rng: number,
  upgrade: boolean,
): [string[], number] {
  const equipped = owned.map((entry) => boon(entry.id));
  const gods = equipped.filter((entry) => entry.slot !== 'duo').map((entry) => entry.god);
  const pool = upgrade
    ? owned
        .filter((entry) => entry.level < 5 && boon(entry.id).slot !== 'duo')
        .map((entry) => boon(entry.id))
    : BOONS.filter(
        (entry) =>
          (!entry.requires || entry.requires.every((god) => gods.includes(god))) &&
          (owned.find((item) => item.id === entry.id)?.level ?? 0) < (entry.slot === 'duo' ? 1 : 5),
      );
  const [ordered, next] = shuffle(pool, rng);
  if (upgrade) return [ordered.slice(0, 3).map((entry) => entry.id), next];

  // Reserve one opening to grow an unfinished loadout before considering replacements.
  // Duos stack outside the five action slots and do not count as filling an empty action.
  const opening = ordered.find(
    (entry) => entry.slot !== 'duo' && !equipped.some((item) => item.slot === entry.slot),
  );
  const selected: Boon[] = opening ? [opening] : [];
  for (const entry of ordered) {
    if (selected.length === 3) break;
    if (!selected.some((item) => item.slot === entry.slot)) selected.push(entry);
  }
  return [selected.map((entry) => entry.id), next];
}
