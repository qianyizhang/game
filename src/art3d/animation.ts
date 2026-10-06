import * as T from 'three';
import type { StudyId } from './models';
import { phoenixMotionTracks } from './phoenix';
import { nightjarMotionTracks } from './nightjar';

export const LOOP_SECONDS = 6;
export const MOTION_LABELS: Record<StudyId, string> = {
  nightjar: 'Living nightjar · listen, blink & settle',
  catalyst: 'Alchemy · rising gas bubbles',
  phoenix: 'Living firebird · stretch, settle & watch',
  hydra: 'Living hydra · watch, breathe & threaten',
  spiral: 'Display study · slow rigid oscillation',
  vajra: 'Display study · slow rigid oscillation',
};
/** One sampled, seamless clip drives both the live mixer and animated GLB. */
export function createStudyClip(root: T.Group, id: StudyId) {
  const times = Array.from({ length: 145 }, (_, i) => i / 24);
  if (id === 'phoenix')
    return new T.AnimationClip(
      'phoenix_idle',
      LOOP_SECONDS,
      phoenixMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'nightjar')
    return new T.AnimationClip(
      'nightjar_idle',
      LOOP_SECONDS,
      nightjarMotionTracks(root, times, LOOP_SECONDS),
    );
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((object) => {
    const motion = object.userData.motion as string | undefined;
    if (!motion) return;
    const home = object.position.clone(),
      restScale = object.scale.clone(),
      restRotation = object.quaternion.clone();
    const positions: number[] = [],
      scales: number[] = [],
      rotations: number[] = [];
    for (const time of times) {
      const a = (time / LOOP_SECONDS) * Math.PI * 2,
        p = home.clone(),
        scale = restScale.clone();
      const euler = new T.Euler();
      if (motion === 'display') euler.y = Math.sin(a) * 0.16;
      if (motion === 'hydraNeck') {
        const neck = object.userData.neck as number;
        const joint = object.userData.joint as number;
        const phase = neck * 2.15 - joint * 0.22;
        const weight = Math.sin(((joint - 1) / 8) * Math.PI) * 0.7 + 0.3;
        // The coil and first two joints stay rooted; movement travels up each neck.
        euler.z = Math.sin(a + phase) * 0.018 * weight;
        euler.x = Math.sin(a + phase - 0.8) * 0.016 * weight;
        euler.y = Math.sin(a + phase + 0.4) * 0.019 * weight;
      }
      if (motion === 'hydraHead') {
        const phase = (object.userData.neck as number) * 2.15;
        euler.y = Math.sin(a + phase) * 0.065;
        euler.x = Math.sin(a + phase - 0.7) * 0.025;
      }
      if (motion === 'hydraJaw') {
        const neck = object.userData.neck as number;
        const threat = (0.5 + 0.5 * Math.sin(a + neck * 2.15)) ** 3;
        euler.x = threat * (neck === 1 ? 0.18 : 0.065);
      }
      if (motion === 'bubble') {
        const phase = object.userData.phase as number;
        const f = ((time / LOOP_SECONDS) * 2 + phase) % 1;
        const [bottom, top] = object.userData.liquidRange as [number, number];
        p.y = bottom + f * (top - bottom);
        p.x += Math.sin(a * 2 + phase * Math.PI * 2) * 0.018;
        const visible = Math.min(1, f * 12, (1 - f) * 14);
        scale.multiplyScalar(Math.max(0.001, visible));
      }
      if (motion === 'ripple') {
        const f = ((time / LOOP_SECONDS) * 2) % 1;
        scale.x *= 0.1 + f * 1.5;
        scale.z *= 0.1 + f * 1.5;
        scale.y *= Math.max(0.001, Math.sin(f * Math.PI));
      }
      positions.push(...p.toArray());
      scales.push(...scale.toArray());
      rotations.push(
        ...restRotation.clone().multiply(new T.Quaternion().setFromEuler(euler)).toArray(),
      );
    }
    // Force exact endpoint equality, including wrapped bubble phases.
    positions.splice(positions.length - 3, 3, ...positions.slice(0, 3));
    scales.splice(scales.length - 3, 3, ...scales.slice(0, 3));
    rotations.splice(rotations.length - 4, 4, ...rotations.slice(0, 4));
    if (motion === 'bubble' || motion === 'ripple') {
      tracks.push(new T.VectorKeyframeTrack(`${object.name}.position`, times, positions));
      tracks.push(new T.VectorKeyframeTrack(`${object.name}.scale`, times, scales));
    } else
      tracks.push(new T.QuaternionKeyframeTrack(`${object.name}.quaternion`, times, rotations));
  });
  return new T.AnimationClip(
    `${id}_${id === 'catalyst' ? 'alchemy' : 'idle'}`,
    LOOP_SECONDS,
    tracks,
  );
}
