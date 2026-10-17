import { useEffect, useEffectEvent, useState } from 'react';
import { useLocalGame } from '../../../app/useLocalGame';
import { advanceRivals } from '../application/arena-controller';
import { arenaSession, arenaSessionV2 } from '../application/arena';
import { activeSeat, mixedRivalsConfig, type ArenaCommand, type Difficulty } from '../domain/arena';
import type { BGCommand } from '../domain/types';

export function useMixedRivals(enabled: boolean) {
  const game = useLocalGame(arenaSession, 'HEARTH-01', enabled);
  const [controllerError, setControllerError] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('standard');
  const resumeRivals = useEffectEvent(() => {
    if (!game?.state.arena.config) return;
    try {
      const commands = advanceRivals(game.session);
      if (commands.length) game.dispatchMany(commands);
      setControllerError('');
    } catch (error) {
      setControllerError(String(error));
    }
  });
  // Imported prefixes may stop inside a rival turn. Resume through the same journaled controller.
  // Only committed actions, restore/restart or mode activation schedule more rival work.
  useEffect(() => {
    if (enabled) resumeRivals();
  }, [game?.session, enabled]);
  if (!game) return null;
  const dispatch = (command: BGCommand) => {
    const arenaCommand: ArenaCommand =
      command.type === 'chooseHero'
        ? {
            type: 'configure',
            config: mixedRivalsConfig(
              game.state.seed,
              command.hero,
              'disclosed',
              game.state.arena.version >= 3 ? difficulty : undefined,
            ),
          }
        : command.type === 'nextRound'
          ? command
          : { type: 'seat', seat: 0, action: command };
    return game.dispatch(arenaCommand);
  };
  return {
    ...game,
    dispatch,
    difficulty:
      game.state.arena.version < 3
        ? 'standard'
        : game.state.arena.config
          ? (game.state.arena.config.difficulty ?? 'standard')
          : difficulty,
    setDifficulty: (next: Difficulty) => {
      if (game.state.phase === 'hero' && !game.state.arena.config && game.state.arena.version >= 3)
        setDifficulty(next);
    },
    restorePrevious: () => {
      try {
        const raw = localStorage.getItem(arenaSessionV2.key);
        if (!raw) throw new Error('No previous Mixed Rivals v2 save found.');
        setControllerError('');
        game.restore(raw);
      } catch (error) {
        setControllerError(String(error));
      }
    },
    error: game.error || controllerError,
    clearError: () => {
      game.clearError();
      setControllerError('');
    },
    waiting: game.state.phase === 'recruit' && activeSeat(game.state) !== 0,
  };
}
