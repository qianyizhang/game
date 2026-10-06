import { random } from '../../../shared/random';
import { SPELL_BY_ID, TAVERN_SPELLS } from '../content/spells';
import type { BGCommand, BGState, Player } from './types';
import { buff } from './units';

export const handSize = (player: Player) => player.hand.length + (player.tavern?.hand.length ?? 0);
export const recruitPrice = (player: Player) => Math.max(0, 3 - (player.tavern?.discount ?? 0));
export function fillSpellOffer(run: BGState, player: Player) {
  if (!player.tavern || player.tavern.offer) return;
  const eligible = TAVERN_SPELLS.filter((spell) => spell.tier <= player.tier);
  const [value, next] = random(run.rng);
  run.rng = next;
  player.tavern.offer = {
    id: `spell-${run.nextId++}`,
    definitionId: eligible[Math.floor(value * eligible.length)].id,
  };
}
/** All preconditions precede mutation. This boundary is shared by humans and controllers. */
export function spellAction(
  player: Player,
  command: Extract<BGCommand, { type: 'buySpell' | 'castSpell' }>,
): string | undefined {
  const tavern = player.tavern;
  if (!tavern) return 'Tavern spells require Hearth rules v6.';
  if (command.type === 'buySpell') {
    const offer = tavern.offer;
    if (!offer || offer.id !== command.id) return 'That spell is not in your tavern.';
    const definition = SPELL_BY_ID[offer.definitionId];
    if (player.gold < definition.cost) return 'Not enough gold to buy this spell.';
    if (handSize(player) >= 10) return 'Your hand is full.';
    player.gold -= definition.cost;
    tavern.hand.push(offer);
    tavern.offer = null;
    return;
  }
  const spell = tavern.hand.find((entry) => entry.id === command.id);
  if (!spell) return 'That spell is not in your hand.';
  const effect = SPELL_BY_ID[spell.definitionId].effect;
  const target = player.board.find((unit) => unit.id === command.target);
  if (effect.type === 'buff' && effect.zone === 'friendly' && !target)
    return 'Select a friendly minion for this spell.';
  if (effect.type === 'buff' && effect.zone !== 'friendly' && !player[effect.zone].length)
    return effect.zone === 'shop'
      ? 'Your tavern has no minions to buff.'
      : 'Your warband is empty.';
  if (effect.type === 'discount' && tavern.discount) return 'Use your current coupon first.';
  if (effect.type === 'buff') {
    const targets = effect.zone === 'friendly' ? [target!] : player[effect.zone];
    for (const unit of targets) {
      buff(unit, effect.attack, effect.health);
      if (effect.keyword && !unit.keywords.includes(effect.keyword))
        unit.keywords.push(effect.keyword);
    }
  } else if (effect.type === 'gold') player.gold += effect.amount;
  else if (effect.type === 'nextGold') tavern.nextGold += effect.amount;
  else tavern.discount = effect.amount;
  tavern.hand = tavern.hand.filter((entry) => entry.id !== spell.id);
}

export function spellCandidates(player: Player): BGCommand[] {
  return [
    ...(player.tavern?.offer ? [{ type: 'buySpell' as const, id: player.tavern.offer.id }] : []),
    ...(player.tavern?.hand ?? []).flatMap((spell): BGCommand[] => {
      const effect = SPELL_BY_ID[spell.definitionId].effect;
      return effect.type === 'buff' && effect.zone === 'friendly'
        ? player.board.map((target) => ({ type: 'castSpell', id: spell.id, target: target.id }))
        : [{ type: 'castSpell', id: spell.id }];
    }),
  ];
}
