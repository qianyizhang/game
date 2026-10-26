import type { Direction } from '../../../shared/layout/layout';
import { FrontierArt } from './FrontierArt';
import './MapCues.css';

const rotation: Record<Direction, number> = { north: 0, east: 90, south: 180, west: 270 };

export function FrontierCue({ direction }: { direction: Direction }) {
  return (
    <span
      className="dc-frontier-cue"
      aria-hidden="true"
      style={{ transform: `rotate(${rotation[direction]}deg)` }}
    >
      <FrontierArt />
    </span>
  );
}

export function ThreatCue() {
  return (
    <b className="dc-danger-dot" aria-hidden="true">
      !
    </b>
  );
}
