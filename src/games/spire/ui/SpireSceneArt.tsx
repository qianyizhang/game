import type { ReactNode } from 'react';
import { ArtScene } from '../../../shared/art/CardArt';
import type { NodeKind } from '../domain/types';

const ink = '#293830',
  bone = '#e7d7ae',
  gold = '#bb965c',
  sage = '#8f9e77';
export const ROOM_KINDS: NodeKind[] = [
  'fight',
  'elite',
  'event',
  'rest',
  'shop',
  'treasure',
  'boss',
];
const rooms: Record<NodeKind, ReactNode> = {
  fight: (
    <>
      <path d="m17 13 35 34-7 8L13 20 11 10Z" fill={bone} stroke={ink} strokeWidth="2" />
      <path d="m48 12-8 4-22 28 5 6 25-27 5-13Z" fill={sage} stroke={ink} strokeWidth="2" />
      <path d="m12 39 15 13m9-8 15-14" stroke={gold} strokeWidth="5" />
      <path d="m20 48-7 8m29-10 9 9" stroke={ink} strokeWidth="6" />
    </>
  ),
  elite: (
    <>
      <path
        d="M20 21 11 9 14 31 9 38 16 53 32 59 48 53 55 37 49 29 53 9 42 21Z"
        fill={gold}
        stroke={ink}
        strokeWidth="2"
      />
      <path d="m32 14 14 14-3 22-11 7-11-7-3-22Z" fill={bone} />
      <path
        d="m19 32 10 5-6 5-5-5m27-5-10 5 6 5 5-5M32 34v18"
        fill={ink}
        stroke={ink}
        strokeWidth="2"
      />
    </>
  ),
  event: (
    <>
      <path
        d="M17 12Q30 8 43 12L50 29 42 48 32 55 22 49 14 33Z"
        fill={bone}
        stroke={ink}
        strokeWidth="2"
      />
      <path d="M34 12 43 12 50 29 42 48 32 55 35 36Z" fill={sage} />
      <path
        d="m20 25 9 4-8 5m22-9-9 4 7 5M29 37q5-3 7 1t-5 6m1 5h1"
        fill="none"
        stroke={ink}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="m12 17-5-4m42 1 6-5M12 44l-6 2m43 3 6 4" stroke={gold} strokeWidth="2" />
    </>
  ),
  rest: (
    <>
      <path d="m12 53 38-12m-37 0 37 13" stroke={ink} strokeWidth="7" strokeLinecap="round" />
      <path
        d="M23 47C8 32 29 26 28 10 41 18 36 24 42 26 47 22 48 19 48 19Q59 44 38 48Z"
        fill="#b5674e"
        stroke={ink}
        strokeWidth="1.5"
      />
      <path d="M29 46Q22 38 34 27 30 40 41 34 44 43 36 47Z" fill={bone} />
    </>
  ),
  shop: (
    <>
      <path d="M14 28h37v27H14Z" fill={sage} stroke={ink} strokeWidth="2" />
      <path
        d="m10 28 7-17h31l8 17q-5 8-12 0-6 8-12 0-6 8-11 0-6 7-11 0Z"
        fill={bone}
        stroke={ink}
        strokeWidth="2"
      />
      <path d="m22 12-2 15m22-15 3 15M32 11v17" stroke="#b26b51" strokeWidth="6" />
      <path d="M21 38h10v17H21m17-17h7v8h-7Z" fill={ink} />
      <path d="M11 56h45" stroke={gold} strokeWidth="3" />
    </>
  ),
  treasure: (
    <>
      <path d="M11 29q0-16 13-17h25l7 13v27H11Z" fill={gold} stroke={ink} strokeWidth="2" />
      <path d="M11 29h35V17q-5-9-15-5-8 3-8 17" fill="#9a6850" stroke={ink} strokeWidth="2" />
      <path d="m46 29 10-4v27H46Z" fill="#6f7759" />
      <path d="M12 36h42M20 29v22m18-22v22" stroke={bone} strokeWidth="3" />
      <path d="M28 30h8v13h-8Z" fill={bone} stroke={ink} strokeWidth="1.5" />
      <path d="M32 35v4" stroke={ink} strokeWidth="2" />
    </>
  ),
  boss: (
    <>
      <path d="m10 23 12 8L32 12l11 19 12-8-6 25H16Z" fill={gold} stroke={ink} strokeWidth="2" />
      <path d="m22 43 3-12 7-13 8 14 3 11Z" fill={bone} />
      <path d="m29 30 6 0 3 7-6 6-6-6Z" fill="#a05c47" />
      <path d="M16 51h33M19 56h27" stroke={gold} strokeWidth="3" strokeLinecap="round" />
      <circle cx="10" cy="20" r="3" fill={bone} />
      <circle cx="32" cy="9" r="3" fill={bone} />
      <circle cx="55" cy="20" r="3" fill={bone} />
    </>
  ),
};

export function NodeArt({ kind }: { kind: NodeKind }) {
  return (
    <svg
      className="node-art"
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      data-room-art={kind}
    >
      {rooms[kind]}
    </svg>
  );
}

export function ActArt({ act }: { act: number }) {
  return (
    <ArtScene
      palette={act === 1 ? 'moss' : act === 2 ? 'gold' : 'violet'}
      variant="night"
      className="act-art"
    >
      <circle cx="117" cy="29" r="18" fill={bone} opacity=".16" />
      {act === 1 ? (
        <>
          <path d="M0 77Q30 52 62 76 100 52 160 67V112H0Z" fill="#44594a" />
          <path
            d="M22 95V49l8-10V14h20v23l8 10v51m40-8V40l9-10V7h20v26l11 11v51"
            fill="#8f9c7a"
            stroke={ink}
            strokeWidth="2"
          />
          <path
            d="M49 95V58Q79 15 106 54v43H93V58Q78 39 62 61v37Z"
            fill="#adac83"
            stroke={ink}
            strokeWidth="2"
          />
          <path d="M67 112 77 63l8 0 17 49" fill="#bda879" />
          <path
            d="M30 22h20m-20 7h20m55-13h19m-19 8h19M24 54h20m-20 8h18m67-12h20m-21 8h20M55 50l8 8m7-24 3 13m15-13-5 12m15-4-8 10"
            fill="none"
            stroke={ink}
            strokeWidth="1"
            opacity=".6"
          />
          <path d="M0 103Q27 77 62 94L60 112H0m97-8q37-32 63-16v24H99Z" fill="#314739" />
          <path
            d="M25 80q12-10 10-28m-2 17-10-8m11 1 10-12M120 94q-9-14-7-27m0 10 12-7"
            fill="none"
            stroke={sage}
            strokeWidth="2"
          />
        </>
      ) : act === 2 ? (
        <>
          <path
            d="M0 70 18 51 33 61 40 32 58 60 70 46 93 68 113 41 126 56 142 34 160 62V112H0Z"
            fill="#665c4b"
          />
          <path
            d="M16 98V58h26v42m9 0V44h32v56m18 3V66h34v37"
            fill="#a99066"
            stroke={ink}
            strokeWidth="2"
          />
          <path
            d="m12 58 19-19 16 19m0-14 20-23 22 23m8 22 21-18 21 18"
            fill="#6e7964"
            stroke={ink}
            strokeWidth="2"
          />
          <path d="M88 95V32h9V19l6-9 7 9v13h8v63" fill="#c5b18a" stroke={ink} strokeWidth="2" />
          <path d="M0 101Q40 66 83 91T160 89V112H0Z" fill="#4a5142" />
          <path
            d="M15 111V99Q26 83 38 94v17m37 0V98q13-14 23 0v13m28 0V99q11-15 22-2v14"
            fill={ink}
          />
          <path
            d="M25 65v9m9-9v9m22-23v8m15-8v8m-14 8v8m15-8v8m25-29v8m10-8v8m-10 9v8m10-8v8m7 9v8m10-8v8"
            stroke={bone}
            strokeWidth="3"
          />
        </>
      ) : (
        <>
          <path d="M0 83Q34 62 68 76t92-12v48H0Z" fill="#5d6173" />
          <path
            d="M9 74 48 68 41 89 28 103 20 89Zm103-20 40 4-7 20-16 9-13-18Z"
            fill="#96948e"
            stroke={ink}
            strokeWidth="2"
          />
          <path d="M53 72 77 58 101 70 86 104 74 99Z" fill="#6a7580" stroke={ink} strokeWidth="2" />
          <path
            d="M58 70V39l11-5 8-23 8 23 11 5v32l-19 8Z"
            fill="#bdb8a1"
            stroke={ink}
            strokeWidth="2"
          />
          <path d="m77 11 8 23 11 5v32l-19 8Z" fill="#81948e" />
          <path d="M71 66V45q6-12 12 0v21Z" fill={ink} />
          <path d="M76 62V47" stroke={bone} strokeWidth="2" />
          <path
            d="M20 73V52h18v19m85-16V35h14v21M58 40l19 6 19-7"
            fill="none"
            stroke={bone}
            strokeWidth="2"
          />
          <path
            d="M4 94Q24 83 48 98t54-2 54-3M13 44q16 7 34-5m66-18q18-8 31-2"
            fill="none"
            stroke="#b4b1b8"
            strokeWidth="1.5"
            opacity=".65"
          />
          <path d="m40 21 3 6-3 6-3-6m99 71 3 5-3 5-3-5" fill={bone} />
        </>
      )}
    </ArtScene>
  );
}
