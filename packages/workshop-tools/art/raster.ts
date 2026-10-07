/** The subset of the optional Sharp adapter used by the review command. */
export interface Overlay {
  input: Buffer;
  left: number;
  top: number;
}
interface Raster {
  ensureAlpha(): Raster;
  raw(): Raster;
  resize(width: number, height: number): Raster;
  png(): Raster;
  composite(overlays: Overlay[]): Raster;
  toBuffer(): Promise<Buffer>;
  toBuffer(options: { resolveWithObject: true }): Promise<{
    data: Buffer;
    info: { width: number; height: number };
  }>;
  toFile(path: string): Promise<unknown>;
}
export interface Rasterizer {
  (
    input:
      | string
      | Buffer
      | { create: { width: number; height: number; channels: 4; background: string } },
    options?: { density: number },
  ): Raster;
  versions: Record<string, string>;
}
export function rasterizer(value: unknown): Rasterizer {
  if (
    typeof value !== 'function' ||
    !('versions' in value) ||
    !value.versions ||
    typeof value.versions !== 'object'
  )
    throw new Error('Expected a Sharp-compatible rasterizer with renderer versions.');
  return value as Rasterizer;
}
