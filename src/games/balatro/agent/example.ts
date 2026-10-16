import type { PolicyFactory } from '../../../shared/policy/types';
import type { Command } from '../domain/types';
import type { Observation } from './observation';
import { builtins } from './policy';

/** Extension example: a local module needs no registration or rules changes. */
const example: PolicyFactory<Observation, Command> = {
  id: 'example-counted-immediate',
  version: '1',
  create(config) {
    // Factory-local memory resets for each episode. Never put this at module scope.
    let decisions = 0;
    const choose = builtins.immediate.create(config);
    return (input) => {
      const proposal = choose(input);
      return {
        ...proposal,
        diagnostics: {
          example: 'Extension sample; same actions as the immediate baseline.',
          decisions: ++decisions,
          baseline: proposal.diagnostics ?? null,
        },
      };
    };
  },
};

export default example;
