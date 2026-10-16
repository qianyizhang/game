import type { PolicyFactory } from '../../src/shared/policy/types';
import type { Observation, PolicyCommand } from '../../packages/diablo2/src/agent/observation';
import { builtins } from '../../packages/diablo2/src/agent/policy';

/** Integration witness, deliberately exposed to danger; never a strength baseline. */
const exposure: PolicyFactory<Observation, PolicyCommand> = {
  id: 'exposure-witness',
  version: '1',
  create(config) {
    const explore = builtins.immediate.create(config);
    let movedAt = -1;
    return (input) => {
      const distance = (at: { x: number; y: number }) =>
        Math.hypot(at.x - input.player.x, at.y - input.player.y);
      const enemy = input.enemies
        .filter((value) => value.hp > 0 && !value.warded)
        .sort((a, b) => distance(a) - distance(b))[0];
      if (!enemy) return explore(input);
      const advance = input.actions.find(
        (command) => command.type === 'advance' && command.ticks === 50,
      );
      const approach = input.actions
        .filter((command) => command.type === 'move')
        .sort(
          (a, b) =>
            Math.hypot(a.target.x - enemy.x, a.target.y - enemy.y) -
            Math.hypot(b.target.x - enemy.x, b.target.y - enemy.y),
        )[0];
      const command =
        input.tick !== movedAt && distance(enemy) > 4 && approach ? approach : advance;
      if (!command) throw new Error('Exposure witness exhausted its native tick budget.');
      if (command.type === 'move') movedAt = input.tick;
      return {
        command,
        work: input.actions.length + input.enemies.length,
        diagnostics: { purpose: 'deliberate exposure, first-death integration only' },
      };
    };
  },
};
export default exposure;
