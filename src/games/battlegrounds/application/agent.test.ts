import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { actHearthAgent, hearthFrame, legalHearthCommands, observeHearth } from './agent';
import { bgSession } from './session';
import { hearthEngine } from './engine';
import { legalActions } from '../../../shared/engine';
import { makeUnit } from '../domain/units';

describe('Hearth policy boundary', () => {
  it('is invariant to private rival state, pool, seed and RNG, including its legal action menu', () => {
    let session = bgSession.create('PRIVATE-SEED');
    session = bgSession.act(session, { type: 'chooseHero', hero: 'archivist' }).session;
    const before = structuredClone(session);
    const frame = hearthFrame(session);
    const other = structuredClone(session);
    other.state.rng += 1000;
    other.state.seed = 'ANOTHER-PRIVATE-SEED';
    other.replay.seed = 'ANOTHER-PRIVATE-SEED';
    other.state.nextId += 10000;
    for (const id of Object.keys(other.state.pool)) other.state.pool[id] = 0;
    for (const player of other.state.players.slice(1)) {
      player.gold = 999;
      player.hand = [makeUnit('amalgam', 'secret-hand')];
      player.shop = [makeUnit('wolf', 'secret-shop')];
      player.board = [makeUnit('hydra', 'secret-board')];
      player.discover = [makeUnit('baron', 'secret-discover')];
    }
    expect(hearthFrame(other)).toEqual(frame);
    expect(session).toEqual(before);
    expect(JSON.stringify(frame)).not.toContain('PRIVATE-SEED');
    expect(JSON.stringify(frame)).not.toContain('"rng"');
    expect(JSON.stringify(frame)).not.toContain('"pool"');
    frame.observation.self.gold = 999;
    expect(session).toEqual(before);
  });

  it('matches native legality in hero, recruit, Discover, combat and terminal states', () => {
    const replay = JSON.parse(readFileSync('tests/fixtures/battlegrounds-v6-win.json', 'utf8'));
    let session = bgSession.create(replay.seed);
    const covered = new Set<string>();
    const inspect = () => {
      const key = session.state.players[0].discover.length ? 'discover' : session.state.phase;
      if (covered.has(key)) return;
      covered.add(key);
      expect(legalHearthCommands(session.state)).toEqual([...legalActions(hearthEngine, session)]);
    };
    inspect();
    for (const command of replay.commands) {
      session = bgSession.act(session, command).session;
      inspect();
    }
    expect([...covered].sort()).toEqual(['combat', 'discover', 'hero', 'recruit', 'won']);
  });

  it('rejects stale and unknown actions atomically and emits structured accepted changes', () => {
    const initial = bgSession.create('TRACE');
    expect(actHearthAgent(initial, { step: 1, action: 'a0' }).session).toBe(initial);
    expect(actHearthAgent(initial, { step: 0, action: 'absent' }).session).toBe(initial);
    const first = actHearthAgent(initial, { step: 0, action: 'a0' });
    expect(first.frame.step).toBe(1);
    expect(first.events).toContainEqual({
      type: 'resource',
      name: 'gold',
      before: 0,
      after: 3,
      delta: 3,
    });
    expect(first.events.some((event) => event.type === 'phase')).toBe(true);
    const buy = first.frame.actions.find((action) => action.command.type === 'buy')!;
    const result = actHearthAgent(first.session, { step: 1, action: buy.id });
    expect(result.events).toContainEqual({
      type: 'resource',
      name: 'gold',
      before: 3,
      after: 0,
      delta: -3,
    });
    expect(
      result.events.some(
        (event) =>
          event.type === 'unit' && event.before?.zone === 'shop' && event.after?.zone === 'hand',
      ),
    ).toBe(true);
    expect(actHearthAgent(result.session, { step: 1, action: buy.id }).session).toBe(
      result.session,
    );
    expect(bgSession.decode(bgSession.encode(result.session))).toEqual(result.session);
    const capped = structuredClone(result.session);
    capped.replay.commands = Array.from({ length: 10000 }, () => ({ type: 'freeze' }));
    expect(actHearthAgent(capped, { step: 10000, action: 'a0' })).toMatchObject({
      session: capped,
      events: [],
      error: expect.stringContaining('budget'),
    });
  });

  it('exposes previous-round scouting instead of the private current opponent board', () => {
    let session = bgSession.create('SCOUT-OBSERVATION');
    for (const command of [
      { type: 'chooseHero', hero: 'forgekeeper' },
      { type: 'endRecruit' },
      { type: 'nextRound' },
    ] as const)
      session = bgSession.act(session, command).session;
    const observed = observeHearth(session);
    const opponent = observed.opponent!.playerId!;
    expect(observed.opponent!.source).toBe('last-seen');
    expect(observed.opponent!.seenRound).toBe(1);
    expect(observed.lastCombat).not.toHaveProperty('rng');
    session.state.players[opponent].board[0].attack += 100;
    expect(observeHearth(session)).toEqual(observed);
  });

  it('records formation changes with before/after slots even when stats do not change', () => {
    const replay = JSON.parse(readFileSync('tests/fixtures/battlegrounds-v6-win.json', 'utf8'));
    let session = bgSession.create(replay.seed);
    for (const command of replay.commands) {
      session = bgSession.act(session, command).session;
      if (
        session.state.phase === 'recruit' &&
        session.state.players[0].board.length >= 2 &&
        !session.state.players[0].discover.length
      )
        break;
    }
    const frame = hearthFrame(session);
    const move = frame.actions.find((action) => action.command.type === 'move')!;
    const result = actHearthAgent(session, { step: frame.step, action: move.id });
    expect(result.events.filter((event) => event.type === 'unit')).toHaveLength(2);
    expect(
      result.events.every(
        (event) => event.type === 'unit' && event.before?.index !== event.after?.index,
      ),
    ).toBe(true);
  });
});
