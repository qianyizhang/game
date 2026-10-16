import type { PolicyFactory } from '../../../shared/policy/types';
import type { Observation, PolicyCommand } from './observation';
import { builtins } from './policy';

/** Local extension sample; delegates actions and adds factory-local episode memory. */
const example: PolicyFactory<Observation, PolicyCommand> = {
  id: 'example-counted-immediate',
  version: '1',
  create(config) {
    let decisions = 0;
    const choose = builtins.immediate.create(config);
    return (input) => {
      const proposal = choose(input);
      return {
        ...proposal,
        diagnostics: {
          example: 'Same actions as immediate; this counter is reset for every episode.',
          decisions: ++decisions,
          baseline: proposal.diagnostics ?? null,
        },
      };
    };
  },
};
export default example;
