import type { State } from './types';
export function hashSeed(seed: string): number {
  let value = 2166136261;
  for (const c of seed) value = Math.imul(value ^ c.charCodeAt(0), 16777619);
  return value >>> 0 || 1;
}
export function random(state: State): number {
  let x = state.rng;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  state.rng = x >>> 0;
  return state.rng / 4294967296;
}
export function choose<T>(state: State, values: T[]): T {
  return values[Math.floor(random(state) * values.length)];
}
export function note(state: State, message: string): void {
  state.log = [...state.log.slice(-7), message];
}
