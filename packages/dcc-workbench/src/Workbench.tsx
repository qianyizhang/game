import { lazy, Suspense, useEffect, useState } from 'react';
import Viewer, { type Playback, type Surface, type View } from './Viewer';
import brief from '../briefs/briar-hydra.json';
import manifest from '../assets/manifest.json';
import modelUrl from '../assets/briar-hydra.glb?url';
import sourceUrl from '../sources/briar-hydra.blend?url';
import beforeUrl from '../references/hydra-before.png';
import './workbench.css';

const HydraComparison = lazy(() => import('./HydraComparison'));

const stages = ['Intent', 'Form', 'Surface', 'Motion', 'Delivery'] as const;
type Stage = (typeof stages)[number];
const viewNames: View[] = ['Portrait', 'Front', 'Side', 'Back'];
const surfaces: Surface[] = ['Material', 'Clay', 'Wire'];
const copy: Record<Stage, { title: string; text: string }> = {
  Intent: { title: 'A moment before the strike.', text: brief.interpretation },
  Form: {
    title: 'One body. Three different gestures.',
    text: 'A compressed coil supports a high scenting head, a low searching head, and a lateral guard. Inspect the shoulder saddle and the spaces between the necks.',
  },
  Surface: {
    title: 'Weathered, not ornamental.',
    text: 'Mottled marsh skin, warm throat plates and swept ivory horns. Detail gathers around the face and dorsal crest; the broad body stays quiet.',
  },
  Motion: {
    title: 'Attention moves between the heads.',
    text: 'Independent neck phases lead into small head turns and jaw movement. The weight-bearing coil stays anchored throughout the six-second vigil.',
  },
  Delivery: {
    title: 'The same sculpture, in your browser.',
    text: 'This view loads the published GLB. Its skin, materials and animation travel together, while the editable Blender scene remains the authoring source.',
  },
};
function Gesture() {
  return (
    <svg
      className="dcc-gesture"
      viewBox="0 0 300 154"
      role="img"
      aria-label="Concept gesture diagram: high scenting head, low searching head, lateral guard, and anchored coil"
    >
      <ellipse
        cx="150"
        cy="126"
        rx="65"
        ry="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M151 124 C151 97 138 69 149 26 M135 119 C89 100 107 80 65 82 M168 117 C208 91 206 67 217 53"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        opacity=".5"
      />
      <path
        d="M135 27 L152 20 L165 25 M52 83 L67 77 L78 82 M202 52 L219 45 L232 50"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <g fill="currentColor" fontSize="9" fontFamily="sans-serif" letterSpacing="1">
        <text x="128" y="10">
          SCENT
        </text>
        <text x="28" y="66">
          SEARCH
        </text>
        <text x="224" y="34">
          GUARD
        </text>
        <text x="120" y="151">
          ANCHOR
        </text>
      </g>
    </svg>
  );
}
export default function Workbench({ onExit }: { onExit: () => void }) {
  const [comparison, setComparison] = useState(
    () => new URLSearchParams(location.search).get('compare') === 'hydra',
  );
  const [stage, setStage] = useState<Stage>('Intent');
  const [options, setOptions] = useState<Playback>(() => ({
    playing: !matchMedia('(prefers-reduced-motion: reduce)').matches,
    time: 0,
    seek: 0,
    view: 'Portrait',
    surface: 'Material',
    rig: false,
  }));
  const [time, setTime] = useState(0);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      if (query.matches) setOptions((o) => ({ ...o, playing: false }));
    };
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const chooseStage = (value: Stage) => {
    setStage(value);
    setOptions((o) => ({ ...o, surface: value === 'Form' ? 'Clay' : 'Material', rig: false }));
  };
  const toggleComparison = (value: boolean) => {
    const url = new URL(location.href);
    if (value) url.searchParams.set('compare', 'hydra');
    else url.searchParams.delete('compare');
    history.replaceState(null, '', url);
    setComparison(value);
  };
  if (comparison)
    return (
      <Suspense fallback={<p role="status">Loading Hydra comparison…</p>}>
        <HydraComparison onBack={() => toggleComparison(false)} onExit={onExit} />
      </Suspense>
    );
  return (
    <main className="dcc-workbench">
      <header className="dcc-header">
        <button className="dcc-back" onClick={onExit}>
          ← Return to my table
        </button>
        <span className="dcc-wordmark">
          CARD WORKSHOP <i>/</i> DCC
        </span>
        <span className="dcc-pilot">
          PILOT 001 <span>●</span> BLENDER → WEB
        </span>
      </header>
      <section className="dcc-intro">
        <div>
          <p className="dcc-eyebrow">THE ASSET WORKBENCH</p>
          <h1>
            Briar Hydra<span>.</span>
          </h1>
        </div>
        <p>
          Three minds. One watchful body.
          <br />
          <span>From a gesture to a living sculpture.</span>
        </p>
      </section>
      <button className="dcc-compare-entry" onClick={() => toggleComparison(true)}>
        Compare Hydra versions <span>Matched views · before & after ↗</span>
      </button>
      <nav className="dcc-stages" aria-label="Asset development stages">
        {stages.map((value, i) => (
          <button key={value} aria-pressed={stage === value} onClick={() => chooseStage(value)}>
            <small>0{i + 1}</small>
            {value}
            <span>↗</span>
          </button>
        ))}
      </nav>
      <div className="dcc-layout">
        <section className="dcc-viewport" aria-label="Sculpture preview">
          <div className="dcc-viewport-label">
            <span>
              <i /> LIVE ASSET
            </span>
            <span>
              {options.surface.toUpperCase()} / {options.view.toUpperCase()}
            </span>
          </div>
          <Viewer options={options} onTime={setTime} />
          <div className="dcc-view-controls" role="group" aria-label="Camera view">
            {viewNames.map((view) => (
              <button
                key={view}
                aria-pressed={options.view === view}
                onClick={() => setOptions((o) => ({ ...o, view }))}
              >
                {view}
              </button>
            ))}
          </div>
          <div className="dcc-timeline">
            <button
              aria-label={options.playing ? 'Pause animation' : 'Play animation'}
              onClick={() => setOptions((o) => ({ ...o, playing: !o.playing }))}
            >
              {options.playing ? 'Ⅱ' : '▶'}
            </button>
            <label>
              <span className="dcc-sr">Animation time</span>
              <input
                aria-label="Animation time"
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
            <output>
              {time.toFixed(1)} <span>/ 6.0s</span>
            </output>
          </div>
          <p className="dcc-orbit-hint">DRAG TO ORBIT · SCROLL TO EXPLORE</p>
        </section>
        <aside className="dcc-notes" aria-label={`${stage} notes`}>
          <p className="dcc-eyebrow">
            0{stages.indexOf(stage) + 1} / {stage.toUpperCase()}
          </p>
          <h2>{copy[stage].title}</h2>
          <p className="dcc-note-lead">{copy[stage].text}</p>
          {stage === 'Intent' && (
            <>
              <Gesture />
              <p>{brief.gesture}</p>
              <details>
                <summary>Compare the original direction</summary>
                <img
                  src={beforeUrl}
                  alt="Original procedural Hydra: three raised heads over a coil"
                />
                <p>{brief.reference}</p>
                <a href="/?art=3d&study=hydra">Open the original study ↗</a>
              </details>
            </>
          )}
          {stage === 'Form' && (
            <>
              <div className="dcc-callout">
                <span>CONSTRUCTION</span>
                <p>Editable Bezier gestures → fused voxel surface → subdivision finish.</p>
              </div>
              <details>
                <summary>Edit the head assemblies in Blender</summary>
                <p>
                  Select EDIT | Head.Scent, Head.Search or Head.Guard in the downloaded source.
                  Object Properties → Custom Properties contains Muzzle reach, Cranial taper, Crown
                  depth and Horn sweep. Fitted facial parts follow together.
                </p>
                <p>Save the source and export it to inspect your changes here.</p>
              </details>
              <ul>
                {brief.polish.slice(0, 3).map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </>
          )}
          {stage === 'Surface' && (
            <>
              <div className="dcc-swatches">
                {brief.palette.map((p) => (
                  <div key={p.name}>
                    <span style={{ background: p.color }} />
                    <small>{p.name}</small>
                  </div>
                ))}
              </div>
              <p>
                The native procedural pigment is baked into a packed image. The browser receives the
                resulting material, without depending on Blender’s shader graph.
              </p>
            </>
          )}
          {stage === 'Motion' && (
            <>
              <div className="dcc-callout">
                <span>MARSH VIGIL</span>
                <p>6 seconds · {manifest.stats.joints} joints · anchored coil</p>
              </div>
              <label className="dcc-rig-toggle">
                <input
                  type="checkbox"
                  checked={options.rig}
                  onChange={(e) => setOptions((o) => ({ ...o, rig: e.target.checked }))}
                />{' '}
                Show deformation rig
              </label>
              <p>
                Pause and scrub to examine neck roots, jaw pivots and support. Reduced-motion
                preferences pause initial playback.
              </p>
            </>
          )}
          {stage === 'Delivery' && (
            <>
              <dl className="dcc-stats">
                <div>
                  <dt>Asset size</dt>
                  <dd>
                    {(manifest.stats.bytes / 1048576).toFixed(2)} <small>MiB</small>
                  </dd>
                </div>
                <div>
                  <dt>Triangles</dt>
                  <dd>{manifest.stats.triangles.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Animation</dt>
                  <dd>
                    {manifest.stats.animations.length} <small>loop</small>
                  </dd>
                </div>
                <div>
                  <dt>Materials</dt>
                  <dd>{manifest.stats.materials}</dd>
                </div>
              </dl>
              <p className="dcc-delivery-note">
                Self-contained GLB · textures embedded · no remote assets
              </p>
            </>
          )}
          <div className="dcc-inspection">
            <span className="dcc-eyebrow">INSPECT SURFACE</span>
            <div role="group" aria-label="Surface display">
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
          </div>
          <div className="dcc-downloads">
            <a href={modelUrl} download="briar-hydra.glb">
              Download animated GLB <span>↓</span>
            </a>
            <a href={sourceUrl} download="briar-hydra.blend">
              Editable Blender source <span>↗</span>
            </a>
          </div>
        </aside>
      </div>
      <footer className="dcc-footer">
        <p>{brief.reviewStatus}</p>
        <details>
          <summary>Source & build receipt</summary>
          <p>@card-workshop/dcc-workbench · Blender {manifest.blender}</p>
          <p>Native authoring: {brief.nativeFeatures.join(' · ')}</p>
          <p className="dcc-hash">GLB SHA-256: {manifest.sha256['assets/briar-hydra.glb']}</p>
          <p>
            Form, surface and motion are inspection views of the delivered asset, not saved
            historical build stages.
          </p>
        </details>
      </footer>
    </main>
  );
}
