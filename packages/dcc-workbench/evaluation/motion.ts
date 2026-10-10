import { readMotions } from '../motion-contract.ts';
import { record } from '../contracts.ts';
import type { Criterion, Measurement } from './index.ts';

/** Shared review questions; a subject profile may replace or extend these. */
export const motionRubrics: Criterion[] = [
  {
    id: 'readability',
    title: 'Pose readability',
    dimension: 'readability',
    kind: 'rubric',
    prompt: 'At display size, do the key poses convey intent in side and portrait views?',
    rationale: 'Review silhouettes and gesture independently of numerical timing.',
  },
  {
    id: 'pacing',
    title: 'Perceived pacing',
    dimension: 'timing',
    kind: 'rubric',
    prompt: 'At 1× speed, are preparation, main action and recovery distinct without dragging?',
    rationale: 'A duration target and phase stills do not establish perceived timing.',
  },
  {
    id: 'weight',
    title: 'Weight and coordination',
    dimension: 'plausibility',
    kind: 'rubric',
    prompt:
      'Does weight load before push-off, transfer through support and settle, with subordinate head/tail response?',
    rationale: 'Contact accuracy alone does not establish convincing mass or anatomy.',
  },
  {
    id: 'reference',
    title: 'Reference fidelity',
    dimension: 'reference-fidelity',
    kind: 'rubric',
    prompt:
      'Which named behavior/reference was compared, at what speed and phase, and what differs?',
    rationale:
      'Unassessed without a matched reference; plausible stylization is not species-accurate validation.',
  },
];

/** Adapter from saved motion contracts and optional native contact evidence. */
export function measureMotions(clips: unknown, nativeContacts: unknown = {}) {
  const contacts = record(nativeContacts);
  return Object.fromEntries(
    Object.entries(readMotions(clips)).map(([id, motion]) => {
      const metrics: Record<string, Measurement> = {};
      const add = (key: string, value: number, unit: string, coverage: string) => {
        if (Number.isFinite(value)) metrics[key] = { value, unit, coverage };
      };
      const timing =
        'Saved motion contract; marker timing expresses authored intent, not measured physical impact.';
      add('duration', motion.seconds, 's', timing);
      if (motion.playback === 'loop') add('cycle-frequency', 1 / motion.seconds, 'Hz', timing);
      for (const marker of motion.markers) add(`marker:${marker.name}`, marker.time, 's', timing);
      const anticipation = motion.markers.find((m) => m.name === 'anticipation');
      const contact = motion.markers.find((m) => m.name === 'contact');
      const recovery = motion.markers.find((m) => m.name === 'recovery');
      if (anticipation && contact)
        add('attack-drive', contact.time - anticipation.time, 's', timing);
      if (recovery) add('recovery-tail', motion.seconds - recovery.time, 's', timing);
      let distance = 0;
      for (let i = 1; i < motion.trajectory.length; i++) {
        const a = motion.trajectory[i - 1],
          b = motion.trajectory[i];
        distance += Math.hypot(b[1] - a[1], b[2] - a[2]);
      }
      add(
        'mean-travel-speed',
        distance / motion.seconds,
        'model units/s',
        'Polyline scene trajectory; no physical metre calibration.',
      );
      const evidence = contacts[id] === undefined ? {} : record(contacts[id]);
      for (const [field, key] of [
        ['maxSoleHeight', 'sole-height'],
        ['maxSoleFrameSlip', 'sole-slip'],
        ['maxRollingHeight', 'rolling-gap'],
        ['maxIkError', 'limb-reach-error'],
      ]) {
        if (typeof evidence[field] === 'number')
          add(
            key,
            evidence[field],
            'model units',
            'Native authored-frame audit over declared support intervals; slip is per frame.',
          );
      }
      if (typeof evidence.minBodyHeight === 'number')
        add(
          'floor-penetration',
          Math.max(0, -evidence.minBodyHeight),
          'model units',
          'All native mesh vertices at authored frames; no continuous collision or self-intersection proof.',
        );
      return [id, metrics];
    }),
  );
}
