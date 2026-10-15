import { expect, test } from 'vitest';
import { runEpisode } from '../agent/benchmark';
import { dispatch, exportChronicle, restoreChronicle } from './chronicle';
import { passageScore } from '../domain/score';
import { createPlayback } from './playback';

test('spectator playback can split frames, seek backwards and reproduce the exact recorded victory', () => {
  const episode = runEpisode({ seed: 'a-light-in-the-dark', weapon: 'bow', includeReplay: true });
  const replay = createPlayback(episode.replay!);
  const final = restoreChronicle(episode.replay!).state;
  replay.advance(71);
  const checkpoint = replay.snapshot();
  expect(Reflect.set(checkpoint.state.player, 'hp', 1_000_000)).toBe(false);
  expect(Reflect.set(checkpoint.state.room.pillars, 'length', 0)).toBe(false);
  const stable = structuredClone(checkpoint);
  expect(checkpoint.position).toBe(71);
  replay.seek(0);
  replay.advance(30);
  replay.advance(41);
  expect(replay.snapshot()).toEqual(checkpoint);
  for (let step = 0; !replay.snapshot().finished && step < 5000; step++) replay.advance(17);
  expect(replay.snapshot().finished).toBe(true);
  expect(replay.snapshot().state).toEqual(final);
  expect(checkpoint).toEqual(stable);
  replay.seek(0);
  expect(replay.snapshot().state.phase).toBe('combat');
  expect(replay.seek(replay.snapshot().totalTicks).state).toEqual(final);
});

test('legacy chronicles keep original score and behavior through import, continued play, export and seek', () => {
  const envelope = {
    format: 'night-passage-replay-v2',
    rules: 'night-passage-4',
    content: 'night-passage-content-3',
    seed: 'legacy-compatibility',
    commands: [{ type: 'start', weapon: 'bow', runes: ['vigor', 'fleet'] }, [60, 0, -1, -1.57, 1]],
  };
  const text = JSON.stringify(envelope);
  const session = restoreChronicle(text);
  expect(session.state.rulesVersion).toBe('night-passage-4');
  expect(session.state.difficulty).toBe('standard');
  expect(passageScore(session.state).version).toBe('night-passage-score-1');
  expect(exportChronicle(session)).toBe(text);
  const continued = dispatch(session, { type: 'retire' });
  expect(continued.error).toBeNull();
  expect(continued.chronicle.state.phase).toBe('lost');
  expect(restoreChronicle(exportChronicle(continued.chronicle)).state).toEqual(
    continued.chronicle.state,
  );
  const playback = createPlayback(text);
  playback.advance(60);
  expect(playback.snapshot().state).toEqual(session.state);
  playback.seek(10);
  expect(playback.seek(60).state).toEqual(session.state);
});
