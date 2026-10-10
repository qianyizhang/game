import { afterEach, expect, test, vi } from 'vitest';
import { readChallengeArchive } from './useChallengeProgress';

afterEach(() => vi.unstubAllGlobals());

// The exported reader must distinguish an inaccessible save from an absent one.
test('challenge archive reads return explicit failure without throwing', () => {
  const error = new DOMException('Denied', 'SecurityError');
  vi.stubGlobal('localStorage', {
    getItem: () => {
      throw error;
    },
  });
  expect(readChallengeArchive('blocked')).toEqual({ ok: false, error });
  vi.stubGlobal('localStorage', { getItem: () => null });
  expect(readChallengeArchive('absent')).toEqual({ ok: true, text: null });
});
