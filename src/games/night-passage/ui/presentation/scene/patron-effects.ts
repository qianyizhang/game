import * as T from 'three';
import { boon, GODS, SPELLS } from '../../../domain/content';
import type { GodId, StateView as State } from '../../../domain/types';

/** Authored light silhouettes, not solid bodies. Ground marks own position and warnings. */
function lightTexture(god: GodId, color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;
  const body = new Path2D();
  const core = new Path2D();
  switch (god) {
    case 'storm':
      // One broken descending leader, with two unequal forks.
      body.addPath(new Path2D('M75 9 36 74 61 70 44 113 69 103 55 179 91 86 64 94 85 51 60 57Z'));
      body.addPath(new Path2D('M45 75 15 50 28 91 48 105 36 80ZM80 104 113 66 103 114 73 137Z'));
      core.addPath(new Path2D('M71 30 47 69 69 64 55 102 77 95 63 145 84 102 61 108 76 62 54 65Z'));
      break;
    case 'tide':
      // A thick turning crest with a hollow pocket and a low returning tongue.
      body.addPath(
        new Path2D(
          'M21 168C-5 124 13 55 62 47C106 40 125 76 104 102C91 120 64 110 69 89C80 110 105 87 87 73C61 52 31 92 45 126C57 159 96 166 116 143C106 187 49 191 21 168Z',
        ),
      );
      body.addPath(
        new Path2D(
          'M14 110C5 89 9 65 24 52C19 72 22 82 30 90ZM88 40C88 23 99 16 104 11C98 32 105 43 88 40Z',
        ),
      );
      core.addPath(
        new Path2D(
          'M22 127C13 88 39 54 66 55C45 63 32 86 34 108C36 143 66 171 95 164C61 179 29 156 22 127Z',
        ),
      );
      break;
    case 'cinder':
      // Compressed base and an asymmetric tongue; quiet dark pocket inside.
      body.addPath(
        new Path2D(
          'M58 183C13 181 9 138 30 104C24 128 46 126 44 100C39 62 83 44 72 8C114 59 69 88 83 111C91 125 104 114 101 97C136 151 107 189 58 183Z',
        ),
      );
      body.addPath(
        new Path2D(
          'M31 75C13 70 25 51 21 39C42 53 30 60 31 75ZM99 69C90 55 111 44 112 32C120 49 108 55 99 69Z',
        ),
      );
      core.addPath(
        new Path2D(
          'M61 175C34 165 43 141 60 124C66 113 65 102 64 95C90 126 63 135 77 150C83 155 87 149 89 144C96 167 77 181 61 175Z',
        ),
      );
      break;
    case 'winter':
      // A tall split crystal and two shorter, outward-set blades.
      body.addPath(
        new Path2D(
          'M65 9 86 68 68 176 45 85ZM14 67 44 91 52 167 27 144ZM110 57 116 126 77 178 90 98Z',
        ),
      );
      core.addPath(new Path2D('M65 19 66 154 53 84ZM21 83 38 102 43 143ZM106 76 103 124 86 151Z'));
      break;
    case 'veil':
      // A torn open crescent surrounds a thin exposed eye, never a filled disc.
      body.addPath(
        new Path2D(
          'M79 9C27 40 23 118 57 177C-3 144 5 42 79 9ZM95 29C122 72 119 132 74 184C97 132 111 82 95 29Z',
        ),
      );
      body.addPath(new Path2D('M33 97Q66 64 103 97Q70 135 33 97ZM44 97Q69 118 92 97Q69 80 44 97Z'));
      core.addPath(
        new Path2D(
          'M68 80Q82 96 68 116Q59 99 68 80ZM49 44C31 73 29 119 46 146C18 115 27 70 49 44Z',
        ),
      );
      break;
  }
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.fill(body, 'evenodd');
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff4d8';
  ctx.fill(core);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}

/** A bounded cosmetic layer. Every draw can be reconstructed from one immutable snapshot. */
export function createPatronEffects(parent: T.Group) {
  const group = new T.Group();
  group.name = 'night-passage-patron-effects';
  parent.add(group);
  const textures = new Map(GODS.map((god) => [god.id, lightTexture(god.id, god.color)]));
  // Cue colors are part of the existing presentation vocabulary, including Cinder's blast.
  // Unknown/non-patron colors retain only their original ground cue.
  const cueGods = new Map(GODS.map((god) => [god.color, god.id]));
  const sprites: T.Sprite[] = [];
  let used = 0;
  let disposed = false;
  function light(god: GodId, x: number, y: number, height: number, size: number, opacity: number) {
    if (used >= 48) return;
    let sprite = sprites[used++];
    if (!sprite) {
      sprite = new T.Sprite(
        new T.SpriteMaterial({ transparent: true, depthWrite: false, toneMapped: false }),
      );
      sprite.center.set(0.5, 0);
      group.add(sprite);
      sprites.push(sprite);
    }
    sprite.visible = true;
    sprite.material.map = textures.get(god)!;
    sprite.material.opacity = opacity;
    sprite.position.set(x, height, y);
    sprite.scale.set(size * (2 / 3), size, 1);
  }
  return {
    sync(state: State, reducedMotion: boolean) {
      if (disposed) return;
      used = 0;
      const player = state.player;
      const strike = player.strike;
      // Windup gathers beside the hand. It ends on the confirmed release/cancellation.
      if (strike && (strike.action === 'cast' || strike.action === 'call')) {
        const entry = player.boons.find((entry) => boon(entry.id).slot === strike.action);
        if (entry) {
          const god = boon(entry.id).god;
          const progress = 1 - strike.left / SPELLS[god][strike.action].windup;
          const size =
            (strike.action === 'call' ? 65 : 38) * (reducedMotion ? 0.8 : 0.65 + progress * 0.35);
          light(
            god,
            player.x + Math.cos(strike.aim) * 26,
            player.y + Math.sin(strike.aim) * 26,
            28,
            size,
            0.65,
          );
        }
      }
      // Confirmed shots get a raised core; the existing ground glyph/tail stays at collision height.
      for (const shot of state.projectiles) {
        if (shot.hostile || !shot.god || shot.life <= 0) continue;
        light(shot.god, shot.x, shot.y, 5, shot.source === 'cast' ? 34 : 25, 0.9);
      }
      // No delayed particle simulation: pause, reload and chapter changes cannot leave stale light.
      for (const cue of state.cues) {
        const god = cueGods.get(cue.color);
        if (!god || cue.life <= 0) continue;
        const remaining = Math.min(1, cue.life / cue.total);
        const elapsed = 1 - remaining;
        const rise = reducedMotion ? 0 : elapsed * 15;
        const size =
          (cue.kind === 'hit' ? 30 : Math.min(85, cue.radius * 0.45)) *
          (reducedMotion ? 1 : 0.8 + elapsed * 0.4);
        const count = cue.kind === 'burst' && cue.radius > 100 ? 3 : 1;
        for (let n = 0; n < count; n++) {
          const angle = cue.aim + (n * Math.PI * 2) / count;
          const reach =
            cue.kind === 'slash' ? cue.radius * 0.55 : count > 1 ? cue.radius * 0.35 : 0;
          light(
            god,
            cue.x + Math.cos(angle) * reach,
            cue.y + Math.sin(angle) * reach,
            2 + rise,
            size,
            remaining * 0.8,
          );
        }
      }
      for (let n = used; n < sprites.length; n++) sprites[n].visible = false;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      for (const sprite of sprites) sprite.material.dispose();
      // Sprite geometry is Three.js shared geometry; this layer owns only materials and textures.
      for (const texture of textures.values()) {
        texture.dispose();
        const canvas = texture.image;
        canvas.width = canvas.height = 0;
      }
      group.clear();
      sprites.length = 0;
    },
  };
}
