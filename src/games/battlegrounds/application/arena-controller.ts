import { decideRecruitment } from '../ai/recruitment-policy';
import { activeSeat, type ArenaCommand } from '../domain/arena';
import { arenaFrame, arenaSession, type ArenaSession } from './arena';

/** Continue journaled rival turns, stopping at a human turn or a combat to watch. */
export function advanceRivals(initial: ArenaSession, humanSeat = 0): ArenaCommand[] {
  let session = initial;
  const commands: ArenaCommand[] = [];
  for (;;) {
    const state = session.state;
    const seat = activeSeat(state);
    if (state.phase === 'hero' || state.phase === 'won' || state.phase === 'lost') break;
    if (seat === humanSeat || (state.phase === 'combat' && state.players[humanSeat].hp > 0)) break;
    if (session.replay.commands.length >= 10000) throw new Error('Arena command budget reached.');
    const command: ArenaCommand =
      state.phase === 'combat'
        ? { type: 'nextRound' }
        : {
            type: 'seat',
            seat: seat!,
            action: decideRecruitment(
              arenaFrame(session, seat!),
              state.arena.config!.seats[seat!].style,
            ).command,
          };
    const result = arenaSession.act(session, command);
    if (result.error) throw new Error(result.error);
    commands.push(command);
    session = result.session;
  }
  return commands;
}
