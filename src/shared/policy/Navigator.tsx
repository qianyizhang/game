import './review.css';

interface Props {
  index: number;
  count: number;
  onMove: (index: number) => void;
  onBefore?: () => void;
  onAfter?: () => void;
  boundary?: 'before' | 'after';
  playing?: boolean;
  onPlay?: () => void;
}

/** Navigation operates on original policy decisions, independently of replay packing. */
export function DecisionNavigator({
  index,
  count,
  onMove,
  onBefore,
  onAfter,
  boundary,
  playing,
  onPlay,
}: Props) {
  return (
    <nav className="policy-navigation" aria-label="Decision navigation">
      <button
        aria-label="First decision"
        title="First decision"
        disabled={!count || index === 0}
        onClick={() => onMove(0)}
      >
        ⇤
      </button>
      <button
        aria-label="Previous decision"
        title="Previous decision"
        disabled={!count || index === 0}
        onClick={() => onMove(index - 1)}
      >
        ←
      </button>
      {onPlay && (
        <button
          aria-label={playing ? 'Pause decisions' : 'Play decisions'}
          disabled={!count}
          onClick={onPlay}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      )}
      <label>
        Decision{' '}
        <input
          type="number"
          min={1}
          max={count || 1}
          aria-label="Decision number"
          value={count ? index + 1 : ''}
          disabled={!count}
          onChange={(event) => {
            const next = Number(event.target.value) - 1;
            if (Number.isSafeInteger(next) && next >= 0 && next < count) onMove(next);
          }}
        />{' '}
        / {count}
      </label>
      <button
        aria-label="Next decision"
        title="Next decision"
        disabled={!count || index >= count - 1}
        onClick={() => onMove(index + 1)}
      >
        →
      </button>
      <button
        aria-label="Last decision"
        title="Last decision"
        disabled={!count || index >= count - 1}
        onClick={() => onMove(count - 1)}
      >
        ⇥
      </button>
      <span className="policy-boundary-controls" role="group" aria-label="Decision boundary">
        {onBefore && (
          <button
            aria-label="Before decision"
            aria-pressed={boundary === undefined ? undefined : boundary === 'before'}
            disabled={!count}
            onClick={onBefore}
          >
            Before
          </button>
        )}
        {onAfter && (
          <button
            aria-label="After decision"
            aria-pressed={boundary === undefined ? undefined : boundary === 'after'}
            disabled={!count}
            onClick={onAfter}
          >
            After
          </button>
        )}
      </span>
    </nav>
  );
}
