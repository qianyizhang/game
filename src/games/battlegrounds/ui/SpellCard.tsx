import { SPELL_BY_ID } from '../content/spells';
import type { TavernSpell } from '../domain/types';
import { TavernSpellArt } from './TavernSpellArt';
export function SpellCard({
  spell,
  mode,
  disabled,
  onClick,
}: {
  spell: TavernSpell;
  mode: 'buy' | 'cast' | 'catalogue';
  disabled?: boolean;
  onClick?: () => void;
}) {
  const definition = SPELL_BY_ID[spell.definitionId];
  const label =
    mode === 'buy'
      ? `Buy ${definition.name} · ${definition.cost} gold`
      : mode === 'cast'
        ? `Cast ${definition.name}`
        : definition.name;
  const content = (
    <>
      <span className="spell-card-header">
        <strong>{definition.name}</strong>
        <span>Tier {definition.tier}</span>
      </span>
      <TavernSpellArt id={definition.id} />
      <span className="spell-card-text">{definition.text}</span>
      <span className="spell-card-footer">
        {mode === 'cast' ? 'Cast · free' : `Buy · ${definition.cost} gold`}
      </span>
    </>
  );
  return mode === 'catalogue' ? (
    <article className="spell-card">{content}</article>
  ) : (
    <button className="spell-card" aria-label={label} disabled={disabled} onClick={onClick}>
      {content}
    </button>
  );
}
