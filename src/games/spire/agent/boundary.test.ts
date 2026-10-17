import { describe, expect, it } from 'vitest';
import type { JsonObject } from '../../../shared/policy/types';
import { auditRollout, recordEpisode } from '../../../shared/policy/rollout';
import win from '../../../../tests/fixtures/spire-win.json';
import loss from '../../../../tests/fixtures/spire-loss.json';
import { spireSession } from '../application/session';
import { spireScenario } from '../application/scenario';
import { spireCommands } from '../application/engine';
import { CARD_BY_ID } from '../content/cards';
import { createSpire, transitionSpire } from '../domain/game';
import type { SpireCommand, SpireState } from '../domain/types';
import { adapter, study } from './adapter';
import { builtins } from './policy';
import { observe, type PolicyCommand } from './observation';

const combat = () =>
  spireScenario('BOUNDARY', {
    deck: ['strike', 'defend', 'bash', 'clash', 'wound', 'shrugItOff', 'headbutt', 'trueGrit'],
    enemies: ['cultist'],
    relics: [],
  });
const commandKey = (command: SpireCommand) => JSON.stringify(command);

describe('Spire restricted player boundary', () => {
  it('detects an intentionally leaky recorder while preserving independent replay validity', async () => {
    const leaky = {
      ...adapter,
      observe: (session: Parameters<typeof adapter.observe>[0]) => ({
        ...adapter.observe(session),
        evaluatorRng: session.state.rng,
      }),
    };
    const run = await recordEpisode(leaky, builtins.immediate, {
      seed: 'LEAK-PROBE',
      setup: { character: 'silent', ascension: 2 },
      policySeed: 'SEPARATE',
      policyOptions: {},
      maxDecisions: 6,
    });
    expect(run.decisions[0].input).toHaveProperty('evaluatorRng');
    expect(await auditRollout(adapter, run, builtins.immediate)).toMatchObject({
      integrity: 'passed',
      replay: 'passed',
      inputs: 'failed',
      firstMismatch: { decision: 0, path: 'input' },
    });
  });
  it('detaches public inputs and withholds environment state, draw order, AI memory and pending continuation', () => {
    const run = combat();
    const changed = structuredClone(run);
    changed.seed = 'PRIVATE';
    changed.rng += 7;
    changed.nextId += 100;
    changed.unknownChances = { fight: 90, shop: 70, treasure: 30 };
    changed.rareOffset = 300;
    changed.potionChance = 99;
    changed.combat!.draw.reverse();
    changed.combat!.enemies[0].history = [10, 20, 30];
    changed.combat!.enemies[0].powers.stasisUsed = 1;
    changed.resolution.frames = [];
    changed.resolution.sequence += 99;
    for (const node of changed.map) if (node.kind !== 'boss') node.encounter = ['nemesis'];
    const original = observe(run);
    expect(observe(changed)).toEqual(original);
    for (const factory of Object.values(builtins)) {
      const config = { setup: {}, options: {}, policySeed: 'PUBLIC-ONLY' };
      expect(factory.create(config)(observe(changed))).toEqual(factory.create(config)(original));
    }
    const serialized = JSON.stringify(original);
    for (const key of [
      'seed',
      'rng',
      'nextId',
      'unknownChances',
      'rareOffset',
      'potionChance',
      'intentIndex',
      'history',
      'resolution',
      'stasisUsed',
    ])
      expect(serialized).not.toContain(`"${key}":`);
    original.deck[0].definitionId = 'tampered';
    original.combat!.player.status.strength = 999;
    original.combat!.enemies[0].intent.effects.length = 0;
    original.map[0].next.push('tampered');
    expect(observe(run)).toEqual(observe(changed));
    run.combat!.choice = {
      action: 'exhaust',
      options: [run.combat!.hand[0]],
      effects: [{ type: 'draw', amount: 7 }],
      sourceId: 'secret-continuation',
      exhaust: true,
      x: 4,
    };
    const pending = observe(run);
    expect(pending.combat!.choice).toEqual({ action: 'exhaust', options: [run.combat!.hand[0]] });
    expect(pending.actions).toEqual([{ type: 'chooseCard', id: run.combat!.hand[0] }]);
    const altered = structuredClone(run);
    altered.combat!.choice!.effects = [];
    altered.combat!.choice!.sourceId = 'other';
    expect(observe(altered)).toEqual(pending);
  });

  it('does not reveal unopened treasure contents or future room encounters', () => {
    const run = createSpire('CHEST');
    run.phase = 'treasure';
    run.rewardRelic = 'vajra';
    const other = structuredClone(run);
    other.rewardRelic = 'anchor';
    expect(observe(other)).toEqual(observe(run));
    expect(observe(run).rewardRelic).toBeNull();
    for (const node of other.map) if (node.kind !== 'boss') node.encounter = ['nemesis'];
    expect(observe(other)).toEqual(observe(run));
    expect(observe(run).boss.length).toBeGreaterThan(0);
    expect(observe(run).map.every((n) => !('encounter' in n))).toBe(true);
  });

  it('fixes evaluator setup and rejects malformed or stale commands without changing replay', () => {
    expect(study.setups).toHaveLength(6);
    for (const setup of ['ironclad', 'silent'].flatMap((character) =>
      Array.from({ length: 6 }, (_, ascension) => ({ character, ascension })),
    )) {
      const session = adapter.create('SETUP', setup);
      expect(session.replay.commands[0]).toEqual({ type: 'configure', ...setup });
      expect(adapter.restore(adapter.replay(session))).toEqual(session);
    }
    const invalidSetups: JsonObject[] = [
      { character: ['ironclad'] },
      { ascension: -1 },
      { ascension: 6 },
      { ascension: 1.5 },
      { ascension: '2' },
      { seed: 'leak' },
    ];
    for (const setup of invalidSetups) expect(() => adapter.create('SETUP', setup)).toThrow();
    const session = adapter.create('SETUP', {});
    const configure = { type: 'configure', character: 'silent', ascension: 0 };
    expect(adapter.isCommand(configure)).toBe(false);
    const rejected = adapter.act(session, configure as PolicyCommand);
    expect(rejected.error).toBeTruthy();
    expect(rejected.state).toBe(session);
    const stale = adapter.act(session, { type: 'playCard', id: 'missing' });
    expect(stale.error).toBeTruthy();
    expect(stale.state).toBe(session);
    const blessing = observe(session.state).actions.find((a) => a.type === 'neow')!;
    const accepted = adapter.act(session, blessing);
    expect(accepted.error).toBeUndefined();
    const repeated = adapter.act(accepted.state, blessing);
    expect(repeated.error).toBeTruthy();
    expect(repeated.state).toBe(accepted.state);
  });

  it('matches ordinary command legality along historical winning and losing journeys', () => {
    const phases = new Set<string>();
    for (const fixture of [win, loss]) {
      let session = spireSession.create(fixture.seed);
      for (const [index, command] of (fixture.commands as SpireCommand[]).entries()) {
        // Sparse combat sampling retains varied turns without a candidate-by-turn test matrix.
        if (!phases.has(session.state.phase) || index % 31 === 0) {
          phases.add(session.state.phase);
          const observed = observe(session.state).actions.map(commandKey).sort();
          const accepted = [...spireCommands(session.state)]
            .filter((c) => c.type !== 'configure' && !transitionSpire(session.state, c).error)
            .map(commandKey)
            .sort();
          expect(observed, `${fixture.seed}:${index}`).toEqual(accepted);
        }
        const result = spireSession.act(session, command);
        expect(result.error).toBeUndefined();
        session = result.session;
      }
      expect(adapter.terminal(session)).toBe(true);
      expect(observe(session.state).actions).toEqual([]);
      expect(Number(adapter.metrics(session).progress)).toBeLessThanOrEqual(48);
    }
    expect(phases).toEqual(
      new Set([
        'neow',
        'map',
        'combat',
        'reward',
        'bossRelic',
        'rest',
        'shop',
        'event',
        'treasure',
      ]),
    );
  });

  it('filters public combat constraints, purchases and noncombat costs before execution', () => {
    const run = combat();
    const c = run.combat!;
    c.hand = Object.keys(c.cards);
    c.draw = [];
    c.energy = 1;
    c.enemies[0].powers.entangle = 1;
    const inputs = [run];
    const shop = createSpire('SHOP');
    shop.phase = 'shop';
    shop.gold = 40;
    shop.removals = 0;
    shop.shop = [
      { id: 'expensive', kind: 'relic', definitionId: 'vajra', price: 100 },
      { id: 'cheap', kind: 'potion', definitionId: 'fire', price: 30 },
    ];
    shop.relics.push('sozu');
    inputs.push(shop);
    for (const event of [
      'bigFish',
      'cleric',
      'shiningLight',
      'goldenIdol',
      'goldenShrine',
      'ancientWriting',
      'womanInBlue',
      'moaiHead',
    ]) {
      const state = createSpire('EVENT');
      state.phase = 'event';
      state.event = event;
      state.hp = 1;
      state.gold = 0;
      inputs.push(state);
    }
    const rest = createSpire('REST');
    rest.phase = 'rest';
    rest.relics.push('coffeeDripper', 'fusionHammer');
    inputs.push(rest);
    for (const state of inputs) {
      const observed = observe(state).actions.map(commandKey).sort();
      const accepted = [...spireCommands(state)]
        .filter((c) => c.type !== 'configure' && !transitionSpire(state, c).error)
        .map(commandKey)
        .sort();
      expect(observed, state.event || state.phase).toEqual(accepted);
    }
    expect(
      observe(run).actions.some(
        (a) => a.type === 'playCard' && CARD_BY_ID[c.cards[a.id].definitionId].kind === 'attack',
      ),
    ).toBe(false);
    const finished: SpireState = { ...createSpire('TERMINAL'), phase: 'won', act: 3, row: 15 };
    expect(
      adapter.metrics({ state: finished, replay: spireSession.create('TERMINAL').replay }).progress,
    ).toBe(48);
  });

  it('keeps rebirthing enemies out of card and potion targets while another enemy remains', () => {
    const run = spireScenario('REBIRTH', {
      deck: ['strike', 'bash', 'defend'],
      enemies: ['awakenedOne', 'cultist'],
      relics: [],
    });
    const c = run.combat!;
    c.energy = 3;
    run.potions = ['fire', 'weak'];
    const rebirthing = c.enemies[0];
    rebirthing.powers.rebirthing = 1;
    const view = observe(run);
    expect(view.combat!.enemies[0].targetable).toBe(false);
    expect(view.combat!.enemies[1].targetable).toBe(true);
    expect(view.actions.some((a) => 'target' in a && a.target === rebirthing.id)).toBe(false);
    const attack = c.hand.find((id) => CARD_BY_ID[c.cards[id].definitionId].target)!;
    const forbidden = { type: 'playCard', id: attack, target: rebirthing.id } as const;
    expect(transitionSpire(run, forbidden).error).toBe('Choose a living enemy.');
    const accepted = [...spireCommands(run)]
      .filter((command) => command.type !== 'configure' && !transitionSpire(run, command).error)
      .map(commandKey)
      .sort();
    expect(view.actions.map(commandKey).sort()).toEqual(accepted);
  });
});
