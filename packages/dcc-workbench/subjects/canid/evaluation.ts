import { evaluate, type Criterion, type Observation } from '../../evaluation/index.ts';
import { measureMotions, motionRubrics } from '../../evaluation/motion.ts';
import { record } from '../../contracts.ts';

// These are explicit art-direction targets for this stylized family, not zoological norms.
const timing: Record<string, [number, number, string?, number?]> = {
  idle: [3, 4.5],
  walk: [0.7, 0.85],
  trot: [0.42, 0.56],
  run: [0.42, 0.56],
  look: [1.3, 1.9],
  lunge: [0.8, 1.1, 'contact', 0.36],
  bite: [0.6, 0.85, 'contact', 0.3],
  swipe: [0.7, 1, 'contact', 0.34],
  roll: [2.1, 2.7, 'back', 1.2],
  flee: [2.1, 2.7, 'run', 0.75],
};

export function canidCriteria(clip: string): Criterion[] {
  const target = timing[clip];
  if (!target) throw new Error(`No canid review profile: ${clip}`);
  const criteria: Criterion[] = [
    {
      id: 'cadence',
      title: 'Cadence appropriate to intent',
      dimension: 'timing',
      kind: 'metric',
      metric: 'duration',
      unit: 's',
      min: target[0],
      max: target[1],
      basis: 'art-direction',
      rationale: 'A deliberate per-motion timing range; quiet behavior should remain quiet.',
    },
  ];
  if (target[2])
    criteria.push({
      id: 'event-latency',
      title: 'Prompt main event',
      dimension: 'timing',
      kind: 'metric',
      metric: `marker:${target[2]}`,
      unit: 's',
      min: 0,
      max: target[3],
      basis: 'art-direction',
      rationale: 'Main action should arrive promptly after a readable preparation.',
    });
  if (['lunge', 'bite', 'swipe'].includes(clip))
    criteria.push({
      id: 'attack-drive',
      title: 'Decisive attack drive',
      dimension: 'timing',
      kind: 'metric',
      metric: 'attack-drive',
      unit: 's',
      min: 0.05,
      max: 0.18,
      basis: 'art-direction',
      rationale: 'Brief drive between anticipation and contact; review the actual gesture as well.',
    });
  for (const [metric, max] of Object.entries({
    'sole-height': 0.001,
    'sole-slip': 0.001,
    'floor-penetration': 0.002,
    'limb-reach-error': 0.002,
  }))
    criteria.push({
      id: metric,
      title: metric,
      dimension: 'mechanics',
      kind: 'metric',
      metric,
      unit: 'model units',
      min: 0,
      max,
      basis: 'technical',
      rationale: 'Existing delivery tolerance, not a perceptual quality score.',
    });
  if (clip === 'roll')
    criteria.push({
      id: 'rolling-support',
      title: 'Flank and back support',
      dimension: 'mechanics',
      kind: 'metric',
      metric: 'rolling-gap',
      unit: 'model units',
      min: 0,
      max: 0.04,
      basis: 'technical',
      rationale: 'The declared body region should support the roll at its contact phases.',
    });
  criteria.push(...motionRubrics);
  return criteria;
}

export function evaluateCanid(value: unknown, observations: Record<string, Observation[]> = {}) {
  const receipt = record(value);
  const measurements = measureMotions(receipt.clips, receipt.contacts);
  return {
    profile: 'canid-responsive-v1',
    character: receipt.character,
    modelSha256: receipt.modelSha256,
    motionSha256: receipt.motionSha256,
    motions: Object.fromEntries(
      Object.entries(measurements).map(([clip, metrics]) => [
        clip,
        {
          measurements: metrics,
          findings: evaluate(canidCriteria(clip), metrics, observations[clip]),
        },
      ]),
    ),
  };
}
