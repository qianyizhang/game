export const RULES_VERSION = 'night-passage-5';
export const CONTENT_VERSION = 'night-passage-content-4';
export type RulesVersion = 'night-passage-4' | typeof RULES_VERSION;
export type Difficulty = 'standard' | 'veteran' | 'ordeal';
export const DIFFICULTIES: readonly Difficulty[] = ['standard', 'veteran', 'ordeal'];
export const contentVersion = (rules: RulesVersion): string =>
  rules === 'night-passage-4' ? 'night-passage-content-3' : CONTENT_VERSION;
export const supportedContract = (rules: unknown, content: unknown): rules is RulesVersion =>
  (rules === 'night-passage-4' || rules === RULES_VERSION) && content === contentVersion(rules);

/** Standard is frozen rules-4 combat. Higher tiers change pressure, not player controls. */
export const DIFFICULTY = {
  standard: { speed: 1, damage: 1, recovery: 1, healing: 1, flank: 0 },
  veteran: { speed: 1.25, damage: 1.3, recovery: 0.9, healing: 0.8, flank: 35 },
  ordeal: { speed: 1.45, damage: 1.65, recovery: 0.8, healing: 0.65, flank: 55 },
} as const;
