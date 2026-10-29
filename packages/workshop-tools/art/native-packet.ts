import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Shared by the native scaffold and its dependency-free documentation contract. */
export async function renderNativePacket(root: string, id: string) {
  const files = [
    ['native-brief.md.template', 'brief.md'],
    ['motion-study.ts.template', 'study.ts.template'],
    ['native-handoff.md.template', 'handoff.md'],
  ];
  return Promise.all(
    files.map(async ([template, filename]) => {
      const source = await readFile(resolve(root, 'skills/card-art/assets', template), 'utf8');
      return { filename, content: source.replaceAll('{{id}}', id) };
    }),
  );
}
