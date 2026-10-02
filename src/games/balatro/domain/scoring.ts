import { activeBoss } from '../content/blinds';
import { JOKER_BY_ID } from '../content/jokers';
import { cardChips, evaluateHand, HANDS, isFace, rankLabel } from './poker';
import type { Card, RunState, ScoreContext, ScoreEffect, ScoreResult } from './types';

export function isDebuffed(card: Card, run: Readonly<RunState>): boolean {
  const boss = activeBoss(run);
  return (
    (boss === 'thorn' && (card.suit === 'clubs' || card.enhancement === 'wild')) ||
    (boss === 'mask' && isFace(card))
  );
}

export function contextFor(run: Readonly<RunState>, selected: readonly string[]): ScoreContext {
  // Scoring follows the hand's visible order, never selection-click order.
  const played = run.hand
    .filter((id) => selected.includes(id))
    .map((id) => run.deck.find((card) => card.id === id)!);
  const poker = evaluateHand(played, activeBoss(run) === 'thorn');
  const allScore = run.jokers.some((j) => JOKER_BY_ID[j.definitionId].rule === 'allScore');
  return {
    run,
    played,
    poker,
    scored: played.filter((card) => allScore || poker.scoringIds.includes(card.id)),
    held: run.hand
      .filter((id) => !selected.includes(id))
      .map((id) => run.deck.find((card) => card.id === id)!),
  };
}

/** Pure forecast: no RNG consumption, growth, zone moves or saved-state mutation. */
export function scoreHand(run: Readonly<RunState>, selected: readonly string[]): ScoreResult {
  const context = contextFor(run, selected);
  const { poker } = context;
  const base = HANDS[poker.type];
  const level = run.levels[poker.type] - 1;
  const result: ScoreResult = {
    poker,
    chips: 0,
    mult: 0,
    cash: 0,
    total: 0,
    steps: [],
    scoredIds: context.scored.map((c) => c.id),
    blocked: false,
  };
  const add = (source: string, effect: ScoreEffect | undefined) => {
    if (
      !effect ||
      (!effect.chips && !effect.mult && !effect.cash && (!effect.factor || effect.factor === 1))
    )
      return;
    result.chips += effect.chips ?? 0;
    result.mult = (result.mult + (effect.mult ?? 0)) * (effect.factor ?? 1);
    result.cash += effect.cash ?? 0;
    // Later hooks observe money earned earlier in this score, without mutating the run.
    context.run = { ...run, cash: run.cash + result.cash };
    const detail = [
      effect.chips ? `+${effect.chips} chips` : '',
      effect.mult ? `+${effect.mult} mult` : '',
      effect.factor && effect.factor !== 1 ? `×${effect.factor} mult` : '',
      effect.cash ? `+$${effect.cash}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    result.steps.push({
      source,
      detail,
      chips: result.chips,
      mult: result.mult,
      cash: result.cash,
    });
  };
  if (activeBoss(run) === 'lock' && run.firstHandType && run.firstHandType !== poker.type) {
    result.blocked = true;
    result.steps.push({
      source: 'The Lock',
      detail: `Only ${HANDS[run.firstHandType].name} can score.`,
      chips: 0,
      mult: 0,
      cash: 0,
    });
    return result;
  }
  add(`${base.name} · level ${level + 1}`, {
    chips: base.chips + base.chipGain * level,
    mult: base.mult + base.multGain * level,
  });
  for (const card of context.scored) {
    const label = `${rankLabel(card.rank)} ${card.suit}`;
    if (isDebuffed(card, run)) {
      result.steps.push({
        source: label,
        detail: 'Debuffed · contributes no effects',
        chips: result.chips,
        mult: result.mult,
        cash: result.cash,
      });
      continue;
    }
    const repeats =
      card.rank <= 5
        ? run.jokers.filter((j) => JOKER_BY_ID[j.definitionId].rule === 'repeatLow').length
        : 0;
    for (let trigger = 0; trigger <= repeats; trigger++) {
      add(`${label}${trigger ? ' · retrigger' : ''}`, { chips: cardChips(card) });
      if (card.enhancement === 'bonus') add('Bonus card', { chips: 30 });
      if (card.enhancement === 'mult') add('Mult card', { mult: 4 });
      if (card.enhancement === 'glass') add('Glass card', { factor: 2 });
      for (const owned of run.jokers) {
        const definition = JOKER_BY_ID[owned.definitionId];
        add(definition.name, definition.onCard?.(context, card, owned));
      }
    }
  }
  for (const card of context.held) {
    if (isDebuffed(card, run)) continue;
    if (card.enhancement === 'steel') add(`Held steel ${rankLabel(card.rank)}`, { factor: 1.5 });
    for (const owned of run.jokers) {
      const definition = JOKER_BY_ID[owned.definitionId];
      add(definition.name, definition.onHeld?.(context, card, owned));
    }
  }
  for (const owned of run.jokers) {
    const definition = JOKER_BY_ID[owned.definitionId];
    add(definition.name, definition.onHand?.(context, owned));
  }
  result.total = Math.floor(result.chips * result.mult);
  return result;
}
