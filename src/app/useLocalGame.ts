import { beginEvidence, recordAccepted } from '../shared/evidence/recorder';
import { useMemo, useRef, useState } from 'react';
import { replayCodec, type Session } from '../shared/replay';

export function useLocalGame<S extends { seed: string }, C>(
  codec: ReturnType<typeof replayCodec<S, C>>,
  defaultSeed: string,
) {
  const practiceCodec = useMemo(() => replayCodec(codec.rules, true), [codec]);
  const [initial] = useState(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(codec.key);
      return {
        session: raw ? codec.decode(raw) : codec.create(defaultSeed),
        error: '',
        recovery: null as string | null,
      };
    } catch (error) {
      return {
        session: codec.create(defaultSeed),
        error: `Save could not be loaded: ${String(error)}. The original will be archived before a new save is written.`,
        recovery: raw,
      };
    }
  });
  const [timelineRevision, setTimelineRevision] = useState(0);
  const [normal, setNormal] = useState(initial.session);
  const [practice, setPractice] = useState<Session<S, C> | null>(null);
  const [error, setError] = useState(initial.error);
  const [saveStatus, setSaveStatus] = useState('Local play · autosave');
  const recovery = useRef(initial.recovery);
  const session = practice ?? normal;
  const activeCodec = practice ? practiceCodec : codec;
  const persist = (next: Session<S, C>) => {
    const isPractice = next.replay.mode === 'practice';
    if (isPractice) setPractice(next);
    else setNormal(next);
    const destination = isPractice ? practiceCodec : codec;
    try {
      if (!isPractice && recovery.current !== null) {
        localStorage.setItem(`${codec.key}.recovery.${Date.now()}`, recovery.current);
        recovery.current = null;
      }
      localStorage.setItem(destination.key, destination.encode(next));
      setSaveStatus(isPractice ? 'Practice saved separately' : 'Saved locally');
    } catch {
      setSaveStatus('Storage unavailable · export to save');
    }
  };
  const observe = (action: () => void) => {
    try {
      action();
    } catch {
      setSaveStatus((status) => `${status} · evidence unavailable`);
    }
  };
  const begin = (next: Session<S, C>, source: 'human' | 'imported' = 'human') => {
    setTimelineRevision((v) => v + 1);
    observe(() =>
      beginEvidence(
        localStorage,
        codec.rules,
        next,
        source,
        crypto.randomUUID(),
        new Date().toISOString(),
      ),
    );
  };
  const dispatch = (command: C) => {
    const result = activeCodec.act(session, command);
    setError(result.error ?? '');
    if (!result.error) {
      persist(result.session);
      observe(() =>
        recordAccepted(
          localStorage,
          codec.rules,
          session,
          command,
          result.session,
          crypto.randomUUID(),
          new Date().toISOString(),
        ),
      );
    }
    return !result.error;
  };
  const restart = (seed: string) => {
    const next = activeCodec.create(seed);
    persist(next);
    begin(next);
    setError('');
  };
  const restore = (text: string) => {
    try {
      const next = activeCodec.decode(text);
      persist(next);
      begin(next, 'imported');
      setError('');
      return true;
    } catch (issue) {
      setError(`Import failed: ${String(issue)}`);
      return false;
    }
  };
  const openPractice = (text: string, source: 'human' | 'imported' = 'imported', record = true) => {
    try {
      const next = practiceCodec.decode(text);
      persist(next);
      if (record) begin(next, source);
      else setTimelineRevision((v) => v + 1);
      setError('');
      return true;
    } catch (issue) {
      setError(`Practice import failed: ${String(issue)}`);
      return false;
    }
  };
  const branch = (step: number) => {
    if (!Number.isInteger(step) || step < 0 || step > session.replay.commands.length) {
      setError('Choose a valid replay step.');
      return false;
    }
    return openPractice(
      JSON.stringify({
        ...session.replay,
        mode: 'practice',
        commands: session.replay.commands.slice(0, step),
      }),
      'human',
    );
  };
  const scenario = (seed: string, setup: unknown) => {
    try {
      const next = practiceCodec.create(seed, setup);
      persist(next);
      begin(next);
      setError('');
      return true;
    } catch (issue) {
      setError(`Scenario failed: ${String(issue)}`);
      return false;
    }
  };
  const returnToNormal = () => {
    setTimelineRevision((v) => v + 1);
    setPractice(null);
    setError('');
    setSaveStatus('Normal run restored');
  };
  const resumePractice = () => {
    try {
      const saved = localStorage.getItem(practiceCodec.key);
      if (!saved) throw new Error('No saved practice branch yet.');
      return openPractice(saved, 'human', false);
    } catch (issue) {
      setError(String(issue));
      return false;
    }
  };
  const download = () =>
    downloadJSON(
      activeCodec.encode(session),
      `${practice ? 'practice-' : ''}${session.replay.game}-${session.state.seed.replace(/[^a-z0-9_-]/gi, '_')}.json`,
    );
  return {
    timelineRevision,
    state: session.state,
    session,
    normal,
    codec: activeCodec,
    practiceCodec,
    isPractice: !!practice,
    dispatch,
    restart,
    restore,
    download,
    error,
    clearError: () => setError(''),
    saveStatus,
    branch,
    scenario,
    openPractice,
    returnToNormal,
    resumePractice,
  };
}
export function downloadJSON(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
