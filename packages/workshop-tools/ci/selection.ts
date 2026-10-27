export const families = [
  'balatro',
  'spire',
  'hearth',
  'emberwake',
  'cartographer',
  'night-passage',
  'svg',
  'models',
  'gallery',
] as const;
export type Family = (typeof families)[number];
export type Change = { path: string; status: string };
export type Catalogue = { application: string[]; browser: string[]; geometry: string[] };
export type DependencyGraph = Map<string, Set<string>>;
export type Plan = {
  version: 1;
  head: string;
  mode: 'scoped' | 'full';
  reasons: string[];
  families: Family[];
  coreFiles: string[];
  unitFiles: string[];
  browserFiles: string[];
  geometry: boolean;
  unitShards: number;
  browserShards: number;
};

const games: Family[] = [
  'balatro',
  'spire',
  'hearth',
  'emberwake',
  'cartographer',
  'night-passage',
];
const crossGameBrowser = new Set([
  'artwork',
  'challenge-art',
  'challenges',
  'engine',
  'expansion',
  'feature-art',
  'game-guide',
  'lifecycle',
  'night-market',
  'policy-layout',
  'replay-import',
  'shell',
]);
const modelBrowser = new Set([
  'art3d',
  'asset-lifetime',
  'boar',
  'canid',
  'dcc-workbench',
  'fox',
  'hydra-comparison',
  'native-assets',
  'otter',
  'raven',
  'study-loading',
  'study-mount-failure',
  'wolf-forms',
]);

/** Ownership supplies browser entry points; literal import edges add cross-module dependants. */
export function sourceFamily(path: string): Family | 'core' | undefined {
  if (path.startsWith('packages/diablo2/')) return 'emberwake';
  if (path.startsWith('packages/dcc-workbench/')) return 'models';
  if (path === 'packages/workshop-tools/art/gallery.ts') return 'gallery';
  if (path.startsWith('packages/workshop-tools/art/')) return 'svg';
  if (path.startsWith('src/art3d/')) return 'models';
  if (path.startsWith('src/asset-gallery/') || path.startsWith('public/game-asset-review/'))
    return 'gallery';
  const game = path.match(/^src\/games\/([^/]+)\//)?.[1];
  if (game === 'battlegrounds') return 'hearth';
  if (game === 'diablo2') return 'emberwake';
  if (games.includes(game as Family)) return game as Family;
  if (path.startsWith('src/engines/hearth/')) return 'hearth';
  if (path.startsWith('src/engines/playing.')) return 'balatro';
  if (/^src\/(app|shared|mods)\//.test(path) || path.startsWith('src/engines/challenges.'))
    return 'core';
  return undefined;
}

export function browserFamilies(path: string): Family[] | undefined {
  const name = path.match(/^tests\/browser\/(.+)\.spec\.ts$/)?.[1];
  if (!name || name === 'art3d-review' || name === 'trace-private') return undefined;
  if (name.startsWith('night-passage')) return ['night-passage'];
  if (name.startsWith('emberwake') || name === 'diablo2') return ['emberwake'];
  if (name.startsWith('cartographer')) return ['cartographer'];
  if (name === 'generated-dungeon') return ['cartographer', 'emberwake'];
  if (name.startsWith('spire')) return ['spire'];
  if (
    name.startsWith('battlegrounds') ||
    name.startsWith('hearth') ||
    ['tavern-spells', 'recruitment-inspector'].includes(name)
  )
    return ['hearth'];
  if (name.startsWith('blindside') || name === 'workshop') return ['balatro'];
  if (name === 'asset-gallery') return ['gallery'];
  if (name === 'art-export') return ['svg', 'balatro', 'spire', 'hearth'];
  if (modelBrowser.has(name)) return ['models'];
  if (crossGameBrowser.has(name)) return [...games];
  return undefined;
}

function isDocumentation(path: string): boolean {
  return path === 'README.md' || /^docs\/(guide|research)\/.+\.md$/.test(path);
}
function requiresFull(path: string): boolean {
  return (
    /(^|\/)(package(-lock)?\.json|tsconfig[^/]*\.json)$/.test(path) ||
    path.startsWith('.github/') ||
    path.startsWith('maintenance/') ||
    path.startsWith('docs/engineering/') ||
    path.startsWith('docs/art/') ||
    path.startsWith('skills/') ||
    path.startsWith('packages/workshop-tools/ci/') ||
    path.startsWith('src/shared/') ||
    path.startsWith('src/app/') ||
    path.startsWith('src/mods/') ||
    /(^|\/)[^/]*\.config\.[^/]+$/.test(path) ||
    path.startsWith('packages/dcc-workbench/') ||
    [
      'AGENTS.md',
      '.node-version',
      '.nvmrc',
      '.python-version',
      'pyproject.toml',
      'uv.lock',
      '.npmrc',
      '.gitattributes',
      'index.html',
      'src/main.tsx',
      'src/vite-env.d.ts',
    ].includes(path)
  );
}

export function reverseClosure(paths: string[], dependants: DependencyGraph): Set<string> {
  const reached = new Set(paths),
    pending = [...paths];
  while (pending.length)
    for (const parent of dependants.get(pending.pop()!) ?? []) {
      if (!reached.has(parent)) {
        reached.add(parent);
        pending.push(parent);
      }
    }
  return reached;
}

export function selectPlan(
  changes: Change[],
  catalogue: Catalogue,
  dependants: DependencyGraph,
  options: { head: string; full?: boolean; uncertain?: string[] },
): Plan {
  const reasons: string[] = [];
  if (options.full) reasons.push('comprehensive event');
  if (options.uncertain?.length) reasons.push('dependency graph could not be resolved completely');
  if (
    catalogue.application.some((p) => sourceFamily(p) === undefined) ||
    catalogue.browser.some((p) => browserFamilies(p) === undefined)
  )
    reasons.push('unclassified test family');
  for (const change of changes) {
    const path = change.path;
    if (!/^[^\x00-\x1f]+$/.test(path) || path.startsWith('/') || path.split('/').includes('..'))
      reasons.push('unsupported path');
    else if (!['A', 'M'].includes(change.status))
      reasons.push('deleted, renamed or uncertain path');
    else if (requiresFull(path))
      reasons.push('shared source, configuration or verification policy');
    else if (
      !isDocumentation(path) &&
      sourceFamily(path) === undefined &&
      browserFamilies(path) === undefined
    )
      reasons.push('unknown ownership');
  }
  const full = reasons.length > 0;
  const affected = reverseClosure(
    changes.map((c) => c.path),
    dependants,
  );
  const chosen = new Set<Family>();
  for (const path of affected) {
    const family = sourceFamily(path);
    if (family && family !== 'core') chosen.add(family);
    for (const browserFamily of browserFamilies(path) ?? []) chosen.add(browserFamily);
  }
  // Keep focused policy regressions in the safety core. Rollout matrices remain
  // separate only after their reviewed split is present in the catalogue.
  const coreFiles = catalogue.application
    .filter(
      (p) =>
        sourceFamily(p) === 'core' ||
        p === 'packages/diablo2/src/agent/policy.test.ts' ||
        p === 'src/games/spire/agent/policy.test.ts',
    )
    .sort();
  const semantic = new Set<Family>();
  for (const path of affected) {
    const family = sourceFamily(path);
    if (
      family &&
      family !== 'core' &&
      !/\/(ui|presentation)\//.test(path) &&
      !path.endsWith('.test.ts')
    )
      semantic.add(family);
    if (path.startsWith('src/games/night-passage/ui/presentation/scene/')) chosen.add('models');
  }
  const unitFiles = catalogue.application
    .filter((p) => !coreFiles.includes(p) && (full || affected.has(p)))
    .sort();
  for (const path of catalogue.application.filter((p) => p.endsWith('/policy-rollout.test.ts'))) {
    if ((full || semantic.has(sourceFamily(path) as Family)) && !unitFiles.includes(path))
      unitFiles.push(path);
  }
  const browserFiles = catalogue.browser
    .filter((p) => full || browserFamilies(p)?.some((f) => chosen.has(f)))
    .sort();
  const geometry = full || chosen.has('models');
  return {
    version: 1,
    head: options.head,
    mode: full ? 'full' : 'scoped',
    reasons: [
      ...new Set(reasons.length ? reasons : ['affected imports and declared browser ownership']),
    ],
    families: full ? [...families] : families.filter((f) => chosen.has(f)),
    coreFiles,
    unitFiles,
    browserFiles,
    geometry,
    unitShards: Math.max(1, Math.min(4, Math.ceil(unitFiles.length / 24))),
    browserShards: Math.max(1, Math.min(4, Math.ceil(browserFiles.length / 16))),
  };
}
