import { CARD_BY_ID } from '../content/cards';
import { POTIONS, RELIC_BY_ID } from '../content/world';
import { removalCost } from '../domain/rewards';
import type { Potion, SpireCommand, SpireState } from '../domain/types';
import { AbilityCard, DeckList } from './Card';
import { Portrait } from './Portrait';
export function Room({ run, dispatch }: { run: SpireState; dispatch: (c: SpireCommand) => void }) {
  const event = (choice: string, card?: string) => dispatch({ type: 'event', choice, card });
  const option = (label: string, choice: string, disabled = false) => (
    <button disabled={disabled} onClick={() => event(choice)}>
      {label}
    </button>
  );
  return (
    <section className={`choice-panel sts-room ${run.phase}`}>
      {run.phase === 'neow' && (
        <>
          <div className="sts-intro">
            <Portrait id="ironclad" />
            <div>
              <p className="eyebrow">SLAY THE SPIRE · ASCENSION 0</p>
              <h1>The Ironclad</h1>
              <p>80 HP. A battered sword. A pact with a demon.</p>
              <p>
                Burning Blood restores 6 HP after combat. Build your deck, choose your route, and
                defeat three bosses.
              </p>
            </div>
          </div>
          <h2>Neow’s blessing</h2>
          <p>Choose one blessing to begin your ascent.</p>
          <div className="event-options">
            {(
              [
                ['maxHp', 'Obtain +8 Max HP'],
                ['lament', 'Neow’s Lament · enemies in your first 3 combats have 1 HP'],
                ['gold', 'Obtain 100 gold'],
                ['bossSwap', 'Exchange Burning Blood for a random boss relic'],
              ] as const
            ).map(([choice, label]) => (
              <button key={choice} onClick={() => dispatch({ type: 'neow', choice })}>
                {label}
              </button>
            ))}
          </div>
          <p className="muted small">
            Original Slay the Spire rules, with a curated Ironclad content set and original
            illustrations.
          </p>
        </>
      )}
      {run.phase === 'reward' && (
        <>
          <p className="eyebrow">VICTORY</p>
          <h2>Choose a card</h2>
          <p>Take one, or skip to keep your deck focused.</p>
          {run.rewardRelic && (
            <p>
              Relic: <strong>{RELIC_BY_ID[run.rewardRelic].name}</strong> —{' '}
              {RELIC_BY_ID[run.rewardRelic].text}
            </p>
          )}
          {run.rewardPotion && (
            <p>
              Potion: {POTIONS[run.rewardPotion].name}
              {run.potions.length >= 3 ? ' · belt full; discard a potion below to claim this.' : ''}
            </p>
          )}
          <div className="reward-cards">
            {run.reward.map((id) => (
              <AbilityCard
                key={id}
                definition={CARD_BY_ID[id]}
                upgraded={run.rewardUpgrades.includes(id)}
                onClick={() => dispatch({ type: 'takeReward', card: id })}
                footnote="Add to deck"
              />
            ))}
          </div>
          <button
            className="secondary"
            onClick={() => dispatch({ type: 'takeReward', card: null })}
          >
            Skip card · continue →
          </button>
        </>
      )}
      {run.phase === 'bossRelic' && (
        <>
          <p className="eyebrow">BOSS CHEST</p>
          <h2>Power at a price</h2>
          <div className="sts-relic-choices">
            {run.bossRelics.map((id) => (
              <button key={id} onClick={() => dispatch({ type: 'bossRelic', id })}>
                <span>{RELIC_BY_ID[id].symbol}</span>
                <h3>{RELIC_BY_ID[id].name}</h3>
                <p>{RELIC_BY_ID[id].text}</p>
              </button>
            ))}
          </div>
          <p>You recover all HP before the next act.</p>
          <button onClick={() => dispatch({ type: 'bossRelic', id: null })}>
            Skip relic · next act →
          </button>
        </>
      )}
      {run.phase === 'rest' && (
        <>
          <span className="scene-symbol">♨</span>
          <p className="eyebrow">CAMPFIRE</p>
          <h2>Rest or Smith</h2>
          <button
            className="primary"
            disabled={run.relics.includes('coffeeDripper')}
            onClick={() => dispatch({ type: 'rest', choice: 'heal' })}
          >
            Rest · heal up to{' '}
            {Math.floor(run.maxHp * 0.3) + (run.relics.includes('regalPillow') ? 15 : 0)} HP
          </button>
          {run.relics.includes('coffeeDripper') && <p>Coffee Dripper prevents resting.</p>}
          <h3>Smith · upgrade one card</h3>
          {run.relics.includes('fusionHammer') ? (
            <p>Fusion Hammer prevents smithing.</p>
          ) : (
            <DeckList
              run={run}
              filter={(c) => !c.upgraded && !CARD_BY_ID[c.definitionId].token}
              onPick={(c) => dispatch({ type: 'rest', choice: 'upgrade', card: c.id })}
            />
          )}
          <button onClick={() => dispatch({ type: 'rest', choice: 'leave' })}>
            Leave campfire
          </button>
        </>
      )}
      {run.phase === 'treasure' && (
        <>
          <span className="scene-symbol">▣</span>
          <h2>A treasure chest</h2>
          <p>
            A relic waits inside.
            {run.relics.includes('cursedKey')
              ? ' Cursed Key will also add a Curse to your deck.'
              : ''}
          </p>
          <button className="primary" onClick={() => dispatch({ type: 'takeTreasure' })}>
            Open chest
          </button>
          <button onClick={() => dispatch({ type: 'takeTreasure', skip: true })}>
            Leave unopened
          </button>
        </>
      )}
      {run.phase === 'shop' && (
        <>
          <p className="eyebrow">THE MERCHANT</p>
          <h2>Spend wisely.</h2>
          <div className="reward-cards">
            {run.shop
              .filter((o) => o.kind === 'card')
              .map((o) => (
                <AbilityCard
                  key={o.id}
                  definition={CARD_BY_ID[o.definitionId]}
                  disabled={run.gold < o.price}
                  onClick={() => dispatch({ type: 'buy', id: o.id })}
                  footnote={`${o.price} gold · buy`}
                />
              ))}
          </div>
          <div className="sts-relic-choices">
            {run.shop
              .filter((o) => o.kind !== 'card')
              .map((o) => {
                const item =
                  o.kind === 'relic'
                    ? RELIC_BY_ID[o.definitionId]
                    : POTIONS[o.definitionId as Potion];
                return (
                  <button
                    key={o.id}
                    disabled={
                      run.gold < o.price || (o.kind === 'potion' && run.potions.length >= 3)
                    }
                    onClick={() => dispatch({ type: 'buy', id: o.id })}
                  >
                    <h3>{item.name}</h3>
                    <p>{item.text}</p>
                    <strong>{o.price} gold</strong>
                  </button>
                );
              })}
          </div>
          <h3>Card removal · {removalCost(run)} gold</h3>
          <p>Remove one card per visit. Each purchase raises the price by 25 gold.</p>
          {!run.removalUsed && run.gold >= removalCost(run) ? (
            <DeckList run={run} onPick={(c) => dispatch({ type: 'removeCard', id: c.id })} />
          ) : (
            <p className="muted">
              {run.removalUsed ? 'Removal used this visit.' : 'Not enough gold for removal.'}
            </p>
          )}
          <button className="primary" onClick={() => dispatch({ type: 'leaveShop' })}>
            Leave shop →
          </button>
        </>
      )}
      {run.phase === 'event' && (
        <>
          <span className="scene-symbol">?</span>
          <p className="eyebrow">AN UNEXPECTED ENCOUNTER</p>
          <h2>
            {
              (
                {
                  bigFish: 'Big Fish',
                  cleric: 'The Cleric',
                  shiningLight: 'Shining Light',
                  goldenIdol: 'Golden Idol',
                  goldenShrine: 'Golden Shrine',
                  ancientWriting: 'Ancient Writing',
                  womanInBlue: 'A Woman in Blue',
                  moaiHead: 'The Moai Head',
                } as Record<string, string>
              )[run.event]
            }
          </h2>
          <div className="event-options">
            {run.event === 'bigFish' && (
              <>
                {option(`Banana · heal ${Math.floor(run.maxHp / 3)} HP`, 'banana')}
                {option('Donut · gain 5 Max HP', 'donut')}
                {option('Box · random relic and Regret curse', 'box')}
              </>
            )}
            {run.event === 'cleric' && (
              <>
                {option(
                  `Heal · pay 35 gold, recover ${Math.floor(run.maxHp * 0.25)} HP`,
                  'heal',
                  run.gold < 35,
                )}
                {run.gold >= 50 && (
                  <div>
                    <h3>Purify · pay 50 gold to remove a card</h3>
                    <DeckList run={run} onPick={(c) => event('purify', c.id)} />
                  </div>
                )}
              </>
            )}
            {run.event === 'shiningLight' &&
              option(
                `Enter · lose ${Math.floor(run.maxHp * 0.2)} HP, upgrade 2 random cards`,
                'enter',
                run.hp <= Math.floor(run.maxHp * 0.2),
              )}
            {run.event === 'goldenIdol' && (
              <p>Take Golden Idol (+25% combat gold) and choose the trap’s cost.</p>
            )}
            {run.event === 'goldenIdol' && (
              <>
                {option('Take Injury curse', 'injury')}
                {option(
                  `Lose ${Math.floor(run.maxHp * 0.25)} HP`,
                  'damage',
                  run.hp <= Math.floor(run.maxHp * 0.25),
                )}
                {option(`Lose ${Math.floor(run.maxHp * 0.08)} Max HP`, 'maxHp')}
              </>
            )}
            {run.event === 'goldenShrine' && (
              <>
                {option('Pray · gain 100 gold', 'pray')}
                {option('Desecrate · gain 275 gold and Regret curse', 'desecrate')}
              </>
            )}
            {run.event === 'ancientWriting' && (
              <>
                {option('Elegance · upgrade every Strike and Defend', 'elegance')}
                <h3>Simplicity · remove a card</h3>
                <DeckList run={run} onPick={(c) => event('simplicity', c.id)} />
              </>
            )}
            {run.event === 'womanInBlue' && (
              <>
                {option(
                  'Buy 1 random potion · 20 gold',
                  'one',
                  run.gold < 20 || run.potions.length >= 3 || run.relics.includes('sozu'),
                )}
                {option(
                  'Buy up to 3 random potions · 50 gold',
                  'three',
                  run.gold < 50 || run.potions.length >= 3 || run.relics.includes('sozu'),
                )}
              </>
            )}
            {run.event === 'moaiHead' && (
              <>
                {option(`Jump · lose ${Math.floor(run.maxHp * 0.125)} Max HP, heal fully`, 'jump')}
                {run.relics.includes('goldenIdol') &&
                  option('Offer Golden Idol · gain 333 gold', 'idol')}
              </>
            )}
          </div>
          <button className="secondary" onClick={() => event('leave')}>
            Leave →
          </button>
        </>
      )}
      {(run.phase === 'won' || run.phase === 'lost') && (
        <>
          <p className="eyebrow">
            {run.phase === 'won' ? 'THE SPIRE SLEEPS…' : 'THE SPIRE CLAIMS ANOTHER'}
          </p>
          <h1>{run.phase === 'won' ? 'Victory' : 'Defeat'}</h1>
          <p>
            Ironclad · Act {run.act} · Room {run.row + 1} · {run.deck.length} cards ·{' '}
            {run.relics.length} relics
          </p>
          <p>
            {run.phase === 'won'
              ? 'You defeated Donu and Deca and completed the three-act ascent.'
              : 'Your ascent ends here. Every run is a chance to try another deck.'}
          </p>
          <p>Use New run above to begin again, or Export to keep this replay.</p>
        </>
      )}
    </section>
  );
}
