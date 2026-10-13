import type { Runtime } from './runtime.ts';

/** One connection owns one isolated chronicle. Time advances only on accepted frame commands. */
export function createProtocol(runtime: Runtime) {
  let agent = runtime.createAgent('a-light-in-the-dark');
  return (request: unknown): Record<string, unknown> => {
    const value =
      request && typeof request === 'object' && !Array.isArray(request)
        ? (request as Record<string, unknown>)
        : {};
    const id = typeof value.id === 'string' || typeof value.id === 'number' ? value.id : null;
    try {
      switch (value.op) {
        case 'reset':
          if (typeof value.seed !== 'string') throw new Error('reset requires a seed string.');
          agent = runtime.createAgent(value.seed);
          return { id, ok: true, observation: agent.observe() };
        case 'observe':
          return { id, ok: true, observation: agent.observe() };
        case 'step': {
          const result = agent.step(value.command);
          return { id, ok: result.accepted, ...result };
        }
        case 'suggest':
          return { id, ok: true, command: runtime.baselineCommand(agent.observe()) };
        case 'export':
          return { id, ok: true, replay: agent.exportReplay() };
        default:
          throw new Error('Unknown op. Use reset, observe, step, suggest or export.');
      }
    } catch (error) {
      return { id, ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  };
}
