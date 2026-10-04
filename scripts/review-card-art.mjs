import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';

const require = createRequire(import.meta.url);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

async function inventory(directory, sharp) {
  const root = resolve(directory);
  const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
  if (!Array.isArray(manifest) || !manifest.length)
    throw new Error(`Empty or invalid manifest: ${root}`);
  const entries = new Map();
  for (const asset of manifest) {
    if (
      !asset ||
      typeof asset.id !== 'string' ||
      typeof asset.file !== 'string' ||
      typeof asset.name !== 'string' ||
      entries.has(asset.id) ||
      ![asset.width, asset.height].every((n) => Number.isInteger(n) && n > 0 && n <= 4096)
    ) {
      throw new Error(`Invalid or duplicate asset in ${root}: ${asset?.id}`);
    }
    const file = resolve(root, asset.file);
    const local = relative(root, file);
    if (isAbsolute(local) || local === '..' || local.startsWith(`..${sep}`))
      throw new Error(`Asset escapes export directory: ${asset.file}`);
    const { data, info } = await sharp(file, { density: 144 })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const hash = createHash('sha256')
      .update(`${info.width}x${info.height}:`)
      .update(data)
      .digest('hex');
    entries.set(asset.id, { ...asset, path: file, hash });
  }
  return entries;
}

function textImage(text, width, size = 16, color = '#eddfbb') {
  return Buffer.from(
    `<svg width="${width}" height="32"><text x="0" y="23" font-family="sans-serif" font-size="${size}" fill="${color}">${escape(text)}</text></svg>`,
  );
}

async function sheet(ids, current, previous, output, sharp) {
  const columns = previous ? [previous, current] : [current];
  const width = columns.length * 560;
  const overlays = [];
  for (let c = 0; c < columns.length; c++) {
    overlays.push({
      input: textImage(previous && c === 0 ? 'BEFORE' : 'CURRENT', 500, 14, '#cba768'),
      left: c * 560 + 20,
      top: 12,
    });
    for (let row = 0; row < ids.length; row++) {
      const asset = columns[c].get(ids[row]);
      const x = c * 560 + 20;
      const y = 52 + row * 548;
      overlays.push({ input: textImage(ids[row], 520, 15), left: x, top: y });
      if (!asset) {
        overlays.push({
          input: textImage('Not present in this export', 520, 16, '#cba768'),
          left: x,
          top: y + 90,
        });
        continue;
      }
      const enlargedScale = Math.min(2, 520 / asset.width, 280 / asset.height);
      const nativeScale = Math.min(1, 520 / asset.width, 192 / asset.height);
      for (const [scale, top] of [
        [enlargedScale, y + 40],
        [nativeScale, y + 346],
      ]) {
        const w = Math.max(1, Math.round(asset.width * scale));
        const h = Math.max(1, Math.round(asset.height * scale));
        const png = await sharp(asset.path, { density: 144 }).resize(w, h).png().toBuffer();
        overlays.push({ input: png, left: x + Math.floor((520 - w) / 2), top });
      }
      const label =
        nativeScale === 1
          ? `Native size · ${asset.width} × ${asset.height} px`
          : `Reduced to fit · ${Math.round(asset.width * nativeScale)} px wide`;
      overlays.push({ input: textImage(label, 520, 12, '#aabca7'), left: x, top: y + 310 });
    }
  }
  await sharp({
    create: { width, height: 60 + ids.length * 548, channels: 4, background: '#172d28' },
  })
    .composite(overlays)
    .png()
    .toFile(output);
}

try {
  const { values, positionals: requested } = parseArgs({
    allowPositionals: true,
    options: {
      from: { type: 'string', default: 'test-results/card-art' },
      before: { type: 'string' },
      out: { type: 'string' },
      'sharp-module': { type: 'string' },
      help: { type: 'boolean' },
    },
  });
  if (values.help) {
    console.log(
      'Usage: npm run assets:review -- asset/id ... --out test-results/review-name [--from export-dir] [--before earlier-export-dir] [--sharp-module /path/to/sharp]\nDecodes every SVG, compares rendered pixels, and makes two-size PNG sheets for the selected IDs. Requires an existing Sharp module; installs nothing. The output directory must be new.',
    );
  } else {
    if (!requested.length || !values.out)
      throw new Error('Select at least one asset ID and provide --out. Use --help for options.');
    let sharp;
    try {
      sharp = require(values['sharp-module'] ? resolve(values['sharp-module']) : 'sharp');
    } catch {
      throw new Error(
        'Sharp is unavailable. Pass --sharp-module with an existing Sharp package path from your tooling runtime. No package was installed.',
      );
    }
    const current = await inventory(values.from, sharp);
    const previous = values.before ? await inventory(values.before, sharp) : null;
    const ids = [...new Set(requested)];
    for (const id of ids)
      if (!current.has(id) && !previous?.has(id)) throw new Error(`Unknown asset ID: ${id}`);
    const out = resolve(values.out);
    await mkdir(dirname(out), { recursive: true });
    await mkdir(out); // Refuse to overwrite another review, including one from a concurrent chat.
    const comparison = previous
      ? {
          added: [...current.keys()].filter((id) => !previous.has(id)),
          removed: [...previous.keys()].filter((id) => !current.has(id)),
          changed: [...current.keys()].filter(
            (id) => previous.has(id) && current.get(id).hash !== previous.get(id).hash,
          ),
          unchanged: [...current.keys()].filter(
            (id) => current.get(id).hash === previous.get(id)?.hash,
          ).length,
        }
      : null;
    const pages = [];
    for (let i = 0; i < ids.length; i += 2) {
      const name = `sheet-${String(pages.length + 1).padStart(2, '0')}.png`;
      await sheet(ids.slice(i, i + 2), current, previous, resolve(out, name), sharp);
      pages.push(name);
    }
    const report = {
      current: resolve(values.from),
      before: values.before ? resolve(values.before) : null,
      renderer: sharp.versions,
      decoded: { current: current.size, before: previous?.size ?? 0 },
      comparison,
      sheets: pages,
      selected: ids,
      pixels: Object.fromEntries([...current].map(([id, asset]) => [id, asset.hash])),
      note: 'Pixel equality uses this renderer at 144 dpi. It does not establish visual quality; inspect sheets and actual UI screenshots.',
    };
    await writeFile(resolve(out, 'review.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(
      JSON.stringify(
        { decoded: report.decoded, comparison, sheets: pages.map((name) => resolve(out, name)) },
        null,
        2,
      ),
    );
  }
} catch (error) {
  console.error(
    error.code === 'EEXIST'
      ? 'Review directory already exists; choose a new --out. Nothing was overwritten.'
      : error.message,
  );
  process.exitCode = 1;
}
