import { PACK_BY_ID, VOUCHER_BY_ID, TAGS } from '../content/shop';
import { JOKER_BY_ID } from '../content/jokers';
import { CONSUMABLE_BY_ID } from '../content/consumables';
import { HANDS } from '../domain/poker';
import type { Command, RunState } from '../domain/types';
import { PlayingCard } from './Card';
import { ShopArt } from './ShopArt';
import { JokerArt, ConsumableArt } from './Artwork';
type Props = { run: RunState; dispatch: (command: Command) => boolean };
export function SkipBlind({ run, dispatch }: Props) {
  if (run.blind === 2) return null;
  const tag = run.skipTags[run.blind],
    definition = TAGS[tag.id];
  return (
    <div className="skip-offer">
      <ShopArt kind="tag" id={tag.id} />
      <strong>
        {definition.name}
        {tag.id === 'orbital' ? ` · ${HANDS[tag.hand].name}` : ''}
      </strong>
      <p>{definition.text}</p>
      <button onClick={() => dispatch({ type: 'skipBlind' })}>Skip blind for this tag</button>
      <small>No blind payout, interest, or shop.</small>
    </div>
  );
}
export function ShopExtras({ run, dispatch }: Props) {
  return (
    <>
      <h3>Packs & permanent upgrades</h3>
      <div className="extras-grid">
        {run.voucherOffer && (
          <article>
            <ShopArt kind="voucher" id={run.voucherOffer} />
            <span className="eyebrow">ONE OFFER PER ANTE</span>
            <h3>{VOUCHER_BY_ID[run.voucherOffer].name}</h3>
            <p>{VOUCHER_BY_ID[run.voucherOffer].text}</p>
            <button disabled={run.cash < 10} onClick={() => dispatch({ type: 'buyVoucher' })}>
              Buy voucher · $10
            </button>
          </article>
        )}
        {run.packs.map((offer) => {
          const pack = PACK_BY_ID[offer.definitionId];
          return (
            <article key={offer.id}>
              <ShopArt kind="pack" id={pack.id} />
              <span className="eyebrow">OPEN & CHOOSE</span>
              <h3>{pack.name}</h3>
              <p>
                Choose {pack.picks} of {pack.size}.{' '}
                {pack.kind === 'planet'
                  ? 'Planets apply immediately.'
                  : pack.kind === 'card'
                    ? 'Cards join your deck.'
                    : 'Jokers need a free slot.'}
              </p>
              <button
                disabled={run.cash < offer.price}
                onClick={() => dispatch({ type: 'buyPack', id: offer.id })}
              >
                Open pack · ${offer.price}
              </button>
            </article>
          );
        })}
      </div>
    </>
  );
}
export function PackChoice({ run, dispatch }: Props) {
  const pack = run.pack!;
  return (
    <section className="pack-choice">
      <p className="eyebrow">{pack.remaining} CHOICES REMAINING</p>
      <h2>{PACK_BY_ID[pack.definitionId].name}</h2>
      <p>Choose now. Leaving discards every unchosen option.</p>
      <div className="extras-grid">
        {pack.choices.map((choice) => (
          <article key={choice.id}>
            {choice.kind === 'card' ? (
              <>
                <PlayingCard card={choice.card} />
                <p>{choice.card.enhancement}</p>
              </>
            ) : choice.kind === 'joker' ? (
              <>
                <JokerArt id={choice.definitionId} />
                <h3>{JOKER_BY_ID[choice.definitionId].name}</h3>
                <p>{JOKER_BY_ID[choice.definitionId].description}</p>
              </>
            ) : (
              <>
                <ConsumableArt id={choice.definitionId} />
                <h3>{CONSUMABLE_BY_ID[choice.definitionId].name}</h3>
                <p>{CONSUMABLE_BY_ID[choice.definitionId].description}</p>
              </>
            )}
            <button
              disabled={choice.kind === 'joker' && run.jokers.length >= 5}
              onClick={() => dispatch({ type: 'choosePack', id: choice.id })}
            >
              {choice.kind === 'planet' ? 'Use planet' : 'Take card'}
            </button>
          </article>
        ))}
      </div>
      <button onClick={() => dispatch({ type: 'skipPack' })}>Skip remaining choices</button>
    </section>
  );
}
export function OwnedVouchers({ run }: Pick<Props, 'run'>) {
  if (!run.vouchers.length && !run.tags.length) return null;
  return (
    <div className="voucher-rack">
      {run.vouchers.map((id) => (
        <span key={id} title={VOUCHER_BY_ID[id].text}>
          <ShopArt kind="voucher" id={id} />
          {VOUCHER_BY_ID[id].name}
        </span>
      ))}
      {run.tags.map((_, i) => (
        <span key={`tag-${i}`}>
          <ShopArt kind="tag" id="investment" />
          Next boss: +$25
        </span>
      ))}
    </div>
  );
}
