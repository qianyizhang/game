import type { ReactNode } from 'react';
import {
  ink,
  metal,
  shadow,
  shade,
  copper,
  sea,
  Glyph,
  Rays,
  Echo,
  Blade,
  Impact,
  Fist,
  Helmet,
  Cards,
  Wall,
  Wind,
  Blood,
  Shackles,
  Scythe,
  Cloak,
} from './primitives';
// Art is a single focal scene, with supporting symbols treated as quiet engraved echoes.
export const scenes: Record<string, ReactNode> = {
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
  void: (
    <>
      <path d="M23 80Q11 29 70 17q44-7 65 30-33-27-66-14Q31 46 40 80Z" fill={shade} />
      <path d="M135 41q23 40-29 59-43 13-76-17 38 20 69 5 35-14 36-47Z" fill={sea} opacity=".65" />
      <ellipse cx="80" cy="57" rx="36" ry="29" transform="rotate(-28 80 57)" fill={shadow} />
      <path
        d="M44 65Q38 39 72 28m16-1q20-1 31 14M47 81q34 23 69-9"
        fill="none"
        stroke={ink}
        strokeWidth=".8"
        opacity=".7"
      />
      <path d="m31 26 12 5-2 9-10-4Zm93 56 9 5-8 11-5-10ZM99 14l3 8-6-2Z" fill={copper} />
      <path
        d="m52 50 15 4-7 9 13-3m36-11-13 10 7 2-17 6"
        fill="none"
        stroke={sea}
        strokeWidth="1"
        opacity=".65"
      />
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
