import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import CanidAttackStage from '../../src/games/battlegrounds/ui/CanidAttackStage';
import type { CombatResult } from '../../src/games/battlegrounds/domain/types';
import { makeUnit } from '../../src/games/battlegrounds/domain/units';

const attacker = { ...makeUnit('stray', 'attacker'), attacksTaken: 0 };
const target = { ...makeUnit('cub', 'target'), attacksTaken: 0 };
const result: CombatResult = {
  winner: null,
  damage: [0, 0],
  boards: [[attacker], [target]],
  rng: 1,
  attacks: 2,
  stalemate: false,
  frames: [0, 1].map(() => ({
    text: 'Briar Stray attacks the Cub.',
    boards: [[attacker], [target]],
    attacker: attacker.id,
    target: target.id,
  })),
};
let root: Root | undefined;

// The production clock clamps indices; inject stale props at the component boundary
// to exercise recovery and Hook ordering that normal replay controls cannot reach.
export function renderAttackStage(index: number, empty: boolean) {
  const stageRoot = (root ??= createRoot(document.body.appendChild(document.createElement('div'))));
  flushSync(() => {
    stageRoot.render(
      createElement(CanidAttackStage, {
        result: empty ? { ...result, frames: [] } : result,
        index,
        progress: 0.5,
        inspect: true,
      }),
    );
  });
}
