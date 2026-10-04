import { adjacentMoves, sessionEngine } from '../../../shared/engine';
import { HEROES, MINION_BY_ID } from '../content/minions';
import type { BGCommand, BGState } from '../domain/types';
import type { PositioningCommand, PositioningState } from '../domain/challenge';
import { bgSession } from './session';
import { targetedHero } from '../domain/heroes';

export function* hearthCommands(state: BGState): Generator<BGCommand> {
  if (state.phase === 'hero') {
    for (const hero of HEROES) yield { type: 'chooseHero', hero: hero.id };
  } else if (state.phase === 'combat') yield { type: 'nextRound' };
  else if (state.phase === 'recruit') {
    const player = state.players[0];
    for (const unit of player.discover) yield { type: 'discover', id: unit.id };
    for (const unit of player.shop) yield { type: 'buy', id: unit.id };
    for (const unit of player.hand) {
      const effect = MINION_BY_ID[unit.definitionId].battlecry;
      const targets: (string | undefined)[] =
        effect?.type === 'buff' && effect.targeted
          ? [undefined, ...player.board.map((target) => target.id)]
          : [undefined];
      for (let position = 0; position <= Math.min(player.board.length, 6); position++)
        for (const target of targets)
          yield { type: 'play', id: unit.id, position, ...(target ? { target } : {}) };
    }
    for (const unit of player.board) yield { type: 'sell', id: unit.id };
    for (const move of adjacentMoves(player.board.map((unit) => unit.id)))
      yield { type: 'move', ...move };
    if (targetedHero(HEROES.find((hero) => hero.id === player.hero)!))
      for (const unit of player.board) yield { type: 'power', target: unit.id };
    else yield { type: 'power' };
    yield { type: 'refresh' };
    yield { type: 'freeze' };
    yield { type: 'upgrade' };
    yield { type: 'endRecruit' };
  }
}

export function* positioningCommands(state: PositioningState): Generator<PositioningCommand> {
  if (state.result) return;
  for (const move of adjacentMoves(state.board.map((unit) => unit.id)))
    yield { type: 'move', ...move };
  yield { type: 'fight' };
}

export const hearthEngine = sessionEngine(bgSession, hearthCommands);
