import { BASE_CONTENT } from '../domain/content';
import {
  applyCommand,
  createGame,
  RULES_VERSION,
  DIFFICULTIES,
  validCommand,
  validateContent,
} from '../domain/game';
import type { Command, Content, Difficulty, Replay, State } from '../domain/types';
import { SANDBOX_RULES_VERSION } from '../domain/sandbox';
import { RULES_V6, RULES_V5, RULES_V4, RULES_V3, RULES_V2 } from '../domain/versions';
export const SANDBOX_SAVE_KEY = 'card-workshop.emberwake.sandbox.v1';
export const ACTIVE_MODE_KEY = 'card-workshop.emberwake.active-mode';
export const SAVE_V2_KEY = 'card-workshop.emberwake.v2';
export const SAVE_V3_KEY = 'card-workshop.emberwake.v3';
export const SAVE_V4_KEY = 'card-workshop.emberwake.v4';
export const SAVE_V5_KEY = 'card-workshop.emberwake.v5';
export const SAVE_V6_KEY = 'card-workshop.emberwake.v6';
export const SAVE_KEY = 'card-workshop.emberwake.v7';
export const CAMPAIGN_VERSIONS = [
  {
    rulesVersion: RULES_VERSION,
    version: 7,
    format: 'emberwake-replay-v7',
    key: SAVE_KEY,
    mode: 'campaign-v7',
    description: 'current pressure rules',
  },
  {
    rulesVersion: RULES_V6,
    version: 6,
    format: 'emberwake-replay-v6',
    key: SAVE_V6_KEY,
    mode: 'campaign-v6',
    description: 'previous pressure rules',
  },
  {
    rulesVersion: RULES_V5,
    version: 5,
    format: 'emberwake-replay-v5',
    key: SAVE_V5_KEY,
    mode: 'campaign-v5',
    description: 'previous pressure rules',
  },
  {
    rulesVersion: RULES_V4,
    version: 4,
    format: 'emberwake-replay-v4',
    key: SAVE_V4_KEY,
    mode: 'campaign-v4',
    description: 'previous pressure rules',
  },
  {
    rulesVersion: RULES_V3,
    version: 3,
    format: 'emberwake-replay-v3',
    key: SAVE_V3_KEY,
    mode: 'campaign-v3',
    description: 'original difficulty rules',
  },
  {
    rulesVersion: RULES_V2,
    version: 2,
    format: 'emberwake-replay-v2',
    key: SAVE_V2_KEY,
    mode: 'campaign-v2',
    description: 'original Standard rules',
  },
] as const;
export const campaignVersion = (rulesVersion: unknown) =>
  CAMPAIGN_VERSIONS.find((version) => version.rulesVersion === rulesVersion);
export const saveKey = (session: Session): string =>
  session.replay.mode === 'sandbox'
    ? SANDBOX_SAVE_KEY
    : campaignVersion(session.replay.rulesVersion)!.key;
export interface Session {
  state: State;
  replay: Replay;
}
export function newSession(
  seed: string,
  hero: string,
  content: Content = BASE_CONTENT,
  sandbox = false,
  difficulty: Difficulty = 'standard',
  rulesVersion = RULES_VERSION,
): Session {
  const pack = validateContent(content);
  return {
    state: createGame(seed, hero, pack, sandbox, difficulty, rulesVersion),
    replay: {
      format: sandbox ? 'emberwake-replay-v2' : campaignVersion(rulesVersion)!.format,
      ...(!sandbox && rulesVersion !== RULES_V2 ? { difficulty } : {}),
      rulesVersion: sandbox ? SANDBOX_RULES_VERSION : rulesVersion,
      ...(sandbox ? { mode: 'sandbox' as const } : {}),
      content: pack,
      seed,
      hero,
      commands: [],
    },
  };
}
export function dispatch(
  session: Session,
  command: Command,
): { session: Session; error: string | null } {
  const result = applyCommand(session.state, command, session.replay.content);
  if (!result.accepted) return { session, error: result.error };
  const commands = [...session.replay.commands];
  recordCommand(commands, command);
  return { session: { state: result.state, replay: { ...session.replay, commands } }, error: null };
}
/** Own nested payloads and pack adjacent ticks for both live and reconstructed journals. */
function recordCommand(commands: Command[], command: Command): void {
  const previous = commands.at(-1);
  if (
    command.type === 'advance' &&
    previous?.type === 'advance' &&
    previous.ticks + command.ticks <= 50
  )
    commands[commands.length - 1] = { type: 'advance', ticks: previous.ticks + command.ticks };
  else {
    const clean =
      command.type === 'move' || command.type === 'cast'
        ? { ...command, target: { x: command.target.x, y: command.target.y } }
        : command.type === 'steer'
          ? { ...command, direction: { x: command.direction.x, y: command.direction.y } }
          : command;
    commands.push(structuredClone(clean));
  }
}
export function exportSession(session: Session): string {
  return JSON.stringify(session.replay);
}
/** Saves contain accepted commands, never trusted mutable snapshots. */
export function importSession(text: string): Session {
  if (text.length > 16_000_000) throw new Error('Save exceeds the 16 MB limit.');
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== 'object') throw new Error('Invalid save.');
  const r = value as Record<string, unknown>;
  const sandbox = r.mode === 'sandbox';
  const version = campaignVersion(r.rulesVersion);
  const legacy = !sandbox && r.rulesVersion === RULES_V2;
  if (
    (r.mode !== undefined && !sandbox) ||
    (sandbox
      ? r.format !== 'emberwake-replay-v2' || r.rulesVersion !== SANDBOX_RULES_VERSION
      : !version ||
        r.format !== version.format ||
        (!legacy &&
          (typeof r.difficulty !== 'string' || !Object.hasOwn(DIFFICULTIES, r.difficulty))))
  )
    throw new Error('Unsupported save or rules version.');
  if (typeof r.seed !== 'string' || r.seed.length > 100 || typeof r.hero !== 'string')
    throw new Error('Invalid hero or seed.');
  if (!Array.isArray(r.commands) || r.commands.length > 50000)
    throw new Error('Invalid command history.');
  const content = validateContent(r.content);
  const session = newSession(
    r.seed,
    r.hero,
    content,
    sandbox,
    legacy || sandbox ? 'standard' : (r.difficulty as Difficulty),
    sandbox ? RULES_VERSION : version!.rulesVersion,
  );
  let state = session.state;
  const commands: Command[] = [];
  let ticks = 0;
  for (const command of r.commands as unknown[]) {
    if (!validCommand(command)) throw new Error('Malformed replay command.');
    if (command.type === 'advance') ticks += command.ticks;
    if (ticks > 100000) throw new Error('Save exceeds the simulation limit.');
    const next = applyCommand(state, command, session.replay.content);
    if (!next.accepted) throw new Error(`Rejected replay command: ${next.error}`);
    state = next.state;
    recordCommand(commands, command);
  }
  return { state, replay: { ...session.replay, commands } };
}
