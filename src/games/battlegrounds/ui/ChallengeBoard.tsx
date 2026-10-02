import type { ChallengeBoardProps } from '../../../app/ChallengePlayer';
import type { PositioningCommand, PositioningState } from '../domain/challenge';
import { MINION_BY_ID } from '../content/minions';
import { MinionCard } from './MinionCard';
import { CombatPlayer } from './CombatPlayer';

export function HearthChallengeBoard({
  state,
  dispatch,
  finished,
}: ChallengeBoardProps<PositioningState, PositioningCommand>) {
  if (state.result) return <CombatPlayer result={state.result} opponent="Prepared warband" />;
  if (finished) return null;
  return (
    <section className="challenge-warband-table" aria-label="Positioning puzzle">
      <h2>The opposing warband</h2>
      <p>Fully revealed for this puzzle. Both warbands are tier 2.</p>
      <div className="challenge-warband">
        {state.opponent.map((unit) => (
          <MinionCard key={unit.id} unit={unit} />
        ))}
      </div>
      <h2>Your attack order →</h2>
      <p>Only positioning changes. Recruitment and combat buffs are not editable.</p>
      <div className="challenge-warband">
        {state.board.map((unit, index) => (
          <div key={unit.id}>
            <MinionCard unit={unit} />
            <div className="challenge-actions">
              <button
                aria-label={`Move ${MINION_BY_ID[unit.definitionId].name} left`}
                disabled={!index}
                onClick={() => dispatch({ type: 'move', id: unit.id, direction: -1 })}
              >
                ←
              </button>
              <span>{index + 1}</span>
              <button
                aria-label={`Move ${MINION_BY_ID[unit.definitionId].name} right`}
                disabled={index === state.board.length - 1}
                onClick={() => dispatch({ type: 'move', id: unit.id, direction: 1 })}
              >
                →
              </button>
            </div>
          </div>
        ))}
      </div>
      <button className="primary" onClick={() => dispatch({ type: 'fight' })}>
        Fight this warband
      </button>
    </section>
  );
}
