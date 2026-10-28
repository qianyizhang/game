import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createStudy, createStudyClip } from '../../../src/art3d/procedural/factory.ts';
import { disposeObject } from '../../../src/shared/three/resources.ts';
import type { StudyId } from '../../../src/art3d/catalogue.ts';

/** Authoring-only browser entry: CanvasTexture and FileReader use real browser APIs. */
export async function bakeStudy(id: StudyId) {
  const root = createStudy(id);
  try {
    const clip = createStudyClip(root, id);
    const bytes = (await new GLTFExporter().parseAsync(root, {
      binary: true,
      animations: [clip],
    })) as ArrayBuffer;
    const response = await fetch(`/__study_bake/${id}`, { method: 'POST', body: bytes });
    if (!response.ok) throw new Error(`Cannot save baked study ${id}`);
    return { seconds: clip.duration, tracks: clip.tracks.length };
  } finally {
    disposeObject(root);
  }
}
