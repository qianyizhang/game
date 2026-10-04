import { createInterface } from 'node:readline';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { withHearthRuntime } from './hearth-runtime.mjs';

const [seed = 'HEARTH-ARENA-01', destination, seatText = '0', visibility = 'hidden', ...extra] =
  process.argv.slice(2);
if (seed === '--help') {
  console.log(
    'Usage: node scripts/hearth-arena-agent.mjs [environment-seed] [new-output-directory] [seat 0–7] [hidden|disclosed]\nJSONL: observe, catalogue, act {step,action}, quit. One process controls one fixed seat. Other seats and round advancement are journaled automatically. Inspector/configuration/replay are evaluator-only.',
  );
  process.exit(0);
}
const seat = Number(seatText);
if (
  !Number.isInteger(seat) ||
  seat < 0 ||
  seat > 7 ||
  !['hidden', 'disclosed'].includes(visibility) ||
  extra.length
)
  throw new Error('Invalid seat, visibility or arguments; see --help.');
const output = resolve(
  destination ?? `test-results/agents/arena-${new Date().toISOString().replace(/[:.]/g, '-')}`,
);
await mkdir(dirname(output), { recursive: true });
await mkdir(output);
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
    const apply = (command) => {
      if (session.replay.commands.length >= 10000) throw new Error('Arena command budget reached.');
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
    const send = (value) => process.stdout.write(JSON.stringify(value) + '\n');
    const lines = createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false });
    try {
      advance();
      send({ ok: true, event: 'ready', frame: arenaFrame(session, seat) });
      for await (const line of lines) {
        let id;
        try {
          if (Buffer.byteLength(line) > 65536) throw new Error('Request exceeds 64 KiB.');
          const request = JSON.parse(line);
          if (!request || typeof request !== 'object' || Array.isArray(request))
            throw new Error('Expected a request object.');
          if (
            request.id !== undefined &&
            (typeof request.id !== 'string' || request.id.length > 100)
          )
            throw new Error('Invalid request id.');
          id = request.id;
          if (request.seat !== undefined && request.seat !== seat)
            throw new Error('This connection cannot control another seat.');
          if (request.op === 'quit') {
            send({ id, ok: true, event: 'closed' });
            break;
          }
          if (request.op === 'observe') send({ id, ok: true, frame: arenaFrame(session, seat) });
          else if (request.op === 'catalogue') send({ id, ok: true, catalogue: arenaCatalogue() });
          else if (request.op === 'act') {
            const before = arenaFrame(session, seat);
            const result = actArenaAgent(session, seat, {
              step: request.step,
              action: request.action,
            });
            session = result.session;
            if (!result.error) advance();
            const frame = arenaFrame(session, seat);
            const action = before.actions.find((entry) => entry.id === request.action);
            send({
              id,
              ok: !result.error,
              ...(result.error ? { error: result.error } : {}),
              frame,
              events: result.error
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
