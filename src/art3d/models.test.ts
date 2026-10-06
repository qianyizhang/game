import { expect, it } from 'vitest';
import * as T from 'three';
import { createStudy, disposeObject, STUDIES } from './models';

for (const { id } of STUDIES) {
  it(`${id} supplies finite unit normals for rendering and glTF export`, () => {
    const root = createStudy(id);
    try {
      const invalid: string[] = [];
      root.traverse((object) => {
        if (!(object instanceof T.Mesh)) return;
        const normals = object.geometry.getAttribute('normal');
        if (!normals) {
          invalid.push(object.name);
          return;
        }
        for (let i = 0; i < normals.count; i++) {
          const length = Math.hypot(normals.getX(i), normals.getY(i), normals.getZ(i));
          // The glTF exporter/validator allows a maximum error of 0.0005.
          if (!Number.isFinite(length) || Math.abs(length - 1) > 0.0005) {
            invalid.push(object.name);
            break;
          }
        }
      });
      expect(invalid).toEqual([]);
    } finally {
      disposeObject(root);
    }
  });
}
