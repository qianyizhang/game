import type { ComponentProps, ReactNode } from 'react';
import { ArtGlyph, ArtScene } from '../../../shared/art/CardArt';
import type { CardDefinition } from '../domain/types';

// A restrained print palette: lit edges, broad shadow planes, and one warm accent.
const ink = '#dfd0b0';
const metal = '#a9b4aa';
const shadow = '#172928';
const shade = '#4c5b55';
const copper = '#b97c5e';
const sea = '#80a69c';
type GlyphKind = ComponentProps<typeof ArtGlyph>['kind'];

function Glyph({
  kind,
  x = 48,
  y = 21,
  size = 68,
  color = ink,
}: {
  kind: GlyphKind;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
}) {
  // Emberpath uses a continuous silhouette language for its large focal symbols.
  const figures: Partial<Record<GlyphKind, ReactNode>> = {
    shield: (
      <>
        <path d="M32 3 56 12 53 38Q49 51 32 61Q14 50 10 37L8 12Z" fill={color} />
        <path d="M32 8 51 15 48 36Q43 47 32 55Z" fill={shade} />
        <path d="M13 15 32 8V55Q20 46 15 35Z" fill={metal} />
        <path d="M16 17 32 11 48 17M32 12V51" fill="none" stroke={ink} strokeWidth=".8" />
        <path d="M32 20 40 29 32 41 25 29Z" fill={shadow} />
        <path d="m32 20 0 21 8-12Z" fill={copper} />
        <path d="M12 12 32 5 54 13" fill="none" stroke={ink} strokeWidth="1.1" />
      </>
    ),
    flame: (
      <>
        <path
          d="M30 62C12 59 7 46 16 29C13 43 20 44 23 39C28 28 20 19 38 2C31 23 53 27 48 42C56 34 51 27 55 21C62 40 58 59 42 62Z"
          fill={color}
        />
        <path d="M33 58C21 48 42 40 36 24C52 39 48 50 33 58Z" fill={shadow} />
        <path d="M30 55C26 46 35 39 34 34C41 43 35 50 30 55Z" fill={ink} opacity=".68" />
        <path
          d="M17 49Q13 39 18 32M39 8Q34 17 38 25"
          fill="none"
          stroke={ink}
          strokeWidth=".65"
          opacity=".7"
        />
      </>
    ),
    eye: (
      <>
        <path d="M3 33Q30 7 61 28Q44 21 30 23Q17 24 3 33Z" fill={color} />
        <path d="M4 34Q31 53 60 29Q48 49 29 49Q14 47 4 34Z" fill={shade} />
        <path d="M8 33Q31 18 56 29Q35 46 8 33Z" fill={shadow} />
        <path d="M29 22Q15 36 30 44Q42 37 38 26Z" fill={color} />
        <path d="M29 25 32 42 35 25Z" fill={shadow} />
        <path d="M30 25 34 26" stroke={ink} strokeWidth="1" />
        <path d="M9 22 17 18M49 45 55 40" stroke={color} strokeWidth=".8" opacity=".55" />
      </>
    ),
    heart: (
      <>
        <path
          d="M29 11 33 4 42 5 40 17Q56 19 53 36Q50 51 30 60Q11 49 12 33Q13 16 24 20L22 12Z"
          fill={color}
        />
        <path d="M33 21Q46 16 48 31Q47 47 30 57L33 39Z" fill={shade} />
        <path
          d="M23 23Q15 33 21 44M30 19 30 9M35 23 40 12M32 32 23 43M32 37 42 43"
          fill="none"
          stroke={ink}
          strokeWidth=".9"
          opacity=".6"
        />
        <path d="M25 21 34 25 29 37Z" fill={ink} opacity=".3" />
      </>
    ),
    claw: (
      <>
        <path d="M7 24 19 18 43 23 56 35 47 44 24 38Z" fill={shade} />
        <path d="M17 20Q27 40 10 62Q34 45 30 27Z" fill={color} />
        <path d="M31 24Q41 42 24 63Q49 50 44 30Z" fill={color} />
        <path d="M45 31Q54 47 43 60Q61 50 56 36Z" fill={color} />
        <path
          d="M20 22Q30 38 17 54M35 27Q45 43 31 56M48 34Q57 46 48 54"
          fill="none"
          stroke={copper}
          strokeWidth=".7"
        />
      </>
    ),
    fang: (
      <>
        <path d="M7 14Q31 6 56 13L52 26 46 29 39 20 24 23 17 30 10 27Z" fill={shade} />
        <path d="M14 20 26 23 19 48 13 34Z" fill={color} />
        <path d="M41 20 52 18 51 34 45 48Z" fill={color} />
        <path d="M12 47Q34 61 54 42L51 54Q32 66 15 57Z" fill={color} />
        <path d="M21 26 18 39M47 23 48 35" stroke={ink} strokeWidth=".8" />
      </>
    ),
    bolt: (
      <>
        <path d="M39 3 13 37 29 35 20 61 52 23 35 27Z" fill={color} />
        <path d="M39 3 28 31 46 27 20 61 38 32 20 34Z" fill={ink} opacity=".55" />
      </>
    ),
  };
  if (figures[kind])
    return <g transform={`translate(${x} ${y}) scale(${size / 64})`}>{figures[kind]}</g>;
  return (
    <g opacity={size < 40 ? 0.42 : 0.85}>
      <ArtGlyph kind={kind} x={x} y={y} size={size} color={color} accent={shade} />
    </g>
  );
}
function Rays({ x = 80, y = 53, radius = 32 }: { x?: number; y?: number; radius?: number }) {
  return (
    <g fill="none" stroke={ink} strokeWidth=".55" opacity=".23">
      <circle cx={x} cy={y} r={radius} />
      <path
        d={`M${x - radius - 6} ${y}h12M${x + radius - 6} ${y}h12M${x} ${y - radius - 6}v12M${x} ${y + radius - 6}v12`}
      />
    </g>
  );
}
function Echo({ children }: { children: ReactNode }) {
  return <g opacity=".26">{children}</g>;
}
function Blade({
  x = 80,
  y = 56,
  angle = 35,
  scale = 1,
  heavy = false,
}: {
  x?: number;
  y?: number;
  angle?: number;
  scale?: number;
  heavy?: boolean;
}) {
  const width = heavy ? 11 : 5;
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      <path
        d={`M 0 -47 L ${width} -28 L ${width - 1} 15 L ${1 - width} 15 L ${-width} -28 Z`}
        fill={metal}
      />
      <path d={`M 0 -47 L ${-width} -28 L ${1 - width} 15 L 0 15 Z`} fill={ink} />
      <path d={`M0-37 2-24 2 13H0Z`} fill={shade} />
      <path d="M-18 16-12 14-6 17H6L12 14 18 16 15 19 6 20H-6L-15 19Z" fill={copper} />
      <path d="M-16 16-9 17H9L16 16" fill="none" stroke={ink} strokeWidth=".65" />
      <path d="M-3 20H3L2 36H-2Z" fill={shade} />
      <path d="M-3 21 3 24-3 27 3 30-2 33" fill="none" stroke={copper} strokeWidth=".75" />
      <path d="M0 35 5 39 0 44-5 39Z" fill={metal} />
      <path d="M0 35-5 39 0 42Z" fill={ink} />
      {heavy && <path d="M-6-15 0-20 6-15 0-10Z" fill="none" stroke={copper} strokeWidth=".7" />}
    </g>
  );
}
function Impact({ x = 100, y = 49, size = 1 }: { x?: number; y?: number; size?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <path
        d="M-28 8 0 0-19-19 4-4 12-28 8-2 30-8 8 3 23 24 4 7-8 29-2 7Z"
        fill={copper}
        opacity=".34"
      />
      <path
        d="m-16 6 13-5m7-4 6-14m-6 25 12 14m-32-33 9 9"
        fill="none"
        stroke={ink}
        strokeWidth=".8"
      />
      <path d="M0-7 4 0 0 7-3 0Z" fill={ink} />
    </g>
  );
}
function Fist({ x = 49, y = 24, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g transform="rotate(-9 34 45)">
        <path d="M11 83 19 59 10 42 13 28 26 17 52 19 64 31 65 45 52 60 41 86Z" fill={shade} />
        <path d="M13 28 26 17 52 19 61 28 51 36 23 38 10 42Z" fill={metal} />
        <path d="M13 28 26 17 52 19 47 23 27 22 19 32Z" fill={ink} />
        <path d="M23 38 51 36 61 28 65 45 52 60 25 63 15 48Z" fill={metal} />
        <path d="M51 36 61 28 65 45 52 60 41 60 45 49Z" fill={shade} />
        <path d="M14 29 24 21 29 27 23 35Z" fill={ink} opacity=".65" />
        <path d="M25 23 34 21 38 28 30 35Z" fill={ink} opacity=".55" />
        <path d="M35 22 44 23 47 29 40 36Z" fill={metal} />
        <path d="M45 24 52 24 59 29 51 35Z" fill={metal} />
        <path
          d="m24 22 6 13m4-14 6 15m4-13 7 12M19 36l33-2"
          fill="none"
          stroke={shade}
          strokeWidth=".7"
        />
        <path
          d="M16 49Q14 41 23 38Q28 37 35 42L46 49Q49 52 42 57L31 61Q22 60 16 49Z"
          fill={metal}
        />
        <path d="M16 47Q15 40 23 38Q28 37 35 42L46 49Q36 45 30 44Q22 43 16 47Z" fill={ink} />
        <path
          d="M17 50Q23 56 31 57L42 53M22 42Q25 40 29 43M29 58l2 3"
          fill="none"
          stroke={shade}
          strokeWidth=".7"
        />
        <path d="M25 63 52 60 48 69 21 73Z" fill={copper} />
        <path d="M21 73 48 69 41 86 11 83Z" fill={shade} />
        <path d="M19 73 24 64 29 64 21 83 14 82Z" fill={metal} />
        <path
          d="M29 66 47 64M27 71 43 69M24 76 41 74M22 81 39 79"
          fill="none"
          stroke={shadow}
          strokeWidth=".7"
        />
        <path d="M17 82 25 64M44 61l-4 1" stroke={ink} strokeWidth=".65" />
        <circle cx="45" cy="66" r="1" fill={ink} />
      </g>
    </g>
  );
}
function Helmet({ x = 80, y = 53, ghost = false }: { x?: number; y?: number; ghost?: boolean }) {
  const light = ghost ? sea : ink;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M-28 9Q-46-16-24-37Q-5-54 14-34L8-28Q-13-42-25-23Z"
        fill={copper}
        opacity={ghost ? 0.4 : 0.8}
      />
      <path
        d="M-28 17-27-8Q-23-32-5-35Q17-36 27-19L24-6 38 0 31 8 33 25 15 35-7 32-19 36Z"
        fill={metal}
      />
      <path d="M-27-8Q-23-32-5-35Q11-35 18-26L-2-22-12-5-13 17-25 26Z" fill={light} />
      <path d="M-2-22 18-26 27-19 24-6 10-2Z" fill={shade} />
      <path d="M-13 17-12-5 10-2 14 10 3 17 8 33-7 32Z" fill={shade} />
      <path d="M10-2 24-6 38 0 26 3 14 7Z" fill={light} />
      <path d="M14 10 31 8 33 25 15 35 8 33 3 17Z" fill={metal} />
      <path d="m15 12 14-1-1 3-12 3Z" fill={shadow} />
      <path d="M16 22 19 29M21 20 24 27M26 18 28 24" stroke={shadow} strokeWidth=".85" />
      <path
        d="M-22-10Q-21-27-4-30M-22 19-19 27M-7-18 4-22M13 34 28 26"
        fill="none"
        stroke={light}
        strokeWidth=".8"
      />
      <path d="M-14 29-12 34-3 34 9 39 25 35 16 43-8 41-21 36Z" fill={copper} opacity=".65" />
      <circle cx="7" cy="7" r="1.2" fill={light} />
    </g>
  );
}
function Cards({ x = 69, y = 33, burning = false }: { x?: number; y?: number; burning?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-17-6 12-12 28 28-3 37Z" fill={shade} />
      <path d="M-11-8 13-11 27 25-1 33Z" fill={copper} opacity=".6" />
      <path d="M-4-10 25-3 17 38-12 31Z" fill={ink} />
      <path d="M-1-6 21-1 14 33-8 28Z" fill="none" stroke={copper} strokeWidth=".6" />
      <path
        d="m7 3-1 19m-6-11 14 3m-11-8 10 15m-12-2 14-8M-3 25l13 3"
        stroke={shade}
        strokeWidth=".75"
      />
      {burning && (
        <>
          <path d="m-12 25 9-2-4 7 10-2 5 9-9-2-5-6Z" fill={shadow} />
          <Glyph kind="flame" x={5} y={13} size={31} color={copper} />
        </>
      )}
    </g>
  );
}
function Wall({ x = 33, y = 31, tall = false }: { x?: number; y?: number; tall?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-7 59 4 15 14 6 26 17V57ZM62 57V17L77 5 89 18 99 59Z" fill={shade} />
      <path
        d={
          tall
            ? 'M6 54V-7H17V1H28V-7H39V1H52V-7H63V1H74V-7H85V54Z'
            : 'M6 52V4H17V12H28V4H39V12H52V4H63V12H74V4H85V52Z'
        }
        fill={metal}
      />
      <path d="M14 12H25V53H14ZM66 12H77V53H66Z" fill={ink} opacity=".8" />
      <path d="M25 20H65V54H25Z" fill={shade} />
      <path d="M36 52V37Q45 22 55 37V52Z" fill={shadow} />
      <path d="M37 38Q45 27 53 37" fill="none" stroke={sea} strokeWidth=".7" />
      <path
        d="M29 28H62M29 42H34M57 42H63M29 50H34M57 50H63M14 24H24M14 40H24M67 24H76M67 40H76"
        stroke={shadow}
        strokeWidth=".65"
      />
      <path d="M-4 59H96" stroke={ink} strokeWidth=".65" opacity=".7" />
    </g>
  );
}
function Wind({ rising = false }: { rising?: boolean }) {
  return (
    <g transform={rising ? 'rotate(-22 80 56)' : undefined}>
      <path
        d="M12 71Q40 27 105 39Q149 46 143 25Q157 51 102 43Q46 35 12 71Z"
        fill={ink}
        opacity=".55"
      />
      <path
        d="M19 88Q64 49 119 56Q154 63 143 40Q161 68 115 61Q64 56 19 88Z"
        fill={copper}
        opacity=".7"
      />
      <path d="M9 55Q38 23 77 29" fill="none" stroke={sea} strokeWidth=".75" opacity=".65" />
    </g>
  );
}
function Blood({ x = 80, y = 54, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M1-35C-3-18-20-3-20 12Q-20 31 0 34Q21 32 22 14C24 0 4-20 1-35Z" fill={copper} />
      <path d="M1-35C1-14 20 3 17 17Q14 30 0 34Q22 30 22 14C24 0 4-20 1-35Z" fill={shade} />
      <path d="M-3-14-13 10-6 25 1 2Z" fill={ink} opacity=".2" />
      <path d="M-14 11Q-16 22-9 26" stroke={ink} strokeWidth=".8" fill="none" opacity=".75" />
    </g>
  );
}
function Shackles({ broken = false }: { broken?: boolean }) {
  return (
    <g>
      <path
        d="m21 45 13-10 21 5 10 16-4 24-21 10-19-12-7-21ZM99 53l12-15 22-2 15 13 2 25-18 15-23-5Z"
        fill={metal}
      />
      <path
        d="m28 48 8-7 15 4 6 13-3 17-14 7-13-8-5-17ZM106 55l9-11 15-1 11 9 1 18-13 11-16-4Z"
        fill={shadow}
      />
      <path d="m21 45 13-10 21 5-4 5-15-4-8 7ZM99 53l12-15 22-2-3 7-15 1-9 11Z" fill={ink} />
      <path d="m21 78 19 12 21-10-7-5-14 7-13-8ZM109 84l23 5 18-15-8-4-13 11-16-4Z" fill={shade} />
      <g fill="none" stroke={copper} strokeWidth="2.8">
        <path
          d={
            broken
              ? 'M59 58q10-10 15-3l-3 7M99 62q-12 9-14 0l3-8'
              : 'M59 58q9-10 16-2l-1 8q-12 10-16 0ZM75 59q10-10 17-2l-1 8q-12 10-16 0ZM92 60q10-8 14 0l-3 8q-12 8-13 0Z'
          }
        />
      </g>
      {broken && (
        <path
          d="m77 44 2-9m3 41 1 10m-9-18-8 5m28-19 7-4"
          stroke={ink}
          strokeWidth=".65"
          opacity=".7"
        />
      )}
      <path d="M23 48 20 55M102 51l6-7M54 78l-9 5M136 79l6-7" stroke={ink} strokeWidth=".65" />
    </g>
  );
}
function Scythe() {
  return (
    <g>
      <path d="M71 99 94 18" stroke={shade} strokeWidth="4" />
      <path d="M70 98 93 18" stroke={ink} strokeWidth="1.3" />
      <path d="M95 20Q48-4 17 58Q47 23 94 29Z" fill={metal} />
      <path d="M95 20Q47-2 17 58Q49 13 94 24Z" fill={ink} />
      <path d="M92 22Q59 10 29 39" fill="none" stroke={copper} strokeWidth=".75" />
      <path d="m75 75 5 1m-4-6 5 2m-4-8 5 2" stroke={copper} strokeWidth="1.5" />
    </g>
  );
}
function Cloak({ demon = false }: { demon?: boolean }) {
  return (
    <g>
      <path
        d="M28 102Q45 72 50 44L64 29 83 29 98 47 108 66Q113 84 145 101Z"
        fill={demon ? copper : shade}
      />
      <path d="M64 31 52 47 51 68 31 102 64 94 72 61 79 34Z" fill={demon ? shade : metal} />
      <path d="M83 33 98 49 98 71 119 101 95 94 81 58Z" fill={demon ? shadow : sea} opacity=".65" />
      <path d="M70 53 65 94 81 103 89 94 82 53Z" fill={shadow} />
      <path d="M50 44Q48 20 67 9Q87 4 95 28L89 43 79 37 65 42Z" fill={demon ? copper : metal} />
      <path d="M67 9Q87 4 95 28L89 43 79 37 81 22Z" fill={shade} />
      <path d="M56 34 65 20 80 18 89 30 78 40 64 39Z" fill={shadow} />
      <path
        d="M56 32 65 20 80 18M52 49 49 72 37 94M86 55 94 84 103 93M66 71 61 92"
        fill="none"
        stroke={ink}
        strokeWidth=".7"
        opacity=".55"
      />
      <path d="M57 47 64 41 70 48 64 54Z" fill={copper} />
      {demon && (
        <>
          <path d="M62 21Q36 11 45-5Q43 9 69 12ZM84 14Q112 5 112-4Q121 13 91 24Z" fill={metal} />
          <path d="M65 19 79 13 88 22 83 31 77 40 68 32Z" fill={shade} />
          <path d="M65 19 79 13 76 24 69 26 68 32Z" fill={ink} />
          <path d="m76 24 7-3-1 5-5 2ZM77 29l-3 6 5-2Z" fill={shadow} />
          <path d="M98 47 111 38 109 58 121 63 106 69Z" fill={metal} />
        </>
      )}
    </g>
  );
}

// Art is a single focal scene, with supporting symbols treated as quiet engraved echoes.
const scenes: Record<string, ReactNode> = {
  strike: (
    <>
      <Echo>
        <path d="M11 90 139 16 120 47Z" fill={copper} />
      </Echo>
      <Impact x={116} y={31} size={0.5} />
      <Blade x={81} y={58} angle={42} scale={1.05} />
    </>
  ),
  defend: (
    <>
      <Rays radius={40} />
      <Glyph kind="shield" x={36} y={12} size={89} />
      <Echo>
        <Glyph kind="leaf" x={13} y={62} size={33} color={sea} />
        <Glyph kind="leaf" x={113} y={62} size={33} color={sea} />
      </Echo>
    </>
  ),
  bash: (
    <>
      <Echo>
        <Glyph kind="shield" x={83} y={20} size={77} color={copper} />
      </Echo>
      <Fist x={33} y={9} scale={1.05} />
      <Impact x={108} y={52} size={0.45} />
    </>
  ),
  anger: (
    <>
      <Echo>
        <Glyph kind="flame" x={22} y={0} size={118} color={copper} />
      </Echo>
      <Fist x={47} y={14} scale={1.02} />
    </>
  ),
  bodySlam: (
    <>
      <Echo>
        <path d="M12 90 147 77 130 92 19 99Z" fill={copper} />
        <Impact x={107} y={83} />
      </Echo>
      <g transform="rotate(15 80 56)">
        <Glyph kind="shield" x={35} y={8} size={90} />
      </g>
    </>
  ),
  clash: (
    <>
      <Impact x={79} y={41} size={0.6} />
      <Blade x={61} y={62} angle={42} scale={0.98} />
      <Blade x={104} y={62} angle={-42} scale={0.98} />
    </>
  ),
  cleave: (
    <>
      <path d="M10 86Q65-8 151 53Q77 2 10 86Z" fill={copper} opacity=".5" />
      <Blade x={84} y={61} angle={67} scale={1.1} />
    </>
  ),
  clothesline: (
    <>
      <path d="M7 48 103 35 119 43 114 61 6 65Z" fill={shade} />
      <path d="M7 48 103 35 106 43 7 56Z" fill={metal} />
      <path d="m35 45 2 15m10-16 2 14m10-16 2 14" stroke={copper} strokeWidth=".9" />
      <g transform="rotate(67 95 48)">
        <Fist x={73} y={18} scale={0.65} />
      </g>
      <Impact x={135} y={58} size={0.45} />
    </>
  ),
  flex: (
    <>
      <Rays radius={40} />
      <Fist x={44} y={8} scale={1.12} />
    </>
  ),
  headbutt: (
    <>
      <Echo>
        <Cards x={109} y={32} />
      </Echo>
      <Impact x={114} y={52} size={0.5} />
      <Helmet x={71} y={59} />
    </>
  ),
  heavyBlade: (
    <>
      <Echo>
        <path d="M23 99 61 77H119L139 99Z" fill={metal} />
      </Echo>
      <Blade x={82} y={54} angle={15} scale={1.05} heavy />
    </>
  ),
  ironWave: (
    <>
      <Echo>
        <Glyph kind="shield" x={15} y={32} size={60} color={sea} />
      </Echo>
      <path d="M8 94Q40 73 76 87T150 77Q120 103 77 91T8 94Z" fill={sea} opacity=".4" />
      <Blade x={97} y={56} angle={53} scale={1.05} />
    </>
  ),
  perfectedStrike: (
    <>
      <Rays radius={40} />
      <Echo>
        <Blade x={39} y={59} angle={-19} scale={0.65} />
        <Blade x={123} y={59} angle={19} scale={0.65} />
      </Echo>
      <Blade x={80} y={55} angle={0} scale={1.04} heavy />
    </>
  ),
  pommelStrike: (
    <>
      <Echo>
        <Cards x={33} y={52} />
      </Echo>
      <Blade x={101} y={41} angle={154} scale={1.08} />
      <Impact x={99} y={79} size={0.5} />
    </>
  ),
  shrugItOff: (
    <>
      <Echo>
        <path d="M25 16 37 40M132 22l-10 25" stroke={copper} strokeWidth="1.4" />
        <Cards x={32} y={74} />
      </Echo>
      <Helmet x={80} y={57} />
    </>
  ),
  swordBoomerang: (
    <>
      <path
        d="M35 79C-4 18 151-1 144 60Q139 84 112 89"
        fill="none"
        stroke={copper}
        strokeWidth=".85"
        opacity=".65"
      />
      <Blade x={79} y={51} angle={65} scale={1.12} />
    </>
  ),
  thunderclap: (
    <>
      <Echo>
        <path d="M9 88 45 62 71 86 110 64 151 92" fill="none" stroke={copper} strokeWidth="1" />
        <Impact x={80} y={85} size={1.15} />
      </Echo>
      <Glyph kind="bolt" x={36} y={3} size={93} color={ink} />
    </>
  ),
  trueGrit: (
    <>
      <Rays radius={38} />
      <Echo>
        <Cards x={117} y={57} burning />
      </Echo>
      <Glyph kind="shield" x={28} y={8} size={96} />
    </>
  ),
  twinStrike: (
    <>
      <Echo>
        <path d="M15 91 68 24M81 94 140 25" stroke={copper} strokeWidth="1" />
      </Echo>
      <Blade x={50} y={54} angle={29} scale={0.94} />
      <Blade x={111} y={56} angle={29} scale={0.94} />
    </>
  ),
  wildStrike: (
    <>
      <Echo>
        <path d="m16 38 20 55m-1-66 21 66" stroke={copper} strokeWidth="1" />
        <Blood x={130} y={84} scale={0.33} />
      </Echo>
      <Glyph kind="claw" x={24} y={-4} size={110} />
    </>
  ),
  battleTrance: (
    <>
      <Rays radius={40} />
      <Glyph kind="eye" x={17} y={-1} size={127} />
      <Echo>
        <Cards x={68} y={73} />
      </Echo>
    </>
  ),
  bloodletting: (
    <>
      <Rays x={68} radius={35} />
      <Echo>
        <Glyph kind="bolt" x={98} y={27} size={54} color={sea} />
      </Echo>
      <Blood x={70} y={53} scale={1.13} />
      <path d="M39 88 108 15" stroke={ink} strokeWidth=".65" opacity=".45" />
    </>
  ),
  burningPact: (
    <>
      <Rays radius={38} />
      <Cards x={73} y={23} burning />
      <Echo>
        <Glyph kind="flame" x={54} y={39} size={72} color={copper} />
      </Echo>
    </>
  ),
  carnage: (
    <>
      <Echo>
        <Impact x={80} y={53} size={1.5} />
        <Glyph kind="skull" x={18} y={22} size={58} />
      </Echo>
      <Blade x={97} y={53} angle={-26} scale={1.05} heavy />
    </>
  ),
  combust: (
    <>
      <Rays radius={41} />
      <Echo>
        <Glyph kind="sun" x={20} y={0} size={119} color={copper} />
      </Echo>
      <Glyph kind="flame" x={36} y={3} size={89} color={ink} />
    </>
  ),
  darkEmbrace: (
    <>
      <Echo>
        <Glyph kind="moon" x={17} y={-4} size={111} color={sea} />
        <Cards x={29} y={77} burning />
      </Echo>
      <Cloak />
    </>
  ),
  disarm: (
    <>
      <Echo>
        <Shackles broken />
      </Echo>
      <Blade x={78} y={48} angle={74} scale={1.06} />
    </>
  ),
  entrench: (
    <>
      <Wall x={32} y={22} tall />
      <Echo>
        <Glyph kind="shield" x={60} y={53} size={42} />
      </Echo>
    </>
  ),
  feelNoPain: (
    <>
      <Rays radius={41} />
      <Glyph kind="shield" x={31} y={8} size={98} />
      <g opacity=".65">
        <Glyph kind="heart" x={61} y={32} size={43} color={copper} />
      </g>
    </>
  ),
  fireBreathing: (
    <>
      <Echo>
        <path d="M97 48Q118 27 152 34Q127 43 115 62Q136 48 155 70Q124 63 100 73Z" fill={copper} />
      </Echo>
      <Helmet x={66} y={56} />
      <Glyph kind="flame" x={91} y={36} size={59} color={copper} />
    </>
  ),
  flameBarrier: (
    <>
      <Echo>
        <Glyph kind="flame" x={4} y={3} size={96} color={copper} />
        <Glyph kind="flame" x={65} y={2} size={95} color={copper} />
      </Echo>
      <Glyph kind="shield" x={42} y={15} size={84} />
    </>
  ),
  ghostlyArmor: (
    <>
      <Echo>
        <path
          d="M18 91Q74 80 143 93M32 101Q87 89 136 101"
          fill="none"
          stroke={sea}
          strokeWidth=".8"
        />
        <Glyph kind="moon" x={119} y={12} size={26} />
      </Echo>
      <Helmet x={77} y={55} ghost />
    </>
  ),
  hemokinesis: (
    <>
      <Rays radius={41} />
      <path d="M29 95 130 12M20 22 137 89" stroke={copper} strokeWidth=".7" opacity=".42" />
      <Blood x={80} y={50} scale={1.15} />
    </>
  ),
  inflame: (
    <>
      <Echo>
        <Glyph kind="flame" x={20} y={-4} size={118} color={copper} />
      </Echo>
      <Blade x={81} y={55} angle={0} scale={1.04} />
    </>
  ),
  intimidate: (
    <>
      <Rays radius={40} />
      <Glyph kind="eye" x={-1} y={-6} size={163} color={sea} />
      <Echo>
        <Glyph kind="fang" x={58} y={60} size={48} />
      </Echo>
    </>
  ),
  metallicize: (
    <>
      <Rays radius={41} />
      <Echo>
        <Glyph kind="gear" x={17} y={63} size={32} color={copper} />
        <Glyph kind="gear" x={113} y={70} size={27} color={copper} />
      </Echo>
      <Helmet x={78} y={55} />
    </>
  ),
  powerThrough: (
    <>
      <Echo>
        <Wall x={26} y={45} />
        <Blood x={130} y={24} scale={0.28} />
      </Echo>
      <Fist x={49} y={6} scale={1.07} />
    </>
  ),
  pummel: (
    <>
      <Echo>
        <Impact x={119} y={43} size={0.75} />
        <Impact x={31} y={30} size={0.4} />
        <path d="M11 85H42M17 92H51" stroke={copper} strokeWidth=".9" />
      </Echo>
      <Fist x={43} y={13} scale={1.03} />
    </>
  ),
  rage: (
    <>
      <Echo>
        <Glyph kind="shield" x={20} y={24} size={79} color={sea} />
        <Glyph kind="flame" x={110} y={45} size={45} color={copper} />
      </Echo>
      <Fist x={54} y={11} scale={1.04} />
    </>
  ),
  rupture: (
    <>
      <Rays radius={41} />
      <Glyph kind="heart" x={29} y={-1} size={99} color={copper} />
      <path d="m81 31-10 13 13 8-13 16" fill="none" stroke={shadow} strokeWidth="1.7" />
    </>
  ),
  secondWind: (
    <>
      <Wind rising />
      <Glyph kind="feather" x={49} y={16} size={79} color={sea} />
      <Echo>
        <Cards x={22} y={83} />
      </Echo>
    </>
  ),
  seeingRed: (
    <>
      <Rays radius={41} />
      <Glyph kind="eye" x={5} y={-3} size={146} color={copper} />
      <Glyph kind="bolt" x={68} y={32} size={30} />
    </>
  ),
  sentinel: (
    <>
      <Echo>
        <Wall x={32} y={44} tall />
      </Echo>
      <Helmet x={77} y={44} />
      <Echo>
        <Glyph kind="bolt" x={72} y={80} size={25} color={copper} />
      </Echo>
    </>
  ),
  shockwave: (
    <>
      <g fill="none" stroke={sea} strokeWidth=".9" opacity=".62">
        <ellipse cx="81" cy="79" rx="33" ry="8" />
        <ellipse cx="81" cy="80" rx="55" ry="16" />
        <path d="M8 83Q1 47 53 51M152 83Q156 52 110 51" />
      </g>
      <Glyph kind="bolt" x={44} y={-2} size={77} />
      <path d="M66 80H96" stroke={ink} strokeWidth=".8" />
    </>
  ),
  uppercut: (
    <>
      <path d="M24 103Q20 44 96 14Q40 52 40 103Z" fill={copper} opacity=".5" />
      <Echo>
        <Impact x={114} y={32} size={0.65} />
      </Echo>
      <Fist x={68} y={4} scale={1.03} />
    </>
  ),
  whirlwind: (
    <>
      <Wind />
      <Echo>
        <Blade x={106} y={72} angle={-52} scale={0.68} />
      </Echo>
      <Blade x={73} y={49} angle={67} scale={1.01} />
    </>
  ),
  barricade: (
    <>
      <Rays radius={41} />
      <Wall x={31} y={22} tall />
      <Glyph kind="shield" x={60} y={44} size={41} color={ink} />
    </>
  ),
  bludgeon: (
    <>
      <Echo>
        <Impact x={111} y={86} size={0.7} />
      </Echo>
      <g transform="rotate(-31 80 50)">
        <path d="M77 22H82V100H77Z" fill={shade} />
        <path d="M78 26V100" stroke={ink} strokeWidth=".85" />
        <path d="M48 15 100 7 116 23 113 46 57 51 42 36Z" fill={metal} />
        <path d="M48 15 100 7 108 17 56 25Z" fill={ink} />
        <path d="M56 25 108 17 113 46 57 51Z" fill={shade} />
        <path d="M42 36 48 15 56 25 57 51Z" fill={copper} />
        <path d="m67 25 2 23m15-26 2 23m15-25 2 22" stroke={metal} strokeWidth="1" />
        <path d="m77 73 6 2m-6 4 6 2m-6 4 6 2m-6 4 6 2" stroke={copper} strokeWidth="1.3" />
      </g>
    </>
  ),
  corruption: (
    <>
      <Rays radius={41} />
      <Echo>
        <Cards x={34} y={76} burning />
        <Glyph kind="claw" x={105} y={42} size={55} />
      </Echo>
      <Glyph kind="eye" x={9} y={-8} size={142} color={copper} />
    </>
  ),
  demonForm: (
    <>
      <Echo>
        <Glyph kind="flame" x={-8} y={15} size={83} color={copper} />
        <Glyph kind="flame" x={89} y={15} size={80} color={copper} />
      </Echo>
      <Cloak demon />
    </>
  ),
  feed: (
    <>
      <Rays radius={40} />
      <Glyph kind="fang" x={21} y={3} size={115} />
      <g opacity=".7">
        <Glyph kind="heart" x={65} y={30} size={37} color={copper} />
      </g>
    </>
  ),
  fiendFire: (
    <>
      <Echo>
        <Cards x={21} y={80} burning />
        <Glyph kind="flame" x={93} y={27} size={71} color={copper} />
      </Echo>
      <Glyph kind="claw" x={22} y={-4} size={112} />
    </>
  ),
  immolate: (
    <>
      <Echo>
        <path d="M10 100 30 78 45 94 65 72 84 97 111 76 146 98Z" fill={copper} />
      </Echo>
      <Glyph kind="flame" x={22} y={-12} size={116} color={copper} />
    </>
  ),
  impervious: (
    <>
      <Rays radius={43} />
      <Glyph kind="shield" x={26} y={0} size={110} />
      <Echo>
        <path d="M12 32 31 43M9 65 30 61M130 40l17-11M132 68l18 9" stroke={ink} strokeWidth=".7" />
      </Echo>
    </>
  ),
  limitBreak: (
    <>
      <Echo>
        <Shackles broken />
      </Echo>
      <Fist x={47} y={0} scale={1.07} />
    </>
  ),
  offering: (
    <>
      <Rays radius={41} />
      <path d="M36 72Q80 88 126 70L109 89H51Z" fill={metal} />
      <path d="M42 76Q80 94 117 76L107 85H53Z" fill={shade} />
      <path d="M77 86H83V101H77Z" fill={copper} />
      <path d="M61 103 78 98 99 104Z" fill={metal} />
      <Blood x={81} y={39} scale={0.83} />
      <Echo>
        <Cards x={27} y={33} />
      </Echo>
    </>
  ),
  reaper: (
    <>
      <Scythe />
      <Echo>
        <Glyph kind="heart" x={112} y={54} size={34} color={copper} />
        <path d="M111 91Q64 110 25 82" fill="none" stroke={sea} strokeWidth=".75" />
      </Echo>
    </>
  ),
  dazed: (
    <>
      <Rays radius={41} />
      <Echo>
        <path
          d="M19 78Q67 2 136 66Q93 99 36 53Q57 10 118 51"
          fill="none"
          stroke={sea}
          strokeWidth=".85"
        />
      </Echo>
      <Glyph kind="eye" x={16} y={0} size={128} color={metal} />
    </>
  ),
  wound: (
    <>
      <g transform="rotate(-39 80 56)">
        <path d="M64 7H96V105H64Z" fill={metal} />
        <path d="M67 7 88 105H96L76 7Z" fill={ink} opacity=".7" />
        <path
          d="M65 14 95 31M65 32 95 49M65 50 95 67M65 68 95 85M65 86 95 103"
          stroke={shade}
          strokeWidth=".7"
        />
      </g>
      <Blood x={83} y={53} scale={0.58} />
    </>
  ),
  burn: (
    <>
      <Glyph kind="flame" x={26} y={0} size={103} color={shade} />
      <Glyph kind="flame" x={60} y={48} size={44} color={copper} />
      <Echo>
        <path d="M30 98H133" stroke={ink} strokeWidth=".75" />
      </Echo>
    </>
  ),
  slimed: (
    <>
      <path
        d="M18 88Q45 73 48 40Q48 10 76 14Q92 14 91 37Q90 53 110 55Q132 58 137 82Q124 99 97 91Q72 106 48 90Q32 100 18 88Z"
        fill={shade}
      />
      <path
        d="M28 86Q53 76 56 42Q55 19 73 19Q90 20 84 41Q76 66 106 67Q126 68 131 82Q114 90 96 84Q71 97 51 84Z"
        fill={sea}
        opacity=".8"
      />
      <path
        d="M57 43Q55 25 69 23M39 84Q58 84 64 68M110 72Q120 72 125 79"
        fill="none"
        stroke={ink}
        strokeWidth=".8"
        opacity=".6"
      />
      <path d="M77 48Q91 77 71 89Q106 88 102 73Z" fill={shadow} opacity=".3" />
    </>
  ),
  injury: (
    <>
      <Echo>
        <Shackles />
      </Echo>
      <Glyph kind="heart" x={45} y={-3} size={77} color={copper} />
      <path d="m80 29-7 12 12 8-10 13" fill="none" stroke={shadow} strokeWidth="1.7" />
    </>
  ),
  regret: (
    <>
      <Echo>
        <Glyph kind="moon" x={10} y={-12} size={109} color={sea} />
        <Cards x={23} y={87} />
      </Echo>
      <Cloak />
    </>
  ),
};

export function AbilityArt({
  definition,
  upgraded = false,
  className = '',
}: {
  definition: CardDefinition;
  upgraded?: boolean;
  className?: string;
}) {
  const palette =
    definition.kind === 'attack'
      ? 'ember'
      : definition.kind === 'skill'
        ? 'tide'
        : definition.kind === 'power'
          ? 'gold'
          : 'slate';
  return (
    <ArtScene
      className={`ember-illustration ${className}`}
      palette={palette}
      variant={
        definition.kind === 'power'
          ? 'runes'
          : definition.kind === 'status' || definition.kind === 'curse'
            ? 'night'
            : 'hills'
      }
    >
      {scenes[definition.id] ?? <Glyph kind="book" />}
      {upgraded && (
        <g fill="none" stroke={ink} strokeWidth=".7" opacity=".6">
          <path d="M8 22V8H22M138 8H152V22M8 90V104H22M138 104H152V90" />
          <path d="m135 10 3 4 4-4-4-4Z" fill={copper} />
        </g>
      )}
    </ArtScene>
  );
}
