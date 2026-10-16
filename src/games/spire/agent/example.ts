import type { PolicyFactory } from '../../../shared/policy/types';
import type { Observation, PolicyCommand } from './observation';
import { builtins } from './policy';

/** Local extension sample: same actions as survival, with fresh per-episode memory. */
const example: PolicyFactory<Observation, PolicyCommand> = {
  id: 'example-counted-survival',
  version: '3',
  create(config) {
    let decisions = 0;
    const choose = builtins.survival.create(config);
    return (input) => {
      const proposal = choose(input);
      return {
        ...proposal,
        diagnostics: {
          example: 'Extension sample; no additional strength claim.',
          decisions: ++decisions,
          baseline: proposal.diagnostics ?? null,
        },
      };
    };
  },
};
export default example;
