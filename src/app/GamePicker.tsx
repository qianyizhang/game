import { GAME_METADATA, type GameId } from './games';
export type { GameId } from './games';
export function GamePicker({
  current,
  onSwitch,
}: {
  current: GameId;
  onSwitch: (id: GameId) => void;
}) {
  return (
    <div className="game-picker">
      <label htmlFor="game-picker">PLAY A GAME</label>
      <select
        id="game-picker"
        aria-label="Choose game"
        value={current}
        onChange={(event) => onSwitch(event.target.value as GameId)}
      >
        {Object.entries(GAME_METADATA).map(([id, game]) => (
          <option key={id} value={id}>
            {game.icon} {game.name}
            {game.detail ? ` · ${game.detail}` : ''}
          </option>
        ))}
      </select>
      <a className="game-guide-entry" href={`?guide=games&game=${current}`}>
        Explore all games →
      </a>
      <a className="game-guide-entry" href={`?guide=glossary&game=${current}`}>
        Look up a term →
      </a>
    </div>
  );
}
