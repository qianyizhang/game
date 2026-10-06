import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { legalActions, sessionEngine, type Engine } from '../shared/engine';
import { replayCodec, type Session } from '../shared/replay';
import { blindsideSession } from '../games/balatro/application/session';
import { blindsideCommands, blindsideEngine } from '../games/balatro/application/engine';
import { spireSession } from '../games/spire/application/session';
import { spireCommands, spireEngine } from '../games/spire/application/engine';
import { bgSession } from '../games/battlegrounds/application/session';
import { hearthEngine } from '../games/battlegrounds/application/engine';
import { makeUnit } from '../games/battlegrounds/domain/units';
import { CARD_BY_ID } from '../games/spire/content/cards';
import { openPack } from '../games/balatro/domain/shopExtras';

function lifecycle<S extends { seed: string; phase: string }, C extends { type: string }>(
  name: string,
  codec: ReturnType<typeof replayCodec<S, C>>,
  engine: Engine<Session<S, C>, C>,
) {
  const saved = codec.decode(readFileSync(`tests/fixtures/${name}-win.json`, 'utf8'));
  let position = codec.create(saved.replay.seed);
  const checked = new Set<string>();
  for (const command of saved.replay.commands) {
    const checkpoint = `${position.state.phase}/${command.type}`;
    if (!checked.has(checkpoint)) {
      const snapshot = structuredClone(position);
      const actions = [...legalActions(engine, position)];
      expect(
        actions.some((action) => action.type === command.type),
        `${name}: ${checkpoint}`,
      ).toBe(true);
      expect(position).toEqual(snapshot);
      checked.add(checkpoint);
    }
    const next = engine.step(position, command);
    expect(next.error, `${name}: ${checkpoint}`).toBeUndefined();
    position = next.position;
  }
  expect(position).toEqual(saved);
  expect(engine.outcome(position)).toBe('won');
  expect([...legalActions(engine, position)]).toEqual([]);
  const lost = codec.decode(readFileSync(`tests/fixtures/${name}-loss.json`, 'utf8'));
  expect(engine.outcome(lost)).toBe('lost');
  expect([...legalActions(engine, lost)]).toEqual([]);
}

describe('playing adapters delegate legality and keep normal replays intact', () => {
  it('covers decision kinds throughout all three complete recorded runs', () => {
    lifecycle('blindside', blindsideSession, blindsideEngine);
    lifecycle('spire', spireSession, spireEngine);
    lifecycle('battlegrounds-v6', bgSession, hearthEngine);
  });
  it('enumerates Blindside subsets, consumable targets and pack choices without spending resources', () => {
    const codec = replayCodec(blindsideSession.rules, true);
    const position = codec.create('ENGINE-CARDS', {
      deck: Array.from({ length: 8 }, (_, i) => ({ rank: i + 2, suit: 'hearts' })),
    });
    position.state.consumables = [{ id: 'test-garden', definitionId: 'garden', paid: 4 }];
    const snapshot = structuredClone(position);
    const engine = sessionEngine(codec, blindsideCommands);
    const actions = [...legalActions(engine, position)];
    expect(actions.filter((c) => c.type === 'play')).toHaveLength(218); // C(8,1)..C(8,5).
    expect(actions.filter((c) => c.type === 'useConsumable')).toHaveLength(36); // Singles + pairs.
    expect(position).toEqual(snapshot);
    const invalid = engine.step(position, { type: 'play', cards: ['missing'] });
    expect(invalid.error).toBeTruthy();
    expect(invalid.position).toBe(position);
    openPack(position.state, 'standard', 0, 'shop');
    const packActions = [...legalActions(engine, position)];
    expect(packActions.filter((c) => c.type === 'choosePack')).toHaveLength(
      position.state.pack!.choices.length,
    );
    expect(packActions.some((c) => c.type === 'play')).toBe(false);
    expect(packActions).toContainEqual({ type: 'skipPack' });
  });
  it('offers every living Spire target and mandatory card choices, honoring energy and potion locks', () => {
    const codec = replayCodec(spireSession.rules, true);
    let position = codec.create('ENGINE-TARGETS', {
      deck: ['trueGrit', 'strike', 'defend', 'defend', 'bash'],
      upgrades: ['trueGrit'],
      enemies: ['sentry', 'sentry'],
      hp: 80,
    });
    const engine = sessionEngine(codec, spireCommands);
    position.state.potions = ['fire', 'block'];
    const combat = position.state.combat!;
    const strike = combat.hand.find((id) => combat.cards[id].definitionId === 'strike')!;
    const actions = [...legalActions(engine, position)];
    expect(actions.filter((c) => c.type === 'potion')).toHaveLength(3);
    expect(actions.filter((c) => c.type === 'playCard' && c.id === strike)).toEqual(
      combat.enemies.map((enemy) => ({ type: 'playCard', id: strike, target: enemy.id })),
    );
    const grit = combat.hand.find((id) => combat.cards[id].definitionId === 'trueGrit')!;
    position = engine.step(position, { type: 'playCard', id: grit }).position;
    expect(position.state.combat!.choice).not.toBeNull();
    expect([...legalActions(engine, position)]).toEqual(
      position.state.combat!.choice!.options.map((id) => ({ type: 'chooseCard', id })),
    );
    expect(engine.step(position, { type: 'endTurn' }).error).toBeTruthy();
    const choices = position.state.combat!.choice!.options;
    position = engine.step(position, { type: 'chooseCard', id: choices[0] }).position;
    position.state.combat!.energy = 0;
    for (const action of legalActions(engine, position))
      if (action.type === 'playCard')
        expect(CARD_BY_ID[position.state.combat!.cards[action.id].definitionId].cost).toBe(0);
  });
  it('offers targeted recruitment at every slot and does not spend pool copies when listing actions', () => {
    let position = bgSession.create('ENGINE-RECRUIT');
    position = hearthEngine.step(position, { type: 'chooseHero', hero: 'forgekeeper' }).position;
    const player = position.state.players[0];
    player.board = [makeUnit('stray', 'board-a'), makeUnit('squire', 'board-b')];
    player.hand = [makeUnit('spark', 'hand-a')];
    player.gold = 0;
    const snapshot = structuredClone(position);
    const actions = [...legalActions(hearthEngine, position)];
    expect(actions.filter((c) => c.type === 'play')).toHaveLength(6); // 3 positions x 2 targets.
    expect(actions.some((c) => ['buy', 'upgrade', 'refresh', 'power'].includes(c.type))).toBe(
      false,
    );
    expect(position).toEqual(snapshot);
    player.discover = [makeUnit('stray', 'discover-a')];
    expect([...legalActions(hearthEngine, position)]).toEqual([
      { type: 'discover', id: 'discover-a' },
    ]);
  });
  it('handles event choices, including both Moai Head outcomes', () => {
    const position = spireSession.create('ENGINE-EVENT');
    position.state.phase = 'event';
    position.state.event = 'moaiHead';
    position.state.relics.push('goldenIdol');
    expect([...legalActions(spireEngine, position)]).toEqual([
      { type: 'event', choice: 'jump' },
      { type: 'event', choice: 'idol' },
      { type: 'event', choice: 'leave' },
    ]);
    expect(spireEngine.step(position, { type: 'invented' } as never).error).toContain(
      'Invalid engine command',
    );
  });
});
