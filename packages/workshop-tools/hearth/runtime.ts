import { withBundle } from '../io.ts';

export type HearthRuntime = typeof import('../../../src/engines/hearth-runtime');
export function withHearthRuntime<R>(use: (runtime: HearthRuntime) => Promise<R>) {
  return withBundle<HearthRuntime, R>('src/engines/hearth-runtime.ts', use);
}
