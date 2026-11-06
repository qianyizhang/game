import * as T from 'three';
import { expect, test, vi } from 'vitest';
import { createGame } from '../../../domain/game';
import { GODS } from '../../../domain/content';
import { createPatronEffects } from './patron-effects';

// A nonrendered material/pool regression. Canvas paths are doubled only to construct
// textures; this deliberately makes no claim about pixels, WebGL or visual quality.
test('cooled Cinder tint cannot leak into reused patron, projectile or reduced-motion slots', () => {
  vi.stubGlobal(
    'Path2D',
    class {
      addPath = vi.fn();
    },
  );
  vi.stubGlobal('document', {
    createElement: () => ({
      width: 0,
      height: 0,
      getContext: () => ({ fill: vi.fn(), shadowColor: '', shadowBlur: 0, fillStyle: '' }),
    }),
  });
  const parent = new T.Group();
  const effects = createPatronEffects(parent);
  const visible = () => {
    const found: T.Sprite[] = [];
    parent.traverse((object) => {
      if (object instanceof T.Sprite && object.visible) found.push(object as T.Sprite);
    });
    return found;
  };
  const snapshot = () =>
    visible().map((sprite) => ({
      color: sprite.material.color.toArray(),
      opacity: sprite.material.opacity,
      position: sprite.position.toArray(),
      scale: sprite.scale.toArray(),
    }));
  // Deliberate presentation fixture, not a claimed legal playthrough.
  const cinder = createGame('cinder-pool');
  cinder.cues = [
    {
      x: 200,
      y: 200,
      kind: 'burst',
      radius: 150,
      color: GODS.find((god) => god.id === 'cinder')!.color,
      aim: 0,
      arc: Math.PI * 2,
      life: 4,
      total: 16,
    },
  ];
  const before = JSON.stringify(cinder);
  try {
    effects.sync(cinder, false);
    const cooled = snapshot();
    expect(cooled.length).toBeGreaterThan(0);
    expect(
      cooled.every((entry) => entry.color[0] > entry.color[1] && entry.color[1] > entry.color[2]),
    ).toBe(true);
    const slots = visible();
    const storm = structuredClone(cinder);
    storm.cues[0].color = GODS.find((god) => god.id === 'storm')!.color;
    effects.sync(storm, false);
    expect(visible()).toEqual(slots);
    expect(visible().every((sprite) => sprite.material.color.getHex() === 0xffffff)).toBe(true);
    effects.sync(cinder, false);
    expect(snapshot()).toEqual(cooled);
    const projectile = createGame('projectile-pool');
    projectile.projectiles = [
      {
        id: 1,
        x: 200,
        y: 200,
        vx: 1,
        vy: 0,
        radius: 6,
        damage: 1,
        life: 8,
        hostile: false,
        pierce: 0,
        hit: [],
        god: 'cinder',
        power: 1,
        source: 'cast',
        blast: 0,
        knockback: 0,
      },
    ];
    effects.sync(projectile, false);
    expect(visible()).toEqual([slots[0]]);
    expect(visible()[0].material.color.getHex()).toBe(0xffffff);
    expect(visible()[0].material.opacity).toBe(0.9);
    effects.sync(cinder, false);
    expect(snapshot()).toEqual(cooled);
    effects.sync(cinder, true);
    expect(visible().every((sprite) => sprite.material.color.getHex() === 0xffffff)).toBe(true);
    expect(visible().every((sprite) => sprite.material.opacity === 0.2)).toBe(true);
    const reducedPose = snapshot().map(({ position, scale }) => ({ position, scale }));
    const earlier = structuredClone(cinder);
    earlier.cues[0].life = 12;
    effects.sync(earlier, true);
    expect(snapshot().map(({ position, scale }) => ({ position, scale }))).toEqual(reducedPose);
    effects.sync(cinder, false);
    expect(snapshot()).toEqual(cooled);
    expect(JSON.stringify(cinder)).toBe(before);
    effects.sync(createGame('empty'), false);
    expect(visible()).toEqual([]);
  } finally {
    effects.dispose();
    vi.unstubAllGlobals();
  }
});
