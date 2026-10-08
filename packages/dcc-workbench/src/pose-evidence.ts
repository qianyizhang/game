/** Pose evidence is loaded only by review tools, never embedded in the gallery module. */
import { record } from '../contracts';
import type {
  PublishedAsset,
  PublishedPoseSamples,
  PublishedSavedPoseSamples,
} from './delivery-types';
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Invalid pose text');
  return value;
}
function number(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid pose number');
  return value;
}
function count(value: unknown): number {
  const result = number(value);
  if (!Number.isSafeInteger(result) || result < 0) throw new Error('Invalid pose count');
  return result;
}
function rows(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('Invalid pose array');
  return value as unknown[];
}
export function parsePoseEvidence(json: string): PublishedPoseSamples | PublishedSavedPoseSamples {
  const raw = record(JSON.parse(json));
  if (raw.space !== 'glTF world, Y up') throw new Error('Unsupported published pose space');
  const points = (value: unknown): [number, number, number][] =>
    rows(value).map((value) => {
      const point = rows(value);
      if (point.length !== 3) throw new Error('Invalid published pose point');
      return [number(point[0]), number(point[1]), number(point[2])];
    });
  if (raw.objects !== undefined) {
    if (raw.schemaVersion !== 1) throw new Error('Unsupported named pose schema');
    return {
      schemaVersion: 1,
      id: text(raw.id),
      space: raw.space,
      objects: rows(raw.objects).map((value) => {
        const object = record(value);
        if (object.role !== 'skinned' && object.role !== 'rigid')
          throw new Error('Invalid pose role');
        return {
          name: text(object.name),
          role: object.role,
          vertexCount: count(object.vertexCount),
        };
      }),
      samples: rows(raw.samples).map((value) => {
        const sample = record(value);
        return {
          seconds: number(sample.seconds),
          objects: rows(sample.objects).map((value) => {
            const object = record(value);
            return { name: text(object.name), points: points(object.points) };
          }),
        };
      }),
    };
  }
  return {
    space: raw.space,
    samples: rows(raw.samples).map((value) => {
      const sample = record(value);
      return {
        seconds: number(sample.seconds),
        points: points(sample.points),
      };
    }),
  };
}

export async function loadPoseEvidence(asset: PublishedAsset) {
  if (!asset.posesUrl) throw new Error(`No native pose evidence: ${asset.id}`);
  const response = await fetch(asset.posesUrl);
  if (!response.ok) throw new Error(`Could not load native pose evidence: ${asset.id}`);
  const samples = parsePoseEvidence(await response.text());
  if ('id' in samples && samples.id !== asset.id)
    throw new Error('Pose evidence identity mismatch');
  return samples;
}
