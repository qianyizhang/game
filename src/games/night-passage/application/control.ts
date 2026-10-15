import { observeChronicle, type Observation } from './agent';
import { dispatch, exportChronicle, createChronicle, type Chronicle } from './chronicle';
import { validCommand } from '../domain/game';
import { angleDelta } from '../domain/geometry';
import type { RulesVersion } from '../domain/contracts';
import type { Input, Player } from '../domain/types';

import {
  controlConfig,
  CONTROL_VERSION,
  type ControlPreset,
  type ControlConfig,
} from './control-settings';
export { controlConfig, CONTROL_VERSION, CONTROL_PRESETS } from './control-settings';
export type { ControlPreset, ControlConfig } from './control-settings';

export type Sight = Omit<
  Observation,
  'version' | 'player' | 'room' | 'enemies' | 'projectiles' | 'threats'
> & {
  version: typeof CONTROL_VERSION;
  perception: {
    mode: typeof CONTROL_VERSION;
    observedTick: number;
    decisionTick: number;
    ageTicks: number;
    bootstrap: boolean;
  };
  player: Pick<
    Player,
    'x' | 'y' | 'hp' | 'maxHp' | 'aim' | 'weapon' | 'runes' | 'boons' | 'casts' | 'charge'
  > & { dashReady: boolean; protected: boolean; striking: boolean };
  room: Omit<Observation['room'], 'hazards'> & {
    hazards: {
      x: number;
      y: number;
      radius: number;
      kind: Observation['room']['hazards'][number]['kind'];
      warning: boolean;
      active: boolean;
    }[];
  };
  enemies: Omit<
    Observation['enemies'][number],
    'windup' | 'stagger' | 'burn' | 'chill' | 'exposed'
  >[];
  projectiles: {
    id: number;
    x: number;
    y: number;
    radius: number;
    hostile: boolean;
    velocity: null | { x: number; y: number };
  }[];
  threats: {
    enemyId: number;
    stage: 'early' | 'late';
    shapes: Observation['threats'][number]['shapes'];
    projectileAngles: number[];
  }[];
};
export interface ControlTrace {
  observedTick: number;
  decisionTick: number;
  deliveryTick: number | null;
  nextDecisionTick: number;
  workUnits: number;
  controlChanges: number;
  requestedDelayTicks: number;
  requestedHoldTicks: number;
}
export interface ControlMetrics {
  decisions: number;
  workUnits: number;
  delayTicks: number;
  holdTicks: number;
  controlChanges: number;
  cancelled: number;
}
const idle = (aim = -Math.PI / 2): Input => ({
  x: 0,
  y: 0,
  aim,
  attack: false,
  special: false,
  dash: false,
  cast: false,
  call: false,
});
const normalizeAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
function movement(value: Input): Input {
  const { x, y, aim, attack, special, dash, cast, call } = value;
  const input = { x, y, aim, attack, special, dash, cast, call };
  if (!input.x && !input.y) return { ...input };
  const a = (Math.round(Math.atan2(input.y, input.x) / (Math.PI / 4)) * Math.PI) / 4;
  return { ...input, x: Math.cos(a), y: Math.sin(a) };
}
const offense = (i: Input) =>
  i.call ? 'call' : i.cast ? 'cast' : i.special ? 'special' : i.attack ? 'attack' : 'none';
function changes(a: Input, b: Input): number {
  return (
    Number(Math.hypot(a.x - b.x, a.y - b.y) > 0.1) +
    Number(offense(a) !== offense(b)) +
    Number(b.dash && !a.dash)
  );
}

/** Evaluator owns this module; a policy receives only Sight. Actual inputs form the replay. */
export function createController(
  seed: string,
  options: { rules?: RulesVersion; preset?: ControlPreset; config?: Partial<ControlConfig> } = {},
) {
  const config = Object.freeze(controlConfig(options.preset, options.config));
  let chronicle: Chronicle = createChronicle(seed, options.rules, {
    version: CONTROL_VERSION,
    preset: options.preset ?? 'standard',
    config: { ...config },
  });
  let held = idle(),
    appliedAim = held.aim;
  // Retain immutable samples, including historical replay capacity; build views on demand.
  let history: Chronicle[] = [chronicle];
  let traces: ControlTrace[] = [];
  const metrics: ControlMetrics = {
    decisions: 0,
    workUnits: 0,
    delayTicks: 0,
    holdTicks: 0,
    controlChanges: 0,
    cancelled: 0,
  };
  const reset = () => {
    held = idle(chronicle.state.player.aim);
    appliedAim = held.aim;
    history = [chronicle];
  };
  function sight(): Sight {
    const latest = history[history.length - 1];
    const current = latest.state;
    const desired = current.tick - config.observationTicks;
    const selected =
      current.phase === 'combat'
        ? (history
            .slice()
            .reverse()
            .find((sample) => sample.state.tick <= desired) ?? history[0])
        : latest;
    const old = observeChronicle(selected);
    const previous = history
      .slice()
      .reverse()
      .find((sample) => sample.state.tick < old.tick)?.state;
    const p = old.player;
    // The exact observation is already detached; redaction never exposes retained state.
    return {
      ...old,
      version: CONTROL_VERSION,
      perception: {
        mode: CONTROL_VERSION,
        observedTick: old.tick,
        decisionTick: current.tick,
        ageTicks: current.tick - old.tick,
        bootstrap: current.phase === 'combat' && current.tick - old.tick < config.observationTicks,
      },
      player: {
        x: p.x,
        y: p.y,
        hp: p.hp,
        maxHp: p.maxHp,
        aim: p.aim,
        weapon: p.weapon,
        runes: p.runes,
        boons: p.boons,
        casts: p.casts,
        charge: p.charge,
        dashReady: p.dashCooldown === 0,
        protected: p.invulnerable > 0,
        striking: p.strike !== null,
      },
      room: {
        ...old.room,
        hazards: old.room.hazards.map((h) => ({
          x: h.x,
          y: h.y,
          radius: h.radius,
          kind: h.kind,
          warning: h.warning,
          active: h.active,
        })),
      },
      enemies: old.enemies.map((e) => ({
        id: e.id,
        kind: e.kind,
        x: e.x,
        y: e.y,
        hp: e.hp,
        maxHp: e.maxHp,
        radius: e.radius,
        aim: e.aim,
      })),
      projectiles: old.projectiles.map((shot) => {
        const prior = previous?.projectiles.find((s) => s.id === shot.id);
        const dt = previous ? old.tick - previous.tick : 0;
        return {
          id: shot.id,
          x: shot.x,
          y: shot.y,
          radius: shot.radius,
          hostile: shot.hostile,
          velocity:
            prior && dt > 0 ? { x: (shot.x - prior.x) / dt, y: (shot.y - prior.y) / dt } : null,
        };
      }),
      threats: old.threats.map((t) => ({
        enemyId: t.enemyId,
        stage: t.remainingWindupTicks < 35 ? ('late' as const) : ('early' as const),
        shapes: t.shapes,
        projectileAngles: t.projectileAngles,
      })),
    };
  }
  function advance(ticks: number, input: Input, limit: number): number {
    let used = 0;
    while (used < ticks && used < limit && chronicle.state.phase === 'combat') {
      appliedAim = normalizeAngle(
        appliedAim +
          Math.max(
            -config.aimRadiansPerTick,
            Math.min(config.aimRadiansPerTick, angleDelta(input.aim, appliedAim)),
          ),
      );
      const result = dispatch(chronicle, {
        type: 'frame',
        ticks: 1,
        input: { ...input, aim: appliedAim },
      });
      if (result.error) throw new Error(result.error);
      chronicle = result.chronicle;
      used++;
      history.push(chronicle);
      if (history.length > config.observationTicks + 3) history.shift();
    }
    return used;
  }
  return {
    config,
    observe: sight,
    step(command: unknown, workUnits = 0, maxTicks = Number.MAX_SAFE_INTEGER) {
      if (
        !validCommand(command) ||
        !Number.isSafeInteger(workUnits) ||
        workUnits < 0 ||
        !Number.isSafeInteger(maxTicks) ||
        maxTicks < 0
      )
        return {
          accepted: false,
          error: 'Malformed control action.',
          observation: sight(),
          trace: null,
        };
      if (command.type !== 'frame') {
        const result = dispatch(chronicle, command);
        if (!result.error) {
          chronicle = result.chronicle;
          reset();
        }
        return {
          accepted: result.error === null,
          error: result.error,
          observation: sight(),
          trace: null,
        };
      }
      if (chronicle.state.phase !== 'combat')
        return {
          accepted: false,
          error: 'Combat is not active.',
          observation: sight(),
          trace: null,
        };
      const observed = sight();
      const requested = movement(command.input);
      const count = changes(held, requested);
      const delay = config.reactionTicks + Math.ceil(workUnits / config.workPerTick);
      const hold =
        Math.max(config.holdTicks, command.ticks) + config.switchTicks * Math.min(count, 3);
      const decisionTick = chronicle.state.tick;
      const trace: ControlTrace = {
        observedTick: observed.tick,
        decisionTick,
        deliveryTick: null,
        nextDecisionTick: decisionTick,
        workUnits,
        controlChanges: count,
        requestedDelayTicks: delay,
        requestedHoldTicks: hold,
      };
      metrics.decisions++;
      metrics.workUnits += workUnits;
      metrics.controlChanges += count;
      let error: string | null = null;
      try {
        const waited = advance(delay, held, maxTicks);
        metrics.delayTicks += waited;
        if (waited === delay && chronicle.state.phase === 'combat' && waited < maxTicks) {
          held = requested;
          trace.deliveryTick = chronicle.state.tick;
          metrics.holdTicks += advance(hold, held, maxTicks - waited);
        } else metrics.cancelled++;
      } catch (cause) {
        error = cause instanceof Error ? cause.message : String(cause);
      }
      trace.nextDecisionTick = chronicle.state.tick;
      traces.push(trace);
      if (chronicle.state.phase !== 'combat') reset();
      return { accepted: error === null, error, observation: sight(), trace };
    },
    /** Result/export are evaluator capabilities, never passed to the policy. */
    result: () => observeChronicle(chronicle),
    metrics: () => structuredClone(metrics),
    trace: () => structuredClone(traces),
    exportReplay: () => exportChronicle(chronicle),
    clearTrace: () => {
      traces = [];
    },
  };
}
