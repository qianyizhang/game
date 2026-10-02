import { useRef, useState } from 'react';
import type { replayCodec } from '../shared/replay';

export function useLocalGame<S extends { seed: string }, C>(
  codec: ReturnType<typeof replayCodec<S, C>>,
  defaultSeed: string,
) {
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
        error: `Save could not be loaded: ${String(error)}. The original will be archived before writing a new save.`,
        recovery: raw,
      };
    }
  });
  const [session, setSession] = useState(initial.session);
  const [error, setError] = useState(initial.error);
  const recovery = useRef(initial.recovery);
  const [saveStatus, setSaveStatus] = useState('Local play · autosave');
  const persist = (next: typeof session) => {
    setSession(next);
    try {
      if (recovery.current !== null) {
        localStorage.setItem(`${codec.key}.recovery.${Date.now()}`, recovery.current);
        recovery.current = null;
      }
      localStorage.setItem(codec.key, codec.encode(next));
      setSaveStatus('Saved locally');
    } catch {
      setSaveStatus('Storage unavailable · export to save');
    }
  };
  const dispatch = (command: C) => {
    const result = codec.act(session, command);
    setError(result.error ?? '');
    if (!result.error) persist(result.session);
    return !result.error;
  };
  const restart = (seed: string) => {
    persist(codec.create(seed));
    setError('');
  };
  const restore = (text: string) => {
    try {
      persist(codec.decode(text));
      setError('');
      return true;
    } catch (issue) {
      setError(`Import failed: ${String(issue)}`);
      return false;
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([codec.encode(session)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `${session.replay.game}-${session.state.seed.replace(/[^a-z0-9_-]/gi, '_')}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return {
    state: session.state,
    dispatch,
    restart,
    restore,
    download,
    error,
    clearError: () => setError(''),
    saveStatus,
  };
}
