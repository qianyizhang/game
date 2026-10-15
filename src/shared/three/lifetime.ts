import * as T from 'three';
import { isMesh } from './objects';
import { disposeObject } from './resources';

/** Exclusive model ownership. Cloned instances must register only their private resources. */
export class AssetLifetime {
  private releases = new Set<() => void>();
  private disposed = false;

  get closed() {
    return this.disposed;
  }

  own(release: () => void): () => void {
    let released = false;
    const once = () => {
      if (released) return;
      released = true;
      this.releases.delete(once);
      try {
        release();
      } catch (error) {
        console.error('Asset resource cleanup failed', error);
      }
    };
    if (this.closed) once();
    else this.releases.add(once);
    return once;
  }

  /** Adopt immediately after loading, before validation or batch readiness. */
  adopt(root: T.Group) {
    if (this.closed) {
      disposeObject(root);
      return null;
    }
    const materials = new Map<T.Mesh, T.Material | T.Material[]>();
    root.traverse((object) => {
      if (isMesh(object)) materials.set(object, object.material);
    });
    const mixer = new T.AnimationMixer(root);
    this.own(() => materials.clear());
    this.own(() => {
      disposeObject(root, materials);
    });
    this.own(() => root.removeFromParent());
    this.own(() => mixer.uncacheRoot(root));
    this.own(() => mixer.stopAllAction());
    return { root, mixer, materials };
  }

  dispose() {
    if (this.closed) return;
    this.disposed = true;
    for (const release of [...this.releases].reverse()) release();
  }
}
