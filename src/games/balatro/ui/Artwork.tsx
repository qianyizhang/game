import type { ReactNode } from 'react';
import { ArtGlyph, ArtScene } from '../../../shared/art/CardArt';
import type { Suit } from '../domain/types';
import './artwork.css';

const ink = '#28493d';
const paper = '#f6e8c7';
const coral = '#bd5947';
const gold = '#c69b57';

function PrintGround() {
  return (
    <g>
      <path d="M10 10H150V102H10Z" fill={paper} />
      <g fill="none" stroke={gold} strokeWidth=".7" opacity=".6">
        <path d="M16 32V16H36M124 16h20v16M16 80v16h20m88 0h20V80" />
        <path d="M21 20h10m-10 4h6m104-4h8m-5 4h5M21 88h6m-6 4h10m100-4h8m-5 4h5" />
      </g>
    </g>
  );
}

/** The same cut-paper suit silhouette is used by the deck and its illustrated tools. */
export function SuitPip({
  suit,
  x = 0,
  y = 0,
  size = 16,
}: {
  suit: Suit;
  x?: number;
  y?: number;
  size?: number;
}) {
  const paths: Record<Suit, string> = {
    hearts: 'M10 18C7 15 1 11 1 6C1 0 8-1 10 4C12-1 19 0 19 6C19 11 13 15 10 18Z',
    diamonds: 'M10 0 19 10 10 20 1 10Z',
    spades: 'M10 0C8 3 1 7 1 12C1 18 7 18 9 14L7 20H13L11 14C13 18 19 18 19 12C19 7 12 3 10 0Z',
    clubs: 'M10 1A4 4 0 0 1 14 7A5 5 0 1 1 12 15L14 20H6L8 15A5 5 0 1 1 6 7A4 4 0 0 1 10 1Z',
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 20})`}>
      <path d={paths[suit]} fill="currentColor" stroke="none" />
    </g>
  );
}

function MiniCard({
  x,
  y,
  suit = 'spades',
  angle = 0,
  value,
}: {
  x: number;
  y: number;
  suit?: Suit;
  angle?: number;
  value?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle} 13 18)`}>
      <rect width="26" height="36" rx="3" fill={paper} />
      <path d="M4 6H9M17 30H22" opacity=".45" />
      <g color={suit === 'hearts' || suit === 'diamonds' ? coral : ink}>
        <SuitPip suit={suit} x={7} y={11} size={12} />
      </g>
      {value && (
        <text x="4" y="10" fill={ink} stroke="none" fontSize="8" fontFamily="Georgia, serif">
          {value}
        </text>
      )}
    </g>
  );
}

function Coin({ x, y, size = 12 }: { x: number; y: number; size?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={size} fill={gold} />
      <circle cx={x} cy={y} r={size - 3} fill="none" strokeWidth="1" />
      <path d={`M${x - 2} ${y - 5}h4m-2 0v10m-2 0h4`} />
    </g>
  );
}

function Portrait({ x = 52, y = 20 }: { x?: number; y?: number }) {
  return (
    <g transform={`translate(${x} ${y})`} strokeWidth="1.1">
      <path
        d="M9 70C12 60 18 57 21 54L22 43C11 37 9 28 13 17C17 5 33 2 41 13L42 22L48 30L42 32L43 36L40 40C38 43 34 44 31 43L31 53C34 58 44 59 49 70Z"
        fill={paper}
      />
      <path
        d="M12 27C7 16 13 6 25 4C37 1 43 9 43 19C38 16 33 14 29 14C28 23 24 26 19 27L20 39C15 37 12 34 12 27Z"
        fill={ink}
        stroke="none"
      />
      <path
        d="M15 14C23 5 34 6 39 13M13 20C20 12 26 12 30 13M13 26L22 18M16 31L23 24"
        fill="none"
        stroke={gold}
        strokeWidth=".8"
      />
      <path d="M34 25L39 24M38 36H42M28 39L31 43M21 54L31 53" fill="none" />
      <path d="M9 70L20 55L27 64L33 56L49 70Z" fill={coral} stroke="none" />
      <path
        d="M18 66L23 61M23 70L27 65M32 65L38 70M38 63L44 68"
        fill="none"
        stroke={paper}
        strokeWidth=".9"
      />
    </g>
  );
}

function Waves({ y = 72, rise = 0 }: { y?: number; rise?: number }) {
  return (
    <g fill="none">
      {[0, 9, 18].map((offset) => (
        <path key={offset} d={`M30 ${y + offset}q12 -10 24 0t24 0t24 0t24 0`} />
      ))}
      {rise > 0 && <path d={`M104 ${y - 8}v-${rise}m-7 7 7-7 7 7`} />}
    </g>
  );
}

function Ladder({ stairs = false }: { stairs?: boolean }) {
  return stairs ? (
    <g>
      <path d="M38 88V74H54V58H70V42H86V26H110V88Z" fill={gold} />
      <path d="M44 81h11m5-16h11m5-16h11m5-16h11" opacity=".6" />
      <path d="M40 25 111 25M110 25 104 19m6 6-6 6" fill="none" />
    </g>
  ) : (
    <g transform="rotate(12 80 56)">
      <path d="M64 20V93M97 20V93" strokeWidth="5" />
      <path d="M64 33h33M64 49h33M64 65h33M64 81h33" stroke={gold} strokeWidth="5" />
      <path d="M80 14v-5m-5 5 5-5 5 5" fill="none" />
    </g>
  );
}

function Umbrella() {
  return (
    <g strokeWidth="1.15">
      <path
        d="M35 49C39 30 57 17 80 17C103 17 121 30 125 49C117 45 109 45 102 49C94 45 87 45 80 49C73 45 65 45 58 49C51 45 43 45 35 49Z"
        fill={coral}
      />
      <path d="M80 13V80C80 90 75 94 69 93C62 93 58 88 59 81" fill="none" strokeWidth="2.6" />
      <path
        d="M58 49C60 32 69 23 80 17C91 23 100 33 102 49M80 18V48"
        fill="none"
        stroke={paper}
        strokeWidth=".8"
      />
      {[42, 55, 111, 124].map((x, i) => (
        <path key={x} d={`M${x} ${65 + (i % 2) * 7}l-3 7`} stroke={gold} />
      ))}
    </g>
  );
}

function Nest() {
  return (
    <g>
      <path d="M40 64Q80 99 120 64L110 85Q80 106 50 85Z" fill={gold} />
      <path d="m45 74 65 13m-58-5 59-9m-52 16 43-17m-42 15 39-12" fill="none" />
      <ellipse cx="80" cy="58" rx="18" ry="25" fill={paper} />
      <path d="M70 68 90 46m-17 29 15-17" opacity=".3" />
    </g>
  );
}

function Book({ closed = false }: { closed?: boolean }) {
  return closed ? (
    <g>
      <path d="M52 24H105V83H52Q39 83 42 72V34Q42 24 52 24Z" fill={coral} />
      <path
        d="M52 24V73H105M52 73q-10 0-10 10M61 40H95M61 47H89M61 54H94"
        fill="none"
        stroke={paper}
      />
      <path d="M74 24V9" />
      <ArtGlyph kind="feather" x={78} y={13} size={28} color={ink} accent={gold} />
    </g>
  ) : (
    <g>
      <path d="M80 31Q55 14 30 25V79Q55 69 80 88Q105 69 130 79V25Q104 14 80 31Z" fill={paper} />
      <path
        d="M80 31V88M40 35q15-4 29 4m-29 7q15-4 29 4m-29 7q15-4 29 4m23-27q14-8 28-4m-28 16q14-8 28-4m-28 16q14-8 28-4"
        fill="none"
      />
      <path d="M99 24v35l6-5 6 1V22" fill={coral} />
    </g>
  );
}

function Mask({ x = 51, y = 22, size = 1 }: { x?: number; y?: number; size?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`} strokeWidth="1.25">
      <path
        d="M4 15C6 4 15 0 28 0C41 0 50 4 52 15L49 42C46 56 38 63 28 68C17 63 10 55 7 42Z"
        fill={coral}
      />
      <path d="M28 0C15 0 6 4 4 15L7 42C10 55 17 63 28 68Z" fill={ink} stroke="none" />
      <path
        d="M10 22C15 17 22 17 26 21L23 26C19 29 14 26 10 22ZM30 21C35 17 42 17 47 22C42 26 38 29 33 26Z"
        fill={paper}
        stroke="none"
      />
      <path d="M28 22L23 41L31 40Z" fill={gold} stroke="none" />
      <path d="M19 48C25 44 32 44 38 48L34 51H23Z" fill={paper} stroke="none" />
      <path
        d="M12 15C15 10 20 9 24 10M34 10C40 10 44 14 45 17M11 34L15 41M13 42L18 50M15 50L21 57M35 56L41 48M39 38L43 31"
        fill="none"
        stroke={gold}
        strokeWidth=".85"
      />
      <path d="M23 60L28 63L33 60" fill="none" stroke={paper} strokeWidth=".8" />
    </g>
  );
}

function JokerMotif({ id }: { id: string }): ReactNode {
  switch (id) {
    case 'spark':
      return (
        <g>
          <path d="M72 84V48M83 84V41M95 84V52" strokeWidth="6" stroke={gold} />
          <path
            d="M73 45Q49 35 60 21Q74 12 78 39Q85 9 101 21Q113 35 85 43Q114 48 107 62Q92 72 82 49Q70 73 54 60Q48 43 73 45Z"
            fill={coral}
          />
          <path d="m48 16-5-5m66-2-4 7m18 27 7-1M38 62l8-3" />
        </g>
      );
    case 'granite':
      return (
        <g>
          <path d="M38 81 45 42 69 23 103 28 124 71 103 88Z" fill={gold} />
          <path d="M45 42 77 50 69 23m8 27 26-22m-26 22 27 38M77 50 38 81m66-9 20-1" fill="none" />
          <path d="m51 52-4 18m45-21 13 17m-40 2-13 9" opacity=".5" />
        </g>
      );
    case 'duet':
      return (
        <g>
          <path d="M62 27V76M99 19V68M62 27l37-8M62 36l37-8" strokeWidth="5" />
          <ellipse cx="52" cy="78" rx="12" ry="9" fill={coral} transform="rotate(-25 52 78)" />
          <ellipse cx="89" cy="70" rx="12" ry="9" fill={coral} transform="rotate(-25 89 70)" />
          <path d="M36 43q-9 8 0 16m89-22q9 8 0 16" fill="none" />
        </g>
      );
    case 'twins':
      return (
        <g>
          <MiniCard x={35} y={29} suit="hearts" angle={-12} value="2" />
          <MiniCard x={61} y={34} suit="hearts" angle={5} value="2" />
          <MiniCard x={86} y={37} suit="spades" angle={-5} value="A" />
          <MiniCard x={110} y={27} suit="spades" angle={12} value="A" />
          <path d="M44 87h33m9 0h33" stroke={coral} strokeWidth="3" />
        </g>
      );
    case 'trio':
      return (
        <g>
          {[47, 70, 93].map((x, i) => (
            <g key={x}>
              <path d={`M${x} 51v33m-8 0h16`} />
              <path d={`M${x - 9} ${35 - i * 4}h18v16q-9 16-18 0Z`} fill={i === 1 ? coral : gold} />
            </g>
          ))}
          <path d="M32 25 26 20m50-4v-7m46 15 7-5" />
        </g>
      );
    case 'stair':
      return <Ladder stairs />;
    case 'river':
      return (
        <g>
          <path d="M24 68Q61 50 73 26H99Q81 54 131 84H90Q66 67 50 89" fill={gold} />
          <Waves y={65} />
          <path d="m36 41 10-9 11 9m52 3 13-8 11 8" fill="none" />
        </g>
      );
    case 'house':
      return (
        <g>
          <path d="M41 51 80 21 119 51M50 45V89H111V45" fill={paper} />
          <path d="M68 89V56h24v33M55 50h10v13H55m42-13h10v13H97" fill={gold} />
          <path d="M76 89V60l16-4v33" fill={coral} />
          <MiniCard x={29} y={68} suit="hearts" angle={-15} />
          <MiniCard x={114} y={65} angle={12} />
        </g>
      );
    case 'crown':
      return (
        <g>
          <path d="M45 77 36 31 60 49 80 20 100 49 124 31 115 77Z" fill={gold} />
          <path d="M45 77h70v12H45Z" fill={coral} />
          <path d="M58 64h44M52 83h57" stroke={paper} />
          <g color={ink}>
            <SuitPip suit="spades" x={73} y={44} size={16} />
          </g>
          {[36, 80, 124].map((x, i) => (
            <circle key={x} cx={x} cy={i === 1 ? 17 : 28} r="4" fill={paper} />
          ))}
        </g>
      );
    case 'constellation':
      return (
        <g>
          <path d="m40 77 25-45 26 17 31-25-18 59-64-6" fill="none" stroke={gold} />
          {[
            [40, 77],
            [65, 32],
            [91, 49],
            [122, 24],
            [104, 83],
          ].map(([x, y], i) => (
            <ArtGlyph
              key={x}
              kind="star"
              x={x - 8}
              y={y - 8}
              size={i === 2 ? 24 : 16}
              color={coral}
              accent={paper}
            />
          ))}
          <path d="M27 35h4m101 46h4M78 90h4" stroke={paper} />
        </g>
      );
    case 'hearts':
      return (
        <g>
          <path d="M77 88V53M77 70 52 57M77 78 104 56" strokeWidth="5" />
          <g color={coral}>
            <SuitPip suit="hearts" x={56} y={16} size={44} />
          </g>
          <ArtGlyph kind="leaf" x={31} y={41} size={34} color={ink} accent={gold} />
          <ArtGlyph kind="leaf" x={89} y={40} size={35} color={ink} accent={gold} />
        </g>
      );
    case 'diamonds':
      return (
        <g>
          <path d="m80 20 29 54H51Z" fill={paper} />
          <path
            d="m23 54 43 4m27 0 39-17m-39 17 39 2m-39-2 39 18"
            fill="none"
            stroke={coral}
            strokeWidth="3"
          />
          <g color={gold}>
            <SuitPip suit="diamonds" x={70} y={41} size={20} />
          </g>
          <path d="m132 37 5 1m-5 22h6m-6 22 5-1" />
        </g>
      );
    case 'clubs':
      return (
        <g>
          <g color={ink}>
            <SuitPip suit="clubs" x={54} y={19} size={60} />
          </g>
          <path d="M47 91q33-17 67 0m-66-5q12-26-4-45m64 45q-9-16 6-36" fill="none" />
          <ArtGlyph kind="leaf" x={28} y={40} size={24} color={gold} />
          <ArtGlyph kind="leaf" x={105} y={54} size={22} color={coral} />
        </g>
      );
    case 'spades':
      return (
        <g>
          <path d="M22 88 49 61 69 77 99 42 136 88Z" fill={ink} />
          <ArtGlyph kind="moon" x={31} y={18} size={35} color={gold} accent={paper} />
          <g color={paper}>
            <SuitPip suit="spades" x={79} y={37} size={30} />
          </g>
          <path d="m115 22 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" fill={coral} />
        </g>
      );
    case 'portrait':
      return (
        <g strokeWidth="1.1">
          <ellipse cx="80" cy="56" rx="34" ry="44" fill={gold} />
          <ellipse cx="80" cy="56" rx="29" ry="39" fill={ink} />
          <Portrait />
          <path
            d="M51 29L55 31M48 40L53 41M47 53H51M48 65L53 64M52 79L56 77M108 32L104 34M111 45H107M111 58H107M108 74L104 72"
            fill="none"
            stroke={paper}
            strokeWidth=".75"
          />
          <path d="M75 95H85M77 99H83" fill="none" />
        </g>
      );
    case 'even':
      return (
        <g>
          <path d="M41 78Q80 101 119 78L108 68H50Z" fill={coral} />
          <path d="M80 19v50M40 47h80M80 20 49 49h31Z" fill={paper} />
          <path d="m84 27 23 22H84Z" fill={gold} />
          <Waves y={94} />
        </g>
      );
    case 'odd':
      return (
        <g>
          <path d="M44 86h76M54 47v38m53-38v38" />
          <path d="M45 48V23h19v25Zm22 0V16h23v32Zm27 0V27h22v21Z" fill={paper} />
          <circle cx="54" cy="35" r="4" fill={coral} />
          <circle cx="78" cy="31" r="6" fill={gold} />
          <path d="m101 33 8 8m0-8-8 8" />
          <path d="m35 67 10-4m81 0 8 4" />
        </g>
      );
    case 'fibonacci':
      return (
        <g>
          <path
            d="M103 79Q52 102 42 61Q30 24 71 18Q111 11 118 48Q125 81 92 85Q63 89 62 64Q61 42 82 42Q99 42 99 58Q99 71 87 69Q78 69 80 61"
            fill={gold}
          />
          <path
            d="M40 55 68 58m-3-36 8 22m35-21-18 24m28 9-21 7M93 85l-6-15M66 79l12-14"
            fill="none"
          />
          <path d="m49 87-13 7" />
        </g>
      );
    case 'ace':
      return (
        <g>
          <MiniCard x={66} y={33} value="A" />
          <path
            d="M80 11v13m-20-2-7-8m47 8 7-8M49 46H35m90 0h-14M80 78v18m-20-13-8 9m48-9 8 9"
            stroke={gold}
            strokeWidth="3"
          />
          <path d="M53 31 64 26m34 0 10 5" />
        </g>
      );
    case 'low':
      return (
        <g>
          <path d="M36 84H129" />
          <path d="M55 84V52m28 32V39m27 45V56" fill="none" />
          <ArtGlyph kind="seed" x={32} y={31} size={35} color={ink} accent={gold} />
          <ArtGlyph kind="leaf" x={67} y={16} size={34} color={ink} accent={coral} />
          <ArtGlyph kind="star" x={94} y={39} size={29} color={gold} accent={coral} />
          <path d="m41 88-3 5m35-5v5m33-5 3 5" />
        </g>
      );
    case 'solo':
      return (
        <g transform="rotate(28 80 56)" strokeWidth="1.1">
          <path
            d="M71 33C60 29 51 36 52 45C53 51 64 51 62 58C61 64 47 68 49 80C52 97 72 98 79 89C86 98 106 94 108 80C110 68 96 64 95 58C93 51 104 51 105 45C107 36 98 29 87 33Z"
            fill={coral}
          />
          <path d="M74 12H84L87 64H71Z" fill={ink} />
          <path d="M74 13C69 14 67 10 68 7C70 3 76 3 78 6L84 8V15Z" fill={gold} />
          <path
            d="M55 43C57 36 65 34 70 38M89 38C96 35 101 39 102 44M55 75C53 83 59 91 69 91M89 91C100 88 103 81 100 76"
            fill="none"
            stroke={paper}
            strokeWidth="1"
          />
          <path
            d="M64 53C57 56 64 62 60 67M94 53C101 56 94 62 98 67"
            fill="none"
            stroke={ink}
            strokeWidth="2.3"
          />
          <path d="M73 67H86V70H73ZM75 77L79 89L83 77Z" fill={gold} />
          <path d="M77 12V79M80 12V79M83 12V79" fill="none" stroke={paper} strokeWidth=".55" />
          <path d="M117 17L110 94M120 17L113 94" stroke={ink} strokeWidth="1.2" />
        </g>
      );
    case 'minimal':
      return (
        <g>
          <path d="M48 89H114M80 89V38M68 89l12-13 12 13" />
          <path d="M80 38q-27 3-27-22q30-7 27 22q0-34 24-27q4 23-24 27" fill={ink} />
          <path d="m33 40 5 5m88-20-5 5" stroke={coral} />
          <circle cx="117" cy="67" r="4" fill={gold} stroke="none" />
        </g>
      );
    case 'banquet':
      return (
        <g strokeWidth="1.2">
          <path d="M24 82H136V88H24Z" fill={ink} />
          <ellipse cx="80" cy="72" rx="43" ry="9" fill={gold} />
          <path d="M43 69C45 48 59 33 80 33C101 33 115 48 117 69Z" fill={coral} />
          <path d="M80 33V28M75 27C75 20 85 20 85 27Z" fill={gold} />
          <path
            d="M49 66C51 53 61 42 70 40M54 67C56 54 64 46 71 44M103 55L109 65M99 53L105 64M44 74H116"
            fill="none"
            stroke={paper}
            strokeWidth=".85"
          />
          <path d="M29 36V73M23 31V44H35V31M29 31V44M132 32C124 42 125 49 132 51V73" fill="none" />
        </g>
      );
    case 'rainy':
      return <Umbrella />;
    case 'last':
      return (
        <g>
          <path d="M40 27H105L122 44V81H40Z" fill={paper} />
          <path d="M105 27v17h17M51 39h34m-34 12h28m-28 12h21m-21 8h16" fill="none" />
          <path d="M94 42v22" stroke={coral} strokeWidth="7" />
          <circle cx="94" cy="73" r="4" fill={coral} stroke="none" />
          <path d="M34 90h94" />
        </g>
      );
    case 'bankroll':
      return <Nest />;
    case 'purse':
      return (
        <g>
          <path d="M53 40Q35 69 43 84Q78 108 117 84Q125 69 107 40Z" fill={coral} />
          <path d="M53 40 65 31 59 18h40l-5 13 13 9Z" fill={paper} />
          <path d="M61 42q18 5 41 0M65 55q-12 19-8 25m43-27q13 20 7 30" fill="none" />
          <Coin x={80} y={71} size={14} />
        </g>
      );
    case 'scholar':
      return <Book />;
    case 'collector':
      return (
        <g>
          <path d="M40 26h80v65H40Z" fill={gold} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x="46" y={31 + i * 19} width="68" height="14" rx="2" fill={paper} />
              <path d={`M72 ${38 + i * 19}h14`} />
            </g>
          ))}
          <MiniCard x={107} y={56} suit="hearts" angle={14} />
          <path d="M45 95h70" />
        </g>
      );
    case 'sculptor':
      return (
        <g strokeWidth="1.2">
          <path d="M43 80H97V93H43Z" fill={ink} />
          <path
            d="M48 80V70C48 62 57 60 61 55L62 45C53 40 51 31 54 22C57 12 69 9 78 16L82 25L88 34L82 37L82 42L77 47L72 47V55C74 60 86 63 89 70L92 80Z"
            fill={paper}
          />
          <path
            d="M53 30C50 20 58 12 68 12L78 16L75 22L66 20L61 27L62 41L56 37Z"
            fill={gold}
            stroke="none"
          />
          <path
            d="M59 18L66 15M56 24L62 20M56 30L61 26M59 38L62 34M72 27L77 27M75 41H81M62 55L72 55M54 73L63 62M59 77L67 65M65 79L72 70"
            fill="none"
          />
          <path d="M99 76L121 31L126 34L107 80Z" fill={gold} />
          <path d="M117 26L119 18L138 27L136 35Z" fill={coral} />
          <path d="M99 81L111 83M112 92H126M31 57L38 54M32 62L38 61" fill="none" />
        </g>
      );
    case 'runner':
      return (
        <g strokeWidth="1.2">
          <path
            d="M42 57L54 48L77 58L90 62C107 63 123 65 127 73L128 80C112 90 93 88 74 82L41 77Z"
            fill={coral}
          />
          <path
            d="M42 72C63 70 78 79 97 80C110 81 118 77 127 74L128 80C109 91 91 87 73 83L40 79Z"
            fill={paper}
          />
          <path d="M56 59L66 57M64 63L75 61M73 67L84 65" stroke={paper} strokeWidth="2" />
          <path
            d="M44 57C39 44 42 35 54 30C70 24 82 17 91 13C85 29 81 39 65 43C75 42 89 39 103 33C100 44 89 52 66 53C77 54 87 51 96 48C90 62 74 63 59 58Z"
            fill={ink}
          />
          <path
            d="M49 50C59 38 72 34 83 22M53 48C68 41 77 39 91 39M57 52C69 49 80 48 85 46"
            fill="none"
            stroke={paper}
            strokeWidth=".9"
          />
          <path d="M37 88H115M26 94H95M24 59H34M28 68H35" fill="none" stroke={gold} />
          <path d="M53 82V85M66 85V88M81 88V91M99 90V93M114 86V89" />
        </g>
      );
    case 'vine':
      return (
        <g>
          <path d="M66 94q43-23 16-43Q57 28 91 14M52 89h51" fill="none" strokeWidth="3" />
          <ArtGlyph kind="leaf" x={77} y={12} size={31} color={ink} accent={gold} />
          <ArtGlyph kind="leaf" x={47} y={34} size={33} color={ink} accent={coral} />
          <ArtGlyph kind="leaf" x={83} y={55} size={30} color={ink} accent={gold} />
          <path d="M38 26h5m78 52h5" />
        </g>
      );
    case 'paircraft':
      return (
        <g strokeWidth="1.1">
          <ellipse cx="57" cy="59" rx="26" ry="34" fill={ink} />
          <ellipse cx="103" cy="48" rx="26" ry="34" fill={coral} />
          <g transform="translate(36 31) scale(.74)">
            <Portrait x={0} y={0} />
          </g>
          <g transform="translate(122 20) scale(-.74 .74)">
            <Portrait x={0} y={0} />
          </g>
          <path
            d="M29 59C29 37 41 23 57 23M103 12C118 12 131 27 131 48M57 95C67 95 73 89 77 83M82 25C87 17 93 12 103 12"
            fill="none"
            stroke={gold}
          />
          <path d="M69 18L81 12L88 17M72 98L82 101L91 93" fill="none" stroke={gold} />
        </g>
      );
    case 'tidal':
      return (
        <g>
          <path d="M30 81Q52 22 83 34Q112 42 90 60Q69 71 72 52Q64 74 132 82Z" fill={ink} />
          <path d="M32 81Q57 46 73 42q26-9 27 9M51 82q13-10 29-2" fill="none" stroke={paper} />
          <Waves y={88} />
          <ArtGlyph kind="moon" x={112} y={13} size={25} color={gold} />
        </g>
      );
    case 'toll':
      return (
        <g>
          <path d="M49 86V43H112V86ZM43 43l10-23h55l12 23Z" fill={paper} />
          <path
            d="M48 43h68M60 25l-5 18m17-18-2 18m15-18 2 18m14-18 6 18"
            stroke={coral}
            strokeWidth="4"
          />
          <path d="M48 62h65M73 62v24" />
          <Coin x={84} y={51} size={9} />
          <path d="M36 89h92" />
        </g>
      );
    case 'dividend':
      return (
        <g>
          <path d="M34 88V33h91v55Z" fill={paper} />
          <path
            d="M43 74 64 59 82 67 114 39m-10 1 10-1-1 10"
            fill="none"
            stroke={coral}
            strokeWidth="3"
          />
          <path d="M43 42v38h70" opacity=".4" />
          <Coin x={117} y={78} size={15} />
          <Coin x={130} y={58} size={10} />
        </g>
      );
    case 'reserve':
      return (
        <g strokeWidth="1.1">
          <path
            d="M73 68C53 72 34 59 27 33C36 41 48 45 64 43C45 42 34 31 34 20C51 30 67 33 76 49ZM87 68C107 72 126 59 133 33C124 41 112 45 96 43C115 42 126 31 126 20C109 30 93 33 84 49Z"
            fill={ink}
          />
          <path
            d="M38 29C48 40 65 38 73 52M36 43C43 53 58 53 69 58M40 54C48 62 59 63 67 64M122 29C112 40 95 38 87 52M124 43C117 53 102 53 91 58M120 54C112 62 101 63 93 64"
            fill="none"
            stroke={paper}
            strokeWidth=".9"
          />
          <path
            d="M69 35H91C91 45 86 50 82 55C88 60 91 66 91 78H69C69 66 72 60 78 55C74 50 69 45 69 35Z"
            fill={paper}
          />
          <path d="M72 40H88L80 51ZM72 74L80 61L88 74Z" fill={coral} stroke="none" />
          <path d="M65 31H95V36H65ZM65 78H95V83H65Z" fill={gold} />
          <path d="M80 13V24M73 20L80 13L87 20M68 92H92" fill="none" stroke={gold} />
        </g>
      );
    case 'satchel':
      return (
        <g>
          <path d="M45 40H116V89H45Z" fill={gold} />
          <path d="M45 40 52 27H111L116 40v24l-35 8-36-8Z" fill={coral} />
          <path d="M67 28V19q14-13 28 0v9" fill="none" strokeWidth="4" />
          <rect x="76" y="61" width="11" height="18" rx="2" fill={paper} />
          <path d="M50 83h61M52 39h57" opacity=".6" />
          <ArtGlyph kind="feather" x={106} y={12} size={26} color={ink} accent={paper} />
        </g>
      );
    case 'echo':
      return (
        <g>
          <path d="M35 40 76 29V73L35 60ZM76 29v44M35 40v20l-13 1V39Z" fill={gold} />
          <path d="m42 63 6 24h15l-8-21" fill={coral} />
          <path
            d="M87 33q23 18 0 37m13-48q35 30 0 61m12-72q47 41 0 83"
            fill="none"
            strokeWidth="3"
          />
        </g>
      );
    case 'splash':
      return (
        <g>
          <path
            d="M28 77q52 39 103-2M45 78 31 59m24 13L51 52m20 18 1-28m15 31 8-22m13 28 15-20"
            fill="none"
            stroke={gold}
            strokeWidth="3"
          />
          <MiniCard x={29} y={26} suit="hearts" angle={-20} />
          <MiniCard x={55} y={14} suit="diamonds" angle={-8} />
          <MiniCard x={81} y={14} suit="clubs" angle={8} />
          <MiniCard x={108} y={25} suit="spades" angle={20} />
        </g>
      );
    default:
      return <ArtGlyph kind="star" color={coral} accent={gold} />;
  }
}

const jokerPalettes: Record<
  string,
  'ember' | 'moss' | 'tide' | 'violet' | 'gold' | 'slate' | 'rose'
> = {
  spark: 'ember',
  granite: 'slate',
  duet: 'rose',
  twins: 'rose',
  trio: 'gold',
  stair: 'gold',
  river: 'tide',
  house: 'moss',
  crown: 'gold',
  constellation: 'slate',
  hearts: 'rose',
  diamonds: 'gold',
  clubs: 'moss',
  spades: 'slate',
  portrait: 'ember',
  even: 'tide',
  odd: 'violet',
  fibonacci: 'gold',
  ace: 'slate',
  low: 'moss',
  solo: 'gold',
  minimal: 'moss',
  banquet: 'ember',
  rainy: 'tide',
  last: 'rose',
  bankroll: 'moss',
  purse: 'ember',
  scholar: 'gold',
  collector: 'moss',
  sculptor: 'slate',
  runner: 'ember',
  vine: 'moss',
  paircraft: 'violet',
  tidal: 'tide',
  toll: 'ember',
  dividend: 'gold',
  reserve: 'tide',
  satchel: 'gold',
  echo: 'ember',
  splash: 'tide',
};

export function JokerArt({ id, className = '' }: { id: string; className?: string }) {
  return (
    <ArtScene
      className={`blindside-art ${className}`}
      palette={jokerPalettes[id] ?? 'moss'}
      variant={id === 'constellation' || id === 'spades' ? 'night' : 'rays'}
    >
      <PrintGround />
      <g stroke={ink} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
        <JokerMotif id={id} />
      </g>
    </ArtScene>
  );
}

const planets = [
  'high',
  'pair',
  'twoPair',
  'three',
  'straight',
  'flush',
  'fullHouse',
  'four',
  'straightFlush',
];
function Planet({ id }: { id: string }) {
  const index = planets.indexOf(id.replace('planet-', ''));
  const colors = [gold, coral, ink, coral, gold, gold, '#7eada4', '#437b87', '#947485'];
  const radii = [18, 24, 25, 22, 32, 27, 24, 25, 15];
  const radius = radii[index] ?? 22;
  return (
    <g>
      <ellipse
        cx="80"
        cy="57"
        rx="59"
        ry="33"
        fill="none"
        opacity=".35"
        transform="rotate(-19 80 57)"
      />
      <circle cx="80" cy="56" r={radius} fill={colors[index]} />
      {index === 0 && (
        <g opacity=".7">
          <circle cx="76" cy="47" r="5" />
          <circle cx="87" cy="60" r="3" />
          <path d="m67 63 6 3" />
        </g>
      )}
      {index === 1 && (
        <g stroke={paper}>
          <path d="M59 49q21 9 41-1m-43 12q22 12 45 0m-29-29 8 5" fill="none" />
        </g>
      )}
      {index === 2 && (
        <g fill={gold} stroke="none">
          <path d="m63 41 14-7 8 9-7 9 4 11-12 10-8-15 6-9Zm30-2 9 11-1 11-10-4-2-11Z" />
          <path d="M63 75q14 8 30 1" stroke={paper} />
        </g>
      )}
      {index === 3 && (
        <g>
          <path d="M62 45q19-15 32-3m-26 31 14-10 14 6" fill="none" />
          <circle cx="88" cy="48" r="5" fill={gold} />
        </g>
      )}
      {index === 4 && (
        <g stroke={paper} fill="none">
          <path d="M52 40q29 9 56 0M49 50q29 8 62 0M49 62q31 10 60 0M55 76q24 5 50-1" />
          <ellipse cx="92" cy="62" rx="8" ry="4" fill={coral} stroke={ink} />
        </g>
      )}
      {index === 5 && (
        <g>
          <path d="M54 51q26 8 51-2m-50 16q23 9 49-2" fill="none" stroke={paper} />
          <path
            d="M53 48Q10 54 31 71Q75 100 130 47Q139 32 105 37M31 71Q91 79 130 47"
            fill="none"
            stroke={coral}
            strokeWidth="5"
          />
        </g>
      )}
      {index === 6 && (
        <g>
          <ellipse
            cx="80"
            cy="56"
            rx="38"
            ry="9"
            fill="none"
            transform="rotate(67 80 56)"
            stroke={paper}
            strokeWidth="3"
          />
          <path d="M61 50q17-6 36-1m-37 12q19-4 36-1" fill="none" />
        </g>
      )}
      {index === 7 && (
        <g stroke={paper} fill="none">
          <path d="M59 47q20 12 42 0m-41 10q22 10 43 0m-34 19 14-5 10 2" />
          <path d="m116 77-6-8m6 8 8-7m-8 7V92" stroke={gold} strokeWidth="3" />
        </g>
      )}
      {index === 8 && (
        <g>
          <circle cx="110" cy="30" r="7" fill={paper} />
          <path d="M73 55q8-10 13 0q-2 10-10 9" fill={paper} />
          <path d="M48 79q18 9 34 0" stroke={gold} />
        </g>
      )}
      <ArtGlyph kind="star" x={27} y={20} size={11} color={paper} />
      <ArtGlyph kind="star" x={126} y={78} size={10} color={gold} />
    </g>
  );
}

function ToolMotif({ id }: { id: string }): ReactNode {
  if (id.startsWith('planet-')) return <Planet id={id} />;
  switch (id) {
    case 'bonus':
      return (
        <g strokeWidth="1.1">
          <path d="M39 90C39 78 47 66 56 61L70 69C67 79 55 89 39 90Z" fill={gold} />
          <path d="M56 61L88 18L103 29L70 69Z" fill={ink} />
          <path d="M86 18L91 12L108 25L104 30Z" fill={coral} />
          <path d="M62 62L91 24M66 65L95 27" fill="none" stroke={paper} strokeWidth=".85" />
          <path d="M40 89L58 73M43 75L52 76M51 65L61 66" fill="none" />
          <circle cx="58" cy="73" r="2" fill={ink} stroke="none" />
          <path
            d="M83 73C95 59 110 58 121 65C106 64 96 72 99 78C101 84 113 81 120 76M78 85C91 87 94 91 116 89"
            fill="none"
            stroke={coral}
            strokeWidth="1.4"
          />
          <path d="M25 95H129" fill="none" stroke={gold} strokeWidth=".8" />
        </g>
      );
    case 'mult':
      return (
        <g>
          <path d="M58 34H104L112 88H50Z" fill={gold} />
          <path d="M58 34 69 25H94L104 34M69 25V17q12-15 25 0v8" fill="none" />
          <path d="M61 40H101L107 82H55Z" fill={paper} />
          <path d="M81 47q-19 23-2 27q20-1 10-21l-6 9Z" fill={coral} />
          <path
            d="M44 46 29 40m13 22H26m18 16-15 7m90-39 14-6m-11 22h17m-19 16 13 7"
            stroke={gold}
          />
        </g>
      );
    case 'glass':
      return (
        <g>
          <path d="M66 81h29l8 14H58Z" fill={gold} />
          <ellipse cx="81" cy="47" rx="29" ry="34" fill={gold} />
          <ellipse cx="81" cy="47" rx="23" ry="28" fill={paper} />
          <path d="m66 53 27-27m-23 41 28-29m-24 11 8 7-4 20" fill="none" />
          <ArtGlyph kind="star" x={114} y={24} size={20} color={coral} />
        </g>
      );
    case 'steel':
      return (
        <g strokeWidth="1.1">
          <path
            d="M25 48H125V57H113C113 68 101 66 91 64C87 72 93 81 103 85V90H54V85C64 80 70 72 65 64C49 64 35 58 25 48Z"
            fill={ink}
          />
          <path d="M39 52H118M72 64H85M60 86H97" fill="none" stroke={paper} strokeWidth=".85" />
          <path
            d="M52 57L60 60M60 56L67 59M67 55L74 58M76 78L70 84M81 79L86 85"
            stroke={gold}
            strokeWidth=".7"
          />
          <path d="M89 30L67 56L61 51L83 26Z" fill={coral} />
          <path d="M77 24L84 13L112 29L105 40Z" fill={gold} />
          <path d="M84 13L88 19L110 32M88 19L81 29" fill="none" stroke={paper} strokeWidth=".85" />
          <path d="M43 38L38 33M48 35L46 28M114 67L120 72" fill="none" stroke={gold} />
        </g>
      );
    case 'garden':
      return (
        <g>
          <path d="M40 92H121M49 89V52m31 37V38m29 51V56" fill="none" />
          <g color={coral}>
            <SuitPip suit="hearts" x={35} y={25} size={30} />
            <SuitPip suit="hearts" x={65} y={9} size={34} />
            <SuitPip suit="hearts" x={95} y={31} size={29} />
          </g>
          <ArtGlyph kind="leaf" x={45} y={57} size={25} color={ink} />
          <ArtGlyph kind="leaf" x={79} y={53} size={25} color={ink} />
          <path d="m46 95-3 5m38-5v5m31-5 3 5" />
        </g>
      );
    case 'rank':
      return <Ladder />;
    case 'destroy':
      return (
        <g transform="rotate(-18 80 56)">
          <path d="M40 37H100L122 61 100 84H40Z" fill={paper} />
          <path d="M40 37H71V84H40Z" fill={coral} />
          <path d="M40 76h31M83 43v33" opacity=".45" />
          <path d="M45 95h61m8 0h8M38 16l-8-6m20 10-3-9" fill="none" />
        </g>
      );
    case 'copy':
      return (
        <g>
          <MiniCard x={41} y={22} suit="hearts" angle={-10} />
          <MiniCard x={90} y={47} suit="hearts" angle={10} />
          <path
            d="M77 34q22-10 32 8m-1-9 1 9-10-2M83 83q-25 10-31-16m-3 9 3-9 8 6"
            fill="none"
            stroke={coral}
            strokeWidth="3"
          />
          <ArtGlyph kind="star" x={104} y={16} size={15} color={gold} />
        </g>
      );
    case 'wild':
      return (
        <g>
          <path d="M37 77a43 43 0 0 1 86 0" fill="none" stroke={coral} strokeWidth="9" />
          <path d="M46 77a34 34 0 0 1 68 0" fill="none" stroke={gold} strokeWidth="8" />
          <path d="M55 77a25 25 0 0 1 50 0" fill="none" stroke={ink} strokeWidth="7" />
          <path d="M64 77a16 16 0 0 1 32 0" fill="none" stroke={paper} strokeWidth="6" />
          <path
            d="M25 78q-3-13 9-13q11-14 21-2q17-1 16 15Zm66 0q-1-16 13-15q12-14 23 0q13-1 9 15Z"
            fill={paper}
          />
        </g>
      );
    default:
      return <Book closed />;
  }
}

export function ConsumableArt({ id, className = '' }: { id: string; className?: string }) {
  return (
    <ArtScene
      className={`blindside-art ${className}`}
      palette={id.startsWith('planet-') ? 'slate' : id === 'garden' ? 'moss' : 'violet'}
      variant={id.startsWith('planet-') ? 'night' : 'runes'}
    >
      <PrintGround />
      <g stroke={ink} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
        <ToolMotif id={id} />
      </g>
    </ArtScene>
  );
}

export function BossArt({ id, className = '' }: { id: string; className?: string }) {
  let motif: ReactNode;
  switch (id) {
    case 'thorn':
      motif = (
        <g>
          <path d="M78 96V26m0 29L55 40m23 31 26-20" fill="none" strokeWidth="4" />
          <path d="m78 29-11 6 11 6m0 24-12 5 12 6m24-23 4-11 6 5" fill={gold} />
          <g color={ink}>
            <SuitPip suit="clubs" x={63} y={7} size={33} />
          </g>
          <path d="M66 93H90" />
        </g>
      );
      break;
    case 'mask':
      motif = <Mask />;
      break;
    case 'pinch':
      motif = (
        <g>
          <path d="M50 21 69 49 55 61 35 39m75-18L91 49l14 12 20-22" fill={coral} />
          <path d="m59 57 16 21m28-21L87 78" strokeWidth="7" />
          <MiniCard x={68} y={49} angle={4} />
          <path d="M80 22V9m-7 11 7-11 7 11M42 87l12-6m62 6-12-6" fill="none" />
        </g>
      );
      break;
    case 'narrow':
      motif = (
        <g>
          <path d="M36 21h19v71H36Zm69 0h19v71H105Z" fill={ink} />
          <MiniCard x={67} y={38} suit="diamonds" />
          <path
            d="M16 54H58m-8-8 8 8-8 8m96-8H103m8-8-8 8 8 8"
            fill="none"
            stroke={coral}
            strokeWidth="3"
          />
        </g>
      );
      break;
    case 'lock':
      motif = (
        <g>
          <path d="M60 45V28q20-29 40 0v17" fill="none" strokeWidth="7" />
          <rect x="50" y="42" width="61" height="48" rx="7" fill={gold} />
          <path d="M80 56a7 7 0 0 0-3 13l-2 10h10l-2-10a7 7 0 0 0-3-13Z" fill={ink} />
          <path d="M58 49H104M59 85h43" opacity=".5" />
        </g>
      );
      break;
    case 'five':
      motif = (
        <g>
          {[32, 51, 70, 89, 108].map((x, i) => (
            <MiniCard
              key={x}
              x={x}
              y={28 + Math.abs(i - 2) * 8}
              suit={i % 2 ? 'hearts' : 'spades'}
              angle={(i - 2) * 7}
              value="5"
            />
          ))}
          <path d="M40 86h85m-65 8h44" stroke={coral} strokeWidth="3" />
        </g>
      );
      break;
    case 'wall':
      motif = (
        <g>
          <path d="M33 27H126V92H33Z" fill={gold} />
          <path
            d="M33 43h93M33 59h93M33 75h93M56 27v16m46-16v16M79 43v16M56 59v16m46-16v16M79 75v17"
            fill="none"
          />
          <path d="M24 97h113M48 18V8m65 10V8m-8 7 8-7 8 7" stroke={coral} />
        </g>
      );
      break;
    case 'crown':
      motif = (
        <g>
          <JokerMotif id="crown" />
          <path d="M22 43 30 51 22 59m116-16-8 8 8 8" stroke={coral} fill="none" />
        </g>
      );
      break;
    default:
      motif = (
        <g>
          <MiniCard x={66} y={25} value="A" />
          <Coin x={81} y={80} />
        </g>
      );
  }
  return (
    <ArtScene className={`blindside-art ${className}`} palette="slate" variant="runes">
      <PrintGround />
      <g stroke={ink} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
        {motif}
      </g>
    </ArtScene>
  );
}

const pipLayouts: Record<number, [number, number][]> = {
  2: [
    [36, 19],
    [36, 77],
  ],
  3: [
    [36, 19],
    [36, 48],
    [36, 77],
  ],
  4: [
    [22, 19],
    [50, 19],
    [22, 77],
    [50, 77],
  ],
  5: [
    [22, 19],
    [50, 19],
    [36, 48],
    [22, 77],
    [50, 77],
  ],
  6: [
    [22, 19],
    [50, 19],
    [22, 48],
    [50, 48],
    [22, 77],
    [50, 77],
  ],
  7: [
    [22, 19],
    [50, 19],
    [36, 33],
    [22, 48],
    [50, 48],
    [22, 77],
    [50, 77],
  ],
  8: [
    [22, 19],
    [50, 19],
    [36, 33],
    [22, 48],
    [50, 48],
    [36, 63],
    [22, 77],
    [50, 77],
  ],
  9: [
    [22, 15],
    [50, 15],
    [22, 37],
    [50, 37],
    [36, 48],
    [22, 59],
    [50, 59],
    [22, 81],
    [50, 81],
  ],
  10: [
    [22, 15],
    [50, 15],
    [36, 26],
    [22, 37],
    [50, 37],
    [22, 59],
    [50, 59],
    [36, 70],
    [22, 81],
    [50, 81],
  ],
};

function CourtHalf({ rank, suit }: { rank: number; suit: Suit }) {
  return (
    <g stroke={ink} strokeWidth=".7" strokeLinejoin="miter" fill={paper}>
      <path d="M13 47V37L27 29H41L59 39V47Z" fill={rank === 12 ? gold : coral} />
      <path d="M17 34L30 47H42L25 30ZM40 30L55 47H59V41L46 30Z" fill={ink} stroke="none" />
      <path
        d="M20 34L33 47M24 32L38 47M44 33L55 46M47 32L58 43"
        fill="none"
        stroke={paper}
        strokeWidth=".6"
      />
      <path d="M26 16C25 8 30 5 36 7C41 9 43 12 43 17L47 21L43 23V26L39 29L35 28V32H27L29 26C26 24 25 20 26 16Z" />
      <path
        d="M25 18C22 10 28 4 35 5C42 5 44 10 43 15L35 11L32 17L29 20L29 26L25 22Z"
        fill={ink}
        stroke="none"
      />
      <path d="M26 11L31 8M26 15L30 11M37 18L41 17M40 25H43" fill="none" />
      <path d="M28 30L31 35L37 31" fill={paper} />
      {rank === 11 ? (
        <g>
          <path d="M23 8L24 3L34 2L45 6L43 11L32 7Z" fill={coral} />
          <path d="M25 6L36 5L42 8" fill="none" stroke={gold} />
          <path d="M25 4C20 1 17 2 15 8C19 9 22 6 25 4Z" fill={gold} />
          <path d="M52 39V18L54 13L56 18V39Z" fill={paper} />
          <path d="M49 39H59M54 39V47" stroke={gold} strokeWidth="1.3" />
        </g>
      ) : (
        <g>
          <path d="M25 8L23 2L29 4L33 0L37 4L43 2L41 8Z" fill={gold} />
          <path d="M25 6H41" stroke={ink} strokeWidth=".55" />
        </g>
      )}
      {rank === 12 && (
        <g>
          <path d="M25 15C20 19 22 29 28 31L24 33C15 26 18 14 25 11Z" fill={ink} />
          <path
            d="M22 17C19 23 22 28 24 29M21 22L25 26"
            fill="none"
            stroke={gold}
            strokeWidth=".5"
          />
          <path d="M51 42V26M51 34L47 30" fill="none" />
          <path d="M51 27C44 24 45 19 50 20C52 15 56 19 55 22C61 23 55 28 51 27Z" fill={coral} />
          <path d="M51 33C57 28 59 31 55 35Z" fill={ink} stroke="none" />
        </g>
      )}
      {rank === 13 && (
        <g>
          <path d="M30 23L35 26L40 25L40 31L34 35L30 30Z" fill={ink} stroke="none" />
          <path d="M33 28L35 31M37 28V31" stroke={gold} strokeWidth=".5" />
          <path d="M54 47V22" stroke={gold} strokeWidth="1.8" />
          <path d="M54 16L58 21L54 26L50 21Z" fill={gold} />
          <circle cx="54" cy="21" r="1.2" fill={coral} />
        </g>
      )}
      <g color="currentColor" stroke="none">
        <SuitPip suit={suit} x={14} y={38} size={7} />
      </g>
    </g>
  );
}

export function PokerArt({ rank, suit }: { rank: number; suit: Suit }) {
  return (
    <svg
      className="blindside-poker-art"
      viewBox="0 0 72 96"
      aria-hidden="true"
      focusable="false"
      data-art-rank={rank}
    >
      {rank === 14 ? (
        <g>
          <path
            d="M36 15 41 28 54 24 50 38 63 48 50 56 54 72 41 68 36 82 31 68 18 72 22 56 9 48 22 38 18 24 31 28Z"
            fill="none"
            stroke={gold}
            strokeWidth=".75"
          />
          <SuitPip suit={suit} x={21} y={32} size={30} />
        </g>
      ) : rank > 10 ? (
        <g>
          <rect x="11" y="2" width="50" height="92" rx="1" fill="none" stroke={gold} />
          <CourtHalf rank={rank} suit={suit} />
          <g transform="rotate(180 36 48)">
            <CourtHalf rank={rank} suit={suit} />
          </g>
          <path d="M14 48h44" stroke={gold} />
        </g>
      ) : (
        (pipLayouts[rank] ?? []).map(([x, y], index) => (
          <g key={index} transform={y > 48 ? `rotate(180 ${x} ${y})` : undefined}>
            <SuitPip suit={suit} x={x - 7} y={y - 7} size={14} />
          </g>
        ))
      )}
    </svg>
  );
}
