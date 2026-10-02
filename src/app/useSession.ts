import { blindsideSession } from '../games/balatro/application/session';
import { useLocalGame } from './useLocalGame';

export function useSession() {
  const game = useLocalGame(blindsideSession, 'FIRST-LIGHT');
  return { ...game, workbench: game, session: { run: game.state, replay: game.session.replay } };
}
