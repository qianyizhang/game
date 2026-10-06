import { expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { arenaFrame, arenaSessionV1 as arenaSession } from '../application/arena';
import { mixedRivalsConfig } from '../domain/arena';
import { makeUnit } from '../domain/units';
import { decideRecruitment } from './recruitment-policy';
import { decideRecruitmentV2, recruitmentValue } from './recruitment-v2';

function position() {
  return arenaSession.act(arenaSession.create('RECRUITMENT-V2-TEST'), {
    type: 'configure',
    config: mixedRivalsConfig('RECRUITMENT-V2-TEST', 'forgekeeper', 'hidden'),
  }).session;
}
function upgradePosition() {
  const session = position(),
    p = session.state.players[0];
  session.state.round = 2;
  p.gold = 4;
  p.upgradeCost = 4;
  p.board = [makeUnit('wolf', 'ally')];
  return session;
}
function replacementPosition() {
  const session = position(),
    p = session.state.players[0];
  p.tier = 6;
  p.gold = 2;
  p.powerUsed = true;
  p.hand = [];
  p.board = Array.from({ length: 7 }, (_, i) => ({
    ...makeUnit('wolf', `ally-${i}`),
    golden: true,
    attack: 1 + i,
    health: 1 + i,
    maxHealth: 1 + i,
  }));
  p.shop = [{ ...makeUnit('hydra', 'offer'), attack: 30, health: 30, maxHealth: 30 }];
  return session;
}
it('keeps all published v1 policy source bytes frozen', () => {
  for (const [file, digest] of Object.entries({
    'ai/recruitment-policy.ts': '64b77022aa385c9359fba9e7959b37ee0428e21bcb89695151938d1abdda3df1',
    'ai/policy.ts': '70671c6d6b6277ae8b25a0942b29a103ca22ab1d8821efe013f5bc54417a8140',
    'domain/bots.ts': '962defd36701d8e425ed58b50498ebcb08c450340309957c12ef71fb33f655f8',
  }))
    expect(
      createHash('sha256')
        .update(readFileSync(`src/games/battlegrounds/${file}`))
        .digest('hex'),
    ).toBe(digest);
});
it('changes round-two cadence while retaining both frozen controls', () => {
  const frame = arenaFrame(upgradePosition(), 0),
    before = structuredClone(frame);
  expect(decideRecruitmentV2(frame, 'tempo-upgrade-v2')).toMatchObject({
    command: { type: 'upgrade' },
    reason: 'upgrade-cadence-v2',
  });
  expect(decideRecruitmentV2(frame, 'tempo-spend-v2').command.type).toBe('buy');
  for (const policy of ['baseline-v1', 'tempo-v1'] as const) {
    const { diagnostics, ...decision } = decideRecruitmentV2(frame, policy);
    expect(decision).toEqual(decideRecruitment(frame, policy));
    expect(diagnostics.interventions.every((i) => !i.selected)).toBe(true);
  }
  expect(frame).toEqual(before);
});
it('protects pending deployment, triple purchases, discover and survival reserves', () => {
  const pending = upgradePosition();
  pending.state.players[0].hand = [makeUnit('hydra', 'hand')];
  expect(decideRecruitmentV2(arenaFrame(pending, 0), 'tempo-both-v2').reason).toBe(
    'deploy-strength',
  );
  const triple = upgradePosition();
  triple.state.players[0].board = [makeUnit('wolf', 'a'), makeUnit('wolf', 'b')];
  triple.state.players[0].shop = [makeUnit('wolf', 'c')];
  expect(decideRecruitmentV2(arenaFrame(triple, 0), 'tempo-both-v2').reason).toBe(
    'complete-triple',
  );
  const discover = upgradePosition();
  discover.state.players[0].discover = [makeUnit('hydra', 'reward')];
  expect(decideRecruitmentV2(arenaFrame(discover, 0), 'tempo-both-v2').reason).toBe(
    'discover-value',
  );
  const low = upgradePosition();
  low.state.players[0].hp = 18;
  expect(decideRecruitmentV2(arenaFrame(low, 0), 'tempo-both-v2').command.type).toBe('buy');
});
it('retains hidden-label invariance but allows disclosed-label survival guards', () => {
  const session = upgradePosition();
  session.state.players[0].hp = 20;
  const hidden = arenaFrame(session, 0),
    opponent = hidden.observation.opponent!.playerId!;
  session.state.arena.config!.seats[opponent].style = 'tempo-v1';
  session.state.rng = 12345;
  session.state.players[opponent].hand = [makeUnit('hydra', 'secret')];
  expect(arenaFrame(session, 0)).toEqual(hidden);
  session.state.arena.config!.visibility = 'disclosed';
  expect(decideRecruitmentV2(hidden, 'tempo-upgrade-v2').command.type).toBe('upgrade');
  expect(decideRecruitmentV2(arenaFrame(session, 0), 'tempo-upgrade-v2').command.type).toBe('buy');
});
it('funds and completes a replacement through actual sell, buy and play transitions', () => {
  let session = replacementPosition();
  const before = decideRecruitmentV2(arenaFrame(session, 0), 'tempo-spend-v2');
  expect(before).toMatchObject({
    command: { type: 'sell', id: 'ally-0' },
    reason: 'fund-replacement-v2',
  });
  for (const type of ['sell', 'buy', 'play']) {
    const decision = decideRecruitmentV2(arenaFrame(session, 0), 'tempo-spend-v2');
    expect(decision.command.type).toBe(type);
    const result = arenaSession.act(session, { type: 'seat', seat: 0, action: decision.command });
    expect(result.error).toBeUndefined();
    session = result.session;
  }
  const p = session.state.players[0];
  expect(p.gold).toBe(0);
  expect(p.board).toHaveLength(7);
  expect(p.hand).toHaveLength(0);
  expect(p.board.some((u) => u.id === 'offer')).toBe(true);
});
it('blocks replacement when budget, headroom, hand or frozen triple would be compromised', () => {
  for (const scenario of ['budget', 'headroom', 'hand', 'triple', 'weak']) {
    const session = replacementPosition(),
      p = session.state.players[0];
    if (scenario === 'budget') {
      p.tier = 5;
      p.upgradeCost = 3;
    }
    if (scenario === 'headroom') session.state.arena.turn[0].actions = 117;
    if (scenario === 'hand') p.hand = [makeUnit('wolf', 'pending')];
    if (scenario === 'triple') {
      p.board[0] = makeUnit('hydra', 'a');
      p.board[1] = makeUnit('hydra', 'b');
      p.frozen = true;
    }
    if (scenario === 'weak') {
      p.shop[0].attack = 0;
      p.shop[0].health = 0;
    }
    expect(
      decideRecruitmentV2(arenaFrame(session, 0), 'tempo-spend-v2').diagnostics.interventions[1]
        .selected,
      scenario,
    ).toBe(false);
  }
});
it('decomposes the exact frozen Tempo arithmetic including keyword order', () => {
  const p = position().state.players[0],
    u = {
      ...makeUnit('hydra', 'all'),
      attack: 7,
      health: 9,
      keywords: ['shield', 'poison', 'windfury'] as const,
    };
  const unit = { ...u, keywords: [...u.keywords] },
    v = recruitmentValue(unit, p);
  expect(v.tempoTotal).toBe(
    7 + 9 * 0.8 + (7 + 9) * 0.55 + 12 + 7 * 0.4 + v.deathrattle + v.classicTotal * 0.3,
  );
});
it('rejects inactive seats instead of manufacturing decisions', () => {
  expect(() => decideRecruitmentV2(arenaFrame(position(), 7), 'tempo-both-v2')).toThrow(
    'cannot act',
  );
});
