import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { catalogueFrom, dependencyGraph, trackedFiles } from './graph.ts';
import { commandFor, readPlan, requiredModules, type Module } from './commands.ts';
import { normalApplicationFallback, selectPlan, type Change, type Plan } from './selection.ts';

const root = resolve(import.meta.dirname, '../../..');
const git = (...args: string[]) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const head = git('rev-parse', 'HEAD');

function planFromEnvironment(): Plan {
  const plan = readPlan(JSON.parse(process.env.CI_PLAN ?? 'null'), head);
  const catalogue = catalogueFrom(trackedFiles(root));
  const allowed = new Set(catalogue.application);
  if (
    [...plan.coreFiles, ...plan.unitFiles].some((p) => !allowed.has(p)) ||
    plan.browserFiles.some((p) => !catalogue.browser.includes(p)) ||
    plan.geometryFiles.some((p) => !catalogue.geometry.includes(p))
  )
    throw new Error('Invalid CI plan');
  return plan;
}

const operation = process.argv[2];
if (operation === 'plan') {
  const base = /^0{40}$/.test(process.env.CI_BASE ?? '') ? undefined : process.env.CI_BASE;
  const changes: Change[] = [];
  if (base) {
    if (!/^[a-f0-9]{40}$/.test(base)) throw new Error('CI_BASE must be an exact commit SHA');
    const fields = execFileSync(
      'git',
      ['diff', '--name-status', '--no-renames', '-z', `${base}...${head}`],
      { cwd: root, encoding: 'utf8' },
    )
      .split('\0')
      .filter(Boolean);
    for (let index = 0; index < fields.length; index += 2)
      changes.push({ status: fields[index], path: fields[index + 1] });
  }
  const files = trackedFiles(root);
  const graph = dependencyGraph(root, files);
  const ancestor = base ? git('merge-base', base, head) : undefined;
  const plan = selectPlan(changes, catalogueFrom(files), graph.dependants, {
    head,
    full: process.env.CI_FULL === '1',
    allApplications: normalApplicationFallback(changes, Boolean(base), ({ path, status }) => {
      const refs = status === 'A' ? [head] : status === 'D' ? [ancestor!] : [ancestor!, head];
      try {
        return refs.every(
          (ref) =>
            git('ls-tree', '-z', ref, '--', path) ===
            `100644 blob ${git('rev-parse', `${ref}:${path}`)}\t${path}\0`,
        );
      } catch {
        return false;
      }
    }),
    uncertain: graph.uncertain,
  });
  const json = JSON.stringify(plan);
  const output = process.argv[3];
  if (output) writeFileSync(output, json + '\n');
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `plan=${json}\n${Object.entries(requiredModules(plan))
        .filter(([name]) => name !== 'plan')
        .map(([name, required]) => `${name}=${required}`)
        .join(
          '\n',
        )}\nunit_matrix=${JSON.stringify(Array.from({ length: plan.unitShards }, (_, i) => i + 1))}\n`,
    );
  console.log(
    JSON.stringify({
      mode: plan.mode,
      reasons: plan.reasons,
      core: plan.coreFiles.length,
      application: plan.unitFiles.length,
      browser: plan.browserFiles.length,
      geometry: plan.geometry,
      unitShards: plan.unitShards,
      browserShards: plan.browserShards,
    }),
  );
} else if (operation === 'run' || operation === 'core') {
  const module = operation === 'core' ? 'core' : (process.argv[3] as Module);
  if (!['core', 'unit', 'browser', 'geometry'].includes(module))
    throw new Error('Unknown CI module');
  const plan =
    operation === 'core'
      ? selectPlan([], catalogueFrom(trackedFiles(root)), new Map(), { head })
      : planFromEnvironment();
  const command = commandFor(plan, module, Number(process.env.CI_SHARD ?? 1));
  if (!command) console.log(`No ${module} tests selected`);
  else {
    const result = spawnSync(resolve(root, 'node_modules/.bin', command[0]), command.slice(1), {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  }
} else
  throw new Error('Usage: ci/cli.ts core | plan [output.json] | run core|unit|browser|geometry');
