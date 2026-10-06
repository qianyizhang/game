import type { ReactNode } from 'react';
import { ArtScene } from '../../../shared/art/CardArt';

const ink = '#252f2c',
  paper = '#ead8af',
  gold = '#c9a360',
  copper = '#aa7350',
  sage = '#9ca87d';
// Eight material subjects: falling purse coins, sealed debt, sharpening steel, bread,
// oath shield, polished tavern glass, stamped coupon, and a wind-caught warband banner.
const scenes: Record<string, ReactNode> = {
  'pocket-change': (
    <>
      <path
        d="M45 50Q53 42 66 47L82 74Q86 94 66 100 44 103 35 87 34 71 45 50Z"
        fill={copper}
        stroke={ink}
        strokeWidth="2"
      />
      <path d="M44 47L45 32Q59 39 67 31L66 48 55 53Z" fill={sage} stroke={ink} strokeWidth="2" />
      <path
        d="M44 49Q55 43 69 49M47 57Q38 77 45 88M64 60Q79 84 66 94"
        stroke={paper}
        strokeWidth="1"
        fill="none"
      />
      <g fill={gold} stroke={ink} strokeWidth="1.5">
        <ellipse cx="103" cy="44" rx="12" ry="7" transform="rotate(-24 103 44)" />
        <ellipse cx="119" cy="75" rx="12" ry="8" />
        <ellipse cx="94" cy="91" rx="13" ry="7" transform="rotate(13 94 91)" />
      </g>
      <path
        d="M101 21Q93 29 96 33M116 42L120 54M119 69L119 78M91 87L96 95"
        stroke={paper}
        strokeWidth="1.3"
        fill="none"
      />
    </>
  ),
  'promissory-note': (
    <>
      <path d="M44 27L105 18 119 84 56 94Z" fill={paper} stroke={ink} strokeWidth="2" />
      <path d="M105 18L108 37 123 34Z" fill={gold} stroke={ink} strokeWidth="1.5" />
      <path
        d="M57 39L96 33M60 48L102 41M63 57L101 51M67 66L88 62"
        stroke={copper}
        strokeWidth="1.5"
      />
      <path d="M75 80L70 106 83 99 90 104 90 78" fill={sage} stroke={ink} strokeWidth="1.5" />
      <circle cx="83" cy="77" r="13" fill={copper} stroke={ink} strokeWidth="2" />
      <path d="M79 70L88 82M88 70L79 82" stroke={gold} strokeWidth="2" />
    </>
  ),
  whetstone: (
    <>
      <path d="M33 76L87 63 113 82 57 99 33 90Z" fill="#697e79" stroke={ink} strokeWidth="2" />
      <path d="M33 76L57 89 113 73 87 61Z" fill="#a3b2a5" stroke={ink} strokeWidth="1.5" />
      <path d="M51 66L100 17 116 14 114 30 65 77Z" fill={paper} stroke={ink} strokeWidth="2" />
      <path d="M65 65L113 17 108 31 71 69Z" fill="#a9b5ad" />
      <path d="M45 67L71 86M49 78L33 97" stroke={gold} strokeWidth="5" />
      <path d="M78 66L88 61M83 73L98 71M75 55L77 44" stroke={gold} strokeWidth="1.5" />
    </>
  ),
  'hearth-bread': (
    <>
      <path
        d="M29 85Q30 50 60 45 73 28 98 41 129 47 132 78L121 92 44 99Z"
        fill={copper}
        stroke={ink}
        strokeWidth="2"
      />
      <path
        d="M30 79Q41 50 60 51 84 33 109 51 130 61 132 78L116 82 93 74 72 85 50 80Z"
        fill={gold}
      />
      <path
        d="M48 58Q58 62 60 74M73 47Q85 52 87 68M99 49Q111 58 113 70"
        fill="none"
        stroke={paper}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M56 34Q49 27 56 18M80 27Q73 18 81 10M108 32Q102 24 109 17"
        stroke={paper}
        strokeWidth="1"
        opacity=".6"
        fill="none"
      />
      <path d="M46 90L50 89M76 93L80 92M110 87L113 86" stroke={paper} strokeWidth="1.5" />
    </>
  ),
  'guard-oath': (
    <>
      <path
        d="M48 25Q82 37 112 24L113 58Q110 84 82 102 52 84 48 58Z"
        fill="#839581"
        stroke={ink}
        strokeWidth="2.5"
      />
      <path d="M55 34Q83 44 106 34L106 59Q104 79 82 95 58 78 55 59Z" fill={ink} />
      <path d="M62 42Q80 49 99 41L99 60Q95 76 82 87 68 77 62 60Z" fill={sage} />
      <path d="M80 45L87 45 87 69 94 64 97 70 84 81 71 69 75 64 80 69Z" fill={gold} />
      <path
        d="M39 86Q34 57 40 43M122 41Q130 69 121 88"
        stroke={paper}
        strokeWidth="1"
        fill="none"
      />
    </>
  ),
  'market-polish': (
    <>
      <path
        d="M64 15H90L93 24 90 32 93 40Q112 48 111 70L106 92Q80 105 55 91L50 70Q49 48 69 40L70 31 66 24Z"
        fill="#91b7a4"
        stroke={ink}
        strokeWidth="2"
      />
      <path d="M65 18H90V25H65Z" fill={copper} stroke={ink} strokeWidth="1.5" />
      <path d="M58 67Q79 76 106 64L103 86Q81 97 59 85Z" fill={sage} />
      <path
        d="M67 42Q56 52 58 64M73 34H86M71 82Q83 87 99 80"
        stroke={paper}
        strokeWidth="2"
        fill="none"
      />
      <path d="M27 89Q37 69 48 76L59 95 46 105Z" fill={paper} stroke={ink} strokeWidth="1.5" />
      <path d="M123 37V57M113 47H133M119 43L127 51" stroke={gold} strokeWidth="2" />
    </>
  ),
  'recruit-coupon': (
    <>
      <path
        d="M26 56L100 26 130 70 55 100 52 92Q57 86 50 80 45 77 41 82Z"
        fill={paper}
        stroke={ink}
        strokeWidth="2"
      />
      <path d="M44 54L100 33 120 67 61 92Z" stroke={copper} strokeWidth="1" fill="none" />
      <path d="M72 49L89 43 104 65 88 72Z" fill={sage} stroke={ink} strokeWidth="1.5" />
      <path d="M85 48L92 62M64 65L78 85" stroke={ink} strokeWidth="2" />
      <path d="M70 64L79 60M102 77L109 74M41 59L44 64M47 68L50 73" stroke={gold} strokeWidth="2" />
    </>
  ),
  'warband-banner': (
    <>
      <path d="M45 16L50 104" stroke={gold} strokeWidth="5" />
      <path
        d="M49 25Q78 13 98 29 118 38 137 23L125 51 135 76Q111 89 90 72 71 59 51 71Z"
        fill={copper}
        stroke={ink}
        strokeWidth="2"
      />
      <path
        d="M55 31Q76 25 91 35 112 48 128 40M56 64Q74 53 93 66 109 78 128 71"
        fill="none"
        stroke={gold}
        strokeWidth="2"
      />
      <path d="M77 40L87 43 96 62 86 59Z" fill={paper} />
      <path d="M83 39L92 35 101 54 92 59Z" fill={sage} />
      <path d="M36 17L45 8 52 17 44 24Z" fill={paper} stroke={ink} strokeWidth="1.5" />
    </>
  ),
};
export function TavernSpellArt({ id, className }: { id: string; className?: string }) {
  return (
    <ArtScene palette="moss" variant="runes" className={className}>
      {scenes[id] ?? scenes['promissory-note']}
    </ArtScene>
  );
}
