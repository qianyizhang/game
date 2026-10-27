type CryptMonster = 'archer' | 'wraith' | 'bellkeeper';
type Paint =
  | 'ink'
  | 'bone'
  | 'pale'
  | 'boneShade'
  | 'cloth'
  | 'clothLight'
  | 'clothShade'
  | 'metal'
  | 'metalLight'
  | 'metalShade'
  | 'glow';
type Layer = readonly [
  path: string,
  fill: Paint | 'none',
  stroke?: Paint,
  width?: number,
  moving?: 'bow' | 'bell',
];

// Original vector drawings in the existing figure's ground-centred coordinate system.
// Broad connected forms carry identity; small cuts describe bone, cloth and bronze.
const drawings: Record<CryptMonster, readonly Layer[]> = {
  archer: [
    ['M-7-13Q-12-10-12-2L-16 10-11 7-10 13-6 8-3 10 2-1Z', 'clothShade', 'ink'],
    ['M-9-10-11 1-14 8-10 5-9 10-5 5-3-4Z', 'cloth'],
    ['M-10-7-11 3M-8-2-9 6', 'none', 'clothLight', 0.6],
    ['M-3 1-1 5-6 9-7 12-11 13-11 11-8 10-7 6-5 2Z', 'boneShade', 'ink'],
    ['M-4 3-3 5-7 8-8 11-10 11-7 6Z', 'bone'],
    ['M0 2 4 4 4 8 7 11 7 13 2 13 1 11 3 11 1 8-1 6-3 3Z', 'bone', 'ink'],
    ['M1 5 2 8 5 12M-8 12-5 12', 'none', 'pale', 0.6],
    ['M-6-8Q-3-13 1-9L4-1 1 4-5 4-8-1Z', 'boneShade', 'ink'],
    ['M-5-9-2-10 1-8 1-2-2 1-5-1Z', 'ink'],
    ['M-7-7-3-6-1-8M-7-4-3-3 0-5M-6-1-3 0 0-2M-3-9-2 1', 'none', 'bone', 1.1],
    ['M-5 1-2 2 1 0 3 2 0 5-4 4-6 2Z', 'bone', 'ink', 0.5],
    ['M-7-9-10-6-8-3-4-4 2-7 3-6-4-2-9-1-13-5-11-9Z', 'boneShade', 'ink'],
    ['M-10-8-11-5-8-3-4-4 1-7M-7-10-3-11', 'none', 'pale', 0.8],
    ['M1-10 5-9 8-5 13-8 14-7 9-2 6-3 2-7-1-7Z', 'bone', 'ink', 0.65, 'bow'],
    ['M3-9 6-7 7-4 12-7', 'none', 'pale', 0.7, 'bow'],
    ['M14-21Q24-8 17 10L15 8Q21-7 13-20Z', 'metal', 'ink', 0.7, 'bow'],
    ['M14-20Q21-8 17 7M14-20 2-6 17 8', 'none', 'metalLight', 0.55, 'bow'],
    ['M0-6 22-9 19-10 20-8 22-9M1-6-2-8M1-6-2-5', 'none', 'bone', 0.6, 'bow'],
    ['M12-9 15-9 15-6 12-5 11-7Z', 'bone', 'ink', 0.45, 'bow'],
    ['M-5-13-6-17-3-21 2-20 5-16 3-12-1-10Z', 'boneShade', 'ink'],
    ['M-5-17-3-20 1-19 3-16 1-14-2-14-2-12-4-13Z', 'bone'],
    ['M-4-18-2-19 1-18M-4-12-2-11 1-12', 'none', 'pale', 0.65],
    ['M-4-16-1-17 0-15-2-14-4-14ZM1-15 3-16 3-14 1-13ZM-1-14 0-12-2-12Z', 'ink'],
    ['M-3-12 1-13 2-11-1-10-3-11Z', 'bone', 'ink', 0.4],
    ['M-1-12-1-11M1-12 0-11', 'none', 'boneShade', 0.45],
    ['M-7-15-7-19-3-21 2-20 4-19-2-20-5-17-5-13Z', 'cloth', 'ink', 0.55],
  ],
  wraith: [
    ['M-3-21Q5-18 6-14L11-8 9 0 14 12 7 9 3 15-1 10-6 13-5 7-12 10-9-1-11-8Z', 'clothShade', 'ink'],
    ['M-3-20Q2-19 3-15L8-9 4-2 8 10 3 7 1 12-2 7-5 10-3 0-7-8Z', 'cloth'],
    ['M2-9 5-5 2 1 5 8 1 5-1-1Z', 'clothLight'],
    ['M-7-8-5-12-1-13 4-10 3-4-1-3-5-5Z', 'ink'],
    ['M-6-10-3-13 0-13 3-10 1-6-3-5-5-7Z', 'boneShade', 'ink', 0.5],
    ['M-5-10-3-12 0-12 1-10-1-8-4-8Z', 'bone'],
    ['M-5-9-3-10-2-8-4-7ZM0-10 2-9 1-7-1-8Z', 'ink'],
    ['M-4-8-3-8M0-8 1-8', 'none', 'glow', 0.5],
    ['M-3-6 0-7 1-5-2-4-4-5Z', 'bone', 'ink', 0.4],
    ['M-8-6-11-3-14-5-15-2-12 0-9-1-6-4Z', 'cloth', 'ink'],
    ['M-14-5-15-7-17-6-17-3-15-1-12-1-12-3-14-3Z', 'boneShade', 'ink', 0.5],
    ['M-16-6-16-3M-14-4-15-2', 'none', 'pale', 0.6],
    ['M5-8 9-7 12-3 10 1 6-2 4-5Z', 'clothShade', 'ink'],
    ['M10-2 12-1 11 2 8 4 7 3 9 1 8-1Z', 'bone', 'ink', 0.5],
    ['M-2-2-4 4-6 7M1 2 3 9M7-8 8-4', 'none', 'clothLight', 0.65],
    ['M-8 4-7 8M8 5 10 9', 'none', 'cloth', 0.8],
    ['M-4-19-1-17 3-15M-7-10-9-7', 'none', 'clothLight', 0.7],
  ],
  bellkeeper: [
    ['M-9-16-14-11-13 0-17 9-10 7-11 13-4 9 1 12 8 9 5 1 11-8 8-15-1-20Z', 'clothShade', 'ink'],
    ['M-12-10-10-15-3-18 4-16 8-10 3-5-5-6-8 4-12 8-10-1Z', 'cloth'],
    ['M-10-13-6-17 0-17 3-14-3-13-6-9Z', 'clothLight'],
    ['M-7 1-2 2-3 7-7 11-8 13-13 13-13 11-10 9-10 5Z', 'boneShade', 'ink'],
    ['M-8 4-5 4-6 7-10 11-11 11Z', 'bone'],
    ['M0 2 4 3 5 8 8 11 8 13 2 13 0 11 2 10 0 7-2 4Z', 'bone', 'ink'],
    ['M-11 12-7 12M3 12 6 12', 'none', 'pale', 0.65],
    ['M-8-8-2-12 4-8 3 1-1 5-7 3-10-2Z', 'boneShade', 'ink'],
    ['M-6-8-2-9 1-7 0 0-4 2-7-1Z', 'ink'],
    ['M-8-6-4-4-1-6M-8-3-4-1 0-3M-6 0-3 2 0 0M-3-8-2 1', 'none', 'bone', 1.1],
    ['M-6 3-2 4 1 2 3 4 1 7-5 6Z', 'metalShade', 'ink'],
    ['M-7 4-2 5 0 4 1 10-4 9-6 12Z', 'clothShade', 'ink', 0.5],
    ['M-10-11-14-8-13-2-10 0-8-3-10-5-8-8Z', 'bone', 'ink'],
    ['M-13-7-12-3-10-2M-10-10-12-9', 'none', 'pale', 0.6],
    ['M4-10 8-11 12-7 13-3 10-1 7-6 3-6Z', 'boneShade', 'ink', 0.65, 'bell'],
    ['M6-9 9-8 11-4', 'none', 'bone', 1.2, 'bell'],
    ['M-10-13-5-15 0-13-1-9-8-10Z', 'metalShade', 'ink'],
    ['M-9-13-5-14-2-12-3-10-8-11Z', 'metal'],
    ['M-3-17-4-21 0-23 5-21 6-17 3-13 0-12-3-14Z', 'boneShade', 'ink'],
    ['M-2-20 0-22 4-20 4-17 1-16-2-17Z', 'bone'],
    ['M-2-20 1-21 3-20M-1-14 2-14', 'none', 'pale', 0.7],
    ['M-2-18 1-19 1-17-1-16ZM3-19 5-18 4-16 2-17ZM1-16 2-14 0-14Z', 'ink'],
    ['M-1-14 3-15 4-13 1-12-1-13Z', 'bone', 'ink', 0.4],
    ['M1-15 1-13M3-14 2-13', 'none', 'boneShade', 0.5],
    ['M12-4Q13-8 16-6L17-2 15-1 14-4Z', 'metal', 'ink', 0.7, 'bell'],
    ['M13-2 17-2Q17 3 20 7L11 9 8 6Q12 2 13-2Z', 'metalShade', 'ink', 0.8, 'bell'],
    ['M13-1 16-1Q16 3 18 6L11 7Q13 3 13-1Z', 'metal', undefined, 0.65, 'bell'],
    ['M14 0 15 0 16 5 13 6Z', 'metalLight', undefined, 0.65, 'bell'],
    ['M9 6Q14 9 20 6L21 8Q15 12 8 8Z', 'metalLight', 'ink', 0.5, 'bell'],
    ['M10 8Q14 10 19 8L18 10 12 11Z', 'metalShade', undefined, 0.65, 'bell'],
    ['M14 8 15 8 16 11 14 12 13 10Z', 'metal', 'ink', 0.4, 'bell'],
    ['M10-4 13-5 15-3 14-1 11-1Z', 'bone', 'ink', 0.5, 'bell'],
    ['M-8-11-5-10M-3-12-2-11', 'none', 'metalLight', 0.65],
    ['M12 5 14 4', 'none', 'metalLight', 0.65, 'bell'],
  ],
};

const paths = new Map<string, Path2D>();
const silhouettes = new Map<CryptMonster, Path2D>();
let motionPreference: MediaQueryList | undefined;

function pathFor(data: string): Path2D {
  let path = paths.get(data);
  if (!path) {
    path = new Path2D(data);
    paths.set(data, path);
  }
  return path;
}

/** Distinguish the crypt roster while preserving generic/modded figures and allied skeletons. */
export function drawCryptMonster(
  ctx: CanvasRenderingContext2D,
  id: string | undefined,
  color: string,
  time = 0,
): boolean {
  if (id !== 'archer' && id !== 'wraith' && id !== 'bellkeeper') return false;
  const palette: Record<Paint, string> = {
    ink: '#172126',
    bone: id === 'archer' ? color : '#c2bda5',
    pale: '#ece1bb',
    boneShade: '#748075',
    cloth: id === 'archer' ? '#526668' : id === 'wraith' ? color : '#4d687c',
    clothLight: id === 'archer' ? '#81938b' : color,
    clothShade: '#2d414b',
    metal: '#a28a5d',
    metalLight: '#dbc18a',
    metalShade: '#5c5545',
    glow: '#bdeded',
  };
  motionPreference ??= matchMedia('(prefers-reduced-motion: reduce)');
  const sway = motionPreference.matches ? 0 : Math.sin(time);
  if (id === 'wraith') ctx.translate(0, sway * 0.35);
  if (ctx.shadowBlur > 0) {
    let silhouette = silhouettes.get(id);
    if (!silhouette) {
      silhouette = new Path2D();
      for (const [data, fill] of drawings[id])
        if (fill !== 'none') silhouette.addPath(pathFor(data));
      silhouettes.set(id, silhouette);
    }
    // One hit glow keeps small painted planes readable and avoids blurring every detail.
    ctx.fillStyle = palette.ink;
    ctx.fill(silhouette);
    ctx.shadowBlur = 0;
  }
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const [data, fill, stroke, width = 0.65, moving] of drawings[id]) {
    if (moving) {
      ctx.save();
      const x = moving === 'bow' ? 1 : 4;
      ctx.translate(x, -10);
      ctx.rotate(sway * (moving === 'bow' ? 0.025 : 0.018));
      ctx.translate(-x, 10);
    }
    const path = pathFor(data);
    if (fill !== 'none') {
      ctx.fillStyle = palette[fill];
      ctx.fill(path);
    }
    if (stroke) {
      ctx.strokeStyle = palette[stroke];
      ctx.lineWidth = width;
      ctx.stroke(path);
    }
    if (moving) ctx.restore();
  }
  return true;
}
