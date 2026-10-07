import { useEffect, useState } from 'react';
import ComparisonViewer, { type ComparisonOptions } from './ComparisonViewer';
import type { View } from './Viewer';
import baseline from '../references/comparison/baseline.json';
import qualityBaseline from '../references/comparison/quality-baseline.json';
import manifest from '../assets/manifest.json';

const views: View[] = ['Portrait', 'Front', 'Side', 'Back'];
const surfaces = ['Silhouette', 'Clay', 'Material'] as const;
export default function HydraComparison({
  onBack,
  onExit,
}: {
  onBack: () => void;
  onExit: () => void;
}) {
  const [options, setOptions] = useState<ComparisonOptions>({
    playing: false,
    time: 0,
    seek: 0,
    view: 'Front',
    surface: 'Clay',
    pair: 'direction',
    swapped: false,
    reset: 0,
  });
  const [time, setTime] = useState(0);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      if (preference.matches) setOptions((o) => ({ ...o, playing: false }));
    };
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  const labels = [
    options.pair === 'direction'
      ? ['Accepted direction', 'Procedural Hydra · preserved export']
      : options.pair === 'pilot'
        ? ['Original pilot', 'Blender pilot · preserved export']
        : ['Before quality pass', 'Gesture revision · preserved export'],
    ['Current candidate', 'Blender Hydra · awaiting your judgment'],
  ];
  if (options.swapped) labels.reverse();
  return (
    <main className="dcc-workbench dcc-comparison">
      <header className="dcc-header">
        <button className="dcc-back" onClick={onBack}>
          ← Back to workbench
        </button>
        <span className="dcc-wordmark">CARD WORKSHOP / COMPARE</span>
        <button className="dcc-back" onClick={onExit}>
          Return to my table
        </button>
      </header>
      <section className="dcc-intro">
        <div>
          <p className="dcc-eyebrow">ONE SUBJECT · TWO DIRECTIONS</p>
          <h1>
            Hydra, side by side<span>.</span>
          </h1>
        </div>
        <p>
          Read the gesture. Follow the anatomy.
          <br />
          <span>Then inspect materials and motion.</span>
        </p>
      </section>
      <div className="dcc-comparison-toolbar">
        <div role="group" aria-label="Comparison pair">
          <button
            aria-pressed={options.pair === 'direction'}
            onClick={() => setOptions((o) => ({ ...o, pair: 'direction' }))}
          >
            Accepted vs candidate
          </button>
          <button
            aria-pressed={options.pair === 'revision'}
            onClick={() => setOptions((o) => ({ ...o, pair: 'revision' }))}
          >
            Quality before / after
          </button>
          <button
            aria-pressed={options.pair === 'pilot'}
            onClick={() => setOptions((o) => ({ ...o, pair: 'pilot' }))}
          >
            Original pilot vs current
          </button>
        </div>
        <button onClick={() => setOptions((o) => ({ ...o, swapped: !o.swapped }))}>
          Swap sides ⇄
        </button>
      </div>
      <section
        className={`dcc-comparison-stage ${options.surface === 'Silhouette' ? 'is-silhouette' : ''}`}
        aria-label="Matched Hydra views"
      >
        <ComparisonViewer options={options} onTime={setTime} />
        <div className="dcc-comparison-labels">
          {labels.map(([title, subtitle]) => (
            <div key={title}>
              <strong>{title}</strong>
              <span>{subtitle}</span>
            </div>
          ))}
        </div>
      </section>
      <div className="dcc-comparison-toolbar">
        <div role="group" aria-label="Matched camera">
          {views.map((view) => (
            <button
              key={view}
              aria-pressed={options.view === view}
              onClick={() => setOptions((o) => ({ ...o, view, reset: o.reset + 1 }))}
            >
              {view}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Matched surface">
          {surfaces.map((surface) => (
            <button
              key={surface}
              aria-pressed={options.surface === surface}
              onClick={() => setOptions((o) => ({ ...o, surface }))}
            >
              {surface}
            </button>
          ))}
        </div>
        <button onClick={() => setOptions((o) => ({ ...o, reset: o.reset + 1 }))}>
          Reset camera
        </button>
      </div>
      <div className="dcc-comparison-timeline">
        <button
          aria-label={options.playing ? 'Pause comparison' : 'Play comparison'}
          onClick={() => setOptions((o) => ({ ...o, playing: !o.playing }))}
        >
          {options.playing ? 'Pause' : 'Play'}
        </button>
        <label>
          <span className="dcc-sr">Shared animation time</span>
          <input
            aria-label="Shared animation time"
            type="range"
            min="0"
            max="6"
            step="0.01"
            value={time}
            onChange={(e) => {
              const value = Number(e.target.value);
              setTime(value);
              setOptions((o) => ({ ...o, playing: false, time: value, seek: o.seek + 1 }));
            }}
          />
        </label>
        <output>{time.toFixed(2)} / 6.00 s</output>
      </div>
      <p className="dcc-comparison-hint">
        Drag either view to orbit both · Scroll to zoom · Shared camera, light and time
      </p>
      <div className="dcc-comparison-notes">
        <section>
          <p className="dcc-eyebrow">THE DECISION</p>
          <h2>Does the new form earn its place?</h2>
          <p>
            Compare the weight of the coil, the spaces between necks, and the transitions into the
            skulls. Clay reveals form; silhouette reveals gesture; material reveals the finished
            surface.
          </p>
          <p>
            The procedural Hydra remains the accepted direction. The Blender candidate is a separate
            interpretation, awaiting your judgment.
          </p>
        </section>
        <section>
          <p className="dcc-eyebrow">THE QUALITY PASS</p>
          <h2>Fitted forms, editable together.</h2>
          <p>
            The searching gesture is preserved. Longer tapered muzzles, deeper cranial planes and
            swept horns give the three heads distinct roles. Fitted flank scales add a middle level
            of surface detail. In Blender, each head’s named controls move its facial parts
            together.
          </p>
        </section>
        <details>
          <summary>Comparison method & preserved sources</summary>
          <p>
            Both views share a 35° camera, lighting, exposure and one six-second clock. All versions
            keep their authored scale, with the first-pose anatomy grounded at zero. Framing fits
            the union of all four versions at five times; switching pairs never magnifies one
            subject.
          </p>
          <p>
            Model units are a comparison convention, not a measured physical scale. Equal timestamps
            are not equivalent poses. Different anatomy and materials prevent attributing overall
            quality to Blender alone. No numerical score determines the visual winner.
          </p>
          <p className="dcc-hash">
            Baseline revision: {baseline.sourceRevision}
            <br />
            Accepted GLB: {baseline.sha256['references/comparison/accepted-hydra.glb']}
            <br />
            Original pilot GLB: {baseline.sha256['references/comparison/blender-before.glb']}
            <br />
            Before quality pass GLB: {qualityBaseline.sha256}
            <br />
            Current GLB: {manifest.sha256['assets/briar-hydra.glb']}
          </p>
        </details>
      </div>
    </main>
  );
}
