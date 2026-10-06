import type { ArenaFrame } from '../application/arena';
import { botDecision, baselineOrder, unitValue } from '../domain/bots';
import { chooseSpell } from '../domain/spell-controller';
import type { RecruitCommand, RivalStyle } from '../domain/arena';
import { decideRecruitment, type RecruitmentDecision } from './recruitment-policy';

/** v6 gameplay wrapper; frozen v1/v2 experiments continue to call their original policies. */
export function decideSpellRecruitment(frame: ArenaFrame, style: RivalStyle): RecruitmentDecision {
  const o = frame.observation,
    p = o.self;
  if (!p.tavern) return decideRecruitment(frame, style);
  if (o.activeSeat !== p.id || !frame.actions.length) throw new Error('This seat cannot act.');
  const commands = frame.actions.map((entry) => entry.command);
  let core: RecruitmentDecision;
  if (style !== 'baseline-v1') core = decideRecruitment(frame, style);
  else {
    const proposal = botDecision({ round: o.round }, p, o.turn.refreshes);
    let command = proposal && commands.find((c) => JSON.stringify(c) === JSON.stringify(proposal));
    if (!command && p.tavern.discount) {
      const offers = commands.filter((c) => c.type === 'buy');
      const best = [...p.shop].sort((a, b) => unitValue(b, p) - unitValue(a, p))[0];
      command = offers.find((c) => c.type === 'buy' && c.id === best?.id);
    }
    if (!command) {
      const order = baselineOrder(p.board).map((unit) => unit.id);
      const mismatch = p.board.findIndex((unit, i) => unit.id !== order[i]);
      command =
        mismatch >= 0
          ? commands.find(
              (c) => c.type === 'move' && c.id === order[mismatch] && c.direction === -1,
            )
          : undefined;
    }
    core = {
      command: command ?? { type: 'endRecruit' },
      reason: command ? 'classic-spell-recruitment' : 'finish',
    };
  }
  const spell = chooseSpell(p, commands, core.command);
  return spell ? { command: spell as RecruitCommand, reason: 'tavern-spell-v1' } : core;
}
