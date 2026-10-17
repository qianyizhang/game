export type GameId =
  'balatro' | 'spire' | 'battlegrounds' | 'diablo2' | 'cartographer' | 'night-passage';
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
        <option value="balatro">♠ Blindside · Balatro</option>
        <option value="spire">↑ Slay the Spire</option>
        <option value="battlegrounds">⚑ Last Hearth · Battlegrounds</option>
        <option value="cartographer">◇ Dungeon Cartographer</option>
        <option value="diablo2">✧ Emberwake · Diablo II</option>
        <option value="night-passage">☾ Night Passage · Action Roguelite</option>
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
