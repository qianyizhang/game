import { rankLabel } from '../domain/poker';
import type { Card as CardType } from '../domain/types';
import { PokerArt, SuitPip } from './Artwork';

export const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', spades: '♠', clubs: '♣' };
export function PlayingCard({
  card,
  selected,
  debuffed,
  onClick,
  disabled,
}: {
  card: CardType;
  selected?: boolean;
  debuffed?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const rank = rankLabel(card.rank);
  return (
    <button
      className={`playing-card ${card.suit} ${selected ? 'selected' : ''} ${debuffed ? 'debuffed' : ''} enhancement-${card.enhancement}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${rank} of ${card.suit}${card.enhancement !== 'plain' ? `, ${card.enhancement}` : ''}${debuffed ? ', debuffed' : ''}`}
    >
      <span className="card-corner">
        {rank}
        <small>
          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <SuitPip suit={card.suit} size={20} />
          </svg>
        </small>
      </span>
      <PokerArt rank={card.rank} suit={card.suit} />
      <span className="card-corner bottom">
        {rank}
        <small>
          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <SuitPip suit={card.suit} size={20} />
          </svg>
        </small>
      </span>
      {card.enhancement !== 'plain' && (
        <span className="enhancement-label">{card.enhancement}</span>
      )}
      {debuffed && <span className="debuff-label">Debuffed</span>}
    </button>
  );
}
