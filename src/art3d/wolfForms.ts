/** Authored alternate forms of one study; each evolved form owns a separate release. */
export const WOLF_FORMS = {
  base: {
    title: 'Greatwood Wolf',
    label: 'Base',
    deliveryStudyId: 'wolf',
    accent: '#c1bf9c',
    material: 'The original guardian · forest coat · branching antlers',
    description:
      'The original Greatwood guardian: a lifted listening muzzle, unequal antlers and a pale throat above the heavy brush tail.',
  },
  bloom: {
    title: 'Bloom Warden',
    label: 'Friendly',
    deliveryStudyId: 'wolf-bloom',
    accent: '#c4d6a0',
    material: 'Evolved guardian · leafy crown · soft woodland mantle',
    description:
      'An approachable forest protector. A leafy crown and generous layered ruff frame the familiar listening face.',
  },
  elder: {
    title: 'Elder Sentinel',
    label: 'Neutral',
    deliveryStudyId: 'wolf-elder',
    accent: '#d6c398',
    material: 'Evolved guardian · ancient crown · weathered mantle',
    description:
      'A watchful elder, neither tame nor hostile. A more imposing antler crown and weathered mantle give the guardian an older presence.',
  },
  thorn: {
    title: 'Thorn Tyrant',
    label: 'Evil',
    deliveryStudyId: 'wolf-thorn',
    accent: '#d29183',
    material: 'Evolved guardian · thorn crown · dark swept mane',
    description:
      'The forest guardian turned territorial. A threatening crown, swept mane and sharper facial details make its intent unmistakable.',
  },
} as const;

export type WolfForm = keyof typeof WOLF_FORMS;
export const EVOLVED_WOLF_FORMS = ['bloom', 'elder', 'thorn'] as const;

export function isWolfForm(value: string | null): value is WolfForm {
  return value !== null && Object.hasOwn(WOLF_FORMS, value);
}
