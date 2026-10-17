import { adapter } from '../../src/games/cartographer/agent/adapter';
import { builtins } from '../../src/games/cartographer/agent/policy';
import type { Session } from '../../src/games/cartographer/application/session';

/** Complete lifecycle coverage uses the actual restricted policy API on explicit Relaxed rules.
 * Standard/Severe strength belongs to the separately frozen calibration matrix.
 */
export function playExpedition(seed: string): Session {
  let state = adapter.create(seed, { difficulty: 'relaxed' });
  const choose = builtins.survival.create({
    setup: { difficulty: 'relaxed' },
    options: {},
    policySeed: 'SIMULATION-SURVIVAL-1',
  });
  for (let n = 0; n < 900 && !adapter.terminal(state); n++) {
    const result = adapter.act(state, choose(adapter.observe(state)).command);
    if (result.error) throw new Error(result.error);
    state = result.state;
  }
  return state.session;
}
