import type { PolicyFactory } from '../../../../src/shared/policy/types';
import type { Observation, PolicyCommand } from './observation';
import { builtins } from './policy';

/** A local extension adds its own resettable memory without touching game rules. */
const example: PolicyFactory<Observation, PolicyCommand> = {
  id: 'example-counted-immediate',
  version: '6',
  create(config) {
    let decisions = 0;
    const choose = builtins.immediate.create(config);
    return (input) => {
      const proposal = choose(input);
      return {
        ...proposal,
        diagnostics: {
          example: 'Immediate actions with an episode-local counter.',
          decisions: ++decisions,
          baseline: proposal.diagnostics ?? null,
        },
      };
    };
  },
};
export default example;
