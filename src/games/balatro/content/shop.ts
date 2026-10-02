export const PACKS = [
  { id: 'buffoon', name: 'Buffoon Pack', kind: 'joker', size: 2, picks: 1, price: 4 },
  { id: 'megaBuffoon', name: 'Mega Buffoon Pack', kind: 'joker', size: 4, picks: 2, price: 8 },
  { id: 'celestial', name: 'Celestial Pack', kind: 'planet', size: 3, picks: 1, price: 4 },
  { id: 'megaCelestial', name: 'Mega Celestial Pack', kind: 'planet', size: 5, picks: 2, price: 8 },
  { id: 'standard', name: 'Standard Pack', kind: 'card', size: 3, picks: 1, price: 4 },
  { id: 'megaStandard', name: 'Mega Standard Pack', kind: 'card', size: 5, picks: 2, price: 8 },
] as const;
export const VOUCHERS = [
  { id: 'extraHand', name: 'Spare Hand', text: '+1 hand every blind.', price: 10 },
  { id: 'extraDiscard', name: 'Second Chance', text: '+1 discard every blind.', price: 10 },
  { id: 'handSize', name: 'Broad Palm', text: '+1 hand size.', price: 10 },
  { id: 'interest', name: 'Seed Money', text: 'Raise the interest cap from $5 to $10.', price: 10 },
  { id: 'rerolls', name: 'Reroll Surplus', text: 'Shop rerolls start $2 cheaper.', price: 10 },
  {
    id: 'discount',
    name: 'Clearance',
    text: 'Cards and booster packs cost 25% less, rounded down.',
    price: 10,
  },
] as const;
export const PACK_BY_ID = Object.fromEntries(PACKS.map((p) => [p.id, p]));
export const VOUCHER_BY_ID = Object.fromEntries(VOUCHERS.map((v) => [v.id, v]));
export const TAGS = {
  investment: { name: 'Investment Tag', text: 'After the next boss is defeated, earn $25.' },
  economy: { name: 'Economy Tag', text: 'Immediately double your money, adding at most $40.' },
  orbital: { name: 'Orbital Tag', text: 'Immediately upgrade the shown hand by 3 levels.' },
  buffoon: { name: 'Buffoon Tag', text: 'Immediately open a free Mega Buffoon Pack.' },
};
