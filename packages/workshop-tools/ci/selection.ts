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
  version: 2;
  head: string;
  mode: 'documentation' | 'scoped' | 'application' | 'full';
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

// These retained journeys need the explicit full gate. Ordinary CI covers game
// interaction and representative delivery without playing a whole 3D campaign.
export const fullBrowserFiles = [
  'asset-lifetime',
  'boar',
  'canid',
  'dcc-workbench',
  'fox',
  'hydra-comparison',
  'otter',
  'raven',
  'wolf-forms',
  'night-passage-art',
  'night-passage-batches',
  'night-passage-campaign',
  'night-passage-enemies',
  'night-passage-environment',
  'night-passage-guardian',
  'night-passage-hero',
  'night-passage-layouts',
  'night-passage-parity',
  'night-passage-patrons',
  'night-passage-performance',
].map((name) => `tests/browser/${name}.spec.ts`);

const routineBrowser = (path: string) => !fullBrowserFiles.includes(path);

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
  return /\.md$/.test(path);
}
function repositoryPath(path: string): boolean {
  return /^[^\x00-\x1f]+$/.test(path) && !path.startsWith('/') && !path.split('/').includes('..');
}
function requiresApplication(path: string): boolean {
  return (
    /(^|\/)(package(-lock)?\.json|tsconfig[^/]*\.json)$/.test(path) ||
    path.startsWith('.github/') ||
    path.startsWith('maintenance/') ||
    path.startsWith('packages/workshop-tools/ci/') ||
    path.startsWith('src/shared/') ||
    path.startsWith('src/app/') ||
    path.startsWith('src/mods/') ||
    /(^|\/)[^/]*\.config\.[^/]+$/.test(path) ||
    path.startsWith('packages/dcc-workbench/') ||
    [
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
  options: { head: string; full?: boolean; allApplications?: boolean; uncertain?: string[] },
): Plan {
  const documentation =
    !options.full &&
    !options.allApplications &&
    changes.length > 0 &&
    changes.every((change) => repositoryPath(change.path) && isDocumentation(change.path));
  const stylesOnly =
    changes.length > 0 &&
    changes.every(({ path }) => isDocumentation(path) || path.endsWith('.css'));
  const reasons: string[] = [];
  if (options.full) reasons.push('comprehensive event');
  if (options.allApplications) reasons.push('complete application selection');
  if (options.uncertain?.length) reasons.push('dependency graph could not be resolved completely');
  if (
    catalogue.application.some((p) => sourceFamily(p) === undefined) ||
    catalogue.browser.some((p) => browserFamilies(p) === undefined)
  )
    reasons.push('unclassified test family');
  for (const change of changes) {
    const path = change.path;
    if (!repositoryPath(path)) reasons.push('unsupported path');
    else if (isDocumentation(path)) continue;
    else if (!['A', 'M'].includes(change.status))
      reasons.push('deleted, renamed or uncertain path');
    else if (requiresApplication(path))
      reasons.push('shared source, configuration or verification policy');
    else if (
      !isDocumentation(path) &&
      sourceFamily(path) === undefined &&
      browserFamilies(path) === undefined
    )
      reasons.push('unknown ownership');
  }
  const allApplications = reasons.length > 0;
  const full = options.full === true;
  const affected = reverseClosure(
    changes.filter((c) => !isDocumentation(c.path)).map((c) => c.path),
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
        !documentation &&
        (sourceFamily(p) === 'core' ||
          p === 'packages/diablo2/src/agent/policy.test.ts' ||
          p === 'src/games/spire/agent/policy.test.ts'),
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
  }
  const unitFiles = catalogue.application
    .filter((p) => !documentation && !coreFiles.includes(p) && (allApplications || affected.has(p)))
    .sort();
  for (const path of catalogue.application.filter((p) => p.endsWith('/policy-rollout.test.ts'))) {
    if (
      !documentation &&
      (allApplications || semantic.has(sourceFamily(path) as Family)) &&
      !unitFiles.includes(path)
    )
      unitFiles.push(path);
  }
  const browserFiles = catalogue.browser
    .filter(
      (p) =>
        !documentation &&
        (full ||
          (routineBrowser(p) &&
            (allApplications ||
              affected.has(p) ||
              ((!stylesOnly ||
                !crossGameBrowser.has(p.split('/').at(-1)!.replace('.spec.ts', ''))) &&
                browserFamilies(p)?.some((f) => chosen.has(f)))))),
    )
    .sort();
  const geometry =
    full ||
    (!documentation &&
      (catalogue.geometry.some((path) => affected.has(path)) ||
        changes.some(
          ({ path }) =>
            !isDocumentation(path) &&
            (path.startsWith('src/art3d/') || path.startsWith('packages/dcc-workbench/')),
        )));
  return {
    version: 2,
    head: options.head,
    mode: full
      ? 'full'
      : documentation
        ? 'documentation'
        : allApplications
          ? 'application'
          : 'scoped',
    reasons: [
      ...new Set(
        documentation
          ? ['documentation only']
          : reasons.length
            ? reasons
            : ['affected imports and declared browser ownership'],
      ),
    ],
    families: documentation
      ? []
      : allApplications
        ? [...families]
        : families.filter((f) => chosen.has(f)),
    coreFiles,
    unitFiles,
    browserFiles,
    geometry,
    unitShards: Math.max(1, Math.min(4, Math.ceil(unitFiles.length / 24))),
    browserShards: Math.max(1, Math.min(4, Math.ceil(browserFiles.length / 8))),
  };
}
