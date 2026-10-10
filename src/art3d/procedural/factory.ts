import { isMesh } from '../../shared/three/objects';
import type { StudyId } from '../catalogue';
import { catalyst } from './catalyst';
import * as T from 'three';
import { spiral, vajra } from './newStudies';
import { hydra } from './hydra';
import { phoenix } from './phoenix';
import { nightjar } from './nightjar';
import { prowler } from './prowler';
import { wolf } from './wolf';
import { matriarch } from './matriarch';
import { thornstag } from './thornstag';
import { moonmoth } from './moonmoth';
import { bogtoad } from './bogtoad';
import { crocolisk } from './crocolisk';
import { scavenger } from './scavenger';
import { guardian } from './guardian';
import { tortoise } from './tortoise';
import { stormroc } from './stormroc';
import { stray } from './stray';
import { packcaller } from './packcaller';
import { cub } from './cub';
import { amalgam } from './amalgam';
import { imp } from './imp';
import { matron } from './matron';
import { juggler } from './juggler';
import { watcher } from './watcher';
import { herald } from './herald';
import { patron } from './patron';
import { squire } from './squire';
import { bannerbearer } from './bannerbearer';

// Delivery loads this synchronous backend only for procedural fallback.
export { createStudyClip } from './animation';

/** Construct the registered asset and preserve its assembled inspection transforms. */
export function createStudy(id: StudyId) {
  const root = new T.Group();
  root.name = `Study_${id}`;
  ({
    nightjar,
    catalyst,
    phoenix,
    hydra,
    spiral,
    vajra,
    prowler,
    wolf,
    matriarch,
    thornstag,
    moonmoth,
    bogtoad,
    crocolisk,
    scavenger,
    guardian,
    tortoise,
    stormroc,
    stray,
    packcaller,
    cub,
    amalgam,
    imp,
    matron,
    juggler,
    watcher,
    herald,
    patron,
    squire,
    bannerbearer,
  })[id](root);
  const geometries = new Set<T.BufferGeometry>();
  const normal = new T.Vector3();
  root.traverse((object) => {
    if (isMesh(object) && !geometries.has(object.geometry)) {
      geometries.add(object.geometry);
      const normals = object.geometry.getAttribute('normal');
      if (normals)
        for (let i = 0; i < normals.count; i++) {
          normal.fromBufferAttribute(normals, i);
          // Collapsed tips and lathe seams can leave zero or short normals.
          // Match GLTFExporter's correction here so preview and export agree.
          if (normal.lengthSq() === 0) normal.set(1, 0, 0);
          else normal.normalize();
          normals.setXYZ(i, normal.x, normal.y, normal.z);
        }
    }
    object.userData.home = object.position.toArray();
    object.userData.restScale = object.scale.toArray();
    object.userData.restQuaternion = object.quaternion.toArray();
  });
  return root;
}
