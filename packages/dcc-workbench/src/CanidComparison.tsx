import { useEffect, useRef, useState } from 'react';
import {
  characters,
  baselineCharacters,
  clips,
  baselineClips,
  motionSources,
  durationFor,
  type CanidOptions,
} from './canid-assets';
import { createCanidPlayer } from './canid-player';
import './canid.css';

export default function CanidComparison({ onBack }: { onBack: () => void }) {
  const [options, setOptions] = useState<CanidOptions>({
    revision: 'refined',
    clip: 'walk',
    character: 'all',
    playing: false,
    time: 0,
    seek: 0,
    surface: 'Clay',
    view: 'Side',
    rig: false,
  });
  const [time, setTime] = useState(0);
  const [status, setStatus] = useState('Loading the motion study…');
  const [ready, setReady] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const current = useRef(options);
  current.current = options;
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => {
      if (preference.matches) setOptions((o) => ({ ...o, playing: false }));
    };
    preference.addEventListener('change', changed);
    let dispose: (() => void) | undefined;
    try {
      dispose = createCanidPlayer(
        host.current!,
        () => current.current,
        setTime,
        (message, loaded) => {
          setStatus(message);
          setReady(loaded);
        },
      );
    } catch {
      setStatus('WebGL is unavailable. Download the Blender sources or GLBs below.');
    }
    return () => {
      preference.removeEventListener('change', changed);
      dispose?.();
    };
  }, []);
  const activeCharacters = options.revision === 'baseline' ? baselineCharacters : characters;
  const visible = activeCharacters.filter(
    (c) => options.character === 'all' || c.id === options.character,
  );
  const labels =
    options.revision === 'comparison'
      ? visible.flatMap((c) => [
          { ...c, id: `${c.id}-baseline`, subtitle: 'Initial baseline' },
          { ...c, id: `${c.id}-refined`, subtitle: 'Refined anatomy & motion' },
        ])
      : visible;
  const duration = durationFor(options.revision, options.clip);
  const availableClips: Record<string, { name: string; seconds: number }> =
    options.revision === 'refined' ? clips : baselineClips;
  return (
    <main className="dcc-workbench canid-workbench">
      <header className="dcc-header">
        <button className="dcc-back" onClick={onBack}>
          ← Back to workbench
        </button>
        <span className="dcc-wordmark">CARD WORKSHOP / MOTION STUDIES</span>
        <span className="dcc-pilot">CANID · 02</span>
      </header>
      <section className="dcc-intro">
        <div>
          <p className="dcc-eyebrow">ONE MOTION LIBRARY · THREE CHARACTERS</p>
          <h1>
            A family in motion<span>.</span>
          </h1>
        </div>
        <p>
          Follow the feet. Watch the weight shift.
          <br />
          One shared performance, fitted to different bodies.
        </p>
      </section>
      <div className="canid-toolbar">
        <label>
          Revision
          <select
            aria-label="Revision"
            value={options.revision}
            onChange={(e) => {
              const revision = e.target.value;
              if (revision !== 'refined' && revision !== 'baseline' && revision !== 'comparison')
                return;
              setTime(0);
              setOptions((o) => ({
                ...o,
                revision,
                time: 0,
                seek: o.seek + 1,
                clip: revision !== 'refined' && o.clip === 'trot' ? 'walk' : o.clip,
                character: revision === 'comparison' && o.character === 'all' ? 'ash' : o.character,
              }));
            }}
          >
            <option value="refined">Refined family</option>
            <option value="baseline">Initial baseline</option>
            <option value="comparison">Before & after</option>
          </select>
        </label>
        <label>
          Movement
          <select
            aria-label="Movement"
            value={options.clip}
            onChange={(e) => {
              const clip = e.target.value;
              if (clip === 'idle' || clip === 'walk' || clip === 'look' || clip === 'trot') {
                setTime(0);
                setOptions((o) => ({ ...o, clip, time: 0, seek: o.seek + 1 }));
              }
            }}
          >
            {Object.entries(availableClips).map(([id, c]) => (
              <option key={id} value={id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Characters
          <select
            aria-label="Characters"
            value={options.character}
            onChange={(e) => {
              const character = e.target.value;
              if (character === 'all' || characters.some((c) => c.id === character))
                setOptions((o) => ({ ...o, character: character as CanidOptions['character'] }));
            }}
          >
            <option value="all" disabled={options.revision === 'comparison'}>
              All three · matched scale
            </option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div role="group" aria-label="Surface">
          {(['Clay', 'Material'] as const).map((surface) => (
            <button
              key={surface}
              aria-pressed={surface === options.surface}
              onClick={() => setOptions((o) => ({ ...o, surface }))}
            >
              {surface}
            </button>
          ))}
        </div>
        <button
          aria-pressed={options.rig}
          onClick={() => setOptions((o) => ({ ...o, rig: !o.rig }))}
        >
          Show skeleton
        </button>
      </div>
      <section
        className={`canid-stage ${options.character === 'all' || options.revision === 'comparison' ? 'canid-all' : ''}`}
        aria-label="Matched canid views"
      >
        <div ref={host} className="canid-render" data-ready={ready} />
        {status && (
          <p role={status.startsWith('Loading') ? 'status' : 'alert'} className="dcc-load">
            {status}
          </p>
        )}
        <div className="canid-labels">
          {labels.map((c) => (
            <div key={c.id}>
              <strong>{c.name}</strong>
              <span>{c.subtitle}</span>
            </div>
          ))}
        </div>
      </section>
      <div className="canid-toolbar">
        <div role="group" aria-label="Camera">
          {(['Portrait', 'Side', 'Front', 'Rear'] as const).map((view) => (
            <button
              key={view}
              aria-pressed={view === options.view}
              onClick={() => setOptions((o) => ({ ...o, view }))}
            >
              {view}
            </button>
          ))}
        </div>
        <span className="canid-hint">
          Drag to orbit · Real elapsed time · Ground follows each clip’s travel speed
        </span>
      </div>
      <div className="dcc-comparison-timeline">
        <button
          disabled={!ready}
          onClick={() => setOptions((o) => ({ ...o, playing: !o.playing }))}
        >
          {options.playing ? 'Pause motion' : 'Play motion'}
        </button>
        <input
          aria-label="Shared motion time"
          disabled={!ready}
          type="range"
          min="0"
          max={duration}
          step="0.01"
          value={time}
          onChange={(e) => {
            const value = Number(e.target.value);
            setTime(value);
            setOptions((o) => ({ ...o, playing: false, time: value, seek: o.seek + 1 }));
          }}
        />
        <output>
          {time.toFixed(2)} / {duration.toFixed(2)} s
        </output>
      </div>
      <div className="canid-notes">
        <section>
          <p className="dcc-eyebrow">THE COMPARISON</p>
          <h2>Appearance, then proportion.</h2>
          <p>
            Ash and Russet share proportions and motion. Moss has a broader body and shorter limbs,
            with stride and lift fitted to its reach. All views share a camera, lighting, and clock.
          </p>
          <p>
            Watch toe push-off, swinging paws, and the diagonal pairs in Trot. Before & after uses
            real elapsed seconds, so each revision retains its authored cadence.
          </p>
        </section>
        <section>
          <p className="dcc-eyebrow">EDITABLE SOURCES</p>
          <h2>Make the next performance.</h2>
          <p>
            The family source contains editable controls and the shared actions. Character files
            contain fitted rigs, meshes, materials, and fitted actions. This pilot leaves the
            existing gallery unchanged.
          </p>
          <a
            href={motionSources[options.revision === 'baseline' ? 'baseline' : 'refined']}
            download="canid-motion.blend"
          >
            Download shared motion source ↗
          </a>
          <p>Visual study · awaiting your review.</p>
        </section>
      </div>
      <div className="canid-downloads">
        {activeCharacters.map((c) => (
          <section key={c.id}>
            <h3>{c.name}</h3>
            <p>{c.subtitle}</p>
            <a href={c.model} download={`${c.id}.glb`}>
              Download {c.name} GLB
            </a>
            <a href={c.source} download={`${c.id}.blend`}>
              Editable {c.name} source
            </a>
          </section>
        ))}
      </div>
    </main>
  );
}
