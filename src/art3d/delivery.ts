import { assets } from 'virtual:card-workshop-dcc';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Group, type AnimationClip } from 'three';
import type { StudyId } from './catalogue';
import { disposeObject } from '../shared/three/resources';
import { WOLF_FORMS, type WolfForm } from './wolfForms';
import { bakedStudy } from './baked';

/** Only an explicit gallery review changes an existing study's default. */
export function galleryDelivery(id: StudyId, form: WolfForm = 'base') {
  const deliveryStudyId = id === 'wolf' ? WOLF_FORMS[form].deliveryStudyId : id;
  return Object.values(assets).find(
    (asset) =>
      asset.legacyStudyId === deliveryStudyId &&
      asset.info.kind === 'release' &&
      asset.info.reviewScope === 'gallery' &&
      asset.info.reviewDecision === 'accepted',
  );
}

export interface LoadedStudy {
  object: Group;
  clip?: AnimationClip;
  native: boolean;
  download: () => Promise<ArrayBuffer>;
}

/** Each load owns its scene resources. Callers dispose late arrivals after cancellation. */
export async function loadStudy(
  id: StudyId,
  signal: AbortSignal,
  form: WolfForm = 'base',
): Promise<LoadedStudy> {
  const delivery = galleryDelivery(id, form);
  if (delivery) {
    const response = await fetch(delivery.modelUrl, { signal });
    if (!response.ok) throw new Error(`Model download failed (${response.status})`);
    const bytes = await response.arrayBuffer();
    signal.throwIfAborted();
    const gltf = await new GLTFLoader().parseAsync(bytes, '');
    const clip = gltf.animations[0];
    if (
      gltf.animations.length !== delivery.info.stats.animations.length ||
      (delivery.brief.animation &&
        (!clip || Math.abs(clip.duration - delivery.brief.animation.seconds) > 0.001))
    ) {
      disposeObject(gltf.scene);
      throw new Error('Published model and motion contract disagree');
    }
    return {
      object: gltf.scene,
      clip,
      native: true,
      download: () => Promise.resolve(bytes.slice(0)),
    };
  }
  if (id === 'wolf' && form !== 'base') {
    throw new Error(`The ${WOLF_FORMS[form].title} release is unavailable.`);
  }
  const baked = bakedStudy(id);
  const response = await fetch(baked.url, { signal });
  if (!response.ok) throw new Error(`Baked model download failed (${response.status})`);
  const bytes = await response.arrayBuffer();
  signal.throwIfAborted();
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (value) =>
    value.toString(16).padStart(2, '0'),
  ).join('');
  if (bytes.byteLength !== baked.bytes || digest !== baked.sha256)
    throw new Error('Baked model fingerprint mismatch');
  signal.throwIfAborted();
  const gltf = await new GLTFLoader().parseAsync(bytes, '');
  const object = gltf.scene.children[0];
  const clip = gltf.animations[0];
  if (
    !object ||
    gltf.scene.children.length !== 1 ||
    object.name !== `Study_${id}` ||
    gltf.animations.length !== 1 ||
    !clip ||
    clip.tracks.length !== baked.tracks ||
    Math.abs(clip.duration - baked.seconds) > 0.001
  ) {
    disposeObject(gltf.scene);
    throw new Error('Baked model and motion contract disagree');
  }
  // The exporter adds a scene wrapper. Keep the authored root's direct children
  // so layer controls and animation bindings retain their original meaning.
  // glTF nodes do not preserve the Three.js Group class. Restore the authored
  // grouping without changing local transforms or the clip's named targets.
  const root = new Group().copy(object, false);
  for (const child of [...object.children]) root.add(child);
  return {
    object: root,
    clip,
    native: false,
    download: () => Promise.resolve(bytes.slice(0)),
  };
}
