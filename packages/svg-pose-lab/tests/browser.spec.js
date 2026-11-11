import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const offline = new URL('../dist/index.html', import.meta.url).href;
const fixture = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160">
  <defs><linearGradient id="paint"><stop stop-color="#426564"/><stop offset="1" stop-color="#aadaba"/></linearGradient></defs>
  <rect width="260" height="160" fill="#172928"/>
  <g id="translated" transform="translate(20 16) scale(1.5)">
    <path id="ribbon" d="m20 40 c10-20 45-20 60 0 q20 35 45 20 l-10 35z" fill="url(#paint)" />
  </g>
</svg>`;

function action(page, name) {
  return page.getByRole('button', { name, exact: true });
}

async function openSvg(page, text, name) {
  const chooser = page.waitForEvent('filechooser');
  await action(page, 'Open SVG').click();
  await (await chooser).setFiles({ name, mimeType: 'image/svg+xml', buffer: Buffer.from(text) });
}

async function downloadSvg(page) {
  const result = page.waitForEvent('download');
  await action(page, 'Export SVG').click();
  const download = await result;
  return {
    name: download.suggestedFilename(),
    text: await readFile(await download.path(), 'utf8'),
  };
}

test('example: rotate a pivot, inspect a path, and reset only the pose', async ({ page }) => {
  const errors = [];
  const remote = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (/^https?:/.test(request.url())) remote.push(request.url());
  });
  await page.goto(offline);
  await expect(page.getByRole('heading', { name: 'One Quiet Breath' })).toBeVisible();
  await expect(action(page, 'Glove')).toHaveAttribute('aria-pressed', 'true');
  await action(page, 'Pose').click();
  const handle = page.locator('[data-rotate="attached-supported-glove"]');
  const start = await handle.boundingBox();
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 - 15, start.y + start.height / 2 - 6, {
    steps: 6,
  });
  await page.mouse.up();
  const glove = page.locator('#art-host #attached-supported-glove');
  const pose = await glove.getAttribute('transform');
  expect(pose).toMatch(/^rotate\([1-9]\d* 548 553\)$/);

  await action(page, 'Path').click();
  await action(page, 'Expand or collapse Glove').click();
  await action(page, 'Path 1').click();
  await page.getByText('SVG source', { exact: true }).click();
  const markup = page.getByLabel('Selected SVG markup');
  await expect(markup).toContainText('M545 537');
  await page.getByRole('spinbutton', { name: 'X', exact: true }).fill('552');
  await page.getByRole('spinbutton', { name: 'X', exact: true }).press('Tab');
  await expect(markup).toContainText('M552 537');
  const copy = await downloadSvg(page);
  expect(copy.name).toBe('one-quiet-breath-edited.svg');
  expect(copy.text).toContain('id="attached-supported-glove" transform="' + pose + '"');
  expect(copy.text).toContain('d="M552 537');
  await action(page, 'Reset pose').click();
  await expect(glove).not.toHaveAttribute('transform');
  await expect(markup).toContainText('M552 537');
  await action(page, 'Undo').click();
  await expect(glove).toHaveAttribute('transform', pose);
  await action(page, 'Redo').click();
  await expect(glove).not.toHaveAttribute('transform');
  await action(page, 'Pose').click();
  await action(page, 'Glove').click();
  await page.getByRole('slider', { name: 'Angle' }).press('ArrowRight');
  await expect(glove).toHaveAttribute('transform', 'rotate(1 548 553)');
  await action(page, 'Transform').click();
  await page.keyboard.press('ArrowRight');
  const combined = await glove.getAttribute('transform');
  expect(combined).toMatch(/^matrix\(.+\) rotate\(1 548 553\)$/);
  await action(page, 'Reset pose').click();
  await expect(glove).toHaveAttribute('transform', combined.split(' rotate(')[0]);
  await page.getByRole('checkbox', { name: 'Guides' }).uncheck();
  await expect(page.locator('#guides')).toBeHidden();
  expect(errors).toEqual([]);
  expect(remote).toEqual([]);
});

test('open a transformed SVG, move a curve handle, and reopen the clean download', async ({
  page,
}) => {
  await page.goto(offline);
  await openSvg(page, fixture, 'curve.svg');
  await expect(page.getByRole('heading', { name: 'curve' })).toBeVisible();
  await expect(action(page, 'ribbon')).toHaveAttribute('aria-pressed', 'true');
  const ribbon = page.locator('#art-host #ribbon');
  await page.keyboard.press('p');
  const outline = page.locator('.path-outline');
  const screenPoints = (path) =>
    path.evaluate((node) =>
      [0, node.getTotalLength() / 2].map((length) => {
        const point = node.getPointAtLength(length).matrixTransform(node.getScreenCTM());
        return [point.x, point.y];
      }),
    );
  await expect
    .poll(async () => {
      const [rendered, highlighted] = await Promise.all([
        screenPoints(ribbon),
        screenPoints(outline),
      ]);
      return Math.max(
        ...rendered.map(([x, y], index) =>
          Math.hypot(highlighted[index][0] - x, highlighted[index][1] - y),
        ),
      );
    })
    .toBeLessThan(0.15);
  const firstHandle = page.locator('[data-point="1:0"]');
  const box = await firstHandle.boundingBox();
  const zoom = await ribbon.evaluate((node) => node.getScreenCTM().a);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 8 * zoom, y + 4 * zoom, { steps: 6 });
  await page.mouse.up();
  const edited = await ribbon.getAttribute('d');
  const values = edited.match(/^M20 40 C([\d.]+) ([\d.]+) 65 20 80 40 /);
  expect(Number(values?.[1])).toBeCloseTo(38, 1);
  expect(Number(values?.[2])).toBeCloseTo(24, 1);
  await action(page, 'Undo').click();
  await expect(ribbon).toHaveAttribute('d', 'm20 40 c10-20 45-20 60 0 q20 35 45 20 l-10 35z');
  await action(page, 'Redo').click();
  await expect(ribbon).toHaveAttribute('d', edited);
  const download = await downloadSvg(page);
  expect(download.name).toBe('curve-edited.svg');
  expect(download.text).toContain('d="' + edited + '"');
  expect(download.text).toContain('transform="translate(20 16) scale(1.5)"');
  expect(download.text).toContain('fill="url(#paint)"');
  expect(download.text).not.toMatch(/data-point|id="guides"|viewBox/);

  const dismiss = page.waitForEvent('dialog').then((dialog) => dialog.dismiss());
  await Promise.all([dismiss, openSvg(page, download.text, download.name)]);
  await expect(page.getByRole('heading', { name: 'curve', exact: true })).toBeVisible();
  await expect(ribbon).toHaveAttribute('d', edited);

  const accept = page.waitForEvent('dialog').then((dialog) => dialog.accept());
  await Promise.all([accept, openSvg(page, download.text, download.name)]);
  await expect(page.getByRole('heading', { name: 'curve-edited' })).toBeVisible();
  await expect(ribbon).toHaveAttribute('d', edited);
  await expect(action(page, 'Undo')).toBeDisabled();
  await action(page, 'Open example').click();
  await expect(page.getByRole('heading', { name: 'One Quiet Breath' })).toBeVisible();
  await expect(action(page, 'Glove')).toHaveAttribute('aria-pressed', 'true');
});

test('reject active SVG content without replacing the open file', async ({ page }) => {
  const remote = [];
  page.on('request', (request) => {
    if (/^https?:/.test(request.url())) remote.push(request.url());
  });
  await page.goto(offline);
  const bad = [
    [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script>alert(1)</script></svg>',
      /Unsupported SVG element: <script>/,
    ],
    [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><use href="https://example.invalid/a.svg#b"/></svg>',
      /Only local SVG references/,
    ],
    [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path onload="alert(1)"/></svg>',
      /Unsupported SVG attribute: onload/,
    ],
    [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path style="fill:url(https://example.invalid/f.svg#paint)"/></svg>',
      /Only plain paint values/,
    ],
  ];
  for (const [svg, error] of bad) {
    await openSvg(page, svg, 'blocked.svg');
    await expect(page.locator('#notice')).toHaveText(error);
    await expect(page.getByRole('heading', { name: 'One Quiet Breath' })).toBeVisible();
  }
  expect(remote).toEqual([]);
});

test('phone: touch cancellation restores the path and controls reflow with larger text', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  try {
    const page = await context.newPage();
    await page.goto(offline);
    await openSvg(page, fixture, 'curve.svg');
    await expect(action(page, 'ribbon')).toHaveAttribute('aria-pressed', 'true');
    await action(page, 'Path').tap();
    const ribbon = page.locator('#art-host #ribbon');
    const original = await ribbon.getAttribute('d');
    const box = await page.locator('[data-point="1:0"]').boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + 24, y: y - 14 }],
    });
    await expect(ribbon).not.toHaveAttribute('d', original);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await expect(ribbon).toHaveAttribute('d', original);
    await expect(action(page, 'Undo')).toBeDisabled();
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '18px';
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  } finally {
    await context.close();
  }
});

const objects = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">
  <g id="left" transform="translate(30 30) scale(2)">
    <rect id="tile" x="10" y="10" width="20" height="12" fill="#92ad91"/>
    <circle id="dot" cx="43" cy="18" r="10" fill="#d99569"/>
    <rect id="spacer" x="50" y="40" width="15" height="15" fill="#a6b2d8"/>
    <rect id="last" x="20" y="60" width="10" height="12" fill="#ebc488"/>
  </g>
  <g id="right" transform="translate(220 86) rotate(30)">
    <rect id="remote" x="0" y="0" width="24" height="20" fill="#87a8c6"/>
  </g>
</svg>`;

const object = (page, id) => page.locator('#art-host #' + id);
async function pointInArt(locator, x, y) {
  return locator.evaluate(
    (node, [x, y]) => {
      const matrix = node.ownerSVGElement.getScreenCTM().inverse().multiply(node.getScreenCTM());
      const p = new DOMPoint(x, y).matrixTransform(matrix);
      return [p.x, p.y];
    },
    [x, y],
  );
}
const checkPoint = (actual, expected) => {
  expect(actual[0]).toBeCloseTo(expected[0], 1);
  expect(actual[1]).toBeCloseTo(expected[1], 1);
};
async function grip(page, name) {
  const box = await page.locator('[data-affine="' + name + '"]').boundingBox();
  if (!box) throw new Error('Missing grip: ' + name);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
async function dragGrip(page, name, getEnd) {
  const start = await grip(page, name);
  const end = getEnd(start);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 7 });
  await page.mouse.up();
}

test('group adjacent objects, drag all three affine handles, and ungroup without moving artwork', async ({
  page,
}) => {
  await page.goto(offline);
  await openSvg(page, objects, 'objects.svg');
  await expect(page.getByRole('heading', { name: 'objects' })).toBeVisible();
  await action(page, 'Expand or collapse left').click();
  await action(page, 'tile').click();
  await action(page, 'dot').click({ modifiers: ['Shift'] });
  await expect(page.getByText('2 objects selected')).toBeVisible();
  const tile = object(page, 'tile');
  const dot = object(page, 'dot');
  checkPoint(await pointInArt(tile, 10, 10), [50, 50]);
  await action(page, 'Group').click();
  const group = page.locator('#art-host #left > g');
  await expect(group.locator('#tile')).toBeAttached();
  await expect(group.locator('#dot')).toBeAttached();
  checkPoint(await pointInArt(tile, 10, 10), [50, 50]);

  const zoom = await tile.evaluate((node) => node.ownerSVGElement.getScreenCTM().a);
  await dragGrip(page, 'move', ({ x, y }) => ({ x: x + 18 * zoom, y: y + 8 * zoom }));
  checkPoint(await pointInArt(tile, 10, 10), [68, 58]);
  checkPoint(await pointInArt(dot, 43, 18), [134, 74]);
  const translation = await group.getAttribute('transform');
  await page.keyboard.press('Control+z');
  checkPoint(await pointInArt(tile, 10, 10), [50, 50]);
  await page.keyboard.press('Control+Shift+z');
  await expect(group).toHaveAttribute('transform', translation);

  const dotBeforeScale = await pointInArt(dot, 43, 18);
  await dragGrip(page, 'scale-se', ({ x, y }) => ({ x: x + 12 * zoom, y: y + 9 * zoom }));
  // The opposite corner is the top of the circle, 4 units above the tile.
  checkPoint(await pointInArt(dot, 33, 8), [68 + 46 * (98 / 86), 54]);
  const dotAfterScale = await pointInArt(dot, 43, 18);
  expect(dotAfterScale[0]).toBeGreaterThan(dotBeforeScale[0]);
  expect(dotAfterScale[1]).toBeGreaterThan(dotBeforeScale[1]);

  const center = await grip(page, 'move');
  const startTile = await pointInArt(tile, 10, 10);
  const startDot = await pointInArt(dot, 43, 18);
  const a = Math.PI / 6;
  await dragGrip(page, 'rotate', ({ x, y }) => {
    const dx = x - center.x,
      dy = y - center.y;
    return {
      x: center.x + dx * Math.cos(a) - dy * Math.sin(a),
      y: center.y + dx * Math.sin(a) + dy * Math.cos(a),
    };
  });
  const rotatedTile = await pointInArt(tile, 10, 10);
  const rotatedDot = await pointInArt(dot, 43, 18);
  const vector = [startDot[0] - startTile[0], startDot[1] - startTile[1]];
  checkPoint(
    [rotatedDot[0] - rotatedTile[0], rotatedDot[1] - rotatedTile[1]],
    [
      vector[0] * Math.cos(a) - vector[1] * Math.sin(a),
      vector[0] * Math.sin(a) + vector[1] * Math.cos(a),
    ],
  );
  await page.keyboard.press('Shift+g');
  await expect(group).toHaveCount(0);
  checkPoint(await pointInArt(tile, 10, 10), rotatedTile);
  checkPoint(await pointInArt(dot, 43, 18), rotatedDot);
  expect(
    await object(page, 'left').evaluate((node) => [...node.children].map((child) => child.id)),
  ).toEqual(['tile', 'dot', 'spacer', 'last']);
  await page.keyboard.press('Control+z');
  await expect(group.locator('#tile')).toBeAttached();
  const requested = page.waitForEvent('download');
  await page.keyboard.press('Control+s');
  const copy = await readFile(await (await requested).path(), 'utf8');
  expect(copy).toContain('<g transform="matrix(');
  expect(copy).not.toMatch(/data-affine|selection-frame/);
});

test('multi-select across parents, protect paint order, and expose keyboard shortcuts', async ({
  page,
}) => {
  await page.goto(offline);
  await openSvg(page, objects, 'objects.svg');
  await expect(page.getByRole('heading', { name: 'objects' })).toBeVisible();
  await action(page, 'Expand or collapse left').click();
  await action(page, 'tile').click();
  await action(page, 'last').click({ modifiers: ['Shift'] });
  await expect(action(page, 'Group')).toBeDisabled();
  await expect(page.getByText(/Select adjacent objects/)).toBeVisible();
  await action(page, 'last').click({ modifiers: ['Shift'] });
  await action(page, 'Multi-select').click();
  await action(page, 'Expand or collapse right').click();
  await object(page, 'remote').click();
  await expect(page.getByText(/Grouping needs objects in the same layer group/)).toBeVisible();
  await expect(action(page, 'Group')).toBeDisabled();
  await page.keyboard.press('Shift+ArrowRight');
  checkPoint(await pointInArt(object(page, 'tile'), 10, 10), [60, 50]);
  checkPoint(await pointInArt(object(page, 'remote'), 0, 0), [230, 86]);

  await page.keyboard.press('?');
  const reference = page.getByRole('heading', { name: 'Keyboard shortcuts' });
  await expect(page).toHaveURL(/#shortcuts$/);
  await expect(reference).toBeFocused();
  await expect(action(page, 'Transform')).toBeHidden();
  await page.keyboard.press('h');
  await page.getByRole('link', { name: 'Back to editor' }).click();
  await expect(reference).toBeHidden();
  await expect(page.getByText('2 objects selected')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Guides' })).toBeChecked();
  checkPoint(await pointInArt(object(page, 'remote'), 0, 0), [230, 86]);
  await page.keyboard.press('Escape');
  await expect(page.getByText('No selection')).toBeVisible();
  await page.keyboard.press('h');
  await expect(page.locator('#guides')).toBeHidden();
  await action(page, 'left').click();
  await action(page, 'tile').click();
  await page.keyboard.press('ArrowRight');
  checkPoint(await pointInArt(object(page, 'tile'), 10, 10), [61, 50]);
});

test('open the shortcuts page directly and use file, tool, source, guide, and history keys', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(offline + '#shortcuts');
  await expect(page.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'One Quiet Breath' })).toBeVisible();

  await page.keyboard.press('m');
  await expect(action(page, 'Multi-select')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('j');
  await expect(action(page, 'Pose')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('slider', { name: 'Angle' }).press('ArrowRight');
  const glove = object(page, 'attached-supported-glove');
  await expect(glove).toHaveAttribute('transform', 'rotate(1 548 553)');
  await page.keyboard.press('r');
  await expect(glove).not.toHaveAttribute('transform');
  await page.keyboard.press('Control+z');
  await expect(glove).toHaveAttribute('transform', 'rotate(1 548 553)');
  await page.keyboard.press('Control+y');
  await expect(glove).not.toHaveAttribute('transform');
  await page.keyboard.press('i');
  await expect(page.getByLabel('Selected SVG markup')).toBeVisible();

  const guides = page.getByRole('checkbox', { name: 'Guides' });
  await guides.focus();
  await page.keyboard.press('h');
  await expect(guides).not.toBeChecked();
  await page.keyboard.press('h');
  await expect(guides).toBeChecked();
  // Opening the chooser is a user action; cancelling it keeps the working copy.
  const requested = page.waitForEvent('filechooser');
  await page.keyboard.press('o');
  await (await requested).setFiles([]);
  await expect(page.getByRole('heading', { name: 'One Quiet Breath' })).toBeVisible();

  await page.keyboard.press('Control+z');
  await page.keyboard.press('Control+z');
  await expect(action(page, 'Undo')).toBeDisabled();
  await openSvg(page, fixture, 'curve.svg');
  await expect(page.getByRole('heading', { name: 'curve' })).toBeVisible();
  await page.keyboard.press('j');
  await expect(action(page, 'Transform')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Shift+o');
  await expect(page.getByRole('heading', { name: 'One Quiet Breath' })).toBeVisible();
});
