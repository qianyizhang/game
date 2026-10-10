import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { recordLoop } from './recording';

let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let startError: Error | undefined;
let documentEvents: EventTarget & { hidden: boolean };
const stopTrack = vi.fn();
const track = { stop: stopTrack, requestFrame: vi.fn() };
const captureStream = vi.fn(() => ({ getTracks: () => [track], getVideoTracks: () => [track] }));
const canvas = { captureStream } as unknown as HTMLCanvasElement;

class FakeRecorder {
  static instance: FakeRecorder;
  static isTypeSupported() {
    return true;
  }
  state = 'inactive';
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  constructor() {
    FakeRecorder.instance = this;
  }
  start() {
    if (startError) throw startError;
    this.state = 'recording';
  }
  stop = vi.fn(() => {
    this.state = 'inactive';
    // The browser dispatches stop asynchronously, after the viewer may be gone.
    queueMicrotask(() => {
      this.ondataavailable?.({ data: new Blob(['recorded frames']) });
      this.onstop?.();
    });
  });
}

function frame(time: number) {
  const callbacks = [...frames.values()];
  frames.clear();
  callbacks.forEach((callback) => callback(time));
}

beforeEach(() => {
  frames = new Map();
  nextFrame = 0;
  startError = undefined;
  documentEvents = Object.assign(new EventTarget(), { hidden: false });
  vi.stubGlobal('document', documentEvents);
  vi.stubGlobal('MediaRecorder', FakeRecorder);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it('refuses cancelled or hidden captures before rendering or opening a stream', async () => {
  const controller = new AbortController();
  const render = vi.fn<(seconds: number) => void>();
  controller.abort();
  await expect(recordLoop(canvas, render, 6, controller.signal)).rejects.toThrow('cancelled');
  documentEvents.hidden = true;
  await expect(recordLoop(canvas, render, 6, new AbortController().signal)).rejects.toThrow(
    'cancelled',
  );
  expect(render).not.toHaveBeenCalled();
  expect(captureStream).not.toHaveBeenCalled();
});

it.each(['abort', 'hide'] as const)('stops drawing immediately on %s', async (reason) => {
  const controller = new AbortController();
  const render = vi.fn<(seconds: number) => void>();
  const pending = recordLoop(canvas, render, 6, controller.signal);
  const rejected = expect(pending).rejects.toThrow('cancelled');
  if (reason === 'abort') controller.abort();
  else {
    documentEvents.hidden = true;
    documentEvents.dispatchEvent(new Event('visibilitychange'));
  }
  expect(frames.size).toBe(0);
  render.mockClear();
  frame(100);
  expect(render).not.toHaveBeenCalled();
  await rejected;
  expect(FakeRecorder.instance.stop).toHaveBeenCalledTimes(1);
  expect(stopTrack).toHaveBeenCalledTimes(1);
});

it('rejects render failures and releases the recorder and stream', async () => {
  const error = new Error('Renderer disposed');
  const render = vi
    .fn()
    .mockImplementationOnce(() => {})
    .mockImplementation(() => {
      throw error;
    });
  const pending = recordLoop(canvas, render, 6, new AbortController().signal);
  const rejected = expect(pending).rejects.toBe(error);
  expect(() => frame(100)).not.toThrow();
  await rejected;
  expect(frames.size).toBe(0);
  expect(FakeRecorder.instance.stop).toHaveBeenCalledTimes(1);
  expect(stopTrack).toHaveBeenCalledTimes(1);
});

it('removes lifecycle listeners when the recorder cannot start', async () => {
  startError = new Error('Recorder start failed');
  const controller = new AbortController();
  const removeAbort = vi.spyOn(controller.signal, 'removeEventListener');
  const removeVisibility = vi.spyOn(documentEvents, 'removeEventListener');
  await expect(recordLoop(canvas, vi.fn(), 6, controller.signal)).rejects.toBe(startError);
  expect(removeAbort).toHaveBeenCalledWith('abort', expect.any(Function));
  expect(removeVisibility).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  expect(frames.size).toBe(0);
  expect(stopTrack).toHaveBeenCalledTimes(1);
});

it('returns a video and releases all resources after the final frame', async () => {
  const render = vi.fn<(seconds: number) => void>();
  const pending = recordLoop(canvas, render, 6, new AbortController().signal);
  frame(100);
  frame(1100);
  frame(2100);
  frame(3100);
  frame(4100);
  frame(5100);
  frame(6100);
  frame(6116);
  const result = await pending;
  const times = render.mock.calls.map(([seconds]) => seconds);
  expect(times[0]).toBe(0);
  expect(times.at(-1)).toBe(6);
  expect(times.some((time) => time > 0 && time < 6)).toBe(true);
  expect(times.every((time, i) => time >= (times[i - 1] ?? 0) && time <= 6)).toBe(true);
  expect(result.type).toBe('video/webm');
  expect(await result.text()).toBe('recorded frames');
  expect(frames.size).toBe(0);
  expect(stopTrack).toHaveBeenCalledTimes(1);
});

it('keeps interior poses and waits for a paint when a render frame exceeds the whole loop', async () => {
  const render = vi.fn<(seconds: number) => void>();
  const pending = recordLoop(canvas, render, 6, new AbortController().signal);
  frame(100);
  for (const now of [8100, 16100, 24100, 32100]) frame(now);
  const times = render.mock.calls.map(([seconds]) => seconds);
  expect(times.at(-1)).toBe(6);
  expect(times.some((time) => time > 0 && time < 6)).toBe(true);
  expect(times.every((time, i) => time >= (times[i - 1] ?? 0) && time <= 6)).toBe(true);
  expect(FakeRecorder.instance.stop).not.toHaveBeenCalled();
  frame(32116);
  expect((await pending).type).toBe('video/webm');
  expect(FakeRecorder.instance.stop).toHaveBeenCalledTimes(1);
  expect(frames.size).toBe(0);
  expect(stopTrack).toHaveBeenCalledTimes(1);
});
