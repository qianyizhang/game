import type { ReactNode } from 'react';
import { ChallengeSymbol } from '../../../shared/art/ChallengeArt';

const ink = '#293630',
  ivory = '#ecdcb6',
  gold = '#bf9558',
  rust = '#b9634c',
  sage = '#92a77a',
  teal = '#739b99',
  plum = '#8d7598';
const edge = { stroke: ink, strokeWidth: 1.4, strokeLinejoin: 'round' as const };
function Cut({ d, color = ivory }: { d: string; color?: string }) {
  return <path d={d} fill="none" stroke={color} strokeWidth=".9" strokeLinecap="round" />;
}
function Leaf({ x = 32, y = 12 }: { x?: number; y?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0Q4-13 17-10Q15 2 0 0Z" fill={sage} {...edge} />
      <Cut d="M2-1L12-7" />
    </g>
  );
}
function Blood({ dark = false }: { dark?: boolean }) {
  return (
    <>
      <path
        d={
          dark
            ? 'M33 4C33 19 53 25 53 41C53 62 12 62 12 41C12 28 30 19 33 4Z'
            : 'M30 4C37 16 27 22 37 30L44 18C46 29 56 32 52 46C46 63 17 59 12 46C7 31 24 28 19 15L29 24Z'
        }
        fill={dark ? '#55475e' : rust}
        {...edge}
      />
      <path
        d="M30 27C32 38 19 37 23 48C27 58 44 51 42 42L37 35C39 47 28 48 30 40Z"
        fill={dark ? plum : gold}
      />
      <Cut d="M17 43Q16 51 25 54M42 47L39 50" />
    </>
  );
}
const relics: Record<string, ReactNode> = {
  ringOfTheSnake: (
    <>
      <path
        d="M43 14C12 0 0 46 25 55C49 65 63 31 47 17L40 22C52 33 44 51 30 48C14 45 16 21 31 21L36 24Z"
        fill={gold}
        {...edge}
      />
      <path d="M32 13L41 8 52 12 56 21 45 25 34 21Z" fill={sage} {...edge} />
      <path d="M43 15L49 16 45 18Z" fill={ink} />
      <Cut d="M17 24Q7 41 23 50M21 20L27 17M43 39L47 33M34 52L39 49" />
    </>
  ),
  burningBlood: <Blood />,
  blackBlood: <Blood dark />,
  oddlySmoothStone: <ChallengeSymbol kind="stone" />,
  lantern: <ChallengeSymbol kind="hint" />,
  vajra: (
    <g transform="rotate(38 32 32)">
      <path d="M28 20H36V44H28Z" fill={gold} {...edge} />
      <path d="M32 5C20 8 16 18 25 23L32 19 39 23C48 18 44 8 32 5Z" fill={ivory} {...edge} />
      <path d="M32 59C20 56 16 46 25 41L32 45 39 41C48 46 44 56 32 59Z" fill={ivory} {...edge} />
      <Cut d="M32 7L29 17 32 20 35 17ZM32 57L29 47 32 44 35 47ZM28 27H36M28 36H36" color={gold} />
    </g>
  ),
  anchor: (
    <>
      <circle cx="32" cy="12" r="7" fill="none" stroke={gold} strokeWidth="4" />
      <path d="M32 19V51M18 26H46" stroke={gold} strokeWidth="5" />
      <path
        d="M32 53Q10 53 9 35L5 40 7 28 20 34 14 35Q18 45 29 46V31H35V46Q47 43 50 35L44 34 57 28 59 40 55 35Q53 53 32 57Z"
        fill={gold}
        {...edge}
      />
      <Cut d="M16 42Q21 49 28 50M37 50Q46 47 50 42" />
    </>
  ),
  bagOfPreparation: (
    <>
      <path d="M18 20L20 8 42 10 43 24" fill={ivory} {...edge} />
      <path d="M31 11L30 22M23 14L27 15" stroke={gold} />
      <path d="M12 20Q33 16 53 22L50 54Q29 61 10 52Z" fill="#8e6446" {...edge} />
      <path d="M11 20Q32 16 53 22L48 36 29 40 13 34Z" fill={rust} {...edge} />
      <path d="M29 20H35V43H29Z" fill={gold} {...edge} />
      <rect
        x="27"
        y="30"
        width="10"
        height="9"
        rx="1"
        fill="none"
        stroke={ivory}
        strokeWidth="1.2"
      />
      <Cut d="M15 24L16 30 24 33M14 42V48L23 51M41 49L47 47" />
    </>
  ),
  bagOfMarbles: (
    <>
      <path
        d="M21 10L15 7 29 4 38 8 31 15C36 26 45 40 36 47C26 55 8 47 9 36C9 26 22 22 21 10Z"
        fill={plum}
        {...edge}
      />
      <path d="M19 14L34 17M24 18Q18 26 16 32" stroke={gold} strokeWidth="1.7" />
      {[
        [42, 44, teal],
        [29, 53, gold],
        [52, 53, rust],
      ].map(([x, y, c], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="7" fill={c as string} {...edge} />
          <path
            d={`M${Number(x) - 3} ${Number(y) - 2}q3-5 7 0`}
            stroke={ivory}
            strokeWidth="1"
            fill="none"
          />
        </g>
      ))}
    </>
  ),
  orichalcum: (
    <>
      <path d="M13 19L32 7 50 18 56 42 39 57 15 50 7 34Z" fill={gold} {...edge} />
      <path d="M32 7L36 27 13 19 7 34 26 36 15 50 39 57 36 27 50 18Z" fill="#936b45" />
      <path d="M13 19L32 7 28 20 36 27 26 36Z" fill={ivory} />
      <Cut d="M36 27L53 41 39 57M26 36L36 27M16 43L23 39" color={ink} />
    </>
  ),
  akabeko: (
    <>
      <path
        d="M12 30Q16 20 34 26L46 22 54 26 55 39 44 45 42 54H35L34 43 23 44 20 54H13L13 41 8 36Z"
        fill={rust}
        {...edge}
      />
      <path d="M37 19L50 14 60 23 56 36 43 38 36 30Z" fill={rust} {...edge} />
      <path d="M40 19L36 11 44 14M52 16L57 10 59 20" fill={gold} {...edge} />
      <path d="M43 29Q49 25 56 30L54 34 46 35Z" fill={ivory} />
      <circle cx="44" cy="24" r="1.5" fill={ink} />
      <path d="M18 29L30 30 30 38 19 37Z" fill={ivory} />
      <path d="M22 31V35M26 31V35" stroke={gold} />
      <path d="M12 30Q3 29 6 23" stroke={ink} strokeWidth="2" fill="none" />
    </>
  ),
  penNib: (
    <>
      <path d="M12 53L24 17 48 6 56 19 44 40Z" fill={gold} {...edge} />
      <path d="M12 53L36 25 48 6 24 17Z" fill={ivory} />
      <path d="M12 53L36 25M34 29L43 35" stroke={ink} strokeWidth="1.2" />
      <circle cx="36" cy="25" r="3" fill={ink} />
      <path d="M18 58H48" stroke={gold} strokeWidth="1" />
    </>
  ),
  bronzeScales: (
    <>
      {[
        [24, 8],
        [39, 13],
        [13, 23],
        [29, 29],
        [44, 34],
      ].map(([x, y], i) => (
        <g key={i}>
          <path
            d={`M${x - 9} ${y}Q${x} ${y - 4} ${x + 9} ${y}V${y + 11}Q${x + 8} ${y + 21} ${x} ${y + 26}Q${x - 10} ${y + 20} ${x - 9} ${y + 11}Z`}
            fill={i % 2 ? gold : '#a8774e'}
            {...edge}
          />
          <Cut d={`M${x - 5} ${y + 4}V${y + 13}Q${x - 4} ${y + 18} ${x} ${y + 20}`} />
        </g>
      ))}
    </>
  ),
  happyFlower: (
    <>
      <path
        d="M31 35L29 59M30 48Q13 52 11 40 22 37 30 48M31 43Q39 31 51 38 47 49 31 43"
        fill={sage}
        stroke={ink}
        strokeWidth="1.5"
      />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <path
          key={a}
          d="M30 25C17 20 20 5 29 6C38 4 42 19 30 25Z"
          transform={`rotate(${a} 30 26)`}
          fill={gold}
          {...edge}
        />
      ))}
      <circle cx="30" cy="26" r="8" fill={rust} stroke={ink} />
      <Cut d="M26 22Q31 18 35 24M16 43L25 47" />
    </>
  ),
  strawberry: (
    <>
      <path
        d="M13 26C14 12 25 15 32 18C42 10 54 18 53 29C51 41 40 53 32 58C20 48 10 38 13 26Z"
        fill={rust}
        {...edge}
      />
      <path d="M21 20Q13 31 25 48C19 32 31 27 32 20Z" fill="#d38b66" />
      <path d="M32 19L21 22 13 15 28 15 29 7 35 15 47 13 40 22Z" fill={sage} {...edge} />
      <Cut d="M21 27L20 30M33 28L32 31M43 28L42 31M25 38L26 41M38 38L37 41M31 48L32 51" />
    </>
  ),
  warPaint: (
    <>
      <path d="M13 26L39 21 45 53 20 59Z" fill={rust} {...edge} />
      <ellipse cx="26" cy="24" rx="13" ry="5" transform="rotate(-10 26 24)" fill={gold} {...edge} />
      <path d="M23 34L28 49M31 32L36 47" stroke={ivory} strokeWidth="4" />
      <path d="M47 39L48 12 54 10 55 38Z" fill={gold} {...edge} />
      <path d="M47 13Q39 7 51 3Q60 5 54 13Z" fill={ivory} {...edge} />
      <Cut d="M18 32L22 52M51 17V32" />
    </>
  ),
  whetstone: (
    <>
      <path d="M7 39L38 24 57 33 25 51Z" fill="#99a7a0" {...edge} />
      <path d="M7 39L25 46 57 30V40L25 57 7 49Z" fill="#677d75" {...edge} />
      <path d="M19 18L44 7 53 11 28 31 18 34Z" fill={ivory} {...edge} />
      <path d="M19 25L10 18" stroke={gold} strokeWidth="6" />
      <Cut d="M28 49L48 39M26 41L38 35M45 22L50 19" />
    </>
  ),
  regalPillow: (
    <>
      <path d="M8 18Q32 24 55 16L50 35 57 52Q33 46 8 54L14 35Z" fill={plum} {...edge} />
      <path
        d="M15 25Q32 30 48 23L44 36 49 45Q32 40 17 47L21 35Z"
        stroke={gold}
        strokeWidth="1.5"
        fill="none"
      />
      <path d="M32 26L41 35 32 44 25 35Z" fill={gold} />
      <circle cx="33" cy="35" r="3" fill={ivory} />
      <path d="M9 18L5 12M55 16L59 11M8 54L4 58M57 52L60 57" stroke={gold} strokeWidth="3" />
    </>
  ),
  preservedInsect: (
    <>
      <path d="M17 9L42 6 56 26 48 51 22 59 8 40Z" fill={gold} {...edge} />
      <path d="M17 9L23 21 12 38 22 59 8 40ZM42 6L38 22 51 29 48 51 56 26Z" fill="#976841" />
      <ellipse cx="32" cy="34" rx="8" ry="13" fill={ink} />
      <ellipse cx="32" cy="25" rx="6" ry="5" fill={ink} />
      <path
        d="M26 27L18 22M39 27L46 21M24 33L17 35M40 33L47 35M26 41L20 47M39 41L45 47M29 21L26 16M35 21L39 16"
        stroke={ink}
        strokeWidth="1.7"
      />
      <Cut d="M32 28V45M17 17L13 30M45 12L50 22" />
    </>
  ),
  kunai: (
    <>
      <path d="M10 8L36 18 39 39 19 35Z" fill={ivory} {...edge} />
      <path d="M10 8L39 39 36 18Z" fill={teal} />
      <path d="M38 38L48 48" stroke={ink} strokeWidth="7" />
      <path d="M35 41L40 36M39 45L44 40" stroke={gold} strokeWidth="2" />
      <circle cx="52" cy="52" r="7" fill="none" stroke={gold} strokeWidth="4" />
    </>
  ),
  shuriken: (
    <>
      <path
        d="M33 4L38 22 57 13 43 32 60 46 39 43 31 61 26 42 5 48 21 31 6 15 26 21Z"
        fill={teal}
        {...edge}
      />
      <path
        d="M33 4L31 29 57 13 35 34 60 46 32 38 31 61 28 35 5 48 25 31 6 15 29 27Z"
        fill={ivory}
      />
      <circle cx="32" cy="32" r="5" fill={ink} stroke={gold} />
    </>
  ),
  ornamentalFan: (
    <>
      <path d="M32 53L6 28Q9 13 20 17Q24 5 34 14Q45 6 49 20Q62 18 60 32Z" fill={ivory} {...edge} />
      <path d="M32 53L10 27Q16 21 20 26Q25 14 33 22Q43 14 46 27Q53 23 57 31Z" fill={rust} />
      <path
        d="M32 53L6 28M32 53L20 17M32 53L34 14M32 53L49 20M32 53L60 32"
        stroke={gold}
        strokeWidth="1.2"
      />
      <circle cx="32" cy="53" r="3" fill={gold} stroke={ink} />
    </>
  ),
  meatOnTheBone: (
    <>
      <path d="M22 42L10 52Q3 49 4 56Q5 62 12 59Q17 63 20 57L31 45" fill={ivory} {...edge} />
      <path d="M24 43C5 25 27 3 41 9C62 10 64 30 51 45C45 54 31 50 24 43Z" fill={rust} {...edge} />
      <path d="M28 18Q44 7 52 20M23 28Q20 39 34 43" stroke="#d99572" strokeWidth="5" fill="none" />
      <Cut d="M35 19Q42 17 47 23M28 35L32 39" />
    </>
  ),
  letterOpener: (
    <>
      <path d="M6 26L41 16 54 50 16 59Z" fill={ivory} {...edge} />
      <path
        d="M6 26L32 39 41 16M16 59L23 35M54 50L36 36"
        stroke={gold}
        strokeWidth="1.2"
        fill="none"
      />
      <path d="M21 45L39 16 49 18 44 27Z" fill={teal} {...edge} />
      <path d="M42 18L50 5 54 8 47 21" fill={gold} {...edge} />
      <path d="M38 17L49 23" stroke={ink} strokeWidth="3" />
    </>
  ),
  pear: (
    <>
      <path
        d="M29 15C16 16 24 28 14 37C2 53 22 60 35 57C55 57 59 43 45 34C37 28 40 15 29 15Z"
        fill={sage}
        {...edge}
      />
      <path d="M28 21C18 31 15 41 19 50C24 57 31 54 34 55C18 54 28 38 31 32Z" fill="#bac796" />
      <path d="M30 17L34 5" stroke={ink} strokeWidth="2.2" />
      <Leaf x={33} y={13} />
      <Cut d="M15 44Q12 51 22 53" />
    </>
  ),
  mango: (
    <>
      <path d="M22 13C3 23 9 50 23 55C41 63 57 43 55 27C53 6 37 5 22 13Z" fill={gold} {...edge} />
      <path
        d="M17 23C12 39 19 50 29 53C39 57 48 41 50 27C48 44 32 51 25 43C15 32 23 20 32 12Z"
        fill={rust}
      />
      <Leaf x={33} y={13} />
      <Cut d="M15 28Q13 40 19 46M18 22L20 19" />
    </>
  ),
  coffeeDripper: (
    <>
      <path d="M13 12H51L41 33H24Z" fill={ivory} {...edge} />
      <path d="M18 14L27 28M25 14L30 27M44 14L37 28" stroke={gold} />
      <path d="M19 38H44V50Q40 59 29 57 19 56 19 48Z" fill={rust} {...edge} />
      <path d="M44 41Q58 35 54 46 52 52 44 49" fill="none" stroke={gold} strokeWidth="3" />
      <path d="M32 32Q36 37 32 38Q28 37 32 32Z" fill={ink} />
      <Cut d="M22 43V49Q23 53 29 53" />
    </>
  ),
  fusionHammer: (
    <g transform="rotate(-24 32 32)">
      <path d="M29 26H36V57H29Z" fill={rust} {...edge} />
      <path d="M13 11H49V30H13Z" fill={teal} {...edge} />
      <path d="M9 10H18V32H9ZM45 9H55V31H45Z" fill={gold} {...edge} />
      <path d="M20 13L24 28M27 13L31 28M34 13L38 28" stroke={ivory} strokeWidth="2" />
      <path d="M28 43H38M28 49H38M28 55H38" stroke={gold} strokeWidth="2" />
    </g>
  ),
  cursedKey: (
    <g transform="rotate(35 32 32)">
      <path d="M29 24H35V56H29ZM34 43H46V51H40V47H35" fill={gold} {...edge} />
      <path d="M32 5L46 11 43 24 32 31 21 24 18 11Z" fill={plum} {...edge} />
      <path d="M25 17Q32 9 40 17Q32 24 25 17Z" fill={ivory} />
      <circle cx="32" cy="17" r="3" fill={ink} />
      <Cut d="M30 34V41M24 10L21 13" />
    </g>
  ),
  sozu: (
    <>
      <path d="M11 55V17H19V55M40 55V37H47V55" fill={sage} {...edge} />
      <path d="M14 27L51 10 55 18 18 35Z" fill={gold} {...edge} />
      <ellipse cx="53" cy="14" rx="3" ry="5" transform="rotate(-24 53 14)" fill={ink} />
      <path
        d="M28 22L32 29M39 17L43 24M11 23H19M11 40H19M40 45H47"
        stroke={ink}
        strokeWidth="1.2"
      />
      <path d="M48 29Q55 38 50 41Q45 40 48 29Z" fill={teal} />
      <path d="M6 57H55" stroke={gold} strokeWidth="2" />
    </>
  ),
  bustedCrown: (
    <>
      <path d="M10 20L21 29 30 13 38 28 54 17 48 48Q32 56 15 49Z" fill={gold} {...edge} />
      <path d="M16 43Q32 49 49 42L48 50Q31 56 16 50Z" fill={rust} {...edge} />
      <path d="M32 17L29 30 36 33 31 42" stroke={ink} strokeWidth="2" />
      <circle cx="21" cy="34" r="3" fill={teal} />
      <circle cx="43" cy="33" r="3" fill={teal} />
      <path d="M30 5L33 10 37 4" stroke={ivory} strokeWidth="1.5" fill="none" />
    </>
  ),
  neowsLament: (
    <>
      <path d="M11 31C9 14 36 6 48 17L56 32 49 46 28 53 12 44Z" fill={teal} {...edge} />
      <path d="M15 28Q34 11 49 30Q35 48 15 28Z" fill={ivory} />
      <path d="M30 18Q42 27 32 39Q24 29 30 18Z" fill={ink} />
      <circle cx="34" cy="25" r="2" fill={gold} />
      <path d="M30 44Q42 55 31 59Q22 56 30 44Z" fill={plum} {...edge} />
      <Cut d="M13 37L21 43M45 17L50 23" />
    </>
  ),
  goldenIdol: (
    <>
      <path
        d="M19 9Q32 3 46 11L43 30 37 35 42 45 51 50V57H12V50L23 44 26 35 20 29Z"
        fill={gold}
        {...edge}
      />
      <path d="M24 13L32 18 41 14 39 28 32 33 25 27Z" fill="#95704a" />
      <path
        d="M24 20L29 22M35 22L40 20M31 21V27M27 39L32 45 38 39M20 51H43"
        stroke={ivory}
        strokeWidth="1.3"
        fill="none"
      />
    </>
  ),
};

const potionColors: Record<string, string> = {
  fire: rust,
  block: teal,
  strength: gold,
  dexterity: sage,
  energy: '#d2b357',
  blood: '#934756',
  explosive: '#816397',
  weak: '#76936b',
};
const potionShapes: Record<string, string> = {
  fire: 'M25 16H39V29C43 34 52 36 52 46C52 60 12 60 12 46C12 36 22 34 25 29Z',
  block: 'M25 16H39V27L50 32V52L32 59 14 52V32L25 27Z',
  strength: 'M26 16H38V30L47 35 50 52 43 58H20L14 51 18 34 26 30Z',
  dexterity: 'M27 16H37V35Q49 44 43 55Q32 61 21 55Q15 44 27 35Z',
  energy: 'M26 16H38V26L48 34 42 44 48 53 32 60 16 53 22 44 16 34 26 26Z',
  blood: 'M25 16H39V29C49 30 52 47 44 54C35 63 15 58 14 47C11 34 20 31 25 29Z',
  explosive: 'M26 16H38V29C61 34 57 59 32 59C7 59 3 34 26 29Z',
  weak: 'M24 16H40V29L48 51Q46 60 32 60Q18 60 16 51L24 29Z',
};
const potionMarks: Record<string, ReactNode> = {
  fire: <path d="M32 35C36 41 29 44 35 48L38 41Q45 54 32 55Q21 53 25 44L29 47Z" fill={ivory} />,
  block: <path d="M23 38L32 34 42 38 39 49 32 54 25 49Z" fill={ivory} />,
  strength: <path d="M23 50L31 36 42 49H35L31 43 29 50Z" fill={ivory} />,
  dexterity: <path d="M32 38L39 47 32 55 25 47Z" fill={ivory} />,
  energy: <path d="M34 33L23 47H31L28 56 41 41H33Z" fill={ivory} />,
  blood: <path d="M32 35C31 41 23 44 26 50C29 57 42 53 39 46Z" fill={ivory} />,
  explosive: (
    <path
      d="M32 33L35 42 44 39 39 47 44 53 35 51 32 57 29 51 20 53 25 46 21 40 29 42Z"
      fill={ivory}
    />
  ),
  weak: (
    <path
      d="M23 42Q29 35 34 42T42 42M24 50Q30 43 35 50T42 50"
      stroke={ivory}
      strokeWidth="2.5"
      fill="none"
    />
  ),
};

export function RelicArt({ id }: { id: string }) {
  return (
    <svg
      className="world-item-art relic-art"
      data-relic-art={id}
      data-art-fallback={!relics[id] || undefined}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {relics[id] ?? <path d="M32 8L54 31 32 56 10 31Z" fill={gold} {...edge} />}
    </svg>
  );
}
export function PotionArt({ id }: { id: string }) {
  return (
    <svg
      className="world-item-art potion-art"
      data-potion-art={id}
      data-art-fallback={!potionShapes[id] || undefined}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={potionShapes[id] ?? potionShapes.fire} fill={potionColors[id] ?? sage} {...edge} />
      <path d="M25 9H39V18H25Z" fill={gold} {...edge} />
      <path d="M28 9V5H36V9" fill="#8e6244" {...edge} />
      <path d="M24 19H40" stroke={ivory} strokeWidth="1.2" />
      <path d="M23 35Q18 45 21 50" stroke={ivory} strokeWidth="1.5" fill="none" opacity=".6" />
      {potionMarks[id]}
    </svg>
  );
}
