import type { ReactNode } from 'react';
import { ArtScene } from '../../../../shared/art/CardArt';
import { ink, coral, gold, PrintGround, SuitPip, MiniCard, Coin, Mask } from './primitives';
import { JokerMotif } from './jokers';
export function BossArt({ id, className = '' }: { id: string; className?: string }) {
  let motif: ReactNode;
  switch (id) {
    case 'thorn':
      motif = (
        <g>
          <path d="M78 96V26m0 29L55 40m23 31 26-20" fill="none" strokeWidth="4" />
          <path d="m78 29-11 6 11 6m0 24-12 5 12 6m24-23 4-11 6 5" fill={gold} />
          <g color={ink}>
            <SuitPip suit="clubs" x={63} y={7} size={33} />
          </g>
          <path d="M66 93H90" />
        </g>
      );
      break;
    case 'mask':
      motif = <Mask />;
      break;
    case 'pinch':
      motif = (
        <g>
          <path d="M50 21 69 49 55 61 35 39m75-18L91 49l14 12 20-22" fill={coral} />
          <path d="m59 57 16 21m28-21L87 78" strokeWidth="7" />
          <MiniCard x={68} y={49} angle={4} />
          <path d="M80 22V9m-7 11 7-11 7 11M42 87l12-6m62 6-12-6" fill="none" />
        </g>
      );
      break;
    case 'narrow':
      motif = (
        <g>
          <path d="M36 21h19v71H36Zm69 0h19v71H105Z" fill={ink} />
          <MiniCard x={67} y={38} suit="diamonds" />
          <path
            d="M16 54H58m-8-8 8 8-8 8m96-8H103m8-8-8 8 8 8"
            fill="none"
            stroke={coral}
            strokeWidth="3"
          />
        </g>
      );
      break;
    case 'lock':
      motif = (
        <g>
          <path d="M60 45V28q20-29 40 0v17" fill="none" strokeWidth="7" />
          <rect x="50" y="42" width="61" height="48" rx="7" fill={gold} />
          <path d="M80 56a7 7 0 0 0-3 13l-2 10h10l-2-10a7 7 0 0 0-3-13Z" fill={ink} />
          <path d="M58 49H104M59 85h43" opacity=".5" />
        </g>
      );
      break;
    case 'five':
      motif = (
        <g>
          {[32, 51, 70, 89, 108].map((x, i) => (
            <MiniCard
              key={x}
              x={x}
              y={28 + Math.abs(i - 2) * 8}
              suit={i % 2 ? 'hearts' : 'spades'}
              angle={(i - 2) * 7}
              value="5"
            />
          ))}
          <path d="M40 86h85m-65 8h44" stroke={coral} strokeWidth="3" />
        </g>
      );
      break;
    case 'wall':
      motif = (
        <g>
          <path d="M33 27H126V92H33Z" fill={gold} />
          <path
            d="M33 43h93M33 59h93M33 75h93M56 27v16m46-16v16M79 43v16M56 59v16m46-16v16M79 75v17"
            fill="none"
          />
          <path d="M24 97h113M48 18V8m65 10V8m-8 7 8-7 8 7" stroke={coral} />
        </g>
      );
      break;
    case 'crown':
      motif = (
        <g>
          <JokerMotif id="crown" />
          <path d="M22 43 30 51 22 59m116-16-8 8 8 8" stroke={coral} fill="none" />
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
