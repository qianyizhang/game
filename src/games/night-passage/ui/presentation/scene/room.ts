import * as T from 'three';
import { disposeObject } from '../../../../../shared/three/resources';
import { ARENA, REGIONS } from '../../../domain/content';
import type { State } from '../../../domain/types';

/** Replaceable architectural blockout. Pillar footprints come only from the rules. */
export function createRoom(parent: T.Group) {
  const group = new T.Group();
  parent.add(group);
  let identity = '';
  let pillars: { group: T.Group; material: T.MeshStandardMaterial }[] = [];
  const ray = new T.Raycaster();
  const direction = new T.Vector3();
  const target = new T.Vector3();
  function rebuild(state: State) {
    disposeObject(group);
    group.clear();
    pillars = [];
    const region = REGIONS[state.region];
    const stone = new T.MeshStandardMaterial({ color: region.floor, roughness: 0.95 });
    const edge = new T.MeshStandardMaterial({ color: '#293e43', roughness: 0.82 });
    const accent = new T.MeshStandardMaterial({
      color: region.color,
      roughness: 0.6,
      metalness: 0.25,
    });
    const boxGeometry = new T.BoxGeometry(1, 1, 1);
    const box = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      material: T.Material,
    ) => {
      const mesh = new T.Mesh(boxGeometry, material);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, d);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      group.add(mesh);
      return mesh;
    };
    box(480, -22, 300, ARENA.width, 36, ARENA.height, edge);
    box(480, -2, 300, 892, 4, 532, stone).castShadow = false;
    // Wide, quiet slabs keep threat silhouettes legible; no cosmetic geometry enters collision.
    const joint = new T.MeshStandardMaterial({ color: '#162b2d', roughness: 1 });
    for (let x = 110; x < 900; x += 112) box(x, 0.1, 300, 1, 0.2, 532, joint);
    for (let z = 100; z < 560; z += 92) box(480, 0.1, z, 892, 0.2, 1, joint);
    for (const z of [25, 575]) box(480, 2, z, 920, 4, 10, accent);
    for (const x of [25, 935]) box(x, 2, 300, 10, 4, 550, accent);
    // Far-side buttresses frame the stage while the foreground remains cut away.
    for (const x of [55, 250, 710, 905]) box(x, 24, 16, 40, 48, 32, edge);
    for (const p of state.room.pillars) {
      const column = new T.Group();
      column.position.set(p.x, 0, p.y);
      const material = new T.MeshStandardMaterial({
        color: '#6c807a',
        roughness: 0.78,
        transparent: true,
      });
      for (const [bottom, height, radius] of [
        [0, 8, p.radius],
        [8, 64, p.radius * 0.72],
        [72, 9, p.radius],
      ]) {
        const mesh = new T.Mesh(new T.CylinderGeometry(radius, radius, height, 8), material);
        mesh.position.y = bottom + height / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        column.add(mesh);
      }
      group.add(column);
      pillars.push({ group: column, material });
    }
    const flame = new T.MeshBasicMaterial({ color: '#ffda9a' });
    const flameGeometry = new T.OctahedronGeometry(6);
    for (const x of [55, 905])
      for (const z of [90, 510]) {
        box(x, 17, z, 13, 34, 13, edge);
        const light = new T.Mesh(flameGeometry, flame);
        light.position.set(x, 39, z);
        group.add(light);
      }
  }
  return {
    sync(state: State, camera: T.Camera) {
      const key = JSON.stringify([state.region, state.room.pillars]);
      if (key !== identity) {
        identity = key;
        rebuild(state);
      }
      group.updateMatrixWorld(true);
      camera.getWorldDirection(direction);
      for (const pillar of pillars) {
        // Orthographic view rays have a shared direction. Fade only obstructing scenery.
        const hidden =
          state.enemies.some((enemy) => enemy.windup > 0) ||
          [state.player, ...state.enemies].some((actor) => {
            target.set(actor.x, 20, actor.y);
            ray.ray.origin.copy(target).addScaledVector(direction, -2000);
            ray.ray.direction.copy(direction);
            ray.far = 1995;
            return ray.intersectObject(pillar.group, true).length > 0;
          });
        pillar.material.opacity = hidden ? 0.22 : 1;
        pillar.material.depthWrite = !hidden;
      }
    },
    dispose() {
      disposeObject(group);
      group.removeFromParent();
    },
  };
}
