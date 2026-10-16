import './review.css';

interface Props {
  index: number;
  count: number;
  onMove: (index: number) => void;
  onBefore?: () => void;
  onAfter?: () => void;
}

/** Navigation operates on original policy decisions, independently of replay packing. */
export function DecisionNavigator({ index, count, onMove, onBefore, onAfter }: Props) {
  return (
    <nav className="policy-navigation" aria-label="Decision navigation">
      <button disabled={!count || index === 0} onClick={() => onMove(0)}>
        First decision
      </button>
      <button disabled={!count || index === 0} onClick={() => onMove(index - 1)}>
        Previous decision
      </button>
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
      <button disabled={!count || index >= count - 1} onClick={() => onMove(index + 1)}>
        Next decision
      </button>
      <button disabled={!count || index >= count - 1} onClick={() => onMove(count - 1)}>
        Last decision
      </button>
      {onBefore && (
        <button disabled={!count} onClick={onBefore}>
          Before decision
        </button>
      )}
      {onAfter && (
        <button disabled={!count} onClick={onAfter}>
          After decision
        </button>
      )}
    </nav>
  );
}
