import type { ReactNode } from 'react';

const dark = '#192b2b';
const bone = '#d6c7a2';
const gold = '#b9945d';
const brass = '#7b7157';
const green = '#758a66';
const light = '#b8c4a0';
const water = '#81aaa9';
const sea = '#496d74';
const plum = '#76627e';

function Cut({
  d,
  color = bone,
  width = 0.7,
  opacity = 0.65,
}: {
  d: string;
  color?: string;
  width?: number;
  opacity?: number;
}) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      opacity={opacity}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
function Rivet({ x, y }: { x: number; y: number }) {
  return (
    <>
      <circle cx={x} cy={y} r="2.3" fill={dark} />
      <circle cx={x - 0.4} cy={y - 0.5} r="1" fill={bone} />
    </>
  );
}
function MothWing({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <g transform={mirrored ? 'translate(160 0) scale(-1 1)' : undefined}>
      <path
        d="M78 53Q48 7 12 12q-8 25 4 45 7 10 27 8-23 12-12 25 13 10 39-14-3 25-19 33 26-3 30-41Z"
        fill={dark}
      />
      <path d="M75 52Q49 17 17 18q-3 28 12 37 16 7 43 9-41-10-37 18 13 5 36-16l5-4Z" fill={light} />
      <path d="M69 53Q50 30 23 25q1 20 12 25 14 5 34 3Z" fill={green} />
      <path d="M45 36q-14-10-17 3 2 15 15 14 15-4 2-17Z" fill={gold} />
      <path d="M41 38q-10-7-10 3 2 10 10 9 9-2 0-12Z" fill={dark} />
      <path d="M38 40q-5 0-2 6 5 4 6-1Z" fill={water} />
      <Cut
        d="M70 54 23 23m46 29L22 42m45 10-29 1m30 13L39 80m31-11-21 14m22-10-14 27M20 19l2 7m-3 5 3 6m0 5 4 6m4 4 6 3"
        color={bone}
        width={0.6}
      />
    </g>
  );
}

/** Each new recruit has its own silhouette; shared marks only describe surface and light. */
export const expansionMinionArt: Record<string, ReactNode> = {
  copperbeetle: (
    <>
      <path d="M12 97 35 82 42 48 69 30 109 34l25 28-8 29-42 15-46-9Z" fill={dark} />
      <path
        d="M43 78 22 83l-5 19m39-10-11 11-21 3m69-9 13 9 24-5M44 48 25 42l-7 14m43-23-7-13-20-5m58 16 12-16 16-3"
        fill="none"
        stroke={brass}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path d="M38 65q-4-28 31-31 31-3 37 27-7 29-36 35-25 0-32-31Z" fill={gold} />
      <path d="M65 36q-24 21-3 56-19-7-22-28-3-20 25-28Z" fill={bone} />
      <path d="M68 36q-13 32-3 60 30-6 41-35-9-25-38-25Z" fill={brass} />
      <path d="M68 36Q54 68 65 96" fill="none" stroke={dark} strokeWidth="2.5" />
      <path d="M100 41q23-6 29 15l-5 22-19 5-17-17Z" fill={dark} />
      <path d="M105 46q13-3 19 13l-5 15-13 3-12-12Z" fill={gold} />
      <path d="M121 51q6-18 23-19m-22 41q12 2 16 16" fill="none" stroke={gold} strokeWidth="2" />
      <path d="m118 58 10-4-3 9-7 2Z" fill={water} />
      <Cut d="M51 45q-13 20 3 36m23-37q20 10 20 22M79 50l10 8m-13-1 10 8m-11 0 7 6m-59 16-3 12m34 0-9 6" />
      <Rivet x={75} y={42} />
      <Rivet x={71} y={87} />
      <Rivet x={108} y={68} />
    </>
  ),
  bogtoad: (
    <>
      <path
        d="M17 101q-2-24 19-40 8-24 37-22 2-24 22-18 17 3 20 20l22 13q11 11-1 26l-31 10 2 16H30Z"
        fill={dark}
      />
      <path
        d="M24 96q-1-22 25-35 9-23 29-15-5-22 14-21 18 4 17 23l20 10q13 17-17 23l-33 2-16 20Z"
        fill={green}
      />
      <path d="M91 49q13-1 23 9l17 6q-3 10-25 15l-25-1-1-15Z" fill={light} />
      <ellipse cx="94" cy="39" rx="12" ry="10" fill={dark} transform="rotate(10 94 39)" />
      <ellipse cx="95" cy="38" rx="9" ry="7" fill={gold} />
      <path d="M86 38q9-5 17 1-9 3-17-1Z" fill={dark} />
      <path d="M107 56q3-4 6 0m-31 16q24 10 46-6" fill="none" stroke={dark} strokeWidth="1.4" />
      <path
        d="M46 73q-24 7-10 23l18 1-5 8-23 1m51-25-8 13 20 8 25 1-4 5-25 2-22-9"
        fill={green}
        stroke={dark}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <Cut d="M42 82q-7 8 9 9m36-12 21-1m-58-9 8-7m13-5 6-3m-20 19 5-3m11 9 3-5M92 29l7 2" />
      <g fill={dark} opacity=".45">
        <ellipse cx="59" cy="55" rx="4" ry="2" />
        <ellipse cx="49" cy="63" rx="3" ry="2" />
        <ellipse cx="70" cy="59" rx="3" ry="2" />
        <circle cx="61" cy="69" r="2" />
      </g>
      <Cut d="M12 108q17-6 30 0m75-17 25 2m-36 14 39-3" color={water} />
    </>
  ),
  lanternkeeper: (
    <>
      <path d="M21 112 34 79l20-17Q37 51 42 35 45 12 70 9q25 3 35 35l-8 23 28 45Z" fill={dark} />
      <path d="M36 112 43 81l27-17 23 9 18 39Z" fill="#6b7465" />
      <path d="M47 43Q47 18 70 17q17 8 27 30L80 40 67 58Z" fill={plum} />
      <path d="M72 33q13 0 15 10l-1 7 8 8-7 3q3 13-7 14l-8-3q-9-10-4-23Z" fill={bone} />
      <path d="M72 37q9 1 9 9l-6 9 6 9-2 8-7-4q-6-9-3-20Z" fill="#9a9079" />
      <path d="M79 47q4-2 7 1l-6 1Zm3 17 5-1-1 2Z" fill={dark} />
      <path d="M69 57q-3 5 3 7m3 6 6 2" fill="none" stroke={dark} strokeWidth=".7" />
      <Cut d="M79 48h6m-3 15h5M50 36q7-11 15-12M46 87l15-14-5 33m16-24-5 29m24-34 7 13" />
      <path d="M85 93q14-17 27-27l7 6-15 26-17 8Z" fill={plum} />
      <path d="m110 69 1-10 5-5 7 1 3 7-6 11Z" fill={bone} />
      <path d="M114 62V49q0-8 7-8t7 8v7" fill="none" stroke={gold} strokeWidth="2" />
      <path d="m114 51-10 13 4 30 25 3 7-29-12-13Z" fill={dark} />
      <path d="m108 66 28 3-6 23-18-2Z" fill={gold} />
      <path d="m119 70-2 17 8 1 6-17Z" fill="#e6cb8e" />
      <path d="m110 63 25 4m-16 0-4 26m15-24-5 25m-18-2 25 4" stroke={brass} strokeWidth="2" />
    </>
  ),
  tidewisp: (
    <>
      <path
        d="M26 102q37-23 21-40Q21 37 53 20q24-14 35-14-16 27 10 41 12 8 8 23 32-9 34 9 4 24-36 31Z"
        fill={dark}
      />
      <path
        d="M41 99q31-22 16-43-22-26 12-39-15 24 14 42 17 13-3 29 24-9 31-25 18 10 7 24-5 8-17 12Z"
        fill={sea}
      />
      <path d="M63 90q28-23 5-42-14-19 10-34-4 22 15 34 18 23-9 47Z" fill={water} />
      <path d="M70 53q-11-16 3-24-4 19 11 27 9 18-8 26 9-17-6-29Z" fill={bone} opacity=".8" />
      <path d="M68 62q11-7 18-1l-9 8Z" fill={dark} />
      <path
        d="M28 101q40 17 92-3M38 107q40 12 72 0M31 72q-14-18 0-28"
        fill="none"
        stroke={water}
        strokeWidth="1.2"
      />
      <Cut d="M43 99q23-15 18-27m39 20q15-4 22-16M58 24q-17 15-6 27m49-14 4 7" color={water} />
      <path d="M124 37q-9 12 1 16 11-6-1-16ZM39 28q-6 8 1 11 6-4-1-11Z" fill={water} />
    </>
  ),
  thornstag: (
    <>
      <path
        d="M21 112q8-31 38-46l14-15q-7-12-5-25 15 0 19 15 19-8 28 10l4 8q9 3 23 3 8 10-6 17l-18 4q-18 8-22 29Z"
        fill={dark}
      />
      <path
        d="M33 112q7-24 31-35 21-16 18-27-9-10-8-17 9 3 13 16 15-9 24 4l5 12 21 1q2 6-9 9l-18 3q-18 13-22 34Z"
        fill="#84795e"
      />
      <path d="M94 50q11-1 13 9l1 8q10 7 20 7l-18 6q-16 7-19 20 6-25-7-27Z" fill={light} />
      <path
        d="M85 46Q59 40 51 14m18 23L39 29 28 10m25 19L56 7M97 42q25-17 24-34m-10 26 28-11 8-16m-8 16 8 10m-25-13 9-9"
        fill="none"
        stroke={dark}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M85 46Q59 40 51 14m18 23L39 29 28 10m25 19L56 7M97 42q25-17 24-34m-10 26 28-11 8-16m-8 16 8 10m-25-13 9-9"
        fill="none"
        stroke={gold}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M99 58q7-5 11-1l-5 4Z" fill={dark} />
      <path d="m104 57 3 1-2 2Z" fill={bone} />
      <path d="M136 63q9-1 7 6l-8 1Z" fill={dark} />
      <Cut d="M113 76q9 3 20-4m-45-9-3 10m-1 4-5 12m7-2-6 13" color={dark} />
      <path d="M54 98 59 80l14 6-7 26Z" fill={green} />
      <Cut d="M83 66 73 84m15-11-8 18m10-5-7 16m17-22 9-5M46 95l9-10m-12 16 9-9M113 67l13 2" />
    </>
  ),
  cinderwitch: (
    <>
      <path d="M21 112 36 72l22-21-1-23 22-20 27 28-4 26 25 18 14 32Z" fill={dark} />
      <path d="M35 112 45 76l28-22 23 9 23 27 10 22Z" fill={plum} />
      <path d="M58 49Q57 26 79 15l20 24-8 24-15-3Z" fill="#a17f8c" />
      <path d="m69 39 14-12 10 17-6 18-11-4Z" fill={dark} />
      <path d="M76 39q9-5 12 2l-2 5 5 4-5 2q2 7-3 10l-6-4-3-11Z" fill={bone} />
      <path d="M76 44q5-3 9 0l-6 2Z" fill={dark} />
      <path d="M80 53h5m-6 3 4 2" stroke={dark} strokeWidth=".65" />
      <path d="M61 27Q37 16 46 3q-22 22 15 34M93 27q27-17 16-24 23 18-12 34Z" fill={gold} />
      <Cut d="M56 27q-13-6-13-13m55 12q13-9 13-14" />
      <path d="M38 91 61 71l7 6-18 22Zm87 6-25-19 6-8 28 22Z" fill="#9b7c8a" />
      <path
        d="M60 74q1-10 7-15l9-1 5 5-2 4-5-4-4 1-2 11Zm43 3-9-8-10 1-3-3 10-5q8 1 17 10Z"
        fill={bone}
      />
      <Cut d="m65 68 4-6m27 3 6 5" color={dark} />
      <path d="M48 86q30 7 60 0l-6 21H55Z" fill={dark} stroke={gold} strokeWidth="1" />
      <ellipse cx="78" cy="86" rx="30" ry="7" fill="#9e604c" />
      <ellipse cx="78" cy="85" rx="23" ry="4" fill={gold} />
      <path d="M70 84q-14-17 6-31-5 16 10 18 6 5 1 13Z" fill="#c89b71" />
      <path d="M78 82q-6-8 2-12-1 9 5 12Z" fill={bone} />
      <Cut d="M53 80l-9 12m63-12 14 11m-68 7 4 6m36-4 5-3M64 35l5-9m24 14-5 13" />
    </>
  ),
  brassheron: (
    <>
      <path
        d="M24 31 62 22l14-3 12 7-3 13-12 6 3 10 26-2 31 28-25 10-37-12-8-23 2-19-8-3Z"
        fill={dark}
      />
      <path d="m29 31 33-6 1 7Z" fill={bone} />
      <path
        d="m62 25 13-2 8 6-3 8-10 5-3 12 8 18 30 13 15-8-20-19-29 3-8-12 3-14 8-5-4-5Z"
        fill={gold}
      />
      <path d="M77 57q26-8 47 18l-23 12-25-13Z" fill={brass} />
      <path d="m80 58 17 1 22 16-12 2Z" fill={bone} />
      <path d="M80 63 103 80l-11 1-16-13Z" fill={gold} />
      <path
        d="m76 79-8 16 9 11H58m39-21 8 13-4 10h20"
        fill="none"
        stroke={gold}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="m73 18 12-8-4 14" fill={brass} />
      <path d="m68 28 8-1-4 4Z" fill={dark} />
      <Rivet x={77} y={71} />
      <Rivet x={102} y={82} />
      <Cut d="M79 31q-1 6-7 7m-7 8v9l7 15M84 66l17 13m-12-16 20 13M69 96l5 7m30-5-2 6" />
      <Cut d="M24 87q24 7 36 0m57 7 27-4M26 97h16" color={water} />
    </>
  ),
  mistweaver: (
    <>
      <path
        d="M14 97q8-38 45-30-29-19-14-44 16-19 36-11-29 9-23 28 7 15 32 12-13-23 11-37-10 24 11 31 40 20 24 49l-38 17H34Z"
        fill={dark}
      />
      <path d="M26 100q5-29 30-25 38 12 56-11-9 30-49 23-22-4-37 13Z" fill={water} />
      <path d="M48 74Q18 35 55 16q-21 29 5 46 14 7 38-7-19 29-50 19Z" fill={sea} />
      <path d="M73 100q45-7 41-32-4-12-15-22-13-18 4-33-6 24 17 36 29 30-8 49Z" fill={water} />
      <path d="M112 89q18-18 3-37 26 18 5 35Z" fill={bone} />
      <circle cx="76" cy="41" r="16" fill={sea} />
      <path d="M80 26a15 15 0 1 0 8 26Q65 49 80 26Z" fill={bone} />
      <Cut
        d="M42 66Q24 40 48 22m3 43q10 10 25 3M34 93q12-13 30-7m24 15q22-2 30-13M105 28q0 12 15 24"
        color={light}
      />
      <Cut d="M21 73q-8-19 2-31m99-26q-5 9 2 17M31 109q35-5 53 0" color={water} width={1} />
      <circle cx="35" cy="28" r="1.5" fill={bone} />
      <circle cx="121" cy="38" r="2" fill={bone} />
      <circle cx="26" cy="60" r="1" fill={bone} />
    </>
  ),
  moonmoth: (
    <>
      <MothWing />
      <MothWing mirrored />
      <path d="M76 43q-5-7 1-13 7-4 10 4l-2 13 1 22-6 23-5-23Z" fill={dark} />
      <path d="M79 46h3l1 22-3 15-2-15Z" fill={gold} />
      <path d="M78 34Q67 9 60 12m23 21q13-25 20-20" fill="none" stroke={bone} strokeWidth="1.2" />
      <Cut d="m74 22-8-3m10 8-6-1m16 0 8-2m-4-4 8-3M77 54h7m-7 6h7m-7 6h7m-5 6h4" />
    </>
  ),
  soulbell: (
    <>
      <path d="M31 14h98l-8 9H39Z" fill={brass} />
      <path d="M46 112V20m68 0v92" stroke={dark} strokeWidth="9" />
      <path d="M44 21v88m72-88v88" stroke={gold} strokeWidth="1" />
      <path d="M78 17v15m5-15v15" stroke={gold} strokeWidth="3" />
      <path d="M80 29q24-2 23 32l8 20 12 6v9H37v-9l12-6 8-20q-1-29 23-32Z" fill={dark} />
      <path d="M79 34q20-1 19 28l9 24H51l10-24q-1-26 18-28Z" fill={plum} />
      <path d="M77 35q-16 8-12 27l-7 20h10l6-25Z" fill="#a494a2" />
      <path d="M82 40q-2 17 7 21 15 8 7 22H80q9-8-1-15-13-9 3-28Z" fill={dark} />
      <path d="M83 52q1 9 8 10l-5 9-5-4-2-6Z" fill={water} />
      <path d="m42 87 76 1v6H42Z" fill={gold} />
      <ellipse cx="80" cy="95" rx="36" ry="5" fill={dark} />
      <path d="M77 92v8q-9 13 4 12 12-1 2-12v-8Z" fill={brass} />
      <Cut d="M48 89h19m22 0h23M71 42l-3 8m-9 22-4 9m37-37 3 12M47 26h-4m74 0h-4m-67 9h-4m75 0h-4" />
      <path
        d="M26 84q-13-22 1-31m107 7q16 25-3 41"
        fill="none"
        stroke={water}
        strokeWidth="1.2"
        opacity=".7"
      />
    </>
  ),
  stormroc: (
    <>
      <path
        d="M61 76Q32 64 6 20q25 6 38 22l-5-13 20 18q6-22 25-30l-5 14Q94 9 114 5q-2 19-13 31l11-4-21 28 13-4-9 12q7-11 17-3l11 5 18-3q2 8-10 14l-14-3-24 14q-9 10-26 20l-18-2 22-26Z"
        fill={dark}
      />
      <path d="M64 73Q36 60 15 28q38 14 50 35 1-36 39-48-7 28-32 55l6 7Z" fill={sea} />
      <path
        d="M69 65q2-27 18-36l-3 11q11-21 20-24-6 18-23 27l13-5q-4 11-13 18l8-3q-4 15-16 23Z"
        fill={water}
      />
      <path d="M62 71Q36 58 19 34q21 9 35 27l-4-15q13 11 15 18Z" fill={water} />
      <path
        d="M66 79q16-12 27-10 8-12 17 1l19 2-6 5-16-1q-6 12-20 14l-14 8-14 13 4-17-19 8Z"
        fill={water}
      />
      <path d="M94 70q7-7 12 0l3 4q-14 1-19 12l-16 5 11-13Z" fill={bone} />
      <path d="M100 71q5-2 8 1l-5 3Zm14 0 17-1q-1 8-7 10l-1-6Z" fill={dark} />
      <Cut
        d="M76 52q14-9 20-25m-23 33 9-6m-9 12 8-6M41 53l16 13m-27-27 7 10m40 41 10-6m-15 13 12-7"
        width={0.55}
      />
      <path d="M77 92 67 106l-9 2m27-20-4 12 10 4" fill="none" stroke={gold} strokeWidth="2" />
      <Cut d="M71 63 98 23m-26 32 19-12m-21 9 8-16M54 62 23 36m24 20-11-3m25 16-17-5m39 17-15 9m25-14-10 9" />
      <path
        d="m121 20-8 17 13-4-13 24m-81 16-9 15 11-2-10 19"
        fill="none"
        stroke={bone}
        strokeWidth="1.1"
      />
    </>
  ),
  ancienttortoise: (
    <>
      <path
        d="M11 93q-1-46 31-62 37-17 62 18l11 24q25-9 32 8 7 17-20 18l-18-1-5 14H26l-4-12Z"
        fill={dark}
      />
      <path d="M17 90q1-42 29-53 32-15 55 18l8 28-34 18-47-2Z" fill={brass} />
      <path d="M24 80q5-30 26-38 25-10 45 16l9 21-31 16-40-2Z" fill={green} />
      <path d="m54 42 23 8 5 21-20 11-19-11 1-19Z" fill={light} />
      <path
        d="m30 56 14-4-1 19-18 11m19-11 18 11-6 14m6-14 20-11 19 9m-19-9-5-21 13 3M34 93l9-22"
        fill="none"
        stroke={dark}
        strokeWidth="2"
      />
      <path
        d="M104 79q15 2 23-4 13-2 15 8 5 9-20 11l-21-3Zm-65 14q-13 3-9 14h21l10-12m29-3q-4 7 1 16h17l-7-20"
        fill={light}
        stroke={dark}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M125 82q5-5 10-1l-5 4Z" fill={dark} />
      <path d="M128 89q6 2 12-1" fill="none" stroke={dark} strokeWidth="1" />
      <path d="M55 48 49 57l6 13 15 4 7-11-5-10Z" fill="none" stroke={green} strokeWidth="2" />
      <Cut d="M31 64l7-4m-10 12 9-7m11 24 6-6m34-28 5 12m-8 12 10-4M37 102l-3 4m9-5-2 5m57-5v5m6-5 2 5m15-25-7 3" />
      <path
        d="M32 47q-8-3-8 3 8 5 16-6l11-5M73 39q10-1 15 8l11 14"
        fill="none"
        stroke={green}
        strokeWidth="4"
      />
      <path
        d="M36 41q-13-7-16-1 3 9 16 1Zm5-3q-8-11-14-7-1 8 14 7Zm46 9q8-15 13-9-1 9-13 9Z"
        fill={green}
      />
      <Cut d="M26 41h7m-1-7 6 3m52 8 6-5M110 83l4 3m1-4 4 3m-9 4 5 3" color={light} />
    </>
  ),
};
