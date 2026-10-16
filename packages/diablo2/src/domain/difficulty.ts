import type { Difficulty } from './types';
export const DIFFICULTIES = {
  relaxed: { label: 'Relaxed', incomingDamage: 0.75 },
  standard: { label: 'Standard', incomingDamage: 1 },
  severe: { label: 'Severe', incomingDamage: 1.3 },
} as const satisfies Record<Difficulty, { label: string; incomingDamage: number }>;
