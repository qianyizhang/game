import { activeBoss, currentBoss, targetFor } from '../content/blinds';
import { CONSUMABLE_BY_ID } from '../content/consumables';
import { JOKER_BY_ID } from '../content/jokers';
import { CONSUMABLE_LIMIT, JOKER_LIMIT, rerollPrice, sellPrice } from '../domain/game';
import { HANDS } from '../domain/poker';
import { isDebuffed } from '../domain/scoring';
import type { Command, RunState, ScoreResult } from '../domain/types';
import { PlayingCard } from './Card';
import { BossArt, ConsumableArt, JokerArt } from './Artwork';

const number = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 1 });
interface Props {
  run: RunState;
  selected: string[];
  toggle: (id: string) => void;
  dispatch: (c: Command) => boolean;
  preview: ScoreResult | null;
  newRun: () => void;
}

export function Table({ run, selected, toggle, dispatch, preview, newRun }: Props) {
  const boss = currentBoss(run);
  const isFinished = run.phase === 'won' || run.phase === 'lost';
  return (
    <div className="table-area">
      <div className="round-strip">
        <div>
          <span className="eyebrow">ANTE {run.ante} / 8</span>
          <h2>{run.blind === 2 ? boss.name : ['Small Blind', 'Big Blind'][run.blind]}</h2>
        </div>
        <div className="blind-track">
          {['SMALL', 'BIG', 'BOSS'].map((label, i) => (
            <div
              key={label}
              className={`${i === run.blind ? 'current' : ''} ${i < run.blind ? 'complete' : ''}`}
            >
              <span>{i < run.blind ? '✓' : i + 1}</span>
              <small>{label}</small>
            </div>
          ))}
        </div>
        <div className="wallet">
          <span className="eyebrow">BANKROLL</span>
          <strong>${run.cash}</strong>
        </div>
      </div>
      <div className="inventory-header">
        <span className="eyebrow">YOUR ENGINE</span>
        <span>
          {run.jokers.length}/{JOKER_LIMIT} Jokers · resolve left to right →
        </span>
      </div>
      <div className="joker-rack">
        {run.jokers.map((owned, index) => {
          const definition = JOKER_BY_ID[owned.definitionId];
          return (
            <article className={`owned-joker ${definition.rarity}`} key={owned.id}>
              <JokerArt id={definition.id} />
              <div className="joker-name">{definition.name}</div>
              <p>{definition.description}</p>
              {!!owned.growth && (
                <span className="growth">
                  Growth +{owned.growth}
                  {owned.definitionId === 'tidal' ? ' tenths' : ''}
                </span>
              )}
              <div className="joker-actions">
                <button
                  aria-label={`Move ${definition.name} left`}
                  disabled={index === 0 || isFinished}
                  onClick={() => dispatch({ type: 'moveJoker', id: owned.id, direction: -1 })}
                >
                  ←
                </button>
                <button
                  disabled={isFinished}
                  onClick={() => dispatch({ type: 'sellJoker', id: owned.id })}
                >
                  Sell ${sellPrice(owned.paid)}
                </button>
                <button
                  aria-label={`Move ${definition.name} right`}
                  disabled={index === run.jokers.length - 1 || isFinished}
                  onClick={() => dispatch({ type: 'moveJoker', id: owned.id, direction: 1 })}
                >
                  →
                </button>
              </div>
            </article>
          );
        })}
        {Array.from({ length: JOKER_LIMIT - run.jokers.length }, (_, index) => (
          <div className="empty-joker" key={index}>
            <span>✧</span>
            <small>JOKER SLOT {run.jokers.length + index + 1}</small>
          </div>
        ))}
      </div>
      <div className="playmat">
        {run.phase === 'ready' && (
          <div className="blind-intro">
            <div className="blindside-emblem">
              <BossArt id={run.blind === 2 ? boss.id : 'small'} />
            </div>
            <p className="eyebrow">{run.blind === 2 ? 'THE BOSS IS WAITING' : 'TAKE YOUR SEAT'}</p>
            <h1>
              Every hand
              <br />
              <em>has potential.</em>
            </h1>
            <p>
              Score <strong>{number(targetFor(run))}</strong> points to clear this blind.
            </p>
            {run.blind === 2 && <p className="boss-warning">{boss.description}</p>}
            <button className="primary large" onClick={() => dispatch({ type: 'startBlind' })}>
              Play {run.blind === 2 ? 'Boss' : ['Small', 'Big'][run.blind]} Blind <span>↗</span>
            </button>
            <small className="muted">
              Four hands. Three discards. Find your combination.
              <br />
              Bosses and Jokers may change your starting resources.
            </small>
          </div>
        )}
        {run.phase === 'playing' && (
          <>
            <div className="scoreboard">
              <div>
                <span className="eyebrow">ROUND SCORE</span>
                <strong data-testid="round-score">
                  {number(run.roundScore)} <small>/ {number(run.target)}</small>
                </strong>
                <div className="progress">
                  <span
                    style={{ width: `${Math.min(100, (run.roundScore / run.target) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="resources">
                <div>
                  <strong>{run.handsLeft}</strong>
                  <span>hands</span>
                </div>
                <div>
                  <strong>{run.discardsLeft}</strong>
                  <span>discards</span>
                </div>
              </div>
            </div>
            {activeBoss(run) && (
              <div className="boss-banner">
                <strong>
                  <BossArt id={boss.id} /> {boss.name}
                </strong>
                <span>{boss.description}</span>
              </div>
            )}
            <div className="hand-preview">
              <div>
                <span className="eyebrow">
                  {preview ? `LEVEL ${run.levels[preview.poker.type]}` : 'YOUR NEXT MOVE'}
                </span>
                <h3>{preview ? HANDS[preview.poker.type].name : 'Find your hand'}</h3>
              </div>
              <div className="score-equation">
                <span className="chips">{preview ? number(preview.chips) : '—'}</span>
                <b>×</b>
                <span className="mult">{preview ? number(preview.mult) : '—'}</span>
                <b>=</b>
                <strong>{preview ? number(preview.total) : '—'}</strong>
              </div>
            </div>
            <div className="hand-sort">
              <span>SCORING ORDER →</span>
              <div>
                Sort{' '}
                <button onClick={() => dispatch({ type: 'sortHand', by: 'rank' })}>Rank</button>
                <button onClick={() => dispatch({ type: 'sortHand', by: 'suit' })}>Suit</button>
              </div>
            </div>
            <div className="hand-cards">
              {run.hand.map((id, index) => {
                const card = run.deck.find((item) => item.id === id)!;
                return (
                  <div className="card-column" key={id}>
                    <PlayingCard
                      card={card}
                      selected={selected.includes(id)}
                      debuffed={isDebuffed(card, run)}
                      onClick={() => toggle(id)}
                      disabled={!selected.includes(id) && selected.length >= 5}
                    />
                    <div className="card-order">
                      <button
                        disabled={index === 0}
                        aria-label={`Move card ${index + 1} left`}
                        onClick={() => dispatch({ type: 'moveCard', id, direction: -1 })}
                      >
                        ‹
                      </button>
                      <button
                        disabled={index === run.hand.length - 1}
                        aria-label={`Move card ${index + 1} right`}
                        onClick={() => dispatch({ type: 'moveCard', id, direction: 1 })}
                      >
                        ›
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="hand-actions">
              <button
                className="primary"
                disabled={!selected.length || (activeBoss(run) === 'five' && selected.length !== 5)}
                onClick={() => dispatch({ type: 'play', cards: selected })}
              >
                Play hand <span>↗</span>
              </button>
              <button
                className="secondary"
                disabled={!selected.length || !run.discardsLeft}
                onClick={() => dispatch({ type: 'discard', cards: selected })}
              >
                Discard
              </button>
              <span className="selection-count">{selected.length}/5 selected</span>
              <span className="deck-counter">▤ {run.draw.length} in draw pile</span>
            </div>
          </>
        )}
        {run.phase === 'shop' && (
          <div className="shop">
            <div className="shop-heading">
              <div>
                <p className="eyebrow">BLIND CLEARED · THE TRADING POST</p>
                <h2>Find your next unfair advantage.</h2>
              </div>
              <button className="primary" onClick={() => dispatch({ type: 'leaveShop' })}>
                Next blind →
              </button>
            </div>
            <p className="payout">{run.notice}</p>
            <div className="shop-grid">
              {run.shop.map((offer) => {
                const definition =
                  offer.kind === 'joker'
                    ? JOKER_BY_ID[offer.definitionId]
                    : CONSUMABLE_BY_ID[offer.definitionId];
                const full =
                  offer.kind === 'joker'
                    ? run.jokers.length >= JOKER_LIMIT
                    : run.consumables.length >= CONSUMABLE_LIMIT;
                return (
                  <article
                    key={offer.id}
                    className={`shop-card ${offer.kind === 'joker' ? 'joker-art' : 'consumable-art'}`}
                  >
                    {offer.kind === 'joker' ? (
                      <JokerArt id={definition.id} />
                    ) : (
                      <ConsumableArt id={definition.id} />
                    )}
                    <span className="eyebrow">
                      {offer.kind === 'joker'
                        ? 'family' in definition && definition.family
                        : 'Consumable'}
                    </span>
                    <h3>{definition.name}</h3>
                    <p>{definition.description}</p>
                    <button
                      disabled={run.cash < offer.price || full}
                      onClick={() => dispatch({ type: 'buy', offerId: offer.id })}
                    >
                      {full ? 'Slots full' : `Buy · $${offer.price}`}
                    </button>
                  </article>
                );
              })}
            </div>
            <div className="shop-footer">
              <button
                className="secondary"
                disabled={run.cash < rerollPrice(run)}
                onClick={() => dispatch({ type: 'reroll' })}
              >
                ↻ Reroll · ${rerollPrice(run)}
              </button>
              <span className="muted small">
                Save $5 to earn $1 interest next round. Interest caps at $5.
              </span>
            </div>
          </div>
        )}
        {isFinished && (
          <div className="blind-intro end-screen">
            <div className="blindside-emblem">
              {run.phase === 'won' ? <BossArt id="crown" /> : <JokerArt id="reserve" />}
            </div>
            <p className="eyebrow">
              {run.phase === 'won'
                ? 'EIGHT ANTES. ONE BEAUTIFUL ENGINE.'
                : 'EVERY RUN TEACHES SOMETHING.'}
            </p>
            <h1>
              {run.phase === 'won' ? (
                <>
                  You broke
                  <br />
                  <em>the blind.</em>
                </>
              ) : (
                <>
                  Another hand.
                  <br />
                  <em>Another idea.</em>
                </>
              )}
            </h1>
            <p>
              {run.phase === 'won'
                ? `The Crown is defeated. Your final hand scored ${number(run.lastScore?.total ?? 0)}.`
                : run.notice}
            </p>
            <button className="primary large" onClick={newRun}>
              Start a new run ↗
            </button>
            <small className="muted">Your final score breakdown is in the inspector.</small>
          </div>
        )}
      </div>
      <div className="consumable-bar">
        <div>
          <span className="eyebrow">POCKET TOOLS</span>
          <small>
            {run.consumables.length}/{CONSUMABLE_LIMIT} consumables
          </small>
        </div>
        {run.consumables.map((owned) => {
          const definition = CONSUMABLE_BY_ID[owned.definitionId];
          const usable =
            !isFinished &&
            (!definition.targets ||
              (run.phase === 'playing' &&
                selected.length > 0 &&
                selected.length <= definition.targets));
          return (
            <div className="pocket" key={owned.id}>
              <ConsumableArt id={definition.id} />
              <div>
                <strong>{definition.name}</strong>
                <p>{definition.description}</p>
              </div>
              <button
                disabled={!usable}
                onClick={() =>
                  dispatch({
                    type: 'useConsumable',
                    id: owned.id,
                    cards: definition.targets ? selected : [],
                  })
                }
              >
                Use
              </button>
              <button
                className="text-button"
                disabled={isFinished}
                onClick={() => dispatch({ type: 'sellConsumable', id: owned.id })}
              >
                Sell ${sellPrice(owned.paid)}
              </button>
            </div>
          );
        })}
        {!run.consumables.length && (
          <p className="muted small">Find planets and deck-changing cards in the shop.</p>
        )}
      </div>
      <div className="upcoming">
        <span className="blindside-upcoming-art">
          <BossArt id={boss.id} />
        </span>
        <div>
          <span className="eyebrow">THIS ANTE’S BOSS · {boss.name}</span>
          <p>{boss.description}</p>
        </div>
        <span className="seed-label">SEED {run.seed}</span>
      </div>
    </div>
  );
}
