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

import ashMetadata from '../assets/canid/refined/ash.motions.json';
import { readMotions, type Motion } from '../motion-contract';
import russetMetadata from '../assets/canid/refined/russet.motions.json';
import mossMetadata from '../assets/canid/refined/moss.motions.json';
import ashModel from '../assets/canid/refined/ash.glb?url';
import russetModel from '../assets/canid/refined/russet.glb?url';
import mossModel from '../assets/canid/refined/moss.glb?url';
import ashSource from '../subjects/canid/refined/ash/source.blend?url';
import russetSource from '../subjects/canid/refined/russet/source.blend?url';
import mossSource from '../subjects/canid/refined/moss/source.blend?url';
import motionSource from '../subjects/canid/refined/motion.blend?url';

export type Character = 'ash' | 'russet' | 'moss';
export type Revision = 'refined' | 'baseline' | 'comparison';
export const clips = readMotions(ashMetadata);
export type Clip = string;
export const baselineClips = {
  idle: { name: 'Breathe', seconds: 4 },
  walk: { name: 'Walk', seconds: 2 },
  look: { name: 'Look around', seconds: 4 },
} as const;
export function durationFor(revision: Revision, clip: Clip) {
  const baseline: Record<string, { seconds: number }> = baselineClips;
  return revision === 'refined'
    ? clips[clip].seconds
    : (baseline[clip]?.seconds ?? clips[clip].seconds);
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
  motions: readMotions([ashMetadata, russetMetadata, mossMetadata][i]),
}));
export const baselineCharacters = labels.map((label, i) => ({
  ...label,
  model: [baselineAshModel, baselineRussetModel, baselineMossModel][i],
  source: [baselineAshSource, baselineRussetSource, baselineMossSource][i],
  motions: Object.fromEntries(
    Object.entries(baselineClips).map(([id, c]) => {
      const speed =
        id === 'walk'
          ? [baselineAshContacts, baselineRussetContacts, baselineMossContacts][i].walk.travelSpeed
          : 0;
      return [
        id,
        {
          ...c,
          playback: 'loop',
          trajectory: [
            [0, 0, 0, 0],
            [c.seconds, c.seconds * speed, 0, 0],
          ],
          contacts: [],
          markers: [],
        } satisfies Motion,
      ];
    }),
  ),
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
  movement: 'in-place' | 'travel';
};
