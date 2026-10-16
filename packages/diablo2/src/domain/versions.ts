export const RULES_VERSION = 'emberwake-7';
export const RULES_V6 = 'emberwake-6';
export const RULES_V5 = 'emberwake-5';
export const RULES_V4 = 'emberwake-4';
export const RULES_V3 = 'emberwake-3';
export const RULES_V2 = 'emberwake-2';
export type CampaignRulesVersion =
  | typeof RULES_VERSION
  | typeof RULES_V6
  | typeof RULES_V5
  | typeof RULES_V4
  | typeof RULES_V3
  | typeof RULES_V2;
export function isCampaignVersion(version: unknown): version is CampaignRulesVersion {
  return (
    version === RULES_VERSION ||
    version === RULES_V6 ||
    version === RULES_V5 ||
    version === RULES_V4 ||
    version === RULES_V3 ||
    version === RULES_V2
  );
}
/** v4 introduced ally scaling, health recovery and the public LOS8 portal veto. */
export function usesPressureRules(version: string): boolean {
  return (
    version === RULES_VERSION ||
    version === RULES_V6 ||
    version === RULES_V5 ||
    version === RULES_V4
  );
}
