import ts from 'typescript';
import { posix } from 'node:path';
import { createHash } from 'node:crypto';

type Entry = {
  version?: string;
  resolved?: string;
  integrity?: string;
  link?: boolean;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
};
export type NpmLock = { lockfileVersion: number; packages: Record<string, Entry> };

/** Resolve npm's installed dependency closure, including optional platform variants and peers. */
export function bakeDependencies(lock: NpmLock, seeds: string[]): Record<string, string> {
  if (lock.lockfileVersion !== 3 || !lock.packages) throw new Error('Unsupported bake lockfile');
  const selected = new Set<string>();
  const locate = (from: string, name: string): string | undefined => {
    let directory = from;
    for (;;) {
      const candidate = posix.join(directory, 'node_modules', name);
      if (lock.packages[candidate]) return candidate;
      if (!directory || directory === '.') return undefined;
      directory = posix.dirname(directory);
      if (directory === '.') directory = '';
    }
  };
  const visit = (path: string) => {
    if (selected.has(path)) return;
    selected.add(path);
    const entry = lock.packages[path];
    if (entry.link || !entry.version) throw new Error(`Unsupported bake dependency: ${path}`);
    const optional = new Set([
      ...Object.keys(entry.optionalDependencies ?? {}),
      ...Object.entries(entry.peerDependenciesMeta ?? {})
        .filter(([, meta]) => meta.optional)
        .map(([name]) => name),
    ]);
    for (const name of Object.keys({
      ...entry.dependencies,
      ...entry.optionalDependencies,
      ...entry.peerDependencies,
    })) {
      const target = locate(path, name);
      if (target) visit(target);
      else if (!optional.has(name)) throw new Error(`Missing bake dependency: ${path} -> ${name}`);
    }
  };
  for (const seed of seeds) {
    const path = locate('', seed);
    if (!path) throw new Error(`Missing bake dependency: ${seed}`);
    visit(path);
  }
  // npm's dev/optional placement flags are unrelated to the exported bytes.
  return Object.fromEntries(
    [...selected].sort().map((path) => {
      const {
        version,
        resolved,
        integrity,
        dependencies,
        optionalDependencies,
        peerDependencies,
        peerDependenciesMeta,
      } = lock.packages[path];
      const canonical = (value: unknown): unknown =>
        Array.isArray(value)
          ? value.map(canonical)
          : value && typeof value === 'object'
            ? Object.fromEntries(
                Object.entries(value)
                  .filter(([, v]) => v !== undefined)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([k, v]) => [k, canonical(v)]),
              )
            : value;
      return [
        path,
        createHash('sha256')
          .update(
            JSON.stringify(
              canonical({
                version,
                resolved,
                integrity,
                dependencies,
                optionalDependencies,
                peerDependencies,
                peerDependenciesMeta,
              }),
            ),
          )
          .digest('hex'),
      ];
    }),
  );
}

/** Runtime bare imports from the actual source closure, including future exporters/plugins. */
export function bakePackageNames(sources: string[]): string[] {
  const names = new Set(['typescript']);
  const add = (specifier: string) => {
    if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('node:'))
      return;
    names.add(
      specifier.startsWith('@')
        ? specifier.split('/').slice(0, 2).join('/')
        : specifier.split('/')[0],
    );
  };
  for (const text of sources) {
    const source = ts.createSourceFile('bake.ts', text, ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node) => {
      if (
        ts.isImportDeclaration(node) &&
        !node.importClause?.isTypeOnly &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        add(node.moduleSpecifier.text);
      if (
        ts.isExportDeclaration(node) &&
        !node.isTypeOnly &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        add(node.moduleSpecifier.text);
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments[0] &&
        ts.isStringLiteralLike(node.arguments[0])
      )
        add(node.arguments[0].text);
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return [...names].sort();
}
