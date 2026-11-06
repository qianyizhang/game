import { withBundle } from '../io.ts';

export type Runtime = typeof import('./runtime-entry');
export function withRuntime<R>(use: (runtime: Runtime) => Promise<R>) {
  return withBundle<Runtime, R>('packages/workshop-tools/hearth/runtime-entry.ts', use);
}
