import type { BGState } from '../domain/types';
import { MINION_BY_ID } from '../content/minions';
export function Scouting({ run }: { run: BGState }) {
  const index = run.pairings.indexOf(0),
    opponent = run.pairings[index % 2 ? index - 1 : index + 1];
  const seen = run.scouting.find((s) => s.playerId === opponent);
  return (
    <aside className="scouting">
      <strong>
        Next opponent: {opponent === undefined ? 'Ghost warband' : run.players[opponent].name}
      </strong>
      {opponent === undefined ? (
        <p>A snapshot of the most recently eliminated warband · tier {run.ghostTier}.</p>
      ) : seen ? (
        <p>
          Last seen in round {seen.round} · tavern tier {seen.tier}. Their board may change before
          combat.
        </p>
      ) : (
        <p>No previous warband to scout yet.</p>
      )}
      <div className="scout-units">
        {(opponent === undefined ? run.ghost : (seen?.board ?? [])).map((u) => (
          <span key={u.id}>
            <strong>
              {MINION_BY_ID[u.definitionId].name}
              {u.golden ? ' ★' : ''}
            </strong>
            <br />
            {u.attack} ATK / {u.health} HP<small>{u.keywords.join(' · ')}</small>
          </span>
        ))}
      </div>
    </aside>
  );
}
