import model from '../assets/boar/boar.glb?url';
import source from '../subjects/boar/boar/source.blend?url';
import motionSource from '../subjects/boar/motion.blend?url';
import metadata from '../assets/boar/boar.motions.json';
import { readMotions } from '../motion-contract';
import type { MotionStudy } from './canid-assets';

export const boarStudy: MotionStudy = {
  id: 'boar',
  radius: 1.9,
  targetHeight: 0.86,
  title: 'Bracken breaks the stillness',
  eyebrow: 'BRACKEN BOAR · FIVE PERFORMANCES',
  introduction: 'Gather weight. Follow the earth. Drive forward.',
  subjectHeading: 'Weight carried low.',
  description:
    'A low barrel, loaded shoulders and a long wedge snout. Real split hooves carry the heavy walk and woodland trot; rooting and a short charge reveal the fitted head, weight transfer and recovery.',
  characters: [
    {
      id: 'boar',
      name: 'Bracken',
      subtitle: 'Boar · woodland earth-mover',
      model,
      source,
      motions: readMotions(metadata),
    },
  ],
  motionSource,
};
