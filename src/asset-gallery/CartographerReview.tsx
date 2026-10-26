import { FrontierArt } from '../games/cartographer/ui/FrontierArt';
import { ThreatCue } from '../games/cartographer/ui/MapCues';

export interface CartographerEvidence {
  before: string;
  after: string;
  threatBefore: string;
  threatAfter: string;
  screenshotBytes: number;
}

export function CartographerReview({ evidence }: { evidence: CartographerEvidence }) {
  return (
    <details className="comparison" id="review-cartographer" open>
      <summary>
        <span>
          <b>05</b> Cartographer · occupied exits and threats
        </span>
        <span className="detail-hint">Before / after</span>
      </summary>
      <div className="comparison-body">
        <p className="review-question">Can you still read the doorway under the hero?</p>
        <div className="cartographer-views">
          <figure>
            <figcaption>BEFORE · doorway direction disappears</figcaption>
            <img
              src={evidence.before}
              alt="Before: the hero replaces the north doorway arrow."
              loading="lazy"
            />
          </figure>
          <figure>
            <figcaption>AFTER · arrow stays beside the hero</figcaption>
            <img
              src={evidence.after}
              alt="After: a small north arrow remains on the occupied doorway."
              loading="lazy"
            />
          </figure>
        </div>
        <div className="cartographer-threats">
          <figure>
            <figcaption>BEFORE · pale threat mark</figcaption>
            <img
              src={evidence.threatBefore}
              alt="Before: a pale exclamation overlaps the pale hero tile."
              loading="lazy"
            />
          </figure>
          <figure>
            <figcaption>AFTER · filled warning triangle</figcaption>
            <img
              src={evidence.threatAfter}
              alt="After: a dark exclamation sits within a peach triangle on the same threatened tile."
              loading="lazy"
            />
          </figure>
        </div>
        <p>
          Matched 390 px phone captures, shown at native size or smaller. Threat details are
          lossless tile crops. Same seed, accepted commands and threat cells; full desktop and phone
          views are retained in the local evidence. No new movement or damage behavior.
        </p>
        <article id="asset-cartographer-map" className="shield-specimen">
          <h3>cartographer/feedback/frontier</h3>
          <div className="shield-symbol-sizes">
            {[64, 16, 12].map((size) => (
              <figure key={size}>
                <div style={{ width: size, height: size }}>
                  <FrontierArt />
                </div>
                <figcaption>{size} px</figcaption>
              </figure>
            ))}
            <figure>
              <div className="cartographer-threat-sample">
                <ThreatCue />
              </div>
              <figcaption>14 px warning</figcaption>
            </figure>
          </div>
          <p>
            Occupied cell names now retain the doorway direction. Existing threatened-damage labels
            remain authoritative. Static cues need no motion and add no focus targets.
          </p>
        </article>
        <div className="lesson">
          <strong>Check occupied cells, not just empty terrain</strong>
          <p>
            The original empty-door arrows were clear; the hero hid them on arrival. A brighter
            exclamation alone would still depend on the background. A filled triangle separates the
            warning from terrain and the hero. These cues remain small at 320 px; player recognition
            and enjoyment are untested. Review the cues with players before extending them.
          </p>
        </div>
      </div>
    </details>
  );
}
