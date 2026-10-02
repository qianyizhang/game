import type { ReactNode } from 'react';

const ink = '#28493d';
const paper = '#f6e8c7';
const coral = '#bd5947';
const gold = '#c69b57';

function Engraving({ d }: { d: string }) {
  return <path d={d} fill="none" strokeWidth=".65" opacity=".65" />;
}
function Star({ x, y, size = 5 }: { x: number; y: number; size?: number }) {
  return (
    <path
      d={`M${x} ${y - size}q0 ${size} ${size} ${size}q-${size} 0 -${size} ${size}q0 -${size} -${size} -${size}q${size} 0 ${size} -${size}Z`}
      fill={gold}
      stroke="none"
    />
  );
}

/** Small engraved still lifes, sharing the first edition's four printing inks. */
export const expansionJokerArt: Record<string, ReactNode> = {
  observatory: (
    <>
      <circle cx="111" cy="35" r="15" fill={ink} stroke="none" />
      <path d="M111 20a15 15 0 0 0 0 30q-15-15 0-30Z" fill={gold} stroke="none" />
      <path d="M73 63 51 94m22-31 19 31m-19-31v32" fill="none" strokeWidth="3" />
      <path d="m34 53 55-25 8 18-55 25Z" fill={coral} />
      <path d="m34 53 8 18-10 4-8-18Zm52-25 7-3 10 22-7 3Z" fill={gold} />
      <ellipse cx="99" cy="37" rx="4" ry="12" transform="rotate(-24 99 37)" fill={ink} />
      <path d="m46 53 35-16" stroke={paper} strokeWidth="2" />
      <circle cx="72" cy="63" r="5" fill={gold} />
      <Engraving d="m45 64 34-15M50 91h8m26 0h9m-24 4h8" />
      <Star x={39} y={30} />
      <Star x={126} y={63} size={4} />
      <Star x={118} y={86} size={3} />
    </>
  ),
  locket: (
    <>
      <path d="M47 41Q31 4 82 18q44 11 25 26" fill="none" stroke={gold} strokeWidth="3" />
      <path d="M49 41q-9-24 25-23m10 2q27 8 25 21" fill="none" strokeWidth=".8" />
      <ellipse cx="53" cy="67" rx="25" ry="29" fill={gold} transform="rotate(-14 53 67)" />
      <ellipse cx="53" cy="67" rx="20" ry="24" fill={coral} transform="rotate(-14 53 67)" />
      <ellipse cx="106" cy="67" rx="25" ry="29" fill={gold} transform="rotate(14 106 67)" />
      <ellipse cx="106" cy="67" rx="20" ry="24" fill={ink} transform="rotate(14 106 67)" />
      <path d="M98 78q2-8 0-14l-4-1 5-9 13-2 5 13-5 9 1 8Z" fill={paper} stroke="none" />
      <path d="m97 54-3-12 8 5 5-8 5 9 8-3-4 11Z" fill={gold} />
      <path d="M80 57v20" strokeWidth="4" />
      <path d="m45 65 5-9 11 6-1 12-8 6-9-10Z" fill={paper} />
      <Engraving d="m48 69 10-4m-5-6-4 15M40 43l3 4m-10 8 4 2m-7 10h5m2 17 5-2m16 11v-4m59-47-3 4m12 8-5 2m8 14h-5m-2 15-4-3m-14 12v-4" />
    </>
  ),
  harlequin: (
    <>
      <path d="M27 49 44 21l19 23 17-29 18 29 19-23 17 28-11 13H37Z" fill={gold} />
      <path d="M40 46q18-13 40 0 22-13 40 0l-9 31-31 20-31-20Z" fill={ink} />
      <path d="M40 46q18-13 40 0v51L49 77Z" fill={coral} />
      <path
        d="m48 48 16 8-11 13-10-10Zm16 8 16-10v27L64 82 53 69Zm16 17 17-13 13 13-17 14Z"
        fill={paper}
        strokeWidth=".7"
      />
      <path d="M50 56q13-7 23 5-14 9-23-5Zm37 5q11-12 23-5-10 14-23 5Z" fill={ink} stroke={gold} />
      <path d="m80 59-4 16h9M69 83q11 6 22-3" fill="none" stroke={gold} strokeWidth="1.1" />
      <circle cx="44" cy="21" r="3" fill={coral} />
      <circle cx="80" cy="15" r="3" fill={coral} />
      <circle cx="117" cy="21" r="3" fill={coral} />
      <path d="M40 56 21 68l12 5-7 11m94-28 19 12-12 5 7 11" fill="none" strokeWidth="2" />
    </>
  ),
  undertow: (
    <>
      <path
        d="M20 79q13-9 26 0t26 0 26 0 26 0 18 0M24 91q13-9 26 0t26 0 26 0 26 0"
        fill="none"
        stroke={gold}
        strokeWidth="1.2"
      />
      <circle cx="80" cy="29" r="11" fill={paper} strokeWidth="4" />
      <path d="M80 39v47Q49 83 44 62m36 24q31-3 36-24M61 48h38" fill="none" strokeWidth="6" />
      <path d="m43 57-9 16 13-3Zm74 0 9 16-13-3Z" fill={ink} />
      <path d="M113 17Q130 45 93 54T66 72q24 12 8 25" fill="none" stroke={coral} strokeWidth="4" />
      <path
        d="M113 17Q130 45 93 54T66 72q24 12 8 25"
        fill="none"
        stroke={paper}
        strokeWidth=".8"
        strokeDasharray="2 4"
      />
      <Engraving d="M77 43v30M64 45h10m12 0h10M51 71q5 8 15 10m31 0 11-9" />
    </>
  ),
  hourglass: (
    <>
      <path
        d="M48 25h64l-4 17q-3 8-21 14 18 7 21 14l4 20H48l4-20q3-7 21-14-18-6-21-14Z"
        fill={paper}
      />
      <path
        d="M56 32h48q-2 15-24 21Q59 46 56 32Zm-2 53q8-8 26-21 18 13 26 21Z"
        fill={gold}
        stroke="none"
      />
      <path d="M80 54v14" stroke={coral} strokeWidth="1" />
      <path d="M43 22h74v7H43Zm0 64h74v7H43Z" fill={ink} />
      <path d="M44 30v55m72-55v55" stroke={coral} strokeWidth="3" />
      <path
        d="M57 32q0 13 15 19M58 72l-3 10m39-31q10-7 9-17"
        fill="none"
        stroke={ink}
        strokeWidth=".7"
      />
      <Engraving d="M52 18h56M52 97h56m-73-44 5 3-5 3m92-6-5 3 5 3M69 81h3m7-4h3m4 6h5" />
      <Star x={29} y={33} size={4} />
      <Star x={131} y={81} size={4} />
    </>
  ),
  sundial: (
    <>
      <circle cx="112" cy="30" r="12" fill={coral} stroke="none" />
      <path d="M112 10v4m16 2-3 4m8 10h5m-42-9 4 2m28 20 4 3" stroke={gold} />
      <path d="M31 71v7q47 37 99-1v-7" fill={ink} />
      <ellipse cx="80" cy="67" rx="51" ry="26" fill={gold} />
      <ellipse cx="80" cy="65" rx="43" ry="20" fill={paper} />
      <path d="m80 68 35 5-31-9Z" fill={coral} stroke="none" />
      <path d="M58 68 79 24l5 44Z" fill={ink} />
      <path d="m79 24 5 44-5 1Z" fill={coral} stroke="none" />
      <Engraving d="M41 62l8 1m-7 12 8-3m6 12 4-5m17 8v-6m22 3-3-5m19-4-8-3m12-11-8 2m-11-14-3 6M51 52l6 5" />
      <path d="M54 96h52" stroke={gold} strokeWidth=".8" />
    </>
  ),
  mosaic: (
    <>
      <path d="M50 22q30-15 60 0v66q-30 15-60 0Z" fill={ink} />
      <path d="M55 26q25-12 50 0v58q-25 12-50 0Z" fill={paper} />
      <path d="m80 30 13 14-13 14-13-14Zm0 28 13 13-13 14-13-14Z" fill={coral} />
      <path d="m59 40 21 18-21 16Zm42 0L80 58l21 16Z" fill={gold} />
      <circle cx="80" cy="58" r="7" fill={ink} />
      <path d="m55 26 12 18-12 3m50-21L93 44l12 3M55 74l12-3-6 17m44-14-12-3 6 17" fill="none" />
      <path
        d="m29 36 12-3 3 12-12 3Zm-3 32 14-4 4 14-14 4Zm92-10 14 4-4 14-14-4Zm6-28 10 3-3 10-10-3Z"
        fill={gold}
        strokeWidth="1"
      />
      <Engraving d="m31 39 8 4m-8 29 8 5m80-8 8-3M73 30l5 6m7 41 4-5" />
    </>
  ),
  glassblower: (
    <>
      <path d="m22 29 74 34" strokeWidth="4" />
      <path d="m23 28 73 34" stroke={gold} strokeWidth="1.4" />
      <path d="M96 59q13-7 26 5 14 14 1 25-17 13-29-5-7-11-3-20Z" fill={coral} />
      <path d="M100 64q13-5 22 8 4 5 2 10" fill="none" stroke={paper} strokeWidth="2" />
      <path d="M53 58v10q-19 9-18 20 1 11 17 11t18-11q0-11-12-20V58Z" fill={gold} />
      <path d="M41 87q2-7 9-11m9 18q7-2 6-9" fill="none" stroke={paper} strokeWidth="1.5" />
      <path d="M48 58h14m-12 5h10M40 99h27" />
      <path d="M102 43q-7-7 0-15m12 22q-6-10 2-15" fill="none" stroke={gold} strokeWidth="1" />
      <Engraving d="M108 88q9 3 14-5M39 30l-3 6m8-4-3 6m8-4-3 6M45 80l-4 6m4-2-2 6" />
    </>
  ),
  orchard: (
    <>
      <path
        d="M31 97Q85 72 110 17M63 77Q39 57 36 34m49 18q26 8 44-11"
        fill="none"
        strokeWidth="3"
      />
      <path
        d="M71 69q-27-19-15-31 17 3 15 31Zm26-33q-21-9-10-22 14 6 10 22Zm8 13q7-21 23-16-3 16-23 16ZM48 56Q19 62 24 46q15-9 24 10Z"
        fill={ink}
        stroke="none"
      />
      <path d="M83 53q-8-8-13 0-4 5-2 13-10 15 1 23 14 9 22-6 4-8-3-16Z" fill={gold} />
      <path d="M111 57q-6-7-12 0l1 11q-12 14-1 22 14 8 19-6 3-6-4-17Z" fill={coral} />
      <path d="M52 29q-6-6-11 0l-1 8q-11 9-4 17 11 8 18-3 4-7-1-12Z" fill={coral} />
      <path d="M78 54q0-7 7-11m22 13-1-7M47 29l1-9" fill="none" />
      <Engraving d="M72 72q-9 13 2 15m28-16q-7 12 0 16M40 40q-7 8 1 12M60 47l8 16m-35-13 9 3M94 23l2 7" />
    </>
  ),
  compass: (
    <>
      <path d="m25 80 15-49 38 4 42-13 14 48-40 14-36-4Z" fill={gold} stroke="none" opacity=".4" />
      <Engraving d="M31 74l18-37 28 7 40-14m-12 45 20-10m-81 5 16 6m-9-23 17 6" />
      <circle cx="80" cy="58" r="34" fill={ink} />
      <circle cx="80" cy="58" r="29" fill={paper} />
      <circle cx="80" cy="58" r="23" fill="none" stroke={gold} strokeWidth=".8" />
      <path
        d="M80 24v7m0 54v7m-34-34h7m54 0h7M56 34l5 5m38 38 5 5m-48 0 5-5m38-38 5-5"
        stroke={gold}
        strokeWidth="1.3"
      />
      <path d="m65 81 9-26 21-20-9 26Z" fill={ink} />
      <path d="m74 55 21-20-9 26Z" fill={coral} />
      <circle cx="80" cy="58" r="3" fill={gold} />
      <path d="M76 20v-5h8v5" fill="none" />
      <Star x={30} y={22} size={4} />
    </>
  ),
  encore: (
    <>
      <path d="M30 22h100v69H30Z" fill={ink} />
      <path d="M32 23h96q-3 22-24 20L80 31Q54 54 32 23Z" fill={coral} />
      <path d="M33 25q15 18 26 17-8 22-26 25V92H23Z" fill={coral} />
      <path d="M127 25q-15 18-26 17 8 22 26 25V92h10Z" fill={coral} />
      <path d="M30 90h100v5H30Z" fill={gold} />
      <path
        d="M64 48q-10 0-10 10 0 13 15 20v8h22v-8q15-7 15-20 0-10-10-10l-3 7q8-2 8 4-1 12-21 15-20-3-21-15 0-6 8-4Z"
        fill={gold}
      />
      <path
        d="M63 52q17 6 34 0M68 55v19m8-17v20m8-20v20m8-22v19"
        fill="none"
        stroke={paper}
        strokeWidth=".8"
      />
      <path d="M69 83h22m-24 4h26" stroke={paper} strokeWidth=".7" />
      <path d="M30 65l13-4m75 0 13 4" stroke={gold} strokeWidth="3" />
      <Engraving d="M31 35l-1 20m7-11-2 11m89-20 4 20m-6-11 2 11M54 36l-7-5m18 1-5-5m38 9 8-5" />
    </>
  ),
  palimpsest: (
    <>
      <path d="M37 29h76v60H37Z" fill={gold} transform="rotate(-9 75 60)" />
      <path d="M37 36h74v58H37Z" fill={coral} transform="rotate(5 74 65)" />
      <path d="M33 25h61q10 0 10 10v47h12q2 12-10 12H45q-8 0-8-10V38H25q-2-13 8-13Z" fill={paper} />
      <path d="M25 38h12v-4q0-9-7-8m74 56H45q-3 12 6 12" fill="none" />
      <Engraving d="M46 43h41M46 48h31M46 56h38M46 61h22M46 68h32M46 73h26m-25-27 23-2m-21 16 32-4m-31 17 18-3" />
      <path d="M78 84q24-34 38-65 15-9 17 4-6 30-40 47Z" fill={ink} />
      <path d="M78 84q22-36 48-62" fill="none" stroke={gold} strokeWidth="1.2" />
      <path
        d="m104 35 4 14 12-2m-23 0 3 11 9-1m-17 0 2 11"
        fill="none"
        stroke={paper}
        strokeWidth=".6"
      />
    </>
  ),
};
