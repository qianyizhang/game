import type { ReactNode } from 'react';
import { ArtScene } from '../../../shared/art/CardArt';
import { CoinStack, Etch, MarketMoon, MarketStar, Ticket, marketInk } from './MarketPrimitives';
import './ShopArt.css';
const { ink, paper, coral, gold } = marketInk;

function Seal({ kind }: { kind: 'joker' | 'planet' | 'card' }) {
  if (kind === 'planet')
    return (
      <>
        <circle cx="80" cy="57" r="15" fill={gold} />
        <ellipse
          cx="80"
          cy="57"
          rx="25"
          ry="7"
          transform="rotate(-25 80 57)"
          fill="none"
          stroke={paper}
          strokeWidth="2"
        />
        <path d="M76 43q-11 13 2 26" fill="none" stroke={paper} strokeWidth=".75" />
      </>
    );
  if (kind === 'card')
    return (
      <g transform="rotate(14 80 57)">
        <rect x="65" y="34" width="30" height="44" rx="3" fill={paper} />
        <path d="m80 43 8 13-8 13-8-13Z" fill={coral} />
        <Etch d="M69 39h3m16 34h3" />
      </g>
    );
  return (
    <>
      <path d="M59 49q1-17 13-14 0-12 8-13 9 1 8 13 13-3 13 14Z" fill={gold} />
      <path d="M57 51q9-8 23 0 14-8 23 0l-5 15-12 2-6 10-6-10-12-2Z" fill={paper} />
      <path d="M63 54q8-4 14 3-11 6-14-3Zm20 3q7-7 14-3-4 9-14 3Z" fill={ink} stroke="none" />
      <path
        d="M80 54v13m-6-28 6-11 6 11m-23 9 8-4m19 0 7 4M62 65 49 74l6 4-5 7m48-20 13 9-6 4 5 7"
        fill="none"
        stroke={coral}
        strokeWidth=".85"
      />
      <circle cx="80" cy="21" r="2.5" fill={coral} />
    </>
  );
}
function Packet({ kind, mega = false }: { kind: 'joker' | 'planet' | 'card'; mega?: boolean }) {
  return (
    <>
      {mega && (
        <>
          <path d="m33 40-12-17 42-9 17 14 23-15 36 14-14 17Z" fill={gold} />
          <path d="m21 23 43 7 16-2 23 1 36-2-14 17H33Z" fill={paper} />
          <MarketStar x={23} y={62} />
          <MarketStar x={135} y={75} />
        </>
      )}
      <path
        d={mega ? 'M33 36h92l-5 65H38Z' : 'M45 16h70l-5 11 5 69H45l5-69Z'}
        fill={kind === 'joker' ? coral : ink}
      />
      <path
        d={mega ? 'M40 42h78l-4 51H44Z' : 'M51 28h58v55H51Z'}
        fill="none"
        stroke={gold}
        strokeWidth="1"
      />
      <Seal kind={kind} />
      <path
        d={mega ? 'M39 99h81M42 89h75' : 'M48 21h64M48 90h64'}
        stroke={paper}
        strokeWidth=".7"
      />
      {mega ? (
        <>
          <path d="m67 86 13-5 13 5-13 7Z" fill={gold} />
          <MarketStar x={28} y={91} size={3} />
          <MarketStar x={131} y={49} size={3} />
        </>
      ) : (
        <>
          <Etch d="M51 18v5m7-5v5m7-5v5m7-5v5m7-5v5m7-5v5m7-5v5m7-5v5m7-5v5" />
          <MarketStar x={29} y={41} />
          <MarketStar x={129} y={82} />
        </>
      )}
    </>
  );
}
const packScenes: Record<string, ReactNode> = {
  buffoon: <Packet kind="joker" />,
  megaBuffoon: <Packet kind="joker" mega />,
  celestial: <Packet kind="planet" />,
  megaCelestial: <Packet kind="planet" mega />,
  standard: <Packet kind="card" />,
  megaStandard: <Packet kind="card" mega />,
};
const voucherScenes: Record<string, ReactNode> = {
  extraHand: (
    <>
      <Ticket x={30} y={25} angle={-18} />
      <path
        d="M64 103 55 81l-8-13q-4-10 3-10l15 14-5-39q-1-8 5-7l8 34-2-39q1-8 7-4l4 39 5-35q4-8 8-1l-3 39 9-24q6-6 8 0l-6 35q-1 20-16 29Z"
        fill={gold}
      />
      <path d="M63 75q16-12 29-1m-19-13 7 16m4-20 3 13m7-10-3 12" fill="none" strokeWidth=".8" />
      <MarketStar x={123} y={49} />
    </>
  ),
  extraDiscard: (
    <>
      <Ticket x={38} y={29} angle={12} />
      <path
        d="M33 72Q12 28 59 17q39-10 65 23m0-17v17h-19M124 66q17 27-22 35-39 7-65-13m1 16-1-16 18-1"
        fill="none"
        stroke={coral}
        strokeWidth="3"
      />
      <MarketStar x={26} y={89} size={3} />
      <Etch d="M40 29q8-7 20-8m66 65-6 6" />
    </>
  ),
  handSize: (
    <>
      {[
        [-25, 37],
        [0, 51],
        [25, 65],
      ].map(([angle, x]) => (
        <Ticket key={x} x={x - 14} y={28} angle={angle} />
      ))}
      <path d="M30 96q49-9 100 0M25 87l5 9-6 6m112-15-6 9 6 6" fill="none" stroke={coral} />
      <MarketStar x={26} y={28} />
      <MarketStar x={136} y={34} />
    </>
  ),
  interest: (
    <>
      <CoinStack x={58} y={91} count={3} />
      <CoinStack x={100} y={96} count={5} />
      <path
        d="M78 72V30m0 17Q47 44 43 22q30-1 35 25Zm0-5q11-30 36-27-2 26-36 27Z"
        fill={ink}
        strokeWidth="2"
      />
      <path d="M78 45 51 27m28 14 26-20" stroke={paper} strokeWidth=".7" />
      <MarketStar x={127} y={55} />
      <Etch d="M27 101h107M76 20v-7" />
    </>
  ),
  rerolls: (
    <>
      <path
        d="M33 38q30-30 66-13m-6-11 6 11-14 3M126 72q-29 31-66 15m5 12-5-12 14-3"
        fill="none"
        stroke={coral}
        strokeWidth="2"
      />
      <g transform="rotate(-16 62 59)">
        <rect x="31" y="36" width="49" height="49" rx="9" fill={paper} />
        <rect x="37" y="42" width="37" height="37" rx="5" fill="none" stroke={gold} />
        {[
          [45, 50],
          [66, 50],
          [56, 60],
          [45, 71],
          [66, 71],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.8" fill={ink} stroke="none" />
        ))}
      </g>
      <CoinStack x={110} y={74} count={3} />
      <MarketStar x={130} y={32} />
    </>
  ),
  discount: (
    <>
      <Ticket x={43} y={25} angle={-15} />
      <path d="M41 84 118 23M62 99l28-58" stroke={ink} strokeWidth="3" />
      <ellipse
        cx="39"
        cy="88"
        rx="13"
        ry="9"
        transform="rotate(-20 39 88)"
        fill="none"
        stroke={coral}
        strokeWidth="4"
      />
      <ellipse
        cx="59"
        cy="99"
        rx="12"
        ry="8"
        transform="rotate(-10 59 99)"
        fill="none"
        stroke={coral}
        strokeWidth="4"
      />
      <circle cx="70" cy="62" r="3" fill={gold} />
      <MarketStar x={126} y={88} />
    </>
  ),
};
const tagScenes: Record<string, ReactNode> = {
  investment: (
    <>
      <TagPaper />
      <g transform="translate(8 0)">
        <CoinStack x={72} y={78} count={4} />
        <path d="M43 46q31-25 59 0m-1-13 1 13-12-1" fill="none" stroke={coral} />
      </g>
    </>
  ),
  economy: (
    <>
      <TagPaper />
      <CoinStack x={65} y={78} count={3} />
      <CoinStack x={101} y={77} count={5} />
      <path d="M61 42h9m-5-4v8" stroke={coral} />
    </>
  ),
  orbital: (
    <>
      <TagPaper />
      <g transform="translate(5 0)">
        <Seal kind="planet" />
      </g>
      <MarketStar x={62} y={79} size={3} />
      <MarketStar x={80} y={83} size={3} />
      <MarketStar x={99} y={81} size={3} />
    </>
  ),
  buffoon: (
    <>
      <TagPaper />
      <g transform="translate(5 3) scale(1 .95)">
        <Seal kind="joker" />
      </g>
      <Etch d="M61 86h46" />
    </>
  ),
};
function TagPaper() {
  return (
    <>
      <path d="M57 32Q9 45 26 16q13-17 38 5" fill="none" stroke={gold} strokeWidth="2" />
      <path d="m44 39 20-24 66 22-17 62-69-19Z" fill={paper} />
      <path d="m53 40 14-16 52 19-12 46-54-15Z" fill="none" stroke={gold} strokeWidth=".8" />
      <circle cx="58" cy="37" r="3" fill={ink} />
      <path d="M58 37 40 19" fill="none" stroke={gold} strokeWidth="2" />
    </>
  );
}

export function ShopArt({ kind, id }: { kind: 'pack' | 'voucher' | 'tag'; id: string }) {
  const scene = (kind === 'pack' ? packScenes : kind === 'voucher' ? voucherScenes : tagScenes)[id];
  return (
    <ArtScene className={`shop-art shop-art-${kind}`} palette="moss">
      <rect x="5" y="5" width="150" height="102" rx="4" fill={paper} />
      <path d="M12 22V12h16m104 0h16v10M12 90v10h16m104 0h16V90" stroke={gold} strokeWidth=".7" />
      <g stroke={ink} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        {scene ?? <MarketMoon x={80} y={56} r={25} />}
      </g>
    </ArtScene>
  );
}
