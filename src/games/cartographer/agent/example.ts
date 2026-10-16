import type { PolicyFactory } from '../../../shared/policy/types';
import type { Observation, PolicyCommand } from './observation';
import { builtins } from './policy';

/** Local policy extension with its own per-episode memory. */
const example: PolicyFactory<Observation, PolicyCommand> = {
  id: 'example-counted-immediate',
  version: '1',
  create(config) {
    let decisions = 0;
    const choose = builtins.immediate.create(config);
    return (input) => {
      const result = choose(input);
      return {
        ...result,
        diagnostics: {
          example: 'Same actions as immediate; episode-local counter.',
          decisions: ++decisions,
          baseline: result.diagnostics ?? null,
        },
      };
    };
  },
};
export default example;
