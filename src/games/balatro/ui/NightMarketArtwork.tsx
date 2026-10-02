import type { ReactNode } from 'react';
import { CoinStack, Etch, MarketMoon, MarketStar, marketInk } from './MarketPrimitives';
const { ink, paper, coral, gold } = marketInk;

export const nightMarketJokerArt: Record<string, ReactNode> = {
  velvetpurse: (
    <>
      <path
        d="M64 34Q32 3 36 41m29-6Q101 5 116 30q8 17-13 31"
        fill="none"
        stroke={gold}
        strokeWidth="3"
      />
      <path d="M52 40q28-9 53 1-5 21 9 36 9 26-30 27-42 0-39-22 13-23 7-42Z" fill={coral} />
      <path d="M58 47q5 25-5 43 7 13 35 11-17-16-10-57Z" fill={ink} opacity=".3" stroke="none" />
      <path d="M52 36q28-9 54 0v9q-27-8-54 0Z" fill={gold} />
      <circle cx="74" cy="33" r="4" fill={gold} />
      <circle cx="85" cy="33" r="4" fill={gold} />
      <path d="M57 50q7 11 6 23m29-24q-3 13 5 25" fill="none" stroke={paper} strokeWidth=".8" />
      <CoinStack x={119} y={91} count={3} />
      <CoinStack x={32} y={96} count={1} />
      <MarketStar x={133} y={47} />
      <Etch d="M70 95h13m-22-5 3 3M37 29q-5-18 14-10" />
    </>
  ),
  filigree: (
    <>
      <path
        d="M79 22C43 3 21 29 33 49q-20 29 8 44 19 10 38-7 22 18 42 5 23-17 6-40 12-33-20-34-16-1-28 5Z"
        fill="none"
        stroke={gold}
        strokeWidth="3"
      />
      <path
        d="M68 30Q41 16 40 37q0 15 17 12-10-16-17 1-11 24 12 31 22 2 15-15-11-14-16-2m40-34q29-16 28 9-2 16-18 9 14-10 21 7 6 22-15 26-21 3-14-15 10-11 15-1"
        fill="none"
        strokeWidth="1.3"
      />
      <path d="m80 24 16 33-16 34-16-34Z" fill={ink} />
      <path d="m80 30 10 27-10 27-10-27Z" fill={paper} />
      <path d="M80 30v54m-10-27h20" stroke={gold} strokeWidth="1" />
      <circle cx="80" cy="17" r="4" fill={coral} />
      <circle cx="80" cy="97" r="4" fill={coral} />
      <Etch d="M25 51l4 3m-5 8h5m9 27 4-4m89-29 5-1m-7 28 4 3M54 14v5m50-5v5" />
    </>
  ),
  nightjar: (
    <>
      <MarketMoon x={116} y={31} r={17} />
      <path d="M22 94q53-18 116-6m-76 1-12 12m67-12 10 9" fill="none" strokeWidth="3" />
      <path d="M42 78Q27 41 51 26q14-9 25 6l11 2-12 9q-5 17 11 31l27 24-46-13Z" fill={ink} />
      <path d="M49 48q32 11 43 36-39 2-50-24Z" fill={coral} />
      <path d="M47 49q-3-15 11-17l8 4-9 10Z" fill={gold} stroke="none" />
      <path
        d="M51 55q4 17 30 26M58 57q4 11 12 15m-21-5 7 9m-5-35 6-1"
        fill="none"
        stroke={paper}
        strokeWidth=".8"
      />
      <path d="M63 83v9m8-7 2 6m-12 1h7m3-1h6" stroke={gold} strokeWidth="1.6" />
      <circle cx="64" cy="36" r="1.6" fill={paper} stroke="none" />
      <MarketStar x={26} y={29} size={3} />
      <MarketStar x={128} y={61} size={4} />
    </>
  ),
  prism: (
    <>
      <path d="M37 25h86v67H37Z" fill={ink} />
      <path d="M42 31h76v54H42Z" fill={paper} />
      <path d="m37 25 11-10h67l8 10M47 92v9m66-9v9" fill="none" strokeWidth="3" />
      <path d="M44 80 66 41l17 39Z" fill={coral} />
      <path d="m78 76 14-41 21 41Z" fill={gold} />
      <path d="m57 82 22-56 22 56Z" fill={paper} />
      <path d="m79 26 1 56h21Z" fill={gold} />
      <path
        d="M79 26 68 67l12 15m-12-15 33 15M42 56l20 2m32-2 24-10"
        fill="none"
        strokeWidth=".85"
      />
      <Etch d="M48 20h57M32 100h24m49 0h20M48 35h14m-14 3h8" />
      <MarketStar x={24} y={55} />
      <MarketStar x={134} y={31} size={4} />
    </>
  ),
  gildedloom: (
    <>
      <path d="m38 99 5-80h8l-3 80m64 0-3-80h8l4 80" fill={gold} />
      <path d="M44 26h70M43 38h71M42 88h74" strokeWidth="4" />
      <path
        d="M53 28v59m8-59v59m8-59v59m8-59v59m8-59v59m8-59v59m8-59v59m8-59v59"
        stroke={gold}
        strokeWidth="1"
      />
      <path d="M52 51h56v36q-24 8-56 0Z" fill={coral} />
      <path
        d="m53 62 14-9 13 12 14-12 14 10-14 12-14-10-13 12-14-9"
        fill={paper}
        strokeWidth=".75"
      />
      <path d="m52 89 4 9m3-8 4 9m3-8 4 9m3-8 4 9m3-8 4 9m3-8 4 9m3-8 4 9m3-8 4 9" stroke={gold} />
      <g transform="translate(17 17) scale(.8 .75)">
        <path d="m24 74 14-16 82-15 18 7-14 12-79 15Z" fill={ink} />
        <path d="m43 65 72-14-5 6-58 12Z" fill={paper} stroke="none" />
      </g>
      <Etch d="M30 104h28m47 0h25M48 22h62" />
    </>
  ),
  emptypockets: (
    <>
      <path d="M37 24q43-15 86 0l-2 30-15 40-25-9-24 9-18-38Z" fill={ink} />
      <path
        d="M46 35q15 14 9 46-25-8-26-26 0-12 17-20Zm69 0q-17 15-10 46 25-8 26-26 0-12-16-20Z"
        fill={paper}
      />
      <path d="M47 40q-8 14 5 35m61-35q8 14-5 35" fill="none" stroke={gold} strokeWidth="1.2" />
      <path d="M80 28v54m-38-54q34-10 75 0" fill="none" stroke={paper} strokeWidth=".9" />
      <path d="m75 22 10-1v10H75Z" fill={gold} />
      <path
        d="M77 67q-15-23-19-8-1 12 19 8 21-11 24 0-3 15-24 0Z"
        fill={coral}
        stroke={paper}
        strokeWidth=".7"
      />
      <path d="m77 63 1 9m-2-8-3-5m5 5 3-6" fill="none" stroke={gold} />
      <Etch d="M30 92l8-3m90 3-7-3M71 101h22" />
    </>
  ),
  moonledger: (
    <>
      <MarketMoon x={122} y={28} r={13} />
      <path d="m30 38 46-11 46 9-6 64-38-7-46 10Z" fill={ink} />
      <path d="m35 33 41-11 41 9-5 61-35-8-40 10Z" fill={paper} />
      <path
        d="m76 22 1 62m-33-44 24-7m-24 14 24-6m-23 15 21-5m17-20 22 5m-23 3 20 5m-20 3 18 5"
        fill="none"
        strokeWidth="1"
      />
      <path d="M78 26v58l11 13-3-60Z" fill={coral} stroke="none" />
      <CoinStack x={123} y={92} count={4} />
      <CoinStack x={49} y={98} count={2} />
      <path d="m100 71 30-37q3 13-17 24l-11 16Z" fill={gold} />
      <Etch d="m103 69 21-26M19 33l5 1m-2-6 3 3" />
    </>
  ),
  receiptribbon: (
    <>
      <path
        d="M40 20q30-12 64 0l-9 26 6 23q5 19-10 30l-12-5-12 6-9-5-11 4q18-19 5-39Z"
        fill={paper}
      />
      <path d="M40 20q-17 9-11 21l20 1m55-22q13 1 13 14l-17 5Z" fill={gold} />
      <path
        d="M54 31h33m-31 7h29m-25 7h21m-17 9h18m-16 7h18m-17 7h19m-20 7h18m-21 8h18"
        strokeWidth=".8"
      />
      <path d="M39 61q26 4 48-4 19-7 34-1l-8 12 12 9q-23-15-43-3-31 15-46 1Z" fill={coral} />
      <path d="M41 67q20 6 41-3m15-2 16-1" stroke={paper} strokeWidth=".8" fill="none" />
      <CoinStack x={127} y={94} count={2} />
      <MarketStar x={23} y={78} />
      <Etch d="M46 25h48M32 35h11M58 90l3-3m17 2 4 2" />
    </>
  ),
};
