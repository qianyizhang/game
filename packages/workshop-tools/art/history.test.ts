import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
  symlinkSync,
  realpathSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { gzipSync } from 'node:zlib';
import { resolve, dirname } from 'node:path';
import react from '@vitejs/plugin-react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  HISTORY_PATH,
  SELECTION_PATH,
  MANAGED_PATH,
  digest,
  readHistory,
  useRevision,
  removeRevision,
  removalPlan,
  historyPath,
  verifyHistory,
  removeAttempt,
  importHistory,
  historyState,
  historyDocument,
  historyPreview,
  validateSvg,
} from './history-store.ts';
import type { ArtHistory } from './history-types.ts';
import { withBundle, repositoryRoot } from '../io.ts';
import { verifySourceHistory, snapshotHistory, currentArtwork } from './history.ts';
import { artHistoryPlugin } from './history-server.ts';
import { createServer } from 'vite';

function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), 'art-history-'));
  const file = `${MANAGED_PATH}/sample/first.svg`;
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 112"><path d="M10 10h100v80H10Z" fill="#d1a963"/></svg>';
  const history: ArtHistory = {
    schema: 1,
    assets: [{ id: 'hearth/cub', name: 'Cub', group: 'Hearth', width: 160, height: 112 }],
    attempts: [
      {
        id: 'first',
        title: 'First',
        date: 'unknown',
        outcome: 'manual',
        notes: 'Fixture',
        files: [],
      },
    ],
    revisions: [
      {
        id: 'first',
        asset: 'hearth/cub',
        attempt: 'first',
        label: 'First',
        file,
        digest: digest(svg),
        runtimeFile: file,
        runtimeDigest: digest(svg),
        parents: [],
        notes: 'Fixture',
      },
    ],
  };
  for (const [path, bytes] of [
    [file, svg],
    [HISTORY_PATH, JSON.stringify(history)],
    [SELECTION_PATH, '{}'],
  ]) {
    mkdirSync(dirname(resolve(root, path)), { recursive: true });
    writeFileSync(resolve(root, path), bytes);
  }
  return { root, file, svg, history };
}

await test('game selections persist exact bytes, reject stale/changed/incompatible inputs, and protect used artwork', (t) => {
  const { root, file, svg } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const version = readHistory(root).version;
  useRevision(root, version, 'hearth/cub', 'first');
  assert.equal(readHistory(root).selections['hearth/cub'].svg, svg);
  const selected = readFileSync(resolve(root, SELECTION_PATH));
  assert.throws(() => useRevision(root, version, 'hearth/cub', null), /History changed/);
  assert.throws(() => removeRevision(root, readHistory(root).version, 'first'), /used in game/);
  assert.deepEqual(readFileSync(resolve(root, SELECTION_PATH)), selected);
  useRevision(root, readHistory(root).version, 'hearth/cub', null);
  writeFileSync(resolve(root, file), svg.replace('160 112', '100 100'));
  assert.throws(
    () => useRevision(root, readHistory(root).version, 'hearth/cub', 'first'),
    /changed since registration/,
  );
  assert.equal(readFileSync(resolve(root, SELECTION_PATH), 'utf8'), '{}\n');
  const state = readHistory(root);
  const revision = state.history.revisions[0];
  revision.runtimeDigest = revision.digest = digest(readFileSync(resolve(root, file)));
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(state.history));
  assert.throws(
    () => useRevision(root, readHistory(root).version, 'hearth/cub', 'first'),
    /aspect ratio/,
  );
});

await test('removal preserves shared and externally referenced bytes, and removes owned payloads with lineage notes', (t) => {
  const { root, file, svg, history } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  history.revisions.push({
    ...history.revisions[0],
    id: 'child',
    label: 'Child',
    parents: ['first'],
  });
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  assert.deepEqual(removalPlan(root, 'first').remove, []);
  removeRevision(root, readHistory(root).version, 'first');
  assert.equal(existsSync(resolve(root, file)), true);
  assert.match(readHistory(root).history.revisions[0].notes, /first.*explicitly removed/);
  mkdirSync(resolve(root, 'docs/guide'), { recursive: true });
  writeFileSync(resolve(root, 'docs/guide/reference.md'), `[Source](../${file.slice(5)})`);
  assert.deepEqual(removalPlan(root, 'child').remove, []);
  rmSync(resolve(root, 'docs/guide/reference.md'));
  assert.deepEqual(removalPlan(root, 'child').remove, [file]);
  removeRevision(root, readHistory(root).version, 'child');
  assert.equal(existsSync(resolve(root, file)), false);
  assert.equal(readHistory(root).history.revisions.length, 0);
  removeAttempt(root, readHistory(root).version, 'first');
  assert.equal(readHistory(root).history.attempts.length, 0);
  assert.ok(svg.length > 0);
});

await test('unsafe paths and malformed selections fail without writes, including a symlinked repository root', (t) => {
  const { root, history, file } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.throws(() => historyPath(root, `${MANAGED_PATH}/../../library.json`), /normalized/);
  const alias = root + '-alias';
  symlinkSync(root, alias);
  t.after(() => rmSync(alias));
  assert.equal(historyPath(alias, file), resolve(realpathSync(root), file));
  symlinkSync(dirname(resolve(root, file)), resolve(root, 'linked'));
  assert.throws(() => historyPath(root, 'linked/first.svg'), /Symlinked/);
  const svg = '<svg viewBox="0 0 160 112" onload="bad()"></svg>';
  writeFileSync(resolve(root, file), svg);
  history.revisions[0].digest = history.revisions[0].runtimeDigest = digest(svg);
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  assert.throws(
    () => useRevision(root, readHistory(root).version, 'hearth/cub', 'first'),
    /static SVG/,
  );
  assert.equal(readFileSync(resolve(root, SELECTION_PATH), 'utf8'), '{}');
  assert.throws(
    () =>
      validateSvg('<svg viewBox="0 0 160 112"><path fill="u&#114;l(https://example.com)"/></svg>'),
    /Escaped SVG resource/,
  );
  assert.throws(() => importHistory(root, readHistory(root).version, { schema: 99 }), /schema/);
});

await test('every catalogue asset has a registered identity and a real game rendering selection route', async () => {
  const { history } = readHistory(repositoryRoot);
  verifyHistory(repositoryRoot);
  const selections = Object.fromEntries(
    history.assets.map((asset) => [
      asset.id,
      {
        revision: 'fixture:' + asset.id,
        digest: 'fixture',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${asset.width} ${asset.height}"><defs><linearGradient id="paint"><stop stop-color="#abc"/></linearGradient></defs><path fill="url(#paint)" d="M0 0h10v10Z"/></svg>`,
      },
    ]),
  );
  await withBundle<typeof import('./gallery/catalogue'), void>(
    'packages/workshop-tools/art/gallery/catalogue.tsx',
    async ({ cardArtCatalogue }) => {
      const catalogue = cardArtCatalogue();
      assert.deepEqual(
        catalogue.map((asset) => asset.id).sort(),
        history.assets.map((asset) => asset.id).sort(),
      );
      for (const asset of catalogue) {
        const output = renderToStaticMarkup(asset.node);
        assert.ok(
          output.includes(`fixture:${asset.id}`) ||
            output.includes(encodeURIComponent(selections[asset.id].svg).replaceAll('&', '&amp;')),
          `No selection reaches ${asset.id}`,
        );
        assert.doesNotMatch(output, /<image\b/, 'Selected vector paths must inherit game inks');
      }
      const sample = catalogue.find((asset) => asset.id === 'hearth/cub')!;
      const repeated = renderToStaticMarkup(createElement('div', null, sample.node, sample.node));
      const ids = [...repeated.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
      assert.equal(
        new Set(ids).size,
        ids.length,
        'Repeated cards must have distinct local paint IDs',
      );
      await Promise.resolve();
    },
    [
      react(),
      {
        name: 'selected-art-fixture',
        enforce: 'pre',
        load(id) {
          if (id.endsWith('/src/shared/art/selected-art.json')) return JSON.stringify(selections);
        },
      },
    ],
  );
});

await test('new attempts preserve exact settings and failures, and derivatives can reference existing parents', (t) => {
  const { root, history } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const request = `${MANAGED_PATH}/failed-request.json`;
  const bytes = '{"model":"fixture","quality":"high","failure":"connection closed","billing":null}';
  writeFileSync(resolve(root, request), bytes);
  importHistory(root, readHistory(root).version, {
    schema: 1,
    assets: [],
    attempts: [
      {
        id: 'failed',
        title: 'Failed request',
        date: 'unknown',
        outcome: 'failed',
        files: [request],
        notes: 'No image returned. Billing unknown.',
      },
    ],
    revisions: [],
  });
  assert.deepEqual(historyState(root, false).documents?.[request], { kind: 'text', text: bytes });
  assert.equal(readHistory(root).history.revisions.length, 1);
  removeAttempt(root, readHistory(root).version, 'failed');
  assert.equal(existsSync(resolve(root, request)), false);
  importHistory(root, readHistory(root).version, {
    schema: 1,
    assets: [],
    attempts: [],
    revisions: [{ ...history.revisions[0], id: 'adapted', parents: ['first'] }],
  });
  assert.equal(verifyHistory(root).revisions, 2);
  const before = readFileSync(resolve(root, HISTORY_PATH));
  assert.throws(
    () =>
      importHistory(root, readHistory(root).version, {
        schema: 1,
        assets: [],
        revisions: [],
        attempts: [
          {
            id: 'missing',
            title: 'Missing source',
            date: 'unknown',
            outcome: 'failed',
            files: ['docs/missing.json'],
            notes: 'Missing payload.',
          },
        ],
      }),
    /ENOENT/,
  );
  assert.deepEqual(readFileSync(resolve(root, HISTORY_PATH)), before);
});

await test('removing a source and its runtime adaptation from one folder completes successfully', (t) => {
  const { root, history, file, svg } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const runtime = `${MANAGED_PATH}/sample/runtime.svg`;
  writeFileSync(resolve(root, runtime), svg);
  history.revisions[0].runtimeFile = runtime;
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  removeRevision(root, readHistory(root).version, 'first');
  assert.equal(existsSync(resolve(root, file)), false);
  assert.equal(existsSync(resolve(root, runtime)), false);
  assert.equal(readHistory(root).history.revisions.length, 0);
});

await test('unregistered managed outputs block verification until imported or deliberately retired', (t) => {
  const { root, history } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const request = `${MANAGED_PATH}/unsaved-request.json`;
  writeFileSync(resolve(root, request), '{"model":"fixture"}');
  assert.throws(() => verifyHistory(root), /Unregistered art files/);
  history.attempts.push({
    id: 'new-attempt',
    title: 'New attempt',
    date: 'unknown',
    outcome: 'failed',
    notes: 'Request failed without usage.',
    files: [request],
  });
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  assert.equal(verifyHistory(root).assets, 1);
});

await test('source verification detects an unregistered edit while an unchanged catalogue creates no files', async (t) => {
  const { root } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const history = readHistory(repositoryRoot).history;
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  assert.equal(await verifySourceHistory(root), history.assets.length);
  history.assets[0].sourceDigest = '0'.repeat(64);
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  const before = readFileSync(resolve(root, HISTORY_PATH));
  await assert.rejects(verifySourceHistory(root), /Unregistered source artwork.*snapshot/);
  assert.deepEqual(readFileSync(resolve(root, HISTORY_PATH)), before);
  const current = readHistory(repositoryRoot);
  assert.equal((await snapshotHistory(repositoryRoot, current.version)).saved, 0);
  assert.equal(readHistory(repositoryRoot).version, current.version);
});

await test('registering changed source requires its pre-edit checkpoint, which can be restored from the source reference', (t) => {
  const { root, history, file, svg } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  history.assets[0].sourceDigest = digest(svg);
  history.assets[0].sourceRevision = 'previous-source';
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  removeRevision(root, readHistory(root).version, 'first');
  const changed = `${MANAGED_PATH}/sample/changed.svg`;
  const nextSvg = svg.replace('#d1a963', '#123456');
  mkdirSync(dirname(resolve(root, changed)), { recursive: true });
  writeFileSync(resolve(root, changed), nextSvg);
  const incoming: ArtHistory = {
    schema: 1,
    assets: [
      { ...history.assets[0], sourceDigest: digest(nextSvg), sourceRevision: 'next-source' },
    ],
    attempts: [],
    revisions: [
      {
        ...history.revisions[0],
        id: 'next',
        file: changed,
        digest: digest(nextSvg),
        runtimeFile: changed,
        runtimeDigest: digest(nextSvg),
      },
    ],
  };
  assert.throws(
    () => importHistory(root, readHistory(root).version, incoming),
    /Missing pre-edit checkpoint.*previous-source/,
  );
  writeFileSync(resolve(root, file), svg);
  importHistory(root, readHistory(root).version, {
    schema: 1,
    assets: [],
    attempts: [],
    revisions: [{ ...history.revisions[0], id: 'recovered' }],
  });
  incoming.revisions[0].parents = ['recovered'];
  importHistory(root, readHistory(root).version, incoming);
  assert.equal(readHistory(root).history.assets[0].sourceDigest, digest(nextSvg));
  assert.equal(verifyHistory(root).revisions, 2);
});

await test('removal retains artwork referenced by tests or another managed document', (t) => {
  const { root, file, history } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(resolve(root, 'tests'), { recursive: true });
  writeFileSync(resolve(root, 'tests/fixture.ts'), `export const art = '${file}';`);
  assert.deepEqual(removalPlan(root, 'first').remove, []);
  rmSync(resolve(root, 'tests/fixture.ts'));
  const notes = `${MANAGED_PATH}/reference.md`;
  writeFileSync(resolve(root, notes), `[Source](${file})`);
  history.attempts[0].files = [notes];
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  assert.deepEqual(removalPlan(root, 'first').remove, []);
  removeRevision(root, readHistory(root).version, 'first');
  assert.equal(existsSync(resolve(root, file)), true);
  assert.equal(verifyHistory(root).revisions, 0);
});

await test('binary reference inputs remain viewable in offline attempt records', (t) => {
  const { root, history } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const reference = `${MANAGED_PATH}/reference.png`;
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
    'base64',
  );
  writeFileSync(resolve(root, reference), png);
  history.attempts[0].files.push(reference);
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  assert.deepEqual(historyState(root, false).documents?.[reference], {
    kind: 'image',
    url: 'data:image/png;base64,' + png.toString('base64'),
    animated: false,
  });
});

// Missing unrelated files distinguish metadata/scoped reads from eager preview loading.
await test('large live history serves metadata and one checked preview without reading unrelated art', async (t) => {
  const { root, file, svg, history } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const largeSvg = svg.replace('</svg>', `<!--${'x'.repeat(64 * 1024)}--></svg>`);
  writeFileSync(resolve(root, file), largeSvg);
  history.revisions[0].digest = history.revisions[0].runtimeDigest = digest(largeSvg);
  for (let i = 0; i < 1000; i++)
    history.revisions.push({
      ...history.revisions[0],
      id: `unrelated-${i}`,
      asset: null,
      file: `${MANAGED_PATH}/missing-${i}.svg`,
      runtimeFile: null,
      runtimeDigest: null,
    });
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  const server = await createServer({
    configFile: false,
    root,
    plugins: [artHistoryPlugin(root)],
    server: { host: '127.0.0.1', port: 0, watch: null },
  });
  await server.listen();
  t.after(() => server.close());
  const address = server.httpServer!.address();
  assert.ok(address && typeof address === 'object');
  const base = `http://127.0.0.1:${address.port}/__art/api/`;
  const response = await fetch(base + 'state');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const text = await response.text();
  const state = historyState(root);
  assert.deepEqual(JSON.parse(text), state);
  assert.deepEqual(state.current, {});
  assert.deepEqual(state.previews, {});
  assert.doesNotMatch(text, /data:image/);
  assert.ok(Buffer.byteLength(text) < 500_000);
  const eagerPreviewBytes = Math.ceil(Buffer.byteLength(largeSvg) / 3) * 4 * 1001;
  assert.ok(eagerPreviewBytes > Buffer.byteLength(text) * 200);
  t.diagnostic(
    `${history.revisions.length} revisions: metadata ${Buffer.byteLength(text)} bytes; equivalent embedded previews alone ${eagerPreviewBytes} bytes`,
  );
  const previewUrl = base + `artwork?revision=first&version=${state.version}`;
  const preview = await fetch(previewUrl);
  assert.equal(preview.status, 200);
  const document = (await preview.json()) as { url: string };
  assert.equal(Buffer.from(document.url.split(',')[1], 'base64').toString(), largeSvg);
  assert.throws(() => historyPreview(root, state.version, 'unrelated-0'), /ENOENT/);
  assert.throws(() => historyPreview(root, state.version, '../outside'), /Unknown revision/);
  assert.equal((await fetch(base + 'artwork?revision=first&version=stale')).status, 409);
  assert.equal((await fetch(base + `artwork?asset=unknown&version=${state.version}`)).status, 409);
  writeFileSync(resolve(root, file), svg);
  const changed = await fetch(previewUrl);
  assert.equal(changed.status, 409);
  assert.match(await changed.text(), /changed since registration/);
  assert.equal((await fetch(base + 'state')).status, 200);
  assert.throws(() => historyState(root, false), /changed since registration/);
});

await test('scoped editable-source reads return only the requested slot, with registered source bytes', async () => {
  const current = await currentArtwork('hearth/cub');
  assert.deepEqual(Object.keys(current), ['hearth/cub']);
  const bytes = Buffer.from(current['hearth/cub'].split(',')[1], 'base64');
  const asset = readHistory(repositoryRoot).history.assets.find(
    (asset) => asset.id === 'hearth/cub',
  )!;
  assert.equal(digest(bytes), asset.sourceDigest);
  await assert.rejects(currentArtwork('missing/source'), /source is unavailable/);
});

await test('scoped API and offline previews share the archived SVG and raster decoder without changing original bytes', async (t) => {
  const { root, history, svg } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const original = svg + '   \n';
  const jpeg = readFileSync(
    resolve(repositoryRoot, 'docs/art/assets/creatures/wolf-evolutions-preview.jpg'),
  );
  const formats = [
    {
      extension: 'svg.gz',
      mime: 'image/svg+xml',
      bytes: gzipSync(original),
      decoded: Buffer.from(original),
    },
    {
      extension: 'png',
      mime: 'image/png',
      bytes: readFileSync(
        resolve(
          repositoryRoot,
          'docs/art/assets/blindside-opening-jokers/context/baseline-shop-phone.png',
        ),
      ),
    },
    { extension: 'jpg', mime: 'image/jpeg', bytes: jpeg },
    { extension: 'jpeg', mime: 'image/jpeg', bytes: jpeg },
    {
      extension: 'webp',
      mime: 'image/webp',
      bytes: readFileSync(
        resolve(repositoryRoot, 'docs/art/assets/cartographer-map/before-threat.webp'),
      ),
    },
    {
      extension: 'gif',
      mime: 'image/gif',
      bytes: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
    },
    {
      extension: 'GIF',
      mime: 'image/gif',
      bytes: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
    },
  ];
  const revisions = formats.map((format) => {
    const file = `${MANAGED_PATH}/preview.${format.extension}`;
    writeFileSync(resolve(root, file), format.bytes);
    return {
      ...history.revisions[0],
      id: format.extension,
      file,
      digest: digest(format.bytes),
      asset: null,
      runtimeFile: null,
      runtimeDigest: null,
    };
  });
  importHistory(root, readHistory(root).version, {
    schema: 1,
    assets: [],
    attempts: [],
    revisions,
  });
  const server = await createServer({
    configFile: false,
    root,
    plugins: [artHistoryPlugin(root)],
    server: { host: '127.0.0.1', port: 0, watch: null },
  });
  await server.listen();
  t.after(() => server.close());
  const address = server.httpServer!.address();
  assert.ok(address && typeof address === 'object');
  const base = `http://127.0.0.1:${address.port}/__art/api/`;
  const state = historyState(root);
  assert.deepEqual(state.previews, {});
  const offline = historyState(root, false);
  for (const [index, format] of formats.entries()) {
    const revision = revisions[index];
    const response = await fetch(base + `artwork?revision=${revision.id}&version=${state.version}`);
    assert.equal(response.status, 200);
    const preview = (await response.json()) as { kind: string; url: string; animated: boolean };
    assert.equal(preview.kind, 'image');
    assert.ok(preview.url.startsWith(`data:${format.mime};base64,`));
    assert.deepEqual(
      Buffer.from(preview.url.split(',')[1], 'base64'),
      format.decoded ?? format.bytes,
    );
    assert.equal(preview.animated, format.extension.toLowerCase() === 'gif');
    assert.equal(offline.previews[revision.id], preview.url);
    assert.deepEqual(historyDocument(root, revision.file), preview);
    assert.deepEqual(readFileSync(resolve(root, revision.file)), format.bytes);
    assert.throws(
      () => useRevision(root, state.version, 'hearth/cub', revision.id),
      /no game-compatible/,
    );
    assert.throws(
      () =>
        importHistory(root, state.version, {
          schema: 1,
          assets: [],
          attempts: [],
          revisions: [
            {
              ...revision,
              id: 'invalid-runtime',
              asset: 'hearth/cub',
              runtimeFile: revision.file,
              runtimeDigest: revision.digest,
            },
          ],
        }),
      /static SVG/,
    );
  }
  assert.equal(verifyHistory(root).revisions, formats.length + 1);
  for (const revision of revisions) {
    writeFileSync(resolve(root, revision.file), 'changed after registration');
    const response = await fetch(base + `artwork?revision=${revision.id}&version=${state.version}`);
    assert.equal(response.status, 409);
    assert.match(await response.text(), /changed since registration/);
    assert.throws(() => historyState(root, false), /changed since registration/);
    writeFileSync(resolve(root, revision.file), formats[revisions.indexOf(revision)].bytes);
  }
});

await test('corrupt, unsafe and oversized SVG archives fail scoped, attachment, import, verification and offline reads', async (t) => {
  const { root, history, file: checkpoint } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const file = `${MANAGED_PATH}/unsafe.svg.gz`;
  history.attempts[0].files = [checkpoint];
  history.revisions[0] = { ...history.revisions[0], file, runtimeFile: null, runtimeDigest: null };
  const server = await createServer({
    configFile: false,
    root,
    plugins: [artHistoryPlugin(root)],
    server: { host: '127.0.0.1', port: 0, watch: null },
  });
  await server.listen();
  t.after(() => server.close());
  const address = server.httpServer!.address();
  assert.ok(address && typeof address === 'object');
  const base = `http://127.0.0.1:${address.port}/__art/api/`;
  for (const bytes of [
    Buffer.from('invalid gzip'),
    gzipSync('<svg viewBox="0 0 1 1"/>').subarray(0, -4),
    gzipSync('<svg viewBox="0 0 1 1"><script/></svg>'),
    gzipSync('<svg viewBox="0 0 1 1"><path>'),
    gzipSync('<svg viewBox="0 0 1 1"><image href="https://example.com/x"/></svg>'),
    gzipSync(' '.repeat(16 * 1024 * 1024 + 1)),
  ]) {
    writeFileSync(resolve(root, file), bytes);
    history.revisions[0].digest = digest(bytes);
    writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
    const state = historyState(root);
    assert.deepEqual(state.previews, {});
    const response = await fetch(base + `artwork?revision=first&version=${state.version}`);
    assert.equal(response.status, 409);
    assert.doesNotMatch(await response.text(), /data:image/);
    assert.throws(() => historyDocument(root, file));
    assert.throws(() => historyState(root, false));
    assert.throws(() => verifyHistory(root));
    assert.throws(() =>
      importHistory(root, state.version, {
        schema: 1,
        assets: [],
        attempts: [],
        revisions: [{ ...history.revisions[0], id: 'invalid-import' }],
      }),
    );
    assert.equal(readHistory(root).history.revisions.length, 1);
  }
});
