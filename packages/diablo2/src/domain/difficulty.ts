import type { Difficulty, State } from './types';
import { RULES_VERSION, RULES_V6, RULES_V5, RULES_V4, RULES_V3 } from './versions';

export const HEALTH_POTION_COOLDOWN = '@health-potion';
export interface DifficultyProfile {
  label: string;
  incomingDamage: number;
  /** Player-only per-hit ceiling after mitigation and rounding; minimum damage remains one. */
  maxHitFraction: number | null;
  /** Existing native duration units: one unit is 100 ms. */
  healthPotionRecovery: number;
}
export const V4_DIFFICULTIES = {
  relaxed: {
    label: 'Relaxed',
    incomingDamage: 0.75,
    maxHitFraction: null,
    healthPotionRecovery: 0,
  },
  standard: {
    label: 'Standard',
    incomingDamage: 3,
    maxHitFraction: null,
    healthPotionRecovery: 200,
  },
  severe: { label: 'Severe', incomingDamage: 6, maxHitFraction: null, healthPotionRecovery: 600 },
} as const satisfies Record<Difficulty, DifficultyProfile>;
export const V5_DIFFICULTIES = {
  ...V4_DIFFICULTIES,
  standard: { ...V4_DIFFICULTIES.standard, incomingDamage: 8, maxHitFraction: 0.55 },
  severe: { ...V4_DIFFICULTIES.severe, incomingDamage: 12, maxHitFraction: 0.7 },
} as const satisfies Record<Difficulty, DifficultyProfile>;
export const V6_DIFFICULTIES = {
  ...V5_DIFFICULTIES,
  standard: { ...V5_DIFFICULTIES.standard, incomingDamage: 5 },
} as const satisfies Record<Difficulty, DifficultyProfile>;
// Version7 changes only Standard incoming damage; historical profiles remain fixed.
export const DIFFICULTIES = {
  ...V6_DIFFICULTIES,
  standard: { ...V6_DIFFICULTIES.standard, incomingDamage: 7 },
} as const satisfies Record<Difficulty, DifficultyProfile>;
export const V3_DIFFICULTIES = {
  relaxed: {
    label: 'Relaxed',
    incomingDamage: 0.75,
    maxHitFraction: null,
    healthPotionRecovery: 0,
  },
  standard: { label: 'Standard', incomingDamage: 1, maxHitFraction: null, healthPotionRecovery: 0 },
  severe: { label: 'Severe', incomingDamage: 1.3, maxHitFraction: null, healthPotionRecovery: 0 },
} as const satisfies Record<Difficulty, DifficultyProfile>;
/** Historical campaign and sandbox state keep their own arithmetic. */
export function difficultyProfile(
  state: Pick<State, 'rulesVersion' | 'difficulty' | 'sandbox'>,
): DifficultyProfile {
  if (!state.sandbox && state.rulesVersion === RULES_VERSION)
    return DIFFICULTIES[state.difficulty ?? 'standard'];
  if (!state.sandbox && state.rulesVersion === RULES_V6)
    return V6_DIFFICULTIES[state.difficulty ?? 'standard'];
  if (!state.sandbox && state.rulesVersion === RULES_V5)
    return V5_DIFFICULTIES[state.difficulty ?? 'standard'];
  if (!state.sandbox && state.rulesVersion === RULES_V4)
    return V4_DIFFICULTIES[state.difficulty ?? 'standard'];
  if (!state.sandbox && state.rulesVersion === RULES_V3)
    return V3_DIFFICULTIES[state.difficulty ?? 'standard'];
  return V3_DIFFICULTIES.standard;
}

/** Authoritative player receipt. Allies retain their separate uncapped arithmetic. */
export function playerHitDamage(
  state: Pick<State, 'rulesVersion' | 'difficulty' | 'sandbox'>,
  damage: number,
  mitigation: number,
  maxHp: number,
): number {
  const profile = difficultyProfile(state);
  const adjusted = Math.max(1, Math.round(damage * (1 - mitigation) * profile.incomingDamage));
  return profile.maxHitFraction === null
    ? adjusted
    : Math.min(adjusted, Math.max(1, Math.floor(maxHp * profile.maxHitFraction)));
}
