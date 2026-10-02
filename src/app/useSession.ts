import { useCallback, useState } from 'react';
import {
  act,
  exportReplay,
  importReplay,
  newSession,
  SAVE_KEY,
  type Session,
} from '../games/balatro/application/session';
import type { Command } from '../games/balatro/domain/types';

function load(): { session: Session; error: string } {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    return { session: saved ? importReplay(saved) : newSession('FIRST-LIGHT'), error: '' };
  } catch (error) {
    return {
      session: newSession('FIRST-LIGHT'),
      error: `Could not restore save: ${String(error)}. The original is preserved until you take an action or start a new run.`,
    };
  }
}

export function useSession() {
  const [initial] = useState(load);
  const [session, setSession] = useState(initial.session);
  const [error, setError] = useState(initial.error);
  const [saveStatus, setSaveStatus] = useState('Saved locally');
  const persist = useCallback((next: Session) => {
    setSession(next);
    try {
      localStorage.setItem(SAVE_KEY, exportReplay(next));
      setSaveStatus('Saved locally');
    } catch {
      setSaveStatus('Save unavailable · export to keep this run');
    }
  }, []);
  const dispatch = useCallback(
    (command: Command) => {
      const result = act(session, command);
      setError(result.error ?? '');
      if (!result.error) persist(result.session);
      return !result.error;
    },
    [session, persist],
  );
  const restart = (seed: string) => {
    setError('');
    persist(newSession(seed));
  };
  const restore = (text: string) => {
    try {
      persist(importReplay(text));
      setError('');
      return true;
    } catch (issue) {
      setError(`Import failed: ${String(issue)}`);
      return false;
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([exportReplay(session)], { type: 'application/json' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `blindside-${session.run.seed.replace(/[^a-z0-9_-]/gi, '_')}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return {
    session,
    dispatch,
    restart,
    restore,
    download,
    error,
    clearError: () => setError(''),
    saveStatus,
  };
}
