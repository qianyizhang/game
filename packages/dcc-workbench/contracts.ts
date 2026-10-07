/** Validate the delivery fields consumed by the pilot; this is not a general glTF schema. */
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected delivery object');
  return value as Record<string, unknown>;
}
function rows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) throw new Error('Expected delivery array');
  const items: unknown[] = value;
  return items.map(record);
}
function text(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Expected delivery string');
  return value;
}
function number(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error('Expected finite delivery number');
  return value;
}
function index(value: unknown): number {
  const result = number(value);
  if (!Number.isSafeInteger(result) || result < 0)
    throw new Error('Expected nonnegative delivery index/count');
  return result;
}
function optionalIndex(value: unknown) {
  return value === undefined ? undefined : index(value);
}
function numbers(value: unknown): number[] {
  if (!Array.isArray(value)) throw new Error('Expected numeric delivery array');
  const items: unknown[] = value;
  return items.map(number);
}
export function readBrief(json: string) {
  const value = record(JSON.parse(json)),
    animation = record(value.animation),
    budgets = record(value.budgets);
  return {
    id: text(value.id),
    animation: { seconds: number(animation.seconds) },
    budgets: {
      maxBytes: index(budgets.maxBytes),
      maxTriangles: index(budgets.maxTriangles),
      maxJoints: index(budgets.maxJoints),
    },
  };
}
export type Brief = ReturnType<typeof readBrief>;
/** The pilot compares 64 evaluated delivery vertices at these five fixed times. */
export function validateNativeMetadata(
  native: Record<string, unknown>,
  poses: Record<string, unknown>,
) {
  if (!text(native.blender) || !text(native.action)) throw new Error('Missing native identity');
  const audit = record(native.audit);
  if (
    JSON.stringify(numbers(audit.sampleFrames)) !== '[1,37,73,109,145]' ||
    index(audit.fixedVertices) === 0 ||
    number(audit.maxAnchorDrift) < 0 ||
    number(audit.maxAnchorDrift) > 1e-5 ||
    number(audit.maxLoopDifference) < 0 ||
    number(audit.maxLoopDifference) > 1e-5 ||
    number(audit.maxMidpointDeformation) < 0.005
  )
    throw new Error('Invalid native deformation audit');
  const samples = rows(poses.samples);
  if (poses.space !== 'glTF world, Y up' || samples.length !== 5)
    throw new Error('Incomplete native pose samples');
  samples.forEach((sample, i) => {
    if (
      number(sample.seconds) !== i * 1.5 ||
      !Array.isArray(sample.points) ||
      sample.points.length !== 64
    )
      throw new Error('Invalid native pose sampling');
    const points: unknown[] = sample.points;
    for (const point of points)
      if (numbers(point).length !== 3) throw new Error('Invalid native point');
  });
}
export function gltfJson(json: string) {
  const value = record(JSON.parse(json));
  return {
    accessors: rows(value.accessors).map((a) => ({
      bufferView: index(a.bufferView),
      byteOffset: optionalIndex(a.byteOffset),
      count: index(a.count),
      componentType: index(a.componentType),
      type: text(a.type),
      sparse: a.sparse !== undefined,
      max: a.max === undefined ? undefined : numbers(a.max),
    })),
    bufferViews: rows(value.bufferViews).map((v) => ({
      buffer: index(v.buffer),
      byteLength: index(v.byteLength),
      byteOffset: optionalIndex(v.byteOffset),
      byteStride: optionalIndex(v.byteStride),
    })),
    meshes: rows(value.meshes).map((m) => ({
      primitives: rows(m.primitives).map((p) => ({
        mode: optionalIndex(p.mode),
        indices: optionalIndex(p.indices),
        attributes: Object.fromEntries(
          Object.entries(record(p.attributes)).map(([key, value]) => [key, index(value)]),
        ),
      })),
    })),
    animations: rows(value.animations ?? []).map((a) => ({
      name: a.name === undefined ? undefined : text(a.name),
      samplers: rows(a.samplers).map((s) => ({ input: index(s.input), output: index(s.output) })),
      channels: rows(a.channels),
    })),
    skins: rows(value.skins ?? []).map((s) => ({ joints: numbers(s.joints) })),
    materials: rows(value.materials ?? []),
    textures: rows(value.textures ?? []),
    buffers: rows(value.buffers ?? []).map((b) => ({
      byteLength: index(b.byteLength),
      uri: b.uri === undefined ? undefined : text(b.uri),
    })),
    images: rows(value.images ?? []).map((i) => ({
      uri: i.uri === undefined ? undefined : text(i.uri),
    })),
  };
}
export type Gltf = ReturnType<typeof gltfJson>;
export function readManifest(json: string) {
  const value = record(JSON.parse(json));
  const sha256 = Object.fromEntries(
    Object.entries(record(value.sha256)).map(([path, digest]) => {
      if (
        !/^[a-f0-9]{64}$/.test(text(digest)) ||
        path.includes('\\') ||
        path.split('/').some((part) => !part || part === '..' || part === '.')
      )
        throw new Error('Invalid receipt path/hash');
      return [path, text(digest)];
    }),
  );
  return { sha256, stats: value.stats };
}
