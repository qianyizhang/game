import { drawThreat } from '../../src/games/night-passage/ui/presentation/threats';
import { threatens, type ThreatShape } from '../../src/games/night-passage/domain/threats';

/** Raster containment in rules geometry, allowing one backing pixel for antialiasing. */
export function inspectThreatBoundaries() {
  const shapes: ThreatShape[] = [];
  const center = { x: 200, y: 200 };
  for (const radius of [1, 8, 25, 75, 165]) shapes.push({ kind: 'circle', center, radius });
  for (const aim of [-3, -1, 1, 3])
    for (const radius of [5, 20, 165])
      for (const arc of [0.3, Math.PI * 1.25, Math.PI * 1.8])
        shapes.push({ kind: 'sector', center, radius, aim, arc });
  for (const aim of [-3, -1, 1, 3])
    for (const radius of [1, 8, 25])
      shapes.push({
        kind: 'line',
        from: { x: 180, y: 180 },
        to: { x: 180 + Math.cos(aim) * 120, y: 180 + Math.sin(aim) * 120 },
        radius,
      });
  for (const width of [2, 10, 30, 125])
    shapes.push({ kind: 'annulus', center, radius: 165, inner: 165 - width });
  const violations: { shape: ThreatShape; scale: number; outside: number }[] = [];
  let painted = 0,
    restored = true,
    clearHoles = true;
  for (const scale of [1, 2]) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 400 * scale;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.scale(scale, scale);
    for (const shape of shapes) {
      ctx.clearRect(0, 0, 400, 400);
      ctx.fillStyle = '#00ff00';
      ctx.lineWidth = 13;
      ctx.lineJoin = 'round';
      drawThreat(ctx, shape);
      restored &&= ctx.fillStyle === '#00ff00' && ctx.lineWidth === 13 && ctx.lineJoin === 'round';
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let outside = 0;
      for (let y = 0; y < canvas.height; y++)
        for (let x = 0; x < canvas.width; x++) {
          if (!pixels[(y * canvas.width + x) * 4 + 3]) continue;
          painted++;
          // Continuous expansion includes narrow apex coverage missed by grid-neighbor sampling.
          if (!threatens(shape, { x: (x + 0.5) / scale, y: (y + 0.5) / scale }, 1 / scale))
            outside++;
        }
      if (outside) violations.push({ shape, scale, outside });
      if (shape.kind === 'annulus')
        clearHoles &&= ctx.getImageData(200 * scale, 200 * scale, 1, 1).data[3] === 0;
      ctx.fillRect(0, 0, 1, 1);
      const marker = ctx.getImageData(0, 0, 1, 1).data;
      restored &&= marker[1] === 255 && marker[3] === 255;
    }
  }
  return { cases: shapes.length * 2, violations, painted, restored, clearHoles };
}
