import type { ReactNode } from 'react';
import { ArtScene } from '../../../../shared/art/CardArt';
import { ink, paper, coral, gold, PrintGround, SuitPip, MiniCard, Coin, Mask } from './primitives';

/** Each plate shows the rule's interruption at the table, not a second rules label. */
export function BossArt({ id, className = '' }: { id: string; className?: string }) {
  let motif: ReactNode;
  switch (id) {
    case 'thorn':
      motif = (
        <g>
          <path d="M24 87Q62 91 136 84" fill="none" stroke={gold} strokeWidth="1" />
          <MiniCard x={27} y={33} suit="clubs" angle={-12} value="K" />
          <path d="M69 91Q82 72 88 54Q94 34 129 17" fill="none" stroke={ink} strokeWidth="8" />
          <path d="M69 91Q82 72 88 54Q94 34 129 17" fill="none" stroke={gold} strokeWidth="1" />
          <path d="m82 69-19-5 10-8m18-12 19 4-8 9m9-23-2-15 10 5m-34 51 15 7-11 7" fill={ink} />
          <path
            d="M100 40q-8-17-23-15m34 10q13 6 24-2M75 63q-19 4-27-8"
            fill="none"
            stroke={ink}
            strokeWidth="2"
          />
          <g color={coral}>
            <SuitPip suit="clubs" x={109} y={43} size={18} />
          </g>
          <path d="m111 45 14 15M32 79l25-26" fill="none" stroke={coral} strokeWidth="2.4" />
        </g>
      );
      break;
    case 'mask':
      motif = (
        <g>
          <path d="M25 83Q70 93 135 80" fill="none" stroke={gold} strokeWidth="1" />
          <path d="M25 19Q47 8 73 17L71 70Q53 78 35 68Z" fill={gold} />
          <path
            d="M31 24Q45 19 60 24M35 30h23M35 36h19"
            fill="none"
            stroke={paper}
            strokeWidth="1"
          />
          <MiniCard x={29} y={35} suit="hearts" angle={-11} value="K" />
          <path d="M60 17Q97 5 132 27L128 84Q99 70 72 89Z" fill={ink} />
          <path
            d="M67 25Q101 12 126 31M71 82Q100 65 126 78"
            fill="none"
            stroke={gold}
            strokeWidth="1"
          />
          <Mask x={79} y={20} size={0.83} />
          <path
            d="M78 43q-14 7-30 4M76 58q-17 7-31 0"
            fill="none"
            stroke={coral}
            strokeWidth="2.2"
          />
        </g>
      );
      break;
    case 'pinch':
      motif = (
        <g>
          <path d="M25 85Q74 96 137 84" fill="none" stroke={gold} strokeWidth="1" />
          <MiniCard x={31} y={42} suit="spades" angle={-17} />
          <path d="M30 64q13 14 23 7" fill="none" stroke={coral} strokeWidth="2" />
          <path d="M36 18Q52 32 57 49L69 59 60 70 45 62Q39 45 24 34Z" fill={coral} />
          <path d="M123 18Q109 32 103 49L91 59 100 70 116 62Q122 45 137 34Z" fill={coral} />
          <path
            d="M38 24q13 18 15 29m70-29q-13 18-15 29"
            fill="none"
            stroke={paper}
            strokeWidth="1"
          />
          <MiniCard x={67} y={37} suit="diamonds" angle={4} />
          <path d="M61 54q6 12 18 13 14-1 21-13" fill="none" stroke={ink} strokeWidth="3" />
          <circle cx="122" cy="77" r="9" fill={coral} />
          <circle cx="122" cy="77" r="5" fill="none" stroke={paper} strokeWidth="1.3" />
          <path d="m119 77 3-3v7" fill="none" stroke={paper} strokeWidth="1.4" />
        </g>
      );
      break;
    case 'narrow':
      motif = (
        <g>
          <path d="M20 19 62 28 67 83 20 93ZM140 19 98 28 93 83 140 93Z" fill={ink} />
          <path
            d="M25 27 55 34m-30 7 31 4m-31 9 32 2m-32 10 33 1m-33 13 35-3m75-49-30 7m30 7-31 4m31 9-32 2m32 10-33 1m33 13-35-3"
            fill="none"
            stroke={gold}
            strokeWidth="1"
          />
          <MiniCard x={67} y={39} suit="diamonds" />
          <path
            d="m56 22 10 10-10 10m48-20-10 10 10 10"
            fill="none"
            stroke={coral}
            strokeWidth="2.6"
          />
          <path d="M44 92q36 8 72 0" fill="none" stroke={gold} strokeWidth="1" />
        </g>
      );
      break;
    case 'lock':
      motif = (
        <g>
          <path d="M22 89h116" fill="none" stroke={gold} strokeWidth="1" />
          <MiniCard x={25} y={39} suit="spades" angle={-13} value="A" />
          <path d="M51 59q15-18 30-17" fill="none" stroke={coral} strokeWidth="2.5" />
          <path d="m72 34 8 8-10 4" fill="none" stroke={coral} strokeWidth="2.5" />
          <path d="M86 41V28q0-20 19-20t19 20v13" fill="none" stroke={ink} strokeWidth="7" />
          <path d="M86 41V28q0-20 19-20t19 20v13" fill="none" stroke={gold} strokeWidth="1" />
          <path d="M73 39h64v45q-32 13-64 0Z" fill={gold} />
          <path d="M81 47h48M81 76h48" fill="none" stroke={paper} strokeWidth="1" />
          <path d="M105 50a8 8 0 0 0-4 15l-3 10h14l-3-10a8 8 0 0 0-4-15Z" fill={ink} />
          <path d="M27 73 44 92" fill="none" stroke={coral} strokeWidth="2.5" />
        </g>
      );
      break;
    case 'five':
      motif = (
        <g>
          <path
            d="M22 86V39q0-18 18-18h80q18 0 18 18v47"
            fill="none"
            stroke={ink}
            strokeWidth="6"
          />
          <path d="M29 38q0-10 11-10h80q11 0 11 10" fill="none" stroke={gold} strokeWidth="1" />
          <path d="M23 87h115M40 91h80" fill="none" stroke={gold} strokeWidth="2" />
          {[30, 51, 72, 93, 114].map((x, i) => (
            <MiniCard
              key={x}
              x={x}
              y={42 + (i % 2) * 3}
              suit={i % 2 ? 'hearts' : 'spades'}
              value="5"
            />
          ))}
          <path
            d="M37 34h7m14 0h7m14 0h7m14 0h7m14 0h7"
            fill="none"
            stroke={coral}
            strokeWidth="2"
          />
          <path d="m130 75 7 7-7 7" fill="none" stroke={coral} strokeWidth="2" />
        </g>
      );
      break;
    case 'wall':
      motif = (
        <g>
          <path d="M22 88h116" fill="none" stroke={ink} strokeWidth="2" />
          <path d="M38 82V37l10-7 10 7 9-7 9 7 10-7 10 7 10-7 10 7v45Z" fill={gold} />
          <path
            d="M38 50h78M38 64h78M38 77h78M58 37v13m38-13v13M77 50v14m-19 0v13m38-13v13"
            fill="none"
            stroke={ink}
            strokeWidth="1.2"
          />
          <path d="M22 79V68h12v11m90 0V67h13v12" fill={paper} />
          <path d="M25 73h6m96 0h6" fill="none" stroke={gold} strokeWidth="1" />
          <path d="M117 26V12l15 5-15 5" fill={coral} />
          <path d="M117 12v24" fill="none" stroke={ink} strokeWidth="1.5" />
          <path d="M28 59h18m-9-8 9 8-9 8" fill="none" stroke={coral} strokeWidth="2.8" />
          <path d="M31 89h30m-26 5h23" fill="none" stroke={coral} strokeWidth="2" />
        </g>
      );
      break;
    case 'crown':
      motif = (
        <g>
          <path d="M24 90h112M34 84h92M45 78h70" fill="none" stroke={ink} strokeWidth="3" />
          <path d="M44 77V43q0-27 36-30 36 3 36 30v34" fill={ink} />
          <path d="M52 72V44q0-20 28-24 28 4 28 24v28" fill={gold} />
          <path d="M60 68V45q0-14 20-18 20 4 20 18v23" fill={paper} />
          <path d="M59 61 54 39 69 49 80 31 91 49 106 39 101 61Z" fill={gold} />
          <path d="M59 61h42v8H59Z" fill={coral} />
          <path d="M63 57h34M67 65h27" fill="none" stroke={paper} strokeWidth="1.5" />
          <g color={ink}>
            <SuitPip suit="spades" x={74} y={42} size={12} />
          </g>
          <path d="M30 75 40 70m90 5-10-5" fill="none" stroke={coral} strokeWidth="2" />
          <path d="M28 68h15m74 0h15" fill="none" stroke={gold} strokeWidth="1" />
        </g>
      );
      break;
    default:
      motif = (
        <g>
          <MiniCard x={66} y={25} value="A" />
          <Coin x={81} y={80} />
        </g>
      );
  }
  return (
    <ArtScene className={`blindside-art ${className}`} palette="slate" variant="runes">
      <PrintGround />
      <g stroke={ink} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
        {motif}
      </g>
    </ArtScene>
  );
}
