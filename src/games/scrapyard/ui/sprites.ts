import { selectedArt } from '../../../shared/art/selection';
import { ART, type ArtId } from './art-data';

/** Cache at 2× density. Selected SVGs decode once; editable vectors stay synchronous. */
export function createSprites() {
  const cache = new Map<ArtId, HTMLCanvasElement>();
  const pending: Promise<void>[] = [];
  const sprite = (id: ArtId) => {
    const saved = cache.get(id);
    if (saved) return saved;
    const art = ART[id];
    const canvas = document.createElement('canvas');
    canvas.width = art.width * 2;
    canvas.height = art.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is unavailable.');
    cache.set(id, canvas);
    const selected = selectedArt(`scrapyard/${id}`);
    if (selected) {
      const image = new Image();
      image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(selected.svg);
      pending.push(
        image.decode().then(
          () => ctx.drawImage(image, 0, 0, canvas.width, canvas.height),
          () => {
            throw new Error(`Selected artwork could not be decoded: scrapyard/${id}`);
          },
        ),
      );
      return canvas;
    }
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
    return canvas;
  };
  return Object.assign(sprite, {
    ready: () => (pending.length ? Promise.all(pending).then(() => {}) : undefined),
  });
}
