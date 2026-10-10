export type GameId = 'balatro' | 'spire' | 'battlegrounds' | 'diablo2';
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
        <option value="diablo2">✧ Emberwake · Diablo II</option>
      </select>
    </div>
  );
}
