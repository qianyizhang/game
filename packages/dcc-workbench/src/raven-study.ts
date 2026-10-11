import model from '../assets/raven/raven.glb?url';
import source from '../subjects/raven/raven/source.blend?url';
import motionSource from '../subjects/raven/motion.blend?url';
import metadata from '../assets/raven/raven.motions.json';
import { readMotions } from '../motion-contract';
import type { MotionStudy } from './canid-assets';

export const ravenStudy: MotionStudy = {
  id: 'raven',
  radius: 2.35,
  targetHeight: 1.0,
  title: 'Corven watches the clearing',
  eyebrow: 'CORVEN RAVEN · FIVE PERFORMANCES',
  introduction: 'Watch. Listen. Unfold the dark.',
  subjectHeading: 'Wings held in reserve.',
  description:
    'A heavy wedge bill, quiet breast and long tapered tail. Two planted bird feet carry deliberate steps; shoulder, elbow and wrist unfold overlapping flight vanes, then settle them against the body.',
  characters: [
    {
      id: 'raven',
      name: 'Corven',
      subtitle: 'Raven · watchful woodland sentinel',
      model,
      source,
      motions: readMotions(metadata),
    },
  ],
  motionSource,
};
