import { ShieldBreakArt } from './ShieldBreakArt';
import './ShieldFeedback.css';

export function ShieldBreakCue() {
  return (
    <span className="hearth-shield-break">
      <ShieldBreakArt />
      <span>Shield broken</span>
    </span>
  );
}
