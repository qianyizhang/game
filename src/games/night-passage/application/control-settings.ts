export const CONTROL_VERSION = 'night-passage-control-1';
export type ControlPreset = 'light' | 'standard' | 'heavy';
export interface ControlConfig {
  observationTicks: number;
  reactionTicks: number;
  workPerTick: number;
  holdTicks: number;
  switchTicks: number;
  aimRadiansPerTick: number;
}
export const CONTROL_PRESETS: Record<ControlPreset, Readonly<ControlConfig>> = {
  light: {
    observationTicks: 0,
    reactionTicks: 0,
    workPerTick: 256,
    holdTicks: 1,
    switchTicks: 1,
    aimRadiansPerTick: Math.PI / 4,
  },
  standard: {
    observationTicks: 1,
    reactionTicks: 1,
    workPerTick: 64,
    holdTicks: 2,
    switchTicks: 1,
    aimRadiansPerTick: Math.PI / 6,
  },
  heavy: {
    observationTicks: 3,
    reactionTicks: 2,
    workPerTick: 32,
    holdTicks: 4,
    switchTicks: 2,
    aimRadiansPerTick: Math.PI / 10,
  },
};

export function controlConfig(
  preset: ControlPreset = 'standard',
  overrides: Partial<ControlConfig> = {},
): ControlConfig {
  const c = { ...CONTROL_PRESETS[preset], ...overrides };
  if (
    !CONTROL_PRESETS[preset] ||
    ![c.observationTicks, c.reactionTicks, c.holdTicks, c.switchTicks].every(
      (n) => Number.isInteger(n) && n >= 0 && n <= 60,
    ) ||
    !Number.isInteger(c.workPerTick) ||
    c.workPerTick < 1 ||
    c.workPerTick > 1024 ||
    !Number.isFinite(c.aimRadiansPerTick) ||
    c.aimRadiansPerTick <= 0 ||
    c.aimRadiansPerTick > Math.PI ||
    c.holdTicks < 1
  )
    throw new Error('Invalid control configuration.');
  return c;
}
