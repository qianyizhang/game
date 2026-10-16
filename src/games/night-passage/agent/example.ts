/** A local CLI extension: fresh memory and the same deterministic work/latency contract. */
import type { PolicyPlayer } from './rollout';
import { createPolicy } from './policy';

const example: PolicyPlayer = {
  id: 'example-balanced',
  version: 'example-balanced-1',
  create(config) {
    const decide = createPolicy('balanced', config);
    return (sight) => decide(sight);
  },
};
export default example;
