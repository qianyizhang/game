import type { ReactNode } from 'react';
import './SilentArt.css';

import {
  silentInk,
  Cut,
  Dagger,
  Flask,
  Smoke,
  Cowl,
  Boot,
  Cards,
  Trails,
  Drop,
} from './SilentPrimitives';

const { ink, dark, green, leaf, steel, gold, plum } = silentInk;

/** Silent action scenes composed from reusable engraving primitives. */
export const silentScenes: Record<string, ReactNode> = {
  neutralize: (
    <>
      <path d="M32 33q46-23 94 13l-6 24q-40 28-80 0Z" fill={leaf} />
      <path d="M42 44q13-6 27 2l-7 10-17-1Zm46 2q14-8 26-2l-3 11-17 1Z" fill={dark} />
      <Dagger x={68} y={6} angle={63} size={91} />
      <Cut d="M43 73q37 19 70-3" />
    </>
  ),
  survivor: (
    <>
      <path d="M18 91q24-4 30 12m57-28 29-8-10 23-21 7Z" fill={leaf} />
      <Cards x={111} y={71} count={1} angle={37} />
      <Cowl x={29} y={8} size={97} />
      <Cut d="M16 29h25m-19 6h12M116 26l12-4" color={green} />
    </>
  ),
  deadlyPoison: (
    <>
      <Smoke x={32} y={3} scale={0.64} />
      <Flask x={48} y={24} size={75} />
      <Drop x={111} y={54} />
      <Drop x={33} y={78} size={7} />
      <Cut d="M44 100h66" />
    </>
  ),
  poisonedStab: (
    <>
      <path d="M113 19q-29 10-52 39L30 98q46-19 71-45Z" fill={leaf} opacity=".6" />
      <Dagger x={60} y={0} size={103} angle={42} poisoned />
      <Drop x={118} y={72} />
      <Trails d="M18 93Q55 44 98 22" />
    </>
  ),
  bladeDance: (
    <>
      <Trails d="M23 55q14-33 66-30m41 19q21 40-31 47M27 87l11 4" />
      <Dagger x={23} y={23} size={69} angle={-22} />
      <Dagger x={65} y={5} size={80} angle={24} />
      <Dagger x={96} y={28} size={55} angle={62} />
    </>
  ),
  cloakAndDagger: (
    <>
      <path d="M21 100 50 27l27-9 28 38-10 40-38 12Z" fill={leaf} />
      <path d="M33 99 59 35l7 61 23-40-2 43Z" fill={green} />
      <Cut d="M47 94 61 45m-5 50 5-24m21 26 7-19" />
      <Dagger x={91} y={7} angle={-18} size={91} />
    </>
  ),
  acrobatics: (
    <>
      <Trails d="M32 79Q6 25 62 15q54-7 71 44m-16-6 16 6-1-16" />
      <Boot x={49} y={22} angle={112} size={77} />
      <path d="M67 71q-24-9-46 15 28-8 43 7l17-4Z" fill={plum} />
      <Cards x={92} y={68} angle={15} count={2} />
    </>
  ),
  backflip: (
    <>
      <Trails d="M133 73q5-45-40-53Q49 8 32 46m-1-14 1 14 14-4M122 82l-6 4" />
      <Boot x={67} y={18} angle={135} size={79} />
      <path d="M50 63Q30 93 76 102 47 84 73 79Z" fill={green} />
      <Cut d="M28 102h105" />
    </>
  ),
  daggerThrow: (
    <>
      <Trails d="M16 39Q60 17 100 41M14 49q35-18 53-14M23 58l18-7" />
      <Dagger x={77} y={5} angle={82} size={80} />
      <Cards x={33} y={72} angle={-18} count={2} />
      <Cut d="m132 24 6-4m-4 36 8 2" />
    </>
  ),
  daggerSpray: (
    <>
      <Trails d="M24 98Q54 25 128 14M21 86q20-57 64-66m-2 77q26-18 54-14" />
      <Dagger x={31} y={9} angle={12} size={75} />
      <Dagger x={72} y={21} angle={45} size={77} />
      <Dagger x={94} y={38} angle={73} size={58} />
    </>
  ),
  deflect: (
    <>
      <path d="M34 95 61 45l22-4 16 12-38 51Z" fill={leaf} />
      <path d="m45 83 23-34 18-1 5 6-26 32Z" fill={steel} />
      <Cut d="m54 80 20-29m-14 30 19-29" />
      <Dagger x={93} y={-11} angle={-48} size={81} />
      <path d="m75 41-6-15m8 11 5-19m-8 27-17-7m28 8 15-5" stroke={ink} strokeWidth="1.1" />
    </>
  ),
  dodgeAndRoll: (
    <>
      <Boot x={26} y={23} angle={-60} size={84} />
      <path d="M114 22Q73 42 115 81q-34 7-66 13 42 12 77-11 13-17-8-37Z" fill={leaf} />
      <Trails d="M39 19q-33 11-18 51m18-45q-17 7-14 24m112 13q19 35-29 45M41 104h26" />
    </>
  ),
  prepared: (
    <>
      <path d="M21 85 40 34h83l14 60-38 10-50-7Z" fill={dark} />
      <path d="M34 89 47 43h65l11 46-35 8Z" fill={leaf} />
      <Cards x={35} y={53} angle={-5} count={2} />
      <Dagger x={95} y={15} angle={-15} size={80} />
      <Cut d="M45 40h70m-81 55 41 6" />
    </>
  ),
  suckerPunch: (
    <>
      <path d="M15 79 45 66l5-20 13-10 27 1 20 20-8 22-26 9-39 22Z" fill={dark} />
      <path d="M22 84 51 72l6-25 10-7 18 2 16 16-6 14-22 7-33 27Z" fill={leaf} />
      <path d="m61 47 8-3 7 12-6 9-14-1Zm16 0 8 2 9 10-6 8-10-9Z" fill={ink} />
      <path d="m51 72 19 7-5 12-23-9Z" fill={gold} />
      <Cut d="M42 88l19 8M109 47l15-13m-8 24 21-4m-28 20 17 9" />
    </>
  ),
  quickSlash: (
    <>
      <path d="M19 90Q62 9 139 32 67 24 19 90Z" fill={green} />
      <Dagger x={67} y={8} angle={48} size={96} />
      <Trails d="M26 93q31-42 59-44m29-20 22 3M26 35h20m-31 9h22" />
    </>
  ),
  slice: (
    <>
      <path d="M31 24Q84 32 132 90L82 62Z" fill={plum} />
      <Dagger x={63} y={3} angle={-50} size={101} />
      <Cut d="M24 23Q84 30 139 89M30 33l25 8m62 46 17 6" color={green} />
    </>
  ),
  bane: (
    <>
      <path d="M49 81q-28-31 1-50 15-8 28 1 20-10 34 9 10 22-9 40l-19 13Z" fill={leaf} />
      <Drop x={72} y={45} size={19} />
      <Dagger x={26} y={10} angle={-20} size={83} />
      <Dagger x={103} y={14} angle={20} size={83} />
      <Cut d="M53 98q27 8 54-7" />
    </>
  ),
  flyingKnee: (
    <>
      <path d="m27 105 30-28 9-45 27-10 34 37-20 15-24-20-6 29-26 24Z" fill={dark} />
      <path d="m33 103 31-26 7-40 20-9 27 31-12 10-25-26-8 37-25 23Z" fill={green} />
      <path d="m79 32 13-4 26 31-12 10-16-25Z" fill={steel} />
      <path d="m103 68 15-10 12 15-18 13Z" fill={leaf} />
      <Trails d="M18 89 42 65m-21 8 25-38m79 11 13-9m-14 16 17-3" />
      <Cut d="m96 37 11 15m1 26 10-8" />
    </>
  ),
  footwork: (
    <>
      <g opacity=".4">
        <Boot x={17} y={13} angle={19} size={78} />
      </g>
      <Boot x={66} y={11} angle={-18} size={89} />
      <Trails d="M20 103q26-16 58-2 28 10 61-9M33 109l10-4m85-34 14 1M44 31l-12-9" />
    </>
  ),
  noxiousFumes: (
    <>
      <Smoke x={7} y={2} scale={0.95} />
      <path d="M51 83q30 9 60-1l-9 20H61Z" fill={dark} stroke={gold} strokeWidth="1" />
      <ellipse cx="81" cy="84" rx="29" ry="6" fill={green} />
      <path d="M69 83q-22-16 3-32-6 17 11 21 10 9-1 13Z" fill={ink} opacity=".55" />
      <Cut d="M67 96h7m13 0h7m-20-51q6-9 16-5" />
    </>
  ),
  accuracy: (
    <>
      <circle cx="81" cy="53" r="33" fill={dark} stroke={leaf} strokeWidth="5" />
      <circle cx="81" cy="53" r="22" stroke={gold} strokeWidth="1" />
      <circle cx="81" cy="53" r="8" fill={green} />
      <Cut d="M81 12v15m0 52v17M40 53h15m53 0h15" />
      <Dagger x={96} y={-34} angle={-135} size={66} />
      <Cut d="M45 23l5 6m63-1 4-6" />
    </>
  ),
  infiniteBlades: (
    <>
      <path
        d="M25 58q-4-33 26-30 29 3 58 49 25 17 29-12 0-25-26-28-25 0-60 46-26 10-27-25Z"
        fill="none"
        stroke={leaf}
        strokeWidth="6"
      />
      <Cut d="M26 54q0-24 24-24 28 0 60 46 28 17 27-17" color={green} />
      <Dagger x={42} y={0} angle={17} size={102} />
      <Dagger x={93} y={-4} angle={197} size={79} />
    </>
  ),
  blur: (
    <>
      <Cowl x={14} y={18} size={83} ghost />
      <Cowl x={44} y={12} size={89} ghost />
      <Cowl x={67} y={4} size={101} />
      <Trails d="M10 62h36M18 74h40M13 88h31" />
    </>
  ),
  legSweep: (
    <>
      <path d="M21 91q45-15 72-54l24 20-23 22-37 17Z" fill={leaf} />
      <Boot x={65} y={7} angle={72} size={87} />
      <Trails d="M21 78q36 34 89 15 35-12 29-32m-9-8 9 8 6-12M23 97l9 4" />
      <Cut d="M44 85l27-16" />
    </>
  ),
  dash: (
    <>
      <path d="M12 80 44 42l47-5-37 50-33 16Z" fill={leaf} />
      <path d="M18 76 55 46l-23 43 25-13-32 29Z" fill={green} />
      <Cowl x={59} y={8} size={91} />
      <Dagger x={96} y={31} angle={64} size={54} />
      <Trails d="M10 40h40M17 52h19M12 95l18-13" />
    </>
  ),
  catalyst: (
    <>
      <Flask x={24} y={45} size={43} angle={-23} />
      <Flask x={84} y={14} size={87} round />
      <path d="M51 42q22-22 40 2m-1-12 1 12-13-3" fill="none" stroke={gold} strokeWidth="1.2" />
      <Drop x={64} y={66} size={12} />
      <Cut d="M80 95h54M23 92h25" />
    </>
  ),
  bouncingFlask: (
    <>
      <Trails d="M17 88Q27 38 50 78q20-62 57-47M14 95h21m4-11h25" />
      <Flask x={86} y={13} size={68} angle={34} round />
      <Cut d="m83 17-8-4m47 70 12 4m-8-46 11 1" color={green} />
    </>
  ),
  cripplingCloud: (
    <>
      <path d="M28 111 45 72l17-11 7 14-7 36m34 0-2-35 19-15 10 12 13 38Z" fill={dark} />
      <Smoke x={3} y={2} scale={1.05} />
      <path d="M41 76q14-12 27-2m22 1q16-13 29-4" stroke={green} strokeWidth="2" opacity=".6" />
      <Drop x={76} y={75} size={9} />
      <Drop x={24} y={82} size={5} />
      <Drop x={129} y={83} size={6} />
    </>
  ),
  calculatedGamble: (
    <>
      <Cards x={22} y={37} angle={-25} count={3} />
      <Cards x={101} y={47} angle={28} count={2} />
      <path
        d="M58 19q36-17 59 11m-1-12 1 12-12-2M101 96q-23 12-44-2m0 11V94l12 2"
        fill="none"
        stroke={gold}
        strokeWidth="1.3"
      />
      <path d="m70 47 20-3 11 19-16 13-21-13Z" fill={ink} />
      <path
        d="m70 47 14 13 6-16m-6 16 1 16m-21-13 20-3 17 3"
        fill="none"
        stroke={dark}
        strokeWidth="1"
      />
      <circle cx="75" cy="58" r="1.5" fill={dark} />
      <circle cx="91" cy="59" r="1.5" fill={dark} />
    </>
  ),
  concentrate: (
    <>
      <Cards x={20} y={59} angle={-28} count={2} />
      <Cards x={100} y={50} angle={30} count={2} />
      <path d="M80 19q4 30 21 38-17 11-21 37-3-26-21-37 18-8 21-38Z" fill={green} />
      <path d="m80 31 4 25 7 1-12 27 2-23-9-1Z" fill={ink} />
      <Cut d="M49 21 68 38m24 0 20-18M33 40l22 8m50 0 21-8" color={green} />
    </>
  ),
  reflex: (
    <>
      <path d="M20 51q26-32 66-23 32 9 55 26-41 35-71 31-28-6-50-34Z" fill={dark} />
      <path d="M29 51q27-23 57-16 26 4 47 20-35 23-60 22-27-7-44-26Z" fill={ink} />
      <path d="M84 34Q58 51 73 78q28 1 31-25-3-12-20-19Z" fill={green} />
      <path d="M84 40q-10 14-1 30 14-14 1-30Z" fill={dark} />
      <Cut d="M19 45q25-33 63-24m31 10 24 15M26 68l13 10m70 2 18-9" color={green} />
      <Cards x={109} y={66} count={1} angle={18} />
    </>
  ),
  tactician: (
    <>
      <path d="m26 28 45-8 32 12 24 58-47 7-47-10Z" fill={ink} />
      <path d="m37 37 31-8 27 13 20 42-35 7-37-11Z" fill={leaf} />
      <path
        d="m46 44 17 7 12-13 20 22-14 16 20 4M62 31l5 18-16 25m27-3-6 16"
        fill="none"
        stroke={gold}
        strokeWidth="1.2"
      />
      <circle cx="64" cy="50" r="5" fill={dark} stroke={ink} strokeWidth="1" />
      <circle cx="94" cy="62" r="5" fill={dark} stroke={ink} strokeWidth="1" />
      <Dagger x={111} y={16} angle={-21} size={78} />
    </>
  ),
  sneakyStrike: (
    <>
      <Cowl x={16} y={16} size={90} />
      <path d="M64 86q25-6 34-19l11 8-19 23-27 9Z" fill={leaf} />
      <Dagger x={98} y={7} angle={30} size={92} />
      <Cards x={119} y={80} count={1} angle={35} />
      <Cut d="M103 29l10-7m12 5 7-7M15 101h28" />
    </>
  ),
  adrenaline: (
    <>
      <path d="M78 33q18-16 29 3 14 27-29 62Q35 71 41 47q5-24 28-12l-3-17 11-4Z" fill={plum} />
      <path d="M81 40q13-8 20 5 7 22-23 46 17-25 3-51Z" fill={green} />
      <path
        d="M17 64h24l8-19 11 38 11-34 9 15h18l8-12 8 12h28"
        fill="none"
        stroke={ink}
        strokeWidth="1.4"
      />
      <Cut d="m53 30-4-9m58 8 8-9M63 95l-7 6" color={green} />
    </>
  ),
  afterImage: (
    <>
      <path
        d="M30 93Q14 47 40 22q15-11 33-5m-36 73Q26 49 47 29m61 61q31-37 6-65-13-15-34-9"
        fill="none"
        stroke={green}
        strokeWidth="1.1"
      />
      <Cowl x={46} y={1} size={79} />
      <g transform="translate(0 158) scale(1 -.7)">
        <Cowl x={46} y={1} size={79} ghost />
      </g>
      <path
        d="M21 80q53 9 117 0M33 86q39 7 91 0M47 100h13m36 0h13"
        fill="none"
        stroke={steel}
        strokeWidth=".8"
      />
    </>
  ),
  envenom: (
    <>
      <path
        d="M31 102q52 5 82-35 15-21-5-36-19-9-26 9 0 9 11 16l-9 10q-24-15-12-36 20-26 48-6 28 23 4 54-29 33-74 31Z"
        fill={leaf}
      />
      <path d="M91 41q5-9 12-3l-3 10-10 4-7-5Z" fill={green} />
      <path d="m100 39 4 1-3 3Z" fill={ink} />
      <Cut d="M97 26q24-3 30 17m1 11q0 25-29 39m-10 4-11 5" color={green} />
      <Dagger x={43} y={1} angle={17} size={102} poisoned />
    </>
  ),
  thousandCuts: (
    <>
      <path d="M26 90 41 17l74 7 16 73-42 9Z" fill={dark} />
      <path
        d="M43 23 64 28l-8 32 29-39 10 5-21 36 34-26 4 13-32 36 45-19 3 24-42 10-18-11-31 6Z"
        fill={leaf}
      />
      <Cut d="M45 36 40 63m-1 9-3 12m33-47L55 74m24-24-12 22m41-18L87 78m18-4-9 10" color={ink} />
      <Dagger x={99} y={-1} angle={31} size={96} />
    </>
  ),
  dieDieDie: (
    <>
      <path d="M22 90Q73 20 139 22 87 49 110 100L75 80Z" fill={plum} opacity=".7" />
      <Dagger x={28} y={9} angle={-21} size={84} />
      <Dagger x={67} y={4} angle={12} size={87} />
      <Dagger x={98} y={16} angle={47} size={72} />
      <Trails d="M17 67Q72 5 133 26M37 101l18-7m65-5 14-11" />
    </>
  ),
  shiv: (
    <>
      <path d="m46 88 59-60-8 42-35 30Z" fill={leaf} opacity=".6" />
      <Dagger x={64} y={-1} angle={27} size={104} />
      <Cut d="M40 93 24 99m96-75 12-5M110 87l14 4" color={green} />
    </>
  ),
};
