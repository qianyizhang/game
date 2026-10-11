import { repositoryRoot as root, reportFailure } from '../io.ts';
import { mkdir, lstat, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

function destinationPath(destination: string) {
  const output = resolve(root, destination);
  const local = relative(root, output);
  if (!local || isAbsolute(local) || local.startsWith(`..${sep}`) || local === '..')
    throw new Error('The destination must be inside this repository.');
  return output;
}

async function prepareParent(output: string) {
  let parent = root;
  for (const part of relative(root, dirname(output)).split(sep).filter(Boolean)) {
    parent = resolve(parent, part);
    await mkdir(parent).catch((error: unknown) => {
      if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'EEXIST')
        throw error;
    });
    if ((await lstat(parent)).isSymbolicLink())
      throw new Error('Destination parents must not be symlinks.');
  }
}

async function scaffoldStudy(args: string[]) {
  const [id, destination, ...extra] = args;
  if (!id || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id))
    throw new Error('Use a lowercase kebab-case study ID.');
  if (!destination || extra.length)
    throw new Error('Provide a study ID and one fresh destination directory.');
  const output = destinationPath(destination);
  const files = [
    ['native-brief.md.template', 'brief.md'],
    ['motion-study.ts.template', 'study.ts.template'],
    ['native-handoff.md.template', 'handoff.md'],
  ];
  const rendered = await Promise.all(
    files.map(async ([template, filename]) => {
      const source = await readFile(resolve(root, 'skills/card-art/assets', template), 'utf8');
      return { filename, content: source.replaceAll('{{id}}', id) };
    }),
  );
  await prepareParent(output);
  await mkdir(output); // Exclusive: preserve even an existing empty or partially authored packet.
  for (const { filename, content } of rendered)
    await writeFile(resolve(output, filename), content, { flag: 'wx' });
  console.log(
    `Created ${relative(root, output)}. Fill brief.md, follow the native modeling playbook, then complete handoff.md. The adapter is a template; no assets or registration were changed.`,
  );
}

export async function runCli(args: string[]) {
  if (args[0] === 'study') return scaffoldStudy(args.slice(1));
  const [name, destination, kind = 'card', ...extra] = args;
  if (name === '--help' || !name) {
    console.log(
      'Usage: npm run assets:scaffold -- ComponentName path/to/Component.tsx [card|plate|symbol]\n       npm run assets:scaffold -- study subject-id path/to/new-packet\nCreates an SVG component or native study packet. Existing work is never overwritten.',
    );
    if (!name) process.exitCode = 1;
    return;
  }
  if (!/^[A-Z][A-Za-z0-9]*Art$/.test(name))
    throw new Error('Use a PascalCase component name ending in Art.');
  if (!destination || extname(destination) !== '.tsx' || extra.length)
    throw new Error('Provide one .tsx destination and an optional format.');
  if (!['card', 'plate', 'symbol'].includes(kind))
    throw new Error('Format must be card, plate or symbol.');
  const output = destinationPath(destination);
  const local = relative(root, output);
  let sceneImport = relative(dirname(output), resolve(root, 'src/shared/art/CardArt'))
    .split(sep)
    .join('/');
  if (!sceneImport.startsWith('.')) sceneImport = `./${sceneImport}`;
  const layers = await readFile(
    resolve(root, 'skills/card-art/assets/layers.tsx.template'),
    'utf8',
  );
  const size = kind === 'plate' ? '360 192' : '64 64';
  const wrapper =
    kind === 'card'
      ? `<ArtScene palette="gold" variant="rays" className={className}>${layers}</ArtScene>`
      : `<svg viewBox="0 0 ${size}" fill="none" aria-hidden="true" focusable="false" className={className}>${layers}</svg>`;
  const source = `${kind === 'card' ? `import { ArtScene } from ${JSON.stringify(sceneImport)};` : ''}
/** Drawing scaffold: replace the empty layers before registering this asset. */
export function ${name}({ className }: { className?: string }) {
  return (${wrapper});
}
`;
  await prepareParent(output);
  const formatting = await resolveConfig(output);
  await writeFile(output, await format(source, { ...formatting, parser: 'typescript' }), {
    flag: 'wx',
  });
  console.log(
    `Created ${local}. Draw the subject, wire the existing renderer, then export and review. No registry or rules were changed.`,
  );
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await runCli(process.argv.slice(2)).catch(reportFailure);
