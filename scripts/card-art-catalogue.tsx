import { TAVERN_SPELLS } from '../src/games/battlegrounds/content/spells';
import { TavernSpellArt } from '../src/games/battlegrounds/ui/TavernSpellArt';
import { RELICS, POTIONS, ACT_NAMES } from '../src/games/spire/content/world';
import { RelicArt, PotionArt } from '../src/games/spire/ui/WorldItemArt';
import { CharacterArt } from '../src/games/spire/ui/CharacterArt';
import { ActArt, NodeArt, ROOM_KINDS } from '../src/games/spire/ui/SpireSceneArt';
import {
  WorkshopArt,
  WorkshopSymbol,
  WORKSHOP_SCENES,
  WORKSHOP_SYMBOLS,
} from '../src/shared/art/WorkshopArt';
import { ArtGlyph, ArtScene, type ArtGlyphKind } from '../src/shared/art/CardArt';
import {
  JokerArt,
  ConsumableArt,
  BossArt,
  PokerArt,
  SuitPip,
} from '../src/games/balatro/ui/Artwork';
import { AbilityArt } from '../src/games/spire/ui/AbilityArt';
import { MinionArt } from '../src/games/battlegrounds/ui/MinionArt';
import { ShopArt } from '../src/games/balatro/ui/ShopArt';
import { PACKS, VOUCHERS, TAGS } from '../src/games/balatro/content/shop';
import { JOKERS } from '../src/games/balatro/content/jokers';
import { CONSUMABLES } from '../src/games/balatro/content/consumables';
import { BOSSES } from '../src/games/balatro/content/blinds';
import { SUITS, type Suit } from '../src/games/balatro/domain/types';
import { CARDS } from '../src/games/spire/content/cards';
import { HEROES, MINIONS } from '../src/games/battlegrounds/content/minions';
import { HeroArt, HeroPowerArt } from '../src/games/battlegrounds/ui/HeroArt';
import type { ReactNode } from 'react';
import {
  ChallengeArt,
  ChallengeSymbol,
  CHALLENGE_PLATES,
  CHALLENGE_SYMBOLS,
} from '../src/shared/art/ChallengeArt';

type Asset = { id: string; group: string; name: string; node: ReactNode };

function PlayingCardAsset({ rank, suit }: { rank: number; suit: Suit }) {
  const label =
    ({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A' } as Record<number, string>)[rank] ?? String(rank);
  return (
    <svg
      viewBox="0 0 100 140"
      color={suit === 'hearts' || suit === 'diamonds' ? '#b64d3c' : '#253a31'}
    >
      <rect x="1" y="1" width="98" height="138" rx="8" fill="#f5efdb" stroke="#d3c39b" />
      <svg x="14" y="22" width="72" height="96" viewBox="0 0 72 96">
        <PokerArt rank={rank} suit={suit} />
      </svg>
      {[false, true].map((flipped) => (
        <g key={String(flipped)} transform={flipped ? 'rotate(180 50 70)' : undefined}>
          <text x="8" y="20" fontFamily="Georgia, serif" fontSize="17" fill="currentColor">
            {label}
          </text>
          <SuitPip suit={suit} x={7} y={24} size={11} />
        </g>
      ))}
    </svg>
  );
}

/** Export the same components the games render; never maintain a second asset implementation. */
export function cardArtCatalogue(): Asset[] {
  const glyphs: ArtGlyphKind[] = [
    'sword',
    'shield',
    'flame',
    'leaf',
    'bolt',
    'heart',
    'diamond',
    'club',
    'spade',
    'star',
    'moon',
    'sun',
    'skull',
    'eye',
    'coin',
    'gem',
    'crown',
    'book',
    'flask',
    'feather',
    'gear',
    'anchor',
    'wing',
    'claw',
    'fang',
    'mountain',
    'wave',
    'key',
    'hourglass',
    'spark',
    'seed',
  ];
  return [
    ...WORKSHOP_SCENES.map((kind) => ({
      id: `workshop/${kind}`,
      group: 'Workshop · Tools',
      name: kind,
      node: <WorkshopArt kind={kind} />,
    })),
    ...WORKSHOP_SYMBOLS.map((kind) => ({
      id: `workshop/symbols/${kind}`,
      group: 'Workshop · Symbols',
      name: kind,
      node: <WorkshopSymbol kind={kind} />,
    })),
    ...RELICS.map((relic) => ({
      id: `spire/relics/${relic.id}`,
      group: 'Slay the Spire · Relics',
      name: relic.name,
      node: <RelicArt id={relic.id} />,
    })),
    ...Object.entries(POTIONS).map(([id, potion]) => ({
      id: `spire/potions/${id}`,
      group: 'Slay the Spire · Potions',
      name: potion.name,
      node: <PotionArt id={id} />,
    })),
    ...(['ironclad', 'silent'] as const).map((id) => ({
      id: `spire/characters/${id}`,
      group: 'Slay the Spire · Characters',
      name: id,
      node: <CharacterArt id={id} />,
    })),
    ...ROOM_KINDS.map((kind) => ({
      id: `spire/rooms/${kind}`,
      group: 'Slay the Spire · Rooms',
      name: kind,
      node: <NodeArt kind={kind} />,
    })),
    ...ACT_NAMES.map((name, index) => ({
      id: `spire/acts/${index + 1}`,
      group: 'Slay the Spire · Acts',
      name,
      node: <ActArt act={index + 1} />,
    })),
    ...TAVERN_SPELLS.map((spell) => ({
      id: `hearth/spells/${spell.id}`,
      group: 'Last Hearth · Tavern spells',
      name: spell.name,
      node: <TavernSpellArt id={spell.id} />,
    })),
    ...HEROES.flatMap((hero) => [
      {
        id: `hearth/heroes/${hero.id}`,
        group: 'Last Hearth · Heroes',
        name: hero.name,
        node: <HeroArt id={hero.id} />,
      },
      {
        id: `hearth/powers/${hero.id}`,
        group: 'Last Hearth · Hero powers',
        name: `${hero.name} · Power`,
        node: <HeroPowerArt id={hero.id} />,
      },
    ]),
    ...CHALLENGE_PLATES.map(([id, name]) => ({
      id: `challenges/${id}`,
      group: 'Challenges · Plates',
      name,
      node: <ChallengeArt id={id} />,
    })),
    ...CHALLENGE_SYMBOLS.map((kind) => ({
      id: `challenges/symbols/${kind}`,
      group: 'Challenges · Symbols',
      name: kind === 'stone' ? 'Oddly Smooth Stone' : kind,
      node: <ChallengeSymbol kind={kind} />,
    })),
    ...JOKERS.map((card) => ({
      id: `blindside/jokers/${card.id}`,
      group: 'Blindside · Jokers',
      name: card.name,
      node: <JokerArt id={card.id} />,
    })),
    ...PACKS.map((pack) => ({
      id: `blindside/packs/${pack.id}`,
      group: 'Blindside · Packs',
      name: pack.name,
      node: <ShopArt kind="pack" id={pack.id} />,
    })),
    ...VOUCHERS.map((voucher) => ({
      id: `blindside/vouchers/${voucher.id}`,
      group: 'Blindside · Vouchers',
      name: voucher.name,
      node: <ShopArt kind="voucher" id={voucher.id} />,
    })),
    ...Object.entries(TAGS).map(([id, tag]) => ({
      id: `blindside/tags/${id}`,
      group: 'Blindside · Tags',
      name: tag.name,
      node: <ShopArt kind="tag" id={id} />,
    })),
    ...CONSUMABLES.map((card) => ({
      id: `blindside/consumables/${card.id}`,
      group: 'Blindside · Consumables',
      name: card.name,
      node: <ConsumableArt id={card.id} />,
    })),
    ...BOSSES.map((card) => ({
      id: `blindside/bosses/${card.id}`,
      group: 'Blindside · Bosses',
      name: card.name,
      node: <BossArt id={card.id} />,
    })),
    ...SUITS.flatMap((suit) =>
      Array.from({ length: 13 }, (_, index) => {
        const rank = index + 2;
        return {
          id: `blindside/playing/${suit}-${rank}`,
          group: 'Blindside · Playing cards',
          name: `${({ 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace' } as Record<number, string>)[rank] ?? rank} of ${suit}`,
          node: <PlayingCardAsset rank={rank} suit={suit} />,
        };
      }),
    ),
    ...CARDS.flatMap((card) =>
      (card.token ? [false] : [false, true]).map((upgraded) => ({
        id: `spire/${card.id}${upgraded ? '-upgraded' : ''}`,
        group: upgraded ? 'Slay the Spire · Upgrades' : 'Slay the Spire · Cards',
        name: `${card.name}${upgraded ? '+' : ''}`,
        node: <AbilityArt definition={card} upgraded={upgraded} />,
      })),
    ),
    ...MINIONS.flatMap((card) =>
      [false, true].map((golden) => ({
        id: `hearth/${card.id}${golden ? '-golden' : ''}`,
        group: golden ? 'Last Hearth · Golden' : 'Last Hearth · Minions',
        name: `${card.name}${golden ? ' · Golden' : ''}`,
        node: <MinionArt definitionId={card.id} tribe={card.tribe} golden={golden} />,
      })),
    ),
    ...glyphs.map((kind) => ({
      id: `primitives/${kind}`,
      group: 'Shared · Primitives',
      name: kind,
      node: (
        <ArtScene palette="gold">
          <ArtGlyph kind={kind} />
        </ArtScene>
      ),
    })),
  ];
}
