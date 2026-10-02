import { useState } from 'react';
import { CARD_BY_ID } from '../content/cards';
import { ENEMY_BY_ID } from '../content/world';
import { combatCardCost, intentText } from '../domain/combat';
import type { SpireCommand, SpireState } from '../domain/types';
import { AbilityCard } from './Card';
import { Portrait } from './Portrait';
import { statusText, powerText, enemyPowerText } from './statuses';
export function Battle({
  run,
  dispatch,
  targetId,
  onTarget,
}: {
  run: SpireState;
  dispatch: (c: SpireCommand) => void;
  targetId?: string;
  onTarget: (id: string) => void;
}) {
  const combat = run.combat!;
  const [pile, setPile] = useState<'draw' | 'discard' | 'exhaust' | 'powersPlayed' | null>(null);
  const selected = combat.enemies.find((e) => e.id === targetId);
  return (
    <section className="sts-battle">
      <div className="combat-top">
        <div className="energy-orb">
          {combat.energy}
          <small>ENERGY</small>
        </div>
        <div>
          <span className="eyebrow">TURN {combat.turn}</span>
          <p>Select an enemy, then play a card.</p>
        </div>
        <button
          className="primary"
          disabled={!!combat.choice}
          onClick={() => dispatch({ type: 'endTurn' })}
        >
          End turn →
        </button>
      </div>
      <div className="sts-battlefield">
        <div className="sts-hero">
          <Portrait id="ironclad" />
          <strong>Ironclad</strong>
          <span>
            ♥ {run.hp}/{run.maxHp} · ◈ {combat.player.block} Block
          </span>
          <small>{statusText(combat.player.status)}</small>
          <small>{powerText(combat.powers)}</small>
          {combat.noDraw && <small>No Draw this turn</small>}
          {combat.rage > 0 && <small>Rage {combat.rage}</small>}
        </div>
        <div className="enemy-row">
          {combat.enemies
            .filter((e) => e.hp > 0)
            .map((enemy) => (
              <button
                className={`enemy ${targetId === enemy.id ? 'targeted' : ''}`}
                key={enemy.id}
                onClick={() => onTarget(enemy.id)}
                aria-label={`Target ${ENEMY_BY_ID[enemy.definitionId].name}`}
                aria-pressed={targetId === enemy.id}
              >
                <span className="intent">{intentText(enemy, combat)}</span>
                <Portrait id={enemy.definitionId} />
                <strong>{ENEMY_BY_ID[enemy.definitionId].name}</strong>
                <span className="enemy-hp">
                  ♥ {enemy.hp}/{enemy.maxHp} {enemy.block > 0 ? `· ◈ ${enemy.block}` : ''}
                </span>
                <meter
                  aria-label={`${ENEMY_BY_ID[enemy.definitionId].name} health`}
                  min="0"
                  max={enemy.maxHp}
                  value={enemy.hp}
                />
                <span className="status-line">{statusText(enemy.status)}</span>
                <small title={ENEMY_BY_ID[enemy.definitionId].description}>
                  {enemyPowerText(enemy)}
                </small>
              </button>
            ))}
        </div>
      </div>
      {combat.choice ? (
        <div className="sts-card-choice" role="region" aria-label="Choose a card">
          <h3>
            Choose a card to{' '}
            {combat.choice.action === 'topdeck'
              ? 'put on top of your draw pile'
              : combat.choice.action}
          </h3>
          <div className="battle-hand" role="region" aria-label="Cards in hand">
            {combat.choice.options.map((id) => (
              <AbilityCard
                key={id}
                definition={CARD_BY_ID[combat.cards[id].definitionId]}
                upgraded={combat.cards[id].upgraded}
                onClick={() => dispatch({ type: 'chooseCard', id })}
                footnote="Select this card"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="battle-hand" role="region" aria-label="Cards in hand">
          {combat.hand.map((id) => {
            const card = combat.cards[id],
              definition = CARD_BY_ID[card.definitionId],
              cost = combatCardCost(run, id);
            return (
              <AbilityCard
                key={id}
                definition={definition}
                upgraded={card.upgraded}
                cost={cost}
                disabled={cost === -1 || cost > combat.energy}
                onClick={() =>
                  dispatch({
                    type: 'playCard',
                    id,
                    target: definition.target ? targetId : undefined,
                  })
                }
                footnote={
                  definition.target
                    ? `Target: ${selected ? ENEMY_BY_ID[selected.definitionId].name : ''}`
                    : 'Click to play'
                }
              />
            );
          })}
        </div>
      )}
      <div className="sts-pile-buttons">
        {(['draw', 'discard', 'exhaust', 'powersPlayed'] as const).map((key) => (
          <button
            key={key}
            aria-pressed={pile === key}
            onClick={() => setPile(pile === key ? null : key)}
          >
            {key === 'powersPlayed' ? 'Powers' : key} · {combat[key].length}
          </button>
        ))}
      </div>
      {pile && (
        <div className="sts-pile">
          <h3>
            {pile === 'draw'
              ? 'Draw pile · alphabetical, order hidden'
              : pile === 'powersPlayed'
                ? 'Active power cards'
                : pile}
          </h3>
          <div className="ability-grid">
            {[...combat[pile]]
              .sort((a, b) =>
                CARD_BY_ID[combat.cards[a].definitionId].name.localeCompare(
                  CARD_BY_ID[combat.cards[b].definitionId].name,
                ),
              )
              .map((id) => (
                <AbilityCard
                  key={id}
                  definition={CARD_BY_ID[combat.cards[id].definitionId]}
                  upgraded={combat.cards[id].upgraded}
                />
              ))}
          </div>
          {!combat[pile].length && <p>This pile is empty.</p>}
        </div>
      )}
    </section>
  );
}
