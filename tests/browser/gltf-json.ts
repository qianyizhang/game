import { isList, objectValue } from '../../src/shared/json';

function rows(value: unknown): Record<string, unknown>[] {
  if (!isList(value)) throw new Error('Expected GLTF array.');
  return value.map(objectValue);
}
function index(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    throw new Error('Expected nonnegative GLTF index/count.');
  return value;
}
function optionalIndex(value: unknown) {
  return value === undefined ? undefined : index(value);
}
function text(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Expected GLTF string.');
  return value;
}

/** Validate the exported JSON fields inspected by browser delivery assertions. */
export function gltfJson(json: string) {
  const data = objectValue(JSON.parse(json));
  return {
    meshes: rows(data.meshes).map((mesh) => ({
      primitives: rows(mesh.primitives).map((primitive) => ({
        attributes: Object.fromEntries(
          Object.entries(objectValue(primitive.attributes)).map(([key, value]) => [
            key,
            index(value),
          ]),
        ),
      })),
    })),
    accessors: rows(data.accessors).map((accessor) => ({
      count: index(accessor.count),
      bufferView: optionalIndex(accessor.bufferView),
      byteOffset: index(accessor.byteOffset ?? 0),
      componentType: index(accessor.componentType),
    })),
    animations: rows(data.animations).map((animation) => ({
      channels: rows(animation.channels).map((channel) => {
        const target = objectValue(channel.target);
        return { target: { node: index(target.node), path: text(target.path) } };
      }),
    })),
    nodes: rows(data.nodes).map((node) => ({
      name: node.name === undefined ? undefined : text(node.name),
      mesh: optionalIndex(node.mesh),
      skin: optionalIndex(node.skin),
    })),
    images: rows(data.images ?? []).map((image) => ({
      mimeType: image.mimeType === undefined ? undefined : text(image.mimeType),
      bufferView: optionalIndex(image.bufferView),
    })),
    textures: rows(data.textures ?? []).map((texture) => ({
      source: optionalIndex(texture.source),
    })),
    bufferViews: rows(data.bufferViews ?? []).map((view) => ({
      byteLength: index(view.byteLength),
      byteOffset: index(view.byteOffset ?? 0),
    })),
    materials: rows(data.materials ?? []).map((material) => {
      const pbr =
        material.pbrMetallicRoughness === undefined
          ? undefined
          : objectValue(material.pbrMetallicRoughness);
      const packed = pbr?.metallicRoughnessTexture;
      return {
        pbrMetallicRoughness:
          pbr === undefined
            ? undefined
            : {
                metallicRoughnessTexture:
                  packed === undefined ? undefined : { index: index(objectValue(packed).index) },
              },
      };
    }),
    skins: rows(data.skins ?? []).map((skin) => {
      if (!isList(skin.joints)) throw new Error('Expected GLTF skin joints.');
      return {
        joints: skin.joints.map(index),
        inverseBindMatrices: optionalIndex(skin.inverseBindMatrices),
      };
    }),
    extensionsUsed: data.extensionsUsed,
  };
}
