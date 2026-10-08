import { lazy, Suspense, useEffect, useState } from 'react';
import Viewer, { type Playback, type Surface, type View } from './Viewer';
import { getPublishedAsset, listPublishedAssets } from './delivery';
import beforeUrl from '../references/hydra-before.png';
import './workbench.css';

const HydraComparison = lazy(() => import('./HydraComparison'));
const assets = listPublishedAssets();
function initialAssetId() {
  const requested = new URLSearchParams(location.search).get('asset');
  return (
    assets.find((asset) => asset.id === requested)?.id ??
    assets.find((asset) => asset.id === 'briar-hydra')?.id ??
    assets[0].id
  );
}

const stages = ['Intent', 'Form', 'Surface', 'Motion', 'Delivery'] as const;
type Stage = (typeof stages)[number];
const viewNames: View[] = ['Portrait', 'Front', 'Side', 'Back'];
const surfaces: Surface[] = ['Material', 'Clay', 'Wire'];
export default function Workbench({ onExit }: { onExit: () => void }) {
  const [assetId, setAssetId] = useState(initialAssetId);
  const asset = getPublishedAsset(assetId);
  const { brief, info: manifest, modelUrl, sourceUrl } = asset;
  const [comparison, setComparison] = useState(
    () =>
      initialAssetId() === 'briar-hydra' &&
      new URLSearchParams(location.search).get('compare') === 'hydra',
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
  const [duration, setDuration] = useState(0);
  const animated = manifest.stats.animations.length > 0;
  const copy: Record<Stage, { title: string; text: string }> = {
    Intent: { title: brief.subtitle, text: brief.interpretation },
    Form: { title: 'Gesture and construction.', text: brief.gesture },
    Surface: {
      title: 'Material and surface.',
      text: brief.palette.map((entry) => entry.name).join(' · '),
    },
    Motion: {
      title: brief.animation?.name ?? 'A still study.',
      text: brief.animation
        ? `${brief.animation.seconds} seconds at ${brief.animation.fps} fps. Pause and scrub to inspect the authored motion and fitted attachments.`
        : 'This delivery has no animation clip. Inspect the still form from each named view.',
    },
    Delivery: {
      title: 'The published sculpture.',
      text: 'The browser loads this asset’s published GLB. Its editable Blender scene remains the source for native changes.',
    },
  };
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
  const chooseAsset = (id: string) => {
    const selected = getPublishedAsset(id);
    const url = new URL(location.href);
    url.searchParams.set('asset', id);
    url.searchParams.delete('compare');
    history.replaceState(null, '', url);
    setComparison(false);
    setAssetId(id);
    setStage('Intent');
    setTime(0);
    setDuration(0);
    setOptions((current) => ({
      playing:
        selected.info.stats.animations.length > 0 &&
        !matchMedia('(prefers-reduced-motion: reduce)').matches,
      time: 0,
      seek: current.seek + 1,
      view: 'Portrait',
      surface: 'Material',
      rig: false,
    }));
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
          NATIVE ASSETS <span>●</span> BLENDER → WEB
        </span>
      </header>
      <section className="dcc-intro">
        <div>
          <p className="dcc-eyebrow">THE ASSET WORKBENCH</p>
          <h1>
            {brief.title}
            <span>.</span>
          </h1>
        </div>
        <p>{brief.subtitle}</p>
      </section>
      <label className="dcc-asset-selector">
        <span className="dcc-eyebrow">NATIVE ASSET</span>
        <select
          aria-label="Choose native asset"
          value={assetId}
          onChange={(event) => chooseAsset(event.target.value)}
        >
          {assets.map((item) => (
            <option key={item.id} value={item.id}>
              {item.brief.title}
            </option>
          ))}
        </select>
      </label>
      {assetId === 'briar-hydra' && (
        <button className="dcc-compare-entry" onClick={() => toggleComparison(true)}>
          Compare Hydra versions <span>Matched views · before & after ↗</span>
        </button>
      )}
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
          <Viewer
            key={`${asset.id}:${manifest.receiptDigest}`}
            asset={asset}
            options={options}
            onTime={setTime}
            onDuration={setDuration}
          />
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
              aria-label={animated && options.playing ? 'Pause animation' : 'Play animation'}
              disabled={duration === 0}
              onClick={() => setOptions((o) => ({ ...o, playing: !o.playing }))}
            >
              {animated && options.playing ? 'Ⅱ' : '▶'}
            </button>
            <label>
              <span className="dcc-sr">Animation time</span>
              <input
                aria-label="Animation time"
                type="range"
                min="0"
                max={duration}
                disabled={duration === 0}
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
              {time.toFixed(1)} <span>/ {duration.toFixed(1)}s</span>
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
              <p>{brief.gesture}</p>
              <p>{brief.reference}</p>
              {assetId === 'briar-hydra' && (
                <details>
                  <summary>Compare the original direction</summary>
                  <img
                    src={beforeUrl}
                    alt="Original procedural Hydra: three raised heads over a coil"
                  />
                  <p>
                    Historical procedural Hydra reference. This image is not a render of the
                    selected native delivery.
                  </p>
                  <a href="/?art=3d&study=hydra">Open Hydra in the gallery ↗</a>
                </details>
              )}
            </>
          )}
          {stage === 'Form' && (
            <>
              <div className="dcc-callout">
                <span>CONSTRUCTION</span>
                <p>{brief.nativeFeatures.join(' · ')}</p>
              </div>
              <details>
                <summary>Direct native editing</summary>
                <p>
                  Select the named regional assemblies in the downloaded source. Inspect their
                  editable meshes, shape keys and rig together; use the controls present in that
                  source to keep fitted parts aligned.
                </p>
                <p>Save the source and export it to inspect your changes here.</p>
              </details>
              <ul>
                {brief.polish.map((text) => (
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
                Compare the material view with neutral clay. The GLB carries the delivered materials
                and textures; native editing features are listed in the source receipt.
              </p>
            </>
          )}
          {stage === 'Motion' && (
            <>
              <div className="dcc-callout">
                <span>{brief.animation?.name ?? 'STATIC DELIVERY'}</span>
                <p>
                  {duration.toFixed(1)} seconds · {manifest.stats.joints} joints
                </p>
              </div>
              <label className="dcc-rig-toggle">
                <input
                  type="checkbox"
                  checked={options.rig}
                  disabled={manifest.stats.joints === 0}
                  onChange={(e) => setOptions((o) => ({ ...o, rig: e.target.checked }))}
                />{' '}
                Show deformation rig
              </label>
              <p>
                Pause and scrub to examine joints, fitted attachments and support. Reduced-motion
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
                    {manifest.stats.animations.length} <small>clips</small>
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
            <a href={modelUrl} download={`${asset.id}.glb`}>
              {animated ? 'Download animated GLB' : 'Download GLB'} <span>↓</span>
            </a>
            <a href={sourceUrl} download={`${asset.id}.blend`}>
              Editable Blender source <span>↗</span>
            </a>
          </div>
        </aside>
      </div>
      <footer className="dcc-footer">
        <p>{brief.reviewStatus}</p>
        <p>
          Publication review: {manifest.reviewDecision ?? 'unrecorded'} · scope:{' '}
          {manifest.reviewScope ?? 'unrecorded'}. User art approval is recorded separately from
          publication review.
        </p>
        <details>
          <summary>Source & build receipt</summary>
          <p>@card-workshop/dcc-workbench · Blender {manifest.blender}</p>
          <p>Native authoring: {brief.nativeFeatures.join(' · ')}</p>
          <p className="dcc-hash">GLB SHA-256: {manifest.modelSha256}</p>
          <p>
            Form, surface and motion are inspection views of the delivered asset, not saved
            historical build stages.
          </p>
        </details>
      </footer>
    </main>
  );
}
