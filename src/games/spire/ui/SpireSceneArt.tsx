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

function ExordiumScene() {
  return (
    <>
      <circle cx="115" cy="29" r="20" fill="#d8d7aa" opacity=".17" />
      <path d="M0 78 27 56 50 70 79 47 110 67 140 43 160 58v54H0Z" fill="#405b4d" />
      <path d="M0 87 35 66 56 75 0 106Zm160-5-31-25-29 22 60 29Z" fill="#293f38" />
      <path d="M14 86 24 43l13-12 6-24 20 3 2 18-8 11 7 47Z" fill="#566b57" />
      <path d="M24 43 37 31l6-24 7 2-4 28-8 10-5 41-19-2Z" fill="#a5ac83" />
      <path d="m43 7 20 3 2 18-8 11-11-2 4-28Z" fill="#c2bc91" />
      <path d="M107 88 103 46l9-10 2-28 22-4 1 26 10 12 5 42Z" fill="#526956" />
      <path d="m112 36 2-28 16-3-2 30 8 12 5 42-22-2-3-42Z" fill="#aeb58f" />
      <path d="m130 5 6-1 1 26 10 12-11 5-8-12Z" fill="#6c8065" />
      <path
        d="M52 89V55Q79 18 107 54v35H94V56Q79 38 65 57v32Z"
        fill="#bbb791"
        stroke={ink}
        strokeWidth="2"
      />
      <path d="M65 89V57Q79 38 94 56v33Z" fill="#243a34" />
      <path d="M67 89 74 66l9-6 8 29Z" fill="#66775e" />
      <path d="M51 54q27-37 56 0l-5 6Q79 30 57 61Z" fill="#d8ca9e" stroke={ink} strokeWidth="1.5" />
      <path d="m69 36 5 10m12-11-3 10m13-4-5 8" stroke="#727b61" strokeWidth="2" />
      <path d="M73 112 78 83h8l16 29Z" fill="#b89c6e" />
      <path d="m0 112 27-13 32-10 13 23Zm160 0-33-18-24-5-2 23Z" fill="#30483d" />
      <path d="m4 97 19-9 17 3-7 11-21 5Zm118 2 16-14 19 5 3 19-21-7Z" fill="#788568" />
      <path
        d="m15 94 22-7m98 4 18 5M31 48l15 2m72 7 18-4m-6-29-12 3"
        stroke="#d5c79a"
        strokeWidth="2"
        opacity=".72"
      />
      <path d="m22 79 8-14 8 5m85 16 8-22 8 8" fill="none" stroke="#78926d" strokeWidth="3" />
      <path d="m76 101 13-3m-5 10 13-3" stroke="#e0c590" strokeWidth="2" opacity=".75" />
    </>
  );
}

function CityScene() {
  return (
    <>
      <circle cx="115" cy="25" r="19" fill="#e4c69a" opacity=".18" />
      <path d="M0 65 19 48 32 56 51 29 71 54 94 33 117 54 142 31 160 51v61H0Z" fill="#5d554b" />
      <path d="M7 86V46l23-17 20 16v40Z" fill="#536257" />
      <path d="m7 46 23-17 20 16-8 6-14-12-15 13Z" fill="#998867" />
      <path d="M12 52h30v37H12Z" fill="#bba67d" />
      <path d="M37 52h9v37h-9Z" fill="#776f58" />
      <path d="M42 85V37l23-22 24 22v51Z" fill="#65705e" />
      <path d="m42 37 23-22 24 22-8 5-16-16-17 17Z" fill="#c2ad82" />
      <path d="M49 42h31v42H49Z" fill="#aa9772" />
      <path d="M78 42h10v47H78Z" fill="#6c6651" />
      <path d="M91 86V33l8-6V16l10-10 10 10v12l10 8v51Z" fill="#5a6255" />
      <path d="m91 33 8-6V16l10-10 10 10v12l10 8-10 4-11-5-10 4Z" fill="#d4bd8f" />
      <path d="M98 40h22v50H98Z" fill="#c6ae82" />
      <path d="M120 41 139 27l18 18v50h-37Z" fill="#555e53" />
      <path d="m120 41 19-14 18 18-7 6-13-13-12 12Z" fill="#9d8968" />
      <path d="M125 51h25v42h-25Z" fill="#ad9873" />
      <path d="M0 89 22 76l29 7 28-8 22 9 21-7 38 12v23H0Z" fill="#3c493e" />
      <path d="M47 112 67 81l14-2 25 33Z" fill="#766d55" />
      <path d="M64 112 76 86h8l13 26Z" fill="#a3906a" />
      <path d="M23 76 52 82l17-5 8 5-24 12-30-7Z" fill="#cfb58a" />
      <path d="M52 82 77 77l4 5-28 12Z" fill="#81775d" />
      <path d="M88 81 120 73l25 7-4 9-32-4-20 6Z" fill="#b6a077" />
      <path
        d="m18 61 5-5 4 5v10h-9Zm15 0 4-4 4 4v10h-8Zm22-12h7v10h-7Zm14 0h7v10h-7Zm30-1h6v11h-6Zm13 0h6v11h-6Zm17 13h6v10h-6Zm13 0h6v10h-6Z"
        fill="#efcf94"
      />
      <path d="m0 95 24-8 26 7-7 18H0Zm160 0-20-8-22 8 5 17h37Z" fill="#2a4039" />
      <path d="m24 87 7 7-4 18m112-25-7 9 3 16" stroke="#7b8764" strokeWidth="3" fill="none" />
      <path d="m76 98 13-2m-18 9 22-1" stroke="#d7b786" strokeWidth="1.5" />
    </>
  );
}

function BeyondScene() {
  return (
    <>
      <circle cx="111" cy="24" r="20" fill="#d9d0c5" opacity=".15" />
      <path d="M0 74Q25 51 50 72 70 57 88 68 119 47 160 69v43H0Z" fill="#50566b" />
      <path
        d="M24 33q57-42 109 7M11 44q41 24 69-4m39-15q26-9 37 4"
        fill="none"
        stroke="#b4acb8"
        strokeWidth="1.5"
        opacity=".52"
      />
      <path d="m4 72 30-13 25 12-9 14-32 4Zm109-7 35-14 12 9v17l-34 10Z" fill="#4b5b5e" />
      <path d="m4 72 30-13 25 12-12 4-27-4Zm109-7 35-14 12 9-29 9Z" fill="#a6a69d" />
      <path d="m18 89 32-4-9 16-11 8Zm108-2 34-10-16 23-16 3Z" fill="#37474a" />
      <path d="M55 74 80 60l31 15-16 12-28-1Z" fill="#aeb0a7" />
      <path d="m67 86 28 1-7 21-17-11Z" fill="#455561" />
      <path d="m55 74 12 12 4 11-15-9Z" fill="#586674" />
      <path
        d="M69 72V37l9-5 5-26 7 25 13 6v37L87 84Z"
        fill="#d4c9af"
        stroke={ink}
        strokeWidth="2"
      />
      <path d="m83 6 7 25 13 6v37L87 84V33Z" fill="#718785" />
      <path d="m69 37 18-4 16 4-16 9Z" fill="#f0deb8" />
      <path d="M78 72V48q7-8 13 0v24Z" fill="#293b43" />
      <path d="M82 63V49l5-4 3 4v14Z" fill="#e2d2a7" />
      <path d="M24 61V43l16-5v23m86-5V31l12-5v30" fill="none" stroke="#e3d4b6" strokeWidth="3" />
      <path d="m33 77 22-3 14 6-22 5Zm63 8 17-12 15-5-4 12-18 10Z" fill="#c8bda8" />
      <path d="m33 77 14 8-5 6-17-6Zm73 13 18-10 4 7-13 9Z" fill="#687478" />
      <path d="M0 100q28-19 50 0 32 22 59 0 26-15 51 1v11H0Z" fill="#65667a" />
      <path
        d="M0 104q28-15 50 0 32 14 59-1 26-12 51 1"
        fill="none"
        stroke="#bcb2bb"
        strokeWidth="2"
        opacity=".72"
      />
      <path d="m30 17 3 7-3 7-3-7m103 72 4 7-4 7-4-7" fill="#e9daae" />
      <path d="M129 18q12-5 23 1" fill="none" stroke="#d3bec5" strokeWidth="2" />
    </>
  );
}

export function ActArt({ act }: { act: number }) {
  return (
    <ArtScene
      palette={act === 1 ? 'moss' : act === 2 ? 'gold' : 'violet'}
      variant="night"
      className="act-art"
    >
      {act === 1 ? <ExordiumScene /> : act === 2 ? <CityScene /> : <BeyondScene />}
    </ArtScene>
  );
}
