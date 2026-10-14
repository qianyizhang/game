import type { Runtime } from './runtime.ts';
import type { ControlPreset } from '../../../src/games/night-passage/application/control';
import type { Policy } from '../../../src/games/night-passage/agent/policy';

/** Cooperative research protocol; constrained responses never return exact observations. */
export function createProtocol(runtime: Runtime) {
  let exact = runtime.createAgent('a-light-in-the-dark');
  let controlled: ReturnType<Runtime['createController']> | null = null;
  let policy: Policy = 'balanced';
  let decide = runtime.createPolicy(policy);
  return (request: unknown): Record<string, unknown> => {
    const value =
      request && typeof request === 'object' && !Array.isArray(request)
        ? (request as Record<string, unknown>)
        : {};
    const id = typeof value.id === 'string' || typeof value.id === 'number' ? value.id : null;
    try {
      switch (value.op) {
        case 'reset': {
          if (typeof value.seed !== 'string') throw new Error('reset requires a seed string.');
          const control = value.control ?? 'exact';
          if (
            typeof control !== 'string' ||
            !['exact', 'light', 'standard', 'heavy'].includes(control)
          )
            throw new Error('Unknown control preset.');
          if (value.policy !== undefined && !runtime.POLICIES.includes(value.policy as Policy))
            throw new Error('Unknown policy.');
          const nextPolicy = (value.policy as Policy) ?? 'balanced';
          const rules = value.rules === undefined ? 'night-passage-5' : value.rules;
          if (rules !== 'night-passage-4' && rules !== 'night-passage-5')
            throw new Error('Unknown rules version.');
          if (control === 'exact') {
            exact = runtime.createAgent(value.seed, rules);
            controlled = null;
          } else
            controlled = runtime.createController(value.seed, {
              rules,
              preset: control as ControlPreset,
            });
          policy = nextPolicy;
          decide = runtime.createPolicy(policy);
          return { id, ok: true, observation: controlled ? controlled.observe() : exact.observe() };
        }
        case 'observe':
          return { id, ok: true, observation: controlled ? controlled.observe() : exact.observe() };
        case 'step': {
          const result = controlled
            ? controlled.step(
                value.command,
                typeof value.workUnits === 'number' ? value.workUnits : 0,
              )
            : exact.step(value.command);
          return { id, ok: result.accepted, ...result };
        }
        case 'suggest': {
          if (controlled)
            return { id, ok: true, ...runtime.createPolicy(policy)(controlled.observe()) };
          return { id, ok: true, command: runtime.baselineCommand(exact.observe()) };
        }
        case 'act': {
          if (!controlled) throw new Error('act requires a constrained control preset.');
          const decision = decide(controlled.observe());
          const result = controlled.step(decision.command, decision.work.total);
          return { id, ok: result.accepted, work: decision.work, ...result };
        }
        case 'export': {
          if (controlled && !['won', 'lost'].includes(controlled.observe().phase))
            throw new Error('Constrained export is available only after the passage ends.');
          return {
            id,
            ok: true,
            replay: controlled ? controlled.exportReplay() : exact.exportReplay(),
          };
        }
        default:
          throw new Error('Unknown op. Use reset, observe, step, suggest, act or export.');
      }
    } catch (error) {
      return { id, ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  };
}
