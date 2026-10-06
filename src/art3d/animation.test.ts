import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { createStudy, disposeObject, type StudyId } from './models';
import { createStudyClip, LOOP_SECONDS } from './animation';
import { loft } from './newStudies';

describe('portable study animations', () => {
  for (const id of ['nightjar', 'catalyst', 'phoenix', 'hydra', 'spiral', 'vajra'] as StudyId[]) {
    it(`${id} binds every track to a real node and loops without a pose jump`, () => {
      const root = createStudy(id);
      try {
        const clip = createStudyClip(root, id);
        expect(clip.duration).toBe(LOOP_SECONDS);
        expect(clip.tracks.length).toBeGreaterThanOrEqual(['spiral', 'vajra'].includes(id) ? 1 : 3);
        for (const track of clip.tracks) {
          const binding = T.PropertyBinding.parseTrackName(track.name);
          expect(root.getObjectByName(binding.nodeName!)).toBeDefined();
          const size = track.getValueSize();
          expect(Array.from(track.values).every(Number.isFinite)).toBe(true);
          expect(Array.from(track.values.slice(0, size))).toEqual(
            Array.from(track.values.slice(-size)),
          );
        }
        const mixer = new T.AnimationMixer(root);
        mixer.clipAction(clip).play();
        const readPose = () => {
          const pose: number[][] = [];
          root.traverse((child) => {
            if (child.userData.motion)
              pose.push([
                ...child.position.toArray(),
                ...child.quaternion.toArray(),
                ...child.scale.toArray(),
              ]);
          });
          return pose;
        };
        mixer.setTime(0.75);
        const pose = readPose();
        mixer.setTime(LOOP_SECONDS + 0.75);
        const loopPose = readPose();
        expect(loopPose).toEqual(pose);
        mixer.stopAllAction();
        mixer.uncacheRoot(root);
      } finally {
        disposeObject(root);
      }
    });
  }
  for (const id of ['spiral', 'vajra'] as StudyId[]) {
    it(`${id} exports a rigid presentation clip without deforming its object`, () => {
      const root = createStudy(id);
      const clip = createStudyClip(root, id);
      const mixer = new T.AnimationMixer(root);
      mixer.clipAction(clip).play();
      try {
        expect(clip.tracks).toHaveLength(1);
        expect(clip.tracks[0].name).toMatch(/_Display.quaternion$/);
        const meshes: T.Mesh[] = [];
        root.traverse((node) => {
          if (node instanceof T.Mesh) meshes.push(node);
        });
        root.updateMatrixWorld(true);
        const localTransforms = meshes.map((mesh) => mesh.matrix.clone());
        const readExtent = () => {
          root.updateMatrixWorld(true);
          return meshes.map((mesh) => {
            mesh.geometry.computeBoundingSphere();
            return mesh.geometry.boundingSphere!.radius;
          });
        };
        const extents = readExtent();
        mixer.setTime(1.5);
        expect(readExtent()).toEqual(extents);
        meshes.forEach((mesh, index) =>
          expect(mesh.matrix.equals(localTransforms[index])).toBe(true),
        );
        for (const mesh of meshes) {
          expect(
            Array.from(mesh.geometry.getAttribute('position').array).every(Number.isFinite),
          ).toBe(true);
        }
      } finally {
        mixer.stopAllAction();
        mixer.uncacheRoot(root);
        disposeObject(root);
      }
    });
  }
  for (const [id, names] of [
    ['hydra', ['Hydra_Joined_Shoulder_And_Necks']],
    ['spiral', ['Shell_Display_Arm', 'Shell_Mount_Foot']],
    ['vajra', ['Vajra_Museum_Support', 'Vajra_Mount_Foot']],
  ] as [StudyId, string[]][]) {
    it(`${id} keeps floor contacts at a constant world height through the complete loop`, () => {
      const root = createStudy(id),
        mixer = new T.AnimationMixer(root);
      mixer.clipAction(createStudyClip(root, id)).play();
      const height = (name: string) => {
        const mesh = root.getObjectByName(name) as T.Mesh;
        const position = mesh.geometry.getAttribute('position');
        let bottom = Infinity;
        for (let i = 0; i < position.count; i++)
          bottom = Math.min(
            bottom,
            mesh.getVertexPosition(i, new T.Vector3()).applyMatrix4(mesh.matrixWorld).y,
          );
        return bottom;
      };
      try {
        root.updateMatrixWorld(true);
        const rest = names.map(height);
        rest.forEach((y, i) => {
          expect(y).toBeGreaterThanOrEqual(0.104);
          if (names[i].includes('Foot') || id === 'hydra') expect(y).toBeLessThanOrEqual(0.106);
        });
        for (let frame = 0; frame <= 144; frame++) {
          mixer.setTime(frame / 24);
          root.updateMatrixWorld(true);
          names.forEach((name, i) => expect(height(name)).toBeCloseTo(rest[i], 6));
        }
      } finally {
        mixer.stopAllAction();
        mixer.uncacheRoot(root);
        disposeObject(root);
      }
    });
  }
  it('prepacks cast metal channels for direct DataTexture GLB export without changing metalness', () => {
    const root = createStudy('vajra');
    try {
      const mesh = root.getObjectByName('Vajra_Fitted_Grip') as T.Mesh;
      const material = mesh.material as T.MeshStandardMaterial;
      expect(material.roughnessMap).toBe(material.metalnessMap);
      expect(material.roughnessMap).toBeInstanceOf(T.DataTexture);
      const bytes = (material.roughnessMap as T.DataTexture).image.data!;
      for (let i = 0; i < bytes.length; i += 4) {
        expect(bytes[i + 2]).toBe(255);
        expect(bytes[i + 1]).toBeGreaterThan(175);
      }
      // G still varies: the exporter fix must retain cast roughness variation.
      expect(new Set(Array.from(bytes).filter((_, i) => i % 4 === 1)).size).toBeGreaterThan(20);
      expect(material.metalness).toBe(0.72);
    } finally {
      disposeObject(root);
    }
  });
  it('keeps the fused Hydra skin closed at its sampling bounds', () => {
    const root = createStudy('hydra');
    try {
      const mesh = root.getObjectByName('Hydra_Joined_Shoulder_And_Necks') as T.Mesh;
      const indices = mesh.geometry.index!.array,
        edges = new Map<string, number>();
      for (let i = 0; i < indices.length; i += 3) {
        const triangle = [indices[i], indices[i + 1], indices[i + 2]];
        if (new Set(triangle).size < 3) continue;
        for (let edge = 0; edge < 3; edge++) {
          const a = triangle[edge],
            b = triangle[(edge + 1) % 3],
            key = a < b ? `${a}:${b}` : `${b}:${a}`;
          edges.set(key, (edges.get(key) ?? 0) + 1);
        }
      }
      expect([...edges.values()].filter((count) => count === 1)).toHaveLength(0);
    } finally {
      disposeObject(root);
    }
  });
  it('keeps gas bubbles below the actual liquid surface in both vessels throughout a loop', () => {
    const root = createStudy('catalyst');
    const mixer = new T.AnimationMixer(root);
    mixer.clipAction(createStudyClip(root, 'catalyst')).play();
    try {
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        for (const name of ['Main', 'Companion']) {
          const liquid = root.getObjectByName(`${name}_Liquid`) as T.Mesh;
          liquid.geometry.computeBoundingBox();
          const bounds = liquid.geometry.boundingBox!;
          root.getObjectByName(name)!.children.forEach((child) => {
            if (child.userData.motion === 'bubble') {
              expect(child.position.y + child.scale.y).toBeLessThanOrEqual(bounds.max.y);
              expect(child.position.y - child.scale.y).toBeGreaterThanOrEqual(bounds.min.y);
            }
          });
        }
      }
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
});

describe('closed object loft surfaces', () => {
  it('winds the tapered lateral wall outward, rather than rendering its inside and end caps', () => {
    const segments = 12,
      sides = 24;
    const geometry = loft(
      [
        [0, 0, 0],
        [0, 0, 2],
      ],
      [0.5, 0.2],
      [0.5, 0.2],
      segments,
    );
    try {
      const positions = geometry.getAttribute('position');
      const normals = geometry.getAttribute('normal');
      for (let ring = 1; ring < segments; ring++) {
        for (let side = 0; side <= sides; side++) {
          const vertex = ring * (sides + 1) + side;
          const radial = new T.Vector3(
            positions.getX(vertex),
            positions.getY(vertex),
            0,
          ).normalize();
          const normal = new T.Vector3().fromBufferAttribute(normals, vertex);
          // For this circular taper an outward normal has a large positive radial component.
          // Reversing the side triangles makes every dot negative and exposes cut-open ribbons.
          expect(normal.dot(radial)).toBeGreaterThan(0.9);
        }
      }
      const caps = positions.count - 2;
      expect(normals.getZ(caps)).toBeLessThan(-0.99);
      expect(normals.getZ(caps + 1)).toBeGreaterThan(0.99);
    } finally {
      geometry.dispose();
    }
  });
});
