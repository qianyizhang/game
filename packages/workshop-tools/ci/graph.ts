import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import ts from 'typescript';
import type { Catalogue, DependencyGraph } from './selection.ts';

export function trackedFiles(root: string): string[] {
  return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\0')
    .filter(Boolean);
}

export function catalogueFrom(files: string[]): Catalogue {
  return {
    application: files.filter(
      (p) =>
        (p.startsWith('src/') || p.startsWith('packages/diablo2/src/')) &&
        p.endsWith('.test.ts') &&
        !p.startsWith('src/art3d/'),
    ),
    browser: files.filter(
      (p) =>
        /^tests\/browser\/.+\.spec\.ts$/.test(p) &&
        !['tests/browser/art3d-review.spec.ts', 'tests/browser/trace-private.spec.ts'].includes(p),
    ),
    geometry: files.filter((p) => p.startsWith('src/art3d/') && p.endsWith('.test.ts')),
  };
}

/** Parse imports only. No game, test, model constructor or authoring process is executed. */
export function dependencyGraph(
  root: string,
  files: string[],
): { dependants: DependencyGraph; uncertain: string[]; dynamic: string[] } {
  const dependants: DependencyGraph = new Map(),
    uncertain: string[] = [],
    dynamic: string[] = [];
  const config = ts.readConfigFile(resolve(root, 'tsconfig.json'), (path) => ts.sys.readFile(path));
  const options = config.error
    ? { moduleResolution: ts.ModuleResolutionKind.Bundler }
    : ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
  const add = (target: string, importer: string) => {
    const key = relative(root, target).replaceAll('\\', '/');
    if (key.startsWith('../')) return;
    const set = dependants.get(key) ?? new Set<string>();
    set.add(importer);
    dependants.set(key, set);
  };
  for (const file of files.filter(
    (p) =>
      /^(src|packages|tests)\//.test(p) && /\.(tsx?|mjs|jsx?)$/.test(p) && !p.endsWith('.d.ts'),
  )) {
    const absolute = resolve(root, file);
    if (!existsSync(absolute)) continue;
    const source = ts.createSourceFile(
      absolute,
      readFileSync(absolute, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    const constants = new Map<string, Set<string>>();
    const nonconstant = new Set<string>();
    const collect = (node: ts.Node) => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
        if (
          ts.isVariableDeclarationList(node.parent) &&
          node.parent.flags & ts.NodeFlags.Const &&
          node.initializer &&
          ts.isStringLiteralLike(node.initializer)
        ) {
          const set = constants.get(node.name.text) ?? new Set<string>();
          set.add(node.initializer.text);
          constants.set(node.name.text, set);
        } else nonconstant.add(node.name.text);
      }
      ts.forEachChild(node, collect);
    };
    collect(source);
    const link = (specifier: string) => {
      let target = ts.resolveModuleName(specifier, absolute, options, ts.sys).resolvedModule
        ?.resolvedFileName;
      const clean = specifier.split('?')[0];
      if (!target && clean.startsWith('.')) {
        const candidate = resolve(dirname(absolute), clean);
        if (existsSync(candidate)) target = candidate;
      }
      if (!target && clean.startsWith('/')) {
        const candidate = resolve(root, '.' + clean);
        if (existsSync(candidate)) target = candidate;
      }
      if (!target) {
        if (specifier.startsWith('.') || specifier.startsWith('@card-workshop/'))
          uncertain.push(`${file}: ${specifier}`);
        return;
      }
      try {
        target = realpathSync(target);
      } catch {
        return;
      }
      if (!target.includes('/node_modules/') && !extname(target).endsWith('.map'))
        add(target, file);
    };
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier))
        link(node.moduleSpecifier.text);
      if (
        ts.isExportDeclaration(node) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        link(node.moduleSpecifier.text);
      if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
      ) {
        const argument = node.arguments[0];
        if (argument && ts.isStringLiteralLike(argument)) link(argument.text);
        else if (
          argument &&
          ts.isIdentifier(argument) &&
          constants.has(argument.text) &&
          !nonconstant.has(argument.text)
        )
          for (const value of constants.get(argument.text) ?? []) link(value);
        else {
          dynamic.push(file);
          // Procedural delivery has model ownership; generated tool bundles use
          // the always-on tool/simulation gates. Unknown application imports
          // must conservatively expand selection.
          if (file.startsWith('src/') && !file.startsWith('src/art3d/'))
            uncertain.push(`${file}: nonliteral import`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return { dependants, uncertain: [...new Set(uncertain)], dynamic: [...new Set(dynamic)] };
}
