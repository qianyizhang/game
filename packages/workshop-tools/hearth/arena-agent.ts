import type { ArenaCommand } from '../../../src/games/battlegrounds/domain/arena';
import { fileURLToPath } from 'node:url';
import { freshDirectory, fromRoot, newOutput, reportFailure } from '../io.ts';
import { requestFromLine } from './protocol.ts';
import { createInterface } from 'node:readline';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { withHearthRuntime } from './runtime.ts';

export async function runCli(args: string[]) {
  const [seed = 'HEARTH-ARENA-01', destination, seatText = '0', visibility = 'hidden', ...extra] =
    args;
  if (seed === '--help') {
    console.log(
      'Usage: node scripts/hearth-arena-agent.mjs [environment-seed] [new-output-directory] [seat 0–7] [hidden|disclosed]\nJSONL: observe, catalogue, act {step,action}, quit. One process controls one fixed seat. Other seats and round advancement are journaled automatically. Inspector/configuration/replay are evaluator-only.',
    );
    return;
  }
  const seat = Number(seatText);
  if (
    !Number.isInteger(seat) ||
    seat < 0 ||
    seat > 7 ||
    (visibility !== 'hidden' && visibility !== 'disclosed') ||
    extra.length
  )
    throw new Error('Invalid seat, visibility or arguments; see --help.');
  const output = destination ? fromRoot(destination) : newOutput('agents/arena');
  await freshDirectory(output);
  await withHearthRuntime(
    async ({
      arenaSession,
      arenaFrame,
      actArenaAgent,
      arenaCatalogue,
      mixedRivalsConfig,
      advanceRivals,
      hearthEvents,
    }) => {
      const config = mixedRivalsConfig(seed, 'forgekeeper', visibility);
      config.visibilitySeat = seat;
      let session = arenaSession.act(arenaSession.create(seed), {
        type: 'configure',
        config,
      }).session;
      const apply = (command: ArenaCommand) => {
        if (session.replay.commands.length >= 10000)
          throw new Error('Arena command budget reached.');
        const result = arenaSession.act(session, command);
        if (result.error) throw new Error(result.error);
        session = result.session;
      };
      const advance = () => {
        for (;;) {
          for (const command of advanceRivals(session, seat)) apply(command);
          if (session.state.phase !== 'combat') break;
          apply({ type: 'nextRound' });
        }
      };
      const send = (value: unknown) => process.stdout.write(JSON.stringify(value) + '\n');
      const lines = createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false });
      try {
        advance();
        send({ ok: true, event: 'ready', frame: arenaFrame(session, seat) });
        for await (const line of lines) {
          let id: string | undefined;
          try {
            const request = requestFromLine(line, 'Invalid request id.');
            id = request.id;
            if (request.seat !== undefined && request.seat !== seat)
              throw new Error('This connection cannot control another seat.');
            if (request.op === 'quit') {
              send({ id, ok: true, event: 'closed' });
              break;
            }
            if (request.op === 'observe') send({ id, ok: true, frame: arenaFrame(session, seat) });
            else if (request.op === 'catalogue')
              send({ id, ok: true, catalogue: arenaCatalogue() });
            else if (request.op === 'act') {
              const before = arenaFrame(session, seat);
              const result = actArenaAgent(session, seat, {
                step: request.step,
                action: request.action,
              });
              const error = 'error' in result ? result.error : undefined;
              session = result.session;
              const action = before.actions.find((entry) => entry.id === request.action);
              if (!error && !action) throw new Error('Accepted action missing from prior frame.');
              if (!error) advance();
              const frame = arenaFrame(session, seat);
              send({
                id,
                ok: !error,
                ...(error ? { error } : {}),
                frame,
                events:
                  error || !action
                    ? []
                    : hearthEvents(before.observation, frame.observation, action.command),
                advancedCommands: frame.step - before.step,
              });
            } else throw new Error('Unknown operation. Use observe, catalogue, act or quit.');
          } catch (error) {
            send({ id, ok: false, error: String(error) });
          }
        }
      } finally {
        lines.close();
        const replay = arenaSession.encode(session);
        const replayVerified =
          JSON.stringify(arenaSession.decode(replay)) === JSON.stringify(session);
        await writeFile(resolve(output, 'replay.json'), replay + '\n', { flag: 'wx' });
        await writeFile(
          resolve(output, 'receipt.json'),
          JSON.stringify(
            {
              seat,
              visibility,
              commands: session.replay.commands.length,
              phase: session.state.phase,
              placements: session.state.players.map((p) => p.placement),
              replayVerified,
            },
            null,
            2,
          ) + '\n',
          { flag: 'wx' },
        );
        process.stderr.write(`Evaluator replay saved to ${output}\n`);
        if (!replayVerified) process.exitCode = 1;
      }
    },
  );
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await runCli(process.argv.slice(2)).catch(reportFailure);
