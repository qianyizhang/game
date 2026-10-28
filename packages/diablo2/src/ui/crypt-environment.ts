import type { RegionDef, World } from '../domain/types';

// Slate masonry, worn limestone and recessed joints. All marks stay in their cell:
// the existing terrain cache and fog mask retain ownership of the whole surface.
const stone = {
  mass: '#252c35',
  cap: ['#34404b', '#38434d', '#323e49'],
  edge: '#75818a',
  face: '#46535e',
  joint: '#2b3540',
  floor: ['#353f49', '#38424c', '#323d47'],
  road: ['#454e56', '#424c54', '#475058'],
};
function plane(ctx: CanvasRenderingContext2D, points: number[][], color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}

/** Cell-local drawing, called only while building the existing static terrain image. */
export function drawCryptCell(
  ctx: CanvasRenderingContext2D,
  world: Pick<World, 'tiles'>,
  x: number,
  y: number,
  size: number,
  open: boolean,
) {
  const glyph = world.tiles[y][x];
  ctx.save();
  ctx.translate(x * size, y * size);
  if (open) {
    const road = glyph === '=',
      offset = y % 2,
      span = y % 3 === 0 ? 3 : 2,
      slab = Math.floor((x + offset) / span),
      tone = ((slab * 13 + y * 7) % 11) % 3;
    ctx.fillStyle = (road ? stone.road : stone.floor)[tone];
    ctx.fillRect(0, 0, size, size);
    // Long running-bond slabs, without the former alternating checker highlights.
    ctx.fillStyle = stone.joint;
    ctx.fillRect(0, size - 1, size, 1);
    if ((x + offset) % span === 0) ctx.fillRect(0, 0, 1, size);
    ctx.fillStyle = road ? '#7b858755' : '#74818a30';
    ctx.fillRect(1, 0, size - 1, 2);
    // Sparse, shallow chips; quiet slab centers leave room for combat cues.
    if ((x + offset) % span === 0 && (slab * 7 + y * 3) % 13 === 0) {
      plane(
        ctx,
        [
          [3, 1],
          [9, 1],
          [5, 4],
        ],
        '#28343d',
      );
    }
  } else {
    const solid = (dx: number, dy: number) => '#^'.includes(world.tiles[y + dy]?.[x + dx] ?? '#');
    const north = !solid(0, -1),
      south = !solid(0, 1),
      west = !solid(-1, 0),
      east = !solid(1, 0),
      bottom = south ? size - 10 : size;
    ctx.fillStyle = stone.mass;
    ctx.fillRect(0, 0, size, size);
    // Joined cap, chamfered only where exposed edges meet. No individual wall stamps.
    plane(
      ctx,
      [
        [west ? 3 : 0, north ? 3 : 0],
        [east ? size - 3 : size, north ? 3 : 0],
        [size, north && east ? 6 : 0],
        [size, bottom - (south && east ? 3 : 0)],
        [east ? size - 3 : size, bottom],
        [west ? 3 : 0, bottom],
        [0, bottom - (south && west ? 3 : 0)],
        [0, north && west ? 6 : 0],
      ],
      stone.cap[(Math.floor((x + (y % 2)) / 3) * 7 + y) % 3],
    );
    // Recessed courses cross cells, so a wall reads as masonry rather than stamps.
    ctx.fillStyle = '#1b29334a';
    ctx.fillRect(0, 0, size, 1);
    if ((x + (y % 2)) % 3 === 0) ctx.fillRect(0, 0, 1, bottom);
    if (north) {
      ctx.fillStyle = stone.edge;
      ctx.fillRect(west ? 4 : 0, 3, size - (west ? 4 : 0) - (east ? 4 : 0), 2);
    }
    if (west) {
      ctx.fillStyle = '#89959b77';
      ctx.fillRect(2, north ? 6 : 0, 2, bottom - (north ? 6 : 0));
    }
    if (east) {
      ctx.fillStyle = '#17222d66';
      ctx.fillRect(size - 3, north ? 6 : 0, 3, bottom - (north ? 6 : 0));
    }
    if (south) {
      ctx.fillStyle = stone.face;
      ctx.fillRect(0, bottom + 1, size, 7);
      ctx.fillStyle = stone.edge;
      ctx.fillRect(west ? 3 : 0, bottom, size - (west ? 3 : 0) - (east ? 3 : 0), 2);
      ctx.fillStyle = '#111c27';
      ctx.fillRect(0, size - 2, size, 2);
      if (x % 2 === y % 2) {
        ctx.fillStyle = stone.joint;
        ctx.fillRect(15, bottom + 2, 1, 6);
      }
    }
  }
  ctx.restore();
}

/** Existing decorative footprints only; no collision or actor geometry. */
export function drawCryptProp(
  ctx: CanvasRenderingContext2D,
  kind: RegionDef['landmarks'][number]['kind'],
): boolean {
  if (kind === 'altar') {
    // Heavy burial slab, recessed chest and two fitted feet, not another column.
    plane(
      ctx,
      [
        [-21, 10],
        [15, 7],
        [25, 14],
        [16, 19],
        [-19, 17],
      ],
      '#101b2466',
    );
    ctx.fillStyle = '#434f59';
    ctx.fillRect(-15, 6, 7, 9);
    ctx.fillRect(8, 6, 7, 9);
    plane(
      ctx,
      [
        [-18, -4],
        [15, -4],
        [17, 9],
        [-17, 9],
      ],
      '#55636b',
    );
    plane(
      ctx,
      [
        [15, -4],
        [20, -9],
        [20, 4],
        [17, 9],
      ],
      '#34424e',
    );
    plane(
      ctx,
      [
        [-22, -8],
        [15, -8],
        [23, -14],
        [-14, -14],
      ],
      '#8c9695',
    );
    plane(
      ctx,
      [
        [-22, -8],
        [15, -8],
        [15, -3],
        [-22, -3],
      ],
      '#687780',
    );
    plane(
      ctx,
      [
        [15, -8],
        [23, -14],
        [23, -9],
        [15, -3],
      ],
      '#475661',
    );
    plane(
      ctx,
      [
        [-15, -10],
        [11, -10],
        [15, -12],
        [-11, -12],
      ],
      '#67767b',
    );
    ctx.fillStyle = '#35444e';
    ctx.fillRect(-11, 0, 22, 5);
    ctx.fillStyle = '#7c898b';
    ctx.fillRect(-11, 0, 22, 1);
    return true;
  }
  if (kind === 'bones') {
    // Small weathered remains, kept duller than living skeletons and cold impacts.
    plane(
      ctx,
      [
        [-14, 3],
        [9, 0],
        [15, 8],
        [-9, 10],
      ],
      '#14232d55',
    );
    ctx.strokeStyle = '#9b9e90';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, 5);
    ctx.lineTo(6, -2);
    ctx.moveTo(-8, -3);
    ctx.lineTo(12, 7);
    ctx.moveTo(-2, 4);
    ctx.lineTo(3, 10);
    ctx.stroke();
    plane(
      ctx,
      [
        [-2, -5],
        [2, -8],
        [7, -7],
        [9, -3],
        [5, 1],
        [0, -1],
      ],
      '#a8aa9a',
    );
    ctx.fillStyle = '#38464b';
    ctx.fillRect(3, -5, 3, 2);
    return true;
  }
  if (kind !== 'pillar' && kind !== 'ruin') return false;
  plane(
    ctx,
    [
      [-15, 10],
      [8, 5],
      [20, 12],
      [12, 17],
      [-13, 16],
    ],
    '#101b2466',
  );
  plane(
    ctx,
    [
      [-14, 6],
      [9, 6],
      [14, 10],
      [10, 14],
      [-14, 14],
    ],
    '#424d56',
  );
  plane(
    ctx,
    [
      [-14, 5],
      [10, 5],
      [14, 9],
      [-10, 9],
    ],
    '#7b8587',
  );
  // Tapered octagonal shaft: one lit plane, one broad middle, one narrow shadow.
  plane(
    ctx,
    [
      [-9, -24],
      [-4, -27],
      [-4, 6],
      [-9, 9],
    ],
    '#737f83',
  );
  plane(
    ctx,
    [
      [-4, -27],
      [6, -26],
      [7, 6],
      [-4, 6],
    ],
    '#57656e',
  );
  plane(
    ctx,
    [
      [6, -26],
      [10, -22],
      [11, 8],
      [7, 6],
    ],
    '#374550',
  );
  plane(
    ctx,
    [
      [-12, -28],
      [7, -30],
      [13, -26],
      [9, -22],
      [-12, -23],
    ],
    '#65727a',
  );
  plane(
    ctx,
    [
      [-12, -28],
      [7, -30],
      [13, -26],
      [-6, -25],
    ],
    '#8b9493',
  );
  ctx.fillStyle = '#38464e';
  ctx.fillRect(-3, -17, 3, 16);
  ctx.fillStyle = '#88939066';
  ctx.fillRect(-4, -17, 1, 16);
  return true;
}
