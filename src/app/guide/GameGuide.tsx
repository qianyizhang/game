import { useEffect } from 'react';
import { GAME_GUIDES } from './games';
import { canonicalGameId } from '../games';
import { GameGuideArt } from './GameGuideArt';
import './GameGuide.css';

export default function GameGuide() {
  useEffect(() => {
    document.title = 'Game guide · Card Workshop';
  }, []);
  const requested = canonicalGameId(new URLSearchParams(location.search).get('game'));
  const current = GAME_GUIDES.find((entry) => entry.id === requested);
  return (
    <main className="game-guide">
      <header className="game-guide-masthead">
        <a href="?game=balatro">♠ Card Workshop</a>
        {current && <a href={`?game=${current.id}`}>← Return to {current.name}</a>}
      </header>
      <section className="game-guide-intro" aria-labelledby="guide-title">
        <p className="eyebrow">THE GAME GUIDE / SIX WAYS TO PLAY</p>
        <h1 id="guide-title">
          Find your next
          <br />
          <em>little obsession.</em>
        </h1>
        <p>
          Cards, creatures, dungeons and a passage through the dark. Here’s what each name means,
          what you do, and where to begin.
        </p>
        <a className="game-guide-glossary" href="?guide=glossary">
          Unfamiliar word? Open the visual glossary →
        </a>
        <nav aria-label="Games in this guide">
          {GAME_GUIDES.map((game, index) => (
            <a key={game.id} href={`#guide-${game.id}`}>
              <span>0{index + 1}</span> {game.name} ↗
            </a>
          ))}
        </nav>
      </section>
      <div className="game-guide-grid">
        {GAME_GUIDES.map((game, index) => (
          <article
            id={`guide-${game.id}`}
            key={game.id}
            className="game-guide-card"
            aria-labelledby={`title-${game.id}`}
          >
            <div className="game-guide-plate">
              <GameGuideArt game={game.id} />
              <span>
                0{index + 1} / {game.genre}
              </span>
            </div>
            <div className="game-guide-copy">
              <p className="game-guide-reference">{game.reference}</p>
              <h2 id={`title-${game.id}`}>{game.name}</h2>
              <p className="game-guide-hook">{game.hook}</p>
              <p>{game.description}</p>
              <h3>Your first moves</h3>
              <ol>
                {game.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <dl>
                <dt>The goal</dt>
                <dd>{game.goal}</dd>
                <dt>Controls</dt>
                <dd>{game.controls}</dd>
              </dl>
              <aside>
                <strong>A useful first thought</strong>
                <p>{game.tip}</p>
              </aside>
              <a
                className="game-guide-terms"
                href={`?guide=glossary&group=${game.id}&game=${game.id}`}
              >
                Terms for {game.name} →
              </a>
              <a className="game-guide-play" href={`?game=${game.id}`}>
                Play {game.name} <span aria-hidden="true">→</span>
              </a>
            </div>
          </article>
        ))}
      </div>
      <footer>
        <strong>Your own little workshop.</strong>
        <p>
          These are playable studies with independent local saves. Play opens your existing game;
          starting a new run is a separate choice inside it.
        </p>
        <a href="#guide-title">Back to top ↑</a>
      </footer>
    </main>
  );
}
