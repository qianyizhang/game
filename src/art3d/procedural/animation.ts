import * as T from 'three';
import { LOOP_SECONDS, type StudyId } from '../catalogue';
import { phoenixMotionTracks } from './phoenix';
import { nightjarMotionTracks } from './nightjar';
import { prowlerMotionTracks } from './prowler';
import { wolfMotionTracks } from './wolf';
import { matriarchMotionTracks } from './matriarch';
import { thornstagMotionTracks } from './thornstag';
import { moonmothMotionTracks } from './moonmoth';
import { bogtoadMotionTracks } from './bogtoad';
import { crocoliskMotionTracks } from './crocolisk';
import { scavengerMotionTracks } from './scavenger';
import { guardianMotionTracks } from './guardian';
import { tortoiseMotionTracks } from './tortoise';
import { stormrocMotionTracks } from './stormroc';
import { strayMotionTracks } from './stray';
import { packcallerMotionTracks } from './packcaller';
import { cubMotionTracks } from './cub';
import { amalgamMotionTracks } from './amalgam';
import { impMotionTracks } from './imp';
import { matronMotionTracks } from './matron';
import { jugglerMotionTracks } from './juggler';
import { watcherMotionTracks } from './watcher';
import { heraldMotionTracks } from './herald';
import { patronMotionTracks } from './patron';
import { squireMotionTracks } from './squire';
import { bannerbearerMotionTracks } from './bannerbearer';

/** One sampled, seamless clip drives both the live mixer and animated GLB. */
export function createStudyClip(root: T.Group, id: StudyId) {
  const times = Array.from({ length: 145 }, (_, i) => i / 24);
  if (id === 'bannerbearer')
    return new T.AnimationClip(
      'bannerbearer_idle',
      LOOP_SECONDS,
      bannerbearerMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'squire')
    return new T.AnimationClip(
      'squire_idle',
      LOOP_SECONDS,
      squireMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'patron')
    return new T.AnimationClip(
      'patron_idle',
      LOOP_SECONDS,
      patronMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'herald')
    return new T.AnimationClip(
      'herald_idle',
      LOOP_SECONDS,
      heraldMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'watcher')
    return new T.AnimationClip(
      'watcher_idle',
      LOOP_SECONDS,
      watcherMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'juggler')
    return new T.AnimationClip(
      'juggler_idle',
      LOOP_SECONDS,
      jugglerMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'matron')
    return new T.AnimationClip(
      'matron_idle',
      LOOP_SECONDS,
      matronMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'imp')
    return new T.AnimationClip(
      'imp_idle',
      LOOP_SECONDS,
      impMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'amalgam')
    return new T.AnimationClip(
      'amalgam_idle',
      LOOP_SECONDS,
      amalgamMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'cub')
    return new T.AnimationClip(
      'cub_idle',
      LOOP_SECONDS,
      cubMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'packcaller')
    return new T.AnimationClip(
      'packcaller_idle',
      LOOP_SECONDS,
      packcallerMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'stray')
    return new T.AnimationClip(
      'stray_idle',
      LOOP_SECONDS,
      strayMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'stormroc')
    return new T.AnimationClip(
      'stormroc_idle',
      LOOP_SECONDS,
      stormrocMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'tortoise')
    return new T.AnimationClip(
      'tortoise_idle',
      LOOP_SECONDS,
      tortoiseMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'guardian')
    return new T.AnimationClip(
      'guardian_idle',
      LOOP_SECONDS,
      guardianMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'scavenger')
    return new T.AnimationClip(
      'scavenger_idle',
      LOOP_SECONDS,
      scavengerMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'crocolisk')
    return new T.AnimationClip(
      'crocolisk_idle',
      LOOP_SECONDS,
      crocoliskMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'bogtoad')
    return new T.AnimationClip(
      'bogtoad_idle',
      LOOP_SECONDS,
      bogtoadMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'moonmoth')
    return new T.AnimationClip(
      'moonmoth_idle',
      LOOP_SECONDS,
      moonmothMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'thornstag')
    return new T.AnimationClip(
      'thornstag_idle',
      LOOP_SECONDS,
      thornstagMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'matriarch')
    return new T.AnimationClip(
      'matriarch_idle',
      LOOP_SECONDS,
      matriarchMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'wolf')
    return new T.AnimationClip(
      'wolf_idle',
      LOOP_SECONDS,
      wolfMotionTracks(root, times, LOOP_SECONDS),
    );
  if (id === 'prowler')
    return new T.AnimationClip(
      'prowler_idle',
      LOOP_SECONDS,
      prowlerMotionTracks(root, times, LOOP_SECONDS),
    );
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
