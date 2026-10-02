import type { ReactNode } from 'react';
import { ArtScene } from '../../../shared/art/CardArt';
import type { Tribe } from '../domain/types';

const palettes = {
  beast: 'moss',
  mech: 'gold',
  demon: 'violet',
  elemental: 'tide',
  neutral: 'ember',
  all: 'violet',
} as const;
const shadow = '#22312e';
const bone = '#c5c0a4';

/** Fixed, presentation-only vector plates: silhouette, modeled planes, then fine engraving. */
function Cut({
  d,
  color = bone,
  width = 0.8,
  opacity = 0.6,
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
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    />
  );
}
function Eye({ d = 'M96 42q9-5 17-2l-9 4Z', color = '#d3c797' }: { d?: string; color?: string }) {
  const [x, y] = (d.match(/[-+]?\d*\.?\d+/g) ?? ['0', '0']).slice(0, 2).map(Number);
  const pupilY = y + (d.includes('q') ? -0.5 : 1);
  return (
    <>
      <path d={d} fill={shadow} stroke={shadow} strokeWidth="1.3" strokeLinejoin="round" />
      <path d={d} fill={color} />
      <path d={`M${x + 5} ${pupilY}v2`} stroke={shadow} strokeWidth="1.4" strokeLinecap="round" />
    </>
  );
}

function Fur({ dark = false }: { dark?: boolean }) {
  return (
    <Cut
      d="m58 73-8 13m12-8-9 17m16-15-8 17m13-12-7 15m14-10-5 11m13-9-3 10m-26-20-5 8m12-3-4 8m12-2-3 7"
      color={dark ? shadow : bone}
      opacity={0.35}
    />
  );
}

type Animal = 'wolf' | 'panther' | 'hyena' | 'rat' | 'bear' | 'croc';
function AnimalPortrait({
  species,
  coat = '#707e60',
  pale = '#a6b28a',
  elder = false,
  young = false,
  pack = false,
}: {
  species: Animal;
  coat?: string;
  pale?: string;
  elder?: boolean;
  young?: boolean;
  pack?: boolean;
}) {
  return (
    <g>
      {elder && (
        <g fill="#847952">
          <path d="M68 41Q42 21 28 12l15 24-19-7 25 19-17 4 35 7Z" />
          <path d="M76 35Q75 15 88 2l-2 18 14-7-13 17 9 2-18 11Z" />
        </g>
      )}
      {species === 'wolf' && (
        <>
          <path
            d="M23 112Q31 88 48 75l7-20 13-11L64 9q19 7 29 25 18-8 26 3 9 7 12 18l-6 7 25 6q0 15-21 21l-13 4-10 19Z"
            fill={shadow}
          />
          <path
            d="M34 112Q41 89 61 68l14-24-6-26q13 8 20 22 18-10 27 3 6 6 7 13l-7 6 26 10q-3 9-31 13l-16 27Z"
            fill={coat}
          />
          <path d="m73 23 9 18-10 13Z" fill="#363e32" />
          <path
            d="M86 44q20-13 30-1 5 5 7 13l-15 6q13 8 33 10l-15 5-24-10-14 7-13-7Z"
            fill={pale}
          />
          <path
            d="M77 60 73 77 62 82l10 1-15 14 14-6-9 21h39l16-29-17 4-13-5 6-12Z"
            fill={pale}
            opacity=".8"
          />
          <path d="m136 68 13 1-7 10-10-4Z" fill={shadow} />
          <path d="M108 80q16 3 29-5l-13 12-21 4Z" fill={shadow} />
          <Eye d="M102 50q7-3 13-1l-8 2Z" />
          <Cut d="m90 45 10-8m-6 24 11-6m-4 24 16 2m-39-9-6 10m1-22-9 9" />
          <Fur />
          {pack && (
            <>
              <path d="M48 99q25 10 53-1l-5 14H43Z" fill="#776849" />
              <Cut d="M49 103q24 8 49-1" color="#c4ad72" width={1.2} />
            </>
          )}
        </>
      )}
      {species === 'panther' && (
        <>
          <path
            d="M21 112Q28 88 53 76l9-24q-13-20-5-29 15-6 27 11 24-11 41 7l9 17-9 7 23 10q-4 19-35 23l-11 14Z"
            fill={shadow}
          />
          <path
            d="M37 112q4-24 28-36l9-28Q61 33 66 28q9-4 17 13 26-12 39 8l5 9-12 10 26 10q-10 12-38 15l-10 19Z"
            fill={coat}
          />
          <path d="M91 42q19-6 31 10l5 6-16 12q14 4 17 10l-25 7-16-15Z" fill={pale} opacity=".36" />
          <path d="m131 72 16 2-8 9-12-3Z" fill={shadow} />
          <Eye d="M103 56q9-3 16-1l-9 2Z" color="#c7be72" />
          <Cut d="m109 83 21 1m-18 5 17 3m-17-15 18-5M76 40l-4-8M60 84q-9 13-10 23" opacity={0.5} />
        </>
      )}
      {species === 'hyena' && (
        <>
          <path
            d="M14 112Q23 90 48 74l8-31Q42 27 50 20q18-7 30 13 26-4 38 13l7 18 24 9q-6 19-36 22l-16 17Z"
            fill={shadow}
          />
          <path
            d="M29 112q5-19 28-36l14-29Q56 32 61 26q8-2 17 16 22-11 34 5l6 21 24 8q-12 12-36 14l-21 22Z"
            fill={coat}
          />
          <path d="M82 43q18-6 30 8l-10 16 18 10-13 5-21-9-11-16Z" fill={pale} />
          <path d="M56 48 44 70l-16 7 9-1-12 18 19-9 20-22Z" fill="#414a38" />
          <path d="m134 72 15 1-7 9-12-3Z" fill={shadow} />
          <Eye d="M97 54q7-3 13-1l-7 2Z" />
          <g fill={shadow} opacity=".7">
            <path d="m54 85 8-3 3 5-7 5Zm-12 13 7-2 1 6-7 4Zm27-8 8-3 2 6-6 5Zm-8 15 6-2 2 6-5 3Z" />
          </g>
          <Cut d="M86 77 105 85m-35-3-8 16m-5-4-7 11" />
        </>
      )}
      {species === 'rat' && (
        <>
          <path
            d="M21 112q5-24 28-39l19-17q-24-20-12-35 22-15 37 14l18 15 3 11 36 22-8 13-39 4-8 12Z"
            fill={shadow}
          />

          <path
            d="M38 112q0-20 24-30l16-18Q57 47 61 31q13-13 27 14l19 12 1 13 35 17-7 7-35-2-14 20Z"
            fill={coat}
          />
          <path d="M66 32q12-3 15 17l-7 8q-12-13-8-25Z" fill="#9a7977" />
          <path d="M86 52 103 59l-7 17 34 10-25 2-20-14Z" fill={pale} />
          <Eye d="M97 65q7-3 11 0l-5 2Z" color="#caaa86" />
          <path d="m139 83 9 5-7 6-7-5Z" fill="#654646" />
          <Cut
            d="m119 87 31-13m-28 17 33-1m-34 5 29 8M80 75l-7 13m4-6-7 16"
            width={0.65}
            opacity={0.7}
          />
        </>
      )}
      {species === 'bear' && (
        <g transform={young ? 'translate(9 10) scale(.92)' : undefined}>
          <path
            d="M8 112Q17 85 38 72l17-27Q45 28 56 24q12-5 20 10 13-5 27 0 12-14 22-5 6 8-9 18 17 14 15 29l-10 20-17 16Z"
            fill={shadow}
          />

          <path
            d="M24 112Q29 88 52 77l12-27Q54 34 59 30q9-4 16 13 16-8 27 0 13-15 17-11 3 6-12 17 19 16 15 30-3 11-25 33Z"
            fill={coat}
          />
          <path d="M76 43q16-10 30 0l9 20-8 9-14-6-12 8-12-12Z" fill={pale} opacity=".55" />
          <path d="M88 67q17-8 29 8 6 19-15 22-16-3-17-15Z" fill={pale} />
          <path d="M97 76q11-4 19 2l-8 9-11-4Z" fill={shadow} />
          <Eye d="M95 58q8-3 14-1l-8 2Z" />
          <Eye d="M73 60q6-3 10-1l-5 2Z" />
          <Cut d="m104 87-1 7 9-2m-20 2-6-3M57 64l-7 15m13-7-7 16m10-7-6 17" />
          <Fur />
        </g>
      )}
      {species === 'croc' && (
        <>
          <path d="M7 112 23 83 44 57l19-21 28-6 18 17 42 12-3 17-45 16-20 20Z" fill={shadow} />
          <path d="M21 112 34 83l27-34 27-12 14 15 43 11-4 9-43 10-25 30Z" fill={coat} />
          <path d="m64 46 18-22 18 22-14 12Z" fill={pale} />
          <path d="M86 57q23 9 57 10l-7 7-38 8-22-6Z" fill={pale} opacity=".65" />
          <path
            d="m48 70-14-2 13-12 14-4m-26 37-13-1 10-12 12-2m-18 29-12-1 10-12 12-3"
            fill="#455b4d"
          />
          <Eye d="M84 43q9-3 14 3l-10 1Z" color="#d2bd79" />
          <path d="M99 83q27-3 43-12l-14 15-33 9Z" fill={shadow} />
          <path d="m111 82 1 7 5-8m10-3v5l5-7" fill={bone} />
          <Cut d="m55 73 6 4 6-9 7 3m-24 18 7 4 7-9 7 2m-22 18 6 3 8-8m44-32 26 5" />
        </>
      )}
    </g>
  );
}

function Hydra() {
  return (
    <g>
      <path
        d="M24 112q-7-28 15-48 9-11 5-23l10-12 18 9-1 17-14 9q-14 17 8 48Zm37 0q15-31 7-51Q46 24 72 10l20-1 18 14-8 15-22 7q-8 12 5 36l15 31Zm37 0q25-28 19-45l-13-12 1-15 21-6 19 13-4 16-16 8q15 24 3 41Z"
        fill={shadow}
      />

      <path
        d="M31 112q-7-27 19-45l11-15-4-9-11 2 6-10 14 7-2 12-14 12q-14 20 17 46Zm43 0q14-29 3-51-25-33-3-43l15-2 12 11-5 8-17 3q-16 16-2 40l13 34Zm33 0q19-31 11-48l-7-12 5-8 13-3 10 10-4 9-16 4q18 26 1 48Z"
        fill="#6c846c"
      />
      <path d="M75 22 88 19l9 9-21 5ZM116 48l13-5 6 8-18 5ZM48 45l8-8 7 9-9 5Z" fill="#a8b29a" />
      <Eye d="M81 25h12l-8 4Z" />
      <Eye d="M124 48h10l-7 3Z" />
      <Eye d="m52 44 9-1-6 3Z" />
      <Cut
        d="M67 65q18 20 17 39M47 74q-7 17 7 31m70-26q10 16-3 26m-47-9 7-3m-7-5 7-3m-4-6 7-3"
        color="#b4b799"
      />
    </g>
  );
}
function Phoenix() {
  return (
    <g>
      <path
        d="M27 112 12 29q33 4 62 37L71 36l14-18 27 3-6 18-18 11 10 20q26-32 54-36l-17 78Z"
        fill="#312827"
      />
      <path
        d="M35 112 19 39q28 10 52 39L78 43l9-17 17 1-8 9-17 7 17 44q17-29 47-43l-15 68Z"
        fill="#82553e"
      />
      <path d="M65 112 50 77l27 20-9-30 22 25 8-25 6 34 20-22-7 33Z" fill="#b88354" />
      <path d="M81 38 88 26l13 2-11 9-9 16-6 19-5-2 4-20Z" fill="#dfbb78" />
      <path d="m98 27 16 5-15 6Z" fill="#a8987b" />
      <Eye d="m88 30 10-1-7 4Z" />
      <Cut
        d="M23 48 49 105m-21-40 31 45m-20-31 28 31M137 55l-23 48m14-27-22 30m12-14-15 16M83 65l7 20"
        color="#d9b781"
        width={1}
        opacity={0.65}
      />
      <path d="M80 24q-3-11 9-20l-2 15 13-12-7 17Z" fill="#b99460" />
    </g>
  );
}

type Machine =
  | 'pup'
  | 'harvester'
  | 'guardian'
  | 'sentinel'
  | 'bomb'
  | 'egg'
  | 'reaper'
  | 'colossus'
  | 'scrap'
  | 'drake';
function MachineFace({ kind }: { kind: Machine }) {
  if (kind === 'harvester')
    return (
      <>
        <path d="M48 30q8-21 31-21h20l21 24-9 41-37 7-22-17Z" fill="#545f56" />

        <path d="M60 28q7-11 22-11h15l16 19-10 29-27 10-19-15Z" fill="#a6a58a" />

        <ellipse cx="70" cy="46" rx="18" ry="21" fill="#534f3f" />
        <ellipse cx="72" cy="45" rx="11" ry="14" fill="#859a8e" />
        <ellipse cx="73" cy="44" rx="7" ry="10" fill="#b9cec0" />
        <path d="M91 37h17l-4 12-15 4Z" fill="#3d4b46" />
        <Cut d="M92 44h10M84 62l18-4m-17 8 16-3m-15 8 12-2" color="#424d42" width={1.5} />
        <Cut d="M61 29q5-8 15-10m7 0h12l12 17" color="#d4caae" />
      </>
    );
  if (kind === 'guardian')
    return (
      <>
        <path d="M49 30Q60 4 89 10q31 3 32 31l-17 36-30 4-21-20Z" fill="#354f53" />

        <path d="M57 29Q69 10 89 17q22 4 25 25L99 70l-24 4-18-17Z" fill="#7c9b9e" />
        <path d="M58 37q29-11 54 0l-6 13-41 7Z" fill="#293b3c" />
        <path d="m66 42 33-6-2 4-29 7Z" fill="#a9d1c9" />
        <path d="M65 58 85 54l15-4-5 19-18 4Z" fill="#acb1a1" />
        <Cut d="M73 60l16-3m-14 8 11-3M64 26q12-10 24-5m7 3 10 7" color="#d0d0b8" />
      </>
    );
  if (kind === 'scrap')
    return (
      <>
        <path d="M52 25 83 13l28 11-2 22-9 5 6 23-32 6-22-18Z" fill="#716650" />
        <path d="M62 28 82 21l20 10-3 20-18 5 10 18-20-5-12-18Z" fill="#969d8d" />
        <path d="M58 40 77 34l2 20-18 3Z" fill="#343e37" />
        <path d="m63 43 10-3 1 9-11 4Z" fill="#abc5af" />
        <path d="m92 34 15-3-2 12-14 3Z" fill="#41483e" />
        <Cut d="m81 57 4 11m4-13 5 13m-17-7 18-2M64 28l15-5m12 2 8 5" color="#d6c7a4" width={1} />
      </>
    );
  if (kind === 'sentinel')
    return (
      <>
        <path d="M49 28 64 9h37l21 21-8 40-30 12-27-13Z" fill="#434f49" />
        <path d="M61 28 72 17h25l16 16-11 33-17 10-20-12Z" fill="#9fa48f" />
        <path d="M78 15h12l4 39-11 19-9-21Z" fill="#6a7160" />
        <path d="M57 38 82 42l32-7-5 13-25 5-23-5Z" fill="#2e3d39" />
        <path d="m66 43 15 2 22-6-4 4-17 6-14-3Z" fill="#b4cabc" />
        <Cut d="M77 59l9 3m-8 3 8 3M66 28l7-6m26-1 7 10" color="#dbd0b4" />
      </>
    );
  if (kind === 'colossus')
    return (
      <>
        <path d="M42 33Q55 3 86 10q29 1 42 29l-19 42H62Z" fill="#5b593e" />

        <path d="M52 34Q64 12 86 17q20 0 32 23l-16 33H67Z" fill="#b3a46d" />
        <path d="M78 18 90 17l9 46-14 11-13-16Z" fill="#e0c68a" />

        <path d="M55 37 83 41l31-4-9 13-21 4-24-7Z" fill="#5e6045" />
        <path d="M66 43h15l-2 3-12-1Zm23-1h15l-4 4H89Z" fill="#eadba4" />

        <Cut d="M80 59h9m-8 5h7M57 31q8-12 20-13m21 3q10 4 15 14" color="#e6d2a0" width={1} />
      </>
    );
  return (
    <>
      <path d="M57 31Q68 10 89 17l24 15-9 28-11 16-19-1-15-15Z" fill="#a6a991" />

      <path d="m64 38 18 6-11 17-10-10Zm26 3 19-8-8 19-16 7Z" fill="#2b3632" />
      <path d="m82 55-7 14h14Z" fill="#465046" />
      <Cut
        d="m68 69 4 7m4-8 1 10m5-10 1 10m6-11 1 9M65 30l12-10 16 1"
        color="#424f41"
        width={1.2}
      />
    </>
  );
}

function MetalPortrait({ kind }: { kind: Machine }) {
  const copper = '#98734f';
  const steel = kind === 'guardian' ? '#718f95' : kind === 'colossus' ? '#b59b62' : '#88908a';
  return (
    <g>
      {kind === 'pup' || kind === 'drake' ? (
        <>
          {kind === 'drake' && (
            <>
              <path d="M34 112 10 25l22 15 5-18 33 55Z" fill="#514c42" />
              <Cut d="M15 35 40 98m-12-48 27 44" color="#b8a47b" />
            </>
          )}

          <path
            d="M22 112 39 80l17-19-8-43 27 20 24-13 22 19-4 17 33 9-8 18-34 12-7 12Z"
            fill={shadow}
          />
          <path
            d="M36 112 49 82l19-17-11-34 19 16 23-15 16 15-10 18 36 10-5 9-34 9-12 19Z"
            fill={copper}
          />
          <path d="m71 52 28-15 13 12-17 16 17 16-14 7-30-14Z" fill={steel} />
          <path d="M102 67 139 76l-4 8-34-4Z" fill="#b3ae93" />
          <path d="m138 73 11 1-8 12-8-4Z" fill="#323a37" />
          <Eye d="m97 51 14-3-7 8Z" color="#b0d1ce" />
          <path d="m52 90 15-11 16 14-15 19H42Z" fill="#4f5a56" />
          <Cut
            d="m55 90 11-6 12 10-10 12M75 57l20-12m14 41 23-2m-29-1 6 10"
            color="#c8b58d"
            width={1}
          />
          <path d="m65 83 5-2 3 5-5 3Zm28-18 3-2 3 3-3 3Z" fill={bone} />
        </>
      ) : kind === 'egg' ? (
        <>
          <path d="M80 12c23 0 42 36 42 66s-13 34-42 34-42-4-42-34S57 12 80 12Z" fill={shadow} />
          <path d="M81 18c17 0 33 34 33 60s-9 28-32 28-34-4-34-28 16-60 33-60Z" fill={steel} />
          <path d="M81 18Q65 49 69 78l-5 27-10-9-6-20q0-29 33-58Z" fill="#536362" />
          <path d="M82 19q18 21 21 51l-7 35 11-8 7-21Q109 38 82 19Z" fill="#b8b69b" />
          <path d="M54 68 67 58l15 9 15-12 13 8-3 26-13 4-13-12-12 12-16-6Z" fill="#675640" />
          <Cut d="m55 71 14-8 13 10 14-12 12 6M70 91l11-12 13 12" color="#ccb48c" width={1.2} />
          <path d="M79 73q9 0 9 7l-7 7-7-8Z" fill="#afccc1" />
        </>
      ) : kind === 'bomb' ? (
        <>
          <path
            d="M40 112Q22 89 35 60q9-24 40-25l-4-13 21-4 9 20q37 11 33 48l-13 26Z"
            fill={shadow}
          />
          <path d="M50 112Q28 83 48 60q17-22 45-15 35 10 33 40l-13 27Z" fill="#65716c" />
          <path d="M90 46Q66 66 78 112h32q21-37-3-57Z" fill={copper} />
          <path d="m76 32 19-5 5 16-21 1Z" fill={steel} />
          <Cut d="M91 22Q84 7 108 7l10 7m-2-9 3 10 11 2" color="#d0b37c" width={2} />
          <Cut
            d="M45 66q31-14 74 7M41 91q32-9 82 6m-48-47q-20 23-14 60"
            color="#bcc0a7"
            opacity={0.5}
          />
          <path d="m79 75 8-6 14 10-7 24H79l-8-15Zm3 5-5 6 8 4 5-8Z" fill={shadow} />
          <path d="m91 84 6 3-6 7-5-3Z" fill="#cad0b1" />
        </>
      ) : (
        <>
          {kind === 'reaper' || kind === 'harvester' ? (
            <>
              <path d="M28 112V21h5v91Z" fill="#625d4b" />
              <path d="M26 25Q40 1 79 10 47 13 35 38Z" fill="#a4b2ad" />
              <Cut d="M31 24q16-14 34-12" color="#d7d1b7" />
            </>
          ) : null}
          {kind === 'colossus' && (
            <g fill="none" stroke="#887544" strokeWidth="2" opacity=".65">
              <path d="M38 53Q39 13 80 10q34 4 41 43M49 27l-7-8m30-7-1-9m33 16 7-8m12 28 9-3" />
            </g>
          )}
          {!(kind === 'scrap') && (
            <path d="M18 112 25 81l28-16-8-36 17-20h43l18 22-8 34 26 15 13 32Z" fill={shadow} />
          )}
          {!(kind === 'scrap') && (
            <path d="M29 112 34 87l26-17-7-39 12-14h36l15 17-10 37 24 15 12 26Z" fill={steel} />
          )}
          {kind === 'scrap' && (
            <>
              <path d="M20 112 35 81l23-15-9-40 32-13 30 17-7 37 29 17 10 28Z" fill={shadow} />
              <path d="M33 112 44 87l22-18-7-36 24-13 20 14-9 37 27 18 9 23Z" fill={steel} />
            </>
          )}

          <MachineFace kind={kind} />
          <path d="M34 88 57 76l25 24 24-24 24 13 12 23H28Z" fill="#59665f" />
          <path d="M36 88 54 80l18 21-27 11H29Zm75-7 17 10 8 21h-19l-18-13Z" fill={copper} />
          <Cut
            d="M38 92 53 85l14 15-20 9m67-22 10 7 6 14M60 32l13-10m28 1 9 12"
            color="#c9ba96"
            opacity={0.6}
          />
          <path d="m78 94 7-3 8 8-8 10-9-7Z" fill={kind === 'guardian' ? '#8cbbbd' : '#b59c6b'} />
          {kind === 'colossus' && <path d="m65 17-6-12 18 6 7-10 6 11 17-6-6 11Z" fill="#c4ad73" />}
          {kind === 'sentinel' && (
            <>
              <path d="M70 10V0h24v10Z" fill="#8c8e78" />
              <Cut d="M78 2v7m7-7v7" color="#d2c7a8" />
            </>
          )}
          {kind === 'harvester' && <path d="M20 104 24 79l14-6 11 11-7 28H20Z" fill="#a4916b" />}
        </>
      )}
    </g>
  );
}

type Demon = 'imp' | 'matron' | 'juggler' | 'watcher' | 'infernal' | 'devourer';
function DemonPortrait({ kind }: { kind: Demon }) {
  const broad = kind === 'devourer' || kind === 'watcher';
  const skin = kind === 'infernal' ? '#8d6366' : kind === 'matron' ? '#8d7b95' : '#796784';
  return (
    <g>
      <path
        d={
          {
            imp: 'M64 39Q27 30 35 8 42 27 74 28Zm32-10q24-2 32-19 6 26-20 35Z',
            matron: 'M65 37Q35 19 52 0q-8 23  27 25Z',
            juggler: 'M65 40Q16 35 24 7 37 28 74 29Zm35-9 13-22 14 7-19 22Z',
            watcher: 'M58 41Q13 36 25 0 31 26 68 26Zm44-11Q136 20 134 0q17 36-27 47Z',
            infernal: 'M63 41Q15 43 20 17q7 13 40 5l14 10Zm37-11Q129 11 133 0q9 31-25 45Z',
            devourer: 'M61 42Q22 52 14 26q15 14 47-1l15 11Zm41-14q35-15 42-10 2 28-34 30Z',
          }[kind]
        }
        fill="#34303b"
      />
      <path
        d={
          {
            imp: 'M64 33Q41 26 39 15q3 15 26 22Zm40-4q15-5 21-12-1 14-19 18Z',
            matron: 'M63 30Q46 15 50 7q-10 18 14 30Zm39-1q15-15 14-21 8 8-10 29Z',
            juggler: 'M62 34Q35 30 28 17q-1 19 34 24Zm44-8 8-12 7 3-12 15Z',
            watcher: 'M56 35Q31 29 29 14q-3 22 28 27Zm51-2q19-9 24-20 3 22-23 27Z',
            infernal: 'M59 32Q36 38 26 26q10 19 36 12Zm47-1q23-12 26-23 2 23-23 31Z',
            devourer: 'M54 35Q31 44 21 33q8 18 36 9Zm55-2q25-11 28-8-3 12-27 15Z',
          }[kind]
        }
        fill="#ab9a84"
      />
      {!broad && <path d="M18 112q5-28 35-40l12-43 23-13 23 14 6 39 24 14 13 29Z" fill="#292530" />}
      {broad && <path d="M9 112q9-29 38-40l9-35 27-18 29 18 7 32q34 12 37 43Z" fill="#292530" />}
      {!broad && <path d="M34 112q6-21 27-34l12-44 15-9 15 11 6 40 24 17 6 19Z" fill={skin} />}

      {broad && <path d="M25 112q6-24 32-32l7-39 19-13 21 15 5 34 26 19 5 16Z" fill={skin} />}
      <path
        d={
          {
            imp: 'M59 34Q80 19 105 33l8 22q-3 29-27 40L62 70Z',
            matron: 'M69 32Q87 16 103 32l4 27q-3 26-18 37L70 73Z',
            juggler: 'M69 28Q88 20 101 36l2 29-17 24q-17-8-22-28Z',
            watcher: 'M54 42Q65 21 88 24q27 7 31 29l-10 24-24 17-24-11Z',
            infernal: 'M67 29Q91 20 108 41l2 22-17 25q-25-10-29-31Z',
            devourer: 'M50 44Q62 25 87 24q29 8 34 33l-4 22q-12 20-32 18L57 83Z',
          }[kind]
        }
        fill={skin}
      />
      <path
        d={
          {
            imp: 'M66 39q16-14 34-5l5 23-13 22-18-3-12-18Z',
            matron: 'M77 30q10-7 21 3l3 26-12 28-10-10-7-23Z',
            juggler: 'M76 31q15-5 22 12l-6 29-8 10-12-25Z',
            watcher: 'M60 45q13-16 33-12l17 22-13 22-14 10-20-15Z',
            infernal: 'M76 31q18-7 28 14l-8 23-9 13-17-15Z',
            devourer: 'M61 43q17-14 37-5l11 21-9 19-17 12-20-13Z',
          }[kind]
        }
        fill="#a08d9d"
      />
      <path d="M86 42 98 48l-7 19-7-2 6-9Z" fill="#554359" />
      <path d="M67 48 81 51l-8 9-11-7Zm23 3 18-5-4 12-14 3Z" fill="#322633" />
      <Eye d="m69 52 9 1-6 3Z" color="#d5bd8a" />
      <Eye d="m92 53 12-4-6 6Z" color="#d5bd8a" />
      <path d="M74 74q14-4 24-3l-5 3-17 2Z" fill="#342435" />
      <path d="M74 81q10 6 22-2l-5 16-7 7-8-12Z" fill="#55435b" />
      <path d="M34 112 49 86l16-8 11 25 12-5 14-22 23 18 13 18Z" fill="#443b4c" />
      <Cut
        d="M48 95l12-7 11 21m39-24 14 13 4 11M67 36l6-4m24 0 6 8m-33 28 4 3m20-3 6-4"
        color="#bba9b4"
        opacity={0.45}
      />
      {kind === 'imp' && (
        <>
          <path d="M49 75 31 48l7-25 14 25 8 5Zm65-19 21-24 4 29-16 20Z" fill="#42354e" />
          <Cut d="m34 42 17 23m82-17-11 20" color="#9b83a1" />
        </>
      )}
      {kind === 'matron' && (
        <>
          <path d="M52 33q16-25 39-22l-21 20-11 44-11 37H22q3-23 25-35Z" fill="#4f445d" />
          <path d="M99 24q22 16 14 49l21 39h-25L98 78l9-29Z" fill="#4f445d" />
          <path d="M68 93q15 8 31-6l-12 20Z" fill="#af9b79" />
          <Cut d="M50 74 35 106m26-15-8 20m50-18 7 15" />
        </>
      )}
      {kind === 'juggler' && (
        <>
          <path
            d="M12 88q-8-17 8-34 8-9 5-20 15 18 5 33-14 11-10 26Z"
            fill="#a495b3"
            opacity=".7"
          />
          <path d="M137 84q14-15 4-28-5-9 2-20-20 9-16 25 9 11 3 22Z" fill="#a495b3" opacity=".7" />
          <Cut d="M16 75q-2-10 7-19m113 14q0-8-4-13" color="#d1c4d7" />
          <path d="M46 112 39 92l11-13 5 3-4 10 10 20Z" fill={skin} />
        </>
      )}
      {kind === 'watcher' && (
        <>
          <path d="M68 36q14-14 31 0-17 13-31 0Z" fill="#42344a" />
          <path d="M75 36q8-7 17 0-9 7-17 0Z" fill="#d0b288" />
          <path d="M83 31v10" stroke="#40314a" strokeWidth="3" />
          <path d="M43 91 63 78l-1 26-10 8H32Zm67-11 18 17 8 15h-24l-9-9Z" fill="#4f445b" />
        </>
      )}
      {kind === 'infernal' && (
        <>
          <path d="M31 112 41 50l7-3 1 65Z" fill="#775d4d" />
          <path d="M44 54Q18 40 21 13 33 35 48 31Z" fill="#bfa276" />
          <Cut d="M26 24q5 17 16 21" color="#ead3a4" />
          <path d="M52 88 65 78l8 24-7 10H35Z" fill="#817153" />
        </>
      )}
      {kind === 'devourer' && (
        <>
          <path d="M61 66q-18-4-14-22 4 12 19 9Zm44-12q18-8 18-22 14 27-15 33Z" fill="#b6aa8d" />
          <path d="M49 92 60 78l10 16-6 18H33Zm63-11 17 15 9 16h-21l-13-14Z" fill="#676054" />
          <Cut d="m54 94 8-9m51 9 7 6" color="#c1b89c" width={1.1} />
        </>
      )}
    </g>
  );
}
function Wisp() {
  return (
    <g>
      <path
        d="M51 112q22-19 3-40Q33 44 70 17l13-16q-1 24 17 34 35 20 17 46l-22 31Z"
        fill="#4c425b"
      />
      <path d="M63 112q25-29-4-48 1-24 24-40-5 21 16 29 21 20-7 38Z" fill="#9b8baf" opacity=".7" />
      <path d="M76 34q-18 17-12 34l18 17 15-13-4-26Z" fill="#b8a7bf" />
      <path d="M68 51 80 56l-8 10-8-9Zm16 5 12-9-1 13-10 5Z" fill="#403148" />
      <Cut d="M79 70 87 76l-4 12M61 87q9 12 0 21" color="#d8c6d9" />
    </g>
  );
}

type Element = 'spark' | 'molten' | 'tempest' | 'dancer' | 'cyclone' | 'elder';
function ElementPortrait({ kind }: { kind: Element }) {
  return (
    <g>
      {kind === 'elder' || kind === 'molten' ? (
        <>
          <path d="M6 112 28 83l8-29 22-12 13-36 28 6 9 24 21 15 10 31 16 30Z" fill={shadow} />
          <path
            d="M21 112 37 81l9-24 19-10 14-31 14 3 8 24 18 13 10 33 14 23Z"
            fill={kind === 'elder' ? '#708582' : '#706862'}
          />
          <path
            d="M79 16 93 19l8 24-17 12 6 17-18 12-11-22 10-20Z"
            fill={kind === 'elder' ? '#a8b4a5' : '#a58f75'}
          />
          <path d="m101 47 18 9-5 24-14 8-9-20Z" fill="#485b58" />
          <path d="m76 52 12 4-10 8-11-6Zm23 3 17-6-5 13-11 3Z" fill={shadow} />
          <path d="m85 79 16-6-9 15Z" fill={shadow} />
          {kind === 'molten' ? (
            <>
              <Cut
                d="m77 19 5 26-15 14 9 16-8 37m34-67-10 17 7 17-11 11 5 22M40 86l20-13 10 5"
                color="#dba368"
                width={1.8}
                opacity={0.9}
              />
              <path d="m70 56 13 3-7 3Zm33 0 10-3-6 7Z" fill="#e4b875" />
            </>
          ) : (
            <>
              <path d="M60 37 78 12l17 5-9 10-14 2-6 11Z" fill="#8f9d72" />
              <Cut d="m45 67 10 11-6 20m67-20-15 11 7 14m-28-9-10 10m10-10 14 15" color="#c2c5ad" />
              <path d="m81 17 4-10 8 8-7 11Z" fill="#bcc195" />
            </>
          )}
        </>
      ) : kind === 'tempest' || kind === 'cyclone' ? (
        <>
          <path
            d="M19 112Q1 80 43 64-13 36 51 16 84 1 138 24 157 47 112 63 163 91 127 112Z"
            fill="#253d43"
          />
          <path
            d="M24 112Q6 87 65 71 8 55 24 30 47 9 111 20l-21 8Q32 20 36 42q4 17 49 9 44-7 42-19 27 20-26 36 52 24 23 44Z"
            fill="#668e93"
          />
          <path
            d="M42 112Q27 93 85 80 45 69 28 50q30 17 69 4-9 19-43 17 64 14 51 41Z"
            fill="#a0c0bd"
          />
          <path d="M75 26q24-8 37 8l-20 17-20-4-11-8Z" fill="#c3d0c3" />
          <path d="M68 36 81 39l-9 7-9-5Zm18 4 17-9-6 12-12 5Z" fill="#2d4a50" />
          <Cut
            d="M34 35q15-13 37-12M25 88q11-8 35-14m37 14q13 6 12 15"
            color="#d0d7c9"
            width={1.1}
            opacity={0.65}
          />
          {kind === 'cyclone' && (
            <g fill="#a8c7c7">
              <path d="m13 44 8-22 5 14-6 21Zm117 15 18-13-6 29-9 11Zm-5-38 10-19 9 26-14 6ZM30 108l-7-18 12 4 7 18Z" />
            </g>
          )}
        </>
      ) : (
        <>
          <path
            d="M14 112Q10 82 37 61 49 50 39 26l24 17Q58 18 89 2l-6 26q22 5 25 25l19-22q10 33-10 53l28 28Z"
            fill="#503b32"
          />
          <path
            d="M28 112Q21 90 53 69 70 56 56 41l18 14q-13-25 8-40-6 24 10 34 24 16 12 38l18-12-5 22 15 15Z"
            fill="#a2734e"
          />
          <path d="M54 112Q41 91 74 70 65 58 80 36q-3 20 16 29 10 16-8 32l6 15Z" fill="#d2aa6b" />
          <path d="M73 57 83 62l-10 8-9-5Zm15 4 11-7-2 12-9 5Z" fill="#684b35" />
          <Cut d="M40 90q-9 10-2 18m68-34q6 15-7 28M70 38q-2-15 7-23" color="#dfbf89" width={1.1} />
          {kind === 'dancer' && (
            <>
              <path
                d="M20 108Q6 75 27 48q-7 25 8 39Zm110 4q18-21 3-43 24 15 19 43Z"
                fill="#bc8b59"
              />
              <Cut d="M17 72q-6-21 9-37m105 21q18-23 6-37" color="#d2b485" width={1.3} />
            </>
          )}
        </>
      )}
    </g>
  );
}

type Person = 'squire' | 'banner' | 'captain' | 'menagerie' | 'baron';
function HumanPortrait({ kind }: { kind: Person }) {
  const baron = kind === 'baron';
  const keeper = kind === 'menagerie';
  return (
    <g>
      {kind === 'banner' && (
        <>
          <path d="M28 112V3h4v109Z" fill="#827357" />
          <path d="M32 7q22-7 41 4L59 34l13 13-40-6Z" fill="#887c4c" />
          <Cut d="M38 12v22l20 4m-10-24 10 3-8 13Z" color="#c7b386" width={1.1} />
        </>
      )}
      <path
        d="M9 112Q20 84 52 77l13-18-3-30Q68 7 91 8q25 4 29 27l-7 30 8 16q28 11 35 31Z"
        fill="#24292a"
      />
      <path
        d="M26 112q12-25 38-26l12-21 21 4 11 18q26 4 34 25Z"
        fill={baron ? '#625c6d' : keeper ? '#677158' : '#7f7970'}
      />
      <path d="M72 28q15-16 31 0l4 22-10 25-14 6-16-23Z" fill="#aa957d" />
      <path d="M73 29 81 24l6 17-10 13 7 19-15-12Z" fill="#6b655c" />
      <path d="M96 30 105 37l-9 13 8 8-8 5-2-9Z" fill="#d0b899" />
      <path d="M75 39 89 43l-7 7-9-4Zm19 4 13-7-3 11-9 4Z" fill="#3a3a36" />
      <Eye d="m95 43 8-3-5 4Z" color="#c8c6aa" />
      <Cut d="M88 64l9-3m-5-9-3 4 5 1M76 33l8 3" color="#5d584d" width={1} />
      <path
        d="M31 99q9-12 29-13l14 20-8 6H22Zm82-12 18 11 11 14h-29l-13-10Z"
        fill={keeper ? '#9b9274' : '#a49b7f'}
      />
      <Cut
        d="M30 103q13-12 27-13l10 15m50-12 9 8 5 8M76 89l10 16 15-19"
        color="#c9b797"
        width={1.2}
      />
      {kind === 'squire' && (
        <>
          <path d="M62 35Q60 9 89 8q22 0 31 27l-10 17-8-27-14 6-11-5-9 27Z" fill="#929789" />
          <path d="M67 36 87 39l24-9-7 23-16 10-17-14Z" fill="#6b7772" />
          <path d="m72 40 16 5 18-8-3 7-15 6-14-5Z" fill="#202b2b" />
          <Cut d="m89 52 4 1m-3 4 4 1M70 22q8-10 19-9" color="#c7caba" />
        </>
      )}
      {kind === 'captain' && (
        <>
          <path d="M64 28Q66 9 90 8q25 4 31 21l-30-9-21 13Z" fill="#a7946f" />
          <path d="M89 15Q71 10 73 2q19 1 35 14l-10 4Z" fill="#a15f50" />
          <path d="M69 58q7 24 19 24l12-11-13 4-10-10Z" fill="#615b51" />
          <path d="M72 87 86 105l16-23-4 30H77Z" fill="#7f5a48" />
        </>
      )}
      {baron && (
        <>
          <path d="M62 29 67 7l31-7 12 23 11 8-34-10Z" fill="#5c5467" />
          <Cut d="M72 12l24-6 8 15" color="#ac9b95" />
          <path d="M72 57 83 67l13-4 10-7-6 27-11 10-13-16Z" fill="#a6a99e" />
          <path d="M53 80 69 66l10 33-5 13H44Zm54-11 15 15 13 28h-31l-6-17Z" fill="#494253" />
          <Cut d="M78 73l8 10m6-10-2 11m-32 1 10 22m48-19 9 21" color="#c5c4b5" />
        </>
      )}
      {keeper && (
        <>
          <path d="M54 68Q44 18 79 9q26-7 46 20l-13 27-7-28-18-7-14 14-6 35Z" fill="#566450" />
          <path d="M26 105 48 80l14-3 13 19-8 16H20Zm81-23 15 3 23 27h-39l-10-12Z" fill="#989780" />
          <Cut d="m39 103 6-10m3 8 6-12m6 13 3-10m57 2 8 12" color="#d2c8aa" />
          <path d="M82 96q5-5 10-1l-1 10-9 2Z" fill="#bca378" />
        </>
      )}
    </g>
  );
}
function Amalgam() {
  return (
    <g>
      <path
        d="M14 112 29 75l27-21-8-40 25 14 16-20 24 17-1 19 37 16-8 24-35 11-9 17Z"
        fill={shadow}
      />
      <path
        d="M28 112 43 80l23-22-10-29 20 12 15-23 15 12-7 20 41 17-6 13-33 8-16 24Z"
        fill="#73866d"
      />
      <path d="m77 42 14-24 15 12-7 20 11 6-14 18-19-6Z" fill="#afa282" />
      <path d="M100 57 140 67l-9 14-31-6Z" fill="#827590" />
      <Eye d="m93 43 15 2-10 4Z" color="#d2c69f" />
      <path d="M37 88 14 42l28 11-1-17 30 39Z" fill="#534e62" />
      <Cut d="M23 54 46 89m-14-29 26 26" color="#b19cb1" />
      <path d="M68 83 82 72l12 16-8 24H61Z" fill="#796d51" />
      <Cut d="M71 89l10-9 7 11-6 16m-12-14 17 2m-8-12-3 23M102 82q19 6 35-7" color="#bdaa7f" />
      <path d="M92 27Q113 11 118 0q7 24-16 39Z" fill="#a597b3" />
      <path d="M81 112Q70 93 50 106L37 92q31-7 49 9Z" fill="#8aacaf" />
    </g>
  );
}

const portraits: Record<string, ReactNode> = {
  stray: <AnimalPortrait species="wolf" />,
  pup: <MetalPortrait kind="pup" />,
  imp: <DemonPortrait kind="imp" />,
  spark: <ElementPortrait kind="spark" />,
  squire: <HumanPortrait kind="squire" />,
  cat: <AnimalPortrait species="panther" coat="#4b6258" pale="#94a88f" />,
  leader: <AnimalPortrait species="wolf" coat="#526f61" pale="#b4b59a" pack />,
  harvester: <MetalPortrait kind="harvester" />,
  matron: <DemonPortrait kind="matron" />,
  molten: <ElementPortrait kind="molten" />,
  banner: <HumanPortrait kind="banner" />,
  hyena: <AnimalPortrait species="hyena" coat="#929070" pale="#c1b696" />,
  rat: <AnimalPortrait species="rat" coat="#7b7468" pale="#a7a18c" />,
  cobalt: <MetalPortrait kind="guardian" />,
  juggler: <DemonPortrait kind="juggler" />,
  tempest: <ElementPortrait kind="tempest" />,
  captain: <HumanPortrait kind="captain" />,
  sentinel: <MetalPortrait kind="sentinel" />,
  hydra: <Hydra />,
  bomb: <MetalPortrait kind="bomb" />,
  watcher: <DemonPortrait kind="watcher" />,
  dancer: <ElementPortrait kind="dancer" />,
  menagerie: <HumanPortrait kind="menagerie" />,
  mother: <AnimalPortrait species="bear" coat="#697c60" pale="#a4ad8c" />,
  croc: <AnimalPortrait species="croc" coat="#6f8371" pale="#a7b399" />,
  egg: <MetalPortrait kind="egg" />,
  infernal: <DemonPortrait kind="infernal" />,
  cyclone: <ElementPortrait kind="cyclone" />,
  baron: <HumanPortrait kind="baron" />,
  phoenix: <Phoenix />,
  wolf: <AnimalPortrait species="wolf" coat="#607362" pale="#c3c6a6" elder />,
  reaper: <MetalPortrait kind="reaper" />,
  devourer: <DemonPortrait kind="devourer" />,
  elder: <ElementPortrait kind="elder" />,
  amalgam: <Amalgam />,
  colossus: <MetalPortrait kind="colossus" />,
  cub: <AnimalPortrait species="bear" coat="#8c9575" pale="#c0bba0" young />,
  scrap: <MetalPortrait kind="scrap" />,
  wisp: <Wisp />,
  drake: <MetalPortrait kind="drake" />,
};

export function MinionArt({
  definitionId,
  tribe,
  golden = false,
}: {
  definitionId: string;
  tribe: Tribe;
  golden?: boolean;
}) {
  return (
    <ArtScene
      className="minion-portrait"
      palette={golden ? 'gold' : palettes[tribe]}
      variant={
        tribe === 'beast'
          ? 'hills'
          : tribe === 'demon'
            ? 'night'
            : tribe === 'mech'
              ? 'rays'
              : 'runes'
      }
    >
      {portraits[definitionId] ?? <HumanPortrait kind="squire" />}
      {golden && <Cut d="M12 103V91m0 12h12m112 0h12V91" color="#d8bf7b" width={1} opacity={0.8} />}
    </ArtScene>
  );
}
