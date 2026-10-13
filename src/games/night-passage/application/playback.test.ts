import { expect, test } from 'vitest';
import { runEpisode } from '../agent/benchmark';
import { importSession } from './session';
import { createPlayback } from './playback';

test('spectator playback can split frames, seek backwards and reproduce the exact recorded victory', () => {
  const episode = runEpisode({ seed: 'a-light-in-the-dark', weapon: 'bow', includeReplay: true });
  const replay = createPlayback(episode.replay!);
  const final = importSession(episode.replay!).state;
  replay.advance(71);
  const checkpoint = replay.snapshot();
  expect(checkpoint.position).toBe(71);
  replay.seek(0);
  replay.advance(30);
  replay.advance(41);
  expect(replay.snapshot()).toEqual(checkpoint);
  for (let step = 0; !replay.snapshot().finished && step < 5000; step++) replay.advance(17);
  expect(replay.snapshot().finished).toBe(true);
  expect(replay.snapshot().state).toEqual(final);
  replay.seek(0);
  expect(replay.snapshot().state.phase).toBe('combat');
  expect(replay.seek(replay.snapshot().totalTicks).state).toEqual(final);
});
