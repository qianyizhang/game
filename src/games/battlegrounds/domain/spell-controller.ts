import { SPELL_BY_ID } from '../content/spells';
import { baselineOrder, botDecision, unitValue } from './bots';
import { recruitAction } from './recruitment';
import { recruitPrice, spellCandidates } from './spells';
import type { BGCommand, BGState, Player } from './types';

/** Small, deterministic content-aware heuristic; no search or private rival inputs. */
export function chooseSpell(
  player: Player,
  legal: readonly BGCommand[],
  core: BGCommand | null,
): BGCommand | undefined {
  const tavern = player.tavern;
  if (!tavern || player.discover.length) return;
  const strongest = [...player.board].sort(
    (a, b) => unitValue(b, player) - unitValue(a, player),
  )[0];
  for (const spell of tavern.hand) {
    const candidates = legal.filter((c) => c.type === 'castSpell' && c.id === spell.id);
    const effect = SPELL_BY_ID[spell.definitionId].effect;
    if (effect.type === 'discount' && (!player.shop.length || player.gold < 1)) continue;
    if (effect.type === 'buff' && effect.zone === 'shop' && player.gold < recruitPrice(player))
      continue;
    const cast =
      effect.type === 'buff' && effect.zone === 'friendly'
        ? candidates.find((c) => c.type === 'castSpell' && c.target === strongest?.id)
        : candidates[0];
    if (cast) return cast;
  }
  const offer = tavern.offer;
  if (!offer) return;
  const definition = SPELL_BY_ID[offer.definitionId],
    effect = definition.effect;
  const buy = legal.find((c) => c.type === 'buySpell' && c.id === offer.id);
  if (!buy) return;
  // Immediate income can fund the next recruit; other spells spend leftovers after core actions.
  if (effect.type === 'gold') return buy;
  if (core && !['refresh', 'move', 'endRecruit', 'power'].includes(core.type)) return;
  if (effect.type === 'buff' && effect.zone === 'friendly' && !strongest) return;
  if (effect.type === 'buff' && effect.zone === 'board' && player.board.length < 3) return;
  if (
    effect.type === 'buff' &&
    effect.zone === 'shop' &&
    (player.shop.length < 2 || player.gold - definition.cost < recruitPrice(player))
  )
    return;
  if (
    effect.type === 'discount' &&
    (tavern.discount || !player.shop.length || player.gold - definition.cost < 1)
  )
    return;
  return buy;
}
export function spellBotDecision(
  run: BGState,
  player: Player,
  refreshes: number,
): BGCommand | null {
  if (!player.tavern) return botDecision(run, player, refreshes);
  const core = botDecision(run, player, refreshes);
  const candidates = [
    ...spellCandidates(player),
    ...player.shop.map((u): BGCommand => ({ type: 'buy', id: u.id })),
  ];
  if (core) candidates.push(core);
  const legal = candidates.filter((command) => {
    const copy = { ...run, pool: { ...run.pool }, log: [...run.log] };
    return !recruitAction(copy, structuredClone(player), command);
  });
  const spell = chooseSpell(player, legal, core);
  if (spell) return spell;
  if (core && legal.includes(core)) return core;
  if (player.tavern.discount) {
    const best = [...player.shop].sort((a, b) => unitValue(b, player) - unitValue(a, player))[0];
    return legal.find((c) => c.type === 'buy' && c.id === best?.id) ?? null;
  }
  return null;
}
export function runSpellBot(run: BGState, player: Player) {
  let refreshes = 0;
  for (let step = 0; step < 100; step++) {
    const command = spellBotDecision(run, player, refreshes);
    if (!command) break;
    const error = recruitAction(run, player, command);
    if (error) throw new Error(`Spell controller ${player.id}: ${error}`);
    if (command.type === 'refresh') refreshes++;
  }
  player.board = baselineOrder(player.board);
}
