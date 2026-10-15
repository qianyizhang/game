import {
  createChronicle,
  dispatch,
  exportChronicle,
  restoreChronicle,
  type Chronicle,
} from './chronicle';

export const SAVE_KEY = 'card-workshop.night-passage.v1';
export interface ChronicleStore {
  read(): string | null;
  write(text: string): void;
}
export type SaveStatus = 'saved' | 'unsaved' | 'protected' | 'write-failed';
type Protection = 'unreadable' | 'read-failed' | null;
type Download = (text: string, name: string) => void;
const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** Own live replacement and persistence; spectators and policies never receive this module. */
export function openLiveChronicle(store: ChronicleStore) {
  let current: Chronicle;
  let original: string | null = null;
  let protection: Protection = null;
  let status: SaveStatus = 'unsaved';
  let loadError = '';
  let dirty = false;
  let lastSave = 0;
  try {
    original = store.read();
    current = original === null ? createChronicle() : restoreChronicle(original);
    if (original !== null) status = 'saved';
    original = null;
  } catch {
    current = createChronicle();
    protection = original === null ? 'read-failed' : 'unreadable';
    status = 'protected';
    loadError =
      protection === 'read-failed'
        ? 'Storage unavailable. Export this chronicle to keep your progress; any existing stored save is left untouched.'
        : 'Saved chronicle could not load. Its bytes are preserved until you explicitly start a new chronicle or import a valid one.';
  }
  const snapshot = () =>
    Object.freeze({ state: current.state, status, protection, original, loadError });
  const flush = () => {
    if (protection) return snapshot();
    if (!dirty) return snapshot();
    try {
      store.write(exportChronicle(current));
      dirty = false;
      original = null;
      status = 'saved';
    } catch {
      status = 'write-failed';
    }
    return snapshot();
  };
  const replace = (candidate: Chronicle) => {
    current = candidate;
    protection = null;
    loadError = '';
    dirty = true;
    status = 'unsaved';
    lastSave = 0;
    flush();
    return { error: null };
  };
  return {
    snapshot,
    flush,
    dispatch(command: unknown, nowMs: number) {
      const before = current;
      const result = dispatch(current, command);
      if (result.error !== null) return { error: result.error };
      current = result.chronicle;
      dirty = true;
      if (!protection && status !== 'write-failed') status = 'unsaved';
      // dispatch validated command; no input or UI timer owns persistence policy.
      const frame = (command as { type: string }).type === 'frame';
      if (!frame || current.state.phase !== before.state.phase || nowMs - lastSave > 3000) {
        flush();
        lastSave = nowMs;
      }
      return { error: null };
    },
    exportReplay: () => exportChronicle(current),
    importReplay(text: string) {
      try {
        return replace(restoreChronicle(text));
      } catch (error) {
        return { error: errorText(error) };
      }
    },
    reset(seed: string, requestDownload: Download) {
      try {
        const candidate = createChronicle(seed);
        if (original !== null) requestDownload(original, 'night-passage-unreadable.json');
        requestDownload(exportChronicle(current), 'night-passage.json');
        // The browser has only been asked to download; durable disk storage is not observable.
        return replace(candidate);
      } catch (error) {
        return { error: errorText(error) };
      }
    },
    replaceUnreadable() {
      if (!protection) return { error: 'No protected save to replace.' };
      return replace(createChronicle());
    },
  };
}
