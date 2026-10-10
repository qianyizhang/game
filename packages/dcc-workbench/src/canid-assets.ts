import { contacts as baselineAshContacts } from '../assets/canid/ash.json';
import { contacts as baselineRussetContacts } from '../assets/canid/russet.json';
import { contacts as baselineMossContacts } from '../assets/canid/moss.json';
import baselineAshModel from '../assets/canid/ash.glb?url';
import baselineRussetModel from '../assets/canid/russet.glb?url';
import baselineMossModel from '../assets/canid/moss.glb?url';
import baselineAshSource from '../subjects/canid/ash/source.blend?url';
import baselineRussetSource from '../subjects/canid/russet/source.blend?url';
import baselineMossSource from '../subjects/canid/moss/source.blend?url';
import baselineMotionSource from '../subjects/canid/motion.blend?url';

import { contacts as ashContacts } from '../assets/canid/refined/ash.json';
import { contacts as russetContacts } from '../assets/canid/refined/russet.json';
import { contacts as mossContacts } from '../assets/canid/refined/moss.json';
import ashModel from '../assets/canid/refined/ash.glb?url';
import russetModel from '../assets/canid/refined/russet.glb?url';
import mossModel from '../assets/canid/refined/moss.glb?url';
import ashSource from '../subjects/canid/refined/ash/source.blend?url';
import russetSource from '../subjects/canid/refined/russet/source.blend?url';
import mossSource from '../subjects/canid/refined/moss/source.blend?url';
import motionSource from '../subjects/canid/refined/motion.blend?url';

export type Character = 'ash' | 'russet' | 'moss';
export type Revision = 'refined' | 'baseline' | 'comparison';
export const clips = {
  idle: { name: 'Alert idle', seconds: 4 },
  walk: { name: 'Brisk walk', seconds: 0.9 },
  trot: { name: 'Trot', seconds: 0.6 },
  look: { name: 'Planted look', seconds: 2.5 },
} as const;
export type Clip = keyof typeof clips;
export const baselineClips = {
  idle: { name: 'Breathe', seconds: 4 },
  walk: { name: 'Walk', seconds: 2 },
  look: { name: 'Look around', seconds: 4 },
} as const;
export function durationFor(revision: Revision, clip: Clip) {
  return revision === 'refined' || clip === 'trot'
    ? clips[clip].seconds
    : baselineClips[clip].seconds;
}
const labels = [
  { id: 'ash', name: 'Ash', subtitle: 'Family proportions' },
  { id: 'russet', name: 'Russet', subtitle: 'Same rig · new coat' },
  { id: 'moss', name: 'Moss', subtitle: 'Shorter legs · broader body' },
] as const;
export const characters = labels.map((label, i) => ({
  ...label,
  model: [ashModel, russetModel, mossModel][i],
  source: [ashSource, russetSource, mossSource][i],
  travelSpeed: Object.fromEntries(
    Object.entries([ashContacts, russetContacts, mossContacts][i]).map(([clip, c]) => [
      clip,
      c.travelSpeed,
    ]),
  ) as Record<Clip, number>,
}));
export const baselineCharacters = labels.map((label, i) => ({
  ...label,
  model: [baselineAshModel, baselineRussetModel, baselineMossModel][i],
  source: [baselineAshSource, baselineRussetSource, baselineMossSource][i],
  travelSpeed: {
    idle: 0,
    look: 0,
    trot: 0,
    walk: [baselineAshContacts, baselineRussetContacts, baselineMossContacts][i].walk.travelSpeed,
  },
}));
export const motionSources = { baseline: baselineMotionSource, refined: motionSource };
export type CanidOptions = {
  revision: Revision;
  clip: Clip;
  character: Character | 'all';
  playing: boolean;
  time: number;
  seek: number;
  surface: 'Clay' | 'Material';
  view: 'Portrait' | 'Side' | 'Front' | 'Rear';
  rig: boolean;
};
