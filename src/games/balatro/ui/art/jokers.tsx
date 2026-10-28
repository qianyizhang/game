import type { ReactNode } from 'react';
import { ArtGlyph } from '../../../../shared/art/CardArt';
import { ArtScene } from '../../../../shared/art/CardArt';
import { expansionJokerArt } from '../ExpansionArtwork';
import { nightMarketJokerArt } from '../NightMarketArtwork';
import {
  ink,
  paper,
  coral,
  gold,
  PrintGround,
  SuitPip,
  MiniCard,
  Coin,
  Portrait,
  Waves,
  Umbrella,
  Nest,
  Book,
} from './primitives';
export function JokerMotif({ id }: { id: string }): ReactNode {
  switch (id) {
    case 'spark':
      return (
        <g strokeWidth="1.35">
          <path d="M22 88q32-9 62-5 26 4 54-2" fill="none" stroke={gold} />
          <path d="M92 74 118 51l9 7-21 27-21 3Z" fill={ink} stroke="none" />
          <path d="m101 76 18-19m-15 24 16-20" fill="none" stroke={gold} opacity=".8" />
          <path d="M39 84 73 58l8 10-30 23Z" fill={gold} />
          <path d="m48 82 21-18m-16 21 19-16" fill="none" stroke={paper} strokeWidth="1" />
          <path d="M75 60 82 52l9 8-10 8Z" fill={paper} />
          <path
            d="M88 50q-8-12-4-27l8 10q4-15 18-20-4 13 0 20 12-8 22-5-7 13-22 18 9 7 8 17-13 0-23-9-4 11-14 14-3-11 7-18Z"
            fill={coral}
            strokeWidth="1.6"
          />
          <path d="M93 45q5-7 5-15m5 18q10-4 15-11" fill="none" stroke={paper} />
          <path d="m71 35-6-6m52-18 3-7m14 49 7 2M58 51l-8-2" fill="none" stroke={gold} />
        </g>
      );
    case 'granite':
      return (
        <g strokeWidth="1.4">
          <path d="M23 83q19-4 31-1 37 9 82-3l-4 13H29Z" fill={ink} stroke="none" />
          <path d="M30 83q22-5 42 2m20 1q23-1 41-6" fill="none" stroke={gold} />
          <path d="M43 78 48 42 71 20 109 29 124 69 104 84 72 78Z" fill={gold} />
          <path d="M48 42 71 20l38 9-31 24Z" fill={paper} opacity=".55" stroke="none" />
          <path d="M78 53 109 29l15 40-20 15-32-6Z" fill={ink} opacity=".38" stroke="none" />
          <path d="M48 42 78 53l31-24M78 53l-6 25m6-25 26 31M43 78l29 0m32 6 20-15" fill="none" />
          <path
            d="m59 35 12-11m-18 25-4 23m41-30 13-10M82 60l-5 13m25-4 8 8"
            fill="none"
            stroke={paper}
            strokeWidth="1"
          />
          <path d="m27 69 10-6m93 8 9-5M31 94h31m53-1h17" fill="none" stroke={gold} />
        </g>
      );
    case 'duet':
      return (
        <g strokeWidth="1.35">
          <path d="M22 83q37-9 61-5 25 5 57-6" fill="none" stroke={ink} strokeWidth="3" />
          <path d="m41 79-11-12m11 12-5 10m77-12 11-13m-11 13 4 9" fill="none" stroke={gold} />
          <path
            d="M34 73q3-13 1-25 4-15 16-16 14-2 20 18l14 9-12 5q-3 12-16 13l-8-2-25 14Z"
            fill={ink}
          />
          <path d="M42 55q8-13 19-6 9 6 2 18l-11 5-10-7Z" fill={coral} stroke="none" />
          <path d="m45 57 9 10m-5-13 10 10M35 75 26 85m26-49q8 4 10 13" fill="none" stroke={gold} />
          <circle cx="66" cy="48" r="1.7" fill={paper} stroke="none" />
          <path d="m54 75-2 6m11-6 1 6" fill="none" />
          <path
            d="M127 73q-4-13-1-25-3-17-16-19-15-2-22 17l-14 7 12 6q2 14 16 17l9-2 25 14Z"
            fill={gold}
          />
          <path d="M118 54q-7-13-19-8-10 7-5 19l11 7 11-6Z" fill={paper} stroke="none" />
          <path
            d="m116 57-10 10m6-14-12 10m26 12 9 10m-34-50q-9 3-12 12"
            fill="none"
            stroke={ink}
          />
          <circle cx="92" cy="42" r="1.7" fill={ink} stroke="none" />
          <path d="m105 74 1 7m9-8-2 8" fill="none" />
          <path
            d="M75 29v11q-8-2-8 3 0 5 7 3 4-1 4-6V25l12 3v10q-8-2-8 3 0 5 7 3 4-1 4-6V25Z"
            fill={coral}
            stroke="none"
          />
        </g>
      );
    case 'twins':
      return (
        <g strokeWidth="1.25">
          <path d="M19 77q61 24 122-2v15q-61 15-122 0Z" fill={ink} stroke="none" />
          <path d="M24 82q57 20 112-2" fill="none" stroke={gold} />
          <path
            d="M37 64q-7-20 9-32 12-8 25-1 12-8 25-2 14-8 26 2 12 11 5 29l-17 16-57 2Z"
            fill={gold}
            stroke="none"
          />
          <MiniCard x={27} y={30} suit="hearts" angle={-18} value="2" />
          <MiniCard x={54} y={35} suit="hearts" angle={-6} value="2" />
          <MiniCard x={80} y={35} suit="spades" angle={6} value="A" />
          <MiniCard x={107} y={30} suit="spades" angle={18} value="A" />
          <path d="M31 78q28 7 51 7 25 0 48-8" fill="none" stroke={paper} opacity=".8" />
          <path d="m46 23 7-6m19 4 3-8m25 8 4-8m17 15 7-6" fill="none" stroke={gold} />
        </g>
      );
    case 'trio':
      return (
        <g strokeWidth="1.3">
          <path d="M26 82q54 9 108-4l-8 12q-46 8-93-1Z" fill={ink} stroke="none" />
          <path d="M31 83q48 8 99-4" fill="none" stroke={gold} />
          <path
            d="M35 38h25v18q-2 17-13 18-11-1-12-18Zm32-10h26v25q-1 20-13 21-13-1-13-21Zm33 10h25v18q-1 17-12 18-11-1-13-18Z"
            fill={paper}
          />
          <path
            d="M38 51h19v7q-1 11-10 13-8-2-9-13Zm32-11h20v15q-2 16-10 16-9 0-10-16Zm33 11h19v7q-1 11-9 13-9-2-10-13Z"
            fill={coral}
            stroke="none"
          />
          <path d="m47 74-1 9m34-9v9m33-9 1 9M39 83h15m18 0h16m18 0h15" fill="none" />
          <path d="M39 45h17m15-9h18m15 9h17" fill="none" stroke={gold} />
          <path d="m42 23-7-6m45 0V9m42 14 7-6" fill="none" stroke={gold} />
        </g>
      );
    case 'stair':
      return (
        <g strokeWidth="1.3">
          <path d="M22 88V77h20V66h19V55h19V44h18V33h17V19h23v69Z" fill={ink} />
          <path d="M25 85V79h20V68h19V57h19V46h18V35h17V22h17v63Z" fill={gold} />
          <path
            d="M32 85v-6m19 6V68m19 17V57m19 28V46m18 39V35m17 50V22"
            fill="none"
            stroke={ink}
            opacity=".55"
          />
          <path d="M117 20V13q0-8 10-8t10 8v8m-19 1h19v24h-19Z" fill={paper} />
          <path d="M121 19v-6q0-5 7-5t7 5v6m-12 9h9v13h-9Z" fill={coral} />
          <path
            d="M20 93h121M34 73l9-7m9-4 9-7m9-4 9-7m10-4 8-8m10-4 8-8"
            fill="none"
            stroke={gold}
          />
        </g>
      );
    case 'river':
      return (
        <g>
          <path d="M24 68Q61 50 73 26H99Q81 54 131 84H90Q66 67 50 89" fill={gold} />
          <Waves y={65} />
          <path d="m36 41 10-9 11 9m52 3 13-8 11 8" fill="none" />
        </g>
      );
    case 'house':
      return (
        <g>
          <path d="M41 51 80 21 119 51M50 45V89H111V45" fill={paper} />
          <path d="M68 89V56h24v33M55 50h10v13H55m42-13h10v13H97" fill={gold} />
          <path d="M76 89V60l16-4v33" fill={coral} />
          <MiniCard x={29} y={68} suit="hearts" angle={-15} />
          <MiniCard x={114} y={65} angle={12} />
        </g>
      );
    case 'crown':
      return (
        <g>
          <path d="M45 77 36 31 60 49 80 20 100 49 124 31 115 77Z" fill={gold} />
          <path d="M45 77h70v12H45Z" fill={coral} />
          <path d="M58 64h44M52 83h57" stroke={paper} />
          <g color={ink}>
            <SuitPip suit="spades" x={73} y={44} size={16} />
          </g>
          {[36, 80, 124].map((x, i) => (
            <circle key={x} cx={x} cy={i === 1 ? 17 : 28} r="4" fill={paper} />
          ))}
        </g>
      );
    case 'constellation':
      return (
        <g>
          <path d="m40 77 25-45 26 17 31-25-18 59-64-6" fill="none" stroke={gold} />
          {[
            [40, 77],
            [65, 32],
            [91, 49],
            [122, 24],
            [104, 83],
          ].map(([x, y], i) => (
            <ArtGlyph
              key={x}
              kind="star"
              x={x - 8}
              y={y - 8}
              size={i === 2 ? 24 : 16}
              color={coral}
              accent={paper}
            />
          ))}
          <path d="M27 35h4m101 46h4M78 90h4" stroke={paper} />
        </g>
      );
    case 'hearts':
      return (
        <g>
          <path d="M77 88V53M77 70 52 57M77 78 104 56" strokeWidth="5" />
          <g color={coral}>
            <SuitPip suit="hearts" x={56} y={16} size={44} />
          </g>
          <ArtGlyph kind="leaf" x={31} y={41} size={34} color={ink} accent={gold} />
          <ArtGlyph kind="leaf" x={89} y={40} size={35} color={ink} accent={gold} />
        </g>
      );
    case 'diamonds':
      return (
        <g>
          <path d="m80 20 29 54H51Z" fill={paper} />
          <path
            d="m23 54 43 4m27 0 39-17m-39 17 39 2m-39-2 39 18"
            fill="none"
            stroke={coral}
            strokeWidth="3"
          />
          <g color={gold}>
            <SuitPip suit="diamonds" x={70} y={41} size={20} />
          </g>
          <path d="m132 37 5 1m-5 22h6m-6 22 5-1" />
        </g>
      );
    case 'clubs':
      return (
        <g>
          <g color={ink}>
            <SuitPip suit="clubs" x={54} y={19} size={60} />
          </g>
          <path d="M47 91q33-17 67 0m-66-5q12-26-4-45m64 45q-9-16 6-36" fill="none" />
          <ArtGlyph kind="leaf" x={28} y={40} size={24} color={gold} />
          <ArtGlyph kind="leaf" x={105} y={54} size={22} color={coral} />
        </g>
      );
    case 'spades':
      return (
        <g>
          <path d="M22 88 49 61 69 77 99 42 136 88Z" fill={ink} />
          <ArtGlyph kind="moon" x={31} y={18} size={35} color={gold} accent={paper} />
          <g color={paper}>
            <SuitPip suit="spades" x={79} y={37} size={30} />
          </g>
          <path d="m115 22 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" fill={coral} />
        </g>
      );
    case 'portrait':
      return (
        <g strokeWidth="1.1">
          <ellipse cx="80" cy="56" rx="34" ry="44" fill={gold} />
          <ellipse cx="80" cy="56" rx="29" ry="39" fill={ink} />
          <Portrait />
          <path
            d="M51 29L55 31M48 40L53 41M47 53H51M48 65L53 64M52 79L56 77M108 32L104 34M111 45H107M111 58H107M108 74L104 72"
            fill="none"
            stroke={paper}
            strokeWidth=".75"
          />
          <path d="M75 95H85M77 99H83" fill="none" />
        </g>
      );
    case 'even':
      return (
        <g>
          <path d="M41 78Q80 101 119 78L108 68H50Z" fill={coral} />
          <path d="M80 19v50M40 47h80M80 20 49 49h31Z" fill={paper} />
          <path d="m84 27 23 22H84Z" fill={gold} />
          <Waves y={94} />
        </g>
      );
    case 'odd':
      return (
        <g>
          <path d="M44 86h76M54 47v38m53-38v38" />
          <path d="M45 48V23h19v25Zm22 0V16h23v32Zm27 0V27h22v21Z" fill={paper} />
          <circle cx="54" cy="35" r="4" fill={coral} />
          <circle cx="78" cy="31" r="6" fill={gold} />
          <path d="m101 33 8 8m0-8-8 8" />
          <path d="m35 67 10-4m81 0 8 4" />
        </g>
      );
    case 'fibonacci':
      return (
        <g>
          <path
            d="M103 79Q52 102 42 61Q30 24 71 18Q111 11 118 48Q125 81 92 85Q63 89 62 64Q61 42 82 42Q99 42 99 58Q99 71 87 69Q78 69 80 61"
            fill={gold}
          />
          <path
            d="M40 55 68 58m-3-36 8 22m35-21-18 24m28 9-21 7M93 85l-6-15M66 79l12-14"
            fill="none"
          />
          <path d="m49 87-13 7" />
        </g>
      );
    case 'ace':
      return (
        <g>
          <MiniCard x={66} y={33} value="A" />
          <path
            d="M80 11v13m-20-2-7-8m47 8 7-8M49 46H35m90 0h-14M80 78v18m-20-13-8 9m48-9 8 9"
            stroke={gold}
            strokeWidth="3"
          />
          <path d="M53 31 64 26m34 0 10 5" />
        </g>
      );
    case 'low':
      return (
        <g>
          <path d="M36 84H129" />
          <path d="M55 84V52m28 32V39m27 45V56" fill="none" />
          <ArtGlyph kind="seed" x={32} y={31} size={35} color={ink} accent={gold} />
          <ArtGlyph kind="leaf" x={67} y={16} size={34} color={ink} accent={coral} />
          <ArtGlyph kind="star" x={94} y={39} size={29} color={gold} accent={coral} />
          <path d="m41 88-3 5m35-5v5m33-5 3 5" />
        </g>
      );
    case 'solo':
      return (
        <g transform="rotate(28 80 56)" strokeWidth="1.1">
          <path
            d="M71 33C60 29 51 36 52 45C53 51 64 51 62 58C61 64 47 68 49 80C52 97 72 98 79 89C86 98 106 94 108 80C110 68 96 64 95 58C93 51 104 51 105 45C107 36 98 29 87 33Z"
            fill={coral}
          />
          <path d="M74 12H84L87 64H71Z" fill={ink} />
          <path d="M74 13C69 14 67 10 68 7C70 3 76 3 78 6L84 8V15Z" fill={gold} />
          <path
            d="M55 43C57 36 65 34 70 38M89 38C96 35 101 39 102 44M55 75C53 83 59 91 69 91M89 91C100 88 103 81 100 76"
            fill="none"
            stroke={paper}
            strokeWidth="1"
          />
          <path
            d="M64 53C57 56 64 62 60 67M94 53C101 56 94 62 98 67"
            fill="none"
            stroke={ink}
            strokeWidth="2.3"
          />
          <path d="M73 67H86V70H73ZM75 77L79 89L83 77Z" fill={gold} />
          <path d="M77 12V79M80 12V79M83 12V79" fill="none" stroke={paper} strokeWidth=".55" />
          <path d="M117 17L110 94M120 17L113 94" stroke={ink} strokeWidth="1.2" />
        </g>
      );
    case 'minimal':
      return (
        <g>
          <path d="M48 89H114M80 89V38M68 89l12-13 12 13" />
          <path d="M80 38q-27 3-27-22q30-7 27 22q0-34 24-27q4 23-24 27" fill={ink} />
          <path d="m33 40 5 5m88-20-5 5" stroke={coral} />
          <circle cx="117" cy="67" r="4" fill={gold} stroke="none" />
        </g>
      );
    case 'banquet':
      return (
        <g strokeWidth="1.2">
          <path d="M24 82H136V88H24Z" fill={ink} />
          <ellipse cx="80" cy="72" rx="43" ry="9" fill={gold} />
          <path d="M43 69C45 48 59 33 80 33C101 33 115 48 117 69Z" fill={coral} />
          <path d="M80 33V28M75 27C75 20 85 20 85 27Z" fill={gold} />
          <path
            d="M49 66C51 53 61 42 70 40M54 67C56 54 64 46 71 44M103 55L109 65M99 53L105 64M44 74H116"
            fill="none"
            stroke={paper}
            strokeWidth=".85"
          />
          <path d="M29 36V73M23 31V44H35V31M29 31V44M132 32C124 42 125 49 132 51V73" fill="none" />
        </g>
      );
    case 'rainy':
      return <Umbrella />;
    case 'last':
      return (
        <g>
          <path d="M40 27H105L122 44V81H40Z" fill={paper} />
          <path d="M105 27v17h17M51 39h34m-34 12h28m-28 12h21m-21 8h16" fill="none" />
          <path d="M94 42v22" stroke={coral} strokeWidth="7" />
          <circle cx="94" cy="73" r="4" fill={coral} stroke="none" />
          <path d="M34 90h94" />
        </g>
      );
    case 'bankroll':
      return <Nest />;
    case 'purse':
      return (
        <g>
          <path d="M53 40Q35 69 43 84Q78 108 117 84Q125 69 107 40Z" fill={coral} />
          <path d="M53 40 65 31 59 18h40l-5 13 13 9Z" fill={paper} />
          <path d="M61 42q18 5 41 0M65 55q-12 19-8 25m43-27q13 20 7 30" fill="none" />
          <Coin x={80} y={71} size={14} />
        </g>
      );
    case 'scholar':
      return <Book />;
    case 'collector':
      return (
        <g>
          <path d="M40 26h80v65H40Z" fill={gold} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x="46" y={31 + i * 19} width="68" height="14" rx="2" fill={paper} />
              <path d={`M72 ${38 + i * 19}h14`} />
            </g>
          ))}
          <MiniCard x={107} y={56} suit="hearts" angle={14} />
          <path d="M45 95h70" />
        </g>
      );
    case 'sculptor':
      return (
        <g strokeWidth=".85" strokeLinecap="round" strokeLinejoin="round">
          <path d="M38 84H103V92H38ZM43 92H99V97H43Z" fill={ink} />
          <path
            d="M43 84L45 73Q48 65 60 62L66 55L66 47Q54 41 55 29Q54 15 68 12Q82 8 88 20L90 29L96 38L90 40L89 45L85 50L77 50V58Q82 65 94 69L98 84Z"
            fill={paper}
          />
          <path
            d="M65 48L67 59L58 68L59 81L48 82L49 73Q56 69 63 64L71 58L72 48Z"
            fill={gold}
            stroke="none"
            opacity=".65"
          />
          <path
            d="M77 51L77 59L85 66L80 75L94 81L94 72Q83 67 74 60L73 50Z"
            fill={gold}
            stroke="none"
            opacity=".45"
          />
          <path
            d="M57 36Q49 23 59 14Q68 6 79 12L86 18L83 25Q77 22 73 26L70 34L65 33L65 43L61 42Z"
            fill={gold}
          />
          <path
            d="M58 23Q56 17 63 15M60 29Q56 25 62 22M64 18Q64 12 70 13M68 22Q65 17 71 17M73 15Q76 11 80 17M76 23Q73 18 78 19M62 32Q65 29 68 32M61 36Q58 31 62 30"
            fill="none"
            stroke={paper}
            strokeWidth=".9"
          />
          <path
            d="M76 30Q80 28 85 30M78 32L83 32M85 32L86 38L89 39M82 43H88M79 47H85M64 34Q68 31 68 37L65 40M54 74L62 69L66 78M72 65L76 73L70 81M81 77L86 83"
            fill="none"
          />
          <path d="M105 82L117 44L121 46L111 84Z" fill={gold} />
          <path d="M114 42L121 25L125 26L120 45Z" fill={ink} />
          <path d="M100 25L103 17L133 25L131 34Z" fill={coral} />
          <path
            d="M105 20L104 25L128 31M105 85L110 87M120 91L126 89M30 75L34 78M98 56L100 61"
            fill="none"
            stroke={gold}
          />
        </g>
      );
    case 'runner':
      return (
        <g strokeWidth="1.2">
          <path
            d="M42 57L54 48L77 58L90 62C107 63 123 65 127 73L128 80C112 90 93 88 74 82L41 77Z"
            fill={coral}
          />
          <path
            d="M42 72C63 70 78 79 97 80C110 81 118 77 127 74L128 80C109 91 91 87 73 83L40 79Z"
            fill={paper}
          />
          <path d="M56 59L66 57M64 63L75 61M73 67L84 65" stroke={paper} strokeWidth="2" />
          <path
            d="M44 57C39 44 42 35 54 30C70 24 82 17 91 13C85 29 81 39 65 43C75 42 89 39 103 33C100 44 89 52 66 53C77 54 87 51 96 48C90 62 74 63 59 58Z"
            fill={ink}
          />
          <path
            d="M49 50C59 38 72 34 83 22M53 48C68 41 77 39 91 39M57 52C69 49 80 48 85 46"
            fill="none"
            stroke={paper}
            strokeWidth=".9"
          />
          <path d="M37 88H115M26 94H95M24 59H34M28 68H35" fill="none" stroke={gold} />
          <path d="M53 82V85M66 85V88M81 88V91M99 90V93M114 86V89" />
        </g>
      );
    case 'vine':
      return (
        <g>
          <path d="M66 94q43-23 16-43Q57 28 91 14M52 89h51" fill="none" strokeWidth="3" />
          <ArtGlyph kind="leaf" x={77} y={12} size={31} color={ink} accent={gold} />
          <ArtGlyph kind="leaf" x={47} y={34} size={33} color={ink} accent={coral} />
          <ArtGlyph kind="leaf" x={83} y={55} size={30} color={ink} accent={gold} />
          <path d="M38 26h5m78 52h5" />
        </g>
      );
    case 'paircraft':
      return (
        <g strokeWidth="1.1">
          <ellipse cx="57" cy="59" rx="26" ry="34" fill={ink} />
          <ellipse cx="103" cy="48" rx="26" ry="34" fill={coral} />
          <g transform="translate(36 31) scale(.74)">
            <Portrait x={0} y={0} />
          </g>
          <g transform="translate(122 20) scale(-.74 .74)">
            <Portrait x={0} y={0} />
          </g>
          <path
            d="M29 59C29 37 41 23 57 23M103 12C118 12 131 27 131 48M57 95C67 95 73 89 77 83M82 25C87 17 93 12 103 12"
            fill="none"
            stroke={gold}
          />
          <path d="M69 18L81 12L88 17M72 98L82 101L91 93" fill="none" stroke={gold} />
        </g>
      );
    case 'tidal':
      return (
        <g>
          <path d="M30 81Q52 22 83 34Q112 42 90 60Q69 71 72 52Q64 74 132 82Z" fill={ink} />
          <path d="M32 81Q57 46 73 42q26-9 27 9M51 82q13-10 29-2" fill="none" stroke={paper} />
          <Waves y={88} />
          <ArtGlyph kind="moon" x={112} y={13} size={25} color={gold} />
        </g>
      );
    case 'toll':
      return (
        <g>
          <path d="M49 86V43H112V86ZM43 43l10-23h55l12 23Z" fill={paper} />
          <path
            d="M48 43h68M60 25l-5 18m17-18-2 18m15-18 2 18m14-18 6 18"
            stroke={coral}
            strokeWidth="4"
          />
          <path d="M48 62h65M73 62v24" />
          <Coin x={84} y={51} size={9} />
          <path d="M36 89h92" />
        </g>
      );
    case 'dividend':
      return (
        <g>
          <path d="M34 88V33h91v55Z" fill={paper} />
          <path
            d="M43 74 64 59 82 67 114 39m-10 1 10-1-1 10"
            fill="none"
            stroke={coral}
            strokeWidth="3"
          />
          <path d="M43 42v38h70" opacity=".4" />
          <Coin x={117} y={78} size={15} />
          <Coin x={130} y={58} size={10} />
        </g>
      );
    case 'reserve':
      return (
        <g strokeWidth="1.1">
          <path
            d="M73 68C53 72 34 59 27 33C36 41 48 45 64 43C45 42 34 31 34 20C51 30 67 33 76 49ZM87 68C107 72 126 59 133 33C124 41 112 45 96 43C115 42 126 31 126 20C109 30 93 33 84 49Z"
            fill={ink}
          />
          <path
            d="M38 29C48 40 65 38 73 52M36 43C43 53 58 53 69 58M40 54C48 62 59 63 67 64M122 29C112 40 95 38 87 52M124 43C117 53 102 53 91 58M120 54C112 62 101 63 93 64"
            fill="none"
            stroke={paper}
            strokeWidth=".9"
          />
          <path
            d="M69 35H91C91 45 86 50 82 55C88 60 91 66 91 78H69C69 66 72 60 78 55C74 50 69 45 69 35Z"
            fill={paper}
          />
          <path d="M72 40H88L80 51ZM72 74L80 61L88 74Z" fill={coral} stroke="none" />
          <path d="M65 31H95V36H65ZM65 78H95V83H65Z" fill={gold} />
          <path d="M80 13V24M73 20L80 13L87 20M68 92H92" fill="none" stroke={gold} />
        </g>
      );
    case 'satchel':
      return (
        <g>
          <path d="M45 40H116V89H45Z" fill={gold} />
          <path d="M45 40 52 27H111L116 40v24l-35 8-36-8Z" fill={coral} />
          <path d="M67 28V19q14-13 28 0v9" fill="none" strokeWidth="4" />
          <rect x="76" y="61" width="11" height="18" rx="2" fill={paper} />
          <path d="M50 83h61M52 39h57" opacity=".6" />
          <ArtGlyph kind="feather" x={106} y={12} size={26} color={ink} accent={paper} />
        </g>
      );
    case 'echo':
      return (
        <g>
          <path d="M35 40 76 29V73L35 60ZM76 29v44M35 40v20l-13 1V39Z" fill={gold} />
          <path d="m42 63 6 24h15l-8-21" fill={coral} />
          <path
            d="M87 33q23 18 0 37m13-48q35 30 0 61m12-72q47 41 0 83"
            fill="none"
            strokeWidth="3"
          />
        </g>
      );
    case 'splash':
      return (
        <g>
          <path
            d="M28 77q52 39 103-2M45 78 31 59m24 13L51 52m20 18 1-28m15 31 8-22m13 28 15-20"
            fill="none"
            stroke={gold}
            strokeWidth="3"
          />
          <MiniCard x={29} y={26} suit="hearts" angle={-20} />
          <MiniCard x={55} y={14} suit="diamonds" angle={-8} />
          <MiniCard x={81} y={14} suit="clubs" angle={8} />
          <MiniCard x={108} y={25} suit="spades" angle={20} />
        </g>
      );
    default:
      return <ArtGlyph kind="star" color={coral} accent={gold} />;
  }
}

const jokerPalettes: Record<
  string,
  'ember' | 'moss' | 'tide' | 'violet' | 'gold' | 'slate' | 'rose'
> = {
  spark: 'ember',
  granite: 'slate',
  duet: 'rose',
  twins: 'rose',
  trio: 'gold',
  stair: 'gold',
  river: 'tide',
  house: 'moss',
  crown: 'gold',
  constellation: 'slate',
  hearts: 'rose',
  diamonds: 'gold',
  clubs: 'moss',
  spades: 'slate',
  portrait: 'ember',
  even: 'tide',
  odd: 'violet',
  fibonacci: 'gold',
  ace: 'slate',
  low: 'moss',
  solo: 'gold',
  minimal: 'moss',
  banquet: 'ember',
  rainy: 'tide',
  last: 'rose',
  bankroll: 'moss',
  purse: 'ember',
  scholar: 'gold',
  collector: 'moss',
  sculptor: 'slate',
  runner: 'ember',
  vine: 'moss',
  paircraft: 'violet',
  tidal: 'tide',
  toll: 'ember',
  dividend: 'gold',
  reserve: 'tide',
  satchel: 'gold',
  echo: 'ember',
  splash: 'tide',
};

export function JokerArt({ id, className = '' }: { id: string; className?: string }) {
  return (
    <ArtScene
      className={`blindside-art ${className}`}
      palette={jokerPalettes[id] ?? 'moss'}
      variant={id === 'constellation' || id === 'spades' ? 'night' : 'rays'}
    >
      <PrintGround />
      <g stroke={ink} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
        {nightMarketJokerArt[id] ?? expansionJokerArt[id] ?? <JokerMotif id={id} />}
      </g>
    </ArtScene>
  );
}
