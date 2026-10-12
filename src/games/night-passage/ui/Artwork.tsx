import type { ReactNode } from 'react';
import { GODS } from '../domain/content';
import type { GodId, Reward, RuneId, WeaponId } from '../domain/types';

const ink = '#10232c',
  ivory = '#f0dec0',
  brass = '#c99e66',
  jade = '#9bc9b3';
const edge = { stroke: ink, strokeWidth: 2, strokeLinejoin: 'round' as const };
function Etch({ d }: { d: string }) {
  return <path d={d} fill="none" stroke={ivory} strokeWidth="1.5" strokeLinecap="round" />;
}
function Symbol({ id, children, partner }: { id: string; children: ReactNode; partner?: GodId }) {
  return (
    <svg
      className="np-art"
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      data-np-art={id}
      data-np-partner={partner}
    >
      <path d="M32 2 53 12 61 34 48 56 24 62 5 45 3 22 15 7Z" fill="#1a3039" />
      <path d="M9 22 18 11 31 7M53 39 45 52 31 56" stroke="#526d70" strokeWidth="1" fill="none" />
      {children}
    </svg>
  );
}
const patrons: Record<GodId, ReactNode> = {
  storm: (
    <>
      <path d="M34 6 15 34H30L25 57 51 25H36L45 6Z" fill="currentColor" {...edge} />
      <Etch d="M32 15 23 29H35L32 43" />
      <path d="m12 15 3 5M49 45l4 4" stroke={brass} strokeWidth="2" />
    </>
  ),
  tide: (
    <>
      <path
        d="M9 40C10 21 28 10 42 17C55 23 47 37 37 32C46 32 44 22 37 24C28 26 32 41 48 40L55 39C48 58 14 58 9 40Z"
        fill="currentColor"
        {...edge}
      />
      <path
        d="M12 40C22 43 25 37 26 31C28 43 39 48 51 42"
        fill="none"
        stroke={ink}
        strokeWidth="3"
      />
      <Etch d="M16 32Q21 20 34 19M22 48Q29 51 36 50" />
    </>
  ),
  cinder: (
    <>
      <path
        d="M36 6C42 23 22 22 39 35L45 23C61 43 44 59 29 56C11 53 9 37 21 22L23 34C34 30 22 17 36 6Z"
        fill="currentColor"
        {...edge}
      />
      <path d="M32 34C41 41 41 50 32 53C23 50 22 43 32 34Z" fill={ivory} />
      <Etch d="M17 40Q15 46 22 50" />
    </>
  ),
  winter: (
    <>
      <path d="m31 5 19 29-16 24L14 32Z" fill="currentColor" {...edge} />
      <path d="m31 5 2 30 17-1M14 32l19 3 1 23" fill="none" stroke={ink} strokeWidth="2" />
      <path d="m31 11-10 20 10 1Z" fill={ivory} />
      <path d="m51 12 3 6m-46 23 3 4" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  veil: (
    <>
      <path d="M6 32C18 12 42 10 58 31C45 52 21 52 6 32Z" fill="currentColor" {...edge} />
      <path d="M12 32C26 22 39 23 51 32C40 43 25 43 12 32Z" fill={ink} />
      <path d="M32 21C40 26 40 37 32 44C26 38 26 27 32 21Z" fill={ivory} />
      <path d="M32 26V37" stroke={ink} strokeWidth="3" />
      <Etch d="M17 24Q23 17 33 17" />
    </>
  ),
};
export function PatronArt({ god, partner }: { god: GodId; partner?: GodId }) {
  const mark = (id: GodId) => <g color={GODS.find((g) => g.id === id)!.color}>{patrons[id]}</g>;
  return (
    <Symbol id={`patron:${god}`} partner={partner}>
      {partner ? (
        <>
          <g transform="translate(0 5) scale(.65)">{mark(god)}</g>
          <circle cx="43" cy="41" r="19" fill={ink} />
          <g transform="translate(22 20) scale(.65)">{mark(partner)}</g>
        </>
      ) : (
        mark(god)
      )}
    </Symbol>
  );
}
const runes: Record<RuneId, ReactNode> = {
  vigor: (
    <>
      <path
        d="M30 29C14 28 11 18 12 10C26 10 33 17 32 27C35 13 45 12 53 13C52 26 43 29 34 29V40L46 53 33 47 30 58 25 44 13 50 27 35Z"
        fill={jade}
        {...edge}
      />
      <Etch d="M18 15 30 27M46 18 34 27" />
    </>
  ),
  fleet: (
    <>
      <path d="M15 49C10 32 22 12 52 8C53 28 38 42 20 46L12 56" fill={ivory} {...edge} />
      <path
        d="m17 48 26-29M22 40l-2-11m9 4-2-12m7 5 10-1m-21 13 12-1"
        fill="none"
        stroke={brass}
        strokeWidth="2"
      />
    </>
  ),
  focus: (
    <>
      <path d="M10 34V48C19 57 46 57 54 48V34Z" fill={brass} {...edge} />
      <ellipse cx="32" cy="34" rx="22" ry="9" fill={jade} {...edge} />
      <ellipse cx="32" cy="34" rx="14" ry="4" fill={ink} />
      <path d="M23 13H41V29Q31 37 23 29Z" fill={ivory} {...edge} />
      <path
        d="M27 13V7H37V13M18 40V49M33 43V53M46 40V50"
        fill="none"
        stroke={ink}
        strokeWidth="2"
      />
    </>
  ),
  fury: (
    <>
      <path d="M9 52C24 45 37 29 49 9L45 30 54 25 44 39 34 38 28 50 20 48Z" fill={jade} {...edge} />
      <path d="m20 43-8-13 14 5m7-8-2-15 10 8" fill={ivory} {...edge} />
      <Etch d="M17 48Q35 38 46 20" />
    </>
  ),
  echo: (
    <>
      <path d="M7 8 43 25 56 49 43 56 21 43Z" fill={brass} {...edge} />
      <path d="m13 12 20 21m-20-7 14 14m1-28 14 21" stroke={ivory} strokeWidth="2" />
      <circle cx="41" cy="42" r="12" fill={ivory} {...edge} />
      <path d="m37 35 10 6-9 8Z" fill={brass} />
    </>
  ),
  mercy: (
    <>
      <path
        d="M30 30C23 17 8 11 8 23C7 39 19 40 26 39C11 45 19 59 30 44L34 44C44 58 54 45 39 39C50 40 57 30 54 18C50 9 37 21 34 30Z"
        fill={ivory}
        {...edge}
      />
      <path d="M18 25 27 34 17 33M46 25 37 34 47 33" fill={brass} />
      <path
        d="M30 24H34L36 40 32 51 28 40ZM30 25l-5-9m9 9 5-9"
        fill={jade}
        stroke={ink}
        strokeWidth="2"
      />
    </>
  ),
};
export function RuneArt({ id }: { id: RuneId }) {
  return <Symbol id={`rune:${id}`}>{runes[id]}</Symbol>;
}
const weapons: Record<WeaponId, ReactNode> = {
  sword: (
    <>
      <path d="m45 6 10 3-4 13-25 25-8-8Z" fill={ivory} {...edge} />
      <path d="m47 12-24 28" stroke={brass} strokeWidth="2" />
      <path d="m13 34 18 18 4-6-16-16ZM10 45l9 9 8-9-9-9Z" fill={brass} {...edge} />
    </>
  ),
  spear: (
    <>
      <path d="m11 55 4 3 30-39-4-3Z" fill={brass} {...edge} />
      <path d="M52 5 51 27 37 31 34 18Z" fill={ivory} {...edge} />
      <path d="m49 10-9 16" stroke={brass} strokeWidth="2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 11Q32 19 52 11L50 37Q46 49 32 58Q17 50 13 37Z" fill={brass} {...edge} />
      <path d="M19 21Q32 26 45 21L43 37 32 49 21 37Z" fill={jade} {...edge} />
      <path d="m32 27 7 9-7 9-7-9Z" fill={ivory} {...edge} />
    </>
  ),
  bow: (
    <>
      <path d="M13 9C58 7 56 50 14 55L18 48C43 46 46 18 17 17Z" fill={brass} {...edge} />
      <path d="m15 12 5 40M10 33h41m-8-6 9 6-9 6" fill="none" stroke={ivory} strokeWidth="2" />
    </>
  ),
  fists: (
    <>
      <path d="m12 33 2-18 8-3 4 3 6-5 7 3 1 7 7-3 6 5-2 18-12 14-21-3Z" fill={brass} {...edge} />
      <path
        d="m22 16-2 14 9 3 4-17m8 8-3 13 9-4M13 34l11-7 10 9-6 8m-10 5 20 3"
        fill="none"
        stroke={ink}
        strokeWidth="2"
      />
      <Etch d="m17 20-1 7m21-8-1 7m11 0-1 4" />
    </>
  ),
};
export function WeaponArt({ id }: { id: WeaponId }) {
  return <Symbol id={`weapon:${id}`}>{weapons[id]}</Symbol>;
}
export const REWARD_ART_LABELS: Record<Reward, string> = {
  boon: 'Divine audience',
  coin: 'Ferryman’s cache',
  heart: 'Living ember',
  upgrade: 'Memory shrine',
  fountain: 'Quiet spring',
  shop: 'Wandering market',
  trial: 'Oath of danger',
};
const rewards: Record<Reward, ReactNode> = {
  boon: (
    <>
      <path d="M23 18H41L45 47 32 55 19 47Z" fill={brass} {...edge} />
      <path d="M27 24H37L39 43 32 47 25 43Z" fill={ivory} />
      <path
        d="M27 18V10Q32 5 37 10V18M10 20l6 5m32 0 6-5M32 2V5"
        fill="none"
        stroke={ivory}
        strokeWidth="2"
      />
    </>
  ),
  coin: (
    <>
      <ellipse cx="30" cy="44" rx="21" ry="10" fill={brass} {...edge} />
      <path d="M9 35V43C15 54 48 54 51 43V35" fill={brass} {...edge} />
      <ellipse cx="30" cy="35" rx="21" ry="10" fill={ivory} {...edge} />
      <circle cx="36" cy="23" r="15" fill={brass} {...edge} />
      <path d="m36 13 6 10-6 10-6-10Z" fill={ivory} {...edge} />
    </>
  ),
  heart: (
    <>
      <path
        d="M32 54C22 42 9 39 9 25C9 10 26 9 32 21C39 8 55 13 55 25C55 39 42 47 32 54Z"
        fill="#dc927e"
        {...edge}
      />
      <path d="M33 24C44 38 38 44 32 47C23 41 25 34 33 24Z" fill={ivory} />
      <Etch d="M15 26Q14 19 22 18" />
    </>
  ),
  upgrade: (
    <>
      <path
        d="M10 50H54V56H10ZM17 45V21H24V45M40 45V21H47V45M12 20 32 7 52 20Z"
        fill={brass}
        {...edge}
      />
      <path d="M28 43H36V33H43L32 23 21 33H28Z" fill={ivory} {...edge} />
    </>
  ),
  fountain: (
    <>
      <path d="M10 36H54L45 47H35V52H44V57H20V52H29V47H19Z" fill={brass} {...edge} />
      <path d="M33 6C32 19 44 21 42 29C40 39 22 39 22 29C22 20 31 17 33 6Z" fill={jade} {...edge} />
      <Etch d="M27 29Q27 33 33 33" />
    </>
  ),
  shop: (
    <>
      <path d="M14 27H50V53H14Z" fill={brass} {...edge} />
      <path d="m19 10-11 20q5 8 12 0 6 8 12 0 6 8 12 0 7 8 12 0L45 10Z" fill={ivory} {...edge} />
      <path d="M27 10 23 30M37 10l4 20M22 40H42V53H22Z" fill={jade} stroke={ink} strokeWidth="2" />
    </>
  ),
  trial: (
    <>
      <path d="m14 8 12 6 22 33-7 5-24-31ZM50 8 38 14 16 47l7 5 24-31Z" fill={ivory} {...edge} />
      <path d="m10 42 17 13M37 55l17-13" stroke={brass} strokeWidth="5" />
      <path d="m32 9 4 5-4 5-4-5Z" fill="#dc927e" />
    </>
  ),
};
export function RewardArt({ kind }: { kind: Reward }) {
  return <Symbol id={`reward:${kind}`}>{rewards[kind]}</Symbol>;
}
