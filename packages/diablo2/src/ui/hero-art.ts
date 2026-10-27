/** Authored at field size: broad value planes carry identity before the small fittings. */
const paths = new Map<string, Path2D>();
function plane(ctx: CanvasRenderingContext2D, color: string, outline: string): void {
  let path = paths.get(outline);
  if (!path) {
    path = new Path2D(outline);
    paths.set(outline, path);
  }
  ctx.fillStyle = color;
  ctx.fill(path);
}

function rook(ctx: CanvasRenderingContext2D, color: string, sway: number): void {
  // Planted boots, then a back-slung mantle. The raised shoulder answers the axe's weight.
  plane(ctx, '#151d23', 'M-9 0L1 0L-1 8L-5 14L-13 14L-12 10Z M1 0L9 0L9 9L13 12L12 15L5 15L1 9Z');
  plane(ctx, '#6d5745', 'M-9 4L-3 5L-5 11L-10 11Z M3 4L8 4L8 10L5 11Z');
  plane(ctx, '#a18d69', 'M-11 11L-5 11L-6 13L-12 13Z M6 11L10 11L11 13L6 13Z');
  plane(ctx, '#182126', 'M-10-18L-3-23L6-21L12-15L9 2L-1 7L-12 3L-14-6Z');
  plane(ctx, '#574537', 'M-10-17L-3-21L6-19L9-11L6 1L-5 5L-11 1Z');
  plane(ctx, '#322d29', 'M-10-7L-4-9L3-6L7 3L1 9L-4 6L-9 8L-12 3Z');
  plane(ctx, color, 'M-8-15L-1-18L6-14L6-5L1-1L-6-3Z');
  plane(ctx, '#b47b53', 'M1-16L6-14L6-5L1-1L-1-5Z');
  plane(ctx, '#f0c596', 'M-7-14L-2-16L0-13L-1-8L-6-9Z');
  plane(ctx, '#382b26', 'M-10-14L-7-16L5 0L3 3Z');
  plane(ctx, '#a99a78', 'M-7-11L-5-12L-1-7L-3-6Z');
  // A thick, irregular pelt has one light shoulder and a quiet shadow side.
  plane(
    ctx,
    '#292a29',
    'M-15-12L-14-20L-9-24L-4-22L0-24L7-21L11-16L8-10L3-12L0-15L-4-13L-8-16L-10-12Z',
  );
  plane(ctx, '#8b8170', 'M-14-17L-11-22L-7-22L-3-19L-5-15L-8-17L-11-14Z');
  plane(ctx, '#c4b697', 'M-12-19L-10-22L-7-21L-5-19L-8-19L-10-17Z');
  plane(ctx, '#535348', 'M-1-21L4-22L9-17L7-13L3-15Z');
  // Bare forearm and a substantial bracer on the lowered hand.
  plane(ctx, '#20272a', 'M-14-14L-9-12L-10-5L-12 2L-17 0L-18-4Z');
  plane(ctx, color, 'M-14-13L-11-12L-12-7L-16-5L-17-6Z');
  plane(ctx, '#52606a', 'M-16-6L-11-5L-12 0L-16-1Z');
  plane(ctx, '#bac2bb', 'M-16-6L-12-6L-12-4L-16-4Z');
  plane(ctx, '#c99570', 'M-16 0L-12 1L-12 4L-16 3Z');
  // The head sits into the mantle; the beard joins the jaw, rather than floating.
  plane(ctx, '#382d28', 'M-5-28Q-2-32 3-29L6-25L4-19L0-16L-5-20Z');
  plane(ctx, '#d8aa7d', 'M-4-27L2-28L4-25L3-21L0-19L-4-21Z');
  plane(ctx, '#f1c69b', 'M-4-26L0-27L0-23L-3-22Z');
  plane(ctx, '#71503a', 'M-4-23L-1-22L3-23L3-19L0-17L-4-20Z M-5-27L-4-30L1-31L4-28L1-27L-2-28Z');
  plane(ctx, '#292628', 'M-2-25L1-25L1-24L-2-24Z');
  plane(ctx, '#242629', 'M-9-1L7-2L8 2L-10 3Z');
  plane(ctx, '#c8ac76', 'M-2-1L2-1L2 2L-2 2Z');
  ctx.save();
  ctx.translate(sway * 0.3, -sway * 0.2);
  // Broad axe blade, visible socket and long haft; no magical glow on forged steel.
  plane(ctx, '#171e24', 'M9-25L13-26L17 9L13 10Z M11-29L16-32L24-28L23-17L17-19L12-23Z');
  plane(ctx, '#846443', 'M10-25L12-25L16 8L14 8Z');
  plane(ctx, '#5c737c', 'M12-27L16-30L22-27L21-19L17-21L13-22Z');
  plane(ctx, '#d7dfd4', 'M19-29L23-27L22-18L19-20L20-25Z');
  plane(ctx, '#91a5a5', 'M13-26L16-28L19-26L18-23L14-23Z');
  plane(ctx, '#c8b17b', 'M11-25L14-25L15-20L12-20Z');
  plane(ctx, '#382d28', 'M5-14L9-16L14-12L14-7L9-6L6-9Z');
  plane(ctx, color, 'M6-13L9-14L12-11L12-8L9-8L6-10Z');
  plane(ctx, '#ebbd8e', 'M10-11L13-11L14-8L11-7Z');
  ctx.restore();
}

function mira(ctx: CanvasRenderingContext2D, color: string, sway: number): void {
  const drift = sway * 0.6;
  ctx.save();
  ctx.translate(drift, 0);
  // The long, wind-swept cape opens away from the forward foot and staff.
  plane(ctx, '#172630', 'M-7-21L3-19L6-8L3 4L-8 14L-21 11L-15 3L-13-10Z');
  plane(ctx, '#285369', 'M-8-19L-2-16L0-4L-5 5L-17 11L-12 1L-11-9Z');
  plane(ctx, color, 'M-8-18L-5-18L-9-4L-8 3L-17 11L-13 4L-12-3Z');
  plane(ctx, '#a0dce1', 'M-16 10L-8 6L-9 9L-18 12Z');
  ctx.restore();
  plane(ctx, '#17252e', 'M-5 1L1 1L0 10L-3 15L-9 15L-8 12Z M1 2L6 2L6 10L10 12L9 15L3 14L1 10Z');
  plane(ctx, '#9a8170', 'M-4 4L-1 4L-2 9L-5 11L-6 10Z M3 3L5 3L5 9L3 9Z');
  plane(ctx, '#638994', 'M-7 12L-3 12L-4 14L-8 14Z M4 12L8 12L9 14L4 13Z');
  // Fitted coat with a diagonal open hem: cloth planes, not a triangular token.
  plane(ctx, '#142a36', 'M-6-18L2-20L7-13L6-2L8 8L2 6L0 0L-3 9L-9 6L-6-4Z');
  plane(ctx, '#387f9c', 'M-5-16L1-18L4-13L3-5L0-1L-6 5L-4-5Z');
  plane(ctx, color, 'M-5-15L-1-16L0-9L-2-4L-6 5L-7 3Z');
  plane(ctx, '#b6e2de', 'M-5-15L-3-16L-2-11L-3-8L-5-8Z');
  plane(ctx, '#1e455f', 'M1-15L5-14L4-4L7 6L3 4L0-2Z');
  plane(ctx, '#cbac6b', 'M-7-3L5-5L5-2L-6 0Z M-1-4L1-4L1-1L-1-1Z');
  // Free hand is extended for casting; the near elbow bends into the staff grip.
  plane(ctx, '#162a34', 'M-6-16L-10-15L-12-7L-18-8L-20-4L-10-3L-6-9Z');
  plane(ctx, '#498ca5', 'M-8-14L-10-13L-11-6L-7-7Z');
  plane(ctx, '#ccb77c', 'M-13-7L-10-6L-11-3L-14-4Z');
  plane(ctx, '#e3b596', 'M-14-6L-18-7L-20-6L-18-3L-14-4Z');
  plane(ctx, '#172b36', 'M4-16L8-13L9-6L14-9L17-5L10 0L6-3L4-8Z');
  plane(ctx, color, 'M5-13L7-12L8-5L6-5Z');
  plane(ctx, '#cbb17b', 'M10-5L13-7L15-5L12-3Z');
  // Warm face framed by dark hair, a tilted hood, and a scarf that carries the sweep.
  plane(ctx, '#17232d', 'M-6-23Q-6-30 0-30L5-26L5-18L1-15L-5-18Z');
  plane(ctx, '#bb8c71', 'M-3-26L1-27L3-24L2-20L-1-18L-4-21Z');
  plane(ctx, '#f0c4a3', 'M-3-25L0-26L1-23L0-20L-2-21Z');
  plane(ctx, '#252c37', 'M-5-26L-1-29L3-27L4-23L1-24L-1-27L-3-23L-4-18L-6-20Z');
  plane(ctx, '#3c7892', 'M-6-23L-7-27L-2-32L3-30L6-25L3-27L-1-29L-5-25Z');
  plane(ctx, color, 'M-7-27L-2-32L0-30L-5-25Z');
  plane(ctx, '#bad8d0', 'M-1-24L1-24L1-23L-1-23Z');
  plane(ctx, '#bb9b62', 'M-5-19L-1-17L4-20L4-17L0-14L-5-16Z');
  ctx.save();
  ctx.translate(sway * 0.25, -sway * 0.2);
  // An open bronze crescent surrounds a lantern ember: readable negative space.
  plane(ctx, '#1a2830', 'M14-22L18-22L17 13L13 13Z M16-34Q27-30 21-21L17-18L11-23L12-30Z');
  plane(ctx, '#91764e', 'M15-22L17-22L16 12L14 12Z');
  plane(ctx, '#d6bd7d', 'M16-32Q24-29 20-23L17-21L13-24L13-28L15-30L14-26L17-24L20-26L20-29Z');
  plane(ctx, '#efad66', 'M17-30L19-27L17-24L15-27Z');
  plane(ctx, '#ffe5ab', 'M17-29L18-27L17-26L16-27Z');
  plane(ctx, '#d9b293', 'M13-7L17-7L18-5L16-3L13-4Z');
  plane(ctx, '#dfc891', 'M14 7L16 7L16 9L14 9Z');
  ctx.restore();
}

function silas(ctx: CanvasRenderingContext2D, color: string, sway: number): void {
  // A crooked, forward-leaning silhouette with a bone yoke and a split, heavy robe.
  plane(ctx, '#182426', 'M-8-19L2-22L9-15L9 0L13 13L5 15L0 12L-5 15L-14 13L-10 0Z');
  plane(ctx, '#374d43', 'M-7-17L1-18L4-10L1 1L5 12L0 10L-6 13L-11 11L-7-1Z');
  plane(ctx, color, 'M-8-17L-4-17L-5-6L-3 1L-8 10L-11 11L-8 0Z');
  plane(ctx, '#6e8861', 'M-4-16L-1-18L1-10L-1 1L1 9L-4 11L-2 1L-5-4Z');
  plane(ctx, '#202f2e', 'M4-17L8-14L7-2L11 12L6 12L2 1Z');
  plane(ctx, '#a9ad88', 'M-10 10L-7 11L-5 10L-5 12L-9 13L-12 12Z');
  plane(ctx, '#222d2d', 'M-5 11L-1 11L-2 15L-7 15Z M4 11L7 11L9 15L3 15Z');
  plane(
    ctx,
    '#1a2728',
    'M-9-17L-14-12L-15 0L-11 3L-7-1L-7-9Z M6-17L11-12L12-3L17-5L18-1L10 2L6-3Z',
  );
  plane(ctx, '#698261', 'M-10-14L-12-11L-13-2L-10-3L-9-9Z');
  plane(ctx, '#82977a', 'M7-14L9-11L10-4L8-3Z');
  // The ivory collar wraps the shoulders and connects to the chest clasp.
  plane(ctx, '#25302d', 'M-13-18L-12-24L-8-23L-5-20L0-21L4-25L8-23L12-17L6-13L1-14L-4-12L-8-15Z');
  plane(
    ctx,
    '#b1b49a',
    'M-12-20L-11-23L-7-21L-5-17L-2-16L-4-14L-8-17Z M1-19L5-23L7-22L10-18L6-15L2-16Z',
  );
  plane(ctx, '#e1ddba', 'M-11-22L-8-21L-6-18L-8-19Z M5-22L7-21L8-18L6-17L4-18Z');
  plane(ctx, '#ded8b4', 'M-3-16L0-17L3-15L2-11L-1-10L-4-12Z');
  plane(ctx, '#344039', 'M-2-14L-1-14L-1-12L-2-12Z M1-14L2-14L2-12L1-12Z');
  plane(ctx, '#544c3a', 'M-7-2L6-3L7 0L-7 2Z');
  plane(ctx, '#bcb48b', 'M-3-2L0-2L0 1L-3 1Z');
  // Pale angular face recessed into an asymmetric cowl; one quiet eye socket.
  plane(ctx, '#192626', 'M-6-24L-5-30L1-33L6-29L7-23L3-18L-2-18Z');
  plane(ctx, '#66806b', 'M-5-29L0-32L4-30L-1-29L-4-24L-4-21L-6-24Z');
  plane(ctx, '#babca0', 'M-3-27L1-28L4-25L2-20L-1-19L-4-23Z');
  plane(ctx, '#e4ddbd', 'M-3-26L0-27L1-24L-1-22L-3-23Z');
  plane(ctx, '#2b3834', 'M-2-25L0-25L1-24L-2-23Z M1-22L3-23L2-20L0-20Z');
  plane(ctx, '#9a9f82', 'M-3-21L-1-20L1-20L0-18L-2-19Z');
  // Pendant lantern hangs below the free wrist, with no blur or extra effects pass.
  plane(ctx, '#c3c3a0', 'M-13-3L-10-3L-10 0L-13 1Z');
  plane(ctx, '#9f966c', 'M-13 0L-12 0L-12 4L-13 4Z');
  plane(ctx, '#1a2929', 'M-16 4L-10 3L-8 8L-11 12L-16 10L-18 7Z');
  plane(ctx, '#8e9e78', 'M-15 5L-11 5L-10 8L-12 10L-15 9L-16 7Z');
  plane(ctx, '#d5e3a6', 'M-14 5L-12 5L-12 8L-14 9L-15 7Z');
  ctx.save();
  ctx.translate(sway * 0.25, -sway * 0.2);
  // Hooked bone wand, distinct from Mira's open lantern and Rook's broad blade.
  plane(
    ctx,
    '#1a2928',
    'M16-22L20-21L17 13L13 13Z M17-20L13-25L14-31L19-34L24-30L23-25L20-23L20-27L18-28L17-26L20-22Z',
  );
  plane(ctx, '#92997d', 'M17-21L19-21L16 12L14 12Z');
  plane(ctx, '#d4d0ad', 'M18-21L14-26L15-30L19-32L22-29L22-26L20-25L20-28L18-29L16-27L20-22Z');
  plane(ctx, '#f1e7c2', 'M15-29L18-31L21-29L18-30L16-27Z');
  plane(ctx, '#b9c39a', 'M15-5L19-5L19-2L16-1L14-3Z');
  ctx.restore();
}

/** Returns false for mod heroes so the field's existing generic figure remains their fallback. */
export function drawHero(
  ctx: CanvasRenderingContext2D,
  kind: string,
  color: string,
  time: number,
): boolean {
  if (kind !== 'barbarian' && kind !== 'sorceress' && kind !== 'necromancer') return false;
  const sway = Math.sin(time);
  ctx.save();
  ctx.translate(0, -Math.abs(sway) * 0.35);
  if (kind === 'barbarian') rook(ctx, color, sway);
  else if (kind === 'sorceress') mira(ctx, color, sway);
  else silas(ctx, color, sway);
  ctx.restore();
  return true;
}
