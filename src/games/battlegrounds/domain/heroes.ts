import type { HeroDefinition, Player } from './types';
import { buff, matchesTribe } from './units';

export function targetedHero(hero: HeroDefinition): boolean {
  return (
    hero.ability.type === 'recall' ||
    (hero.ability.type === 'buff' && hero.ability.target === 'friendly')
  );
}

/** Validate every precondition before mutating the cloned recruitment player. */
export function applyHeroPower(
  player: Player,
  hero: HeroDefinition,
  targetId?: string,
): string | undefined {
  const ability = hero.ability;
  if (ability.type === 'income') return 'This hero power is passive.';
  if (player.powerUsed) return 'Hero power already used this round.';
  if (player.gold < hero.cost) return 'Not enough gold for the hero power.';
  const target = player.board.find((unit) => unit.id === targetId);
  if (targetedHero(hero) && !target) return 'Select a friendly minion.';
  if (ability.type === 'recall') {
    if (player.hand.length >= 10) return 'Your hand is full.';
    player.board = player.board.filter((unit) => unit.id !== target!.id);
    // Moving the same unit preserves buffs, keywords, pool ownership, and the consumed
    // triple reward. Replaying a golden does not award another Discover.
    player.hand.push(target!);
  } else {
    const targets = player.board.filter((unit) =>
      ability.target === 'friendly'
        ? unit.id === targetId
        : ability.target === 'tribe'
          ? matchesTribe(unit, ability.tribe)
          : true,
    );
    if (!targets.length)
      return ability.target === 'tribe'
        ? 'Recruit a matching tribe first.'
        : 'Recruit a minion first.';
    for (const unit of targets) {
      buff(unit, ability.attack, ability.health);
      if (ability.keyword && !unit.keywords.includes(ability.keyword))
        unit.keywords.push(ability.keyword);
    }
  }
  player.gold -= hero.cost;
  player.powerUsed = true;
}
