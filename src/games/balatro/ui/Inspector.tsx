import { useState } from 'react';
import { HANDS, rankLabel } from '../domain/poker';
import type { RunState, ScoreResult, HandType } from '../domain/types';

const number = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 });
export function Inspector({ run, preview }: { run: RunState; preview: ScoreResult | null }) {
  const [tab, setTab] = useState('Score');
  const score = preview ?? run.lastScore;
  return (
    <aside className="inspector">
      <div className="inspector-title">
        <span className="eyebrow">UNDER THE HOOD</span>
        <span className="live-dot" />
      </div>
      <div className="tabs inspector-tabs">
        {['Score', 'Deck', 'Guide', 'Log'].map((item) => (
          <button key={item} onClick={() => setTab(item)} className={tab === item ? 'active' : ''}>
            {item}
          </button>
        ))}
      </div>
      {tab === 'Score' && (
        <>
          <h3>{preview ? 'Your hand, explained.' : 'Follow every effect.'}</h3>
          <p className="muted small">
            {preview
              ? 'Live preview · growth applies afterward. Glass breakage happens after scoring.'
              : 'Select cards to inspect a score, or review your last played hand below.'}
          </p>
          {score ? (
            <>
              <div className="inspector-total">
                <span>{HANDS[score.poker.type].name}</span>
                <strong>{number(score.total)}</strong>
                <small>
                  {number(score.chips)} chips × {number(score.mult)} mult
                </small>
              </div>
              <ol className="score-steps">
                {score.steps.map((step, index) => (
                  <li key={index}>
                    <span className="step-index">{index + 1}</span>
                    <div>
                      <strong>{step.source}</strong>
                      <p>{step.detail}</p>
                      <small>
                        {number(step.chips)} × {number(step.mult)}
                      </small>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <div className="inspector-empty">
              <span>ƒ</span>
              <p>
                A hand is a little program.
                <br />
                Watch yours come together.
              </p>
            </div>
          )}
        </>
      )}
      {tab === 'Deck' && (
        <>
          <h3>Your evolving deck</h3>
          <p className="muted small">
            {run.deck.length} permanent cards · {run.draw.length} undrawn this blind. The draw order
            stays hidden.
          </p>
          <div className="suit-counts">
            {['spades', 'hearts', 'clubs', 'diamonds'].map((suit) => (
              <div key={suit}>
                <span>{suit}</span>
                <strong>{run.deck.filter((c) => c.suit === suit).length}</strong>
              </div>
            ))}
          </div>
          <h4>Ranks remaining in draw pile</h4>
          <div className="rank-counts">
            {Array.from({ length: 13 }, (_, i) => i + 2).map((rank) => (
              <div key={rank}>
                <strong>{rankLabel(rank)}</strong>
                <span>
                  {run.deck.filter((c) => c.rank === rank && run.draw.includes(c.id)).length}
                </span>
              </div>
            ))}
          </div>
          <h4>Hand levels</h4>
          <div className="hand-levels">
            {Object.entries(HANDS).map(([id, definition]) => (
              <div key={id}>
                <span>{definition.name}</span>
                <strong>Lv. {run.levels[id as HandType]}</strong>
              </div>
            ))}
          </div>
        </>
      )}
      {tab === 'Guide' && (
        <>
          <h3>Build an engine.</h3>
          <div className="guide">
            <h4>01 · Beat the blind</h4>
            <p>
              Select up to five cards, then play a poker hand. Reach the target before your hands
              run out. Discards replace selected cards without spending a play.
            </p>
            <h4>02 · Make numbers work</h4>
            <p>
              Hand base → scoring cards → held steel cards → Jokers left to right. Put additive mult
              before whole-hand multipliers. Reorder using the arrows.
            </p>
            <h4>03 · Buy a direction</h4>
            <p>
              Pair effects, suit effects, straights, or money and growth: find cards that reinforce
              each other. Five Joker slots make every choice count.
            </p>
            <h4>04 · Keep a little cash</h4>
            <p>
              Each blind pays $3 / $4 / $5 plus $1 per unused hand and $1 interest per $5 held
              (maximum $5). Rerolls start at $5.
            </p>
            <h4>05 · Shape the deck</h4>
            <p>
              Planets upgrade a hand type immediately. Other consumables require selecting cards
              during a blind. They permanently change your deck.
            </p>
            <h4>06 · Read the boss</h4>
            <p>
              Each ante has two ordinary blinds, then a boss. The eighth ante ends with The Crown.
              Boss restrictions are visible before entry.
            </p>
          </div>
          <h4>Starting hand values</h4>
          <div className="hand-levels">
            {Object.entries(HANDS).map(([id, definition]) => (
              <div key={id}>
                <span>{definition.name}</span>
                <strong>
                  {definition.chips} × {definition.mult}
                </strong>
              </div>
            ))}
          </div>
        </>
      )}
      {tab === 'Log' && (
        <>
          <h3>Run notebook</h3>
          <p className="muted small">
            Seed: {run.seed}. Export contains the full accepted-command replay.
          </p>
          <ol className="run-log">
            {run.history
              .slice()
              .reverse()
              .map((item, i) => (
                <li key={i}>{item}</li>
              ))}
          </ol>
          {!run.history.length && <p className="empty">Your first blind is waiting.</p>}
        </>
      )}
    </aside>
  );
}
