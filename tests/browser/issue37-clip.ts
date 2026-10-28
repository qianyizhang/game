export type PageRect = { left: number; top: number; right: number; bottom: number };

export function enclosingClip(rects: readonly PageRect[]) {
  if (rects.length === 0) throw new Error('At least one card rectangle is required.');
  const x = Math.floor(Math.min(...rects.map((rect) => rect.left)));
  const y = Math.floor(Math.min(...rects.map((rect) => rect.top)));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  if (![x, y, right, bottom].every(Number.isFinite) || right <= x || bottom <= y)
    throw new Error('Card rectangles must have finite positive bounds.');
  return { x, y, width: Math.ceil(right - x), height: Math.ceil(bottom - y) };
}

export function clipContains(clip: ReturnType<typeof enclosingClip>, rect: PageRect) {
  return (
    rect.left >= clip.x &&
    rect.top >= clip.y &&
    rect.right <= clip.x + clip.width &&
    rect.bottom <= clip.y + clip.height
  );
}
