/** Canid pilot commands and delivery validation; existing gallery releases remain independent. */
import { readFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { findBlender, runBlender } from './blender.ts';
import { hashFile, inspectMotionGlb, verifyFileDigests } from './motion-delivery.ts';
import { record } from './contracts.ts';
import { readMotions } from './motion-contract.ts';
import { evaluateCanid } from './subjects/canid/evaluation.ts';

const root = dirname(fileURLToPath(import.meta.url));
const ids = ['ash', 'russet', 'moss'];
const baselineDurations: Record<string, number> = { idle: 4, walk: 2, look: 4 };

export function verifyCanid({
  baseline = false,
  directory,
  sources,
  characters = ids,
}: {
  baseline?: boolean;
  directory?: string;
  sources?: string;
  characters?: string[];
} = {}) {
  directory ??= join(root, baseline ? 'assets/canid' : 'assets/canid/refined');
  sources ??= join(root, baseline ? 'subjects/canid' : 'subjects/canid/refined');
  const exporterPaths = baseline
    ? ['canid_pipeline.py', 'canid_rig.py', 'native_types.py']
    : [
        'subjects/canid/authoring/delivery.py',
        'subjects/canid/authoring/rig.py',
        'subjects/canid/authoring/parameters.py',
        'subjects/canid/authoring/contacts.py',
        'subjects/canid/authoring/motion_spec.py',
        'blender/native_types.py',
      ];
  return characters.map((id) => {
    const bytes = readFileSync(join(directory, `${id}.glb`));
    const receipt = record(JSON.parse(readFileSync(join(directory, `${id}.json`), 'utf8')));
    const motions = baseline ? null : readMotions(receipt.clips);
    if (
      motions &&
      JSON.stringify(motions) !==
        JSON.stringify(
          readMotions(JSON.parse(readFileSync(join(directory, `${id}.motions.json`), 'utf8'))),
        )
    )
      throw new Error(`Motion metadata differs from native delivery: ${id}`);
    const durations = motions
      ? Object.fromEntries(Object.entries(motions).map(([id, m]) => [id, m.seconds]))
      : baselineDurations;
    if (
      receipt.schemaVersion !== (baseline ? 2 : 4) ||
      receipt.character !== id ||
      receipt.sourceSha256 !== hashFile(join(sources, id, 'source.blend')) ||
      receipt.motionSha256 !== hashFile(join(sources, 'motion.blend')) ||
      receipt.modelSha256 !== hashFile(join(directory, `${id}.glb`))
    )
      throw new Error(`Stale canid delivery: ${id}`);
    if (Object.values(record(receipt.clips)).some((clip) => 'samples' in record(clip)))
      throw new Error(`Canid delivery contains temporary pose fixtures: ${id}`);
    let stats: ReturnType<typeof inspectMotionGlb>;
    try {
      verifyFileDigests(
        join(root, baseline ? 'blender' : ''),
        exporterPaths,
        record(receipt.exportScripts),
      );
      const profile = record(receipt.profile);
      if (
        profile.sourceSha256 !== receipt.motionSha256 ||
        profile.meshSha256 !== receipt.meshSha256
      )
        throw new Error('Canid fitting changed mesh data');
      stats = inspectMotionGlb(
        bytes,
        motions ??
          Object.fromEntries(
            Object.entries(baselineDurations).map(([name, seconds]) => [
              name,
              { seconds, playback: 'loop' as const },
            ]),
          ),
        {
          maxBytes: 4_000_000,
          maxTriangles: baseline ? 50_000 : 100_000,
          maxJoints: baseline ? 32 : 40,
        },
      );
    } catch (error) {
      throw new Error(
        `Canid delivery ${id}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
    for (const [clip, contact] of Object.entries(record(receipt.contacts))) {
      const data = record(contact);
      for (const field of ['maxSoleHeight', 'maxSoleFrameSlip', 'ankleLoopError']) {
        if (field === 'ankleLoopError' && motions?.[clip].playback === 'once') continue;
        const value = data[field];
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 0.001)
          throw new Error(`Canid contact failure: ${field}`);
      }
      if (
        !baseline &&
        (typeof data.minBodyHeight !== 'number' ||
          data.minBodyHeight < -0.002 ||
          !Number.isFinite(data.minBodyHeight))
      )
        throw new Error(`Body passes through floor: ${id}/${clip}`);
      if (
        !baseline &&
        (typeof data.maxRollingHeight !== 'number' ||
          !Number.isFinite(data.maxRollingHeight) ||
          data.maxRollingHeight > 0.04 ||
          typeof data.maxIkError !== 'number' ||
          !Number.isFinite(data.maxIkError) ||
          data.maxIkError > 0.002)
      )
        throw new Error(`Invalid body support or limb reach: ${id}/${clip}`);
    }
    if (!baseline) {
      const contacts = record(receipt.contacts);
      if (
        JSON.stringify(Object.keys(contacts).sort()) !==
        JSON.stringify(Object.keys(durations).sort())
      )
        throw new Error('Incomplete contact evidence');
      for (const name of ['walk', 'trot', 'run'].filter((name) => name in contacts)) {
        const contact = record(contacts[name]);
        if (
          typeof contact.minSwingClearance !== 'number' ||
          contact.minSwingClearance < 0.08 ||
          typeof contact.minFootHeight !== 'number' ||
          contact.minFootHeight < -0.002 ||
          typeof contact.maxIkError !== 'number' ||
          contact.maxIkError > 0.002
        )
          throw new Error(`Invalid articulated gait: ${id}/${name}`);
      }
    }
    return { id, ...stats };
  });
}

function main() {
  const argv = process.argv.slice(2);
  const baseline = argv.includes('--baseline');
  const [command = 'check', ...args] = argv.filter((a) => a !== '--baseline');
  if (baseline && ['evaluate', 'revise'].includes(command))
    throw new Error(`${command} applies to the refined motion library`);
  if (command === 'evaluate') {
    const directory = args[0] ?? join(root, 'assets/canid/refined');
    console.log(
      JSON.stringify(
        ids.map((id) =>
          evaluateCanid(JSON.parse(readFileSync(join(directory, `${id}.json`), 'utf8'))),
        ),
        null,
        2,
      ),
    );
    return;
  }
  if (command === 'check') {
    console.log(JSON.stringify(verifyCanid({ baseline, directory: args[0] }), null, 2));
    return;
  }
  if (
    !['bootstrap', 'fit', 'export', 'verify', 'review', 'revise', 'sample', 'test'].includes(
      command,
    )
  )
    throw new Error('Use check, bootstrap, fit, export, verify, review, revise, sample, or test');
  const blender = findBlender(root);
  const source = join(root, baseline ? 'subjects/canid' : 'subjects/canid/refined');
  if (command === 'sample' || command === 'test') {
    if (baseline && command === 'test')
      throw new Error('test applies to the refined canid library');
    if (command === 'test' && args.length !== 0)
      throw new Error('test does not accept arguments; use sample --output for separate runs');
    if (command === 'sample' && (args.length !== 2 || args[0] !== '--output'))
      throw new Error('sample requires --output pointing to a fresh directory under test-results');
    const results = resolve(root, '../../test-results/canid-native');
    mkdirSync(results, { recursive: true });
    const run = command === 'test' ? mkdtempSync(join(results, 'agreement-')) : null;
    const output = run ? join(run, 'poses') : resolve(args[1]);
    if (!output.startsWith(resolve(root, '../../test-results') + '/'))
      throw new Error('Temporary pose fixtures must stay under ignored test-results');
    runBlender(blender, join(root, 'blender/sample_canid.py'), [
      source,
      join(root, baseline ? 'assets/canid' : 'assets/canid/refined'),
      output,
    ]);
    if (run) {
      const browser = spawnSync(
        process.execPath,
        [
          resolve(root, '../../node_modules/@playwright/test/cli.js'),
          'test',
          'tests/browser/canid.spec.ts',
          '--grep',
          'fresh Blender samples',
          `--output=${join(run, 'browser')}`,
        ],
        { stdio: 'inherit', env: { ...process.env, CANID_POSE_RESULTS: output } },
      );
      if (browser.error) throw browser.error;
      if (browser.status !== 0)
        throw new Error(`Canid agreement failed (${browser.signal ?? browser.status})`);
      rmSync(output, { recursive: true });
      console.log(`Native agreement passed; temporary poses removed. Report: ${run}/browser`);
    }
    return;
  }
  const script = baseline
    ? join(root, 'blender', command === 'verify' ? 'verify_canid.py' : 'canid_pipeline.py')
    : join(
        root,
        'subjects/canid/authoring',
        command === 'verify' ? 'verify.py' : command === 'revise' ? 'timing.py' : 'delivery.py',
      );
  if (command === 'verify' && args.length !== 1)
    throw new Error('verify requires a fresh output directory');
  if (command === 'revise' && args.length !== 2)
    throw new Error('revise requires a pre-revision source directory and a fresh output directory');
  const nativeArgs =
    command === 'revise'
      ? args.map((path) => resolve(path))
      : command === 'verify'
        ? [source, resolve(args[0])]
        : [command, '--root', source, ...args];
  runBlender(blender, script, nativeArgs);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
