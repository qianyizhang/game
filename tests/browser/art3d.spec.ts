import { browserBudget, sceneReadyTimeout } from './budget';
import { gltfJson } from './gltf-json';
import type { StudyId } from '../../src/art3d/catalogue';
import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadRegistry } from '../../packages/dcc-workbench/registry';
import {
  resolvePublication,
  type ResolvedPublication,
} from '../../packages/dcc-workbench/releases';

// Expected defaults come from verified on-disk reviews, independently of the
// browser loader. Drafts have no current release and keep their procedural study.
const dccRoot = resolve('packages/dcc-workbench');
const nativeDeliveries = new Map<string, ResolvedPublication>();
for (const asset of Object.values(loadRegistry(dccRoot).assets)) {
  if (!existsSync(resolve(dccRoot, asset.delivery.publication, 'current.json'))) continue;
  const publication = resolvePublication(dccRoot, asset);
  if (publication.reviewScope === 'gallery' && publication.reviewDecision === 'accepted')
    nativeDeliveries.set(publication.legacyStudyId, publication);
}

const studyNames = [
  'Nightjar',
  'Catalyst',
  'Phoenix',
  'Hydra',
  'Spiral',
  'Vajra',
  'Prowler',
  'Wolf',
  'Matriarch',
  'Thornstag',
  'Moonmoth',
  'Bogtoad',
  'Crocolisk',
  'Scavenger',
  'Guardian',
  'Tortoise',
  'Stormroc',
  'Stray',
  'Pack Caller',
  'Cub',
  'Amalgam',
  'Imp',
  'Matron',
  'Juggler',
  'Watcher',
  'Herald',
  'Patron',
  'Squire',
  'Banner Bearer',
];

for (const [index, name] of studyNames.entries()) {
  test(
    `${name} renders, exports real meshes, and works on phone without changing saves`,
    {
      tag: `@asset-shard-${(index % 3) + 1}`,
    },
    async ({ page }, info) => {
      // Each study owns its browser/export budget; a slow subject cannot consume the next one.
      test.setTimeout(browserBudget(60_000));
      const delivery = nativeDeliveries.get(name.toLowerCase().replaceAll(' ', ''));
      const errors: string[] = [];
      const normalWarnings: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.text().includes('Creating normalized normal attribute'))
          normalWarnings.push(message.text());
      });
      await page.goto('/');
      const saves = await page.evaluate(() =>
        JSON.stringify(
          Object.fromEntries(
            Object.entries(localStorage).filter(([key]) => key !== 'card-workshop.screen'),
          ),
        ),
      );
      await page.getByRole('button', { name: '3D art gallery' }).click();
      await expect(page).toHaveURL(/art=3d/);
      await expect(page.getByRole('heading', { name: 'From ink to object.' })).toBeVisible();
      await page.getByRole('button', { name: 'Pause animation' }).click();
      await page
        .getByRole('navigation', { name: 'Choose a 3D study' })
        .getByRole('button', { name: new RegExp(name) })
        .click();
      await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true', {
        timeout: sceneReadyTimeout,
      });
      await expect(page.locator('.study-render')).toHaveAttribute(
        'data-delivery',
        delivery ? 'native' : 'procedural',
      );
      // Every legacy asset must still move; shared recording controls use representatives below.
      await page.getByLabel('Animation timeline').fill('0');
      const restPose = await page.locator('canvas').screenshot();
      await page.getByLabel('Animation timeline').fill('0.75');
      await expect(async () =>
        expect((await page.locator('canvas').screenshot()).equals(restPose)).toBe(false),
      ).toPass();
      await page.getByLabel('Animation timeline').fill('0');
      await expect(page.getByRole('alert')).toHaveCount(0);
      await expect(page.locator('.source-art svg')).toBeVisible();
      // Native deliveries are assembled; layered procedural studies retain separation.
      if (!delivery && ['Nightjar', 'Phoenix', 'Catalyst'].includes(name))
        await expect(page.getByRole('button', { name: 'Separate the layers' })).toBeEnabled();
      else
        await expect(
          page.getByRole('button', { name: 'Layers assembled as one object' }),
        ).toBeDisabled();
      await page.locator('.art-studio').screenshot({
        path: info.outputPath(`${name.toLowerCase().replaceAll(' ', '')}-desktop.png`),
      });
      const before = await page.locator('canvas').screenshot({
        path: info.outputPath(`${name.toLowerCase().replaceAll(' ', '')}-object.png`),
      });
      await page.getByRole('button', { name: 'Side', exact: true }).click();
      await expect(async () => {
        expect((await page.locator('canvas').screenshot()).equals(before)).toBe(false);
      }).toPass();
      await page.locator('canvas').screenshot({
        path: info.outputPath(`${name.toLowerCase().replaceAll(' ', '')}-side.png`),
      });
      await page.getByRole('button', { name: 'Front', exact: true }).click();
      await page.locator('canvas').screenshot({
        path: info.outputPath(`${name.toLowerCase().replaceAll(' ', '')}-front.png`),
      });
      await page.getByRole('button', { name: 'Reset camera' }).click();
      await page.setViewportSize({ width: 390, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.locator('.studio-stage').screenshot({
        path: info.outputPath(`${name.toLowerCase().replaceAll(' ', '')}-phone-stage.png`),
      });
      await page.setViewportSize({ width: 1440, height: 1080 });
      const modelEvent = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download 3D model' }).click();
      const download = await modelEvent;
      expect(download.suggestedFilename()).toBe(
        `card-workshop-${name.toLowerCase().replaceAll(' ', '')}.glb`,
      );
      const modelPath = info.outputPath(download.suggestedFilename());
      await download.saveAs(modelPath);
      const bytes = await readFile(modelPath);
      if (delivery) expect(bytes).toEqual(await readFile(delivery.modelPath));
      expect(bytes.toString('utf8', 0, 4)).toBe('glTF');
      expect(bytes.readUInt32LE(4)).toBe(2);
      expect(bytes.readUInt32LE(8)).toBe(bytes.length);
      const jsonLength = bytes.readUInt32LE(12);
      const gltf = gltfJson(bytes.toString('utf8', 20, 20 + jsonLength));
      expect(gltf.meshes.length).toBeGreaterThan(0);
      for (const mesh of gltf.meshes)
        for (const primitive of mesh.primitives) {
          expect(gltf.accessors[primitive.attributes.POSITION].count).toBeGreaterThan(0);
        }
      expect(gltf.animations).toHaveLength(1);
      expect(gltf.animations[0].channels.length).toBeGreaterThan(0);
      for (const channel of gltf.animations[0].channels)
        expect(gltf.nodes[channel.target.node]).toBeDefined();
      const normalsUrl = '/downloaded-study-normals.glb';
      await page.route(`**${normalsUrl}`, (route) =>
        route.fulfill({ body: bytes, contentType: 'model/gltf-binary' }),
      );
      const inspectNormals = (url: string) =>
        page.evaluate(async (url) => {
          const helper = '/tests/browser/study-normals.ts';
          const { inspectStudyExportNormals } = (await import(
            helper
          )) as typeof import('./study-normals');
          return inspectStudyExportNormals(url);
        }, url);
      const normals = await inspectNormals(normalsUrl);
      expect(normals.meshCount).toBeGreaterThan(0);
      expect(normals.normalCount).toBeGreaterThan(0);
      await writeFile(info.outputPath('export-normals.json'), JSON.stringify(normals));
      if (name === 'Cub') {
        // Prove the delivery assertion catches a damaged file, not just a happy path.
        const normalIndex = gltf.meshes[0].primitives[0].attributes.NORMAL;
        const accessor = gltf.accessors[normalIndex];
        expect(accessor.componentType).toBe(5126); // Current export fixture uses Float32.
        const view = gltf.bufferViews[accessor.bufferView!];
        const binaryHeader = 20 + jsonLength;
        expect(bytes.readUInt32LE(binaryHeader + 4)).toBe(0x004e4942);
        const offset = binaryHeader + 8 + view.byteOffset + accessor.byteOffset;
        const damaged = Buffer.from(bytes);
        for (let axis = 0; axis < 3; axis++) damaged.writeFloatLE(0, offset + axis * 4);
        const damagedUrl = '/damaged-study-normal.glb';
        await page.route(`**${damagedUrl}`, (route) =>
          route.fulfill({ body: damaged, contentType: 'model/gltf-binary' }),
        );
        await expect(inspectNormals(damagedUrl)).rejects.toThrow('Invalid exported normal');
      }
      if (
        [
          'Nightjar',
          'Catalyst',
          'Phoenix',
          'Hydra',
          'Prowler',
          'Wolf',
          'Matriarch',
          'Thornstag',
          'Moonmoth',
          'Bogtoad',
          'Crocolisk',
          'Scavenger',
          'Guardian',
          'Tortoise',
          'Stormroc',
          'Stray',
          'Pack Caller',
          'Cub',
          'Amalgam',
          'Imp',
          'Matron',
          'Juggler',
          'Watcher',
          'Herald',
          'Patron',
          'Squire',
          'Banner Bearer',
        ].includes(name)
      )
        expect(gltf.images.length).toBeGreaterThan(0);
      else {
        expect(gltf.animations[0].channels).toHaveLength(1);
        const channel = gltf.animations[0].channels[0];
        expect(gltf.nodes[channel.target.node].name).toBe(`${name}_Display`);
        expect(channel.target.path).toBe('rotation');
        if (name === 'Vajra') {
          const castMaterial = gltf.materials.find(
            (material: { pbrMetallicRoughness?: { metallicRoughnessTexture?: unknown } }) =>
              material.pbrMetallicRoughness?.metallicRoughnessTexture,
          );
          expect(castMaterial).toBeDefined();
          const packed = castMaterial!.pbrMetallicRoughness!.metallicRoughnessTexture!;
          const image = gltf.images[gltf.textures[packed.index].source!];
          expect(image.mimeType).toBe('image/png');
          expect(gltf.bufferViews[image.bufferView!].byteLength).toBeGreaterThan(0);
        }
      }
      if (name === 'Hydra') {
        expect(gltf.skins.length).toBeGreaterThan(0);
        const skin = gltf.skins[0];
        expect(skin.joints).toHaveLength(28);
        expect(gltf.accessors[skin.inverseBindMatrices!].count).toBe(28);
        const tracks = gltf.animations[0].channels.map(
          (channel: { target: { node: number } }) => gltf.nodes[channel.target.node].name,
        );
        for (let neck = 0; neck < 3; neck++) {
          expect(tracks).toContain(`Hydra_Neck_${neck}_Joint_8`);
          expect(tracks).toContain(`Hydra_Head_${neck}`);
          expect(tracks).toContain(`Hydra_Jaw_${neck}`);
        }
        const body = gltf.nodes.find((node) => node.name === 'Hydra_Joined_Shoulder_And_Necks');
        expect(body!.skin).toBeDefined();
        const primitive = gltf.meshes[body!.mesh!].primitives[0];
        expect(primitive.attributes.JOINTS_0).toBeDefined();
        expect(primitive.attributes.WEIGHTS_0).toBeDefined();
      }
      if (
        [
          'Nightjar',
          'Phoenix',
          'Hydra',
          'Prowler',
          'Wolf',
          'Matriarch',
          'Thornstag',
          'Moonmoth',
          'Bogtoad',
          'Crocolisk',
          'Scavenger',
          'Guardian',
          'Tortoise',
          'Stormroc',
          'Stray',
          'Pack Caller',
          'Cub',
          'Amalgam',
          'Imp',
          'Matron',
          'Juggler',
          'Watcher',
          'Herald',
          'Patron',
          'Squire',
          'Banner Bearer',
        ].includes(name)
      ) {
        const id = name.toLowerCase().replaceAll(' ', '');
        const url = `/${id}-roundtrip.glb`;
        await page.route(`**${url}`, (route) =>
          route.fulfill({ body: bytes, contentType: 'model/gltf-binary' }),
        );
        const roundtrip = await page.evaluate(
          async ({ id, url }) => {
            const helper = '/tests/browser/study-roundtrip.ts';
            const { compareStudyRoundtrip } = (await import(
              helper
            )) as typeof import('./study-roundtrip');
            return compareStudyRoundtrip(id as StudyId, url);
          },
          { id, url },
        );
        expect(roundtrip.skinCount).toBeGreaterThan(0);
        expect(roundtrip.animatedCount).toBeGreaterThan(0);
        expect(roundtrip.maxVertexError).toBeLessThan(0.0001);
        expect(roundtrip.maxNodeError).toBeLessThan(0.0001);
        for (const [kind, image] of [
          ['live', roundtrip.liveImage],
          ['exported', roundtrip.exportedImage],
        ])
          await writeFile(
            info.outputPath(`${id}-roundtrip-${kind}.png`),
            Buffer.from(image.split(',')[1], 'base64'),
          );
        await writeFile(
          info.outputPath(`${id}-roundtrip.json`),
          JSON.stringify({
            maxVertexError: roundtrip.maxVertexError,
            maxNodeError: roundtrip.maxNodeError,
            skinCount: roundtrip.skinCount,
            animatedCount: roundtrip.animatedCount,
          }),
        );
      }
      if (name === 'Catalyst') expect(gltf.extensionsUsed).toContain('KHR_materials_transmission');
      await page
        .getByRole('navigation', { name: 'Choose a 3D study' })
        .getByRole('button', { name: /Catalyst/ })
        .click();
      await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true', {
        timeout: sceneReadyTimeout,
      });
      await page.getByRole('button', { name: 'Wireframe', exact: true }).click();
      await page.getByRole('button', { name: 'Separate the layers' }).click();
      await page.getByLabel('Lighting', { exact: true }).selectOption('moon');
      await expect(page.getByRole('button', { name: 'Wireframe', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await page
        .locator('.studio-stage')
        .screenshot({ path: info.outputPath('catalyst-wireframe.png') });
      await page.getByRole('button', { name: 'Wireframe', exact: true }).click();
      await page.getByRole('button', { name: 'Separate the layers' }).click();
      await page.getByLabel('Lighting', { exact: true }).selectOption('studio');
      await page.setViewportSize({ width: 390, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true', {
        timeout: sceneReadyTimeout,
      });
      await page.locator('.art-studio').screenshot({ path: info.outputPath('catalyst-phone.png') });
      const imageEvent = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Save image' }).click();
      const image = await imageEvent;
      await image.saveAs(info.outputPath(image.suggestedFilename()));
      const png = await readFile(info.outputPath(image.suggestedFilename()));
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      await page.getByRole('button', { name: 'My table' }).click();
      await expect(page).not.toHaveURL(/art=3d/);
      await expect(page.getByRole('button', { name: '3D art gallery' })).toBeFocused();
      expect(
        await page.evaluate(() =>
          JSON.stringify(
            Object.fromEntries(
              Object.entries(localStorage).filter(([key]) => key !== 'card-workshop.screen'),
            ),
          ),
        ),
      ).toBe(saves);
      await page.getByRole('button', { name: '3D art gallery' }).click();
      await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true', {
        timeout: sceneReadyTimeout,
      });
      expect(errors).toEqual([]);
      expect(normalWarnings).toEqual([]);
    },
  );
}

// Shared startup policy: rigid object, skinned creature and expensive cold construction.
for (const studyName of ['Vajra', 'Hydra', 'Banner Bearer']) {
  test(`${studyName} direct gallery link respects reduced motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/?art=3d&study=${studyName.toLowerCase().replaceAll(' ', '')}`);
    // Cold direct routes construct the implicit surfaces before mounting the gallery.
    await expect(page.getByRole('region', { name: `${studyName} 3D study` })).toBeVisible({
      timeout: browserBudget(15_000),
    });
    await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true', {
      timeout: sceneReadyTimeout,
    });
    await expect(page.getByRole('button', { name: 'Slow turntable' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect(page.getByRole('button', { name: 'Play animation' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect(page).toHaveTitle('3D Object Studies · Card Workshop');
    if (studyName === 'Vajra') {
      // Reduced motion keeps this comparison about pointer orbit, not animation.
      const canvas = page.locator('canvas');
      const before = await canvas.screenshot();
      const box = (await canvas.boundingBox())!;
      const x = box.x + box.width * 0.25,
        y = box.y + box.height * 0.5;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + box.height / 2, y, { steps: 4 });
      await page.mouse.up();
      await expect(async () =>
        expect((await canvas.screenshot()).equals(before)).toBe(false),
      ).toPass({ timeout: browserBudget(5_000) });
    }
  });
}

// Recorder/codec coverage: rigid, skinned, transparent and heavy scenes.
for (const name of ['Vajra', 'Hydra', 'Catalyst', 'Banner Bearer']) {
  test(`${name} animation can be paused, scrubbed, and saved as a playable video`, async ({
    page,
  }, info) => {
    await page.goto('/?art=3d');
    await page
      .getByRole('navigation', { name: 'Choose a 3D study' })
      .getByRole('button', { name: new RegExp(name) })
      .click();
    await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true', {
      timeout: sceneReadyTimeout,
    });
    const initialTime = Number.parseFloat(
      await page.locator('.animation-timeline output').innerText(),
    );
    expect(initialTime).toBeGreaterThanOrEqual(0);
    expect(initialTime).toBeLessThanOrEqual(6);
    await page.getByRole('button', { name: 'Pause animation' }).click();
    await page.getByLabel('Animation timeline').fill('0');
    const still = await page.locator('canvas').screenshot();
    await page.getByLabel('Animation timeline').fill('0.75');
    await expect(async () =>
      expect((await page.locator('canvas').screenshot()).equals(still)).toBe(false),
    ).toPass();
    await page.locator('.studio-stage').screenshot({
      path: info.outputPath(`${name.toLowerCase().replaceAll(' ', '')}-detail.png`),
    });
    const videoEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Save animation loop' }).click();
    await expect(page.getByRole('button', { name: 'Recording…' })).toBeDisabled();
    const video = await videoEvent;
    await video.saveAs(info.outputPath(video.suggestedFilename()));
    const bytes = await readFile(info.outputPath(video.suggestedFilename()));
    expect(bytes.subarray(0, 4).toString('hex')).toBe('1a45dfa3');
    expect(bytes.length).toBeGreaterThan(20000);
    await page.route('**/recorded-animation.webm', (route) =>
      route.fulfill({ body: bytes, contentType: 'video/webm' }),
    );
    const decoded = await page.evaluate(async () => {
      const video = document.createElement('video');
      video.src = '/recorded-animation.webm';
      video.muted = true;
      await new Promise<void>((resolve, reject) => {
        video.onloadeddata = () => resolve();
        video.onerror = () => reject(new Error('Video decoding failed'));
      });
      const width = video.videoWidth,
        height = video.videoHeight;
      video.currentTime = 0.5;
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0);
      const first = canvas.toDataURL();
      video.currentTime = 1.5;
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });
      ctx.drawImage(video, 0, 0);
      return { width, height, moving: first !== canvas.toDataURL() };
    });
    expect(decoded.width).toBeGreaterThan(300);
    expect(decoded.height).toBeGreaterThan(300);
    expect(decoded.moving).toBe(true);
  });
}
