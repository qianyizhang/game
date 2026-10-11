import model from '../assets/otter/otter.glb?url';
import source from '../subjects/otter/otter/source.blend?url';
import motionSource from '../subjects/otter/motion.blend?url';
import metadata from '../assets/otter/otter.motions.json';
import { readMotions } from '../motion-contract';
import type { MotionStudy } from './canid-assets';

export const otterStudy: MotionStudy = {
  id: 'otter',
  radius: 2.7,
  targetHeight: 0.55,
  title: 'Alder follows the riverbank',
  eyebrow: 'ALDER RIVER OTTER · FIVE PERFORMANCES',
  introduction: 'A scent. A spring. A moment to wash.',
  subjectHeading: 'Long back. Quiet paws. Restless whiskers.',
  description:
    'A long low chestnut body flows into a muscular tapered tail. Small rounded ears, a broad silvery muzzle and five-toed webbed paws carry a curious river otter through walking, bounding, scenting and cheek washing.',
  characters: [
    {
      id: 'otter',
      name: 'Alder',
      subtitle: 'River otter · curious on the bank',
      model,
      source,
      motions: readMotions(metadata),
    },
  ],
  motionSource,
};
