import type { ReactNode } from 'react';
import { copper, ink, metal, shade, shadow } from './primitives';

function SideHand({ transform }: { transform: string }) {
  return (
    <g transform={transform}>
      <path
        d="M-22-17Q-15-24-3-25L15-27Q26-31 32-23Q40-24 44-17Q47-11 42-5Q48 0 45 8Q44 13 38 15Q40 24 32 28L13 31Q-2 31-12 21L-24 16Z"
        fill={shadow}
      />
      <path
        d="M-20-15Q-13-21-2-22L15-24Q24-27 29-21L31-11 38-5 35 12 26 22 9 26Q-3 25-12 17L-22 12Z"
        fill={metal}
      />
      <path d="M-19-15Q-8-24 8-22L15-24Q23-25 26-20L25-13Q10-13-1-9L-18-3Z" fill={ink} />
      <path d="M14-23Q24-29 29-21L32-11 25-8 17-10Z" fill={metal} />
      <path d="M29-20Q36-22 40-16Q43-11 38-7L31-5 26-12Z" fill={metal} />
      <path d="M36-6Q44-4 42 4Q42 9 35 11L29 8 30-1Z" fill={metal} />
      <path d="M32 11Q39 13 35 21Q31 26 25 24L24 16Z" fill={shade} />
      <path
        d="M17-22Q23-25 26-20L27-16 20-14ZM31-17Q36-19 39-14L38-11 32-9ZM36-3Q41-2 39 4L35 5Z"
        fill={ink}
      />
      <path d="M-17-2Q-4-8 7-10L17-8 20 3 13 13 1 15-11 10Z" fill={shade} opacity=".5" />
      <path
        d="M8-19Q16-16 20-9M20-13l5 6m7 2 4 4m-8 6 4 4"
        fill="none"
        stroke={shade}
        strokeWidth="1.3"
      />
      <path d="M-16-9Q-7-14 3-15" fill="none" stroke={metal} strokeWidth="1.4" />
      <path d="M-15 8Q-7 1 0 7L11 14Q21 12 25 19Q29 26 19 28L7 27Q-5 26-12 19Z" fill={shade} />
      <path d="M-14 8Q-7 4-1 10L9 17Q19 14 22 20Q25 24 18 25L7 24Q-4 22-10 17Z" fill={metal} />
      <path d="M-13 8Q-7 5-1 10L9 17 16 17 20 20 8 20-3 13Z" fill={ink} />
      <path
        d="M-12-1Q2-8 14-8M17-12l7-2M30-4l7-3M30 4l6-2M0 18l6 3"
        fill="none"
        stroke={shade}
        strokeWidth="1"
      />
    </g>
  );
}

function PalmHand({ transform }: { transform: string }) {
  return (
    <g transform={transform}>
      <path
        d="M-22 14Q-30 6-29-5L-28-17Q-28-26-20-28Q-16-29-11-25Q-8-33 1-32Q7-32 11-27Q18-30 24-23Q31-23 34-16L34-4Q33 9 22 20L13 27-9 25Z"
        fill={shadow}
      />
      <path d="M-25-15Q-26-23-20-24Q-15-25-12-20L-10-5-14 3-23 0Z" fill={metal} />
      <path d="M-10-22Q-9-29-2-28Q5-29 7-21L8-6 2 0-8-3Z" fill={metal} />
      <path d="M7-21Q9-28 16-25Q23-22 23-14L22-5 15 0 8-5Z" fill={metal} />
      <path d="M23-18Q29-19 30-12L30-4 24 2 19-2 22-7Z" fill={shade} />
      <path
        d="M-24-16Q-23-23-18-21L-14-17-13-10-22-9ZM-8-21Q-7-27-2-25L3-22 4-14-7-14ZM10-21Q14-25 18-20L20-12 12-10Z"
        fill={ink}
      />
      <path d="M-23 1-13 5-5 1 4 5 13 0 22 3 28-2Q28 13 15 22L-6 22-18 13Z" fill={metal} />
      <path d="M12 4 22 3 28-2Q28 13 15 22L4 23 9 14Z" fill={shade} />
      <path d="M-17 0Q-7-3 0 2L9 6 16 3 21 7 16 17 5 20-10 15Z" fill={shade} />
      <path
        d="M-24-5Q-19-11-12-5L-2 5Q7 3 14 11Q18 18 10 22L-1 24Q-15 24-22 12L-27 3Q-29-2-24-5Z"
        fill={shade}
      />
      <path
        d="M-23-3Q-19-7-14-2L-5 8Q5 5 10 12Q15 17 7 20L-1 21Q-11 20-18 12L-24 4Q-27-1-23-3Z"
        fill={metal}
      />
      <path d="M-23-3Q-19-6-14-1L-5 8 3 8 9 13-1 12-11 5-19 0Z" fill={ink} />
      <path
        d="m-22-5 7-1m-5 6 6-1M-7-9l11-1M-6-5l10-1m8-1 7-3M-12 12l7 4M4 19l2-5"
        fill="none"
        stroke={shade}
        strokeWidth=".85"
      />
    </g>
  );
}

/** Close action studies: a single continuous arm carries the leading contour. */
function Bash({ upgraded = false }: { upgraded?: boolean }) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* The guard recedes behind the striking knuckles. */}
      <path
        d={
          upgraded
            ? 'M135 23 149 34 146 64 138 72 145 86 133 98 124 80 131 63 122 46Z'
            : 'M130 25 148 35 145 73Q141 85 130 92L117 77 120 48Z'
        }
        fill={shadow}
      />
      <path
        d={
          upgraded
            ? 'M137 30 145 38 141 62 132 69 138 84 134 90 129 79 136 62 129 46Z'
            : 'M132 30 144 38 141 72Q139 80 131 86L123 75 126 48Z'
        }
        fill={shade}
      />
      <path
        d={
          upgraded
            ? 'M137 30 132 43 140 53 130 65m4 10 5 10-4 6'
            : 'M132 30 129 46 134 53 127 62 132 72 128 82'
        }
        fill="none"
        stroke={metal}
        strokeWidth="1.5"
      />
      <path d="m133 49 5 6-5 10 3 6" fill="none" stroke={shadow} strokeWidth="2" />
      {/* A broad, rounded bracer narrows into a strapped wrist. */}
      <g transform={upgraded ? 'translate(5 -4)' : undefined}>
        <path d="M9 78Q26 64 45 59L68 49 78 70 51 88Q33 100 16 103Z" fill={shadow} />
        <path d="M11 77Q32 63 49 60L67 53 73 69 47 85Q29 94 16 97Z" fill={metal} />
        <path d="M16 85Q30 79 39 75L57 65 65 65 69 73 47 86Q30 96 16 98Z" fill={shade} />
        <path d="M11 77Q31 63 49 60L65 54 62 61 39 69Q25 73 14 84Z" fill={ink} />
        <path d="M31 67Q31 80 40 90L48 86Q39 76 40 64Z" fill={copper} />
        <path d="M33 68Q34 80 41 86" fill="none" stroke={ink} strokeWidth=".8" />
        <path d="M60 53Q58 66 68 77L79 70 73 47Z" fill={shadow} />
        <path d="M62 52Q61 63 69 73L76 69 70 49Z" fill={copper} />
        <path d="M64 53Q64 63 69 68" fill="none" stroke={ink} strokeWidth="1.2" />
        {/* The curled fingers share a continuous palm, with unequal knuckle planes. */}
        <SideHand transform="translate(88 54) rotate(-13)" />
      </g>
      <path d="m137 44 6-4m-8 25 6 4" fill="none" stroke={copper} strokeWidth="1.5" />
      <path d="M17 56Q36 48 52 47" fill="none" stroke={copper} strokeWidth="1" opacity=".45" />
    </g>
  );
}

function Uppercut({ upgraded = false }: { upgraded?: boolean }) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* One quiet rising crescent leaves open space around the hand. */}
      <path
        d={upgraded ? 'M21 101Q9 56 65 17Q28 53 35 96Z' : 'M24 99Q14 61 57 29Q30 61 37 94Z'}
        fill={copper}
        opacity=".28"
      />
      <path d="M26 92Q21 63 43 42" fill="none" stroke={copper} strokeWidth="1" opacity=".6" />
      {/* The bent forearm continues into the fitted wrist. */}
      <g transform={upgraded ? 'translate(6 3) rotate(-12 56 103)' : undefined}>
        <path d="M48 105Q41 89 48 79L65 62 70 48 94 53Q94 70 85 85L78 106Z" fill={shadow} />
        <path d="M52 103Q46 90 53 82L70 65 74 51 89 55Q88 70 79 85L74 104Z" fill={metal} />
        <path d="M52 103Q46 90 53 82L70 65 74 51 78 55Q74 75 62 86L60 104Z" fill={ink} />
        <path d="M64 79Q75 69 79 57L89 55Q88 71 79 85L74 104 61 105Z" fill={shade} />
        <path d="M54 81Q64 85 79 87L81 78Q69 79 61 73Z" fill={copper} />
        <path d="M56 81Q65 85 77 85" fill="none" stroke={ink} strokeWidth=".9" />
        <path d="M63 63Q77 72 90 66L94 54 70 47Z" fill={shadow} />
        <path d="M66 61Q78 68 89 63L91 56 71 51Z" fill={copper} />
        <path d="M69 57Q78 63 89 60" fill="none" stroke={ink} strokeWidth="1.1" />
        <PalmHand transform="translate(84 37) rotate(17)" />
      </g>
      <path d="M113 26q6 11 4 22" fill="none" stroke={copper} strokeWidth="1" opacity=".5" />
    </g>
  );
}

function Anger({ upgraded = false }: { upgraded?: boolean }) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* Descending weight, with a quiet arc behind the wrist. */}
      <path
        d={
          upgraded
            ? 'M62 12Q117 23 126 73L116 64Q105 29 62 20Z'
            : 'M62 17Q105 23 119 66L110 58Q97 31 62 24Z'
        }
        fill={copper}
        opacity=".23"
      />
      <path
        d={
          upgraded
            ? 'M21 14Q44 14 63 21L82 25 82 48 58 45Q39 36 19 31Z'
            : 'M17 16Q41 17 59 25L74 30 73 51 52 45Q35 35 16 33Z'
        }
        fill={shadow}
      />
      <path
        d={
          upgraded
            ? 'M22 17Q45 18 62 25L77 29 76 43 58 41Q39 33 21 28Z'
            : 'M18 19Q41 21 57 28L70 34 68 46 52 41Q35 32 18 30Z'
        }
        fill={metal}
      />
      <path
        d={
          upgraded
            ? 'M22 17Q44 18 61 24L75 29 68 32 51 27 22 23Z'
            : 'M18 19Q41 21 57 28L68 34 59 35 42 28 18 25Z'
        }
        fill={ink}
      />
      <path
        d={
          upgraded
            ? 'M22 28Q39 33 58 41L76 43 77 36 59 33 39 27Z'
            : 'M18 30Q36 33 52 41L68 46 70 39 54 34 34 28Z'
        }
        fill={shade}
      />
      <path
        d={
          upgraded
            ? 'M44 21Q40 29 41 36L48 39Q47 29 52 24Z'
            : 'M36 23Q33 29 34 35L42 38Q40 31 44 26Z'
        }
        fill={copper}
      />
      <path
        d={upgraded ? 'M68 24Q64 32 66 43L80 48 84 29Z' : 'M58 27Q55 36 58 46L73 52 77 33Z'}
        fill={shadow}
      />
      <path
        d={upgraded ? 'M70 26Q67 34 69 42L78 44 81 30Z' : 'M60 29Q58 37 61 45L71 48 74 34Z'}
        fill={copper}
      />
      <SideHand
        transform={
          upgraded
            ? 'translate(81 52) rotate(70) scale(.92)'
            : 'translate(76 51) rotate(57) scale(.92)'
        }
      />
      <path
        d={
          upgraded
            ? 'M68 104 80 99 90 103 99 95 113 102M93 100l2-8'
            : 'M66 102 78 98 87 102 98 98 109 103'
        }
        fill="none"
        stroke={shade}
        strokeWidth="2"
      />
      <path
        d={upgraded ? 'm108 89 7-3m-51 5-7-4m38 8 1-4' : 'm106 92 5-2m-44 1-5-3'}
        fill="none"
        stroke={copper}
        strokeWidth="1.2"
      />
    </g>
  );
}

function Flex({ upgraded = false }: { upgraded?: boolean }) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* Shoulder, biceps, elbow and forearm form one curling contour. */}
      <path
        d={
          upgraded
            ? 'M8 107Q11 80 24 62Q39 46 55 60Q63 65 65 75Q74 59 73 44L94 41Q99 70 86 91Q77 109 58 108Q41 107 28 93L26 108Z'
            : 'M10 106Q14 80 26 65Q40 52 55 65Q63 70 66 79Q75 63 75 49L94 47Q99 73 88 92Q79 109 60 108Q43 107 30 94L28 108Z'
        }
        fill={shadow}
      />
      <path
        d={
          upgraded
            ? 'M13 105Q15 79 28 64Q40 53 52 64Q59 70 62 82L67 84Q80 63 77 46L90 45Q94 68 82 90Q74 104 59 104Q41 102 28 87L22 106Z'
            : 'M15 104Q19 80 30 68Q41 59 52 70Q59 76 63 86L69 88Q81 67 79 51L90 50Q94 71 84 90Q76 104 61 104Q44 102 30 89L24 106Z'
        }
        fill={copper}
      />
      <path
        d={
          upgraded
            ? 'M17 95Q17 78 30 65Q40 57 50 66Q56 72 58 80Q43 68 32 81L23 97Z'
            : 'M19 97Q20 81 31 69Q41 62 50 72Q55 77 58 85Q44 74 34 85L26 100Z'
        }
        fill={ink}
        opacity=".55"
      />
      <path
        d={
          upgraded
            ? 'M30 86Q43 77 57 91L67 96Q79 87 86 67L88 80Q79 103 59 104Q42 101 30 86Z'
            : 'M32 90Q45 82 59 95L69 98Q81 89 88 69L89 82Q80 103 61 104Q45 103 32 90Z'
        }
        fill="#805d49"
      />
      <path
        d={
          upgraded
            ? 'M76 49Q84 52 93 47L92 64Q89 80 78 91L68 86Q82 69 76 49Z'
            : 'M77 55Q86 60 94 53L93 69Q90 83 80 93L71 88Q83 73 77 55Z'
        }
        fill={shade}
      />
      <path
        d={
          upgraded
            ? 'M78 50 86 52Q88 69 76 86L71 84Q82 68 78 50Z'
            : 'M79 57 87 59Q88 77 78 88L74 87Q84 72 79 57Z'
        }
        fill={metal}
      />
      <path
        d={
          upgraded
            ? 'M74 43Q84 48 94 41L96 49Q86 57 75 51Z'
            : 'M75 49Q85 54 94 47L97 56Q87 64 76 57Z'
        }
        fill={shadow}
      />
      <path
        d={
          upgraded
            ? 'M77 44Q85 49 92 44L93 49Q86 53 78 49Z'
            : 'M78 50Q86 55 92 50L94 55Q86 60 79 55Z'
        }
        fill={copper}
      />
      <PalmHand
        transform={
          upgraded
            ? 'translate(74 31) rotate(-34) scale(.72)'
            : 'translate(83 35) rotate(-18) scale(.72)'
        }
      />
      <path
        d={upgraded ? 'M30 71q11-8 22 5m-30-11 4-8m29 5 6-5' : 'M33 76q10-6 19 5'}
        fill="none"
        stroke={ink}
        strokeWidth="1.1"
        opacity=".65"
      />
    </g>
  );
}

function Pummel({ upgraded = false }: { upgraded?: boolean }) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* A lower-contrast return hand sits behind the foreshortened near punch. */}
      <g opacity=".64" transform={upgraded ? 'translate(-4 7) rotate(-10 55 40)' : undefined}>
        <path d="M9 47Q25 34 42 28L51 40 34 54 14 66Z" fill={shadow} />
        <path d="M11 48Q27 37 42 32L47 40 31 51 14 60Z" fill={shade} />
        <path d="M12 47Q26 36 40 32L42 37 26 43 14 53Z" fill={metal} />
        <path d="M36 32Q36 41 42 47L51 40 46 29Z" fill={copper} />
        <SideHand transform="translate(58 28) rotate(-15) scale(.63)" />
      </g>
      <g transform={upgraded ? 'translate(6 -7)' : undefined}>
        <path d="M12 88Q38 72 62 64L82 53 96 76 67 90Q43 99 20 107Z" fill={shadow} />
        <path d="M15 89Q39 75 63 68L81 57 90 74 65 86Q43 96 21 102Z" fill={metal} />
        <path d="M15 88Q38 75 63 67L80 58 82 64 57 77 34 83 19 95Z" fill={ink} />
        <path d="M20 102Q43 96 65 86L90 74 85 69 66 78 41 87Z" fill={shade} />
        <path d="M47 74Q46 84 54 91L63 88Q54 78 57 71Z" fill={copper} />
        <path d="M74 59Q74 71 83 81L95 75 87 53Z" fill={shadow} />
        <path d="M77 59Q77 70 85 77L92 74 85 56Z" fill={copper} />
        <PalmHand transform="translate(103 58) rotate(72) scale(.91)" />
      </g>
      <path
        d={upgraded ? 'M103 24q22 3 33 15m-9 41 15-3' : 'M104 30q19 3 28 13m-7 43 13-2'}
        fill="none"
        stroke={copper}
        strokeWidth="1.2"
        opacity=".65"
      />
    </g>
  );
}

function Rage({ upgraded = false }: { upgraded?: boolean }) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* The crossed forearms carry the force; the fists remain unequal and separated. */}
      <path d="M122 106Q106 84 76 61L64 54 49 73Q67 93 83 108Z" fill={shadow} />
      <path d="M117 104Q101 82 75 65L64 59 55 72Q71 90 85 103Z" fill={shade} />
      <path d="M113 101Q97 79 75 65L64 59 59 66Q82 79 99 102Z" fill={metal} />
      <path d="M96 80 87 75Q83 81 82 88L91 95Q92 86 96 80Z" fill={copper} />
      <path
        d={upgraded ? 'M49 49 65 43 77 62 67 73 53 61Z' : 'M43 57 60 49 72 67 61 79 48 67Z'}
        fill={shadow}
      />
      <path
        d={upgraded ? 'M52 49 63 46 73 62 66 69 56 59Z' : 'M46 57 58 52 68 67 60 75 51 65Z'}
        fill={copper}
      />
      <PalmHand
        transform={
          upgraded
            ? 'translate(60 43) rotate(-35) scale(.68)'
            : 'translate(54 50) rotate(-35) scale(.68)'
        }
      />
      <path d="M32 106Q47 78 77 56L90 47 108 65Q88 87 73 107Z" fill={shadow} />
      <path d="M38 104Q53 79 79 60L90 52 102 65Q83 84 70 104Z" fill={metal} />
      <path d="M38 104Q50 81 79 60L90 52 94 58Q66 78 51 104Z" fill={ink} />
      <path d="M51 104Q68 81 94 58L102 65Q83 84 70 104Z" fill={shade} />
      <path d="M57 79Q67 81 76 89L82 81Q74 73 65 71Z" fill={copper} />
      <path d="M61 77Q69 79 75 84" fill="none" stroke={ink} strokeWidth=".9" />
      <path d="M83 51Q91 62 103 63L109 52 91 42Z" fill={shadow} />
      <path d="M87 50Q94 58 101 59L105 52 93 46Z" fill={copper} />
      <PalmHand
        transform={
          upgraded
            ? 'translate(99 33) rotate(17) scale(.82)'
            : 'translate(100 32) rotate(25) scale(.78)'
        }
      />
      <path
        d={upgraded ? 'm32 35 9 4m31-14 4-7m49 28 8-4' : 'm34 43 7 3m79 2 7-3'}
        fill="none"
        stroke={copper}
        strokeWidth="1.2"
        opacity=".65"
      />
    </g>
  );
}

export const physicalActionScenes: Record<string, ReactNode> = {
  bash: <Bash />,
  anger: <Anger />,
  flex: <Flex />,
  pummel: <Pummel />,
  rage: <Rage />,
  uppercut: <Uppercut />,
};

export const physicalActionUpgrades: Record<string, ReactNode> = {
  bash: <Bash upgraded />,
  anger: <Anger upgraded />,
  flex: <Flex upgraded />,
  pummel: <Pummel upgraded />,
  rage: <Rage upgraded />,
  uppercut: <Uppercut upgraded />,
};
