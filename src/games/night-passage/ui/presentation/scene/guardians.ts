import * as T from 'three';
import bellwardenUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/guardian-bellwarden.glb?url';
import undertowUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/guardian-undertow.glb?url';
import ashregentUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/guardian-ashregent.glb?url';
import sovereignUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/guardian-sovereign.glb?url';
import { GUARDIANS } from '../../../domain/encounter-content';
import type { Enemy, StateView as State } from '../../../domain/types';
import { createSkeletalLibrary } from './skeletal';

const profiles = [
  { id: 'bellwarden', region: 0, url: bellwardenUrl, attacks: ['sweep', 'rain', 'wheel'] },
  { id: 'undertow', region: 1, url: undertowUrl, attacks: ['charge', 'volley', 'pulse'] },
  { id: 'ashregent', region: 2, url: ashregentUrl, attacks: ['cross', 'rain', 'volley'] },
  { id: 'sovereign', region: 3, url: sovereignUrl, attacks: ['cross', 'rain', 'pulse', 'wheel'] },
] as const;
type Profile = (typeof profiles)[number];
type Kind = Profile['id'];
type Clip = Profile['attacks'][number] | 'idle' | 'run' | 'stagger';
const clips = (profile: Profile): readonly Clip[] => ['idle', 'run', ...profile.attacks, 'stagger'];
const contact = 0.45;
const settleTicks = 18;
type Pose = { clip: Clip; phase: number };
export type GuardianModel = { sync(enemy: Enemy, state: State, reducedMotion: boolean): boolean };

function poseSampler(profile: Profile) {
  let identity = '',
    tick = -1,
    x = 0,
    y = 0,
    moving = false;
  let windupPattern = -1,
    windupTotal = 0,
    recoveryPattern = -1,
    recoveryTotal = 0;
  return (enemy: Enemy, state: State, reducedMotion: boolean): Pose => {
    const key = `${state.seed}:${state.runNumber}:${state.region}:${state.chamber}:${enemy.id}`;
    const reset = identity !== key || state.tick < tick;
    if (reset) windupPattern = recoveryPattern = -1;
    if (reset || tick !== state.tick) {
      moving = !reset && Math.hypot(enemy.x - x, enemy.y - y) > 0.1;
      identity = key;
      tick = state.tick;
      x = enemy.x;
      y = enemy.y;
    }
    const enraged = enemy.hp < enemy.maxHp / 2;
    if (enemy.windup > 0) {
      const pattern = GUARDIANS[profile.region][enemy.pattern % profile.attacks.length];
      if (windupPattern !== enemy.pattern) {
        windupPattern = enemy.pattern;
        // Once observed, the windup retains its duration if health crosses half.
        // A first load mid-action after crossing half cannot recover the original
        // duration from this snapshot; its inferred pose may differ from continuous
        // observation. Remaining ticks bound the inference, and pattern advance
        // still marks the exact rules contact boundary.
        windupTotal = Math.max(
          enemy.windup,
          enraged ? Math.round(pattern.windup * 0.8) : pattern.windup,
        );
      }
    } else if (enemy.pattern > 0 && recoveryPattern !== enemy.pattern) {
      recoveryPattern = enemy.pattern;
      const previous = GUARDIANS[profile.region][(enemy.pattern - 1) % profile.attacks.length];
      // A later hit cannot retroactively shorten a cooldown already set by the rules.
      recoveryTotal =
        enemy.cooldown > Math.round(previous.recovery * 0.72)
          ? previous.recovery
          : enraged
            ? Math.round(previous.recovery * 0.72)
            : previous.recovery;
    }
    if (enemy.stagger > 0)
      return {
        clip: 'stagger',
        phase: reducedMotion ? 0.4 : T.MathUtils.clamp(1 - enemy.stagger / 9, 0, 1),
      };
    if (enemy.windup > 0)
      return {
        clip: profile.attacks[enemy.pattern % profile.attacks.length],
        phase: reducedMotion
          ? 0.36
          : contact * T.MathUtils.clamp(1 - enemy.windup / windupTotal, 0, 1),
      };
    if (enemy.pattern > 0 && enemy.cooldown > recoveryTotal - settleTicks)
      return {
        clip: profile.attacks[(enemy.pattern - 1) % profile.attacks.length],
        phase: reducedMotion
          ? contact
          : contact +
            (1 - contact) * T.MathUtils.clamp((recoveryTotal - enemy.cooldown) / settleTicks, 0, 1),
      };
    return {
      clip: moving ? 'run' : 'idle',
      phase: reducedMotion ? 0 : (state.tick + enemy.id * 7) / 60,
    };
  };
}

/** Regional pose inference and pooling stay separate from skeletal resource ownership. */
export function createGuardians(invalidate: () => void) {
  const library = createSkeletalLibrary<Kind, Clip>(
    profiles.map((profile) => ({
      id: profile.id,
      url: profile.url,
      clips: clips(profile),
    })),
    invalidate,
  );
  type Instance = {
    model: ReturnType<typeof library.attach>;
    sample: ReturnType<typeof poseSampler>;
  };
  const pools: Map<Kind, Instance>[] = [];
  let disposed = false;
  return {
    attach(parent: T.Group): GuardianModel {
      if (disposed) return { sync: () => false };
      const instances = new Map<Kind, Instance>();
      pools.push(instances);
      let active: Kind | null = null;
      return {
        sync(enemy, state, reducedMotion) {
          if (disposed) return false;
          for (const instance of instances.values()) instance.model.root.visible = false;
          const profile =
            enemy.kind === 'boss'
              ? profiles.find((entry) => entry.region === state.region)
              : undefined;
          if (!profile) {
            active = null;
            return false;
          }
          let instance = instances.get(profile.id);
          if (!instance) {
            instance = { model: library.attach(parent, profile.id), sample: poseSampler(profile) };
            instances.set(profile.id, instance);
          }
          if (active !== profile.id) instance.sample = poseSampler(profile);
          active = profile.id;
          return instance.model.sync(enemy, () => instance.sample(enemy, state, reducedMotion));
        },
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      library.dispose();
      for (const pool of pools) pool.clear();
      pools.length = 0;
    },
  };
}
