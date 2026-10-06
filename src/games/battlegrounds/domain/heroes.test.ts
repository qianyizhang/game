import { describe, expect, it } from 'vitest';
import { bgSession } from '../application/session';
import { hearthScenario } from '../application/scenario';
import { HEROES, RECRUITS } from '../content/minions';
import { validateHero } from '../../../mods/validation';
import { supplyTotal, transitionBG } from './game';
import { buff, makeUnit } from './units';
import { POOL_COPIES } from './recruitment';
import type { BGCommand, BGState } from './types';

function act(state: BGState, command: BGCommand) {
  const next = transitionBG(state, command);
  expect(next.error).toBeUndefined();
  for (const definition of RECRUITS)
    expect(supplyTotal(next.state, definition.id)).toBe(POOL_COPIES[definition.tier]);
  return next.state;
}

describe('strategic hero powers', () => {
  it('recalls the same buffed unit and replays its Battlecry with one payment', () => {
    let run = hearthScenario('RECALL', { hero: 'archivist', board: ['captain', 'stray'] });
    const captain = run.players[0].board[0];
    buff(captain, 3, 4);
    const before = structuredClone(captain);
    const friend = structuredClone(run.players[0].board[1]);
    run = act(run, { type: 'power', target: captain.id });
    expect(run.players[0].gold).toBe(9);
    expect(run.players[0].hand).toEqual([before]);
    expect(run.players[0].board).toEqual([friend]);
    run = act(run, { type: 'play', id: captain.id, position: 0 });
    expect(run.players[0].board[0]).toEqual(before);
    expect(run.players[0].board[1].attack).toBe(friend.attack + 1);
    expect(run.players[0].gold).toBe(9);
    expect(transitionBG(run, { type: 'power', target: captain.id }).state).toBe(run);
  });

  it('preserves a consumed golden reward when recalled', () => {
    let run = hearthScenario('GOLDEN-RECALL', { hero: 'archivist', board: ['captain'] });
    const old = run.players[0].board[0];
    run.pool.captain -= 2;
    run.players[0].board[0] = makeUnit('captain', old.id, true, 3);
    run = act(run, { type: 'power', target: old.id });
    run = act(run, { type: 'play', id: old.id, position: 0 });
    expect(run.players[0].discover).toEqual([]);
    expect(run.players[0].board[0].copies).toBe(3);
  });

  it('rejects full hands, missing targets, insufficient gold and pending Discover atomically', () => {
    const run = hearthScenario('REJECT-POWER', { hero: 'archivist', board: ['stray'] });
    const target = run.players[0].board[0].id;
    for (const kind of ['full', 'target', 'gold', 'discover']) {
      const copy = structuredClone(run);
      if (kind === 'full')
        copy.players[0].hand = Array.from({ length: 10 }, (_, i) =>
          makeUnit('cub', `token-${i}`, false, 0),
        );
      if (kind === 'gold') copy.players[0].gold = 0;
      if (kind === 'discover') copy.players[0].discover = [makeUnit('cub', 'pending', false, 0)];
      const snapshot = structuredClone(copy);
      const next = transitionBG(copy, {
        type: 'power',
        target: kind === 'target' ? 'absent' : target,
      });
      expect(next.error).toBeTruthy();
      expect(next.state).toBe(copy);
      expect(copy).toEqual(snapshot);
    }
  });

  it('fortifies only the chosen unit, persists through combat, and resets next round', () => {
    let run = hearthScenario('OATH', { hero: 'oathkeeper', board: ['stray', 'captain'] });
    const target = run.players[0].board[0];
    const hp = target.health;
    run = act(run, { type: 'power', target: target.id });
    expect(run.players[0].board[0].keywords).toContain('taunt');
    expect(run.players[0].board[0].maxHealth).toBe(hp + 3);
    expect(run.players[0].board[1].keywords).not.toContain('taunt');
    run = act(run, { type: 'endRecruit' });
    expect(run.players[0].board[0].health).toBe(hp + 3);
    run = act(run, { type: 'nextRound' });
    expect(run.players[0].powerUsed).toBe(false);
    run = act(run, { type: 'power', target: target.id });
    expect(run.players[0].board[0].health).toBe(hp + 6);
    expect(run.players[0].board[0].keywords.filter((key) => key === 'taunt')).toHaveLength(1);
  });

  it('reconstructs both heroes through legal replays and rejects old versions', () => {
    for (const hero of ['archivist', 'oathkeeper']) {
      let session = bgSession.create('HERO-REPLAY');
      session = bgSession.act(session, { type: 'chooseHero', hero }).session;
      session = bgSession.act(session, {
        type: 'buy',
        id: session.state.players[0].shop[0].id,
      }).session;
      session = bgSession.act(session, {
        type: 'play',
        id: session.state.players[0].hand[0].id,
        position: 0,
      }).session;
      session = bgSession.act(session, { type: 'endRecruit' }).session;
      session = bgSession.act(session, { type: 'nextRound' }).session;
      const power = bgSession.act(session, {
        type: 'power',
        target: session.state.players[0].board[0].id,
      });
      expect(power.error).toBeUndefined();
      expect(bgSession.decode(bgSession.encode(power.session))).toEqual(power.session);
      expect(() =>
        bgSession.decode(JSON.stringify({ ...power.session.replay, version: 4 })),
      ).toThrow('Incompatible');
    }
    expect(bgSession.key).toBe('card-workshop.last-hearth.v6');
  });

  it('validates declarative powers including passive and targeted content', () => {
    HEROES.forEach(validateHero);
    expect(() => validateHero({ ...HEROES[0], cost: 0.5 })).toThrow('integer');
    expect(() => validateHero({ ...HEROES[0], ability: { type: 'income', gold: 1 } })).toThrow(
      'zero cost',
    );
    expect(() =>
      validateHero({
        ...HEROES[0],
        ability: { type: 'buff', target: 'tribe', attack: 1, health: 1 },
      }),
    ).toThrow('tribe');
  });
});
