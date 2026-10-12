import * as T from 'three';
import { applyCommand, createGame } from '../../src/games/night-passage/domain/game';
import { GODS, WEAPONS } from '../../src/games/night-passage/domain/content';
import { ENEMY_PATTERNS, GUARDIANS } from '../../src/games/night-passage/domain/encounter-content';
import { spawnEnemy, hazardTiming } from '../../src/games/night-passage/domain/encounters';
import { cue } from '../../src/games/night-passage/domain/effects';
import type { EnemyKind, Input, State } from '../../src/games/night-passage/domain/types';
import { createGroundEffects } from '../../src/games/night-passage/ui/presentation/scene/ground-effects';
import { createSceneRenderer } from '../../src/games/night-passage/ui/presentation/scene';
import { passageCommand } from '../simulation/night-passage-policy';

const idle: Input = {
  x: 0,
  y: 0,
  aim: 0,
  attack: false,
  special: false,
  dash: false,
  cast: false,
  call: false,
};
type Probe = { label: string; x: number; y: number; visible: boolean };
export interface ParityCase {
  id: string;
  family: 'patron' | 'glyph' | 'enemy' | 'guardian' | 'hazard' | 'status' | 'cue' | 'composite';
  stage: string;
  state: State;
  provenance: string;
  probes?: Probe[];
  crop?: { x: number; y: number; width: number; height: number };
  expectedShots?: number;
  expectedCue?: string;
}
function base(id: string, weapon: State['player']['weapon'] = 'spear'): State {
  const result = applyCommand(createGame(`parity-${id}`), { type: 'start', weapon, runes: [] });
  if (result.error) throw new Error(result.error);
  const state = result.state;
  state.room.pillars = [];
  state.room.hazards = [];
  state.enemies = [];
  state.player.x = 320;
  state.player.y = 300;
  state.player.aim = 0;
  spawnEnemy(state, 'brute', { x: 850, y: 520 });
  state.enemies[0].cooldown = 10000;
  return state;
}
function frame(state: State, input: Input, ticks: number): State {
  const result = applyCommand(state, { type: 'frame', input, ticks });
  if (result.error) throw new Error(result.error);
  return result.state;
}
const controlled =
  'Controlled renderer scenario; effects resolved by applyCommand. Not a legal campaign chronicle.';

/** Small regenerable factories; no serialized state fixtures are retained. */
export function createParityCases(): ParityCase[] {
  const cases: ParityCase[] = [];
  for (const god of GODS) {
    for (const action of ['cast', 'call'] as const) {
      const state = base(`${god.id}-${action}`);
      state.player.boons = [{ id: `${god.id}-${action}`, level: 1 }];
      state.player.charge = 100;
      const windup = frame(state, { ...idle, [action]: true }, 1);
      const release = frame(windup, idle, windup.player.strike!.left);
      cases.push({
        id: `${god.id}-${action}-windup`,
        family: 'patron',
        stage: 'windup',
        state: windup,
        provenance: controlled,
      });
      cases.push({
        id: `${god.id}-${action}-release`,
        family: 'patron',
        stage: 'release',
        state: release,
        provenance: controlled,
        expectedShots:
          action === 'cast' ? { storm: 1, tide: 3, cinder: 1, winter: 5, veil: 0 }[god.id] : 0,
        expectedCue:
          action === 'call'
            ? god.id === 'veil'
              ? 'slash'
              : 'burst'
            : god.id === 'veil'
              ? 'slash'
              : undefined,
      });
    }
    // Veil cast is a rush. A Veil-marked spear special is its actual projectile source.
    const state = base(`${god.id}-projectile`);
    state.player.boons = [{ id: `${god.id}-special`, level: 1 }];
    const windup = frame(state, { ...idle, special: true }, 1);
    const release = frame(windup, idle, windup.player.strike!.left);
    const shot = release.projectiles[0];
    cases.push({
      id: `${god.id}-projectile`,
      family: 'glyph',
      stage: 'release',
      state: release,
      provenance: controlled,
      expectedShots: 1,
      crop: { x: shot.x - 36, y: shot.y - 26, width: 72, height: 52 },
    });
  }
  function enemyCase(kind: EnemyKind, region: number, index: number) {
    const id = kind === 'boss' ? `guardian-${region}-${index}` : `enemy-${kind}`;
    const state = base(id);
    state.region = region;
    state.room.boss = kind === 'boss';
    state.enemies = [];
    state.player.x = kind === 'hunter' || kind === 'brute' ? 400 : 520;
    spawnEnemy(state, kind, { x: 320, y: 300 });
    state.enemies[0].pattern = index;
    state.enemies[0].cooldown = 0;
    const pattern = kind === 'boss' ? GUARDIANS[region][index] : ENEMY_PATTERNS[kind];
    const windup = frame(state, idle, 1);
    if (windup.enemies[0].windup === 0) throw new Error(`Fixture did not start ${id}`);
    const release = frame(windup, idle, windup.enemies[0].windup);
    const family = kind === 'boss' ? 'guardian' : 'enemy';
    cases.push({
      id: `${id}-windup`,
      family,
      stage: 'windup',
      state: windup,
      provenance: controlled,
    });
    cases.push({
      id: `${id}-release`,
      family,
      stage: 'release',
      state: release,
      provenance: controlled,
      expectedShots: pattern.kind === 'wheel' || pattern.kind === 'volley' ? pattern.count : 0,
    });
  }
  for (const kind of ['hunter', 'archer', 'brute', 'witch'] as const) enemyCase(kind, 0, 0);
  GUARDIANS.forEach((patterns, region) =>
    patterns.forEach((_, index) => enemyCase('boss', region, index)),
  );
  // Independent points specified from the encounter contract, not attackShapes output.
  const probes: Record<string, Probe[]> = {
    'guardian-0-0-windup': [
      { label: 'sweep front', x: 430, y: 300, visible: true },
      { label: 'sweep rear safe', x: 230, y: 300, visible: false },
    ],
    'enemy-witch-windup': [
      { label: 'burst interior', x: 560, y: 340, visible: true },
      { label: 'burst exterior', x: 610, y: 390, visible: false },
    ],
    'guardian-1-0-windup': [
      { label: 'charge corridor', x: 600, y: 300, visible: true },
      { label: 'rounded end cap', x: 680, y: 300, visible: true },
      { label: 'beyond capsule cap', x: 702, y: 300, visible: false },
      { label: 'outside capsule width', x: 480, y: 342, visible: false },
    ],
    'guardian-1-2-windup': [
      { label: 'annulus danger band', x: 440, y: 300, visible: true },
      { label: 'annulus safe hole', x: 350, y: 320, visible: false },
      { label: 'outside annulus', x: 320, y: 540, visible: false },
    ],
    'guardian-2-0-windup': [
      { label: 'cross horizontal arm', x: 150, y: 300, visible: true },
      { label: 'cross vertical arm', x: 520, y: 100, visible: true },
      { label: 'outside cross width', x: 560, y: 340, visible: false },
    ],
    'guardian-3-1-windup': [
      ...[
        [658, 358],
        [507, 449],
        [374, 334],
        [443, 172],
        [619, 187],
      ].map(([x, y], index) => ({ label: `satellite rain ${index + 1}`, x, y, visible: true })),
      { label: 'between rain circles', x: 200, y: 50, visible: false },
    ],
  };
  for (const entry of cases) entry.probes = probes[entry.id];
  for (const kind of ['thorns', 'tide', 'flame', 'void'] as const) {
    const state = base(`hazard-${kind}`);
    state.player.x = 820;
    state.player.y = 500;
    state.room.hazards = [{ kind, x: 420, y: 300, radius: 55, offset: 0 }];
    const timing = hazardTiming(state.room.hazards[0]);
    for (const [stage, tick] of [
      ['idle', 0],
      ['warning', timing.warning + 20],
      ['active', timing.active],
    ] as const) {
      const snapshot = structuredClone(state);
      snapshot.tick = tick;
      cases.push({
        id: `hazard-${kind}-${stage}`,
        family: 'hazard',
        stage,
        state: snapshot,
        provenance: 'Controlled hazard phase fixture; not campaign proof.',
        crop: { x: 300, y: 180, width: 240, height: 240 },
      });
    }
  }
  for (let mask = 1; mask < 8; mask++) {
    const state = base(`status-${mask}`);
    state.player.x = 820;
    state.player.y = 500;
    const enemy = state.enemies[0];
    Object.assign(enemy, {
      x: 420,
      y: 300,
      burn: mask & 1 ? 90 : 0,
      chill: mask & 2 ? 90 : 0,
      exposed: mask & 4 ? 90 : 0,
    });
    const radius = enemy.radius + 8;
    const entry: ParityCase = {
      id: `status-${mask}`,
      family: 'status',
      stage: 'held',
      state,
      provenance: 'Controlled simultaneous-status fixture; not campaign proof.',
      crop: { x: 360, y: 240, width: 120, height: 120 },
      probes: [
        { label: 'burn sector', x: enemy.x + radius, y: enemy.y, visible: !!(mask & 1) },
        {
          label: 'chill sector',
          x: enemy.x - radius / 2,
          y: enemy.y + radius * 0.866,
          visible: !!(mask & 2),
        },
        {
          label: 'expose sector',
          x: enemy.x - radius / 2,
          y: enemy.y - radius * 0.866,
          visible: !!(mask & 4),
        },
      ],
    };
    cases.push(entry);
  }
  const flashing = structuredClone(cases.find((entry) => entry.id === 'status-7')!);
  flashing.id = 'status-all-flash';
  flashing.state.enemies[0].flash = 8;
  flashing.state.enemies[0].stagger = 9;
  cases.push(flashing);
  for (const kind of ['slash', 'burst', 'hit', 'dash', 'heal'] as const) {
    const state = base(`cue-${kind}`);
    state.player.x = 820;
    state.player.y = 500;
    cue(state, { x: 420, y: 300 }, kind, 70, '#e9d7a2', 0, 2);
    cases.push({
      id: `cue-${kind}`,
      family: 'cue',
      stage: 'held',
      state,
      provenance:
        'Controlled cue illustration, including the heal vocabulary; not evidence of a gameplay trigger.',
      crop: { x: 340, y: 220, width: 160, height: 160 },
    });
  }
  const composite = base('composite');
  composite.player.x = 480;
  composite.player.y = 500;
  composite.projectiles = cases
    .filter((entry) => entry.family === 'glyph')
    .map((entry, index) => ({
      ...entry.state.projectiles[0],
      id: 100 + index,
      x: 180 + index * 150,
      y: 170,
    }));
  composite.enemies = [];
  for (const x of [300, 480, 660]) {
    spawnEnemy(composite, 'brute', { x, y: 330 });
    Object.assign(composite.enemies.at(-1)!, { burn: 90, chill: 90, exposed: 90 });
  }
  for (const [index, kind] of (['hit', 'burst', 'dash'] as const).entries())
    cue(composite, { x: 260 + index * 230, y: 440 }, kind, 50, '#e9d7a2');
  cases.push({
    id: 'composite-spells-status',
    family: 'composite',
    stage: 'held',
    state: composite,
    provenance:
      'Combined renderer illustration assembled from five independently command-resolved projectiles and controlled status/cue placements.',
  });
  return cases;
}

function hash(data: Uint8ClampedArray, silhouette = false): string {
  let value = 2166136261;
  if (silhouette) {
    for (let i = 3; i < data.length; i += 4)
      value = Math.imul(value ^ Number(data[i] >= 64), 16777619);
  } else {
    for (const byte of data) value = Math.imul(value ^ byte, 16777619);
  }
  return (value >>> 0).toString(16);
}

/** Inspect the actual decal texture, independently of the mark drawing helpers. */
export function inspectParityMatrix() {
  const group = new T.Group();
  const effects = createGroundEffects(group);
  const mesh = group.children.find(
    (object): object is T.Mesh<T.PlaneGeometry, T.MeshBasicMaterial> => object instanceof T.Mesh,
  )!;
  const canvas = mesh.material.map!.image as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const pictures: { id: string; png: string }[] = [];
  try {
    const cases = createParityCases().map((entry) => {
      const before = JSON.stringify(entry.state);
      effects.sync(entry.state);
      const first = hash(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
      effects.sync(entry.state);
      const second = hash(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
      const crop = entry.crop ?? { x: 0, y: 0, width: 960, height: 600 };
      const pixels = ctx.getImageData(crop.x * 2, crop.y * 2, crop.width * 2, crop.height * 2).data;
      const probes =
        entry.probes?.map((probe) => {
          const data = ctx.getImageData(
            Math.round(probe.x * 2) - 2,
            Math.round(probe.y * 2) - 2,
            5,
            5,
          ).data;
          let alpha = 0;
          for (let i = 3; i < data.length; i += 4) alpha = Math.max(alpha, data[i]);
          return { ...probe, alpha };
        }) ?? [];
      if (
        entry.family === 'glyph' ||
        entry.family === 'cue' ||
        entry.id === 'status-all-flash' ||
        entry.id === 'composite-spells-status' ||
        entry.probes?.length ||
        entry.family === 'hazard'
      )
        pictures.push({ id: entry.id, png: canvas.toDataURL('image/png') });
      return {
        id: entry.id,
        family: entry.family,
        stage: entry.stage,
        provenance: entry.provenance,
        pausedStable: first === second,
        snapshotPure: before === JSON.stringify(entry.state),
        hash: hash(pixels),
        silhouetteHash: hash(pixels, true),
        probes,
        projectiles: entry.state.projectiles.length,
        hostile: entry.state.projectiles.filter((shot) => shot.hostile).length,
        cueKinds: [...new Set(entry.state.cues.map((effect) => effect.kind))],
        windups: entry.state.enemies.filter((enemy) => enemy.windup > 0).length,
        expectedShots: entry.expectedShots,
        expectedCue: entry.expectedCue,
      };
    });
    return { cases, pictures };
  } finally {
    effects.dispose();
  }
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
/** Capture this renderer's synchronously created hero root, then restore immediately. */
function observedScene(canvas: HTMLCanvasElement, unavailable: () => void) {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- explicit apply(this, ...) below and exact prototype restoration.
  const original = T.Object3D.prototype.add;
  let hero: T.Object3D | null = null;
  T.Object3D.prototype.add = function (...objects) {
    for (const object of objects) if (object.name === 'night-passage-authored-hero') hero = object;
    original.apply(this, objects);
    return this;
  };
  try {
    const renderer = createSceneRenderer(canvas, unavailable);
    return {
      renderer,
      ready: () => hero?.visible === true && !!hero.getObjectByName('weapon_sword'),
    };
  } finally {
    T.Object3D.prototype.add = original;
  }
}
async function waitForNative(observed: ReturnType<typeof observedScene>, state: State) {
  const deadline = performance.now() + 10000;
  do {
    observed.renderer.draw(state);
    if (performance.now() > deadline) throw new Error('Native parity actors failed to activate');
    await nextFrame();
  } while (!observed.ready());
}
let arena: {
  canvas: HTMLCanvasElement;
  renderer: ReturnType<typeof createSceneRenderer>;
  state: State;
} | null = null;
/** Test-only surface; no product globals or development UI. */
export async function mountParityArena(id: string) {
  disposeParityArena();
  const state = createParityCases().find((entry) => entry.id === id)!.state;
  const canvas = document.createElement('canvas');
  canvas.id = 'night-passage-parity-arena';
  Object.assign(canvas.style, {
    width: '960px',
    height: '600px',
    position: 'fixed',
    left: '0',
    top: '0',
    zIndex: '99999',
  });
  document.body.append(canvas);
  const observed = observedScene(canvas, () => {
    throw new Error('Parity arena lost its WebGL context');
  });
  const renderer = observed.renderer;
  arena = { canvas, renderer, state };
  await waitForNative(observed, state);
  return JSON.stringify(state);
}
export function redrawParityArena() {
  if (!arena) throw new Error('No parity arena');
  arena.renderer.draw(arena.state);
  return JSON.stringify(arena.state);
}
export function disposeParityArena() {
  if (!arena) return;
  arena.canvas.remove();
  arena.renderer.dispose();
  arena = null;
}

/** Fast-forwarded legal commands with rendered chapter checkpoints, not realtime human play. */
export async function inspectCampaignTraversal() {
  const pictures: { id: string; png: string; hash: string }[] = [];
  const campaigns = [];
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    width: '960px',
    height: '600px',
    position: 'fixed',
    top: '0',
    left: '0',
  });
  document.body.append(canvas);
  const observed = observedScene(canvas, () => {
    throw new Error('Campaign renderer lost context');
  });
  const renderer = observed.renderer;
  const probe = document.createElement('canvas');
  probe.width = 96;
  probe.height = 60;
  const ctx = probe.getContext('2d')!;
  function painted(state: State) {
    const snapshot = structuredClone(state);
    const before = JSON.stringify(snapshot);
    renderer.draw(snapshot);
    ctx.drawImage(canvas, 0, 0, probe.width, probe.height);
    const pixels = ctx.getImageData(0, 0, probe.width, probe.height).data;
    const colors = new Set<number>();
    for (let i = 0; i < pixels.length; i += 4)
      colors.add((pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2]);
    return { colors: colors.size, hash: hash(pixels), pure: before === JSON.stringify(snapshot) };
  }
  try {
    for (const weapon of WEAPONS) {
      let state = applyCommand(createGame('passage-verification'), {
        type: 'start',
        weapon: weapon.id,
        runes: ['vigor', 'fleet'],
      }).state;
      const entries = new Set<string>(),
        regions = new Set<number>(),
        bosses = new Set<number>();
      let commands = 0,
        snapshotsPure = true,
        rendered = 0;
      const checkpoints: { key: string; colors: number; hash: string }[] = [];
      if (weapon.id === 'sword') await waitForNative(observed, state);
      while (state.phase !== 'won' && state.phase !== 'lost' && commands < 20000) {
        const key = `${state.region}:${state.chamber}`;
        if (!entries.has(key)) {
          entries.add(key);
          regions.add(state.region);
          if (state.room.boss) bosses.add(state.region);
          const before = JSON.stringify(state);
          await nextFrame();
          const pixels = painted(state);
          checkpoints.push({ key, colors: pixels.colors, hash: pixels.hash });
          snapshotsPure &&= pixels.pure && before === JSON.stringify(state);
          rendered++;
          if (weapon.id === 'sword' && state.chamber === 0)
            pictures.push({
              id: `campaign-region-${state.region}`,
              png: canvas.toDataURL('image/png'),
              hash: pixels.hash,
            });
        }
        const result = applyCommand(state, passageCommand(state));
        if (result.error) throw new Error(result.error);
        state = result.state;
        commands++;
      }
      const before = JSON.stringify(state);
      const ending = painted(state);
      checkpoints.push({ key: state.phase, colors: ending.colors, hash: ending.hash });
      rendered++;
      snapshotsPure &&= ending.pure && before === JSON.stringify(state);
      campaigns.push({
        weapon: weapon.id,
        phase: state.phase,
        entries: entries.size,
        regions: [...regions],
        bosses: [...bosses],
        rendered,
        commands,
        snapshotsPure,
        checkpoints,
      });
    }
    return {
      campaigns,
      pictures,
      provenance:
        'Regenerated legal-command fast-forward campaigns; 32 chamber entries and ending rendered per weapon. Not a realtime human browser playthrough.',
    };
  } finally {
    canvas.remove();
    renderer.dispose();
  }
}
