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
    animation = value.animation === undefined ? undefined : record(value.animation),
    budgets = record(value.budgets);
  if (value.schemaVersion !== 1 || !text(value.id)) throw new Error('Invalid asset brief identity');
  if (animation && number(animation.seconds) <= 0) throw new Error('Invalid animation duration');
  return {
    id: text(value.id),
    animation: animation ? { seconds: number(animation.seconds) } : undefined,
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

export interface SavedExportIdentity {
  id: string;
  source: string;
  sourceSha256: string;
  profile: 'skinned' | 'rigid';
  animation: { name: string; seconds: number; fps: number };
}

/** Saved-subject evidence covers every named delivery mesh, including rigid attachments. */
export function validateSavedExportMetadata(
  native: Record<string, unknown>,
  poses: Record<string, unknown>,
  expected: SavedExportIdentity,
) {
  const animation = record(native.animation);
  if (
    native.schemaVersion !== 1 ||
    native.kind !== 'saved-export' ||
    native.id !== expected.id ||
    native.source !== expected.source ||
    native.sourceSha256 !== expected.sourceSha256 ||
    !/^[a-f0-9]{64}$/.test(expected.sourceSha256) ||
    native.sourceUnchangedByExport !== true ||
    native.profile !== expected.profile ||
    !text(native.blender) ||
    !text(native.collection) ||
    animation.name !== expected.animation.name ||
    animation.seconds !== expected.animation.seconds ||
    animation.fps !== expected.animation.fps ||
    poses.schemaVersion !== 1 ||
    poses.id !== expected.id ||
    poses.space !== 'glTF world, Y up'
  )
    throw new Error('Saved export identity differs from registered source/animation');
  const audit = record(native.audit);
  const objects = rows(poses.objects).map((object) => {
    const name = text(object.name),
      vertexCount = index(object.vertexCount),
      sampleCount = index(object.sampleCount);
    if (
      !name ||
      !vertexCount ||
      sampleCount !== Math.min(16, vertexCount) ||
      (object.role !== 'skinned' && object.role !== 'rigid')
    )
      throw new Error('Invalid saved export object contract');
    return { name, role: object.role, vertexCount, sampleCount };
  });
  if (!objects.length || new Set(objects.map((object) => object.name)).size !== objects.length)
    throw new Error('Missing or duplicate saved export objects');
  const frames = numbers(audit.sampleFrames);
  if (
    frames.length !== 5 ||
    frames[0] < 0 ||
    frames.some(
      (frame, i) =>
        frame !== frames[0] + (i * expected.animation.seconds * expected.animation.fps) / 4,
    )
  )
    throw new Error('Invalid saved export frame sampling');
  const skinned = objects.filter((object) => object.role === 'skinned').length;
  if (
    index(audit.meshCount) !== objects.length ||
    index(audit.skinnedMeshCount) !== skinned ||
    index(audit.rigidMeshCount) !== objects.length - skinned ||
    (expected.profile === 'skinned' ? skinned === 0 : skinned !== 0) ||
    typeof audit.requireRigidMotion !== 'boolean' ||
    (expected.profile === 'rigid' && !audit.requireRigidMotion) ||
    audit.motionTolerance !== 1e-6 ||
    audit.loopTolerance !== 1e-5
  )
    throw new Error('Invalid saved export mesh/motion audit');
  const objectAudits = rows(audit.objects);
  if (objectAudits.length !== objects.length)
    throw new Error('Incomplete saved export object audit');
  const motions = objectAudits.map((entry, i) => {
    const motion = number(entry.maxMotion),
      loop = number(entry.maxLoopDifference);
    if (
      entry.name !== objects[i].name ||
      entry.role !== objects[i].role ||
      motion < 0 ||
      loop < 0 ||
      loop > 1e-5 ||
      loop > motion
    )
      throw new Error('Invalid saved export object motion/loop');
    return { motion, loop, role: objects[i].role };
  });
  const maxSkinned = Math.max(
    0,
    ...motions.filter((entry) => entry.role === 'skinned').map((entry) => entry.motion),
  );
  const maxRigid = Math.max(
    0,
    ...motions.filter((entry) => entry.role === 'rigid').map((entry) => entry.motion),
  );
  if (
    number(audit.maxSkinnedMotion) !== maxSkinned ||
    number(audit.maxSourceDeliveryDifference) < 0 ||
    number(audit.maxSourceDeliveryDifference) > 1e-5 ||
    number(audit.maxRigidMotion) !== maxRigid ||
    number(audit.maxLoopDifference) !== Math.max(...motions.map((entry) => entry.loop)) ||
    (skinned > 0 && maxSkinned <= 1e-6) ||
    (audit.requireRigidMotion && maxRigid <= 1e-6)
  )
    throw new Error('Saved export lacks required evaluated motion or has inconsistent totals');
  const samples = rows(poses.samples);
  if (samples.length !== 5) throw new Error('Incomplete saved export pose samples');
  samples.forEach((sample, i) => {
    const sampleObjects = rows(sample.objects);
    if (
      number(sample.seconds) !== (i * expected.animation.seconds) / 4 ||
      sampleObjects.length !== objects.length
    )
      throw new Error('Invalid saved export pose sampling');
    sampleObjects.forEach((sampleObject, objectIndex) => {
      const definition = objects[objectIndex];
      if (
        sampleObject.name !== definition.name ||
        !Array.isArray(sampleObject.points) ||
        sampleObject.points.length !== definition.sampleCount
      )
        throw new Error('Saved export pose object membership differs');
      const points: unknown[] = sampleObject.points;
      for (const point of points)
        if (numbers(point).length !== 3) throw new Error('Invalid saved export point');
    });
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
  if (value.schemaVersion !== 1) throw new Error('Unsupported legacy receipt schema');
  const sha256 = Object.fromEntries(
    Object.entries(record(value.sha256)).map(([path, digest]) => {
      if (
        !/^[a-f0-9]{64}$/.test(text(digest)) ||
        path.includes('\\') ||
        path.includes(':') ||
        /[\u0000-\u001f]/.test(path) ||
        path.split('/').some((part) => !part || part === '..' || part === '.')
      )
        throw new Error('Invalid receipt path/hash');
      return [path, text(digest)];
    }),
  );
  const id = text(value.id),
    source = text(value.source),
    asset = text(value.asset);
  if (!id || !sha256[source] || !sha256[asset])
    throw new Error('Missing receipt identity or source/model pin');
  const previousReceipt =
    value.previousReceipt === undefined ? undefined : text(value.previousReceipt);
  if (previousReceipt && !sha256[previousReceipt]) throw new Error('Missing preceding receipt pin');
  return {
    schemaVersion: 1 as const,
    id,
    source,
    asset,
    previousReceipt,
    sha256,
    stats: value.stats,
  };
}
