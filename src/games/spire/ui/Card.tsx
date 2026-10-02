import { AbilityArt } from './AbilityArt';
import { CARD_BY_ID, cardCost } from '../content/cards';
import type { Card, CardDefinition, SpireState } from '../domain/types';

export function AbilityCard({
  definition,
  upgraded = false,
  onClick,
  disabled,
  footnote,
  cost,
}: {
  definition: CardDefinition;
  upgraded?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  footnote?: string;
  cost?: number;
}) {
  const energy = cost ?? cardCost(definition.id, upgraded);
  return (
    <button
      className={`ability-card ${definition.kind} rarity-${definition.rarity}${upgraded ? ' upgraded' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="ability-cost">{energy === -2 ? 'X' : energy < 0 ? '—' : energy}</span>
      <strong>
        {definition.name}
        {upgraded ? '+' : ''}
      </strong>
      <span className="ability-art">
        <AbilityArt definition={definition} upgraded={upgraded} />
      </span>
      <span className="eyebrow">
        {definition.kind} · {definition.rarity}
      </span>
      <span className="ability-text">{upgraded ? definition.upgradeText : definition.text}</span>
      {footnote && <small>{footnote}</small>}
    </button>
  );
}
export function DeckList({
  run,
  onPick,
  filter,
}: {
  run: SpireState;
  onPick?: (c: Card) => void;
  filter?: (c: Card) => boolean;
}) {
  return (
    <div className="deck-list">
      {run.deck.filter(filter ?? (() => true)).map((card) => (
        <button key={card.id} disabled={!onPick} onClick={() => onPick?.(card)}>
          <span className="deck-card-art">
            <AbilityArt definition={CARD_BY_ID[card.definitionId]} upgraded={card.upgraded} />
          </span>
          <span className="deck-card-name">
            {CARD_BY_ID[card.definitionId].name}
            {card.upgraded ? '+' : ''}
          </span>
        </button>
      ))}
    </div>
  );
}
