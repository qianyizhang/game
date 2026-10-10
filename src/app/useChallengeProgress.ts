import { useEffect, useRef, useState } from 'react';
import {
  actChallenge,
  attemptResult,
  beginChallenge,
  challengeKey,
  decodeChallenge,
  encodeChallenge,
  MAX_CHALLENGE_BYTES,
  retryChallenge,
  type Challenge,
  type ChallengeProgress,
} from '../shared/challenges';

const UNSAVED = 'Storage unavailable · export before closing this tab';
// Retain failed writes across screen changes. Reload still requires a saved/exported archive.
const drafts = new Map<string, { text: string; recovery: string | null }>();

export function readChallengeArchive(
  key: string,
): { ok: true; text: string | null } | { ok: false; error: unknown } {
  const draft = drafts.get(key);
  if (draft) return { ok: true, text: draft.text };
  try {
    return { ok: true, text: localStorage.getItem(key) };
  } catch (error) {
    return { ok: false, error };
  }
}

export function useChallengeProgress<S extends { seed: string }, C>(definition: Challenge<S, C>) {
  const key = challengeKey(definition);
  const [initial] = useState(() => {
    let raw: string | null = null;
    try {
      const draft = drafts.get(key);
      if (draft)
        return {
          progress: decodeChallenge(definition, draft.text),
          recovery: draft.recovery,
          error: '',
          status: UNSAVED,
        };
      raw = localStorage.getItem(key);
      return {
        progress: raw ? decodeChallenge(definition, raw) : { current: beginChallenge(definition) },
        recovery: null as string | null,
        error: '',
        status: raw ? 'Challenge saved locally' : 'Progress saves on this device',
      };
    } catch (issue) {
      return {
        progress: { current: beginChallenge(definition) },
        recovery: raw,
        error: `Saved progress could not be loaded: ${String(issue)}. Any original save is retained and will be archived before replacement.`,
        status: 'Progress has not been saved',
      };
    }
  });
  const [progress, setProgress] = useState<ChallengeProgress<S, C>>(initial.progress);
  const [error, setError] = useState(initial.error);
  const [saveStatus, setSaveStatus] = useState(initial.status);
  const [revision, setRevision] = useState(0);
  const recovery = useRef(initial.recovery);
  const importRequest = useRef(0);
  useEffect(
    () => () => {
      importRequest.current++;
    },
    [],
  );

  const save = (next: ChallengeProgress<S, C>) => {
    importRequest.current++;
    if (attemptResult(definition, next.current).status === 'cleared')
      next = { ...next, cleared: next.current };
    const text = encodeChallenge(next);
    setProgress(next);
    setError('');
    try {
      if (recovery.current !== null) {
        localStorage.setItem(`${key}.recovery.${Date.now()}`, recovery.current);
        recovery.current = null;
      }
      localStorage.setItem(key, text);
      drafts.delete(key);
      setSaveStatus('Challenge saved locally');
    } catch {
      drafts.set(key, { text, recovery: recovery.current });
      setSaveStatus(UNSAVED);
    }
  };
  const dispatch = (command: C) => {
    const next = actChallenge(definition, progress.current, command);
    if (next.error) {
      setError(next.error);
      return false;
    }
    save({ ...progress, current: next.attempt });
    return true;
  };
  const retry = (step = 0) => {
    try {
      save(retryChallenge(definition, progress, step));
      setRevision((value) => value + 1);
    } catch (issue) {
      setError(String(issue));
    }
  };
  const importFile = async (file: File) => {
    const request = ++importRequest.current;
    try {
      if (file.size > MAX_CHALLENGE_BYTES) throw new Error('Challenge save is too large.');
      const text = await file.text();
      // A later move/import or leaving this screen supersedes an unfinished file read.
      if (request !== importRequest.current) return;
      save(decodeChallenge(definition, text));
      setRevision((value) => value + 1);
    } catch (issue) {
      if (request === importRequest.current) setError(`Import failed: ${String(issue)}`);
    }
  };
  return {
    progress,
    error,
    saveStatus,
    revision,
    dispatch,
    retry,
    importFile,
    showHint: () => {
      if (progress.current.hints < definition.hints.length)
        save({ ...progress, current: { ...progress.current, hints: progress.current.hints + 1 } });
    },
    endAttempt: () => save({ ...progress, current: { ...progress.current, ended: true } }),
  };
}
