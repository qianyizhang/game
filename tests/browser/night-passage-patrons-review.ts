import * as T from 'three';
import { applyCommand, createGame } from '../../src/games/night-passage/domain/game';
import { GODS } from '../../src/games/night-passage/domain/content';
import type { State } from '../../src/games/night-passage/domain/types';
import { createSceneRenderer } from '../../src/games/night-passage/ui/presentation/scene';
import { createPatronEffects } from '../../src/games/night-passage/ui/presentation/scene/patron-effects';
import { createParityCases } from './night-passage-parity';

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const effectName = 'night-passage-patron-effects';
const idle = {
  x: 0,
  y: 0,
  aim: 0,
  attack: false,
  special: false,
  dash: false,
  cast: false,
  call: false,
};
function advance(state: State, ticks: number) {
  const result = applyCommand(state, { type: 'frame', input: idle, ticks });
  if (result.error) throw new Error(result.error);
  return result.state;
}
function sprites(root: T.Object3D) {
  const found: T.Sprite[] = [];
  root.traverse((object) => {
    if (object instanceof T.Sprite) found.push(object as T.Sprite);
  });
  return found;
}
function visible(root: T.Object3D) {
  return sprites(root).filter((sprite) => sprite.visible);
}
function transforms(root: T.Object3D) {
  return visible(root).map((sprite) => ({
    position: sprite.position.toArray(),
    scale: sprite.scale.toArray(),
    rotation: sprite.material.rotation,
    opacity: sprite.material.opacity,
    texture: sprite.material.map?.uuid,
  }));
}
function spatial(root: T.Object3D) {
  return transforms(root).map(({ position, scale, rotation }) => ({ position, scale, rotation }));
}

/** Presentation-only scenarios. Spell releases come from commands; setup is not a legal run. */
export function inspectPatronEffects() {
  const parent = new T.Group(),
    effects = createPatronEffects(parent);
  const cases = createParityCases().filter(
    (entry) => entry.family === 'patron' || entry.family === 'glyph',
  );
  let pure = true;
  const sync = (state: State, reduced = false) => {
    const before = JSON.stringify(state);
    effects.sync(state, reduced);
    pure &&= before === JSON.stringify(state);
  };
  const checks = [],
    textures = new Set<T.Texture>();
  let disposed = false;
  try {
    for (const entry of cases) {
      sync(entry.state);
      const before = JSON.stringify(transforms(parent));
      for (const sprite of visible(parent))
        if (sprite.material.map) textures.add(sprite.material.map);
      sync(structuredClone(entry.state));
      checks.push({
        id: entry.id,
        visible: visible(parent).length > 0,
        pausedStable: before === JSON.stringify(transforms(parent)),
      });
    }
    const temporal = [];
    for (const god of GODS) {
      const release = cases.find((entry) => entry.id === `${god.id}-call-release`)!.state;
      const later = advance(release, 8);
      sync(release);
      const normalStart = JSON.stringify(spatial(parent));
      sync(later);
      const normalMoves = normalStart !== JSON.stringify(spatial(parent));
      sync(release, true);
      const held = JSON.stringify(spatial(parent)),
        alpha = visible(parent).map((sprite) => sprite.material.opacity);
      sync(later, true);
      temporal.push({
        god: god.id,
        normalMoves,
        reducedSpatialStable: held === JSON.stringify(spatial(parent)),
        reducedFades:
          visible(parent).length > 0 &&
          visible(parent).every((sprite, index) => sprite.material.opacity < alpha[index]),
      });
    }
    const release = cases.find((entry) => entry.id === 'storm-call-release')!.state;
    sync(release);
    const original = JSON.stringify(transforms(parent));
    const empty = createGame('new-passage');
    empty.region = 3;
    empty.chamber = 7;
    sync(empty);
    const resetHidden = visible(parent).length === 0;
    sync(release);
    const resetRestores = original === JSON.stringify(transforms(parent));
    sync(advance(release, 20));
    const expiredHidden = visible(parent).length === 0;
    const stress = structuredClone(release);
    stress.cues = Array.from({ length: 100 }, (_, index) => ({
      ...release.cues[0],
      x: 100 + index * 7,
    }));
    sync(stress);
    const highWater = sprites(parent).length;
    const bounded = visible(parent).length > 0 && highWater < stress.cues.length;
    sync(empty);
    sync(stress);
    const poolReused = sprites(parent).length === highWater;
    const ordinary = structuredClone(cases.find((entry) => entry.id === 'storm-projectile')!.state);
    ordinary.cues = [];
    ordinary.player.strike = null;
    ordinary.projectiles[0].hostile = true;
    sync(ordinary);
    const hostileExcluded = visible(parent).length === 0;
    ordinary.projectiles[0].hostile = false;
    ordinary.projectiles[0].god = null;
    sync(ordinary);
    const mundaneExcluded = visible(parent).length === 0;
    const materials = new Set(sprites(parent).map((sprite) => sprite.material));
    let disposedMaterials = 0,
      disposedTextures = 0;
    for (const material of materials)
      material.addEventListener('dispose', () => disposedMaterials++);
    for (const texture of textures) texture.addEventListener('dispose', () => disposedTextures++);
    effects.dispose();
    disposed = true;
    effects.dispose();
    return {
      checks,
      temporal,
      pure,
      resetHidden,
      resetRestores,
      expiredHidden,
      bounded,
      poolReused,
      hostileExcluded,
      mundaneExcluded,
      resourcesRemoved: parent.children.length === 0,
      materialsReleasedOnce: materials.size > 0 && disposedMaterials === materials.size,
      texturesReleasedOnce: textures.size > 0 && disposedTextures === textures.size,
    };
  } finally {
    if (!disposed) effects.dispose();
  }
}

/** Test-owned observation; no product debug switch, injected save or hidden gameplay. */
function observeScene(canvas: HTMLCanvasElement, state: State, unavailable: () => void) {
  const roots = new Map<string, T.Object3D>();
  // eslint-disable-next-line @typescript-eslint/unbound-method -- immediately restored; original receives this via apply.
  const original = T.Object3D.prototype.add;
  T.Object3D.prototype.add = function (...objects) {
    for (const object of objects) if (object.name) roots.set(object.name, object);
    return original.apply(this, objects);
  };
  try {
    const renderer = createSceneRenderer(canvas, unavailable);
    renderer.draw(state);
    return { renderer, roots };
  } finally {
    T.Object3D.prototype.add = original;
  }
}

/** Deliberately composed overlap fixture; no claim that these phases coincide in a legal run. */
function crowdedCase(parity: ReturnType<typeof createParityCases>) {
  const source = parity.find((entry) => entry.id === 'composite-spells-status')!;
  const state = structuredClone(source.state);
  const windup = parity.find((entry) => entry.id === 'enemy-brute-windup')!.state.enemies[0];
  const release = parity.find((entry) => entry.id === 'cinder-call-release')!.state;
  const warning = parity.find((entry) => entry.id === 'hazard-thorns-warning')!.state;
  state.tick = warning.tick;
  state.player.x = 480;
  state.player.y = 490;
  for (const [index, enemy] of state.enemies.entries()) {
    enemy.x = 380 + index * 100;
    enemy.y = 330;
    enemy.windup = windup.windup;
    enemy.cooldown = windup.cooldown;
    enemy.aim = Math.PI / 2;
    enemy.target = { x: enemy.x, y: 410 };
  }
  state.room.hazards = warning.room.hazards.map((hazard) => ({ ...hazard, x: 480, y: 420 }));
  state.cues.push(...release.cues.map((cue) => ({ ...cue, x: 480, y: 400 })));
  return {
    id: 'crowded-warnings-call',
    state,
    provenance:
      'Composed renderer fixture: existing five-projectile/status composite, commanded brute windup phases and Cinder call cues repositioned together, plus the controlled thorns warning phase. Not a legal campaign chronicle.',
  };
}

export async function reviewPatronEffects() {
  const parity = createParityCases();
  const cases = parity.filter((entry) => entry.family === 'patron' || entry.family === 'glyph');
  const crowded = crowdedCase(parity);
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:960px;height:600px;z-index:9999';
  document.body.append(canvas);
  let unavailable = false;
  const { renderer, roots } = observeScene(canvas, cases[0].state, () => {
    unavailable = true;
  });
  const pictures: { id: string; png: string }[] = [];
  const comparisons: { id: string; changed: boolean; pausedStable: boolean }[] = [];
  let pure = true;
  try {
    const deadline = performance.now() + 10000;
    do {
      renderer.draw({ ...cases[0].state });
      if (
        ['hero', 'brute', 'sepulcher'].every(
          (kind) => roots.get(`night-passage-authored-${kind}`)?.visible,
        ) &&
        roots.get('night-passage-authored-hero')?.getObjectByName('weapon_spear')
      )
        break;
      if (performance.now() > deadline)
        throw new Error('Authored patron review scene did not activate');
      await nextFrame();
    } while (true);
    const effectRoot = roots.get(effectName);
    if (!effectRoot) throw new Error('Patron effect root was not observed');
    const draw = (state: State, withoutNewEffects = false) => {
      const before = JSON.stringify(state);
      // Baseline is the exact same scene with only this new decorative group omitted.
      const previous = effectRoot.visible;
      effectRoot.visible = !withoutNewEffects;
      try {
        renderer.draw({ ...state });
      } finally {
        effectRoot.visible = previous;
      }
      pure &&= before === JSON.stringify(state);
      return canvas.toDataURL('image/png');
    };
    for (const width of [960, 390]) {
      canvas.style.width = `${width}px`;
      canvas.style.height = `${(width * 600) / 960}px`;
      await nextFrame();
      await nextFrame();
      for (const entry of [...cases, crowded]) {
        const baseline = draw(entry.state, true),
          png = draw(entry.state);
        comparisons.push({
          id: `${entry.id}-${width}`,
          changed: baseline !== png,
          pausedStable: png === draw(entry.state),
        });
        pictures.push(
          { id: `${entry.id}-${width}-before`, png: baseline },
          { id: `${entry.id}-${width}`, png },
        );
        if (entry.id.endsWith('call-release'))
          pictures.push({ id: `${entry.id}-${width}-later`, png: draw(advance(entry.state, 8)) });
        if (entry.id.endsWith('-projectile'))
          pictures.push({ id: `${entry.id}-${width}-flight`, png: draw(advance(entry.state, 6)) });
      }
    }
    return {
      pictures,
      pure,
      comparisons,
      crowded: { id: crowded.id, provenance: crowded.provenance },
      unavailable,
      authoredReady: ['hero', 'brute', 'sepulcher'].every(
        (kind) => roots.get(`night-passage-authored-${kind}`)?.visible,
      ),
      provenance:
        'Controlled commanded spell snapshots in the production renderer. Before omits only the new decorative patron group; exact ground effects, actors and environment are shared. Not campaign proof.',
    };
  } finally {
    canvas.remove();
    renderer.dispose();
  }
}
