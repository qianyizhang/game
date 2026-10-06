import { SPELL_BY_ID } from '../content/spells';
import { handSize, recruitPrice } from '../domain/spells';
import type { BGCommand, Player, Unit } from '../domain/types';
import { SpellCard } from './SpellCard';
import { MINION_BY_ID } from '../content/minions';
export function TavernSpells({
  player,
  target,
  pending,
  dispatch,
}: {
  player: Player;
  target?: Unit;
  pending: boolean;
  dispatch: (command: BGCommand) => unknown;
}) {
  if (!player.tavern) return null;
  const { offer, hand, nextGold, discount } = player.tavern;
  return (
    <section className="tavern-spells" aria-label="Tavern spells">
      <div className="inventory-header">
        <span className="eyebrow">TAVERN SPELLS</span>
        <span>Buy now · cast or hold</span>
      </div>
      <p className="muted small">
        One offer per refresh. Freeze keeps it. Spells share your ten hand slots; casting costs no
        gold.
      </p>
      <div className="spell-status" aria-live="polite">
        {nextGold > 0 && <span>Next recruitment: +{nextGold} gold</span>}
        {discount > 0 && <span>Next minion: {recruitPrice(player)} gold · expires this round</span>}
        <span>Hand: {handSize(player)}/10</span>
      </div>
      <div className="spell-zones">
        <div>
          <h4>On offer</h4>
          {offer ? (
            <SpellCard
              spell={offer}
              mode="buy"
              disabled={
                pending ||
                player.gold < SPELL_BY_ID[offer.definitionId].cost ||
                handSize(player) >= 10
              }
              onClick={() => dispatch({ type: 'buySpell', id: offer.id })}
            />
          ) : (
            <p className="small muted">
              Purchased. Refresh or return next round for another offer.
            </p>
          )}
        </div>
        <div>
          <h4>Spell hand · {hand.length}</h4>
          <div className="spell-hand">
            {hand.map((spell) => {
              const effect = SPELL_BY_ID[spell.definitionId].effect;
              const unavailable =
                effect.type === 'buff'
                  ? effect.zone === 'friendly'
                    ? !target
                    : !player[effect.zone].length
                  : effect.type === 'discount' && discount > 0;
              return (
                <SpellCard
                  key={spell.id}
                  spell={spell}
                  mode="cast"
                  disabled={pending || !!unavailable}
                  onClick={() =>
                    dispatch({
                      type: 'castSpell',
                      id: spell.id,
                      ...(effect.type === 'buff' && effect.zone === 'friendly'
                        ? { target: target?.id }
                        : {}),
                    })
                  }
                />
              );
            })}
            {!hand.length && (
              <p className="small muted">Purchased spells stay here across rounds until cast.</p>
            )}
          </div>
        </div>
      </div>
      {target && (
        <p className="small muted">
          Friendly spell target: {MINION_BY_ID[target.definitionId].name}. Select another minion in
          your warband below.
        </p>
      )}
    </section>
  );
}
