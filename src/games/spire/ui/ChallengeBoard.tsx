import { useState } from 'react';
import type { ChallengeBoardProps } from '../../../app/ChallengePlayer';
import type { SpireCommand, SpireState } from '../domain/types';
import { Battle } from './Combat';
import { Resolution } from './Resolution';
import { Playback } from '../../../shared/Playback';

export function SpireChallengeBoard({
  state,
  dispatch,
  finished,
}: ChallengeBoardProps<SpireState, SpireCommand>) {
  const [target, setTarget] = useState<string | null>(null);
  const targetId =
    state.combat?.enemies.find((enemy) => enemy.id === target)?.id ?? state.combat?.enemies[0]?.id;
  return (
    <Playback
      key={state.resolution.sequence}
      frames={state.resolution.sequence > 1 ? state.resolution.frames : []}
      label="Card and enemy resolution"
      render={(frame) => <Resolution frame={frame} character={state.character} />}
    >
      {!finished && state.combat && (
        <>
          <p className="challenge-relic">
            <span>Oddly Smooth Stone · You begin with 1 Dexterity.</span>
          </p>
          <Battle run={state} dispatch={dispatch} targetId={targetId} onTarget={setTarget} />
        </>
      )}
    </Playback>
  );
}
