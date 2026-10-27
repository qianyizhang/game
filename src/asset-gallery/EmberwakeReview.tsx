export interface EmberwakeEvidence {
  beforeScene: string;
  afterScene: string;
  beforeZoom: string;
  afterZoom: string;
}

/** A separate self-contained page keeps the established gallery's HTML size limit intact. */
export function EmberwakeReview({ evidence }: { evidence: EmberwakeEvidence }) {
  return (
    <>
      <header className="gallery-header">
        <a className="wordmark" href="index.html#latest">
          CW <span>ASSET FIELDNOTES</span>
        </a>
        <nav aria-label="Gallery navigation">
          <a href="index.html#latest">Latest changes</a>
        </nav>
      </header>
      <main>
        <section className="latest" aria-labelledby="emberwake-title">
          <p className="eyebrow">STUDY 05 / EMBERWAKE</p>
          <h1 id="emberwake-title">Heroes and crypt silhouettes</h1>
          <p>
            Rook, Mira and Silas now have distinct shapes, as do hollow archers, salt wraiths and
            the Bellkeeper. The artwork was merged in{' '}
            <a href="https://github.com/qianyizhang/game/pull/24">PR 24</a>; this gallery
            presentation is separate.
          </p>
          <p>
            These are newly captured, staged scenes using the production renderer: the same Silent
            Courtyard, seed, camera, tick and positions in each pair. Rows show Rook, Mira and
            Silas; each faces an archer, wraith and Bellkeeper. They are comparison fixtures, not
            campaign witnesses.
          </p>
          <details className="comparison" open>
            <summary>
              <span>Matched desktop scenes</span>
              <span className="detail-hint">Before / after</span>
            </summary>
            <div className="comparison-body matched-views">
              <figure>
                <figcaption>BEFORE · e2515a9</figcaption>
                <img
                  src={evidence.beforeScene}
                  alt="Three crypt scenes before the silhouette changes, with Rook, Mira and Silas in separate rows."
                />
              </figure>
              <figure>
                <figcaption>AFTER · ad76602</figcaption>
                <img
                  src={evidence.afterScene}
                  alt="The same three crypt scenes with the accepted hero, archer, wraith and Bellkeeper silhouettes."
                />
              </figure>
            </div>
          </details>
          <details className="comparison" open>
            <summary>
              <span>Identical 2× pixel crops</span>
              <span className="detail-hint">Before / after</span>
            </summary>
            <div className="comparison-body matched-views">
              <figure>
                <figcaption>BEFORE · enlarged</figcaption>
                <img
                  src={evidence.beforeZoom}
                  alt="Enlarged crops of the three original hero and crypt figures."
                />
              </figure>
              <figure>
                <figcaption>AFTER · enlarged</figcaption>
                <img src={evidence.afterZoom} alt="The same crops with the accepted silhouettes." />
              </figure>
            </div>
          </details>
          <p>
            Acceptance was based on sampled desktop review, not exhaustive combat effects, campaign
            coverage or physical-device performance. Sampled CPU submission p90 was 1.05–1.65 ms;
            this is not GPU FPS. Independent review of this presentation remains pending.
          </p>
          <p>
            <a href="index.html#latest">Return to the gallery changelog</a>
          </p>
        </section>
      </main>
    </>
  );
}
