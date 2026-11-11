import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'vite';

const root = import.meta.dirname;
const output = resolve(process.argv[2] ?? resolve(root, 'dist'));
const read = (name) => readFile(resolve(root, name), 'utf8');
const [template, css, example, built] = await Promise.all([
  read('index.html'),
  read('src/style.css'),
  read('examples/one-quiet-breath.svg'),
  build({
    configFile: false,
    root,
    build: {
      lib: { entry: 'src/editor.js', name: 'SvgPoseLab', formats: ['iife'] },
      write: false,
      minify: false,
    },
  }),
]);
const bundle = Array.isArray(built) ? built[0] : built;
const { code } = bundle.output.find((chunk) => chunk.type === 'chunk');
// Keep the SVG inert until it has gone through the same import checks as user files.
const page = template
  .replace('/* LAB_CSS */', () => css)
  .replace('/* LAB_JS */', () => code.replace(/<\/script/gi, '<\\/script'))
  .replace('/* LAB_EXAMPLE */', () => JSON.stringify(example).replaceAll('<', '\\u003c'));
await mkdir(output, { recursive: true });
const file = resolve(output, 'index.html');
await writeFile(file, page);
console.log(file);
