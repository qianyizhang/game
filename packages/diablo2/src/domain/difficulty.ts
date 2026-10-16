import type { Difficulty, State } from './types';

export const HEALTH_POTION_COOLDOWN = '@health-potion';
export interface DifficultyProfile {
  label: string;
  incomingDamage: number;
  /** Existing native duration units: one unit is 100 ms. */
  healthPotionRecovery: number;
}
export const DIFFICULTIES = {
  relaxed: { label: 'Relaxed', incomingDamage: 0.75, healthPotionRecovery: 0 },
  standard: { label: 'Standard', incomingDamage: 3, healthPotionRecovery: 200 },
  severe: { label: 'Severe', incomingDamage: 6, healthPotionRecovery: 600 },
} as const satisfies Record<Difficulty, DifficultyProfile>;
export const PREVIOUS_DIFFICULTIES = {
  relaxed: { label: 'Relaxed', incomingDamage: 0.75, healthPotionRecovery: 0 },
  standard: { label: 'Standard', incomingDamage: 1, healthPotionRecovery: 0 },
  severe: { label: 'Severe', incomingDamage: 1.3, healthPotionRecovery: 0 },
} as const satisfies Record<Difficulty, DifficultyProfile>;
/** Historical campaign and sandbox state keep their own arithmetic. */
export function difficultyProfile(
  state: Pick<State, 'rulesVersion' | 'difficulty' | 'sandbox'>,
): DifficultyProfile {
  if (!state.sandbox && state.rulesVersion === 'emberwake-4')
    return DIFFICULTIES[state.difficulty ?? 'standard'];
  if (!state.sandbox && state.rulesVersion === 'emberwake-3')
    return PREVIOUS_DIFFICULTIES[state.difficulty ?? 'standard'];
  return PREVIOUS_DIFFICULTIES.standard;
}
