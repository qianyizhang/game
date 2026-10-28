import type { ReactNode } from 'react';
import { ArtGlyph } from '../../../../shared/art/CardArt';
import { ArtScene } from '../../../../shared/art/CardArt';
import { Planet } from './planets';
import {
  ink,
  paper,
  coral,
  gold,
  PrintGround,
  SuitPip,
  MiniCard,
  Ladder,
  Book,
} from './primitives';
function ToolMotif({ id }: { id: string }): ReactNode {
  if (id.startsWith('planet-')) return <Planet id={id} />;
  switch (id) {
    case 'bonus':
      return (
        <g strokeWidth="1.1">
          <path d="M39 90C39 78 47 66 56 61L70 69C67 79 55 89 39 90Z" fill={gold} />
          <path d="M56 61L88 18L103 29L70 69Z" fill={ink} />
          <path d="M86 18L91 12L108 25L104 30Z" fill={coral} />
          <path d="M62 62L91 24M66 65L95 27" fill="none" stroke={paper} strokeWidth=".85" />
          <path d="M40 89L58 73M43 75L52 76M51 65L61 66" fill="none" />
          <circle cx="58" cy="73" r="2" fill={ink} stroke="none" />
          <path
            d="M83 73C95 59 110 58 121 65C106 64 96 72 99 78C101 84 113 81 120 76M78 85C91 87 94 91 116 89"
            fill="none"
            stroke={coral}
            strokeWidth="1.4"
          />
          <path d="M25 95H129" fill="none" stroke={gold} strokeWidth=".8" />
        </g>
      );
    case 'mult':
      return (
        <g>
          <path d="M58 34H104L112 88H50Z" fill={gold} />
          <path d="M58 34 69 25H94L104 34M69 25V17q12-15 25 0v8" fill="none" />
          <path d="M61 40H101L107 82H55Z" fill={paper} />
          <path d="M81 47q-19 23-2 27q20-1 10-21l-6 9Z" fill={coral} />
          <path
            d="M44 46 29 40m13 22H26m18 16-15 7m90-39 14-6m-11 22h17m-19 16 13 7"
            stroke={gold}
          />
        </g>
      );
    case 'glass':
      return (
        <g>
          <path d="M66 81h29l8 14H58Z" fill={gold} />
          <ellipse cx="81" cy="47" rx="29" ry="34" fill={gold} />
          <ellipse cx="81" cy="47" rx="23" ry="28" fill={paper} />
          <path d="m66 53 27-27m-23 41 28-29m-24 11 8 7-4 20" fill="none" />
          <ArtGlyph kind="star" x={114} y={24} size={20} color={coral} />
        </g>
      );
    case 'steel':
      return (
        <g strokeWidth="1.1">
          <path
            d="M25 48H125V57H113C113 68 101 66 91 64C87 72 93 81 103 85V90H54V85C64 80 70 72 65 64C49 64 35 58 25 48Z"
            fill={ink}
          />
          <path d="M39 52H118M72 64H85M60 86H97" fill="none" stroke={paper} strokeWidth=".85" />
          <path
            d="M52 57L60 60M60 56L67 59M67 55L74 58M76 78L70 84M81 79L86 85"
            stroke={gold}
            strokeWidth=".7"
          />
          <path d="M89 30L67 56L61 51L83 26Z" fill={coral} />
          <path d="M77 24L84 13L112 29L105 40Z" fill={gold} />
          <path d="M84 13L88 19L110 32M88 19L81 29" fill="none" stroke={paper} strokeWidth=".85" />
          <path d="M43 38L38 33M48 35L46 28M114 67L120 72" fill="none" stroke={gold} />
        </g>
      );
    case 'garden':
      return (
        <g>
          <path d="M40 92H121M49 89V52m31 37V38m29 51V56" fill="none" />
          <g color={coral}>
            <SuitPip suit="hearts" x={35} y={25} size={30} />
            <SuitPip suit="hearts" x={65} y={9} size={34} />
            <SuitPip suit="hearts" x={95} y={31} size={29} />
          </g>
          <ArtGlyph kind="leaf" x={45} y={57} size={25} color={ink} />
          <ArtGlyph kind="leaf" x={79} y={53} size={25} color={ink} />
          <path d="m46 95-3 5m38-5v5m31-5 3 5" />
        </g>
      );
    case 'rank':
      return <Ladder />;
    case 'destroy':
      return (
        <g transform="rotate(-18 80 56)">
          <path d="M40 37H100L122 61 100 84H40Z" fill={paper} />
          <path d="M40 37H71V84H40Z" fill={coral} />
          <path d="M40 76h31M83 43v33" opacity=".45" />
          <path d="M45 95h61m8 0h8M38 16l-8-6m20 10-3-9" fill="none" />
        </g>
      );
    case 'copy':
      return (
        <g>
          <MiniCard x={41} y={22} suit="hearts" angle={-10} />
          <MiniCard x={90} y={47} suit="hearts" angle={10} />
          <path
            d="M77 34q22-10 32 8m-1-9 1 9-10-2M83 83q-25 10-31-16m-3 9 3-9 8 6"
            fill="none"
            stroke={coral}
            strokeWidth="3"
          />
          <ArtGlyph kind="star" x={104} y={16} size={15} color={gold} />
        </g>
      );
    case 'wild':
      return (
        <g>
          <path d="M37 77a43 43 0 0 1 86 0" fill="none" stroke={coral} strokeWidth="9" />
          <path d="M46 77a34 34 0 0 1 68 0" fill="none" stroke={gold} strokeWidth="8" />
          <path d="M55 77a25 25 0 0 1 50 0" fill="none" stroke={ink} strokeWidth="7" />
          <path d="M64 77a16 16 0 0 1 32 0" fill="none" stroke={paper} strokeWidth="6" />
          <path
            d="M25 78q-3-13 9-13q11-14 21-2q17-1 16 15Zm66 0q-1-16 13-15q12-14 23 0q13-1 9 15Z"
            fill={paper}
          />
        </g>
      );
    default:
      return <Book closed />;
  }
}

export function ConsumableArt({ id, className = '' }: { id: string; className?: string }) {
  return (
    <ArtScene
      className={`blindside-art ${className}`}
      palette={id.startsWith('planet-') ? 'slate' : id === 'garden' ? 'moss' : 'violet'}
      variant={id.startsWith('planet-') ? 'night' : 'runes'}
    >
      <PrintGround />
      <g stroke={ink} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
        <ToolMotif id={id} />
      </g>
    </ArtScene>
  );
}
