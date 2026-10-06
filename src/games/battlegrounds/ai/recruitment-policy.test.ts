import { expect, it } from 'vitest';
import { arenaFrame, arenaSessionV1 as arenaSession } from '../application/arena';
import { mixedRivalsConfig } from '../domain/arena';
import { makeUnit } from '../domain/units';
import { decideRecruitment } from './recruitment-policy';

function position() {
  return arenaSession.act(arenaSession.create('POLICY-TEST'), {
    type: 'configure',
    config: mixedRivalsConfig('POLICY-TEST', 'forgekeeper', 'hidden'),
  }).session;
}
it('spends on board strength before a tier investment that leaves a tempo board empty', () => {
  const session = position();
  session.state.round = 2;
  session.state.players[0].gold = 4;
  session.state.players[0].upgradeCost = 4;
  session.state.players[0].board = [makeUnit('wolf', 'ally')];
  const frame = arenaFrame(session, 0);
  expect(decideRecruitment(frame, 'economy-v1').command.type).toBe('upgrade');
  expect(decideRecruitment(frame, 'tempo-v1').command.type).toBe('buy');
});
it('uses disclosed tempo identity to reserve survival resources, with no hidden-style fallback', () => {
  const session = position();
  const p = session.state.players[0];
  p.hp = 20;
  p.gold = 8;
  p.upgradeCost = 5;
  p.board = Array.from({ length: 5 }, (_, i) => makeUnit('wolf', `ally-${i}`));
  session.state.round = 4;
  const hidden = arenaFrame(session, 0);
  const opponent = hidden.observation.opponent!.playerId!;
  session.state.arena.config!.seats[opponent].style = 'tempo-v1';
  expect(arenaFrame(session, 0)).toEqual(hidden);
  session.state.arena.config!.visibility = 'disclosed';
  const disclosed = arenaFrame(session, 0);
  expect(decideRecruitment(hidden, 'tempo-v1').command.type).toBe('upgrade');
  expect(decideRecruitment(disclosed, 'tempo-v1')).toMatchObject({
    command: { type: 'buy' },
    styleSignal: 'tempo-v1',
  });
  expect(decideRecruitment(hidden, 'baseline-v1')).toEqual(
    decideRecruitment(disclosed, 'baseline-v1'),
  );
});
it('never rerolls away its last three buying gold just because the board is full', () => {
  const session = position(),
    p = session.state.players[0];
  p.gold = 3;
  p.tier = 6;
  p.powerUsed = true;
  p.board = Array.from({ length: 7 }, (_, i) => ({
    ...makeUnit('wolf', `ally-${i}`),
    attack: 100,
    health: 100,
    maxHealth: 100,
  }));
  const decision = decideRecruitment(arenaFrame(session, 0), 'tempo-v1');
  expect(['endRecruit', 'move', 'freeze']).toContain(decision.command.type);
});
