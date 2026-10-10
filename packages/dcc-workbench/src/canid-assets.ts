import { contacts as ashContacts } from '../assets/canid/ash.json';
import { contacts as russetContacts } from '../assets/canid/russet.json';
import { contacts as mossContacts } from '../assets/canid/moss.json';
import ashModel from '../assets/canid/ash.glb?url';
import russetModel from '../assets/canid/russet.glb?url';
import mossModel from '../assets/canid/moss.glb?url';
import ashSource from '../subjects/canid/ash/source.blend?url';
import russetSource from '../subjects/canid/russet/source.blend?url';
import mossSource from '../subjects/canid/moss/source.blend?url';
import motionSource from '../subjects/canid/motion.blend?url';

export { motionSource };
export const characters = [
  {
    id: 'ash',
    name: 'Ash',
    subtitle: 'Family proportions',
    model: ashModel,
    source: ashSource,
    travelSpeed: ashContacts.walk.travelSpeed,
  },
  {
    id: 'russet',
    name: 'Russet',
    subtitle: 'Same rig · new coat',
    model: russetModel,
    source: russetSource,
    travelSpeed: russetContacts.walk.travelSpeed,
  },
  {
    id: 'moss',
    name: 'Moss',
    subtitle: 'Shorter legs · broader body',
    model: mossModel,
    source: mossSource,
    travelSpeed: mossContacts.walk.travelSpeed,
  },
] as const;
export const clips = {
  idle: { name: 'Breathe', seconds: 4 },
  walk: { name: 'Walk', seconds: 2 },
  look: { name: 'Look around', seconds: 4 },
} as const;
export type Clip = keyof typeof clips;
export type Character = (typeof characters)[number]['id'];
export type CanidOptions = {
  clip: Clip;
  character: Character | 'all';
  playing: boolean;
  time: number;
  seek: number;
  surface: 'Clay' | 'Material';
  view: 'Portrait' | 'Side' | 'Front' | 'Rear';
  rig: boolean;
};
