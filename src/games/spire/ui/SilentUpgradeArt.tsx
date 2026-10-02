import type { ReactNode } from 'react';
import { silentInk, Cut, Cowl, Dagger, Drop, Flask, Smoke, Trails } from './SilentPrimitives';
const { ink, dark, green, leaf, gold, plum } = silentInk;

/** New plates, rather than a tint: upgraded alchemy, blade work, and prepared powers. */
export const silentUpgradeScenes: Record<string, ReactNode> = {
  deadlyPoison: (
    <>
      <path d="M27 101V37q0-29 25-29h54q25 0 25 29v64Z" fill={dark} stroke={leaf} strokeWidth="1" />
      <path
        d="M32 101V40q0-27 23-27h49q22 0 22 27v61M32 42h94M79 14v29"
        fill="none"
        stroke={gold}
        strokeWidth=".7"
      />
      <Smoke x={34} y={7} scale={0.6} />
      <Flask x={49} y={24} size={75} round />
      <path d="M22 101h116v6H22Z" fill={leaf} />
      <Drop x={34} y={84} size={5} />
      <Drop x={116} y={73} size={7} />
      <Cut d="M68 62q8-4 15 0m-13 5 11-1M42 103h61" color={ink} />
      <path d="M66 57h23v17H66Z" fill={dark} stroke={gold} strokeWidth=".7" />
      <path d="m77 59 6 6-6 6-6-6Z" fill={green} />
    </>
  ),
  bladeDance: (
    <>
      <circle cx="80" cy="56" r="36" stroke={gold} strokeWidth=".7" />
      <path
        d="M43 64Q30 20 86 15q54 7 47 47-6 38-54 34-40-5-36-32Z"
        fill="none"
        stroke={leaf}
        strokeWidth="4"
      />
      <g transform="translate(80 56)">
        {[0, 90, 180, 270].map((angle) => (
          <g key={angle} transform={`rotate(${angle}) translate(-80 -56)`}>
            <Dagger x={67} y={9} size={45} angle={-29} />
          </g>
        ))}
      </g>
      <path d="m80 44 7 12-7 12-7-12Z" fill={gold} />
      <Cut d="M27 45q5-23 27-30m78 14 8 10m-10 43q-14 19-43 20M21 74l7 9" />
    </>
  ),
  cloakAndDagger: (
    <>
      <path
        d="M23 105Q39 77 42 46q2-33 37-38 33 9 34 45 3 27 27 49-27-7-46 5l-20-7-23 9Z"
        fill={dark}
      />
      <path
        d="M42 99 53 50q-1-21 24-35L67 58l7 41-17-7-15 7Zm37-81q24 11 25 32l-7 29 22 22-29-5-7-33Z"
        fill={leaf}
      />
      <path d="M78 24q-18 8-14 25l13 11 16-13q3-14-15-23Z" fill={dark} />
      <path d="m69 43 6 2m9-1 5-2" stroke={ink} strokeWidth="1" />
      <Dagger x={27} y={39} size={62} angle={-42} />
      <Dagger x={99} y={37} size={62} angle={42} />
      <Cut d="M58 54 49 87m47-31 9 29M66 25l-8 12m45 8-4-12" />
    </>
  ),
  catalyst: (
    <>
      <path d="M24 96h112M34 96V53m92 43V53M34 54h91" stroke={gold} strokeWidth="1.2" />
      <Flask x={60} y={31} size={61} round />
      <Flask x={17} y={18} size={40} angle={44} />
      <Flask x={113} y={17} size={36} angle={-41} />
      <path d="M54 35q19-17 27 5m33-4Q97 15 88 39" fill="none" stroke={green} strokeWidth="2" />
      <Drop x={76} y={24} size={6} />
      <path d="M68 104q-2-14 11-18-5 9 5 10 6-7 8-6 6 9-4 14Z" fill={gold} />
      <Cut d="M66 76h18m-19 4h22M29 91h11m80 0h11M79 8v6m-16-2 5 5m28-5-5 5" />
    </>
  ),
  bouncingFlask: (
    <>
      <path
        d="M19 94Q20 42 49 85q4-49 33-12 5-40 27-18 5-33 30-24"
        fill="none"
        stroke={green}
        strokeWidth="1.4"
      />
      <path d="M16 101 148 74" stroke={leaf} strokeWidth="3" />
      <Flask x={104} y={8} size={49} angle={34} round />
      {[
        [25, 95],
        [51, 89],
        [84, 81],
        [111, 76],
      ].map(([x, y], i) => (
        <g key={x} opacity={0.45 + i * 0.16}>
          <path d={`M${x - 6} ${y}l6-5 7 3m-6-8 1-5m-8 9-4-3`} stroke={ink} strokeWidth=".8" />
          <ellipse cx={x} cy={y + 1} rx="8" ry="2" fill={leaf} />
        </g>
      ))}
      <Cut d="M43 39q18-24 40-18m-38 23 8-3m77 20 11 3" color={gold} />
    </>
  ),
  noxiousFumes: (
    <>
      <Smoke x={0} y={0} scale={1.04} />
      <path d="M70 0 54 74m36-74 17 74" stroke={gold} strokeWidth="1" />
      <path d="M47 72q32-8 67 0l-13 27H61Z" fill={dark} stroke={gold} strokeWidth="1.2" />
      <ellipse cx="80" cy="73" rx="33" ry="7" fill={leaf} stroke={gold} strokeWidth=".8" />
      <path d="M67 88h6m9 0h6m9 0h6" stroke={green} strokeWidth="3" />
      <path d="M72 73Q49 55 77 43 107 33 78 18q47 7 26 30-25 14-14 25Z" fill={green} />
      <path d="M77 73q-14-11 3-21 20-8 20-19-7 21-16 23-12 7-1 17Z" fill={ink} opacity=".55" />
      <Cut d="M58 44q-16-9-6-19M115 59q17 6 15 17M64 98h36m-22 2v7" color={gold} />
    </>
  ),
  accuracy: (
    <>
      <g transform="translate(88 55) rotate(-18)">
        <ellipse rx="41" ry="40" fill={dark} stroke={gold} strokeWidth="1.3" />
        <circle r="29" stroke={leaf} strokeWidth="7" />
        <circle r="19" stroke={gold} strokeWidth=".8" />
        <circle r="8" fill={green} />
        <path d="M0-39v12M27 0h13M0 27v12M-39 0h12" stroke={ink} strokeWidth="1" />
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d="M0-36v3"
            transform={`rotate(${i * 30})`}
            stroke={gold}
            strokeWidth=".8"
          />
        ))}
      </g>
      <g transform="translate(74 45) rotate(45)">
        <Dagger x={-15} y={0} size={62} angle={0} />
      </g>
      <path d="M82 54h10m-5-5v10" stroke={ink} strokeWidth=".8" />
      <Trails d="M14 91q17-10 27-22M21 97l15-10" />
    </>
  ),
  infiniteBlades: (
    <>
      <path d="M31 102V33Q32 9 80 7q48 2 49 26v69Z" fill={dark} stroke={gold} strokeWidth="1" />
      <path
        d="M37 99V35Q40 17 80 15q40 1 43 20v64M41 72h78M41 92h78"
        fill="none"
        stroke={leaf}
        strokeWidth="1"
      />
      <Dagger x={35} y={27} size={61} angle={-15} />
      <Dagger x={65} y={19} size={70} angle={0} />
      <Dagger x={97} y={27} size={61} angle={15} />
      <path
        d="M63 98q0-9 9-5l17 9q9 3 9-4t-9-4l-17 9q-9 3-9-5Z"
        fill="none"
        stroke={gold}
        strokeWidth="1.4"
      />
      <Cut d="M80 16v-5M18 48l8 1m111-1 8-1M20 77l5-2m110 0 5 2" />
    </>
  ),
  afterImage: (
    <>
      <path d="M39 107V36Q39 5 80 4q41 1 41 32v71Z" fill={dark} stroke={gold} strokeWidth="1.3" />
      <path d="M45 104V37Q45 12 80 11q35 1 35 26v67Z" fill={leaf} opacity=".5" />
      <Cowl x={44} y={20} size={72} ghost />
      <path d="M80 14 47 54m61-22L48 95m64-39-37 46" stroke={ink} strokeWidth=".75" opacity=".35" />
      <g transform="translate(161 0) scale(-1 1)">
        <Cowl x={73} y={16} size={88} />
      </g>
      <path d="M36 104h90M30 108h103" stroke={gold} strokeWidth="1" />
      <Cut d="M43 24l-6-7m81 6 6-8M33 66h-7m105 0h7" />
    </>
  ),
  envenom: (
    <>
      <path
        d="M26 92q60 24 83-3 30-28 9-52-15-18-34-5-18 12 1 23l12-5q-17-5-7-11 12-8 21 7 9 17-12 31-24 15-62 10Z"
        fill={leaf}
      />
      <path d="M93 31q-4-11-19-10l-8 10 8 11 13-3Z" fill={green} />
      <path d="m72 27 10-2-5 6Z" fill={dark} />
      <path d="m67 32-11 2-5-3m5 3-5 4" stroke={green} strokeWidth=".8" />
      <Dagger x={54} y={-1} size={100} angle={-20} poisoned />
      <path d="M48 61q22 15 57-3l7 9q-31 24-60 5Z" fill={green} />
      <Cut d="M58 70q18 6 44-5m17-15q4 20-18 35M34 92l14 4m7 0 8 1" />
      <Drop x={38} y={75} size={7} />
      <Drop x={116} y={94} size={5} />
    </>
  ),
  thousandCuts: (
    <>
      <path d="M53 8q25 11 54 0l13 87-33 11-40-15Z" fill={dark} />
      <path
        d="m60 19 9 2-11 37 28-34 9-3-19 42 31-25 2 12-30 31 35-13 3 20-31 13-28-9Z"
        fill={leaf}
      />
      <path
        d="M24 92Q47 34 132 22M17 71Q71 7 134 42M29 103q34-50 114-36"
        fill="none"
        stroke={ink}
        strokeWidth="1.2"
      />
      <path d="m38 31-6-12 15 9m73 51 20 4-14 7M26 79l-13 8 9 8m83-81 7-10 5 9" fill={plum} />
      <Cut d="m64 24-7 23m7-1 15-19m-6 45 29-30m-18 51 22-9m-50-7-4 10" color={gold} />
      <path d="m77 40-11 29 9-8-12 27 26-31-10 5 17-30Z" fill={ink} opacity=".6" />
    </>
  ),
  dieDieDie: (
    <>
      <path d="M16 98Q34 31 131 13q-40 21-14 66L83 98Z" fill={plum} opacity=".6" />
      <Cowl x={50} y={16} size={77} />
      <g transform="translate(0 3)">
        <Dagger x={23} y={5} size={76} angle={-39} />
        <Dagger x={104} y={5} size={76} angle={39} />
      </g>
      <Dagger x={66} y={48} size={56} angle={84} />
      <Trails d="M17 66Q29 22 66 12m29 0q37 15 47 47M23 97q61-39 113-11" />
      <Cut d="m22 42-7-5m118-1 9-5M36 107l13-9m74 7 10 1" color={gold} />
    </>
  ),
};
