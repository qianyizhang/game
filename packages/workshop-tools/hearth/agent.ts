import { fileURLToPath } from 'node:url';
import { freshDirectory, fromRoot, newOutput, reportFailure } from '../io.ts';
import { requestFromLine } from './protocol.ts';
import { createInterface } from 'node:readline';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { withRuntime } from './runtime.ts';

export async function runCli(args: string[]) {
  if (args.includes('--help')) {
    console.log(
      'Usage: node packages/workshop-tools/hearth/agent.ts [environment-seed] [new-evaluator-output-directory]\nJSONL requests: {"id":"1","op":"observe"}, {"op":"catalogue"}, {"op":"act","step":0,"action":"a0"}, {"op":"quit"}.\nOnly policy-safe frames go to stdout. Evaluator replay is written to the separate output directory.',
    );
    return;
  }
  if (args.length > 2) throw new Error('Expected at most seed and output directory.');
  const output = args[1] ? fromRoot(args[1]) : newOutput('agents/hearth');
  await freshDirectory(output);

  await withRuntime(async ({ bgSession, hearthFrame, actHearthAgent, hearthCatalogue }) => {
    let session = bgSession.create(args[0] ?? 'HEARTH-AGENT-01');
    const send = (response: unknown) => process.stdout.write(JSON.stringify(response) + '\n');
    send({ ok: true, event: 'ready', frame: hearthFrame(session) });
    const lines = createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false });
    try {
      for await (const line of lines) {
        let id: string | undefined;
        try {
          const request = requestFromLine(line, 'id must be a string of at most 100 characters.');
          id = request.id;
          if (request.op === 'quit') {
            send({ id, ok: true, event: 'closed' });
            break;
          }
          if (request.op === 'catalogue') send({ id, ok: true, catalogue: hearthCatalogue() });
          else if (request.op === 'observe') send({ id, ok: true, frame: hearthFrame(session) });
          else if (request.op === 'act') {
            const result = actHearthAgent(session, { step: request.step, action: request.action });
            const error = 'error' in result ? result.error : undefined;
            session = result.session;
            send({
              id,
              ok: !error,
              ...(error ? { error } : {}),
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
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await runCli(process.argv.slice(2)).catch(reportFailure);
