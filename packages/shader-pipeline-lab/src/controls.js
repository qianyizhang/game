// This is the single owner of which parameters can affect each stage's output.
// A later stage inherits earlier transformations, but never later-stage effects.
// Order the current stage's own experiment before upstream scene adjustments.
export const stageControlIds = [
  [],
  ['angle', 'tilt', 'distance'],
  ['near', 'angle', 'tilt', 'distance'],
  ['angle', 'tilt', 'distance', 'near'],
  ['correct', 'angle', 'tilt', 'distance', 'near'],
  ['texture', 'lighting', 'light', 'correct', 'angle', 'tilt', 'distance', 'near'],
  ['depth', 'angle', 'tilt', 'distance', 'near'],
  ['texture', 'lighting', 'light', 'depth', 'correct', 'angle', 'tilt', 'distance', 'near'],
];
export const controlDefinitions = [
  {
    id: 'angle',
    label: 'Rotation',
    type: 'range',
    min: -180,
    max: 180,
    step: 1,
    unit: '°',
  },
  {
    id: 'tilt',
    label: 'Tilt',
    type: 'range',
    min: -75,
    max: 75,
    step: 1,
    unit: '°',
  },
  {
    id: 'distance',
    label: 'Camera distance',
    type: 'range',
    min: 2.5,
    max: 8,
    step: 0.1,
  },
  {
    id: 'near',
    label: 'Near plane',
    type: 'range',
    min: 0.2,
    max: 7,
    step: 0.1,
  },
  { id: 'correct', label: 'Perspective correction', type: 'checkbox' },
  { id: 'texture', label: 'Checker texture', type: 'checkbox' },
  { id: 'lighting', label: 'Diffuse lighting', type: 'checkbox' },
  {
    id: 'light',
    label: 'Light direction',
    type: 'range',
    min: -180,
    max: 180,
    step: 1,
    unit: '°',
  },
  { id: 'depth', label: 'Depth test', type: 'checkbox' },
];

export function controlState(definition, stage, settings) {
  const visible = stageControlIds[stage].includes(definition.id);
  let reason = '';
  if (definition.id === 'light' && !settings.lighting) reason = 'Enable diffuse lighting';
  if (definition.id === 'correct' && stage !== 4 && !settings.texture)
    reason = 'Enable checker texture';
  return { visible, disabled: !visible || Boolean(reason), reason };
}
