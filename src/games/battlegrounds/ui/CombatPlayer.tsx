import { useState } from 'react';
import { usePlaybackClock } from '../../../shared/usePlaybackClock';
import { MINION_BY_ID } from '../content/minions';
import type { CombatResult } from '../domain/types';
import { MinionCard } from './MinionCard';

export function CombatPlayer({ result, opponent }: { result: CombatResult; opponent: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [speed, setSpeed] = useState(600);
  const { index, last, playing, finished, seek, toggle } = usePlaybackClock(
    result,
    result.frames.length,
    speed,
  );
  const frame = result.frames[Math.min(index, result.frames.length - 1)];
  if (!frame) return null;
  const selected = frame.boards.flat().find((unit) => unit.id === selectedId);
  return (
    <section className="combat-replay">
      <div className="replay-heading">
        <div>
          <p className="eyebrow">COMBAT REPLAY · {result.attacks} ATTACKS</p>
          <h2>You vs {opponent}</h2>
        </div>
        <span className="combat-verdict">
          {result.winner === 0 ? 'Victory' : result.winner === 1 ? 'Defeat' : 'Tie'}
        </span>
      </div>
      <p className="small muted">
        The result is already resolved. Playback speed changes the view, never the outcome.
      </p>
      <span className="eyebrow">{opponent.toUpperCase()}</span>
      <div className="combat-warband">
        {frame.boards[1].map((unit) => (
          <MinionCard
            unit={unit}
            compact
            key={unit.id}
            onClick={() => setSelectedId(unit.id)}
            selected={unit.id === frame.target || unit.id === frame.attacker}
          />
        ))}
        {!frame.boards[1].length && <p className="empty">Warband defeated</p>}
      </div>
      <div className="combat-caption" aria-live="polite">
        {frame.text}
      </div>
      <div className="combat-warband">
        {frame.boards[0].map((unit) => (
          <MinionCard
            unit={unit}
            compact
            key={unit.id}
            onClick={() => setSelectedId(unit.id)}
            selected={unit.id === frame.target || unit.id === frame.attacker}
          />
        ))}
        {!frame.boards[0].length && <p className="empty">Warband defeated</p>}
      </div>
      <span className="eyebrow">YOUR COMBAT SNAPSHOT · CLICK A MINION TO INSPECT</span>
      {selected && (
        <div className="selected-minion-detail">
          <strong>
            {MINION_BY_ID[selected.definitionId].name}
            {selected.golden ? ' · Golden' : ''}
          </strong>
          <span>
            {MINION_BY_ID[selected.definitionId].text}
            {selected.golden ? ' Double stats and bonuses; summons golden tokens.' : ''}
          </span>
        </div>
      )}
      <div className="playback-controls">
        <button aria-label="First combat event" disabled={index === 0} onClick={() => seek(0)}>
          ↤
        </button>
        <button
          aria-label="Previous combat event"
          disabled={index === 0}
          onClick={() => seek(index - 1)}
        >
          ←
        </button>
        <button onClick={toggle}>{playing && !finished ? 'Pause playback' : 'Play replay'}</button>
        <button aria-label="Next combat event" disabled={finished} onClick={() => seek(index + 1)}>
          →
        </button>
        <button aria-label="Last combat event" disabled={finished} onClick={() => seek(last)}>
          ↦
        </button>
        <label>
          Speed{' '}
          <select
            aria-label="Playback speed"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            <option value={1000}>Slow</option>
            <option value={600}>Normal</option>
            <option value={200}>Fast</option>
          </select>
        </label>
      </div>
      <input
        className="combat-slider"
        type="range"
        aria-label="Combat event"
        min={0}
        max={last}
        value={index}
        onChange={(e) => seek(Number(e.target.value))}
      />
      <p className="small muted">
        Event {index + 1}/{result.frames.length} · Hero damage: you {result.damage[0]}, opponent{' '}
        {result.damage[1]}
      </p>
    </section>
  );
}
