import type { ReactNode } from 'react';
import { ArtScene } from '../../../shared/art/CardArt';
import type { Tribe } from '../domain/types';
import { Bear, Hydra, Panther, Phoenix, Wolf } from './CreatureIllustrations';
import { DemonPortrait } from './FiendIllustrations';
import { expansionMinionArt } from './ExpansionPortraits';
import { nightMarketMinionArt } from './NightMarketPortraits';

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

function AnimalPortrait({
  species,
  coat,
  pale,
}: {
  species: 'hyena' | 'rat' | 'croc';
  coat: string;
  pale: string;
}) {
  return (
    <g>
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

type Machine = 'pup' | 'bomb' | 'egg' | 'reaper' | 'scrap' | 'drake';
function MachineFace({ kind }: { kind: Machine }) {
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

function HarvesterPortrait() {
  return (
    <g>
      {/* A forward rake and rear scrap hopper lead a low, working silhouette. */}
      <path d="M24 112 36 82 58 69 67 41 85 29 113 40 124 74 143 112Z" fill={shadow} />
      <path d="M37 112 47 84 70 74 76 43 88 38 107 49 114 83 130 112Z" fill="#737f79" />
      <path d="M87 40 117 22 141 37 130 68 111 74 102 54Z" fill="#4b5954" />
      <path d="m101 43 18-12 16 9-8 21-16 6Z" fill="#a59470" />
      <path d="m111 47 18-8-6 13-10 4Z" fill="#d4ba87" />
      <path d="M75 45 88 34l17 12-4 21-20 12-13-17Z" fill="#a9b1a3" />
      <path d="m77 52 20-5-3 12-20 10Z" fill="#354d4d" />
      <path d="m82 54 10-3-2 4-9 5Z" fill="#b7d3c3" />
      <path d="M65 65 43 55 30 30 21 33l7 29 24 18-7 32h13l10-41Z" fill="#4a5d59" />
      <path d="M37 54 24 21 13 14l8 34 14 20 26 10 7-10Z" fill="#a89169" />
      <path d="M12 14 30 22l19-9-8 18-16 8-13-8Z" fill="#c8cab4" />
      <path d="m24 37 12-7-4 25-5-3Zm16 30 23 9-8 8-18-10Z" fill="#dbbf88" />
      <path d="M46 112 55 93l19-8 9 27Zm41 0 10-22 20 5 11 17Z" fill="#435552" />
      <Cut
        d="m76 75 12-7m-11 16 11-5m27-24 11-4M46 103l9-19m38 22 7-16"
        color="#d5c7a6"
        width={1.1}
      />
    </g>
  );
}

function GuardianPortrait() {
  return (
    <g>
      {/* The shield is the leading mass; the machine braces behind its inner edge. */}
      <path d="M18 31 53 12 91 29 88 82 55 111 16 86Z" fill={shadow} />
      <path d="M25 35 53 21 83 34 79 79 55 101 24 81Z" fill="#6b959a" />
      <path d="M34 40 54 29l20 11-3 34-17 18-20-17Z" fill="#a6c2b8" />
      <path d="M53 29v63l-19-17V40Z" fill="#54777c" />
      <path d="m37 48 16-9 17 8-2 22-15 14-16-13Z" fill="#35575d" />
      <path d="m41 52 12-7 13 6-2 14-11 11-12-10Z" fill="#8caba7" />
      <path d="M88 112 85 70l11-17 21-1 16 22 17 38Z" fill={shadow} />
      <path d="M94 112 91 75l13-13 17 4 11 46Z" fill="#66878c" />
      <path d="M88 37 106 21l24 9 3 24-16 17-24-7Z" fill="#304b4e" />
      <path d="m95 39 14-10 15 7 2 17-11 11-18-6Z" fill="#a4b9aa" />
      <path d="m98 45 24-7-1 9-20 7Z" fill="#183e44" />
      <path d="m100 47 18-5-1 3-16 6Z" fill="#b9d5c9" />
      <path d="M80 75 95 68l10 10-8 13-17 2Z" fill="#b38d65" />
      <path d="M101 88 126 83l15 29h-37Z" fill="#42646a" />
      <Cut d="M29 41v35l24 19 22-20M96 33l9-6m6 36 9-10m-26 38 5-11" color="#d3d6bd" width={1.1} />
    </g>
  );
}

function SentinelPortrait() {
  return (
    <g>
      {/* Tall watch head and splayed load-bearing feet replace the shared bust. */}
      <path d="M63 112 60 53l12-32 36-1 15 36-4 56Z" fill={shadow} />
      <path d="M69 111 68 57l10-27 25-1 11 29-5 53Z" fill="#78847c" />
      <path d="M76 35 88 26l16 6 7 22-10 16-23-1-10-15Z" fill="#aab2a0" />
      <path d="m71 45 31 3 8-5-2 13-27 5-12-8Z" fill="#314c49" />
      <path d="m79 50 24 2-3 4-20 2Z" fill="#c1d2bc" />
      <path d="M77 14 86 3l20 2 6 12-9 14-25 1Z" fill="#404d48" />
      <path d="m84 13 9-5 11 4 2 8-9 7-13-4Z" fill="#c0b28a" />
      <path d="M68 61 47 69 30 103 37 112h22l18-25Z" fill="#3e5551" />
      <path d="m62 66-15 11-14 30h21l19-27Z" fill="#9da999" />
      <path d="M111 61 127 71l18 36-9 5h-23L99 85Z" fill="#3e5551" />
      <path d="m118 70 12 13 10 24h-21l-15-25Z" fill="#a29476" />
      <path d="M72 75 88 83l18-8-4 37H77Z" fill="#5b6d63" />
      <path d="M28 104h35l-7 8H26Zm79 0h38l7 8h-43Z" fill="#c2ad7e" />
      <Cut
        d="m75 33 3-9 9-6m17 12 5 15M44 99l19-27m65 25-16-25M82 91l6 4 9-6"
        color="#d0c5a5"
        width={1.1}
      />
    </g>
  );
}

function ColossusPortrait() {
  return (
    <g>
      {/* Small crown over a broad, uneven furnace body and two heavy supports. */}
      <path d="M11 112 17 52 46 28 72 35 88 20 119 28 147 55 154 112Z" fill={shadow} />
      <path d="M21 108 25 56 48 38 71 43 88 29 115 37 140 59 145 108Z" fill="#7f7654" />
      <path d="M13 58 35 29 56 35 64 53 54 82 22 90Z" fill="#bba56d" />
      <path d="m21 59 17-21 14 5 5 17-10 15-27 7Z" fill="#ded19b" />
      <path d="M111 36 136 42l19 28-5 29-34-18-11-30Z" fill="#ae9863" />
      <path d="m119 43 14 7 13 21-3 15-23-12-8-24Z" fill="#d6ba7e" />
      <path d="M58 49 82 36l33 12 5 37-17 27H61L45 82Z" fill="#495249" />
      <path d="m61 55 23-10 25 10 3 27-15 24H67L54 80Z" fill="#a7a078" />
      <path d="M65 60 82 52l19 8-4 23-17 16-18-18Z" fill="#ccb985" />
      <path d="M68 26 77 12l25 1 10 15-10 21-25 1Z" fill="#3d493f" />
      <path d="m76 26 9-8 15 1 7 11-8 12-18-1Z" fill="#d2bf87" />
      <path d="m78 30 24 1-5 7-16-1Z" fill="#313b36" />
      <path d="M76 13 69 2l16 6 10-8 8 9 15-5-8 12Z" fill="#e5d49e" />
      <path d="M22 93 53 84l16 28H18Zm90-9 35 12 8 16h-52Z" fill="#5f654e" />
      <path d="m26 99 25-7 10 20H22Zm91-7 26 9 5 11h-35Z" fill="#c5ae78" />
      <Cut
        d="m28 58 14-15m88 10 13 18M63 67l17-10m23 10-3 13M70 103h27"
        color="#ead9a3"
        width={1.2}
      />
    </g>
  );
}

function MetalPortrait({ kind }: { kind: Machine }) {
  const copper = '#98734f';
  const steel = '#88908a';
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
          {kind === 'reaper' ? (
            <>
              <path d="M28 112V21h5v91Z" fill="#625d4b" />
              <path d="M26 25Q40 1 79 10 47 13 35 38Z" fill="#a4b2ad" />
              <Cut d="M31 24q16-14 34-12" color="#d7d1b7" />
            </>
          ) : null}
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
          <path d="m78 94 7-3 8 8-8 10-9-7Z" fill="#b59c6b" />
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
  if (kind === 'tempest')
    return (
      <g>
        {/* A low storm front drives right; the trailing gusts leave open sky. */}
        <path
          d="M8 49Q19 22 66 29L49 14q35-4 57 15l17-7 23 13-9 18-24 9q-8 20-36 23l23 14Q42 107 19 86q31 6 46-7Q12 82 6 66l34 1Z"
          fill="#2b4e59"
        />
        <path
          d="M14 47q27-21 66-9L66 23q29 4 39 18l20-10 13 7-9 10-30 9q-9 18-39 19l13 12q-23 0-40-8 42-2 43-19-32 7-55 0l26-5Z"
          fill="#73a5af"
        />
        <path
          d="M28 44q27-7 57 3l18-3-8 10q-31 2-45-5Zm43 25q15-7 19-17l22 3-12 14-23 8Z"
          fill="#c0d9d4"
        />
        <path d="M104 39q12-15 27-6l9 6-14 10q-10 5-26 5l8-7Z" fill="#a9c9cd" />
        <path d="m115 39 16-1q-6 8-17 6Z" fill="#243f4d" />
        <path d="m87 73-18 19 10 1-9 17 26-24-12 1 16-17Z" fill="#e5d7a3" />
        <Cut
          d="M16 37q18-12 41-10M26 95q20 5 36 0m-42-26 29 2m54-14 18-6"
          color="#c4d9d1"
          width={1.1}
        />
      </g>
    );
  if (kind === 'cyclone')
    return (
      <g>
        {/* A hollow glass funnel carries a broad lip over a narrow twisting foot. */}
        <path
          d="M31 34Q20 15 71 10q51-5 63 13 10 22-30 39l-4 25-19 24-7-30-20-18Q32 58 31 34Z"
          fill="#2d5862"
        />
        <path
          d="M39 30Q48 15 93 17q30 0 32 13-7 17-36 31l3 26-11 17-1-28-23-20Q37 48 39 30Z"
          fill="#81bbc0"
        />
        <path d="M46 29q15-12 47-8 22 2 24 10-16 11-49 9-17-1-22-11Z" fill="#244853" />
        <path d="M39 31q2-14 53-14L64 27q-13 6 9 13-30-2-34-9Z" fill="#d0e4d9" />
        <path
          d="M109 21q21 3 15 14-9 17-35 30l3 19-10 19 2-31q8-18 22-27 18-14 3-24Z"
          fill="#b3d7d2"
        />
        <path d="M44 43q37 15 69-1L90 62l-11 2-4 14-17-19Z" fill="#4a8792" />
        <path d="m62 48 13 5-7 6-9-8Zm18 6 15-4-10 10-7 1Z" fill="#e2eee1" />
        <path d="M57 69q24 12 47-7L89 83l-10-6Z" fill="#234953" />
        <path
          d="m21 48 9-17 3 17-7 13Zm110 15 17-14-6 26-13 10ZM48 83l9-11 4 17-7 11Z"
          fill="#83b7bc"
        />
        <Cut
          d="M26 71q35 18 84 0m-69-4q39 12 79-14M57 46l8 2m32-27 9 3M78 85l4 15"
          color="#d1e7df"
          width={1.2}
        />
      </g>
    );
  if (kind === 'spark')
    return (
      <g>
        {/* A single buoyant ember curls out of a small bed of cooling charcoal. */}
        <path d="M33 96q19-13 51-11l35 9-12 13-47 3-28-8Z" fill="#403b36" />
        <path d="m41 95 16-5 9 11-17 2Zm32-4 16-1 14 12-24 1Z" fill="#77604b" />
        <path
          d="M48 81Q31 61 58 41q19-13 16-33 29 12 25 36 25-3 31-17 10 31-13 43 1 26-26 28-24 10-43-5l-9-13Z"
          fill="#843e32"
        />
        <path
          d="M55 80Q41 61 65 46q17-13 16-26 17 14 10 32 24 5 36-15-1 25-22 29 14 22-9 26-25 9-41-12Z"
          fill="#d27a43"
        />
        <path
          d="M64 79q-12-12 6-27 15 8 14-14 17 18 5 30 16-3 22-10-2 21-17 27-17 9-30-6Z"
          fill="#f2bc68"
        />
        <path d="M73 77q-7-9 4-15l8 8 12-1q-7 18-19 14Z" fill="#ffe0a0" />
        <path d="m62 58 11 4-7 6-7-5Zm20 5 11-5-2 10-8 2Z" fill="#783f32" />
        <path d="M48 29q-6-6 2-15 9 8-2 15Zm61-13 5-10 4 9-5 8Z" fill="#e9a35a" />
        <Cut d="M56 48q-12 12-9 22m49-22 9-3M60 94l8-2m20 2 10 4" color="#f8cc85" width={1.1} />
      </g>
    );
  if (kind === 'molten')
    return (
      <g>
        {/* Hot liquid sags between squat basalt plates and pools under both fists. */}
        <path d="M17 102q12-12 40-9l15-6 40 7 26 4 10 11H20Z" fill="#ae593e" />
        <path d="M29 104q18-6 35-2l15-8 30 8 25 3-16 3H38Z" fill="#efb264" />
        <path
          d="m19 99 3-32 24-13 14-18 37-6 24 15 9 24 18 29-20 8-24-4-25 8-23-10-19 5Z"
          fill="#343c3c"
        />
        <path d="m31 71 22-11 9-16 32-6 19 12 11 29-20 16-22 10-20-16-17 10-19-4Z" fill="#b65e3c" />
        <path d="m55 61 14 4 12-8 21 7-8 16 10 12-22 12-15-18 6-12-18-2Z" fill="#f2b165" />
        <path
          d="m25 70 24-11 13 14-12 20-20 4-7-12Zm86-15 17 15 17 28-19 4-20-13-6-22Z"
          fill="#59615b"
        />
        <path d="m30 72 14-7 9 10-9 12-16 4Zm85-9 10 10 10 19-14-7-13-13Z" fill="#899083" />
        <path d="m57 40 37-9 22 16-9 17-23 7-27-15Z" fill="#555952" />
        <path d="m64 44 29-7 14 10-16 4-10 13-15-11Z" fill="#8c8c78" />
        <path d="m69 51 11 2-8 7-6-3Zm19 2 15-6-3 10-12 3Z" fill="#ffd38a" />
        <path d="m77 70 19-5-6 10-12 3Z" fill="#5f3c31" />
        <Cut
          d="m43 65-5 8 5 5-7 13m79-17 8 5-1 10M76 41l8 6-4 10M63 82l-6 12m39-10 5 8"
          color="#e39450"
          width={1.5}
          opacity={0.95}
        />
      </g>
    );
  if (kind === 'dancer')
    return (
      <g>
        {/* A high reaching arm and crossed pointed foot lead one continuous flame gesture. */}
        <path
          d="M29 109Q5 79 26 50q-3 27 16 31 8 19 24 21-24-30-12-51L40 35q-12-16-1-32l8 19 21 18 14-14 14 9-4 14q14 12 25 6 20-10 13-31 25 26 3 44-16 13-38 2l-10 15 22 21-30-9-5 24-12-21-9 18Z"
          fill="#713e35"
        />
        <path
          d="M35 106Q15 85 23 63q8 26 29 22l13 14q-17-26-3-48L44 31q-6-8-3-16l7 14 25 17 10-13 8 6-6 14q19 17 34 7 14-8 15-20 8 22-13 28-18 5-34-4L73 83l21 19-22-13-5 17-4-16-13 13Z"
          fill="#d47547"
        />
        <path d="M67 49 82 39l-4 18 11 5-17 16-4 18-8-17 10-18Z" fill="#f2ba71" />
        <path d="M80 27q-7-11 9-18l-1 11 13-5-5 15-10 8-8-6Z" fill="#eaa05e" />
        <path d="m87 24 7-3-2 7-6 2Z" fill="#693e35" />
        <path d="M47 36q-18-2-22-15 21 9 31 7Zm48 44q24 6 42-16-8 31-38 28Z" fill="#e8a365" />
        <path d="M49 36 66 47l-5 7-12-15Zm22 34 11-8-8 14-7 13Z" fill="#ffdb8e" />
        <Cut
          d="M22 49q-5-15 1-24m13 62q-10-3-12-13m72-16q17 12 28-1M72 91l10 8"
          color="#f4c47d"
          width={1.1}
        />
      </g>
    );
  return (
    <g>
      {/* The elder's terraced mountain shoulder rises over a heavy, planted stone hand. */}
      <path
        d="M10 111 16 69 29 58 27 40 45 33 58 5 80 14 89 31 113 33 130 51 129 74 147 83 153 111Z"
        fill="#2d4546"
      />
      <path
        d="m21 105 4-35 17-8-7-19 17-3 13-24 11 7 3 19 26-2 16 16-4 25 24 8 4 18-27 4-26-13-22 12-27-8Z"
        fill="#70877d"
      />
      <path d="m39 44 16-8 12-20 7 7-3 26-20 14-17-2Z" fill="#adb7a0" />
      <path d="m27 73 21-9 20 8-8 17 13 19-25-8-27 5Z" fill="#526a65" />
      <path d="m75 38 27-4 20 16-9 27-20 7-17-13-9-21Z" fill="#9eae9b" />
      <path d="m75 40 19-1-3 22 15 5-9 14-17-13-7-17Z" fill="#c1c7ab" />
      <path d="m79 51 11 3-7 6-7-5Zm17 3 16-4-7 10-10 1Z" fill="#304d4b" />
      <path d="m89 70 16-4-7 8-6 1Z" fill="#526a60" />
      <path d="m115 69 16 5 3 16 16 8-3 13-36-2-11-18Z" fill="#516d67" />
      <path d="m116 76 10 3 2 18 14 4-1 7-25-4-9-14Z" fill="#9daa96" />
      <path
        d="m42 40 14-9 10-17 7 9-9 16-9 4Zm-7 23 18-7 8 5-11 8-15 1Zm53 29 15-4 10 10-15 1Z"
        fill="#7f985d"
      />
      <Cut
        d="m37 48 17-4m-29 38 19-4 12 4M64 29l-3 19-12 13m35-19 9 4 10-2m1 27 6-6m-29 18 3 13m34-9 2 10m7-6 3 9"
        color="#d2d0ad"
        width={1.1}
      />
    </g>
  );
}

type Person = 'squire' | 'banner' | 'captain' | 'menagerie' | 'baron';
function HumanPortrait({ kind }: { kind: Person }) {
  if (kind === 'squire')
    return (
      <g>
        {/* A small guard braces behind a shield that carries most of the weight. */}
        <path d="M73 112 76 72 94 57l24 5 20 50Z" fill="#24292a" />
        <path d="M85 112 84 78l15-14 17 5 13 43Z" fill="#777e72" />
        <path d="M82 42q1-23 19-25 20 0 23 23l-8 23-16 8-15-12Z" fill="#aa957d" />
        <path d="M82 43q-4-24 17-31 23-1 28 27l-10-5-7-13-13 13-13 16Z" fill="#929789" />
        <path d="M85 47 102 51l17-9-4 11-14 8-15-7Z" fill="#354543" />
        <path d="M107 68 136 83l7 29h-19l-23-24Z" fill="#a49b7f" />
        <path d="M100 77 122 90l-4 8-25-13Z" fill="#d0b899" />
        <path d="M18 52 48 39 76 53 75 91 49 112 20 94Z" fill="#26312f" />
        <path d="M24 55 48 46 69 57 68 88 49 104 26 89Z" fill="#a8ada0" />
        <path d="M48 46v58L26 89l-2-34Z" fill="#687b73" />
        <path d="m33 67 15-8 13 8-2 17-11 10-14-11Z" fill="#3b514e" />
        <Cut d="M48 59v35m-14-24 14-8 10 5M85 35q6-12 16-14" color="#d6cdb2" width={1.1} />
      </g>
    );
  if (kind === 'banner')
    return (
      <g>
        {/* The planted pole and wind-pulled cloth counter a forward stepping bearer. */}
        <path d="M31 112 39 5l5 1-7 106Z" fill="#71674f" />
        <path d="M43 9q27-13 54 3l-15 20 18 15q-29-11-61-3Z" fill="#81764b" />
        <path d="M46 14q20-7 43 1L77 31l12 9q-22-7-47 0Z" fill="#b9a26a" />
        <Cut d="M50 17v18l22-3m-8-16 9 4-6 8-9-6Z" color="#e3d1a0" width={1.1} />
        <path d="M54 112 67 81l19-19 25 2 13 22 31 26Z" fill="#24292a" />
        <path d="M65 112 77 83l15-12 15 2 15 39Z" fill="#777b69" />
        <path d="M88 35q8-15 24-8l10 15-5 20-15 8-15-13Z" fill="#aa957d" />
        <path d="M85 43q-1-19 20-23 18 1 23 23l-11-4-12-9-17 15Z" fill="#394541" />
        <path d="m93 47 9 3-6 3Zm14 3 10-3-4 6Z" fill="#3a3a36" />
        <path d="M64 83 41 75 40 57l7-1 4 14 22 5Z" fill="#9c9278" />
        <path d="M42 56q-8-3-7-12l9 3 4 11Z" fill="#c5ac8e" />
        <path d="M119 78 140 91l15 21h-31l-22-25Z" fill="#9c9278" />
        <Cut d="m77 89 14-12 15 1m-28 34 12-23m20-24 7-12" color="#d1c2a0" width={1.1} />
      </g>
    );
  if (kind === 'captain')
    return (
      <g>
        {/* An outstretched order and raised blade make a broad command gesture. */}
        <path d="M137 8 115 55l-5-2 21-48Z" fill="#c2c5af" />
        <path d="m131 5 8-4-1 14-7-1Z" fill="#d8c8a1" />
        <path d="M28 112 49 79 75 66l38 3 26 43Z" fill="#24292a" />
        <path d="M47 112 62 79l22-8 27 9 14 32Z" fill="#777263" />
        <path d="M70 37q5-18 24-18 19 5 19 23l-11 25-16 5-16-14Z" fill="#aa957d" />
        <path d="M68 42q-5-25 22-31 24 0 29 28l-15-10-15-6-18 24Z" fill="#3d413c" />
        <path d="M65 23q13-18 34-13 21 3 29 21l-35-8-26 9Z" fill="#b7a16f" />
        <path d="M70 17q24-21 46 3l-18 1-22 5Z" fill="#9c5f50" />
        <path d="m77 46 10 2-7 5Zm18 3 13-4-5 7Z" fill="#343b38" />
        <path d="M58 80 25 70 10 52l-6 6 15 27 37 13Z" fill="#a49b7f" />
        <path d="m7 52 17-5 7 6-13 8Z" fill="#c4ad91" />
        <path d="M110 78 115 57l8-6 12 7-7 30Z" fill="#a49b7f" />
        <path d="m113 53-7-4 3-7 16 7 1 9Z" fill="#c4ad91" />
        <path d="M82 72 95 86l12-11-1 37H72Z" fill="#994f43" />
        <Cut d="M62 94 75 79m32 10 13-13M82 35q14-7 25 4" color="#d6c6a3" width={1.1} />
      </g>
    );
  if (kind === 'menagerie')
    return (
      <g>
        {/* A bent handler offers a gloved arm to a small, alert companion. */}
        <path d="M24 112 35 70 52 47l35-8 26 25-2 48Z" fill="#26312d" />
        <path d="M31 112 43 73l20-22 24 2 16 25-5 34Z" fill="#61715c" />
        <path d="M52 24q14-16 35-9 22 8 24 34L97 69 72 74 52 55Z" fill="#aa957d" />
        <path d="M46 51q-4-34 21-44 35-7 49 27l-11 22-8-29-21-8-18 20-7 35Z" fill="#53664f" />
        <path d="m72 40 13 5-9 4Zm18 6 12-1-7 6Z" fill="#35423b" />
        <path d="M54 68 79 80l-7 32H37Z" fill="#87927a" />
        <path d="M77 77 105 82l18-12 7 8-19 19-35-4Z" fill="#9d9b80" />
        <path d="M119 68q10-9 18 0l-2 11-10 4-9-7Z" fill="#bca98c" />
        <path d="M114 66 111 52l12 8 7-14 8 13 13 6-4 17-19 8-16-9Z" fill="#5b6553" />
        <path d="m116 66 8-5 6 4 6-5 7 9-3 9-15 5-13-8Z" fill="#9d9a78" />
        <path d="m112 52 12 8 7-14 8 15-9 8Z" fill="#35463c" />
        <path d="m130 70 5 1-3 3Z" fill="#293b34" />
        <path d="M95 81 88 100l-17 12h34l10-19Z" fill="#4c5d4c" />
        <Cut d="M47 95 58 70m-3 32 9-20m18-33 11-3m31 28 7 2" color="#cdc9aa" width={1.1} />
      </g>
    );
  return (
    <g>
      {/* A tall, hollow court silhouette echoes its raised staff and hand. */}
      <path d="M24 112 28 20h4l-2 92Z" fill="#6b615b" />
      <path d="M30 17q10-19 21 0-9 14-21 0Z" fill="#b7b9b0" />
      <path d="M34 17q10-8 16 0-7 8-16 0Z" fill="#596564" />
      <path d="M31 112 47 67l23-17 35 5 22 32 18 25Z" fill="#282934" />
      <path d="M44 112 56 77l19-13 27 6 20 42Z" fill="#625c6d" />
      <path d="M48 99 68 70l14 42H40Zm54-30 20 11 22 32h-34Z" fill="#474654" />
      <path d="M67 31q4-19 22-18 22 1 26 23l-9 29-20 10-17-19Z" fill="#aa957d" />
      <path d="M64 38 69 8 97 3l18 27-13 7-14-20-19 23Z" fill="#5d5669" />
      <path d="m69 38 18-21 14 4 13 16-12-6-13-6-17 22Z" fill="#8a7d88" />
      <path d="m75 47 11 1-7 6Zm18 2 13-5-4 7Z" fill="#32353a" />
      <path d="M75 61 87 69l14-7-4 22-9 15-12-17Z" fill="#b1b2a7" />
      <path d="M96 80 115 67l3-22 9-4 2 29-20 25Z" fill="#7f8390" />
      <path d="M119 44q-7-11-1-18l5 9 4-16 4 16 8-9q5 14-10 20Z" fill="#bdc2ba" />
      <Cut d="M34 83 46 61m64 27 11-16M73 11l21-4m-10 69 5 7 6-8" color="#c6c3b6" width={1.1} />
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
  stray: <Wolf />,
  pup: <MetalPortrait kind="pup" />,
  imp: <DemonPortrait kind="imp" />,
  spark: <ElementPortrait kind="spark" />,
  squire: <HumanPortrait kind="squire" />,
  cat: <Panther />,
  leader: <Wolf coat="#526f61" pale="#b4b59a" pack />,
  harvester: <HarvesterPortrait />,
  matron: <DemonPortrait kind="matron" />,
  molten: <ElementPortrait kind="molten" />,
  banner: <HumanPortrait kind="banner" />,
  hyena: <AnimalPortrait species="hyena" coat="#929070" pale="#c1b696" />,
  rat: <AnimalPortrait species="rat" coat="#7b7468" pale="#a7a18c" />,
  cobalt: <GuardianPortrait />,
  juggler: <DemonPortrait kind="juggler" />,
  tempest: <ElementPortrait kind="tempest" />,
  captain: <HumanPortrait kind="captain" />,
  sentinel: <SentinelPortrait />,
  hydra: <Hydra />,
  bomb: <MetalPortrait kind="bomb" />,
  watcher: <DemonPortrait kind="watcher" />,
  dancer: <ElementPortrait kind="dancer" />,
  menagerie: <HumanPortrait kind="menagerie" />,
  mother: <Bear />,
  croc: <AnimalPortrait species="croc" coat="#6f8371" pale="#a7b399" />,
  egg: <MetalPortrait kind="egg" />,
  infernal: <DemonPortrait kind="infernal" />,
  cyclone: <ElementPortrait kind="cyclone" />,
  baron: <HumanPortrait kind="baron" />,
  phoenix: <Phoenix />,
  wolf: <Wolf coat="#607362" pale="#c3c6a6" elder />,
  reaper: <MetalPortrait kind="reaper" />,
  devourer: <DemonPortrait kind="devourer" />,
  elder: <ElementPortrait kind="elder" />,
  amalgam: <Amalgam />,
  colossus: <ColossusPortrait />,
  cub: <Bear young />,
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
      palette={golden ? 'gold' : definitionId === 'phoenix' ? 'ember' : palettes[tribe]}
      variant={
        definitionId === 'phoenix'
          ? 'rays'
          : tribe === 'beast'
            ? 'hills'
            : tribe === 'demon'
              ? 'night'
              : tribe === 'mech'
                ? 'rays'
                : 'runes'
      }
    >
      {nightMarketMinionArt[definitionId] ??
        expansionMinionArt[definitionId] ??
        portraits[definitionId] ?? <HumanPortrait kind="squire" />}
      {golden && <Cut d="M12 103V91m0 12h12m112 0h12V91" color="#d8bf7b" width={1} opacity={0.8} />}
    </ArtScene>
  );
}
