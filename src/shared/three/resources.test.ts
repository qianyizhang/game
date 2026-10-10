import { expect, it, vi } from 'vitest';
import * as T from 'three';
import { disposeObject } from './resources';

it('releases shared asset resources once while a viewer owns material overrides', () => {
  const texture = new T.Texture();
  const original = new T.MeshStandardMaterial({ map: texture, normalMap: texture });
  const detail = new T.MeshStandardMaterial({ map: texture });
  const override = new T.MeshBasicMaterial({ wireframe: true });
  const geometry = new T.BoxGeometry();
  const skeleton = new T.Skeleton([new T.Bone()]);
  const first = new T.SkinnedMesh(geometry, override);
  const second = new T.SkinnedMesh(geometry, override);
  first.skeleton = second.skeleton = skeleton;
  const root = new T.Group().add(first, second);
  const originals = new Map<T.Mesh, T.Material | T.Material[]>([
    [first, [original, detail]],
    [second, original],
  ]);
  const releases = [geometry, original, detail, texture, skeleton].map((resource) =>
    vi.spyOn(resource, 'dispose'),
  );
  const overrideRelease = vi.spyOn(override, 'dispose');

  disposeObject(root, originals);

  for (const release of releases) expect(release).toHaveBeenCalledTimes(1);
  expect(overrideRelease).not.toHaveBeenCalled();
  override.dispose();
});

it('releases assigned materials when no override originals are supplied', () => {
  const texture = new T.Texture();
  const material = new T.MeshStandardMaterial({ map: texture });
  const geometry = new T.BoxGeometry();
  const releases = [geometry, material, texture].map((resource) => vi.spyOn(resource, 'dispose'));
  disposeObject(new T.Group().add(new T.Mesh(geometry, material), new T.Mesh(geometry, material)));
  for (const release of releases) expect(release).toHaveBeenCalledTimes(1);
});
