import { gltfJson, type Brief, type Gltf } from './contracts.ts';
import type { DeliveryProfile } from './registry.ts';

export function readGlb(bytes: Buffer) {
  if (
    bytes.length < 20 ||
    bytes.readUInt32LE(0) !== 0x46546c67 ||
    bytes.readUInt32LE(4) !== 2 ||
    bytes.readUInt32LE(8) !== bytes.length
  )
    throw new Error('Invalid or truncated GLB');
  const jsonLength = bytes.readUInt32LE(12);
  if (
    20 + jsonLength + 8 > bytes.length ||
    bytes.readUInt32LE(24 + jsonLength) !== 0x004e4942 ||
    28 + jsonLength + bytes.readUInt32LE(20 + jsonLength) !== bytes.length
  )
    throw new Error('Invalid or truncated binary chunk');
  if (bytes.readUInt32LE(16) !== 0x4e4f534a) throw new Error('Missing GLB JSON chunk');
  return gltfJson(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
}
export function accessorValues(bytes: Buffer, gltf: Gltf, index: number) {
  const accessor = gltf.accessors[index];
  if (!accessor) throw new Error('Missing GLB accessor');
  const view = gltf.bufferViews[accessor.bufferView];
  if (!view || view.buffer !== 0) throw new Error('Missing or unsupported buffer view');
  const components = ({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 } as Record<string, number>)[
    accessor.type
  ];
  const readers: Record<number, [number, (offset: number) => number]> = {
    5126: [4, (offset) => bytes.readFloatLE(offset)],
    5125: [4, (offset) => bytes.readUInt32LE(offset)],
    5123: [2, (offset) => bytes.readUInt16LE(offset)],
    5121: [1, (offset) => bytes.readUInt8(offset)],
  };
  const [size, read] = readers[accessor.componentType] ?? [];
  if (!components || !size || accessor.sparse) throw new Error('Unsupported delivery accessor');
  const bin = 20 + bytes.readUInt32LE(12) + 8;
  const start = bin + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const stride = view.byteStride ?? components * size;
  if (stride < components * size || bin + (view.byteOffset ?? 0) + view.byteLength > bytes.length)
    throw new Error('Invalid buffer view bounds');
  if (
    start + (accessor.count - 1) * stride + components * size >
    bin + (view.byteOffset ?? 0) + view.byteLength
  )
    throw new Error('Accessor exceeds its buffer view');
  const values = [];
  for (let i = 0; i < accessor.count; i++) {
    for (let c = 0; c < components; c++) {
      const value = read(start + i * stride + c * size);
      if (!Number.isFinite(value)) throw new Error('Non-finite GLB accessor');
      values.push(value);
    }
  }
  return values;
}
export function inspectGlb(bytes: Buffer, brief: Brief, profile: DeliveryProfile = 'skinned') {
  if (profile === 'static' ? brief.animation !== undefined : brief.animation === undefined)
    throw new Error('Animation brief differs from delivery profile');
  const gltf = readGlb(bytes);
  const values = gltf.accessors.map((_, i) => accessorValues(bytes, gltf, i));
  let skinnedPrimitives = 0;
  for (const mesh of gltf.meshes ?? [])
    for (const primitive of mesh.primitives) {
      const position = gltf.accessors[primitive.attributes.POSITION];
      if (!position || position.type !== 'VEC3' || position.count < 3)
        throw new Error('Missing triangle positions');
      if (primitive.indices !== undefined) {
        const indices = values[primitive.indices];
        if (
          !indices?.length ||
          indices.some((i) => !Number.isInteger(i) || i < 0 || i >= position.count)
        )
          throw new Error('Invalid triangle indices');
      }
      const weights = values[primitive.attributes.WEIGHTS_0];
      if (profile !== 'skinned') {
        if (weights || primitive.attributes.JOINTS_0 !== undefined)
          throw new Error('Unexpected skin for delivery profile');
        continue;
      }
      // A skinned subject can carry rigid eyes, teeth, horns and other attachments.
      if (!weights && primitive.attributes.JOINTS_0 === undefined) continue;
      const indices = values[primitive.attributes.JOINTS_0];
      if (
        !weights ||
        !indices ||
        weights.length !== position.count * 4 ||
        indices.length !== weights.length
      )
        throw new Error('Incomplete skin weights/joints for primitive');
      if (
        indices.some(
          (i) =>
            !Number.isSafeInteger(i) ||
            i < 0 ||
            i >= Math.max(0, ...gltf.skins.map((skin) => skin.joints.length)),
        )
      )
        throw new Error('Skin joint index exceeds the delivered rig');
      skinnedPrimitives++;
      for (let i = 0; i < weights.length; i += 4) {
        if (
          weights.slice(i, i + 4).some((w) => w < 0) ||
          Math.abs(weights.slice(i, i + 4).reduce((a, b) => a + b, 0) - 1) > 1e-4
        )
          throw new Error('GLB skin weights are not normalized');
      }
    }
  for (const animation of gltf.animations ?? [])
    for (const sampler of animation.samplers) {
      const times = values[sampler.input];
      if (
        !times?.length ||
        Math.abs(times[0]) > 1e-6 ||
        Math.abs(times.at(-1)! - (brief.animation?.seconds ?? 0)) > 1e-5
      )
        throw new Error('Animation duration differs from the brief');
      if (times.some((time, i) => i > 0 && time <= times[i - 1]))
        throw new Error('Animation sample times must increase');
      const output = values[sampler.output];
      if (!output?.length) throw new Error('Missing animation output');
      const n = ({ VEC3: 3, VEC4: 4 } as Record<string, number>)[
        gltf.accessors[sampler.output].type
      ];
      if (!n) throw new Error('Unsupported animation accessor');
      const error = Math.max(
        ...output.slice(0, n).map((v, i) => Math.abs(v - output[output.length - n + i])),
      );
      const opposite =
        n === 4 &&
        Math.max(...output.slice(0, n).map((v, i) => Math.abs(v + output[output.length - n + i]))) <
          1e-5;
      if (error > 1e-5 && !opposite) throw new Error('Animation loop endpoints differ');
    }
  const triangles = (gltf.meshes ?? []).reduce(
    (sum, mesh) =>
      sum +
      mesh.primitives.reduce((n, p) => {
        if (p.mode !== undefined && p.mode !== 4)
          throw new Error('Only triangle meshes are supported');
        return n + gltf.accessors[p.indices ?? p.attributes.POSITION].count / 3;
      }, 0),
    0,
  );
  const animations = (gltf.animations ?? []).map((animation) => ({
    name: animation.name,
    seconds: Math.max(
      ...animation.samplers.map((s) => gltf.accessors[s.input].max?.[0] ?? Number.NaN),
    ),
    channels: animation.channels.length,
  }));
  const joints = Math.max(0, ...(gltf.skins ?? []).map((skin) => skin.joints.length));
  if (!Number.isSafeInteger(triangles) || !triangles) throw new Error('Expected triangle geometry');
  if (profile === 'skinned' && (!joints || !skinnedPrimitives))
    throw new Error('Expected a rigged animated mesh');
  if (profile !== 'skinned' && joints) throw new Error('Unexpected skin for delivery profile');
  if (profile === 'static' ? animations.length !== 0 : animations.length !== 1)
    throw new Error('Animation count differs from delivery profile');
  if (
    animations.some(
      (a) =>
        !Number.isFinite(a.seconds) || Math.abs(a.seconds - (brief.animation?.seconds ?? 0)) > 0.05,
    )
  )
    throw new Error('Animation duration differs from the brief');
  if (
    bytes.length > brief.budgets.maxBytes ||
    triangles > brief.budgets.maxTriangles ||
    joints > brief.budgets.maxJoints
  )
    throw new Error('Asset exceeds the brief budget');
  if ((gltf.buffers ?? []).some((b) => b.uri) || (gltf.images ?? []).some((i) => i.uri))
    throw new Error('Delivery must embed all buffers and images');
  return {
    bytes: bytes.length,
    triangles,
    meshes: gltf.meshes.length,
    materials: gltf.materials?.length ?? 0,
    textures: gltf.textures?.length ?? 0,
    joints,
    animations,
  };
}
