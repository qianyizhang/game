import { createInterface } from 'node:readline';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { withHearthRuntime } from './hearth-runtime.mjs';

const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(
    'Usage: node scripts/hearth-agent.mjs [environment-seed] [new-evaluator-output-directory]\nJSONL requests: {"id":"1","op":"observe"}, {"op":"catalogue"}, {"op":"act","step":0,"action":"a0"}, {"op":"quit"}.\nOnly policy-safe frames go to stdout. Evaluator replay is written to the separate output directory.',
  );
  process.exit(0);
}
if (args.length > 2) throw new Error('Expected at most seed and output directory.');
const output = resolve(
  args[1] ?? `test-results/agents/${new Date().toISOString().replace(/[:.]/g, '-')}`,
);
await mkdir(dirname(output), { recursive: true });
await mkdir(output); // Never overwrite earlier evaluator evidence.

await withHearthRuntime(async ({ bgSession, hearthFrame, actHearthAgent, hearthCatalogue }) => {
  let session = bgSession.create(args[0] ?? 'HEARTH-AGENT-01');
  const send = (response) => process.stdout.write(JSON.stringify(response) + '\n');
  send({ ok: true, event: 'ready', frame: hearthFrame(session) });
  const lines = createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false });
  try {
    for await (const line of lines) {
      let id;
      try {
        if (Buffer.byteLength(line) > 65536) throw new Error('Request exceeds 64 KiB.');
        const request = JSON.parse(line);
        if (!request || typeof request !== 'object' || Array.isArray(request))
          throw new Error('Expected a request object.');
        if (request.id !== undefined && (typeof request.id !== 'string' || request.id.length > 100))
          throw new Error('id must be a string of at most 100 characters.');
        id = request.id;
        if (request.op === 'quit') {
          send({ id, ok: true, event: 'closed' });
          break;
        }
        if (request.op === 'catalogue') send({ id, ok: true, catalogue: hearthCatalogue() });
        else if (request.op === 'observe') send({ id, ok: true, frame: hearthFrame(session) });
        else if (request.op === 'act') {
          const result = actHearthAgent(session, { step: request.step, action: request.action });
          session = result.session;
          send({
            id,
            ok: !result.error,
            ...(result.error ? { error: result.error } : {}),
            frame: result.frame,
            events: result.events,
          });
        } else throw new Error('Unknown operation. Use observe, catalogue, act or quit.');
      } catch (error) {
        send({ id, ok: false, error: String(error) });
      }
    }
  } finally {
    lines.close();
    const replay = bgSession.encode(session);
    const verified = JSON.stringify(bgSession.decode(replay)) === JSON.stringify(session);
    await writeFile(resolve(output, 'replay.json'), replay + '\n', { flag: 'wx' });
    await writeFile(
      resolve(output, 'receipt.json'),
      JSON.stringify(
        {
          protocol: 'card-workshop.agent.v1',
          outcome: session.state.phase,
          commands: session.replay.commands.length,
          replayVerified: verified,
        },
        null,
        2,
      ) + '\n',
      { flag: 'wx' },
    );
    process.stderr.write(`Evaluator replay saved to ${output}\n`);
    if (!verified) process.exitCode = 1;
  }
});
