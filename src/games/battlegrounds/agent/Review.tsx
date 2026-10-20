import { PolicyReview } from '../../../shared/policy/Review';
import { HEROES } from '../content/minions';
import type { Unit } from '../domain/types';
import { HeroArt } from '../ui/HeroArt';
import { MinionCard } from '../ui/MinionCard';
import { SpellCard } from '../ui/SpellCard';
import '../ui/TavernSpells.css';
import { adapter, createReviewSeeker, type EpisodeState } from './adapter';
import { builtins } from './policy';
import './review.css';

function Minions({ label, units }: { label: string; units: Unit[] }) {
  if (!units.length) return null;
  return (
    <section aria-label={label}>
      <h3>
        {label} · {units.length}
      </h3>
      <div className="hearth-recorded-minions">
        {units.map((unit) => (
          <MinionCard key={unit.id} unit={unit} disabled />
        ))}
      </div>
    </section>
  );
}

/** Presentation receives only the reconstructed public frame at the selected boundary. */
function Board({ state }: { state: EpisodeState }) {
  const view = state.input.observation;
  const self = view.self;
  const hero = HEROES.find((candidate) => candidate.id === self.hero)!;
  return (
    <section className="hearth-policy-board" aria-label="Recorded Hearth table">
      <header className="round-strip">
        <div>
          <p className="eyebrow">
            Round {view.round} · {view.phase} · Recorded public view
          </p>
          <h2>{hero.name}</h2>
        </div>
        <HeroArt id={self.hero} />
        <div className="adventure-resources">
          <span className="health">♥ {self.hp} HP</span>
          <span>{self.gold} gold</span>
          <span>Tier {self.tier}</span>
        </div>
      </header>
      <details>
        <summary>Hero ability</summary>
        <p>{hero.text}</p>
      </details>
      <Minions label="Your warband" units={self.board} />
      <Minions label="Your minion hand" units={self.hand} />
      <Minions label="Your tavern offers" units={self.shop} />
      <Minions label="Your Discover options" units={self.discover} />
      {(self.tavern?.offer || !!self.tavern?.hand.length) && (
        <section aria-label="Your tavern spells" className="tavern-spells">
          <h3>Your tavern spells</h3>
          <h4>Offer</h4>
          {self.tavern?.offer ? (
            <SpellCard spell={self.tavern.offer} mode="catalogue" />
          ) : (
            <p>No offer</p>
          )}
          <h4>Hand</h4>
          <div className="spell-hand">
            {self.tavern?.hand.map((spell) => (
              <SpellCard key={spell.id} spell={spell} mode="catalogue" />
            ))}
            {!self.tavern?.hand.length && <p>Empty</p>}
          </div>
        </section>
      )}
      <details aria-label="Public lobby">
        <summary>Public lobby · round-opening snapshot</summary>
        <div className="hearth-public-lobby">
          {view.lobby.map((seat) => (
            <p key={seat.id}>
              {seat.name} · {HEROES.find((candidate) => candidate.id === seat.hero)?.name} ·{' '}
              {seat.hp} HP · Tier {seat.tier}
              {seat.placement !== null && ` · Place ${seat.placement}`}
            </p>
          ))}
        </div>
      </details>
      <details aria-label="Known opponent">
        <summary>Known opponent</summary>
        {view.opponent ? (
          <>
            <p>
              {view.opponent.source}
              {view.opponent.seenRound !== null && ` · Seen round ${view.opponent.seenRound}`}
              {view.opponent.tier !== null && ` · Tier ${view.opponent.tier}`}
            </p>
            {view.opponent.board ? (
              <Minions label="Observed opponent warband" units={view.opponent.board} />
            ) : (
              <p>Warband unseen</p>
            )}
          </>
        ) : (
          <p>No opponent announced</p>
        )}
      </details>
      {view.lastCombat && (
        <section aria-label="Last combat result">
          <h3>Last combat result</h3>
          <p>
            {view.lastCombat.winner === null
              ? 'Tie'
              : view.lastCombat.winner === 0
                ? 'Won'
                : 'Lost'}{' '}
            · Damage {view.lastCombat.damage.join(' / ')} · {view.lastCombat.attacks} attacks
            {view.lastCombat.stalemate && ' · Stalemate'}
          </p>
        </section>
      )}
    </section>
  );
}
const factories = Object.values(builtins);
const seek = createReviewSeeker();
const renderState = (state: EpisodeState) => <Board state={state} />;
export default function HearthReview() {
  return (
    <PolicyReview
      title="Last Hearth"
      gameHref="/?game=battlegrounds"
      adapter={adapter}
      factories={factories}
      seek={seek}
      renderState={renderState}
    />
  );
}
