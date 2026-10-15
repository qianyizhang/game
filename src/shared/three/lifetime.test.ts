import { expect, it, vi } from 'vitest';
import * as T from 'three';
import { AssetLifetime } from './lifetime';

function model() {
  const geometry = new T.BoxGeometry();
  const material = new T.MeshStandardMaterial({ map: new T.Texture() });
  const mesh = new T.Mesh<T.BufferGeometry, T.Material>(geometry, material);
  return { root: new T.Group().add(mesh), mesh, geometry, material };
}

it('releases animated roots once and preserves borrowed material overrides', () => {
  const lifetime = new AssetLifetime();
  const source = model();
  const parent = new T.Group().add(source.root);
  const owned = lifetime.adopt(source.root)!;
  const clip = new T.AnimationClip('idle', 1, []);
  owned.mixer.clipAction(clip).play();
  const borrowed = new T.MeshBasicMaterial();
  source.mesh.material = borrowed;
  const resources = [source.geometry, source.material, source.material.map!];
  const releases = resources.map((resource) => vi.spyOn(resource, 'dispose'));
  const borrowedRelease = vi.spyOn(borrowed, 'dispose');

  lifetime.dispose();
  lifetime.dispose();

  expect(parent.children).toEqual([]);
  expect(owned.mixer.existingAction(clip)).toBeNull();
  for (const release of releases) expect(release).toHaveBeenCalledTimes(1);
  expect(borrowedRelease).not.toHaveBeenCalled();
  borrowed.dispose();
});

it('releases acquired models without waiting for a pending batch and refuses late adoption', async () => {
  const lifetime = new AssetLifetime();
  const first = model();
  const late = model();
  const releases = [first.geometry, late.geometry].map((item) => vi.spyOn(item, 'dispose'));
  lifetime.adopt(first.root);
  let arrive!: (root: T.Group) => void;
  const pending = new Promise<T.Group>((resolve) => {
    arrive = resolve;
  });
  const loaded = pending.then((root) => lifetime.adopt(root));

  lifetime.dispose();
  expect(releases[0]).toHaveBeenCalledTimes(1);
  expect(releases[1]).not.toHaveBeenCalled();
  arrive(late.root);
  expect(await loaded).toBeNull();
  expect(releases[1]).toHaveBeenCalledTimes(1);
});

it('continues cleanup after failures, including individual resource failures', () => {
  const lifetime = new AssetLifetime();
  const source = model();
  const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
  const release = vi.fn();
  const geometry = vi.spyOn(source.geometry, 'dispose');
  const material = vi.spyOn(source.material, 'dispose').mockImplementation(() => {
    throw new Error('material');
  });
  lifetime.own(release);
  lifetime.adopt(source.root);
  lifetime.own(() => {
    throw new Error('helper');
  });
  try {
    lifetime.dispose();
    lifetime.dispose();
    expect(release).toHaveBeenCalledTimes(1);
    expect(geometry).toHaveBeenCalledTimes(1);
    expect(material).toHaveBeenCalledTimes(1);
    expect(logged).toHaveBeenCalledTimes(2);
  } finally {
    logged.mockRestore();
  }
});

it('releases model resources even when a detachment listener throws', () => {
  const lifetime = new AssetLifetime();
  const source = model();
  new T.Group().add(source.root);
  source.root.addEventListener('removed', () => {
    throw new Error('detachment');
  });
  lifetime.adopt(source.root);
  const release = vi.spyOn(source.geometry, 'dispose');
  const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    lifetime.dispose();
    expect(release).toHaveBeenCalledTimes(1);
    expect(logged).toHaveBeenCalledTimes(1);
  } finally {
    logged.mockRestore();
  }
});
