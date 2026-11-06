import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { Script } from 'node:vm';
import { movieRoot, movies } from '../ci/movies.ts';

const root = resolve(import.meta.dirname, '../../..');
const media = [
  ['haunted-island/haunted-island.gif', 480, 480, 225, 15],
  ['little-haunt/little-haunt.gif', 960, 864, 375, 15],
  ['lantern-keep/lantern-keep.gif', 900, 900, 300, 15],
  ['golden-claw/golden-claw.gif', 512, 288, 900, 30],
  ['golden-claw/golden-claw.mp4', 960, 540, 900, 30],
] as const;
for (const [file, width, height, frames, seconds] of media)
  void test(`retained movie decodes completely with its delivered timing: ${file}`, () => {
    const path = resolve(root, movieRoot, file);
    const result = JSON.parse(
      execFileSync(
        'ffprobe',
        [
          '-v',
          'error',
          '-select_streams',
          'v:0',
          '-show_entries',
          'stream=width,height,nb_frames,duration',
          '-of',
          'json',
          path,
        ],
        { encoding: 'utf8' },
      ),
    ) as { streams: { width: number; height: number; nb_frames: string; duration: string }[] };
    assert.equal(result.streams.length, 1);
    const stream = result.streams[0];
    assert.deepEqual(
      [stream.width, stream.height, Number(stream.nb_frames), Number(stream.duration)],
      [width, height, frames, seconds],
    );
    // Probe metadata alone can accept truncated payloads. Decode all streams too.
    execFileSync('ffmpeg', ['-v', 'error', '-xerror', '-i', path, '-f', 'null', '-'], {
      stdio: 'pipe',
      timeout: 60_000,
    });
  });
for (const [id, movie] of Object.entries(movies))
  for (const file of movie.files.filter((file) => file.endsWith('.html')))
    void test(`standalone movie retains offline source: ${id}`, () => {
      const html = readFileSync(resolve(root, movieRoot, id, file), 'utf8');
      assert.doesNotMatch(html, /<(?:script|img|link)\b[^>]*(?:src|href)=["']https?:/i);
      assert.doesNotMatch(html, /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);
      for (const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Script(script[1]);
    });
