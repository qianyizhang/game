import type { ThreatShape } from '../../domain/threats';

/** Draw the rules footprint, with contrasting bands entirely inside its boundary. */
export function drawThreat(ctx: CanvasRenderingContext2D, shape: ThreatShape): void {
  ctx.save();
  ctx.fillStyle = '#ef826330';
  traceThreat(ctx, shape, 0);
  ctx.fill();
  // Offset each stroke centerline by half its width instead of allocating a clip mask.
  // Keep the clipped construction where an inset would collapse or change a sharp tip.
  const clipped =
    shape.radius <= 9 ||
    (shape.kind === 'sector' &&
      (shape.arc <= Math.PI ||
        shape.arc >= Math.PI * 2 ||
        4.5 / Math.sin(shape.arc / 2) >= shape.radius - 4.5)) ||
    (shape.kind === 'annulus' && shape.radius - shape.inner <= 18);
  if (clipped) ctx.clip();
  // Bevel the line/arc joins so a miter cannot project beyond the outer circle.
  else if (shape.kind === 'sector') ctx.lineJoin = 'bevel';
  ctx.strokeStyle = '#3c1520';
  ctx.lineWidth = clipped ? 18 : 9;
  if (!clipped) traceThreat(ctx, shape, 4.5);
  ctx.stroke();
  ctx.strokeStyle = '#ffb18c';
  ctx.lineWidth = clipped ? 8 : 4;
  if (!clipped) traceThreat(ctx, shape, 2);
  ctx.stroke();
  ctx.restore();
}

function traceThreat(ctx: CanvasRenderingContext2D, shape: ThreatShape, inset: number): void {
  ctx.beginPath();
  if (shape.kind === 'line') {
    const aim = Math.atan2(shape.to.y - shape.from.y, shape.to.x - shape.from.x);
    ctx.arc(shape.from.x, shape.from.y, shape.radius - inset, aim + Math.PI / 2, aim - Math.PI / 2);
    ctx.arc(shape.to.x, shape.to.y, shape.radius - inset, aim - Math.PI / 2, aim + Math.PI / 2);
    ctx.closePath();
  } else if (shape.kind === 'sector') {
    // Intersect the parallel radial edges with each other and the inset outer arc.
    const corner = inset ? inset / Math.sin(shape.arc / 2) : 0;
    const trim = inset ? Math.asin(inset / (shape.radius - inset)) : 0;
    ctx.moveTo(
      shape.center.x + Math.cos(shape.aim) * corner,
      shape.center.y + Math.sin(shape.aim) * corner,
    );
    ctx.arc(
      shape.center.x,
      shape.center.y,
      shape.radius - inset,
      shape.aim - shape.arc / 2 + trim,
      shape.aim + shape.arc / 2 - trim,
    );
    ctx.closePath();
  } else {
    ctx.arc(shape.center.x, shape.center.y, shape.radius - inset, 0, Math.PI * 2);
    if (shape.kind === 'annulus') {
      ctx.moveTo(shape.center.x + (shape.inner + inset), shape.center.y);
      ctx.arc(shape.center.x, shape.center.y, shape.inner + inset, 0, Math.PI * 2, true);
    }
  }
}
