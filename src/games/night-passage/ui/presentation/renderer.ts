import type { Point, State } from '../../domain/types';

/** Presentation only: never advances rules, consumes rules RNG or mutates state. */
export interface Renderer {
  /** Draw confirmed state. The renderer owns viewport and pixel-density changes. */
  draw(state: State): void;
  /** Client coordinates to the combat plane; null when the surface is unavailable. */
  groundPoint(client: Point): Point | null;
  /** Screen-relative movement axes to the combat plane, preserving unit speed. */
  groundDirection(screen: Point): Point;
  /** Release owned resources. Repeated disposal is safe; later calls are inert. */
  dispose(): void;
}
