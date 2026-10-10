import { ArtGlyph } from '../../../../shared/art/CardArt';
import type { Suit } from '../../domain/types';
export const ink = '#28493d';

export const paper = '#f6e8c7';

export const coral = '#bd5947';

export const gold = '#c69b57';

export function PrintGround() {
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

export function MiniCard({
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

export function Coin({ x, y, size = 12 }: { x: number; y: number; size?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={size} fill={gold} />
      <circle cx={x} cy={y} r={size - 3} fill="none" strokeWidth="1" />
      <path d={`M${x - 2} ${y - 5}h4m-2 0v10m-2 0h4`} />
    </g>
  );
}

export function Portrait({ x = 52, y = 20 }: { x?: number; y?: number }) {
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

export function Waves({ y = 72, rise = 0 }: { y?: number; rise?: number }) {
  return (
    <g fill="none">
      {[0, 9, 18].map((offset) => (
        <path key={offset} d={`M30 ${y + offset}q12 -10 24 0t24 0t24 0t24 0`} />
      ))}
      {rise > 0 && <path d={`M104 ${y - 8}v-${rise}m-7 7 7-7 7 7`} />}
    </g>
  );
}

export function Ladder({ stairs = false }: { stairs?: boolean }) {
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

export function Umbrella() {
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

export function Nest() {
  return (
    <g strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M33 69Q45 56 79 59Q110 54 128 66Q112 79 80 81Q49 80 33 69Z" fill={ink} />
      <path
        d="M39 62Q70 70 113 60M34 67Q76 54 127 68M47 58L100 72M43 72L112 56"
        fill="none"
        stroke={gold}
        strokeWidth="1.4"
      />
      <path
        d="M64 53C62 38 72 22 81 22C91 22 100 42 99 55C98 70 91 75 79 75C67 74 62 66 64 53Z"
        fill={paper}
      />
      <path
        d="M84 24C93 34 97 48 93 60Q90 71 76 73Q93 79 98 62C103 48 92 24 84 24Z"
        fill={gold}
        stroke="none"
        opacity=".58"
      />
      <path d="M69 49Q69 34 78 28" fill="none" stroke={gold} strokeWidth=".7" />
      <g fill={gold} stroke="none">
        <ellipse cx="76" cy="57" rx="1.4" ry=".9" />
        <ellipse cx="84" cy="44" rx=".9" ry="1.4" />
        <circle cx="72" cy="48" r=".65" />
        <circle cx="88" cy="61" r=".8" />
        <ellipse cx="79" cy="64" rx=".65" ry="1" />
      </g>
      <path d="M35 68Q81 87 125 65L119 79Q110 94 80 95Q49 91 40 80Z" fill={gold} />
      <path
        d="M37 73Q75 95 121 74M42 80Q76 98 113 83M45 68Q79 84 118 67M33 70Q78 79 130 64M46 88Q81 83 119 73M50 75Q78 85 107 91M36 79Q76 79 122 69"
        fill="none"
        stroke={ink}
        strokeWidth=".8"
      />
      <path
        d="M44 73Q67 85 91 84M61 91Q83 95 102 87M89 77L119 69"
        fill="none"
        stroke={paper}
        strokeWidth="1"
      />
      <path d="M36 87Q45 76 35 58M116 85Q124 83 130 76" fill="none" />
      <path d="M36 65Q22 62 27 48Q38 52 36 65Z" fill={coral} />
      <path d="M29 53L35 63" stroke={paper} strokeWidth=".65" />
      <path d="M50 99H110" fill="none" stroke={gold} strokeWidth=".7" />
    </g>
  );
}

export function Book({ closed = false }: { closed?: boolean }) {
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

export function Mask({ x = 51, y = 22, size = 1 }: { x?: number; y?: number; size?: number }) {
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
