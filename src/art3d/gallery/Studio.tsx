import { useRef, useState } from 'react';
import { JokerArt } from '../../games/balatro/ui/Artwork';
import { RelicArt } from '../../games/spire/ui/WorldItemArt';
import { AbilityArt } from '../../games/spire/ui/AbilityArt';
import { CARDS } from '../../games/spire/content/cards';
import { MinionArt } from '../../games/battlegrounds/ui/MinionArt';
import { STUDIES, LOOP_SECONDS, MOTION_LABELS, type StudyId } from '../catalogue';
import { Viewer, download } from './Viewer';
import type { Options, Capture } from './controller';
import { galleryDelivery } from '../delivery';
import { EVOLVED_WOLF_FORMS, WOLF_FORMS, isWolfForm, type WolfForm } from '../wolfForms';
import './styles.css';

export default function Studio({ onExit }: { onExit: () => void }) {
  const [id, setId] = useState<StudyId>(() => {
    const requested = new URLSearchParams(location.search).get('study');
    return STUDIES.find((study) => study.id === requested)?.id ?? 'phoenix';
  });
  const [form, setForm] = useState<WolfForm>(() => {
    const requested = new URLSearchParams(location.search).get('form');
    return isWolfForm(requested) ? requested : 'base';
  });
  const [options, setOptions] = useState<Options>(() => ({
    spin: false,
    motion: !matchMedia('(prefers-reduced-motion: reduce)').matches,
    speed: 1,
    seek: 0,
    seekVersion: 0,
    wireframe: false,
    exploded: false,
    light: 'studio',
    view: 'perspective',
    reset: 0,
  }));
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const [recording, setRecording] = useState(false);
  const [time, setTime] = useState(0);
  const api = useRef<Capture | null>(null);
  const study = STUDIES.find((study) => study.id === id)!;
  const activeForm = id === 'wolf' ? form : 'base';
  const wolfForm = WOLF_FORMS[activeForm];
  const delivery = galleryDelivery(id, activeForm);
  const fileId = id === 'wolf' ? wolfForm.deliveryStudyId : id;
  const canSeparate = !delivery && ['nightjar', 'phoenix', 'catalyst'].includes(id);
  const duration = delivery ? (delivery.brief.animation?.seconds ?? 0) : LOOP_SECONDS;
  const update = (patch: Partial<Options>) => setOptions((current) => ({ ...current, ...patch }));
  const select = (id: StudyId) => {
    setId(id);
    setForm('base');
    const url = new URL(location.href);
    url.searchParams.set('study', id);
    url.searchParams.delete('form');
    history.replaceState(null, '', url);
    setMessage('');
    setTime(0);
    update({
      exploded: false,
      reset: options.reset + 1,
      seek: 0,
      seekVersion: options.seekVersion + 1,
    });
  };
  const selectForm = (next: WolfForm) => {
    setForm(next);
    setMessage('');
    setTime(0);
    update({ exploded: false, seek: 0, seekVersion: options.seekVersion + 1 });
    const url = new URL(location.href);
    url.searchParams.set('study', 'wolf');
    if (next === 'base') url.searchParams.delete('form');
    else url.searchParams.set('form', next);
    history.replaceState(null, '', url);
  };
  const saveVideo = async () => {
    if (!api.current || recording) return;
    setRecording(true);
    setMessage(`Recording one ${duration}-second loop…`);
    try {
      download(await api.current.video(), `${fileId}-animation.webm`);
      setMessage(`${fileId}-animation.webm downloaded`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Recording failed. Please try again.');
    } finally {
      setRecording(false);
    }
  };
  const save = async () => {
    if (!api.current || exporting) return;
    setExporting(true);
    setMessage('');
    try {
      const model = await api.current.model();
      download(new Blob([model], { type: 'model/gltf-binary' }), `card-workshop-${fileId}.glb`);
      setMessage(`${fileId}.glb downloaded`);
    } catch (error) {
      console.error('3D model export failed', error);
      setMessage('The model could not be exported. Please try again.');
    } finally {
      setExporting(false);
    }
  };
  return (
    <main
      className="art-studio"
      style={
        { '--study-accent': id === 'wolf' ? wolfForm.accent : study.accent } as React.CSSProperties
      }
    >
      <header className="studio-header">
        <button className="studio-return" onClick={onExit}>
          ← My table
        </button>
        <span className="studio-brand">
          CW <span>/</span> OBJECT STUDIES
        </span>
        <span className="studio-edition">VOL. 01 · THREE DIMENSIONS</span>
      </header>
      <section className="studio-intro">
        <div>
          <p className="studio-eyebrow">THE CARD WORKSHOP / MATERIAL EXPLORATIONS</p>
          <h1>
            From ink to object<span>.</span>
          </h1>
        </div>
        <p>
          {STUDIES.length} familiar illustrations.
          <br />A little more room to exist.
        </p>
      </section>
      {id === 'wolf' && (
        <section className="wolf-forms" aria-label="Wolf forms">
          <div className="wolf-forms-heading">
            <div>
              <p className="studio-eyebrow">ONE GUARDIAN / FOUR FORMS</p>
              <h2>{wolfForm.title}</h2>
            </div>
            <button
              aria-pressed={activeForm === 'base'}
              disabled={recording || exporting}
              onClick={() => selectForm('base')}
            >
              Original base
            </button>
          </div>
          <fieldset disabled={recording || exporting} className="wolf-alignment">
            <legend>Evolved alignment</legend>
            <input
              type="range"
              aria-label="Wolf alignment"
              aria-valuetext={activeForm === 'base' ? 'Base form selected' : wolfForm.label}
              min="0"
              max="2"
              step="1"
              value={activeForm === 'base' ? 1 : EVOLVED_WOLF_FORMS.indexOf(activeForm)}
              disabled={EVOLVED_WOLF_FORMS.some((item) => !galleryDelivery('wolf', item))}
              onChange={(event) => selectForm(EVOLVED_WOLF_FORMS[Number(event.target.value)])}
            />
            <div className="wolf-form-options">
              {EVOLVED_WOLF_FORMS.map((item) => (
                <button
                  key={item}
                  aria-pressed={activeForm === item}
                  disabled={!galleryDelivery('wolf', item)}
                  onClick={() => selectForm(item)}
                >
                  <strong>{WOLF_FORMS[item].label}</strong>
                  <span>{WOLF_FORMS[item].title}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </section>
      )}
      <div className="studio-workspace">
        <section className="studio-stage" aria-label={`${study.name} 3D study`}>
          <div className="stage-topline">
            <span>
              <i /> LIVE 3D
            </span>
            <span>
              0{STUDIES.findIndex((study) => study.id === id) + 1} /{' '}
              {String(STUDIES.length).padStart(2, '0')}
            </span>
          </div>
          <Viewer id={id} form={activeForm} options={options} api={api} onTime={setTime} />
          <div className="stage-caption">
            <span>
              {id === 'wolf' && activeForm !== 'base' ? wolfForm.title : study.name}
              <small>
                {id === 'wolf' && activeForm !== 'base' ? wolfForm.material : study.material}
              </small>
            </span>
            <span className="stage-gesture">
              DRAG TO ORBIT
              <br />
              SCROLL TO EXPLORE
            </span>
          </div>
          <div className="stage-tools" aria-label="Sculpture views">
            {(['perspective', 'front', 'side'] as const).map((view) => (
              <button
                key={view}
                disabled={recording}
                aria-pressed={options.view === view}
                onClick={() => update({ view, spin: false, reset: options.reset + 1 })}
              >
                {view === 'perspective' ? '¾ View' : view === 'front' ? 'Front' : 'Side'}
              </button>
            ))}
            <button
              aria-label="Reset camera"
              disabled={recording}
              onClick={() => update({ view: 'perspective', reset: options.reset + 1 })}
            >
              ↺ Reset
            </button>
          </div>
        </section>
        <aside className="studio-sidebar">
          <nav className="study-list" aria-label="Choose a 3D study">
            {STUDIES.map((item, index) => (
              <button
                key={item.id}
                disabled={recording}
                className={item.id === id ? 'active' : ''}
                aria-pressed={item.id === id}
                onClick={() => select(item.id)}
              >
                <span className="study-number">0{index + 1}</span>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.family}</small>
                </span>
                <span className="study-arrow">↗</span>
              </button>
            ))}
          </nav>
          <div className="study-info">
            <p className="studio-eyebrow">THE TRANSLATION</p>
            <p>
              {id === 'wolf' && activeForm !== 'base' ? wolfForm.description : study.description}
            </p>
            <ul>
              {study.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </div>
          <div className="study-settings">
            <fieldset className="study-animation" disabled={recording || duration === 0}>
              <legend className="studio-eyebrow">IN MOTION</legend>
              <p>{MOTION_LABELS[id]}</p>
              <div className="animation-controls">
                <button
                  aria-pressed={options.motion}
                  onClick={() => update({ motion: !options.motion })}
                >
                  {options.motion ? 'Ⅱ Pause animation' : '▶ Play animation'}
                </button>
                <select
                  aria-label="Animation speed"
                  value={options.speed}
                  onChange={(event) => update({ speed: Number(event.target.value) })}
                >
                  <option value={0.5}>0.5×</option>
                  <option value={1}>1×</option>
                  <option value={1.5}>1.5×</option>
                </select>
              </div>
              <label className="animation-timeline">
                Loop{' '}
                <output>
                  {time.toFixed(1)} / {duration.toFixed(1)} s
                </output>
                <input
                  type="range"
                  aria-label="Animation timeline"
                  min="0"
                  max={duration}
                  step="0.05"
                  value={time}
                  onChange={(event) => {
                    const seconds = Number(event.target.value);
                    setTime(seconds);
                    update({ motion: false, seek: seconds, seekVersion: options.seekVersion + 1 });
                  }}
                />
              </label>
            </fieldset>
            <p className="studio-eyebrow">ON THE WORKBENCH</p>
            <fieldset disabled={recording} className="study-toggles">
              <button aria-pressed={options.spin} onClick={() => update({ spin: !options.spin })}>
                <span>Slow turntable</span>
                <i />
              </button>
              <button
                aria-pressed={options.wireframe}
                onClick={() => update({ wireframe: !options.wireframe })}
              >
                <span>Wireframe</span>
                <i />
              </button>
              <button
                aria-pressed={options.exploded}
                disabled={!canSeparate}
                title={
                  canSeparate ? undefined : 'This assembled object has no separable display layers.'
                }
                onClick={() => update({ exploded: !options.exploded })}
              >
                <span>
                  {canSeparate ? 'Separate the layers' : 'Layers assembled as one object'}
                </span>
                <i />
              </button>
            </fieldset>
            <label className="study-light">
              Lighting
              <select
                aria-label="Lighting"
                disabled={recording}
                value={options.light}
                onChange={(event) => update({ light: event.target.value as Options['light'] })}
              >
                <option value="studio">Warm studio</option>
                <option value="moon">Moonlight</option>
                <option value="ember">Ember glow</option>
              </select>
            </label>
          </div>
          <div className="study-downloads">
            <button
              className="study-export"
              onClick={() => void save()}
              disabled={exporting || recording}
            >
              {exporting ? 'Preparing…' : '↓ Download 3D model'}
              <small>.GLB</small>
            </button>
            <button
              className="study-export study-video"
              onClick={() => void saveVideo()}
              disabled={recording || options.exploded || exporting || duration === 0}
            >
              {recording ? 'Recording…' : '↓ Save animation loop'}
              <small>{duration}s · WEBM</small>
            </button>
            <button
              onClick={() => {
                if (api.current) download(api.current.png(), `${fileId}-study.png`);
              }}
            >
              Save image ↗
            </button>
            {delivery && (
              <a href={delivery.sourceUrl} download={`${delivery.id}.blend`}>
                Editable Blender source ↗
              </a>
            )}
            <p role="status">{message}</p>
          </div>
        </aside>
      </div>
      <section className="studio-source" aria-label="Original artwork comparison">
        <div className="source-art">
          {id === 'nightjar' ? (
            <JokerArt id="nightjar" />
          ) : id === 'spiral' ? (
            <JokerArt id="fibonacci" />
          ) : id === 'vajra' ? (
            <RelicArt id="vajra" />
          ) : id === 'hydra' ? (
            <MinionArt definitionId="hydra" tribe="beast" />
          ) : id === 'bannerbearer' ? (
            <MinionArt definitionId="banner" tribe="neutral" />
          ) : id === 'squire' ? (
            <MinionArt definitionId="squire" tribe="neutral" />
          ) : id === 'patron' ? (
            <MinionArt definitionId="devourer" tribe="demon" />
          ) : id === 'herald' ? (
            <MinionArt definitionId="infernal" tribe="demon" />
          ) : id === 'watcher' ? (
            <MinionArt definitionId="watcher" tribe="demon" />
          ) : id === 'juggler' ? (
            <MinionArt definitionId="juggler" tribe="demon" />
          ) : id === 'matron' ? (
            <MinionArt definitionId="matron" tribe="demon" />
          ) : id === 'imp' ? (
            <MinionArt definitionId="imp" tribe="demon" />
          ) : id === 'amalgam' ? (
            <MinionArt definitionId="amalgam" tribe="all" />
          ) : id === 'cub' ? (
            <MinionArt definitionId="cub" tribe="beast" />
          ) : id === 'packcaller' ? (
            <MinionArt definitionId="leader" tribe="beast" />
          ) : id === 'stray' ? (
            <MinionArt definitionId="stray" tribe="beast" />
          ) : id === 'stormroc' ? (
            <MinionArt definitionId="stormroc" tribe="elemental" />
          ) : id === 'tortoise' ? (
            <MinionArt definitionId="ancienttortoise" tribe="beast" />
          ) : id === 'guardian' ? (
            <MinionArt definitionId="rat" tribe="beast" />
          ) : id === 'scavenger' ? (
            <MinionArt definitionId="hyena" tribe="beast" />
          ) : id === 'crocolisk' ? (
            <MinionArt definitionId="croc" tribe="beast" />
          ) : id === 'bogtoad' ? (
            <MinionArt definitionId="bogtoad" tribe="beast" />
          ) : id === 'moonmoth' ? (
            <MinionArt definitionId="moonmoth" tribe="beast" />
          ) : id === 'thornstag' ? (
            <MinionArt definitionId="thornstag" tribe="beast" />
          ) : id === 'matriarch' ? (
            <MinionArt definitionId="mother" tribe="beast" />
          ) : id === 'wolf' ? (
            <MinionArt definitionId="wolf" tribe="beast" />
          ) : id === 'prowler' ? (
            <MinionArt definitionId="cat" tribe="beast" />
          ) : id === 'phoenix' ? (
            <MinionArt definitionId="phoenix" tribe="elemental" />
          ) : (
            <AbilityArt definition={CARDS.find((card) => card.id === 'catalyst')!} />
          )}
        </div>
        <div>
          <p className="studio-eyebrow">01 / THE ORIGINAL PRINT</p>
          <h2>Same character. Another dimension.</h2>
          <p>
            The live SVG from your collection, interpreted as a sculpted object. The silhouette,
            family inks and identifying details carry through.
          </p>
        </div>
        <span className="source-seal">
          SVG
          <br />
          <span>↗</span>
          <br />
          3D
        </span>
      </section>
      <footer className="studio-footer">
        <span>CARD WORKSHOP · AN ART EXPERIMENT</span>
        <span>Sculptures to explore. Yours to turn around.</span>
      </footer>
    </main>
  );
}
