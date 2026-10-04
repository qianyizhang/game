import { MINION_BY_ID } from '../content/minions';
import type { Unit } from '../domain/types';
import { MinionArt } from './MinionArt';

export function minionKeywordText(unit: Unit): string {
  return unit.keywords
    .map(
      (keyword) =>
        ({
          shield: '◉ Shield',
          taunt: '▣ Taunt',
          windfury: '» Windfury',
          cleave: '↔ Cleave',
          poison: '☠ Poison',
          reborn: '↺ Reborn',
        })[keyword],
    )
    .join(' · ');
}

export function MinionCard({
  unit,
  onClick,
  selected,
  disabled,
  footnote,
  compact = false,
}: {
  unit: Unit;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  footnote?: string;
  compact?: boolean;
}) {
  const definition = MINION_BY_ID[unit.definitionId];
  const keywords = minionKeywordText(unit);
  return (
    <button
      className={`minion-card tribe-${definition.tribe} ${unit.golden ? 'golden' : ''} ${selected ? 'selected' : ''} ${unit.health <= 0 ? 'fallen' : ''} ${compact ? 'compact' : ''}`}
      title={`${definition.text}${unit.golden ? ' Golden: double stats and bonuses; summons golden tokens.' : ''}${keywords ? ` Active keywords: ${keywords}.` : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${definition.name}${unit.golden ? ' golden' : ''}, ${unit.attack} attack, ${Math.max(0, unit.health)} health${keywords ? `, ${keywords}` : ''}`}
    >
      <span className="minion-tier">{'★'.repeat(definition.tier)}</span>
      <span className="minion-art">
        <MinionArt definitionId={definition.id} tribe={definition.tribe} golden={unit.golden} />
      </span>
      <strong>{definition.name}</strong>
      <span className="minion-tribe">{definition.tribe}</span>
      {!compact && (
        <span className="minion-text">
          {definition.text}
          {unit.golden ? ' Golden: double stats and bonuses; summons golden tokens.' : ''}
        </span>
      )}
      <span className="minion-keywords">{keywords}</span>
      <span className="minion-stats">
        <b>{unit.attack}</b>
        <b>{Math.max(0, unit.health)}</b>
      </span>
      {footnote && <small>{footnote}</small>}
    </button>
  );
}
