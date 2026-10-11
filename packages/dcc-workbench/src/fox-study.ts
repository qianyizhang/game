import model from '../assets/fox/fox.glb?url';
import source from '../subjects/fox/fox/source.blend?url';
import motionSource from '../subjects/fox/motion.blend?url';
import metadata from '../assets/fox/fox.motions.json';
import { readMotions } from '../motion-contract';
import type { MotionStudy } from './canid-assets';

export const foxStudy: MotionStudy = {
  id: 'fox',
  radius: 1.75,
  targetHeight: 0.9,
  title: 'Copper in the quiet',
  eyebrow: 'COPPER FOX · FIVE PERFORMANCES',
  introduction: 'Listen. Follow a scent. Slip through the undergrowth.',
  description:
    'A narrow wedge face, large listening ears, light forequarters and a full ivory-tipped brush. Pause the quiet walk, light trot, listening turn or ground scent to inspect weight and silhouette.',
  characters: [
    {
      id: 'fox',
      name: 'Copper',
      subtitle: 'Fox · attentive woodland scout',
      model,
      source,
      motions: readMotions(metadata),
    },
  ],
  motionSource,
};
