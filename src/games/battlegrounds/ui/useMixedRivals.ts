import { useEffect, useState } from 'react';
import { useLocalGame } from '../../../app/useLocalGame';
import { advanceRivals } from '../application/arena-controller';
import { arenaSession } from '../application/arena';
import { activeSeat, mixedRivalsConfig, type ArenaCommand } from '../domain/arena';
import type { BGCommand } from '../domain/types';

export function useMixedRivals(enabled: boolean) {
  const game = useLocalGame(arenaSession, 'HEARTH-01');
  const [controllerError, setControllerError] = useState('');
  // Imported prefixes may stop inside a rival turn. Resume through the same journaled controller.
  useEffect(() => {
    if (!enabled || !game.state.arena.config) return;
    try {
      const commands = advanceRivals(game.session);
      if (commands.length) game.dispatchMany(commands);
      setControllerError('');
    } catch (error) {
      setControllerError(String(error));
    }
    // Session identity changes only after a committed action, restore or restart.
  }, [game.session, enabled]);
  const dispatch = (command: BGCommand) => {
    const arenaCommand: ArenaCommand =
      command.type === 'chooseHero'
        ? { type: 'configure', config: mixedRivalsConfig(game.state.seed, command.hero) }
        : command.type === 'nextRound'
          ? command
          : { type: 'seat', seat: 0, action: command };
    return game.dispatch(arenaCommand);
  };
  return {
    ...game,
    dispatch,
    error: game.error || controllerError,
    clearError: () => {
      game.clearError();
      setControllerError('');
    },
    waiting: game.state.phase === 'recruit' && activeSeat(game.state) !== 0,
  };
}
