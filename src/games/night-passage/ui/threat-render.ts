import type { ThreatShape } from '../domain/threats';

/** Draw exactly the geometry used by rules hit detection, before actor-radius expansion. */
export function drawThreat(ctx: CanvasRenderingContext2D, shape: ThreatShape): void {
  ctx.save();
  ctx.fillStyle = '#ef826330';
  ctx.strokeStyle = '#ffb18c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (shape.kind === 'line') {
    const aim = Math.atan2(shape.to.y - shape.from.y, shape.to.x - shape.from.x);
    ctx.arc(shape.from.x, shape.from.y, shape.radius, aim + Math.PI / 2, aim - Math.PI / 2);
    ctx.arc(shape.to.x, shape.to.y, shape.radius, aim - Math.PI / 2, aim + Math.PI / 2);
    ctx.closePath();
  } else if (shape.kind === 'sector') {
    ctx.moveTo(shape.center.x, shape.center.y);
    ctx.arc(
      shape.center.x,
      shape.center.y,
      shape.radius,
      shape.aim - shape.arc / 2,
      shape.aim + shape.arc / 2,
    );
    ctx.closePath();
  } else {
    ctx.arc(shape.center.x, shape.center.y, shape.radius, 0, Math.PI * 2);
    if (shape.kind === 'annulus') {
      ctx.moveTo(shape.center.x + shape.inner, shape.center.y);
      ctx.arc(shape.center.x, shape.center.y, shape.inner, 0, Math.PI * 2, true);
    }
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
