import type { ReactNode } from 'react';

const ink = '#182a2c',
  brass = '#9e8358',
  gold = '#d1b37b',
  bone = '#ded2b2';
const green = '#647f73',
  teal = '#8eaca6',
  plum = '#7f6477',
  wine = '#493946';
function Line({ d, color = bone, width = 0.7 }: { d: string; color?: string; width?: number }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
function Gear({ x, y, r = 12 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={`M-2 ${-r - 3}h4v7h-4Z`} transform={`rotate(${i * 45})`} fill={brass} />
      ))}
      <circle r={r} fill={brass} stroke={ink} strokeWidth="1.4" />
      <circle r={r * 0.67} fill={ink} stroke={gold} strokeWidth=".7" />
      <path
        d={`M0 ${-r * 0.6}V${r * 0.6}M${-r * 0.6} 0H${r * 0.6}`}
        stroke={brass}
        strokeWidth="2"
      />
      <circle r="2" fill={gold} />
    </g>
  );
}
function Lantern({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M-5 1q-4-15 5-15T5 1M-12 6 0-2l12 8-3 26H-9Z"
        fill={ink}
        stroke={brass}
        strokeWidth="1.5"
      />
      <path d="M-8 9H8L6 28H-6Z" fill={gold} />
      <path d="M0 9v19M-10 6h20m-22 27h24" stroke={ink} strokeWidth="2" />
      <path d="M-4 12v9" stroke={bone} strokeWidth="1.5" />
    </g>
  );
}
function Bottle({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M-4 0h8v10q13 8 9 24-12 8-26 0-4-16 9-24Z"
        fill={ink}
        stroke={teal}
        strokeWidth="1"
      />
      <path d="M-10 24q10 4 20 0v8q-10 5-20 0Z" fill={green} />
      <path d="M-5-3H5v5H-5Z" fill={gold} />
      <Line d="M-1 6v7q-8 6-8 14" />
    </g>
  );
}
function Face({
  x,
  y,
  flip = false,
  elder = false,
  moustache = false,
}: {
  x: number;
  y: number;
  flip?: boolean;
  elder?: boolean;
  moustache?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <path
        d="M-13-17C-4-27 11-21 13-9l-1 11q1 5 5 8 4 4-4 5l1 6q-2 8-15 6l-2 12-15-4 6-20Q-22 12-22-2q0-10 9-15Z"
        fill={brass}
      />
      <path d="M-2-18Q10-20 11-7L8 1q-1 6 7 10l-5 3 1 7q-3 5-11 3l-7-12 5-12Z" fill={bone} />
      <path d="M-15-2q-9-2-7 7 1 8 8 6Z" fill={brass} />
      <Line
        d="M-18 2q4-2 4 5m13-6q6-3 11 0m-9 3q4-2 7 0M8 17l4 1m-10 3 8 1M-7 12q2 4 6 5"
        color={ink}
        width={0.65}
      />
      <ellipse cx="5" cy="4" rx="1.2" ry=".9" fill={ink} />
      <path d="M-16 13q-8-7-5-19 1-16 16-17 14-1 19 12Q3-20-6-9l-4 10-3-1Z" fill={ink} />
      {elder && (
        <>
          <path d="M-10 9q3 15 11 15l10-3q1 13-9 23-12-6-16-18Z" fill={teal} />
          <path d="M-6 13q5 13 13 12-4 8-6 13-5-6-7-25Z" fill={bone} />
          <Line d="M-9 21q-1 13 8 20M-3 28l4 9M-4-3h12m-11-3h9" color={brass} />
        </>
      )}
      {moustache && (
        <>
          <path d="M4 15q-6-3-8 3-5 2-6-2 0 9 10 5l5-2q7 6 11 0-6 2-7-3Z" fill={ink} />
          <path d="M-1 25q6 2 10-1l-6 9Z" fill={ink} />
          <circle cx="5" cy="4" r="5.3" fill="none" stroke={gold} strokeWidth=".8" />
          <Line d="M10 6q9 24-2 33" color={gold} />
        </>
      )}
    </g>
  );
}

export const nightMarketMinionArt: Record<string, ReactNode> = {
  rivetmouse: (
    <>
      <path d="M112 83q40 17 29-11-4-11-17-6" fill="none" stroke={brass} strokeWidth="4" />
      <path
        d="M44 83Q42 48 80 40q37-2 41 32-4 23-34 23H52Z"
        fill={ink}
        stroke={brass}
        strokeWidth="1.2"
      />
      <path d="M65 48q42-13 49 20-20-9-38 16l-25-2Z" fill={brass} />
      <path
        d="M46 58Q24 33 27 17q26-5 35 29m1-1Q54 16 69 10q18 9 9 35"
        fill={brass}
        stroke={ink}
        strokeWidth="2"
      />
      <path d="M43 44q-13-11-10-20 18 2 20 21m13-8q-3-13 3-18 10 9 3 19" fill={teal} />
      <path
        d="M53 43Q34 42 22 66l-10 8 26 13q20 0 28-16l4-16Z"
        fill={brass}
        stroke={ink}
        strokeWidth="1.5"
      />
      <path d="M18 72q10-19 30-22L38 69l-3 12Z" fill={gold} />
      <path d="m11 72 8 2-6 5Z" fill={ink} />
      <circle cx="39" cy="63" r="4" fill={ink} />
      <circle cx="40" cy="62" r="1.5" fill={bone} />
      <Gear x={89} y={71} r={16} />
      <path d="m53 87-7 12H32m65-9 9 10h14" fill="none" stroke={brass} strokeWidth="4" />
      <Line d="M23 76 8 66m16 13L8 82M64 54l11-6m31 3 5 6M36 98h10" />
    </>
  ),
  wickimp: (
    <>
      <path d="M99 91q36 14 40-9 3-15-11-20 12 13 1 19-12 5-30-8Z" fill={wine} />
      <path d="M52 111q-3-22 13-39L60 50l25-13 24 19-9 22 14 33Z" fill={wine} />
      <path d="M66 109q-8-17 7-32l-1-21 17-5 9 14-12 22 9 22Z" fill={plum} />
      <path d="M62 50Q42 40 52 23q0 17 17 13m20 2q17-9 12-23 17 12 1 34" fill={gold} />
      <path d="M60 45q19-18 43-3l-5 22-13 12-20-9Z" fill={plum} />
      <path d="M65 48q7-7 16-6l-5 16 6 5-9 2-8-5Z" fill={bone} />
      <path d="M66 51q5-4 12 1-5 6-10 2Zm19 1q5-6 12-5-3 8-10 7Z" fill={ink} />
      <path d="m69 51 4 1m16 0 4-1" stroke={gold} strokeWidth="1.4" />
      <path d="M79 65q7 2 13-4" fill="none" stroke={ink} strokeWidth=".9" />
      <path
        d="M63 76Q50 70 37 73l-5 8 5 5 9-5 19 5m33-8q13 5 12 18l-7 5-5-5 4-7-8-4Z"
        fill={plum}
      />
      <Line d="M38 76l-3 5m7-4-3 5m13-6 9 4m41 10 3 5M70 82l-6 20m17-24 4 15m6-3 3 13" />
      <path d="m74 65 3 2-1 4m11-7 2 4 2-7" stroke={bone} fill="none" strokeWidth="1" />
      <path d="M26 66h17v30H26Z" fill={bone} />
      <path d="M25 65q6 4 9-1 4 5 9 1v10q-5 3-7-3l-3 12-4-10Z" fill={gold} />
      <path d="M34 63q-14-12 2-28-1 13 6 17 2 8-8 11Z" fill={gold} />
      <path d="M34 60q-4-7 2-12l2 8Z" fill={bone} />
      <Line d="M68 88 60 104m29-25 7 16M27 101h23" />
    </>
  ),
  streetapothecary: (
    <>
      <path d="M30 111q2-32 33-45h28q31 15 38 45Z" fill={ink} />
      <path d="M58 71 78 87l21-18 16 42H42Z" fill={green} />
      <Face x={77} y={44} />
      <path d="M46 25q2-24 37-21 24 2 30 30-35-14-67-9Z" fill={green} />
      <path d="M41 28q42-18 77 10-30-8-74-2Z" fill={brass} />
      <Line d="M53 21q18-15 37-9m-29 66 13 19-12 14m28-33L80 97l8 14M49 77l-4 13m17-5 4 6m32-9 10 18M51 94l7 2m-7 2 7 2m51-17 4 7m1-9 4 8" />
      <path d="M71 93h8v18h-8Z" fill={brass} />
      <circle cx="75" cy="98" r="1" fill={ink} />
      <circle cx="75" cy="105" r="1" fill={ink} />
      <path d="m40 85 20 8-5 11-28-10Zm57 7 28-12 8 13-26 11Z" fill={green} />
      <path d="M54 89q14 1 15 9l-14 5-6-8m67-12q-7-8-12-1l1 14 14-4Z" fill={bone} />
      <Bottle x={116} y={53} scale={0.9} />
      <Bottle x={36} y={73} scale={0.85} />
      <path d="M15 107h131v5H15Z" fill={brass} />
    </>
  ),
  glassimp: (
    <>
      <path
        d="M72 55Q37 13 17 24q6 29 30 44l18 6m27-16q30-43 53-38-2 36-38 61Z"
        fill={green}
        stroke={teal}
        strokeWidth="1"
      />
      <path d="M64 56 24 28l23 37Zm37 2 36-27-14 36Z" fill={teal} opacity=".5" />
      <path
        d="M65 77q-2 16-25 17-6 0-10-5 1 14 20 13 22-1 26-14m17-4 10 13 23-6-16 14-29-4Z"
        fill={teal}
      />
      <path
        d="M64 44q-11-19-1-34 4 15 16 23 17-10 18-24 13 22 0 35l6 34-19 23-24-18Z"
        fill={ink}
        stroke={teal}
        strokeWidth="1.3"
      />
      <path d="m68 43 11-6 5 61-19-18Z" fill={teal} />
      <path d="m84 39 11 5 4 32-14 16Z" fill={green} />
      <path d="m68 51 11 3-6 6Zm19 3 9-5-3 11Z" fill={ink} />
      <path d="M78 65h10l-5 8Z" fill={gold} />
      <Line d="m71 43-4-13m3 10 9 3m7 0 6-6m-25 29 13 9 14-13M70 77l9 12m11-15-4 11M29 33l17 22m72 4 13-19" />
      <path
        d="M44 26q31-30 66-9m26 29q4 38-31 55M26 66q3 22 18 34"
        fill="none"
        stroke={gold}
        strokeWidth=".85"
      />
    </>
  ),
  coilserpent: (
    <>
      <path
        d="M59 72q-38-17-28 9 4 20 50 18 49-3 46-28-2-17-28-19-24-4-28-17-1-17 17-20"
        fill="none"
        stroke={ink}
        strokeWidth="20"
      />
      <path
        d="M59 72q-38-17-28 9 4 20 50 18 49-3 46-28-2-17-28-19-24-4-28-17-1-17 17-20"
        fill="none"
        stroke={brass}
        strokeWidth="15"
      />
      <path
        d="M58 67q-30-13-30 8m17 14q50 17 74-12 6-15-22-17-31-2-33-25"
        fill="none"
        stroke={gold}
        strokeWidth="2"
      />
      <Line
        d="m34 82-9 4m19 3-4 9m18-6-1 10m17-8 1 10m16-11 3 10m12-16 5 9m6-23 11 4m-18-20 5-9m-19 7 2-10m-17 6 3-10m-16 2 7-8"
        color={ink}
        width={1.6}
      />
      <path
        d="M73 20q14-22 39-4l21 7-8 11-34 2-18-9Z"
        fill={brass}
        stroke={ink}
        strokeWidth="1.5"
      />
      <path d="m84 15 16-6 13 10-21 1Z" fill={gold} />
      <path d="m107 24 10-4-3 7Z" fill={ink} />
      <circle cx="113" cy="23" r="1.5" fill={teal} />
      <path d="m124 32 15 6 6-2m-6 2 4 5" fill="none" stroke={teal} strokeWidth="1" />
      <Gear x={52} y={49} r={13} />
      <Line d="M87 26h13m-60 15 4 2m19 10 5 2" />
    </>
  ),
  nightporter: (
    <>
      <path d="M21 111q6-41 42-47l38 1q29 15 33 46Z" fill={ink} />
      <path d="M53 68q11 17 27 31l-2 12H37Zm47 0q-9 17-17 31l4 12h34Z" fill={green} />
      <Face x={79} y={37} flip elder />
      <path d="M54 29 61 9l32-2 14 20-20-4-31 10Z" fill={brass} />
      <path d="M52 30q25-18 58-4l-2 9q-24-9-56 3Z" fill={ink} />
      <Line d="M64 13 61 23m8-10-2 9m9-10-2 9m10-9-2 10m9-9-1 10M52 79l21 25m33-26-15 26" />
      <path d="M32 62h18v45H32Z" fill={brass} stroke={ink} />
      <path d="M35 66h12v37H35Z" fill={green} />
      <path d="M26 77q12-5 23 2l-4 10-15-2Z" fill={bone} />
      <path d="m106 76 16 9 7-8-9-10Z" fill={bone} />
      <Lantern x={125} y={53} scale={0.72} />
      <path d="M22 108h127" stroke={brass} strokeWidth="2" />
    </>
  ),
  furnacescribe: (
    <>
      <path d="M20 111q6-30 44-46h30q31 10 41 46Z" fill={wine} />
      <path d="M46 109 60 77l19 12 22-18 21 38Z" fill={plum} />
      <path d="M58 41Q27 31 39 8q1 20 31 19m25 3Q122 15 115 3q21 28-15 40" fill={brass} />
      <path d="M62 29q23-13 39 12l-4 26-20 17-18-25Z" fill={plum} />
      <path d="M65 35q12-8 17-2l-9 21 10 7-6 8-11-12Z" fill={bone} />
      <path d="M65 47q7-4 14 1-5 7-11 5Zm20 2q5-7 14-6-3 9-10 10Z" fill={ink} />
      <Line
        d="M65 41q7-4 14 2m6-1q6-4 11-3M62 57l7 5m24-6 3 6m-21 11 3 6m-8-11-4-2"
        color={brass}
      />
      <path d="M75 70q8 5 16-3l-11 13Z" fill={ink} />
      <Line d="M55 84 45 101m53-19 15 17M50 108l10-13m34 11 10-12" color={brass} />
      <Line d="m69 49 4 1m15 0 6-3" color={gold} width={1.5} />
      <path d="m80 61 13-3-8 11-6 2Z" fill={brass} />
      <path d="M39 86 79 94l42-15-6 29H43Z" fill={bone} stroke={ink} strokeWidth="1.2" />
      <path
        d="m79 94-2 14m-29-16 20 5m-20 0 19 5m20-4 21-9m-21 15 18-8"
        stroke={wine}
        strokeWidth=".75"
      />
      <path d="m104 84 25-49q8 22-20 45Z" fill={gold} />
      <Line d="m110 72 16-28" color={wine} />
      <path d="M19 72q-11-16 4-31-2 11 7 18 8 12-11 13Z" fill={brass} />
      <Line d="M48 86 57 79m-16-57q0 6 8 11m66-15-3 8" />
    </>
  ),
  clockworkmanta: (
    <>
      <path
        d="M72 66Q42 16 8 30q17 16 14 46 24-10 43 9l14 3 15-5q24-27 57-22-20-18-16-48-31 12-48 44Z"
        fill={ink}
        stroke={brass}
        strokeWidth="1.4"
      />
      <path
        d="M71 64Q46 29 20 33q18 14 9 33 25-5 40 14Zm18 6q18-34 42-47-5 20 9 34-29 0-47 24Z"
        fill={brass}
      />
      <path
        d="M29 37q20 8 35 25m-30-14 22 16m-19-5 19 9m47-7 20-27m-16 33 17-21m-13 25 18-14"
        fill="none"
        stroke={gold}
        strokeWidth="1"
      />
      <path d="M75 79q-22 39 33 23 15-7 9-20" fill="none" stroke={brass} strokeWidth="3" />
      <path
        d="M67 67q-3-27 13-38 16 11 16 30l-6 26-16 6Z"
        fill={brass}
        stroke={ink}
        strokeWidth="1.5"
      />
      <path d="m79 36-3 27 7 18 6-21Z" fill={gold} />
      <path d="m70 60 7-2m11-2 6-3" stroke={teal} strokeWidth="2" />
      <Gear x={81} y={70} r={8} />
      <Line d="M12 22q53-20 105-8m29 64q-17 18-37 19" color={teal} />
    </>
  ),
  maskmerchant: (
    <>
      <path d="M31 111q4-33 35-45h30q30 19 32 45Z" fill={ink} />
      <path d="M46 111 62 73l18 10 23-11 13 39Z" fill={plum} />
      <Face x={80} y={44} />
      <path d="M56 35Q36 7 70 4q30-5 36 19l-17-8-20 18Z" fill={wine} />
      <path d="M49 31q36-15 57-4l4 10q-29-9-57 2Z" fill={brass} />
      <path d="M31 44v61m99-66v69M28 46q51-15 104-5" stroke={brass} strokeWidth="2" fill="none" />
      <g transform="rotate(-12 32 69)">
        <path d="M15 52q19-9 33 0l-2 25-15 15-13-15Z" fill={bone} />
        <path d="m19 65 11 2-4 6Zm16 1 9-2-5 8Z" fill={wine} />
        <Line d="m29 81 8-1" color={wine} />
      </g>
      <g transform="rotate(12 130 64)">
        <path d="m116 42 10 9 13-9 8 25-15 20-17-14Z" fill={brass} />
        <path d="m121 60 8 2-4 7Zm12 2 9-4-3 9Z" fill={ink} />
        <Line d="m127 75 8-1" color={ink} />
      </g>
      <Line d="m61 84 14 23m24-24-12 24M61 16q13-10 29 2m-46 82 3-9m66 7-4-11M31 96l5 3m-7 1 5 3m90-5 5-2m-5 6 4-2" />
      <path d="M61 84q16 14 37-5" fill="none" stroke={gold} strokeWidth="1.2" />
      {[72, 80, 88].map((x, i) => (
        <circle key={x} cx={x} cy={90 - i} r="2" fill={gold} />
      ))}
      <path d="M28 93q8-4 13 5l-8 9-6-5m93-11q7-4 12 3l-3 12-9-4Z" fill={bone} />
    </>
  ),
  embernotary: (
    <>
      <path d="M28 111q-1-33 33-44l34-4q35 8 40 48Z" fill={wine} />
      <path d="M39 111 56 78l16 19 30-25 22 39Z" fill={plum} />
      <path d="M56 43Q21 22 44 4q-9 21 22 23m34 2Q126 17 118 3q21 26-14 42" fill={brass} />
      <path d="M59 30q20-18 37 3 8 8 7 17l7 9q3 4-6 6l-1 9q-4 8-17 10l-9 6-15-25Z" fill={plum} />
      <path
        d="M83 29q13 5 14 17l-5 8q3 5 12 7l-7 5 1 7q-5 6-12 4l-3-8-6-4q10-11 6-21Z"
        fill={bone}
      />
      <path d="M84 48q6-4 14 0-6 7-12 4Z" fill={wine} />
      <path d="m88 49 6 0" stroke={gold} strokeWidth="1.2" />
      <Line d="M82 43q9-3 15 1m-11 24 10 1m-27-10 6 6m8-29 4 4" color={brass} />
      <path d="M78 71q5 10 13 12-1 9-14 16-8-13-8-22Z" fill={ink} />
      <Line d="M76 81q0 7 4 12M44 104l12-19 12 17m43-7 8 11" color={brass} />
      <path d="M57 88q12-4 21 4l19-7 8 8-25 11q-19 1-27-5Z" fill={plum} />
      <path d="M97 91h20v10H97Zm4-14h12v16h-12Z" fill={gold} stroke={ink} />
      <ellipse cx="107" cy="76" rx="8" ry="4" fill={brass} />
      <path d="M92 89q-3-7 6-9l8 1 7-2q5 1 3 5l-10 3-5 8-7 1Z" fill={bone} />
      <Line d="m99 85 9-1m-8 4 6-2m-6 5 4-2" color={wine} />
      <path d="M20 105 70 94l62 10-17 8H20Z" fill={bone} />
      <ellipse cx="101" cy="106" rx="10" ry="4" fill="#bc7159" />
      <Line d="M47 108 68 101m-11 8 20-6M46 17q-2 11 15 17m58-21q4 10-12 17" />
    </>
  ),
  lanternengine: (
    <>
      <path
        d="M31 94 21 77l8-35 30-16 39 3 34 26 7 35-17 10H42Z"
        fill={ink}
        stroke={brass}
        strokeWidth="2"
      />
      <path d="m33 43 25-13 4 44-25 15-10-14Zm67-10 27 25 6 29-17 4-23-18Z" fill={brass} />
      <path d="M62 27h31l12 47-15 22H61L51 72Z" fill={green} stroke={brass} strokeWidth="2" />
      <path d="m65 34 22-1 10 38-11 17H66l-8-17Z" fill={gold} />
      <path d="M76 34v53M60 59h33M62 73h31" stroke={ink} strokeWidth="3" />
      <path d="M69 26V12h13v14m-8-13q-6-12 12-10" fill="none" stroke={brass} strokeWidth="5" />
      <Gear x={40} y={89} r={16} />
      <Gear x={116} y={91} r={15} />
      <path d="M54 94h47v11H54Z" fill={brass} />
      <Line d="M60 97v6m8-6v6m8-6v6m8-6v6m8-6v6M32 49l18-10m-21 17 18-9m66-2 8 10m-91 11 11-6" />
      <path d="M71 68q-7-9 6-21-2 9 7 15 7 12-9 17Z" fill={bone} />
      <Lantern x={127} y={27} scale={0.56} />
      <Line d="M99 35q18-25 29-20" color={brass} width={2} />
    </>
  ),
  twilightauctioneer: (
    <>
      <path d="M28 111q2-32 31-40l34-5q32 5 43 45Z" fill={ink} />
      <path d="m58 73 17 15 22-18 19 41H39Z" fill={plum} />
      <Face x={76} y={41} moustache />
      <path d="m56 27-4-22 41-4 10 24Z" fill={wine} />
      <path d="M51 19q23-2 47-3l3 9-45 6Z" fill={brass} />
      <path d="M41 33q29-18 68-7l4 7q-39-9-70 7Z" fill={ink} />
      <path d="m64 72 13 11 14-12-12 28Z" fill={bone} />
      <path d="m75 82 6 0 5 26-10 3Z" fill={brass} />
      <path d="m103 74 14-13 8 6-10 21Z" fill={plum} />
      <path d="M112 63q-2-11 7-9l10 12-7 8Z" fill={bone} />
      <g transform="rotate(-27 125 54)">
        <path d="M123 34h4v42h-4Z" fill={brass} />
        <path d="M111 30h28v12h-28Z" fill={gold} stroke={ink} />
        <Line d="M115 33v6m20-6v6" color={brass} />
      </g>
      <path d="M26 100h109v12H26Z" fill={brass} />
      <path d="m34 106 15-4 21 3 24-2 32 4" stroke={gold} strokeWidth=".7" fill="none" />
      <Lantern x={25} y={45} scale={0.6} />
      <Line d="M53 85 67 98m42-12-6 10M59 7l1 9m-13 86-5 10m15 1 5 4m37-6 4 4m13-39 5 6m-8-3 4 6m-52-27 3 3" />
    </>
  ),
};
