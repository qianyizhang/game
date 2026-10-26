import { IntentArt, INTENT_ART, type IntentArtKind } from '../games/spire/ui/IntentArt';
import { IntentCue } from '../games/spire/ui/IntentCue';
import changes from './CHANGELOG.json';
import { HearthShieldReview, type HearthShieldEvidence } from './HearthShieldReview';

const examples: Record<IntentArtKind, { text: string; lesson: string }> = {
  attack: {
    text: 'Chomp: 11 damage',
    lesson: 'Keep damage in text. A blade silhouette says attack, never how much Block is enough.',
  },
  block: {
    text: 'Defend: 12 Block',
    lesson:
      'A shield must mean incoming Block, not invulnerability or damage prevention for the player.',
  },
  status: {
    text: 'Grow: 3 strength',
    lesson:
      'Status changes can help either side. The eye stays neutral; the authoritative text names the effect.',
  },
  card: {
    text: 'Daze: 2 Dazed',
    lesson:
      'Adding a card is not necessarily a reward. Preserve the card name and count beside the book.',
  },
  special: {
    text: 'Ritual: Ritual 3',
    lesson:
      'Special moves cannot share a precise pictogram. The spark prompts reading the full action.',
  },
  wait: {
    text: 'Stunned · no attack',
    lesson:
      'An empty action needs an explicit cue. Never imply that a non-attacking special move is harmless.',
  },
};

export interface GalleryEvidence {
  before: string;
  after: string;
  screenshotBytes: number;
  shield: HearthShieldEvidence;
}

export function ReviewGallery({ evidence }: { evidence: GalleryEvidence }) {
  return (
    <>
      <header className="gallery-header">
        <a className="wordmark" href="#top">
          CW <span>ASSET FIELDNOTES</span>
        </a>
        <nav aria-label="Gallery navigation">
          <a href="#latest">Latest changes</a>
          <a href="#reviews">Comparisons</a>
          <a href="#next">Next studies</a>
        </nav>
      </header>
      <main id="top">
        <section className="gallery-intro" aria-labelledby="gallery-title">
          <div>
            <p className="eyebrow">STUDIES 01 + 03 / INTENT & SHIELD LOSS</p>
            <h1 id="gallery-title">
              Read the
              <br />
              <em>what changed.</em>
            </h1>
            <p className="lede">
              Small visual studies for clearer decisions and feedback: Spire’s next action and Last
              Hearth’s lost protection. Familiar shapes stay beside exact words.
            </p>
            <a className="review-link" href="#review-hearth-shield">
              Compare the latest study
            </a>
          </div>
          <div className="hero-specimen">
            <span className="specimen-index">01 — ATTACK</span>
            <IntentArt kind="attack" />
            <p>
              A silhouette catches the eye.
              <br />
              The words carry the rules.
            </p>
            <span className="specimen-size">64 × 64 SVG / 32 PX IN PLAY</span>
          </div>
        </section>
        <section id="latest" className="latest" aria-labelledby="latest-title">
          <div className="section-title">
            <h2 id="latest-title">Latest changes</h2>
            <span>Newest first · retained history</span>
          </div>
          <ol className="changelog">
            {changes.map((change) => (
              <li key={change.id}>
                <time dateTime={change.date}>{change.date}</time>
                <div>
                  <h3>{change.title}</h3>
                  <span className="status">{change.status}</span>
                  <p>{change.summary}</p>
                  <div className="change-links">
                    <a href={`#${change.review}`}>Before / after review</a>
                    {change.assets.map((kind) => (
                      <a key={kind} href={`#asset-${kind}`}>
                        {kind}
                      </a>
                    ))}
                    {change.pr ? <a href={change.pr}>Review PR</a> : <span>Draft PR pending</span>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="validation" aria-labelledby="validation-title">
          <h2 id="validation-title">What each status means</h2>
          <dl>
            <div>
              <dt>Proposed</dt>
              <dd>Authored candidate; checks or review remain.</dd>
            </div>
            <div>
              <dt>Technically verified</dt>
              <dd>Named automated and browser checks passed.</dd>
            </div>
            <div>
              <dt>Visually reviewed</dt>
              <dd>Matched desktop, phone, and native-size views inspected by the author.</dd>
            </div>
            <div>
              <dt>Gameplay-tested</dt>
              <dd>
                Human play sessions evaluated clarity and enjoyment. <strong>Not yet done.</strong>
              </dd>
            </div>
          </dl>
          <p>
            Browser journeys establish working controls and rendering. They do not establish that
            this is more fun. Visual review here is author self-review; player approval is still
            open.
          </p>
        </section>
        <section id="reviews" aria-labelledby="reviews-title">
          <div className="section-title">
            <h2 id="reviews-title">The comparisons</h2>
            <span>Open any number · each stays independent</span>
          </div>
          <HearthShieldReview evidence={evidence.shield} />
          <details className="comparison combat-comparison" id="review-combat" open>
            <summary>
              <span>
                <b>01</b> In the battlefield
              </span>
              <span className="detail-hint">Before / after</span>
            </summary>
            <div className="comparison-body">
              <p className="review-question">
                Can you identify the next action and current target before choosing a card?
              </p>
              <div className="matched-views">
                <figure>
                  <figcaption>BEFORE · text capsule and border</figcaption>
                  <img
                    src={evidence.before}
                    alt="Before: Jaw Worm intent appears as a small text capsule above its portrait."
                    loading="lazy"
                  />
                </figure>
                <figure>
                  <figcaption>AFTER · action silhouette and target marker</figcaption>
                  <img
                    src={evidence.after}
                    alt="After: attack silhouette accompanies the unchanged Chomp damage text, with an explicit Targeted marker."
                    loading="lazy"
                  />
                </figure>
              </div>
              <p>
                Same seeded encounter, selected enemy, and desktop width. Full battlefield crops
                retain the extra vertical space required by the new cue.
              </p>
              <div className="lesson">
                <strong>Baseline lesson</strong>
                <p>
                  The small text-only capsule requires reading before the action family is apparent.
                  Extra symbols must earn their space; the player still needs the precise text.
                </p>
              </div>
            </div>
          </details>
          <details className="comparison" id="review-mixed">
            <summary>
              <span>
                <b>02</b> Mixed actions stay explicit
              </span>
              <span className="detail-hint">Open comparison</span>
            </summary>
            <div className="comparison-body">
              <div className="cue-comparison">
                <figure>
                  <figcaption>BEFORE</figcaption>
                  <span className="baseline-intent">Thrash: 7 damage · 5 Block</span>
                </figure>
                <figure>
                  <figcaption>AFTER</figcaption>
                  <IntentCue kinds={['attack', 'block']} text="Thrash: 7 damage · 5 Block" />
                </figure>
              </div>
              <div className="lesson">
                <strong>Failure mode to avoid</strong>
                <p>
                  One primary icon would hide the defensive half of this move. Keep each distinct
                  effect family and the complete original text. Repeated hits remain an explicit ×
                  count in the text.
                </p>
              </div>
            </div>
          </details>
          <div className="asset-grid">
            {(Object.keys(INTENT_ART) as IntentArtKind[]).map((kind) => (
              <article className="asset-card" id={`asset-${kind}`} key={kind}>
                <div className="asset-preview">
                  <IntentArt kind={kind} />
                  <span>SPIRE / {kind.toUpperCase()}</span>
                </div>
                <h3>{INTENT_ART[kind].name}</h3>
                <p className="asset-id">spire/intents/{kind}</p>
                <span className="status">
                  {changes.find((change) => change.assets.includes(kind))?.status ?? 'proposed'}
                </span>
                <details className="asset-review">
                  <summary>
                    Compare cue <span aria-hidden="true">+</span>
                  </summary>
                  <div className="asset-review-body">
                    <figure>
                      <figcaption>BEFORE · text only</figcaption>
                      <span className="baseline-intent">{examples[kind].text}</span>
                    </figure>
                    <figure>
                      <figcaption>AFTER · native 32 px symbol</figcaption>
                      <IntentCue kinds={[kind]} text={examples[kind].text} />
                    </figure>
                    <p>{examples[kind].lesson}</p>
                  </div>
                </details>
              </article>
            ))}
          </div>
          <p className="sample-note">
            Cue specimens are illustrative presentation samples. The combat capture is rendered in
            the actual game. During play, all values come from the existing intent formatter.
          </p>
        </section>
        <section id="next" className="next-studies" aria-labelledby="next-title">
          <div className="section-title">
            <h2 id="next-title">Next studies</h2>
            <span>Proposed · not implemented</span>
          </div>
          <ol>
            <li>
              <strong>Blindside · separate scoring review</strong>
              <p>
                The scoring study is available in{' '}
                <a href="https://github.com/qianyizhang/game/pull/19">PR19</a>. Review its source
                portraits and changed-value cues alongside this study.
              </p>
            </li>
            <li>
              <strong>Last Hearth · shield review, then contact cues</strong>
              <p>
                Review shield recognition and the added height first. Rebirth and finishing-hit cues
                remain proposed; any later 3D contact study must preserve existing combat frames.
              </p>
            </li>
            <li>
              <strong>Cartographer · hazard readability</strong>
              <p>
                Differentiate threatened tiles, cover, and exits by shape as well as color. Keep
                cell labels authoritative.
              </p>
            </li>
            <li>
              <strong>Night Passage · 3D windup silhouettes</strong>
              <p>
                Review the existing brute and guardian poses from the gameplay camera. Refine one
                anticipation pose in its saved Blender source, with contact timing and
                reduced-motion stills preserved. No new timing or damage geometry.
              </p>
            </li>
            <li>
              <strong>Emberwake · elemental impact effects</strong>
              <p>
                Give physical, fire, cold, and poison impacts distinct 2D shapes using the existing
                bounded effect pool. Test whether players recognize a hit while terrain and threats
                remain readable.
              </p>
            </li>
          </ol>
        </section>
        <section className="provenance" aria-labelledby="provenance-title">
          <h2 id="provenance-title">Materials & review notes</h2>
          <p>
            Original code-drawn SVG compositions reuse the project’s sword, shield, eye, book,
            spark, and hourglass primitives. The new split-shield contour uses Last Hearth’s ink and
            ochre palette. No purchased assets, external fonts, generated raster artwork, or
            third-party artwork were added. The repository has no explicit redistribution license;
            this preview does not grant one.
          </p>
          <dl>
            <div>
              <dt>In-game budget</dt>
              <dd>
                Spire: six vectors, ≤ 12 KiB total. Hearth: one 64 × 64 vector, ≤ 2 KiB, at 22/18 px
                with a 180 ms emphasis disabled for reduced motion. No new requests, timers,
                animation loops or filters.
              </dd>
            </div>
            <div>
              <dt>Gallery budget</dt>
              <dd>
                One offline HTML file, ≤ 600 KiB. Zero JavaScript. Four embedded captures:{' '}
                {((evidence.screenshotBytes + evidence.shield.screenshotBytes) / 1024).toFixed(1)}{' '}
                KiB.
              </dd>
            </div>
            <div>
              <dt>Review prompt</dt>
              <dd>
                Which cue reads slowly? Which competing element draws your eye? Does the added
                height help enough on a phone?
              </dd>
            </div>
          </dl>
        </section>
      </main>
      <footer>
        <span>CARD WORKSHOP / ASSET FIELDNOTES</span>
        <span>Studies 01 + 03 · player review pending</span>
      </footer>
    </>
  );
}
