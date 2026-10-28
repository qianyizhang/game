import type { ReactNode } from 'react';
import { copper, ink, metal, shade, shadow } from './primitives';

const cloth = '#8d5146';
const skin = '#c29372';
const skinShade = '#805e4e';

function Cut({ d, color = ink }: { d: string; color?: string }) {
  return <path d={d} fill="none" stroke={color} strokeWidth=".8" strokeLinecap="round" />;
}

/** The same fitted iron mask belongs to six different weight-bearing gestures. */
function Mask({
  x,
  y,
  angle = 0,
  scale = 1,
}: {
  x: number;
  y: number;
  angle?: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      <path d="M-14 1Q-16-13 0-15q15-1 18 13l-4 17-12 9-14-7Z" fill={shadow} />
      <path d="M-11-7Q-23-12-22-23l13 10 8 4M8-12q12-8 17-18 1 17-11 24" fill={metal} />
      <path d="M-10-9Q0-15 10-8L15 2 7 10 4 21-10 14-14 1Z" fill={ink} />
      <path d="M8-9 15-4 17 3 8 15 4 21 6 8 13 1Z" fill={metal} />
      <path d="m-12-1 10 2-3 5-6-2m13-3 10-3-6 7-5 1" fill={shadow} />
      <path d="M-2-9 1 1-2 10 6 11 3 18" fill="none" stroke={copper} strokeWidth="1.5" />
      <Cut d="M-12-8-8-10m18 6 2 3" />
    </g>
  );
}

/** Wrist at the left, curled knuckles at the right; each arm sets its own direction. */
function Gauntlet({
  x,
  y,
  angle = 0,
  scale = 1,
}: {
  x: number;
  y: number;
  angle?: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      <path d="M-12-7-1-9 6-13 14-11 19-6 18 5 9 12-10 9Z" fill={shadow} />
      <path d="M-10-5 0-6 7-10 14-8 15-3 8 2-9 3Z" fill={metal} />
      <path d="M-9 3 7 1 14-4 16 1 8 9-9 7Z" fill={shade} />
      <path
        d="M-10-5-2-6 0 1-9 3M1-7 5-9 8-4 4 0m3-10 5 2 1 5"
        fill="none"
        stroke={ink}
        strokeWidth="1.1"
      />
      <path d="M-12-5-5-4-5 8-13 7Z" fill={copper} />
      <Cut d="M-11-2-7-1m3 6 8-2" />
    </g>
  );
}

function Bash({ upgraded = false }: { upgraded?: boolean }) {
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d="M16 105h119" stroke={copper} strokeWidth="1" opacity=".5" />
      {/* Cloth streams opposite the planted charge; the far arm stays behind the chest. */}
      <path d="M52 35Q34 40 15 71L34 65 21 89 57 77 76 55Z" fill={cloth} />
      <path d="M47 46 25 67 43 62 34 78 61 65Z" fill={copper} />
      <path d="M65 54 48 67 42 85 28 98 34 105 51 94 62 78 79 72Z" fill={shadow} />
      <path d="M74 69 84 79 83 96 99 101 96 106 74 104 68 85 57 78Z" fill={shade} />
      <path d="M59 43Q69 35 81 47L91 67 71 81 53 66Z" fill={skin} />
      <path d="M60 48 69 62 79 65 71 76 56 65Z" fill={skinShade} />
      <path d="M65 70 81 65 86 73 69 82 55 74Z" fill={copper} />
      <path d="m68 72 7-3 3 7-7 3Z" fill={ink} />
      <path d="M59 46Q47 44 43 57L47 70 58 66 53 58 64 54Z" fill={skinShade} />
      <Mask x={70} y={29} angle={24} scale={0.82} />
      <path
        d={
          upgraded
            ? 'M79 43Q90 42 98 49L113 47 117 59 95 66 80 57Z'
            : 'M77 44Q88 43 94 53L105 53 108 65 91 69 77 57Z'
        }
        fill={skin}
      />
      <path
        d={
          upgraded
            ? 'M87 53 96 58 111 53 114 59 95 64 83 57Z'
            : 'M86 55 93 61 103 59 105 65 91 67 82 59Z'
        }
        fill={skinShade}
      />
      <Gauntlet x={upgraded ? 115 : 105} y={upgraded ? 51 : 58} angle={-12} scale={0.88} />
      {/* A weighted opposing guard gives the impact a material destination. */}
      <path
        d={
          upgraded
            ? 'M133 24 147 32 145 67 129 85 120 70 128 54 121 38Z'
            : 'M128 27 148 33 146 72 132 87 115 72 114 40Z'
        }
        fill={shade}
      />
      <path
        d={
          upgraded
            ? 'M135 31 142 35 139 66 130 77 128 67 135 53 129 39Z'
            : 'M128 34 141 38 139 68 131 79 121 68 120 43Z'
        }
        fill={metal}
      />
      <path
        d={upgraded ? 'm127 36 7 14-12 10 10 8-7 15' : 'm124 43 8 8-5 12 7 9'}
        fill="none"
        stroke={shadow}
        strokeWidth="2"
      />
      <path
        d={upgraded ? 'm119 31-4-9m9 2 2-8m21 69 5 4m-24 2-3 9' : 'm115 35-4-6m34 47 6 4'}
        fill="none"
        stroke={copper}
        strokeWidth="1.5"
      />
      <Cut d="m47 88 6-8M79 88l1 7M58 48l8 5m11 7 5-3" color={metal} />
      <Cut d="M35 57 49 46m-15 28 14-9M29 101l7-2" color={copper} />
    </g>
  );
}

function Uppercut({ upgraded = false }: { upgraded?: boolean }) {
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d="M31 103q34 8 72 0" fill="none" stroke={copper} strokeWidth="1" opacity=".5" />
      <path
        d={upgraded ? 'M48 75Q14 54 53 20 22 57 63 66Z' : 'M51 81Q18 64 39 36 25 63 62 69Z'}
        fill={copper}
        opacity=".35"
      />
      <path d="M69 40Q42 46 38 67L24 88 49 80 45 99 73 87 91 61Z" fill={cloth} />
      <path d="M54 55Q43 71 36 78L55 72 52 87 70 76Z" fill={copper} />
      <path d="M61 74 46 91 45 104 57 105 62 95 79 89 86 74Z" fill={shadow} />
      <path d="M77 78 84 90 86 102 104 105 108 100 97 94 95 78Z" fill={shade} />
      <path d="M69 40Q82 39 92 52L89 78 69 88 54 74 59 53Z" fill={skin} />
      <path d="M67 48 71 62 84 63 80 76 64 81 57 71 62 55Z" fill={skinShade} />
      <path d="M59 76 83 68 91 76 68 88 56 83Z" fill={copper} />
      <path d="m68 78 7-3 3 6-7 4Z" fill={ink} />
      <Mask x={78} y={upgraded ? 34 : 37} angle={upgraded ? -20 : -8} scale={0.78} />
      <path d="M60 50Q47 55 49 66L64 74 75 68 71 60 63 63 58 60 67 54Z" fill={skin} />
      <Gauntlet x={72} y={64} angle={-16} scale={0.62} />
      <path
        d={
          upgraded
            ? 'M88 47Q98 54 106 48L119 21 109 15 94 38 83 38Z'
            : 'M87 49Q96 58 104 51L115 31 105 24 93 41 82 40Z'
        }
        fill={skin}
      />
      <path
        d={
          upgraded
            ? 'M94 47 102 45 113 19 119 21 106 48 99 52Z'
            : 'M93 49 100 46 109 28 115 31 104 51 98 54Z'
        }
        fill={skinShade}
      />
      <Gauntlet
        x={upgraded ? 117 : 112}
        y={upgraded ? 19 : 28}
        angle={upgraded ? -65 : -55}
        scale={0.91}
      />
      <path
        d={
          upgraded
            ? 'M115 9q-36 12-29 44M125 21l10-6m-18-10 2-4m-20 19-7-4'
            : 'M111 18q-24 6-20 26m33-10 10-4'
        }
        fill="none"
        stroke={ink}
        strokeWidth="1"
        opacity=".65"
      />
      <Cut d="m58 59 4-7m17 11 6-6M49 97l7-4m35 3 3 5" color={metal} />
      <Cut d="m47 63 7-10m-9 29 11-11M74 51l3 5" color={copper} />
    </g>
  );
}

export const physicalActionScenes: Record<string, ReactNode> = {
  bash: <Bash />,
  uppercut: <Uppercut />,
};

export const physicalActionUpgrades: Record<string, ReactNode> = {
  bash: <Bash upgraded />,
  uppercut: <Uppercut upgraded />,
};
