import * as THREE from 'three';
import { WEAPONS, weapon } from '../../../domain/content';
import type { EnemyKind, State, WeaponId } from '../../../domain/types';
import { createHero } from './hero';
import { createEnemies, type EnemyModel } from './enemies';
import { createGuardians } from './guardians';

type Actor = {
  root: THREE.Group;
  facing: THREE.Group;
  torso: THREE.Group;
  hand: THREE.Group;
  body: THREE.Mesh;
  cue: THREE.Mesh;
  health: THREE.Sprite;
  healthBackground: THREE.Sprite;
  kind: EnemyKind | 'hero';
  seen: number;
  authored?: EnemyModel;
};
const colors = {
  hero: '#389c96',
  hunter: '#bc725e',
  archer: '#a7b36e',
  brute: '#b784a0',
  witch: '#9b89c9',
  boss: '#bb6b48',
  flash: '#fff4cf',
  stagger: '#ffd573',
  chill: '#85dfff',
  burn: '#ff8556',
  exposed: '#df9fff',
} as const;

/** Native hero, enemies and the first three guardians; the last guardian retains its pooled fallback. */
export function createActors(
  parent: THREE.Group,
  invalidate: () => void = () => {},
): {
  sync(state: State, reducedMotion: boolean): void;
  dispose(): void;
} {
  const group = new THREE.Group();
  group.name = 'night-passage-actor-blockout';
  parent.add(group);
  const authoredEnemies = createEnemies(invalidate);
  const authoredGuardians = createGuardians(invalidate);
  const geometry = {
    box: new THREE.BoxGeometry(1, 1, 1),
    sphere: new THREE.SphereGeometry(1, 10, 6),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 10),
    cone: new THREE.ConeGeometry(1, 1, 6),
    bow: new THREE.TorusGeometry(1, 0.07, 5, 14, Math.PI),
    ring: new THREE.RingGeometry(0.88, 1, 24),
  };
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const spriteMaterials = new Map<string, THREE.SpriteMaterial>();
  const cueMaterials = new Map<string, THREE.MeshBasicMaterial>();
  function material(color: string): THREE.MeshStandardMaterial {
    let result = materials.get(color);
    if (!result) {
      result = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
      materials.set(color, result);
    }
    return result;
  }
  function spriteMaterial(color: string): THREE.SpriteMaterial {
    let result = spriteMaterials.get(color);
    if (!result) {
      result = new THREE.SpriteMaterial({ color, depthTest: false, toneMapped: false });
      spriteMaterials.set(color, result);
    }
    return result;
  }
  function cueMaterial(color: string): THREE.MeshBasicMaterial {
    let result = cueMaterials.get(color);
    if (!result) {
      result = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, toneMapped: false });
      cueMaterials.set(color, result);
    }
    return result;
  }
  function part(
    owner: THREE.Group,
    shape: keyof typeof geometry,
    color: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry[shape], material(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    owner.add(mesh);
    return mesh;
  }
  function blade(owner: THREE.Group, color: string, length: number): void {
    part(owner, 'box', '#70584c', 0, 0, 0, 13, 3, 3);
    part(owner, 'box', '#dfb575', 7, 0, 0, 3, 12, 4);
    part(owner, 'box', color, 10 + length / 2, 0, 0, length, 5, 3);
    part(owner, 'cone', color, 14 + length, 0, 0, 3.5, 8, 2).rotation.z = -Math.PI / 2;
  }
  function bow(owner: THREE.Group, color: string): void {
    part(owner, 'bow', color, 12, 0, 0, 17, 17, 17).rotation.z = -Math.PI / 2;
    part(owner, 'box', '#f0dfbf', 12, 0, 0, 1, 34, 1);
    part(owner, 'box', '#f0dfbf', 19, 0, 0, 29, 1.5, 1.5);
    part(owner, 'cone', color, 36, 0, 0, 3, 7, 3).rotation.z = -Math.PI / 2;
  }
  function heldWeapon(id: WeaponId, owner: THREE.Group): void {
    const color = weapon(id).color;
    switch (id) {
      case 'sword':
        blade(owner, color, 27);
        break;
      case 'spear':
        part(owner, 'box', '#b79d79', 19, 0, 0, 64, 2.5, 2.5);
        part(owner, 'cone', color, 55, 0, 0, 5, 15, 3).rotation.z = -Math.PI / 2;
        break;
      case 'shield':
        part(owner, 'cylinder', color, 14, 0, 0, 18, 5, 18).rotation.z = Math.PI / 2;
        part(owner, 'cylinder', '#ffe6ae', 17, 0, 0, 8, 2, 8).rotation.z = Math.PI / 2;
        break;
      case 'bow':
        bow(owner, color);
        break;
      case 'fists':
        part(owner, 'box', color, 15, -2, -7, 11, 10, 10);
        part(owner, 'box', color, 8, -4, 12, 11, 10, 10);
    }
  }
  function makeActor(kind: Actor['kind']): Actor {
    const hero = kind === 'hero';
    const root = new THREE.Group();
    root.name = `blockout-${kind}`;
    group.add(root);
    const facing = new THREE.Group();
    root.add(facing);
    const torso = new THREE.Group();
    facing.add(torso);
    const height = hero ? 48 : 35;
    const width = kind === 'brute' || kind === 'boss' ? 23 : 17;
    const cloth = colors[kind];
    // Feet remain attached to y=0 while shoulders and hands carry cosmetic motion.
    for (const z of [-6, 6]) {
      part(facing, 'box', '#30393e', 1, 4, z, 12, 8, 7);
      part(facing, 'box', '#4b5055', 0, 12, z, 7, 12, 6);
    }
    const body =
      kind === 'witch'
        ? part(torso, 'cone', cloth, 0, 19, 0, 13, 26, 13)
        : part(torso, 'box', cloth, 0, hero ? 27 : 23, 0, width, hero ? 23 : 16, 17);
    part(torso, 'sphere', hero ? '#f3dfb5' : '#e0c4a0', 2, height - 7, 0, 7, 8, 7);
    // Forward nose/visor and the held arm make +X facing readable in silhouette.
    part(torso, 'box', '#534948', 8, height - 6, 0, 4, 3, 9);
    if (hero) {
      const cape = part(torso, 'box', '#23776f', -10, 25, 0, 5, 31, 23);
      cape.rotation.z = -0.15;
      part(torso, 'box', '#f0c67c', 3, 34, 0, 18, 3, 18);
    }
    const hand = new THREE.Group();
    hand.position.set(10, hero ? 29 : 25, -8);
    torso.add(hand);
    part(torso, 'box', hero ? '#f3dfb5' : '#e0c4a0', 10, hero ? 29 : 25, -8, 12, 6, 6);
    if (kind === 'hunter') blade(hand, '#efb897', 17);
    if (kind === 'archer') bow(hand, '#c9dd94');
    if (kind === 'brute' || kind === 'boss') {
      part(hand, 'box', '#715448', 9, 0, 0, 27, 4, 4);
      part(hand, 'box', '#d7b07b', 26, 0, 0, 12, 21, 15);
      part(torso, 'box', '#d7b07b', 0, 30, 0, width + 7, 6, 21);
    }
    if (kind === 'witch') {
      part(torso, 'cone', '#6b5598', 0, 38, 0, 9, 17, 9);
      part(hand, 'box', '#a3b6b7', 12, 0, 0, 3, 43, 3);
      part(hand, 'sphere', '#d8afff', 12, 24, 0, 6, 6, 6);
    }
    if (kind === 'boss') {
      part(torso, 'cylinder', '#f3cc75', 2, 34, 0, 9, 4, 9);
      for (const z of [-6, 6]) {
        for (const x of [-4, 6]) part(torso, 'cone', '#f3cc75', x, 39, z, 3, 9, 3);
      }
    }
    const cue = new THREE.Mesh(geometry.ring, cueMaterial('#ffbe72'));
    cue.rotation.x = -Math.PI / 2;
    cue.position.y = 0.6;
    cue.scale.setScalar(16);
    cue.visible = false;
    root.add(cue);
    const background = new THREE.Sprite(spriteMaterial('#18252b'));
    background.position.y = hero ? 76 : kind === 'boss' ? height + 12 : 66;
    background.scale.set(35, 5, 1);
    background.renderOrder = 30;
    root.add(background);
    const health = new THREE.Sprite(spriteMaterial(hero ? '#80ead4' : '#ef987c'));
    health.position.y = background.position.y;
    health.renderOrder = 31;
    root.add(health);
    const authored = hero
      ? undefined
      : kind === 'boss'
        ? authoredGuardians.attach(root)
        : authoredEnemies.attach(root, kind);
    return {
      root,
      facing,
      torso,
      hand,
      body,
      cue,
      health,
      healthBackground: background,
      kind,
      seen: 0,
      authored,
    };
  }
  const hero = makeActor('hero');
  const held = new Map<WeaponId, THREE.Group>();
  for (const entry of WEAPONS) {
    const weaponGroup = new THREE.Group();
    weaponGroup.name = `held-${entry.id}`;
    heldWeapon(entry.id, weaponGroup);
    hero.hand.add(weaponGroup);
    held.set(entry.id, weaponGroup);
  }
  const authoredHero = createHero(hero.root, hero.hand, held, invalidate);
  const active = new Map<number, Actor>();
  const spare = new Map<EnemyKind, Actor[]>();
  let generation = 0;
  let disposed = false;
  function healthBar(actor: Actor, hp: number, maxHp: number): void {
    const fraction = THREE.MathUtils.clamp(hp / Math.max(1, maxHp), 0, 1);
    actor.health.scale.set(32 * fraction, 3, 1);
    actor.health.visible = hp > 0;
    actor.health.material = spriteMaterial(
      fraction < 0.3 ? '#ff705d' : actor.kind === 'hero' ? '#80ead4' : '#ef987c',
    );
  }
  function release(id: number, actor: Actor): void {
    active.delete(id);
    actor.root.visible = false;
    if (actor.kind !== 'hero') {
      let pool = spare.get(actor.kind);
      if (!pool) spare.set(actor.kind, (pool = []));
      pool.push(actor);
    }
  }
  return {
    sync(state, reducedMotion) {
      if (disposed) return;
      generation++;
      const player = state.player;
      hero.root.position.set(player.x, 0, player.y);
      hero.facing.visible = !authoredHero.sync(state, reducedMotion);
      hero.facing.rotation.y = -(player.strike?.aim ?? player.aim);
      const striking = player.strike !== null;
      const dashing = player.dashLeft > 0;
      hero.torso.position.y = reducedMotion ? 0 : Math.sin(state.tick * 0.15) * 0.65;
      hero.torso.rotation.z = reducedMotion ? 0 : dashing ? -0.18 : 0;
      const windup = player.strike?.left ?? 0;
      hero.hand.rotation.y = reducedMotion ? 0 : striking ? Math.min(windup / 12, 1) * 0.7 : 0;
      hero.hand.position.x = 10 + (reducedMotion ? 0 : player.recovery > 0 ? 4 : 0);
      hero.body.material = material(player.invulnerable > 0 ? '#81ddcb' : colors.hero);
      hero.cue.visible = striking || dashing;
      hero.cue.material = cueMaterial(dashing ? '#80ead4' : '#ffe0a6');
      for (const [id, model] of held) model.visible = id === player.weapon;
      healthBar(hero, player.hp, player.maxHp);
      for (const enemy of state.enemies) {
        let actor = active.get(enemy.id);
        if (actor && actor.kind !== enemy.kind) {
          release(enemy.id, actor);
          actor = undefined;
        }
        if (!actor) {
          actor = spare.get(enemy.kind)?.pop() ?? makeActor(enemy.kind);
          active.set(enemy.id, actor);
        }
        actor.seen = generation;
        actor.root.visible = enemy.hp > 0;
        actor.root.position.set(enemy.x, 0, enemy.y);
        actor.root.scale.setScalar(enemy.radius / 14);
        const authored = actor.authored?.sync(enemy, state, reducedMotion) ?? false;
        actor.facing.visible = !authored;
        if (enemy.kind === 'boss') {
          actor.health.position.y = actor.healthBackground.position.y = authored ? 58 : 47;
        }
        actor.facing.rotation.y = -enemy.aim;
        actor.torso.position.y = reducedMotion ? 0 : Math.sin((state.tick + enemy.id) * 0.12) * 0.4;
        actor.torso.rotation.z = reducedMotion ? 0 : enemy.windup > 0 ? -0.1 : 0;
        actor.hand.rotation.y = reducedMotion ? 0 : enemy.windup > 0 ? -0.45 : 0;
        const tint =
          enemy.flash > 0
            ? colors.flash
            : enemy.stagger > 0
              ? colors.stagger
              : enemy.chill > 0
                ? colors.chill
                : enemy.burn > 0
                  ? colors.burn
                  : enemy.exposed > 0
                    ? colors.exposed
                    : colors[enemy.kind];
        actor.body.material = material(tint);
        actor.cue.visible = enemy.windup > 0;
        healthBar(actor, enemy.hp, enemy.maxHp);
      }
      for (const [id, actor] of active) if (actor.seen !== generation) release(id, actor);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      authoredHero.dispose();
      authoredEnemies.dispose();
      authoredGuardians.dispose();
      group.removeFromParent();
      group.clear();
      active.clear();
      spare.clear();
      held.clear();
      for (const entry of Object.values(geometry)) entry.dispose();
      for (const entry of materials.values()) entry.dispose();
      for (const entry of spriteMaterials.values()) entry.dispose();
      for (const entry of cueMaterials.values()) entry.dispose();
      materials.clear();
      spriteMaterials.clear();
      cueMaterials.clear();
    },
  };
}
