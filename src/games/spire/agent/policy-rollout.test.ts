import { describe, expect, it } from 'vitest';
import { adapter } from './adapter';
import { builtins, STRATEGIES } from './policy';

const config = { setup: {}, options: {}, policySeed: 'INDEPENDENT-POLICY-1' };

describe('Spire observation-only policy episodes', () => {
  it('completes legal episodes for both characters and all measured Ascensions, then replays exactly', () => {
    for (const character of ['ironclad', 'silent']) {
      for (const ascension of [0, 3, 5]) {
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
});
