import { useState } from 'react';
import { CONSUMABLES } from '../content/consumables';
import { JOKERS } from '../content/jokers';
import { BOSSES } from '../content/blinds';
import { BossArt, ConsumableArt, JokerArt } from './Artwork';

export function Collection() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Jokers');
  const items = category === 'Jokers' ? JOKERS : category === 'Consumables' ? CONSUMABLES : BOSSES;
  const filtered = items.filter((item) =>
    `${item.name} ${item.description} ${'family' in item ? String(item.family) : ''}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <p className="eyebrow">THE COLLECTION</p>
      <h2>Small cards. Big possibilities.</h2>
      <p className="muted">
        {JOKERS.length} Jokers, {CONSUMABLES.length} consumables and {BOSSES.length} boss rules.
        Every card is available from the start.
      </p>
      <div className="collection-controls">
        <div className="tabs">
          {['Jokers', 'Consumables', 'Bosses'].map((label) => (
            <button
              key={label}
              className={category === label ? 'active' : ''}
              onClick={() => setCategory(label)}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          aria-label="Search collection"
          placeholder="Find a card or mechanic…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="collection-grid">
        {filtered.map((item) => (
          <article
            className={`catalogue-card ${'family' in item ? 'joker-art' : 'consumable-art'}`}
            key={item.id}
          >
            {category === 'Jokers' ? (
              <JokerArt id={item.id} />
            ) : category === 'Consumables' ? (
              <ConsumableArt id={item.id} />
            ) : (
              <BossArt id={item.id} />
            )}
            <span className="eyebrow">
              {'family' in item && 'rarity' in item
                ? `${String(item.family)} · ${String(item.rarity)}`
                : category}
            </span>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            {'price' in item && <span className="price">${String(item.price)}</span>}
          </article>
        ))}
      </div>
      {filtered.length === 0 && <p className="empty">No cards match that search.</p>}
    </>
  );
}
