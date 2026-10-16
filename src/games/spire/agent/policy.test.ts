import { describe, expect, it } from 'vitest';
import { spireScenario } from '../application/scenario';
import { adapter } from './adapter';
import example from './example';
import { observe } from './observation';
import { builtins, STRATEGIES } from './policy';

const config = { setup: {}, options: {}, policySeed: 'INDEPENDENT-POLICY-1' };

describe('Spire observation-only strategies', () => {
  it('makes different tactical choices for damage, incoming defense and persistent growth', () => {
    const run = spireScenario('POLICY-ADOPTION-1-DEV-01', {
      deck: ['strike', 'defend', 'metallicize'],
      enemies: ['jawWorm'],
    });
    run.combat!.enemies[0].intentIndex = 0;
    const view = observe(run);
    const expected = { immediate: 'strike', survival: 'defend', growth: 'metallicize' };
    for (const strategy of STRATEGIES) {
      const proposal = builtins[strategy].create(config)(view);
      expect(proposal.command.type).toBe('playCard');
      if (proposal.command.type === 'playCard')
        expect(view.combat!.cards[proposal.command.id].definitionId).toBe(expected[strategy]);
      expect(view.actions).toContainEqual(proposal.command);
      expect(proposal.work).toBe(view.actions.length);
    }
  });

  it('completes legal episodes for both characters and all measured Ascensions, then replays exactly', () => {
    for (const character of ['ironclad', 'silent']) {
      for (const ascension of [0, 2, 5]) {
        for (const strategy of STRATEGIES) {
          const setup = { character, ascension };
          let session = adapter.create('POLICY-ADOPTION-1-DEV-01', setup);
          const decide = builtins[strategy].create({ ...config, setup });
          let steps = 0;
          while (steps++ < 3000 && !adapter.terminal(session)) {
            const view = adapter.observe(session),
              proposal = decide(view);
            expect(view.actions).toContainEqual(proposal.command);
            const result = adapter.act(session, proposal.command);
            expect(
              result.error,
              `${character}/${ascension}/${strategy}: ${JSON.stringify(proposal.command)}`,
            ).toBeUndefined();
            session = result.state;
          }
          expect(adapter.terminal(session), `${character}/${ascension}/${strategy}`).toBe(true);
          expect(adapter.restore(adapter.replay(session))).toEqual(session);
          expect(adapter.metrics(session).progress).toBeGreaterThan(0);
        }
      }
    }
  }, 120_000);

  it('resets local extension memory without changing baseline commands', () => {
    const view = adapter.observe(adapter.create('POLICY-ADOPTION-1-DEV-01', {}));
    const choose = example.create(config);
    const first = choose(view);
    expect(first.command).toEqual(builtins.survival.create(config)(view).command);
    expect(choose(view)).not.toEqual(first);
    expect(example.create(config)(view)).toEqual(first);
  });
});
