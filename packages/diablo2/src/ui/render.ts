import type { Content, Point, State, Enemy, Ally, Player } from '../domain/types';
import { distance, HEIGHT, lineOfSight, WIDTH } from '../domain/maps';
export const VIEW_WIDTH = 960,
  VIEW_HEIGHT = 576,
  TILE = 32;
export function camera(state: State): Point {
  return {
    x: Math.max(0, Math.min(WIDTH - VIEW_WIDTH / TILE, state.player.x - VIEW_WIDTH / TILE / 2)),
    y: Math.max(0, Math.min(HEIGHT - VIEW_HEIGHT / TILE, state.player.y - VIEW_HEIGHT / TILE / 2)),
  };
}
export function screenToWorld(state: State, x: number, y: number): Point {
  const c = camera(state);
  return { x: x / TILE + c.x, y: y / TILE + c.y };
}
const palette = {
  marsh: { floor: '#283b32', wall: '#152a24', light: '#354c3e', accent: '#a0b875' },
  desert: { floor: '#64533c', wall: '#302b29', light: '#786046', accent: '#e9be76' },
  crypt: { floor: '#343b48', wall: '#1e2430', light: '#444b59', accent: '#a2bad5' },
  inferno: { floor: '#493432', wall: '#251f24', light: '#60403a', accent: '#ee8d65' },
};
function polygon(ctx: CanvasRenderingContext2D, points: number[][], color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}
export function figure(
  ctx: CanvasRenderingContext2D,
  kind: string,
  color: string,
  scale = 1,
  time = 0,
): void {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.fillStyle = '#0007';
  ctx.beginPath();
  ctx.ellipse(0, 9, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const sway = Math.sin(time) * 1.2;
  if (kind === 'beast') {
    polygon(
      ctx,
      [
        [-13, 4],
        [-10, -7],
        [-2, -10],
        [7, -5],
        [15, -3],
        [12, 3],
        [5, 5],
        [0, 8],
      ],
      color,
    );
    polygon(
      ctx,
      [
        [-10, 1],
        [-12, 12],
        [-7, 11],
        [-4, 3],
        [5, 1],
        [7, 12],
        [12, 10],
        [10, 2],
      ],
      '#63574c',
    );
    polygon(
      ctx,
      [
        [7, -6],
        [10, -12],
        [14, -6],
        [17, -2],
        [10, 0],
      ],
      color,
    );
    ctx.fillStyle = '#f7d68e';
    ctx.fillRect(12, -5, 3, 2);
  } else if (kind === 'skeleton') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(0, 7);
    ctx.lineTo(-7, 13);
    ctx.moveTo(0, 7);
    ctx.lineTo(7, 13);
    ctx.moveTo(-9, 3 + sway);
    ctx.lineTo(0, -2);
    ctx.lineTo(8, 2 - sway);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(-5, -13, 10, 9);
    ctx.fillStyle = '#263034';
    ctx.fillRect(-3, -10, 2, 2);
    ctx.fillRect(1, -10, 2, 2);
  } else {
    const broad = kind === 'barbarian' || kind === 'demon';
    polygon(
      ctx,
      [
        [-(broad ? 12 : 8), -5],
        [0, -9],
        [broad ? 12 : 8, -5],
        [8, 12],
        [-8, 12],
      ],
      color,
    );
    polygon(
      ctx,
      [
        [-8, 2],
        [0, 0],
        [7, 13],
        [1, 13],
        [-2, 5],
        [-6, 13],
        [-11, 12],
      ],
      '#262a32',
    );
    ctx.fillStyle = kind === 'necromancer' ? '#d5d0b3' : '#d1b394';
    ctx.fillRect(-4, -15, 8, 9);
    polygon(
      ctx,
      [
        [-5, -11],
        [-5, -17],
        [1, -20],
        [6, -13],
        [3, -10],
      ],
      kind === 'barbarian' ? '#8c6b47' : color,
    );
    ctx.strokeStyle = broad ? '#d9caa5' : '#af9371';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(11, 8);
    ctx.lineTo(11, -16);
    ctx.stroke();
    if (broad) {
      polygon(
        ctx,
        [
          [9, -16],
          [18, -14],
          [17, -7],
          [10, -9],
        ],
        '#b8bdba',
      );
      ctx.fillStyle = '#c1b18e';
      ctx.fillRect(-12, -3, 5, 7);
    } else {
      ctx.fillStyle = kind === 'sorceress' ? '#efac69' : '#b6d4ab';
      ctx.beginPath();
      ctx.arc(11, -15, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (kind === 'demon') {
      polygon(
        ctx,
        [
          [-5, -14],
          [-11, -24],
          [-12, -12],
          [-7, -8],
        ],
        '#d9b382',
      );
      polygon(
        ctx,
        [
          [4, -14],
          [10, -24],
          [12, -12],
          [7, -8],
        ],
        '#d9b382',
      );
    }
  }
  ctx.restore();
}
export function render(
  canvas: HTMLCanvasElement,
  state: State,
  content: Content,
  showMap: boolean,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const world = state.worlds[state.act];
  const map = content.maps[state.act];
  const colors = palette[map.theme];
  const c = camera(state);
  const known = new Set(world.seen);
  const sx = (x: number) => (x - c.x) * TILE,
    sy = (y: number) => (y - c.y) * TILE;
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = '#0d1214';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  for (let y = Math.floor(c.y); y < Math.min(HEIGHT, c.y + VIEW_HEIGHT / TILE + 1); y++)
    for (let x = Math.floor(c.x); x < Math.min(WIDTH, c.x + VIEW_WIDTH / TILE + 1); x++) {
      const seen = known.has(y * WIDTH + x);
      const adjacent =
        seen ||
        [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dx, dy]) => known.has((y + dy) * WIDTH + x + dx));
      if (!adjacent) continue;
      const px = sx(x),
        py = sy(y);
      const hash = (x * 17 + y * 31) % 11;
      if (world.tiles[y][x] === '.') {
        ctx.fillStyle = hash < 3 ? colors.light : colors.floor;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = '#00000018';
        ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
        if (hash === 3) {
          ctx.fillStyle = '#ffffff09';
          ctx.fillRect(px + 7, py + 18, 12, 2);
          ctx.fillRect(px + 20, py + 6, 5, 3);
        }
        if (map.theme === 'inferno' && hash === 7) {
          ctx.strokeStyle = '#dc754955';
          ctx.beginPath();
          ctx.moveTo(px + 2, py + 7);
          ctx.lineTo(px + 13, py + 15);
          ctx.lineTo(px + 8, py + 23);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = colors.wall;
        ctx.fillRect(px, py, TILE, TILE);
        if (map.theme === 'marsh') {
          polygon(
            ctx,
            [
              [px + 2, py + 25],
              [px + 8, py + 3],
              [px + 17, py - 8],
              [px + 28, py + 19],
            ],
            '#233f30',
          );
          polygon(
            ctx,
            [
              [px + 8, py + 24],
              [px + 18, py + 3],
              [px + 29, py + 24],
            ],
            '#2b4935',
          );
        } else {
          ctx.fillStyle = colors.light;
          ctx.fillRect(px + 2, py + 2, 28, 18);
          ctx.fillStyle = '#0004';
          ctx.fillRect(px, py + 22, TILE, 10);
          ctx.strokeStyle = '#ffffff0a';
          ctx.strokeRect(px + 3, py + 3, 26, 16);
        }
      }
      if (
        distance(state.player, { x: x + 0.5, y: y + 0.5 }) > 7 ||
        !lineOfSight(world, state.player, { x: x + 0.5, y: y + 0.5 })
      ) {
        ctx.fillStyle = '#090c1288';
        ctx.fillRect(px, py, TILE, TILE);
      }
    }
  const visible = (p: Point) => known.has(Math.floor(p.y) * WIDTH + Math.floor(p.x));
  const marker = (p: Point, label: string, color: string, shape: 'ward' | 'chest' | 'portal') => {
    if (!visible(p)) return;
    const x = sx(p.x),
      y = sy(p.y);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#0006';
    ctx.beginPath();
    ctx.ellipse(0, 9, 13, 5, 0, 0, 7);
    ctx.fill();
    if (shape === 'ward') {
      polygon(
        ctx,
        [
          [-7, 9],
          [-6, -11],
          [0, -18],
          [7, -9],
          [6, 9],
        ],
        '#8b8779',
      );
      ctx.fillStyle = color;
      ctx.fillRect(-2, -10, 4, 10);
    } else if (shape === 'chest') {
      ctx.fillStyle = '#9d7c4a';
      ctx.fillRect(-11, -3, 22, 14);
      ctx.strokeStyle = '#d3b777';
      ctx.strokeRect(-11, -3, 22, 14);
      ctx.fillStyle = '#e9d1a0';
      ctx.fillRect(-2, 0, 4, 6);
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -3, 12, 19, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0dfc4';
    ctx.fillText(label, 0, 26);
    ctx.restore();
  };
  map.seals.forEach((p, i) =>
    marker(
      p,
      world.seals[i] ? 'Lit ward' : 'Ward · F',
      world.seals[i] ? '#f1c47c' : '#6b91af',
      'ward',
    ),
  );
  map.chests.forEach((p, i) => {
    if (!world.chests[i]) marker(p, 'Cache · F', '#c0a266', 'chest');
  });
  marker(map.waypoint, 'Waypoint · F', '#79c9da', 'portal');
  marker(map.exit, world.bossDefeated ? 'Road onward · F' : 'Sealed road', '#dda76e', 'portal');
  if (state.player.corpse?.act === state.act)
    marker(state.player.corpse.position, 'Your grave · F', '#a9bbc9', 'ward');
  for (const h of world.hazards) {
    ctx.beginPath();
    ctx.arc(sx(h.x), sy(h.y), h.radius * TILE, 0, Math.PI * 2);
    ctx.fillStyle = h.delay > 0 ? '#e9a34322' : '#ff754f88';
    ctx.fill();
    ctx.strokeStyle = h.delay > 0 ? '#f6bd6b' : '#ff855d';
    ctx.lineWidth = 2;
    ctx.setLineDash(h.delay > 0 ? [5, 4] : []);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  for (const drop of world.drops)
    if (visible(drop)) {
      const color =
        drop.kind === 'item'
          ? drop.item?.rarity === 'unique'
            ? '#d9ab62'
            : drop.item?.rarity === 'rare'
              ? '#e6d66c'
              : '#90b8e4'
          : drop.kind === 'health'
            ? '#dc7b74'
            : drop.kind === 'mana'
              ? '#7ba4df'
              : '#d6b57c';
      polygon(
        ctx,
        [
          [sx(drop.x) - 5, sy(drop.y)],
          [sx(drop.x), sy(drop.y) - 5],
          [sx(drop.x) + 5, sy(drop.y)],
          [sx(drop.x), sy(drop.y) + 5],
        ],
        color,
      );
      if (drop.kind === 'item') {
        ctx.fillStyle = color;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(drop.item?.name ?? 'Loot', sx(drop.x), sy(drop.y) - 10);
      }
    }
  const entities: { entity: Enemy | Ally | Player; ally: boolean }[] = [
    ...world.enemies
      .filter(
        (e) => e.hp > 0 && distance(e, state.player) < 8 && lineOfSight(world, state.player, e),
      )
      .map((e) => ({ entity: e, ally: false })),
    ...world.allies.map((a) => ({ entity: a, ally: true })),
    { entity: state.player, ally: true },
  ].sort((a, b) => a.entity.y - b.entity.y);
  for (const { entity, ally } of entities) {
    const hero = entity === state.player;
    const enemy = 'kind' in entity ? entity : null;
    const def = enemy ? content.monsters.find((m) => m.id === enemy.kind) : null;
    const h = content.heroes.find((h) => h.id === state.hero)!;
    ctx.save();
    ctx.translate(sx(entity.x), sy(entity.y));
    if (hero) {
      ctx.strokeStyle = '#d8c494';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 10, 13, 6, 0, 0, 7);
      ctx.stroke();
    }
    figure(
      ctx,
      hero ? h.id : ally ? 'skeleton' : def!.shape,
      hero ? h.color : ally ? '#bbd7a3' : def!.color,
      enemy?.boss ? 1.85 : enemy?.elite ? 1.2 : 1,
      state.tick * 0.45,
    );
    if (enemy) {
      const w = enemy.boss ? 64 : 27;
      ctx.fillStyle = '#161717';
      ctx.fillRect(-w / 2, -(enemy.boss ? 46 : 27), w, 4);
      ctx.fillStyle = enemy.boss ? '#dd8062' : enemy.elite ? '#d2b064' : '#a77972';
      ctx.fillRect(-w / 2, -(enemy.boss ? 46 : 27), (w * enemy.hp) / enemy.maxHp, 4);
      if (enemy.boss || enemy.elite) {
        ctx.fillStyle = enemy.elite ? '#e4bf79' : '#edc8b0';
        ctx.textAlign = 'center';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${enemy.elite ? 'Elite ' : ''}${def!.name}`, 0, -(enemy.boss ? 53 : 32));
      }
      if (enemy.boss && !world.seals.every(Boolean)) {
        ctx.strokeStyle = '#99bed4';
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, 7);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  for (const shot of world.projectiles) {
    ctx.strokeStyle =
      shot.element === 'fire'
        ? '#ffb579'
        : shot.element === 'cold'
          ? '#97d9eb'
          : shot.friendly
            ? '#e0e0b7'
            : '#ee8a77';
    ctx.lineWidth = shot.pierce ? 4 : 3;
    ctx.beginPath();
    ctx.moveTo(sx(shot.x - shot.dx * 0.4), sy(shot.y - shot.dy * 0.4));
    ctx.lineTo(sx(shot.x), sy(shot.y));
    ctx.stroke();
  }
  const gradient = ctx.createRadialGradient(
    VIEW_WIDTH / 2,
    VIEW_HEIGHT / 2,
    130,
    VIEW_WIDTH / 2,
    VIEW_HEIGHT / 2,
    550,
  );
  gradient.addColorStop(0, '#0000');
  gradient.addColorStop(1, '#050a1244');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  if (showMap) {
    const size = 5,
      ox = VIEW_WIDTH - WIDTH * size - 18,
      oy = 18;
    ctx.fillStyle = '#0a1013de';
    ctx.fillRect(ox - 8, oy - 8, WIDTH * size + 16, HEIGHT * size + 32);
    for (const cell of world.seen) {
      const x = cell % WIDTH,
        y = Math.floor(cell / WIDTH);
      ctx.fillStyle = colors.light;
      ctx.fillRect(ox + x * size, oy + y * size, size - 1, size - 1);
    }
    const dot = (p: Point, color: string) => {
      if (visible(p)) {
        ctx.fillStyle = color;
        ctx.fillRect(ox + p.x * size - 2, oy + p.y * size - 2, 4, 4);
      }
    };
    map.seals.forEach((p, i) => dot(p, world.seals[i] ? '#e9ba78' : '#8dacbf'));
    dot(map.waypoint, '#77cadd');
    dot(map.exit, '#cf8068');
    dot(state.player, '#fff4cf');
    ctx.fillStyle = '#c8bfaa';
    ctx.font = '10px sans-serif';
    ctx.fillText('TAB · map     blue: ward / waypoint', ox, oy + HEIGHT * size + 17);
  }
}
