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
  // Spire uses continuous silhouettes for its large focal symbols.
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
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="rotate(-12 33 47)">
        {/* Four curling fingers, a crossing thumb, and overlapping wrist lames. */}
        <path
          d="M12 83L19 60Q11 53 9 44L8 30Q7 22 14 19Q18 15 24 16Q27 9 35 12Q42 9 48 16Q56 15 60 24L61 36Q59 50 49 60L49 84Z"
          fill={shadow}
        />
        <path d="M15 39L51 30L58 34Q59 49 46 59L23 62L14 48Z" fill={shade} />
        <path d="M12 28Q11 22 17 21Q22 19 25 24L26 38L23 46L16 45Z" fill={metal} />
        <path d="M25 21Q24 15 30 15Q36 13 38 19L38 37L34 42L27 41Z" fill={metal} />
        <path d="M38 20Q38 15 43 16Q48 17 49 23L49 35L44 40L38 38Z" fill={metal} />
        <path d="M49 24Q49 19 54 22Q58 25 58 29L56 36L49 38Z" fill={metal} />
        <path
          d="M12 28Q13 22 18 23L23 26L23 31L14 32ZM26 21Q27 16 32 17L36 21V27L27 27ZM40 21Q43 18 46 23L47 28L40 28ZM51 25Q54 22 56 28L56 31L51 32Z"
          fill={ink}
        />
        <path
          d="M14 34L23 33M16 39L24 38M28 30L36 30M28 35H35M41 31L47 31M40 35L46 35M51 34L55 33"
          fill="none"
          stroke={shade}
          strokeWidth=".75"
        />
        <path
          d="M17 46L23 47L27 43L33 44L39 40L44 42L51 39Q49 50 42 53L33 58L24 57Z"
          fill={metal}
        />
        <path
          d="M14 36Q17 34 21 36L31 43Q35 43 39 47Q42 51 38 54L31 58Q22 58 18 52L12 44Q10 38 14 36Z"
          fill={shade}
        />
        <path
          d="M14 37Q17 35 21 38L28 44Q35 44 38 48L37 52L30 56Q24 56 21 52L14 44Q12 40 14 37Z"
          fill={metal}
        />
        <path d="M14 38Q17 36 20 39L27 45L35 47L37 50L30 48L22 45L16 40Z" fill={ink} />
        <path d="M23 46Q26 46 28 49M30 55L33 50" fill="none" stroke={shade} strokeWidth=".8" />
        <path d="M22 61L46 58L48 65Q32 73 18 68Z" fill={copper} />
        <path d="M19 68Q33 73 48 65L49 72Q34 80 16 75Z" fill={metal} />
        <path d="M17 74Q31 80 49 72L51 83Q34 91 12 83Z" fill={shade} />
        <path d="M20 70L16 81Q23 84 28 83L29 75Z" fill={metal} />
        <path
          d="M22 62Q33 65 45 60M20 69Q33 73 47 67M17 76Q34 82 49 75M17 82L26 84"
          fill="none"
          stroke={ink}
          strokeWidth=".65"
        />
        <circle cx="42" cy="63" r="1" fill={ink} />
        <circle cx="25" cy="64" r=".9" fill={ink} />
      </g>
    </g>
  );
}
function Helmet({ x = 80, y = 53, ghost = false }: { x?: number; y?: number; ghost?: boolean }) {
  const light = ghost ? sea : ink;
  return (
    <g transform={`translate(${x} ${y})`} strokeLinecap="round" strokeLinejoin="round">
      {/* Curved skull, pivoting visor, cheek plate and nested gorget form an actual suit of armor. */}
      <path d="M-30-7Q-42-26-26-41Q-9-53 8-42L14-35Q-11-44-22-29Z" fill={ghost ? shade : copper} />
      <path
        d="M-29-19Q-34-31-21-39Q-8-45 3-40"
        fill="none"
        stroke={light}
        strokeWidth=".65"
        opacity=".55"
      />
      <path
        d="M-29 13Q-34-7-23-27Q-14-41 6-35Q24-31 29-16L32-7L37-3L34 11Q29 29 13 37L-10 34L-28 23Z"
        fill={shadow}
      />
      <path
        d="M-26 10Q-31-8-21-24Q-12-36 6-31Q20-28 25-15L28-6L18 0L-6 7L-12 25L-24 20Z"
        fill={metal}
      />
      <path
        d="M-25 2Q-26-17-13-26Q-5-32 7-29Q-9-27-11-12L-10-1L-18 9L-18 21L-25 18Z"
        fill={light}
      />
      <path d="M-3-31Q7-31 17-23L25-13L15-10L3-13L-5-10Q-8-22-3-31Z" fill={shade} />
      <path d="M-5-29Q0-21 0-10M-23-8Q-22-19-13-25" fill="none" stroke={light} strokeWidth=".8" />
      <path d="M-13 1Q5-6 25-12L34-5L31 1Q7 6-9 9Z" fill={shadow} />
      <path d="M-12 0Q6-9 25-13L32-7Q13-8-8 4Z" fill={light} />
      <path d="M-6 9Q14 7 33-2L30 16Q24 30 11 33L-5 24Z" fill={metal} />
      <path d="M14 8L33-2L30 16Q23 29 13 32L15 21Z" fill={shade} />
      <path d="M-3 11Q4 11 12 8L11 22L5 28L-2 23Z" fill={light} opacity=".75" />
      <path d="M-12 6Q-2 3 0 11Q-1 17-9 19L-14 28L-23 23L-22 14Z" fill={shade} />
      <circle cx="-8" cy="11" r="4.2" fill={metal} />
      <circle cx="-8" cy="11" r="2.7" fill={light} />
      <circle cx="-8" cy="11" r="1" fill={shade} />
      <path
        d="M-21 25L-7 31L11 35L27 26L24 33L11 40L-9 36L-25 30Z"
        fill={copper}
        opacity={ghost ? '.45' : '.85'}
      />
      <path d="M-23 31L-8 36L11 40L24 34L22 40L10 45L-10 41L-28 36Z" fill={shade} />
      <path
        d="M-22 31L-8 36L10 40L22 36M-25 36L-10 41L10 45M17 29Q25 23 28 14"
        fill="none"
        stroke={light}
        strokeWidth=".7"
      />
      <g fill={shadow}>
        <ellipse cx="19" cy="14" rx=".9" ry="1.2" />
        <ellipse cx="24" cy="11" rx=".8" ry="1.1" />
        <ellipse cx="18" cy="20" rx=".9" ry="1.1" />
        <ellipse cx="23" cy="17" rx=".8" ry="1.1" />
      </g>
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
  const cloth = demon ? '#aa6b55' : '#66857e';
  const lit = demon ? '#d29a72' : '#a6bab0';
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M22 105Q39 82 45 56Q47 40 62 33L87 31Q107 44 109 62Q111 85 146 104Q120 110 100 100L78 110L58 101Q38 111 22 105Z"
        fill={shadow}
      />
      <path d="M26 101Q46 84 50 56Q51 44 63 38L72 53Q59 77 62 98L45 101L38 98Z" fill={cloth} />
      <path
        d="M86 37Q104 43 103 64Q107 88 138 103Q116 104 105 94L98 97Q84 81 83 59Z"
        fill={cloth}
      />
      <path d="M87 48Q91 74 100 91L109 97Q98 78 99 63L93 45Z" fill={lit} />
      <path d="M60 47Q51 71 50 91L41 98Q53 96 57 91L70 51Z" fill={lit} />
      <path d="M68 55Q65 78 66 98L78 106L89 97Q83 78 82 55Z" fill="#203432" />
      <path
        d="M64 72Q60 88 64 97M88 69Q92 90 99 96M42 84Q47 74 48 65M112 92Q119 99 130 100"
        fill="none"
        stroke={lit}
        strokeWidth=".7"
        opacity=".6"
      />
      <path
        d="M51 49Q44 26 63 15Q72 10 78 5Q80 15 91 21Q105 36 94 51L81 61L70 57L62 51Z"
        fill={cloth}
      />
      <path d="M76 13Q54 23 55 41L61 50L70 54L72 48L60 41Q60 28 76 20Z" fill={lit} />
      <path d="M80 17Q97 27 95 39L89 51L81 58L78 50L87 40Q90 31 80 23Z" fill={shade} />
      <path d="M74 24Q82 23 87 34L83 44L76 49L63 42Q62 32 74 24Z" fill={shadow} />
      <path
        d="M63 39Q66 29 73 26M82 22Q91 28 92 36M55 48L62 53"
        fill="none"
        stroke={ink}
        strokeWidth=".6"
        opacity=".6"
      />
      <path d="M61 55Q69 59 81 57" fill="none" stroke={copper} strokeWidth=".9" />
      <circle cx="62" cy="55" r="3.5" fill={copper} />
      <circle cx="62" cy="55" r="2" stroke={ink} strokeWidth=".6" />
      {demon && (
        <g>
          <path
            d="M67 29C42 25 39 8 49 2C45 18 62 17 71 18ZM82 17C98 19 110 9 108 1C121 17 104 30 88 29Z"
            fill={metal}
          />
          <path d="M66 28Q77 18 87 28L84 42L76 49L67 40Z" fill={shade} />
          <path d="M69 29L77 24L75 34L71 38L75 45L69 39Z" fill={ink} />
          <path d="M69 32L74 34L71 37ZM79 34L85 31L83 36L79 37Z" fill={shadow} />
          <path d="M77 37L74 43L78 42ZM73 45L79 44" fill={shadow} />
          <path d="M103 52L112 47L112 57L120 61L105 68Z" fill={metal} />
        </g>
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
