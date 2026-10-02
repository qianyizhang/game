import { useMemo, useRef, useState } from 'react';
import { downloadJSON, type useLocalGame } from './useLocalGame';

type Game<S extends { seed: string }, C> = ReturnType<typeof useLocalGame<S, C>>;
interface SavedBranch {
  name: string;
  text: string;
}
export function PracticeLab<S extends { seed: string }, C>({
  game,
  scenarios,
  summary,
  close,
}: {
  game: Game<S, C>;
  scenarios: readonly { name: string; setup: unknown }[];
  summary: (state: S) => Record<string, string | number>;
  close: () => void;
}) {
  const [step, setStep] = useState(game.session.replay.commands.length);
  const [setup, setSetup] = useState(JSON.stringify(scenarios[0]?.setup ?? {}, null, 2));
  const [seed, setSeed] = useState(game.state.seed);
  const [name, setName] = useState('My experiment');
  const file = useRef<HTMLInputElement>(null);
  const key = `${game.practiceCodec.key}.branches`;
  const [initial] = useState(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
      const saved: unknown = JSON.parse(raw ?? '[]');
      if (
        !Array.isArray(saved) ||
        saved.length > 20 ||
        saved.some((b) => !b || typeof b.name !== 'string' || typeof b.text !== 'string')
      )
        throw new Error('Invalid checkpoint library.');
      return { library: saved as SavedBranch[], notice: '', recovery: null as string | null };
    } catch {
      return {
        library: [] as SavedBranch[],
        notice:
          'Saved checkpoints could not be loaded. Original data will be archived before a new checkpoint is saved.',
        recovery: raw,
      };
    }
  });
  const [library, setLibrary] = useState(initial.library);
  const [notice, setNotice] = useState(initial.notice);
  const recovery = useRef(initial.recovery);
  const preview = useMemo(() => {
    try {
      return { state: game.codec.at(game.session, step).state, error: '' };
    } catch (error) {
      return { state: null, error: String(error) };
    }
  }, [game.codec, game.session, step]);
  const saveLibrary = (next: SavedBranch[]) => {
    try {
      if (recovery.current !== null) {
        localStorage.setItem(`${key}.recovery.${Date.now()}`, recovery.current);
        recovery.current = null;
      }
      localStorage.setItem(key, JSON.stringify(next));
      setLibrary(next);
      return true;
    } catch {
      setNotice('Could not save the library. Export this branch instead.');
      return false;
    }
  };
  const save = () => {
    if (library.length >= 20) {
      setNotice('The library holds 20 branches. Export/remove one before saving another.');
      return;
    }
    const text = JSON.stringify(
      {
        ...game.session.replay,
        mode: 'practice',
        commands: game.session.replay.commands.slice(0, step),
      },
      null,
      2,
    );
    if (saveLibrary([...library, { name: name.trim() || 'Untitled branch', text }]))
      setNotice('Checkpoint saved. Its commands are validated when reopened.');
  };
  return (
    <>
      <p className="eyebrow">REPLAY · BRANCH · EXPERIMENT</p>
      <h1>Practice lab</h1>
      <p>
        Your normal run stays committed. Branches and custom scenarios use separate saves and cannot
        be imported as normal runs.
      </p>
      {game.error && (
        <p role="alert" className="error-banner">
          {game.error}
        </p>
      )}
      <div className="lab-grid">
        <section>
          <h2>Revisit a decision</h2>
          <p>
            Seed <strong>{game.state.seed}</strong> · {game.session.replay.commands.length} accepted
            commands
          </p>
          <label>
            Decision{' '}
            <input
              aria-label="Replay decision"
              type="range"
              min={0}
              max={game.session.replay.commands.length}
              value={step}
              onChange={(e) => setStep(Number(e.target.value))}
            />
          </label>
          <div className="lab-actions">
            <button disabled={!step} onClick={() => setStep(step - 1)}>
              Previous decision
            </button>
            <span>
              {step} / {game.session.replay.commands.length}
            </span>
            <button
              disabled={step === game.session.replay.commands.length}
              onClick={() => setStep(step + 1)}
            >
              Next decision
            </button>
          </div>
          <label>
            Jump to command{' '}
            <select
              aria-label="Jump to command"
              value={step}
              onChange={(e) => setStep(Number(e.target.value))}
            >
              <option value={0}>0 · Starting state</option>
              {game.session.replay.commands.map((command, i) => (
                <option key={i} value={i + 1}>
                  {i + 1} · {JSON.stringify(command).slice(0, 100)}
                </option>
              ))}
            </select>
          </label>
          {preview.error && <p role="alert">{preview.error}</p>}
          <table className="lab-comparison">
            <thead>
              <tr>
                <th>Measure</th>
                <th>Selected decision</th>
                <th>Current</th>
              </tr>
            </thead>
            <tbody>
              {preview.state &&
                Object.entries(summary(preview.state)).map(([label, value]) => (
                  <tr key={label}>
                    <th>{label}</th>
                    <td>{String(value)}</td>
                    <td>{String(summary(game.state)[label])}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <button
            className="primary"
            disabled={!preview.state}
            onClick={() => {
              if (game.branch(step)) close();
            }}
          >
            Play a branch from here →
          </button>
          <p className="muted small">
            Future draws stay hidden. Branches share the same seed; different choices can consume
            randomness differently.
          </p>
          <label>
            Checkpoint name{' '}
            <input maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <button disabled={!preview.state} onClick={save}>
            Save this checkpoint
          </button>
        </section>
        <section>
          <h2>Create a scenario</h2>
          <label>
            Starting example{' '}
            <select
              aria-label="Scenario example"
              onChange={(e) =>
                setSetup(JSON.stringify(scenarios[Number(e.target.value)].setup, null, 2))
              }
            >
              {scenarios.map((s, i) => (
                <option key={s.name} value={i}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Scenario seed{' '}
            <input maxLength={64} value={seed} onChange={(e) => setSeed(e.target.value)} />
          </label>
          <label>
            Setup JSON{' '}
            <textarea
              aria-label="Scenario setup"
              rows={13}
              value={setup}
              onChange={(e) => setSetup(e.target.value)}
            />
          </label>
          <p className="muted small">
            Edit content IDs and starting resources. Every field is validated by this game’s
            scenario factory; this is not a raw saved-state editor.
          </p>
          <button
            onClick={() => {
              try {
                if (game.scenario(seed, JSON.parse(setup))) close();
              } catch (error) {
                setNotice(String(error));
              }
            }}
          >
            Start practice scenario →
          </button>
        </section>
      </div>
      <h2>Saved experiments</h2>
      <div className="lab-actions">
        <button
          onClick={() => {
            if (game.resumePractice()) close();
          }}
        >
          Resume last practice
        </button>
        <button onClick={() => file.current?.click()}>Import practice replay</button>
      </div>
      <input
        ref={file}
        className="visually-hidden"
        type="file"
        accept=".json"
        aria-label="Import practice replay"
        onChange={async (e) => {
          const input = e.currentTarget;
          const file = input.files?.[0];
          input.value = '';
          if (!file) return;
          if (await game.importFile(file, true)) close();
        }}
      />
      {library.map((branch, i) => (
        <div className="branch-row" key={i}>
          <strong>{branch.name}</strong>
          <button
            aria-label={`Open ${branch.name}`}
            onClick={() => {
              if (game.openPractice(branch.text)) close();
            }}
          >
            Open
          </button>
          <button
            aria-label={`Export ${branch.name}`}
            onClick={() => downloadJSON(branch.text, `practice-${i + 1}.json`)}
          >
            Export
          </button>
          <button
            aria-label={`Remove ${branch.name}`}
            onClick={() => saveLibrary(library.filter((_, index) => index !== i))}
          >
            Remove
          </button>
        </div>
      ))}
      {!library.length && (
        <p>No saved checkpoints yet. Your active practice branch autosaves separately.</p>
      )}
      {notice && <p role="status">{notice}</p>}
    </>
  );
}
