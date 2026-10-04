import type { ArenaFrame } from '../application/arena';
import { HEROES, MINION_BY_ID } from '../content/minions';
import type { RecruitCommand, RivalStyle } from '../domain/arena';
import { baselineOrder, botDecision, unitValue } from '../domain/bots';
import type { Unit } from '../domain/types';
import { matchesTribe } from '../domain/units';

export interface RecruitmentDecision {
  command: RecruitCommand;
  reason: string;
  styleSignal?: RivalStyle;
}

/** Stateless, bounded controller. Its entire input is the detached per-seat policy frame. */
export function decideRecruitment(frame: ArenaFrame, style: RivalStyle): RecruitmentDecision {
  const o = frame.observation,
    p = o.self;
  if (o.activeSeat !== p.id || !frame.actions.length) throw new Error('This seat cannot act.');
  const legal = (command: RecruitCommand) =>
    frame.actions.find((entry) => JSON.stringify(entry.command) === JSON.stringify(command))
      ?.command;
  const action = (type: RecruitCommand['type'], id?: string) =>
    frame.actions.find(
      (entry) =>
        entry.command.type === type &&
        (id === undefined || ('id' in entry.command && entry.command.id === id)),
    )?.command;
  const finish = (): RecruitmentDecision => {
    const order = baselineOrder(p.board).map((unit) => unit.id);
    const mismatch = p.board.findIndex((unit, i) => unit.id !== order[i]);
    const move =
      mismatch >= 0 ? legal({ type: 'move', id: order[mismatch], direction: -1 }) : undefined;
    return { command: move ?? { type: 'endRecruit' }, reason: move ? 'baseline-order' : 'finish' };
  };
  if (style === 'baseline-v1') {
    const proposal = botDecision({ round: o.round }, p, o.turn.refreshes);
    const command = proposal && legal(JSON.parse(JSON.stringify(proposal)) as RecruitCommand);
    if (proposal && !command && o.turn.actions < 120)
      throw new Error('Baseline proposed an illegal command.');
    return command ? { command, reason: 'classic-recruitment' } : finish();
  }
  const signal = o.lobby.find((seat) => seat.id === o.opponent?.playerId)?.style;
  const choice = (command: RecruitCommand, reason: string): RecruitmentDecision => ({
    command,
    reason,
    ...(signal ? { styleSignal: signal } : {}),
  });
  const score = (unit: Unit) => {
    const d = MINION_BY_ID[unit.definitionId];
    const friends = p.board.filter(
      (ally) => d.tribe !== 'neutral' && matchesTribe(ally, d.tribe),
    ).length;
    const immediate =
      unit.attack +
      unit.health * 0.8 +
      (unit.keywords.includes('shield') ? (unit.attack + unit.health) * 0.55 : 0) +
      (unit.keywords.includes('poison') ? 12 : 0) +
      (unit.keywords.includes('windfury') ? unit.attack * 0.4 : 0) +
      (d.deathrattle ? 4 : 0);
    return style === 'composition-v1'
      ? unitValue(unit, p) + friends * 2 + (d.endTurn ? 4 : 0)
      : immediate + unitValue(unit, p) * 0.3;
  };
  const best = (units: Unit[]) => [...units].sort((a, b) => score(b) - score(a))[0];
  const worst = [...p.board].sort((a, b) => score(a) - score(b))[0];
  if (p.discover.length) return choice(action('discover', best(p.discover).id)!, 'discover-value');
  const hand = best(p.hand);
  if (hand) {
    const plays = frame.actions.filter(
      (entry) => entry.command.type === 'play' && entry.command.id === hand.id,
    );
    if (plays.length) {
      const effect = MINION_BY_ID[hand.definitionId].battlecry;
      const target =
        effect?.type === 'buff' && effect.targeted
          ? best(p.board.filter((unit) => matchesTribe(unit, effect.tribe)))
          : undefined;
      const command =
        legal({
          type: 'play',
          id: hand.id,
          position: p.board.length,
          ...(target ? { target: target.id } : {}),
        }) ?? plays[0].command;
      return choice(command, 'deploy-strength');
    }
    if (worst && score(hand) > score(worst) + 1 && action('sell', worst.id))
      return choice(action('sell', worst.id)!, 'replace-weakest');
  }
  const triple = p.shop.find(
    (unit) =>
      [...p.board, ...p.hand].filter((own) => !own.golden && own.definitionId === unit.definitionId)
        .length === 2,
  );
  if (triple && action('buy', triple.id))
    return choice(action('buy', triple.id)!, 'complete-triple');
  const upgrade = action('upgrade');
  // Disclosed tempo opponents raise the survival reserve. Hidden mode uses the neutral threshold.
  const survivalHP = signal === 'tempo-v1' ? 25 : 18;
  const minimumBoard = style === 'economy-v1' ? Math.min(4, o.round) : Math.min(7, o.round + 1);
  if (
    upgrade &&
    p.hp > survivalHP &&
    ((style === 'economy-v1' &&
      o.round >= p.tier * 2 &&
      (p.board.length >= minimumBoard || o.round === 2)) ||
      (p.board.length >= minimumBoard && p.gold - p.upgradeCost >= 3))
  )
    return choice(upgrade, 'invest-with-survival-reserve');
  const offer = best(p.shop.filter((unit) => action('buy', unit.id)));
  if (offer && (p.board.length + p.hand.length < 7 || (worst && score(offer) > score(worst) + 2)))
    return choice(action('buy', offer.id)!, 'buy-combat-strength');
  const hero = HEROES.find((h) => h.id === p.hero)!;
  const powers = frame.actions.filter((entry) => entry.command.type === 'power');
  if (powers.length) {
    const targets = p.board.filter(
      (unit) => hero.ability.type !== 'recall' || MINION_BY_ID[unit.definitionId].battlecry,
    );
    const target = best(targets);
    const power = target ? legal({ type: 'power', target: target.id }) : undefined;
    const untargeted = legal({ type: 'power' });
    if (power || untargeted) return choice((power ?? untargeted)!, 'spend-on-hero-strength');
  }
  if (upgrade && (p.upgradeCost === 0 || (p.board.length >= minimumBoard && p.hp > survivalHP)))
    return choice(upgrade, 'invest-unused-gold');
  if (triple && p.gold < 3 && !p.frozen && action('freeze'))
    return choice({ type: 'freeze' }, 'hold-triple');
  // Do not spend the last buying gold rerolling offers we cannot afford afterward.
  if (p.gold >= 4 && o.turn.refreshes < 5 && action('refresh'))
    return choice({ type: 'refresh' }, 'search-affordable-upgrade');
  return finish();
}
