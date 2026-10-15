import * as T from 'three';
import hunterUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/enemy-hunter.glb?url';
import archerUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/enemy-archer.glb?url';
import bruteUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/enemy-brute.glb?url';
import witchUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/enemy-witch.glb?url';
import { ENEMY_PATTERNS } from '../../../domain/encounter-content';
import type { Enemy, EnemyKind, StateView as State } from '../../../domain/types';
import { createSkeletalLibrary } from './skeletal';

type Kind = Exclude<EnemyKind, 'boss'>;
const urls: Record<Kind, string> = {
  hunter: hunterUrl,
  archer: archerUrl,
  brute: bruteUrl,
  witch: witchUrl,
};
const clips = ['idle', 'run', 'attack', 'stagger'] as const;
type Clip = (typeof clips)[number];
// The final part of the authored attack settles over 18 rules ticks. The rest
// of the rules cooldown permits locomotion; visual recovery never holds movement.
const settleTicks = 18;

export type EnemyModel = {
  sync(enemy: Enemy, state: State, reducedMotion: boolean): boolean;
};

/** Ordinary-enemy pose policy over the shared skeletal lifetime. */
export function createEnemies(invalidate: () => void) {
  const library = createSkeletalLibrary<Kind, Clip>(
    Object.entries(urls).map(([id, url]) => ({
      id: id as Kind,
      url,
      clips,
      validate: (asset) => id !== 'archer' || !!asset.scene.getObjectByName('Reed_arrow'),
    })),
    invalidate,
  );
  return {
    attach(parent: T.Group, kind: Kind): EnemyModel {
      const instance = library.attach(parent, kind);
      let arrow: T.Object3D | undefined;
      let identity = '',
        previousTick = -1,
        previousX = 0,
        previousY = 0,
        moving = false;
      return {
        sync(enemy, state, reducedMotion) {
          let released = false;
          const ready = instance.sync(enemy, () => {
            const key = `${state.seed}:${state.runNumber}:${state.region}:${state.chamber}:${enemy.id}`;
            const reset = identity !== key || state.tick < previousTick;
            if (reset || state.tick !== previousTick) {
              moving = !reset && Math.hypot(enemy.x - previousX, enemy.y - previousY) > 0.1;
              identity = key;
              previousTick = state.tick;
              previousX = enemy.x;
              previousY = enemy.y;
            }
            const pattern = ENEMY_PATTERNS[kind];
            let clip: Clip = moving ? 'run' : 'idle';
            let phase = reducedMotion ? 0 : (state.tick + enemy.id * 7) / 60;
            if (enemy.stagger > 0) {
              clip = 'stagger';
              phase = reducedMotion ? 0.4 : T.MathUtils.clamp(1 - enemy.stagger / 9, 0, 1);
            } else if (enemy.windup > 0) {
              clip = 'attack';
              phase = reducedMotion
                ? 0.36
                : 0.45 * T.MathUtils.clamp(1 - enemy.windup / pattern.windup, 0, 1);
            } else if (enemy.pattern > 0 && enemy.cooldown > pattern.recovery - settleTicks) {
              clip = 'attack';
              phase = reducedMotion
                ? 0.45
                : 0.45 +
                  0.55 * T.MathUtils.clamp((pattern.recovery - enemy.cooldown) / settleTicks, 0, 1);
            }
            released = clip === 'attack' && phase >= 0.45;
            return { clip, phase };
          });
          if (ready && kind === 'archer') {
            arrow ??= instance.root.getObjectByName('Reed_arrow');
            if (arrow) arrow.visible = !released;
          }
          return ready;
        },
      };
    },
    dispose() {
      library.dispose();
    },
  };
}
