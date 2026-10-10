import type { Suit } from '../../domain/types';
import { ink, paper, coral, gold, SuitPip } from './primitives';
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
