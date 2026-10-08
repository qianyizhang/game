import { assets } from 'virtual:card-workshop-dcc';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import type { AnimationClip, Group } from 'three';
import { createStudy, disposeObject, type StudyId } from './models';
import { createStudyClip } from './animation';

/** Only an explicit gallery review changes an existing study's default. */
export function galleryDelivery(id: StudyId) {
  return Object.values(assets).find(
    (asset) =>
      asset.legacyStudyId === id &&
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
export async function loadStudy(id: StudyId, signal: AbortSignal): Promise<LoadedStudy> {
  const delivery = galleryDelivery(id);
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
  signal.throwIfAborted();
  const object = createStudy(id);
  return {
    object,
    clip: createStudyClip(object, id),
    native: false,
    download: async () => {
      const clean = createStudy(id);
      try {
        return (await new GLTFExporter().parseAsync(clean, {
          binary: true,
          animations: [createStudyClip(clean, id)],
        })) as ArrayBuffer;
      } finally {
        disposeObject(clean);
      }
    },
  };
}
