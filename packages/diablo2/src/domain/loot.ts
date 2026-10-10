import type { Content, Item, State } from './types';
import { choose, random } from './random';
export function rollItem(state: State, content: Content, unique = false, baseId?: string): Item {
  const base = baseId
    ? content.items.find((item) => item.id === baseId)!
    : choose(state, content.items);
  const roll = random(state);
  const rarity = unique ? 'unique' : roll < 0.13 ? 'rare' : roll < 0.65 ? 'magic' : 'normal';
  const tier = rarity === 'unique' ? 4 : rarity === 'rare' ? 3 : rarity === 'magic' ? 1 : 0;
  const scale = state.act + 1;
  const vitality = tier ? Math.floor(random(state) * 3 + tier * 2 + state.act) : 0;
  const energy = tier ? Math.floor(random(state) * 3 + tier) : 0;
  const damage = base.damage ? base.damage + state.act * 4 + tier * 3 : 0;
  const armor = base.armor ? base.armor + state.act * 2 + tier * 2 : 0;
  return {
    uid: state.nextUid++,
    base: base.id,
    name: `${rarity === 'unique' ? (['Dawnkeeper’s', 'Saltbound', 'Quiet Bell', 'Chainbreaker’s'][state.act] ?? content.maps[state.act].name) : tier ? choose(state, ['Stalwart', 'Kindled', 'Vigilant', 'Runed']) : 'Worn'} ${base.name}`,
    slot: base.slot,
    rarity,
    damage,
    armor,
    vitality,
    energy,
    resist: tier * 4,
    leech: rarity === 'unique' ? 6 : rarity === 'rare' ? 3 : 0,
    width: base.width,
    height: base.height,
    cell: 0,
    value: 12 + scale * 8 + tier * 20,
    requiredStrength: base.slot === 'armor' ? 12 + state.act * 2 : 0,
    sockets: base.slot === 'weapon' ? 2 : 1,
    runes: 0,
  };
}
export function freeCell(items: Item[], item: Item): number | null {
  const occupied = new Set<number>();
  for (const carried of items)
    for (let y = 0; y < carried.height; y++)
      for (let x = 0; x < carried.width; x++) occupied.add(carried.cell + y * 8 + x);
  for (let cell = 0; cell < 32; cell++) {
    const x = cell % 8;
    const y = Math.floor(cell / 8);
    if (x + item.width > 8 || y + item.height > 4) continue;
    let fits = true;
    for (let dy = 0; dy < item.height; dy++)
      for (let dx = 0; dx < item.width; dx++) if (occupied.has(cell + dy * 8 + dx)) fits = false;
    if (fits) return cell;
  }
  return null;
}
export function carry(items: Item[], item: Item): boolean {
  const cell = freeCell(items, item);
  if (cell === null) return false;
  item.cell = cell;
  items.push(item);
  return true;
}
