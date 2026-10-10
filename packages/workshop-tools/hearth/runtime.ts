import { withBundle } from '../io.ts';

export type Runtime = typeof import('../../../src/engines/hearth/runtime');
export function withRuntime<R>(use: (runtime: Runtime) => Promise<R>) {
  return withBundle<Runtime, R>('src/engines/hearth/runtime.ts', use);
}
