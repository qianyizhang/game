import { ShieldBreakArt } from '../games/battlegrounds/ui/ShieldBreakArt';
import { ShieldBreakCue } from '../games/battlegrounds/ui/ShieldBreakCue';

export interface HearthShieldEvidence {
  before: string;
  after: string;
  screenshotBytes: number;
}

/** Additive review section: it can sit beside independently reviewed game studies. */
export function HearthShieldReview({ evidence }: { evidence: HearthShieldEvidence }) {
  return (
    <details className="comparison" id="review-hearth-shield" open>
      <summary>
        <span>
          <b>04</b> Last Hearth · a shield breaks
        </span>
        <span className="detail-hint">Before / after</span>
      </summary>
      <div className="comparison-body">
        <p className="review-question">
          Which minion lost protection while its health stayed the same?
        </p>
        <div className="shield-unit-views">
          <figure>
            <figcaption>BEFORE · keyword disappears</figcaption>
            <img
              src={evidence.before}
              alt="Before: Clockwork Pup has one Health and no Shield keyword; nothing names the shield loss."
              loading="lazy"
            />
          </figure>
          <figure>
            <figcaption>AFTER · loss stays visible</figcaption>
            <img
              src={evidence.after}
              alt="After: the same Clockwork Pup still has one Health, with a split-shield symbol and Shield broken label."
              loading="lazy"
            />
          </figure>
        </div>
        <p>
          Same seed, accepted action, combat frame and desktop viewport. These are native-size unit
          captures; complete desktop and phone combat views were reviewed separately. Save bytes and
          complete combat results match before and after.
        </p>
        <article id="asset-hearth-shield" className="shield-specimen">
          <h3>hearth/feedback/shield-break</h3>
          <div className="shield-symbol-sizes">
            {[64, 22, 18].map((size) => (
              <figure key={size}>
                <div style={{ width: size, height: size }}>
                  <ShieldBreakArt />
                </div>
                <figcaption>{size} px</figcaption>
              </figure>
            ))}
          </div>
          <ShieldBreakCue />
          <p>
            The live cue pairs shape and words. It stays visible when paused; its 180 ms emphasis is
            disabled for reduced motion. Card labels and the combat announcement name the loss.
          </p>
        </article>
        <div className="lesson">
          <strong>Only show what the snapshots establish</strong>
          <p>
            Match the same unit ID on the same side across adjacent frames. Health damage,
            disappearance and a new Reborn instance do not establish shield loss. The cue names lost
            protection, never an invented damage amount. Reserved keyword space adds height; player
            review must judge that cost.
          </p>
        </div>
      </div>
    </details>
  );
}
