import { ART, type ArtId } from './art-data';

/** Cache at the renderer's maximum 2× density. No async loading or per-frame SVG parsing. */
export function createSprites() {
  const cache = new Map<ArtId, HTMLCanvasElement>();
  return (id: ArtId) => {
    const saved = cache.get(id);
    if (saved) return saved;
    const art = ART[id];
    const canvas = document.createElement('canvas');
    canvas.width = art.width * 2;
    canvas.height = art.height * 2;
    const ctx = canvas.getContext('2d')!;
    const [x, y, width, height] = art.viewBox;
    const scale = Math.min(canvas.width / width, canvas.height / height);
    ctx.translate((canvas.width - width * scale) / 2, (canvas.height - height * scale) / 2);
    ctx.scale(scale, scale);
    ctx.translate(-x, -y);
    for (const shape of art.paths) {
      const path = new Path2D(shape.d);
      if (shape.fill !== 'none') {
        ctx.fillStyle = shape.fill;
        ctx.fill(path);
      }
      if (shape.stroke !== 'none') {
        ctx.strokeStyle = shape.stroke;
        ctx.lineWidth = shape.strokeWidth;
        ctx.lineJoin = shape.lineJoin;
        ctx.lineCap = shape.lineCap;
        ctx.stroke(path);
      }
    }
    cache.set(id, canvas);
    return canvas;
  };
}
