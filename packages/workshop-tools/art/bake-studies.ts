import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type Plugin } from 'vite';
import { chromium } from '@playwright/test';
import { chromeLaunchOptions } from '../../../tests/browser/chrome.ts';
import { STUDIES } from '../../../src/art3d/catalogue.ts';
import { repositoryRoot } from '../io.ts';
import {
  bakeDirectory,
  nativeStudyIds,
  studyInputs,
  sha256,
  inspectStudyGLB,
  verifyStudyAssets,
  type StudyManifest,
} from './study-assets.ts';

export async function bakeStudies(root = repositoryRoot) {
  const native = nativeStudyIds(root);
  const ids = STUDIES.filter(({ id }) => !native.has(id)).map(({ id }) => id);
  const inputs = studyInputs(root);
  const directory = resolve(root, bakeDirectory);
  mkdirSync(directory, { recursive: true });
  const pending = new Map<string, Buffer>();
  // Only this local browser run can publish its selected IDs; write after every export succeeds.
  const receiver: Plugin = {
    name: 'study-bake-receiver',
    configureServer(server) {
      server.middlewares.use('/__study_bake', (request, response) => {
        const id = request.url?.slice(1);
        if (request.method !== 'POST' || !ids.some((known) => known === id)) {
          response.statusCode = 400;
          response.end();
          return;
        }
        const chunks: Buffer[] = [];
        request.on('data', (chunk: Buffer) => chunks.push(chunk));
        request.on('end', () => {
          pending.set(id!, Buffer.concat(chunks));
          response.end('ok');
        });
      });
    },
  };
  const server = await createServer({
    root,
    plugins: [receiver],
    server: { host: '127.0.0.1', port: 4175, strictPort: true },
  });
  await server.listen();
  try {
    // Disposable profile; launch failure stops before any exports are attempted.
    const browser = await chromium.launch({ ...chromeLaunchOptions(), headless: true });
    try {
      const page = await browser.newPage();
      await page.goto('http://127.0.0.1:4175');
      const manifest: StudyManifest = { schemaVersion: 1, inputs, assets: {} };
      for (const id of ids) {
        const motion = await page.evaluate(async (id) => {
          const path = '/packages/workshop-tools/art/bake-client.ts';
          const { bakeStudy } = (await import(path)) as typeof import('./bake-client.ts');
          return bakeStudy(id);
        }, id);
        const bytes = pending.get(id);
        if (!bytes || inspectStudyGLB(bytes).tracks !== motion.tracks)
          throw new Error(`Invalid export: ${id}`);
        manifest.assets[id] = { sha256: sha256(bytes), bytes: bytes.length, ...motion };
        console.log(`Baked ${id}: ${(bytes.length / 1024 / 1024).toFixed(1)} MiB`);
      }
      if (JSON.stringify(inputs) !== JSON.stringify(studyInputs(root)))
        throw new Error('Bake inputs changed during export');
      for (const [id, bytes] of pending) writeFileSync(resolve(directory, `${id}.glb`), bytes);
      writeFileSync(resolve(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    } finally {
      await browser.close();
    }
  } finally {
    await server.close();
  }
  console.log(`Verified ${verifyStudyAssets(root)} baked studies.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--check')
    console.log(`Verified ${verifyStudyAssets(repositoryRoot)} baked studies.`);
  else if (process.argv.length === 2) await bakeStudies();
  else throw new Error('Usage: bake-studies.ts [--check]');
}
